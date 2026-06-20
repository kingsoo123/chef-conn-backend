const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { Client } = require('pg');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/check-user-status.js <email>');
  process.exit(1);
}

for (const fileName of ['.env.local', '.env']) {
  const filePath = join(process.cwd(), fileName);
  if (!existsSync(filePath)) continue;

  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
  });

  await client.connect();

  const userResult = await client.query(
    `SELECT id, email, first_name, last_name, phone, role, created_at
     FROM users
     WHERE lower(email) = lower($1)`,
    [email],
  );

  if (!userResult.rows.length) {
    console.log(
      JSON.stringify(
        {
          found: false,
          email,
          verifiedOnMarketplace: false,
          message: 'No account found for this email.',
        },
        null,
        2,
      ),
    );
    await client.end();
    return;
  }

  const user = userResult.rows[0];
  const profileResult = await client.query(
    `SELECT id, display_name, slug, status, is_available, rating, review_count, created_at, updated_at
     FROM chef_profiles
     WHERE user_id = $1`,
    [user.id],
  );

  const chefProfile = profileResult.rows[0] ?? null;

  console.log(
    JSON.stringify(
      {
        found: true,
        user,
        chefProfile,
        verifiedOnMarketplace: chefProfile?.status === 'approved',
        profileStatusLabel:
          chefProfile?.status === 'approved'
            ? 'Verified (live on marketplace)'
            : chefProfile?.status === 'rejected'
              ? 'Rejected (needs updates)'
              : chefProfile?.status === 'pending_review'
                ? 'Unverified (pending review)'
                : chefProfile?.status ?? 'No chef profile',
      },
      null,
      2,
    ),
  );

  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
