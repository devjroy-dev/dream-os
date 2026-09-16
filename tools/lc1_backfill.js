#!/usr/bin/env node
'use strict';
// tools/lc1_backfill.js — CE-43 · LC-1 · F7(b). THE EXISTING ROWS, THROUGH THE ONE WRITERS.
//
// WHY IT EXISTS (F-43.21). LC-1's seam fires after a turn, and the invoice cure fires
// at the next mint. Neither touches a row that already stands, so Dholakia (binder
// e6aacb34) would never reach Events and TDW/DEV440/09 would never show a due date.
// The chair refused a hidden write on the read path (F7(c)) and refused founder SQL
// into public.events (it bypasses the one writer). This script is the ruled shape.
//
// WHAT IT DOES, for ONE vendor named by routing handle:
//   1. Resolves the vendor's agent READ-ONLY (public.users -> engine.users ->
//      engine.agents). It never creates an agent; zero or two agents is a STOP.
//   2. Events: every live, dated binder on that agent whose stage is a booking stage
//      and that has no live linked event gets one, through
//      src/lib/vendor/bookingEvent.js::ensureForBinders, which writes ONLY through
//      writeEvent (kind ceremony, title `<client> · wedding`, founder YES 2026-09-16).
//   3. Invoices: for those same binders, every live, uncancelled invoice keyed to the
//      binder with due_date NULL gets due_date = the binder's followup_on, through
//      src/lib/vendor/invoices.js::updateInvoice ONLY. updateInvoice's own lock stands:
//      an invoice with a payment is refused and printed, never forced.
//   4. Prints every row it touched or refused. Running it twice touches nothing the
//      second time (idempotent by predicate: linked events are skipped, filled due
//      dates are no longer NULL).
//
// DRY RUN BY DEFAULT. Nothing is written without --live.
// It refuses to run unless the tree is clean, HEAD equals origin/main, the LC-1 cut
// tip is an ancestor of HEAD, and the seam file is tracked at HEAD.
//
// Credentials come from the shell, or from a gitignored repo-root .env, under the same
// two names src/index.js reads (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Nothing is
// printed from them.
//
// Usage:  node tools/lc1_backfill.js --handle DEV440          (dry run)
//         node tools/lc1_backfill.js --handle DEV440 --live   (writes)

