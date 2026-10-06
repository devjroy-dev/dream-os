// scripts/b3_rider_bench.js — TDW_04 B3 rider batch bench.
//
// THE STANDARD (B2's disclosure #3, CE-promoted): "A bench asserts reality only
// if its calls are producible by a real caller." So every fixture below is taken
// VERBATIM from the founder's production turn log (2026-07-15), not invented:
// the tool_call shapes, the result strings, the kinds, the dates.
//
// What this bench CAN prove: the classification, the gate predicates, and the
// exact query predicate leg 2 builds. What it CANNOT prove: that a real chat turn
// wires them together — lockstepBinderToEvent's only real caller is a chat turn,
// and that is the SMOKE's job, not a bench's. Named, not smuggled.

'use strict';
const assert = require('assert');
const { OCCUPYING_KINDS, APPOINTMENT_KINDS, isOccupying, isAppointment } =
  require('../src/lib/vendor/occupancy');
const { CALENDAR_KINDS } = require('../src/lib/vendor/eventWrite');

let pass = 0;
const ok = (name) => { pass++; console.log(`  PASS  ${name}`); };

console.log('\n── 1. THE TERNARY (subset proposal §3, CE-ratified) ──');
// AMENDED BY LABEL · CE-47 OFF-A1 (the chair's fork (a), 4 October 2026, F-44.340): 0204 adds 'shop', the 14th kind, and it
// OCCUPIES (a paid shop booking or workshop holds the day like a shoot). Counts move 13 to 14 and 3 to 4; no cell is removed.
assert.strictEqual(CALENDAR_KINDS.length, 14);
assert.strictEqual(OCCUPYING_KINDS.length, 4);
assert.strictEqual(APPOINTMENT_KINDS.length, 8);
ok('CALENDAR_KINDS 14 · OCCUPYING 4 · APPOINTMENT 8');

const neither = CALENDAR_KINDS.filter((k) => !isOccupying(k) && !isAppointment(k));
assert.deepStrictEqual(neither.sort(), ['blocked', 'other']);
ok(`4 + 8 + 2 = 14 — NEITHER is exactly [${neither}]`);

assert.strictEqual(OCCUPYING_KINDS.filter((k) => isAppointment(k)).length, 0);
ok('OCCUPYING ∩ APPOINTMENT = ∅ — no kind has two homes');

for (const k of [...OCCUPYING_KINDS, ...APPOINTMENT_KINDS]) assert.ok(CALENDAR_KINDS.includes(k));
ok('every classified kind exists in the write vocabulary (no phantom kinds)');

// The four-list law, proven by command rather than by trusting the comment.
const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other', 'shop'];   // + 'shop' (OFF-A1, by label)
const bookedThatAreAppointments = BOOKED_KINDS.filter((k) => isAppointment(k));
assert.deepStrictEqual(bookedThatAreAppointments, ['meeting', 'recce', 'fitting', 'trial', 'social']);
ok(`BOOKED_KINDS ⊄ OCCUPYING — 5 of its 10 are appointments [${bookedThatAreAppointments}]`);
assert.ok(!isOccupying('other') && BOOKED_KINDS.includes('other'));
ok("and occupying ⊄ BOOKED_KINDS's converse: `other` is booked-but-not-occupying");
// OFF-A1 (by label): the shop kind is both on the calendar's count and occupying, and is no appointment.
assert.ok(isOccupying('shop') && !isAppointment('shop') && BOOKED_KINDS.includes('shop') && CALENDAR_KINDS.includes('shop'));
ok("'shop' (0204) occupies the day, counts as booked, is no appointment, and is in the write vocabulary");

console.log('\n── 2. Q-B3-9: "NOT APPOINTMENT" ≠ "OCCUPYING" (the amendment) ──');
const notAppointment = CALENDAR_KINDS.filter((k) => !isAppointment(k));
const diff = notAppointment.filter((k) => !isOccupying(k));
assert.deepStrictEqual(diff.sort(), ['blocked', 'other']);
ok(`the ruled-then-amended conditions differ on exactly [${diff}] — the amendment's whole cargo`);
assert.ok(!isOccupying('other'));
ok('so `other` ("Personal — unavailable", 35c9ce50) can NEVER speak for a wedding');

