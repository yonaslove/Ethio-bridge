package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_webhook_log")
public class PaymentWebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String gateway = "CHAPA";

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "tx_ref", nullable = false)
    private String txRef;

    @Column(name = "signature_verified", nullable = false)
    private boolean signatureVerified = false;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private String status = "PROCESSED"; // PROCESSED, DUPLICATE_SKIPPED, REJECTED

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public PaymentWebhookLog() {}

    public PaymentWebhookLog(String gateway, String eventType, String txRef,
                             boolean signatureVerified, String idempotencyKey, String payload, String status) {
        this.gateway = gateway;
        this.eventType = eventType;
        this.txRef = txRef;
        this.signatureVerified = signatureVerified;
        this.idempotencyKey = idempotencyKey;
        this.payload = payload;
        this.status = status;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getGateway() { return gateway; }
    public void setGateway(String gateway) { this.gateway = gateway; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getTxRef() { return txRef; }
    public void setTxRef(String txRef) { this.txRef = txRef; }

    public boolean isSignatureVerified() { return signatureVerified; }
    public void setSignatureVerified(boolean signatureVerified) { this.signatureVerified = signatureVerified; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
