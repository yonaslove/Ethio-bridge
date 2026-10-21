package com.ethiobridge.controller;

import com.ethiobridge.dto.LocationDto;
import com.ethiobridge.dto.ServiceCategoryDto;
import com.ethiobridge.dto.SkillDto;
import com.ethiobridge.service.ReferenceDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ReferenceDataController {

    private final ReferenceDataService referenceDataService;

    public ReferenceDataController(ReferenceDataService referenceDataService) {
        this.referenceDataService = referenceDataService;
    }

    @GetMapping("/skills")
    public List<SkillDto> getSkills(@RequestParam(required = false) String query) {
        return referenceDataService.searchSkills(query);
    }

    @GetMapping("/categories")
    public List<ServiceCategoryDto> getCategories(@RequestParam(required = false) String type) {
        return referenceDataService.getCategories(type);
    }

    @GetMapping("/locations")
    public List<LocationDto> getLocations(@RequestParam(required = false) String query) {
        return referenceDataService.searchLocations(query);
    }
}
