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

## 6. Multi-Criteria National ID & AI Verification Engine

EthioBridge validates national identity submissions across 4 automated compliance criteria:

1. **Document Schema & Checksum Verification:**
   - `FAYDA_NATIONAL_ID`: Official National ID Program format (`FAN-XXXX-XXXX-ET`).
   - `PASSPORT`: Ethiopian passport sequence (`EP` followed by 7 digits).
   - `KEBELE_ID`: City administration / regional code schema.
   - `DRIVERS_LICENSE` & `BUSINESS_LICENSE`: Valid commercial registry format.
2. **Document Image Authenticity:**
   - Validates presence of clear high-resolution document photo/scan with readable text.
3. **Name Match & Account Consistency:**
   - Multi-token name consistency check against Keycloak/PostgreSQL registered account.
4. **Ethiopian Telecom Identity:**
   - Validates Ethio Telecom (`+251 9...`) or Safaricom Ethiopia (`+251 7...`) active mobile carrier ranges.

### AI Authenticity Scoring:
- **0–100% Trust Score** (`ai_score`), verdict badge (`RECOMMENDED_APPROVE`, `MANUAL_REVIEW_REQUIRED`, `SUSPICIOUS_ANOMALY`), and explainable multi-criteria breakdown.
- Admin review modal in Governance Console allows document inspection and one-click verified badge issuance.

Validation performed on every request: **issuer, signature, expiry, audience, and role**.

## 6. Angular client

- Uses an OIDC library with Authorization Code Flow + PKCE.
- Stores tokens in memory (or session storage); never in `localStorage` for long-lived tokens and
  never a client secret in source.
- Attaches the access token as `Authorization: Bearer` to backend calls.
- Handles silent renew and logout.

## 7. User provisioning & Role Management

- **Keycloak Mode:** On first authenticated request, the backend upserts an `app_user` row keyed by `sub`, copying `email` and `full_name`. Realm roles from `realm_access.roles` are synchronized to the user's roles.
- **Standalone / Direct Mode:** Roles are persisted in the `app_user_role` relational table (Flyway migration `V8__user_roles_and_fts.sql`), associated via `@ElementCollection` on `AppUser`. Users can be assigned `SEEKER`, `PROVIDER`, or `ADMIN`.

## 8. Standalone Authentication & Session Controls

To support seamless development, evaluation pipelines, and local environments without mandatory Keycloak redirection:
- **Endpoints:**
  - `POST /api/v1/auth/register` — Registers user with password policy check and role assignment.
  - `POST /api/v1/auth/login` — Issues direct bearer session token, tracked in `ACTIVE_SESSIONS`.
  - `POST /api/v1/auth/logout` — Server-side session invalidation removing token from `ACTIVE_SESSIONS`.
- **Password Policy:** Minimum 8 characters, requiring at least one uppercase letter, one lowercase letter, and one digit.
- **Login Rate Limiter:** Sliding-window limiter tracking failed attempts by IP and email (maximum 5 failed attempts per 15-minute window before temporary lockout).
- **Client Auto-Logout Interceptor:** Angular HTTP interceptor (`authInterceptor`) automatically clears state and redirects to login on `401 Unauthorized` responses.

## 9. Required tests

- Expired token → `401`.
- Missing token on protected route → `401`.
- Valid token without required role → `403`.
- Valid token with wrong/missing audience → `401`.
- Valid token with correct role → `200`.
- Tampered signature → `401`.
- Logout invalidation → subsequent request with token → `401`.
- Login rate limit exceeded (> 5 bad attempts) → `429 Too Many Requests`.

## 10. Credential Storage

- In **Keycloak Mode**, Keycloak owns credentials; the application database stores no passwords.
- In **Standalone Mode**, credentials are authenticated against BCrypt hashes stored in `app_user.password_hash` with rigorous salt rounds and rate limiting.
