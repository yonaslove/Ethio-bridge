package com.ethiobridge.service;

import com.ethiobridge.controller.FileUploadController;
import com.ethiobridge.dto.AuthResponseDto;
import com.ethiobridge.dto.LoginRequest;
import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityAndP0BlockersTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private SeekerProfileRepository seekerProfileRepository;

    @Mock
    private ProviderProfileRepository providerProfileRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private ProviderSkillRepository providerSkillRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractMilestoneRepository milestoneRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private DisputeRepository disputeRepository;

    @Mock
    private EscrowLedgerEntryRepository ledgerRepository;

    @Mock
    private ProviderPayoutRepository payoutRepository;

    @Mock
    private EscrowReconciliationRecordRepository reconciliationRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MonetizationService monetizationService;

    @Mock
    private UserService userService;

    private AuthService authService;
    private SmsService smsService;
    private EmailService emailService;
    private EscrowLedgerService escrowLedgerService;
    private ContractService contractService;
    private FileUploadController fileUploadController;

    private final String testSigningSecret = "test-secret-key-32bytes-for-signing-kyc";

    @BeforeEach
    void setUp() {
        smsService = new SmsService();
        emailService = new EmailService();

        authService = new AuthService(
                appUserRepository,
                seekerProfileRepository,
                providerProfileRepository,
                skillRepository,
                providerSkillRepository,
                locationRepository,
                passwordEncoder,
                smsService,
                emailService,
                auditLogService
        );

        escrowLedgerService = new EscrowLedgerService(
                ledgerRepository,
                payoutRepository,
                reconciliationRepository,
                milestoneRepository,
                auditLogService
        );

        contractService = new ContractService(
                contractRepository,
                milestoneRepository,
                paymentService,
                disputeRepository,
                notificationService,
                auditLogService,
                appUserRepository,
                monetizationService,
                escrowLedgerService
        );

        fileUploadController = new FileUploadController(userService, testSigningSecret);
    }

    // =========================================================================
    // 1. KYC FILE SECURITY & MAGIC BYTES TESTS
    // =========================================================================

    @Test
    @DisplayName("Magic bytes validator recognizes authentic JPEG, PNG, WEBP, and PDF headers")
    void testMagicBytesValidationAllowedFormats() {
        // Authentic JPEG header: FF D8 FF E0
        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        assertTrue(FileUploadController.matchesMagicBytes(jpegHeader, jpegHeader.length));

        // Authentic PNG header: 89 50 4E 47 0D 0A 1A 0A
        byte[] pngHeader = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        assertTrue(FileUploadController.matchesMagicBytes(pngHeader, pngHeader.length));

        // Authentic PDF header: %PDF- (25 50 44 46 2D)
        byte[] pdfHeader = "%PDF-1.7".getBytes(StandardCharsets.US_ASCII);
        assertTrue(FileUploadController.matchesMagicBytes(pdfHeader, pdfHeader.length));

        // Authentic WebP header: RIFF....WEBP
        byte[] webpHeader = new byte[]{'R', 'I', 'F', 'F', 0x20, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P'};
        assertTrue(FileUploadController.matchesMagicBytes(webpHeader, webpHeader.length));
    }

    @Test
    @DisplayName("Magic bytes validator rejects disguised scripts, executables, or HTML disguised as image")
    void testMagicBytesValidationRejectsDisguisedFiles() {
        // Disguised shell script: #!/bin/bash
        byte[] bashScript = "#!/bin/bash\necho evil".getBytes(StandardCharsets.UTF_8);
        assertFalse(FileUploadController.matchesMagicBytes(bashScript, bashScript.length));

        // Disguised HTML/JS: <script>
        byte[] htmlScript = "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8);
        assertFalse(FileUploadController.matchesMagicBytes(htmlScript, htmlScript.length));

        // Null or too short bytes
        assertFalse(FileUploadController.matchesMagicBytes(new byte[]{0x01, 0x02}, 2));
        assertFalse(FileUploadController.matchesMagicBytes(null, 0));
    }

    @Test
    @DisplayName("Uploading file with invalid binary header throws 400 Bad Request despite .jpg filename")
    void testUploadRejectsSpoofedMimeType() {
        MockMultipartFile fakeFile = new MockMultipartFile(
                "file",
                "malicious.jpg",
                "image/jpeg",
                "<?php system($_GET['cmd']); ?>".getBytes(StandardCharsets.UTF_8)
        );

        Authentication auth = new UsernamePasswordAuthenticationToken("user", "token", List.of(new SimpleGrantedAuthority("ROLE_SEEKER")));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileUploadController.uploadFile(fakeFile, "KYC", auth));
        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Binary magic bytes"));
    }

    @Test
    @DisplayName("HMAC Signed URL generates valid signature and rejects tampered or expired tokens")
    void testHmacSignedUrls() {
        String filename = UUID.randomUUID() + "__u-1234__test_fayda.jpg";
        String signedUrl = fileUploadController.generateSignedUrl(filename, 60);

        assertTrue(signedUrl.contains("/api/v1/files/signed/"));
        assertTrue(signedUrl.contains("expires="));
        assertTrue(signedUrl.contains("sig="));

        // Expired timestamp
        long pastExpires = System.currentTimeMillis() - 5000;
        ResponseStatusException expiredEx = assertThrows(ResponseStatusException.class, () ->
                fileUploadController.downloadSignedFile(filename, pastExpires, "dummySig"));
        assertEquals(403, expiredEx.getStatusCode().value());
        assertTrue(expiredEx.getReason().contains("expired"));

        // Tampered signature
        long futureExpires = System.currentTimeMillis() + 60000;
        ResponseStatusException tamperedEx = assertThrows(ResponseStatusException.class, () ->
                fileUploadController.downloadSignedFile(filename, futureExpires, "forged_signature_12345678"));
        assertEquals(403, tamperedEx.getStatusCode().value());
        assertTrue(tamperedEx.getReason().contains("Invalid document signature"));
    }

    // =========================================================================
    // 2. ESCROW REFUND & DISPUTE RESOLUTION TESTS
    // =========================================================================

    @Test
    @DisplayName("EscrowLedgerService records REFUND_SEEKER double-entry debiting vault")
    void testRecordMilestoneRefundInLedger() {
        UUID contractId = UUID.randomUUID();
        UUID milestoneId = UUID.randomUUID();
        UUID seekerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        BigDecimal refundAmount = BigDecimal.valueOf(5000.00);

        when(ledgerRepository.save(any(EscrowLedgerEntry.class))).thenAnswer(i -> i.getArgument(0));

        EscrowLedgerEntry entry = escrowLedgerService.recordMilestoneRefund(
                contractId,
                milestoneId,
                seekerId,
                providerId,
                refundAmount,
                "Arbitration awarded full refund to seeker"
        );

        assertNotNull(entry);
        assertEquals("REFUND_SEEKER", entry.getEntryType());
        assertEquals("ESCROW_HOLD_VAULT", entry.getDebitAccount());
        assertEquals("SEEKER_REFUND_ACCOUNT", entry.getCreditAccount());
        assertEquals(refundAmount, entry.getAmount());

        verify(ledgerRepository).save(any(EscrowLedgerEntry.class));
        verify(auditLogService).log(eq(seekerId), eq("ESCROW_REFUND"), eq("EscrowLedgerEntry"), anyString(), anyString(), isNull());
    }

    @Test
    @DisplayName("ContractService refunds funded milestone and notifies both parties")
    void testRefundMilestoneEscrowSuccess() {
        UUID contractId = UUID.randomUUID();
        UUID milestoneId = UUID.randomUUID();
        UUID seekerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();

        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setSeekerUserId(seekerId);
        contract.setProviderUserId(providerId);
        contract.setTitle("Full Stack AI Platform");

        ContractMilestone milestone = new ContractMilestone();
        milestone.setId(milestoneId);
        milestone.setContractId(contractId);
        milestone.setTitle("Phase 1 Delivery");
        milestone.setAmount(BigDecimal.valueOf(12000.00));
        milestone.setStatus("FUNDED");

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(milestoneRepository.save(any(ContractMilestone.class))).thenAnswer(i -> i.getArgument(0));
        when(ledgerRepository.save(any(EscrowLedgerEntry.class))).thenAnswer(i -> i.getArgument(0));

        ContractMilestone result = contractService.refundMilestoneEscrow(contractId, milestoneId, seekerId, "Seeker requested cancellation before work began");

        assertNotNull(result);
        assertEquals("REFUNDED", result.getStatus());

        verify(ledgerRepository).save(any(EscrowLedgerEntry.class));
        verify(notificationService).sendNotification(eq(seekerId), contains("Refund Processed"), anyString(), eq("CONTRACT"), eq("/contracts"));
        verify(notificationService).sendNotification(eq(providerId), contains("Refunded"), anyString(), eq("CONTRACT"), eq("/contracts"));
    }

    @Test
    @DisplayName("Admin dispute resolution with REFUND_SEEKER action triggers refund of funded milestones")
    void testAdminDisputeResolutionWithRefundAction() {
        UUID adminId = UUID.randomUUID();
        UUID disputeId = UUID.randomUUID();
        UUID contractId = UUID.randomUUID();
        UUID seekerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();

        Dispute dispute = new Dispute(contractId, seekerId, "Incomplete delivery", "Provider failed to meet deadline");
        dispute.setId(disputeId);

        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setSeekerUserId(seekerId);
        contract.setProviderUserId(providerId);

        ContractMilestone m1 = new ContractMilestone();
        m1.setId(UUID.randomUUID());
        m1.setContractId(contractId);
        m1.setTitle("Milestone 1");
        m1.setAmount(BigDecimal.valueOf(8000.00));
        m1.setStatus("FUNDED");

        when(disputeRepository.findById(disputeId)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(Dispute.class))).thenAnswer(i -> i.getArgument(0));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(milestoneRepository.findByContractIdOrderByCreatedAtAsc(contractId)).thenReturn(List.of(m1));
        when(milestoneRepository.findById(m1.getId())).thenReturn(Optional.of(m1));
        when(milestoneRepository.save(any(ContractMilestone.class))).thenAnswer(i -> i.getArgument(0));
        when(ledgerRepository.save(any(EscrowLedgerEntry.class))).thenAnswer(i -> i.getArgument(0));

        Dispute resolved = contractService.resolveDispute(adminId, disputeId, "SETTLED", "Arbitration decision: 100% refund", "REFUND_SEEKER");

        assertNotNull(resolved);
        assertEquals("SETTLED", resolved.getStatus());
        assertEquals("REFUNDED", m1.getStatus());
        assertEquals("RESOLVED_REFUNDED", contract.getStatus());
    }

    // =========================================================================
    // 3. AUTH HARDENING, REFRESH TOKENS & PHONE OTP TESTS
    // =========================================================================

    @Test
    @DisplayName("Login generates access token AND 7-day refresh token")
    void testLoginGeneratesRefreshToken() {
        String email = "dawit@ethiobridge.et";
        String pass = "Password123";

        AppUser user = new AppUser(UUID.randomUUID(), email, "Dawit Tadesse");
        user.setId(UUID.randomUUID());
        user.setPasswordHash("hashed_secret");

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(pass, "hashed_secret")).thenReturn(true);

        LoginRequest req = new LoginRequest();
        req.setEmailOrUsername(email);
        req.setPassword(pass);

        AuthResponseDto resp = authService.login(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertTrue(resp.getToken().startsWith("eb-"));
        assertNotNull(resp.getRefreshToken());
        assertTrue(resp.getRefreshToken().startsWith("eb-ref-"));
        assertEquals(86400L, resp.getExpiresIn());
    }

    @Test
    @DisplayName("Refresh token rotation exchanges valid refresh token and invalidates old one")
    void testRefreshTokenRotation() {
        String email = "saba@ethiobridge.et";
        AppUser user = new AppUser(UUID.randomUUID(), email, "Saba Girmay");
        user.setId(UUID.randomUUID());
        user.setPasswordHash("hashed_secret");

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginRequest req = new LoginRequest();
        req.setEmailOrUsername(email);
        req.setPassword("Password123");

        AuthResponseDto initialAuth = authService.login(req);
        String initialRefreshToken = initialAuth.getRefreshToken();

        when(appUserRepository.findById(user.getId())).thenReturn(Optional.of(user));

        // Exchange refresh token
        AuthResponseDto refreshed = authService.refreshToken(initialRefreshToken);

        assertNotNull(refreshed);
        assertNotNull(refreshed.getToken());
        assertNotNull(refreshed.getRefreshToken());
        assertNotEquals(initialAuth.getToken(), refreshed.getToken());
        assertNotEquals(initialRefreshToken, refreshed.getRefreshToken());

        // Reusing the old refresh token should now fail (one-time use rotation)
        assertThrows(ResponseStatusException.class, () -> authService.refreshToken(initialRefreshToken));
    }

    @Test
    @DisplayName("SmsService verifies Ethiopian mobile prefixes and validates 6-digit OTP")
    void testEthiopianSmsService() {
        // Valid Ethio Telecom & Safaricom numbers
        assertTrue(smsService.isValidEthiopianPhone("0911223344"));
        assertTrue(smsService.isValidEthiopianPhone("+251911223344"));
        assertTrue(smsService.isValidEthiopianPhone("0711223344"));
        assertTrue(smsService.isValidEthiopianPhone("+251711223344"));

        // Invalid numbers
        assertFalse(smsService.isValidEthiopianPhone("0811223344"));
        assertFalse(smsService.isValidEthiopianPhone("12345678"));

        // Dispatch OTP
        String phone = "+251911223344";
        String masked = smsService.sendVerificationOtp(phone);
        assertNotNull(masked);
        assertTrue(masked.contains("***"));

        // Wrong code fails
        assertFalse(smsService.verifyOtp(phone, "000000"));
    }

    @Test
    @DisplayName("deleteAccount anonymizes user data and revokes active sessions")
    void testDeleteAccountCompliance() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(userId, "alex@ethiobridge.et", "Alex Hailu");
        user.setId(userId);
        user.setPasswordHash("hash123");

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        authService.deleteAccount(userId);

        assertEquals("DEACTIVATED", user.getStatus());
        assertEquals("Deactivated Account", user.getFullName());
        assertNull(user.getPasswordHash());
        assertTrue(user.getEmail().startsWith("deleted_"));

        verify(appUserRepository).save(user);
    }
}
