package com.ethiobridge.service;

import com.ethiobridge.entity.Listing;
import com.ethiobridge.entity.PlatformRevenue;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.PlatformRevenueRepository;
import com.ethiobridge.repository.ProviderProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MonetizationServiceTest {

    @Mock
    private PlatformRevenueRepository revenueRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private PaymentService paymentService;

    private MonetizationService monetizationService;

    private final UUID providerId = UUID.randomUUID();
    private final UUID seekerId = UUID.randomUUID();
    private final UUID listingId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        monetizationService = new MonetizationService(
                revenueRepository,
                providerProfileRepository,
                listingRepository,
                notificationService,
                auditLogService,
                paymentService
        );

        lenient().when(revenueRepository.save(any(PlatformRevenue.class)))
                .thenAnswer(invocation -> {
                    PlatformRevenue r = invocation.getArgument(0);
                    if (r.getId() == null) r.setId(UUID.randomUUID());
                    return r;
                });
    }

    @Test
    @DisplayName("topUpConnects with CHAPA initializes checkout session without free balance")
    void testTopUpConnectsChapa() {
        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(providerId);
        profile.setConnectsBalance(20);

        when(providerProfileRepository.findByUserId(providerId)).thenReturn(Optional.of(profile));

        Map<String, Object> checkoutMap = new HashMap<>();
        checkoutMap.put("checkoutUrl", "https://checkout.chapa.co/test/CHP-123");
        checkoutMap.put("txRef", "CHP-123");
        checkoutMap.put("status", "success");

        when(paymentService.initializeChapaCheckout(isNull(), isNull(), eq(providerId), eq(new BigDecimal("120.00")), contains("CONNECTS_TOPUP")))
                .thenReturn(checkoutMap);

        Map<String, Object> resp = monetizationService.topUpConnects(providerId, 30, "CHAPA");

        assertEquals("PENDING_PAYMENT", resp.get("status"));
        assertEquals("https://checkout.chapa.co/test/CHP-123", resp.get("checkoutUrl"));
        // Balance remains 20 until verified
        assertEquals(20, profile.getConnectsBalance());
    }

    @Test
    @DisplayName("promoteListingToFeatured marks listing featured and records revenue")
    void testPromoteListingToFeatured() {
        Listing listing = new Listing();
        listing.setId(listingId);
        listing.setOwnerUserId(seekerId);
        listing.setTitle("Senior Full-Stack Developer");

        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = monetizationService.promoteListingToFeatured(seekerId, listingId, "TELEBIRR");

        assertTrue((Boolean) result.get("success"));
        assertNotNull(listing.getFeaturedUntil());
        verify(revenueRepository).save(any(PlatformRevenue.class));
        verify(notificationService).sendNotification(eq(seekerId), contains("Featured Job"), anyString(), eq("LISTING"), anyString());
    }

    @Test
    @DisplayName("subscribeToPro grants 30-day Pro badge and +30 bonus Connects")
    void testSubscribeToPro() {
        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(providerId);
        profile.setConnectsBalance(20);

        when(providerProfileRepository.findByUserId(providerId)).thenReturn(Optional.of(profile));
        when(providerProfileRepository.save(any(ProviderProfile.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> result = monetizationService.subscribeToPro(providerId, "CBE_BIRR");

        assertTrue((Boolean) result.get("success"));
        assertEquals(50, profile.getConnectsBalance()); // 20 + 30 bonus
        assertNotNull(profile.getProExpiresAt());
        verify(notificationService).sendNotification(eq(providerId), contains("EthioBridge Pro"), anyString(), eq("MEMBERSHIP"), anyString());
    }

    @Test
    @DisplayName("recordEscrowCommission stores platform fee and payer reference")
    void testRecordEscrowCommission() {
        UUID milestoneId = UUID.randomUUID();
        PlatformRevenue rev = monetizationService.recordEscrowCommission(
                milestoneId, seekerId, new BigDecimal("10000.00"), new BigDecimal("1000.00"), new BigDecimal("9000.00"), "10% Escrow Fee"
        );

        assertNotNull(rev);
        assertEquals("ESCROW_COMMISSION", rev.getSourceType());
        assertEquals(new BigDecimal("1000.00"), rev.getFeeAmount());
        assertEquals(new BigDecimal("9000.00"), rev.getNetAmount());
        verify(revenueRepository).save(any(PlatformRevenue.class));
    }
}
