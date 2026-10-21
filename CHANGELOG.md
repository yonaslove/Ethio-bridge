# Changelog

All notable changes to this project are documented here.
Format based on Keep a Changelog; versioning follows Semantic Versioning.

## [1.0.0] - 2026-10-21

### Added
- **Core Microservices Architecture**:
  - Spring Boot 3.3.4 (Java 21) REST backend with OAuth2 resource server, Flyway relational migrations (11 schema versions).
  - FastAPI Python 3.11 microservice with explainable sublinear TF-IDF character/word n-gram cosine matching and 120-query evaluation engine.
  - Angular 18 standalone frontend themed with the Dahlia color palette (`#F2F1EF`, `#B1A6A4`, `#697184`, `#D8CFD0`, `#413F3D`, `#1CB8CD`).
  - Eureka Service Registry and Keycloak 25 OAuth2/OIDC identity management.
- **Chapa Payment Gateway & Escrow Lifecycle**:
  - Live sandbox integration with official Chapa hosted checkout API (`POST /api/v1/payments/chapa/initialize`).
  - Strict milestone escrow flow: Seeker funds milestone -> redirects to hosted Chapa checkout -> auto-verifies return (`GET /api/v1/payments/chapa/verify/{txRef}`) -> marks milestone as `FUNDED`.
  - Escrow release upon deliverable inspection with 10% platform fee retention and 90% net provider payout.
  - Connects monetization model: Provider connects purchases strictly require verified Chapa payment confirmation (`POST /api/v1/monetization/connects/verify/{txRef}`) before crediting balance.
  - Automatic email sanitization for domestic `.et` domains to satisfy Chapa email validation specs.
- **KYC & Identity Verification System**:
  - Document upload for National ID, Passport, or Business License.
  - Comprehensive Admin verification portal with multi-criteria review, document viewer, approval, and rejection workflows.
  - Verified badges surfaced across seeker listings, search results, and provider profile cards.
- **Real-Time Messaging & Chat Experience**:
  - WebSocket-powered live chat between seekers and providers with auto-scroll and instant message delivery.
  - Responsive conversation sidebar and unread badge counters.
- **Contracts & Milestone Management**:
  - Escrow milestone contracts supporting creation, Chapa funding, work submission, revision requests, and funds release.
- **Enterprise Security Hardening**:
  - Sliding-window rate limiting on login attempts (max 5 per 15 minutes).
  - Robust password policy enforcement (minimum 8 chars, uppercase, lowercase, digit).
  - Safe file upload controller with MIME type validation, file size enforcement (5MB), and directory traversal prevention.
  - Persistent user role mapping via `app_user_role` table.
  - Global RFC 7807 problem details error handling.
  - Accessible Dahlia toast notification system replacing browser dialogs.

### Fixed
- Fixed sidebar bleed on landing and login pages by applying conditional route rendering.
- Fixed chat messaging synchronization and auto-scroll to bottom on new incoming messages.
- Fixed mock connects top-up by enforcing verified Chapa checkout.
- Fixed milestone escrow direct payment trigger from contracts list and received applications.

## [0.1.0] - 2026-10-15

### Added
- Complete buildable documentation set under `docs/`:
  architecture, data model, API contract, AI service contract, identity, product spec,
  evaluation plan, decisions, roadmap, setup, testing, security, deployment, glossary, reference data.
- Repository scaffold: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docker-compose.yml`,
  `.env.example`, `.gitignore`.
