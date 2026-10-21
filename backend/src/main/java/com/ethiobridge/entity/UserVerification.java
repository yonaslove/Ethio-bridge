package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_verification")
public class UserVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "id_type", nullable = false)
    private String idType; // FAYDA_NATIONAL_ID, KEBELE_ID, PASSPORT, DRIVERS_LICENSE, BUSINESS_LICENSE

    @Column(name = "id_number", nullable = false)
    private String idNumber;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "document_url", columnDefinition = "TEXT")
    private String documentUrl;

    @Column(name = "selfie_url", columnDefinition = "TEXT")
    private String selfieUrl;

    @Column(name = "ai_score")
    private BigDecimal aiScore;

    @Column(name = "ai_verdict")
    private String aiVerdict;

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(name = "criteria_breakdown", columnDefinition = "TEXT")
    private String criteriaBreakdown;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, VERIFIED, REJECTED

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Transient
    private String userName;

    @Transient
    private String userEmail;

    @Transient
    private List<String> userRoles;

    public UserVerification() {}

    public UserVerification(UUID userId, String idType, String idNumber, String phoneNumber) {
        this.userId = userId;
        this.idType = idType;
        this.idNumber = idNumber;
        this.phoneNumber = phoneNumber;
        this.status = "PENDING";
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getIdType() { return idType; }
    public void setIdType(String idType) { this.idType = idType; }

    public String getIdNumber() { return idNumber; }
    public void setIdNumber(String idNumber) { this.idNumber = idNumber; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

    public String getSelfieUrl() { return selfieUrl; }
    public void setSelfieUrl(String selfieUrl) { this.selfieUrl = selfieUrl; }

    public BigDecimal getAiScore() { return aiScore; }
    public void setAiScore(BigDecimal aiScore) { this.aiScore = aiScore; }

    public String getAiVerdict() { return aiVerdict; }
    public void setAiVerdict(String aiVerdict) { this.aiVerdict = aiVerdict; }

    public String getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(String aiAnalysis) { this.aiAnalysis = aiAnalysis; }

    public String getCriteriaBreakdown() { return criteriaBreakdown; }
    public void setCriteriaBreakdown(String criteriaBreakdown) { this.criteriaBreakdown = criteriaBreakdown; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public OffsetDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(OffsetDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public List<String> getUserRoles() { return userRoles; }
    public void setUserRoles(List<String> userRoles) { this.userRoles = userRoles; }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
