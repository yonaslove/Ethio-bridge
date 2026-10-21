package com.ethiobridge.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MatchRunResponseDto {
    private UUID listingId;
    private String method; // "AI" or "KEYWORD"
    private int k;
    private String model;
    private String modelVersion;
    private int latencyMs;
    private boolean degraded;
    private List<CandidateMatchResultDto> results = new ArrayList<>();

    public MatchRunResponseDto() {}

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public int getK() { return k; }
    public void setK(int k) { this.k = k; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public int getLatencyMs() { return latencyMs; }
    public void setLatencyMs(int latencyMs) { this.latencyMs = latencyMs; }

    public boolean isDegraded() { return degraded; }
    public void setDegraded(boolean degraded) { this.degraded = degraded; }

    public List<CandidateMatchResultDto> getResults() { return results; }
    public void setResults(List<CandidateMatchResultDto> results) { this.results = results; }
}
