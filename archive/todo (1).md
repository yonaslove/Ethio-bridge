# Project TODO

## AI-Powered Integrated Employment, Freelancing, and Local Service Marketplace

Use `[ ]` for pending tasks and `[x]` for completed tasks. Update this
checklist to reflect actual progress.

## 1. Planning

-   [ ] Confirm MVP and project scope with supervisor.
-   [ ] Define user roles and permissions.
-   [ ] Define workflows for all three marketplace categories.
-   [ ] Confirm research question and evaluation metrics.
-   [ ] Prepare synthetic or properly consented evaluation data.

## 2. Architecture and Design

-   [ ] Draw system architecture diagram.
-   [ ] Draw PostgreSQL ER diagram.
-   [ ] Design Angular wireframes.
-   [ ] Define Spring Boot REST API contracts.
-   [ ] Define AI service request/response schema.
-   [ ] Design Keycloak realm, Angular client, and backend API
    client/resource configuration.
-   [ ] Define roles such as SEEKER, PROVIDER, and ADMIN.
-   [ ] Define Flyway migration conventions.
-   [ ] Decide and document Eureka registration/discovery boundaries.
-   [ ] Document privacy and data-handling rules.

## 3. Docker and Repository

-   [ ] Create Git repository and root README.
-   [ ] Create `.gitignore` files.
-   [ ] Create `.env.example` with placeholder values.
-   [ ] Add Dockerfiles for services.
-   [ ] Configure Docker Compose for PostgreSQL, Keycloak, Eureka,
    Spring Boot, Angular, and AI service as appropriate.
-   [ ] Add health checks and startup dependencies.
-   [ ] Verify clean startup from a fresh clone.
-   [ ] Document local URLs and ports.

## 4. Identity --- Keycloak

-   [ ] Configure Keycloak realm.
-   [ ] Configure Angular public OIDC client with Authorization Code
    Flow + PKCE.
-   [ ] Configure Spring Boot API to validate Keycloak JWTs.
-   [ ] Map realm/client roles to application authorities.
-   [ ] Protect endpoints with role-based authorization.
-   [ ] Test expired, missing, invalid, and insufficient-role tokens.
-   [ ] Ensure no Keycloak secrets are stored in frontend source.
-   [ ] Store Keycloak subject/user ID and application profile data as
    appropriate; do not store passwords in the marketplace database.

## 5. Database --- PostgreSQL and Flyway

-   [ ] Configure PostgreSQL connection.
-   [ ] Add initial Flyway migration (`V1__...sql`).
-   [ ] Create schema for application profiles and marketplace
    workflows.
-   [ ] Test migration from an empty database.
-   [ ] Add future schema changes as new migrations.
-   [ ] Document local backup/reset process.

## 6. Eureka

-   [ ] Create/configure Eureka server if it is a separate application.
-   [ ] Configure Spring Boot services to register with Eureka where
    needed.
-   [ ] Verify service registration and discovery.
-   [ ] Document why Eureka is useful for this project.
-   [ ] Keep FastAPI on a stable internal service URL unless Eureka
    registration is deliberately implemented and tested.

## 7. Spring Boot Backend

-   [ ] Create Spring Boot project.
-   [ ] Configure Spring Security OAuth2 resource server for Keycloak
    JWTs.
-   [ ] Configure Flyway and PostgreSQL.
-   [ ] Implement profile CRUD.
-   [ ] Implement job post CRUD.
-   [ ] Implement freelance project CRUD.
-   [ ] Implement local-service request/listing CRUD.
-   [ ] Implement application/response workflow.
-   [ ] Implement keyword search and filters.
-   [ ] Integrate AI service with timeout and fallback.
-   [ ] Add OpenAPI documentation.
-   [ ] Add JUnit/Mockito tests.

## 8. Angular Frontend

-   [ ] Create Angular application and routing.
-   [ ] Integrate Keycloak using an OIDC client library.
-   [ ] Implement login/logout and token handling safely.
-   [ ] Build profile and listing pages.
-   [ ] Build create/edit forms.
-   [ ] Build search and filtering UI.
-   [ ] Show AI recommendations and grounded explanations.
-   [ ] Add loading, empty, and error states.
-   [ ] Add frontend tests.

## 9. AI Service --- Python/FastAPI

-   [ ] Create virtual environment and dependency file.
-   [ ] Add FastAPI health endpoint.
-   [ ] Implement requirement extraction.
-   [ ] Implement provider profile feature extraction.
-   [ ] Implement semantic similarity and ranking.
-   [ ] Return recommendation explanations based on actual factors.
-   [ ] Add pytest tests and representative examples.
-   [ ] Add timeouts/error handling and document fallback.
-   [ ] Document model choice and limitations.

## 10. Research Evaluation

-   [ ] Implement keyword-search baseline.
-   [ ] Create and label test requests/provider pairs.
-   [ ] Freeze test set before final tuning.
-   [ ] Compare both systems on identical data.
-   [ ] Calculate Precision@K and, if suitable, Recall@K/nDCG@K.
-   [ ] Report results per category and overall.
-   [ ] Record failure cases and limitations.
-   [ ] Do not invent or overstate results.

## 11. Final Delivery

-   [ ] Test a clean Docker Compose startup.
-   [ ] Prepare demo scenarios for all three categories.
-   [ ] Prepare actual evaluation tables/figures.
-   [ ] Complete README and architecture documentation.
-   [ ] Complete graduation report and presentation.
-   [ ] Rehearse demo and prepare a backup recording/screenshots.
