package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentTransactionRepository paymentRepository;
    private final AuditLogService auditLogService;
    private final AppUserRepository userRepository;
    private final ContractMilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final PlatformRevenueRepository revenueRepository;
    private final NotificationService notificationService;
    private final PaymentWebhookLogRepository webhookLogRepository;
    private final EscrowLedgerService escrowLedgerService;
    private final ObjectMapper objectMapper;

    @Value("${CHAPA_SECRET_KEY:}")
    private String chapaSecretKey;

    @Value("${CHAPA_WEBHOOK_SECRET:}")
    private String chapaWebhookSecret;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${chapa.callback.url:${app.backend.public-url:http://localhost:8080}/api/v1/payments/chapa/webhook}")
    private String chapaCallbackUrl;

    @org.springframework.beans.factory.annotation.Autowired
    public PaymentService(PaymentTransactionRepository paymentRepository,
                          AuditLogService auditLogService,
                          AppUserRepository userRepository,
                          ContractMilestoneRepository milestoneRepository,
                          ContractRepository contractRepository,
                          ProviderProfileRepository providerProfileRepository,
                          PlatformRevenueRepository revenueRepository,
                          NotificationService notificationService,
                          PaymentWebhookLogRepository webhookLogRepository,
                          EscrowLedgerService escrowLedgerService) {
        this.paymentRepository = paymentRepository;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
        this.milestoneRepository = milestoneRepository;
        this.contractRepository = contractRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.revenueRepository = revenueRepository;
        this.notificationService = notificationService;
        this.webhookLogRepository = webhookLogRepository;
        this.escrowLedgerService = escrowLedgerService;
        this.objectMapper = new ObjectMapper();
    }

    public PaymentService(PaymentTransactionRepository paymentRepository,
                          AuditLogService auditLogService,
                          AppUserRepository userRepository,
                          ContractMilestoneRepository milestoneRepository,
                          ContractRepository contractRepository,
                          ProviderProfileRepository providerProfileRepository,
                          PlatformRevenueRepository revenueRepository,
                          NotificationService notificationService) {
        this(paymentRepository, auditLogService, userRepository, milestoneRepository,
             contractRepository, providerProfileRepository, revenueRepository,
             notificationService, null, null);
    }

    public PaymentTransaction initiatePayment(UUID contractId, UUID milestoneId, UUID userId, BigDecimal amount, String paymentMethod) {
        String method = (paymentMethod != null && !paymentMethod.isBlank()) ? paymentMethod.toUpperCase() : "TELEBIRR";
        String refPrefix = switch (method) {
            case "TELEBIRR" -> "TB-";
            case "CBE_BIRR" -> "CBE-";
            case "CHAPA" -> "CHP-";
            default -> "TX-";
        };

        String ref = refPrefix + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        // Escrow funds held in vault; not labeled SUCCESS without gateway settlement
        String status = (milestoneId != null) ? "HELD_IN_ESCROW" : "INITIATED";
        String providerNote = (milestoneId != null)
                ? "Funds secured in platform escrow hold via " + method + ". Reference: " + ref
                : "Payment initiated on rail: " + method + ". Reference: " + ref;

        PaymentTransaction tx = new PaymentTransaction(contractId, milestoneId, userId, amount, method, ref, status);
        tx.setProviderResponse(providerNote);

        PaymentTransaction saved = paymentRepository.save(tx);

        String txIdStr = (saved != null && saved.getId() != null) ? saved.getId().toString() : ref;
        auditLogService.log(userId, "PAYMENT_" + method, "PaymentTransaction",
                txIdStr, "Amount: " + amount + " ETB, Status: " + status + ", Ref: " + ref, null);

        return saved;
    }

    private String sanitizeEmailForChapa(String email) {
        if (email == null || email.isBlank()) {
            return "user@ethiobridge.com";
        }
        String trimmed = email.trim().toLowerCase();
        if (trimmed.endsWith(".et")) {
            return trimmed.substring(0, trimmed.lastIndexOf(".et")) + ".com";
        }
        if (!trimmed.contains("@") || !trimmed.contains(".")) {
            return "user@ethiobridge.com";
        }
        return trimmed;
    }

    public Map<String, Object> initializeChapaCheckout(UUID contractId, UUID milestoneId, UUID userId, BigDecimal amount, String purpose) {
        return initializeChapaCheckout(contractId, milestoneId, userId, amount, purpose, null);
    }

    public Map<String, Object> initializeChapaCheckout(UUID contractId, UUID milestoneId, UUID userId, BigDecimal amount, String purpose, String clientBaseUrl) {
        String ref = "CHP-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        AppUser user = userRepository.findById(userId).orElse(null);
        String email = sanitizeEmailForChapa(user != null ? user.getEmail() : null);
        String fullName = (user != null && user.getFullName() != null && !user.getFullName().isBlank()) ? user.getFullName() : "EthioBridge User";
        String[] nameParts = fullName.split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "Client";

        String baseUrl = (clientBaseUrl != null && !clientBaseUrl.isBlank())
                ? clientBaseUrl.replaceAll("/+$", "")
                : ((frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:4200");
        String callback = (chapaCallbackUrl != null && !chapaCallbackUrl.isBlank()) ? chapaCallbackUrl : "http://localhost:8080/api/v1/payments/chapa/webhook";

        String returnUrl;
        String title;
        String desc;

        if (purpose != null && purpose.startsWith("CONNECTS_TOPUP")) {
            returnUrl = baseUrl + "/profile/provider?chapa_connects=1&tx_ref=" + ref;
            title = "EB Connects";
            desc = "Token purchase for job applications";
        } else if (milestoneId != null) {
            returnUrl = baseUrl + "/contracts?chapa_milestone=1&tx_ref=" + ref + "&milestone_id=" + milestoneId;
            title = "EB Escrow";
            desc = "Milestone escrow protection deposit";
        } else {
            returnUrl = baseUrl + "/contracts?chapa_payment=1&tx_ref=" + ref;
            title = "EthioBridge";
            desc = "Service payment";
        }

        if (title != null && title.length() > 16) {
            title = title.substring(0, 16);
        }

        String checkoutUrl = returnUrl + (returnUrl.contains("?") ? "&" : "?") + "simulated=1";
        String mode = "SANDBOX_SIMULATED";
        String message = "Hosted Link [SIMULATED - CHAPA SANDBOX]";

        String key = (chapaSecretKey != null && !chapaSecretKey.isBlank()) ? chapaSecretKey : System.getenv("CHAPA_SECRET_KEY");

        if (key != null && key.startsWith("CHASECK_")) {
            try {
                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .build();

                Map<String, Object> payloadMap = new HashMap<>();
                payloadMap.put("amount", amount.toPlainString());
                payloadMap.put("currency", "ETB");
                payloadMap.put("email", email);
                payloadMap.put("first_name", firstName);
                payloadMap.put("last_name", lastName);
                payloadMap.put("tx_ref", ref);
                payloadMap.put("callback_url", callback);
                payloadMap.put("return_url", returnUrl);

                Map<String, String> customization = new HashMap<>();
                customization.put("title", title);
                customization.put("description", desc);
                payloadMap.put("customization", customization);

                String jsonBody = objectMapper.writeValueAsString(payloadMap);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.chapa.co/v1/transaction/initialize"))
                        .header("Authorization", "Bearer " + key)
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(15))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200 && response.body() != null) {
                    JsonNode root = objectMapper.readTree(response.body());
                    if ("success".equalsIgnoreCase(root.path("status").asText())) {
                        String realUrl = root.path("data").path("checkout_url").asText(null);
                        if (realUrl != null && !realUrl.isBlank()) {
                            checkoutUrl = realUrl;
                            mode = "CHAPA_LIVE_SANDBOX";
                            message = "Hosted Link [LIVE CHAPA GATEWAY]";
                        }
                    }
                } else {
                    log.warn("Chapa API returned non-200 status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Failed to reach Chapa API: {}", e.getMessage());
            }
        }

        PaymentTransaction tx = new PaymentTransaction(contractId, milestoneId, userId, amount, "CHAPA", ref, "INITIATED");
        tx.setProviderResponse(purpose);
        PaymentTransaction saved = paymentRepository.save(tx);

        String txIdStr = (saved != null && saved.getId() != null) ? saved.getId().toString() : ref;
        auditLogService.log(userId, "CHAPA_PAYMENT_INIT", "PaymentTransaction",
                txIdStr, "Purpose: " + purpose + ", Amount: " + amount + " ETB, Ref: " + ref, null);

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "success");
        resp.put("message", message);
        resp.put("txRef", ref);
        resp.put("checkoutUrl", checkoutUrl);
        resp.put("amount", amount);
        resp.put("currency", "ETB");
        resp.put("paymentMethod", "CHAPA");
        resp.put("transactionId", saved != null ? saved.getId() : null);
        resp.put("mode", mode);
        return resp;
    }

    public boolean verifyWebhookSignature(String payload, String signatureHeader) {
        String secret = (chapaWebhookSecret != null && !chapaWebhookSecret.isBlank())
                ? chapaWebhookSecret : System.getenv("CHAPA_WEBHOOK_SECRET");
        if (secret == null || secret.isBlank()) {
            log.warn("CHAPA_WEBHOOK_SECRET is not configured; signature verification cannot proceed");
            return false;
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("Missing Chapa webhook signature header");
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b));
            }
            String calculatedHex = sb.toString();
            return MessageDigest.isEqual(calculatedHex.getBytes(StandardCharsets.UTF_8), signatureHeader.trim().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to calculate HMAC-SHA256 for Chapa webhook", e);
            return false;
        }
    }

    public Map<String, Object> processChapaWebhook(String rawPayload, String signatureHeader, String idempotencyKey) {
        // 1. Signature verification
        boolean validSig = verifyWebhookSignature(rawPayload, signatureHeader);
        if (!validSig) {
            log.warn("Chapa webhook signature verification failed. Signature: {}", signatureHeader);
            if (webhookLogRepository != null) {
                webhookLogRepository.save(new PaymentWebhookLog("CHAPA", "CHARGE_COMPLETE", "UNKNOWN", false, idempotencyKey, rawPayload, "REJECTED"));
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Chapa webhook signature");
        }

        // 2. Parse payload
        JsonNode root;
        try {
            root = objectMapper.readTree(rawPayload);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed JSON webhook payload");
        }

        String txRef = root.path("tx_ref").asText(null);
        if (txRef == null || txRef.isBlank()) {
            txRef = root.path("trx_ref").asText(null);
        }
        if (txRef == null || txRef.isBlank()) {
            txRef = root.path("reference").asText(null);
        }

        if (txRef == null || txRef.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing tx_ref in webhook payload");
        }

        String eventStatus = root.path("status").asText("");

        // 3. Idempotency Check
        String idemp = (idempotencyKey != null && !idempotencyKey.isBlank()) ? idempotencyKey : ("IDEMP-" + txRef);
        if (webhookLogRepository != null && webhookLogRepository.findByIdempotencyKey(idemp).isPresent()) {
            log.info("Duplicate webhook delivery detected for idempotency key: {}", idemp);
            Map<String, Object> dupResp = new HashMap<>();
            dupResp.put("status", "already_processed");
            dupResp.put("message", "Duplicate webhook ignored");
            dupResp.put("txRef", txRef);
            return dupResp;
        }

        Optional<PaymentTransaction> txOpt = paymentRepository.findByTransactionRef(txRef);
        if (txOpt.isEmpty()) {
            log.warn("Webhook received for unknown transaction ref: {}", txRef);
            if (webhookLogRepository != null) {
                webhookLogRepository.save(new PaymentWebhookLog("CHAPA", eventStatus, txRef, true, idemp, rawPayload, "NOT_FOUND"));
            }
            Map<String, Object> notFoundResp = new HashMap<>();
            notFoundResp.put("status", "not_found");
            notFoundResp.put("txRef", txRef);
            return notFoundResp;
        }

        PaymentTransaction tx = txOpt.get();

        // 4. State checks & fulfillment
        Map<String, Object> result;
        if ("success".equalsIgnoreCase(eventStatus)) {
            result = fulfillPaymentSuccess(tx, "CHAPA_WEBHOOK [HMAC-SHA256]");
            if (webhookLogRepository != null) {
                webhookLogRepository.save(new PaymentWebhookLog("CHAPA", eventStatus, txRef, true, idemp, rawPayload, "PROCESSED"));
            }
        } else {
            tx.setStatus("FAILED");
            tx.setProviderResponse("Payment failed or cancelled on gateway: " + eventStatus);
            paymentRepository.save(tx);
            if (webhookLogRepository != null) {
                webhookLogRepository.save(new PaymentWebhookLog("CHAPA", eventStatus, txRef, true, idemp, rawPayload, "FAILED"));
            }
            result = Map.of("status", "FAILED", "txRef", txRef, "eventStatus", eventStatus);
        }

        return result;
    }

    public Map<String, Object> fulfillPaymentSuccess(PaymentTransaction tx, String source) {
        Map<String, Object> result = new HashMap<>();
        String txRef = tx.getTransactionRef();

        if ("SUCCESS".equalsIgnoreCase(tx.getStatus())) {
            result.put("status", "SUCCESS");
            result.put("alreadyFulfilled", true);
            result.put("amount", tx.getAmount());
            result.put("currency", tx.getCurrency());
            return result;
        }

        // Parse initial purpose BEFORE overwriting providerResponse
        String initialPurpose = tx.getProviderResponse();

        // 1. Connects token purchase fulfillment:
        if (initialPurpose != null && initialPurpose.contains("CONNECTS_TOPUP:")) {
            String sub = initialPurpose.substring(initialPurpose.indexOf("CONNECTS_TOPUP:") + "CONNECTS_TOPUP:".length());
            String[] parts = sub.split(":");
            try {
                int connectsAmount = Integer.parseInt(parts[0].trim());
                providerProfileRepository.findByUserId(tx.getUserId()).ifPresent(profile -> {
                    int current = profile.getConnectsBalance() != null ? profile.getConnectsBalance() : 0;
                    profile.setConnectsBalance(current + connectsAmount);
                    providerProfileRepository.save(profile);

                    PlatformRevenue rev = new PlatformRevenue(
                            "CONNECTS_TOPUP",
                            profile.getId(),
                            tx.getUserId(),
                            tx.getAmount(),
                            tx.getAmount(),
                            BigDecimal.ZERO,
                            "CHAPA",
                            txRef,
                            "Connects Top-Up: +" + connectsAmount + " tokens (" + tx.getAmount() + " ETB)"
                    );
                    revenueRepository.save(rev);

                    notificationService.sendNotification(
                            tx.getUserId(),
                            "Connects Balance Credited (+" + connectsAmount + ")",
                            "Your Chapa payment of " + tx.getAmount() + " ETB succeeded. New balance: " + profile.getConnectsBalance() + " Connects.",
                            "CONNECTS",
                            "/profile/provider"
                    );
                    result.put("connectsAdded", connectsAmount);
                    result.put("newBalance", profile.getConnectsBalance());
                });
            } catch (Exception ex) {
                log.warn("Failed to parse connectsAmount from initialPurpose: {}", initialPurpose);
            }
        }

        // 2. Escrow milestone funding fulfillment:
        if (tx.getMilestoneId() != null) {
            milestoneRepository.findById(tx.getMilestoneId()).ifPresent(m -> {
                if ("PENDING".equalsIgnoreCase(m.getStatus())) {
                    m.setStatus("FUNDED");
                    m.setFundedAt(OffsetDateTime.now());
                    milestoneRepository.save(m);

                    if (tx.getContractId() != null) {
                        contractRepository.findById(tx.getContractId()).ifPresent(c -> {
                            if (escrowLedgerService != null) {
                                escrowLedgerService.recordDepositHold(
                                        c.getId(),
                                        m.getId(),
                                        c.getSeekerUserId(),
                                        c.getProviderUserId(),
                                        m.getAmount(),
                                        txRef,
                                        "CHAPA"
                                );
                            }

                            notificationService.sendNotification(
                                    c.getProviderUserId(),
                                    "Escrow Milestone Funded (" + m.getAmount() + " ETB)",
                                    "Seeker paid & funded \"" + m.getTitle() + "\" via Chapa. Funds secured in platform escrow vault.",
                                    "CONTRACT",
                                    "/contracts"
                            );
                        });
                    }
                }
            });
        }

        tx.setStatus("SUCCESS");
        tx.setProviderResponse("Approved & Verified via " + source + ". Ref: " + txRef);
        paymentRepository.save(tx);

        result.put("status", "SUCCESS");
        result.put("amount", tx.getAmount());
        result.put("currency", tx.getCurrency());
        result.put("milestoneId", tx.getMilestoneId());
        result.put("contractId", tx.getContractId());
        return result;
    }

    public Map<String, Object> verifyChapaPayment(String txRef, UUID requestingUserId, boolean isAdmin) {
        Optional<PaymentTransaction> txOpt = paymentRepository.findByTransactionRef(txRef);
        Map<String, Object> result = new HashMap<>();
        result.put("txRef", txRef);

        if (txOpt.isEmpty()) {
            result.put("foundInDb", false);
            result.put("status", "NOT_FOUND");
            return result;
        }

        PaymentTransaction tx = txOpt.get();
        result.put("foundInDb", true);

        // Ownership Check: Caller must be the transaction owner or an admin
        if (!isAdmin && requestingUserId != null && !requestingUserId.equals(tx.getUserId())) {
            log.warn("Access Denied: User {} is not permitted to verify transaction owned by {}", requestingUserId, tx.getUserId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this transaction");
        }

        // State Check: If already succeeded, return success idempotently
        if ("SUCCESS".equalsIgnoreCase(tx.getStatus())) {
            result.put("status", "SUCCESS");
            result.put("amount", tx.getAmount());
            result.put("currency", tx.getCurrency());
            result.put("milestoneId", tx.getMilestoneId());
            result.put("contractId", tx.getContractId());
            result.put("message", "Payment already verified successfully");
            return result;
        }

        if ("FAILED".equalsIgnoreCase(tx.getStatus()) || "CANCELLED".equalsIgnoreCase(tx.getStatus())) {
            result.put("status", tx.getStatus());
            result.put("message", "Transaction is in terminal " + tx.getStatus() + " state.");
            return result;
        }

        boolean verified = false;
        String key = (chapaSecretKey != null && !chapaSecretKey.isBlank()) ? chapaSecretKey : System.getenv("CHAPA_SECRET_KEY");

        // When a real Chapa Secret Key is configured, verify against Chapa Gateway API:
        if (key != null && key.startsWith("CHASECK_")) {
            try {
                HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.chapa.co/v1/transaction/verify/" + txRef))
                        .header("Authorization", "Bearer " + key)
                        .timeout(Duration.ofSeconds(15))
                        .GET()
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200 && response.body() != null) {
                    JsonNode root = objectMapper.readTree(response.body());
                    result.put("chapaStatus", root.path("status").asText());
                    result.put("chapaMessage", root.path("message").asText());
                    result.put("chapaData", root.path("data"));
                    if ("success".equalsIgnoreCase(root.path("status").asText())) {
                        verified = true;
                    }
                }
            } catch (Exception e) {
                log.warn("Chapa verification call failed: {}", e.getMessage());
            }
        } else {
            // SANDBOX / SIMULATED MODE: When running without live Chapa API key or in test environments,
            // allow simulated transactions generated by the platform to complete:
            if (txRef != null && (txRef.startsWith("CHP-") || txRef.startsWith("TB-") || txRef.startsWith("TX-"))) {
                verified = true;
                result.put("mode", "SANDBOX_SIMULATED");
            }
        }

        if (verified) {
            Map<String, Object> fulfillResult = fulfillPaymentSuccess(tx, key != null && key.startsWith("CHASECK_") ? "CHAPA_GATEWAY_API" : "SANDBOX_SIMULATION");
            result.putAll(fulfillResult);
        } else {
            result.put("status", "PENDING_OR_FAILED");
            result.put("message", "Payment has not been completed on Chapa.");
        }

        return result;
    }

    public Map<String, Object> verifyChapaPayment(String txRef) {
        return verifyChapaPayment(txRef, null, true);
    }

    @Transactional(readOnly = true)
    public Optional<PaymentTransaction> getTransactionByRef(String txRef) {
        return paymentRepository.findByTransactionRef(txRef);
    }

    @Transactional(readOnly = true)
    public List<PaymentTransaction> getTransactionsByContract(UUID contractId) {
        return paymentRepository.findByContractIdOrderByCreatedAtDesc(contractId);
    }
}
