package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Contract;
import com.ethiobridge.entity.ContractMilestone;
import com.ethiobridge.entity.Dispute;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.ContractMilestoneRepository;
import com.ethiobridge.repository.ContractRepository;
import com.ethiobridge.repository.DisputeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractMilestoneRepository milestoneRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private DisputeRepository disputeRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private MonetizationService monetizationService;

    private ContractService contractService;

    private final UUID seekerId = UUID.randomUUID();
    private final UUID providerId = UUID.randomUUID();
    private final UUID listingId = UUID.randomUUID();
    private final UUID applicationId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();
    private final UUID milestoneId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        contractService = new ContractService(
                contractRepository,
                milestoneRepository,
                paymentService,
                disputeRepository,
                notificationService,
                auditLogService,
                userRepository,
                monetizationService
        );

        lenient().when(contractRepository.save(any(Contract.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(milestoneRepository.save(any(ContractMilestone.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(disputeRepository.save(any(Dispute.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("createContract creates active contract and logs audit trail")
    void testCreateContract() {
        Contract contract = contractService.createContract(
                seekerId, listingId, applicationId, providerId,
                "Mobile App Development", "Terms of engagement", new BigDecimal("10000.00"), Collections.emptyList()
        );

        assertNotNull(contract);
        assertEquals("ACTIVE", contract.getStatus());
        assertEquals("Mobile App Development", contract.getTitle());
        assertEquals(new BigDecimal("10000.00"), contract.getTotalAmount());
        verify(contractRepository).save(any(Contract.class));
        verify(notificationService).sendNotification(eq(providerId), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("deliverMilestone marks milestone DELIVERED and notifies seeker")
    void testDeliverMilestone() {
        Contract contract = new Contract(listingId, applicationId, seekerId, providerId, "Title", "Terms", new BigDecimal("5000"));
        contract.setId(contractId);

        ContractMilestone milestone = new ContractMilestone(contractId, "Phase 1", "API implementation", new BigDecimal("5000"), null);
        milestone.setId(milestoneId);
        milestone.setStatus("FUNDED");

        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));

        ContractMilestone result = contractService.deliverMilestone(
                providerId, milestoneId, "Completed backend endpoints. Docs at https://api.docs"
        );

        assertEquals("DELIVERED", result.getStatus());
        assertNotNull(result.getDeliveredAt());
        assertTrue(result.getDeliveryNotes().contains("Completed backend endpoints"));
        verify(notificationService).sendNotification(eq(seekerId), contains("Work Delivered"), anyString(), eq("CONTRACT"), anyString());
    }

    @Test
    @DisplayName("releaseMilestone calculates 10% platform fee and 90% net payout to provider")
    void testReleaseMilestone() {
        Contract contract = new Contract(listingId, applicationId, seekerId, providerId, "Fintech", "Terms", new BigDecimal("10000"));
        contract.setId(contractId);

        ContractMilestone milestone = new ContractMilestone(contractId, "Backend Dev", "Spring Boot", new BigDecimal("10000"), null);
        milestone.setId(milestoneId);
        milestone.setStatus("DELIVERED");

        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(userRepository.findById(seekerId)).thenReturn(Optional.of(new AppUser(UUID.randomUUID(), "seeker@ethiobridge.et", "Sara Bekele")));

        ContractMilestone result = contractService.releaseMilestone(seekerId, milestoneId);

        assertEquals("RELEASED", result.getStatus());
        assertNotNull(result.getReleasedAt());
        assertEquals(new BigDecimal("10.00"), result.getPlatformFeePercent());
        assertEquals(new BigDecimal("1000.00"), result.getPlatformFeeAmount()); // 10% fee
        assertEquals(new BigDecimal("9000.00"), result.getNetPayoutAmount());   // 90% payout
        verify(notificationService).sendNotification(eq(providerId), contains("Payment Released"), anyString(), eq("PAYMENT"), anyString());
    }

    @Test
    @DisplayName("releaseMilestone fails if non-seeker attempts to release funds")
    void testReleaseMilestoneForbiddenForNonSeeker() {
        Contract contract = new Contract(listingId, applicationId, seekerId, providerId, "Fintech", "Terms", new BigDecimal("5000"));
        contract.setId(contractId);

        ContractMilestone milestone = new ContractMilestone(contractId, "Backend Dev", "Desc", new BigDecimal("5000"), null);
        milestone.setId(milestoneId);
        milestone.setStatus("DELIVERED");

        when(milestoneRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));

        assertThrows(ResponseStatusException.class, () -> contractService.releaseMilestone(providerId, milestoneId));
    }

    @Test
    @DisplayName("raiseDispute transitions contract to DISPUTED and notifies counterparty")
    void testRaiseDispute() {
        Contract contract = new Contract(listingId, applicationId, seekerId, providerId, "Fintech Project", "Terms", new BigDecimal("8000"));
        contract.setId(contractId);
        contract.setStatus("ACTIVE");

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));

        Dispute dispute = contractService.raiseDispute(providerId, contractId, "UNRESPONSIVE_SEEKER", "Seeker has not released payment 10 days after delivery.");

        assertNotNull(dispute);
        assertEquals("DISPUTED", contract.getStatus());
        verify(disputeRepository).save(any(Dispute.class));
        verify(notificationService).sendNotification(eq(seekerId), contains("Dispute"), anyString(), eq("CONTRACT"), anyString());
    }

    @Test
    @DisplayName("resolveDispute by admin marks dispute RESOLVED and restores contract status")
    void testResolveDispute() {
        UUID disputeId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        Dispute dispute = new Dispute(contractId, providerId, "UNRESPONSIVE_SEEKER", "Details");
        dispute.setId(disputeId);

        Contract contract = new Contract(listingId, applicationId, seekerId, providerId, "Fintech", "Terms", new BigDecimal("5000"));
        contract.setId(contractId);
        contract.setStatus("DISPUTED");

        when(disputeRepository.findById(disputeId)).thenReturn(Optional.of(dispute));
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));

        Dispute resolved = contractService.resolveDispute(adminId, disputeId, "RESOLVED", "Mediation desk verified deliverable completion; released funds.");

        assertEquals("RESOLVED", resolved.getStatus());
        assertEquals(adminId, resolved.getResolvedBy());
        assertNotNull(resolved.getResolvedAt());
        assertEquals("COMPLETED", contract.getStatus());
    }
}
