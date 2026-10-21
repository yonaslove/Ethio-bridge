# REST API Contract

Contract between the Angular frontend and the Spring Boot backend.

- **Base path:** `/api/v1`
- **Auth:** `Authorization: Bearer <JWT>` is required for every endpoint except:
  - `GET /api/v1/health`
  - public reads: `GET /listings`, `GET /listings/{id}`, `GET /providers`, `GET /providers/{id}`,
    `GET /providers/{id}/reviews`, `GET /skills`, `GET /categories`, `GET /locations`
  - `/api/v1/auth/**`, OpenAPI docs and `/actuator/**`
- **Content type:** `application/json`.
- **Transport:** JSON over HTTPS.

## 1. Conventions

### Pagination (list endpoints)

Request query: `?page=0&size=20&sort=createdAt,desc`

Response:

```json
{
  "data": [ /* items */ ],
  "page": 0,
  "size": 20,
  "totalElements": 123,
  "totalPages": 7
}
```

### Error format

```json
{
  "timestamp": "2026-03-01T10:15:30Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "path": "/api/v1/listings",
  "fieldErrors": [
    { "field": "title", "message": "must not be blank" }
  ]
}
```

Error codes: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `UNPROCESSABLE` (422), `AI_UNAVAILABLE` (503, service degraded).

## 1.1 Payment & Escrow Endpoints (Chapa / Telebirr)

- `GET /api/v1/payments/methods`: List active Ethiopian payment gateway rails (Chapa, Telebirr, CBE Birr).
- `POST /api/v1/payments/chapa/initialize`: Initialize hosted Chapa checkout session for escrow milestone funding or connects top-up.
  - Body: `{ "amount": 2500.00, "contractId": "...", "milestoneId": "...", "purpose": "ESCROW_MILESTONE" }`
  - Returns: `{ "status": "success", "checkoutUrl": "https://checkout.chapa.co/...", "txRef": "CHP-..." }`
- `GET /api/v1/payments/chapa/verify/{txRef}`: Verify transaction status with Chapa API, update escrow milestone to `FUNDED`.
- `POST /api/v1/monetization/connects/topup`: Initialize connects token purchase via Chapa (returns checkout link without premature crediting).
- `POST /api/v1/monetization/connects/verify/{txRef}`: Verify Chapa payment completion and credit connects balance.

### Authorization rule

A request that reads or mutates a resource the caller does not own returns `403`, never `200`
with hidden data. Ownership is checked in the service layer, not only by role.

## 2. Identity / current user

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/me` | any authenticated | Current user's identity and roles |

**200** `GET /me`

```json
{
  "userId": "b3f1...",
  "keycloakSubject": "9d2c...",
  "email": "sara@example.com",
  "fullName": "Sara Bekele",
  "roles": ["SEEKER", "PROVIDER"]
}
```

## 3. Profiles

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/me/provider-profile` | PROVIDER | Get own provider profile |
| PUT | `/me/provider-profile` | PROVIDER | Create/replace own provider profile |
| PUT | `/me/provider-profile/skills` | PROVIDER | Replace own skill set |
| GET | `/me/seeker-profile` | SEEKER | Get own seeker profile |
| PUT | `/me/seeker-profile` | SEEKER | Create/replace own seeker profile |
| GET | `/providers` | any | Browse providers (supports `q,skillId,locationId,availability,categoryFocus`) |
| GET | `/providers/{id}` | any | Provider detail |

**PUT** `/me/provider-profile`

```json
{
  "headline": "Backend developer",
  "bio": "5 years building Java services.",
  "yearsExperience": 5,
  "locationId": 12,
  "availability": "FULL_TIME",
  "hourlyRate": 800.00,
  "categoryFocus": "EMPLOYMENT"
}
```

**PUT** `/me/provider-profile/skills`

```json
{
  "skills": [
    { "skillId": 3, "proficiency": 5, "yearsExperience": 5 },
    { "skillId": 9, "proficiency": 3, "yearsExperience": 2 }
  ]
}
```

