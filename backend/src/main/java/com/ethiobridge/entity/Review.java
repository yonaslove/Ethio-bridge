package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "review", uniqueConstraints = {
    @UniqueConstraint(name = "uq_review_listing_reviewer", columnNames = {"listing_id", "reviewer_user_id"})
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "reviewer_user_id", nullable = false)
    private UUID reviewerUserId;

    @Column(name = "reviewee_user_id", nullable = false)
    private UUID revieweeUserId;

    @Column(nullable = false)
    private Integer rating; // 1..5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Review() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public UUID getReviewerUserId() { return reviewerUserId; }
    public void setReviewerUserId(UUID reviewerUserId) { this.reviewerUserId = reviewerUserId; }

    public UUID getRevieweeUserId() { return revieweeUserId; }
    public void setRevieweeUserId(UUID revieweeUserId) { this.revieweeUserId = revieweeUserId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
