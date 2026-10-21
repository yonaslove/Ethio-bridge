package com.ethiobridge.entity;

import com.ethiobridge.model.ApplicationStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "application", uniqueConstraints = {
    @UniqueConstraint(name = "uq_application_listing_applicant", columnNames = {"listing_id", "applicant_user_id"})
})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "applicant_user_id", nullable = false)
    private UUID applicantUserId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_profile_id", nullable = false)
    private ProviderProfile providerProfile;

    @Column(name = "cover_note", columnDefinition = "TEXT")
    private String coverNote;

    @Column(name = "proposed_rate", precision = 12, scale = 2)
    private BigDecimal proposedRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Application() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public UUID getApplicantUserId() { return applicantUserId; }
    public void setApplicantUserId(UUID applicantUserId) { this.applicantUserId = applicantUserId; }

    public ProviderProfile getProviderProfile() { return providerProfile; }
    public void setProviderProfile(ProviderProfile providerProfile) { this.providerProfile = providerProfile; }

    public String getCoverNote() { return coverNote; }
    public void setCoverNote(String coverNote) { this.coverNote = coverNote; }

    public BigDecimal getProposedRate() { return proposedRate; }
    public void setProposedRate(BigDecimal proposedRate) { this.proposedRate = proposedRate; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
