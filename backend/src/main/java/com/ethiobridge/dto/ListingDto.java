package com.ethiobridge.dto;

import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.model.ListingType;
import com.ethiobridge.model.Seniority;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ListingDto {
    private UUID id;
    private UUID ownerUserId;
    private String ownerName;
    private ListingType listingType;
    private String title;
    private String description;
    private Long serviceCategoryId;
    private String serviceCategoryName;
    private Long locationId;
    private String locationName;
    private boolean isRemote;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String currency;
    private String availabilityRequired;
    private Seniority seniority;
    private ListingStatus status;
    private List<ListingSkillDto> skills = new ArrayList<>();
    private OffsetDateTime publishedAt;
    private OffsetDateTime createdAt;
    private boolean isFeatured;
    private OffsetDateTime featuredUntil;

    public ListingDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public ListingType getListingType() { return listingType; }
    public void setListingType(ListingType listingType) { this.listingType = listingType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getServiceCategoryId() { return serviceCategoryId; }
    public void setServiceCategoryId(Long serviceCategoryId) { this.serviceCategoryId = serviceCategoryId; }

    public String getServiceCategoryName() { return serviceCategoryName; }
    public void setServiceCategoryName(String serviceCategoryName) { this.serviceCategoryName = serviceCategoryName; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public boolean isRemote() { return isRemote; }
    public void setRemote(boolean remote) { isRemote = remote; }

    public BigDecimal getBudgetMin() { return budgetMin; }
    public void setBudgetMin(BigDecimal budgetMin) { this.budgetMin = budgetMin; }

    public BigDecimal getBudgetMax() { return budgetMax; }
    public void setBudgetMax(BigDecimal budgetMax) { this.budgetMax = budgetMax; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getAvailabilityRequired() { return availabilityRequired; }
    public void setAvailabilityRequired(String availabilityRequired) { this.availabilityRequired = availabilityRequired; }

    public Seniority getSeniority() { return seniority; }
    public void setSeniority(Seniority seniority) { this.seniority = seniority; }

    public ListingStatus getStatus() { return status; }
    public void setStatus(ListingStatus status) { this.status = status; }

    public List<ListingSkillDto> getSkills() { return skills; }
    public void setSkills(List<ListingSkillDto> skills) { this.skills = skills; }

    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFeatured() { return isFeatured; }
    public void setFeatured(boolean featured) { isFeatured = featured; }

    public OffsetDateTime getFeaturedUntil() { return featuredUntil; }
    public void setFeaturedUntil(OffsetDateTime featuredUntil) { this.featuredUntil = featuredUntil; }
}
