package com.ethiobridge.repository;

import com.ethiobridge.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
    List<Dispute> findByContractIdOrderByCreatedAtDesc(UUID contractId);
    List<Dispute> findByStatusOrderByCreatedAtDesc(String status);
    List<Dispute> findAllByOrderByCreatedAtDesc();
}
