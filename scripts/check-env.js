const fs = require('fs');
const path = require('path');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, 'utf8').split('\n').reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return env;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return env;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
    return env;
  }, {});
}

const env = {
  ...readEnvFile(path.join(__dirname, '..', '.env')),
  ...readEnvFile(path.join(__dirname, '..', '.env.local')),
  ...process.env,
};

if (!env.DATABASE_URL?.trim()) {
  console.error('\nDATABASE_URL is missing from chef-conn-backend/.env\n');
  process.exit(1);
}

const hasSupabaseKey =
  Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim()) ||
  Boolean(env.SUPABASE_ANON_KEY?.trim());

if (hasSupabaseKey) {
  console.log('Environment check passed. Starting backend with Supabase auth...\n');
} else {
  console.log(
    'Environment check passed. Starting backend in local auth mode (no Supabase API keys).\n',
  );
  console.log(
    'Tip: add SUPABASE_SERVICE_ROLE_KEY later for production-style auth.\n',
  );
}
