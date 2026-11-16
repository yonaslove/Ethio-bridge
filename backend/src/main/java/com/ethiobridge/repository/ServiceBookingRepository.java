package com.ethiobridge.repository;

import com.ethiobridge.entity.ServiceBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceBookingRepository extends JpaRepository<ServiceBooking, UUID> {

    List<ServiceBooking> findByCustomerUserIdOrderByCreatedAtDesc(UUID customerUserId);

    List<ServiceBooking> findByProviderUserIdOrderByCreatedAtDesc(UUID providerUserId);

    @Query("SELECT b FROM ServiceBooking b WHERE b.customerUserId = :userId OR b.providerUserId = :userId ORDER BY b.createdAt DESC")
    List<ServiceBooking> findUserBookings(@Param("userId") UUID userId);

    List<ServiceBooking> findAllByOrderByCreatedAtDesc();
}
