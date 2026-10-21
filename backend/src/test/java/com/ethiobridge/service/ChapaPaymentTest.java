package com.ethiobridge.service;

import com.ethiobridge.entity.Contract;
import com.ethiobridge.entity.ContractMilestone;
import com.ethiobridge.entity.PaymentTransaction;
import com.ethiobridge.entity.PlatformRevenue;
import com.ethiobridge.entity.ProviderProfile;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.ContractMilestoneRepository;
import com.ethiobridge.repository.ContractRepository;
import com.ethiobridge.repository.ListingRepository;
import com.ethiobridge.repository.PaymentTransactionRepository;
import com.ethiobridge.repository.PlatformRevenueRepository;
import com.ethiobridge.repository.ProviderProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ChapaPaymentTest {

    @Mock
    private PaymentTransactionRepository paymentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractMilestoneRepository milestoneRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PlatformRevenueRepository revenueRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ListingRepository listingRepository;

    private PaymentService paymentService;
    private ContractService contractService;
    private MonetizationService monetizationService;

    private final UUID seekerId = UUID.randomUUID();
    private final UUID providerId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();
    private final UUID milestoneId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                auditLogService,
                appUserRepository,
                milestoneRepository,
                contractRepository,
                providerProfileRepository,
                revenueRepository,
                notificationService
        );

        monetizationService = new MonetizationService(
                revenueRepository,
                providerProfileRepository,
                listingRepository,
                notificationService,
                auditLogService,
                paymentService
        );

        contractService = new ContractService(
                contractRepository,
                milestoneRepository,
                paymentService,
                null, // DisputeRepository
                notificationService,
                auditLogService,
                appUserRepository,
                monetizationService
        );

        lenient().when(paymentRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(invocation -> {
                    PaymentTransaction pt = invocation.getArgument(0);
                    if (pt.getId() == null) {
                        pt.setId(UUID.randomUUID());
                    }
                    return pt;
                });
    }

    @Test
    @DisplayName("Chapa Payment: initiatePayment produces CHP- prefix, SUCCESS status and Chapa audit log")
    void testChapaPaymentInitiation() {
        BigDecimal amount = new BigDecimal("4500.00");

        PaymentTransaction tx = paymentService.initiatePayment(contractId, milestoneId, seekerId, amount, "CHAPA");

        assertNotNull(tx);
        assertEquals("CHAPA", tx.getPaymentMethod());
        assertEquals("SUCCESS", tx.getStatus());
        assertEquals(amount, tx.getAmount());
        assertEquals("ETB", tx.getCurrency());
        assertTrue(tx.getTransactionRef().startsWith("CHP-"), "Transaction reference must begin with CHP- prefix");
        assertTrue(tx.getProviderResponse().contains("Chapa"), "Provider response must reference Chapa gateway");

        verify(paymentRepository, times(1)).save(tx);
        verify(auditLogService, times(1)).log(
                eq(seekerId),
                eq("PAYMENT_CHAPA"),
                eq("PaymentTransaction"),
                any(),
                contains("Ref: CHP-"),
                isNull()
        );
    }

    @Test
    @DisplayName("Chapa Checkout: initializeChapaCheckout returns hosted test checkout URL and CHP- reference")
    void testChapaCheckoutInitialization() {
        BigDecimal amount = new BigDecimal("2500.00");

        Map<String, Object> resp = paymentService.initializeChapaCheckout(contractId, milestoneId, seekerId, amount, "ESCROW_MILESTONE");

        assertNotNull(resp);
        assertEquals("success", resp.get("status"));
        assertEquals("CHAPA", resp.get("paymentMethod"));
        assertEquals("SANDBOX_SIMULATED", resp.get("mode"));
        assertEquals(amount, resp.get("amount"));
        assertTrue(resp.get("txRef").toString().startsWith("CHP-"));
        assertTrue(resp.get("checkoutUrl").toString().startsWith("https://checkout.chapa.co/checkout/test-payment/CHP-"));

        verify(auditLogService, times(1)).log(
                eq(seekerId),
                eq("CHAPA_PAYMENT_INIT"),
                eq("PaymentTransaction"),
                any(),
                contains("ESCROW_MILESTONE"),
                isNull()
        );
    }

    @Test
    @DisplayName("Chapa Escrow Funding: fundMilestone via CHAPA updates milestone to FUNDED and notifies provider")
    void testChapaMilestoneFunding() {
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setSeekerUserId(seekerId);
        contract.setProviderUserId(providerId);
        contract.setTitle("Full-Stack Mobile App");

        ContractMilestone milestone = new ContractMilestone();
        milestone.setId(milestoneId);
        milestone.setContractId(contractId);
        milestone.setTitle("Milestone 1: Prototype");
        milestone.setAmount(new BigDecimal("12000.00"));
        milestone.setStatus("PENDING");

        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(milestoneRepository.save(any(ContractMilestone.class))).thenAnswer(i -> i.getArgument(0));

        ContractMilestone funded = contractService.fundMilestone(seekerId, milestoneId, "CHAPA");

        assertEquals("FUNDED", funded.getStatus());
        assertNotNull(funded.getFundedAt());

        verify(paymentRepository, times(1)).save(argThat(tx ->
                "CHAPA".equals(tx.getPaymentMethod()) && tx.getTransactionRef().startsWith("CHP-")
        ));

        verify(notificationService, times(1)).sendNotification(
                eq(providerId),
                contains("Escrow Milestone Funded"),
                contains("via CHAPA"),
                eq("CONTRACT"),
                eq("/contracts")
        );
    }

    @Test
    @DisplayName("Chapa Monetization: topUpConnects via CHAPA produces CHP-CON- revenue reference and credits tokens")
    void testChapaConnectsTopup() {
        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(providerId);
        profile.setConnectsBalance(10);

        when(providerProfileRepository.findByUserId(providerId)).thenReturn(Optional.of(profile));
        when(revenueRepository.save(any(PlatformRevenue.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> res = monetizationService.topUpConnects(providerId, 25, "CHAPA");

        assertTrue((Boolean) res.get("success"));
        assertEquals(35, res.get("newBalance"));
        assertEquals("CHAPA", res.get("paymentMethod"));
        assertTrue(res.get("referenceId").toString().startsWith("CHP-CON-"));

        ArgumentCaptor<PlatformRevenue> revCaptor = ArgumentCaptor.forClass(PlatformRevenue.class);
        verify(revenueRepository, times(1)).save(revCaptor.capture());
        PlatformRevenue savedRev = revCaptor.getValue();
        assertEquals("CHAPA", savedRev.getPaymentMethod());
        assertEquals(new BigDecimal("100.00"), savedRev.getGrossAmount());
        assertTrue(savedRev.getReferenceId().startsWith("CHP-CON-"));
    }

    @Test
    @DisplayName("Chapa Monetization: subscribeToPro via CHAPA upgrades profile to Pro with CHP-PRO- reference")
    void testChapaProSubscription() {
        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(providerId);
        profile.setPro(false);
        profile.setConnectsBalance(5);

        when(providerProfileRepository.findByUserId(providerId)).thenReturn(Optional.of(profile));
        when(revenueRepository.save(any(PlatformRevenue.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> res = monetizationService.subscribeToPro(providerId, "CHAPA");

        assertTrue((Boolean) res.get("success"));
        assertTrue(profile.isPro());
        assertNotNull(profile.getProExpiresAt());
        assertEquals(35, profile.getConnectsBalance()); // 5 + 30 bonus connects
        assertTrue(res.get("referenceId").toString().startsWith("CHP-PRO-"));

        ArgumentCaptor<PlatformRevenue> revCaptor = ArgumentCaptor.forClass(PlatformRevenue.class);
        verify(revenueRepository, times(1)).save(revCaptor.capture());
        PlatformRevenue savedRev = revCaptor.getValue();
        assertEquals("CHAPA", savedRev.getPaymentMethod());
        assertEquals(new BigDecimal("299.00"), savedRev.getGrossAmount());
        assertTrue(savedRev.getReferenceId().startsWith("CHP-PRO-"));
    }
}
