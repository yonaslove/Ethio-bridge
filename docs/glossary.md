# Glossary

Shared vocabulary for the project. Use these terms consistently in code, docs, and the report.

| Term | Meaning |
| --- | --- |
| **Listing** | A seeker's request to the marketplace. One of three types: job, freelance project, or local-service request. Stored in one `listing` table. |
| **Listing type** | `JOB`, `FREELANCE_PROJECT`, `LOCAL_SERVICE_REQUEST`. |
| **Provider** | A user offering skills/services (`PROVIDER` role). Has a `provider_profile`. |
| **Seeker** | A user posting listings and hiring (`SEEKER` role). Has a `seeker_profile`. |
| **Admin** | Moderator (`ADMIN` role); manages users and taxonomy. |
| **Provider profile** | The unified profile matched across all three categories (skills, experience, location, availability, rate). |
| **Skill** | Normalized capability (`skill`), attached to profiles (`provider_skill`) and listings (`listing_skill`). |
| **Application** | A provider's response to a listing, with a status workflow. |
| **Match run** | One execution of a matching method (keyword or AI) for a listing; persisted with method, k, model, latency. |
| **Match result** | A ranked provider produced by a match run, with score and explanation. |
| **Explanation** | The list of factors (with weights and contributions) that produced a match score. |
| **Factor** | A single scoring input, e.g. `skill.match`, `availability`, `location`, `budget`, `semantic.relevance`. |
| **Semantic similarity** | Cosine similarity between listing and profile embeddings. A ranking signal, **not** a probability. |
| **Keyword baseline** | The documented token-overlap search method used as the comparison point. |
| **Relevance grade** | Human judgment of a request–provider pair on a `0–3` scale. |
| **Precision@K** | Fraction of the top K recommendations that are relevant (`grade ≥ 1`). |
| **Recall@K** | Fraction of all known relevant providers found in the top K. |
| **nDCG@K** | Normalized discounted cumulative gain; ranking quality using graded relevance. |
| **Cohen's κ** | Inter-annotator agreement for the double-labelled subset. |
| **Deferred/fallback** | When AI matching fails, the backend returns keyword ranking with `degraded: true`. |
| **Realm** | Keycloak namespace `ethiobridge` containing clients, roles, and users. |
| **Audience (`aud`)** | Token claim naming the intended API (`ethiobridge-backend`); validated by the backend. |
| **Subject (`sub`)** | Stable Keycloak user id; mapped to `app_user.keycloak_subject`. |
