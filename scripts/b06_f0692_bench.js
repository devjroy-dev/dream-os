#!/usr/bin/env node
// scripts/b06_f0692_bench.js — TDW_06 · F-06.92, THE PAPER THAT CAN SUPPORT AN
// HONEST RELAY. Runnable from any working directory:
//   node scripts/b06_f0692_bench.js
//
// THE DISEASE THIS BENCH GUARDS (derived at read-first through the door's own bytes,
// then captured by command through the rig's db double):
//
//   Updated existing lead "Tara Relay Test" (id=lead-tara-seed) — raw_message. …
//
// That was the WHOLE paper Donna was ordered to read aloud on the F-04.78 / SD-REL
// specimen. A success verb, one column key, and silence on everything that mattered:
// nothing about Jaipur, nothing about 5 March 2027, nothing about Udaipur and
// 5 December having been REFUSED. donnaSoul's relay paragraph tells her in one breath
// to speak the result's own sentence and to speak "no workings, no machinery" — and
// the only substantive thing in that paper WAS machinery. The two clauses could not
// both be obeyed, so the mouth completed from the only meaningful facts left in its
// context: THE DISPATCH'S. F-04.78's relay is a paper that cannot support an honest
// sentence, not a mouth refusing to speak one.
//
// WHAT THIS BENCH ASSERTS, and what it deliberately does not: it asserts the PAPER's
// properties — that the refusals are stated, in plain speech, with the precision the
// row actually holds, and only where something was actually refused. It asserts
// NOTHING about what the model then says; no desk cell can witness that, and the
// cure's live verdict is the next gauntlet's SD-REL, declared and not claimed.
//
// §1 drives the REAL COMPILED executeDonnaLead (src/engine/dist) over the same scoped
//    Module._load shim b6_door_rider_bench uses — transport and identity plumbing
//    stubbed, the function under test is the build's own bytes.
// §2 is source assertions, so a clean clone (no dist yet) still reads as a real bench.
//
// Ruling trail: CE R-1 (2026-07-28) — fork 1(e) ADOPTED ALONE; 1(a) soul re-author
// refused (the law is unsatisfiable against the paper, not false); 1(b) Fork C refused
// (return condition unmet); the note born in PLAIN SPEECH by chair amendment; founder
// copy veto executed the same day on the chair-amended form, his bytes.

'use strict';

// F-06.94's cure, applied here from birth: `dist/core/db.js` throws at module load
// without these two vars and this bench never touches a live table — §1 runs wholly on
// the in-memory double below. The URL is a dead loopback port on purpose; a real
// environment's vars are never overwritten.
if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = 'http://127.0.0.1:1/f0694-stub-never-reached';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = 'f0694-stub-never-reached';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  ✓ ' + label); } else { fail++; console.log('  ✗ FAIL: ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const DIST = path.join(ROOT, 'src/engine/dist/core/tools/donnaLead.js');

// The note's own opening, used to slice the clause out of the whole display so the
// plain-speech assertions judge THE NOTE and not the legacy strings it appends to
// (whose column-key and machinery wording is F-06.92's DEFERRED sub-option, not this
// cure's subject — stated so no future reader mistakes this cell's scope).
const NOTE_HEAD = 'Not written — the record already stands:';
const noteOf = (display) => {
  const i = String(display || '').indexOf(NOTE_HEAD);
  return i === -1 ? '' : String(display).slice(i);
};

