package com.ethiobridge.service;

import com.ethiobridge.dto.*;
import com.ethiobridge.entity.*;
import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.model.ListingType;
import com.ethiobridge.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingSkillRepository listingSkillRepository;
    private final SkillRepository skillRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final LocationRepository locationRepository;
    private final AppUserRepository appUserRepository;

    public ListingService(ListingRepository listingRepository,
                          ListingSkillRepository listingSkillRepository,
                          SkillRepository skillRepository,
                          ServiceCategoryRepository serviceCategoryRepository,
                          LocationRepository locationRepository,
                          AppUserRepository appUserRepository) {
        this.listingRepository = listingRepository;
        this.listingSkillRepository = listingSkillRepository;
        this.skillRepository = skillRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.locationRepository = locationRepository;
        this.appUserRepository = appUserRepository;
    }

    public ListingDto createListing(UUID ownerUserId, CreateListingRequest req) {
        Listing listing = new Listing();
        listing.setOwnerUserId(ownerUserId);
        listing.setListingType(req.getListingType());
        listing.setTitle(req.getTitle());
        listing.setDescription(req.getDescription());
        listing.setRemote(req.isRemote());
        listing.setBudgetMin(req.getBudgetMin());
        listing.setBudgetMax(req.getBudgetMax());
        listing.setCurrency(req.getCurrency() != null ? req.getCurrency() : "ETB");
        listing.setAvailabilityRequired(req.getAvailabilityRequired());
        listing.setSeniority(req.getSeniority());
        listing.setStatus(ListingStatus.DRAFT);

        if (req.getServiceCategoryId() != null) {
            ServiceCategory cat = serviceCategoryRepository.findById(req.getServiceCategoryId()).orElse(null);
            listing.setServiceCategory(cat);
        }

        if (req.getLocationId() != null) {
            Location loc = locationRepository.findById(req.getLocationId()).orElse(null);
            listing.setLocation(loc);
        }

        Listing saved = listingRepository.save(listing);

        if (req.getSkills() != null && !req.getSkills().isEmpty()) {
            for (ListingSkillInputDto sDto : req.getSkills()) {
                Skill skill = skillRepository.findById(sDto.getSkillId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skill not found: " + sDto.getSkillId()));
                ListingSkill ls = new ListingSkill(saved, skill, sDto.getRequirement(), sDto.getWeight());
                saved.getSkills().add(ls);
            }
            saved = listingRepository.save(saved);
        }

        return toListingDto(saved);
    }

    public ListingDto updateListing(UUID userId, UUID listingId, CreateListingRequest req) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }

        listing.setListingType(req.getListingType());
        listing.setTitle(req.getTitle());
        listing.setDescription(req.getDescription());
        listing.setRemote(req.isRemote());
        listing.setBudgetMin(req.getBudgetMin());
        listing.setBudgetMax(req.getBudgetMax());
        listing.setCurrency(req.getCurrency() != null ? req.getCurrency() : "ETB");
        listing.setAvailabilityRequired(req.getAvailabilityRequired());
        listing.setSeniority(req.getSeniority());

        if (req.getServiceCategoryId() != null) {
            ServiceCategory cat = serviceCategoryRepository.findById(req.getServiceCategoryId()).orElse(null);
            listing.setServiceCategory(cat);
        }

        if (req.getLocationId() != null) {
            Location loc = locationRepository.findById(req.getLocationId()).orElse(null);
            listing.setLocation(loc);
        }

        listing.getSkills().clear();

        if (req.getSkills() != null) {
            for (ListingSkillInputDto sDto : req.getSkills()) {
                Skill skill = skillRepository.findById(sDto.getSkillId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Skill not found: " + sDto.getSkillId()));
                ListingSkill ls = new ListingSkill(listing, skill, sDto.getRequirement(), sDto.getWeight());
                listing.getSkills().add(ls);
            }
        }

        Listing updated = listingRepository.save(listing);
        return toListingDto(updated);
    }

    public ListingDto publishListing(UUID userId, UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }

        listing.setStatus(ListingStatus.OPEN);
        listing.setPublishedAt(OffsetDateTime.now());
        Listing updated = listingRepository.save(listing);
        return toListingDto(updated);
    }

    public ListingDto closeListing(UUID userId, UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }

        listing.setStatus(ListingStatus.CLOSED);
        Listing updated = listingRepository.save(listing);
        return toListingDto(updated);
    }

    public void deleteListing(UUID userId, UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }

        if (listing.getStatus() == ListingStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete an OPEN listing. Please close it first.");
        }

        listingRepository.delete(listing);
    }

    @Transactional(readOnly = true)
    public ListingDto getListing(UUID id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        return toListingDto(listing);
    }

    @Transactional(readOnly = true)
    public List<ListingDto> getMyListings(UUID ownerUserId) {
        return listingRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerUserId).stream()
                .map(this::toListingDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<ListingDto> browseListings(ListingType type, ListingStatus status, Long categoryId, Long locationId, String q, Pageable pageable) {
        Specification<Listing> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            } else {
                predicates.add(cb.equal(root.get("status"), ListingStatus.OPEN));
            }

            if (type != null) {
                predicates.add(cb.equal(root.get("listingType"), type));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("serviceCategory").get("id"), categoryId));
            }
            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }
            if (q != null && !q.isBlank()) {
                String search = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), search),
                        cb.like(cb.lower(root.get("description")), search)
                ));
            }

            if (query != null && Long.class != query.getResultType() && long.class != query.getResultType()) {
                query.orderBy(cb.desc(root.get("isFeatured")), cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Listing> page = listingRepository.findAll(spec, pageable);
        List<ListingDto> dtos = page.getContent().stream()
                .map(this::toListingDto)
                .toList();

        return new PagedResponse<>(dtos, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    public ListingDto toListingDto(Listing l) {
        ListingDto dto = new ListingDto();
        dto.setId(l.getId());
        dto.setOwnerUserId(l.getOwnerUserId());
        dto.setListingType(l.getListingType());
        dto.setTitle(l.getTitle());
        dto.setDescription(l.getDescription());
        dto.setRemote(l.isRemote());
        dto.setBudgetMin(l.getBudgetMin());
        dto.setBudgetMax(l.getBudgetMax());
        dto.setCurrency(l.getCurrency());
        dto.setAvailabilityRequired(l.getAvailabilityRequired());
        dto.setSeniority(l.getSeniority());
        dto.setStatus(l.getStatus());
        dto.setFeatured(l.isFeatured());
        dto.setFeaturedUntil(l.getFeaturedUntil());
        dto.setPublishedAt(l.getPublishedAt());
        dto.setCreatedAt(l.getCreatedAt());

        if (l.getServiceCategory() != null) {
            dto.setServiceCategoryId(l.getServiceCategory().getId());
            dto.setServiceCategoryName(l.getServiceCategory().getName());
        }

        if (l.getLocation() != null) {
            dto.setLocationId(l.getLocation().getId());
            dto.setLocationName(l.getLocation().getName());
        }

        appUserRepository.findById(l.getOwnerUserId()).ifPresent(user -> {
            dto.setOwnerName(user.getFullName());
        });

        if (l.getSkills() != null) {
            List<ListingSkillDto> skills = l.getSkills().stream()
                    .map(ls -> new ListingSkillDto(
                            ls.getSkill().getId(),
                            ls.getSkill().getName(),
                            ls.getSkill().getSlug(),
                            ls.getRequirement(),
                            ls.getWeight()
                    ))
                    .toList();
            dto.setSkills(skills);
        }

        return dto;
    }
}
