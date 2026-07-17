#!/usr/bin/env node
// scripts/b6_door_rider_bench.js — TDW_04 B6, the F-04.78 DOOR rider (Q-R-1:
// shapes (b)+(c); shape (a) deferred to 06 by name). Runnable from any working
// directory:  node scripts/b6_door_rider_bench.js
//
// WHAT THIS BENCH IS, disclosed:
//  §1 drives the REAL COMPILED executeDonnaLead (src/engine/dist) with a scoped
//     Module._load shim over its four runtime deps (db / vendorIdentity /
//     draftContracts / phoneKey — transport and identity plumbing ONLY; the
//     function under test is the build's own bytes). §1's first scenario is
//     the CE's NAMED FIRST TEST — the Tara sequence: the dispatch correct
//     (name + phone + date + city, "different person" already answered
//     upstream), the door matching by NAME — asserting the PHONE CELL
//     UNTOUCHED (shape (b)) and the HONESTY SENTENCE PRESENT (shape (c)).
//     Then: the empty-patch return carries the same honesty · the PHONE-match
//     branch byte-identical (no note, enrich intact — existing behaviour
//     sacred, interpretation disclosed) · the insert path untouched (a new
//     lead still files its phone).
//  §2 is source assertions (the R-B6-12 precedent) so a CLEAN CLONE — where
//     dist does not exist until the engine build runs — still reads as a real
//     bench: the guard, the matchedBy key, both minted sentences, the
//     description clause. When dist is absent, §1 marks itself SKIPPED with
//     its count stated; the engine gates carry behaviour there, as they did
//     for the S1 route handlers.
//
// Ruling trail: Q-R-1 (charter the door rider; (b) a name-only single match
// never fills the phone cell; (c) the single-match return gains :228's shape;
// the Tara sequence as the named first test; wording minted -> the veto list).

