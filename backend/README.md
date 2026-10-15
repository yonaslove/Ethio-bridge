# Backend — Spring Boot marketplace API

Implements the REST contract in [../docs/api-contract.md](../docs/api-contract.md) and the AI
integration in [../docs/ai-contract.md](../docs/ai-contract.md).

- Package root: `com.ethiobridge`
- Flyway migrations: `src/main/resources/db/migration` (see [../docs/data-model.md](../docs/data-model.md))
- Security: OAuth2 resource server validating Keycloak JWTs (issuer/expiry/audience/roles)

Scaffold in Phase 3 ([../docs/roadmap.md](../docs/roadmap.md)).
