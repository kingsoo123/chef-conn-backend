ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS budget INTEGER CHECK (budget IS NULL OR budget >= 0);
