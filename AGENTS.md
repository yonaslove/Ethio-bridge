# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this project is

EthioBridge — an employment + freelancing + local-services marketplace with an explainable AI
matching service and a keyword baseline, built for a graduation project.

## Source of truth

Read `docs/` before changing anything. It is the buildable spec:

- [docs/architecture.md](docs/architecture.md) — components and data flow
- [docs/data-model.md](docs/data-model.md) — schema and migrations
- [docs/api-contract.md](docs/api-contract.md) — frontend ↔ backend
- [docs/ai-contract.md](docs/ai-contract.md) — backend ↔ AI service
- [docs/identity.md](docs/identity.md) — Keycloak and token validation
- [docs/product-spec.md](docs/product-spec.md) — stories, acceptance criteria, screens
- [docs/evaluation.md](docs/evaluation.md) — dataset, metrics, significance
- [docs/decisions.md](docs/decisions.md) — locked decisions (do not silently reverse)
- [docs/testing.md](docs/testing.md), [docs/security.md](docs/security.md),
  [docs/setup.md](docs/setup.md), [docs/deployment.md](docs/deployment.md),
  [docs/glossary.md](docs/glossary.md)

## Commands

```bash
# whole stack
docker compose up --build

# backend
cd backend && ./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
cd backend && ./mvnw test

# ai service
cd ai-service && uvicorn app.main:app --reload --port 8000
cd ai-service && pytest

# frontend
cd frontend && ng serve
cd frontend && npm test
```

## Hard rules

- Do not add a database dependency to the AI service; it is stateless (D1).
- Do not persist passwords; Keycloak owns identity.
- Validate JWT audience, not just issuer/expiry (D5).
- Keep keyword fallback when AI fails (D6).
- Do not present similarity scores as probabilities.
- Never commit `.env`, secrets, or tokens. `.env.example` holds placeholders only.
- Keep behavior in sync with `docs/`; update docs when contracts change.

## Conventions

- Java: `com.ethiobridge`, constructor injection, service-layer authorization.
- Angular: typed models, OIDC via interceptor, render explanations from API data.
- Python: Pydantic models matching the AI contract, deterministic output.
- Commit style: `<area>: <imperative subject>`.

## Before finishing a task

- Run the tests for the area you touched.
- Confirm contracts still match `docs/`.
- Report any doc that now contradicts the code.
