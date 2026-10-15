# Product Specification

## 1. Roles

| Role | Can |
| --- | --- |
| `SEEKER` | Create/publish listings (job, freelance project, local-service request); view ranked candidates; review, shortlist, offer, accept/reject applications |
| `PROVIDER` | Maintain provider profile and skills; browse listings; view AI-ranked listings; apply; track application status; withdraw |
| `ADMIN` | Manage users (suspend), manage skills/categories/locations |
| anonymous | Landing page and login only |

## 2. User stories and acceptance criteria

Format: Given / When / Then. Every story below is testable.

### Authentication

**US-A1 — Sign in**
Given an existing user, When they click Sign in and authenticate at Keycloak, Then they return to
the app with a valid session and see the dashboard for their roles.

**US-A2 — Role-based navigation**
Given a user with only `PROVIDER`, When they view navigation, Then seeker-only actions (create
listing) are not shown and are rejected by the API if called directly.

**US-A3 — First-login provisioning**
Given a valid token with no prior `app_user` row, When they call `GET /me`, Then the backend creates
the `app_user` row keyed by `sub` and returns the identity.

### Provider profile

**US-P1 — Maintain profile**
Given a logged-in provider, When they submit headline, bio, years, location, availability, and rate,
Then the profile is saved and visible on the provider detail page.

**US-P2 — Manage skills**
Given a provider, When they add/replace skills with proficiency and years, Then the profile text
used for matching is regenerated and reflected in future match runs.

### Seekers and listings

**US-S1 — Create a listing**
Given a logged-in seeker, When they submit a listing of any of the three types with title,
description, category, and skills, Then it is created in `DRAFT` status.

**US-S2 — Publish a listing**
Given a `DRAFT` listing owned by the seeker, When they publish it, Then status becomes `OPEN` and it
appears in browse/search.

**US-S3 — Ownership enforcement**
Given listing A owned by user X, When user Y (a different valid user) calls `PUT /listings/{A}`,
Then the API returns `403` and no data changes.

**US-S4 — Browse and filter**
Given an `OPEN` listing set, When a user filters by type, category, location, or keyword, Then only
matching `OPEN` listings are returned, paginated.

### Matching and recommendations

**US-M1 — Keyword candidates**
Given an `OPEN` listing with skills, When the owner requests `method=keyword&k=5`, Then the top 5
providers by documented keyword rules are returned.

**US-M2 — AI candidates with explanations**
Given the same listing, When the owner requests `method=ai&k=5`, Then providers are returned ranked
by the AI service, each with an explanation whose factors name matched skills, availability,
location, and semantic relevance.

**US-M3 — Graceful degradation**
Given the AI service is down or times out, When the owner requests `method=ai`, Then the response
falls back to keyword ranking and sets `degraded: true` instead of failing.

**US-M4 — Provider-side recommendations**
Given a provider with a complete profile, When they open Recommended listings, Then `OPEN` listings
are ranked for them using the same matching method.

### Applications

**US-AP1 — Apply**
Given a provider and an `OPEN` listing, When they apply with an optional note and rate, Then an
application is created with status `SUBMITTED` and appears in the owner's list.

**US-AP2 — No duplicate applications**
Given a provider already applied to a listing, When they apply again, Then the API returns `409`.

**US-AP3 — Status workflow**
Given an application, When the owner moves it `SHORTLISTED → OFFERED → ACCEPTED`, Then each
transition is validated and the provider sees the new status. Invalid transitions return `422`.

**US-AP4 — Withdraw**
Given a provider's own application not yet `ACCEPTED`, When they withdraw, Then status becomes
`WITHDRAWN`.

### Admin

**US-AD1 — Suspend user**
Given an `ADMIN`, When they suspend a user, Then that user's `app_user.status` becomes `SUSPENDED`
and their authenticated requests return `403`.

**US-AD2 — Manage taxonomy**
Given an `ADMIN`, When they create or deprecate a skill, Then it appears/disappears in the skill
typeahead and cannot be selected on new listings once deprecated.

## 3. Screen inventory

| # | Screen | Access | Primary API |
| --- | --- | --- | --- |
| S1 | Landing / problem intro | public | — |
| S2 | Login redirect handler | public | Keycloak |
| S3 | Dashboard | authenticated | `GET /me` |
| S4 | Provider profile edit | PROVIDER | `GET/PUT /me/provider-profile`, skills |
| S5 | Seeker profile edit | SEEKER | `GET/PUT /me/seeker-profile` |
| S6 | Browse / search listings | authenticated | `GET /listings` |
| S7 | Listing detail | authenticated | `GET /listings/{id}` |
| S8 | Create/edit listing wizard | SEEKER | `POST/PUT /listings` |
| S9 | Candidates / recommendations view | SEEKER (owner) | `GET /listings/{id}/candidates` |
| S10 | Applications received | SEEKER (owner) | `GET /listings/{id}/applications`, `PATCH` status |
| S11 | Recommended listings | PROVIDER | `GET /me/recommended-listings` |
| S12 | My applications | PROVIDER | `GET /me/applications`, withdraw |
| S13 | Provider public profile | authenticated | `GET /providers/{id}` |
| S14 | Admin console | ADMIN | `GET /admin/users`, taxonomy |

## 4. Navigation

- Top nav adapts to roles: Browse, My listings (SEEKER), My profile (PROVIDER), Recommended
  (PROVIDER), My applications (PROVIDER), Admin (ADMIN), Logout.
- Deep links to listings and provider profiles are shareable.

## 5. Non-functional requirements

- All list screens paginate; all forms validate client- and server-side with accessible errors.
- Loading, empty, and error states on every data screen.
- Explanations on S9/S11 must render the factor list from the API, not front-end guesses.
- Target p95 latency for `method=ai&k=5` under 2 s on the demo dataset.
