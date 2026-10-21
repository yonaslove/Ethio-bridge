package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.PaymentTransaction;
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
    private final com.ethiobridge.service.ContractService contractService;

    public PaymentController(PaymentService paymentService, UserService userService, com.ethiobridge.service.ContractService contractService) {
        this.paymentService = paymentService;
        this.userService = userService;
        this.contractService = contractService;
    }

    @GetMapping("/methods")
    public ResponseEntity<List<Map<String, Object>>> getAvailablePaymentMethods() {
        List<Map<String, Object>> methods = List.of(
                Map.of(
                        "id", "CHAPA",
                        "name", "Chapa Payment Gateway",
                        "description", "Cards (Visa/Mastercard), Awash, Dashen, Bank Transfer, Telebirr via Chapa",
                        "type", "AGGREGATOR",
                        "mode", "SANDBOX_SIMULATED",
                        "supportedCurrencies", List.of("ETB", "USD"),
                        "active", true
                ),
                Map.of(
                        "id", "TELEBIRR",
                        "name", "Telebirr (ቴሌብር)",
                        "description", "Ethio telecom instant USSD & SuperApp QR",
                        "type", "MOBILE_MONEY",
                        "mode", "SANDBOX_SIMULATED",
                        "supportedCurrencies", List.of("ETB"),
                        "active", true
                ),
                Map.of(
                        "id", "CBE_BIRR",
                        "name", "CBE Birr (የኢትዮጵያ ንግድ ባንክ)",
                        "description", "Commercial Bank of Ethiopia direct mobile banking",
                        "type", "BANK_DIRECT",
                        "mode", "SANDBOX_SIMULATED",
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

    @GetMapping("/chapa/verify/{txRef}")
    public ResponseEntity<Map<String, Object>> verifyChapaTransaction(@PathVariable String txRef) {
        Map<String, Object> result = paymentService.verifyChapaPayment(txRef);
        if ("NOT_FOUND".equals(result.get("status"))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction reference not found: " + txRef);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/contracts/{contractId}")
    public ResponseEntity<List<PaymentTransaction>> getContractTransactions(@PathVariable UUID contractId) {
        return ResponseEntity.ok(paymentService.getTransactionsByContract(contractId));
    }
}
