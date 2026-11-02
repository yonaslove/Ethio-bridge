package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Contract;
import com.ethiobridge.entity.Message;
import com.ethiobridge.entity.MessageThread;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.MessageRepository;
import com.ethiobridge.repository.MessageThreadRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class MessagingService {

    private final MessageThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notificationService;
    private final ContractService contractService;

    public MessagingService(MessageThreadRepository threadRepository,
                            MessageRepository messageRepository,
                            AppUserRepository userRepository,
                            NotificationService notificationService,
                            @Lazy ContractService contractService) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.contractService = contractService;
    }

    public MessageThread getOrCreateThread(UUID currentUserId, UUID recipientUserId, UUID listingId, String subject) {
        if (currentUserId.equals(recipientUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot start a conversation with yourself");
        }

        List<MessageThread> existing = threadRepository.findBetweenUsers(currentUserId, recipientUserId);
        if (listingId != null) {
            for (MessageThread t : existing) {
                if (listingId.equals(t.getListingId())) {
                    return t;
                }
            }
        }
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        MessageThread newThread = new MessageThread(listingId, null, currentUserId, recipientUserId,
                subject != null && !subject.isBlank() ? subject : "Direct Inquiry");
        return threadRepository.save(newThread);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserThreads(UUID userId) {
        List<MessageThread> threads = threadRepository.findUserThreads(userId);
        List<Map<String, Object>> results = new ArrayList<>();

        for (MessageThread t : threads) {
            UUID otherUserId = t.getParticipant1UserId().equals(userId) ? t.getParticipant2UserId() : t.getParticipant1UserId();
            AppUser otherUser = userRepository.findById(otherUserId).orElse(null);

            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("listingId", t.getListingId());
            map.put("subject", t.getSubject());
            map.put("lastMessageAt", t.getLastMessageAt());
            map.put("otherUserId", otherUserId);
            map.put("otherUserName", otherUser != null ? otherUser.getFullName() : "EthioBridge User");
            map.put("otherUserEmail", otherUser != null ? otherUser.getEmail() : "");
            map.put("otherUserVerified", otherUser != null && otherUser.isVerified());

            List<Message> msgs = messageRepository.findByThreadIdOrderByCreatedAtAsc(t.getId());
            if (!msgs.isEmpty()) {
                Message last = msgs.get(msgs.size() - 1);
                map.put("lastMessageContent", last.getContent());
                map.put("lastMessageSenderId", last.getSenderUserId());
            }

            long unreadInThread = msgs.stream()
                    .filter(m -> m.getRecipientUserId().equals(userId) && !m.isRead())
                    .count();
            map.put("unreadCount", unreadInThread);

            results.add(map);
        }

        return results;
    }

    public List<Message> getThreadMessages(UUID threadId, UUID userId) {
        MessageThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        if (!thread.getParticipant1UserId().equals(userId) && !thread.getParticipant2UserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to thread");
        }

        List<Message> messages = messageRepository.findByThreadIdOrderByCreatedAtAsc(threadId);

        // Mark incoming messages as read
        for (Message m : messages) {
            if (m.getRecipientUserId().equals(userId) && !m.isRead()) {
                m.setRead(true);
                messageRepository.save(m);
            }
        }

        return messages;
    }

    public Message sendMessage(UUID threadId, UUID senderUserId, String content) {
        MessageThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        if (!thread.getParticipant1UserId().equals(senderUserId) && !thread.getParticipant2UserId().equals(senderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to thread");
        }

        UUID recipientUserId = thread.getParticipant1UserId().equals(senderUserId) ? thread.getParticipant2UserId() : thread.getParticipant1UserId();

        Message message = new Message(threadId, senderUserId, recipientUserId, content);
        message = messageRepository.save(message);

        thread.setLastMessageAt(OffsetDateTime.now());
        threadRepository.save(thread);

        AppUser sender = userRepository.findById(senderUserId).orElse(null);
        String senderName = sender != null ? sender.getFullName() : "A user";
        notificationService.sendNotification(
                recipientUserId,
                "New Message from " + senderName,
                content.length() > 60 ? content.substring(0, 57) + "..." : content,
                "MESSAGE",
                "/messages?threadId=" + threadId
        );

        return message;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return messageRepository.countUnreadByRecipient(userId);
    }

    public Map<String, Object> createOfferInThread(UUID threadId, UUID senderUserId, Map<String, Object> req) {
        MessageThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        if (!thread.getParticipant1UserId().equals(senderUserId) && !thread.getParticipant2UserId().equals(senderUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to thread");
        }

        UUID providerUserId = thread.getParticipant1UserId().equals(senderUserId) ? thread.getParticipant2UserId() : thread.getParticipant1UserId();

        UUID listingId = thread.getListingId();
        if (req.get("listingId") != null && !req.get("listingId").toString().isBlank() && !"null".equalsIgnoreCase(req.get("listingId").toString())) {
            listingId = UUID.fromString(req.get("listingId").toString());
        }

        UUID applicationId = thread.getApplicationId();
        if (req.get("applicationId") != null && !req.get("applicationId").toString().isBlank() && !"null".equalsIgnoreCase(req.get("applicationId").toString())) {
            applicationId = UUID.fromString(req.get("applicationId").toString());
        }

        String title = (String) req.getOrDefault("title", "Project Contract Agreement");
        String terms = (String) req.getOrDefault("terms", "Deliverables and milestones as agreed in chat discussion.");
        BigDecimal totalAmount = new BigDecimal(req.getOrDefault("totalAmount", "1000.00").toString());

        List<Map<String, Object>> milestones = (List<Map<String, Object>>) req.get("milestones");

        Contract contract = contractService.createContract(senderUserId, listingId, applicationId, providerUserId, title, terms, totalAmount, milestones);

        String offerContent = "[CONTRACT_OFFER:{\"contractId\":\"" + contract.getId() + "\",\"title\":\"" + title.replace("\"", "\\\"") + "\",\"amount\":" + totalAmount + "}] I have sent you an official escrow contract offer for \"" + title + "\" (" + totalAmount + " ETB). Please review and proceed to escrow funding.";
        Message offerMsg = sendMessage(threadId, senderUserId, offerContent);

        Map<String, Object> resp = new HashMap<>();
        resp.put("contract", contract);
        resp.put("message", offerMsg);
        return resp;
    }
}
