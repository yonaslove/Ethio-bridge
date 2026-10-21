package com.ethiobridge.dto;

import java.math.BigDecimal;

public class ProviderSkillDto {
    private Long skillId;
    private String skillName;
    private String skillSlug;
    private String category;
    private Integer proficiency;
    private BigDecimal yearsExperience;

    public ProviderSkillDto() {}

    public ProviderSkillDto(Long skillId, String skillName, String skillSlug, String category, Integer proficiency, BigDecimal yearsExperience) {
        this.skillId = skillId;
        this.skillName = skillName;
        this.skillSlug = skillSlug;
        this.category = category;
        this.proficiency = proficiency;
        this.yearsExperience = yearsExperience;
    }

    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getSkillSlug() { return skillSlug; }
    public void setSkillSlug(String skillSlug) { this.skillSlug = skillSlug; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getProficiency() { return proficiency; }
    public void setProficiency(Integer proficiency) { this.proficiency = proficiency; }

    public BigDecimal getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(BigDecimal yearsExperience) { this.yearsExperience = yearsExperience; }
}
