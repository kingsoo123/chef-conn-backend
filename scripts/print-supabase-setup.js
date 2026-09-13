#!/usr/bin/env node

const projectRef = 'rsmlksmttffjywqxzwdc';
const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/settings/api`;

console.log(`
Uber-chef backend setup
=========================

1. Open your Supabase API settings:
   ${dashboardUrl}

2. Copy ONE of these keys into chef-conn-backend/.env:
   - service_role  → SUPABASE_SERVICE_ROLE_KEY  (recommended for signup)
   - anon public   → SUPABASE_ANON_KEY           (works for local dev too)

3. Start the backend:
   npm run dev

Your .env should look like:

  SUPABASE_URL=https://${projectRef}.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

Never commit the service role key to git.
`);
