package com.ethiobridge.dto;

import java.util.ArrayList;
import java.util.List;

public class ExplanationDto {
    private String summary;
    private List<FactorDto> factors = new ArrayList<>();

    public ExplanationDto() {}

    public ExplanationDto(String summary, List<FactorDto> factors) {
        this.summary = summary;
        this.factors = factors;
    }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<FactorDto> getFactors() { return factors; }
    public void setFactors(List<FactorDto> factors) { this.factors = factors; }
}
