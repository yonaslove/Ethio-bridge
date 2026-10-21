package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "provider_skill")
public class ProviderSkill {

    @EmbeddedId
    private ProviderSkillId id = new ProviderSkillId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("providerProfileId")
    @JoinColumn(name = "provider_profile_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ProviderProfile providerProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("skillId")
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(nullable = true)
    private Integer proficiency; // 1..5

    @Column(name = "years_experience", precision = 4, scale = 1)
    private BigDecimal yearsExperience;

    public ProviderSkill() {}

    public ProviderSkill(ProviderProfile providerProfile, Skill skill, Integer proficiency, BigDecimal yearsExperience) {
        this.providerProfile = providerProfile;
        this.skill = skill;
        this.proficiency = proficiency;
        this.yearsExperience = yearsExperience;
        this.id = new ProviderSkillId(providerProfile.getId(), skill.getId());
    }

    public ProviderSkillId getId() { return id; }
    public void setId(ProviderSkillId id) { this.id = id; }

    public ProviderProfile getProviderProfile() { return providerProfile; }
    public void setProviderProfile(ProviderProfile providerProfile) { this.providerProfile = providerProfile; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }

    public Integer getProficiency() { return proficiency; }
    public void setProficiency(Integer proficiency) { this.proficiency = proficiency; }

    public BigDecimal getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(BigDecimal yearsExperience) { this.yearsExperience = yearsExperience; }
}
