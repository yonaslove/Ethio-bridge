package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_skill_assessment")
public class UserSkillAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "assessment_id", nullable = false)
    private UUID assessmentId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private boolean passed;

    @Column(name = "badge_awarded")
    private String badgeAwarded;

    @Column(name = "completed_at", nullable = false)
    private OffsetDateTime completedAt = OffsetDateTime.now();

    public UserSkillAssessment() {}

    public UserSkillAssessment(UUID userId, UUID assessmentId, Long skillId, int score, boolean passed, String badgeAwarded) {
        this.userId = userId;
        this.assessmentId = assessmentId;
        this.skillId = skillId;
        this.score = score;
        this.passed = passed;
        this.badgeAwarded = badgeAwarded;
        this.completedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getAssessmentId() { return assessmentId; }
    public void setAssessmentId(UUID assessmentId) { this.assessmentId = assessmentId; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public String getBadgeAwarded() { return badgeAwarded; }
    public void setBadgeAwarded(String badgeAwarded) { this.badgeAwarded = badgeAwarded; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
