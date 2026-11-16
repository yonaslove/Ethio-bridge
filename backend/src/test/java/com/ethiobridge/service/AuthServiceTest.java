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

    @Mock
    private SmsService smsService;

    @Mock
    private EmailService emailService;

    @Mock
    private AuditLogService auditLogService;

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
                passwordEncoder,
                smsService,
                emailService,
                auditLogService
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

    @Test
    @DisplayName("register succeeds for SEEKER role and generates session tokens")
    void testRegisterSeekerSuccess() {
        String email = "newseeker@ethiobridge.et";
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("SecurePass123");
        req.setFullName("Abebe Bikila");
        req.setRole("SEEKER");

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode("SecurePass123")).thenReturn("encoded_pass");
        when(appUserRepository.saveAndFlush(any(AppUser.class))).thenAnswer(i -> {
            AppUser u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        AuthResponseDto resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertTrue(resp.getToken().startsWith("eb-"));
        assertEquals("Abebe Bikila", resp.getUser().getFullName());
        assertTrue(resp.getRoles().contains("SEEKER"));
        verify(seekerProfileRepository, times(1)).save(any());
        verify(auditLogService, times(1)).log(any(), eq("USER_REGISTER"), eq("AppUser"), any(), contains("SEEKER"), isNull());
    }

    @Test
    @DisplayName("register succeeds for PROVIDER role with phone normalization and skills")
    void testRegisterProviderSuccess() {
        String email = "newprovider@ethiobridge.et";
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("SecurePass123");
        req.setFullName("Dawit Tadesse");
        req.setRole("PROVIDER");
        req.setPhoneNumber("0911223344");
        req.setInitialSkillIds(java.util.List.of(1L, 2L));

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode("SecurePass123")).thenReturn("encoded_pass");
        when(smsService.isValidEthiopianPhone("0911223344")).thenReturn(true);
        when(smsService.normalizeEthiopianPhone("0911223344")).thenReturn("+251911223344");
        when(appUserRepository.saveAndFlush(any(AppUser.class))).thenAnswer(i -> {
            AppUser u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        com.ethiobridge.entity.ProviderProfile savedPp = new com.ethiobridge.entity.ProviderProfile();
        savedPp.setId(UUID.randomUUID());
        when(providerProfileRepository.save(any(com.ethiobridge.entity.ProviderProfile.class))).thenReturn(savedPp);
        com.ethiobridge.entity.Skill sk1 = new com.ethiobridge.entity.Skill();
        sk1.setId(1L);
        sk1.setName("Java");
        com.ethiobridge.entity.Skill sk2 = new com.ethiobridge.entity.Skill();
        sk2.setId(2L);
        sk2.setName("Spring Boot");
        when(skillRepository.findById(1L)).thenReturn(Optional.of(sk1));
        when(skillRepository.findById(2L)).thenReturn(Optional.of(sk2));

        AuthResponseDto resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("Dawit Tadesse", resp.getUser().getFullName());
        assertTrue(resp.getRoles().contains("PROVIDER"));
        verify(providerProfileRepository, times(1)).save(any());
        verify(providerSkillRepository, times(2)).save(any());
    }

    @Test
    @DisplayName("register rejects duplicate email with 409 CONFLICT")
    void testRegisterDuplicateEmail() {
        String email = "existing@ethiobridge.et";
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("SecurePass123");
        req.setFullName("Existing User");
        req.setRole("SEEKER");

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(new AppUser()));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.register(req));
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatusCode());
    }
}
