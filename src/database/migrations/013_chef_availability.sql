ALTER TABLE chef_profiles
  ADD COLUMN IF NOT EXISTS weekly_schedule JSONB;

CREATE TABLE IF NOT EXISTS chef_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id UUID NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chef_profile_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_chef_blocked_dates_profile_date
  ON chef_blocked_dates (chef_profile_id, blocked_date);