(async () => {
  sec('§1 — the REAL compiled door: the paper states what it refused.');
  const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
  const gate = distGate({ sentinel: 'notWrittenNote', srcPath: path.join(ROOT, 'src/engine/src/core/tools/donnaLead.ts'), distPath: DIST, benchCmd: 'scripts/b06_f0692_bench.js' });
  if (!gate.runDist) {
    console.log('  … §1\'s 12 behavioural assertions SKIPPED per the gate; §2 runs in full.');
  } else {
    const AGENT = 'agent-f0692-bench';
    const VENDOR = '11111111-1111-1111-1111-111111111111';
    let db;
    const captured = { updates: [], inserts: [] };

    function makePub() {
      const mk = () => {
        const q = { table: null, f: [], mode: 'select', body: null,
          from(t) { q.table = t; return q; },
          select() { return q; },
          eq(c, v) { q.f.push((r) => r[c] === v); return q; },
          ilike(c, v) { const re = new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'); q.f.push((r) => re.test(String(r[c] ?? ''))); return q; },
          is(c, v) { q.f.push((r) => (r[c] === undefined ? null : r[c]) === v); return q; },
          order() { return q; },
          update(body) { q.mode = 'update'; q.body = body; return q; },
          insert(body) { q.mode = 'insert'; q.body = body; return q; },
          rows() { let rs = db; for (const fn of q.f) rs = rs.filter(fn); return rs; },
          run() {
            if (q.mode === 'update') { const rs = q.rows(); rs.forEach((r) => Object.assign(r, q.body)); captured.updates.push({ body: q.body, rows: rs.map((r) => r.id) }); return { data: rs, error: null }; }
            if (q.mode === 'insert') { const r = { id: 'new-' + (captured.inserts.length + 1), deleted_at: null, ...q.body }; db.push(r); captured.inserts.push(q.body); return { data: [r], error: null }; }
            return { data: q.rows(), error: null };
          },
          async single() { const { data } = q.run(); return { data: data[0] || null, error: null }; },
          then(res) { res(q.run()); },
        };
        return q;
      };
      return { from: (t) => mk().from(t) };
    }

    const stubs = {
      '../db.js': { supabase: { schema: () => makePub() } },
      '../vendorIdentity.js': { vendorIdFromAgent: async () => VENDOR },
      '../draftContracts.js': { leadDraftMeta: (row) => {
        const missing = [];
        if (row.phone == null || row.phone === '') missing.push('phone');
        if (row.budget_max == null) missing.push('budget_max');
        return missing.length ? { missing } : null;
      } },
      '../phoneKey.js': { phoneKey: (v) => (v == null ? null : String(v).replace(/\D/g, '') || null) },
    };
    const origLoad = Module._load;
    Module._load = function (request, parent, isMain) {
      if (parent && parent.filename === DIST && Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
      return origLoad.call(this, request, parent, isMain);
    };
    const { executeDonnaLead } = require(DIST);
    Module._load = origLoad;

    // The gauntlet's OWN SD-REL seed, byte-for-byte in the fields that matter
    // (b06_gauntlet.js's `lead-tara-seed`: Jaipur / 2027-03-05, precision null).
    const TARA_SEED = () => ({ id: 'lead-tara-seed', vendor_id: VENDOR, name: 'Tara Relay Test', phone: '9811005566', wedding_date: '2027-03-05', wedding_date_precision: null, wedding_city: 'Jaipur', budget_max: null, state: 'new', source: 'victor', referrer_name: null, notes: null, raw_message: null, deleted_at: null, created_at: '2026-07-20', draft_meta: null });

    // 1 — THE NAMED FIRST TEST: SD-REL's own specimen through the update return.
    {
      db = [TARA_SEED()]; captured.updates.length = 0;
      const out = await executeDonnaLead(AGENT, { name: 'Tara Relay Test', wedding_date: '2027-12-05', wedding_city: 'Udaipur', stage: 'new' });
      const note = noteOf(out.display);
      T('THE NAMED FIRST TEST — the SD-REL paper now STATES ITS REFUSALS (F-04.78\'s missing half)', note !== '');
      T('   …the standing city is named, and the refused one beside it', /the city stays Jaipur \(you said Udaipur\)/.test(note));
      T('   …the standing wedding date is named in plain speech, and the refused one beside it', /the wedding date stays 5 March 2027 \(you said 5 December 2027\)/.test(note));
      T('   …the founder-approved tail rides the two-refusal form', /If either should change, say so and I'll change it\./.test(note));
      T('   …and the ROW still refused both, exactly as the Q-R-1 cure requires', !captured.updates.some((u) => u.body.wedding_city === 'Udaipur' || u.body.wedding_date === '2027-12-05'));
      T('PLAIN SPEECH: the note carries NO column key — the machinery that caused the disease is not re-admitted by its cure', !/wedding_city|wedding_date|raw_message|referrer_name|budget_max|\bid=/.test(note));
      T('PLAIN SPEECH: the note carries NO ISO date (a stored shape is not a spoken one)', !/\d{4}-\d{2}-\d{2}/.test(note));
      T('SCOPE (ruled): source and raw_message are EXCLUDED — Victor-set plumbing never enters the paper', !/source|raw_message/.test(note));
      T('SCOPE (ruled): the phone is NOT duplicated — shape (c)\'s sentence speaks it alone', !/phone/i.test(note) && /matched by NAME/.test(out.display));
    }
    // 2 — PRECISION IS NOT INVENTED. The month sentinel must never speak a day.
    {
      db = [{ ...TARA_SEED(), wedding_date: '2027-03-01', wedding_date_precision: 'month' }];
      const note = noteOf((await executeDonnaLead(AGENT, { name: 'Tara Relay Test', wedding_date: '2027-12-05', stage: 'new' })).display);
      T('PRECISION HONEST: a month-precision row speaks "March 2027" — never the 1st-of-month SENTINEL as a day (the false certainty the cure would otherwise have minted)', /the wedding date stays March 2027 \(you said 5 December 2027\)/.test(note) && !/1 March 2027/.test(note));
    }
    // 3 — NOTHING REFUSED, NOTHING SAID. Re-sending what stands is not a refusal.
    {
      db = [TARA_SEED()];
      const out = await executeDonnaLead(AGENT, { name: 'Tara Relay Test', wedding_city: 'jaipur', wedding_date: '2027-03-05', stage: 'new' });
      T('SILENT WHERE NOTHING WAS REFUSED: the same city and date re-sent (case-insensitive) produce NO note — the paper reports refusals, it does not narrate guards', noteOf(out.display) === '');
    }
    // 4 — BOTH single-match returns carry it (the empty-patch branch too).
    {
      db = [TARA_SEED()];
      const out = await executeDonnaLead(AGENT, { name: 'Tara Relay Test', wedding_city: 'Udaipur' });
      T('the EMPTY-PATCH return ("nothing new to add") carries the note as well — both single-match returns, never one', /nothing new to add\./.test(out.display) && /the city stays Jaipur \(you said Udaipur\)/.test(noteOf(out.display)));
      T('   …and the one-refusal tail is the singular form (executor interpretation of the approved bytes, disclosed)', /If that should change, say so and I'll change it\./.test(out.display));
    }
    // 5 — the create path: expected-zero, as ruled.
    {
      db = []; captured.inserts.length = 0;
      const out = await executeDonnaLead(AGENT, { name: 'Fresh Person Test', contact: '9811009999', wedding_city: 'Jaipur' });
      T('CREATE PATH EXPECTED-ZERO (ruled): no standing row, no refusal, no note', captured.inserts.length === 1 && noteOf(out.display) === '');
    }
    // 6 — the other two owner-meaningful fields, and the phone-match branch.
    {
      db = [{ ...TARA_SEED(), referrer_name: 'Old Referrer' }];
      const note = noteOf((await executeDonnaLead(AGENT, { name: 'Tara Relay Test', referrer: 'New Referrer', stage: 'new' })).display);
      T('the REFERRER clause fires on its own guard', /the referrer stays Old Referrer \(you said New Referrer\)/.test(note));
      db = [TARA_SEED()];
      const nm = noteOf((await executeDonnaLead(AGENT, { name: 'Tara Relaay Test', contact: '9811005566', stage: 'new' })).display);
      T('the NAME clause fires on a PHONE match whose name differs — the strong key vouched for identity, the spelling still did not land', /the name stays Tara Relay Test \(you said Tara Relaay Test\)/.test(nm));
    }
  }

  sec('§2 — source assertions (clean-clone half; the shapes, the pins, the laws).');
  {
    const src = read('src/engine/src/core/tools/donnaLead.ts');
    T('the note is appended LAST at BOTH single-match returns', /nothing new to add\.\$\{nameMatchNote\}\$\{notWrittenNote\}/.test(src) && /\)\$\{flag\}\$\{nameMatchNote\}\$\{notWrittenNote\}/.test(src));
    T('b6_door_rider_bench\'s TWO structural pins survive byte-exact inside the new shape (the placement constraint that decided the design)', /nothing new to add\.\$\{nameMatchNote\}/.test(src) && /\)\$\{flag\}\$\{nameMatchNote\}/.test(src));
    T('F-06.27\'s law held: the date renderer reads the STRING PARTS and never round-trips a clock', /function humanWeddingDate/.test(src) && !/new Date\(/.test(src.slice(src.indexOf('function humanWeddingDate'), src.indexOf('// Append lines to a notes value'))));
    T('the precision column is what decides the shape (the sentinel is never spoken as a day)', /precision === 'month' \? `\$\{monthName\} \$\{m\[1\]\}`/.test(src));
    T('every clause is DIFFERENCE-gated — a value re-sent unchanged was never refused', (src.match(/toLowerCase\(\) !== cur\./g) || []).length >= 3 && /parsedDateU\.date !== cur\.wedding_date/.test(src));
    T('the finding, the ruling and the copy provenance are named at the cure site', /F-06\.92/.test(src) && /fork 1\(e\)/.test(src) && /founder-vetoed/.test(src));
    T('the executor\'s grammatical extension of the approved bytes is DISCLOSED in-file, never silent', /EXECUTOR INTERPRETATION, DISCLOSED/.test(src));
  }

  console.log(`\n   ══ ${pass}/${pass + fail} ${fail ? 'FAIL' : 'PASS'} ══`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASH:', e); process.exit(2) /* F-39.67: an unexpected throw is an ERROR, never a FAIL */; });
