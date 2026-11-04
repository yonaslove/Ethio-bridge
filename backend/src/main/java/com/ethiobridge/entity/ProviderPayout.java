package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "provider_payout")
public class ProviderPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "milestone_id", nullable = false)
    private UUID milestoneId;

    @Column(name = "provider_user_id", nullable = false)
    private UUID providerUserId;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal feeAmount = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "payout_method", nullable = false)
    private String payoutMethod; // TELEBIRR, CBE_BIRR, CHAPA_TRANSFER

    @Column(name = "payout_account")
    private String payoutAccount;

    @Column(name = "payout_reference", nullable = false, unique = true)
    private String payoutReference;

    @Column(nullable = false)
    private String status = "SETTLED"; // INITIATED, PROCESSING, SETTLED, FAILED

    @Column(name = "settled_at")
    private OffsetDateTime settledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public ProviderPayout() {}

    public ProviderPayout(UUID contractId, UUID milestoneId, UUID providerUserId,
                          BigDecimal grossAmount, BigDecimal feeAmount, BigDecimal netAmount,
                          String payoutMethod, String payoutAccount, String payoutReference,
                          String status) {
        this.contractId = contractId;
        this.milestoneId = milestoneId;
        this.providerUserId = providerUserId;
        this.grossAmount = grossAmount;
        this.feeAmount = feeAmount;
        this.netAmount = netAmount;
        this.currency = "ETB";
        this.payoutMethod = payoutMethod;
        this.payoutAccount = payoutAccount;
        this.payoutReference = payoutReference;
        this.status = status;
        this.settledAt = "SETTLED".equalsIgnoreCase(status) ? OffsetDateTime.now() : null;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getContractId() { return contractId; }
    public void setContractId(UUID contractId) { this.contractId = contractId; }

    public UUID getMilestoneId() { return milestoneId; }
    public void setMilestoneId(UUID milestoneId) { this.milestoneId = milestoneId; }

    public UUID getProviderUserId() { return providerUserId; }
    public void setProviderUserId(UUID providerUserId) { this.providerUserId = providerUserId; }

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }

    public BigDecimal getFeeAmount() { return feeAmount; }
    public void setFeeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; }

    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPayoutMethod() { return payoutMethod; }
    public void setPayoutMethod(String payoutMethod) { this.payoutMethod = payoutMethod; }

    public String getPayoutAccount() { return payoutAccount; }
    public void setPayoutAccount(String payoutAccount) { this.payoutAccount = payoutAccount; }

    public String getPayoutReference() { return payoutReference; }
    public void setPayoutReference(String payoutReference) { this.payoutReference = payoutReference; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getSettledAt() { return settledAt; }
    public void setSettledAt(OffsetDateTime settledAt) { this.settledAt = settledAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
