package com.ethiobridge.service;

import com.ethiobridge.dto.ReviewDto;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.entity.Review;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.ProviderProfileRepository;
import com.ethiobridge.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ListingRepository listingRepository;
    private final AppUserRepository appUserRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ListingRepository listingRepository,
                         AppUserRepository appUserRepository,
                         ProviderProfileRepository providerProfileRepository) {
        this.reviewRepository = reviewRepository;
        this.listingRepository = listingRepository;
        this.appUserRepository = appUserRepository;
        this.providerProfileRepository = providerProfileRepository;
    }

    public ReviewDto createReview(UUID reviewerUserId, UUID listingId, ReviewDto req) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (reviewRepository.findByListingIdAndReviewerUserId(listingId, reviewerUserId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reviewed this listing");
        }

        Review review = new Review();
        review.setListing(listing);
        review.setReviewerUserId(reviewerUserId);
        review.setRevieweeUserId(req.getRevieweeUserId() != null ? req.getRevieweeUserId() : listing.getOwnerUserId());
        review.setRating(req.getRating() != null ? req.getRating() : 5);
        review.setComment(req.getComment());

        Review saved = reviewRepository.save(review);
        return toReviewDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsForProvider(UUID providerProfileId) {
        ProviderProfile profile = providerProfileRepository.findById(providerProfileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));

        return reviewRepository.findByRevieweeUserIdOrderByCreatedAtDesc(profile.getUserId()).stream()
                .map(this::toReviewDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsForListing(UUID listingId) {
        return reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId).stream()
                .map(this::toReviewDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getProviderRatingSummary(UUID providerProfileId) {
        List<ReviewDto> reviews = getReviewsForProvider(providerProfileId);
        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("totalReviews", reviews.size());
        if (reviews.isEmpty()) {
            summary.put("averageRating", 0.0);
            summary.put("distribution", java.util.Map.of("5", 0, "4", 0, "3", 0, "2", 0, "1", 0));
        } else {
            double avg = reviews.stream().mapToInt(ReviewDto::getRating).average().orElse(0.0);
            summary.put("averageRating", Math.round(avg * 10.0) / 10.0);
            java.util.Map<String, Long> dist = reviews.stream()
                    .collect(java.util.stream.Collectors.groupingBy(r -> String.valueOf(r.getRating()), java.util.stream.Collectors.counting()));
            summary.put("distribution", dist);
        }
        return summary;
    }

    private ReviewDto toReviewDto(Review r) {
        String reviewerName = appUserRepository.findById(r.getReviewerUserId())
                .map(AppUser::getFullName)
                .orElse("Client");

        return new ReviewDto(
                r.getId(),
                r.getListing().getId(),
                r.getReviewerUserId(),
                reviewerName,
                r.getRevieweeUserId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
