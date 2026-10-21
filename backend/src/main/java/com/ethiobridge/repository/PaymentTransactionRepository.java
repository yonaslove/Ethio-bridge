package com.ethiobridge.repository;

import com.ethiobridge.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    List<PaymentTransaction> findByContractIdOrderByCreatedAtDesc(UUID contractId);
    Optional<PaymentTransaction> findByTransactionRef(String transactionRef);
}
