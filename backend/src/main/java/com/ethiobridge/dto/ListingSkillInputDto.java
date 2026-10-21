package com.ethiobridge.dto;

import com.ethiobridge.model.RequirementType;
import java.math.BigDecimal;

public class ListingSkillInputDto {
    private Long skillId;
    private RequirementType requirement = RequirementType.REQUIRED;
    private BigDecimal weight = BigDecimal.valueOf(1.0);

    public ListingSkillInputDto() {}

    public ListingSkillInputDto(Long skillId, RequirementType requirement, BigDecimal weight) {
        this.skillId = skillId;
        this.requirement = requirement;
        this.weight = weight;
    }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public RequirementType getRequirement() { return requirement; }
    public void setRequirement(RequirementType requirement) { this.requirement = requirement; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }
}
