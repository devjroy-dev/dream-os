// db.ts — Supabase client for the engine.
// Uses the SERVICE-ROLE key, which bypasses RLS. The engine is trusted server
// code; it enforces scoping itself. Never expose this key to a browser.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'engine' },
});
