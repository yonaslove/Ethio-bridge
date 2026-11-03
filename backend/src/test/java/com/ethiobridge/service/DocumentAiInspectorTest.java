package com.ethiobridge.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;

import static org.junit.jupiter.api.Assertions.*;

class DocumentAiInspectorTest {

    private final DocumentAiInspector inspector = new DocumentAiInspector();

    @Test
    @DisplayName("Should reject non-document horoscope/meme image with low score and NO portrait photo")
    void shouldRejectHoroscopeMemeImage() {
        String testImagePath = "C:/Users/Hp/.gemini/antigravity/brain/c96435d4-45ac-4083-86f3-64fa668087de/.user_uploaded/media_1793688994528_ac20f3dc.png";
        File file = new File(testImagePath);
        if (!file.exists()) {
            System.out.println("Test image not found, skipping specific path test.");
            return;
        }

        DocumentAiInspector.InspectionResult result = inspector.inspect(testImagePath, "FAYDA_NATIONAL_ID");

        assertNotNull(result);
        assertFalse(result.isValidDocument(), "Meme/horoscope image MUST NOT be marked as a valid document");
        assertFalse(result.hasPortraitPhoto(), "Horoscope meme does not have any portrait photograph");
        assertTrue(result.imageScore() < 60.0, "Score must be below 60% for non-document image, was: " + result.imageScore());
        assertTrue(result.detectedType().contains("NON_DOCUMENT"), "Detected type should flag non-document or missing portrait");
        assertNotNull(result.primaryFailureReason());
        System.out.println("Result: " + result);
    }
}
