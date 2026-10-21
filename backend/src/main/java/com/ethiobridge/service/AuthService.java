package com.ethiobridge.service;

import com.ethiobridge.dto.AuthResponseDto;
import com.ethiobridge.dto.LoginRequest;
import com.ethiobridge.dto.RegisterRequest;
import com.ethiobridge.dto.UserDto;
import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
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

    private final AppUserRepository appUserRepository;
    private final SeekerProfileRepository seekerProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final SkillRepository skillRepository;
    private final ProviderSkillRepository providerSkillRepository;
    private final LocationRepository locationRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Token store with 24-hour TTL: token -> SessionDetails
    public record SessionDetails(String username, UUID userId, List<String> roles, long expiresAtMillis) {
        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }
    private static final long SESSION_TTL_MILLIS = 24 * 60 * 60 * 1000L; // 24 hours
    private static final Map<String, SessionDetails> ACTIVE_SESSIONS = new ConcurrentHashMap<>();

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_MILLIS = 15 * 60 * 1000L; // 15 minutes
    private static final Map<String, FailedAttemptTracker> FAILED_ATTEMPTS = new ConcurrentHashMap<>();

    private record FailedAttemptTracker(int count, long lastAttemptTime) {}

    public AuthService(AppUserRepository appUserRepository,
                       SeekerProfileRepository seekerProfileRepository,
                       ProviderProfileRepository providerProfileRepository,
                       SkillRepository skillRepository,
                       ProviderSkillRepository providerSkillRepository,
                       LocationRepository locationRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.seekerProfileRepository = seekerProfileRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.skillRepository = skillRepository;
        this.providerSkillRepository = providerSkillRepository;
        this.locationRepository = locationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponseDto login(LoginRequest req) {
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

        ACTIVE_SESSIONS.put(token, new SessionDetails(user.getEmail(), user.getId(), roles, System.currentTimeMillis() + SESSION_TTL_MILLIS));

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

        return new AuthResponseDto(token, userDto, roles);
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
        String email = req.getEmail().trim().toLowerCase();

        if (appUserRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email address is already registered");
        }

        validatePasswordPolicy(req.getPassword());

        UUID subject = UUID.randomUUID();
        AppUser user = new AppUser(subject, email, req.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(req.getPhoneNumber().trim());
        }
        if (req.getAvatarUrl() != null && !req.getAvatarUrl().trim().isEmpty()) {
            user.setAvatarUrl(req.getAvatarUrl().trim());
        }

        String role = req.getRole().toUpperCase().trim();
        if ("SEEKER".equals(role) || "DUAL".equals(role)) {
            user.addRole("SEEKER");
        }
        if ("PROVIDER".equals(role) || "DUAL".equals(role)) {
            user.addRole("PROVIDER");
        }
        if (user.getRoles().isEmpty()) {
            user.addRole("SEEKER");
        }

        user = appUserRepository.save(user);

        Location location = null;
        if (req.getCustomLocation() != null && !req.getCustomLocation().trim().isEmpty()) {
            String customName = req.getCustomLocation().trim();
            location = locationRepository.findByNameContainingIgnoreCaseOrRegionContainingIgnoreCase(customName, customName)
                    .stream().findFirst().orElseGet(() -> {
                        Location newLoc = new Location();
                        newLoc.setName(customName);
                        newLoc.setRegion("Ethiopia");
                        newLoc.setCountry("ET");
                        return locationRepository.save(newLoc);
                    });
        } else if (req.getLocationId() != null) {
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
        ACTIVE_SESSIONS.put(token, new SessionDetails(user.getEmail(), user.getId(), roles, System.currentTimeMillis() + SESSION_TTL_MILLIS));

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

        return new AuthResponseDto(token, userDto, roles);
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
