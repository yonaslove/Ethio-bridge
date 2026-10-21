package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_consent")
public class UserConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "consent_type", nullable = false)
    private String consentType; // TERMS_OF_SERVICE, PRIVACY_POLICY, DATA_SHARING

    @Column(nullable = false)
    private boolean agreed = true;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UserConsent() {}

    public UserConsent(UUID userId, String consentType, boolean agreed, String ipAddress, String userAgent) {
        this.userId = userId;
        this.consentType = consentType;
        this.agreed = agreed;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getConsentType() { return consentType; }
    public void setConsentType(String consentType) { this.consentType = consentType; }

    public boolean isAgreed() { return agreed; }
    public void setAgreed(boolean agreed) { this.agreed = agreed; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
