package com.ethiobridge.repository;

import com.ethiobridge.entity.ContractMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractMilestoneRepository extends JpaRepository<ContractMilestone, UUID> {
    List<ContractMilestone> findByContractIdOrderByCreatedAtAsc(UUID contractId);
}
