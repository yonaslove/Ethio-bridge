# Project Roadmap

## AI-Powered Integrated Employment, Freelancing, and Local Service Marketplace for Ethiopia

## Project Goal

Build and evaluate a marketplace connecting seekers with employees,
freelancers, and local service providers. The research contribution is a
unified, explainable matching method compared with keyword-based search.

## Phase 1 --- Requirements and Scope

-   Define seeker/client, provider, and administrator roles.
-   Define workflows for employment, freelancing, and local services.
-   Confirm MVP scope with the supervisor.
-   Define the research question and evaluation plan.
-   Prepare realistic synthetic or properly consented test data.

**Deliverables:** requirements, user stories, acceptance criteria, scope
boundaries.

## Phase 2 --- Design

-   Design Angular screens and primary user journeys.
-   Design PostgreSQL schema.
-   Define REST APIs between Angular and Spring Boot.
-   Define the AI service API.
-   Define Keycloak realm, clients, roles, and OIDC flow.
-   Define Flyway migration strategy.
-   Decide how Eureka is used and which Spring services register with
    it.
-   Draw architecture and ER diagrams.

**Deliverables:** wireframes, ER diagram, API contract, architecture
diagram, identity configuration plan.

## Phase 3 --- Foundation and Local Environment

-   Create repository and project structure.
-   Set up Angular, Spring Boot, Python/FastAPI, PostgreSQL, Keycloak,
    and Eureka.
-   Configure Docker Compose, health checks, and environment variables.
-   Configure Spring Security to validate Keycloak-issued JWTs.
-   Add initial Flyway migration and verify clean database startup.
-   Add API documentation and initial tests.

**Deliverables:** reproducible local environment, working login, health
endpoints, initial migration.

## Phase 4 --- Core Marketplace

-   Implement profile management and role-protected endpoints.
-   Implement job posts, freelance projects, and local-service requests.
-   Implement browsing, filtering, and keyword search.
-   Implement application/response status workflow.
-   Keep user identity in Keycloak and store application-specific
    profile data in PostgreSQL.

**Deliverables:** end-to-end marketplace without AI matching.

## Phase 5 --- Baseline Search

-   Implement keyword search and category-specific filters.
-   Create test requests and human-reviewed relevance labels.
-   Freeze baseline behavior before comparing AI.
-   Record initial Precision@K and other chosen metrics.

**Deliverables:** working baseline and evaluation dataset draft.

## Phase 6 --- AI Matching

-   Extract requirements from requests.
-   Extract skills and experience from provider profiles where feasible.
-   Implement semantic matching and ranking in Python/FastAPI.
-   Return explanations based on actual matching factors.
-   Integrate Spring Boot with the AI service.
-   Add timeouts, error handling, and fallback to baseline search.

**Deliverables:** AI recommendation endpoint and explainable ranked
results.

## Phase 7 --- Testing and Quality

-   Test Keycloak login, token expiry, roles, and unauthorized access.
-   Test Flyway migration from a clean database.
-   Test core Angular and Spring Boot workflows.
-   Test AI service failure and fallback behavior.
-   Test the Docker Compose setup on a clean environment.
-   Review privacy, validation, logs, and error messages.

**Deliverables:** test evidence and release checklist.

## Phase 8 --- Research Evaluation

-   Run keyword search and AI matching on identical test requests and
    profiles.
-   Measure Precision@K and Recall@K when labels permit.
-   Consider nDCG@K for graded relevance labels.
-   Report category-level and overall results.
-   Record failure cases and limitations.

**Deliverables:** reproducible results, charts/tables, methodology,
discussion.

## Phase 9 --- Final Presentation

-   Prepare one realistic demo scenario per category.
-   Show the baseline, AI results, and recommendation explanations.
-   Present actual measurements, not invented or estimated results.
-   Document installation, architecture, limitations, and future work.
-   Rehearse the demonstration and prepare screenshots as backup.

**Deliverables:** final application, report, README, presentation, demo.

## Priority Rules

**Must-have:** authentication, role-based authorization, core workflows,
PostgreSQL/Flyway, keyword baseline, AI ranking, explanations,
evaluation.

**Should-have:** reviews, CV text extraction, saved searches,
notifications.

**Future work:** advanced Amharic NLP, payments, mobile apps, fraud
detection, AI agents, Kubernetes.

**Scope warning:** Eureka can add complexity for a project with only one
Spring Boot backend. Implement it cleanly if required, but do not split
the application into unnecessary microservices merely to use it.
