ALTER TABLE chef_profiles
  ADD COLUMN IF NOT EXISTS service_schedules JSONB,
  ADD COLUMN IF NOT EXISTS calendar_feed_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS external_calendar_url TEXT,
  ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chef_profiles_calendar_feed_token
  ON chef_profiles (calendar_feed_token)
  WHERE calendar_feed_token IS NOT NULL;
