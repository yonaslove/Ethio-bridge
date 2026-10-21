package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.MonetizationService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/monetization")
public class MonetizationController {

    private final MonetizationService monetizationService;
    private final UserService userService;

    public MonetizationController(MonetizationService monetizationService, UserService userService) {
        this.monetizationService = monetizationService;
        this.userService = userService;
    }

    @PostMapping("/connects/topup")
    public ResponseEntity<Map<String, Object>> topUpConnects(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        int amount = body.get("amount") != null ? Integer.parseInt(body.get("amount").toString()) : 10;
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "CHAPA");

        Map<String, Object> response = monetizationService.topUpConnects(user.getId(), amount, paymentMethod);
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/connects/verify/{txRef}", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> verifyConnectsPurchase(
            Authentication authentication,
            @PathVariable String txRef) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        Map<String, Object> response = monetizationService.verifyConnectsTopup(user.getId(), txRef);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/listings/{id}/feature")
    public ResponseEntity<Map<String, Object>> featureListing(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        String paymentMethod = body != null && body.get("paymentMethod") != null ? (String) body.get("paymentMethod") : "TELEBIRR";

        Map<String, Object> response = monetizationService.promoteListingToFeatured(user.getId(), id, paymentMethod);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pro/subscribe")
    public ResponseEntity<Map<String, Object>> subscribePro(
            Authentication authentication,
            @RequestBody(required = false) Map<String, Object> body) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        String paymentMethod = body != null && body.get("paymentMethod") != null ? (String) body.get("paymentMethod") : "TELEBIRR";

        Map<String, Object> response = monetizationService.subscribeToPro(user.getId(), paymentMethod);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMonetizationStats(Authentication authentication) {
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return ResponseEntity.ok(monetizationService.getMonetizationStats());
    }
}
