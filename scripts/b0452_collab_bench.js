#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b0452_collab_bench.js — TDW_04.5 P4, the collab ITEM + ROSTER layer.
//
//   node scripts/b0452_collab_bench.js
//
// WHAT IT DRIVES: the REAL src/lib/vendor/collabItems.js and the REAL
// src/lib/vendor/roster.js. Nothing under test is stubbed. The only double is
// the supabase client — an in-memory table store that honours the same
// select/eq/is/maybeSingle/insert/update chain the production callers use.
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup):
//   §1  comment out the legacy branch of itemsForPost  → §1 and §4 flip RED
//   §2  change postMatchesCategory to read post.requirement_type → §2 flips RED
//   §3  delete the phone-keyed predicate in upsertRosterEdge → §3 flips RED
//   §5  make ensureBridgeMember always INSERT           → §5 flips RED
// Each mutation is a real edit to a shipped file, reverted after.
//
// WHAT IT DOES NOT PROVE, NAMED: that the ROUTER calls any of this. The
// collab.js rewiring is BANKED AT THE SEAM and hands forward by name; this
// bench proves the two one-homes those routes will stand on, and nothing more.
// It also proves no live DB behaviour — 0096 is founder-run and withheld.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const items  = require(path.join(ROOT, 'src/lib/vendor/collabItems.js'));
const roster = require(path.join(ROOT, 'src/lib/vendor/roster.js'));

let pass = 0, fail = 0;
const ok = (label, cond) => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);

// ── the in-memory supabase double (transport only) ──────────────────────────
function makeDb(seed = {}) {
  const tables = { vendor_roster: [], team_members: [], ...seed };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;

  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _filters: [], _table: table };

    q.select  = () => q;
    q.eq      = (col, val) => { q._filters.push(r => r[col] === val); return q; };
    q.is      = (col, val) => { q._filters.push(r => (r[col] ?? null) === val); return q; };
    q.match   = (o) => { for (const k of Object.keys(o)) q.eq(k, o[k]); return q; };

    const matched = () => rows.filter(r => q._filters.every(f => f(r)));

    q.maybeSingle = async () => ({ data: matched()[0] || null, error: null });
    q.single      = async () => ({ data: matched()[0] || null, error: null });

    q.insert = (payload) => {
      const row = {
        id: nextId(table),
        member_vendor_id: null, phone: null, category: null,
        active: true, deleted_at: null,
        page_token: nextId('token'),
        roster_vendor_id: null,
        ...payload,
      };
      rows.push(row);
      const ins = { select: () => ins, maybeSingle: async () => ({ data: row, error: null }) };
      return ins;
    };

    q.update = (patch) => {
      const upd = {
        _f: [],
        eq(col, val) { this._f.push(r => r[col] === val); return this; },
        is(col, val) { this._f.push(r => (r[col] ?? null) === val); return this; },
        select() { return this; },
        async maybeSingle() {
          const hit = rows.filter(r => this._f.every(f => f(r)));
          hit.forEach(r => Object.assign(r, patch));
          return { data: hit[0] || null, error: null };
        },
      };
      return upd;
    };

    return q;
  }

  return { from, _tables: tables };
}

// ══ §1 — THE WRAP (F3): a legacy post reads as one item ════════════════════
section('1. wrap-on-read — legacy posts keep working');

const legacyPost = { id: 'p-legacy', requirement_type: 'decor' };
const wrapped = items.itemsForPost(legacyPost, []);

ok('a legacy post with zero item rows yields exactly ONE item', wrapped.length === 1);
ok('the synthesized item carries the post\'s own requirement_type', wrapped[0].requirement_type === 'decor');
ok('it is flagged wrapped:true — a reader can tell synthesized from stored', wrapped[0].wrapped === true);
ok('its id is null — nothing was invented in the database', wrapped[0].id === null);
ok('a post with no requirement_type yields no items rather than a guess',
   items.itemsForPost({ id: 'x' }, []).length === 0);

