package com.ethiobridge.controller;

import com.ethiobridge.service.CvParserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cv")
public class CvParserController {

    private final CvParserService cvParserService;

    public CvParserController(CvParserService cvParserService) {
        this.cvParserService = cvParserService;
    }

    @PostMapping("/parse-text")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> parseText(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        return ResponseEntity.ok(cvParserService.parseCvText(text));
    }

    @PostMapping("/parse-file")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> parseFile(@RequestParam("file") MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            String extractedText = CvParserService.extractPlainTextFromStream(is, file.getOriginalFilename());
            return ResponseEntity.ok(cvParserService.parseCvText(extractedText));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not parse document: " + e.getMessage()));
        }
    }
}
