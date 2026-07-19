#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b5_wa_door_smoke.js — TDW_05 Block 05, Sitting 1 (F-04.65) · LIVE SEAL.
//
// The desk bench (scripts/b5_wa_door_bench.js, 32/32) proves the three write-path
// verdicts through the WA door against an in-memory harness. This smoke proves the
// SAME three against the REAL Supabase schema/RLS — the one thing the harness cannot:
// that the live checker, over real columns and real constraints, still refuses a
// book onto a block and a full slot, and still lets an appointment overlap land with
// a heads-up beside it. It drives the REAL door functions in calendarSignals.js.
//
// ── IT DOES NOT REOPEN THE PORT ── calendarSignals.js is 0-line. This is a new
// script under scripts/, a sibling to the bench and checker_bench.
//
// ── LIVE-DB SAFETY — THE LOAD-BEARING PART (§3 of the kickoff) ──────────────
// A smoke that poisons prod is a failed session. So:
//   · ISOLATED THROWAWAY VENDOR. One clearly-marked test user + vendor
//     (business_name = MARK, phone = MARK_PHONE — sentinels no real onboarding can
//     mint). Every seed and every door call uses that vendor's id ALONE. No real
//     vendor's rows are read, written, or resolved against.
//   · agentId IS NULL, DELIBERATELY. The booking path's ONLY cross-table resolve
//     (resolveBinderForBooking, eventWrite.js:537 — `records` by agent_id) is gated
//     on `agentId` being truthy. Passing null skips it entirely: the smoke reads and
//     writes NOTHING outside its own test vendor's `events` + `vendor_activity_log`.
//     The three verdicts do not depend on agentId (checkOccupancy never reads it), so
//     the witness is complete regardless.
//   · SELF-CLEANING FINALLY. The run is wrapped in try/finally; finally hard-deletes
//     every row the smoke created (activity-log → events → vendor → user), by CAPTURED
//     ID, so it cleans even if an assertion throws. FK is on delete cascade at each
//     hop (events→vendors, vendor_activity_log→vendors, vendors→users), so the deletes
//     are also belt-and-suspenders; we do them explicitly rather than trust cascade.
//   · IDEMPOTENT. On start it purges any residue from a prior run (by marker), so it
//     is safe to run twice back-to-back. It ends with a residue check that must read 0.
//   · WRITES ONLY UNDER THE TEST VENDOR. If isolation cannot hold (e.g. a unique
//     constraint forces a real-data touch), it STOPS and reports — it never works
//     around a constraint against production.
//
// ── THE ONE DOUBLE ── executeAndPatch (the engine binder hop) is stubbed via
//    require.cache, exactly as the bench does. It is NEVER CALLED on these inputs
//    (mutateEvents' e→b leg is gated on ev.linked_binder_id, and no seed carries a
//    binder), and its real module top-requires ../engine/dist/* — stubbing lets the
//    smoke load without a built engine. Nothing under test is stubbed: writeEvent,
//    checkOccupancy, resolveEvent, logActivity's real vendor_activity_log write, and
//    the Supabase client are all live.
//
// RUN (founder, with live keys — the CE gates the safety at origin first):
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/b5_wa_door_smoke.js
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// ── ENV GUARD, BEFORE anything touches the client ──────────────────────────
// createClient(undefined, …) throws inside supabase-js; we want a clean STOP with a
// message the founder can act on, and we must not proceed a single step without keys.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('STOP — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('This smoke writes to a live database; it refuses to run without explicit service-role keys.');
  process.exit(3);
}

// ── The one double: the engine binder hop, never reached on these inputs ────
const eapPath = path.join(ROOT, 'src/lib/executeAndPatch.js');
require.cache[eapPath] = { id: eapPath, filename: eapPath, loaded: true,
  exports: { executeAndPatch: async () => ({ ok: true }) } };

const { supabase } = require(path.join(ROOT, 'src/lib/supabase.js')); // the REAL service client
const cal          = require(path.join(ROOT, 'src/lib/vendor/calendarSignals.js'));
const { scrubText } = require(path.join(ROOT, 'src/lib/vendor/scrub.js')); // pure fn; the door's seam

// ── markers — deliberately impossible for real data ────────────────────────
const MARK       = '__WA_SMOKE_VENDOR__';
const MARK_PHONE = '__WA_SMOKE_USER__::do-not-onboard';
const AG         = null; // see the safety header — tightest isolation, verdicts unaffected

// tool-call envelope, identical shape to the bench / the real WA turn
const tc = (name, input) => ({ tool_calls: [{ name, input, donna_calls: [] }] });

// ── tiny reporter ──────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) { if (cond) { pass++; console.log('    ✓ ' + label); } else { fail++; fails.push(label); console.log('    ✗ ' + label); } }

