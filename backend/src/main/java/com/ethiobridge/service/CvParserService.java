package com.ethiobridge.service;

import com.ethiobridge.entity.Skill;
import com.ethiobridge.repository.SkillRepository;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CvParserService {

    private final SkillRepository skillRepository;

    public CvParserService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
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
