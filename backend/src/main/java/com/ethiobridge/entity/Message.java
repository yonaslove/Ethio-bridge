package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "message")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "thread_id", nullable = false)
    private UUID threadId;

    @Column(name = "sender_user_id", nullable = false)
    private UUID senderUserId;

    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Message() {}

    public Message(UUID threadId, UUID senderUserId, UUID recipientUserId, String content) {
        this.threadId = threadId;
        this.senderUserId = senderUserId;
        this.recipientUserId = recipientUserId;
        this.content = content;
        this.isRead = false;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getThreadId() { return threadId; }
    public void setThreadId(UUID threadId) { this.threadId = threadId; }

    public UUID getSenderUserId() { return senderUserId; }
    public void setSenderUserId(UUID senderUserId) { this.senderUserId = senderUserId; }

    public UUID getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(UUID recipientUserId) { this.recipientUserId = recipientUserId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
