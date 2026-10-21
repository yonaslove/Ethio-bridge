-- EthioBridge Baseline Schema Migration V1
-- Target: PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Location
CREATE TABLE location (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'ET',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    CONSTRAINT uq_location_name_region UNIQUE (name, region)
);

-- 2. App User (mirrors Keycloak identity)
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_subject UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_app_user_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

-- 3. Provider Profile
CREATE TABLE provider_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    headline TEXT,
    bio TEXT,
    years_experience INTEGER CHECK (years_experience >= 0),
    location_id BIGINT REFERENCES location(id) ON DELETE SET NULL,
    availability TEXT,
    hourly_rate NUMERIC(12,2) CHECK (hourly_rate >= 0),
    category_focus TEXT DEFAULT 'ANY',
    profile_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_provider_availability CHECK (availability IS NULL OR availability IN ('FULL_TIME', 'PART_TIME', 'HOURLY', 'ONE_OFF', 'UNAVAILABLE')),
    CONSTRAINT chk_provider_category_focus CHECK (category_focus IN ('EMPLOYMENT', 'FREELANCING', 'LOCAL_SERVICE', 'ANY'))
);

-- 4. Seeker Profile
CREATE TABLE seeker_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
    headline TEXT,
    bio TEXT,
    location_id BIGINT REFERENCES location(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Skill
CREATE TABLE skill (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT chk_skill_category CHECK (category IN ('TECH', 'TRADES', 'LANGUAGE', 'SOFT', 'OTHER'))
);

-- 6. Provider Skill
CREATE TABLE provider_skill (
    provider_profile_id UUID NOT NULL REFERENCES provider_profile(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    proficiency SMALLINT CHECK (proficiency BETWEEN 1 AND 5),
    years_experience NUMERIC(4,1) CHECK (years_experience >= 0),
    PRIMARY KEY (provider_profile_id, skill_id)
);

-- 7. Service Category
CREATE TABLE service_category (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applicable_type TEXT NOT NULL,
    parent_id BIGINT REFERENCES service_category(id) ON DELETE SET NULL,
    CONSTRAINT chk_category_applicable_type CHECK (applicable_type IN ('JOB', 'FREELANCE_PROJECT', 'LOCAL_SERVICE_REQUEST', 'ANY'))
);

-- 8. Listing
CREATE TABLE listing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    listing_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    service_category_id BIGINT REFERENCES service_category(id) ON DELETE SET NULL,
    location_id BIGINT REFERENCES location(id) ON DELETE SET NULL,
    is_remote BOOLEAN NOT NULL DEFAULT false,
    budget_min NUMERIC(12,2) CHECK (budget_min >= 0),
    budget_max NUMERIC(12,2),
    currency TEXT NOT NULL DEFAULT 'ETB',
    availability_required TEXT,
    seniority TEXT DEFAULT 'ANY',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_listing_type CHECK (listing_type IN ('JOB', 'FREELANCE_PROJECT', 'LOCAL_SERVICE_REQUEST')),
    CONSTRAINT chk_listing_seniority CHECK (seniority IN ('JUNIOR', 'MID', 'SENIOR', 'ANY')),
    CONSTRAINT chk_listing_status CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'FILLED')),
    CONSTRAINT chk_listing_budget_order CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min)
);

-- 9. Listing Skill
CREATE TABLE listing_skill (
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL DEFAULT 'REQUIRED',
    weight NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (weight BETWEEN 0 AND 1),
    PRIMARY KEY (listing_id, skill_id),
    CONSTRAINT chk_listing_skill_req CHECK (requirement IN ('REQUIRED', 'PREFERRED'))
);

-- 10. Application
CREATE TABLE application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider_profile_id UUID NOT NULL REFERENCES provider_profile(id) ON DELETE CASCADE,
    cover_note TEXT,
    proposed_rate NUMERIC(12,2),
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_application_listing_applicant UNIQUE (listing_id, applicant_user_id),
    CONSTRAINT chk_application_status CHECK (status IN ('SUBMITTED', 'SHORTLISTED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'))
);

-- 11. Match Run
CREATE TABLE match_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    k INTEGER NOT NULL,
    model_name TEXT,
    model_version TEXT,
    requested_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_match_run_method CHECK (method IN ('KEYWORD', 'AI'))
);

-- 12. Match Result
CREATE TABLE match_result (
    id BIGSERIAL PRIMARY KEY,
    match_run_id UUID NOT NULL REFERENCES match_run(id) ON DELETE CASCADE,
    provider_profile_id UUID NOT NULL REFERENCES provider_profile(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score NUMERIC(8,6) NOT NULL,
    explanation JSONB,
    CONSTRAINT uq_match_result_run_rank UNIQUE (match_run_id, rank)
);

-- 13. Review
CREATE TABLE review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    reviewee_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_review_listing_reviewer UNIQUE (listing_id, reviewer_user_id)
);

-- 14. Indexes
CREATE INDEX idx_listing_status_type ON listing (status, listing_type);
CREATE INDEX idx_listing_location ON listing (location_id);
CREATE INDEX idx_listing_category ON listing (service_category_id);
CREATE INDEX idx_provider_skill_skill ON provider_skill (skill_id);
CREATE INDEX idx_app_user_subject ON app_user (keycloak_subject);
CREATE INDEX idx_match_result_run ON match_result (match_run_id);
CREATE INDEX idx_application_listing ON application (listing_id);
