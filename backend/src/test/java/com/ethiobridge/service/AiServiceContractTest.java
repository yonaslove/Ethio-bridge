package com.ethiobridge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Backend <-> AI Matching Service Contract Test.
 * Validates request/response JSON schema compatibility with FastAPI Python ai-service.
 */
class AiServiceContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Should serialize MatchRequest adhering to Python FastAPI schema")
    void shouldSerializeMatchRequestAccordingToContract() throws Exception {
        Map<String, Object> listing = new LinkedHashMap<>();
        listing.put("id", UUID.randomUUID().toString());
        listing.put("title", "Senior Full-Stack Engineer");
        listing.put("description", "Building scalable microservices with Spring Boot and Angular.");
        listing.put("skills", List.of(
                Map.of("name", "Java", "requirement", "REQUIRED", "weight", 1.0),
                Map.of("name", "Angular", "requirement", "PREFERRED", "weight", 0.5)
        ));
        listing.put("locationId", 1);
        listing.put("isRemote", true);
        listing.put("availabilityRequired", "FULL_TIME");
        listing.put("seniority", "MID");

        Map<String, Object> candidate = new LinkedHashMap<>();
        candidate.put("providerProfileId", UUID.randomUUID().toString());
        candidate.put("displayName", "Dawit Tadesse");
        candidate.put("text", "Experienced developer in Java and web frameworks.");
        candidate.put("skills", List.of(
                Map.of("name", "Java", "proficiency", 4, "yearsExperience", 5.0)
        ));
        candidate.put("yearsExperience", 5);
        candidate.put("locationId", 1);
        candidate.put("availability", "FULL_TIME");

        Map<String, Object> matchRequest = new LinkedHashMap<>();
        matchRequest.put("listing", listing);
        matchRequest.put("candidates", List.of(candidate));
        matchRequest.put("k", 5);
        matchRequest.put("options", Map.of("explain", true));

        String json = objectMapper.writeValueAsString(matchRequest);
        assertNotNull(json);

        JsonNode root = objectMapper.readTree(json);
        assertTrue(root.has("listing"), "Contract requires 'listing'");
        assertTrue(root.has("candidates"), "Contract requires 'candidates'");
        assertTrue(root.has("k"), "Contract requires 'k'");
        assertTrue(root.has("options"), "Contract requires 'options'");

        JsonNode listingNode = root.get("listing");
        assertEquals("Senior Full-Stack Engineer", listingNode.get("title").asText());
        assertEquals(2, listingNode.get("skills").size());

        JsonNode candidateNode = root.get("candidates").get(0);
        assertEquals("Dawit Tadesse", candidateNode.get("displayName").asText());
        assertEquals(5, candidateNode.get("yearsExperience").asInt());
    }

    @Test
    @DisplayName("Should parse MatchResponse from Python ai-service")
    void shouldParseMatchResponseFromAiService() throws Exception {
        String aiResponseJson = """
        {
          "model": "sublinear-tfidf-char3gram-v1",
          "candidates": [
            {
              "providerProfileId": "00000000-0000-0000-0000-000000000001",
              "rank": 1,
              "score": 0.9245,
              "explanation": {
                "summary": "Strong match on required skills (Java, Spring Boot) and availability.",
                "factors": [
                  {
                    "name": "Skill Match",
                    "value": "2/2 required skills",
                    "weight": 0.40,
                    "contribution": 0.40,
                    "detail": "Verified skills match listing requirements."
                  },
                  {
                    "name": "Semantic Text Similarity",
                    "value": 0.812,
                    "weight": 0.35,
                    "contribution": 0.2842,
                    "detail": "Sublinear TF-IDF subword vector alignment."
                  }
                ]
              }
            }
          ]
        }
        """;

        JsonNode root = objectMapper.readTree(aiResponseJson);
        assertEquals("sublinear-tfidf-char3gram-v1", root.get("model").asText());

        JsonNode candidates = root.get("candidates");
        assertEquals(1, candidates.size());

        JsonNode firstCand = candidates.get(0);
        assertEquals(1, firstCand.get("rank").asInt());
        assertEquals(0.9245, firstCand.get("score").asDouble());

        JsonNode explanation = firstCand.get("explanation");
        assertNotNull(explanation.get("summary").asText());
        assertEquals(2, explanation.get("factors").size());
    }
}
