package com.ethiobridge.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ReviewDto {
    private UUID id;
    private UUID listingId;
    private UUID reviewerUserId;
    private String reviewerName;
    private UUID revieweeUserId;
    private Integer rating;
    private String comment;
    private OffsetDateTime createdAt;

    public ReviewDto() {}

    public ReviewDto(UUID id, UUID listingId, UUID reviewerUserId, String reviewerName, UUID revieweeUserId, Integer rating, String comment, OffsetDateTime createdAt) {
        this.id = id;
        this.listingId = listingId;
        this.reviewerUserId = reviewerUserId;
        this.reviewerName = reviewerName;
        this.revieweeUserId = revieweeUserId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public UUID getReviewerUserId() { return reviewerUserId; }
    public void setReviewerUserId(UUID reviewerUserId) { this.reviewerUserId = reviewerUserId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public UUID getRevieweeUserId() { return revieweeUserId; }
    public void setRevieweeUserId(UUID revieweeUserId) { this.revieweeUserId = revieweeUserId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
