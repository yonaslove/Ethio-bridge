# Quality, Risk, and Release Checklist

## 1. Product Quality

-   [ ] Employment, freelancing, and local-service workflows work end to
    end.
-   [ ] Forms validate input and show understandable errors.
-   [ ] Search has useful filters and empty-result states.
-   [ ] Recommendations show reasons based on actual algorithm factors.
-   [ ] Users cannot access records outside their permissions.
-   [ ] Interface handles loading, empty, and error states.

## 2. Identity and Security --- Keycloak

-   [ ] Angular uses an OIDC client with Authorization Code Flow + PKCE.
-   [ ] Spring Boot validates Keycloak JWT issuer, signature, expiry,
    and roles/scopes.
-   [ ] Protected endpoints have authorization tests.
-   [ ] Expired, missing, malformed, and insufficient-role tokens are
    tested.
-   [ ] No client secret is embedded in Angular.
-   [ ] No passwords are stored in the marketplace database.
-   [ ] Logs do not expose tokens, passwords, or sensitive profile/CV
    text.

## 3. Database --- PostgreSQL and Flyway

-   [ ] Schema changes are represented by versioned Flyway migrations.
-   [ ] A clean database initializes successfully.
-   [ ] Applied shared migrations are not edited; new migrations are
    added for changes.
-   [ ] Application-specific user records link to the Keycloak subject
    ID as needed.
-   [ ] Backup/reset behavior is documented.

## 4. Service Discovery --- Eureka

-   [ ] Eureka server starts successfully.
-   [ ] Spring services configured for discovery register correctly.
-   [ ] Service discovery has been tested, not just shown on a diagram.
-   [ ] Services that do not register (such as FastAPI, unless
    configured) use documented stable URLs.
-   [ ] Eureka's added complexity is justified in the project report.

## 5. Engineering Quality

-   [ ] Backend validates inputs and returns consistent errors.
-   [ ] AI service has a health endpoint, timeout, and error handling.
-   [ ] Keyword search remains available if AI matching fails.
-   [ ] Important backend and AI functions have automated tests.
-   [ ] API docs match implemented endpoints.
-   [ ] Secrets stay outside source control.
-   [ ] Docker Compose setup works from a clean checkout.

## 6. AI and Evaluation Quality

-   [ ] Test queries are frozen before final evaluation.
-   [ ] Both methods use identical data.
-   [ ] Relevance labels and dataset creation are documented.
-   [ ] Metrics and K are selected in advance.
-   [ ] Results are reported per category and overall.
-   [ ] Failure cases and limitations are included.
-   [ ] Synthetic data is labeled clearly.
-   [ ] Similarity scores are not presented as probabilities without
    calibration evidence.

## 7. Privacy and Fairness

-   [ ] Collect only necessary data.
-   [ ] Restrict CV and contact data to authorized users.
-   [ ] Document data retention/removal.
-   [ ] Avoid sensitive ranking features without a justified and
    approved need.
-   [ ] Do not claim fairness unless it is defined and evaluated.
-   [ ] Follow university/supervisor requirements for user studies.

## 8. Release Gate

-   [ ] Clean Docker Compose startup succeeds.
-   [ ] Core user journeys pass tests.
-   [ ] Keycloak authentication and authorization work.
-   [ ] Flyway migrations run from a clean database.
-   [ ] Eureka discovery works for configured services.
-   [ ] Evaluation can be reproduced.
-   [ ] No known critical authorization or data-loss issue remains.
-   [ ] Documentation, demo, and report match the actual implementation.
