package com.ethiobridge.controller;

import com.ethiobridge.dto.ApplicationDto;
import com.ethiobridge.dto.UpdateApplicationStatusRequest;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.ApplicationService;
import com.ethiobridge.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserService userService;

    public ApplicationController(ApplicationService applicationService, UserService userService) {
        this.applicationService = applicationService;
        this.userService = userService;
    }

    @PatchMapping("/{id}/status")
    public ApplicationDto updateStatus(Authentication authentication,
                                       @PathVariable UUID id,
                                       @Valid @RequestBody UpdateApplicationStatusRequest req) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return applicationService.updateStatus(user.getId(), id, req.getStatus());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> withdrawApplication(Authentication authentication, @PathVariable UUID id) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        applicationService.withdrawApplication(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
