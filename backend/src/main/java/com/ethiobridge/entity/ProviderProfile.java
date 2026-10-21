package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "provider_profile")
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    private String headline;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id")
    private Location location;

    private String availability;

    @Column(name = "hourly_rate", precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "category_focus")
    private String categoryFocus = "ANY";

    @Column(name = "profile_text", columnDefinition = "TEXT")
    private String profileText;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    private String education;

    private String languages;

    @Column(name = "connects_balance", nullable = false)
    private Integer connectsBalance = 20;

    @Column(name = "is_pro", nullable = false)
    private boolean isPro = false;

    @Column(name = "pro_expires_at")
    private OffsetDateTime proExpiresAt;

    @OneToMany(mappedBy = "providerProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<ProviderSkill> skills = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public ProviderProfile() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Integer getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(Integer yearsExperience) { this.yearsExperience = yearsExperience; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }

    public String getCategoryFocus() { return categoryFocus; }
    public void setCategoryFocus(String categoryFocus) { this.categoryFocus = categoryFocus; }

    public String getProfileText() { return profileText; }
    public void setProfileText(String profileText) { this.profileText = profileText; }

    public Set<ProviderSkill> getSkills() { return skills; }
    public void setSkills(Set<ProviderSkill> skills) { this.skills = skills; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

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

    public OffsetDateTime getProExpiresAt() { return proExpiresAt; }
    public void setProExpiresAt(OffsetDateTime proExpiresAt) { this.proExpiresAt = proExpiresAt; }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
