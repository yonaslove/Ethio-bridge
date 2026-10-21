package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_revenue")
public class PlatformRevenue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_type", nullable = false)
    private String sourceType; // ESCROW_COMMISSION, CONNECTS_TOPUP, FEATURED_LISTING, PRO_SUBSCRIPTION

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "payer_user_id")
    private UUID payerUserId;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public PlatformRevenue() {}

    public PlatformRevenue(String sourceType, UUID sourceId, UUID payerUserId, BigDecimal grossAmount,
                           BigDecimal feeAmount, BigDecimal netAmount, String paymentMethod,
                           String referenceId, String description) {
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.payerUserId = payerUserId;
        this.grossAmount = grossAmount;
        this.feeAmount = feeAmount;
        this.netAmount = netAmount;
        this.currency = "ETB";
        this.paymentMethod = paymentMethod;
        this.referenceId = referenceId;
        this.description = description;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public UUID getSourceId() { return sourceId; }
    public void setSourceId(UUID sourceId) { this.sourceId = sourceId; }

    public UUID getPayerUserId() { return payerUserId; }
    public void setPayerUserId(UUID payerUserId) { this.payerUserId = payerUserId; }

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }

    public BigDecimal getFeeAmount() { return feeAmount; }
    public void setFeeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; }

    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
