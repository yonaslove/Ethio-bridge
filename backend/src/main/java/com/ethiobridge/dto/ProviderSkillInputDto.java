package com.ethiobridge.dto;

import java.math.BigDecimal;

public class ProviderSkillInputDto {
    private Long skillId;
    private Integer proficiency;
    private BigDecimal yearsExperience;

    public ProviderSkillInputDto() {}

    public ProviderSkillInputDto(Long skillId, Integer proficiency, BigDecimal yearsExperience) {
        this.skillId = skillId;
        this.proficiency = proficiency;
        this.yearsExperience = yearsExperience;
    }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public Integer getProficiency() { return proficiency; }
    public void setProficiency(Integer proficiency) { this.proficiency = proficiency; }

    public BigDecimal getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(BigDecimal yearsExperience) { this.yearsExperience = yearsExperience; }
}
