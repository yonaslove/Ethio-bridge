package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "escrow_ledger_entry")
public class EscrowLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "milestone_id")
    private UUID milestoneId;

    @Column(name = "transaction_ref", nullable = false)
    private String transactionRef;

    @Column(name = "entry_type", nullable = false)
    private String entryType; // DEPOSIT_HOLD, RELEASE_PAYOUT, COMMISSION_FEE, REFUND

    @Column(name = "debit_account", nullable = false)
    private String debitAccount;

    @Column(name = "credit_account", nullable = false)
    private String creditAccount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "seeker_user_id")
    private UUID seekerUserId;

    @Column(name = "provider_user_id")
    private UUID providerUserId;

    @Column(name = "balance_after", precision = 12, scale = 2)
    private BigDecimal balanceAfter = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean reconciled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public EscrowLedgerEntry() {}

    public EscrowLedgerEntry(UUID contractId, UUID milestoneId, String transactionRef, String entryType,
                             String debitAccount, String creditAccount, BigDecimal amount,
                             UUID seekerUserId, UUID providerUserId, BigDecimal balanceAfter, String description) {
        this.contractId = contractId;
        this.milestoneId = milestoneId;
        this.transactionRef = transactionRef;
        this.entryType = entryType;
        this.debitAccount = debitAccount;
        this.creditAccount = creditAccount;
        this.amount = amount;
        this.currency = "ETB";
        this.seekerUserId = seekerUserId;
        this.providerUserId = providerUserId;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.reconciled = false;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getContractId() { return contractId; }
    public void setContractId(UUID contractId) { this.contractId = contractId; }

    public UUID getMilestoneId() { return milestoneId; }
    public void setMilestoneId(UUID milestoneId) { this.milestoneId = milestoneId; }

    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }

    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }

    public String getDebitAccount() { return debitAccount; }
    public void setDebitAccount(String debitAccount) { this.debitAccount = debitAccount; }

    public String getCreditAccount() { return creditAccount; }
    public void setCreditAccount(String creditAccount) { this.creditAccount = creditAccount; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public UUID getSeekerUserId() { return seekerUserId; }
    public void setSeekerUserId(UUID seekerUserId) { this.seekerUserId = seekerUserId; }

    public UUID getProviderUserId() { return providerUserId; }
    public void setProviderUserId(UUID providerUserId) { this.providerUserId = providerUserId; }

    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal balanceAfter) { this.balanceAfter = balanceAfter; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isReconciled() { return reconciled; }
    public void setReconciled(boolean reconciled) { this.reconciled = reconciled; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
