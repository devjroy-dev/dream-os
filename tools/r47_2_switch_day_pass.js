// tools/r47_2_switch_day_pass.js · TDW · CE-47 · WEB-4 cut 30 · R-47.2 SWITCH DAY, STEP C. (In tools/, NOT scripts/: the floor runs every scripts/*.js, and this must never run except by hand.)
// After 0223 and the code are live: the safety pass on the pictures 0223 left 'unchecked' (the 5 that waited and the
// 14 that were rejected, on 8 October's count). It is the sweep's own code (src/lib/vendor/safetyCheck.js), called
// once by hand so the founder sees the result at once instead of waiting up to 15 minutes for the cron.
// It ends with every picture 'passed' or 'held' (unless Google could not answer for one; the cron retries those).
//   RUN, in the dream-os codespace, from the repo root, with production's environment:
//     railway run node tools/r47_2_switch_day_pass.js
// It prints counts only (no address, no key). It needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GOOGLE_VISION_API_KEY.
'use strict';
const path = require('path');

async function main(deps) {
  const d = deps || {};
  const env = d.env || process.env;
  for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_VISION_API_KEY']) if (!env[k]) throw new Error(`STOP - ${k} is not set. Run it with: railway run node tools/r47_2_switch_day_pass.js`);
  const sb = d.supabase || require('@supabase/supabase-js').createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const sweep = require(path.join(__dirname, '..', 'src', 'lib', 'vendor', 'safetyCheck')).sweep;
  const log = d.log || console.log;
  const out = await sweep(sb, d.safetyDeps);
  log(`R-47.2 switch-day safety pass: scanned ${out.scanned} · passed ${out.passed} · held ${out.held} · still unchecked ${out.still_unchecked}`);
  log(out.still_unchecked ? 'Some pictures could not be checked now. The 15-minute sweep checks them again.' : 'Every picture is now passed or held.');
  return out;
}

module.exports = { main };
if (require.main === module) main().catch((e) => { console.log(String(e.message || e)); process.exit(1); });
