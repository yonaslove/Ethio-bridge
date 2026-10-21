package com.ethiobridge.repository;

import com.ethiobridge.entity.MessageThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageThreadRepository extends JpaRepository<MessageThread, UUID> {
    @Query("SELECT mt FROM MessageThread mt WHERE mt.participant1UserId = :userId OR mt.participant2UserId = :userId ORDER BY mt.lastMessageAt DESC")
    List<MessageThread> findUserThreads(@Param("userId") UUID userId);

    @Query("SELECT mt FROM MessageThread mt WHERE (mt.participant1UserId = :u1 AND mt.participant2UserId = :u2) OR (mt.participant1UserId = :u2 AND mt.participant2UserId = :u1) ORDER BY mt.lastMessageAt DESC")
    List<MessageThread> findBetweenUsers(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
