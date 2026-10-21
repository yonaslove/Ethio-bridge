# EthioBridge (ኢትዮ-ብሪጅ)

An AI-powered unified employment, freelancing, and local-service marketplace for Ethiopia.

The core research contribution is a single, **explainable semantic matching** method that connects seeker requirements with provider profiles across all three pillars (Formal Employment, Freelance Gigs, and Local Services), evaluated against a standard **keyword baseline** on identical frozen data (120 queries, 3,600 pairs, graded 0–3 relevance).

---

## Visual Design & Color Palette

EthioBridge incorporates the curated **Dahlia** palette:
- **`#F2F1EF`** (Clean Alabaster / Background Canvas) — soft off-white providing readability and breathing room.
- **`#B1A6A4`** (Warm Taupe / Elegant Borders & Meta) — natural framing for cards and dividers.
- **`#697184`** (Slate Steel Blue / Secondary Structural Elements) — refined secondary typography, badges, and tabs.
- **`#D8CFD0`** (Misty Rose / Card Accents & Soft Surfaces) — subtle interactive backgrounds and hover states.
- **`#413F3D`** (Deep Charcoal Espresso / High-Contrast Typography) — accessible, crisp dark text.
- **`#1CB8CD`** (Vibrant Jewel Cyan / Primary Action & AI Highlights) — high-energy accent for CTAs, semantic match scores, and explainability bars.

---

## Architectural Overview

```text
                                  ┌────────────────────────┐
                                  │   Angular 18 Frontend   │ (Port 4200)
                                  │   (Dahlia Color Theme)  │
                                  └───────────┬────────────┘
                                              │ REST / JWT
                                              ▼
┌────────────────────────┐        ┌────────────────────────┐        ┌────────────────────────┐
│  Eureka Service Reg.   │◄───────┤  Spring Boot 3.3 API   ├───────►│  PostgreSQL 16 DB      │
│  (Port 8761)           │        │  (Port 8080)           │        │  (Port 5432)           │
└────────────────────────┘        └───────────┬────────────┘        └────────────────────────┘
                                              │ Internal REST / Token
                                              ▼
┌────────────────────────┐        ┌────────────────────────┐
│  Keycloak 25 Identity  │        │  FastAPI AI Matcher    │
│  (Port 8180)           │        │  (Port 8000)           │
└────────────────────────┘        └────────────────────────┘
```

### Components

1. **`frontend/`** — Angular 18 standalone components, reactive signals, responsive layout, persona switcher, explainable matching radar/factor comparisons, application tracker, and research benchmark viewer.
2. **`backend/`** — Spring Boot 3.3.4 (Java 21) REST API, Spring Security OAuth2 Resource Server, Flyway migration engine (13 relational tables), fallback circuit breaker, Eureka Client.
3. **`ai-service/`** — Python 3.11 + FastAPI microservice implementing sublinear TF-IDF character & word n-gram cosine matching, multi-factor scoring (skill match, availability, location, experience, budget, semantic relevance), explainability generator, and the 120-query evaluation engine.
4. **`eureka-server/`** — Spring Cloud Netflix Eureka service registry.
5. **`infra/keycloak/`** — Pre-configured realm export (`ethiobridge-realm.json`) with PKCE frontend client, backend resource server client, and test personas.

---

## Documentation Index

| Document | Purpose |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Components, data flow, resolved design decisions |
| [docs/data-model.md](docs/data-model.md) | Relational schema, tables, columns, Flyway conventions |
| [docs/api-contract.md](docs/api-contract.md) | REST API contract between Angular and Spring Boot |
| [docs/ai-contract.md](docs/ai-contract.md) | REST API contract between Spring Boot and FastAPI AI service |
| [docs/identity.md](docs/identity.md) | Keycloak realm, clients, roles, scopes, token validation |
| [docs/product-spec.md](docs/product-spec.md) | Roles, user stories, acceptance criteria, screen inventory |
| [docs/evaluation.md](docs/evaluation.md) | Dataset, graded-relevance rubric, metrics, significance testing |
| [docs/roadmap.md](docs/roadmap.md) | Phased implementation plan |
| [docs/decisions.md](docs/decisions.md) | Locked design decisions (ADR-style) |
| [docs/setup.md](docs/setup.md) | Local setup and troubleshooting |
| [docs/testing.md](docs/testing.md) | Test strategy and verification |
| [docs/reference-data.md](docs/reference-data.md) | Skills, categories, and Ethiopian location seeds |

---

## Quick Start (Docker Compose)

All container images have been built and verified:
- `ethiobridge-ai-service:latest`
- `ethiobridge-eureka-server:latest`
- `ethiobridge-backend:latest`
- `ethiobridge-frontend:latest`

### 1. Configure Environment

Copy the example environment file:
```powershell
Copy-Item .env.example .env
# or on Linux / macOS:
# cp .env.example .env
```

### 2. Free Conflicting Ports (If running other containers)

If other local containers are occupying default ports (e.g. 5432, 8080, 8180, 8761, 4200):
```powershell
.\scripts\free-ports.ps1
```

### 3. Start Services

```powershell
.\scripts\start-all.ps1
# or:
docker compose up -d --build
```

### 3. Service Access Endpoints

