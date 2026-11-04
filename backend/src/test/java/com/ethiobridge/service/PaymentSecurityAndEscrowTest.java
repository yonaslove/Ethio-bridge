package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentSecurityAndEscrowTest {

    @Mock
    private PaymentTransactionRepository paymentRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private AppUserRepository userRepository;
    @Mock
    private ContractMilestoneRepository milestoneRepository;
    @Mock
    private ContractRepository contractRepository;
    @Mock
    private ProviderProfileRepository providerProfileRepository;
    @Mock
    private PlatformRevenueRepository revenueRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private PaymentWebhookLogRepository webhookLogRepository;
    @Mock
    private EscrowLedgerEntryRepository ledgerRepository;
    @Mock
    private ProviderPayoutRepository payoutRepository;
    @Mock
    private EscrowReconciliationRecordRepository reconciliationRepository;
    @Mock
    private MonetizationService monetizationService;

    private EscrowLedgerService escrowLedgerService;
    private PaymentService paymentService;
    private ContractService contractService;

    private final String webhookSecret = "test-webhook-secret-key-12345";
    private final UUID seekerId = UUID.randomUUID();
    private final UUID providerId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();
    private final UUID milestoneId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        escrowLedgerService = new EscrowLedgerService(
                ledgerRepository,
                payoutRepository,
                reconciliationRepository,
                milestoneRepository,
                auditLogService
        );

        paymentService = new PaymentService(
                paymentRepository,
                auditLogService,
                userRepository,
                milestoneRepository,
                contractRepository,
                providerProfileRepository,
                revenueRepository,
                notificationService,
                webhookLogRepository,
                escrowLedgerService
        );
        ReflectionTestUtils.setField(paymentService, "chapaWebhookSecret", webhookSecret);

        contractService = new ContractService(
                contractRepository,
                milestoneRepository,
                paymentService,
                null,
                notificationService,
                auditLogService,
                userRepository,
                monetizationService,
                escrowLedgerService
        );

        lenient().when(paymentRepository.save(any(PaymentTransaction.class)))
                .thenAnswer(i -> {
                    PaymentTransaction tx = i.getArgument(0);
                    if (tx.getId() == null) tx.setId(UUID.randomUUID());
                    return tx;
                });
        lenient().when(ledgerRepository.save(any(EscrowLedgerEntry.class)))
                .thenAnswer(i -> {
                    EscrowLedgerEntry e = i.getArgument(0);
                    if (e.getId() == null) e.setId(UUID.randomUUID());
                    return e;
                });
        lenient().when(payoutRepository.save(any(ProviderPayout.class)))
                .thenAnswer(i -> {
                    ProviderPayout p = i.getArgument(0);
                    if (p.getId() == null) p.setId(UUID.randomUUID());
                    return p;
                });
    }

    private String calculateHmac(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] bytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    @Test
    @DisplayName("Webhook Security: rejects webhook with missing or invalid HMAC-SHA256 signature")
    void shouldRejectWebhookWithInvalidSignature() {
        String payload = "{\"status\":\"success\",\"tx_ref\":\"CHP-12345\"}";
        String invalidSig = "bad-signature-hash";

        assertThrows(ResponseStatusException.class, () ->
                paymentService.processChapaWebhook(payload, invalidSig, "KEY-1"));
    }

    @Test
    @DisplayName("Webhook Fulfillment: valid signature credits connects tokens and records platform revenue")
    void shouldProcessWebhookWithValidHmacSha256SignatureAndCreditConnects() throws Exception {
        String txRef = "CHP-CON-9999";
        String payload = "{\"status\":\"success\",\"tx_ref\":\"" + txRef + "\",\"amount\":100.00}";
        String validSig = calculateHmac(payload, webhookSecret);

        PaymentTransaction tx = new PaymentTransaction(null, null, providerId, new BigDecimal("100.00"), "CHAPA", txRef, "INITIATED");
        tx.setProviderResponse("CONNECTS_TOPUP:25");

        ProviderProfile profile = new ProviderProfile();
        profile.setId(UUID.randomUUID());
        profile.setUserId(providerId);
        profile.setConnectsBalance(10);

        when(paymentRepository.findByTransactionRef(txRef)).thenReturn(Optional.of(tx));
        when(providerProfileRepository.findByUserId(providerId)).thenReturn(Optional.of(profile));

        Map<String, Object> result = paymentService.processChapaWebhook(payload, validSig, "KEY-VALID-1");

        assertNotNull(result);
        assertEquals("SUCCESS", result.get("status"));
        assertEquals(35, profile.getConnectsBalance(), "Connects balance must be incremented by 25");
        verify(revenueRepository, times(1)).save(any(PlatformRevenue.class));
        assertEquals("SUCCESS", tx.getStatus());
    }

    @Test
    @DisplayName("Idempotency Protection: duplicate webhook delivery is safely ignored")
    void shouldRejectDuplicateWebhookWithIdempotencyProtection() throws Exception {
        String txRef = "CHP-IDEMP-01";
        String payload = "{\"status\":\"success\",\"tx_ref\":\"" + txRef + "\"}";
        String validSig = calculateHmac(payload, webhookSecret);
        String idempKey = "IDEMP-KEY-999";

        PaymentWebhookLog existingLog = new PaymentWebhookLog("CHAPA", "CHARGE", txRef, true, idempKey, payload, "PROCESSED");
        when(webhookLogRepository.findByIdempotencyKey(idempKey)).thenReturn(Optional.of(existingLog));

        Map<String, Object> result = paymentService.processChapaWebhook(payload, validSig, idempKey);

        assertEquals("already_processed", result.get("status"));
        verify(paymentRepository, never()).findByTransactionRef(any());
    }

    @Test
    @DisplayName("Verify Endpoint Security: non-owner user cannot verify another user's transaction")
    void shouldEnforceOwnershipOnPaymentVerification() {
        String txRef = "CHP-OWNER-TEST";
        UUID anotherUser = UUID.randomUUID();

        PaymentTransaction tx = new PaymentTransaction(contractId, milestoneId, seekerId, new BigDecimal("500.00"), "CHAPA", txRef, "INITIATED");
        when(paymentRepository.findByTransactionRef(txRef)).thenReturn(Optional.of(tx));

        assertThrows(ResponseStatusException.class, () ->
                paymentService.verifyChapaPayment(txRef, anotherUser, false));
    }

    @Test
    @DisplayName("Verify Bypass Prevention: unverified transaction is NOT auto-approved by ref prefix")
    void shouldNotAutoVerifyInsecureTestPrefixes() {
        String txRef = "CHP-BYPASS-ATTEMPT";

        PaymentTransaction tx = new PaymentTransaction(contractId, milestoneId, seekerId, new BigDecimal("5000.00"), "CHAPA", txRef, "INITIATED");
        when(paymentRepository.findByTransactionRef(txRef)).thenReturn(Optional.of(tx));

        Map<String, Object> result = paymentService.verifyChapaPayment(txRef, seekerId, false);

        assertNotEquals("SUCCESS", result.get("status"));
        assertEquals("PENDING_OR_FAILED", result.get("status"));
        assertNotEquals("SUCCESS", tx.getStatus(), "Transaction must not be auto-promoted to SUCCESS");
    }

    @Test
    @DisplayName("Real Escrow Ledger: fundMilestone records DEPOSIT_HOLD in platform escrow vault")
    void shouldRecordEscrowHoldInDoubleEntryLedger() {
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setSeekerUserId(seekerId);
        contract.setProviderUserId(providerId);
        contract.setTitle("E-Commerce Web Platform");

        ContractMilestone milestone = new ContractMilestone();
        milestone.setId(milestoneId);
        milestone.setContractId(contractId);
        milestone.setTitle("Milestone 1");
        milestone.setAmount(new BigDecimal("10000.00"));
        milestone.setStatus("PENDING");

        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(milestoneRepository.save(any(ContractMilestone.class))).thenAnswer(i -> i.getArgument(0));

        ContractMilestone funded = contractService.fundMilestone(seekerId, milestoneId, "TELEBIRR");

        assertEquals("FUNDED", funded.getStatus());
        verify(ledgerRepository, times(1)).save(argThat(entry ->
                "DEPOSIT_HOLD".equals(entry.getEntryType()) &&
                "ESCROW_HOLD_VAULT".equals(entry.getCreditAccount()) &&
                new BigDecimal("10000.00").compareTo(entry.getAmount()) == 0
        ));
    }

    @Test
    @DisplayName("Real Escrow Release: releaseMilestone settles ProviderPayout (90%) and Commission (10%)")
    void shouldReleaseEscrowWithProviderPayoutAndPlatformFee() {
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setSeekerUserId(seekerId);
        contract.setProviderUserId(providerId);
        contract.setTitle("Mobile App");

        ContractMilestone milestone = new ContractMilestone();
        milestone.setId(milestoneId);
        milestone.setContractId(contractId);
        milestone.setTitle("Backend API");
        milestone.setAmount(new BigDecimal("20000.00"));
        milestone.setStatus("FUNDED");

        AppUser provider = new AppUser();
        provider.setId(providerId);
        provider.setPhoneNumber("+251911223344");

        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(milestoneRepository.save(any(ContractMilestone.class))).thenAnswer(i -> i.getArgument(0));
        when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(milestoneRepository.findByContractIdOrderByCreatedAtAsc(contractId)).thenReturn(List.of(milestone));

        ContractMilestone released = contractService.releaseMilestone(seekerId, milestoneId);

        assertEquals("RELEASED", released.getStatus());
        assertEquals(new BigDecimal("2000.00"), released.getPlatformFeeAmount(), "10% fee must be 2000 ETB");
        assertEquals(new BigDecimal("18000.00"), released.getNetPayoutAmount(), "90% net payout must be 18000 ETB");

        verify(payoutRepository, times(1)).save(argThat(payout ->
                payout.getProviderUserId().equals(providerId) &&
                new BigDecimal("18000.00").compareTo(payout.getNetAmount()) == 0 &&
                "SETTLED".equals(payout.getStatus()) &&
                payout.getPayoutReference().startsWith("PAYOUT-")
        ));

        verify(ledgerRepository, times(1)).save(argThat(entry ->
                "RELEASE_PAYOUT".equals(entry.getEntryType()) &&
                new BigDecimal("18000.00").compareTo(entry.getAmount()) == 0
        ));
        verify(ledgerRepository, times(1)).save(argThat(entry ->
                "COMMISSION_FEE".equals(entry.getEntryType()) &&
                new BigDecimal("2000.00").compareTo(entry.getAmount()) == 0
        ));
    }
}
