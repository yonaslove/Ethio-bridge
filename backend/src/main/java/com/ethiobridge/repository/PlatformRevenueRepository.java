package com.ethiobridge.repository;

import com.ethiobridge.entity.PlatformRevenue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformRevenueRepository extends JpaRepository<PlatformRevenue, UUID> {
    List<PlatformRevenue> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(p.feeAmount), 0) FROM PlatformRevenue p")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(p.feeAmount), 0) FROM PlatformRevenue p WHERE p.sourceType = :sourceType")
    BigDecimal sumRevenueBySourceType(String sourceType);
}
