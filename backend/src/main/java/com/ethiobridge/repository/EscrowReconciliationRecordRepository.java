package com.ethiobridge.repository;

import com.ethiobridge.entity.EscrowReconciliationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EscrowReconciliationRecordRepository extends JpaRepository<EscrowReconciliationRecord, UUID> {
    List<EscrowReconciliationRecord> findAllByOrderByCreatedAtDesc();
}