## 4. Reference data

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/skills?query=` | any | Search skills (typeahead) |
| GET | `/categories?type=` | any | Service categories |
| GET | `/locations?query=` | any | Locations (typeahead) |

## 5. Listings

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/listings` | SEEKER | Create listing |
| GET | `/listings?type=&status=&categoryId=&locationId=&q=` | any | Browse/search listings |
| GET | `/listings/my` | authenticated | Listings owned by the current user (not paged) |
| GET | `/listings/{id}` | any | Listing detail |
| PUT | `/listings/{id}` | owner | Update listing |
| POST | `/listings/{id}/publish` | owner | Move DRAFT → OPEN |
| POST | `/listings/{id}/close` | owner | Move OPEN → CLOSED |
| DELETE | `/listings/{id}` | owner | Delete DRAFT/CLOSED listing |

**POST** `/listings`

```json
{
  "listingType": "JOB",
  "title": "Junior backend developer",
  "description": "Build REST services with Java and SQL.",
  "serviceCategoryId": 4,
  "locationId": 1,
  "isRemote": false,
  "budgetMin": 15000,
  "budgetMax": 25000,
  "currency": "ETB",
  "availabilityRequired": "FULL_TIME",
  "seniority": "JUNIOR",
  "skills": [
    { "skillId": 3, "requirement": "REQUIRED", "weight": 1.0 },
    { "skillId": 7, "requirement": "PREFERRED", "weight": 0.4 }
  ]
}
```

**201** response returns the created listing with `id`, `status: "DRAFT"`, timestamps.

## 6. Matching / recommendations

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/listings/{id}/candidates?method=keyword\|ai&k=5` | owner | Ranked providers for a listing |
| GET | `/me/recommended-listings?method=ai&k=10` | PROVIDER | Listings ranked for the current provider |

**200** `GET /listings/{id}/candidates?method=ai&k=5`

```json
{
  "listingId": "c7a1...",
  "method": "AI",
  "k": 5,
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "modelVersion": "1.0.0",
  "latencyMs": 210,
  "degraded": false,
  "results": [
    {
      "rank": 1,
      "score": 0.87,
      "providerProfileId": "p-100",
      "displayName": "Dawit T.",
      "explanation": {
        "summary": "Strong on required skills and availability.",
        "factors": [
          { "name": "skill.match", "value": "Java, SQL", "weight": 0.6, "contribution": 0.52, "detail": "2 of 2 required skills matched" },
          { "name": "availability", "value": "FULL_TIME", "weight": 0.2, "contribution": 0.2, "detail": "matches required availability" },
          { "name": "semantic.relevance", "value": 0.79, "weight": 0.2, "contribution": 0.16, "detail": "profile text close to listing text" }
        ]
      }
    }
  ]
}
```

When `method=ai` and the AI service fails within its timeout, the backend falls back to keyword
ranking and sets `"degraded": true` with `"method": "KEYWORD"`.

## 7. Applications

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/listings/{id}/applications` | PROVIDER | Apply to a listing |
| GET | `/listings/{id}/applications` | owner | Applications received |
| GET | `/me/applications` | PROVIDER | Own applications |
| PATCH | `/applications/{id}/status` | owner (or applicant to withdraw) | Update status |
| DELETE | `/applications/{id}` | applicant | Withdraw |

**PATCH** `/applications/{id}/status`

```json
{ "status": "SHORTLISTED" }
```

Allowed transitions: owner: `SUBMITTED→SHORTLISTED→OFFERED→ACCEPTED/REJECTED`; applicant: `*→WITHDRAWN`.

## 8. Reviews (should-have)

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/listings/{id}/reviews` | participant | Create review for a completed listing |
| GET | `/providers/{id}/reviews` | any | Provider reviews |

## 9. Admin

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/admin/users` | ADMIN | List/suspend users |
| POST | `/admin/skills` | ADMIN | Create skill |
| DELETE | `/admin/skills/{id}` | ADMIN | Deprecate skill |

## 10. Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | none | Liveness/readiness, includes AI-service reachability |
