package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SkillAssessmentServiceTest {

    @Mock
    private SkillAssessmentRepository assessmentRepository;

    @Mock
    private UserSkillAssessmentRepository userAssessmentRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private ProviderSkillRepository providerSkillRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private SkillAssessmentService assessmentService;

    private final UUID userId = UUID.randomUUID();
    private final UUID assessmentId = UUID.randomUUID();
    private final Long skillId = 2L;

    private final String questionsJson = "[" +
            "{\"id\":1,\"question\":\"What is @Transactional?\",\"options\":[\"Cache\",\"DB Boundary\"],\"correctIndex\":1,\"explanation\":\"Ensures ACID.\"}," +
            "{\"id\":2,\"question\":\"What is @PostMapping?\",\"options\":[\"HTTP POST\",\"HTTP GET\"],\"correctIndex\":0,\"explanation\":\"Maps POST.\"} " +
            "]";

    @BeforeEach
    void setUp() {
        assessmentService = new SkillAssessmentService(
                assessmentRepository,
                userAssessmentRepository,
                skillRepository,
                providerProfileRepository,
                providerSkillRepository,
                notificationService,
                auditLogService
        );
    }

    @Test
    @DisplayName("getAssessmentForTaking strips correct answers to prevent cheating")
    void testSanitizedQuestions() {
        SkillAssessment sa = new SkillAssessment(skillId, "Spring Boot Quiz", "TECH", 80, 15, questionsJson);
        sa.setId(assessmentId);

        when(assessmentRepository.findById(assessmentId)).thenReturn(Optional.of(sa));
        when(skillRepository.findById(skillId)).thenReturn(Optional.of(new Skill()));

        Map<String, Object> resp = assessmentService.getAssessmentForTaking(assessmentId);

        assertNotNull(resp);
        assertEquals("Spring Boot Quiz", resp.get("title"));
        List<Map<String, Object>> questions = (List<Map<String, Object>>) resp.get("questions");
        assertEquals(2, questions.size());
        // Verify correctIndex and explanation are NOT exposed
        assertNull(questions.get(0).get("correctIndex"));
        assertNull(questions.get(0).get("explanation"));
        assertNotNull(questions.get(0).get("options"));
    }

    @Test
    @DisplayName("submitAssessment scores correctly, marks passed, and awards verified badge")
    void testPassingAssessment() {
        SkillAssessment sa = new SkillAssessment(skillId, "Spring Boot Quiz", "TECH", 80, 15, questionsJson);
        sa.setId(assessmentId);

        when(assessmentRepository.findById(assessmentId)).thenReturn(Optional.of(sa));

        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(userId);

        Skill skill = new Skill();
        skill.setId(skillId);
        skill.setName("Spring Boot");

        ProviderSkill ps = new ProviderSkill(profile, skill, 4, java.math.BigDecimal.valueOf(3.0));

        when(providerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(providerSkillRepository.findById(any(ProviderSkillId.class))).thenReturn(Optional.of(ps));

        Map<String, Object> submission = new HashMap<>();
        Map<String, Object> answers = new HashMap<>();
        answers.put("1", 1); // Correct
        answers.put("2", 0); // Correct
        submission.put("answers", answers);

        Map<String, Object> result = assessmentService.submitAssessment(userId, assessmentId, submission);

        assertNotNull(result);
        assertEquals(100, result.get("score"));
        assertTrue((Boolean) result.get("passed"));
        assertEquals("TOP_PERFORMER_BADGE", result.get("badgeAwarded"));

        // Verify provider skill was updated to verified
        assertTrue(ps.isVerified());
        assertEquals(100, ps.getAssessmentScore());
        verify(providerSkillRepository).save(ps);
        verify(notificationService).sendNotification(eq(userId), contains("Skill Certified"), anyString(), eq("BADGE"), anyString());
    }

    @Test
    @DisplayName("submitAssessment fails when score is below passing score and does not award badge")
    void testFailingAssessment() {
        SkillAssessment sa = new SkillAssessment(skillId, "Spring Boot Quiz", "TECH", 80, 15, questionsJson);
        sa.setId(assessmentId);

        when(assessmentRepository.findById(assessmentId)).thenReturn(Optional.of(sa));

        Map<String, Object> submission = new HashMap<>();
        Map<String, Object> answers = new HashMap<>();
        answers.put("1", 0); // Wrong
        answers.put("2", 1); // Wrong
        submission.put("answers", answers);

        Map<String, Object> result = assessmentService.submitAssessment(userId, assessmentId, submission);

        assertNotNull(result);
        assertEquals(0, result.get("score"));
        assertFalse((Boolean) result.get("passed"));
        assertNull(result.get("badgeAwarded"));

        verify(providerSkillRepository, never()).save(any());
    }
}
