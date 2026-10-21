package com.ethiobridge.entity;

import com.ethiobridge.model.RequirementType;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "listing_skill")
public class ListingSkill {

    @EmbeddedId
    private ListingSkillId id = new ListingSkillId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("listingId")
    @JoinColumn(name = "listing_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Listing listing;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("skillId")
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequirementType requirement = RequirementType.REQUIRED;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal weight = BigDecimal.valueOf(1.0);

    public ListingSkill() {}

    public ListingSkill(Listing listing, Skill skill, RequirementType requirement, BigDecimal weight) {
        this.listing = listing;
        this.skill = skill;
        this.requirement = requirement;
        this.weight = weight;
        this.id = new ListingSkillId(listing.getId(), skill.getId());
    }

    public ListingSkillId getId() { return id; }
    public void setId(ListingSkillId id) { this.id = id; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }

    public RequirementType getRequirement() { return requirement; }
    public void setRequirement(RequirementType requirement) { this.requirement = requirement; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ListingSkill that)) return false;
        return java.util.Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(id);
    }
}
