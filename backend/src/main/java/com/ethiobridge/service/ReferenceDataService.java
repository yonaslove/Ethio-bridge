package com.ethiobridge.service;

import com.ethiobridge.dto.LocationDto;
import com.ethiobridge.dto.ServiceCategoryDto;
import com.ethiobridge.dto.SkillDto;
import com.ethiobridge.entity.Location;
import com.ethiobridge.entity.ServiceCategory;
import com.ethiobridge.entity.Skill;
import com.ethiobridge.repository.LocationRepository;
import com.ethiobridge.repository.ServiceCategoryRepository;
import com.ethiobridge.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReferenceDataService {

    private final SkillRepository skillRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final LocationRepository locationRepository;

    public ReferenceDataService(SkillRepository skillRepository,
                                  ServiceCategoryRepository serviceCategoryRepository,
                                  LocationRepository locationRepository) {
        this.skillRepository = skillRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.locationRepository = locationRepository;
    }

    public List<SkillDto> searchSkills(String query) {
        List<Skill> skills;
        if (query != null && !query.isBlank()) {
            skills = skillRepository.findByIsActiveTrueAndNameContainingIgnoreCase(query.trim());
        } else {
            skills = skillRepository.findByIsActiveTrue();
        }
        return skills.stream()
                .map(s -> new SkillDto(s.getId(), s.getSlug(), s.getName(), s.getCategory().name(), s.isActive()))
                .toList();
    }

    public List<ServiceCategoryDto> getCategories(String type) {
        List<ServiceCategory> categories;
        if (type != null && !type.isBlank()) {
            categories = serviceCategoryRepository.findByApplicableTypeIn(List.of(type.trim().toUpperCase(), "ANY"));
        } else {
            categories = serviceCategoryRepository.findAll();
        }
        return categories.stream()
                .map(c -> new ServiceCategoryDto(c.getId(), c.getSlug(), c.getName(), c.getApplicableType(), c.getParentId()))
                .toList();
    }

    public List<LocationDto> searchLocations(String query) {
        List<Location> locations;
        if (query != null && !query.isBlank()) {
            String q = query.trim();
            locations = locationRepository.findByNameContainingIgnoreCaseOrRegionContainingIgnoreCase(q, q);
        } else {
            locations = locationRepository.findAll();
        }
        return locations.stream()
                .map(l -> new LocationDto(l.getId(), l.getName(), l.getRegion(), l.getCountry(), l.getLatitude(), l.getLongitude()))
                .toList();
    }
}
