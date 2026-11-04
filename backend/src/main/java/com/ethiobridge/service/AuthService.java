package com.ethiobridge.service;

import com.ethiobridge.dto.AuthResponseDto;
import com.ethiobridge.dto.LoginRequest;
import com.ethiobridge.dto.RegisterRequest;
import com.ethiobridge.dto.UserDto;
import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AppUserRepository appUserRepository;
    private final SeekerProfileRepository seekerProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final SkillRepository skillRepository;
    private final ProviderSkillRepository providerSkillRepository;
    private final LocationRepository locationRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    // Token store with 24-hour TTL: token -> SessionDetails
    public record SessionDetails(String username, UUID userId, List<String> roles, long expiresAtMillis) {
        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }
    private static final long SESSION_TTL_MILLIS = 24 * 60 * 60 * 1000L; // 24 hours
    private static final Map<String, SessionDetails> ACTIVE_SESSIONS = new ConcurrentHashMap<>();

    // Refresh token store with 7-day TTL: refreshToken -> RefreshSessionDetails
    public record RefreshSessionDetails(UUID userId, String username, long expiresAtMillis) {
        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }
    private static final long REFRESH_TTL_MILLIS = 7 * 24 * 60 * 60 * 1000L; // 7 days
    private static final Map<String, RefreshSessionDetails> ACTIVE_REFRESH_TOKENS = new ConcurrentHashMap<>();

    // Password reset tokens with 15-minute TTL: resetToken -> ResetDetails
    public record ResetDetails(UUID userId, String email, long expiresAtMillis) {
        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }
    private static final long RESET_TTL_MILLIS = 15 * 60 * 1000L; // 15 mins
    private static final Map<String, ResetDetails> PASSWORD_RESET_TOKENS = new ConcurrentHashMap<>();

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_MILLIS = 15 * 60 * 1000L; // 15 minutes
    private static final Map<String, FailedAttemptTracker> FAILED_ATTEMPTS = new ConcurrentHashMap<>();

    private record FailedAttemptTracker(int count, long lastAttemptTime) {}

    @Autowired
    public AuthService(AppUserRepository appUserRepository,
                       SeekerProfileRepository seekerProfileRepository,
                       ProviderProfileRepository providerProfileRepository,
                       SkillRepository skillRepository,
                       ProviderSkillRepository providerSkillRepository,
                       LocationRepository locationRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                       SmsService smsService,
                       EmailService emailService,
                       AuditLogService auditLogService) {
        this.appUserRepository = appUserRepository;
        this.seekerProfileRepository = seekerProfileRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.skillRepository = skillRepository;
        this.providerSkillRepository = providerSkillRepository;
        this.locationRepository = locationRepository;
        this.passwordEncoder = passwordEncoder;
        this.smsService = smsService;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    public AuthService(AppUserRepository appUserRepository,
                       SeekerProfileRepository seekerProfileRepository,
                       ProviderProfileRepository providerProfileRepository,
                       SkillRepository skillRepository,
                       ProviderSkillRepository providerSkillRepository,
                       LocationRepository locationRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this(appUserRepository, seekerProfileRepository, providerProfileRepository, skillRepository,
                providerSkillRepository, locationRepository, passwordEncoder, null, null, null);
    }

    public AuthResponseDto login(LoginRequest req) {
        evictExpiredMemoryStores();

        String input = req.getEmailOrUsername().trim().toLowerCase();
        String pass = req.getPassword();

        // Check if demo user identifier was passed
        String email = input.contains("@") ? input : input + "@ethiobridge.et";

        // Check login rate limiting
        FailedAttemptTracker tracker = FAILED_ATTEMPTS.get(email);
        if (tracker != null && tracker.count() >= MAX_FAILED_ATTEMPTS) {
            long elapsed = System.currentTimeMillis() - tracker.lastAttemptTime();
            if (elapsed < LOCK_TIME_MILLIS) {
                long remainingMinutes = (LOCK_TIME_MILLIS - elapsed) / 60000 + 1;
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many failed login attempts. Account temporarily locked for " + remainingMinutes + " minute(s).");
            } else {
                FAILED_ATTEMPTS.remove(email);
            }
        }

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> {
                    recordFailedAttempt(email, tracker);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
                });

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been suspended");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(pass, user.getPasswordHash())) {
            recordFailedAttempt(email, tracker);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        // Login success - reset failed attempts
        FAILED_ATTEMPTS.remove(email);

        List<String> roles = resolveRoles(user);
        String token = "eb-" + UUID.randomUUID().toString();
        String refreshToken = "eb-ref-" + UUID.randomUUID().toString();

        ACTIVE_SESSIONS.put(token, new SessionDetails(user.getEmail(), user.getId(), roles, System.currentTimeMillis() + SESSION_TTL_MILLIS));
        ACTIVE_REFRESH_TOKENS.put(refreshToken, new RefreshSessionDetails(user.getId(), user.getEmail(), System.currentTimeMillis() + REFRESH_TTL_MILLIS));

        if (auditLogService != null) {
            auditLogService.log(user.getId(), "USER_LOGIN", "AppUser", user.getId().toString(), "User logged in successfully", null);
        }

        UserDto userDto = new UserDto(
                user.getId(),
                user.getKeycloakSubject(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getStatus(),
                user.getPhoneNumber(),
                user.isVerified(),
                user.isPhoneVerified()
        );

        return new AuthResponseDto(token, refreshToken, SESSION_TTL_MILLIS / 1000L, userDto, roles);
    }

    public AuthResponseDto refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }

        String cleanRefresh = refreshToken.trim();
        RefreshSessionDetails refreshSession = ACTIVE_REFRESH_TOKENS.get(cleanRefresh);

        if (refreshSession == null || refreshSession.isExpired()) {
            ACTIVE_REFRESH_TOKENS.remove(cleanRefresh);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired. Please sign in again.");
        }

        AppUser user = appUserRepository.findById(refreshSession.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found"));

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            ACTIVE_REFRESH_TOKENS.remove(cleanRefresh);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account has been suspended");
        }

        // Token rotation: remove old refresh token and issue a fresh pair
        ACTIVE_REFRESH_TOKENS.remove(cleanRefresh);

        List<String> roles = resolveRoles(user);
        String newAccessToken = "eb-" + UUID.randomUUID().toString();
        String newRefreshToken = "eb-ref-" + UUID.randomUUID().toString();

        ACTIVE_SESSIONS.put(newAccessToken, new SessionDetails(user.getEmail(), user.getId(), roles, System.currentTimeMillis() + SESSION_TTL_MILLIS));
        ACTIVE_REFRESH_TOKENS.put(newRefreshToken, new RefreshSessionDetails(user.getId(), user.getEmail(), System.currentTimeMillis() + REFRESH_TTL_MILLIS));

        UserDto userDto = new UserDto(
                user.getId(),
                user.getKeycloakSubject(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getStatus(),
                user.getPhoneNumber(),
                user.isVerified(),
                user.isPhoneVerified()
        );

        return new AuthResponseDto(newAccessToken, newRefreshToken, SESSION_TTL_MILLIS / 1000L, userDto, roles);
    }

    private void recordFailedAttempt(String email, FailedAttemptTracker tracker) {
        int newCount = (tracker == null ? 0 : tracker.count()) + 1;
        FAILED_ATTEMPTS.put(email, new FailedAttemptTracker(newCount, System.currentTimeMillis()));
    }

    public void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters long");
        }
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);

        if (!hasUpper || !hasLower || !hasDigit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number");
        }
    }

    public AuthResponseDto register(RegisterRequest req) {
        evictExpiredMemoryStores();

        String email = req.getEmail().trim().toLowerCase();
        if (appUserRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email address already exists");
        }

        validatePasswordPolicy(req.getPassword());

        String role = req.getRole().toUpperCase();
        if (!role.equals("SEEKER") && !role.equals("PROVIDER") && !role.equals("DUAL")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be SEEKER, PROVIDER, or DUAL");
        }

        AppUser user = new AppUser(UUID.randomUUID(), email, req.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setStatus("ACTIVE");

        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) {
            String phone = req.getPhoneNumber().trim();
            if (smsService != null && smsService.isValidEthiopianPhone(phone)) {
                user.setPhoneNumber(smsService.normalizeEthiopianPhone(phone));
            } else {
                user.setPhoneNumber(phone);
            }
        }

        user = appUserRepository.save(user);

        Location location = null;
        if (req.getLocationId() != null) {
            location = locationRepository.findById(req.getLocationId()).orElse(null);
        } else {
            location = locationRepository.findById(1L).orElse(null);
        }

        if ("SEEKER".equals(role) || "DUAL".equals(role)) {
            SeekerProfile sp = new SeekerProfile();
            sp.setUserId(user.getId());
            sp.setHeadline(req.getHeadline() != null ? req.getHeadline() : "Talent Seeker");
            sp.setBio(req.getBio() != null ? req.getBio() : "Looking for professional talent across Ethiopia.");
            sp.setLocation(location);
            seekerProfileRepository.save(sp);
        }

        if ("PROVIDER".equals(role) || "DUAL".equals(role)) {
            ProviderProfile pp = new ProviderProfile();
            pp.setUserId(user.getId());
            pp.setHeadline(req.getHeadline() != null ? req.getHeadline() : "Verified Professional");
            pp.setBio(req.getBio() != null ? req.getBio() : "Experienced service provider.");
            pp.setLocation(location);
            pp.setAvailability(req.getAvailability() != null ? req.getAvailability() : "FULL_TIME");
            pp.setHourlyRate(req.getHourlyRate() != null ? req.getHourlyRate() : new BigDecimal("450.00"));
            pp.setYearsExperience(req.getYearsExperience() != null ? req.getYearsExperience() : 2);
            pp.setCategoryFocus("ANY");
            pp.setAvatarUrl(req.getAvatarUrl());
            pp.setPortfolioUrl(req.getPortfolioUrl());
            pp.setEducation(req.getEducation());
            pp.setLanguages(req.getLanguages());

            StringBuilder profileText = new StringBuilder();
            if (req.getHeadline() != null) profileText.append(req.getHeadline()).append(". ");
            if (req.getBio() != null) profileText.append(req.getBio()).append(" ");
            if (req.getEducation() != null) profileText.append("Education: ").append(req.getEducation()).append(". ");
            if (req.getLanguages() != null) profileText.append("Languages: ").append(req.getLanguages()).append(". ");
            if (req.getPortfolioUrl() != null) profileText.append("Portfolio: ").append(req.getPortfolioUrl()).append(". ");
            pp.setProfileText(profileText.toString().trim());

            pp = providerProfileRepository.save(pp);

            if (req.getInitialSkillIds() != null && !req.getInitialSkillIds().isEmpty()) {
                for (Long sId : req.getInitialSkillIds()) {
                    Optional<Skill> sk = skillRepository.findById(sId);
                    if (sk.isPresent()) {
                        ProviderSkill ps = new ProviderSkill(pp, sk.get(), 4, new BigDecimal("3.0"));
                        providerSkillRepository.save(ps);
                    }
                }
            }
        }

        List<String> roles = resolveRoles(user);
        String token = "eb-" + UUID.randomUUID().toString();
        String refreshToken = "eb-ref-" + UUID.randomUUID().toString();

        ACTIVE_SESSIONS.put(token, new SessionDetails(user.getEmail(), user.getId(), roles, System.currentTimeMillis() + SESSION_TTL_MILLIS));
        ACTIVE_REFRESH_TOKENS.put(refreshToken, new RefreshSessionDetails(user.getId(), user.getEmail(), System.currentTimeMillis() + REFRESH_TTL_MILLIS));

        if (emailService != null) {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
        }

        if (auditLogService != null) {
            auditLogService.log(user.getId(), "USER_REGISTER", "AppUser", user.getId().toString(), "Registered as " + role, null);
        }

        UserDto userDto = new UserDto(
                user.getId(),
                user.getKeycloakSubject(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getStatus(),
                user.getPhoneNumber(),
                user.isVerified(),
                user.isPhoneVerified()
        );

        return new AuthResponseDto(token, refreshToken, SESSION_TTL_MILLIS / 1000L, userDto, roles);
    }

    public void sendPasswordReset(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email or phone identifier is required");
        }

        String input = identifier.trim().toLowerCase();
        AppUser user = null;

        if (input.contains("@")) {
            user = appUserRepository.findByEmail(input).orElse(null);
        } else {
            String norm = smsService != null ? smsService.normalizeEthiopianPhone(input) : input;
            user = appUserRepository.findAll().stream()
                    .filter(u -> u.getPhoneNumber() != null && u.getPhoneNumber().replaceAll("[^0-9]", "").endsWith(norm.replaceAll("[^0-9]", "")))
                    .findFirst().orElse(null);
        }

        // Even if user not found, don't leak account existence to callers (prevent user enumeration)
        if (user == null) {
            log.info("Password reset requested for non-existent user identifier: {}", identifier);
            return;
        }

        String resetToken = "eb-reset-" + UUID.randomUUID().toString();
        PASSWORD_RESET_TOKENS.put(resetToken, new ResetDetails(user.getId(), user.getEmail(), System.currentTimeMillis() + RESET_TTL_MILLIS));

        if (user.getEmail() != null && emailService != null) {
            String link = "http://localhost:4200/login?reset_token=" + resetToken;
            emailService.sendPasswordResetEmail(user.getEmail(), link);
        }

        if (user.getPhoneNumber() != null && smsService != null) {
            smsService.sendVerificationOtp(user.getPhoneNumber());
        }
    }

    public void resetPassword(String resetToken, String newPassword) {
        if (resetToken == null || resetToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required");
        }

        ResetDetails details = PASSWORD_RESET_TOKENS.get(resetToken.trim());
        if (details == null || details.isExpired()) {
            PASSWORD_RESET_TOKENS.remove(resetToken);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset token is invalid or has expired");
        }

        validatePasswordPolicy(newPassword);

        AppUser user = appUserRepository.findById(details.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        appUserRepository.save(user);

        // Security: Invalidate reset token and revoke all existing sessions to force re-authentication
        PASSWORD_RESET_TOKENS.remove(resetToken);
        ACTIVE_SESSIONS.entrySet().removeIf(e -> e.getValue().userId().equals(user.getId()));
        ACTIVE_REFRESH_TOKENS.entrySet().removeIf(e -> e.getValue().userId().equals(user.getId()));

        if (auditLogService != null) {
            auditLogService.log(user.getId(), "RESET_PASSWORD", "AppUser", user.getId().toString(), "Password reset successfully completed", null);
        }
    }

    public String sendPhoneVerification(UUID userId, String phoneNumber) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (smsService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS service unavailable");
        }

        return smsService.sendVerificationOtp(phoneNumber);
    }

    public boolean verifyPhoneCode(UUID userId, String phoneNumber, String code) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (smsService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS service unavailable");
        }

        boolean ok = smsService.verifyOtp(phoneNumber, code);
        if (ok) {
            user.setPhoneVerified(true);
            user.setPhoneNumber(smsService.normalizeEthiopianPhone(phoneNumber));
            appUserRepository.save(user);

            if (auditLogService != null) {
                auditLogService.log(userId, "VERIFY_PHONE", "AppUser", userId.toString(), "Phone verified: " + user.getPhoneNumber(), null);
            }
        }
        return ok;
    }

    public void deleteAccount(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Revoke all active sessions and refresh tokens
        ACTIVE_SESSIONS.entrySet().removeIf(e -> e.getValue().userId().equals(userId));
        ACTIVE_REFRESH_TOKENS.entrySet().removeIf(e -> e.getValue().userId().equals(userId));

        // Anonymize user data (GDPR / Ethiopian Data Privacy compliance)
        user.setEmail("deleted_" + userId + "@ethiobridge.internal");
        user.setFullName("Deactivated Account");
        user.setPhoneNumber(null);
        user.setPasswordHash(null);
        user.setStatus("DEACTIVATED");
        user.setVerified(false);
        user.setPhoneVerified(false);
        appUserRepository.save(user);

        if (auditLogService != null) {
            auditLogService.log(userId, "DELETE_ACCOUNT", "AppUser", userId.toString(), "Account deactivated and personal data anonymized", null);
        }
    }

    private void evictExpiredMemoryStores() {
        if (ACTIVE_SESSIONS.size() > 5000) {
            ACTIVE_SESSIONS.entrySet().removeIf(e -> e.getValue().isExpired());
        }
        if (ACTIVE_REFRESH_TOKENS.size() > 5000) {
            ACTIVE_REFRESH_TOKENS.entrySet().removeIf(e -> e.getValue().isExpired());
        }
        if (PASSWORD_RESET_TOKENS.size() > 1000) {
            PASSWORD_RESET_TOKENS.entrySet().removeIf(e -> e.getValue().isExpired());
        }
        if (FAILED_ATTEMPTS.size() > 2000) {
            long now = System.currentTimeMillis();
            FAILED_ATTEMPTS.entrySet().removeIf(e -> (now - e.getValue().lastAttemptTime()) > LOCK_TIME_MILLIS);
        }
    }

    public List<String> resolveRoles(AppUser user) {
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            return new ArrayList<>(user.getRoles());
        }
        List<String> roles = new ArrayList<>();
        if (seekerProfileRepository.findByUserId(user.getId()).isPresent()) {
            roles.add("SEEKER");
        }
        if (providerProfileRepository.findByUserId(user.getId()).isPresent()) {
            roles.add("PROVIDER");
        }
        if (roles.isEmpty()) {
            roles.add("SEEKER");
        }
        user.setRoles(new HashSet<>(roles));
        appUserRepository.save(user);
        return roles;
    }

    public void logout(String token) {
        if (token != null) {
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
            ACTIVE_SESSIONS.remove(cleanToken);
        }
    }

    public Authentication getAuthenticationForToken(String token) {
        SessionDetails session = ACTIVE_SESSIONS.get(token);
        if (session == null) {
            return null;
        }

        if (session.isExpired()) {
            ACTIVE_SESSIONS.remove(token);
            return null;
        }

        List<SimpleGrantedAuthority> authorities = session.roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList();

        return new UsernamePasswordAuthenticationToken(session.username, token, authorities);
    }
}
