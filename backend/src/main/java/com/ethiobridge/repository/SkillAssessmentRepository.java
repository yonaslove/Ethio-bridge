package com.ethiobridge.repository;

import com.ethiobridge.entity.SkillAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillAssessmentRepository extends JpaRepository<SkillAssessment, UUID> {
    Optional<SkillAssessment> findBySkillId(Long skillId);
    List<SkillAssessment> findByCategory(String category);
}
