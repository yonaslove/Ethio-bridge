package com.ethiobridge.service;

import com.ethiobridge.dto.UserDto;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.repository.AppUserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final AppUserRepository appUserRepository;

    public UserService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public AppUser getOrCreateCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User is not authenticated");
        }

        UUID subject;
        String email = "unknown@ethiobridge.et";
        String fullName = "EthioBridge User";

        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String subStr = jwt.getSubject();
            try {
                subject = UUID.fromString(subStr);
            } catch (IllegalArgumentException e) {
                // Synthesize deterministic UUID from string subject if not UUID
                subject = UUID.nameUUIDFromBytes(subStr.getBytes());
            }

            if (jwt.hasClaim("email")) {
                email = jwt.getClaimAsString("email");
            }
            if (jwt.hasClaim("name")) {
                fullName = jwt.getClaimAsString("name");
            } else if (jwt.hasClaim("preferred_username")) {
                fullName = jwt.getClaimAsString("preferred_username");
            }
        } else {
            // Username, email, or demo auth
            String name = authentication.getName();
            Optional<AppUser> byEmail = appUserRepository.findByEmail(name.toLowerCase());
            if (byEmail.isPresent()) {
                AppUser user = byEmail.get();
                if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
                    throw new AccessDeniedException("Your account has been suspended by an administrator.");
                }
                return user;
            }

            subject = UUID.nameUUIDFromBytes(name.getBytes());
            email = name.contains("@") ? name : name + "@ethiobridge.et";
            fullName = Character.toUpperCase(name.charAt(0)) + name.substring(1);
        }

        final UUID finalSubject = subject;
        final String finalEmail = email;
        final String finalFullName = fullName;

        AppUser user = appUserRepository.findByKeycloakSubject(finalSubject)
                .orElseGet(() -> {
                    AppUser newUser = new AppUser(finalSubject, finalEmail, finalFullName);
                    return appUserRepository.save(newUser);
                });

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new AccessDeniedException("Your account has been suspended by an administrator.");
        }

        return user;
    }

    public UserDto toUserDto(AppUser user, Authentication authentication) {
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5))
                .collect(Collectors.toList());

        return new UserDto(
                user.getId(),
                user.getKeycloakSubject(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getStatus(),
                user.getPhoneNumber(),
                user.isVerified(),
                user.isPhoneVerified(),
                user.getAvatarUrl()
        );
    }
}
