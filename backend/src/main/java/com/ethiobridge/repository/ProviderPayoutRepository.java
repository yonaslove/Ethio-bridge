package com.ethiobridge.repository;

import com.ethiobridge.entity.ProviderPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderPayoutRepository extends JpaRepository<ProviderPayout, UUID> {
    List<ProviderPayout> findByProviderUserIdOrderByCreatedAtDesc(UUID providerUserId);
    List<ProviderPayout> findByContractIdOrderByCreatedAtDesc(UUID contractId);
    Optional<ProviderPayout> findByPayoutReference(String payoutReference);
    Optional<ProviderPayout> findByMilestoneId(UUID milestoneId);

    @Query("SELECT COALESCE(SUM(p.netAmount), 0) FROM ProviderPayout p WHERE p.status = 'SETTLED'")
    BigDecimal sumTotalSettledPayouts();
}
