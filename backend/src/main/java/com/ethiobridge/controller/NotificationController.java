package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Notification;
import com.ethiobridge.service.NotificationService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }
}
