-- V6: Add provider profile portfolio, avatar, education, and language details
ALTER TABLE provider_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE provider_profile ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE provider_profile ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE provider_profile ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;
