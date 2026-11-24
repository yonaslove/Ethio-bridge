package com.ethiobridge.service;

import com.ethiobridge.entity.Skill;
import com.ethiobridge.repository.SkillRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CvParserService {

    private static final Logger log = LoggerFactory.getLogger(CvParserService.class);

    private final SkillRepository skillRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.cv-ai.service-url:https://natural-language-processing-resume-ai.onrender.com}")
    private String cvAiServiceUrl;

    @Value("${app.cv-ai.timeout-ms:15000}")
    private int timeoutMs;

    public CvParserService(SkillRepository skillRepository, ObjectMapper objectMapper) {
        this.skillRepository = skillRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> parseCvFile(byte[] fileBytes, String filename, String jobDescription) {
        // First attempt calling the external NLP Resume AI model
        Map<String, Object> aiResult = callExternalResumeAi(fileBytes, filename, jobDescription);
        if (aiResult != null && !aiResult.isEmpty()) {
            return aiResult;
        }

        // Fallback to internal extractor if external AI model is offline or waking up
        String extractedText = extractPlainTextFromBytes(fileBytes, filename);
        return parseCvText(extractedText);
    }

    public Map<String, Object> callExternalResumeAi(byte[] fileBytes, String filename, String jobDescription) {
        if (fileBytes == null || fileBytes.length == 0) {
            return null;
        }
        try {
            String boundary = "----EthioBridgeBoundary" + UUID.randomUUID().toString().replace("-", "");
            String safeName = (filename != null && !filename.isBlank()) ? filename : "resume.pdf";
            String safeJd = (jobDescription != null && !jobDescription.isBlank()) ? jobDescription : "Software engineering, trade skills, and professional services in Ethiopia";

            byte[] header = ("--" + boundary + "\r\n" +
                    "Content-Disposition: form-data; name=\"resume\"; filename=\"" + safeName + "\"\r\n" +
                    "Content-Type: application/octet-stream\r\n\r\n").getBytes(StandardCharsets.UTF_8);

            byte[] middle = ("\r\n--" + boundary + "\r\n" +
                    "Content-Disposition: form-data; name=\"job_description\"\r\n\r\n" +
                    safeJd + "\r\n").getBytes(StandardCharsets.UTF_8);

            byte[] footer = ("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8);

            byte[] body = new byte[header.length + fileBytes.length + middle.length + footer.length];
            System.arraycopy(header, 0, body, 0, header.length);
            System.arraycopy(fileBytes, 0, body, header.length, fileBytes.length);
            System.arraycopy(middle, 0, body, header.length + fileBytes.length, middle.length);
            System.arraycopy(footer, 0, body, header.length + fileBytes.length + middle.length, footer.length);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(Math.min(timeoutMs, 10000)))
                    .build();

            String targetUrl = cvAiServiceUrl.replaceAll("/+$", "") + "/analyze";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            log.info("Dispatching CV to external NLP Resume AI scanner: {}", targetUrl);
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                Map<String, Object> respMap = objectMapper.readValue(response.body(), new TypeReference<>() {});
                return transformAiResponse(respMap, safeName);
            } else {
                log.warn("External Resume AI returned non-200 code: {} - {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.warn("External Resume AI scanner invocation encountered issue: {}. Using native NLP parsing.", e.getMessage());
        }
        return null;
    }

    private Map<String, Object> transformAiResponse(Map<String, Object> rawAi, String filename) {
        Map<String, Object> result = new HashMap<>();
        result.put("source", "NLP_RESUME_AI");
        result.put("filename", rawAi.getOrDefault("filename", filename));
        result.put("category", rawAi.get("category"));
        result.put("score", rawAi.get("score"));
        result.put("summary", rawAi.get("summary"));
        result.put("report_url", rawAi.get("report_url"));

        // Extract contact info
        Object contactObj = rawAi.get("contact");
        if (contactObj instanceof Map<?, ?> contactMap) {
            result.put("email", contactMap.get("email"));
            result.put("phone", contactMap.get("phone"));
        }

        // Years experience
        Object expObj = rawAi.get("experience");
        if (expObj instanceof Number n) {
            result.put("yearsExperience", n.intValue());
        } else if (expObj instanceof String s) {
            try {
                result.put("yearsExperience", Integer.parseInt(s.replaceAll("[^0-9]", "")));
            } catch (Exception ignored) {
                result.put("yearsExperience", 3);
            }
        } else {
            result.put("yearsExperience", 2);
        }

        // Skills matched and catalog correlation
        List<Skill> catalog = skillRepository.findAll();
        List<Map<String, Object>> detectedSkills = new ArrayList<>();
        Set<String> aiSkillTokens = new HashSet<>();

        Object skillsObj = rawAi.get("skills");
        if (skillsObj instanceof List<?> list) {
            for (Object skItem : list) {
                if (skItem != null) {
                    aiSkillTokens.add(skItem.toString().toLowerCase().trim());
                }
            }
        }

        for (Skill sk : catalog) {
            String skName = sk.getName().toLowerCase();
            if (aiSkillTokens.contains(skName) || aiSkillTokens.stream().anyMatch(t -> t.contains(skName) || skName.contains(t))) {
                detectedSkills.add(Map.of(
                        "skillId", sk.getId(),
                        "skillName", sk.getName(),
                        "skillSlug", sk.getSlug(),
                        "category", sk.getCategory() != null ? sk.getCategory().name() : "TECH"
                ));
            }
        }

        result.put("skills", detectedSkills);
        result.put("aiRawSkills", rawAi.get("skills"));
        result.put("missingSkills", rawAi.get("missing_skills"));
        return result;
    }

    public static String extractPlainTextFromBytes(byte[] bytes, String filename) {
        if (bytes == null || bytes.length == 0) return "";
        try {
            if (filename != null && (filename.endsWith(".txt") || filename.endsWith(".csv"))) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                if ((b >= 32 && b <= 126) || b == 10 || b == 13 || b == 9) {
                    sb.append((char) b);
                } else if (sb.length() > 0 && sb.charAt(sb.length() - 1) != ' ') {
                    sb.append(' ');
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public Map<String, Object> parseCvText(String rawText) {
        Map<String, Object> extracted = new HashMap<>();

        if (rawText == null || rawText.isBlank()) {
            extracted.put("skills", Collections.emptyList());
            extracted.put("phone", null);
            extracted.put("email", null);
            extracted.put("yearsExperience", 1);
            return extracted;
        }

        // 1. Email extraction
        Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
        Matcher emailMatcher = emailPattern.matcher(rawText);
        if (emailMatcher.find()) {
            extracted.put("email", emailMatcher.group());
        }

        // 2. Ethiopian Phone extraction
        Pattern phonePattern = Pattern.compile("(?:\\+251|0)?[79]\\d{8}");
        Matcher phoneMatcher = phonePattern.matcher(rawText);
        if (phoneMatcher.find()) {
            extracted.put("phone", phoneMatcher.group());
        }

        // 3. Years of experience estimation
        Pattern expPattern = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)(?:\\s+of)?\\s+experience", Pattern.CASE_INSENSITIVE);
        Matcher expMatcher = expPattern.matcher(rawText);
        if (expMatcher.find()) {
            try {
                extracted.put("yearsExperience", Integer.parseInt(expMatcher.group(1)));
            } catch (Exception ignored) {
                extracted.put("yearsExperience", 2);
            }
        } else {
            extracted.put("yearsExperience", 2);
        }

        // 4. Education extraction
        List<String> educationList = new ArrayList<>();
        Pattern eduPattern = Pattern.compile("(?i)(?:BSc|B\\.Sc|BA|B\\.A|MSc|M\\.Sc|MBA|PhD|Diploma|Bachelor|Master|Degree|University|College)[^\\n\\r]{0,100}");
        Matcher eduMatcher = eduPattern.matcher(rawText);
        while (eduMatcher.find() && educationList.size() < 5) {
            String match = eduMatcher.group().trim();
            if (match.length() > 5 && !educationList.contains(match)) {
                educationList.add(match);
            }
        }
        extracted.put("education", educationList);

        // 5. Skills detection against official Skill catalog
        List<Skill> catalog = skillRepository.findAll();
        List<Map<String, Object>> detectedSkills = new ArrayList<>();
        String lowerText = rawText.toLowerCase();

        for (Skill sk : catalog) {
            String skName = sk.getName().toLowerCase();
            // Word boundary match
            if (Pattern.compile("\\b" + Pattern.quote(skName) + "\\b").matcher(lowerText).find()) {
                detectedSkills.add(Map.of(
                        "skillId", sk.getId(),
                        "skillName", sk.getName(),
                        "skillSlug", sk.getSlug(),
                        "category", sk.getCategory() != null ? sk.getCategory().name() : "TECH"
                ));
            }
        }

        extracted.put("skills", detectedSkills);
        extracted.put("rawCharacterCount", rawText.length());

        return extracted;
    }

    public static String extractPlainTextFromStream(InputStream is, String filename) {
        try {
            byte[] bytes = is.readAllBytes();
            if (filename != null && (filename.endsWith(".txt") || filename.endsWith(".csv"))) {
                return new String(bytes, StandardCharsets.UTF_8);
            }
            // Basic ASCII & UTF-8 printable string extractor for PDF / DOCX byte buffers
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                if ((b >= 32 && b <= 126) || b == 10 || b == 13 || b == 9) {
                    sb.append((char) b);
                } else if (sb.length() > 0 && sb.charAt(sb.length() - 1) != ' ') {
                    sb.append(' ');
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
