package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.UserVerification;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.UserVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VerificationServiceTest {

    @Mock
    private UserVerificationRepository verificationRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    private VerificationService verificationService;

    private final UUID userId = UUID.randomUUID();
    private final UUID adminId = UUID.randomUUID();
    private final UUID verificationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        verificationService = new VerificationService(
                verificationRepository,
                userRepository,
                notificationService,
                auditLogService
        );

        lenient().when(verificationRepository.save(any(UserVerification.class)))
                .thenAnswer(invocation -> {
                    UserVerification v = invocation.getArgument(0);
                    if (v.getId() == null) v.setId(verificationId);
                    return v;
                });
    }

    @Test
    @DisplayName("submitVerification initiates KYC submission with AI evaluation")
    void testSubmitVerification() {
        AppUser user = new AppUser(UUID.randomUUID(), "seeker@ethiobridge.et", "Sara Bekele");
        user.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(verificationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.emptyList());

        UserVerification v = verificationService.submitVerification(
                userId, "FAYDA_NATIONAL_ID", "FAN-9876-5432-ET", "+251911223344", "data:image/png;base64,demo", null
        );

        assertNotNull(v);
        assertEquals("FAYDA_NATIONAL_ID", v.getIdType());
        assertEquals("PENDING", v.getStatus());
        assertNotNull(v.getAiScore());
        assertNotNull(v.getAiVerdict());
        verify(verificationRepository).save(any(UserVerification.class));
    }

    @Test
    @DisplayName("reviewVerification approval marks user is_verified true and sends notification")
    void testApproveVerification() {
        AppUser user = new AppUser(UUID.randomUUID(), "provider@ethiobridge.et", "Dawit Tadesse");
        user.setId(userId);
        user.setVerified(false);

        UserVerification v = new UserVerification(userId, "FAYDA_NATIONAL_ID", "FAN-9876-5432-ET", "+251911223344");
        v.setId(verificationId);
        v.setStatus("PENDING");

        when(verificationRepository.findById(verificationId)).thenReturn(Optional.of(v));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserVerification result = verificationService.reviewVerification(adminId, verificationId, true, "Approved - identity matches official Fayda registry.");

        assertEquals("VERIFIED", result.getStatus());
        assertTrue(user.isVerified());
        assertNotNull(result.getVerifiedAt());
        verify(userRepository).save(user);
        verify(notificationService).sendNotification(eq(userId), contains("Verified"), anyString(), eq("VERIFICATION"), anyString());
    }

    @Test
    @DisplayName("reviewVerification rejection marks status REJECTED with feedback")
    void testRejectVerification() {
        AppUser user = new AppUser(UUID.randomUUID(), "provider@ethiobridge.et", "Dawit Tadesse");
        user.setId(userId);

        UserVerification v = new UserVerification(userId, "PASSPORT", "EP1234567", "+251911223344");
        v.setId(verificationId);
        v.setStatus("PENDING");

        when(verificationRepository.findById(verificationId)).thenReturn(Optional.of(v));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserVerification result = verificationService.reviewVerification(adminId, verificationId, false, "Image blurred; please provide clearer document photo.");

        assertEquals("REJECTED", result.getStatus());
        assertFalse(user.isVerified());
        assertEquals("Image blurred; please provide clearer document photo.", result.getRejectionReason());
        verify(notificationService).sendNotification(eq(userId), contains("Declined"), anyString(), eq("VERIFICATION"), anyString());
    }
}
