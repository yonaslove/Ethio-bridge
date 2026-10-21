package com.ethiobridge.service;

import com.ethiobridge.entity.AuditLog;
import com.ethiobridge.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void log(UUID actorUserId, String action, String entityType, String entityId, String details, String ipAddress) {
        AuditLog auditLog = new AuditLog(actorUserId, action, entityType, entityId, details, ipAddress);
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getRecentLogs(int page, int size) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getTop50Logs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
