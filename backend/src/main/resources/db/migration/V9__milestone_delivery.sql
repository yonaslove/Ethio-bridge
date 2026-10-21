-- V9__milestone_delivery.sql
-- Upwork-Style Milestone Delivery Workflow: Submit Work / Review / Approve

ALTER TABLE contract_milestone
    DROP CONSTRAINT IF EXISTS chk_milestone_status;

ALTER TABLE contract_milestone
    ADD CONSTRAINT chk_milestone_status
    CHECK (status = ANY (ARRAY['PENDING'::text, 'FUNDED'::text, 'DELIVERED'::text, 'RELEASED'::text, 'DISPUTED'::text]));

ALTER TABLE contract_milestone
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
