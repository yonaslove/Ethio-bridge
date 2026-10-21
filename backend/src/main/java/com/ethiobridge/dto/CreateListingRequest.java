package com.ethiobridge.dto;

import com.ethiobridge.model.ListingType;
import com.ethiobridge.model.Seniority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CreateListingRequest {

    @NotNull(message = "listingType is required")
    private ListingType listingType;

    @NotBlank(message = "title must not be blank")
    private String title;

    @NotBlank(message = "description must not be blank")
    private String description;

    private Long serviceCategoryId;
    private Long locationId;
    private boolean isRemote = false;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String currency = "ETB";
    private String availabilityRequired = "FULL_TIME";
    private Seniority seniority = Seniority.ANY;
    private List<ListingSkillInputDto> skills = new ArrayList<>();

    public CreateListingRequest() {}

    public ListingType getListingType() { return listingType; }
    public void setListingType(ListingType listingType) { this.listingType = listingType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getServiceCategoryId() { return serviceCategoryId; }
    public void setServiceCategoryId(Long serviceCategoryId) { this.serviceCategoryId = serviceCategoryId; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

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

    public List<ListingSkillInputDto> getSkills() { return skills; }
    public void setSkills(List<ListingSkillInputDto> skills) { this.skills = skills; }
}
