#!/usr/bin/env node
// scripts/b61_mutations.js — the both-ways half of b61: each mutation edits PRODUCTION
// code in a scratch copy of the tree and the named cell must RED (F-40.216: a bench
// that cannot go red is hollow). Targets are unique strings (F-40.191's first-match trap).
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const MUT = [
  // [id, file, from, to, must-red cell fragment]
  ['M1 re-introduce an env read at a door', 'src/lib/vendor/reviewAsk.js',
    "const flagOn   = cap.on(CAP_KEY);", "const flagOn   = String(process.env.REVIEW_ASK_SEND_ENABLED || '') === '1';", 'no process.env.REVIEW_ASK_SEND_ENABLED read'],
  ['M2 on() answers true for status=armed', 'src/lib/capabilities.js',
    "return !!row && row.status === 'on';", "return !!row && (row.status === 'on' || row.status === 'armed');", 'on() is true only for status=on'],
  ['M3 the disarm arm dropped', 'src/lib/capabilities.js',
    "if (row.status === 'on') { after = 'off'; disarmed = true;", "if (false) { after = 'off'; disarmed = true;", 'REJECTED template disarms'],
  ['M4 auto_on without walk_ref', 'src/lib/capabilities.js',
    "row.auto_on === true && row.walk_ref) {", "row.auto_on === true) {", 'refused without walk_ref'],
  ['M5 flip on from pending allowed', 'src/lib/capabilities.js',
    "!['armed', 'approved', 'on', 'off'].includes(row.status)", "!['armed', 'approved', 'on', 'off', 'pending'].includes(row.status)", 'flip on refuses a pending row'],
  ['M6 DISABLED mapped to approved', 'src/capabilitiesSweep.js',
    "if (w === 'REJECTED' || w === 'DISABLED') return 'rejected';", "if (w === 'REJECTED') return 'rejected';\n  if (w === 'DISABLED') return 'approved';", 'mapping (R-41.36)'],
  ['M7 substring match on template name', 'src/capabilitiesSweep.js',
    "body.data.filter((t) => t && t.name === name)", "body.data.filter((t) => t && String(t.name).startsWith(name))", 'matches the exact name'],
  ['M8 the notice goes live early', 'src/capabilitiesSweep.js',
    "  console.log(`[capabilities] founder notice (withheld until tdw_capability_armed): ${line}`);", "  await require('./lib/metaCloud').sendMetaTemplate({ to: process.env.ADMIN_PHONE, payload: { name: 'x' } }).catch(() => {});", 'founder notice is WITHHELD'],
  ['M9 a second reader of the table', 'src/capabilitiesSweep.js',
    "    await cap.touch(row.key, { evidence: reading.evidence }, { supabase });", "    await supabase.from('capabilities').update({ evidence: reading.evidence }).eq('key', row.key);", 'touches the capabilities table'],
  ['M10 a door goes synchronous again', 'src/lib/vendor/referralAlert.js',
    "async function sendGate() {\n  const flagOn = cap.on(CAP_KEY);", "function sendGate() {\n  const flagOn = false;", 'every sendGate/consentSendGate in the four vendor libs is async'],
  ['M11 the listing reads one page and stops', 'src/capabilitiesSweep.js',
    "url = body.paging && body.paging.next ? body.paging.next : null;", "url = null;", 'follows paging.next to the end'],
  ['M12 the listing door gains a writer', 'src/api/admin/capabilities.js',
    "  const r = await sweep.listWabaTemplates();", "  const r = await sweep.listWabaTemplates(); await cap.touch('flag.wedding_reel', { evidence: 'x' }).catch(() => {});", 'only reads (no cap writer called)'],
];
const only = process.argv[2] ? Number(process.argv[2]) : null;
let bad = 0;
for (let i = 0; i < MUT.length; i++) {
  if (only && only !== i + 1) continue;
  const [id, file, from, to, cellFrag] = MUT[i];
  const scratch = fs.mkdtempSync('/tmp/b61m-');
  execSync(`cp -r ${ROOT}/src ${ROOT}/scripts ${ROOT}/package.json ${scratch}/ && ln -s ${ROOT}/node_modules ${scratch}/node_modules`);
  const p = path.join(scratch, file); const s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) { console.log(`  ??     ${id} — target matched ${n} times (must be 1)`); bad++; continue; }
  fs.writeFileSync(p, s.replace(from, to));
  let out = '';
  try { out = execSync(`B61_ROOT=${scratch} node ${ROOT}/scripts/b61_switchboard_bench.js 2>&1`).toString(); }
  catch (e) { out = e.stdout.toString(); }
  const red = out.split('\n').filter((l) => l.startsWith('  RED') && l.includes(cellFrag));
  if (red.length) console.log(`  RED-OK ${id} → ${red[0].trim().slice(0, 100)}`); else { console.log(`  HOLLOW ${id} — bench stayed green`); bad++; }
  fs.rmSync(scratch, { recursive: true, force: true });
}
console.log(`\n${MUT.length - bad}/${MUT.length} mutations RED as named`);
process.exit(bad ? 1 : 0);
