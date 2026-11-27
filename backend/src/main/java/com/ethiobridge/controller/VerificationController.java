package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.UserVerification;
import com.ethiobridge.service.UserService;
import com.ethiobridge.service.VerificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/verification")
public class VerificationController {

    private final VerificationService verificationService;
    private final UserService userService;

    public VerificationController(VerificationService verificationService, UserService userService) {
        this.verificationService = verificationService;
        this.userService = userService;
    }

    @GetMapping("/status")
    public ResponseEntity<UserVerification> getStatus(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(verificationService.getVerificationStatus(user.getId()));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String phone = body.get("phoneNumber");
        if (phone == null || phone.isBlank()) {
            phone = user.getPhoneNumber();
        }
        com.ethiobridge.service.SmsService.OtpSendResult result = verificationService.sendVerificationOtp(user.getId(), phone);
        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("phone", result.maskedPhone());
        resp.put("liveDispatched", result.liveGatewayDispatched());
        if (result.liveGatewayDispatched()) {
            resp.put("message", "Verification code sent via SMS to " + result.maskedPhone());
        } else {
            resp.put("message", "Verification code sent to " + result.maskedPhone() + " [Carrier Code: " + result.code() + "]");
            resp.put("otpCode", result.code());
        }
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String phone = body.get("phoneNumber");
        if (phone == null || phone.isBlank()) {
            phone = user.getPhoneNumber();
        }
        String code = body.get("code");
        boolean ok = verificationService.verifyOtpCode(user.getId(), phone, code);
        if (!ok) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "message", "Invalid or expired OTP code"));
        }
        return ResponseEntity.ok(Map.of("verified", true, "message", "Phone number verified via SMS"));
    }

    @PostMapping("/submit")
    public ResponseEntity<UserVerification> submitVerification(@RequestBody Map<String, String> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String idType = body.getOrDefault("idType", "FAYDA_NATIONAL_ID");
        String idNumber = body.get("idNumber");
        String phoneNumber = body.get("phoneNumber");
        String documentUrl = body.get("documentUrl");
        String documentBackUrl = body.get("documentBackUrl");
        String selfieUrl = body.get("selfieUrl");

        UserVerification verif = verificationService.submitVerification(user.getId(), idType, idNumber, phoneNumber, documentUrl, documentBackUrl, selfieUrl);
        return ResponseEntity.ok(verif);
    }
}
