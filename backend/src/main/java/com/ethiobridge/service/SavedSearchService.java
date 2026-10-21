package com.ethiobridge.service;

import com.ethiobridge.entity.SavedSearch;
import com.ethiobridge.repository.SavedSearchRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SavedSearchService {

    private final SavedSearchRepository savedSearchRepository;
    private final NotificationService notificationService;

    public SavedSearchService(SavedSearchRepository savedSearchRepository, NotificationService notificationService) {
        this.savedSearchRepository = savedSearchRepository;
        this.notificationService = notificationService;
    }

    public SavedSearch createSavedSearch(UUID userId, SavedSearch search) {
        search.setUserId(userId);
        SavedSearch saved = savedSearchRepository.save(search);

        notificationService.sendNotification(
                userId,
                "Saved Search Alert Active",
                "You will receive notifications whenever new listings match \"" + search.getTitle() + "\".",
                "SYSTEM",
                "/browse"
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<SavedSearch> getUserSavedSearches(UUID userId) {
        return savedSearchRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void deleteSavedSearch(UUID userId, UUID searchId) {
        SavedSearch s = savedSearchRepository.findById(searchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved search not found"));
        if (!s.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        savedSearchRepository.delete(s);
    }
}