// live (non-cancelled, non-deleted) events under a vendor
async function liveEvents(vendorId) {
  const { data, error } = await supabase
    .from('events').select('id, title, event_date, event_time, kind, slot, state, deleted_at')
    .eq('vendor_id', vendorId).is('deleted_at', null).neq('state', 'cancelled');
  if (error) throw new Error('liveEvents read failed: ' + error.message);
  return data || [];
}
async function seedEvent(vendorId, row) {
  const { data, error } = await supabase
    .from('events').insert({ vendor_id: vendorId, state: 'upcoming', ...row })
    .select('id, title, event_date, event_time, kind, slot').single();
  if (error) throw new Error('seed insert failed (' + (row.title || '?') + '): ' + error.message);
  return data;
}

// ── idempotent purge: remove any residue a prior run left, by marker ────────
async function purgeResidue() {
  const { data: vs, error } = await supabase.from('vendors').select('id, user_id').eq('business_name', MARK);
  if (error) throw new Error('residue scan failed: ' + error.message);
  for (const v of (vs || [])) {
    await supabase.from('vendor_activity_log').delete().eq('vendor_id', v.id);
    await supabase.from('events').delete().eq('vendor_id', v.id);
    await supabase.from('vendors').delete().eq('id', v.id);
    if (v.user_id) await supabase.from('users').delete().eq('id', v.user_id);
  }
  // any orphaned marker user with no vendor
  await supabase.from('users').delete().eq('phone', MARK_PHONE);
}

// ── seed the isolated user + vendor (photographer = event vendor, capacity 1) ─
async function seedVendor() {
  const { data: u, error: ue } = await supabase
    .from('users').insert({ phone: MARK_PHONE, name: MARK }).select('id').single();
  if (ue) {
    // A live user already holds the sentinel phone. That should be impossible; if it
    // happens we STOP rather than touch a row we did not create.
    throw new Error('STOP — could not mint the isolated test user (phone conflict?): ' + ue.message);
  }
  const { data: v, error: ve } = await supabase
    .from('vendors').insert({ user_id: u.id, business_name: MARK, category: 'photographer', slot_capacity: 1 })
    .select('id').single();
  if (ve) {
    await supabase.from('users').delete().eq('id', u.id); // undo the user before bailing
    throw new Error('STOP — could not mint the isolated test vendor: ' + ve.message);
  }
  return { userId: u.id, vendorId: v.id };
}

