package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.ServiceBookingService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@PreAuthorize("isAuthenticated()")
public class ServiceBookingController {

    private final ServiceBookingService bookingService;
    private final UserService userService;

    public ServiceBookingController(ServiceBookingService bookingService, UserService userService) {
        this.bookingService = bookingService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(@RequestBody Map<String, Object> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        Map<String, Object> created = bookingService.createBooking(user.getId(), body);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyBookings(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(bookingService.getUserBookings(user.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable UUID id,
                                                            @RequestBody Map<String, String> body,
                                                            Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String status = body.get("status");
        String reason = body.get("reason");
        Map<String, Object> updated = bookingService.updateBookingStatus(user.getId(), id, status, reason);
        return ResponseEntity.ok(updated);
    }
}
