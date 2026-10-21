package com.ethiobridge.repository;

import com.ethiobridge.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByNameContainingIgnoreCaseOrRegionContainingIgnoreCase(String name, String region);
}
