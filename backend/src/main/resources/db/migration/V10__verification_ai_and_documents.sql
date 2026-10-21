-- V10: ID Verification Document Image Upload & Explainable AI Verification
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS ai_score NUMERIC(5,2);
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS ai_verdict VARCHAR(50);
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS criteria_breakdown TEXT;

ALTER TABLE user_verification DROP CONSTRAINT IF EXISTS chk_verification_id_type;
ALTER TABLE user_verification ADD CONSTRAINT chk_verification_id_type 
CHECK (id_type = ANY (ARRAY['FAYDA_NATIONAL_ID'::text, 'KEBELE_ID'::text, 'PASSPORT'::text, 'DRIVERS_LICENSE'::text, 'BUSINESS_LICENSE'::text]));