if (!globalThis.WebSocket) globalThis.WebSocket = require('ws');
const path = require('path');
const { execFileSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// The dream-os tip this packet was cut on. The packet's own commit sits on top of it.
const LC1_CUT = '8806acc1fa3b308f666388478f276fde9bc847fe';
const ROOT = path.join(__dirname, '..');
// A gitignored repo-root .env is read if present; the shell's own values win. Nothing is printed from it.
try { require('dotenv').config({ path: path.join(ROOT, '.env'), override: false }); } catch (_) { /* dotenv absent: the shell is the only source */ }

const argv = process.argv.slice(2);
const LIVE = argv.includes('--live');
const hIdx = argv.indexOf('--handle');
const HANDLE = hIdx >= 0 ? String(argv[hIdx + 1] || '').trim() : '';
const say = (...a) => console.log(...a);

function stop(msg) {
  say('');
  say('  STOP — PRECONDITION FAILED');
  say(`  ${msg}`);
  say('  Nothing was written. Paste this whole output back before anything else.');
  process.exit(1);
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function guardTree() {
  try { git(['fetch', '-q', 'origin']); } catch (e) { stop(`git fetch failed: ${e.message}`); }
  const dirt = git(['status', '--porcelain']);
  if (dirt) stop(`the tree is not clean:\n${dirt}`);
  const head = git(['rev-parse', 'HEAD']);
  const origin = git(['rev-parse', 'origin/main']);
  if (head !== origin) stop(`HEAD ${head} is not origin/main ${origin}. Pull or push first.`);
  try { execFileSync('git', ['merge-base', '--is-ancestor', LC1_CUT, 'HEAD'], { cwd: ROOT, stdio: 'ignore' }); }
  catch (_) { stop(`the LC-1 cut ${LC1_CUT} is not an ancestor of HEAD ${head}.`); }
  try { git(['cat-file', '-e', 'HEAD:src/lib/vendor/bookingEvent.js']); }
  catch (_) { stop('src/lib/vendor/bookingEvent.js is not committed at HEAD. The LC-1 packet is not applied.'); }
  return head;
}

(async () => {
  if (!HANDLE) stop('give the vendor handle: --handle <ROUTING_HANDLE>');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) stop('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in this shell.');
  const head = guardTree();

  const { ensureForBinders, isBookingStage } = require('../src/lib/vendor/bookingEvent');
  const { updateInvoice } = require('../src/lib/vendor/invoices');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const eng = db.schema('engine');

  say('');
  say('════════════════════════════════════════════════════════════');
  say(`  LC-1 BACK-FILL — ${LIVE ? '*** LIVE RUN — THIS WILL WRITE ***' : 'DRY RUN (no writes)'}`);
  say(`  tree ${head}`);
  say('════════════════════════════════════════════════════════════');

  // ── 1 · vendor and agent, read-only ────────────────────────────────────────
  const { data: vendors, error: vErr } = await db.from('vendors')
    .select('id, user_id, business_name, routing_handle').eq('routing_handle', HANDLE);
  if (vErr) stop(`vendor read failed: ${vErr.message}`);
  if (!vendors || vendors.length !== 1) stop(`expected one vendor with handle ${HANDLE}, found ${vendors ? vendors.length : 0}.`);
  const vendor = vendors[0];
  const { data: pu, error: puErr } = await db.from('users').select('auth_user_id').eq('id', vendor.user_id).maybeSingle();
  if (puErr || !pu || !pu.auth_user_id) stop(`vendor ${vendor.id} has no auth identity on public.users.`);
  const { data: eu, error: euErr } = await eng.from('users').select('id').eq('auth_user_id', pu.auth_user_id);
  if (euErr || !eu || eu.length !== 1) stop(`expected one engine.users row for the vendor, found ${eu ? eu.length : 0}.`);
  const { data: ags, error: agErr } = await eng.from('agents').select('id').eq('user_id', eu[0].id);
  if (agErr || !ags || ags.length !== 1) stop(`expected one engine.agents row for the vendor, found ${ags ? ags.length : 0}.`);
  const agentId = ags[0].id;
  say(`  vendor ${vendor.id} (${vendor.routing_handle}) · agent ${agentId}`);

  // ── 2 · events ─────────────────────────────────────────────────────────────
  const ev = await ensureForBinders(db, vendor, agentId, null, { surface: 'pwa', source: 'crud', dryRun: !LIVE });
  say('');
  say('  EVENTS');
  for (const c of ev.created) say(`    ${LIVE ? (c.deduped ? 'LINKED ' : 'CREATED') : 'WOULD CREATE'}  binder ${c.binder_id}  "${c.title}"  ${c.event_date}${c.event_id ? '  event ' + c.event_id : ''}`);
  for (const s of ev.skipped) say(`    SKIPPED  binder ${s.binder_id}  "${s.title}"  (${s.reason})`);
  for (const r of ev.refused) say(`    REFUSED  "${r.title}"  ${r.conflict && r.conflict.message}`);
  for (const e of ev.errors)  say(`    ERROR    binder ${e.binder_id}  ${e.error}`);
  if (!ev.created.length && !ev.skipped.length && !ev.refused.length && !ev.errors.length) say('    none qualify');

  // ── 3 · invoices ───────────────────────────────────────────────────────────
  const { data: binders, error: bErr } = await eng.from('records')
    .select('id, client, date, stage, hidden, followup_on')
    .eq('agent_id', agentId).eq('hidden', false).not('followup_on', 'is', null);
  if (bErr) stop(`binder read failed: ${bErr.message}`);
  const due = new Map((binders || []).filter((b) => isBookingStage(b.stage) && b.date).map((b) => [b.id, b.followup_on]));
  say('');
  say('  INVOICES');
  if (!due.size) { say('    no qualifying binder carries a follow-up date'); }
  else {
    const { data: invs, error: iErr } = await db.from('invoices')
      .select('id, invoice_number, binder_id, due_date, amount_paid, state')
      .eq('vendor_id', vendor.id).in('binder_id', [...due.keys()])
      .is('due_date', null).is('deleted_at', null).neq('state', 'cancelled');
    if (iErr) stop(`invoice read failed: ${iErr.message}`);
    if (!invs || !invs.length) say('    none with a missing due date');
    for (const inv of (invs || [])) {
      const d = due.get(inv.binder_id);
      if (!LIVE) { say(`    WOULD SET  ${inv.invoice_number}  due_date ${d}  (binder ${inv.binder_id})`); continue; }
      const r = await updateInvoice(db, vendor.id, inv.id, { due_date: d });
      if (r && r.ok) say(`    SET      ${inv.invoice_number}  due_date ${d}  (binder ${inv.binder_id})`);
      else say(`    REFUSED  ${inv.invoice_number}  ${(r && (r.code || r.error)) || 'refused'}`);
    }
  }

  say('');
  say(LIVE ? '  DONE. Paste this whole output back.' : '  DRY RUN DONE. Nothing was written. Paste this whole output back.');
  process.exit(0);
})().catch((e) => stop(e && e.message ? e.message : String(e)));
