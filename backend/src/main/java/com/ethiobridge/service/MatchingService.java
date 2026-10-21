package com.ethiobridge.service;

import com.ethiobridge.dto.*;
import com.ethiobridge.entity.*;
import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final ListingRepository listingRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final AppUserRepository appUserRepository;
    private final MatchRunRepository matchRunRepository;
    private final MatchResultRepository matchResultRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    @Value("${app.ai-service.internal-token:}")
    private String aiServiceInternalToken;

    @Value("${app.ai-service.timeout-ms:1500}")
    private int timeoutMs;

    @jakarta.annotation.PostConstruct
    public void validateInternalToken() {
        if (aiServiceInternalToken == null || aiServiceInternalToken.isBlank()) {
            throw new IllegalStateException("FATAL: app.ai-service.internal-token must be configured. Startup aborted.");
        }
    }

    public MatchingService(ListingRepository listingRepository,
                           ProviderProfileRepository providerProfileRepository,
                           AppUserRepository appUserRepository,
                           MatchRunRepository matchRunRepository,
                           MatchResultRepository matchResultRepository,
                           ObjectMapper objectMapper) {
        this.listingRepository = listingRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.appUserRepository = appUserRepository;
        this.matchRunRepository = matchRunRepository;
        this.matchResultRepository = matchResultRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public MatchRunResponseDto getCandidatesForListing(UUID requesterUserId, UUID listingId, String requestedMethod, int k) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(requesterUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }

        int finalK = k > 0 ? k : 5;
        String method = (requestedMethod != null && !requestedMethod.isBlank()) ? requestedMethod.toUpperCase() : "AI";

        // Build pre-filtered candidate pool from database (cap at 100)
        List<ProviderProfile> pool = providerProfileRepository.findMatchPool(requesterUserId, PageRequest.of(0, 100));

        long startTime = System.currentTimeMillis();
        MatchRunResponseDto response;

        if ("AI".equalsIgnoreCase(method)) {
            try {
                response = callAiService(listing, pool, finalK);
            } catch (Exception e) {
                log.warn("AI service call failed or timed out. Falling back to keyword matching: {}", e.getMessage());
                response = runKeywordMatching(listing, pool, finalK);
                response.setDegraded(true);
                response.setMethod("KEYWORD");
            }
        } else {
            response = runKeywordMatching(listing, pool, finalK);
        }

        int latencyMs = (int) (System.currentTimeMillis() - startTime);
        response.setLatencyMs(latencyMs);

        // Persist run and results
        persistMatchRun(listing, requesterUserId, response);

        return response;
    }

    private MatchRunResponseDto callAiService(Listing listing, List<ProviderProfile> pool, int k) throws Exception {
        Map<String, Object> requestPayload = new HashMap<>();

        Map<String, Object> listingMap = new HashMap<>();
        listingMap.put("id", listing.getId().toString());
        listingMap.put("title", listing.getTitle());
        listingMap.put("description", listing.getDescription());
        listingMap.put("locationId", listing.getLocation() != null ? listing.getLocation().getId() : null);
        listingMap.put("isRemote", listing.isRemote());
        listingMap.put("availabilityRequired", listing.getAvailabilityRequired());
        listingMap.put("seniority", listing.getSeniority().name());
        listingMap.put("budgetMin", listing.getBudgetMin());
        listingMap.put("budgetMax", listing.getBudgetMax());

        List<Map<String, Object>> listingSkills = listing.getSkills().stream()
                .map(s -> {
                    Map<String, Object> sm = new HashMap<>();
                    sm.put("name", s.getSkill().getName());
                    sm.put("requirement", s.getRequirement().name());
                    sm.put("weight", s.getWeight().doubleValue());
                    return sm;
                })
                .toList();
        listingMap.put("skills", listingSkills);
        requestPayload.put("listing", listingMap);

        List<Map<String, Object>> candidateList = new ArrayList<>();
        Map<UUID, ProviderProfile> profileMap = new HashMap<>();

        for (ProviderProfile p : pool) {
            profileMap.put(p.getId(), p);
            Map<String, Object> cm = new HashMap<>();
            cm.put("providerProfileId", p.getId().toString());
            cm.put("text", p.getProfileText() != null ? p.getProfileText() : p.getHeadline() + " " + p.getBio());
            cm.put("yearsExperience", p.getYearsExperience() != null ? p.getYearsExperience() : 0);
            cm.put("locationId", p.getLocation() != null ? p.getLocation().getId() : null);
            cm.put("availability", p.getAvailability());
            cm.put("hourlyRate", p.getHourlyRate() != null ? p.getHourlyRate().doubleValue() : null);
            cm.put("categoryFocus", p.getCategoryFocus());

            appUserRepository.findById(p.getUserId()).ifPresent(user -> {
                cm.put("displayName", user.getFullName());
            });

            List<Map<String, Object>> cSkills = p.getSkills().stream()
                    .map(s -> {
                        Map<String, Object> sm = new HashMap<>();
                        sm.put("name", s.getSkill().getName());
                        sm.put("proficiency", s.getProficiency());
                        sm.put("yearsExperience", s.getYearsExperience() != null ? s.getYearsExperience().doubleValue() : 1.0);
                        return sm;
                    })
                    .toList();
            cm.put("skills", cSkills);
            candidateList.add(cm);
        }
        requestPayload.put("candidates", candidateList);
        requestPayload.put("k", k);
        requestPayload.put("options", Map.of("explain", true));

        String jsonResponse = restClient.post()
                .uri(aiServiceBaseUrl + "/ai/v1/match")
                .header("X-Internal-Token", aiServiceInternalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(String.class);

        Map<String, Object> responseMap = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

        MatchRunResponseDto dto = new MatchRunResponseDto();
        dto.setListingId(listing.getId());
        dto.setMethod("AI");
        dto.setK(k);
        dto.setModel((String) responseMap.getOrDefault("model", "sublinear-tfidf-char3gram-v1"));
        dto.setModelVersion((String) responseMap.getOrDefault("modelVersion", "1.0.0"));
        dto.setDegraded(false);

        List<Map<String, Object>> resultsList = (List<Map<String, Object>>) responseMap.get("results");
        List<CandidateMatchResultDto> candidateResults = new ArrayList<>();

        if (resultsList != null) {
            for (Map<String, Object> item : resultsList) {
                CandidateMatchResultDto cr = new CandidateMatchResultDto();
                cr.setRank(((Number) item.get("rank")).intValue());
                cr.setScore(BigDecimal.valueOf(((Number) item.get("score")).doubleValue()).setScale(4, RoundingMode.HALF_UP));

                UUID pid = UUID.fromString((String) item.get("providerProfileId"));
                cr.setProviderProfileId(pid);

                ProviderProfile prof = profileMap.get(pid);
                if (prof != null) {
                    cr.setHeadline(prof.getHeadline());
                    cr.setBio(prof.getBio());
                    if (prof.getLocation() != null) {
                        cr.setLocationName(prof.getLocation().getName());
                    }
                    appUserRepository.findById(prof.getUserId()).ifPresent(u -> cr.setDisplayName(u.getFullName()));
                }

                Map<String, Object> expMap = (Map<String, Object>) item.get("explanation");
                if (expMap != null) {
                    ExplanationDto expDto = new ExplanationDto();
                    expDto.setSummary((String) expMap.get("summary"));

                    List<Map<String, Object>> factorsList = (List<Map<String, Object>>) expMap.get("factors");
                    if (factorsList != null) {
                        List<FactorDto> factorDtos = factorsList.stream()
                                .map(f -> new FactorDto(
                                        (String) f.get("name"),
                                        f.get("value"),
                                        ((Number) f.get("weight")).doubleValue(),
                                        ((Number) f.get("contribution")).doubleValue(),
                                        (String) f.get("detail")
                                ))
                                .toList();
                        expDto.setFactors(factorDtos);
                    }
                    cr.setExplanation(expDto);
                }
                candidateResults.add(cr);
            }
        }

        dto.setResults(candidateResults);
        return dto;
    }

    private MatchRunResponseDto runKeywordMatching(Listing listing, List<ProviderProfile> pool, int k) {
        Set<String> reqSkillNames = listing.getSkills().stream()
                .filter(s -> s.getRequirement().name().equals("REQUIRED"))
                .map(s -> s.getSkill().getName().toLowerCase())
                .collect(Collectors.toSet());

        Set<String> prefSkillNames = listing.getSkills().stream()
                .filter(s -> s.getRequirement().name().equals("PREFERRED"))
                .map(s -> s.getSkill().getName().toLowerCase())
                .collect(Collectors.toSet());

        List<ScoredProvider> scoredList = new ArrayList<>();

        for (ProviderProfile p : pool) {
            Set<String> providerSkills = p.getSkills().stream()
                    .map(s -> s.getSkill().getName().toLowerCase())
                    .collect(Collectors.toSet());

            Set<String> matchedReq = new HashSet<>(reqSkillNames);
            matchedReq.retainAll(providerSkills);

            Set<String> matchedPref = new HashSet<>(prefSkillNames);
            matchedPref.retainAll(providerSkills);

            double reqScore = reqSkillNames.isEmpty() ? 1.0 : (double) matchedReq.size() / reqSkillNames.size();
            double prefScore = prefSkillNames.isEmpty() ? 1.0 : (double) matchedPref.size() / prefSkillNames.size();

            double skillScore = reqSkillNames.isEmpty() ? 0.7 : (0.75 * reqScore + 0.25 * prefScore);

            double availScore = (listing.getAvailabilityRequired() == null ||
                    listing.getAvailabilityRequired().equalsIgnoreCase(p.getAvailability())) ? 1.0 : 0.4;

            double locScore = 1.0;
            if (!listing.isRemote() && listing.getLocation() != null && p.getLocation() != null) {
                locScore = listing.getLocation().getId().equals(p.getLocation().getId()) ? 1.0 : 0.3;
            }

            double totalScore = (0.60 * skillScore) + (0.25 * availScore) + (0.15 * locScore);

            ExplanationDto exp = new ExplanationDto();
            exp.setSummary(String.format("Keyword overlap match with %d matched skills.", matchedReq.size() + matchedPref.size()));

            List<FactorDto> factors = new ArrayList<>();
            factors.add(new FactorDto("skill.match", String.join(", ", matchedReq), 0.60, reqScore,
                    String.format("%d of %d required skills matched via keyword tokens", matchedReq.size(), reqSkillNames.size())));
            factors.add(new FactorDto("availability", p.getAvailability(), 0.25, availScore, "Availability check"));
            factors.add(new FactorDto("location", listing.isRemote() ? "Remote" : (p.getLocation() != null ? p.getLocation().getName() : "Unspecified"), 0.15, locScore, "Location constraint"));

            exp.setFactors(factors);

            scoredList.add(new ScoredProvider(p, totalScore, exp));
        }

        scoredList.sort((a, b) -> Double.compare(b.score, a.score));

        MatchRunResponseDto dto = new MatchRunResponseDto();
        dto.setListingId(listing.getId());
        dto.setMethod("KEYWORD");
        dto.setK(k);
        dto.setModel("keyword-token-baseline");
        dto.setModelVersion("1.0.0");
        dto.setDegraded(false);

        List<CandidateMatchResultDto> results = new ArrayList<>();
        int rank = 1;
        for (ScoredProvider sp : scoredList.subList(0, Math.min(k, scoredList.size()))) {
            CandidateMatchResultDto cr = new CandidateMatchResultDto();
            cr.setRank(rank++);
            cr.setScore(BigDecimal.valueOf(sp.score).setScale(4, RoundingMode.HALF_UP));
            cr.setProviderProfileId(sp.profile.getId());
            cr.setHeadline(sp.profile.getHeadline());
            cr.setBio(sp.profile.getBio());
            if (sp.profile.getLocation() != null) {
                cr.setLocationName(sp.profile.getLocation().getName());
            }
            appUserRepository.findById(sp.profile.getUserId()).ifPresent(u -> cr.setDisplayName(u.getFullName()));
            cr.setExplanation(sp.explanation);
            results.add(cr);
        }

        dto.setResults(results);
        return dto;
    }

    private void persistMatchRun(Listing listing, UUID requesterUserId, MatchRunResponseDto response) {
        try {
            MatchRun run = new MatchRun();
            run.setListing(listing);
            run.setMethod(response.getMethod());
            run.setK(response.getK());
            run.setModelName(response.getModel());
            run.setModelVersion(response.getModelVersion());
            run.setRequestedBy(requesterUserId);
            run.setLatencyMs(response.getLatencyMs());
            MatchRun savedRun = matchRunRepository.save(run);

            for (CandidateMatchResultDto cr : response.getResults()) {
                ProviderProfile prof = providerProfileRepository.findById(cr.getProviderProfileId()).orElse(null);
                if (prof != null) {
                    MatchResult res = new MatchResult();
                    res.setMatchRun(savedRun);
                    res.setProviderProfile(prof);
                    res.setRank(cr.getRank());
                    res.setScore(cr.getScore());
                    if (cr.getExplanation() != null) {
                        res.setExplanation(objectMapper.writeValueAsString(cr.getExplanation()));
                    }
                    matchResultRepository.save(res);
                }
            }
        } catch (Exception e) {
            log.error("Failed to persist match run: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ListingDto> getRecommendedListingsForProvider(UUID providerUserId, String method, int k) {
        ProviderProfile profile = providerProfileRepository.findByUserId(providerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider profile not found"));

        List<Listing> openListings = listingRepository.findAll().stream()
                .filter(l -> l.getStatus() == ListingStatus.OPEN)
                .filter(l -> !l.getOwnerUserId().equals(providerUserId))
                .toList();

        Set<String> providerSkillNames = profile.getSkills().stream()
                .map(s -> s.getSkill().getName().toLowerCase())
                .collect(Collectors.toSet());

        List<Listing> sorted = new ArrayList<>(openListings);
        sorted.sort((a, b) -> {
            long aOverlap = a.getSkills().stream().filter(s -> providerSkillNames.contains(s.getSkill().getName().toLowerCase())).count();
            long bOverlap = b.getSkills().stream().filter(s -> providerSkillNames.contains(s.getSkill().getName().toLowerCase())).count();
            return Long.compare(bOverlap, aOverlap);
        });

        return sorted.stream()
                .limit(k > 0 ? k : 10)
                .map(this::toListingDto)
                .toList();
    }

    private ListingDto toListingDto(Listing l) {
        ListingDto dto = new ListingDto();
        dto.setId(l.getId());
        dto.setOwnerUserId(l.getOwnerUserId());
        dto.setListingType(l.getListingType());
        dto.setTitle(l.getTitle());
        dto.setDescription(l.getDescription());
        dto.setRemote(l.isRemote());
        dto.setBudgetMin(l.getBudgetMin());
        dto.setBudgetMax(l.getBudgetMax());
        dto.setCurrency(l.getCurrency());
        dto.setAvailabilityRequired(l.getAvailabilityRequired());
        dto.setSeniority(l.getSeniority());
        dto.setStatus(l.getStatus());
        dto.setPublishedAt(l.getPublishedAt());
        dto.setCreatedAt(l.getCreatedAt());

        if (l.getServiceCategory() != null) {
            dto.setServiceCategoryId(l.getServiceCategory().getId());
            dto.setServiceCategoryName(l.getServiceCategory().getName());
        }

        if (l.getLocation() != null) {
            dto.setLocationId(l.getLocation().getId());
            dto.setLocationName(l.getLocation().getName());
        }

        appUserRepository.findById(l.getOwnerUserId()).ifPresent(user -> {
            dto.setOwnerName(user.getFullName());
        });

        if (l.getSkills() != null) {
            List<ListingSkillDto> skills = l.getSkills().stream()
                    .map(ls -> new ListingSkillDto(
                            ls.getSkill().getId(),
                            ls.getSkill().getName(),
                            ls.getSkill().getSlug(),
                            ls.getRequirement(),
                            ls.getWeight()
                    ))
                    .toList();
            dto.setSkills(skills);
        }

        return dto;
    }

    private static class ScoredProvider {
        ProviderProfile profile;
        double score;
        ExplanationDto explanation;

        ScoredProvider(ProviderProfile profile, double score, ExplanationDto explanation) {
            this.profile = profile;
            this.score = score;
            this.explanation = explanation;
        }
    }
}
