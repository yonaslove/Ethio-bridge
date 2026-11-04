package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.*;

@RestController
@RequestMapping("/api/v1/files")
public class FileUploadController {

    private final Path uploadDir = Paths.get("./uploads").toAbsolutePath().normalize();
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private final UserService userService;
    private final String signingSecret;

    public FileUploadController(UserService userService,
                                @Value("${app.security.file-signing-secret:ethiobridge-kyc-storage-secret-key-2026-auth}") String signingSecret) {
        this.userService = userService;
        this.signingSecret = signingSecret;
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder", e);
        }
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file,
                                                          @RequestParam(value = "category", defaultValue = "GENERAL") String category,
                                                          Authentication auth) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot upload an empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds maximum permitted size of 5 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file format. Allowed types: JPG, PNG, WEBP, PDF");
        }

        // Magic Byte signature verification (protects against disguised executables/scripts)
        byte[] magic = new byte[16];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(magic);
            if (read < 4 || !matchesMagicBytes(magic, read)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid file format. Binary magic bytes do not match allowed types (JPG, PNG, WEBP, PDF).");
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read file stream");
        }

        AppUser user = userService.getOrCreateCurrentUser(auth);
        String userIdStr = user.getId().toString();

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String cleanOriginalName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedFilename = UUID.randomUUID().toString() + "__u-" + userIdStr + "__" + cleanOriginalName;

        try {
            Path targetLocation = uploadDir.resolve(storedFilename).normalize();
            if (!targetLocation.startsWith(uploadDir)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }

        String signedUrl = generateSignedUrl(storedFilename, 15 * 60); // 15 min expiration

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("filename", storedFilename);
        response.put("fileUrl", "/api/v1/files/" + storedFilename);
        response.put("signedUrl", signedUrl);
        response.put("contentType", contentType);
        response.put("size", file.getSize());
        response.put("category", category);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{filename:.+}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename, Authentication auth) {
        Path filePath = resolveAndVerifyPath(filename);
        verifyOwnershipOrAdmin(filename, auth);
        return serveResource(filePath, filename);
    }

    @GetMapping("/signed/{filename:.+}")
    public ResponseEntity<Resource> downloadSignedFile(@PathVariable String filename,
                                                       @RequestParam("expires") long expires,
                                                       @RequestParam("sig") String sig) {
        if (System.currentTimeMillis() > expires) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Signed document link has expired");
        }

        String expectedSig = computeHmac(filename + ":" + expires);
        if (!MessageDigest.isEqual(expectedSig.getBytes(StandardCharsets.UTF_8), sig.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid document signature or tampered URL");
        }

        Path filePath = resolveAndVerifyPath(filename);
        return serveResource(filePath, filename);
    }

    @GetMapping("/signed-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getSignedUrl(@RequestParam("filename") String filename, Authentication auth) {
        verifyOwnershipOrAdmin(filename, auth);
        String signedUrl = generateSignedUrl(filename, 15 * 60);
        return ResponseEntity.ok(Map.of(
                "filename", filename,
                "signedUrl", signedUrl,
                "expiresInSeconds", 900
        ));
    }

    public String generateSignedUrl(String filename, long ttlSeconds) {
        long expires = System.currentTimeMillis() + (ttlSeconds * 1000L);
        String signature = computeHmac(filename + ":" + expires);
        return "/api/v1/files/signed/" + filename + "?expires=" + expires + "&sig=" + signature;
    }

    public static boolean matchesMagicBytes(byte[] header, int length) {
        if (header == null || length < 4) return false;

        // JPEG: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (length >= 8 &&
                (header[0] & 0xFF) == 0x89 && (header[1] & 0xFF) == 0x50 &&
                (header[2] & 0xFF) == 0x4E && (header[3] & 0xFF) == 0x47 &&
                (header[4] & 0xFF) == 0x0D && (header[5] & 0xFF) == 0x0A &&
                (header[6] & 0xFF) == 0x1A && (header[7] & 0xFF) == 0x0A) {
            return true;
        }
        // PDF: %PDF- (25 50 44 46)
        if ((header[0] & 0xFF) == 0x25 && (header[1] & 0xFF) == 0x50 &&
                (header[2] & 0xFF) == 0x44 && (header[3] & 0xFF) == 0x46) {
            return true;
        }
        // WebP: RIFF (bytes 0..3) and WEBP (bytes 8..11)
        if (length >= 12 &&
                header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
                header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return true;
        }
        return false;
    }

    private Path resolveAndVerifyPath(String filename) {
        Path filePath = uploadDir.resolve(filename).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        return filePath;
    }

    private void verifyOwnershipOrAdmin(String filename, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to access documents");
        }

        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return;
        }

        AppUser user = userService.getOrCreateCurrentUser(auth);
        String expectedTag = "__u-" + user.getId().toString() + "__";
        if (filename.contains("__u-")) {
            if (!filename.contains(expectedTag)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: you do not have permission to view this document");
            }
        }
    }

    private ResponseEntity<Resource> serveResource(Path filePath, String filename) {
        try {
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + getSafeOriginalName(filename) + "\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .header(HttpHeaders.CACHE_CONTROL, "private, max-age=900")
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not determine file type");
        }
    }

    private String getSafeOriginalName(String filename) {
        if (filename.contains("__")) {
            String[] parts = filename.split("__");
            return parts[parts.length - 1];
        }
        return filename;
    }

    private String computeHmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
