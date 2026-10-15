# Security and Privacy

## 1. Assets to protect

- User identities and credentials (owned by Keycloak, not the app).
- Provider/seeker profile data, CV text, and contact details.
- Access tokens.
- Application data integrity (listings, applications, statuses).

## 2. Threats and controls

| Threat | Control |
| --- | --- |
| IDOR / broken object-level authorization | Ownership checked in the service layer for every read/mutate of a user resource; return `403`, not silent filtering |
| Token replay / wrong-audience token | Validate issuer, signature, expiry, **audience**, and roles ([identity.md](identity.md)) |
| Role escalation | Roles only from Keycloak claims; never trust client-supplied roles |
| XSS | Angular escapes by default; never `innerHTML` untrusted content; strict CSP where feasible |
| SQL injection | Parameterized queries (JPA/JDBC); no string-concatenated SQL |
| Secret leakage | `.env` git-ignored; `.env.example` placeholders only; no secrets in frontend source or logs |
| Prompt/text injection into matching | Explanations are computed from factors, never free-form LLM text; treat user text as data |
| PII exposure in CV/contact | Restrict to authorized users; minimize fields; document retention |
| Oversharing in errors | Consistent error format; no stack traces or internal details to clients |
| Dependency vulnerabilities | Pin versions; run dependency scanning in CI |

## 3. Authorization matrix

| Resource | SEEKER | PROVIDER | ADMIN | anonymous |
| --- | --- | --- | --- | --- |
| Create/publish own listing | ✓ | | ✓ | |
| Update/close/delete own listing | ✓ | | ✓ | |
| View `OPEN` listings | ✓ | ✓ | ✓ | |
| View own applications received | ✓ | | ✓ | |
| View others' applications | | | ✓ | |
| Apply to listing | | ✓ | | |
| Update/withdraw own application | | ✓ | | |
| Edit own profiles | ✓ | ✓ | | |
| Manage taxonomy/users | | | ✓ | |
| View provider public profile | ✓ | ✓ | ✓ | |

Rule: authorization is enforced server-side regardless of what the UI shows.

## 4. Token handling

- Angular attaches the token as `Authorization: Bearer`.
- Prefer in-memory/short-lived storage; avoid long-lived `localStorage` tokens.
- Silent renew and clean logout.
- Backend never logs tokens.

## 5. Data protection

- Collect the minimum required; mark synthetic data clearly.
- Restrict CV/contact fields to authorized viewers.
- Document retention and removal.
- Backups exclude secrets.

## 6. Logging rules

- Never log tokens, passwords, private keys, or full CV text.
- Log identifiers, not sensitive payloads.
- Correlate requests with a request ID.

## 7. Privacy and fairness

- Do not use sensitive ranking features without a justified, approved need.
- Do not claim fairness unless it is defined and evaluated.
- Follow supervisor/university requirements for any user study.
- Similarity scores are rankings, not probabilities of success.

## 8. Release security gate

- All auth tests pass (see [testing.md](testing.md) §3).
- No known critical authorization or data-loss issue remains.
- Secrets absent from source control and logs.
