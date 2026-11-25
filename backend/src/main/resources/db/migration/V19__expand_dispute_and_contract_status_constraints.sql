-- V19: Expand dispute and contract status constraints for mediation & escrow resolutions

ALTER TABLE dispute DROP CONSTRAINT IF EXISTS chk_dispute_status;
ALTER TABLE dispute ADD CONSTRAINT chk_dispute_status
    CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'RESOLVED_SEEKER', 'RESOLVED_PROVIDER', 'SETTLED', 'CANCELLED'));

ALTER TABLE contract DROP CONSTRAINT IF EXISTS chk_contract_status;
ALTER TABLE contract ADD CONSTRAINT chk_contract_status
    CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'RESOLVED_REFUNDED', 'RESOLVED_RELEASED'));

ALTER TABLE contract_milestone DROP CONSTRAINT IF EXISTS chk_milestone_status;
ALTER TABLE contract_milestone ADD CONSTRAINT chk_milestone_status
    CHECK (status IN ('PENDING', 'FUNDED', 'DELIVERED', 'IN_REVISION', 'RELEASED', 'REFUNDED', 'DISPUTED'));
