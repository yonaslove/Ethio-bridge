package com.ethiobridge.repository;

import com.ethiobridge.entity.ProviderProfile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, UUID>, JpaSpecificationExecutor<ProviderProfile> {
    Optional<ProviderProfile> findByUserId(UUID userId);

    @Query("select p from ProviderProfile p where (p.availability is null or upper(p.availability) <> 'UNAVAILABLE') and p.userId <> :excludeUserId")
    List<ProviderProfile> findMatchPool(@Param("excludeUserId") UUID excludeUserId, Pageable pageable);
}
