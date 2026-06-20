-- Backfill slugs without colliding on duplicate display names.
UPDATE chef_profiles AS profile
SET slug = trim(both '-' from lower(regexp_replace(profile.display_name, '[^a-zA-Z0-9]+', '-', 'g')))
WHERE (profile.slug IS NULL OR profile.slug = '')
  AND NOT EXISTS (
    SELECT 1
    FROM chef_profiles AS existing
    WHERE existing.id <> profile.id
      AND existing.slug = trim(
        both '-'
        from lower(regexp_replace(profile.display_name, '[^a-zA-Z0-9]+', '-', 'g'))
      )
  );

UPDATE chef_profiles AS profile
SET slug = trim(both '-' from lower(regexp_replace(profile.display_name, '[^a-zA-Z0-9]+', '-', 'g')))
  || '-'
  || left(replace(profile.id::text, '-', ''), 8)
WHERE profile.slug IS NULL OR profile.slug = '';
