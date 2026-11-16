-- V16: Service Bookings, Interviews, Saved Listings, and Dispute Evidence
-- Supports Local Trade Service Marketplace, Employer Interview Scheduling, and Bookmarks

-- 1. Local Service Bookings
CREATE TABLE IF NOT EXISTS service_booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    service_category_id BIGINT REFERENCES service_category(id) ON DELETE SET NULL,
    location_id BIGINT REFERENCES location(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    service_address VARCHAR(255),
    scheduled_at TIMESTAMPTZ NOT NULL,
    estimated_hours NUMERIC(5, 2) DEFAULT 1.0,
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_booking_customer ON service_booking(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_service_booking_provider ON service_booking(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_service_booking_status ON service_booking(status);

-- 2. Interview Scheduling System
CREATE TABLE IF NOT EXISTS interview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES application(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listing(id) ON DELETE CASCADE,
    employer_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    candidate_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    meeting_link VARCHAR(500),
    location_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'INVITED', -- INVITED, ACCEPTED, DECLINED, RESCHEDULED, COMPLETED, CANCELLED
    candidate_notes TEXT,
    decline_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_employer ON interview(employer_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_candidate ON interview(candidate_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_application ON interview(application_id);

-- 3. Saved Opportunities / Bookmarks
CREATE TABLE IF NOT EXISTS saved_listing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listing(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_listing_user_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listing_user ON saved_listing(user_id);

-- 4. Dispute Supporting Evidence
ALTER TABLE dispute ADD COLUMN IF NOT EXISTS evidence_file_urls TEXT;
