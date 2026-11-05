# EthioBridge Security Policy

EthioBridge is a unified national digital labor and services marketplace in Ethiopia. We take security, personal data protection, and financial integrity seriously. This policy outlines our security architecture, vulnerability reporting process, and disclosure guidelines.

---

## 1. Reporting Security Vulnerabilities

If you discover a security vulnerability in EthioBridge (backend microservices, frontend SPA, AI matching engine, payment rail integration, or document KYC inspection), please report it responsibly:

- **Security Desk Email:** security@ethiobridge.et
- **Response SLA:** Within 24 hours of report receipt
- **Initial Triage:** Within 48 hours with status confirmation and severity assessment
- **Remediation SLA:**
  - Critical / P0 (Auth bypass, KYC leakage, financial double-spend): < 24 hours
  - High / P1 (Data leakage, privilege escalation, HMAC validation): < 72 hours
  - Medium / P2: Within regular release cycle (< 14 days)

Please include:
1. Vulnerability description and impacted components (`backend`, `ai-service`, `frontend`, `infra`).
2. Exact steps to reproduce (or proof-of-concept payload / cURL).
3. Any potential data exposure or impact assessment.

Do **NOT** publicly disclose the issue until the EthioBridge engineering team has addressed and deployed the remediation.

---

## 2. Core Security Architecture & Safeguards

### A. Authentication & Session Management
- **Keycloak OIDC & JWT:** Keycloak owns federated identities, OIDC tokens, and standard PKCE flows.
- **Stateless Tokens with Refresh Rotation:** Dual-rail session tokens (`eb-...`) are hashed in memory with short TTLs and backed by cryptographically random 7-day refresh tokens.
- **Account Protection:** Exponential backoff lockout after 5 consecutive failed login attempts.

### B. Financial Integrity & Escrow Security
- **Strict Gateway Verification:** Payment transactions (`/api/v1/payments/chapa/verify/{txRef}`) are exclusively verified against the genuine upstream gateway API (`api.chapa.co/v1/transaction/verify/`). No simulation bypasses or unverified prefixes exist in production code.
- **Cryptographic Webhook Signatures:** All webhook callbacks must pass HMAC-SHA256 signature verification matching `CHAPA_WEBHOOK_SECRET` with constant-time byte comparisons (`MessageDigest.isEqual`).
- **Idempotency Guarantees:** Every webhook delivery records an idempotency key (`PaymentWebhookLog`) preventing double-crediting or duplicate milestone holds.
- **Immutable Escrow Ledger:** Funds deposited into escrow are held as `DEPOSIT_HOLD` entries and can only be released upon explicit seeker approval (`RELEASE_PAYOUT`) or administrative dispute resolution (`REFUND_SEEKER`).

### C. KYC & Biometric Document Isolation
- **No Public Document Access:** Identity documents (`/api/v1/files/**`) require authentication and strict ownership verification. Only the document owner or an authenticated `ROLE_ADMIN` can download or inspect files.
- **HMAC Signed URLs:** Temporary external document links use timed HMAC-SHA256 signatures (`/api/v1/files/signed/{filename}?expires=...&sig=...`) expiring in 15 minutes.
- **Magic Bytes Validation:** Uploaded files must match binary headers for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF...WEBP`), or PDF (`%PDF-`), rejecting disguised scripts or executables.
- **Persistent Volume:** Uploaded documents are mounted to dedicated Docker volumes (`uploads_data`) ensuring zero data loss across container lifecycles.

### D. Network Isolation & Service Hardening
- **Internal AI Service:** The FastAPI `ai-service` is deployed on an internal container network (`expose: 8000`), inaccessible directly from the public internet. All AI requests require internal token authentication (`X-Internal-Token`).
- **Defense-in-Depth HTTP Headers:**
  - `Content-Security-Policy: default-src 'self' ...`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- **Distributed Request Tracing:** All HTTP requests are tagged with a unique `X-Request-Id` propagated to SLF4J MDC logs and response headers.

---

## 3. Compliance & Ethiopian Legal Standards

EthioBridge complies with:
- **Ethiopian Data Protection Proclamation (MInT):** Right to erasure (`DELETE /api/v1/auth/account`), consent recording, and data minimization.
- **National Bank of Ethiopia (NBE) Financial Guidelines:** Segregation of client funds in escrow holds and auditable ledger journals.
- **FAT-ML Fairness Standards:** Empirical 80% four-fifths disparate impact monitoring across Ethiopian regional clusters and gender proxies.
