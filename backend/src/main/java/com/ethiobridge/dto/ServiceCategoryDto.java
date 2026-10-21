package com.ethiobridge.dto;

public class ServiceCategoryDto {
    private Long id;
    private String slug;
    private String name;
    private String applicableType;
    private Long parentId;

    public ServiceCategoryDto() {}

    public ServiceCategoryDto(Long id, String slug, String name, String applicableType, Long parentId) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.applicableType = applicableType;
        this.parentId = parentId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getApplicableType() { return applicableType; }
    public void setApplicableType(String applicableType) { this.applicableType = applicableType; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
}
