package com.ethiobridge.service;

import com.ethiobridge.dto.ApplicationDto;
import com.ethiobridge.dto.CreateApplicationRequest;
import com.ethiobridge.entity.Application;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.model.ApplicationStatus;
import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.repository.ApplicationRepository;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.ProviderProfileRepository;
import com.ethiobridge.entity.ApplicationAudit;
import com.ethiobridge.repository.ApplicationAuditRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ListingRepository listingRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final AppUserRepository appUserRepository;
    private final ApplicationAuditRepository applicationAuditRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ListingRepository listingRepository,
                              ProviderProfileRepository providerProfileRepository,
                              AppUserRepository appUserRepository,
                              ApplicationAuditRepository applicationAuditRepository,
                              NotificationService notificationService,
                              AuditLogService auditLogService) {
        this.applicationRepository = applicationRepository;
        this.listingRepository = listingRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.appUserRepository = appUserRepository;
        this.applicationAuditRepository = applicationAuditRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    public ApplicationDto applyToListing(UUID applicantUserId, UUID listingId, CreateApplicationRequest req) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (listing.getStatus() != ListingStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing is not open for applications");
        }

        if (listing.getOwnerUserId().equals(applicantUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot apply to your own listing");
        }

        ProviderProfile providerProfile = providerProfileRepository.findByUserId(applicantUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must create a provider profile before applying"));

        if (applicationRepository.findByListingIdAndApplicantUserId(listingId, applicantUserId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already applied to this listing");
        }

        // Upwork Model: Deduct proposal tokens (Connects)
        int requiredConnects = providerProfile.isPro() ? 1 : 2;
        int currentBalance = providerProfile.getConnectsBalance() != null ? providerProfile.getConnectsBalance() : 0;
        if (currentBalance < requiredConnects) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Insufficient Connects. You need " + requiredConnects + " Connects to apply (Balance: " + currentBalance + "). Please top up via Telebirr or CBE Birr.");
        }
        providerProfile.setConnectsBalance(currentBalance - requiredConnects);
        providerProfileRepository.save(providerProfile);

        Application application = new Application();
        application.setListing(listing);
        application.setApplicantUserId(applicantUserId);
        application.setProviderProfile(providerProfile);
        application.setCoverNote(req.getCoverNote());
        application.setProposedRate(req.getProposedRate() != null ? req.getProposedRate() : providerProfile.getHourlyRate());
        application.setStatus(ApplicationStatus.SUBMITTED);

        Application saved = applicationRepository.save(application);

        // Audit log
        applicationAuditRepository.save(new ApplicationAudit(saved.getId(), null, "SUBMITTED", applicantUserId, "Application submitted"));
        auditLogService.log(applicantUserId, "APPLY", "Application", saved.getId().toString(), "Applied to listing: " + listing.getTitle(), null);

        // Notify seeker
        notificationService.sendNotification(
                listing.getOwnerUserId(),
                "New Application for " + listing.getTitle(),
                providerProfile.getHeadline() + " has applied to your listing.",
                "APPLICATION",
                "/listings/" + listing.getId() + "/applications"
        );

        return toApplicationDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getApplicationsForListing(UUID ownerUserId, UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        if (!listing.getOwnerUserId().equals(ownerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }

        return applicationRepository.findByListingIdOrderByCreatedAtDesc(listingId).stream()
                .map(this::toApplicationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getMyApplications(UUID applicantUserId) {
        return applicationRepository.findByApplicantUserIdOrderByCreatedAtDesc(applicantUserId).stream()
                .map(this::toApplicationDto)
                .toList();
    }

    public ApplicationDto updateStatus(UUID actorUserId, UUID applicationId, ApplicationStatus targetStatus) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        UUID ownerId = application.getListing().getOwnerUserId();
        UUID applicantId = application.getApplicantUserId();

        ApplicationStatus currentStatus = application.getStatus();

        // Applicant withdraw transition
        if (targetStatus == ApplicationStatus.WITHDRAWN) {
            if (!applicantId.equals(actorUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the applicant can withdraw an application");
            }
            if (currentStatus == ApplicationStatus.ACCEPTED) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Cannot withdraw an accepted application");
            }
            application.setStatus(ApplicationStatus.WITHDRAWN);
            Application saved = applicationRepository.save(application);
            applicationAuditRepository.save(new ApplicationAudit(saved.getId(), currentStatus.name(), "WITHDRAWN", actorUserId, "Application withdrawn by candidate"));
            auditLogService.log(actorUserId, "WITHDRAW_APPLICATION", "Application", saved.getId().toString(), "Withdrawn application", null);
            return toApplicationDto(saved);
        }

        // Applicant accepting an offer
        if (targetStatus == ApplicationStatus.ACCEPTED && applicantId.equals(actorUserId) && currentStatus == ApplicationStatus.OFFERED) {
            application.setStatus(ApplicationStatus.ACCEPTED);
            Application saved = applicationRepository.save(application);
            applicationAuditRepository.save(new ApplicationAudit(saved.getId(), "OFFERED", "ACCEPTED", actorUserId, "Candidate accepted the offer"));
            auditLogService.log(actorUserId, "ACCEPT_OFFER", "Application", saved.getId().toString(), "Offer accepted by candidate", null);
            notificationService.sendNotification(
                    ownerId,
                    "Offer Accepted!",
                    "The candidate has accepted your offer for \"" + application.getListing().getTitle() + "\".",
                    "OFFER",
                    "/listings/" + application.getListing().getId() + "/applications"
            );
            return toApplicationDto(saved);
        }

        // Owner transitions: SUBMITTED -> SHORTLISTED -> OFFERED -> ACCEPTED / REJECTED
        if (!ownerId.equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the listing owner can update applicant status");
        }

        boolean isValid = switch (targetStatus) {
            case SHORTLISTED -> currentStatus == ApplicationStatus.SUBMITTED;
            case OFFERED -> currentStatus == ApplicationStatus.SHORTLISTED || currentStatus == ApplicationStatus.SUBMITTED;
            case ACCEPTED -> currentStatus == ApplicationStatus.OFFERED;
            case REJECTED -> currentStatus != ApplicationStatus.ACCEPTED && currentStatus != ApplicationStatus.WITHDRAWN;
            default -> false;
        };

        if (!isValid) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    String.format("Invalid status transition from %s to %s", currentStatus, targetStatus));
        }

        application.setStatus(targetStatus);
        Application saved = applicationRepository.save(application);

        applicationAuditRepository.save(new ApplicationAudit(saved.getId(), currentStatus.name(), targetStatus.name(), actorUserId, "Status updated by listing owner"));
        auditLogService.log(actorUserId, "UPDATE_APPLICATION_STATUS", "Application", saved.getId().toString(), "Transitioned from " + currentStatus + " to " + targetStatus, null);

        // Notify applicant of status change
        String notifMsg = switch (targetStatus) {
            case SHORTLISTED -> "You have been shortlisted for \"" + application.getListing().getTitle() + "\"!";
            case OFFERED -> "You received an offer for \"" + application.getListing().getTitle() + "\"! Review and accept.";
            case ACCEPTED -> "Your application for \"" + application.getListing().getTitle() + "\" has been accepted!";
            case REJECTED -> "Status update: Not selected for \"" + application.getListing().getTitle() + "\".";
            default -> "Your application status changed to " + targetStatus;
        };

        notificationService.sendNotification(
                applicantId,
                "Application Status: " + targetStatus,
                notifMsg,
                "APPLICATION",
                "/my-applications"
        );

        return toApplicationDto(saved);
    }

    public void withdrawApplication(UUID applicantUserId, UUID applicationId) {
        updateStatus(applicantUserId, applicationId, ApplicationStatus.WITHDRAWN);
    }

    private ApplicationDto toApplicationDto(Application a) {
        ApplicationDto dto = new ApplicationDto();
        dto.setId(a.getId());
        dto.setListingId(a.getListing().getId());
        dto.setListingTitle(a.getListing().getTitle());
        dto.setListingType(a.getListing().getListingType().name());
        dto.setApplicantUserId(a.getApplicantUserId());
        dto.setProviderProfileId(a.getProviderProfile().getId());
        dto.setHeadline(a.getProviderProfile().getHeadline());
        dto.setCoverNote(a.getCoverNote());
        dto.setProposedRate(a.getProposedRate());
        dto.setStatus(a.getStatus());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        appUserRepository.findById(a.getApplicantUserId()).ifPresent(user -> {
            dto.setApplicantName(user.getFullName());
            dto.setApplicantEmail(user.getEmail());
        });

        return dto;
    }
}
