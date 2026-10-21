package com.ethiobridge.service;

import com.ethiobridge.dto.ApplicationDto;
import com.ethiobridge.dto.CreateApplicationRequest;
import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Application;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.model.ApplicationStatus;
import com.ethiobridge.model.ListingStatus;
import com.ethiobridge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ApplicationAuditRepository applicationAuditRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private ApplicationService applicationService;

    private final UUID applicantId = UUID.randomUUID();
    private final UUID seekerId = UUID.randomUUID();
    private final UUID listingId = UUID.randomUUID();
    private final UUID applicationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        applicationService = new ApplicationService(
                applicationRepository,
                listingRepository,
                providerProfileRepository,
                appUserRepository,
                applicationAuditRepository,
                notificationService,
                auditLogService
        );

        lenient().when(applicationRepository.save(any(Application.class)))
                .thenAnswer(invocation -> {
                    Application a = invocation.getArgument(0);
                    if (a.getId() == null) a.setId(applicationId);
                    return a;
                });
    }

    @Test
    @DisplayName("applyToListing deducts connects balance and transitions to SUBMITTED")
    void testApplyToListingDeductsConnects() {
        Listing listing = new Listing();
        listing.setId(listingId);
        listing.setOwnerUserId(seekerId);
        listing.setTitle("Full Stack Flutter Project");
        listing.setStatus(ListingStatus.OPEN);
        listing.setBudgetMin(new BigDecimal("1000"));

        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(applicantId);
        profile.setConnectsBalance(20);

        AppUser applicant = new AppUser(UUID.randomUUID(), "dev@ethiobridge.et", "Dawit Dev");

        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(providerProfileRepository.findByUserId(applicantId)).thenReturn(Optional.of(profile));
        when(applicationRepository.findByListingIdAndApplicantUserId(listingId, applicantId)).thenReturn(Optional.empty());
        when(appUserRepository.findById(applicantId)).thenReturn(Optional.of(applicant));

        CreateApplicationRequest req = new CreateApplicationRequest();
        req.setCoverLetter("I have 4 years of Flutter experience.");
        req.setProposedRate(new BigDecimal("15000"));

        ApplicationDto dto = applicationService.applyToListing(applicantId, listingId, req);

        assertNotNull(dto);
        assertEquals(ApplicationStatus.SUBMITTED, dto.getStatus());
        assertTrue(profile.getConnectsBalance() < 20); // Connects deducted
        verify(providerProfileRepository).save(profile);
        verify(notificationService).sendNotification(eq(seekerId), contains("New Application"), anyString(), eq("APPLICATION"), anyString());
    }

    @Test
    @DisplayName("applyToListing throws error if provider has insufficient Connects")
    void testApplyThrowsInsufficientConnects() {
        Listing listing = new Listing();
        listing.setId(listingId);
        listing.setOwnerUserId(seekerId);
        listing.setStatus(ListingStatus.OPEN);

        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(applicantId);
        profile.setConnectsBalance(0); // Insufficient

        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(providerProfileRepository.findByUserId(applicantId)).thenReturn(Optional.of(profile));
        when(applicationRepository.findByListingIdAndApplicantUserId(listingId, applicantId)).thenReturn(Optional.empty());

        CreateApplicationRequest req = new CreateApplicationRequest();
        req.setCoverLetter("Cover letter");

        assertThrows(ResponseStatusException.class, () -> applicationService.applyToListing(applicantId, listingId, req));
    }

    @Test
    @DisplayName("updateStatus updates state to ACCEPTED and notifies applicant")
    void testAcceptApplication() {
        Listing listing = new Listing();
        listing.setId(listingId);
        listing.setOwnerUserId(seekerId);
        listing.setTitle("UI Design Gig");

        Application app = new Application(listingId, applicantId, "Cover letter", new BigDecimal("5000"));
        app.setId(applicationId);
        app.setStatus(ApplicationStatus.OFFERED);
        app.setListing(listing);

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(app));
        when(appUserRepository.findById(applicantId)).thenReturn(Optional.of(new AppUser(UUID.randomUUID(), "a@b.com", "Applicant")));

        ApplicationDto result = applicationService.updateStatus(seekerId, applicationId, ApplicationStatus.ACCEPTED);

        assertEquals(ApplicationStatus.ACCEPTED, result.getStatus());
        verify(notificationService).sendNotification(eq(applicantId), contains("Accepted"), anyString(), eq("APPLICATION"), anyString());
    }
}
