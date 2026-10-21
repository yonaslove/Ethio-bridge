package com.ethiobridge.repository;

import com.ethiobridge.entity.MatchFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchFeedbackRepository extends JpaRepository<MatchFeedback, Long> {
    List<MatchFeedback> findByListingIdOrderByCreatedAtDesc(UUID listingId);
}
