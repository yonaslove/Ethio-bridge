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

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final RestClient restClient;

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
