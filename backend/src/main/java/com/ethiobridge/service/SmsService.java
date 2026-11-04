package com.ethiobridge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Telecom & Mobile Money SMS Messaging Rail for Ethiopia
 * Supports Ethio Telecom and Safaricom Ethiopia cellular networks.
 * Handles transactional OTP generation/validation and payment notification alerts.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${app.sms.enabled:true}")
    private boolean smsEnabled;

    @Value("${app.sms.gateway-url:}")
    private String gatewayUrl;

    @Value("${app.sms.api-key:}")
    private String apiKey;

    public record OtpEntry(String code, long expiresAtMillis, int attempts) {
        public boolean isExpired() {
            return System.currentTimeMillis() > expiresAtMillis;
        }
    }

    private static final long OTP_TTL_MILLIS = 5 * 60 * 1000L; // 5 minutes
    private static final int MAX_OTP_ATTEMPTS = 3;
    private static final Map<String, OtpEntry> ACTIVE_OTPS = new ConcurrentHashMap<>();

    public String normalizeEthiopianPhone(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            return null;
        }
        String clean = rawPhone.replaceAll("[^0-9+]", "");
        if (clean.startsWith("+251")) {
            return clean;
        }
        if (clean.startsWith("0")) {
            return "+251" + clean.substring(1);
        }
        if (clean.startsWith("251")) {
            return "+" + clean;
        }
        if (clean.startsWith("9") || clean.startsWith("7")) {
            return "+251" + clean;
        }
        return clean;
    }

    public boolean isValidEthiopianPhone(String phone) {
        String normalized = normalizeEthiopianPhone(phone);
        if (normalized == null) return false;
        // Valid Ethiopian mobile prefixes: +251 9... (Ethio Telecom) or +251 7... (Safaricom Ethiopia)
        return normalized.matches("^\\+251[79]\\d{8}$");
    }

    public String sendVerificationOtp(String rawPhone) {
        String phone = normalizeEthiopianPhone(rawPhone);
        if (!isValidEthiopianPhone(phone)) {
            throw new IllegalArgumentException("Invalid Ethiopian phone number. Must start with 09 (Ethio Telecom) or 07 (Safaricom).");
        }

        // Bounded cleanup: remove expired OTPs if map exceeds 5000 entries
        if (ACTIVE_OTPS.size() > 5000) {
            ACTIVE_OTPS.entrySet().removeIf(e -> e.getValue().isExpired());
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        long expiresAt = System.currentTimeMillis() + OTP_TTL_MILLIS;
        ACTIVE_OTPS.put(phone, new OtpEntry(code, expiresAt, 0));

        String message = "EthioBridge: Your security verification code is " + code + ". Valid for 5 minutes. Do not share this code.";
        dispatchSms(phone, message);

        return maskPhone(phone);
    }

    public boolean verifyOtp(String rawPhone, String code) {
        String phone = normalizeEthiopianPhone(rawPhone);
        if (phone == null || code == null) return false;

        OtpEntry entry = ACTIVE_OTPS.get(phone);
        if (entry == null) {
            return false;
        }

        if (entry.isExpired()) {
            ACTIVE_OTPS.remove(phone);
            return false;
        }

        if (entry.attempts() >= MAX_OTP_ATTEMPTS) {
            ACTIVE_OTPS.remove(phone);
            return false;
        }

        if (entry.code().equals(code.trim())) {
            ACTIVE_OTPS.remove(phone);
            return true;
        } else {
            ACTIVE_OTPS.put(phone, new OtpEntry(entry.code(), entry.expiresAtMillis(), entry.attempts() + 1));
            return false;
        }
    }

    public void sendMilestoneFundedSms(String phone, String milestoneTitle, BigDecimal amount) {
        String cleanPhone = normalizeEthiopianPhone(phone);
        if (isValidEthiopianPhone(cleanPhone)) {
            String msg = "EthioBridge Escrow: Milestone '" + milestoneTitle + "' funded with " + amount + " ETB. Funds secured in platform escrow.";
            dispatchSms(cleanPhone, msg);
        }
    }

    public void sendPayoutDisbursedSms(String phone, String milestoneTitle, BigDecimal netAmount, String rail) {
        String cleanPhone = normalizeEthiopianPhone(phone);
        if (isValidEthiopianPhone(cleanPhone)) {
            String msg = "EthioBridge Payout: " + netAmount + " ETB for '" + milestoneTitle + "' transferred via " + rail + ".";
            dispatchSms(cleanPhone, msg);
        }
    }

    public void sendDisputeAlertSms(String phone, String contractTitle, String reason) {
        String cleanPhone = normalizeEthiopianPhone(phone);
        if (isValidEthiopianPhone(cleanPhone)) {
            String msg = "EthioBridge Alert: Dispute raised on '" + contractTitle + "'. Reason: " + reason + ". Arbitration team reviewing.";
            dispatchSms(cleanPhone, msg);
        }
    }

    private void dispatchSms(String recipientPhone, String message) {
        if (!smsEnabled) {
            return;
        }

        // If real SMS gateway URL is configured, an HTTP POST would dispatche here
        if (gatewayUrl != null && !gatewayUrl.isBlank() && apiKey != null && !apiKey.isBlank()) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                        .connectTimeout(java.time.Duration.ofSeconds(5))
                        .build();

                String json = "{\"to\":\"" + recipientPhone + "\",\"message\":\"" + message.replace("\"", "\\\"") + "\"}";
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(gatewayUrl))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("Content-Type", "application/json")
                        .timeout(java.time.Duration.ofSeconds(10))
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json))
                        .build();

                client.send(req, java.net.http.HttpResponse.BodyHandlers.discarding());
                log.info("[SMS DISPATCHED via Live Gateway] To: {}", maskPhone(recipientPhone));
                return;
            } catch (Exception ex) {
                log.warn("Failed to dispatch via live SMS gateway, falling back to transaction log: {}", ex.getMessage());
            }
        }

        // Transactional log fallback (standard Ethiopian carrier SMS format)
        log.info("[ETHIO TELECOM / TELEBIRR SMS RAIL] Destination: {} | Message: \"{}\"",
                maskPhone(recipientPhone), message);
    }

    private String maskPhone(String phone) {
        if (phone.length() >= 10) {
            return phone.substring(0, 7) + "***" + phone.substring(phone.length() - 2);
        }
        return phone;
    }
}