async function main() {
  console.log('WA-door verdict smoke — live Supabase. Isolated test vendor only; self-cleaning.\n');
  await purgeResidue(); // idempotent: safe to run twice
  const { userId, vendorId } = await seedVendor();
  const vendor = { id: vendorId };
  console.log('seeded isolated vendor ' + vendorId + ' (user ' + userId + ')\n');

  try {
    // ══════════════════════════════════════════════════════════════════════
    // CASE 1 · date_blocked — a REFUSAL. Book onto a blocked date: write nothing,
    //          the block sentence rides out on conflictLines.
    // ══════════════════════════════════════════════════════════════════════
    {
      const D = '2027-01-05';
      await seedEvent(vendorId, { title: 'SMOKE block', kind: 'blocked', slot: 'full_day', event_date: D });
      const before = (await liveEvents(vendorId)).length;
      const out = await cal.bookEvents(supabase, vendor, AG,
        tc('donna_book_event', { title: 'SMOKE Meera', event_date: D, kind: 'shoot' }));
      const conf = out && out.refused && out.refused[0] && out.refused[0].conflict;
      const line = out && out.refused ? cal.conflictLines(out.refused) : '';
      const after = (await liveEvents(vendorId)).length;
      console.log('── CASE 1 · date_blocked ──');
      console.log('    verdict.kind : ' + (conf && conf.kind));
      console.log('    surfaced     : ' + JSON.stringify(line));
      console.log('    rows before/after: ' + before + '/' + after);
      ok(out && out.refused && out.refused.length === 1 && out.booked.length === 0, 'refused, booked nothing');
      ok(after === before, 'WROTE NOTHING (no bypass)');
      ok(conf && conf.kind === 'date_blocked', 'verdict kind is date_blocked');
      ok(!!line && line === scrubText(conf.message) && /block/i.test(line), 'block sentence rides out verbatim (through the seam)');
      console.log('');
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASE 2 · capacity — a REFUSAL. slot_capacity=1, one shoot already held; a
    //          second shoot on the date is full: write nothing, "is full / 1 of 1".
    // ══════════════════════════════════════════════════════════════════════
    {
      const D = '2027-01-06';
      await seedEvent(vendorId, { title: 'SMOKE Isha', kind: 'shoot', event_date: D }); // no time → full_day, holds every slot
      const before = (await liveEvents(vendorId)).length;
      const out = await cal.bookEvents(supabase, vendor, AG,
        tc('donna_book_event', { title: 'SMOKE Devi', event_date: D, kind: 'shoot' }));
      const conf = out && out.refused && out.refused[0] && out.refused[0].conflict;
      const line = out && out.refused ? cal.conflictLines(out.refused) : '';
      const after = (await liveEvents(vendorId)).length;
      console.log('── CASE 2 · capacity ──');
      console.log('    verdict.kind : ' + (conf && conf.kind));
      console.log('    surfaced     : ' + JSON.stringify(line));
      console.log('    rows before/after: ' + before + '/' + after);
      ok(out && out.refused && out.refused.length === 1 && out.booked.length === 0, 'refused, booked nothing');
      ok(after === before, 'WROTE NOTHING (no bypass)');
      ok(conf && conf.kind === 'capacity', 'verdict kind is capacity');
      ok(!!line && line === scrubText(conf.message) && /is full/.test(line) && /1 of 1/.test(line),
         'the full-slot sentence rides out verbatim');
      console.log('');
    }

    // ══════════════════════════════════════════════════════════════════════
    // CASE 3 · appointment_overlap — an ADVISORY, NOT a refusal. The write LANDS;
    //          the heads-up rides BESIDE the success. Witnessed on the EDIT path
    //          (the book path drops ok:true advisories, faithful to chat.js), by
    //          editing a trial onto a date+slot a shoot already holds.
    // ══════════════════════════════════════════════════════════════════════
    {
      const D = '2027-01-07';
      await seedEvent(vendorId, { title: 'SMOKE Zara', kind: 'shoot', event_date: D, event_time: '10:00' });   // holds morning
      const trial = await seedEvent(vendorId, { title: 'SMOKE Kiran', kind: 'trial', event_date: '2027-01-04', event_time: '10:00' });
      const done = await cal.mutateEvents(supabase, vendor, AG,
        tc('donna_edit_event', { event_id: trial.id, event_date: D, event_time: '10:00' }));
      const m = done && done[0];
      const advised = (done || []).filter(x => x && x.ok && x.conflict);
      const line = cal.advisoryLines(advised);
      const moved = (await liveEvents(vendorId)).find(e => e.id === trial.id);
      console.log('── CASE 3 · appointment_overlap ──');
      console.log('    verdict.kind : ' + (m && m.conflict && m.conflict.kind));
      console.log('    surfaced     : ' + JSON.stringify(line));
      console.log('    row landed?  : ' + (moved && moved.event_date === D ? 'YES — moved onto ' + D : 'NO'));
      ok(m && m.ok === true, 'an advisory NEVER blocks — the edit landed');
      ok(moved && moved.event_date === D, 'the row actually moved onto the shared date');
      ok(m && m.conflict && m.conflict.kind === 'appointment_overlap', 'verdict kind is appointment_overlap');
      ok(!!line && line === scrubText(m.conflict.message) && /Heads up/.test(line) && /morning/.test(line),
         'the heads-up rides beside the success verbatim');
      console.log('');
    }
  } finally {
    // ── self-cleaning: hard-delete everything the smoke created, by captured id ──
    await supabase.from('vendor_activity_log').delete().eq('vendor_id', vendorId);
    await supabase.from('events').delete().eq('vendor_id', vendorId);
    await supabase.from('vendors').delete().eq('id', vendorId);
    await supabase.from('users').delete().eq('id', userId);

    // ── residue check: the DB must be byte-clean whether we passed or failed ──
    const { data: rv } = await supabase.from('vendors').select('id').eq('business_name', MARK);
    const { data: ru } = await supabase.from('users').select('id').eq('phone', MARK_PHONE);
    const { data: re } = await supabase.from('events').select('id').eq('vendor_id', vendorId);
    const clean = (!rv || rv.length === 0) && (!ru || ru.length === 0) && (!re || re.length === 0);
    console.log('cleanup: vendors=' + ((rv || []).length) + ' users=' + ((ru || []).length) + ' events=' + ((re || []).length) +
                ' → ' + (clean ? 'DB BYTE-CLEAN ✓' : 'RESIDUE REMAINS ✗'));
    if (!clean) { fail++; fails.push('post-run residue check (DB not clean)'); }
  }

  console.log('\n══ ' + pass + '/' + (pass + fail) + ' PASS ══');
  if (fail) { console.log('RED — failing checks:'); fails.forEach(f => console.log('   · ' + f)); process.exit(1); }
  console.log('GREEN — three live verdicts witnessed; DB left byte-clean.');
}

main().catch((e) => { console.error('\nSMOKE ERROR', e && e.message ? e.message : e); process.exit(2); });
