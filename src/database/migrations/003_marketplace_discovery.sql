ALTER TABLE chef_profiles
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS price_per_day INTEGER DEFAULT 75000,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE chef_profiles
SET slug = trim(both '-' from lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')))
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_chef_profiles_slug
  ON chef_profiles (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chef_profiles_marketplace
  ON chef_profiles (status, is_available, price_per_day, rating);
