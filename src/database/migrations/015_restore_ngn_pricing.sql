-- Restore NGN-scale daily rates from USD-scale amounts introduced in 006.
UPDATE chef_profiles
SET price_per_day = price_per_day * 200
WHERE price_per_day > 0 AND price_per_day <= 2000;

ALTER TABLE chef_profiles
  ALTER COLUMN price_per_day SET DEFAULT 75000;
