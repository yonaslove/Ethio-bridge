package com.ethiobridge.service;

import com.ethiobridge.entity.Report;
import com.ethiobridge.repository.ReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public ReportService(ReportRepository reportRepository, AuditLogService auditLogService, NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public Report createReport(UUID reporterUserId, UUID reportedUserId, UUID listingId, String reason, String details) {
        Report report = new Report(reporterUserId, reportedUserId, listingId, reason, details);
        report = reportRepository.save(report);

        auditLogService.log(reporterUserId, "SUBMIT_REPORT", "Report", report.getId().toString(),
                "Reason: " + reason + ", TargetUser: " + reportedUserId + ", Listing: " + listingId, null);

        return report;
    }

    @Transactional(readOnly = true)
    public List<Report> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    public Report resolveReport(UUID adminUserId, UUID reportId, String status, String adminNotes) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));

        report.setStatus(status);
        report.setAdminNotes(adminNotes);
        report.setResolvedBy(adminUserId);
        report.setResolvedAt(OffsetDateTime.now());
        report = reportRepository.save(report);

        auditLogService.log(adminUserId, "RESOLVE_REPORT", "Report", report.getId().toString(),
                "Status: " + status + ", Notes: " + adminNotes, null);

        notificationService.sendNotification(
                report.getReporterUserId(),
                "Report Update",
                "Your moderation report has been reviewed by the EthioBridge safety team (" + status + ").",
                "SYSTEM",
                "/browse"
        );

        return report;
    }
}
