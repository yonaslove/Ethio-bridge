package com.ethiobridge.repository;

import com.ethiobridge.entity.Listing;
import com.ethiobridge.model.ListingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID>, JpaSpecificationExecutor<Listing> {
    List<Listing> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);
    Page<Listing> findByStatus(ListingStatus status, Pageable pageable);
}
