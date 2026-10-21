package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "seeker_user_id", nullable = false)
    private UUID seekerUserId;

    @Column(name = "provider_user_id", nullable = false)
    private UUID providerUserId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String terms;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(nullable = false)
    private String status = "ACTIVE"; // DRAFT, ACTIVE, COMPLETED, DISPUTED, CANCELLED

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    public Contract() {}

    public Contract(UUID listingId, UUID applicationId, UUID seekerUserId, UUID providerUserId, String title, String terms, BigDecimal totalAmount) {
        this.listingId = listingId;
        this.applicationId = applicationId;
        this.seekerUserId = seekerUserId;
        this.providerUserId = providerUserId;
        this.title = title;
        this.terms = terms;
        this.totalAmount = totalAmount;
        this.currency = "ETB";
        this.status = "ACTIVE";
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public UUID getSeekerUserId() { return seekerUserId; }
    public void setSeekerUserId(UUID seekerUserId) { this.seekerUserId = seekerUserId; }

    public UUID getProviderUserId() { return providerUserId; }
    public void setProviderUserId(UUID providerUserId) { this.providerUserId = providerUserId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTerms() { return terms; }
    public void setTerms(String terms) { this.terms = terms; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
