#!/usr/bin/env node
'use strict';
// scripts/d1_search_bench.js · DESIGN-1 · THE UNIVERSAL SEARCH (the founder and the chair, stage 3).
// Holds: the matcher finds a name spelt either common way (Priya/Priyaa, Aggarwal/Agarwal), with one slip, by either
// partner's name or the wedding's name, and by a phone's last four digits or any four or more of them; every word typed
// must match; results come grouped by kind in the ruled order. The door reads HER OWN rows only: driven against a store
// holding two vendors' rows, A's search never returns B's, and every read carries her scope. No new table.
// RED MUTATIONS: the doubled-letter fold removed (§1.2 reds); the clients read unscoped (§2.2 reds).
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let pass = 0, fail = 0;
const ok = (name, c, why) => { if (c) { pass++; console.log(`  GREEN  ${name}`); } else { fail++; console.log(`  RED    ${name}${why ? ' — ' + why : ''}`); } };

// load a module from source text (for the mutations), with the estate's express and auth stubbed: this bench drives the
// handler, not the network
const STUBS = {
  express: { Router: () => { const r = { routes: [], get: (p, ...h) => { r.routes.push({ p, h }); } }; return r; } },
};
function loadFrom(rel, src) {
  const file = path.join(ROOT, rel);
  const m = new Module(file, module);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  const origLoad = Module._load;
  Module._load = function (req, parent, isMain) {
    if (req in STUBS) return STUBS[req];
    if (/middleware\/requireAuth$/.test(req)) return (q, s, n) => n();
    if (/middleware\/resolveVendor$/.test(req)) return () => (q, s, n) => n();
    if (/middleware\/agentBridge$/.test(req)) return { resolveAgentForVendor: async (_sb, v) => ({ agentId: 'agent-' + v.id }) };
    return origLoad.apply(this, arguments);
  };
  try { m._compile(src, file); } finally { Module._load = origLoad; }
  return m.exports;
}

const MATCHER = 'src/lib/vendorSearch.js';
const DOOR = 'src/api/vendor/search.js';

function matcherCells(S) {
  const r = {};
  const recs = {
    enquiries: [
      { id: 'L1', title: 'Priyaa Aggarwal', text: ['Priyaa Aggarwal', 'Jaipur'], phones: ['+91 98765 43210'] },
      { id: 'L2', title: 'Meera Shah', text: ['Meera Shah', 'Mumbai'], phones: ['99887 76655'] },
      { id: 'L3', title: 'Anu Mehta', text: ['Anu Mehta'], phones: [] },
    ],
    clients: [{ id: 'C1', title: 'Priya & Rohan', text: ['Priya & Rohan', 'rohan@example.com'], phones: ['9000011111'] }],
    events: [{ id: 'E1', title: 'Ananya weds Kabir', text: ['Ananya weds Kabir'], phones: [] }],
    crew: [{ id: 'R1', title: 'Farhan', text: ['Farhan', 'photographer'], phones: ['+91 91234 56789'] }],
  };
  const ids = (q) => S.search(q, recs).groups.flatMap((g) => g.items.map((i) => i.id)).sort().join(',');
  r.priya = ids('priya');            // both spellings
  r.priyaa = ids('Priyaa');
  r.agarwal = ids('agarwal');        // doubled letters folded
  r.annu = ids('annu');              // a short name, where only the fold can forgive it
  r.slip = ids('aggrawal');          // one swapped pair
  r.partner = ids('rohan');          // either partner
  r.wedding = ids('kabir');          // the wedding's name
  r.both = ids('priya agarwal');     // every word must match
  r.last4 = ids('3210');
  r.partial = ids('98765');
  r.spaced = ids('+91 91234');
  r.short = ids('321');              // three digits are not a number search
  r.none = ids('zzzz');
  r.empty = S.search('   ', recs).groups.length;
  const g = S.search('priya', { crew: [{ id: 'R2', title: 'Priya lights', text: ['Priya lights'], phones: [] }], enquiries: recs.enquiries, events: [{ id: 'E2', title: 'Priya sangeet', text: ['Priya sangeet'], phones: [] }] });
  r.order = g.groups.map((x) => x.kind).join(',');
  const many = { notes: Array.from({ length: 9 }, (_, i) => ({ id: 'N' + i, title: 'n', text: ['priya call ' + i], phones: [] })) };
  const gm = S.search('priya', many).groups[0];
  r.cap = gm && gm.items.length === S.PER_KIND && gm.total === 9;
  return r;
}

