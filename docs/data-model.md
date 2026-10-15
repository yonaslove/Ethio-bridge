# Data Model

PostgreSQL. Schema is version-controlled with Flyway. The single unifying concept is the
**listing** (a job, a freelance project, or a local-service request) matched against unified
**provider profiles** — this is what makes one matching method work across all three categories.

## 1. ER diagram

```text
location 1---* provider_profile
location 1---* seeker_profile
location 1---* listing (nullable)

app_user 1---1 provider_profile
app_user 1---1 seeker_profile
app_user 1---* listing (owner)
app_user 1---* application (applicant)

provider_profile *---* skill   (via provider_skill)

service_category 1---* listing
service_category 1---* service_category (parent, self-ref)

listing *---* skill            (via listing_skill)

listing 1---* application      *---1 provider_profile
listing 1---* match_run        1---* match_result  *---1 provider_profile

listing 1---* review (should-have)
```

## 2. Tables

### location
| Column | Type | Constraints |
| --- | --- | --- |
| id | BIGSERIAL | PK |
| name | TEXT | NOT NULL |
| region | TEXT | NOT NULL |
| country | TEXT | NOT NULL, default `'ET'` |
| latitude | DOUBLE PRECISION | |
| longitude | DOUBLE PRECISION | |
| | | UNIQUE(name, region) |

### app_user
Mirrors the Keycloak identity. **No passwords are stored here.**

| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK, default `gen_random_uuid()` |
| keycloak_subject | UUID | NOT NULL, UNIQUE |
| email | TEXT | NOT NULL |
| full_name | TEXT | |
| status | TEXT | NOT NULL, default `'ACTIVE'` (`ACTIVE`,`SUSPENDED`) |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| updated_at | TIMESTAMPTZ | NOT NULL, default `now()` |

Roles are **not** stored here; they live in Keycloak and arrive as token claims.

### provider_profile
| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK |
| user_id | UUID | NOT NULL, UNIQUE, FK app_user(id) |
| headline | TEXT | |
| bio | TEXT | |
| years_experience | INTEGER | CHECK (>= 0) |
| location_id | BIGINT | FK location(id) |
| availability | TEXT | (`FULL_TIME`,`PART_TIME`,`HOURLY`,`ONE_OFF`,`UNAVAILABLE`) |
| hourly_rate | NUMERIC(12,2) | CHECK (>= 0) |
| category_focus | TEXT | (`EMPLOYMENT`,`FREELANCING`,`LOCAL_SERVICE`,`ANY`) default `'ANY'` |
| profile_text | TEXT | Derived, denormalized text used for matching/embedding |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| updated_at | TIMESTAMPTZ | NOT NULL, default `now()` |

### seeker_profile
| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK |
| user_id | UUID | NOT NULL, UNIQUE, FK app_user(id) |
| headline | TEXT | |
| bio | TEXT | |
| location_id | BIGINT | FK location(id) |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| updated_at | TIMESTAMPTZ | NOT NULL, default `now()` |

### skill
| Column | Type | Constraints |
| --- | --- | --- |
| id | BIGSERIAL | PK |
| slug | TEXT | NOT NULL, UNIQUE (normalized, e.g. `spring-boot`) |
| name | TEXT | NOT NULL |
| category | TEXT | (`TECH`,`TRADES`,`LANGUAGE`,`SOFT`,`OTHER`) |

### provider_skill
| Column | Type | Constraints |
| --- | --- | --- |
| provider_profile_id | UUID | FK provider_profile(id), PK part |
| skill_id | BIGINT | FK skill(id), PK part |
| proficiency | SMALLINT | CHECK (1..5) |
| years_experience | NUMERIC(4,1) | CHECK (>= 0) |
| | | PRIMARY KEY (provider_profile_id, skill_id) |

### service_category
| Column | Type | Constraints |
| --- | --- | --- |
| id | BIGSERIAL | PK |
| slug | TEXT | NOT NULL, UNIQUE |
| name | TEXT | NOT NULL |
| applicable_type | TEXT | (`JOB`,`FREELANCE_PROJECT`,`LOCAL_SERVICE_REQUEST`,`ANY`) |
| parent_id | BIGINT | FK service_category(id), nullable |

