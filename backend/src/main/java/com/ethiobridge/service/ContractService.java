package com.ethiobridge.service;

import com.ethiobridge.entity.*;
import com.ethiobridge.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractMilestoneRepository milestoneRepository;
    private final PaymentService paymentService;
    private final DisputeRepository disputeRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final AppUserRepository userRepository;
    private final MonetizationService monetizationService;
    private final EscrowLedgerService escrowLedgerService;

    @org.springframework.beans.factory.annotation.Autowired
    public ContractService(ContractRepository contractRepository,
                           ContractMilestoneRepository milestoneRepository,
                           PaymentService paymentService,
                           DisputeRepository disputeRepository,
                           NotificationService notificationService,
                           AuditLogService auditLogService,
                           AppUserRepository userRepository,
                           MonetizationService monetizationService,
                           EscrowLedgerService escrowLedgerService) {
        this.contractRepository = contractRepository;
        this.milestoneRepository = milestoneRepository;
        this.paymentService = paymentService;
        this.disputeRepository = disputeRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
        this.monetizationService = monetizationService;
        this.escrowLedgerService = escrowLedgerService;
    }

    public ContractService(ContractRepository contractRepository,
                           ContractMilestoneRepository milestoneRepository,
                           PaymentService paymentService,
                           DisputeRepository disputeRepository,
                           NotificationService notificationService,
                           AuditLogService auditLogService,
                           AppUserRepository userRepository,
                           MonetizationService monetizationService) {
        this(contractRepository, milestoneRepository, paymentService, disputeRepository,
             notificationService, auditLogService, userRepository, monetizationService, null);
    }

    public Contract createContract(UUID seekerUserId, UUID listingId, UUID applicationId, UUID providerUserId,
                                  String title, String terms, BigDecimal totalAmount, List<Map<String, Object>> milestones) {
        Contract contract = new Contract(listingId, applicationId, seekerUserId, providerUserId, title, terms, totalAmount);
        contract = contractRepository.save(contract);

        if (milestones != null && !milestones.isEmpty()) {
            for (Map<String, Object> m : milestones) {
                String mTitle = (String) m.getOrDefault("title", "Project Milestone");
                String mDesc = (String) m.getOrDefault("description", "");
                BigDecimal mAmount = new BigDecimal(m.get("amount").toString());
                ContractMilestone cm = new ContractMilestone(contract.getId(), mTitle, mDesc, mAmount, OffsetDateTime.now().plusDays(14));
                milestoneRepository.save(cm);
            }
        } else {
            // Default full milestone
            ContractMilestone cm = new ContractMilestone(contract.getId(), "Full Project Delivery", "Full completion of agreed scope", totalAmount, OffsetDateTime.now().plusDays(30));
            milestoneRepository.save(cm);
        }

        auditLogService.log(seekerUserId, "CREATE_CONTRACT", "Contract", contract.getId().toString(),
                "Title: " + title + ", Amount: " + totalAmount + " ETB", null);

        notificationService.sendNotification(
                providerUserId,
                "New Contract Agreement Created",
                "A formal escrow service agreement has been drafted for \"" + title + "\". Total: " + totalAmount + " ETB",
                "CONTRACT",
                "/contracts"
        );

        return contract;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserContracts(UUID userId) {
        List<Contract> contracts = contractRepository.findUserContracts(userId);
        List<Map<String, Object>> results = new ArrayList<>();

        for (Contract c : contracts) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("listingId", c.getListingId());
            map.put("applicationId", c.getApplicationId());
            map.put("seekerUserId", c.getSeekerUserId());
            map.put("providerUserId", c.getProviderUserId());
            map.put("title", c.getTitle());
            map.put("terms", c.getTerms());
            map.put("totalAmount", c.getTotalAmount());
            map.put("currency", c.getCurrency());
            map.put("status", c.getStatus());
            map.put("createdAt", c.getCreatedAt());
            map.put("completedAt", c.getCompletedAt());

            AppUser seeker = userRepository.findById(c.getSeekerUserId()).orElse(null);
            AppUser provider = userRepository.findById(c.getProviderUserId()).orElse(null);
            map.put("seekerName", seeker != null ? seeker.getFullName() : "Seeker");
            map.put("providerName", provider != null ? provider.getFullName() : "Provider");
            map.put("providerVerified", provider != null && provider.isVerified());

            List<ContractMilestone> milestones = milestoneRepository.findByContractIdOrderByCreatedAtAsc(c.getId());
            map.put("milestones", milestones);

            results.add(map);
        }

        return results;
    }

    public ContractMilestone fundMilestone(UUID actorUserId, UUID milestoneId, String paymentMethod) {
        ContractMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Milestone not found"));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (!contract.getSeekerUserId().equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the seeker can fund escrow milestones");
        }

        if (!"PENDING".equalsIgnoreCase(milestone.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone is already funded or released");
        }

        PaymentTransaction tx = paymentService.initiatePayment(contract.getId(), milestone.getId(), actorUserId, milestone.getAmount(), paymentMethod);

        milestone.setStatus("FUNDED");
        milestone.setFundedAt(OffsetDateTime.now());
        milestone = milestoneRepository.save(milestone);

        if (escrowLedgerService != null) {
            escrowLedgerService.recordDepositHold(
                    contract.getId(),
                    milestone.getId(),
                    contract.getSeekerUserId(),
                    contract.getProviderUserId(),
                    milestone.getAmount(),
                    tx.getTransactionRef(),
                    paymentMethod
            );
        }

        notificationService.sendNotification(
                contract.getProviderUserId(),
                "Escrow Milestone Funded (" + milestone.getAmount() + " ETB)",
                "Seeker funded \"" + milestone.getTitle() + "\" via " + paymentMethod + ". Funds are held in escrow.",
                "CONTRACT",
                "/contracts"
        );

        return milestone;
    }

    public ContractMilestone deliverMilestone(UUID actorUserId, UUID milestoneId, String deliveryNotes) {
        ContractMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Milestone not found"));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (!contract.getProviderUserId().equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned provider can submit milestone deliverables");
        }

        if (!"FUNDED".equalsIgnoreCase(milestone.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone must be funded in escrow before submitting delivery. Upwork escrow protection requires upfront funding.");
        }

        milestone.setStatus("DELIVERED");
        milestone.setDeliveredAt(OffsetDateTime.now());
        milestone.setDeliveryNotes(deliveryNotes != null && !deliveryNotes.isBlank() ? deliveryNotes.trim() : "Completed milestone deliverables submitted for review.");
        milestone = milestoneRepository.save(milestone);

        auditLogService.log(actorUserId, "DELIVER_MILESTONE", "ContractMilestone", milestone.getId().toString(),
                "Provider submitted delivery for milestone: " + milestone.getTitle(), null);

        notificationService.sendNotification(
                contract.getSeekerUserId(),
                "Work Delivered for Review (" + milestone.getTitle() + ")",
                "Provider has delivered work for milestone \"" + milestone.getTitle() + "\". Please inspect deliverables and approve escrow release.",
                "CONTRACT",
                "/contracts"
        );

        return milestone;
    }

    public ContractMilestone requestMilestoneRevision(UUID actorUserId, UUID milestoneId, String revisionReason) {
        ContractMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Milestone not found"));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (!contract.getSeekerUserId().equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the contract seeker can request revisions");
        }

        if (!"DELIVERED".equalsIgnoreCase(milestone.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Revisions can only be requested on delivered milestones");
        }

        milestone.setStatus("FUNDED");
        String currentNotes = milestone.getDeliveryNotes() != null ? milestone.getDeliveryNotes() : "";
        milestone.setDeliveryNotes(currentNotes + "\n[Revision Requested by Seeker]: " + revisionReason);
        milestone = milestoneRepository.save(milestone);

        auditLogService.log(actorUserId, "REVISE_MILESTONE", "ContractMilestone", milestone.getId().toString(),
                "Seeker requested revisions for milestone: " + milestone.getTitle() + ". Note: " + revisionReason, null);

        notificationService.sendNotification(
                contract.getProviderUserId(),
                "Revision Requested on Milestone (" + milestone.getTitle() + ")",
                "Seeker reviewed your delivery and requested revisions: \"" + revisionReason + "\". Funds remain locked in escrow.",
                "CONTRACT",
                "/contracts"
        );

        return milestone;
    }

    public ContractMilestone releaseMilestone(UUID actorUserId, UUID milestoneId) {
        ContractMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Milestone not found"));

        Contract contract = contractRepository.findById(milestone.getContractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (!contract.getSeekerUserId().equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the seeker can release escrow funds");
        }

        if (!"FUNDED".equalsIgnoreCase(milestone.getStatus()) && !"DELIVERED".equalsIgnoreCase(milestone.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone must be funded or delivered before release");
        }

        milestone.setStatus("RELEASED");
        milestone.setReleasedAt(OffsetDateTime.now());

        // Platform Commission: 10% (Upwork model)
        BigDecimal feePercent = new BigDecimal("10.00");
        BigDecimal feeAmount = milestone.getAmount().multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal netPayout = milestone.getAmount().subtract(feeAmount);

        milestone.setPlatformFeePercent(feePercent);
        milestone.setPlatformFeeAmount(feeAmount);
        milestone.setNetPayoutAmount(netPayout);

        milestone = milestoneRepository.save(milestone);

        // Fetch provider user for payout destination
        AppUser provider = userRepository.findById(contract.getProviderUserId()).orElse(null);
        String payoutAccount = (provider != null && provider.getPhoneNumber() != null) ? provider.getPhoneNumber() : "TELEBIRR_REGISTERED_PHONE";

        String payoutRef = "PAYOUT-ESC-" + System.currentTimeMillis();
        if (escrowLedgerService != null) {
            ProviderPayout payout = escrowLedgerService.recordReleasePayout(
                    contract.getId(),
                    milestone.getId(),
                    contract.getSeekerUserId(),
                    contract.getProviderUserId(),
                    milestone.getAmount(),
                    feeAmount,
                    netPayout,
                    "TELEBIRR",
                    payoutAccount
            );
            if (payout != null && payout.getPayoutReference() != null) {
                payoutRef = payout.getPayoutReference();
            }
        }

        // Record platform commission in revenue ledger
        monetizationService.recordEscrowCommission(
                milestone.getId(),
                contract.getSeekerUserId(),
                milestone.getAmount(),
                feeAmount,
                netPayout,
                "10% Escrow platform service fee on \"" + contract.getTitle() + "\" (" + milestone.getTitle() + ") [Disbursement Ref: " + payoutRef + "]"
        );

        // Check if all milestones released, mark contract completed
        List<ContractMilestone> all = milestoneRepository.findByContractIdOrderByCreatedAtAsc(contract.getId());
        boolean allReleased = all.stream().allMatch(m -> "RELEASED".equalsIgnoreCase(m.getStatus()));
        if (allReleased) {
            contract.setStatus("COMPLETED");
            contract.setCompletedAt(OffsetDateTime.now());
            contractRepository.save(contract);
        }

        auditLogService.log(actorUserId, "RELEASE_ESCROW", "ContractMilestone", milestone.getId().toString(),
                "Gross: " + milestone.getAmount() + " ETB, 10% Fee: " + feeAmount + " ETB, Net to provider: " + netPayout + " ETB", null);

        notificationService.sendNotification(
                contract.getProviderUserId(),
                "Payout Released! (" + netPayout + " ETB Net)",
                "Milestone \"" + milestone.getTitle() + "\" released. Gross: " + milestone.getAmount() + " ETB, 10% Platform Fee: " + feeAmount + " ETB. Net transferred: " + netPayout + " ETB.",
                "CONTRACT",
                "/contracts"
        );

        return milestone;
    }

    public ContractMilestone refundMilestoneEscrow(UUID contractId, UUID milestoneId, UUID actorUserId, String reason) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        ContractMilestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Milestone not found"));

        if (!milestone.getContractId().equals(contractId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone does not belong to specified contract");
        }

        if (!"FUNDED".equalsIgnoreCase(milestone.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot refund milestone in '" + milestone.getStatus() + "' status. Only FUNDED milestones can be refunded.");
        }

        milestone.setStatus("REFUNDED");
        milestone = milestoneRepository.save(milestone);

        if (escrowLedgerService != null) {
            escrowLedgerService.recordMilestoneRefund(
                    contractId,
                    milestoneId,
                    contract.getSeekerUserId(),
                    contract.getProviderUserId(),
                    milestone.getAmount(),
                    reason
            );
        }

        auditLogService.log(actorUserId, "REFUND_MILESTONE", "ContractMilestone", milestone.getId().toString(),
                "Refunded " + milestone.getAmount() + " ETB on contract " + contractId + ". Reason: " + reason, null);

        notificationService.sendNotification(
                contract.getSeekerUserId(),
                "Escrow Refund Processed (" + milestone.getAmount() + " ETB)",
                "Funds for milestone \"" + milestone.getTitle() + "\" have been refunded to your account.",
                "CONTRACT",
                "/contracts"
        );
        notificationService.sendNotification(
                contract.getProviderUserId(),
                "Milestone Escrow Refunded",
                "Escrow deposit for milestone \"" + milestone.getTitle() + "\" (" + milestone.getAmount() + " ETB) has been returned to seeker.",
                "CONTRACT",
                "/contracts"
        );

        return milestone;
    }

    public Dispute raiseDispute(UUID actorUserId, UUID contractId, String reason, String details) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (!contract.getSeekerUserId().equals(actorUserId) && !contract.getProviderUserId().equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only parties to the contract can open a dispute");
        }

        Dispute dispute = new Dispute(contractId, actorUserId, reason, details);
        dispute = disputeRepository.save(dispute);

        contract.setStatus("DISPUTED");
        contractRepository.save(contract);

        auditLogService.log(actorUserId, "RAISE_DISPUTE", "Dispute", dispute.getId().toString(),
                "Contract: " + contractId + ", Reason: " + reason, null);

        UUID counterparty = contract.getSeekerUserId().equals(actorUserId) ? contract.getProviderUserId() : contract.getSeekerUserId();
        notificationService.sendNotification(
                counterparty,
                "Dispute Filed on Contract",
                "A formal dispute has been raised on \"" + contract.getTitle() + "\". Our mediation desk is reviewing.",
                "CONTRACT",
                "/contracts"
        );

        return dispute;
    }

    @Transactional(readOnly = true)
    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAllByOrderByCreatedAtDesc();
    }

    public Dispute resolveDispute(UUID adminUserId, UUID disputeId, String status, String adminResolution) {
        return resolveDispute(adminUserId, disputeId, status, adminResolution, null);
    }

    public Dispute resolveDispute(UUID adminUserId, UUID disputeId, String status, String adminResolution, String resolutionAction) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));

        dispute.setStatus(status);
        dispute.setAdminResolution(adminResolution);
        dispute.setResolvedBy(adminUserId);
        dispute.setResolvedAt(OffsetDateTime.now());
        dispute = disputeRepository.save(dispute);

        Contract contract = contractRepository.findById(dispute.getContractId()).orElse(null);
        if (contract != null) {
            List<ContractMilestone> milestones = milestoneRepository.findByContractIdOrderByCreatedAtAsc(contract.getId());

            if ("REFUND_SEEKER".equalsIgnoreCase(resolutionAction) || "REFUND".equalsIgnoreCase(resolutionAction)) {
                for (ContractMilestone m : milestones) {
                    if ("FUNDED".equalsIgnoreCase(m.getStatus())) {
                        refundMilestoneEscrow(contract.getId(), m.getId(), adminUserId,
                                "Dispute resolved in favor of Seeker: " + adminResolution);
                    }
                }
                contract.setStatus("RESOLVED_REFUNDED");
            } else if ("RELEASE_PROVIDER".equalsIgnoreCase(resolutionAction) || "PAY_PROVIDER".equalsIgnoreCase(resolutionAction)) {
                for (ContractMilestone m : milestones) {
                    if ("FUNDED".equalsIgnoreCase(m.getStatus())) {
                        releaseMilestone(contract.getSeekerUserId(), m.getId());
                    }
                }
                contract.setStatus("RESOLVED_RELEASED");
            } else {
                contract.setStatus("RESOLVED".equals(status) || "SETTLED".equals(status) ? "COMPLETED" : "ACTIVE");
            }
            contractRepository.save(contract);
        }

        auditLogService.log(adminUserId, "RESOLVE_DISPUTE", "Dispute", dispute.getId().toString(),
                "Resolution: " + adminResolution + ", Status: " + status + (resolutionAction != null ? ", Action: " + resolutionAction : ""), null);

        return dispute;
    }
}
