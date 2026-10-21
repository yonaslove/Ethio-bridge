package com.ethiobridge.repository;

import com.ethiobridge.entity.UserVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVerificationRepository extends JpaRepository<UserVerification, UUID> {
    List<UserVerification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<UserVerification> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
    List<UserVerification> findByStatusOrderByCreatedAtAsc(String status);
}
