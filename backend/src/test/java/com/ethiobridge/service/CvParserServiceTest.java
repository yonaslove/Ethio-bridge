package com.ethiobridge.service;

import com.ethiobridge.entity.Skill;
import com.ethiobridge.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CvParserServiceTest {

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @InjectMocks
    private CvParserService cvParserService;

    @BeforeEach
    void setUp() {
        Skill java = new Skill();
        java.setId(1L);
        java.setName("Java");
        java.setSlug("java");

        Skill angular = new Skill();
        angular.setId(2L);
        angular.setName("Angular");
        angular.setSlug("angular");

        Skill spring = new Skill();
        spring.setId(3L);
        spring.setName("Spring Boot");
        spring.setSlug("spring-boot");

        when(skillRepository.findAll()).thenReturn(List.of(java, angular, spring));
    }

    @Test
    @DisplayName("Should extract contact details, skills, and experience from plain CV text")
    void testParseText() {
        String cvText = """
                Alemayehu Kebede
                Email: alemayehu.dev@ethiobridge.et | Phone: +251911445566
                Summary:
                Full Stack Developer with 4 years of experience building web applications.
                
                Skills:
                - Java, Spring Boot, Hibernate
                - Angular, TypeScript, HTML5, CSS3
                - PostgreSQL, Docker, Git, CI/CD
                
                Education:
                BSc in Computer Science, Addis Ababa University (2018 - 2022)
                
                Experience:
                Software Engineer at FinTech Ethiopia (2022 - Present)
                """;

        Map<String, Object> result = cvParserService.parseCvText(cvText);

        assertNotNull(result);
        assertEquals("alemayehu.dev@ethiobridge.et", result.get("email"));
        assertTrue(result.get("phone").toString().contains("251"));
        assertEquals(4, result.get("yearsExperience"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> skills = (List<Map<String, Object>>) result.get("skills");
        assertNotNull(skills);
        assertTrue(skills.stream().anyMatch(s -> "Java".equals(s.get("skillName"))));
        assertTrue(skills.stream().anyMatch(s -> "Angular".equals(s.get("skillName"))));
        assertTrue(skills.stream().anyMatch(s -> "Spring Boot".equals(s.get("skillName"))));

        @SuppressWarnings("unchecked")
        List<String> education = (List<String>) result.get("education");
        assertNotNull(education);
        assertFalse(education.isEmpty());
        assertTrue(education.stream().anyMatch(e -> e.contains("BSc")));
    }

    @Test
    @DisplayName("Should handle CV text with no contacts gracefully without errors")
    void testParseEmptyTextGraceful() {
        Map<String, Object> result = cvParserService.parseCvText("Just some generic notes with no email or phone");
        assertNotNull(result);
        assertNull(result.get("email"));
        assertNull(result.get("phone"));
    }
}
