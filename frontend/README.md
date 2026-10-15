# Frontend — Angular application

Implements the screens in [../docs/product-spec.md](../docs/product-spec.md) §3 and calls the
backend contract in [../docs/api-contract.md](../docs/api-contract.md).

- OIDC client with Authorization Code Flow + PKCE against Keycloak ([../docs/identity.md](../docs/identity.md)).
- No client secrets in source. Tokens attached as `Authorization: Bearer`.

Scaffold in Phase 3 ([../docs/roadmap.md](../docs/roadmap.md)).
