package com.ethiobridge.entity;

import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.model.ListingType;
import com.ethiobridge.model.Seniority;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "listing")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "listing_type", nullable = false)
    private ListingType listingType;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_category_id")
    private ServiceCategory serviceCategory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "is_remote", nullable = false)
    private boolean isRemote = false;

    @Column(name = "budget_min", precision = 12, scale = 2)
    private BigDecimal budgetMin;

    @Column(name = "budget_max", precision = 12, scale = 2)
    private BigDecimal budgetMax;

    @Column(nullable = false)
    private String currency = "ETB";

    @Column(name = "availability_required")
    private String availabilityRequired = "FULL_TIME";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Seniority seniority = Seniority.ANY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus status = ListingStatus.DRAFT;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "is_featured", nullable = false)
    private boolean isFeatured = false;

    @Column(name = "featured_until")
    private OffsetDateTime featuredUntil;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<ListingSkill> skills = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public Listing() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public ListingType getListingType() { return listingType; }
    public void setListingType(ListingType listingType) { this.listingType = listingType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ServiceCategory getServiceCategory() { return serviceCategory; }
    public void setServiceCategory(ServiceCategory serviceCategory) { this.serviceCategory = serviceCategory; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

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

    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public Set<ListingSkill> getSkills() { return skills; }
    public void setSkills(Set<ListingSkill> skills) { this.skills = skills; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isFeatured() { return isFeatured; }
    public void setFeatured(boolean featured) { isFeatured = featured; }

    public OffsetDateTime getFeaturedUntil() { return featuredUntil; }
    public void setFeaturedUntil(OffsetDateTime featuredUntil) { this.featuredUntil = featuredUntil; }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
