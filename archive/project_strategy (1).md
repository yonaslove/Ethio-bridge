# Project Strategy and Success Plan

## AI-Powered Integrated Employment, Freelancing, and Local Service Marketplace for Ethiopia

## 1. Executive Recommendation

Do not try to impress evaluators by adding the largest number of
features. Deliver a real problem solution, a clear research
contribution, a reliable end-to-end product, measurable evidence, and
honest limitations.

**Recommended positioning:** Build a usable marketplace across
employment, freelancing, and local services, then evaluate whether
unified, explainable AI matching produces more relevant recommendations
than keyword search.

## 2. Highest-Impact Priorities

1.  A focused problem and clear user journeys.
2.  A working end-to-end demo for all three categories.
3.  A fair keyword-search baseline.
4.  An AI matching method with explanations and measurable evaluation.
5.  Professional engineering: Keycloak identity, Flyway migrations,
    tests, Docker setup, API documentation, and reproducible results.

## 3. MVP Scope

### Must-have

-   Employment, freelancing, and local services.
-   Keycloak login and role-based access.
-   Provider profiles and seeker/client requests.
-   Job, project, and service listings.
-   Keyword search and relevant filters.
-   AI semantic matching and ranked recommendations.
-   Explanations based on actual matching factors.
-   Application/response workflow.
-   Evaluation against keyword search.

### Add only if stable

-   Reviews, CV text extraction, saved searches, notifications.
-   Amharic-language matching only if it can be implemented and
    evaluated adequately.

### Future work

-   Payments, mobile applications, advanced fraud detection, AI agents,
    Kubernetes, and extensive microservices.

## 4. Research Contribution

Do not claim that the marketplace idea itself is new or that competitors
lack AI unless verified.

A defensible contribution is:

> Design and evaluate a unified, explainable matching approach that
> connects seeker requirements with provider profiles across employment,
> freelancing, and local services, and compare it with keyword-based
> search.

Research question:

> Does semantic AI-based matching improve the relevance of top-ranked
> provider recommendations compared with keyword-based search across the
> three marketplace categories?

## 5. Recommended Architecture

-   Angular: frontend.
-   Keycloak: identity, login, roles, and OIDC/OAuth 2.0 token issuance.
-   Spring Boot: marketplace REST API and business logic; validates
    Keycloak JWTs.
-   PostgreSQL: application data.
-   Flyway: version-controlled database schema migrations.
-   Eureka: service registry for Spring services where discovery is
    needed.
-   Python/FastAPI: AI requirement analysis, semantic matching, ranking,
    explanations.
-   Docker Compose: local orchestration.

**Practical warning:** Eureka may be unnecessary with only one Spring
Boot backend. If the university or project requirements specify it,
include and demonstrate it, but avoid creating unnecessary microservices
just to justify the registry. Keep FastAPI on a stable internal URL
unless Eureka registration is explicitly implemented and tested.

## 6. AI Features

Focus on four: 1. Requirement extraction. 2. Provider profile/skill
extraction. 3. Semantic matching and ranking. 4. Explainable
recommendations.

The explanation must reflect real algorithm factors, not be generated as
an unsupported claim. A relevance score is not automatically a
probability of success.

## 7. Evaluation

-   Build a labeled dataset with examples from all three categories.
-   Compare keyword search and AI matching on identical test requests
    and profiles.
-   Select metrics in advance: Precision@K, Recall@K when labels permit,
    and nDCG@K for graded relevance.
-   Report per-category and overall results.
-   Include failure cases, dataset limitations, and methodology.
-   Do not claim AI is superior unless actual results support it.

## 8. Professional Quality

-   Keycloak token validation and endpoint authorization tests.
-   Flyway migration tested from an empty database.
-   Eureka registration/discovery verified if included.
-   Docker Compose startup documented and repeatable.
-   Input validation, consistent errors, health checks, and useful logs.
-   AI-service timeout and keyword fallback.
-   `.env.example` contains placeholders only; secrets stay out of Git.
-   API documentation and automated tests for important workflows.

## 9. Risks

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Scope growth                        Freeze MVP and maintain a
                                      future-work list

  Weak evaluation data                Create a documented, human-reviewed
                                      test set

  AI not outperforming baseline       Report results honestly and analyze
                                      failures

  Identity integration complexity     Configure Keycloak early and test
                                      roles/token validation

  Migration errors                    Use sequential Flyway scripts and
                                      test clean startup

  Eureka overhead                     Keep the architecture modular;
                                      avoid unnecessary microservices

  Privacy risks                       Minimize personal data and use
                                      synthetic/consented test data

  Fragile demo                        Seed data and rehearse a local,
                                      repeatable demo
  -----------------------------------------------------------------------

## 10. Definition of Done

-   Three categories work end to end.
-   Keycloak authentication and API authorization work.
-   PostgreSQL schema is managed by Flyway.
-   Eureka discovery works for the services configured to use it.
-   Keyword baseline and AI matching can be compared.
-   Recommendations include accurate explanations.
-   Results are reproducible.
-   Another developer can run the project from documented instructions.
-   Limitations and failure cases are in the report.
