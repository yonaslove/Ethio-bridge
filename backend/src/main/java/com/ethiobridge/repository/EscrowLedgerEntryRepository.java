package com.ethiobridge.repository;

import com.ethiobridge.entity.EscrowLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface EscrowLedgerEntryRepository extends JpaRepository<EscrowLedgerEntry, UUID> {
    List<EscrowLedgerEntry> findByContractIdOrderByCreatedAtAsc(UUID contractId);
    List<EscrowLedgerEntry> findByMilestoneIdOrderByCreatedAtAsc(UUID milestoneId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EscrowLedgerEntry e WHERE e.entryType = 'DEPOSIT_HOLD'")
    BigDecimal sumTotalHolds();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EscrowLedgerEntry e WHERE e.entryType = 'RELEASE_PAYOUT'")
    BigDecimal sumTotalReleased();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM EscrowLedgerEntry e WHERE e.entryType = 'COMMISSION_FEE'")
    BigDecimal sumTotalFees();
}
