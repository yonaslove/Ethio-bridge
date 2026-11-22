package com.ethiobridge.controller;

import com.ethiobridge.dto.*;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.ApplicationService;
import com.ethiobridge.service.MatchingService;
import com.ethiobridge.service.ProfileService;
import com.ethiobridge.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final UserService userService;
    private final ProfileService profileService;
    private final ApplicationService applicationService;
    private final MatchingService matchingService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.ethiobridge.repository.AppUserRepository appUserRepository;
    private final com.ethiobridge.service.ComplianceService complianceService;

    public MeController(UserService userService,
                        ProfileService profileService,
                        ApplicationService applicationService,
                        MatchingService matchingService,
                        org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                        com.ethiobridge.repository.AppUserRepository appUserRepository,
                        com.ethiobridge.service.ComplianceService complianceService) {
        this.userService = userService;
        this.profileService = profileService;
        this.applicationService = applicationService;
        this.matchingService = matchingService;
        this.passwordEncoder = passwordEncoder;
        this.appUserRepository = appUserRepository;
        this.complianceService = complianceService;
    }

    @GetMapping
    public UserDto getCurrentUser(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return userService.toUserDto(user, authentication);
    }

    @GetMapping("/provider-profile")
    public ProviderProfileDto getProviderProfile(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return profileService.getProviderProfile(user.getId());
    }

    @PutMapping("/provider-profile")
    public ProviderProfileDto updateProviderProfile(Authentication authentication, @RequestBody ProviderProfileDto dto) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return profileService.updateProviderProfile(user.getId(), dto);
    }

    @PutMapping("/provider-profile/skills")
    public ProviderProfileDto updateProviderSkills(Authentication authentication, @RequestBody UpdateProviderSkillsRequest request) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return profileService.updateProviderSkills(user.getId(), request);
    }

    @GetMapping("/seeker-profile")
    public SeekerProfileDto getSeekerProfile(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return profileService.getSeekerProfile(user.getId());
    }

    @PutMapping("/seeker-profile")
    public SeekerProfileDto updateSeekerProfile(Authentication authentication, @RequestBody SeekerProfileDto dto) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return profileService.updateSeekerProfile(user.getId(), dto);
    }

    @GetMapping("/applications")
    public List<ApplicationDto> getMyApplications(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return applicationService.getMyApplications(user.getId());
    }

    @GetMapping("/recommended-listings")
    public List<ListingDto> getRecommendedListings(Authentication authentication,
                                                   @RequestParam(defaultValue = "ai") String method,
                                                   @RequestParam(defaultValue = "10") int k) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return matchingService.getRecommendedListingsForProvider(user.getId(), method, k);
    }

    @PutMapping("/password")
    public org.springframework.http.ResponseEntity<java.util.Map<String, String>> changePassword(
            Authentication authentication,
            @RequestBody java.util.Map<String, String> body) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 6) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "New password must be at least 6 characters");
        }

        if (user.getPasswordHash() != null && !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        appUserRepository.save(user);

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Password updated successfully"));
    }

    @GetMapping("/export")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> exportData(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return org.springframework.http.ResponseEntity.ok(complianceService.exportUserData(user.getId()));
    }
}