### listing
| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK |
| owner_user_id | UUID | NOT NULL, FK app_user(id) |
| listing_type | TEXT | NOT NULL, (`JOB`,`FREELANCE_PROJECT`,`LOCAL_SERVICE_REQUEST`) |
| title | TEXT | NOT NULL |
| description | TEXT | NOT NULL |
| service_category_id | BIGINT | FK service_category(id) |
| location_id | BIGINT | FK location(id), nullable |
| is_remote | BOOLEAN | NOT NULL, default `false` |
| budget_min | NUMERIC(12,2) | CHECK (>= 0) |
| budget_max | NUMERIC(12,2) | CHECK (>= budget_min) |
| currency | TEXT | NOT NULL, default `'ETB'` |
| availability_required | TEXT | same domain as provider availability |
| seniority | TEXT | (`JUNIOR`,`MID`,`SENIOR`,`ANY`) default `'ANY'` |
| status | TEXT | NOT NULL, default `'DRAFT'` (`DRAFT`,`OPEN`,`CLOSED`,`FILLED`) |
| published_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| updated_at | TIMESTAMPTZ | NOT NULL, default `now()` |

### listing_skill
| Column | Type | Constraints |
| --- | --- | --- |
| listing_id | UUID | FK listing(id), PK part |
| skill_id | BIGINT | FK skill(id), PK part |
| requirement | TEXT | (`REQUIRED`,`PREFERRED`) default `'REQUIRED'` |
| weight | NUMERIC(4,3) | NOT NULL, default `1.000`, CHECK (0..1) |
| | | PRIMARY KEY (listing_id, skill_id) |

### application
| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK |
| listing_id | UUID | NOT NULL, FK listing(id) |
| applicant_user_id | UUID | NOT NULL, FK app_user(id) |
| provider_profile_id | UUID | NOT NULL, FK provider_profile(id) |
| cover_note | TEXT | |
| proposed_rate | NUMERIC(12,2) | |
| status | TEXT | NOT NULL, default `'SUBMITTED'` (`SUBMITTED`,`SHORTLISTED`,`OFFERED`,`ACCEPTED`,`REJECTED`,`WITHDRAWN`) |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| updated_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| | | UNIQUE(listing_id, applicant_user_id) |

### match_run
| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK |
| listing_id | UUID | NOT NULL, FK listing(id) |
| method | TEXT | NOT NULL, (`KEYWORD`,`AI`) |
| k | INTEGER | NOT NULL |
| model_name | TEXT | |
| model_version | TEXT | |
| requested_by | UUID | FK app_user(id) |
| latency_ms | INTEGER | |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |

### match_result
| Column | Type | Constraints |
| --- | --- | --- |
| id | BIGSERIAL | PK |
| match_run_id | UUID | NOT NULL, FK match_run(id) |
| provider_profile_id | UUID | NOT NULL, FK provider_profile(id) |
| rank | INTEGER | NOT NULL |
| score | NUMERIC(8,6) | NOT NULL |
| explanation | JSONB | Factor list, see [ai-contract.md](ai-contract.md) |
| | | UNIQUE(match_run_id, rank) |

### review (should-have)
| Column | Type | Constraints |
| --- | --- | --- |
| id | UUID | PK |
| listing_id | UUID | NOT NULL, FK listing(id) |
| reviewer_user_id | UUID | NOT NULL, FK app_user(id) |
| reviewee_user_id | UUID | NOT NULL, FK app_user(id) |
| rating | SMALLINT | NOT NULL, CHECK (1..5) |
| comment | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` |
| | | UNIQUE(listing_id, reviewer_user_id) |

## 3. Indexes

```sql
CREATE INDEX idx_listing_status_type ON listing (status, listing_type);
CREATE INDEX idx_listing_location    ON listing (location_id);
CREATE INDEX idx_listing_category    ON listing (service_category_id);
CREATE INDEX idx_provider_skill_skill ON provider_skill (skill_id);
CREATE INDEX idx_app_user_subject    ON app_user (keycloak_subject);
CREATE INDEX idx_match_result_run    ON match_result (match_run_id);
CREATE INDEX idx_application_listing ON application (listing_id);
```

## 4. Flyway conventions

- Location: `backend/src/main/resources/db/migration`.
- Naming: `V{n}__{snake_case_description}.sql` (e.g. `V1__baseline_schema.sql`).
- Seed/reference data (locations, skills, categories) in `V2__seed_reference_data.sql`.
- Never edit an applied migration; add a new one.
- A clean database must initialize from empty with `docker compose up` and no manual steps.
