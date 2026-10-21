package com.ethiobridge.repository;

import com.ethiobridge.entity.ApplicationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationAuditRepository extends JpaRepository<ApplicationAudit, Long> {
    List<ApplicationAudit> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
