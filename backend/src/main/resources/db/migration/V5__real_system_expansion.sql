-- EthioBridge Real System Expansion Migration V5
-- Adds Trust & Verification, Application Audit, In-App Messaging, Notifications,
-- Escrow Contracts & Ethiopian Payments (Telebirr/CBE Birr), Reports/Moderation,
-- Saved Searches, Audit Logging, and AI Feedback.

-- 1. Trust & Verification
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS user_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    id_type TEXT NOT NULL, -- FAYDA_NATIONAL_ID, KEBELE_ID, PASSPORT, DRIVERS_LICENSE
    id_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_verification_status CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT chk_verification_id_type CHECK (id_type IN ('FAYDA_NATIONAL_ID', 'KEBELE_ID', 'PASSPORT', 'DRIVERS_LICENSE'))
);

-- 2. Listing Lifecycle & Auto-expiry
ALTER TABLE listing ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE listing DROP CONSTRAINT IF EXISTS chk_listing_status;
ALTER TABLE listing ADD CONSTRAINT chk_listing_status CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'FILLED', 'EXPIRED'));

-- 3. Application State Machine & Audit Trail
CREATE TABLE IF NOT EXISTS application_audit (
    id BIGSERIAL PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Saved Searches & Notifications
CREATE TABLE IF NOT EXISTS saved_search (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    query_text TEXT,
    service_category_id BIGINT REFERENCES service_category(id) ON DELETE SET NULL,
    location_id BIGINT REFERENCES location(id) ON DELETE SET NULL,
    min_budget NUMERIC(12,2),
    max_budget NUMERIC(12,2),
    listing_type TEXT,
    notify_email BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Trust & Safety: Moderation Reports & Content Flagging
CREATE TABLE IF NOT EXISTS report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES listing(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, INVESTIGATING, RESOLVED, DISMISSED
    admin_notes TEXT,
    resolved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_report_status CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'))
);

-- 6. In-App Messaging
CREATE TABLE IF NOT EXISTS message_thread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listing(id) ON DELETE SET NULL,
    application_id UUID REFERENCES application(id) ON DELETE SET NULL,
    participant1_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    participant2_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES message_thread(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- APPLICATION, MESSAGE, OFFER, CONTRACT, SYSTEM
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Contracts, Escrow & Payments (Telebirr / CBE Birr)
CREATE TABLE IF NOT EXISTS contract (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    seeker_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    terms TEXT,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- DRAFT, ACTIVE, COMPLETED, DISPUTED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_contract_status CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS contract_milestone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, FUNDED, RELEASED, DISPUTED
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    funded_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    CONSTRAINT chk_milestone_status CHECK (status IN ('PENDING', 'FUNDED', 'RELEASED', 'DISPUTED'))
);

CREATE TABLE IF NOT EXISTS payment_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES contract_milestone(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    payment_method TEXT NOT NULL, -- TELEBIRR, CBE_BIRR, CHAPA, CARD
    transaction_ref TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'INITIATED', -- INITIATED, SUCCESS, FAILED
    provider_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('TELEBIRR', 'CBE_BIRR', 'CHAPA', 'CARD')),
    CONSTRAINT chk_payment_status CHECK (status IN ('INITIATED', 'SUCCESS', 'FAILED'))
);

CREATE TABLE IF NOT EXISTS dispute (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    opened_by_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, UNDER_REVIEW, RESOLVED_SEEKER, RESOLVED_PROVIDER, SETTLED
    admin_resolution TEXT,
    resolved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_dispute_status CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_SEEKER', 'RESOLVED_PROVIDER', 'SETTLED'))
);

-- 9. Audit Logging & User Consent Compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- TERMS_OF_SERVICE, PRIVACY_POLICY, DATA_SHARING
    agreed BOOLEAN NOT NULL DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AI Feedback Loop Table
CREATE TABLE IF NOT EXISTS match_feedback (
    id BIGSERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    provider_profile_id UUID NOT NULL REFERENCES provider_profile(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- VIEWED, SHORTLISTED, OFFERED, REJECTED
    score NUMERIC(8,6),
    rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Seed sample trust and verification for demo users
UPDATE app_user SET is_verified = true, phone_number = '+251911223344', phone_verified = true WHERE email = 'provider1@ethiobridge.et';
UPDATE app_user SET is_verified = true, phone_number = '+251922334455', phone_verified = true WHERE email = 'seeker1@ethiobridge.et';

-- Insert sample verified record for provider1
INSERT INTO user_verification (user_id, id_type, id_number, phone_number, status, verified_at)
SELECT id, 'FAYDA_NATIONAL_ID', 'FAN-9841-2024-ET', '+251911223344', 'VERIFIED', now()
FROM app_user WHERE email = 'provider1@ethiobridge.et'
ON CONFLICT DO NOTHING;

-- Seed a sample completed contract with milestone & escrow payment for Dawit Tadesse
INSERT INTO contract (id, listing_id, application_id, seeker_user_id, provider_user_id, title, terms, total_amount, status)
SELECT 
    'e1111111-1111-1111-1111-111111111101',
    'd1111111-1111-1111-1111-111111111101',
    a.id,
    'a1111111-1111-1111-1111-111111111101',
    'a2222222-2222-2222-2222-222222222201',
    'Enterprise Microservices Architecture Contract',
    'Delivery of Spring Boot microservices and automated test suites with PostgreSQL integration.',
    35000.00,
    'ACTIVE'
FROM application a 
WHERE a.listing_id = 'd1111111-1111-1111-1111-111111111101' AND a.applicant_user_id = 'a2222222-2222-2222-2222-222222222201'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO contract_milestone (id, contract_id, title, description, amount, status, due_date, funded_at)
VALUES 
(
    'f1111111-1111-1111-1111-111111111101',
    'e1111111-1111-1111-1111-111111111101',
    'Milestone 1: Database Schema & Core APIs',
    'Setup PostgreSQL schema, Flyway migrations, and basic authentication endpoints.',
    15000.00,
    'FUNDED',
    now() + INTERVAL '14 days',
    now()
),
(
    'f2222222-2222-2222-2222-222222222202',
    'e1111111-1111-1111-1111-111111111101',
    'Milestone 2: AI Matching Integration & Deployment',
    'Connect AI microservice and deploy containerized services to staging.',
    20000.00,
    'PENDING',
    now() + INTERVAL '30 days',
    NULL
)
ON CONFLICT DO NOTHING;

INSERT INTO payment_transaction (contract_id, milestone_id, user_id, amount, payment_method, transaction_ref, status)
VALUES (
    'e1111111-1111-1111-1111-111111111101',
    'f1111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111101',
    15000.00,
    'TELEBIRR',
    'TB-20261017-984210',
    'SUCCESS'
)
ON CONFLICT DO NOTHING;

-- Seed an initial review for Dawit Tadesse
INSERT INTO review (id, listing_id, reviewer_user_id, reviewee_user_id, rating, comment)
VALUES (
    'aa111111-1111-1111-1111-111111111101',
    'd1111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111101',
    'a2222222-2222-2222-2222-222222222201',
    5,
    'Exceptional software engineer! Dawit delivered clean, performant Spring Boot code ahead of deadline with comprehensive tests. Highly recommended for complex backend systems in Ethiopia.'
)
ON CONFLICT DO NOTHING;

-- Seed an in-app message thread and messages between Sara (Seeker) and Dawit (Provider)
INSERT INTO message_thread (id, listing_id, participant1_user_id, participant2_user_id, subject)
VALUES (
    'bb111111-1111-1111-1111-111111111101',
    'd1111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111101',
    'a2222222-2222-2222-2222-222222222201',
    'Interview & Architecture Scope for Junior Backend Developer'
)
ON CONFLICT DO NOTHING;

INSERT INTO message (thread_id, sender_user_id, recipient_user_id, content, is_read, created_at)
VALUES 
(
    'bb111111-1111-1111-1111-111111111101',
    'a1111111-1111-1111-1111-111111111101',
    'a2222222-2222-2222-2222-222222222201',
    'Hello Dawit! We reviewed your profile and your strong background in Java and PostgreSQL stood out. Are you available for a brief sync tomorrow?',
    true,
    now() - INTERVAL '2 hours'
),
(
    'bb111111-1111-1111-1111-111111111101',
    'a2222222-2222-2222-2222-222222222201',
    'a1111111-1111-1111-1111-111111111101',
    'Hi Sara! Thank you for reaching out. Yes, I am available tomorrow morning between 10:00 AM and 12:00 PM. Looking forward to discussing the platform architecture.',
    false,
    now() - INTERVAL '30 minutes'
)
ON CONFLICT DO NOTHING;

-- Seed sample notifications
INSERT INTO notification (user_id, title, message, type, link_url, is_read)
VALUES 
(
    'a1111111-1111-1111-1111-111111111101',
    'New Message Received',
    'Dawit Tadesse sent you a message regarding "Interview & Architecture Scope".',
    'MESSAGE',
    '/messages',
    false
),
(
    'a2222222-2222-2222-2222-222222222201',
    'Escrow Milestone Funded (15,000 ETB)',
    'Sara Bekele funded Milestone 1 using Telebirr. Work can safely begin.',
    'CONTRACT',
    '/contracts',
    false
),
(
    'a2222222-2222-2222-2222-222222222201',
    'National ID Verified',
    'Your Fayda National ID has been verified by the EthioBridge compliance team. You now have a verified badge.',
    'SYSTEM',
    '/profile/provider',
    true
)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_msg_thread_part ON message_thread (participant1_user_id, participant2_user_id);
CREATE INDEX IF NOT EXISTS idx_msg_thread ON message (thread_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notification (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contract_users ON contract (seeker_user_id, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_user_verif_user ON user_verification (user_id);
