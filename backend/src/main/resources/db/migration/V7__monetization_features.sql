-- V7__monetization_features.sql
-- Upwork-Style Platform Monetization: Escrow Commission, Connects, Featured Listings, Pro Subscriptions

-- 1. Contract Milestone platform fee breakdown
ALTER TABLE contract_milestone
    ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5,2) DEFAULT 10.00,
    ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS net_payout_amount NUMERIC(12,2) DEFAULT 0.00;

-- 2. Provider Profile Connects & Pro Subscription
ALTER TABLE provider_profile
    ADD COLUMN IF NOT EXISTS connects_balance INT NOT NULL DEFAULT 20,
    ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

-- 3. Listing Featured / Promoted Status
ALTER TABLE listing
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- 4. Platform Revenue Ledger Table
CREATE TABLE IF NOT EXISTS platform_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL, -- ESCROW_COMMISSION, CONNECTS_TOPUP, FEATURED_LISTING, PRO_SUBSCRIPTION
    source_id UUID,
    payer_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    gross_amount NUMERIC(12,2) NOT NULL,
    fee_amount NUMERIC(12,2) NOT NULL,
    net_amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    payment_method VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial connects for existing provider profiles
UPDATE provider_profile SET connects_balance = 20 WHERE connects_balance IS NULL OR connects_balance = 0;
