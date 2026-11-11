package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.SkillAssessmentService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
public class SkillAssessmentController {

    private final SkillAssessmentService assessmentService;
    private final UserService userService;

    public SkillAssessmentController(SkillAssessmentService assessmentService, UserService userService) {
        this.assessmentService = assessmentService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAssessments(Authentication auth) {
        UUID userId = null;
        if (auth != null && auth.isAuthenticated()) {
            AppUser user = userService.getOrCreateCurrentUser(auth);
            userId = user.getId();
        }
        return ResponseEntity.ok(assessmentService.getAvailableAssessments(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAssessmentForTaking(@PathVariable UUID id) {
        return ResponseEntity.ok(assessmentService.getAssessmentForTaking(id));
    }

    @GetMapping("/by-skill/{skillId}")
    public ResponseEntity<Map<String, Object>> getAssessmentBySkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(assessmentService.getOrCreateAssessmentBySkillId(skillId));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitAssessment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> submission,
            Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        Map<String, Object> result = assessmentService.submitAssessment(user.getId(), id, submission);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my-badges")
    public ResponseEntity<List<Map<String, Object>>> getMyBadges(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(assessmentService.getUserBadges(user.getId()));
    }
}
