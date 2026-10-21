package com.ethiobridge.controller;

import com.ethiobridge.dto.*;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.model.ListingType;
import com.ethiobridge.service.ApplicationService;
import com.ethiobridge.service.ListingService;
import com.ethiobridge.service.MatchingService;
import com.ethiobridge.service.ReviewService;
import com.ethiobridge.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/listings")
public class ListingController {

    private final ListingService listingService;
    private final UserService userService;
    private final MatchingService matchingService;
    private final ApplicationService applicationService;
    private final ReviewService reviewService;
    private final com.ethiobridge.repository.MatchFeedbackRepository matchFeedbackRepository;

    public ListingController(ListingService listingService,
                             UserService userService,
                             MatchingService matchingService,
                             ApplicationService applicationService,
                             ReviewService reviewService,
                             com.ethiobridge.repository.MatchFeedbackRepository matchFeedbackRepository) {
        this.listingService = listingService;
        this.userService = userService;
        this.matchingService = matchingService;
        this.applicationService = applicationService;
        this.reviewService = reviewService;
        this.matchFeedbackRepository = matchFeedbackRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('SEEKER') or hasRole('ADMIN')")
    public ResponseEntity<ListingDto> createListing(Authentication authentication, @Valid @RequestBody CreateListingRequest req) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        ListingDto created = listingService.createListing(user.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public PagedResponse<ListingDto> browseListings(
            @RequestParam(required = false) ListingType type,
            @RequestParam(required = false) ListingStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 100);

        String[] sortParts = sort != null ? sort.split(",") : new String[]{"createdAt", "desc"};
        String prop = sortParts[0].trim();
        java.util.Set<String> allowedSorts = java.util.Set.of("createdAt", "updatedAt", "title", "budgetMin", "budgetMax", "isFeatured");
        if (!allowedSorts.contains(prop)) {
            prop = "createdAt";
        }
        Sort.Direction dir = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, prop));
        return listingService.browseListings(type, status, categoryId, locationId, q, pageRequest);
    }

    @GetMapping("/my")
    public List<ListingDto> getMyListings(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return listingService.getMyListings(user.getId());
    }

    @GetMapping("/{id}")
    public ListingDto getListing(@PathVariable UUID id) {
        return listingService.getListing(id);
    }

    @PutMapping("/{id}")
    public ListingDto updateListing(Authentication authentication, @PathVariable UUID id, @Valid @RequestBody CreateListingRequest req) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return listingService.updateListing(user.getId(), id, req);
    }

    @PostMapping("/{id}/publish")
    public ListingDto publishListing(Authentication authentication, @PathVariable UUID id) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return listingService.publishListing(user.getId(), id);
    }

    @PostMapping("/{id}/close")
    public ListingDto closeListing(Authentication authentication, @PathVariable UUID id) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return listingService.closeListing(user.getId(), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(Authentication authentication, @PathVariable UUID id) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        listingService.deleteListing(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/candidates")
    public MatchRunResponseDto getCandidates(Authentication authentication,
                                             @PathVariable UUID id,
                                             @RequestParam(defaultValue = "ai") String method,
                                             @RequestParam(defaultValue = "5") int k) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return matchingService.getCandidatesForListing(user.getId(), id, method, k);
    }

    @PostMapping("/{id}/applications")
    @PreAuthorize("hasRole('PROVIDER') or hasRole('ADMIN')")
    public ResponseEntity<ApplicationDto> applyToListing(Authentication authentication,
                                                         @PathVariable UUID id,
                                                         @Valid @RequestBody CreateApplicationRequest req) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        ApplicationDto created = applicationService.applyToListing(user.getId(), id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/applications")
    public List<ApplicationDto> getApplicationsForListing(Authentication authentication, @PathVariable UUID id) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return applicationService.getApplicationsForListing(user.getId(), id);
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ReviewDto> createReview(Authentication authentication,
                                                  @PathVariable UUID id,
                                                  @Valid @RequestBody ReviewDto req) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        ReviewDto created = reviewService.createReview(user.getId(), id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/reviews")
    public List<ReviewDto> getListingReviews(@PathVariable UUID id) {
        return reviewService.getReviewsForListing(id);
    }

    @PostMapping("/{id}/candidates/feedback")
    public ResponseEntity<Void> recordMatchFeedback(Authentication authentication,
                                                     @PathVariable UUID id,
                                                     @RequestBody java.util.Map<String, Object> body) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        UUID providerProfileId = UUID.fromString(body.get("providerProfileId").toString());
        String action = (String) body.getOrDefault("action", "VIEWED");
        java.math.BigDecimal score = body.get("score") != null ? new java.math.BigDecimal(body.get("score").toString()) : null;
        Integer rank = body.get("rank") != null ? Integer.parseInt(body.get("rank").toString()) : null;

        matchFeedbackRepository.save(new com.ethiobridge.entity.MatchFeedback(id, providerProfileId, user.getId(), action, score, rank));
        return ResponseEntity.ok().build();
    }
}
