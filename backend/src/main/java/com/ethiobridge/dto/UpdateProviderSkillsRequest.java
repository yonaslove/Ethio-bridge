package com.ethiobridge.dto;

import java.util.ArrayList;
import java.util.List;

public class UpdateProviderSkillsRequest {
    private List<ProviderSkillInputDto> skills = new ArrayList<>();

    public UpdateProviderSkillsRequest() {}

    public UpdateProviderSkillsRequest(List<ProviderSkillInputDto> skills) {
        this.skills = skills;
    }

    public List<ProviderSkillInputDto> getSkills() { return skills; }
    public void setSkills(List<ProviderSkillInputDto> skills) { this.skills = skills; }
}
