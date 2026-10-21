package com.ethiobridge.dto;

import com.ethiobridge.model.ApplicationStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class ApplicationDto {
    private UUID id;
    private UUID listingId;
    private String listingTitle;
    private String listingType;
    private UUID applicantUserId;
    private String applicantName;
    private String applicantEmail;
    private UUID providerProfileId;
    private String headline;
    private String coverNote;
    private BigDecimal proposedRate;
    private ApplicationStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public ApplicationDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public String getListingTitle() { return listingTitle; }
    public void setListingTitle(String listingTitle) { this.listingTitle = listingTitle; }

    public String getListingType() { return listingType; }
    public void setListingType(String listingType) { this.listingType = listingType; }

    public UUID getApplicantUserId() { return applicantUserId; }
    public void setApplicantUserId(UUID applicantUserId) { this.applicantUserId = applicantUserId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }

    public UUID getProviderProfileId() { return providerProfileId; }
    public void setProviderProfileId(UUID providerProfileId) { this.providerProfileId = providerProfileId; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

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
}
