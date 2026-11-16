package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "listing_id")
    private UUID listingId;

    @Column(name = "employer_user_id", nullable = false)
    private UUID employerUserId;

    @Column(name = "candidate_user_id", nullable = false)
    private UUID candidateUserId;

    @Column(nullable = false)
    private String title;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 45;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(name = "location_notes", columnDefinition = "TEXT")
    private String locationNotes;

    @Column(nullable = false, length = 50)
    private String status = "INVITED"; // INVITED, ACCEPTED, DECLINED, RESCHEDULED, COMPLETED, CANCELLED

    @Column(name = "candidate_notes", columnDefinition = "TEXT")
    private String candidateNotes;

    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Interview() {}

    public Interview(UUID applicationId, UUID listingId, UUID employerUserId, UUID candidateUserId,
                     String title, OffsetDateTime scheduledAt, Integer durationMinutes, String meetingLink) {
        this.applicationId = applicationId;
        this.listingId = listingId;
        this.employerUserId = employerUserId;
        this.candidateUserId = candidateUserId;
        this.title = title;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 45;
        this.meetingLink = meetingLink;
        this.status = "INVITED";
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public UUID getEmployerUserId() { return employerUserId; }
    public void setEmployerUserId(UUID employerUserId) { this.employerUserId = employerUserId; }

    public UUID getCandidateUserId() { return candidateUserId; }
    public void setCandidateUserId(UUID candidateUserId) { this.candidateUserId = candidateUserId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public OffsetDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(OffsetDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }

    public String getLocationNotes() { return locationNotes; }
    public void setLocationNotes(String locationNotes) { this.locationNotes = locationNotes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCandidateNotes() { return candidateNotes; }
    public void setCandidateNotes(String candidateNotes) { this.candidateNotes = candidateNotes; }

    public String getDeclineReason() { return declineReason; }
    public void setDeclineReason(String declineReason) { this.declineReason = declineReason; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
