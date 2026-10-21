package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.ComplianceService;
import com.ethiobridge.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/compliance")
public class ComplianceController {

    private final ComplianceService complianceService;
    private final UserService userService;

    public ComplianceController(ComplianceService complianceService, UserService userService) {
        this.complianceService = complianceService;
        this.userService = userService;
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportMyData(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(complianceService.exportUserData(user.getId()));
    }

    @PostMapping("/consent")
    public ResponseEntity<Map<String, String>> recordConsent(@RequestBody Map<String, Object> body,
                                                            HttpServletRequest request,
                                                            Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String consentType = (String) body.getOrDefault("consentType", "TERMS_OF_SERVICE");
        boolean agreed = Boolean.parseBoolean(body.getOrDefault("agreed", "true").toString());
        String ipAddress = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        complianceService.logConsent(user.getId(), consentType, agreed, ipAddress, userAgent);
        return ResponseEntity.ok(Map.of("status", "CONSENT_RECORDED"));
    }
}
