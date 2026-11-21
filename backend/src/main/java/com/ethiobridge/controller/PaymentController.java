package com.ethiobridge.controller;

import com.ethiobridge.entity.*;
import com.ethiobridge.service.ContractService;
import com.ethiobridge.service.EscrowLedgerService;
import com.ethiobridge.service.PaymentService;
import com.ethiobridge.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;
    private final ContractService contractService;
    private final EscrowLedgerService escrowLedgerService;

    public PaymentController(PaymentService paymentService,
                             UserService userService,
                             ContractService contractService,
                             EscrowLedgerService escrowLedgerService) {
        this.paymentService = paymentService;
        this.userService = userService;
        this.contractService = contractService;
        this.escrowLedgerService = escrowLedgerService;
    }

    @GetMapping("/methods")
    public ResponseEntity<List<Map<String, Object>>> getAvailablePaymentMethods() {
        List<Map<String, Object>> methods = List.of(
                Map.of(
                        "id", "TELEBIRR",
                        "name", "Telebirr (ቴሌብር)",
                        "description", "Ethio telecom instant USSD & SuperApp QR (Min: 1 ETB, Max: 75,000 ETB)",
                        "type", "MOBILE_MONEY",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 75000,
                        "active", true
                ),
                Map.of(
                        "id", "CBE_BIRR",
                        "name", "CBEBirr (ሲቢኢ ብር)",
                        "description", "Commercial Bank of Ethiopia direct mobile money (Min: 1 ETB, Max: 150,000 ETB)",
                        "type", "MOBILE_MONEY",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 150000,
                        "active", true
                ),
                Map.of(
                        "id", "AWASH_BIRR",
                        "name", "AwashBirr (አዋሽ ብር)",
                        "description", "Awash Bank mobile wallet (Min: 1 ETB, Max: 600,000 ETB)",
                        "type", "MOBILE_MONEY",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 600000,
                        "active", true
                ),
                Map.of(
                        "id", "AWASH_BANK",
                        "name", "Awash Bank Direct",
                        "description", "Awash Bank account direct transfer (Min: 1 ETB, Unlimited)",
                        "type", "BANK_DIRECT",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 10000000,
                        "active", true
                ),
                Map.of(
                        "id", "COOPAY_EBIRR",
                        "name", "Coopay-Ebirr (ኮኦፕ-ኢብር)",
                        "description", "Cooperative Bank of Oromia mobile payment (Min: 1 ETB, Unlimited)",
                        "type", "MOBILE_MONEY",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 10000000,
                        "active", true
                ),
                Map.of(
                        "id", "MPESA",
                        "name", "M-Pesa (ኤም-ፔሳ)",
                        "description", "Safaricom Ethiopia mobile money (Min: 20 ETB, Max: 75,000 ETB)",
                        "type", "MOBILE_MONEY",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 20,
                        "maxAmount", 75000,
                        "active", true
                ),
                Map.of(
                        "id", "CARD",
                        "name", "Credit / Debit Card",
                        "description", "Visa & Mastercard domestic and international (Min: 10 ETB, Max: 500,000 ETB)",
                        "type", "CARD",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB", "USD"),
                        "minAmount", 10,
                        "maxAmount", 500000,
                        "active", true
                ),
                Map.of(
                        "id", "CBE_TRANSFER",
                        "name", "CBE Bank Transfer",
                        "description", "Commercial Bank of Ethiopia direct account transfer (Min: 1 ETB, Max: 9,999,999 ETB)",
                        "type", "BANK_DIRECT",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 9999999,
                        "active", true
                ),
                Map.of(
                        "id", "AMOLE",
                        "name", "Amole (Dashen Bank)",
                        "description", "Dashen Bank digital wallet (Min: 1 ETB, Unlimited)",
                        "type", "MOBILE_MONEY",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 10000000,
                        "active", true
                ),
                Map.of(
                        "id", "ENAT_BANK",
                        "name", "Enat Bank Direct",
                        "description", "Enat Bank account transfer (Min: 1 ETB, Unlimited)",
                        "type", "BANK_DIRECT",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 10000000,
                        "active", true
                ),
                Map.of(
                        "id", "AMHARA_BANK",
                        "name", "Amhara Bank Direct",
                        "description", "Amhara Bank mobile & account transfer (Min: 1 ETB, Unlimited)",
                        "type", "BANK_DIRECT",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 10000000,
                        "active", true
                ),
                Map.of(
                        "id", "COOP",
                        "name", "COOP Bank Direct",
                        "description", "Cooperative Bank of Oromia account transfer (Min: 1 ETB, Max: 1,000,000 ETB)",
                        "type", "BANK_DIRECT",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB"),
                        "minAmount", 1,
                        "maxAmount", 1000000,
                        "active", true
                ),
                Map.of(
                        "id", "PAYPAL",
                        "name", "PayPal",
                        "description", "PayPal international checkout via Chapa (Min: 10 ETB, Max: 500,000 ETB)",
                        "type", "DIGITAL_WALLET",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB", "USD"),
                        "minAmount", 10,
                        "maxAmount", 500000,
                        "active", true
                ),
                Map.of(
                        "id", "CHAPA",
                        "name", "Chapa Hosted Unified Portal",
                        "description", "Auto-select any available Ethiopian bank or wallet on checkout",
                        "type", "AGGREGATOR",
                        "mode", "CHAPA_TEST_MODE",
                        "supportedCurrencies", List.of("ETB", "USD"),
                        "minAmount", 1,
                        "maxAmount", 10000000,
                        "active", true
                )
        );
        return ResponseEntity.ok(methods);
    }

    @PostMapping("/chapa/initialize")
    public ResponseEntity<Map<String, Object>> initializeChapaPayment(
            Authentication auth,
            @RequestHeader(value = "Origin", required = false) String origin,
            @RequestHeader(value = "Referer", required = false) String referer,
            @RequestBody Map<String, Object> payload) {
        AppUser user = userService.getOrCreateCurrentUser(auth);

        BigDecimal amount = payload.get("amount") != null ? new BigDecimal(payload.get("amount").toString()) : new BigDecimal("100.00");
        String purpose = (String) payload.getOrDefault("purpose", "ESCROW_MILESTONE");
        UUID contractId = (payload.get("contractId") != null && !payload.get("contractId").toString().isBlank())
                ? UUID.fromString(payload.get("contractId").toString()) : null;
        UUID milestoneId = (payload.get("milestoneId") != null && !payload.get("milestoneId").toString().isBlank())
                ? UUID.fromString(payload.get("milestoneId").toString()) : null;

        String clientBaseUrl = (origin != null && !origin.isBlank()) ? origin : null;
        if (clientBaseUrl == null && referer != null && !referer.isBlank()) {
            try {
                java.net.URI uri = java.net.URI.create(referer);
                clientBaseUrl = uri.getScheme() + "://" + uri.getAuthority();
            } catch (Exception ignored) {}
        }
        if (clientBaseUrl == null && payload.get("clientUrl") != null) {
            clientBaseUrl = payload.get("clientUrl").toString();
        }

        String paymentMethod = (String) payload.getOrDefault("paymentMethod", "CHAPA");
        Map<String, Object> resp = paymentService.initializeCheckout(contractId, milestoneId, user.getId(), amount, purpose, paymentMethod, clientBaseUrl);
        return ResponseEntity.ok(resp);
    }

    /**
     * Chapa Webhook Endpoint: Asynchronous, cryptographically signed payment notification handler.
     * Verifies HMAC-SHA256 signature against CHAPA_WEBHOOK_SECRET and enforces idempotency.
     */
    @PostMapping("/chapa/webhook")
    public ResponseEntity<Map<String, Object>> handleChapaWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "Chapa-Signature", required = false) String chapaSig,
            @RequestHeader(value = "x-chapa-signature", required = false) String xChapaSig,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        String signature = (chapaSig != null && !chapaSig.isBlank()) ? chapaSig : xChapaSig;
        Map<String, Object> result = paymentService.processChapaWebhook(rawPayload, signature, idempotencyKey);
        return ResponseEntity.ok(result);
    }

    /**
     * Authenticated verification check for returned checkouts.
     * Enforces caller ownership check, state validation, and queries genuine Chapa Gateway API.
     */
    @GetMapping("/chapa/verify/{txRef}")
    public ResponseEntity<Map<String, Object>> verifyChapaTransaction(
            @PathVariable String txRef,
            Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Map<String, Object> result = paymentService.verifyChapaPayment(txRef, user.getId(), isAdmin);
        if ("NOT_FOUND".equals(result.get("status"))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction reference not found: " + txRef);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/contracts/{contractId}")
    public ResponseEntity<List<PaymentTransaction>> getContractTransactions(@PathVariable UUID contractId) {
        return ResponseEntity.ok(paymentService.getTransactionsByContract(contractId));
    }

    @GetMapping("/escrow/ledger/{contractId}")
    public ResponseEntity<List<EscrowLedgerEntry>> getContractEscrowLedger(@PathVariable UUID contractId) {
        return ResponseEntity.ok(escrowLedgerService.getContractLedger(contractId));
    }

    @GetMapping("/escrow/payouts/me")
    public ResponseEntity<List<ProviderPayout>> getMyProviderPayouts(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(escrowLedgerService.getProviderPayouts(user.getId()));
    }

    @PostMapping("/escrow/reconciliation")
    public ResponseEntity<EscrowReconciliationRecord> runEscrowReconciliation() {
        return ResponseEntity.ok(escrowLedgerService.reconcileEscrow());
    }

    @GetMapping("/escrow/reconciliation")
    public ResponseEntity<List<EscrowReconciliationRecord>> getReconciliationHistory() {
        return ResponseEntity.ok(escrowLedgerService.getReconciliationHistory());
    }
}
