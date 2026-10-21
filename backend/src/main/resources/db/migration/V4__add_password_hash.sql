-- V4: Add password_hash column to app_user table and seed BCrypt hashes for demo accounts
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Set default BCrypt hash for 'password123' for existing demo users
-- BCrypt: $2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe
UPDATE app_user 
SET password_hash = '$2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe' 
WHERE password_hash IS NULL;
