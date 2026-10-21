package com.ethiobridge.repository;

import com.ethiobridge.entity.ListingSkill;
import com.ethiobridge.entity.ListingSkillId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ListingSkillRepository extends JpaRepository<ListingSkill, ListingSkillId> {
    List<ListingSkill> findByIdListingId(UUID listingId);
    void deleteByIdListingId(UUID listingId);
}
