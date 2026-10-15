# Architecture

## 1. Components

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Angular + TypeScript | UI, forms, listings, search, recommendations |
| Identity | Keycloak | Login, users, roles, OIDC/OAuth2 tokens |
| Backend | Java + Spring Boot | REST APIs, business logic, authorization, keyword search |
| Service discovery | Spring Cloud Netflix Eureka | Registry for the Spring backend |
| Database | PostgreSQL | Marketplace and application data |
| Migrations | Flyway | Versioned schema changes |
| AI service | Python + FastAPI | Requirement extraction, semantic matching, ranking, explanations |
| Orchestration | Docker Compose | Local, reproducible stack |
| API docs | OpenAPI / Swagger | Inspect the REST APIs |

## 2. Deployment view

```text
                         +-----------------------------+
        Users            | Angular SPA (browser)       |
   SEEKER / PROVIDER     | OIDC client (PKCE)          |
        ADMIN            +--------------+--------------+
                                      |  (1) login redirect
                                      v
                         +-----------------------------+
                         | Keycloak                    |
                         | realm: ethiobridge          |
                         | roles: SEEKER PROVIDER ADMIN|
                         +--------------+--------------+
                                      |  (2) access token (JWT)
                                      v
                         +-----------------------------+
   (3) REST call with    | Spring Boot Backend         |
       Bearer token  --->| /api/v1  (resource server)  |
                         | validates iss/exp/aud/roles |
                         +------+-----------+----------+
                                |           |
                 (4) JDBC       |           | (5) HTTP POST /ai/v1/match
                                v           v
                    +---------------+   +---------------------------+
                    | PostgreSQL    |   | FastAPI AI service        |
                    | (Flyway)      |   | stateless, no DB access   |
                    +---------------+   +---------------------------+
                                ^
                                | (6) register/heartbeat
                         +------+------+
                         | Eureka      |
                         | registry    |
                         +-------------+
```

## 3. AI matching data flow (resolved)

The AI service is **stateless and does not access the database**. On each matching request:

1. Spring Boot receives `GET /api/v1/listings/{id}/candidates?method=ai&k=5`.
2. Spring Boot builds a candidate pool from PostgreSQL (keyword/preset prefilter, capped at a
   documented pool size, e.g. 100).
3. Spring Boot POSTs the listing plus the candidate profiles to `POST /ai/v1/match`.
4. FastAPI analyzes the listing and profiles, scores and ranks candidates, and returns ranked
   results with per-factor explanations.
5. Spring Boot persists the run and results (`match_run`, `match_result`) and returns them.

Rationale: keeps the AI service stateless and independently testable, avoids duplicating the
schema in Python, and keeps the AI-service contract the single reproducibility boundary. See
[decisions.md](decisions.md) D1.

## 4. Service discovery (resolved)

- Eureka runs as its own Spring Boot application and the marketplace backend registers with it.
- The FastAPI service is **not** registered with Eureka; Spring reaches it via the stable Docker
  Compose DNS name `ai-service:8000`.
- This satisfies the required stack while avoiding re-implementing discovery for a non-Spring
  service. The overhead is documented and justified in the report. See [decisions.md](decisions.md) D2.

## 5. Embeddings and caching (resolved)

- Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (multilingual, small, CPU-friendly).
- Embeddings are computed per request and cached in-process (LRU keyed by text hash).
- No vector database at MVP scale. Scaling note: move to `pgvector` on the application database and
  persist embeddings keyed by profile version once the candidate pool no longer fits memory. See
  [decisions.md](decisions.md) D3.

## 6. Configuration and secrets

- All services read configuration from environment variables.
- `.env.example` contains placeholders only; `.env` is git-ignored.
- CORS: the backend allows the Angular origin only (`APP_CORS_ALLOWED_ORIGINS`).
- The AI service container is **internal-only** (not published to the host in production compose).

## 7. Non-goals (MVP)

Payments/escrow, mobile apps, advanced Amharic NLP, fraud detection, AI agents, Kubernetes, and
splitting the backend into microservices.

## 8. Ports

| Service | Host port | Container port |
| --- | --- | --- |
| Frontend | 4200 | 80 |
| Backend | 8080 | 8080 |
| AI service | 8000 | 8000 |
| Keycloak | 8180 | 8080 |
| Eureka | 8761 | 8761 |
| PostgreSQL | 5432 | 5432 |
