package com.ethiobridge.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Role is required (SEEKER, PROVIDER, or DUAL)")
    private String role; // "SEEKER", "PROVIDER", or "DUAL"

    private Long locationId;
    private String customLocation;
    private String headline;
    private String bio;
    private List<Long> initialSkillIds;
    private String phoneNumber;
    private String avatarUrl;
    private String portfolioUrl;
    private Integer yearsExperience;
    private java.math.BigDecimal hourlyRate;
    private String availability;
    private String education;
    private String languages;

    public RegisterRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public String getCustomLocation() { return customLocation; }
    public void setCustomLocation(String customLocation) { this.customLocation = customLocation; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public List<Long> getInitialSkillIds() { return initialSkillIds; }
    public void setInitialSkillIds(List<Long> initialSkillIds) { this.initialSkillIds = initialSkillIds; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public Integer getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(Integer yearsExperience) { this.yearsExperience = yearsExperience; }

    public java.math.BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(java.math.BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
}
