package com.ethiobridge.controller;

import com.ethiobridge.dto.PagedResponse;
import com.ethiobridge.dto.ProviderProfileDto;
import com.ethiobridge.dto.ReviewDto;
import com.ethiobridge.service.ProfileService;
import com.ethiobridge.service.ReviewService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
public class ProviderController {

    private final ProfileService profileService;
    private final ReviewService reviewService;

    public ProviderController(ProfileService profileService, ReviewService reviewService) {
        this.profileService = profileService;
        this.reviewService = reviewService;
    }

    @GetMapping
    public PagedResponse<ProviderProfileDto> browseProviders(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long skillId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String availability,
            @RequestParam(required = false) String categoryFocus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt,desc") String sort) {

        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 100);

        String[] sortParts = sort != null ? sort.split(",") : new String[]{"updatedAt", "desc"};
        String prop = sortParts[0].trim();
        java.util.Set<String> allowedSorts = java.util.Set.of("updatedAt", "createdAt", "hourlyRate", "yearsExperience", "isPro");
        if (!allowedSorts.contains(prop)) {
            prop = "updatedAt";
        }
        Sort.Direction dir = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, prop));
        return profileService.browseProviders(q, skillId, locationId, availability, categoryFocus, pageRequest);
    }

    @GetMapping("/{id}")
    public ProviderProfileDto getProviderDetail(@PathVariable UUID id) {
        return profileService.getProviderById(id);
    }

    @GetMapping("/{id}/reviews")
    public List<ReviewDto> getProviderReviews(@PathVariable UUID id) {
        return reviewService.getReviewsForProvider(id);
    }

    @GetMapping("/{id}/rating-summary")
    public java.util.Map<String, Object> getProviderRatingSummary(@PathVariable UUID id) {
        return reviewService.getProviderRatingSummary(id);
    }
}
