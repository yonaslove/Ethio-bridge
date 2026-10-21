package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "match_feedback")
public class MatchFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "provider_profile_id", nullable = false)
    private UUID providerProfileId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String action; // VIEWED, SHORTLISTED, OFFERED, REJECTED

    @Column(precision = 8, scale = 6)
    private BigDecimal score;

    private Integer rank;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public MatchFeedback() {}

    public MatchFeedback(UUID listingId, UUID providerProfileId, UUID userId, String action, BigDecimal score, Integer rank) {
        this.listingId = listingId;
        this.providerProfileId = providerProfileId;
        this.userId = userId;
        this.action = action;
        this.score = score;
        this.rank = rank;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public UUID getProviderProfileId() { return providerProfileId; }
    public void setProviderProfileId(UUID providerProfileId) { this.providerProfileId = providerProfileId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
