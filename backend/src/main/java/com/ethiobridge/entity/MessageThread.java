package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "message_thread")
public class MessageThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "listing_id")
    private UUID listingId;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "participant1_user_id", nullable = false)
    private UUID participant1UserId;

    @Column(name = "participant2_user_id", nullable = false)
    private UUID participant2UserId;

    @Column(nullable = false)
    private String subject;

    @Column(name = "last_message_at", nullable = false)
    private OffsetDateTime lastMessageAt = OffsetDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public MessageThread() {}

    public MessageThread(UUID listingId, UUID applicationId, UUID participant1UserId, UUID participant2UserId, String subject) {
        this.listingId = listingId;
        this.applicationId = applicationId;
        this.participant1UserId = participant1UserId;
        this.participant2UserId = participant2UserId;
        this.subject = subject;
        this.lastMessageAt = OffsetDateTime.now();
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public UUID getParticipant1UserId() { return participant1UserId; }
    public void setParticipant1UserId(UUID participant1UserId) { this.participant1UserId = participant1UserId; }

    public UUID getParticipant2UserId() { return participant2UserId; }
    public void setParticipant2UserId(UUID participant2UserId) { this.participant2UserId = participant2UserId; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public OffsetDateTime getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(OffsetDateTime lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
