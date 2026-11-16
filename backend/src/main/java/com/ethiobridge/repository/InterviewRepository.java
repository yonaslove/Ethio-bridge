package com.ethiobridge.repository;

import com.ethiobridge.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findByEmployerUserIdOrderByScheduledAtDesc(UUID employerUserId);

    List<Interview> findByCandidateUserIdOrderByScheduledAtDesc(UUID candidateUserId);

    List<Interview> findByApplicationIdOrderByScheduledAtDesc(UUID applicationId);

    @Query("SELECT i FROM Interview i WHERE i.employerUserId = :userId OR i.candidateUserId = :userId ORDER BY i.scheduledAt DESC")
    List<Interview> findUserInterviews(@Param("userId") UUID userId);
}
