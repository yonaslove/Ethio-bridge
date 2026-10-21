package com.ethiobridge.dto;

import com.ethiobridge.model.RequirementType;
import java.math.BigDecimal;

public class ListingSkillDto {
    private Long skillId;
    private String skillName;
    private String skillSlug;
    private RequirementType requirement;
    private BigDecimal weight;

    public ListingSkillDto() {}

    public ListingSkillDto(Long skillId, String skillName, String skillSlug, RequirementType requirement, BigDecimal weight) {
        this.skillId = skillId;
        this.skillName = skillName;
        this.skillSlug = skillSlug;
        this.requirement = requirement;
        this.weight = weight;
    }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillSlug() { return skillSlug; }
    public void setSkillSlug(String skillSlug) { this.skillSlug = skillSlug; }

    public RequirementType getRequirement() { return requirement; }
    public void setRequirement(RequirementType requirement) { this.requirement = requirement; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
}
