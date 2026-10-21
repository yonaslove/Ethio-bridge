package com.ethiobridge.service;

import com.ethiobridge.dto.PagedResponse;
import com.ethiobridge.dto.SkillDto;
import com.ethiobridge.dto.UserDto;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Skill;
import com.ethiobridge.model.SkillCategory;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.SkillRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminService {

    private final AppUserRepository appUserRepository;
    private final SkillRepository skillRepository;

    public AdminService(AppUserRepository appUserRepository, SkillRepository skillRepository) {
        this.appUserRepository = appUserRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> listUsers(Pageable pageable) {
        Page<AppUser> page = appUserRepository.findAll(pageable);
        List<UserDto> dtos = page.getContent().stream()
                .map(u -> new UserDto(
                        u.getId(),
                        u.getKeycloakSubject(),
                        u.getEmail(),
                        u.getFullName(),
                        new java.util.ArrayList<>(u.getRoles()),
                        u.getStatus(),
                        u.getPhoneNumber(),
                        u.isVerified(),
                        u.isPhoneVerified(),
                        u.getAvatarUrl()
                ))
                .toList();
        return new PagedResponse<>(dtos, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    public UserDto setUserStatus(UUID userId, String status) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(status.toUpperCase());
        AppUser saved = appUserRepository.save(user);
        return new UserDto(
                saved.getId(),
                saved.getKeycloakSubject(),
                saved.getEmail(),
                saved.getFullName(),
                new java.util.ArrayList<>(saved.getRoles()),
                saved.getStatus(),
                saved.getPhoneNumber(),
                saved.isVerified(),
                saved.isPhoneVerified(),
                saved.getAvatarUrl()
        );
    }

    public SkillDto createSkill(SkillDto dto) {
        Skill skill = new Skill();
        skill.setName(dto.getName());
        skill.setSlug(dto.getSlug() != null ? dto.getSlug() : dto.getName().toLowerCase().replaceAll("\\s+", "-"));
        skill.setCategory(SkillCategory.valueOf(dto.getCategory().toUpperCase()));
        skill.setActive(true);

        Skill saved = skillRepository.save(skill);
        return new SkillDto(saved.getId(), saved.getSlug(), saved.getName(), saved.getCategory().name(), saved.isActive());
    }

    public void deprecateSkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Skill not found"));
        skill.setActive(false);
        skillRepository.save(skill);
    }
}
