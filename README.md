# EthioBridge

An AI-powered integrated employment, freelancing, and local-service marketplace for Ethiopia.

The research contribution is a single, **explainable semantic matching** method that connects
seeker requirements with provider profiles across all three categories, evaluated against a
**keyword baseline** on identical data.

This repository is being built as a graduation project. The documents in `docs/` are the
buildable specification. The original planning files are archived under `archive/` and are
superseded by `docs/`.

## Documentation index

| Document | Purpose |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Components, data flow, resolved design decisions |
| [docs/data-model.md](docs/data-model.md) | ER diagram, tables, columns, Flyway conventions |
| [docs/api-contract.md](docs/api-contract.md) | REST API between Angular and Spring Boot |
| [docs/ai-contract.md](docs/ai-contract.md) | REST API between Spring Boot and the FastAPI AI service |
| [docs/identity.md](docs/identity.md) | Keycloak realm, clients, roles, scopes, token validation |
| [docs/product-spec.md](docs/product-spec.md) | Roles, user stories with acceptance criteria, screen inventory |
| [docs/evaluation.md](docs/evaluation.md) | Dataset, graded-relevance rubric, metrics, significance testing |
| [docs/roadmap.md](docs/roadmap.md) | Phased implementation plan |
| [docs/decisions.md](docs/decisions.md) | Locked design decisions (ADR-style) |
| [docs/setup.md](docs/setup.md) | Local setup and troubleshooting |
| [docs/testing.md](docs/testing.md) | Test strategy and catalog |
| [docs/security.md](docs/security.md) | Security and privacy controls |
| [docs/deployment.md](docs/deployment.md) | Build, deploy, and operations |
| [docs/reference-data.md](docs/reference-data.md) | Reference and seed data |
| [docs/demo.md](docs/demo.md) | Demo script, slides, and rehearsal checklist |
| [docs/glossary.md](docs/glossary.md) | Domain vocabulary |

Root files: [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), [CHANGELOG.md](CHANGELOG.md).

## Repository layout

```text
ethiobridge/
├── frontend/          # Angular application
├── backend/           # Spring Boot marketplace API + Flyway migrations
├── ai-service/        # Python + FastAPI matching service
├── eureka-server/     # Spring Cloud Netflix Eureka registry
├── infra/keycloak/    # Committed realm export and config
├── docs/              # Buildable specification (this index)
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Roles

- `SEEKER` — posts listings (jobs, projects, service requests) and reviews applicants.
- `PROVIDER` — offers skills/services and applies to listings.
- `ADMIN` — moderation and taxonomy management.

A user may hold both `SEEKER` and `PROVIDER`.

## Prerequisites

```text
Node.js 20+, JDK 21, Maven (wrapper included in backend), Python 3.11+,
Docker Desktop with Docker Compose v2, Git.
```

## Quick start (Docker Compose)

```bash
cp .env.example .env        # fill in local-only values
docker compose up --build
```

Local URLs (default ports):

| Service | URL |
| --- | --- |
| Angular frontend | http://localhost:4200 |
| Spring Boot API | http://localhost:8080/api/v1 |
| FastAPI AI service | http://localhost:8000/ai/v1 |
| Keycloak | http://localhost:8180 |
| Eureka dashboard | http://localhost:8761 |
| PostgreSQL | localhost:5432 |

## Status

Planning and specification complete enough to begin implementation. No application code yet.
See [docs/roadmap.md](docs/roadmap.md) for the phase plan.

## Safety

- `.env` is ignored. Commit only `.env.example` with placeholders.
- Never commit passwords, tokens, or private keys.
- Keycloak owns authentication; Spring Boot still enforces API authorization.
- Use synthetic or consented data only.
