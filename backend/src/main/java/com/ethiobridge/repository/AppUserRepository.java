package com.ethiobridge.repository;

import com.ethiobridge.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByKeycloakSubject(UUID keycloakSubject);
    Optional<AppUser> findByEmail(String email);
}
