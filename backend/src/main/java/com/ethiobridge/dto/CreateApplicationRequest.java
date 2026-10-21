package com.ethiobridge.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class CreateApplicationRequest {
    @Size(max = 2000, message = "Cover note cannot exceed 2000 characters")
    private String coverNote;

    @DecimalMin(value = "0.0", inclusive = true, message = "Proposed rate must be non-negative")
    private BigDecimal proposedRate;

    public CreateApplicationRequest() {}

    public CreateApplicationRequest(String coverNote, BigDecimal proposedRate) {
        this.coverNote = coverNote;
        this.proposedRate = proposedRate;
    }

    public String getCoverNote() { return coverNote; }
    public void setCoverNote(String coverNote) { this.coverNote = coverNote; }

    public BigDecimal getProposedRate() { return proposedRate; }
    public void setProposedRate(BigDecimal proposedRate) { this.proposedRate = proposedRate; }
}
