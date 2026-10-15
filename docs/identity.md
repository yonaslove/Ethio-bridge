# Identity and Access (Keycloak)

## 1. Realm

- Realm name: `ethiobridge`
- Realm export committed at `infra/keycloak/ethiobridge-realm.json` so a clean clone works.
- Export includes realm roles, both clients, role/audience mappers, and test users (synthetic only).

## 2. Clients

| Client ID | Type | Flow | Notes |
| --- | --- | --- | --- |
| `ethiobridge-frontend` | Public | Authorization Code + PKCE | Redirect URIs `http://localhost:4200/*`; no client secret in the browser |
| `ethiobridge-backend` | Bearer-only | — | Not used for login; only defines the token audience |

## 3. Roles

Realm roles:

- `SEEKER` — creates listings, reviews applicants.
- `PROVIDER` — maintains provider profile, applies to listings.
- `ADMIN` — moderation and taxonomy.

A user may hold both `SEEKER` and `PROVIDER`.

## 4. Token claims

Access tokens must contain:

| Claim | Source | Used for |
| --- | --- | --- |
| `iss` | realm | issuer validation |
| `exp` / `iat` | Keycloak | expiry validation |
| `sub` | Keycloak | mapping to `app_user.keycloak_subject` |
| `aud` | audience mapper | **required** audience validation |
| `realm_access.roles` | Keycloak | role-based authorization |
| `email` | Keycloak | first-login user provisioning |

### Audience mapper (required)

Add a hardcoded audience mapper on `ethiobridge-frontend` that injects `ethiobridge-backend` into
`aud`. Without this, backend `aud` validation fails.

## 5. Spring Boot resource server

- `spring.security.oauth2.resourceserver.jwt.issuer-uri` → realm URL.
- Audience validator enabled and set to `ethiobridge-backend`.
- Method security maps realm roles to authorities with prefix `ROLE_` (`ROLE_SEEKER`, etc.).
- CORS: allow only `APP_CORS_ALLOWED_ORIGINS` (the Angular origin).

Validation performed on every request: **issuer, signature, expiry, audience, and role**.

## 6. Angular client

- Uses an OIDC library with Authorization Code Flow + PKCE.
- Stores tokens in memory (or session storage); never in `localStorage` for long-lived tokens and
  never a client secret in source.
- Attaches the access token as `Authorization: Bearer` to backend calls.
- Handles silent renew and logout.

## 7. User provisioning

On first authenticated request, the backend upserts an `app_user` row keyed by `sub`, copying
`email` and `full_name`. Roles stay in Keycloak and are never persisted as the source of truth.

## 8. Required tests

- Expired token → `401`.
- Missing token on protected route → `401`.
- Valid token without required role → `403`.
- Valid token with wrong/missing audience → `401`.
- Valid token with correct role → `200`.
- Tampered signature → `401`.

## 9. No passwords in the marketplace

Keycloak owns credentials. The application database stores no passwords and implements no
separate password system.
