CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id UUID NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  host_email TEXT NOT NULL,
  host_phone TEXT,
  service TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count >= 1),
  location TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'awaiting_response', 'confirmed', 'declined', 'completed', 'cancelled')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_chef_status_created
  ON bookings (chef_profile_id, status, created_at DESC);
