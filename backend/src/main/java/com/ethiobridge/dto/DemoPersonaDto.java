package com.ethiobridge.dto;

import java.util.List;
import java.util.UUID;

public class DemoPersonaDto {
    private String id;
    private UUID userId;
    private String name;
    private String email;
    private String roleBadge;
    private String description;
    private List<String> roles;

    public DemoPersonaDto() {}

    public DemoPersonaDto(String id, UUID userId, String name, String email, String roleBadge, String description, List<String> roles) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.roleBadge = roleBadge;
        this.description = description;
        this.roles = roles;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRoleBadge() {
        return roleBadge;
    }

    public void setRoleBadge(String roleBadge) {
        this.roleBadge = roleBadge;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
