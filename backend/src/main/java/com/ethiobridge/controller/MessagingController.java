package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Message;
import com.ethiobridge.entity.MessageThread;
import com.ethiobridge.service.MessagingService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
public class MessagingController {

    private final MessagingService messagingService;
    private final UserService userService;

    public MessagingController(MessagingService messagingService, UserService userService) {
        this.messagingService = messagingService;
        this.userService = userService;
    }

    @GetMapping("/threads")
    public ResponseEntity<List<Map<String, Object>>> getMyThreads(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(messagingService.getUserThreads(user.getId()));
    }

    @PostMapping("/threads")
    public ResponseEntity<MessageThread> createOrGetThread(@RequestBody Map<String, Object> req, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        UUID recipientId = UUID.fromString(req.get("recipientUserId").toString());
        UUID listingId = null;
        if (req.get("listingId") != null && !req.get("listingId").toString().isBlank() && !"null".equalsIgnoreCase(req.get("listingId").toString())) {
            listingId = UUID.fromString(req.get("listingId").toString());
        }
        String subject = (String) req.getOrDefault("subject", "Inquiry");

        MessageThread thread = messagingService.getOrCreateThread(user.getId(), recipientId, listingId, subject);
        return ResponseEntity.ok(thread);
    }

    @GetMapping("/threads/{id}")
    public ResponseEntity<List<Message>> getThreadMessages(@PathVariable UUID id, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(messagingService.getThreadMessages(id, user.getId()));
    }

    @PostMapping("/threads/{id}")
    public ResponseEntity<Message> sendMessage(@PathVariable UUID id, @RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String content = body.get("content");
        Message msg = messagingService.sendMessage(id, user.getId(), content);
        return ResponseEntity.ok(msg);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        long count = messagingService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
