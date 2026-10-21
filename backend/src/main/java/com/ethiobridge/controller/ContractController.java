package com.ethiobridge.controller;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Contract;
import com.ethiobridge.entity.ContractMilestone;
import com.ethiobridge.entity.Dispute;
import com.ethiobridge.service.ContractService;
import com.ethiobridge.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    private final ContractService contractService;
    private final UserService userService;

    public ContractController(ContractService contractService, UserService userService) {
        this.contractService = contractService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyContracts(Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        return ResponseEntity.ok(contractService.getUserContracts(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Contract> createContract(@RequestBody Map<String, Object> body, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        UUID listingId = UUID.fromString(body.get("listingId").toString());
        UUID applicationId = UUID.fromString(body.get("applicationId").toString());
        UUID providerUserId = UUID.fromString(body.get("providerUserId").toString());
        String title = (String) body.get("title");
        String terms = (String) body.getOrDefault("terms", "");
        BigDecimal totalAmount = new BigDecimal(body.get("totalAmount").toString());
        List<Map<String, Object>> milestones = (List<Map<String, Object>>) body.get("milestones");

        Contract contract = contractService.createContract(user.getId(), listingId, applicationId, providerUserId, title, terms, totalAmount, milestones);
        return ResponseEntity.ok(contract);
    }

    @PostMapping("/milestones/{milestoneId}/fund")
    public ResponseEntity<ContractMilestone> fundMilestone(@PathVariable UUID milestoneId,
                                                          @RequestBody Map<String, String> body,
                                                          Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String paymentMethod = body.getOrDefault("paymentMethod", "TELEBIRR");
        ContractMilestone milestone = contractService.fundMilestone(user.getId(), milestoneId, paymentMethod);
        return ResponseEntity.ok(milestone);
    }

    @PostMapping("/milestones/{milestoneId}/deliver")
    public ResponseEntity<ContractMilestone> deliverMilestone(@PathVariable UUID milestoneId,
                                                              @RequestBody(required = false) Map<String, String> body,
                                                              Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String deliveryNotes = body != null ? body.get("deliveryNotes") : null;
        ContractMilestone milestone = contractService.deliverMilestone(user.getId(), milestoneId, deliveryNotes);
        return ResponseEntity.ok(milestone);
    }

    @PostMapping("/milestones/{milestoneId}/revision")
    public ResponseEntity<ContractMilestone> requestRevision(@PathVariable UUID milestoneId,
                                                             @RequestBody Map<String, String> body,
                                                             Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String revisionReason = body.getOrDefault("revisionReason", "Additional changes requested");
        ContractMilestone milestone = contractService.requestMilestoneRevision(user.getId(), milestoneId, revisionReason);
        return ResponseEntity.ok(milestone);
    }

    @PostMapping("/milestones/{milestoneId}/release")
    public ResponseEntity<ContractMilestone> releaseMilestone(@PathVariable UUID milestoneId, Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        ContractMilestone milestone = contractService.releaseMilestone(user.getId(), milestoneId);
        return ResponseEntity.ok(milestone);
    }

    @PostMapping("/{contractId}/dispute")
    public ResponseEntity<Dispute> raiseDispute(@PathVariable UUID contractId,
                                                @RequestBody Map<String, String> body,
                                                Authentication auth) {
        AppUser user = userService.getOrCreateCurrentUser(auth);
        String reason = body.get("reason");
        String details = body.get("details");
        Dispute dispute = contractService.raiseDispute(user.getId(), contractId, reason, details);
        return ResponseEntity.ok(dispute);
    }
}
