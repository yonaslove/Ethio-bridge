package com.ethiobridge.service;

import com.ethiobridge.dto.MatchRunResponseDto;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.ListingSkill;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.entity.ProviderSkill;
import com.ethiobridge.entity.Skill;
import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.model.ListingType;
import com.ethiobridge.model.RequirementType;
import com.ethiobridge.model.Seniority;
import com.ethiobridge.model.SkillCategory;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.MatchResultRepository;
import com.ethiobridge.repository.MatchRunRepository;
import com.ethiobridge.repository.ProviderProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private ListingRepository listingRepository;
    @Mock
    private ProviderProfileRepository providerProfileRepository;
    @Mock
    private AppUserRepository appUserRepository;
    @Mock
    private MatchRunRepository matchRunRepository;
    @Mock
    private MatchResultRepository matchResultRepository;

    private MatchingService matchingService;

    private final UUID ownerUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        matchingService = new MatchingService(
                listingRepository,
                providerProfileRepository,
                appUserRepository,
                matchRunRepository,
                matchResultRepository,
                new ObjectMapper()
        );
        ReflectionTestUtils.setField(matchingService, "aiServiceBaseUrl", "http://127.0.0.1:9");
        ReflectionTestUtils.setField(matchingService, "aiServiceInternalToken", "test-token");
        lenient().when(appUserRepository.findById(any())).thenReturn(Optional.empty());
        lenient().when(matchRunRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(matchResultRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private Skill skill(long id, String name) {
        Skill s = new Skill();
        s.setId(id);
        s.setSlug(name.toLowerCase());
        s.setName(name);
        s.setCategory(SkillCategory.TECH);
        return s;
    }

    private Listing listingWithSkills(UUID id, Skill... skills) {
        Listing listing = new Listing();
        listing.setId(id);
        listing.setOwnerUserId(ownerUserId);
        listing.setListingType(ListingType.JOB);
        listing.setTitle("Junior backend developer");
        listing.setDescription("Build REST services with Java and SQL.");
        listing.setStatus(ListingStatus.OPEN);
        listing.setSeniority(Seniority.JUNIOR);
        listing.setAvailabilityRequired("FULL_TIME");
        listing.setRemote(true);
        for (Skill s : skills) {
            listing.getSkills().add(new ListingSkill(listing, s, RequirementType.REQUIRED, BigDecimal.ONE));
        }
        return listing;
    }

    private ProviderProfile profile(UUID id, Skill skill) {
        ProviderProfile p = new ProviderProfile();
        p.setId(id);
        p.setUserId(UUID.randomUUID());
        p.setHeadline("Headline");
        p.setBio("Bio");
        p.setAvailability("FULL_TIME");
        p.setYearsExperience(3);
        if (skill != null) {
            p.getSkills().add(new ProviderSkill(p, skill, 4, BigDecimal.valueOf(3)));
        }
        return p;
    }

    @Test
    void keywordMatchingRanksProviderWithRequiredSkillFirst() {
        Skill java = skill(1L, "Java");
        Skill plumbing = skill(2L, "Plumbing");
        Listing listing = listingWithSkills(UUID.randomUUID(), java);
        ProviderProfile matched = profile(UUID.randomUUID(), java);
        ProviderProfile unmatched = profile(UUID.randomUUID(), plumbing);
        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
        when(providerProfileRepository.findMatchPool(eq(ownerUserId), any(PageRequest.class)))
                .thenReturn(List.of(unmatched, matched));

        MatchRunResponseDto response = matchingService.getCandidatesForListing(ownerUserId, listing.getId(), "keyword", 5);

        assertEquals("KEYWORD", response.getMethod());
        assertFalse(response.isDegraded());
        assertEquals(2, response.getResults().size());
        assertEquals(matched.getId(), response.getResults().get(0).getProviderProfileId());
        assertTrue(response.getResults().get(0).getScore()
                .compareTo(response.getResults().get(1).getScore()) > 0);
        assertNotNull(response.getResults().get(0).getExplanation());
        assertFalse(response.getResults().get(0).getExplanation().getFactors().isEmpty());
    }

    @Test
    void aiFailureFallsBackToKeywordWithDegradedFlag() {
        Skill java = skill(1L, "Java");
        Listing listing = listingWithSkills(UUID.randomUUID(), java);
        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
        when(providerProfileRepository.findMatchPool(eq(ownerUserId), any(PageRequest.class)))
                .thenReturn(List.of(profile(UUID.randomUUID(), java)));

        MatchRunResponseDto response = matchingService.getCandidatesForListing(ownerUserId, listing.getId(), "ai", 5);

        assertEquals("KEYWORD", response.getMethod());
        assertTrue(response.isDegraded());
        assertEquals(1, response.getResults().size());
        assertEquals("keyword-token-baseline", response.getModel());
    }

    @Test
    void candidatePoolIsCappedAt100AndExcludesRequester() {
        Skill java = skill(1L, "Java");
        Listing listing = listingWithSkills(UUID.randomUUID(), java);
        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
        when(providerProfileRepository.findMatchPool(eq(ownerUserId), any(PageRequest.class)))
                .thenReturn(List.of(profile(UUID.randomUUID(), java)));

        matchingService.getCandidatesForListing(ownerUserId, listing.getId(), "keyword", 5);

        verify(providerProfileRepository).findMatchPool(eq(ownerUserId),
                argThat(page -> page.getPageSize() == 100));
    }

    @Test
    void nonOwnerCannotRequestCandidates() {
        Listing listing = listingWithSkills(UUID.randomUUID());
        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> matchingService.getCandidatesForListing(UUID.randomUUID(), listing.getId(), "ai", 5));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
