-- V12: Make listing_id and application_id nullable on contract table to enable direct hiring and offers from chat
ALTER TABLE contract ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE contract ALTER COLUMN application_id DROP NOT NULL;
