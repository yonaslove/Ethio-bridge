package com.ethiobridge.repository;

import com.ethiobridge.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    Optional<Application> findByListingIdAndApplicantUserId(UUID listingId, UUID applicantUserId);
    List<Application> findByListingIdOrderByCreatedAtDesc(UUID listingId);
    List<Application> findByApplicantUserIdOrderByCreatedAtDesc(UUID applicantUserId);
}
