# Design Decisions (ADR log)

Short, dated, reversible records of decisions that shape the build. Change a decision by adding a
new entry, not by editing history.

## D1 — AI service is stateless; backend supplies candidates
**Decision:** FastAPI does not access PostgreSQL. Spring Boot sends the listing and a pre-filtered
candidate pool in `POST /ai/v1/match`.
**Why:** keeps the AI service independently testable, avoids duplicating the schema in Python, and
makes the AI-service contract the single reproducibility boundary for evaluation.
**Trade-off:** larger request payloads and a pre-filter cap (default 100 candidates).

## D2 — Eureka registers the Spring backend only
**Decision:** run a Eureka server; register the marketplace backend. FastAPI is reached by its
stable Docker Compose service name `ai-service:8000`.
**Why:** the required stack includes Eureka, but re-implementing discovery for a non-Spring service
adds complexity for no functional gain. The overhead is documented and justified in the report.
**Trade-off:** Eureka is not load-bearing for the demo; acknowledged as such.

## D3 — Embeddings in-process, no vector DB at MVP scale
**Decision:** compute embeddings on demand with an in-process LRU cache; do not add a vector store.
**Why:** the candidate pool is small and bounded; a vector DB is unjustified complexity now.
**Scaling path:** move to `pgvector` on the application database, persisting embeddings keyed by
profile version. Documented so the design does not look naive.

## D4 — Unified listing model
**Decision:** one `listing` table with `listing_type` (`JOB`, `FREELANCE_PROJECT`,
`LOCAL_SERVICE_REQUEST`) rather than three parallel tables.
**Why:** the research contribution is a *unified* matching method across categories; a unified model
makes that literal and reduces duplicated logic.

## D5 — JWT audience validation is required
**Decision:** the backend validates `aud = ethiobridge-backend`, not just issuer/signature/expiry.
**Why:** without an audience check, tokens minted for another client could be replayed. A Keycloak
audience mapper adds the claim (see [identity.md](identity.md) §4).

## D6 — Keyword fallback on AI failure
**Decision:** AI matching has a 1500 ms timeout and falls back to keyword ranking, returning
`degraded: true`.
**Why:** the demo must not break if the AI service is slow or down; the baseline is always
available.

## D7 — English-first, Amharic limited
**Decision:** use a multilingual embedding model but evaluate primarily in English; treat robust
Amharic matching as future work unless it can be evaluated adequately.
**Why:** evaluating Amharic properly needs labelled Amharic data the team may not have; claiming it
without evaluation would undermine the honest-results stance.
