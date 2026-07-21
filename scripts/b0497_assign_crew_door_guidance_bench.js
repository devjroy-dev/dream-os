#!/usr/bin/env node
// scripts/b0497_assign_crew_door_guidance_bench.js — TDW_04.5 F-04.97.
//
// CLAIM: the model-facing donna_assign_crew description carries the binding line that
// stops the model adjudicating crew presence — the door does that, deterministically.
// The model must SIGNAL, never refuse/clarify/reason about whether a member is on an
// event (the calendar snapshot never carries crew by design).
//
// This is a text-presence bench on the SEAM OF RECORD (the TS source), scoped to the
// donna_assign_crew tool block so the line can't be satisfied by some other tool.
// Both-ways: strip the line → RED. Companion proof (run separately, must stay green):
//   node scripts/b0457_assign_bench.js   (the signal cases)
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src/engine/src/core/tools/recordPrimitives.ts');
const src = fs.readFileSync(SRC, 'utf8');

// Isolate the donna_assign_crew tool object's description string.
function assignCrewDescription(text) {
  const nameIdx = text.indexOf("name: 'donna_assign_crew'");
  assert.ok(nameIdx !== -1, "donna_assign_crew tool not found");
  const descIdx = text.indexOf('description:', nameIdx);
  assert.ok(descIdx !== -1, 'description field not found on donna_assign_crew');
  // description is a double-quoted string; capture from the opening quote to the closing ",
  const open = text.indexOf('"', descIdx);
  const close = text.indexOf('",', open + 1);
  assert.ok(open !== -1 && close !== -1, 'could not bound the description string');
  return text.slice(open + 1, close);
}

const desc = assignCrewDescription(src);

let fail = 0;
const ok  = (m) => console.log(`  \u2713 ${m}`);
const bad = (m) => { console.log(`  \u2717 ${m}`); fail++; };
const has = (label, needle) => desc.includes(needle) ? ok(label) : bad(`${label} — MISSING: "${needle}"`);

console.log('TDW_04.5 F-04.97 — donna_assign_crew door-adjudicates guidance\n');

has('carries: calendar snapshot never shows crew', 'The calendar snapshot never shows crew assignments.');
has('carries: never refuse/clarify/reason about presence', 'Never refuse, clarify, or reason about whether a member is on an event');
has('carries: signal — the door adjudicates', 'signal the request; the door adjudicates and answers deterministically');
has("carries: deterministic verdicts named ('isn't on' / 'already on')", "including 'isn't on' and 'already on'");

// scope check: the binding line lives on THIS tool, not leaked elsewhere by accident
{
  const n = (src.match(/The calendar snapshot never shows crew assignments\./g) || []).length;
  n === 1 ? ok('scope: binding line appears exactly once (on assign-crew)') : bad(`binding line count = ${n} (expected 1)`);
}

// both-ways: stripping the line from a copy of the source fails the presence check
{
  const stripped = src.replace(/ The calendar snapshot never shows crew assignments\.[^"]*\(including 'isn't on' and 'already on'\)\./, '');
  const d2 = assignCrewDescription(stripped);
  const redFired = !d2.includes('the door adjudicates');
  redFired ? ok('both-ways: stripped source FAILS the presence check (teeth)') : bad('both-ways: strip not detected');
}

console.log('');
if (fail === 0) { console.log('F-04.97: ALL GREEN'); process.exit(0); }
else { console.log(`F-04.97: ${fail} FAILURE(S)`); process.exit(1); }
