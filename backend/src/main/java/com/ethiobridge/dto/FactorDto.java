package com.ethiobridge.dto;

public class FactorDto {
    private String name;
    private Object value;
    private Double weight;
    private Double contribution;
    private String detail;

    public FactorDto() {}

    public FactorDto(String name, Object value, Double weight, Double contribution, String detail) {
        this.name = name;
        this.value = value;
        this.weight = weight;
        this.contribution = contribution;
        this.detail = detail;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Object getValue() { return value; }
    public void setValue(Object value) { this.value = value; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getContribution() { return contribution; }
    public void setContribution(Double contribution) { this.contribution = contribution; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
}
