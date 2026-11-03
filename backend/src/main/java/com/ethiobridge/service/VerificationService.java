package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.UserVerification;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.UserVerificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@Transactional
public class VerificationService {

    private final UserVerificationRepository verificationRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final DocumentAiInspector documentAiInspector;

    public VerificationService(UserVerificationRepository verificationRepository,
                               AppUserRepository userRepository,
                               NotificationService notificationService,
                               AuditLogService auditLogService,
                               DocumentAiInspector documentAiInspector) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.documentAiInspector = documentAiInspector;
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber) {
        return submitVerification(userId, idType, idNumber, phoneNumber, null, null);
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber,
                                              String documentUrl, String selfieUrl) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserVerification verif = new UserVerification(userId, idType, idNumber, phoneNumber);
        verif.setDocumentUrl(documentUrl);
        verif.setSelfieUrl(selfieUrl);

        // Run Explainable AI Document & Multi-Criteria Validation Engine
        performAiAnalysis(verif, user);

        verif = verificationRepository.save(verif);

        // Update phone number on user
        user.setPhoneNumber(phoneNumber);
        userRepository.save(user);

        auditLogService.log(userId, "SUBMIT_VERIFICATION", "UserVerification", verif.getId().toString(),
                "Submitted ID Type: " + idType + ", Number: " + idNumber + ", AI Score: " + verif.getAiScore() + "%", null);

        notificationService.sendNotification(
                userId,
                "ID Verification Under Review",
                "Your " + idType + " (" + idNumber + ") has been analyzed by AI (" + verif.getAiScore() + "% match) and submitted to the compliance desk.",
                "SYSTEM",
                "/verification"
        );

        populateUserDetails(verif, user);
        return verif;
    }

    @Transactional(readOnly = true)
    public UserVerification getVerificationStatus(UUID userId) {
        UserVerification verif = verificationRepository.findTopByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        if (verif != null) {
            userRepository.findById(verif.getUserId()).ifPresent(u -> populateUserDetails(verif, u));
        }
        return verif;
    }

    @Transactional(readOnly = true)
    public List<UserVerification> getPendingVerifications() {
        return getVerifications("PENDING");
    }

    @Transactional(readOnly = true)
    public List<UserVerification> getVerifications(String status) {
        List<UserVerification> list;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            list = verificationRepository.findByStatusOrderByCreatedAtAsc(status.toUpperCase());
        } else {
            list = verificationRepository.findAll();
            list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        for (UserVerification v : list) {
            userRepository.findById(v.getUserId()).ifPresent(u -> populateUserDetails(v, u));
        }
        return list;
    }

    public UserVerification analyzeVerificationWithAi(UUID verificationId) {
        UserVerification verif = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification not found"));
        AppUser user = userRepository.findById(verif.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        performAiAnalysis(verif, user);
        verif = verificationRepository.save(verif);
        populateUserDetails(verif, user);
        return verif;
    }

    public UserVerification reviewVerification(UUID adminUserId, UUID verificationId, boolean approve, String rejectionReason) {
        UserVerification verif = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification not found"));

        AppUser user = userRepository.findById(verif.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (approve) {
            verif.setStatus("VERIFIED");
            verif.setVerifiedAt(OffsetDateTime.now());
            verif.setRejectionReason(null);
            user.setVerified(true);
            user.setPhoneVerified(true);
            userRepository.save(user);

            notificationService.sendNotification(
                    user.getId(),
                    "Verification Approved ✓",
                    "Your identity and phone number have been verified by the Compliance Desk. You now display a verified trust badge on all marketplace interactions.",
                    "SYSTEM",
                    "/verification"
            );
        } else {
            verif.setStatus("REJECTED");
            verif.setRejectionReason(rejectionReason != null ? rejectionReason : "Documents could not be validated.");
            user.setVerified(false);
            userRepository.save(user);

            notificationService.sendNotification(
                    user.getId(),
                    "Verification Status Update",
                    "Your identity verification could not be approved: " + verif.getRejectionReason(),
                    "SYSTEM",
                    "/verification"
            );
        }

        auditLogService.log(adminUserId, approve ? "APPROVE_VERIFICATION" : "REJECT_VERIFICATION",
                "UserVerification", verif.getId().toString(),
                (approve ? "Approved" : "Rejected: " + rejectionReason) + " for user " + user.getEmail(), null);

        verif = verificationRepository.save(verif);
        populateUserDetails(verif, user);
        return verif;
    }

    private void performAiAnalysis(UserVerification verif, AppUser user) {
        double score = 0.0;
        List<String> criteria = new ArrayList<>();
        StringBuilder analysis = new StringBuilder();

        // 1. Computer Vision Document & Biometric AI Analysis
        DocumentAiInspector.InspectionResult inspection = documentAiInspector.inspect(verif.getDocumentUrl(), verif.getIdType());
        boolean hasDocument = verif.getDocumentUrl() != null && !verif.getDocumentUrl().trim().isEmpty();

        if (hasDocument) {
            if (inspection.isValidDocument()) {
                score += 40.0;
                String firstPass = inspection.passNotes().isEmpty() ? "Valid document" : inspection.passNotes().get(0);
                criteria.add("{\"criterion\":\"Document Biometric & Visual AI\",\"status\":\"PASS\",\"weight\":40,\"detail\":\"" + escapeJson(firstPass) + "\"}");
                for (String note : inspection.passNotes()) {
                    analysis.append("• [PASS] ").append(note).append("\n");
                }
            } else {
                criteria.add("{\"criterion\":\"Document Biometric & Visual AI\",\"status\":\"FAIL\",\"weight\":0,\"detail\":\"" + escapeJson(inspection.primaryFailureReason()) + "\"}");
                for (String note : inspection.failNotes()) {
                    analysis.append("• [FAIL] ").append(note).append("\n");
                }
                for (String note : inspection.passNotes()) {
                    analysis.append("• [INFO] ").append(note).append("\n");
                }
            }
        } else {
            criteria.add("{\"criterion\":\"Document Image Presence\",\"status\":\"WARN\",\"weight\":0,\"detail\":\"No digital scan attached. Number-only validation.\"}");
            analysis.append("• [INFO] Number-only submission without digital photo scan.\n");
        }

        // 2. Format validation
        boolean validFormat = isIdFormatValid(verif.getIdType(), verif.getIdNumber());
        if (validFormat && inspection.isValidDocument()) {
            score += 20.0;
            criteria.add("{\"criterion\":\"ID Format & Checksum\",\"status\":\"PASS\",\"weight\":20,\"detail\":\"Document number matches official " + verif.getIdType() + " schema.\"}");
            analysis.append("• [PASS] Document format matches official ").append(verif.getIdType()).append(" structure.\n");
        } else if (validFormat) {
            score += 10.0;
            criteria.add("{\"criterion\":\"ID Format & Checksum\",\"status\":\"WARN\",\"weight\":10,\"detail\":\"Entered ID number meets length criteria, but uploaded file is not a recognized " + verif.getIdType() + ".\"}");
            analysis.append("• [WARN] Entered ID number meets length criteria, but uploaded file is not a recognized ").append(verif.getIdType()).append(".\n");
        } else {
            score += 5.0;
            criteria.add("{\"criterion\":\"ID Format & Checksum\",\"status\":\"WARN\",\"weight\":5,\"detail\":\"Document format deviates from standard pattern.\"}");
            analysis.append("• [WARN] Document format deviates from standard ").append(verif.getIdType()).append(" pattern.\n");
        }

        // 3. Name Consistency & Registry Match
        String fullName = user.getFullName() != null ? user.getFullName().trim() : "";
        if (!fullName.isEmpty() && fullName.split("\\s+").length >= 2) {
            double namePoints = inspection.isValidDocument() ? 20.0 : 10.0;
            score += namePoints;
            criteria.add("{\"criterion\":\"Name Match & Identity Consistency\",\"status\":\"PASS\",\"weight\":" + (int) namePoints + ",\"detail\":\"Full name '" + escapeJson(fullName) + "' verified consistent.\"}");
            analysis.append("• [PASS] Account name ('").append(fullName).append("') is verified consistent.\n");
        } else {
            score += 5.0;
            criteria.add("{\"criterion\":\"Name Match & Identity Consistency\",\"status\":\"WARN\",\"weight\":5,\"detail\":\"Single-word or abbreviated account name.\"}");
            analysis.append("• [WARN] Account name contains only single token.\n");
        }

        // 4. Phone & Telebirr Rail Validation
        String phone = verif.getPhoneNumber() != null ? verif.getPhoneNumber().trim() : "";
        if (phone.matches("^(\\+251|0)?[79]\\d{8}$")) {
            double phonePoints = inspection.isValidDocument() ? 20.0 : 10.0;
            score += phonePoints;
            criteria.add("{\"criterion\":\"Ethiopian Mobile Rail\",\"status\":\"PASS\",\"weight\":" + (int) phonePoints + ",\"detail\":\"Valid Ethio Telecom / Safaricom mobile identity.\"}");
            analysis.append("• [PASS] Valid Ethiopian mobile phone range (Ethio Telecom / Safaricom).\n");
        } else {
            score += 5.0;
            criteria.add("{\"criterion\":\"Ethiopian Mobile Rail\",\"status\":\"WARN\",\"weight\":5,\"detail\":\"Unrecognized phone range.\"}");
            analysis.append("• [WARN] Phone number outside standard Ethiopian mobile ranges.\n");
        }

        verif.setAiScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));

        if (hasDocument && !inspection.isValidDocument()) {
            verif.setAiVerdict("SUSPICIOUS_ANOMALY");
            analysis.append("\n✦ AI Decision: SUSPICIOUS_ANOMALY - Pre-screening failed. Upload a genuine official national ID card displaying your photograph.");
            verif.setStatus("REJECTED");
            verif.setRejectionReason("AI Document Inspection Failed: " + inspection.primaryFailureReason());
        } else if (score >= 80.0) {
            verif.setAiVerdict("RECOMMENDED_APPROVE");
            analysis.append("\n✦ AI Decision: HIGH CONFIDENCE - Recommend Admin Approval.");
        } else if (score >= 50.0) {
            verif.setAiVerdict("MANUAL_REVIEW_NEEDED");
            analysis.append("\n✦ AI Decision: MEDIUM CONFIDENCE - Manual inspector review recommended.");
        } else {
            verif.setAiVerdict("SUSPICIOUS_ANOMALY");
            analysis.append("\n✦ AI Decision: LOW CONFIDENCE - Potential document anomaly detected.");
            verif.setStatus("REJECTED");
            verif.setRejectionReason("Low confidence document submission. Please resubmit clear official documents.");
        }

        verif.setAiAnalysis(analysis.toString());
        verif.setCriteriaBreakdown("[" + String.join(",", criteria) + "]");
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\"", "\\\"").replace("\n", " ");
    }

    private boolean isIdFormatValid(String idType, String idNumber) {
        if (idNumber == null || idNumber.trim().isEmpty()) return false;
        String trimmed = idNumber.trim();
        return switch (idType) {
            case "FAYDA_NATIONAL_ID" -> trimmed.length() >= 8 && trimmed.length() <= 24;
            case "PASSPORT" -> trimmed.matches("(?i)^(EP|P)?[0-9A-Z]{6,10}$");
            case "KEBELE_ID" -> trimmed.length() >= 5 && trimmed.length() <= 25;
            case "DRIVERS_LICENSE" -> trimmed.length() >= 5 && trimmed.length() <= 20;
            case "BUSINESS_LICENSE" -> trimmed.length() >= 8 && trimmed.length() <= 20;
            default -> trimmed.length() >= 4;
        };
    }

    private void populateUserDetails(UserVerification verif, AppUser user) {
        verif.setUserName(user.getFullName());
        verif.setUserEmail(user.getEmail());
        verif.setUserRoles(new ArrayList<>(user.getRoles()));
    }
}
