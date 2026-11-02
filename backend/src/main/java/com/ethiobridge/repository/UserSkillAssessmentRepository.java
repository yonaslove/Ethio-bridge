package com.ethiobridge.repository;

import com.ethiobridge.entity.UserSkillAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSkillAssessmentRepository extends JpaRepository<UserSkillAssessment, UUID> {
    List<UserSkillAssessment> findByUserIdOrderByCompletedAtDesc(UUID userId);
    List<UserSkillAssessment> findByUserIdAndPassedTrue(UUID userId);
    Optional<UserSkillAssessment> findByUserIdAndAssessmentId(UUID userId, UUID assessmentId);
}
