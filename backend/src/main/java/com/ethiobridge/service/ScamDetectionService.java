package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Report;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.ReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class ScamDetectionService {

    private static final Logger log = LoggerFactory.getLogger(ScamDetectionService.class);
    private static final UUID DEFAULT_ADMIN_ID = UUID.fromString("a4444444-4444-4444-4444-444444444401");

    private final ReportRepository reportRepository;
    private final AppUserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final RestClient restClient;

    @Value("${app.ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    @Value("${app.ai-service.internal-token:dev-secret-internal-token-local}")
    private String aiServiceInternalToken;

    @Value("${app.ai-service.timeout-ms:4000}")
    private int timeoutMs;

    // Detection Patterns
    private static final Pattern CBE_ACCOUNT_REGEX = Pattern.compile("\\b1000\\d{8,11}\\b");
    private static final Pattern ETH_PHONE_REGEX = Pattern.compile("(?<!\\d)(?:\\+?251|0)?[97]\\d{8}\\b");
    private static final Pattern TELEGRAM_REGEX = Pattern.compile("(@[a-zA-Z0-9_]{4,}|t\\.me/[a-zA-Z0-9_]+|\\btelegram\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern WHATSAPP_REGEX = Pattern.compile("(wa\\.me/\\d+|\\bwhatsapp\\b)", Pattern.CASE_INSENSITIVE);

    private static final List<String> ESCROW_EVASION_KEYWORDS = List.of(
            "pay me direct", "direct cbe", "telebirr direct", "send directly to", "outside platform",
            "outside escrow", "offline payment", "avoid fee", "avoid commission", "pay me cash",
            "wire me", "transfer direct", "bank direct", "pay off-site", "without escrow",
            "ከእስክሮው ውጭ", "በቀጥታ ክፈሉኝ", "በባንክ አስገባ", "በባንክ ላክልኝ", "በቴሌብር ላክልኝ",
            "አካውንት ቁጥር", "ቀጥታ ክፍያ", "ኮሚሽን ላለመክፈል"
    );

    private static final List<String> UPFRONT_FEE_KEYWORDS = List.of(
            "registration fee", "application fee", "deposit required", "interview fee",
            "security deposit", "training fee", "pay before start", "processing fee",
            "materials fee", "equipment deposit", "hiring fee", "prepayment required",
            "የምዝገባ ክፍያ", "ቅድመ ክፍያ", "የማመልከቻ ክፍያ", "ተቀማጭ ገንዘብ", "የስልጠና ክፍያ", "የመሳሪያ ክፍያ"
    );

    private static final List<String> UNREALISTIC_KEYWORDS = List.of(
            "earn 50000 daily", "earn 100000 per week", "earn money without working",
            "work 1 hour earn 5000", "guaranteed profit", "free money", "instant rich"
    );

    private static final List<String> HARASSMENT_KEYWORDS = List.of(
            "kill you", "i will beat you", "steal your money", "cheat you",
            "ውሸታም ሌባ", "አጭበርባሪ", "እገድልሃለሁ"
    );

    public ScamDetectionService(ReportRepository reportRepository,
                                AppUserRepository userRepository,
                                AuditLogService auditLogService,
                                NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(2500);
        requestFactory.setReadTimeout(4000);
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    public record ScanResult(
            boolean flagged,
            String riskLevel, // LOW, MEDIUM, HIGH, CRITICAL
            List<String> categories,
            List<String> reasons,
            List<String> matchedPatterns,
            String explanation
    ) {}

    /**
     * Scans message content sent in a thread. If flagged, automatically logs an incident into the Admin Trust & Reports queue.
     */
    public ScanResult scanChatMessage(UUID senderUserId, UUID recipientUserId, UUID listingId, String content) {
        if (content == null || content.isBlank()) {
            return new ScanResult(false, "LOW", List.of(), List.of(), List.of(), "Empty text");
        }

        ScanResult result = runScan(content, "MESSAGE");
        if (result.flagged() && ("HIGH".equalsIgnoreCase(result.riskLevel()) || "MEDIUM".equalsIgnoreCase(result.riskLevel()))) {
            handleViolation(senderUserId, listingId, "MESSAGE", content, result);
        }
        return result;
    }

    /**
     * Scans opportunity listings created or updated by seekers.
     */
    public ScanResult scanListing(UUID ownerUserId, UUID listingId, String title, String description) {
        String combined = (title != null ? title : "") + "\n" + (description != null ? description : "");
        if (combined.isBlank()) {
            return new ScanResult(false, "LOW", List.of(), List.of(), List.of(), "Empty text");
        }

        ScanResult result = runScan(combined, "LISTING");
        if (result.flagged() && ("HIGH".equalsIgnoreCase(result.riskLevel()) || "MEDIUM".equalsIgnoreCase(result.riskLevel()))) {
            handleViolation(ownerUserId, listingId, "LISTING", combined, result);
        }
        return result;
    }

    /**
     * Hybrid scanner: performs ultra-fast local regex + keyword analysis first,
     * then attempts AI moderation endpoint if reachable.
     */
    public ScanResult runScan(String text, String contentType) {
        // Fast local evaluation
        ScanResult localResult = evaluateLocally(text, contentType);

        // Try AI microservice for deeper extraction if configured
        try {
            Map<String, Object> req = Map.of(
                    "text", text,
                    "contentType", contentType != null ? contentType : "GENERAL"
            );

            Map resp = restClient.post()
                    .uri(aiServiceBaseUrl + "/ai/v1/moderate/scan")
                    .header("X-Internal-Token", aiServiceInternalToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(req)
                    .retrieve()
                    .body(Map.class);

            if (resp != null && Boolean.TRUE.equals(resp.get("flagged"))) {
                List<String> categories = (List<String>) resp.getOrDefault("categories", List.of());
                List<String> reasons = (List<String>) resp.getOrDefault("reasons", List.of());
                List<String> matched = (List<String>) resp.getOrDefault("matchedPatterns", List.of());
                String risk = (String) resp.getOrDefault("riskLevel", "HIGH");
                String explanation = (String) resp.getOrDefault("explanation", "");

                // Combine local and AI findings
                Set<String> mergedCats = new LinkedHashSet<>(localResult.categories());
                mergedCats.addAll(categories);

                Set<String> mergedReasons = new LinkedHashSet<>(localResult.reasons());
                mergedReasons.addAll(reasons);

                Set<String> mergedMatched = new LinkedHashSet<>(localResult.matchedPatterns());
                mergedMatched.addAll(matched);

                return new ScanResult(true, risk, new ArrayList<>(mergedCats), new ArrayList<>(mergedReasons), new ArrayList<>(mergedMatched), explanation);
            }
        } catch (Exception e) {
            log.debug("AI service moderation scan skipped (local heuristics active): {}", e.getMessage());
        }

        return localResult;
    }

    private ScanResult evaluateLocally(String text, String contentType) {
        String lower = text.toLowerCase();
        boolean flagged = false;
        String riskLevel = "LOW";
        List<String> categories = new ArrayList<>();
        List<String> reasons = new ArrayList<>();
        List<String> matchedPatterns = new ArrayList<>();

        // 1. Escrow Evasion: CBE Accounts
        Matcher cbeMatcher = CBE_ACCOUNT_REGEX.matcher(text);
        while (cbeMatcher.find()) {
            flagged = true;
            if (!categories.contains("ESCROW_EVASION")) categories.add("ESCROW_EVASION");
            String acct = cbeMatcher.group();
            reasons.add("Commercial Bank of Ethiopia (CBE) 13-digit account number detected (" + acct + ")");
            matchedPatterns.add("CBE_ACCOUNT:" + acct);
        }

        // 2. Escrow Evasion Keywords
        for (String kw : ESCROW_EVASION_KEYWORDS) {
            if (lower.contains(kw)) {
                flagged = true;
                if (!categories.contains("ESCROW_EVASION")) categories.add("ESCROW_EVASION");
                reasons.add("Off-platform escrow evasion keyword detected: '" + kw + "'");
                matchedPatterns.add("KEYWORD:" + kw);
                break;
            }
        }

        // 3. Contact Evasion (Telegram / WhatsApp / Direct Phone)
        Matcher tgMatcher = TELEGRAM_REGEX.matcher(text);
        if (tgMatcher.find()) {
            flagged = true;
            if (!categories.contains("CONTACT_LEAK")) categories.add("CONTACT_LEAK");
            String handle = tgMatcher.group();
            reasons.add("External Telegram handle or link detected (" + handle + ")");
            matchedPatterns.add("TELEGRAM:" + handle);
        }

        Matcher waMatcher = WHATSAPP_REGEX.matcher(text);
        if (waMatcher.find()) {
            flagged = true;
            if (!categories.contains("CONTACT_LEAK")) categories.add("CONTACT_LEAK");
            String wa = waMatcher.group();
            reasons.add("External WhatsApp handle or link detected (" + wa + ")");
            matchedPatterns.add("WHATSAPP:" + wa);
        }

        Matcher phoneMatcher = ETH_PHONE_REGEX.matcher(text);
        if (phoneMatcher.find() && (categories.contains("ESCROW_EVASION") || "LISTING".equalsIgnoreCase(contentType))) {
            flagged = true;
            if (!categories.contains("CONTACT_LEAK")) categories.add("CONTACT_LEAK");
            String ph = phoneMatcher.group();
            reasons.add("Direct phone number posted in opportunity/payment context (" + ph + ")");
            matchedPatterns.add("PHONE:" + ph);
        }

        // 4. Upfront Fee Scams (Registration / Deposit fees)
        for (String kw : UPFRONT_FEE_KEYWORDS) {
            if (lower.contains(kw)) {
                flagged = true;
                if (!categories.contains("UPFRONT_FEE_SCAM")) categories.add("UPFRONT_FEE_SCAM");
                reasons.add("Prohibited upfront fee solicitation detected: '" + kw + "'");
                matchedPatterns.add("UPFRONT_FEE:" + kw);
                break;
            }
        }

        // 5. Unrealistic Earnings
        for (String kw : UNREALISTIC_KEYWORDS) {
            if (lower.contains(kw)) {
                flagged = true;
                if (!categories.contains("DECEPTIVE_LISTING")) categories.add("DECEPTIVE_LISTING");
                reasons.add("Deceptive or unrealistic income guarantee detected: '" + kw + "'");
                matchedPatterns.add("UNREALISTIC:" + kw);
                break;
            }
        }

        // 6. Harassment & Abuse
        for (String kw : HARASSMENT_KEYWORDS) {
            if (lower.contains(kw)) {
                flagged = true;
                if (!categories.contains("HARASSMENT")) categories.add("HARASSMENT");
                reasons.add("Abusive or threatening content detected: '" + kw + "'");
                matchedPatterns.add("HARASSMENT:" + kw);
                break;
            }
        }

        if (categories.contains("UPFRONT_FEE_SCAM") || categories.contains("ESCROW_EVASION")) {
            riskLevel = "HIGH";
        } else if (categories.contains("HARASSMENT") || categories.contains("DECEPTIVE_LISTING")) {
            riskLevel = "HIGH";
        } else if (categories.contains("CONTACT_LEAK")) {
            riskLevel = "MEDIUM";
        }

        String explanation = reasons.isEmpty() ? "Content is compliant." : String.join("; ", reasons);
        return new ScanResult(flagged, riskLevel, categories, reasons, matchedPatterns, explanation);
    }

    private void handleViolation(UUID offenderUserId, UUID listingId, String contextType, String content, ScanResult result) {
        String primaryCategory = result.categories().isEmpty() ? "POLICY_VIOLATION" : result.categories().get(0);
        String reasonTitle = "AUTOMATED_AI_FLAG: " + primaryCategory;

        // Deduplication: Avoid creating duplicate pending reports for the exact same target
        if (listingId != null && reportRepository.existsByListingIdAndReasonStartingWithAndStatus(listingId, "AUTOMATED_AI_FLAG:", "PENDING")) {
            log.info("Active pending moderation report already exists for listing {}", listingId);
            return;
        }
        if (offenderUserId != null && listingId == null && reportRepository.existsByReportedUserIdAndReasonStartingWithAndStatus(offenderUserId, "AUTOMATED_AI_FLAG:", "PENDING")) {
            log.info("Active pending moderation report already exists for user {}", offenderUserId);
            return;
        }

        UUID adminReporterId = resolveAdminUserId();

        // Build report details snippet
        String snippet = content.length() > 200 ? content.substring(0, 197) + "..." : content;
        String details = String.format("[%s RISK] Identified in %s. Violations: %s. Reasons: %s. Matched: %s. Snippet: \"%s\"",
                result.riskLevel(), contextType, String.join(", ", result.categories()),
                result.explanation(), String.join(", ", result.matchedPatterns()), snippet);

        Report report = new Report(adminReporterId, offenderUserId, listingId, reasonTitle, details);
        report = reportRepository.save(report);

        // Audit log
        auditLogService.log(adminReporterId, "AI_SCAM_FLAGGED", "Report", report.getId().toString(),
                "Offender: " + offenderUserId + ", Category: " + primaryCategory + ", Risk: " + result.riskLevel(), null);

        // Notify System Admin
        notificationService.sendNotification(
                adminReporterId,
                "⚠️ Scam/Fraud Alert: " + primaryCategory,
                "Automated AI scanner detected a " + result.riskLevel() + " risk violation (" + primaryCategory + "). Check the moderation queue.",
                "SYSTEM",
                "/admin?tab=reports"
        );

        log.warn("🚨 Automated AI Scam Scanner filed report {} for user {} [Risk: {}, Category: {}]",
                report.getId(), offenderUserId, result.riskLevel(), primaryCategory);
    }

    private UUID resolveAdminUserId() {
        return userRepository.findByEmail("admin@ethiobridge.et")
                .map(AppUser::getId)
                .orElse(DEFAULT_ADMIN_ID);
    }
}