console.log('\n§1 the matcher');
const S = require(path.join(ROOT, MATCHER));
const m1 = matcherCells(S);
ok('1.1 "priya" finds Priyaa and Priya', m1.priya === 'C1,L1', m1.priya);
ok('1.2 "Priyaa" finds Priya, "agarwal" finds Aggarwal, "annu" finds Anu (doubled letters are one spelling)', m1.priyaa === 'C1,L1' && m1.agarwal === 'L1' && m1.annu === 'L3', m1.priyaa + ' / ' + m1.agarwal + ' / ' + m1.annu);
ok('1.3 one slip in a long word is forgiven ("aggrawal")', m1.slip === 'L1', m1.slip);
ok('1.4 a couple is found by either partner’s name ("rohan")', m1.partner === 'C1', m1.partner);
ok('1.5 and by the wedding’s name ("kabir" finds "Ananya weds Kabir")', m1.wedding === 'E1', m1.wedding);
ok('1.6 every word typed must match ("priya agarwal" is one record)', m1.both === 'L1', m1.both);
ok('1.7 the last four digits of a phone find it; spaces and +91 ignored', m1.last4 === 'L1' && m1.spaced === 'R1', m1.last4 + ' / ' + m1.spaced);
ok('1.8 a partial number finds it', m1.partial === 'L1', m1.partial);
ok('1.9 three digits are not a number search, and nonsense finds nothing', m1.short === '' && m1.none === '', m1.short + ' / ' + m1.none);
ok('1.10 an empty box searches nothing', m1.empty === 0);
ok('1.11 groups come in the ruled order (enquiries, clients, events, invoices, packages, notes, crew)', m1.order === 'enquiries,events,crew', m1.order);
ok('1.12 each kind shows its best five and says how many matched', m1.cap === true);

