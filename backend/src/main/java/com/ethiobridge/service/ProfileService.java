package com.ethiobridge.service;

import com.ethiobridge.dto.*;
import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProfileService {

    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderSkillRepository providerSkillRepository;
    private final SeekerProfileRepository seekerProfileRepository;
    private final AppUserRepository appUserRepository;
    private final LocationRepository locationRepository;
    private final SkillRepository skillRepository;

    public ProfileService(ProviderProfileRepository providerProfileRepository,
                          ProviderSkillRepository providerSkillRepository,
                          SeekerProfileRepository seekerProfileRepository,
                          AppUserRepository appUserRepository,
                          LocationRepository locationRepository,
                          SkillRepository skillRepository) {
        this.providerProfileRepository = providerProfileRepository;
        this.providerSkillRepository = providerSkillRepository;
        this.seekerProfileRepository = seekerProfileRepository;
        this.appUserRepository = appUserRepository;
        this.locationRepository = locationRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public ProviderProfileDto getProviderProfile(UUID userId) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    ProviderProfile newProfile = new ProviderProfile();
                    newProfile.setUserId(userId);
                    return providerProfileRepository.save(newProfile);
                });
        return toProviderProfileDto(profile);
    }

    public ProviderProfileDto updateProviderProfile(UUID userId, ProviderProfileDto dto) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    ProviderProfile p = new ProviderProfile();
                    p.setUserId(userId);
                    return p;
                });

        profile.setHeadline(dto.getHeadline());
        profile.setBio(dto.getBio());
        profile.setYearsExperience(dto.getYearsExperience());
        profile.setAvailability(dto.getAvailability());
        profile.setHourlyRate(dto.getHourlyRate());
        profile.setCategoryFocus(dto.getCategoryFocus() != null ? dto.getCategoryFocus() : "ANY");
        if (dto.getAvatarUrl() != null) profile.setAvatarUrl(dto.getAvatarUrl());
        if (dto.getPortfolioUrl() != null) profile.setPortfolioUrl(dto.getPortfolioUrl());
        if (dto.getEducation() != null) profile.setEducation(dto.getEducation());
        if (dto.getLanguages() != null) profile.setLanguages(dto.getLanguages());

        if (dto.getLocationId() != null) {
            Location loc = locationRepository.findById(dto.getLocationId()).orElse(null);
            profile.setLocation(loc);
        }

        recomputeProfileText(profile);
        ProviderProfile saved = providerProfileRepository.save(profile);
        return toProviderProfileDto(saved);
    }

    public ProviderProfileDto updateProviderSkills(UUID userId, UpdateProviderSkillsRequest request) {
        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider profile not found"));

        providerSkillRepository.deleteByIdProviderProfileId(profile.getId());
        profile.getSkills().clear();

        if (request.getSkills() != null) {
            for (ProviderSkillInputDto sDto : request.getSkills()) {
                Skill skill = skillRepository.findById(sDto.getSkillId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skill id not found: " + sDto.getSkillId()));

                ProviderSkill ps = new ProviderSkill(profile, skill, sDto.getProficiency(), sDto.getYearsExperience());
                profile.getSkills().add(ps);
            }
        }

        recomputeProfileText(profile);
        ProviderProfile saved = providerProfileRepository.save(profile);
        return toProviderProfileDto(saved);
    }

    @Transactional(readOnly = true)
    public SeekerProfileDto getSeekerProfile(UUID userId) {
        SeekerProfile profile = seekerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    SeekerProfile newProfile = new SeekerProfile();
                    newProfile.setUserId(userId);
                    return seekerProfileRepository.save(newProfile);
                });
        return toSeekerProfileDto(profile);
    }

    public SeekerProfileDto updateSeekerProfile(UUID userId, SeekerProfileDto dto) {
        SeekerProfile profile = seekerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    SeekerProfile p = new SeekerProfile();
                    p.setUserId(userId);
                    return p;
                });

        profile.setHeadline(dto.getHeadline());
        profile.setBio(dto.getBio());

        if (dto.getLocationId() != null) {
            Location loc = locationRepository.findById(dto.getLocationId()).orElse(null);
            profile.setLocation(loc);
        }

        SeekerProfile saved = seekerProfileRepository.save(profile);
        return toSeekerProfileDto(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProviderProfileDto> browseProviders(String q, Long skillId, Long locationId, String availability, String categoryFocus, Pageable pageable) {
        Specification<ProviderProfile> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }
            if (availability != null && !availability.isBlank()) {
                predicates.add(cb.equal(root.get("availability"), availability.toUpperCase()));
            }
            if (categoryFocus != null && !categoryFocus.isBlank() && !"ANY".equalsIgnoreCase(categoryFocus)) {
                predicates.add(cb.equal(root.get("categoryFocus"), categoryFocus.toUpperCase()));
            }
            if (q != null && !q.isBlank()) {
                String search = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("headline")), search),
                        cb.like(cb.lower(root.get("bio")), search),
                        cb.like(cb.lower(root.get("profileText")), search)
                ));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<ProviderProfile> page = providerProfileRepository.findAll(spec, pageable);
        List<ProviderProfileDto> dtos = page.getContent().stream()
                .map(this::toProviderProfileDto)
                .toList();

        return new PagedResponse<>(dtos, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ProviderProfileDto getProviderById(UUID providerProfileId) {
        ProviderProfile profile = providerProfileRepository.findById(providerProfileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));
        return toProviderProfileDto(profile);
    }

    private void recomputeProfileText(ProviderProfile profile) {
        StringBuilder sb = new StringBuilder();
        if (profile.getHeadline() != null) sb.append(profile.getHeadline()).append(". ");
        if (profile.getBio() != null) sb.append(profile.getBio()).append(". ");
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            sb.append("Skills: ");
            String skillsStr = profile.getSkills().stream()
                    .map(ps -> ps.getSkill().getName())
                    .collect(Collectors.joining(", "));
            sb.append(skillsStr).append(". ");
        }
        if (profile.getYearsExperience() != null) {
            sb.append(profile.getYearsExperience()).append(" years experience. ");
        }
        if (profile.getCategoryFocus() != null) {
            sb.append("Focus: ").append(profile.getCategoryFocus()).append(". ");
        }
        profile.setProfileText(sb.toString().trim());
    }

    private ProviderProfileDto toProviderProfileDto(ProviderProfile p) {
        ProviderProfileDto dto = new ProviderProfileDto();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setHeadline(p.getHeadline());
        dto.setBio(p.getBio());
        dto.setYearsExperience(p.getYearsExperience());
        dto.setAvailability(p.getAvailability());
        dto.setHourlyRate(p.getHourlyRate());
        dto.setCategoryFocus(p.getCategoryFocus());
        dto.setProfileText(p.getProfileText());
        dto.setAvatarUrl(p.getAvatarUrl());
        dto.setPortfolioUrl(p.getPortfolioUrl());
        dto.setEducation(p.getEducation());
        dto.setLanguages(p.getLanguages());
        dto.setConnectsBalance(p.getConnectsBalance() != null ? p.getConnectsBalance() : 20);
        dto.setPro(p.isPro());
        dto.setProExpiresAt(p.getProExpiresAt());

        if (p.getLocation() != null) {
            dto.setLocationId(p.getLocation().getId());
            dto.setLocationName(p.getLocation().getName());
        }

        appUserRepository.findById(p.getUserId()).ifPresent(user -> {
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
        });

        if (p.getSkills() != null) {
            List<ProviderSkillDto> skills = p.getSkills().stream()
                    .map(ps -> new ProviderSkillDto(
                            ps.getSkill().getId(),
                            ps.getSkill().getName(),
                            ps.getSkill().getSlug(),
                            ps.getSkill().getCategory().name(),
                            ps.getProficiency(),
                            ps.getYearsExperience()
                    ))
                    .toList();
            dto.setSkills(skills);
        }

        return dto;
    }

    private SeekerProfileDto toSeekerProfileDto(SeekerProfile p) {
        SeekerProfileDto dto = new SeekerProfileDto();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setHeadline(p.getHeadline());
        dto.setBio(p.getBio());
        if (p.getLocation() != null) {
            dto.setLocationId(p.getLocation().getId());
            dto.setLocationName(p.getLocation().getName());
        }
        appUserRepository.findById(p.getUserId()).ifPresent(user -> {
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
        });
        return dto;
    }
}
