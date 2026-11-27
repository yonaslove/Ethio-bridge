-- V20: Add document_back_url for 2-sided Ethiopian ID Card (Fayda / Kebele / Driver's License) verification
ALTER TABLE user_verification ADD COLUMN IF NOT EXISTS document_back_url TEXT;