console.log('\n§2 the door: her own records only');
function store() {
  const rows = {
    'public.leads': [{ id: 'LA', vendor_id: 'A', name: 'Priya Sharma', phone: '9811112345', deleted_at: null }, { id: 'LB', vendor_id: 'B', name: 'Priya Verma', phone: '9822212345', deleted_at: null }],
    'public.clients': [{ id: 'CA', vendor_id: 'A', name: 'Priya & Rohan', phone: '9000012345', deleted_at: null }, { id: 'CB', vendor_id: 'B', name: 'Priya & Aman', phone: '9000112345', deleted_at: null }],
    'public.events': [{ id: 'EA', vendor_id: 'A', title: 'Priya sangeet', kind: 'sangeet', event_date: '2026-12-01', deleted_at: null }, { id: 'EB', vendor_id: 'B', title: 'Priya haldi', kind: 'haldi', event_date: '2026-12-02', deleted_at: null }],
    'engine.records': [{ id: 'IA', agent_id: 'agent-A', direction: 'in', client: 'Priya Sharma', amount: 50000, hidden: false }, { id: 'IB', agent_id: 'agent-B', direction: 'in', client: 'Priya Verma', amount: 9000, hidden: false }],
    'public.vendor_packages': [{ id: 'PA', vendor_id: 'A', name: 'Priya special' }, { id: 'PB', vendor_id: 'B', name: 'Priya special' }],
    'public.owner_notes': [{ id: 'NA', vendor_id: 'A', body: 'call Priya' }, { id: 'NB', vendor_id: 'B', body: 'call Priya' }],
    'public.vendor_roster': [{ id: 'RA', owner_vendor_id: 'A', name: 'Priya lights', phone: '9', category: 'decor' }, { id: 'RB', owner_vendor_id: 'B', name: 'Priya lights', phone: '9', category: 'decor' }],
  };
  const reads = [];
  const q = (schema, table) => {
    const filters = []; const rec = { table: schema + '.' + table, filters };
    reads.push(rec);
    const chain = {
      select: () => chain, order: () => chain, limit: () => chain,
      eq: (c, v) => { filters.push(['eq', c, v]); return chain; },
      neq: (c, v) => { filters.push(['neq', c, v]); return chain; },
      is: (c, v) => { filters.push(['is', c, v]); return chain; },
      then: (res, rej) => Promise.resolve({ data: (rows[rec.table] || []).filter((r) => filters.every(([op, c, v]) => (op === 'eq' ? r[c] === v : op === 'neq' ? r[c] !== v : r[c] === v))), error: null }).then(res, rej),
    };
    return chain;
  };
  return { reads, sb: { from: (t) => q('public', t), schema: (s) => ({ from: (t) => q(s, t) }) } };
}
async function drive(doorSrc, vendor, qs) {
  const door = loadFrom(DOOR, doorSrc);
  const route = door.routes.find((r) => r.p === '/');
  const st = store();
  const req = { query: { q: qs }, vendor: { id: vendor }, auth: { user_id: 'u-' + vendor }, app: { locals: { supabase: st.sb } } };
  let body = null;
  const res = { status: () => res, json: (b) => { body = b; return res; } };
  const h = route.h[route.h.length - 1];
  await new Promise((done) => { h(req, res, done); const t = setInterval(() => { if (body) { clearInterval(t); done(); } }, 5); });
  return { body, reads: st.reads };
}
function doorCells(out) {
  const ids = out.body && out.body.groups ? out.body.groups.flatMap((g) => g.items.map((i) => i.id)) : [];
  const SCOPE = { 'public.vendor_roster': 'owner_vendor_id', 'engine.records': 'agent_id' };
  const unscoped = out.reads.filter((r) => !r.filters.some(([op, c, v]) => op === 'eq' && c === (SCOPE[r.table] || 'vendor_id') && (v === 'A' || v === 'agent-A')));
  return {
    ids: ids.sort().join(','),
    kinds: out.body && out.body.groups ? out.body.groups.map((g) => g.kind).join(',') : '',
    unscoped: unscoped.map((r) => r.table).join(','),
    tables: [...new Set(out.reads.map((r) => r.table))].sort().join(','),
  };
}
(async () => {
  const src = read(DOOR);
  const a = doorCells(await drive(src, 'A', 'priya'));
  ok('2.1 A’s search finds A’s record of every kind', a.ids === 'CA,EA,IA,LA,NA,PA,RA', a.ids);
  ok('2.2 and never B’s: every read carries her scope (vendor id; her ledger’s agent for invoices)', a.unscoped === '' && !/B/.test(a.ids), 'unscoped: ' + a.unscoped);
  ok('2.3 grouped and labelled by kind, in the ruled order', a.kinds === 'enquiries,clients,events,invoices,packages,notes,crew', a.kinds);
  ok('2.4 it reads only the tables the rooms already list (no new table)', a.tables === 'engine.records,public.clients,public.events,public.leads,public.owner_notes,public.vendor_packages,public.vendor_roster', a.tables);
  const n = doorCells(await drive(src, 'A', '2345'));
  ok('2.5 the last four digits find her enquiry and her client, never B’s', n.ids === 'CA,LA', n.ids);
  const e = await drive(src, 'A', '  ');
  ok('2.6 an empty box reads nothing', e.reads.length === 0 && e.body.ok === true && e.body.groups.length === 0);

  console.log('\n§3 the mount');
  ok('3.1 mounted at /api/v2/vendor/search behind her session', /router\.use\('\/search',\s+require\('\.\/search'\)\);/.test(read('src/api/vendor/core.js')) && /router\.get\('\/', requireAuth, resolveVendor\(\)/.test(src));
  // this cut's one migration is 0185 (the layout flag's seed row), and it creates no table.
  // AMENDED BY LABEL, CE-46 WEB-4 cut 2 r5 (C-44.7: a cell pins its own delivery's bytes, never a live listing): the cell
  // read every migration from 0185 ON, so any later seat's table (WEB-4's 0187) reddened it; it now reads 0185 alone.
  const mkTable = fs.readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => /^\d{4}_.*\.sql$/.test(f) && f.slice(0, 4) === '0185' && /create table/i.test(read('db/migrations/' + f)));
  ok('3.2 no new table, and the door only reads (no insert, update, upsert, delete or rpc)', mkTable.length === 0 && !/\.(insert|update|upsert|delete|rpc)\(/.test(src), mkTable.join(','));

  console.log('\n§4 mutations');
  const S2 = loadFrom(MATCHER, read(MATCHER).replace(".replace(/([a-z])\\1+/g, '$1')", ''));
  const mm = matcherCells(S2);
  ok('4.1 the doubled-letter fold removed → 1.2 RED', !(mm.priyaa === 'C1,L1' && mm.agarwal === 'L1' && mm.annu === 'L3'));
  const src2 = src.replace("select('id, name, phone, email')\n      .eq('vendor_id', vendorId)", "select('id, name, phone, email')\n      .is('deleted_at', null)");
  const b = doorCells(await drive(src2, 'A', 'priya'));
  ok('4.2 the clients read unscoped → 2.2 RED', src2 !== src && !(b.unscoped === '' && !/B/.test(b.ids)), b.unscoped);

  console.log(`\n${fail ? 'RED' : 'GREEN'} — d1 search ${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
