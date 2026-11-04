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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

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

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "refreshToken is required");
        }
        AuthResponseDto resp = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String identifier = body.get("identifier");
        if (identifier == null || identifier.isBlank()) {
            identifier = body.get("email");
        }
        authService.sendPasswordReset(identifier);
        return ResponseEntity.ok(Map.of("message", "If an account matches that identifier, password reset instructions have been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password has been successfully reset. Please log in with your new password."));
    }

    @PostMapping("/send-phone-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> sendPhoneOtp(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String phone = body.get("phoneNumber");
        if (phone == null || phone.isBlank()) {
            phone = user.getPhoneNumber();
        }
        String masked = authService.sendPhoneVerification(user.getId(), phone);
        return ResponseEntity.ok(Map.of("message", "Verification OTP sent to " + masked));
    }

    @PostMapping("/verify-phone-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> verifyPhoneOtp(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String phone = body.get("phoneNumber");
        if (phone == null || phone.isBlank()) {
            phone = user.getPhoneNumber();
        }
        String code = body.get("code");
        boolean ok = authService.verifyPhoneCode(user.getId(), phone, code);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP code");
        }
        return ResponseEntity.ok(Map.of("verified", true, "message", "Phone number verified successfully"));
    }

    @DeleteMapping("/account")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> deleteAccount(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        authService.deleteAccount(user.getId());
        return ResponseEntity.ok(Map.of("message", "Account successfully deactivated and personal data anonymized"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
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
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
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
