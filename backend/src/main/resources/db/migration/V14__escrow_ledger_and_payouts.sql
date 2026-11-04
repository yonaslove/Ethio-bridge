-- V14: Escrow Double-Entry Ledger, Provider Payouts, and Webhook Audit
-- 1. Expand payment_transaction status constraint to support real banking & escrow states
ALTER TABLE payment_transaction DROP CONSTRAINT IF EXISTS chk_payment_status;
ALTER TABLE payment_transaction ADD CONSTRAINT chk_payment_status 
    CHECK (status = ANY (ARRAY['INITIATED'::text, 'PENDING_GATEWAY'::text, 'SUCCESS'::text, 'FAILED'::text, 'CANCELLED'::text, 'HELD_IN_ESCROW'::text, 'SIMULATED_PENDING'::text]));

-- 2. Escrow Double-Entry Ledger Table
CREATE TABLE IF NOT EXISTS escrow_ledger_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES contract_milestone(id) ON DELETE SET NULL,
    transaction_ref TEXT NOT NULL,
    entry_type TEXT NOT NULL, -- DEPOSIT_HOLD, RELEASE_PAYOUT, COMMISSION_FEE, REFUND
    debit_account TEXT NOT NULL,
    credit_account TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    seeker_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    provider_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    balance_after NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    reconciled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_ledger_contract ON escrow_ledger_entry(contract_id);
CREATE INDEX IF NOT EXISTS idx_escrow_ledger_milestone ON escrow_ledger_entry(milestone_id);

-- 3. Provider Payout Disbursement Ledger
CREATE TABLE IF NOT EXISTS provider_payout (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES contract_milestone(id) ON DELETE CASCADE,
    provider_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
    fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12,2) NOT NULL CHECK (net_amount > 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    payout_method TEXT NOT NULL, -- TELEBIRR, CBE_BIRR, CHAPA_TRANSFER
    payout_account TEXT,
    payout_reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'SETTLED', -- INITIATED, PROCESSING, SETTLED, FAILED
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_payout_user ON provider_payout(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_provider_payout_contract ON provider_payout(contract_id);

-- 4. Escrow Financial Reconciliation Record
CREATE TABLE IF NOT EXISTS escrow_reconciliation_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_holds NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_released NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_fees NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    total_payouts NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    active_escrow_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    discrepancy_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'BALANCED', -- BALANCED, DISCREPANCY_DETECTED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Gateway Webhook Idempotency & Tamper-Proof Audit Log
CREATE TABLE IF NOT EXISTS payment_webhook_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway TEXT NOT NULL DEFAULT 'CHAPA',
    event_type TEXT,
    tx_ref TEXT NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT false,
    idempotency_key TEXT UNIQUE,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'PROCESSED', -- PROCESSED, DUPLICATE_SKIPPED, REJECTED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_tx_ref ON payment_webhook_log(tx_ref);
