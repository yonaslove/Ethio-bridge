package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.InterviewService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interviews")
@PreAuthorize("isAuthenticated()")
public class InterviewController {

    private final InterviewService interviewService;
    private final UserService userService;

    public InterviewController(InterviewService interviewService, UserService userService) {
        this.interviewService = interviewService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> scheduleInterview(@RequestBody Map<String, Object> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        Map<String, Object> created = interviewService.scheduleInterview(user.getId(), body);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyInterviews(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(interviewService.getUserInterviews(user.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable UUID id,
                                                            @RequestBody Map<String, String> body,
                                                            Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String status = body.get("status");
        String notes = body.get("notes");
        Map<String, Object> updated = interviewService.updateInterviewStatus(user.getId(), id, status, notes);
        return ResponseEntity.ok(updated);
    }
}
