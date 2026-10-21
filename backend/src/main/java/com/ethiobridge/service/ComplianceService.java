package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class ComplianceService {

    private final AppUserRepository userRepository;
    private final SeekerProfileRepository seekerRepository;
    private final ProviderProfileRepository providerRepository;
    private final ApplicationRepository applicationRepository;
    private final ListingRepository listingRepository;
    private final ReviewRepository reviewRepository;
    private final UserConsentRepository consentRepository;
    private final AuditLogService auditLogService;

    public ComplianceService(AppUserRepository userRepository,
                             SeekerProfileRepository seekerRepository,
                             ProviderProfileRepository providerRepository,
                             ApplicationRepository applicationRepository,
                             ListingRepository listingRepository,
                             ReviewRepository reviewRepository,
                             UserConsentRepository consentRepository,
                             AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.seekerRepository = seekerRepository;
        this.providerRepository = providerRepository;
        this.applicationRepository = applicationRepository;
        this.listingRepository = listingRepository;
        this.reviewRepository = reviewRepository;
        this.consentRepository = consentRepository;
        this.auditLogService = auditLogService;
    }

    public void logConsent(UUID userId, String consentType, boolean agreed, String ipAddress, String userAgent) {
        UserConsent uc = new UserConsent(userId, consentType, agreed, ipAddress, userAgent);
        consentRepository.save(uc);
        auditLogService.log(userId, "LOG_CONSENT", "UserConsent", uc.getId().toString(), "Consent: " + consentType, ipAddress);
    }

    @Transactional
    public Map<String, Object> exportUserData(UUID userId) {
        AppUser user = userRepository.findById(userId).orElse(null);
        Map<String, Object> archive = new LinkedHashMap<>();

        archive.put("exportTimestamp", new Date());
        archive.put("complianceFramework", "Ethiopian Data Protection Proclamation & GDPR Standard");
        archive.put("userProfile", user);

        seekerRepository.findByUserId(userId).ifPresent(sp -> archive.put("seekerProfile", sp));
        providerRepository.findByUserId(userId).ifPresent(pp -> archive.put("providerProfile", pp));

        archive.put("myApplications", applicationRepository.findByApplicantUserIdOrderByCreatedAtDesc(userId));
        archive.put("myListings", listingRepository.findByOwnerUserIdOrderByCreatedAtDesc(userId));
        archive.put("reviewsReceived", reviewRepository.findByRevieweeUserIdOrderByCreatedAtDesc(userId));
        archive.put("consentsRecorded", consentRepository.findByUserIdOrderByCreatedAtDesc(userId));

        auditLogService.log(userId, "EXPORT_USER_DATA", "AppUser", userId.toString(), "Exported personal data archive", null);

        return archive;
    }
}
