package com.ethiobridge.controller;

import com.ethiobridge.dto.AuthResponseDto;
import com.ethiobridge.dto.LoginRequest;
import com.ethiobridge.dto.RegisterRequest;
import com.ethiobridge.dto.UserDto;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.AuthService;
import com.ethiobridge.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequest req) {
        AuthResponseDto resp = authService.login(req);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponseDto resp = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/logout")
    public ResponseEntity<java.util.Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            jakarta.servlet.http.HttpServletRequest request,
            Authentication authentication) {
        String token = authHeader;
        if (token == null && authentication != null && authentication.getCredentials() instanceof String creds) {
            token = creds;
        }
        if (token == null && request != null) {
            token = (String) request.getAttribute("AUTH_SESSION_TOKEN");
        }
        if (token != null) {
            authService.logout(token);
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AppUser user = userService.getOrCreateCurrentUser(authentication);
        return ResponseEntity.ok(userService.toUserDto(user, authentication));
    }
}
