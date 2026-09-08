#!/usr/bin/env node
// scripts/b62_mutations.js — the both-ways half of b62. Each mutation edits
// PRODUCTION code in a scratch copy of the tree; the named cell must RED.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const MUT = [
  ['M1 the claim moves back above the gate (F-41.14 returns)', 'src/lib/vendor/paymentReminders.js',
    "  if (!gate.open)  return refuse(gate.reason, gate.reason_text);", "  ", 'a shut gate writes NO row'],
  ['M2 a failed send keeps holding the milestone', 'src/lib/vendor/paymentReminders.js',
    "status: 'failed', error_code: (err && err.code) || null,", "status: 'queued', error_code: (err && err.code) || null,", 'the milestone can be tried again'],
  ['M3 the success stops writing status', 'src/lib/vendor/paymentReminders.js',
    ".update({ wamid, status: 'sent', updated_at: new Date().toISOString() })", ".update({ wamid })", 'the same milestone is still sendable'],
  ['M4 the refusal stops logging (F-41.16 returns)', 'src/lib/vendor/paymentReminders.js',
    "    logWaSend(LANE, { site: `reminders:${source}`, mode: 'template', templateKey: TEMPLATE_KEY,", "    if (false) logWaSend(LANE, { site: `reminders:${source}`, mode: 'template', templateKey: TEMPLATE_KEY,", 'a refusal logs a REFUSED line'],
  ['M5 the register key leaks onto the glass (F-41.17 returns)', 'src/lib/vendor/paymentReminders.js',
    "  if (reason.startsWith(CAP_KEY)) return 'Reminders are switched off for now.';", "  ", 'the shut gate hands both'],
  ['M6 sendWa returns to its own grammar', 'src/lib/sendWa.js',
    "logWaSend(line, { site: site || 'sendWa:template', mode: 'template', templateKey, to, out: { sent: true, result: res } });",
    "console.log(`[sendWa:template] ${normalizeTo(to)} <- ${templateKey} (${res && res.wamid ? res.wamid : null}) [line=${line}]`);", 'sendWa logs its success through logWaSend'],
  ['M7 the sixth arm updates blind', 'src/lib/vendor/relayStatus.js',
    "        .select('id, vendor_id, milestone_id, invoice_id, status');", "        ;const _x=1;", 'the arm exists, is APPENDED'],
  ['M8 the sixth arm is made unreachable (the orphan return moves above it)', 'src/lib/vendor/relayStatus.js',
    "      // ── THE SIXTH HOME — public.payment_reminders (0139, receipts by 0152) ───",
    "      return { wamid, status: want, matched: 0, row: null, reason: 'no_row_for_sid' };\n      // ── THE SIXTH HOME — public.payment_reminders (0139, receipts by 0152) ───",
    'driven: a delivered receipt'],
  ['M9 the schedule door forgets the wamid again (F-41.15 returns)', 'src/api/vendor/invoiceSchedule.js',
    ".select('milestone_id, created_at, wamid, status')", ".select('milestone_id, created_at')", 'the door selects wamid and status'],
  ['M10 the notice sends without its gate', 'src/capabilitiesSweep.js',
    "  if (!cap.on(NOTICE_KEY)) {", "  if (false) {", 'the notice is itself gated'],
  ['M11 the notice grows a parameter', 'src/lib/templates.js',
    "    variables: [],\n    body: 'Meta approved your template.',", "    variables: ['what'],\n    body: 'Meta approved your template. {{1}}',", 'the payload carries NO parameters'],
  ['M12 the button becomes dynamic and the builder emits a component', 'src/lib/templates.js',
    "button: { type: 'url_static', index: 0, text: 'Open switchboard', url: 'https://thedreamwedding.in/admin/switchboard' },",
    "button: { type: 'url', index: 0, text: 'Open switchboard', base: 'https://thedreamwedding.in/admin/switchboard', variable: 'x' },", 'NO button component'],
  ['M13 a caller loses its REFUSED line (c-41.25 overreach)', 'src/lib/vendor/enquiryAlert.js',
    "      templateKey: entry.templateKey, to: toPhone, err: tErr, ctx,",
    "      templateKey: entry.templateKey, to: toPhone, ctx,", 'lost its REFUSED line'],
  ['M14 R-41.59 relaxes to every row (the guarantee dies)', 'db/migrations/0152_payment_reminders_receipts.sql',
    "  on public.payment_reminders (milestone_id, kind) where status <> 'failed';", "  on public.payment_reminders (milestone_id, kind) where status <> 'queued';", 'the once-per-milestone key is relaxed'],
];
let bad = 0;
for (const [id, file, from, to, frag] of MUT) {
  const scratch = fs.mkdtempSync('/tmp/b62m-');
  execSync(`cp -r ${ROOT}/src ${ROOT}/db ${ROOT}/scripts ${ROOT}/package.json ${scratch}/ && ln -s ${ROOT}/node_modules ${scratch}/node_modules`);
  const p = path.join(scratch, file); const s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) { console.log(`  ??     ${id} — target matched ${n} times`); bad++; fs.rmSync(scratch, { recursive: true, force: true }); continue; }
  fs.writeFileSync(p, s.replace(from, to));
  let out = '';
  try { out = execSync(`B62_ROOT=${scratch} node ${scratch}/scripts/b62_g34_s2_bench.js 2>&1`).toString(); }
  catch (e) { out = (e.stdout || '').toString() + (e.stderr || '').toString(); }
  const red = out.split('\n').filter(l => l.startsWith('  FAIL') && l.includes(frag));
  if (red.length) console.log(`  RED-OK ${id} → ${red[0].trim().slice(0, 88)}`); else { console.log(`  HOLLOW ${id}`); bad++; }
  fs.rmSync(scratch, { recursive: true, force: true });
}
console.log(`\n${MUT.length - bad}/${MUT.length} mutations RED as named`);
process.exit(bad ? 1 : 0);
