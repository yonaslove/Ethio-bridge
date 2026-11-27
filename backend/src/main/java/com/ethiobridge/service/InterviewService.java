package com.ethiobridge.service;

import com.ethiobridge.entity.AppUser;
import com.ethiobridge.entity.Interview;
import com.ethiobridge.entity.Listing;
import com.ethiobridge.repository.AppUserRepository;
import com.ethiobridge.repository.InterviewRepository;
import com.ethiobridge.repository.ListingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@Transactional
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final AppUserRepository userRepository;
    private final ListingRepository listingRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public InterviewService(InterviewRepository interviewRepository,
                            AppUserRepository userRepository,
                            ListingRepository listingRepository,
                            NotificationService notificationService,
                            AuditLogService auditLogService) {
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    public Map<String, Object> scheduleInterview(UUID employerUserId, Map<String, Object> request) {
        UUID candidateUserId = UUID.fromString(request.get("candidateUserId").toString());
        if (employerUserId.equals(candidateUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employer cannot schedule an interview with themselves");
        }

        UUID applicationId = request.get("applicationId") != null ? UUID.fromString(request.get("applicationId").toString()) : null;
        UUID listingId = request.get("listingId") != null ? UUID.fromString(request.get("listingId").toString()) : null;

        String title = (String) request.getOrDefault("title", "Job Interview Discussion");
        OffsetDateTime scheduledAt = OffsetDateTime.parse(request.get("scheduledAt").toString());
        if (scheduledAt.isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview must be scheduled for a future time");
        }

        Integer duration = request.get("durationMinutes") != null ? Integer.parseInt(request.get("durationMinutes").toString()) : 45;
        if (duration <= 0 || duration > 480) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview duration must be between 5 and 480 minutes");
        }

        String meetingLink = (String) request.get("meetingLink");
        if (meetingLink == null || meetingLink.isBlank()) {
            meetingLink = "https://meet.jit.si/ethiobridge-interview-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String locationNotes = (String) request.get("locationNotes");

        Interview interview = new Interview(applicationId, listingId, employerUserId, candidateUserId, title, scheduledAt, duration, meetingLink);
        interview.setLocationNotes(locationNotes);

        Interview saved = interviewRepository.save(interview);

        auditLogService.log(employerUserId, "SCHEDULE_INTERVIEW", "Interview", saved.getId().toString(),
                "Invited candidate " + candidateUserId + " for interview at " + scheduledAt, null);

        AppUser employer = userRepository.findById(employerUserId).orElse(null);
        String employerName = employer != null ? employer.getFullName() : "An employer";

        notificationService.sendNotification(
                candidateUserId,
                "Interview Invitation: " + title,
                employerName + " invited you for an interview on " + scheduledAt.toLocalDate() + " at " + scheduledAt.toLocalTime() + ".",
                "INTERVIEW",
                "/my-applications"
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserInterviews(UUID userId) {
        return interviewRepository.findUserInterviews(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public Map<String, Object> updateInterviewStatus(UUID actorUserId, UUID interviewId, String targetStatus, String notes) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));

        boolean isCandidate = interview.getCandidateUserId().equals(actorUserId);
        boolean isEmployer = interview.getEmployerUserId().equals(actorUserId);

        if (!isCandidate && !isEmployer) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to interview");
        }

        String upper = targetStatus.toUpperCase();
        switch (upper) {
            case "ACCEPTED" -> {
                if (!isCandidate) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only candidate can accept");
                interview.setStatus("ACCEPTED");
                interview.setCandidateNotes(notes);
            }
            case "DECLINED" -> {
                if (!isCandidate) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only candidate can decline");
                interview.setStatus("DECLINED");
                interview.setDeclineReason(notes != null ? notes : "Declined by candidate");
            }
            case "RESCHEDULED" -> {
                interview.setStatus("RESCHEDULED");
                interview.setLocationNotes(notes);
            }
            case "COMPLETED" -> {
                interview.setStatus("COMPLETED");
            }
            case "CANCELLED" -> {
                interview.setStatus("CANCELLED");
                interview.setDeclineReason(notes != null ? notes : "Cancelled");
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + targetStatus);
        }

        Interview saved = interviewRepository.save(interview);

        UUID notifyRecipient = isCandidate ? interview.getEmployerUserId() : interview.getCandidateUserId();
        notificationService.sendNotification(
                notifyRecipient,
                "Interview Update: " + upper,
                "Interview \"" + interview.getTitle() + "\" has been " + upper.toLowerCase() + ".",
                "INTERVIEW",
                "/my-applications"
        );

        return toDto(saved);
    }

    public Map<String, Object> toDto(Interview i) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", i.getId());
        dto.put("applicationId", i.getApplicationId());
        dto.put("listingId", i.getListingId());
        dto.put("employerUserId", i.getEmployerUserId());
        dto.put("candidateUserId", i.getCandidateUserId());
        dto.put("title", i.getTitle());
        dto.put("scheduledAt", i.getScheduledAt());
        dto.put("durationMinutes", i.getDurationMinutes());
        dto.put("meetingLink", i.getMeetingLink());
        dto.put("locationNotes", i.getLocationNotes());
        dto.put("status", i.getStatus());
        dto.put("candidateNotes", i.getCandidateNotes());
        dto.put("declineReason", i.getDeclineReason());
        dto.put("createdAt", i.getCreatedAt());

        userRepository.findById(i.getEmployerUserId()).ifPresent(u -> dto.put("employerName", u.getFullName()));
        userRepository.findById(i.getCandidateUserId()).ifPresent(u -> dto.put("candidateName", u.getFullName()));

        if (i.getListingId() != null) {
            listingRepository.findById(i.getListingId()).ifPresent(l -> dto.put("listingTitle", l.getTitle()));
        }

        return dto;
    }
}
