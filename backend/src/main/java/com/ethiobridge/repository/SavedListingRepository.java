package com.ethiobridge.repository;

import com.ethiobridge.entity.SavedListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedListingRepository extends JpaRepository<SavedListing, UUID> {

    List<SavedListing> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<SavedListing> findByUserIdAndListingId(UUID userId, UUID listingId);

    void deleteByUserIdAndListingId(UUID userId, UUID listingId);
}
