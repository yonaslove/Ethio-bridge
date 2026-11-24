-- V18: Ensure verification status integrity
-- Reset unverified flags for accounts that have not completed and passed Fayda ID compliance verification

-- Ensure seeker1, provider2, and dualuser must undergo actual verification or compliance check
UPDATE app_user 
SET is_verified = false 
WHERE email IN ('seeker1@ethiobridge.et', 'provider2@ethiobridge.et', 'dualuser@ethiobridge.et');

-- Only provider1 has an approved verified record in user_verification with FAN-9841-2024-ET
UPDATE app_user 
SET is_verified = true 
WHERE email = 'provider1@ethiobridge.et';

-- Ensure user_verification has valid records
INSERT INTO user_verification (user_id, id_type, id_number, phone_number, status, verified_at, ai_score, ai_verdict)
SELECT id, 'FAYDA_NATIONAL_ID', 'FAN-9841-2024-ET', '+251922334455', 'VERIFIED', now(), 95.00, 'RECOMMENDED_APPROVE'
FROM app_user WHERE email = 'provider1@ethiobridge.et'
ON CONFLICT DO NOTHING;
