package com.ethiobridge.repository;

import com.ethiobridge.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findBySlug(String slug);
    List<Skill> findByIsActiveTrue();
    List<Skill> findByIsActiveTrueAndNameContainingIgnoreCase(String name);
}
