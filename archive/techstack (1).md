# Technology Stack

## AI-Powered Integrated Employment, Freelancing, and Local Service Marketplace for Ethiopia

## 1. Technology Overview

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                Angular + TypeScript    User interface, forms,
                                                  profiles, listings,
                                                  search, and
                                                  recommendations

  Identity and access     Keycloak                Centralized login, user
  management                                      identity, roles, OAuth
                                                  2.0 / OpenID Connect,
                                                  and token issuance

  Main backend            Java + Spring Boot      REST APIs, business
                                                  logic, marketplace
                                                  workflows, and
                                                  authorization
                                                  enforcement

  Service discovery       Spring Cloud Netflix    Service registry and
                          Eureka                  discovery for
                                                  Spring-based services
                                                  where dynamic discovery
                                                  is needed

  Database                PostgreSQL              Persistent marketplace
                                                  and application data

  Database migrations     Flyway                  Version-controlled,
                                                  repeatable database
                                                  schema changes

  AI service              Python + FastAPI        Requirement extraction,
                                                  semantic matching,
                                                  ranking, and
                                                  recommendation
                                                  explanations

  AI/NLP libraries        scikit-learn and        Baseline models, text
                          sentence-transformers   features, embeddings,
                                                  and similarity
                                                  calculations

  API documentation       OpenAPI / Swagger       Document and inspect
                                                  REST APIs

  Containers              Docker + Docker Compose Reproducible local
                                                  development and service
                                                  orchestration

  Version control         Git + GitHub (or        Source control and
                          equivalent)             collaboration

  Testing                 JUnit, Mockito, Angular Automated testing
                          testing tools, pytest   across application
                                                  layers
  -----------------------------------------------------------------------

## 2. Architecture

``` text
+-----------------------------+
| Users                       |
| Seekers / Clients / Providers|
+--------------+--------------+
               |
               v
+-----------------------------+
| Angular Frontend            |
| UI + OIDC client            |
+--------------+--------------+
               |
               | OIDC login / access token
               v
+-----------------------------+
| Keycloak                    |
| Identity, roles, JWT tokens  |
+-----------------------------+

Angular calls backend REST APIs using an access token.

               |
               v
+-----------------------------+
| Spring Boot Backend         |
| Marketplace API and rules   |
| Validates Keycloak JWT      |
+------+----------------+-----+
       |                |
       v                v
+---------------+  +-----------------------------+
| PostgreSQL    |  | Python AI Service           |
| Marketplace   |  | FastAPI                     |
| Data          |  | Requirement analysis        |
+---------------+  | Semantic matching / ranking |
                   +-----------------------------+

+-----------------------------+
| Eureka Server               |
| Registry for Spring services|
+-----------------------------+

+-----------------------------+
| Flyway                      |
| Applies versioned database  |
| migrations on backend start |
+-----------------------------+

Docker Compose can run the application components locally.
```

**Important architecture note:** Eureka is most useful when multiple
Spring services need dynamic discovery. For a small graduation project
with one Spring Boot backend, it may add complexity without immediate
benefit. Since Eureka is part of the requested stack, include it as a
service registry, but keep the marketplace backend modular and avoid
splitting it into many microservices just to use Eureka. The Python
FastAPI service can use a stable Docker Compose service name unless you
deliberately add and test Eureka registration for it.

## 3. Responsibilities and Integration

### Angular

-   Build responsive interfaces for seekers, providers, and
    administrators.
-   Use an OpenID Connect client library to sign users in through
    Keycloak.
-   Call Spring Boot APIs with the access token.
-   Show listings, search results, recommendations, and explanation
    factors.

### Keycloak

-   Manage users, authentication, roles, and login sessions.
-   Configure a realm for the application and a public client for the
    Angular SPA.
-   Use Authorization Code Flow with PKCE for the browser-based
    application.
-   Define roles such as `SEEKER`, `PROVIDER`, and `ADMIN`, as
    appropriate.
-   Spring Boot APIs must validate token issuer, signature, expiry, and
    required roles/scopes.
-   Do not store user passwords in the marketplace database or implement
    a separate password system unless there is a specific requirement.

### Spring Boot

-   Own marketplace business logic and REST APIs.
-   Validate requests and enforce authorization on protected endpoints.
-   Manage profiles, jobs, freelance projects, service requests,
    applications, and reviews.
-   Access PostgreSQL and call the AI service.
-   Validate Keycloak-issued JWT access tokens.
-   Provide keyword-search fallback if AI matching is unavailable.

### Eureka

-   Register Spring-based services and allow service discovery when
    needed.
-   Keep service names and configuration documented.
-   Do not treat Eureka as an API gateway, authentication server, or
    load balancer by itself.
-   For a single backend, document why it is included and the overhead
    it introduces.

### PostgreSQL + Flyway

-   PostgreSQL stores users' application-linked identifiers, profiles,
    listings, applications, service requests, reviews, and matching
    metadata.
-   Flyway scripts live in the backend resources migration folder,
    commonly `src/main/resources/db/migration`.
-   Use sequential migration names such as
    `V1__create_initial_schema.sql`.
-   Do not manually change an already-applied migration in a shared
    environment; create a new migration instead.
-   Do not store Keycloak passwords in PostgreSQL. Store the Keycloak
    subject/user ID and only the application-specific data required by
    the marketplace.

### Python + FastAPI AI Service

-   Analyze job, project, and local-service descriptions.
-   Extract relevant requirements and profile features.
-   Calculate semantic similarity and rank providers.
-   Return explanations based on factors the algorithm actually uses.
-   Use a stable internal service URL in Docker Compose unless Eureka
    registration is explicitly implemented and tested.

### Docker + Docker Compose

-   Run Angular, Spring Boot, PostgreSQL, Keycloak, Eureka, and the AI
    service locally.
-   Use health checks and startup dependencies where appropriate.
-   Keep secrets in environment variables or a local ignored `.env`
    file; provide `.env.example` with placeholders only.
-   Persist PostgreSQL and Keycloak data in named volumes for local
    development.

## 4. Recommended AI Scope

1.  **Requirement analysis:** extract structured matching criteria from
    a request.
2.  **Profile analysis:** extract relevant skills and experience from
    provider profiles and optional CV text.
3.  **Semantic matching and ranking:** compare requests with profiles
    and rank relevant providers.
4.  **Explainable recommendations:** explain matches using actual skill,
    experience, location, availability, or budget factors.

Implement keyword search first as the baseline. Compare it with AI
matching on the same test requests and relevance labels.

## 5. Research Evaluation

-   **Precision@K:** proportion of the top K recommendations judged
    relevant.
-   **Recall@K:** proportion of known relevant providers retrieved in
    the top K, if relevance labels are available.
-   **nDCG@K:** ranking quality where relevance labels have graded
    levels.
-   **Latency:** time taken to return results, measured consistently.
-   **Task-completion time and user feedback:** optional if a fair user
    study is feasible and approved.

Report per-category results and overall results. Do not claim AI
matching is better until actual measurements support the conclusion.

## 6. Keep the Scope Manageable

### First-version scope

-   Angular frontend
-   Keycloak login and role-based access
-   Spring Boot REST API
-   PostgreSQL with Flyway migrations
-   Eureka service registry (with a clear reason and working
    configuration)
-   Profiles and listings across all three categories
-   Keyword search baseline
-   Python AI matching service
-   Recommendation explanations
-   Docker Compose setup and automated tests

### Future work

-   Advanced Amharic NLP
-   Fraud detection
-   AI proposal generation
-   Payments and escrow
-   Mobile applications
-   AI agents
-   Kubernetes and complex production infrastructure
