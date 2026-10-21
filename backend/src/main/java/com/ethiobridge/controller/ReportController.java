package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Report;
import com.ethiobridge.service.ReportService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    public ReportController(ReportService reportService, UserService userService) {
        this.reportService = reportService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Report> submitReport(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        UUID reportedUserId = body.get("reportedUserId") != null && !body.get("reportedUserId").isBlank()
                ? UUID.fromString(body.get("reportedUserId")) : null;
        UUID listingId = body.get("listingId") != null && !body.get("listingId").isBlank()
                ? UUID.fromString(body.get("listingId")) : null;
        String reason = body.get("reason");
        String details = body.get("details");

        Report report = reportService.createReport(user.getId(), reportedUserId, listingId, reason, details);
        return ResponseEntity.ok(report);
    }
}
