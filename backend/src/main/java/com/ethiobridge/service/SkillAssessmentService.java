package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class SkillAssessmentService {

    private final SkillAssessmentRepository assessmentRepository;
    private final UserSkillAssessmentRepository userAssessmentRepository;
    private final SkillRepository skillRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderSkillRepository providerSkillRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public SkillAssessmentService(SkillAssessmentRepository assessmentRepository,
                                  UserSkillAssessmentRepository userAssessmentRepository,
                                  SkillRepository skillRepository,
                                  ProviderProfileRepository providerProfileRepository,
                                  ProviderSkillRepository providerSkillRepository,
                                  NotificationService notificationService,
                                  AuditLogService auditLogService) {
        this.assessmentRepository = assessmentRepository;
        this.userAssessmentRepository = userAssessmentRepository;
        this.skillRepository = skillRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.providerSkillRepository = providerSkillRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableAssessments(UUID userId) {
        List<SkillAssessment> assessments = assessmentRepository.findAll();
        List<UserSkillAssessment> attempts = userId != null ? userAssessmentRepository.findByUserIdOrderByCompletedAtDesc(userId) : Collections.emptyList();

        Map<UUID, UserSkillAssessment> latestAttempts = new HashMap<>();
        for (UserSkillAssessment a : attempts) {
            latestAttempts.putIfAbsent(a.getAssessmentId(), a);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (SkillAssessment sa : assessments) {
            Skill skill = skillRepository.findById(sa.getSkillId()).orElse(null);

            Map<String, Object> map = new HashMap<>();
            map.put("id", sa.getId());
            map.put("title", sa.getTitle());
            map.put("category", sa.getCategory());
            map.put("passingScore", sa.getPassingScore());
            map.put("timeLimitMinutes", sa.getTimeLimitMinutes());
            map.put("skillId", sa.getSkillId());
            map.put("skillName", skill != null ? skill.getName() : "General Skill");
            map.put("skillSlug", skill != null ? skill.getSlug() : "");

            UserSkillAssessment userAttempt = latestAttempts.get(sa.getId());
            if (userAttempt != null) {
                map.put("hasAttempted", true);
                map.put("lastScore", userAttempt.getScore());
                map.put("passed", userAttempt.isPassed());
                map.put("badgeAwarded", userAttempt.getBadgeAwarded());
                map.put("completedAt", userAttempt.getCompletedAt());
            } else {
                map.put("hasAttempted", false);
                map.put("passed", false);
            }

            result.add(map);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAssessmentForTaking(UUID assessmentId) {
        SkillAssessment sa = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        Skill skill = skillRepository.findById(sa.getSkillId()).orElse(null);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", sa.getId());
        resp.put("title", sa.getTitle());
        resp.put("category", sa.getCategory());
        resp.put("passingScore", sa.getPassingScore());
        resp.put("timeLimitMinutes", sa.getTimeLimitMinutes());
        resp.put("skillName", skill != null ? skill.getName() : "Skill");

        try {
            List<Map<String, Object>> rawQuestions = objectMapper.readValue(sa.getQuestionsJson(), new TypeReference<>() {});
            List<Map<String, Object>> sanitizedQuestions = new ArrayList<>();

            for (Map<String, Object> q : rawQuestions) {
                Map<String, Object> cleanQ = new HashMap<>();
                cleanQ.put("id", q.get("id"));
                cleanQ.put("question", q.get("question"));
                cleanQ.put("options", q.get("options"));
                // Strictly exclude correctIndex and explanation during test session
                sanitizedQuestions.add(cleanQ);
            }
            resp.put("questions", sanitizedQuestions);
            resp.put("totalQuestions", sanitizedQuestions.size());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse questions schema: " + e.getMessage());
        }

        return resp;
    }

    public Map<String, Object> submitAssessment(UUID userId, UUID assessmentId, Map<String, Object> submission) {
        SkillAssessment sa = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        Map<String, Object> answers = (Map<String, Object>) submission.getOrDefault("answers", Collections.emptyMap());

        int totalQuestions = 0;
        int correctCount = 0;
        List<Map<String, Object>> questionsReview = new ArrayList<>();

        try {
            List<Map<String, Object>> questions = objectMapper.readValue(sa.getQuestionsJson(), new TypeReference<>() {});
            totalQuestions = questions.size();

            for (Map<String, Object> q : questions) {
                int qId = ((Number) q.get("id")).intValue();
                int correctIdx = ((Number) q.get("correctIndex")).intValue();
                String explanation = (String) q.getOrDefault("explanation", "");

                Object userChoiceObj = answers.get(String.valueOf(qId));
                int userChoice = userChoiceObj != null ? ((Number) userChoiceObj).intValue() : -1;

                boolean isCorrect = (userChoice == correctIdx);
                if (isCorrect) correctCount++;

                Map<String, Object> review = new HashMap<>();
                review.put("id", qId);
                review.put("question", q.get("question"));
                review.put("options", q.get("options"));
                review.put("userChoice", userChoice);
                review.put("correctIndex", correctIdx);
                review.put("isCorrect", isCorrect);
                review.put("explanation", explanation);
                questionsReview.add(review);
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Evaluation error: " + e.getMessage());
        }

        int score = totalQuestions > 0 ? (correctCount * 100) / totalQuestions : 0;
        boolean passed = score >= sa.getPassingScore();
        String badge = passed ? (score == 100 ? "TOP_PERFORMER_BADGE" : "VERIFIED_SKILL_PRO") : null;

        UserSkillAssessment record = new UserSkillAssessment(userId, assessmentId, sa.getSkillId(), score, passed, badge);
        userAssessmentRepository.save(record);

        // If passed, mark provider_skill as verified
        if (passed) {
            providerProfileRepository.findByUserId(userId).ifPresent(profile -> {
                ProviderSkillId psId = new ProviderSkillId(profile.getId(), sa.getSkillId());
                providerSkillRepository.findById(psId).ifPresentOrElse(ps -> {
                    ps.setVerified(true);
                    ps.setAssessmentScore(score);
                    ps.setVerifiedAt(OffsetDateTime.now());
                    providerSkillRepository.save(ps);
                }, () -> {
                    // If provider doesn't have the skill in profile yet, auto-add it with verified status
                    skillRepository.findById(sa.getSkillId()).ifPresent(sk -> {
                        ProviderSkill newPs = new ProviderSkill(profile, sk, 5, java.math.BigDecimal.valueOf(2.0));
                        newPs.setVerified(true);
                        newPs.setAssessmentScore(score);
                        newPs.setVerifiedAt(OffsetDateTime.now());
                        providerSkillRepository.save(newPs);
                    });
                });
            });

            notificationService.sendNotification(
                    userId,
                    "🏅 Skill Certified: " + sa.getTitle(),
                    "Congratulations! You scored " + score + "% and earned the " + (badge != null ? badge.replace("_", " ") : "Verified") + " badge.",
                    "BADGE",
                    "/profile/provider"
            );
        }

        auditLogService.log(userId, "SUBMIT_SKILL_ASSESSMENT", "SkillAssessment", assessmentId.toString(),
                "Score: " + score + "%, Passed: " + passed + ", Badge: " + badge, null);

        Map<String, Object> result = new HashMap<>();
        result.put("assessmentId", assessmentId);
        result.put("title", sa.getTitle());
        result.put("score", score);
        result.put("passed", passed);
        result.put("passingScore", sa.getPassingScore());
        result.put("totalQuestions", totalQuestions);
        result.put("correctCount", correctCount);
        result.put("badgeAwarded", badge);
        result.put("review", questionsReview);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserBadges(UUID userId) {
        List<UserSkillAssessment> passedList = userAssessmentRepository.findByUserIdAndPassedTrue(userId);
        List<Map<String, Object>> badges = new ArrayList<>();

        for (UserSkillAssessment u : passedList) {
            Skill skill = skillRepository.findById(u.getSkillId()).orElse(null);
            SkillAssessment sa = assessmentRepository.findById(u.getAssessmentId()).orElse(null);

            Map<String, Object> b = new HashMap<>();
            b.put("skillId", u.getSkillId());
            b.put("skillName", skill != null ? skill.getName() : "Skill");
            b.put("assessmentTitle", sa != null ? sa.getTitle() : "Skill Assessment");
            b.put("score", u.getScore());
            b.put("badge", u.getBadgeAwarded());
            b.put("earnedAt", u.getCompletedAt());
            badges.add(b);
        }

        return badges;
    }
}
