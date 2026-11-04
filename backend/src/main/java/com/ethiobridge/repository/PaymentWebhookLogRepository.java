package com.ethiobridge.repository;

import com.ethiobridge.entity.PaymentWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentWebhookLogRepository extends JpaRepository<PaymentWebhookLog, UUID> {
    Optional<PaymentWebhookLog> findByIdempotencyKey(String idempotencyKey);
    Optional<PaymentWebhookLog> findByTxRef(String txRef);
}
