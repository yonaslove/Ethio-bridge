package com.ethiobridge.repository;

import com.ethiobridge.entity.ProviderSkill;
import com.ethiobridge.entity.ProviderSkillId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProviderSkillRepository extends JpaRepository<ProviderSkill, ProviderSkillId> {
    List<ProviderSkill> findByIdProviderProfileId(UUID providerProfileId);
    void deleteByIdProviderProfileId(UUID providerProfileId);
}