| Service | Host URL | Description |
| --- | --- | --- |
| **Angular Web App** | [http://localhost:4200](http://localhost:4200) | Marketplace UI, Persona Switcher, AI Comparison |
| **Spring Boot API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Core Marketplace REST API |
| **Swagger UI** | [http://localhost:8080/api/v1/swagger-ui.html](http://localhost:8080/api/v1/swagger-ui.html) | Interactive OpenAPI documentation |
| **FastAPI AI Service** | [http://localhost:8000/ai/v1](http://localhost:8000/ai/v1) | Matching & Explanation Engine |
| **AI Evaluation Benchmark** | [http://localhost:8000/ai/v1/evaluation](http://localhost:8000/ai/v1/evaluation) | 120-query statistical evaluation suite |
| **Keycloak Realm Console** | [http://localhost:8180](http://localhost:8180) | Identity & Access Management |
| **Eureka Registry** | [http://localhost:8761](http://localhost:8761) | Service discovery dashboard |

---

## Test Personas & Credentials

The pre-seeded Keycloak realm and database include ready-to-test accounts. Password for all test accounts is `password123`.

| Username | Roles | Display Name | Pre-seeded Activity |
| --- | --- | --- | --- |
| `seeker1` | `SEEKER` | Sara Bekele | Tech Lead hiring Junior Backend Engineers & Web Designers |
| `provider1` | `PROVIDER` | Dawit Tadesse | Senior Backend Engineer (Java, Spring Boot, PostgreSQL) |
| `provider2` | `PROVIDER` | Bethlehem Haile | Full-Stack Developer (Angular, TypeScript, Python) |
| `dualuser` | `SEEKER`, `PROVIDER` | Abebe Kebede | Entrepreneur & Certified Electrician in Addis Ababa |
| `admin` | `ADMIN` | Administrator | Moderation, Skill Taxonomy, Platform Operations |

> **Tip:** The frontend includes an interactive **Persona Switcher** in the top navigation bar, allowing immediate testing of different roles without needing manual login redirects.

---

## Research Evaluation Suite

To replicate and verify the graduation project thesis findings:

```bash
docker run --rm ethiobridge-ai-service python -m app.evaluation.run_evaluation
```
Or open the **Research Benchmark** tab in the Angular web application ([http://localhost:4200/evaluation](http://localhost:4200/evaluation)).

Key Metrics:
- **Precision@5 (P@5)** across Employment, Freelancing, and Local Services.
- **nDCG@5** (Normalized Discounted Cumulative Gain) on graded relevance (0–3).
- **Latency**: p50 $\le 2$ ms, p95 $\le 5$ ms (well below the 1,500 ms SLA).
- **Paired Bootstrap 95% Confidence Intervals** and paired statistical hypothesis testing.

---

## Production Readiness & Security Architecture

EthioBridge incorporates comprehensive enterprise-grade hardening:

### 1. Security & Identity
- **Persistent Role Storage**: Persistent `app_user_role` table (Flyway V8) replacing email prefix heuristics.
- **Server-Side Session Revocation**: `POST /api/v1/auth/logout` explicitly invalidates tokens from memory / cache.
- **Rate Limiting**: Sliding-window limiter on login attempts (max 5 failed attempts per 15-minute window per IP / email).
- **Password Policy**: Strict enforcement (minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit).
- **Sanitized Inputs & Whitelists**:
  - Whitelisted sort fields on listing & provider pagination to prevent SQL/HQL injection.
  - Page size capped at 100 items.
  - `@Valid` Bean Validation on all mutations (`applyToListing`, `createReview`, `register`, `topupConnects`, etc.).
  - Global exception handler masking internal errors and returning structured RFC 7807 problem details.
  - Safe file upload controller (`/api/v1/files/upload`) with strict MIME validation (JPEG, PNG, WEBP, PDF), 5MB size limit, and path traversal protection.
  - Spring Boot Actuator secured to `ROLE_ADMIN` (with `/actuator/health` open for container healthchecks).

### 2. AI Microservice & Payments Integrity
- **Internal Microservice Token**: AI service endpoints (e.g., feedback ingestion) secured via `X-Internal-Token`.
- **Fairness Benchmark Disclaimers**: Synthetic fairness metrics explicitly marked as illustrative benchmarks.
- **Simulated Gateway Safeguards**: All wallet top-ups, milestone escrows, and payouts explicitly labeled as `[SIMULATED - SANDBOX]` pending live bank API licenses.

### 3. Frontend UX & Interactivity
- **Toast Notification System**: Modern, accessible notification toasts replacing browser `alert()` and `prompt()`, styled in Dahlia brand colors.
- **Auth Interceptors**: Automatic Bearer token attachment, seamless auto-logout on `401 Unauthorized`, and error toasts on `403 Forbidden` / `429 Too Many Requests`.
- **SEO & Crawler Optimization**:
  - Open Graph & Twitter card metadata on `index.html`.
  - Schema.org `EmploymentAgency` JSON-LD structured data.
  - Public `robots.txt` and `sitemap.xml`.

### 4. Continuous Integration (CI/CD)
- GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:
  - **Backend**: Maven test & package with JDK 21.
  - **AI Service**: Python 3.11 linting & pytest test suite.
  - **Frontend**: Angular 18 production compilation & budget checks.
  - **Infrastructure**: Docker Compose syntax and configuration verification.
