-- V8: User Roles source-of-truth table and Full-Text Search vector for listings

-- 1. Create app_user_role table for persistent role management
CREATE TABLE IF NOT EXISTS app_user_role (
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_app_user_role_user ON app_user_role(user_id);

-- 2. Populate roles for existing accounts
-- Admin accounts
INSERT INTO app_user_role (user_id, role)
SELECT id, 'ADMIN' FROM app_user
WHERE email LIKE 'admin@%'
ON CONFLICT DO NOTHING;

-- Provider profiles
INSERT INTO app_user_role (user_id, role)
SELECT user_id, 'PROVIDER' FROM provider_profile
ON CONFLICT DO NOTHING;

-- Seeker profiles
INSERT INTO app_user_role (user_id, role)
SELECT user_id, 'SEEKER' FROM seeker_profile
ON CONFLICT DO NOTHING;

-- Default fallback: ensure every user has at least SEEKER
INSERT INTO app_user_role (user_id, role)
SELECT u.id, 'SEEKER' FROM app_user u
WHERE NOT EXISTS (SELECT 1 FROM app_user_role r WHERE r.user_id = u.id)
ON CONFLICT DO NOTHING;

-- 3. Full-Text Search vector for listings
ALTER TABLE listing ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE listing
SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''));

CREATE INDEX IF NOT EXISTS idx_listing_search_vector ON listing USING gin(search_vector);
