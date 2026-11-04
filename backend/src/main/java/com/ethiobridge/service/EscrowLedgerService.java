package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class EscrowLedgerService {

    private static final Logger log = LoggerFactory.getLogger(EscrowLedgerService.class);

    private final EscrowLedgerEntryRepository ledgerRepository;
    private final ProviderPayoutRepository payoutRepository;
    private final EscrowReconciliationRecordRepository reconciliationRepository;
    private final ContractMilestoneRepository milestoneRepository;
    private final AuditLogService auditLogService;

    public EscrowLedgerService(EscrowLedgerEntryRepository ledgerRepository,
                               ProviderPayoutRepository payoutRepository,
                               EscrowReconciliationRecordRepository reconciliationRepository,
                               ContractMilestoneRepository milestoneRepository,
                               AuditLogService auditLogService) {
        this.ledgerRepository = ledgerRepository;
        this.payoutRepository = payoutRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.milestoneRepository = milestoneRepository;
        this.auditLogService = auditLogService;
    }

    public EscrowLedgerEntry recordDepositHold(UUID contractId, UUID milestoneId, UUID seekerUserId,
                                              UUID providerUserId, BigDecimal amount,
                                              String transactionRef, String paymentMethod) {
        EscrowLedgerEntry entry = new EscrowLedgerEntry(
                contractId,
                milestoneId,
                transactionRef,
                "DEPOSIT_HOLD",
                "SEEKER_DEPOSIT_" + paymentMethod.toUpperCase(),
                "ESCROW_HOLD_VAULT",
                amount,
                seekerUserId,
                providerUserId,
                amount,
                "Escrow hold secured in platform vault for milestone " + milestoneId + " via " + paymentMethod + " [Ref: " + transactionRef + "]"
        );

        EscrowLedgerEntry saved = ledgerRepository.save(entry);
        auditLogService.log(seekerUserId, "ESCROW_DEPOSIT_HOLD", "EscrowLedgerEntry",
                saved.getId().toString(), "Amount held: " + amount + " ETB, Rail: " + paymentMethod, null);
        log.info("Recorded Escrow DEPOSIT_HOLD: contract={}, milestone={}, amount={} ETB, ref={}",
                contractId, milestoneId, amount, transactionRef);
        return saved;
    }

    public ProviderPayout recordReleasePayout(UUID contractId, UUID milestoneId, UUID seekerUserId,
                                             UUID providerUserId, BigDecimal grossAmount,
                                             BigDecimal feeAmount, BigDecimal netAmount,
                                             String payoutMethod, String payoutAccount) {
        String method = (payoutMethod != null && !payoutMethod.isBlank()) ? payoutMethod.toUpperCase() : "TELEBIRR";
        String payoutRef = "PAYOUT-" + method.substring(0, Math.min(3, method.length())) + "-"
                + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        // 1. Double-entry ledger: Release net payout to provider account
        EscrowLedgerEntry payoutEntry = new EscrowLedgerEntry(
                contractId,
                milestoneId,
                payoutRef,
                "RELEASE_PAYOUT",
                "ESCROW_HOLD_VAULT",
                "PROVIDER_PAYOUT_ACCOUNT",
                netAmount,
                seekerUserId,
                providerUserId,
                BigDecimal.ZERO,
                "Disbursed net provider escrow payout (90%): " + netAmount + " ETB via " + method
        );
        ledgerRepository.save(payoutEntry);

        // 2. Double-entry ledger: Transfer 10% platform service fee to platform revenue account
        EscrowLedgerEntry feeEntry = new EscrowLedgerEntry(
                contractId,
                milestoneId,
                payoutRef,
                "COMMISSION_FEE",
                "ESCROW_HOLD_VAULT",
                "PLATFORM_REVENUE",
                feeAmount,
                seekerUserId,
                providerUserId,
                BigDecimal.ZERO,
                "10% Platform fee collected on milestone: " + feeAmount + " ETB"
        );
        ledgerRepository.save(feeEntry);

        // 3. Record concrete Provider Payout record
        ProviderPayout payout = new ProviderPayout(
                contractId,
                milestoneId,
                providerUserId,
                grossAmount,
                feeAmount,
                netAmount,
                method,
                payoutAccount != null ? payoutAccount : "ACTIVE_MOBILE_WALLET",
                payoutRef,
                "SETTLED"
        );
        ProviderPayout savedPayout = payoutRepository.save(payout);

        auditLogService.log(providerUserId, "ESCROW_PROVIDER_PAYOUT", "ProviderPayout",
                savedPayout.getId().toString(), "Net payout settled: " + netAmount + " ETB, Ref: " + payoutRef, null);
        log.info("Settled Provider Payout: milestone={}, net={} ETB, fee={} ETB, ref={}",
                milestoneId, netAmount, feeAmount, payoutRef);

        return savedPayout;
    }

    public EscrowLedgerEntry recordMilestoneRefund(UUID contractId, UUID milestoneId, UUID seekerUserId,
                                                  UUID providerUserId, BigDecimal amount, String reason) {
        String refundRef = "REFUND-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        EscrowLedgerEntry refundEntry = new EscrowLedgerEntry(
                contractId,
                milestoneId,
                refundRef,
                "REFUND_SEEKER",
                "ESCROW_HOLD_VAULT",
                "SEEKER_REFUND_ACCOUNT",
                amount,
                seekerUserId,
                providerUserId,
                BigDecimal.ZERO,
                "Milestone escrow deposit refunded to seeker: " + amount + " ETB. Reason: " + (reason != null ? reason : "Mediation settlement / dispute resolution")
        );
        EscrowLedgerEntry saved = ledgerRepository.save(refundEntry);
        String entryIdStr = (saved != null && saved.getId() != null) ? saved.getId().toString() : refundRef;
        if (auditLogService != null) {
            auditLogService.log(seekerUserId, "ESCROW_REFUND", "EscrowLedgerEntry",
                    entryIdStr, "Amount refunded: " + amount + " ETB, Reason: " + reason, null);
        }
        log.info("Recorded Escrow REFUND_SEEKER: contract={}, milestone={}, amount={} ETB, ref={}",
                contractId, milestoneId, amount, refundRef);
        return saved != null ? saved : refundEntry;
    }

    public EscrowReconciliationRecord reconcileEscrow() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime start = now.minusDays(30);

        BigDecimal totalHolds = ledgerRepository.sumTotalHolds();
        BigDecimal totalReleased = ledgerRepository.sumTotalReleased();
        BigDecimal totalFees = ledgerRepository.sumTotalFees();
        BigDecimal totalPayouts = payoutRepository.sumTotalSettledPayouts();

        // Active escrow balance in vault: total holds - (net released + fees)
        BigDecimal activeEscrowBalance = totalHolds.subtract(totalReleased).subtract(totalFees);

        // Calculate expected active funded milestones in DB
        List<ContractMilestone> fundedMilestones = milestoneRepository.findAll().stream()
                .filter(m -> "FUNDED".equalsIgnoreCase(m.getStatus()) || "DELIVERED".equalsIgnoreCase(m.getStatus()))
                .toList();

        BigDecimal expectedEscrow = fundedMilestones.stream()
                .map(ContractMilestone::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discrepancy = activeEscrowBalance.subtract(expectedEscrow).abs();
        String status = discrepancy.compareTo(new BigDecimal("0.01")) <= 0 ? "BALANCED" : "DISCREPANCY_DETECTED";

        String notes = "Reconciliation: Active Escrow Vault = " + activeEscrowBalance + " ETB; Expected Milestone Escrow = "
                + expectedEscrow + " ETB; Total Settled Provider Disbursements = " + totalPayouts + " ETB.";

        EscrowReconciliationRecord rec = new EscrowReconciliationRecord(
                start, now, totalHolds, totalReleased, totalFees, totalPayouts, activeEscrowBalance, discrepancy, status, notes
        );
        EscrowReconciliationRecord saved = reconciliationRepository.save(rec);
        log.info("Completed Escrow Reconciliation: status={}, discrepancy={} ETB", status, discrepancy);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<EscrowLedgerEntry> getContractLedger(UUID contractId) {
        return ledgerRepository.findByContractIdOrderByCreatedAtAsc(contractId);
    }

    @Transactional(readOnly = true)
    public List<ProviderPayout> getProviderPayouts(UUID providerUserId) {
        return payoutRepository.findByProviderUserIdOrderByCreatedAtDesc(providerUserId);
    }

    @Transactional(readOnly = true)
    public List<EscrowReconciliationRecord> getReconciliationHistory() {
        return reconciliationRepository.findAllByOrderByCreatedAtDesc();
    }
}
