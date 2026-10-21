package com.ethiobridge.repository;

import com.ethiobridge.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    List<MatchResult> findByMatchRunIdOrderByRankAsc(UUID matchRunId);
}
