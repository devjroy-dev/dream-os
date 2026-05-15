// src/lib/supabase.js — shared Supabase client for bride-side modules
//
// Pattern mirrors vendor side (src/index.js lines 22-24). Same env vars,
// same options, same service role key. Pointing at the same Supabase
// project (nvzkbagqxbysoeszxent). Two clients, one database — Postgres
// doesn't care.
//
// Imported by: brideSystemPrompt.js, coupleIdentity.js, brideOnboarding.js,
//              brideEngine.js, and any future bride-side module that talks
//              to the DB without holding a per-request handle.
//
// Vendor side is unchanged. Vendor src/index.js keeps its inline client.

const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});

module.exports = { supabase };
