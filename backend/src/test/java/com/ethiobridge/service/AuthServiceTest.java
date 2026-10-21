package com.ethiobridge.service;

import com.ethiobridge.dto.AuthResponseDto;
import com.ethiobridge.dto.LoginRequest;
import com.ethiobridge.dto.RegisterRequest;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private SeekerProfileRepository seekerProfileRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private ProviderSkillRepository providerSkillRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                appUserRepository,
                seekerProfileRepository,
                providerProfileRepository,
                skillRepository,
                providerSkillRepository,
                locationRepository,
                passwordEncoder
        );
    }

    @Test
    @DisplayName("validatePasswordPolicy accepts strong password and rejects weak passwords")
    void testPasswordPolicyValidation() {
        // Valid: >=8 chars, uppercase, lowercase, digit
        assertDoesNotThrow(() -> authService.validatePasswordPolicy("Secret@123"));

        // Too short (< 8 chars)
        assertThrows(ResponseStatusException.class, () -> authService.validatePasswordPolicy("Sec123"));

        // No uppercase
        assertThrows(ResponseStatusException.class, () -> authService.validatePasswordPolicy("secret123"));

        // No number
        assertThrows(ResponseStatusException.class, () -> authService.validatePasswordPolicy("SecretAbc"));
    }

    @Test
    @DisplayName("login succeeds with correct password and returns Bearer token")
    void testLoginSuccess() {
        String email = "sara@ethiobridge.et";
        String password = "Password123";

        AppUser user = new AppUser(UUID.randomUUID(), email, "Sara Bekele");
        user.setId(UUID.randomUUID());
        user.setPasswordHash("hashed_pass");

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, "hashed_pass")).thenReturn(true);

        LoginRequest req = new LoginRequest();
        req.setEmailOrUsername(email);
        req.setPassword(password);

        AuthResponseDto resp = authService.login(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertTrue(resp.getToken().startsWith("eb-"));
        assertEquals("Bearer", resp.getTokenType());
        assertEquals("Sara Bekele", resp.getUser().getFullName());
    }

    @Test
    @DisplayName("login fails with bad credentials")
    void testLoginBadCredentials() {
        String email = "sara@ethiobridge.et";
        AppUser user = new AppUser(UUID.randomUUID(), email, "Sara Bekele");
        user.setPasswordHash("hashed_pass");

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass123", "hashed_pass")).thenReturn(false);

        LoginRequest req = new LoginRequest();
        req.setEmailOrUsername(email);
        req.setPassword("WrongPass123");

        assertThrows(ResponseStatusException.class, () -> authService.login(req));
    }
}
