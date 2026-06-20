-- Normalize legacy NGN-scale daily rates to USD-scale amounts.
UPDATE chef_profiles
SET price_per_day = GREATEST(150, ROUND(price_per_day / 200.0))
WHERE price_per_day > 1000;

ALTER TABLE chef_profiles
  ALTER COLUMN price_per_day SET DEFAULT 350;
