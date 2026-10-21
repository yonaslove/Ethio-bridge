package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.SavedSearch;
import com.ethiobridge.service.SavedSearchService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/saved-searches")
public class SavedSearchController {

    private final SavedSearchService savedSearchService;
    private final UserService userService;

    public SavedSearchController(SavedSearchService savedSearchService, UserService userService) {
        this.savedSearchService = savedSearchService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<SavedSearch>> getMySavedSearches(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(savedSearchService.getUserSavedSearches(user.getId()));
    }

    @PostMapping
    public ResponseEntity<SavedSearch> createSavedSearch(@RequestBody SavedSearch search, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        SavedSearch saved = savedSearchService.createSavedSearch(user.getId(), search);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedSearch(@PathVariable UUID id, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        savedSearchService.deleteSavedSearch(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
