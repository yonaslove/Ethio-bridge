package com.ethiobridge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

public class UserDto {
    private UUID userId;
    private UUID keycloakSubject;
    private String email;
    private String fullName;
    private List<String> roles;
    private String status;
    private String phoneNumber;

    @JsonProperty("isVerified")
    private boolean isVerified;

    @JsonProperty("phoneVerified")
    private boolean phoneVerified;

    private String avatarUrl;

    public UserDto() {}

    public UserDto(UUID userId, UUID keycloakSubject, String email, String fullName, List<String> roles, String status) {
        this.userId = userId;
        this.keycloakSubject = keycloakSubject;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.status = status;
    }

    public UserDto(UUID userId, UUID keycloakSubject, String email, String fullName, List<String> roles, String status, String phoneNumber, boolean isVerified, boolean phoneVerified) {
        this(userId, keycloakSubject, email, fullName, roles, status, phoneNumber, isVerified, phoneVerified, null);
    }

    public UserDto(UUID userId, UUID keycloakSubject, String email, String fullName, List<String> roles, String status, String phoneNumber, boolean isVerified, boolean phoneVerified, String avatarUrl) {
        this.userId = userId;
        this.keycloakSubject = keycloakSubject;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.status = status;
        this.phoneNumber = phoneNumber;
        this.isVerified = isVerified;
        this.phoneVerified = phoneVerified;
        this.avatarUrl = avatarUrl;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getKeycloakSubject() { return keycloakSubject; }
    public void setKeycloakSubject(UUID keycloakSubject) { this.keycloakSubject = keycloakSubject; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    @JsonProperty("isVerified")
    public boolean isVerified() { return isVerified; }

    @JsonProperty("isVerified")
    public void setVerified(boolean verified) { isVerified = verified; }

    @JsonProperty("verified")
    public boolean getVerified() { return isVerified; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
