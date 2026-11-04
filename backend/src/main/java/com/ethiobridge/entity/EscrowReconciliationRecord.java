package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "escrow_reconciliation_record")
public class EscrowReconciliationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "period_start", nullable = false)
    private OffsetDateTime periodStart;

    @Column(name = "period_end", nullable = false)
    private OffsetDateTime periodEnd;

    @Column(name = "total_holds", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalHolds = BigDecimal.ZERO;

    @Column(name = "total_released", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalReleased = BigDecimal.ZERO;

    @Column(name = "total_fees", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalFees = BigDecimal.ZERO;

    @Column(name = "total_payouts", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPayouts = BigDecimal.ZERO;

    @Column(name = "active_escrow_balance", nullable = false, precision = 14, scale = 2)
    private BigDecimal activeEscrowBalance = BigDecimal.ZERO;

    @Column(name = "discrepancy_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal discrepancyAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status = "BALANCED"; // BALANCED, DISCREPANCY_DETECTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public EscrowReconciliationRecord() {}

    public EscrowReconciliationRecord(OffsetDateTime periodStart, OffsetDateTime periodEnd,
                                      BigDecimal totalHolds, BigDecimal totalReleased,
                                      BigDecimal totalFees, BigDecimal totalPayouts,
                                      BigDecimal activeEscrowBalance, BigDecimal discrepancyAmount,
                                      String status, String notes) {
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.totalHolds = totalHolds;
        this.totalReleased = totalReleased;
        this.totalFees = totalFees;
        this.totalPayouts = totalPayouts;
        this.activeEscrowBalance = activeEscrowBalance;
        this.discrepancyAmount = discrepancyAmount;
        this.status = status;
        this.notes = notes;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public OffsetDateTime getPeriodStart() { return periodStart; }
    public void setPeriodStart(OffsetDateTime periodStart) { this.periodStart = periodStart; }

    public OffsetDateTime getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(OffsetDateTime periodEnd) { this.periodEnd = periodEnd; }

    public BigDecimal getTotalHolds() { return totalHolds; }
    public void setTotalHolds(BigDecimal totalHolds) { this.totalHolds = totalHolds; }

    public BigDecimal getTotalReleased() { return totalReleased; }
    public void setTotalReleased(BigDecimal totalReleased) { this.totalReleased = totalReleased; }

    public BigDecimal getTotalFees() { return totalFees; }
    public void setTotalFees(BigDecimal totalFees) { this.totalFees = totalFees; }

    public BigDecimal getTotalPayouts() { return totalPayouts; }
    public void setTotalPayouts(BigDecimal totalPayouts) { this.totalPayouts = totalPayouts; }

    public BigDecimal getActiveEscrowBalance() { return activeEscrowBalance; }
    public void setActiveEscrowBalance(BigDecimal activeEscrowBalance) { this.activeEscrowBalance = activeEscrowBalance; }

    public BigDecimal getDiscrepancyAmount() { return discrepancyAmount; }
    public void setDiscrepancyAmount(BigDecimal discrepancyAmount) { this.discrepancyAmount = discrepancyAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
