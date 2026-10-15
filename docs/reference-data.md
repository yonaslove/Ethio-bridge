# Reference and Seed Data

Reference data every environment needs, plus demo data for the graduation demo. Loaded by
`V2__seed_reference_data.sql` (reference rows) and a separate demo seed script.

## 1. Service categories

| slug | name | applicable_type |
| --- | --- | --- |
| `software-engineering` | Software Engineering | JOB |
| `it-support` | IT Support | JOB |
| `design` | Design | FREELANCE_PROJECT |
| `writing` | Writing and Translation | FREELANCE_PROJECT |
| `web-development` | Web Development | FREELANCE_PROJECT |
| `plumbing` | Plumbing | LOCAL_SERVICE_REQUEST |
| `electrical` | Electrical | LOCAL_SERVICE_REQUEST |
| `cleaning` | Cleaning | LOCAL_SERVICE_REQUEST |
| `tutoring` | Tutoring | LOCAL_SERVICE_REQUEST |

## 2. Skills (initial set)

| slug | name | category |
| --- | --- | --- |
| `java` | Java | TECH |
| `spring-boot` | Spring Boot | TECH |
| `sql` | SQL | TECH |
| `postgresql` | PostgreSQL | TECH |
| `angular` | Angular | TECH |
| `typescript` | TypeScript | TECH |
| `python` | Python | TECH |
| `figma` | Figma | TECH |
| `ui-design` | UI Design | TECH |
| `translation-amh-en` | Amharic–English Translation | LANGUAGE |
| `wiring` | Electrical Wiring | TRADES |
| `pipefitting` | Pipefitting | TRADES |
| `communication` | Communication | SOFT |

Admins extend this list. Slugs are normalized (lowercase, hyphenated) and unique.

## 3. Locations (initial set)

Seed a representative set of Ethiopian locations (region + city), e.g. Addis Ababa (Bole, Arada,
Yeka), Adama, Bahir Dar, Hawassa, Mekelle, Dire Dawa, Gondar. Include `latitude`/`longitude` for
local-service distance scoring.

## 4. Demo seed data

Created by a repeatable script (not a migration) so the demo resets cleanly:

- **Users:** 3 seekers, 20 providers, 1 admin — synthetic accounts with Keycloak users in the
  committed realm export.
- **Listings:** at least 3 per category, matching the demo scenarios in [demo.md](demo.md).
- **Profiles:** varied skills and experience; relevant profiles deliberately use **different
  wording** than the listing text to avoid evaluation leakage.
- **Labels:** demo listings are labeled for illustration; the *evaluation* dataset is separate and
  frozen ([evaluation.md](evaluation.md) §3).

## 5. Rules

- Reference data is idempotent (safe to re-run).
- Demo data is clearly marked synthetic.
- The evaluation dataset is kept separate from demo data and never tuned against.
