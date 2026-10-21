package com.ethiobridge.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ListingSkillId implements Serializable {

    @Column(name = "listing_id")
    private UUID listingId;

    @Column(name = "skill_id")
    private Long skillId;

    public ListingSkillId() {}

    public ListingSkillId(UUID listingId, Long skillId) {
        this.listingId = listingId;
        this.skillId = skillId;
    }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ListingSkillId that)) return false;
        return Objects.equals(listingId, that.listingId) && Objects.equals(skillId, that.skillId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(listingId, skillId);
    }
}
