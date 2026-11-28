-- Migration V21: Add document_name to user_verification for name matching validation
ALTER TABLE user_verification
ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);
