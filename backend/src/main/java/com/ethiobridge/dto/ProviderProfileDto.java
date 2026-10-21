package com.ethiobridge.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ProviderProfileDto {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private String headline;
    private String bio;
    private Integer yearsExperience;
    private Long locationId;
    private String locationName;
    private String availability;
    private BigDecimal hourlyRate;
    private String categoryFocus;
    private String profileText;
    private String avatarUrl;
    private String portfolioUrl;
    private String education;
    private String languages;
    private Integer connectsBalance;
    private boolean isPro;
    private java.time.OffsetDateTime proExpiresAt;
    private List<ProviderSkillDto> skills = new ArrayList<>();

    public ProviderProfileDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Integer getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(Integer yearsExperience) { this.yearsExperience = yearsExperience; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }

    public String getCategoryFocus() { return categoryFocus; }
    public void setCategoryFocus(String categoryFocus) { this.categoryFocus = categoryFocus; }

    public String getProfileText() { return profileText; }
    public void setProfileText(String profileText) { this.profileText = profileText; }

    public List<ProviderSkillDto> getSkills() { return skills; }
    public void setSkills(List<ProviderSkillDto> skills) { this.skills = skills; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }

    public Integer getConnectsBalance() { return connectsBalance; }
    public void setConnectsBalance(Integer connectsBalance) { this.connectsBalance = connectsBalance; }

    public boolean isPro() { return isPro; }
    public void setPro(boolean pro) { isPro = pro; }

    public java.time.OffsetDateTime getProExpiresAt() { return proExpiresAt; }
    public void setProExpiresAt(java.time.OffsetDateTime proExpiresAt) { this.proExpiresAt = proExpiresAt; }
}
