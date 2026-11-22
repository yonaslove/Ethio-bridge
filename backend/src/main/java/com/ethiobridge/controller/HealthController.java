package com.ethiobridge.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final RestClient restClient;
    private final com.ethiobridge.service.ProfileService profileService;

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    public HealthController(JdbcTemplate jdbcTemplate, com.ethiobridge.service.ProfileService profileService) {
        this.jdbcTemplate = jdbcTemplate;
        this.profileService = profileService;
        this.restClient = RestClient.builder().build();
    }

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> report = new HashMap<>();
        report.put("status", "UP");
        report.put("timestamp", OffsetDateTime.now());

        // Check DB
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            report.put("database", result != null && result == 1 ? "UP" : "DOWN");
            
            // Check provider_profile table structure / queries
            try {
                java.util.List<Map<String, Object>> profiles = jdbcTemplate.queryForList("SELECT id, user_id, headline, is_pro FROM provider_profile LIMIT 1");
                report.put("providerProfileQuery", "UP");
                report.put("providerProfileCount", profiles.size());
                
                // Diagnostic test invocation of ProfileService.getProviderProfile for provider1 user
                try {
                    Object profileDto = profileService.getProviderProfile(UUID.fromString("a2222222-2222-2222-2222-222222222201"));
                    report.put("diagnosticProfileCall", "SUCCESS");
                } catch (Throwable t) {
                    java.io.StringWriter sw = new java.io.StringWriter();
                    t.printStackTrace(new java.io.PrintWriter(sw));
                    report.put("diagnosticProfileError", t.getClass().getName() + ": " + t.getMessage());
                    report.put("diagnosticProfileTrace", sw.toString().substring(0, Math.min(sw.toString().length(), 1000)));
                }
            } catch (Exception pe) {
                report.put("providerProfileQuery", "ERROR: " + pe.getMessage());
            }
        } catch (Exception e) {
            report.put("database", "DOWN");
            report.put("databaseError", e.getMessage());
        }

        // Check AI service reachability
        try {
            String aiHealth = restClient.get()
                    .uri(aiServiceBaseUrl + "/ai/v1/health")
                    .retrieve()
                    .body(String.class);
            report.put("aiService", "UP");
        } catch (Exception e) {
            report.put("aiService", "UNREACHABLE");
        }

        return report;
    }
}