const multiRows = [
  { id: 'i-3', post_id: 'p1', position: 2, requirement_type: 'catering' },
  { id: 'i-1', post_id: 'p1', position: 0, requirement_type: 'photography' },
  { id: 'i-2', post_id: 'p1', position: 1, requirement_type: 'decor' },
];
const ordered = items.itemsForPost({ id: 'p1', requirement_type: 'photography' }, multiRows);
ok('stored items sort by position, so items[0] is deterministic',
   ordered.map(i => i.requirement_type).join(',') === 'photography,decor,catering');
ok('stored items are NOT flagged wrapped', ordered.every(i => i.wrapped === false));

// ══ §2 — DISCOVERY reads items (F4 as amended) ═════════════════════════════
section('2. discovery — the census catch');

const multiPost = { id: 'p1', requirement_type: 'photography' };
ok('a decorator reaches item[1] of a multi-item post',
   items.postMatchesCategory(multiPost, multiRows, 'decor') === true);
ok('a caterer reaches item[2]',
   items.postMatchesCategory(multiPost, multiRows, 'catering') === true);
ok('the photographer still reaches item[0]',
   items.postMatchesCategory(multiPost, multiRows, 'photography') === true);
ok('a makeup artist reaches nothing — no false positives',
   items.postMatchesCategory(multiPost, multiRows, 'makeup') === false);
ok('a LEGACY post still matches on its own column (the wrap carries discovery)',
   items.postMatchesCategory(legacyPost, [], 'decor') === true);
ok('a null category matches nothing',
   items.postMatchesCategory(multiPost, multiRows, null) === false);

// ══ §3 — ROSTER DEDUP, both predicates (F9) ════════════════════════════════
section('3. roster dedup — two disjoint predicates');

