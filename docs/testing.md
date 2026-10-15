# Testing Strategy

## 1. Goals

- Prove the core workflows work end to end.
- Prove authorization is enforced, not just present.
- Prove the keyword baseline and AI matching are reproducible.
- Keep the AI failure path safe (fallback to keyword).

## 2. Test levels

| Level | Scope | Tools |
| --- | --- | --- |
| Unit | Services, scoring, validation, mappers | JUnit + Mockito, pytest |
| Integration | Repositories, Flyway, REST + security | Spring Boot Test + Testcontainers (PostgreSQL), FastAPI TestClient |
| Contract | Backend ↔ AI service schema | JSON schema validation on both sides |
| Frontend | Components, guards, services | Angular TestBed / Karma (or Jest) |
| End-to-end | Login → create → match → apply | Playwright (should-have) |
| Evaluation | Metrics script reproducibility | pytest / scripted run on frozen dataset |

## 3. Backend test catalog (minimum)

- **Auth**
  - Valid token with correct role → `200`.
  - Missing token → `401`.
  - Expired token → `401`.
  - Tampered signature → `401`.
  - Valid token, wrong/missing `aud` → `401`.
  - Valid token, insufficient role → `403`.
- **Ownership**
  - Non-owner `PUT`/`DELETE` on a listing → `403`, unchanged.
  - Non-owner reading another user's applications → `403`.
- **Listings**
  - Create (all three types) → `201`, status `DRAFT`.
  - Publish → `OPEN`; close → `CLOSED`.
  - Invalid budget (`min > max`) → `400`.
- **Applications**
  - Apply → `201`, `SUBMITTED`.
  - Duplicate apply → `409`.
  - Invalid transition → `422`.
  - Withdraw own → `WITHDRAWN`.
- **Migrations**
  - Clean DB initializes to current schema.
- **Flyway + seed** from empty succeeds with no manual steps.

## 4. AI service test catalog

- `/health` returns model-loaded status.
- `/analyze/listing` extracts required skills and constraints.
- `/analyze/profile` extracts skills and years.
- `/match` ranks a known relevant profile above a known irrelevant one.
- `/match` explanations contain only factors the algorithm uses and sum-consistent weights.
- Model not ready → `503 MODEL_NOT_READY`.
- Determinism: same input → same ranking (fixed model version, fixed seed).

## 5. Contract tests

- Backend `POST /ai/v1/match` request validates against [ai-contract.md](ai-contract.md) schema.
- AI response validates against the same schema.
- Backend endpoints match [api-contract.md](api-contract.md) (OpenAPI diff check).

## 6. Frontend tests

- Route guards redirect unauthenticated users.
- Role-based UI hides/shows correctly.
- Candidate view renders explanation factors from the API.
- Loading/empty/error states.

## 7. Fallback test

- Stop `ai-service`; request `method=ai`; expect keyword ranking with `degraded: true` and HTTP `200`.

## 8. Evaluation reproducibility

- Evaluation script reads the frozen dataset (hash-checked), runs both methods, and writes metrics.
- A second run on the same commit produces identical numbers.

## 9. Coverage targets

- Backend service + security logic: meaningful coverage on happy path and authorization.
- AI scoring + explanation logic: unit coverage.
- No merge if a previously passing test fails.

## 10. CI (planned)

On push/PR: build backend + run tests, build ai-service + pytest, build frontend + tests, run Flyway
on a Testcontainers Postgres. Fail the pipeline on any red.