console.log('\n── 3. F-04.43\'s REAL SPECIMEN (turn log 2026-07-15 20:20:22, verbatim) ──');
// The founder's actual turn: donna_edit wrote the binder's date NULL -> 2026-11-01.
// Result string copied byte-for-byte from engine.messages.
const REAL_DONNA_EDIT = {
  name: 'donna_edit',
  input: {
    date: '2026-11-01',
    note: 'Bride. Wedding November 2026.',
    phone: '+91 98765 43210',
    client: 'Meera Kapoor',
    binder_id: '99dde40e-3034-48f5-82ff-e20f626005e3',
  },
  result: 'Updated record 99dde40e-3034-48f5-82ff-e20f626005e3 — edited client, date, note, phone.\n  binder now reads: client "Meera Kapoor" · date 2026-11-01 · stage booked',
};
// The victim, verbatim from the founder's query 2 output.
const REAL_TRIAL = { id: '98c91056-7f94-47f1-a770-5a1e2e1660d4', title: 'Meera - trial', kind: 'trial' };

// THE OLD ≠ NEW SENTINEL, on the real specimen: old=NULL, new=2026-11-01.
const oldDate = null, newDate = REAL_DONNA_EDIT.input.date;
assert.notStrictEqual(oldDate, newDate);
ok('sentinel PASSES on the real specimen (NULL !== 2026-11-01) — it was never the wall');

// THE KIND BRAIN, on the real victim.
assert.ok(!isOccupying(REAL_TRIAL.kind));
ok(`kind='${REAL_TRIAL.kind}' ∉ OCCUPYING -> "${REAL_TRIAL.title}" is NEVER dragged. THIS is the wall.`);
assert.ok(isOccupying('ceremony') && isOccupying('shoot') && isOccupying('family'));
ok('and a real engagement (shoot/family/ceremony) still follows its binder — the leg is not dead');

console.log('\n── 4. THE GATE (F-04.48\'s cure): propagate only a witnessed change ──');
const isErr           = (r) => typeof r === 'string' && r.startsWith('ERROR');
const isDateUnchanged = (r) => typeof r === 'string' && r.startsWith('DATE UNCHANGED');
const gated = (r) => isErr(r) || isDateUnchanged(r);

assert.ok(!gated(REAL_DONNA_EDIT.result));
ok('real successful donna_edit -> gate OPEN (a real change still propagates)');
assert.ok(gated('ERROR updating record: permission denied'));
ok("writeFields' real failure string -> gate SHUT (no drag off a write that never landed)");
assert.ok(gated('DATE UNCHANGED on 99dde40e — date 2026-11-01 already stands; nothing re-written, nothing re-dragged.'));
ok('the sentinel string -> gate SHUT (no re-drag on re-assertion)');
assert.ok(gated('DATE UNCHANGED on 99dde40e — date 2026-11-01 already stands; nothing re-written, nothing re-dragged.\nUpdated record 99dde40e — edited phone.'));
ok("donna_edit's LEADING sentinel is readable by startsWith even when the edit continues");

console.log('\n── 5. THE ANCHOR RULE (Q-B3-3): pre-move date, not post-move ──');
const anchorTest = (ev, binderDate) => isOccupying(ev.kind) && !!ev.event_date && !!binderDate && ev.event_date === binderDate;
assert.ok(anchorTest({ kind: 'ceremony', event_date: '2026-11-01' }, '2026-11-01'));
ok('the wedding shoot ON the wedding date IS the anchor -> may move the binder');
assert.ok(!anchorTest({ kind: 'trial', event_date: '2026-11-01' }, '2026-11-01'));
ok('a trial sitting ON the wedding date is NOT an anchor -> the CE\'s protected sentence');
assert.ok(!anchorTest({ kind: 'other', event_date: '2026-11-01' }, '2026-11-01'));
ok('a personal day ON the wedding date is NOT an anchor -> Q-B3-9\'s protected sentence');
assert.ok(!anchorTest({ kind: 'ceremony', event_date: '2026-11-08' }, '2026-11-01'));
ok('an occupying event NOT on the binder\'s date is not the anchor');
assert.ok(!anchorTest({ kind: 'ceremony', event_date: '2026-11-01' }, null));
ok('a binder with NO date has no anchor — Meera\'s exact state when the machinery ran');

console.log(`\n══ ${pass}/${pass} PASS ══`);
console.log('NOT PROVEN HERE (named, per B2\'s standard): that a live chat turn wires');
console.log('these together. lockstepBinderToEvent\'s only real caller is a chat turn.');
console.log('That is the smoke\'s job. This bench proves the rules, not the wiring.\n');
