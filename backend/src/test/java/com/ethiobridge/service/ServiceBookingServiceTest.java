package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.ServiceBooking;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.LocationRepository;
import com.ethiobridge.repository.ServiceBookingRepository;
import com.ethiobridge.repository.ServiceCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceBookingServiceTest {

    @Mock
    private ServiceBookingRepository bookingRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private ServiceCategoryRepository categoryRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ServiceBookingService bookingService;

    private AppUser customer;
    private AppUser provider;

    @BeforeEach
    void setUp() {
        customer = new AppUser();
        customer.setId(UUID.randomUUID());
        customer.setEmail("customer@test.com");
        customer.setFullName("Abebe Customer");

        provider = new AppUser();
        provider.setId(UUID.randomUUID());
        provider.setEmail("provider@test.com");
        provider.setFullName("Chala Plumber");
    }

    @Test
    @DisplayName("Should successfully create a valid service booking")
    void testCreateBookingSuccess() {
        when(userRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(bookingRepository.save(any(ServiceBooking.class))).thenAnswer(i -> {
            ServiceBooking b = i.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        Map<String, Object> req = new HashMap<>();
        req.put("providerUserId", provider.getId().toString());
        req.put("title", "Plumbing Repair");
        req.put("description", "Pipe leakage under kitchen sink");
        req.put("scheduledAt", OffsetDateTime.now().plusDays(2).toString());
        req.put("estimatedHours", 2.0);
        req.put("hourlyRate", 250.0);
        req.put("serviceAddress", "Addis Ababa, Bole Sub-City, Kebele 03");

        Map<String, Object> result = bookingService.createBooking(customer.getId(), req);

        assertNotNull(result);
        assertEquals("PENDING", result.get("status"));
        assertEquals("Plumbing Repair", result.get("title"));
        assertEquals(0, new BigDecimal("500.00").compareTo((BigDecimal) result.get("totalAmount")));
        verify(notificationService, times(1)).sendNotification(eq(provider.getId()), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should prevent customer from booking themselves")
    void testCreateBookingSelf() {
        Map<String, Object> req = new HashMap<>();
        req.put("providerUserId", customer.getId().toString());
        req.put("title", "Self Task");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.createBooking(customer.getId(), req)
        );
        assertTrue(ex.getMessage().contains("cannot book your own service"));
    }

    @Test
    @DisplayName("Should transition status through valid lifecycle: PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED")
    void testStatusLifecycleTransitions() {
        ServiceBooking booking = new ServiceBooking(
                customer.getId(),
                provider.getId(),
                "Fix Electrical Socket",
                "Sparking outlet in living room",
                OffsetDateTime.now().plusDays(1),
                BigDecimal.valueOf(1),
                BigDecimal.valueOf(300)
        );
        booking.setId(UUID.randomUUID());
        booking.setStatus("PENDING");

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(ServiceBooking.class))).thenAnswer(i -> i.getArgument(0));

        // Provider confirms
        Map<String, Object> confirmed = bookingService.updateBookingStatus(provider.getId(), booking.getId(), "CONFIRMED", null);
        assertEquals("CONFIRMED", confirmed.get("status"));

        // Provider starts job
        Map<String, Object> inProgress = bookingService.updateBookingStatus(provider.getId(), booking.getId(), "IN_PROGRESS", null);
        assertEquals("IN_PROGRESS", inProgress.get("status"));

        // Provider completes job
        Map<String, Object> completed = bookingService.updateBookingStatus(provider.getId(), booking.getId(), "COMPLETED", null);
        assertEquals("COMPLETED", completed.get("status"));
    }

    @Test
    @DisplayName("Should forbid unauthorized users from modifying booking status")
    void testUnauthorizedStatusModification() {
        ServiceBooking booking = new ServiceBooking(
                customer.getId(),
                provider.getId(),
                "House Painting",
                "Paint 2 rooms",
                OffsetDateTime.now().plusDays(3),
                BigDecimal.valueOf(5),
                BigDecimal.valueOf(200)
        );
        booking.setId(UUID.randomUUID());
        booking.setStatus("PENDING");

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        UUID randomStrangerId = UUID.randomUUID();

        ResponseStatusException secEx = assertThrows(ResponseStatusException.class, () ->
                bookingService.updateBookingStatus(randomStrangerId, booking.getId(), "CONFIRMED", null)
        );
        assertTrue(secEx.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Should prevent booking with missing address or past date")
    void testInvalidAddressOrDateRejection() {
        Map<String, Object> reqNoAddress = new HashMap<>();
        reqNoAddress.put("providerUserId", provider.getId().toString());
        reqNoAddress.put("title", "Plumbing");
        reqNoAddress.put("serviceAddress", "   ");

        ResponseStatusException ex1 = assertThrows(ResponseStatusException.class, () ->
                bookingService.createBooking(customer.getId(), reqNoAddress)
        );
        assertTrue(ex1.getMessage().contains("Service address is required"));

        Map<String, Object> reqPastDate = new HashMap<>();
        reqPastDate.put("providerUserId", provider.getId().toString());
        reqPastDate.put("title", "Plumbing");
        reqPastDate.put("serviceAddress", "Bole");
        reqPastDate.put("scheduledAt", OffsetDateTime.now().minusDays(1).toString());

        ResponseStatusException ex2 = assertThrows(ResponseStatusException.class, () ->
                bookingService.createBooking(customer.getId(), reqPastDate)
        );
        assertTrue(ex2.getMessage().contains("future time"));
    }

    @Test
    @DisplayName("Should prevent duplicate pending booking request for the same provider and title")
    void testDuplicatePendingBookingRejection() {
        ServiceBooking existing = new ServiceBooking(
                customer.getId(),
                provider.getId(),
                "Plumbing Repair",
                "Existing job",
                OffsetDateTime.now().plusDays(1),
                BigDecimal.valueOf(2),
                BigDecimal.valueOf(200)
        );
        existing.setStatus("PENDING");

        when(bookingRepository.findUserBookings(customer.getId())).thenReturn(List.of(existing));

        Map<String, Object> req = new HashMap<>();
        req.put("providerUserId", provider.getId().toString());
        req.put("title", "Plumbing Repair");
        req.put("serviceAddress", "Bole");
        req.put("scheduledAt", OffsetDateTime.now().plusDays(2).toString());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.createBooking(customer.getId(), req)
        );
        assertTrue(ex.getMessage().contains("already have a pending booking request"));
    }
}
