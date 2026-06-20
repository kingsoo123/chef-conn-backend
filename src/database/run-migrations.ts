import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { requireEnv } from '../config/configuration';

const MIGRATION_FILES = [
  '001_initial_schema.sql',
  '002_add_password_hash.sql',
  '003_marketplace_discovery.sql',
  '004_seed_marketplace_chefs.sql',
  '005_fix_duplicate_slugs.sql',
  '006_global_pricing.sql',
  '007_chef_reviews.sql',
  '008_chat.sql',
  '009_bookings.sql',
  '010_booking_optional_contact.sql',
  '011_booking_budget.sql',
  '012_booking_location_fields.sql',
  '013_chef_availability.sql',
  '014_availability_extensions.sql',
];

function loadEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = join(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    for (const line of readFileSync(filePath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function hasMigration(client: Client, fileName: string) {
  const result = await client.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1',
    [fileName],
  );

  return (result.rowCount ?? 0) > 0;
}

async function recordMigration(client: Client, fileName: string) {
  await client.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
    [fileName],
  );
}

async function bootstrapExistingMigrations(client: Client) {
  const tables = await client.query(`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'chef_profiles'
    LIMIT 1
  `);

  if (!tables.rowCount) {
    return;
  }

  for (const fileName of [
    '001_initial_schema.sql',
    '002_add_password_hash.sql',
    '003_marketplace_discovery.sql',
  ]) {
    await recordMigration(client, fileName);
  }

  const demoSeed = await client.query(
    `SELECT 1 FROM users WHERE email = 'chef.tunde@chefconnect.demo' LIMIT 1`,
  );

  if (demoSeed.rowCount) {
    await recordMigration(client, '004_seed_marketplace_chefs.sql');
  }
}

export async function runDatabaseMigrations(): Promise<void> {
  loadEnvFiles();

  const databaseUrl = requireEnv('DATABASE_URL');
  const usesSupabase = databaseUrl.includes('supabase');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: usesSupabase ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);
    await bootstrapExistingMigrations(client);

    for (const fileName of MIGRATION_FILES) {
      if (await hasMigration(client, fileName)) {
        continue;
      }

      const sql = readFileSync(
        join(__dirname, 'migrations', fileName),
        'utf8',
      );

      await client.query(sql);
      await recordMigration(client, fileName);
    }
  } finally {
    await client.end();
  }
}
