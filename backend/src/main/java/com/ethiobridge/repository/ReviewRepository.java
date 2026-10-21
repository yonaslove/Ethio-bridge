package com.ethiobridge.repository;

import com.ethiobridge.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByRevieweeUserIdOrderByCreatedAtDesc(UUID revieweeUserId);
    List<Review> findByListingIdOrderByCreatedAtDesc(UUID listingId);
    Optional<Review> findByListingIdAndReviewerUserId(UUID listingId, UUID reviewerUserId);
}
