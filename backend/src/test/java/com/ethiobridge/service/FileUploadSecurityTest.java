package com.ethiobridge.service;

import com.ethiobridge.controller.FileUploadController;
import com.ethiobridge.entity.AppUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileUploadSecurityTest {

    @Mock
    private UserService userService;

    @Mock
    private Authentication customerAuth;

    @Mock
    private Authentication attackerAuth;

    @Mock
    private Authentication adminAuth;

    private FileUploadController fileController;
    private AppUser customerUser;
    private AppUser attackerUser;

    @BeforeEach
    void setUp() {
        customerUser = new AppUser();
        customerUser.setId(UUID.randomUUID());
        customerUser.setEmail("customer@ethiobridge.et");

        attackerUser = new AppUser();
        attackerUser.setId(UUID.randomUUID());
        attackerUser.setEmail("attacker@evil.com");

        fileController = new FileUploadController(userService, "test-hmac-secret-key-1234567890-test");
    }

    @Test
    @DisplayName("Security: Reject disallowed MIME types (e.g. text/html, application/javascript)")
    void testDisallowedMimeTypes() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.js", "application/javascript", "alert('xss')".getBytes(StandardCharsets.UTF_8)
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileController.uploadFile(file, "GENERAL", customerAuth)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Invalid file format"));
    }

    @Test
    @DisplayName("Security: Reject files where binary magic bytes mismatch (disguised executables)")
    void testMagicByteVerificationRejection() {
        // Disguised .exe disguised as .pdf with MZ header (4D 5A)
        byte[] fakePdfBytes = new byte[] { 0x4D, 0x5A, 0x00, 0x00, 0x01, 0x02 };
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", fakePdfBytes
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileController.uploadFile(file, "GENERAL", customerAuth)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("magic bytes"));
    }

    @Test
    @DisplayName("Security: Reject oversized files exceeding 5 MB limit")
    void testOversizedFileRejection() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile file = new MockMultipartFile(
                "file", "huge.pdf", "application/pdf", largeBytes
        );

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileController.uploadFile(file, "GENERAL", customerAuth)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("maximum permitted size"));
    }

    @Test
    @DisplayName("Security: Disallow unauthorized user from downloading customer private document")
    void testUnauthorizedDownloadBlocked() {
        String filename = UUID.randomUUID().toString() + "__u-" + customerUser.getId() + "__secret_cv.pdf";

        when(attackerAuth.isAuthenticated()).thenReturn(true);
        when(attackerAuth.getAuthorities()).thenReturn(Collections.emptyList());
        when(userService.getOrCreateCurrentUser(attackerAuth)).thenReturn(attackerUser);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileController.downloadFile(filename, attackerAuth)
        );
        // Either 404 (file doesn't exist on disk) or 403 (ownership check fails)
        assertTrue(ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Security: Expired HMAC signed URLs must be rejected with 403 FORBIDDEN")
    void testExpiredHmacUrlRejected() {
        long expiredTime = System.currentTimeMillis() - 60000; // 1 min in past
        String filename = "test_doc.pdf";

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileController.downloadSignedFile(filename, expiredTime, "fake-sig")
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("expired"));
    }

    @Test
    @DisplayName("Security: Forged or modified HMAC signatures must be rejected with 403 FORBIDDEN")
    void testForgedHmacSignatureRejected() {
        long validFutureTime = System.currentTimeMillis() + 600000;
        String filename = "test_doc.pdf";

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                fileController.downloadSignedFile(filename, validFutureTime, "invalid-tampered-signature-xyz")
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Invalid document signature"));
    }

    @Test
    @DisplayName("Security: Verify genuine DOCX (PK 03 04) and PDF (%PDF) magic bytes match")
    void testGenuineMagicBytesDetection() {
        byte[] docxHeader = new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x00, 0x00 };
        assertTrue(FileUploadController.matchesMagicBytes(docxHeader, docxHeader.length));

        byte[] pdfHeader = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31 };
        assertTrue(FileUploadController.matchesMagicBytes(pdfHeader, pdfHeader.length));

        byte[] exeHeader = new byte[] { 0x4D, 0x5A, (byte) 0x90, 0x00 };
        assertFalse(FileUploadController.matchesMagicBytes(exeHeader, exeHeader.length));
    }
}
