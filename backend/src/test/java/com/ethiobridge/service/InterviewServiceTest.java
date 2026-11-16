package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Interview;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.InterviewRepository;
import com.ethiobridge.repository.ListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private InterviewService interviewService;

    private AppUser employer;
    private AppUser candidate;

    @BeforeEach
    void setUp() {
        employer = new AppUser();
        employer.setId(UUID.randomUUID());
        employer.setEmail("employer@tech.et");
        employer.setFullName("Tech Lead Ethiopia");

        candidate = new AppUser();
        candidate.setId(UUID.randomUUID());
        candidate.setEmail("candidate@gmail.com");
        candidate.setFullName("Bekele Candidate");
    }

    @Test
    @DisplayName("Should schedule an interview invitation with notifications delivered")
    void testScheduleInterviewSuccess() {
        when(userRepository.findById(employer.getId())).thenReturn(Optional.of(employer));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> {
            Interview inv = i.getArgument(0);
            inv.setId(UUID.randomUUID());
            return inv;
        });

        Map<String, Object> req = new HashMap<>();
        req.put("candidateUserId", candidate.getId().toString());
        req.put("title", "Technical Screening Call");
        req.put("scheduledAt", OffsetDateTime.now().plusDays(3).toString());
        req.put("durationMinutes", 45);
        req.put("meetingLink", "https://meet.google.com/xyz-abc-eth");
        req.put("locationNotes", "Please review system architecture principles beforehand.");

        Map<String, Object> result = interviewService.scheduleInterview(employer.getId(), req);

        assertNotNull(result);
        assertEquals("INVITED", result.get("status"));
        assertEquals(45, result.get("durationMinutes"));
        assertEquals("https://meet.google.com/xyz-abc-eth", result.get("meetingLink"));
        verify(notificationService, times(1)).sendNotification(eq(candidate.getId()), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Candidate can accept or decline scheduled interview")
    void testCandidateRespond() {
        Interview interview = new Interview(
                null,
                null,
                employer.getId(),
                candidate.getId(),
                "Technical Interview",
                OffsetDateTime.now().plusDays(2),
                45,
                "https://meet.google.com/abc"
        );
        interview.setId(UUID.randomUUID());
        interview.setStatus("SCHEDULED");

        when(interviewRepository.findById(interview.getId())).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));

        // Accept
        Map<String, Object> accepted = interviewService.updateInterviewStatus(candidate.getId(), interview.getId(), "ACCEPTED", "I will attend");
        assertEquals("ACCEPTED", accepted.get("status"));
        verify(notificationService, atLeastOnce()).sendNotification(eq(employer.getId()), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Reschedule interview updates time and notes")
    void testRescheduleInterview() {
        Interview interview = new Interview(
                null,
                null,
                employer.getId(),
                candidate.getId(),
                "Technical Interview",
                OffsetDateTime.now().plusDays(2),
                45,
                "https://meet.google.com/abc"
        );
        interview.setId(UUID.randomUUID());
        interview.setStatus("ACCEPTED");

        when(interviewRepository.findById(interview.getId())).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> rescheduled = interviewService.updateInterviewStatus(employer.getId(), interview.getId(), "RESCHEDULED", "Moved to next day");

        assertEquals("RESCHEDULED", rescheduled.get("status"));
        assertEquals("Moved to next day", rescheduled.get("locationNotes"));
    }

    @Test
    @DisplayName("Non-participant cannot respond to or update interview")
    void testUnauthorizedInterviewAccess() {
        Interview interview = new Interview(
                null,
                null,
                employer.getId(),
                candidate.getId(),
                "Technical Interview",
                OffsetDateTime.now().plusDays(2),
                45,
                "https://meet.google.com/abc"
        );
        interview.setId(UUID.randomUUID());
        interview.setStatus("SCHEDULED");

        when(interviewRepository.findById(interview.getId())).thenReturn(Optional.of(interview));

        UUID randomStranger = UUID.randomUUID();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                interviewService.updateInterviewStatus(randomStranger, interview.getId(), "ACCEPTED", null)
        );
        assertTrue(ex.getMessage().contains("Access denied to interview"));
    }

    @Test
    @DisplayName("Candidate can decline interview and employer is notified")
    void testCandidateDeclineInterview() {
        Interview interview = new Interview(
                null,
                null,
                employer.getId(),
                candidate.getId(),
                "Technical Interview",
                OffsetDateTime.now().plusDays(2),
                45,
                "https://meet.google.com/abc"
        );
        interview.setId(UUID.randomUUID());
        interview.setStatus("INVITED");

        when(interviewRepository.findById(interview.getId())).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> declined = interviewService.updateInterviewStatus(candidate.getId(), interview.getId(), "DECLINED", "Schedule conflict");
        assertEquals("DECLINED", declined.get("status"));
        assertEquals("Schedule conflict", declined.get("declineReason"));
        verify(notificationService, atLeastOnce()).sendNotification(eq(employer.getId()), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Either participant can cancel an interview")
    void testCancelInterview() {
        Interview interview = new Interview(
                null,
                null,
                employer.getId(),
                candidate.getId(),
                "Technical Interview",
                OffsetDateTime.now().plusDays(2),
                45,
                "https://meet.google.com/abc"
        );
        interview.setId(UUID.randomUUID());
        interview.setStatus("INVITED");

        when(interviewRepository.findById(interview.getId())).thenReturn(Optional.of(interview));
        when(interviewRepository.save(any(Interview.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> cancelled = interviewService.updateInterviewStatus(employer.getId(), interview.getId(), "CANCELLED", "Position filled internally");
        assertEquals("CANCELLED", cancelled.get("status"));
        verify(notificationService, atLeastOnce()).sendNotification(eq(candidate.getId()), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should prevent scheduling interview in the past or with self")
    void testInvalidInterviewScheduling() {
        Map<String, Object> selfReq = new HashMap<>();
        selfReq.put("candidateUserId", employer.getId().toString());
        selfReq.put("scheduledAt", OffsetDateTime.now().plusDays(1).toString());

        ResponseStatusException ex1 = assertThrows(ResponseStatusException.class, () ->
                interviewService.scheduleInterview(employer.getId(), selfReq)
        );
        assertTrue(ex1.getMessage().contains("themselves"));

        Map<String, Object> pastReq = new HashMap<>();
        pastReq.put("candidateUserId", candidate.getId().toString());
        pastReq.put("scheduledAt", OffsetDateTime.now().minusDays(1).toString());

        ResponseStatusException ex2 = assertThrows(ResponseStatusException.class, () ->
                interviewService.scheduleInterview(employer.getId(), pastReq)
        );
        assertTrue(ex2.getMessage().contains("future time"));
    }
}