(async () => {
  const db = makeDb();

  const first = await roster.upsertRosterEdge(db, {
    ownerVendorId: 'v-owner', memberVendorId: 'v-member',
    name: 'Meera', phone: '+919888294440', category: 'makeup', source: 'collab_accepted',
  });
  ok('a new member-keyed edge inserts', first.created === true);

  const again = await roster.upsertRosterEdge(db, {
    ownerVendorId: 'v-owner', memberVendorId: 'v-member',
    name: 'Meera', phone: '+919888294440', category: 'makeup', source: 'collab_accepted',
  });
  ok('the same pair does NOT duplicate', again.created === false);
  ok('and the store still holds exactly one row', db._tables.vendor_roster.length === 1);

  const manual = await roster.upsertRosterEdge(db, {
    ownerVendorId: 'v-owner', memberVendorId: null,
    name: 'Ishaan', phone: '9876543210', category: 'decor', source: 'manual',
  });
  ok('a phone-only manual add inserts', manual.created === true);
  ok('its phone was normalised to E164 on the way in', manual.row.phone === '+919876543210');

  const manualAgain = await roster.upsertRosterEdge(db, {
    ownerVendorId: 'v-owner', memberVendorId: null,
    name: 'Ishaan', phone: '+91 98765 43210', category: 'decor', source: 'manual',
  });
  ok('the same phone in a DIFFERENT format still dedups', manualAgain.created === false);
  ok('still two rows total', db._tables.vendor_roster.length === 2);

  const upgraded = await roster.upsertRosterEdge(db, {
    ownerVendorId: 'v-owner', memberVendorId: 'v-ishaan',
    name: 'Ishaan', phone: '9876543210', category: 'decor', source: 'collab_accepted',
  });
  ok('when that phone LATER connects, the row is UPGRADED not duplicated', upgraded.created === false);
  ok('and it now carries the vendor identity', upgraded.row.member_vendor_id === 'v-ishaan');
  ok('the store STILL holds two rows — the ruled collision semantics',
     db._tables.vendor_roster.length === 2);

  // ══ §4 — AUTO-CLOSE (spec §P4.1 / §4 item 4) ═════════════════════════════
  section('4. auto-close — on the existing terminal state');

  const threeItems = [
    { id: 'a', post_id: 'p2', position: 0, requirement_type: 'photography', filled_by_response_id: 'r1' },
    { id: 'b', post_id: 'p2', position: 1, requirement_type: 'decor',       filled_by_response_id: 'r2' },
    { id: 'c', post_id: 'p2', position: 2, requirement_type: 'catering',    filled_by_response_id: null },
  ];
  const post2 = { id: 'p2', requirement_type: 'photography' };
  ok('3 items, 2 filled → NOT closed', items.allItemsFilled(post2, threeItems) === false);
  threeItems[2].filled_by_response_id = 'r3';
  ok('the 3rd filled → closed', items.allItemsFilled(post2, threeItems) === true);
  ok('a legacy post with an unfilled wrap is not closed',
     items.allItemsFilled(legacyPost, []) === false);

  // ══ §5 — THE BRIDGE (spec §P4.4, idempotent) ═════════════════════════════
  section('5. the assign-external bridge row');

  const db2 = makeDb();
  const rosterRow = { id: 'roster-1', name: 'Ishaan', phone: '+919876543210' };

  const b1 = await roster.ensureBridgeMember(db2, { vendorId: 'v-owner', rosterRow });
  ok('the bridge row is created', b1.created === true);
  ok('role is external_vendor', b1.member.role === 'external_vendor');
  ok('roster_vendor_id links it back', b1.member.roster_vendor_id === 'roster-1');
  ok('the phone was copied', b1.member.phone === '+919876543210');
  ok('page_token exists — the crew page works with zero new code', !!b1.member.page_token);

  const b2 = await roster.ensureBridgeMember(db2, { vendorId: 'v-owner', rosterRow });
  ok('a second call does NOT create a second row (idempotent, §4 item 6)', b2.created === false);
  ok('and the token is the SAME — one external, one identity',
     b2.member.page_token === b1.member.page_token);
  ok('the store holds exactly one team_members row', db2._tables.team_members.length === 1);

  db2._tables.team_members[0].active = false;
  const b3 = await roster.ensureBridgeMember(db2, { vendorId: 'v-owner', rosterRow });
  ok('a deactivated bridge row is REVIVED, never duplicated', b3.created === false);
  ok('and it is active again', b3.member.active === true);
  ok('still exactly one row', db2._tables.team_members.length === 1);

  // ══ §6 — APPENDIX A (spec :107) ═══════════════════════════════════════════
  section('6. the gap-pip prefill map');

  ok('shoot → photography',     items.requirementForKind('shoot') === 'photography');
  ok('ceremony → planning',     items.requirementForKind('ceremony') === 'planning');
  ok('recce → venue',           items.requirementForKind('recce') === 'venue');
  ok('social → music_dj',       items.requirementForKind('social') === 'music_dj');
  ok('fitting → the TWO-CHIP ask, not a guess',
     Array.isArray(items.requirementForKind('fitting')) &&
     items.requirementForKind('fitting').join(',') === 'makeup,attire');
  ok('other → no prefill',      items.requirementForKind('other') === null);
  ok('blocked → no prefill',    items.requirementForKind('blocked') === null);
  ok('an unknown kind prefills nothing rather than guessing',
     items.requirementForKind('sangeet-afterparty') === null);

  // ══ §7 — INPUT VALIDATION (1–8, spec §P4.1) ══════════════════════════════
  section('7. items input');

  ok('a legacy single-type body still creates one item',
     items.normaliseItemsInput({ requirement_type: 'decor' }).items[0].requirement_type === 'decor');
  ok('9 items are refused',
     items.normaliseItemsInput({ items: Array(9).fill({ requirement_type: 'decor' }) }).ok === false);
  ok('0 items are refused',
     items.normaliseItemsInput({ items: [] }).ok === false);
  ok('8 items are accepted',
     items.normaliseItemsInput({ items: Array(8).fill({ requirement_type: 'decor' }) }).ok === true);
  ok('an unknown requirement_type is refused by name',
     items.normaliseItemsInput({ items: [{ requirement_type: 'florist' }] }).ok === false);
  ok('positions are assigned 0..n-1, so items[0] is never ambiguous',
     items.normaliseItemsInput({ items: [
       { requirement_type: 'photography' }, { requirement_type: 'decor' },
     ] }).items.map(i => i.position).join(',') === '0,1');
  ok('a >200 char note is refused',
     items.normaliseItemsInput({ items: [{ requirement_type: 'decor', note: 'x'.repeat(201) }] }).ok === false);

  console.log(`\n══ b0452_collab_bench: ${pass} passed, ${fail} failed ══\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
