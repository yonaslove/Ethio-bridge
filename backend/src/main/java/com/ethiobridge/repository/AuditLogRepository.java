package com.ethiobridge.repository;

import com.ethiobridge.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<AuditLog> findTop50ByOrderByCreatedAtDesc();
    List<AuditLog> findByActorUserIdOrderByCreatedAtDesc(UUID actorUserId);
}
