package com.ethiobridge.repository;

import com.ethiobridge.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {
    @Query("SELECT c FROM Contract c WHERE c.seekerUserId = :userId OR c.providerUserId = :userId ORDER BY c.createdAt DESC")
    List<Contract> findUserContracts(@Param("userId") UUID userId);

    Optional<Contract> findByListingIdAndApplicationId(UUID listingId, UUID applicationId);
}
