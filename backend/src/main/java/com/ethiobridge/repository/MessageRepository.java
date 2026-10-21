package com.ethiobridge.repository;

import com.ethiobridge.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByThreadIdOrderByCreatedAtAsc(UUID threadId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientUserId = :userId AND m.isRead = false")
    long countUnreadByRecipient(@Param("userId") UUID userId);

    List<Message> findByRecipientUserIdAndIsReadFalse(UUID recipientUserId);
}
