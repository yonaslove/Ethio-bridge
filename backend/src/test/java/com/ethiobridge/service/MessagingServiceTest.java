package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Contract;
import com.ethiobridge.entity.Message;
import com.ethiobridge.entity.MessageThread;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.MessageRepository;
import com.ethiobridge.repository.MessageThreadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MessagingServiceTest {

    @Mock
    private MessageThreadRepository threadRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ContractService contractService;

    private MessagingService messagingService;

    private final UUID currentUserId = UUID.randomUUID();
    private final UUID recipientUserId = UUID.randomUUID();
    private final UUID threadId = UUID.randomUUID();
    private final UUID contractId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        messagingService = new MessagingService(
                threadRepository,
                messageRepository,
                userRepository,
                notificationService,
                contractService
        );
    }

    @Test
    @DisplayName("getOrCreateThread creates new thread if none exists between users")
    void testCreateThread() {
        when(threadRepository.findBetweenUsers(currentUserId, recipientUserId)).thenReturn(Collections.emptyList());
        when(threadRepository.save(any(MessageThread.class))).thenAnswer(inv -> {
            MessageThread t = inv.getArgument(0);
            t.setId(threadId);
            return t;
        });

        MessageThread thread = messagingService.getOrCreateThread(currentUserId, recipientUserId, null, "Project Inquiry");

        assertNotNull(thread);
        assertEquals(threadId, thread.getId());
        assertEquals(currentUserId, thread.getParticipant1UserId());
        assertEquals(recipientUserId, thread.getParticipant2UserId());
        verify(threadRepository).save(any(MessageThread.class));
    }

    @Test
    @DisplayName("getOrCreateThread throws BAD_REQUEST when user tries to chat with themselves")
    void testSelfChatThrowsError() {
        assertThrows(ResponseStatusException.class, () ->
                messagingService.getOrCreateThread(currentUserId, currentUserId, null, "Self")
        );
    }

    @Test
    @DisplayName("sendMessage persists message and dispatches notification to recipient")
    void testSendMessage() {
        MessageThread thread = new MessageThread(null, null, currentUserId, recipientUserId, "Subject");
        thread.setId(threadId);

        when(threadRepository.findById(threadId)).thenReturn(Optional.of(thread));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(new AppUser(UUID.randomUUID(), "a@b.com", "Abebe")));

        Message msg = messagingService.sendMessage(threadId, currentUserId, "Hello Dawit");

        assertNotNull(msg);
        assertEquals("Hello Dawit", msg.getContent());
        assertEquals(currentUserId, msg.getSenderUserId());
        assertEquals(recipientUserId, msg.getRecipientUserId());
        verify(notificationService).sendNotification(eq(recipientUserId), contains("Abebe"), anyString(), eq("MESSAGE"), anyString());
    }

    @Test
    @DisplayName("createOfferInThread creates formal contract and posts offer card into the thread")
    void testCreateOfferInThread() {
        MessageThread thread = new MessageThread(null, null, currentUserId, recipientUserId, "Mobile App Project");
        thread.setId(threadId);

        when(threadRepository.findById(threadId)).thenReturn(Optional.of(thread));

        Contract mockContract = new Contract(null, null, currentUserId, recipientUserId, "Flutter App", "Terms", new BigDecimal("7500.00"));
        mockContract.setId(contractId);

        when(contractService.createContract(eq(currentUserId), any(), any(), eq(recipientUserId), eq("Flutter App"), anyString(), eq(new BigDecimal("7500.00")), any()))
                .thenReturn(mockContract);

        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(new AppUser(UUID.randomUUID(), "seeker@eb.et", "Sara Bekele")));

        Map<String, Object> req = new HashMap<>();
        req.put("title", "Flutter App");
        req.put("terms", "Deliver prototype and APK");
        req.put("totalAmount", "7500.00");

        Map<String, Object> result = messagingService.createOfferInThread(threadId, currentUserId, req);

        assertNotNull(result);
        Contract created = (Contract) result.get("contract");
        Message offerMsg = (Message) result.get("message");

        assertEquals(contractId, created.getId());
        assertNotNull(offerMsg);
        assertTrue(offerMsg.getContent().contains("[CONTRACT_OFFER:"));
        assertTrue(offerMsg.getContent().contains("7500"));
    }
}
