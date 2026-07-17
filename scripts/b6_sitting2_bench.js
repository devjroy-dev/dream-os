#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b6_sitting2_bench.js — TDW_04 Part B, sitting B6 sitting 2.
//
// Sibling to checker_bench (101/101), b3_rider_bench (20/20), b5_describe_bench
// (18/18) and b6_referent_bench (36/36) — none of which this file touches: their
// counts are sealed gates and stay byte-stable in the founder's verify string.
// Q-SP-5's law: run it from anywhere —
//     node scripts/b6_sitting2_bench.js
//
// WHAT IT DRIVES: the REAL persistComposedReply and the REAL composedTail
// (chat.js's exported test seams, B4's ratified precedent) — through them the
// REAL conflictLines/mutationLines/bookingLines — against a capturing supabase
// double. A bench that re-implemented the append order or the update targeting
// would prove its own copy (B2 §3).
//
// WHAT IT PROVES:
//   §1  Q-B4-6(b), F-04.41's cure — the composed-reply save: the door lines are
//       patched onto EXACTLY the row the engine witnessed (assistant_message_id),
//       content = the model half byte-identical + the tail; an empty tail writes
//       nothing; a missing id writes nothing (never guess a row); a failed patch
//       never throws into the route.
//   §2  THE SYNTHESIS SCENARIO (§9's law: components proven together, not only
//       apart) — a refused booking's checker sentence, composed by the REAL
//       conflictLines, survives INTO the persisted row beside the model's prose:
//       the fabricated half can no longer stand alone on refresh.
//   §3  R-B6-12 — THE DIVERGENCE LINE: the open-lead-states list carried BY
//       VALUE in fetchCalendarSnapshot vs its home, leads.js ACTIVE_PIPELINE_
//       STATES. Two homes for one list is F-04.36's shape; this line FAILS THE
//       MOMENT THEY DIVERGE. ("They agree today; I read both" is the origin
//       sentence of F-04.36 — this is the forcing function the CE ruled.)
//   §4  R-B6-15 (founder veto = YES) — the edit/cancel signal displays carry the
//       ruled clause VERBATIM at source; the optimistic originals are gone; and
//       ZIP A's :659/:671 strings are unregressed (four sites, one clause).
//   §5  R-B6-13 — the donna_find word-sweep: "handle" gone from every string the
//       model can be handed by that file; the name-as-shown taught in its place.
//       (The zero-match dump size is 06's by the same ruling — NOT asserted.)
//
// WHAT IT DOES NOT PROVE, NAMED: that a live refresh renders the persisted row
// (the PWA history read is display-only and unchanged), or that the model stops
// composing optimistically — the string softening never claimed to cure that;
// only the thread now carries the witness beside the guess. Founder smoke owns
// the live half.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path   = require('path');
const fs     = require('fs');
const ROOT   = path.resolve(__dirname, '..');   // runs from its home AND from anywhere

// ── the ratified doubles: the ledger shim + the module fence (b6_referent_bench's own) ──
const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
  exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };

const Module  = require('module');
const _load   = Module._load;
const BUILTIN = new Set(Module.builtinModules);
const noop    = () => new Proxy(function () {}, { get: () => noop() });
Module._load = function (req) {
  // Router() returns a PLAIN OBJECT — checker_bench's own lesson: a catch-all
  // Proxy swallowed the door's test-seam export once. Not repeated here.
  if (req === 'express') { const e = () => {}; e.Router = () => ({ get(){}, post(){}, patch(){}, put(){}, delete(){}, use(){} }); return e; }
  if (/engine\/dist\//.test(req)) return noop();
  if (!req.startsWith('.') && !req.startsWith('/') && !req.startsWith('node:') && !BUILTIN.has(req)) return noop();
  return _load.apply(this, arguments);
};

const CHAT  = path.join(ROOT, 'src/api/vendor-engine/chat.js');
const LEADS = path.join(ROOT, 'src/api/vendor/leads.js');
const RP    = path.join(ROOT, 'src/engine/src/core/tools/recordPrimitives.ts');
const DF    = path.join(ROOT, 'src/engine/src/core/tools/donnaFind.ts');
const { persistComposedReply, composedTail, conflictLines, mutationLines } = require(CHAT);

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
}
function sec(t) { console.log(`\n── ${t} ──`); }

