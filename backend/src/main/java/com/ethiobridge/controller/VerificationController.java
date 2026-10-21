package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.UserVerification;
import com.ethiobridge.service.UserService;
import com.ethiobridge.service.VerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/verification")
public class VerificationController {

    private final VerificationService verificationService;
    private final UserService userService;

    public VerificationController(VerificationService verificationService, UserService userService) {
        this.verificationService = verificationService;
        this.userService = userService;
    }

    @GetMapping("/status")
    public ResponseEntity<UserVerification> getStatus(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(verificationService.getVerificationStatus(user.getId()));
    }

    @PostMapping("/submit")
    public ResponseEntity<UserVerification> submitVerification(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String idType = body.getOrDefault("idType", "FAYDA_NATIONAL_ID");
        String idNumber = body.get("idNumber");
        String phoneNumber = body.get("phoneNumber");
        String documentUrl = body.get("documentUrl");
        String selfieUrl = body.get("selfieUrl");

        UserVerification verif = verificationService.submitVerification(user.getId(), idType, idNumber, phoneNumber, documentUrl, selfieUrl);
        return ResponseEntity.ok(verif);
    }
}
