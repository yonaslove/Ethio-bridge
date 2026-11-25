package com.ethiobridge.repository;

import com.ethiobridge.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    List<Report> findByStatusOrderByCreatedAtDesc(String status);
    List<Report> findAllByOrderByCreatedAtDesc();
    boolean existsByReportedUserIdAndListingIdAndStatus(UUID reportedUserId, UUID listingId, String status);
    boolean existsByReportedUserIdAndReasonStartingWithAndStatus(UUID reportedUserId, String reasonPrefix, String status);
    boolean existsByListingIdAndReasonStartingWithAndStatus(UUID listingId, String reasonPrefix, String status);
}

