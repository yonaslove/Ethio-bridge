# Roadmap

Phased plan. Each phase lists concrete deliverables.

## Phase 1 — Requirements and scope
- Confirm MVP and scope with supervisor.
- Freeze research question and evaluation plan ([evaluation.md](evaluation.md)).
- Define roles and workflows ([product-spec.md](product-spec.md)).
- Prepare synthetic/consented evaluation data.
**Deliverable:** approved scope, user stories, evaluation plan.

## Phase 2 — Design
- Data model ([data-model.md](data-model.md)), ER diagram.
- REST API contract ([api-contract.md](api-contract.md)).
- AI service contract ([ai-contract.md](ai-contract.md)).
- Keycloak realm/clients/roles design ([identity.md](identity.md)).
- Screen inventory ([product-spec.md](product-spec.md) §3).
- Flyway strategy; Eureka boundaries ([decisions.md](decisions.md) D2).
**Deliverable:** this `docs/` set, signed off.

## Phase 3 — Foundation and local environment
- Repo layout, Dockerfiles, `docker-compose.yml`, `.env.example`.
- Angular, Spring Boot, FastAPI, PostgreSQL, Keycloak, Eureka running locally.
- Spring Security resource server validating Keycloak JWTs (iss/exp/aud/roles).
- `V1__baseline_schema.sql`; verify clean DB startup.
- Health checks, OpenAPI, initial tests.
**Deliverable:** reproducible local stack, working login, initial migration.

## Phase 4 — Core marketplace
- Provider/seeker profiles, skills.
- Listings CRUD + publish/close for all three types.
- Browse, filter, keyword search.
- Application workflow with validated transitions.
**Deliverable:** end-to-end marketplace without AI.

## Phase 5 — Baseline search and dataset
- Freeze keyword rules.
- Create requests, candidate pools, and graded labels ([evaluation.md](evaluation.md)).
- Double-label 30 % subset; compute κ.
- Record baseline Precision@5 / nDCG@5 / latency.
**Deliverable:** frozen dataset + baseline results.

## Phase 6 — AI matching
- FastAPI: analyze/listing, analyze/profile, match, explanations.
- Backend integration with timeout + keyword fallback.
- Candidate view renders factor explanations.
**Deliverable:** explainable ranked recommendations.

## Phase 7 — Testing and quality
- Auth tests (expired/missing/invalid/role/audience).
- Flyway from clean DB; Docker Compose from clean checkout.
- AI failure/fallback test.
- Input validation, consistent errors, logs free of secrets.
**Deliverable:** test evidence, release checklist.

## Phase 8 — Research evaluation
- Run both methods on the frozen dataset.
- Compute metrics with CIs and significance tests.
- Report per-category and overall; include a failure case.
**Deliverable:** reproducible results, charts, methodology, discussion.

## Phase 9 — Final presentation
- One demo scenario per category; show baseline vs AI vs explanation.
- Present measured results only.
- README, architecture docs, limitations, future work.
- Rehearse; prepare backup recording/screenshots.
**Deliverable:** final app, report, presentation, demo.

## Priority rules
- **Must-have:** auth + authorization, core workflows, Postgres/Flyway, keyword baseline, AI
  ranking, explanations, evaluation.
- **Should-have:** reviews, CV text extraction, saved searches, notifications.
- **Future:** advanced Amharic NLP, payments, mobile, fraud detection, AI agents, Kubernetes.
