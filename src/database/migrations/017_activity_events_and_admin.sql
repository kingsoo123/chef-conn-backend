-- Platform activity events (web + mobile) for admin monitoring.
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'web',
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events(type);
CREATE INDEX IF NOT EXISTS idx_activity_events_source ON activity_events(source);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_actor_email ON activity_events(actor_email);
CREATE INDEX IF NOT EXISTS idx_activity_events_actor_user_id ON activity_events(actor_user_id);

-- Sole admin account for chef-conn-admin (password: password).
INSERT INTO users (id, email, first_name, last_name, phone, password_hash, role, created_at, updated_at)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'hello@zenithinnovation.com.ng',
  'Zenith',
  'Admin',
  NULL,
  '$2b$12$RiT7W38J9YwUuviZT50rp.ppbNnrEdoM43FG7/w0p.4uyY2x5ZrSG',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();
