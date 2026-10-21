package com.ethiobridge.dto;

public class SkillDto {
    private Long id;
    private String slug;
    private String name;
    private String category;
    private boolean isActive;

    public SkillDto() {}

    public SkillDto(Long id, String slug, String name, String category, boolean isActive) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.category = category;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