'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  ✓ ' + label); } else { fail++; console.log('  ✗ FAIL: ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

const DIST = path.join(ROOT, 'src/engine/dist/core/tools/donnaLead.js');

(async () => {
  sec('§1 — the REAL compiled door (the CE\'s named first test: the Tara sequence).');
  // D-11 (TDW_06 economics sitting): F-04.83's staleness gate, generalized — this
  // bench drives dist (the note's own named sibling). Sentinel = `matchedBy`, the
  // ZIP-J cure's own identifier (6 hits in cured src AND cured dist; absent both
  // sides pre-J, so an uncured tree still runs §1 and still fails on the cure).
  const { distGate } = require(path.join(__dirname, 'lib', 'dist_gate'));
  const gate = distGate({ sentinel: 'matchedBy', srcPath: path.join(ROOT, 'src/engine/src/core/tools/donnaLead.ts'), distPath: DIST, benchCmd: 'scripts/b6_door_rider_bench.js' });
  if (!gate.runDist) {
    if (!gate.present) { /* the absent-dist print above already stated the skip */ }
    console.log('  … §1\'s 9 behavioural assertions SKIPPED per the gate; the engine gates carry behaviour. §2 runs in full.');
  } else {
    // ── the scoped shim: answers ONLY requires issued by the module under test.
    const AGENT = 'agent-door-bench';
    const VENDOR = '11111111-1111-1111-1111-111111111111';
    let db;               // the in-memory leads table
    const captured = { updates: [], inserts: [] };

    function makePub() {
      const mk = () => {
        const q = { table: null, f: [], mode: 'select', body: null,
          from(t) { q.table = t; return q; },
          select() { return q; },
          eq(c, v) { if (q.mode === 'update') { q.f.push((r) => r[c] === v); return q; } q.f.push((r) => r[c] === v); return q; },
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
          async single() { const { data } = q.run(); return { data: data[0] || null, error: null };
          },
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

    const TARA1 = () => ({ id: 'aaaaaaaa-0000-4000-8000-000000000001', vendor_id: VENDOR, name: 'Tara Hold Test', phone: null, wedding_date: '2027-03-20', wedding_date_precision: 'day', wedding_city: 'Jaipur', budget_max: null, state: 'new', source: null, referrer_name: null, notes: null, raw_message: null, deleted_at: null, created_at: '2026-07-17', draft_meta: { source: 'victor', missing: ['phone', 'budget_max'] } });

    // 1 — THE NAMED FIRST TEST: the Tara sequence, dispatch correct, name match.
    {
      db = [TARA1()]; captured.updates.length = 0; captured.inserts.length = 0;
      const out = await executeDonnaLead(AGENT, { name: 'Tara Hold Test', contact: '9811002233', wedding_date: '2027-12-05', wedding_city: 'Udaipur', stage: 'new' });
      const phonePatched = captured.updates.some((u) => 'phone' in u.body);
      T('THE NAMED FIRST TEST — shape (b): the phone cell UNTOUCHED on a name-only match', !phonePatched && db[0].phone === null);
      T('THE NAMED FIRST TEST — shape (c): the honesty sentence present, :228\'s shape', /matched by NAME to the lead already on file — if this is a different person with the same name, tell me and I'll file them separately\./.test(out.display));
      T('   …and the withheld phone is SPOKEN, not silent', /Their phone number was NOT written onto this lead — a name match alone doesn't merge identities/.test(out.display));
      T('   …no second row minted (the door\'s update semantics unchanged)', captured.inserts.length === 0 && db.length === 1);
    }
    // 2 — the empty-patch return carries the same honesty.
    {
      db = [{ ...TARA1(), state: 'new' }]; captured.updates.length = 0;
      const out = await executeDonnaLead(AGENT, { name: 'Tara Hold Test', contact: '9811002233' });
      T('empty-patch branch ("nothing new to add") still speaks the name-match note + the withheld phone', /nothing new to add\./.test(out.display) && /matched by NAME/.test(out.display) && /NOT written onto this lead/.test(out.display) && !captured.updates.some((u) => 'phone' in u.body));
    }
    // 3 — the PHONE-match branch: byte-identical, no note, enrich intact.
    {
      db = [{ ...TARA1(), phone: '9811002233', wedding_city: null }]; captured.updates.length = 0;
      const out = await executeDonnaLead(AGENT, { name: 'Tara Hold Test', contact: '9811002233', wedding_city: 'Udaipur' });
      T('phone match: NO name-match note (the strong key\'s own certainty — interpretation disclosed)', !/matched by NAME/.test(out.display) && !/NOT written onto/.test(out.display));
      T('phone match: enrich intact (wedding_city filled through the same hand)', captured.updates.some((u) => u.body.wedding_city === 'Udaipur'));
    }
    // 4 — the insert path untouched: a NEW lead still files its phone.
    {
      db = []; captured.inserts.length = 0;
      const out = await executeDonnaLead(AGENT, { name: 'Fresh Person Test', contact: '9811009999', wedding_city: 'Jaipur' });
      T('no match -> insert, phone files (the guard is enrich-only)', captured.inserts.length === 1 && captured.inserts[0].phone === '9811009999' && /Lead filed|logged|Lead/.test(out.display));
      T('insert display carries no name-match note', !/matched by NAME/.test(out.display));
    }
  }

  sec('§2 — source assertions (clean-clone half; the words and the shapes).');
  {
    const src = read('src/engine/src/core/tools/donnaLead.ts');
    T('matchedBy key declared and set on BOTH reads', /let matchedBy: 'phone' \| 'name' \| null = null;/.test(src) && /matchedBy = 'phone';/.test(src) && /matchedBy = 'name';/.test(src));
    T('shape (b): the phone fill is strong-key-gated', /input\.contact && !cur\.phone && matchedBy === 'phone'/.test(src));
    T('shape (c): nameMatchNote minted in :228\'s shape and rides BOTH single-match returns', /nameMatchNote/.test(src) && /nothing new to add\.\$\{nameMatchNote\}/.test(src) && /\)\$\{flag\}\$\{nameMatchNote\}/.test(src));
    T('the withheld-phone clause exists and names the law (identities don\'t merge on the weak key)', /a name match alone doesn't merge identities/.test(src));
    T('the tool description states (b)\'s law (veto list)', /a name match alone never merges a phone onto the existing lead/.test(src));
    T('the finding + ruling are named at the cure site', /Q-R-1 SHAPE \(b\)/.test(src) && /F-04\.78/.test(src));
  }

  console.log(`\n   ══ ${pass}/${pass + fail} ${fail ? 'FAIL' : 'PASS'} ══`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASH:', e); process.exit(1); });
