'use strict';
// scripts/lib/b150_ingress_probe.js · CE-46 · G6-4 · F-44.254 · b150 §11's arm: the REAL ingress (src/marketingIndex.js's app),
// its Supabase client replaced by the b137 double, driven over HTTP on an ephemeral port with one Meta body.
// usage: node scripts/lib/b150_ingress_probe.js '<json {rows, body}>'  -> one line of JSON: { status, rows, logs }
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://b150.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'b150';
process.env.DISABLE_META_SIGNATURE_CHECK = 'true'; // the ingress's own local kill-switch; the signature is not what this probes
const { makeDb } = require('./b137_pgdouble');
const input = JSON.parse(process.argv[2]);
const db = makeDb({ vendor_wabas: input.rows, vendor_wa_events: [], failed_turns: [] });
const sb = require.resolve('@supabase/supabase-js', { paths: [ROOT] });
require.cache[sb] = { id: sb, filename: sb, loaded: true, exports: { createClient: () => db } };
const logs = []; const keep = { log: console.log, warn: console.warn, error: console.error };
const cap = (...a) => logs.push(a.map(String).join(' ')); console.log = cap; console.warn = cap; console.error = cap;
const { app } = require(path.join(ROOT, 'src', 'marketingIndex.js'));
const srv = app.listen(0, async () => {
  let status = null;
  try {
    const r = await fetch(`http://127.0.0.1:${srv.address().port}/webhook/meta`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input.body) });
    status = r.status;
    await new Promise((s) => setTimeout(s, 700)); // the ingress answers 200 first and routes after
  } finally {
    srv.close(); Object.assign(console, keep);
    console.log(JSON.stringify({ status, rows: db.tables.vendor_wabas, events: db.tables.vendor_wa_events.length, logs: logs.filter((l) => /own-number|webhook:meta|forward/.test(l)) }));
    process.exit(0);
  }
});
