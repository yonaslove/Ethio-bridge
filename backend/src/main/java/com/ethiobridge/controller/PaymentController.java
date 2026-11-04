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
                        "id", "CHAPA",
                        "name", "Chapa Payment Gateway",
                        "description", "Cards (Visa/Mastercard), Awash, Dashen, Bank Transfer, Telebirr via Chapa",
                        "type", "AGGREGATOR",
                        "mode", "CHAPA_LIVE_SANDBOX",
                        "supportedCurrencies", List.of("ETB", "USD"),
                        "active", true
                ),
                Map.of(
                        "id", "TELEBIRR",
                        "name", "Telebirr (ቴሌብር)",
                        "description", "Ethio telecom instant USSD & SuperApp QR",
                        "type", "MOBILE_MONEY",
                        "mode", "ESCROW_VAULT_SETTLED",
                        "supportedCurrencies", List.of("ETB"),
                        "active", true
                ),
                Map.of(
                        "id", "CBE_BIRR",
                        "name", "CBE Birr (የኢትዮጵያ ንግድ ባንክ)",
                        "description", "Commercial Bank of Ethiopia direct mobile banking",
                        "type", "BANK_DIRECT",
                        "mode", "ESCROW_VAULT_SETTLED",
                        "supportedCurrencies", List.of("ETB"),
                        "active", true
                )
        );
        return ResponseEntity.ok(methods);
    }

    @PostMapping("/chapa/initialize")
    public ResponseEntity<Map<String, Object>> initializeChapaPayment(
            Authentication auth,
            @RequestBody Map<String, Object> payload) {
        AppUser user = userService.getOrCreateCurrentUser(auth);

        BigDecimal amount = payload.get("amount") != null ? new BigDecimal(payload.get("amount").toString()) : new BigDecimal("100.00");
        String purpose = (String) payload.getOrDefault("purpose", "ESCROW_MILESTONE");
        UUID contractId = (payload.get("contractId") != null && !payload.get("contractId").toString().isBlank())
                ? UUID.fromString(payload.get("contractId").toString()) : null;
        UUID milestoneId = (payload.get("milestoneId") != null && !payload.get("milestoneId").toString().isBlank())
                ? UUID.fromString(payload.get("milestoneId").toString()) : null;

        Map<String, Object> resp = paymentService.initializeChapaCheckout(contractId, milestoneId, user.getId(), amount, purpose);
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