// ── a capturing supabase double: records every update, applies nothing ──────
function makeCapture(opts = {}) {
  const calls = [];
  const supabase = {
    _schema: 'public',
    schema(s) { const c = Object.create(this); c._schema = s; return c; },
    from(table) {
      const self = this;
      return {
        update(patch) {
          return {
            eq(col, val) {
              calls.push({ schema: self._schema, table, patch, col, val });
              if (opts.failUpdate) return Promise.resolve({ data: null, error: { message: 'bench: update forced to fail' } });
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  };
  return { calls, supabase };
}
const mkReq = (supabase) => ({ app: { locals: { supabase } }, vendor: { id: 'v-1' } });

const MSG_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

(async () => {

// ─────────────────────────────────────────────────────────────────────────
sec('1. Q-B4-6(b) — the composed-reply save. The witness joins the row; nothing is guessed.');
{
  const { calls, supabase } = makeCapture();
  const result = { reply: 'Done. The 30th is locked in.', assistant_message_id: MSG_ID };
  const tail = '\n\nCouldn\u2019t put that on the calendar \u2014 nothing was changed.';
  await persistComposedReply(mkReq(supabase), result, tail);
  ok(calls.length === 1, 'a tail + a witnessed id -> exactly ONE update fires');
  ok(calls[0] && calls[0].schema === 'engine' && calls[0].table === 'messages',
     '   it targets engine.messages — the thread, not the WhatsApp twin (two-plane word, read the schema)');
  ok(calls[0] && calls[0].col === 'id' && calls[0].val === MSG_ID,
     '   *** THE EXACT ROW THE ENGINE WITNESSED *** — .eq(\'id\', assistant_message_id), never "the latest assistant row"');
  ok(calls[0] && calls[0].patch && calls[0].patch.content === `${result.reply}${tail}`,
     '   content = the model half BYTE-IDENTICAL + the tail — the guess is preserved, the witness now stands beside it');
}
{
  const { calls, supabase } = makeCapture();
  await persistComposedReply(mkReq(supabase), { reply: 'Noted.', assistant_message_id: MSG_ID }, '');
  ok(calls.length === 0, 'an EMPTY tail writes NOTHING — a turn with no door lines leaves the saved row untouched');
}
{
  const { calls, supabase } = makeCapture();
  await persistComposedReply(mkReq(supabase), { reply: 'Noted.' }, '\n\nBooked: X — 2026-12-01.');
  ok(calls.length === 0, 'a MISSING id writes NOTHING — the door never guesses a row (F-04.28\'s lesson, held)');
}
{
  const { supabase } = makeCapture({ failUpdate: true });
  let threw = false;
  try { await persistComposedReply(mkReq(supabase), { reply: 'Noted.', assistant_message_id: MSG_ID }, '\n\nx'); }
  catch { threw = true; }
  ok(!threw, 'a FAILED patch warns and never throws into the route — the reply is already owed (leads.js:224\'s convention)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('2. THE SYNTHESIS — refusal + persistence together. The checker\'s sentence survives the refresh.');
{
  // The REAL conflictLines composes the refusal (F-04.55's cure); the REAL
  // composedTail orders it; the REAL persistComposedReply lands it. Three
  // components, one scenario — §9's law, and F-04.43's lesson (each half worked;
  // together they destroyed a booking) run the right way round.
  const refused = [{ title: 'Rhea - shoot', conflict: {
    kind: 'date_blocked', date: '2026-11-30',
    message: "You've blocked 30 November. That one's a no — unblock it first if you want it back.",
  }, error: null }];
  const mutated = [{ action: 'edit', ok: false, reason: 'unresolved' }];
  const tail = composedTail({ documents: [], booked: [], refused, mutated, advised: [], blocked: [], unblocked: [] });
  ok(tail.startsWith('\n\n') && tail.indexOf("You've blocked 30 November") < tail.indexOf("didn't find a single match"),
     'composedTail carries BOTH builders\' sentences in the routes\' own order (refused before mutated)');
  ok(tail === '\n\n' + conflictLines(refused) + '\n\n' + mutationLines(mutated),
     '   and it is byte-identical to the REAL builders\' output — pure recomputation, the disclosed shape');

  const { calls, supabase } = makeCapture();
  const result = { reply: 'Done. 30 November is locked in for Rhea.', assistant_message_id: MSG_ID };
  await persistComposedReply(mkReq(supabase), result, tail);
  const stored = calls[0] && calls[0].patch.content;
  ok(typeof stored === 'string' && stored.includes('Done. 30 November is locked in')
     && stored.includes("You've blocked 30 November. That one's a no"),
     '*** THE PERSISTED ROW HOLDS BOTH HALVES *** — the fabricated "Done" can no longer stand alone on refresh (the 06 harvest item 2, defused at its fuel line)');
}

// ─────────────────────────────────────────────────────────────────────────
sec('3. R-B6-12 — the divergence line. Two homes for one list, and this FAILS when they diverge.');
{
  const chatSrc  = fs.readFileSync(CHAT, 'utf8');
  const leadsSrc = fs.readFileSync(LEADS, 'utf8');
  const parseList = (s) => s.split(',').map((x) => x.replace(/['"\s]/g, '')).filter(Boolean).sort();

  // The home: leads.js's exported-by-name constant (a router module — not importable
  // without express, which is exactly WHY the copy exists; R-B6-12 names the export
  // or this line as the cure, and rules THIS line into the first code ZIP).
  const mHome = leadsSrc.match(/ACTIVE_PIPELINE_STATES\s*=\s*\[([^\]]+)\]/);
  // The copy: fetchCalendarSnapshot's by-value list, anchored on its own pointer comment.
  const mCopy = chatSrc.match(/\.in\('state',\s*\[([^\]]+)\]\)\s*\/\/\s*ACTIVE_PIPELINE_STATES/);

  ok(!!mHome, 'the home parses: leads.js ACTIVE_PIPELINE_STATES found');
  ok(!!mCopy, 'the copy parses: fetchCalendarSnapshot\'s by-value list found at its pointer comment');
  if (mHome && mCopy) {
    const home = parseList(mHome[1]);
    const copy = parseList(mCopy[1]);
    ok(home.length > 0 && home.join('|') === copy.join('|'),
       `*** THE TWO HOMES AGREE *** (${home.join('/')}) — and this line FAILS the sitting a divergence ships in (F-04.36\'s forcing function, R-B6-12 ruled)`);
  } else { ok(false, 'divergence check could not run — a home went missing, which IS a divergence'); }
}

// ─────────────────────────────────────────────────────────────────────────
sec('4. R-B6-15 (veto = YES) — the edit/cancel displays carry the ruled clause; ZIP A\'s pair unregressed.');
{
  const src = fs.readFileSync(RP, 'utf8');
  ok(src.includes('Change requested to booking ${eid}: ${changed.join(\', \')} \u2014 sent to the calendar; it will confirm or refuse.'),
     'donna_edit_event: the ruled clause VERBATIM');
  ok(src.includes('Cancellation requested for booking ${eid} \u2014 sent to the calendar; it will confirm or refuse.'),
     'donna_cancel_event: the ruled clause VERBATIM');
  ok(!src.includes('it is being updated on the calendar') && !src.includes('it is being called off on the calendar'),
     '   the optimistic originals are GONE — both of them');
  const clause = src.split('sent to the calendar; it will confirm or refuse').length - 1;
  ok(clause === 4, `   FOUR sites, ONE clause (book/block from ZIP A + edit/cancel from this ZIP) — found ${clause}`);
  ok(src.includes('the day is being put back on the calendar'),
     '   donna_unblock_date UNTOUCHED — never on the veto list, and this line fails if a sweep overreaches into it');
}

// ─────────────────────────────────────────────────────────────────────────
sec('5. R-B6-13 — the donna_find word-sweep. The word left the strings; the name-as-shown arrived.');
{
  const src = fs.readFileSync(DF, 'utf8');
  // "handle" must not survive in anything the model can be handed: every string
  // literal in the file is checked; comments (the sweep's own record quotes the
  // word once) are not model-facing and are excluded by stripping comment lines.
  const codeOnly = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');
  ok(!/handle/i.test(codeOnly),
     '*** ZERO "handle" outside comments *** — the second teacher of F-04.66\'s word is swept (engine-side)');
  ok(src.includes('refer to a record by its name as shown'),
     '   the zero-match prose teaches the NAME-AS-SHOWN in its place (the ruling\'s own words)');
  ok(!src.includes('The handle you searched'),
     '   the old sentence is gone verbatim');
  ok(/most recent records \(active and archived\)/.test(src),
     '   the recovery fallback itself is untouched — the sweep changed the WORD, not the mechanism (the dump-size question is 06\'s, recorded not acted)');
}

// ─────────────────────────────────────────────────────────────────────────
console.log('');
if (fail === 0) console.log(`   \u2550\u2550 ${pass}/${pass} PASS \u2550\u2550`);
else            console.log(`   \u2550\u2550 ${pass}/${pass + fail} \u2014 ${fail} FAILED \u2550\u2550`);
process.exit(fail === 0 ? 0 : 1);

})().catch((e) => { console.error('BENCH CRASHED:', e); process.exit(1); });
