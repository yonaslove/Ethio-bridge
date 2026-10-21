package com.ethiobridge.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "match_result", uniqueConstraints = {
    @UniqueConstraint(name = "uq_match_result_run_rank", columnNames = {"match_run_id", "rank"})
})
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_run_id", nullable = false)
    private MatchRun matchRun;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_profile_id", nullable = false)
    private ProviderProfile providerProfile;

    @Column(nullable = false)
    private Integer rank;

    @Column(nullable = false, precision = 8, scale = 6)
    private BigDecimal score;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "explanation", columnDefinition = "jsonb")
    private String explanation;

    public MatchResult() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MatchRun getMatchRun() { return matchRun; }
    public void setMatchRun(MatchRun matchRun) { this.matchRun = matchRun; }

    public ProviderProfile getProviderProfile() { return providerProfile; }
    public void setProviderProfile(ProviderProfile providerProfile) { this.providerProfile = providerProfile; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}
