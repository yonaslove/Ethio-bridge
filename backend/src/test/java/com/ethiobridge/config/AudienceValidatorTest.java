package com.ethiobridge.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AudienceValidatorTest {

    private final AudienceValidator validator = new AudienceValidator("ethiobridge-backend");

    private Jwt jwtWithAudience(List<String> audience) {
        return new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(300),
                Map.of("alg", "RS256"),
                Map.of("aud", audience)
        );
    }

    @Test
    void acceptsTokenWithExpectedAudience() {
        OAuth2TokenValidatorResult result = validator.validate(jwtWithAudience(List.of("ethiobridge-backend")));

        assertTrue(result.hasErrors() == false);
    }

    @Test
    void rejectsTokenWithOnlyAccountAudience() {
        OAuth2TokenValidatorResult result = validator.validate(jwtWithAudience(List.of("account")));

        assertTrue(result.hasErrors());
    }

    @Test
    void rejectsTokenWithWrongAudience() {
        OAuth2TokenValidatorResult result = validator.validate(jwtWithAudience(List.of("some-other-client")));

        assertTrue(result.hasErrors());
    }

    @Test
    void acceptsExpectedAudienceAmongOthers() {
        OAuth2TokenValidatorResult result = validator.validate(
                jwtWithAudience(List.of("account", "ethiobridge-backend")));

        assertFalse(result.hasErrors());
    }
}
