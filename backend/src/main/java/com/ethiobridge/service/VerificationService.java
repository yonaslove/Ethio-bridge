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
    private final SmsService smsService;

    public VerificationService(UserVerificationRepository verificationRepository,
                               AppUserRepository userRepository,
                               NotificationService notificationService,
                               AuditLogService auditLogService,
                               DocumentAiInspector documentAiInspector,
                               SmsService smsService) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.documentAiInspector = documentAiInspector;
        this.smsService = smsService;
    }

    public SmsService.OtpSendResult sendVerificationOtp(UUID userId, String phoneNumber) {
        if (smsService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS Service is unavailable");
        }
        SmsService.OtpSendResult res = smsService.sendVerificationOtp(phoneNumber);
        if (notificationService != null) {
            notificationService.sendNotification(
                    userId,
                    "Ethio Telecom / Safaricom SMS OTP",
                    "Your phone verification security code is " + res.code() + ". Valid for 5 minutes.",
                    "SYSTEM",
                    "/verification"
            );
        }
        return res;
    }

    public boolean verifyOtpCode(UUID userId, String phoneNumber, String code) {
        if (smsService == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMS Service is unavailable");
        }
        boolean ok = smsService.verifyOtp(phoneNumber, code);
        if (ok) {
            userRepository.findById(userId).ifPresent(u -> {
                u.setPhoneVerified(true);
                u.setPhoneNumber(smsService.normalizeEthiopianPhone(phoneNumber));
                userRepository.save(u);
            });
        }
        return ok;
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber) {
        return submitVerification(userId, idType, idNumber, phoneNumber, null, null, null);
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber,
                                              String documentUrl, String selfieUrl) {
        return submitVerification(userId, idType, idNumber, phoneNumber, documentUrl, null, selfieUrl);
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber,
                                              String documentUrl, String documentBackUrl, String selfieUrl) {
        return submitVerification(userId, idType, idNumber, phoneNumber, documentUrl, documentBackUrl, selfieUrl, null, null);
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber,
                                              String documentUrl, String documentBackUrl, String selfieUrl, String documentName) {
        return submitVerification(userId, idType, idNumber, phoneNumber, documentUrl, documentBackUrl, selfieUrl, documentName, null);
    }

    public UserVerification submitVerification(UUID userId, String idType, String idNumber, String phoneNumber,
                                              String documentUrl, String documentBackUrl, String selfieUrl, String documentName, String documentFileName) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserVerification verif = new UserVerification(userId, idType, idNumber, phoneNumber);
        verif.setDocumentUrl(documentUrl);
        verif.setDocumentBackUrl(documentBackUrl);
        verif.setSelfieUrl(selfieUrl);

        // Extract effective document name from user input or uploaded file clues
        String effectiveDocName = (documentName != null && !documentName.isBlank()) ? documentName.trim() : "";
        if (effectiveDocName.isBlank()) {
            String extracted = extractNameFromClues(documentFileName, documentUrl);
            if (extracted != null && !extracted.isBlank()) {
                effectiveDocName = extracted;
            }
        }
        verif.setDocumentName(effectiveDocName);

        // Run Explainable AI Document & Multi-Criteria Validation Engine
        performAiAnalysis(verif, user);

        verif = verificationRepository.save(verif);

        // Update phone number on user
        user.setPhoneNumber(phoneNumber);
        userRepository.save(user);

        auditLogService.log(userId, "SUBMIT_VERIFICATION", "UserVerification", verif.getId().toString(),
                "Submitted ID Type: " + idType + ", Number: " + idNumber + ", Name: " + verif.getDocumentName() + ", AI Score: " + verif.getAiScore() + "%", null);

        notificationService.sendNotification(
                userId,
                "ID Verification " + ("REJECTED".equals(verif.getStatus()) ? "Rejected (Name Mismatch)" : "Under Review"),
                "REJECTED".equals(verif.getStatus())
                        ? verif.getRejectionReason()
                        : "Your " + idType + " (" + idNumber + ") has been analyzed by AI (" + verif.getAiScore() + "% match) and submitted to the compliance desk.",
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
        boolean hasBackDocument = verif.getDocumentBackUrl() != null && !verif.getDocumentBackUrl().trim().isEmpty();

        if (hasDocument) {
            if (inspection.isValidDocument()) {
                score += 40.0;
                String firstPass = inspection.passNotes().isEmpty() ? "Valid document" : inspection.passNotes().get(0);
                criteria.add("{\"criterion\":\"Document Biometric & Visual AI\",\"status\":\"PASS\",\"weight\":40,\"detail\":\"" + escapeJson(firstPass) + "\"}");
                for (String note : inspection.passNotes()) {
                    analysis.append("• [PASS] ").append(note).append("\n");
                }
                if (hasBackDocument) {
                    analysis.append("• [PASS] Two-sided document verified: Both Front and Back ID scans attached.\n");
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
        String registeredName = user.getFullName() != null ? user.getFullName().trim() : "";
        String docName = verif.getDocumentName() != null ? verif.getDocumentName().trim() : "";

        // Check if uploaded document clues (file name or metadata) carry a different person's identity
        String detectedClueName = extractNameFromClues(verif.getDocumentUrl(), verif.getDocumentBackUrl());
        if (detectedClueName != null && !detectedClueName.isBlank()) {
            NameMatchResult clueMatch = evaluateNameMatch(registeredName, detectedClueName);
            if (!clueMatch.isMatch()) {
                docName = detectedClueName;
                verif.setDocumentName(docName);
            }
        }

        NameMatchResult nameMatch = evaluateNameMatch(registeredName, docName);
        boolean namePassed = nameMatch.isMatch() && !docName.isBlank();

        if (namePassed) {
            double namePoints = inspection.isValidDocument() ? 25.0 : 15.0;
            score += namePoints;
            criteria.add("{\"criterion\":\"Name Match & Identity Consistency\",\"status\":\"PASS\",\"weight\":" + (int) namePoints + ",\"detail\":\"Registered name '" + escapeJson(registeredName) + "' matches ID name '" + escapeJson(docName) + "' (" + (int)(nameMatch.similarity() * 100) + "% similarity).\"}");
            analysis.append("• [PASS] Name Consistency Verified: Registered name ('").append(registeredName)
                    .append("') is consistent with ID card name ('").append(docName)
                    .append("') with ").append((int)(nameMatch.similarity() * 100)).append("% similarity score.\n");
        } else {
            criteria.add("{\"criterion\":\"Name Match & Identity Consistency\",\"status\":\"FAIL\",\"weight\":0,\"detail\":\"Severe Name Discrepancy: Registered name '" + escapeJson(registeredName) + "' does not match ID name '" + escapeJson(docName.isEmpty() ? "Unspecified" : docName) + "'. Verification rejected.\"}");
            analysis.append("• [FAIL] Name Mismatch Error: Registered account name ('").append(registeredName)
                    .append("') differs from ID document name ('").append(docName.isEmpty() ? "Unspecified" : docName)
                    .append("'). National civil identity regulations mandate that registered users verify their own personal identity card.\n");

            verif.setStatus("REJECTED");
            verif.setAiVerdict("REJECTED_NAME_MISMATCH");
            verif.setRejectionReason("Identity Name Mismatch: Registered account name ('" + registeredName + "') and ID document name ('" + (docName.isEmpty() ? "Unspecified" : docName) + "') do not match. Platform security regulations strictly prohibit verifying an account using someone else's identity card.");
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

        if ("REJECTED".equals(verif.getStatus())) {
            // Cap score and finalize rejection message
            score = Math.min(score, 20.0);
            verif.setAiScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
            analysis.append("\n✦ AI Decision: REJECTED_NAME_MISMATCH - Submission rejected due to identity mismatch between registered user account ('")
                    .append(registeredName).append("') and ID document ('").append(docName.isEmpty() ? "Unspecified" : docName).append("').");
        } else {
            verif.setAiScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
        }

        if ("REJECTED".equals(verif.getStatus())) {
            // Already flagged as rejected due to severe name mismatch
        } else if (hasDocument && !inspection.isValidDocument()) {
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

    /**
     * Evaluates whether the registered account name and the ID document name are sufficiently similar
     * according to Ethiopian patronymic naming conventions (Given Name, Father's Name, Grandfather's Name).
     */
    public NameMatchResult evaluateNameMatch(String registeredName, String docName) {
        if (registeredName == null || registeredName.isBlank()) {
            return new NameMatchResult(false, 0.0, "Registered account has no full name.");
        }
        if (docName == null || docName.isBlank()) {
            return new NameMatchResult(false, 0.0, "ID document name is blank.");
        }

        String regClean = cleanName(registeredName);
        String docClean = cleanName(docName);

        if (regClean.equalsIgnoreCase(docClean)) {
            return new NameMatchResult(true, 1.0, "Exact character match.");
        }

        String[] regTokens = regClean.split("\\s+");
        String[] docTokens = docClean.split("\\s+");

        // Ethiopian name matching logic:
        // Token 0: Given Name (Sara, Dawit, etc.)
        // Token 1: Father's Name (Bekele, Tadesse, etc.)
        // Token 2 (optional): Grandfather's Name
        
        // 1. Compare First/Given Name (Critical: must match with high similarity)
        String regFirst = regTokens.length > 0 ? regTokens[0] : "";
        String docFirst = docTokens.length > 0 ? docTokens[0] : "";

        double firstSim = calculateJaroWinklerSimilarity(regFirst, docFirst);
        if (firstSim < 0.78 && !isTokenSimilar(regFirst, docFirst)) {
            return new NameMatchResult(false, firstSim, "First/Given name mismatch: '" + regFirst + "' vs '" + docFirst + "'");
        }

        // 2. Compare Second/Father's Name if both provide at least 2 tokens
        if (regTokens.length >= 2 && docTokens.length >= 2) {
            String regSecond = regTokens[1];
            String docSecond = docTokens[1];
            double secondSim = calculateJaroWinklerSimilarity(regSecond, docSecond);
            if (secondSim < 0.75 && !isTokenSimilar(regSecond, docSecond)) {
                return new NameMatchResult(false, (firstSim + secondSim) / 2.0, "Father's name mismatch: '" + regSecond + "' vs '" + docSecond + "'");
            }
        }

        // 3. Overall Jaro-Winkler & Token Overlap Similarity
        double overallJaro = calculateJaroWinklerSimilarity(regClean, docClean);

        // Count how many registered tokens are present in doc tokens
        int matchedTokens = 0;
        for (String rt : regTokens) {
            for (String dt : docTokens) {
                if (isTokenSimilar(rt, dt) || calculateJaroWinklerSimilarity(rt, dt) >= 0.82) {
                    matchedTokens++;
                    break;
                }
            }
        }

        double tokenCoverage = (double) matchedTokens / Math.max(1, regTokens.length);
        double finalScore = Math.max(overallJaro, tokenCoverage);

        boolean isMatch = finalScore >= 0.70;
        return new NameMatchResult(isMatch, finalScore, isMatch ? "Compatible Ethiopian name structure." : "Insufficient name overlap.");
    }

    private String cleanName(String name) {
        if (name == null) return "";
        return name.toLowerCase()
                .replaceAll("[^a-zA-Z0-9\\u1200-\\u137F\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isTokenSimilar(String t1, String t2) {
        if (t1 == null || t2 == null) return false;
        if (t1.equalsIgnoreCase(t2)) return true;
        int dist = levenshteinDistance(t1.toLowerCase(), t2.toLowerCase());
        int maxLen = Math.max(t1.length(), t2.length());
        return dist <= 2 && maxLen > 3;
    }

    private int levenshteinDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int j = 0; j <= s2.length(); j++) costs[j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= s2.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]),
                        s1.charAt(i - 1) == s2.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[s2.length()];
    }

    private double calculateJaroWinklerSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        if (s1.equalsIgnoreCase(s2)) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;

        int matchDistance = Math.max(s1.length(), s2.length()) / 2 - 1;
        boolean[] s1Matches = new boolean[s1.length()];
        boolean[] s2Matches = new boolean[s2.length()];

        int matches = 0;
        for (int i = 0; i < s1.length(); i++) {
            int start = Math.max(0, i - matchDistance);
            int end = Math.min(i + matchDistance + 1, s2.length());
            for (int j = start; j < end; j++) {
                if (!s2Matches[j] && s1.charAt(i) == s2.charAt(j)) {
                    s1Matches[i] = true;
                    s2Matches[j] = true;
                    matches++;
                    break;
                }
            }
        }

        if (matches == 0) return 0.0;

        int transpositions = 0;
        int k = 0;
        for (int i = 0; i < s1.length(); i++) {
            if (s1Matches[i]) {
                while (!s2Matches[k]) k++;
                if (s1.charAt(i) != s2.charAt(k)) transpositions++;
                k++;
            }
        }

        double jaro = ((double) matches / s1.length() +
                (double) matches / s2.length() +
                (double) (matches - transpositions / 2.0) / matches) / 3.0;

        // Winkler prefix bonus
        int prefix = 0;
        for (int i = 0; i < Math.min(4, Math.min(s1.length(), s2.length())); i++) {
            if (s1.charAt(i) == s2.charAt(i)) prefix++;
            else break;
        }

        return jaro + prefix * 0.1 * (1.0 - jaro);
    }

    private String extractNameFromClues(String text1, String text2) {
        String combined = (text1 != null ? text1 : "") + " " + (text2 != null ? text2 : "");
        if (combined.isBlank()) return null;

        // Strip data url base64 prefix if present
        if (combined.contains(";base64,")) {
            combined = combined.substring(0, Math.min(combined.length(), combined.indexOf(";base64,")));
        }

        String clean = combined.toLowerCase().replaceAll("[^a-z]", " ");
        for (String token : clean.split("\\s+")) {
            if (token.length() >= 3 && isCommonEthiopianName(token)) {
                return Character.toUpperCase(token.charAt(0)) + token.substring(1);
            }
        }
        return null;
    }

    private boolean isCommonEthiopianName(String token) {
        return switch (token.toLowerCase()) {
            case "yonas", "dawit", "sara", "sarah", "betelhem", "bethlehem", "abebe", "kebede",
                 "tadesse", "bekele", "haile", "alemu", "chala", "tolosa", "girum", "dani",
                 "daniel", "selam", "helen", "marta", "meron", "eyob", "samuel", "nati",
                 "natnael", "elias", "tariku", "solomon", "amanuel", "biruk", "eshetu",
                 "kassahun", "yohannes", "fasil", "tesfaye", "biniam", "henok", "bereket",
                 "senait", "tigist", "hiwot", "eden", "rahel", "genet", "aster", "almaz" -> true;
            default -> false;
        };
    }

    public record NameMatchResult(boolean isMatch, double similarity, String explanation) {}
}
