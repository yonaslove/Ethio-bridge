package com.ethiobridge.repository;

import com.ethiobridge.entity.MatchRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRunRepository extends JpaRepository<MatchRun, UUID> {
    Optional<MatchRun> findFirstByListingIdOrderByCreatedAtDesc(UUID listingId);
    List<MatchRun> findByListingIdOrderByCreatedAtDesc(UUID listingId);
}
