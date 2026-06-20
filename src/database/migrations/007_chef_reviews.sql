CREATE TABLE IF NOT EXISTS chef_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id UUID NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chef_reviews_profile_created
  ON chef_reviews (chef_profile_id, created_at DESC);
