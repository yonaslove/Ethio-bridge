package com.ethiobridge.controller;

import com.ethiobridge.dto.PagedResponse;
import com.ethiobridge.dto.SkillDto;
import com.ethiobridge.dto.UserDto;
import com.ethiobridge.entity.*;
import com.ethiobridge.service.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final VerificationService verificationService;
    private final ReportService reportService;
    private final ContractService contractService;
    private final AuditLogService auditLogService;
    private final UserService userService;

    public AdminController(AdminService adminService,
                           VerificationService verificationService,
                           ReportService reportService,
                           ContractService contractService,
                           AuditLogService auditLogService,
                           UserService userService) {
        this.adminService = adminService;
        this.verificationService = verificationService;
        this.reportService = reportService;
        this.contractService = contractService;
        this.auditLogService = auditLogService;
        this.userService = userService;
    }

    @GetMapping("/users")
    public PagedResponse<UserDto> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return adminService.listUsers(pageRequest);
    }

    @PatchMapping("/users/{id}/status")
    public UserDto setUserStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ACTIVE");
        return adminService.setUserStatus(id, status);
    }

    @PostMapping("/skills")
    public ResponseEntity<SkillDto> createSkill(@RequestBody SkillDto dto) {
        SkillDto created = adminService.createSkill(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<Void> deprecateSkill(@PathVariable Long id) {
        adminService.deprecateSkill(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/verifications")
    public List<UserVerification> listVerifications(@RequestParam(required = false) String status) {
        return verificationService.getVerifications(status);
    }

    @PostMapping("/verifications/{id}/ai-analyze")
    public ResponseEntity<UserVerification> analyzeWithAi(@PathVariable UUID id) {
        return ResponseEntity.ok(verificationService.analyzeVerificationWithAi(id));
    }

    @PutMapping("/verifications/{id}")
    public ResponseEntity<UserVerification> reviewVerification(Authentication auth,
                                                              @PathVariable UUID id,
                                                              @RequestBody Map<String, Object> body) {
        AppUser admin = userService.getOrCreateCurrentUser(auth);
        boolean approve = Boolean.parseBoolean(body.getOrDefault("approve", "true").toString());
        String reason = (String) body.get("rejectionReason");
        UserVerification reviewed = verificationService.reviewVerification(admin.getId(), id, approve, reason);
        return ResponseEntity.ok(reviewed);
    }

    @GetMapping("/reports")
    public List<Report> listReports() {
        return reportService.getAllReports();
    }

    @PutMapping("/reports/{id}")
    public ResponseEntity<Report> resolveReport(Authentication auth,
                                               @PathVariable UUID id,
                                               @RequestBody Map<String, String> body) {
        AppUser admin = userService.getOrCreateCurrentUser(auth);
        String status = body.getOrDefault("status", "RESOLVED");
        String notes = body.get("adminNotes");
        Report resolved = reportService.resolveReport(admin.getId(), id, status, notes);
        return ResponseEntity.ok(resolved);
    }

    @GetMapping("/disputes")
    public List<Dispute> listDisputes() {
        return contractService.getAllDisputes();
    }

    @PutMapping("/disputes/{id}")
    public ResponseEntity<Dispute> resolveDispute(Authentication auth,
                                                 @PathVariable UUID id,
                                                 @RequestBody Map<String, String> body) {
        AppUser admin = userService.getOrCreateCurrentUser(auth);
        String status = body.getOrDefault("status", "SETTLED");
        String resolution = body.get("adminResolution");
        Dispute resolved = contractService.resolveDispute(admin.getId(), id, status, resolution);
        return ResponseEntity.ok(resolved);
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> listRecentAuditLogs() {
        return auditLogService.getTop50Logs();
    }
}
