package com.ethiobridge.controller;

import com.ethiobridge.dto.ListingDto;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.SavedListing;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.SavedListingRepository;
import com.ethiobridge.service.ListingService;
import com.ethiobridge.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/saved-listings")
@PreAuthorize("isAuthenticated()")
public class SavedListingController {

    private final SavedListingRepository savedListingRepository;
    private final ListingRepository listingRepository;
    private final ListingService listingService;
    private final UserService userService;

    public SavedListingController(SavedListingRepository savedListingRepository,
                                  ListingRepository listingRepository,
                                  ListingService listingService,
                                  UserService userService) {
        this.savedListingRepository = savedListingRepository;
        this.listingRepository = listingRepository;
        this.listingService = listingService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<ListingDto>> getMySavedListings(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        List<SavedListing> savedList = savedListingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<ListingDto> dtos = savedList.stream()
                .map(sl -> listingService.toListingDto(sl.getListing()))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<Map<String, Object>> saveListing(@PathVariable UUID listingId, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (savedListingRepository.findByUserIdAndListingId(user.getId(), listingId).isEmpty()) {
            savedListingRepository.save(new SavedListing(user.getId(), listing));
        }

        return ResponseEntity.ok(Map.of("saved", true, "listingId", listingId));
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Map<String, Object>> unsaveListing(@PathVariable UUID listingId, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        savedListingRepository.deleteByUserIdAndListingId(user.getId(), listingId);
        return ResponseEntity.ok(Map.of("saved", false, "listingId", listingId));
    }
}
