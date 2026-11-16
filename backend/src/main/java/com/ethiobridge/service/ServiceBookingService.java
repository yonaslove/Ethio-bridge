package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Location;
import com.ethiobridge.entity.ServiceBooking;
import com.ethiobridge.entity.ServiceCategory;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.LocationRepository;
import com.ethiobridge.repository.ServiceBookingRepository;
import com.ethiobridge.repository.ServiceCategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class ServiceBookingService {

    private final ServiceBookingRepository bookingRepository;
    private final AppUserRepository userRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public ServiceBookingService(ServiceBookingRepository bookingRepository,
                                 AppUserRepository userRepository,
                                 ServiceCategoryRepository categoryRepository,
                                 LocationRepository locationRepository,
                                 NotificationService notificationService,
                                 AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.locationRepository = locationRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    public Map<String, Object> createBooking(UUID customerUserId, Map<String, Object> request) {
        UUID providerUserId = UUID.fromString(request.get("providerUserId").toString());

        if (customerUserId.equals(providerUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot book your own service");
        }

        String title = (String) request.getOrDefault("title", "Local Service Request");
        String description = (String) request.get("description");
        String serviceAddress = (String) request.get("serviceAddress");
        if (serviceAddress == null || serviceAddress.trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service address is required for local trade booking");
        }

        OffsetDateTime scheduledAt = request.get("scheduledAt") != null
                ? OffsetDateTime.parse(request.get("scheduledAt").toString())
                : OffsetDateTime.now().plusDays(1);

        if (scheduledAt.isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking appointment must be scheduled for a future time");
        }

        BigDecimal estimatedHours = request.get("estimatedHours") != null
                ? new BigDecimal(request.get("estimatedHours").toString())
                : BigDecimal.valueOf(2.0);

        if (estimatedHours.compareTo(BigDecimal.ZERO) <= 0 || estimatedHours.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estimated hours must be between 0.5 and 100 hours");
        }

        BigDecimal hourlyRate = request.get("hourlyRate") != null
                ? new BigDecimal(request.get("hourlyRate").toString())
                : BigDecimal.valueOf(350.0);

        if (hourlyRate.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hourly rate cannot be negative");
        }

        // Duplicate pending request prevention: check if customer already has a pending booking for this provider with same title
        boolean duplicatePending = bookingRepository.findUserBookings(customerUserId).stream()
                .anyMatch(b -> b.getProviderUserId().equals(providerUserId)
                        && "PENDING".equalsIgnoreCase(b.getStatus())
                        && b.getTitle().equalsIgnoreCase(title.trim()));
        if (duplicatePending) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending booking request with this title for this provider");
        }

        ServiceBooking booking = new ServiceBooking(customerUserId, providerUserId, title, description,
                scheduledAt, estimatedHours, hourlyRate);
        booking.setServiceAddress(serviceAddress.trim());

        if (request.get("categoryId") != null) {
            categoryRepository.findById(Long.parseLong(request.get("categoryId").toString()))
                    .ifPresent(booking::setServiceCategory);
        }

        if (request.get("locationId") != null) {
            locationRepository.findById(Long.parseLong(request.get("locationId").toString()))
                    .ifPresent(booking::setLocation);
        }

        ServiceBooking saved = bookingRepository.save(booking);

        auditLogService.log(customerUserId, "CREATE_SERVICE_BOOKING", "ServiceBooking", saved.getId().toString(),
                "Booked " + title + " with provider " + providerUserId + ", Total: " + saved.getTotalAmount() + " ETB", null);

        AppUser customer = userRepository.findById(customerUserId).orElse(null);
        String customerName = customer != null ? customer.getFullName() : "A customer";

        notificationService.sendNotification(
                providerUserId,
                "New Local Service Request",
                customerName + " requested service: \"" + title + "\" on " + scheduledAt.toLocalDate() + ". Total: " + saved.getTotalAmount() + " ETB.",
                "BOOKING",
                "/contracts"
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserBookings(UUID userId) {
        List<ServiceBooking> list = bookingRepository.findUserBookings(userId);
        return list.stream().map(this::toDto).toList();
    }

    public Map<String, Object> updateBookingStatus(UUID actorUserId, UUID bookingId, String targetStatus, String reason) {
        ServiceBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        boolean isCustomer = booking.getCustomerUserId().equals(actorUserId);
        boolean isProvider = booking.getProviderUserId().equals(actorUserId);

        if (!isCustomer && !isProvider) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to this booking");
        }

        String currentStatus = booking.getStatus();
        String upperTarget = targetStatus.toUpperCase();

        switch (upperTarget) {
            case "CONFIRMED" -> {
                if (!isProvider) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the service provider can confirm a booking");
                if (!"PENDING".equalsIgnoreCase(currentStatus)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be confirmed");
                }
                booking.setStatus("CONFIRMED");
            }
            case "REJECTED" -> {
                if (!isProvider) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the service provider can reject a booking");
                booking.setStatus("REJECTED");
                booking.setCancellationReason(reason != null ? reason : "Declined by service provider");
            }
            case "IN_PROGRESS" -> {
                if (!isProvider) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only provider can start work");
                booking.setStatus("IN_PROGRESS");
            }
            case "COMPLETED" -> {
                if (!isCustomer && !isProvider) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
                booking.setStatus("COMPLETED");
                booking.setCompletedAt(OffsetDateTime.now());
            }
            case "CANCELLED" -> {
                booking.setStatus("CANCELLED");
                booking.setCancellationReason(reason != null ? reason : "Cancelled by party");
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + targetStatus);
        }

        ServiceBooking saved = bookingRepository.save(booking);

        UUID recipient = isCustomer ? booking.getProviderUserId() : booking.getCustomerUserId();
        notificationService.sendNotification(
                recipient,
                "Service Booking Update: " + upperTarget,
                "Booking \"" + booking.getTitle() + "\" is now " + upperTarget + ".",
                "BOOKING",
                "/contracts"
        );

        auditLogService.log(actorUserId, "UPDATE_BOOKING_STATUS", "ServiceBooking", saved.getId().toString(),
                "Status: " + currentStatus + " -> " + upperTarget + (reason != null ? ", Reason: " + reason : ""), null);

        return toDto(saved);
    }

    public Map<String, Object> toDto(ServiceBooking b) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", b.getId());
        dto.put("customerUserId", b.getCustomerUserId());
        dto.put("providerUserId", b.getProviderUserId());
        dto.put("title", b.getTitle());
        dto.put("description", b.getDescription());
        dto.put("serviceAddress", b.getServiceAddress());
        dto.put("scheduledAt", b.getScheduledAt());
        dto.put("estimatedHours", b.getEstimatedHours());
        dto.put("hourlyRate", b.getHourlyRate());
        dto.put("totalAmount", b.getTotalAmount());
        dto.put("currency", b.getCurrency());
        dto.put("status", b.getStatus());
        dto.put("cancellationReason", b.getCancellationReason());
        dto.put("completedAt", b.getCompletedAt());
        dto.put("createdAt", b.getCreatedAt());

        userRepository.findById(b.getCustomerUserId()).ifPresent(u -> {
            dto.put("customerName", u.getFullName());
            dto.put("customerPhone", u.getPhoneNumber());
        });

        userRepository.findById(b.getProviderUserId()).ifPresent(u -> {
            dto.put("providerName", u.getFullName());
            dto.put("providerPhone", u.getPhoneNumber());
        });

        if (b.getServiceCategory() != null) {
            dto.put("categoryName", b.getServiceCategory().getName());
        }

        if (b.getLocation() != null) {
            dto.put("locationName", b.getLocation().getName());
        }

        return dto;
    }
}
