package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_search")
public class SavedSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String title;

    @Column(name = "query_text")
    private String queryText;

    @Column(name = "service_category_id")
    private Long serviceCategoryId;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "min_budget", precision = 12, scale = 2)
    private BigDecimal minBudget;

    @Column(name = "max_budget", precision = 12, scale = 2)
    private BigDecimal maxBudget;

    @Column(name = "listing_type")
    private String listingType;

    @Column(name = "notify_email", nullable = false)
    private boolean notifyEmail = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public SavedSearch() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getQueryText() { return queryText; }
    public void setQueryText(String queryText) { this.queryText = queryText; }

    public Long getServiceCategoryId() { return serviceCategoryId; }
    public void setServiceCategoryId(Long serviceCategoryId) { this.serviceCategoryId = serviceCategoryId; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public BigDecimal getMinBudget() { return minBudget; }
    public void setMinBudget(BigDecimal minBudget) { this.minBudget = minBudget; }

    public BigDecimal getMaxBudget() { return maxBudget; }
    public void setMaxBudget(BigDecimal maxBudget) { this.maxBudget = maxBudget; }

    public String getListingType() { return listingType; }
    public void setListingType(String listingType) { this.listingType = listingType; }

    public boolean isNotifyEmail() { return notifyEmail; }
    public void setNotifyEmail(boolean notifyEmail) { this.notifyEmail = notifyEmail; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
