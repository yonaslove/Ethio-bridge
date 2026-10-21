package com.ethiobridge.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CandidateMatchResultDto {
    private int rank;
    private BigDecimal score;
    private UUID providerProfileId;
    private String displayName;
    private String headline;
    private String bio;
    private String locationName;
    private ExplanationDto explanation;

    public CandidateMatchResultDto() {}

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public UUID getProviderProfileId() { return providerProfileId; }
    public void setProviderProfileId(UUID providerProfileId) { this.providerProfileId = providerProfileId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public ExplanationDto getExplanation() { return explanation; }
    public void setExplanation(ExplanationDto explanation) { this.explanation = explanation; }
}
