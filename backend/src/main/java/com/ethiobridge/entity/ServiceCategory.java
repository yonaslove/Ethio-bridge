package com.ethiobridge.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "service_category")
public class ServiceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(name = "applicable_type", nullable = false)
    private String applicableType;

    @Column(name = "parent_id")
    private Long parentId;

    public ServiceCategory() {}

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
