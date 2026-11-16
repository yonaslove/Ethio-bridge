package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.SavedListing;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.SavedListingRepository;
import com.ethiobridge.service.ListingService;
import com.ethiobridge.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SavedListingControllerTest {

    @Mock
    private SavedListingRepository savedListingRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ListingService listingService;

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private SavedListingController savedListingController;

    private AppUser user;
    private Listing listing;

    @BeforeEach
    void setUp() {
        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("user@ethiobridge.et");

        listing = new Listing();
        listing.setId(UUID.randomUUID());
        listing.setTitle("Fullstack Spring Boot Engineer");

        when(userService.getOrCreateCurrentUser(authentication)).thenReturn(user);
    }

    @Test
    @DisplayName("Should successfully save a listing when not previously saved")
    void testSaveListingSuccess() {
        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
        when(savedListingRepository.findByUserIdAndListingId(user.getId(), listing.getId())).thenReturn(Optional.empty());

        ResponseEntity<Map<String, Object>> response = savedListingController.saveListing(listing.getId(), authentication);

        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().get("saved"));
        assertEquals(listing.getId(), response.getBody().get("listingId"));
        verify(savedListingRepository, times(1)).save(any(SavedListing.class));
    }

    @Test
    @DisplayName("Should not create duplicate saved listing record if already bookmarked")
    void testSaveListingIdempotentDuplicate() {
        SavedListing existing = new SavedListing(user.getId(), listing);
        when(listingRepository.findById(listing.getId())).thenReturn(Optional.of(listing));
        when(savedListingRepository.findByUserIdAndListingId(user.getId(), listing.getId())).thenReturn(Optional.of(existing));

        ResponseEntity<Map<String, Object>> response = savedListingController.saveListing(listing.getId(), authentication);

        assertNotNull(response.getBody());
        assertEquals(true, response.getBody().get("saved"));
        verify(savedListingRepository, never()).save(any(SavedListing.class));
    }

    @Test
    @DisplayName("Should delete bookmark on unsaveListing")
    void testUnsaveListing() {
        ResponseEntity<Map<String, Object>> response = savedListingController.unsaveListing(listing.getId(), authentication);

        assertNotNull(response.getBody());
        assertEquals(false, response.getBody().get("saved"));
        verify(savedListingRepository, times(1)).deleteByUserIdAndListingId(user.getId(), listing.getId());
    }
}
