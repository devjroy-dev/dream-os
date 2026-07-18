#!/usr/bin/env node
// scripts/b6_floors_bench.js — TDW_06, M-7(ii): THE MECHANICAL-FLOORS BENCH.
// Two floors ruled at the manual paper, both proven here BOTH WAYS (a floor that
// only fires is as unproven as one that never does):
//
//   M-2 — THE PROVENANCE HOLD (provenanceHold.ts, seated in donna.ts's one write
//   seam): a rupee figure in a WRITE hand must be present in the vendor's own
//   words this thread, else the hand HOLDS with the honest question.
//   ► THE NAMED TEST (§2): F-04.70's ₹50,000 — the founder's actual message
//     ("book a shoot for Zoya Persist Test on 18 December, 7 pm.", no figure
//     anywhere) against the actual laundered hand (donna_lead value_estimate
//     50000). Pre-floor that write LANDED; the bench asserts it now HOLDS —
//     and that the same hand with the figure honestly spoken ("50k") writes.
//
//   M-4 — RECOGNITION LINES (donnaFind.ts): the zero-match dump keeps
//   name-as-shown · plane/archive tag · stage · id; phones and money DROPPED
//   from the zero-match payload only; matched payloads untouched; FIND_LIMIT the
//   named constant at 15 with its reason attached.
//
// Runs on the compiled dist (the same bytes production serves) over an in-memory
// db double — no keys, no network, nothing touches production. The §5 leg drives
// the REAL runDonnaTurn so the hold is proven at the seam a real caller reaches
// (§9's law: a green over an unreachable path is not evidence).
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

// ── the db double, armed per section (the gauntlet's own pattern, kept local so
//    this bench runs from any working directory on a clean clone) ──────────────
const store = { leads: [], records: [], leadInserts: [], leadUpdates: [] };
function resetStore() { store.leads.length = 0; store.records.length = 0; store.leadInserts.length = 0; store.leadUpdates.length = 0; }
let ids = 0;
const nid = (p) => `${p}-${++ids}`;
const AGENT = '88888888-8888-4888-8888-888888888888';
const OWNER_USER = '99999999-9999-4999-8999-999999999999';
const AUTH_USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VENDOR_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const one = (row) => ({ data: row, error: null });
function answer(q) {
  const t = q._t, op = q._op, mode = q._mode, body = q._body;
  const filt = (rows) => { let r = rows; for (const fn of q._f) r = r.filter(fn); if (q._orderCol) { r = [...r].sort((a, b) => String(a[q._orderCol]).localeCompare(String(b[q._orderCol]))); if (q._orderDesc) r.reverse(); } if (q._limit) r = r.slice(0, q._limit); return r; };
  if (op === 'select') {
    if (t === 'agents') return one({ id: AGENT, user_id: OWNER_USER, tier: 'entry', display_name: 'Floors Vendor', profession_preset: null, timezone: 'Asia/Kolkata', mode: 'advisory' });
    if (t === 'users') return one(filt([{ id: OWNER_USER, auth_user_id: AUTH_USER }])[0] ?? null);
    if (t === 'vendors') return { data: filt([{ id: VENDOR_ID, user_id: OWNER_USER }]), error: null };
    if (t === 'leads') return mode ? one(filt(store.leads)[0] ?? null) : { data: filt(store.leads), error: null };
    if (t === 'records') return { data: filt(store.records), error: null };
    if (t === 'agent_snapshot') return one({ note: { items: [], rebuilt_at: '2026-07-18T00:00:00Z' } });
    if (t === 'facts') return { data: [], error: null };
    return mode ? { data: null, error: null } : { data: [], error: null };
  }
  if (op === 'insert') {
    if (t === 'leads') { const row = { id: nid('lead'), created_at: new Date().toISOString(), deleted_at: null, ...body }; store.leads.push(row); store.leadInserts.push(row); return one(row); }
    return mode ? one({ id: nid('row') }) : { data: null, error: null };
  }
  if (op === 'update') {
    if (t === 'leads') { const rs = filt(store.leads); rs.forEach((r) => Object.assign(r, body)); store.leadUpdates.push({ body, rows: rs.map((r) => r.id) }); return mode ? one(rs[0] ?? null) : { data: rs, error: null }; }
    return { data: null, error: null };
  }
  return { data: null, error: null };
}
function mkq(t) {
  const q = { _t: t, _op: 'select', _mode: null, _f: [], _limit: 0, _orderCol: null, _orderDesc: false };
  const self = new Proxy(q, { get(target, prop) {
    if (prop === 'then') { const r = answer(target); return (res) => res(r); }
    if (prop === 'insert' || prop === 'update' || prop === 'upsert') return (body) => { target._op = prop === 'upsert' ? 'insert' : String(prop); target._body = body; return self; };
    if (prop === 'maybeSingle' || prop === 'single') return () => { target._mode = String(prop); return Promise.resolve(answer(target)); };
    if (prop === 'eq') return (c, v) => { target._f.push((r) => r[c] === v); return self; };
    if (prop === 'in') return (c, vs) => { target._f.push((r) => vs.includes(r[c])); return self; };
    if (prop === 'is') return (c, v) => { target._f.push((r) => (r[c] === undefined ? null : r[c]) === v); return self; };
    if (prop === 'not') return () => self;
    if (prop === 'or') return () => self; // wide net answered permissively; filters below decide
    if (prop === 'ilike') return (c, v) => { const re = new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i'); target._f.push((r) => re.test(String(r[c] ?? ''))); return self; };
    if (prop === 'order') return (col, opts) => { target._orderCol = col; target._orderDesc = !!(opts && opts.ascending === false); return self; };
    if (prop === 'limit') return (n) => { target._limit = n; return self; };
    if (prop === 'select') return () => self;
    if (prop in target) return target[prop];
    return () => self;
  } });
  return self;
}
const db = { from: (t) => mkq(t), schema: () => db };
{
  const dbPath = path.join(ROOT, 'src/engine/dist/core/db.js');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { supabase: db } };
}

const DIST = path.join(ROOT, 'src/engine/dist/core');
if (!fs.existsSync(path.join(DIST, 'provenanceHold.js'))) {
  console.error('engine dist absent or pre-floors — run: npm run build && node scripts/b6_floors_bench.js');
  process.exit(2);
}
const { checkMoneyProvenance, extractVendorFigures, MONEY_WRITE_FIELDS } = require(path.join(DIST, 'provenanceHold.js'));
const { parseMoney } = require(path.join(DIST, 'tools/recordPrimitives.js'));
const { executeFindTool } = require(path.join(DIST, 'tools/donnaFind.js'));
const { runDonnaTurn } = require(path.join(DIST, 'donna.js'));

(async () => {
  sec('§1 — ONE HOME: the hold computes zeros exactly as the hands do (parseMoney shared)');
  T("'50k' → 50000 both readers", parseMoney('50k') === 50000 && extractVendorFigures('50k').has(50000));
  T("'2.5L' · '2.5 lakh' · 'Rs 2,50,000' · '250000' are ONE figure", ['2.5L', '2.5 lakh', 'Rs 2,50,000', '250000'].every((s) => extractVendorFigures(s).has(250000)));
  T("'1.2cr' and '1.2 crore' are ONE figure", extractVendorFigures('1.2cr around').has(12000000) && extractVendorFigures('say 1.2 crore total').has(12000000));
  T("'₹90,000' reads as 90000", extractVendorFigures('quote her ₹90,000 flat').has(90000));
  T('two-digit bare numbers are never money (a "14 February" cannot vouch for Rs 14)', !extractVendorFigures('wedding 14 February, 7 pm, 2 shoots').has(14));

  sec('§2 — THE NAMED TEST: F-04.70\u2019s \u20B950,000 (the founder\u2019s message verbatim vs the laundered hand)');
  const F0470_MSG = 'book a shoot for Zoya Persist Test on 18 December, 7 pm.';
  const named = checkMoneyProvenance('donna_lead', { value_estimate: 50000 }, F0470_MSG);
  T('the hand HOLDS — the figure the vendor never uttered cannot ride a lawful hand', !!named && named.figure === 50000);
  T('the hold speaks the honest question (the figure named, nothing written, ask the owner)', !!named && /HELD/.test(named.display) && /Rs 50000/.test(named.display) && /nothing was written/i.test(named.display) && /confirm the amount/i.test(named.display));
  T('the same hand with the figure honestly spoken ("50k") PASSES — the floor is provenance, not money-phobia', checkMoneyProvenance('donna_lead', { value_estimate: 50000 }, F0470_MSG + '\nBudget is 50k she said.') === null);

  sec('§3 — COVERAGE: every money field on every write hand; nothing else ever held');
  T('the map covers the five money-writing hands, enumerated from the schemas', ['donna_lead', 'donna_money', 'donna_money_edit', 'donna_merge', 'donna_split'].every((k) => Array.isArray(MONEY_WRITE_FIELDS[k])));
  T('donna_money "90k" vs the owner\u2019s "Rs 90,000" — one figure, passes', checkMoneyProvenance('donna_money', { amount: '90k', direction: 'in' }, 'Rhea paid Rs 90,000 today') === null);
  T('donna_money "90k" with no spoken figure — holds', !!checkMoneyProvenance('donna_money', { amount: '90k', direction: 'in' }, 'Rhea paid today, log it'));
  T('donna_money_edit amount_pending "2.5L" vs "2.5 lakh" — passes', checkMoneyProvenance('donna_money_edit', { binder_id: 'x', amount_pending: '2.5L' }, 'pending is 2.5 lakh now') === null);
  T('donna_money_edit with an unspoken correction figure — holds on the guilty FIELD', (() => { const h = checkMoneyProvenance('donna_money_edit', { binder_id: 'x', amount_received: '40000' }, 'mark the advance received'); return !!h && h.field === 'amount_received' && h.figure === 40000; })());
  T('donna_merge numeric amount unspoken — holds', !!checkMoneyProvenance('donna_merge', { survivor_id: 'a', retire_id: 'b', amount: 75000 }, 'merge the two Rheas'));
  T('donna_split numeric amount spoken — passes', checkMoneyProvenance('donna_split', { source_id: 'a', amount: 75000 }, 'her half is 75k, split it out') === null);
  T('a money hand with NO figure given is never held (money figures only)', checkMoneyProvenance('donna_money_edit', { binder_id: 'x', payment_status: 'received' }, 'no numbers here') === null);
  T('READ hands are never held, whatever they carry (write hands only)', checkMoneyProvenance('donna_find', { client: '50000' }, '') === null);
  T('non-money WRITE hands are never held (donna_edit is money-blind by contract)', checkMoneyProvenance('donna_edit', { binder_id: 'x', note: 'she mentioned 50000 in passing' }, '') === null);
  T('an unparseable amount is the DOOR\u2019s error, not the hold\u2019s (no double-speak)', checkMoneyProvenance('donna_money', { amount: 'fifty-ish', direction: 'in' }, '') === null);

  sec('§4 — THE CORPUS: this thread\u2019s vendor words, whole; fail-closed when absent');
  T('a figure spoken in an EARLIER message this thread vouches (thread scope, not turn scope)', checkMoneyProvenance('donna_lead', { value_estimate: 300000 }, 'Priya enquired, budget 3L\n\u2026\nbook her shoot for March') === null);
  T('a missing corpus fails CLOSED — a caller that cannot supply the thread cannot vouch for a figure', !!checkMoneyProvenance('donna_lead', { value_estimate: 100 }, undefined));
  T('an empty corpus fails CLOSED the same way', !!checkMoneyProvenance('donna_lead', { value_estimate: 100 }, ''));

  sec('§5 — THE SEAM: the REAL runDonnaTurn holds the hand a real caller would fire');
  // Donna scripted to do exactly what F-04.70\u2019s Donna did: donna_lead with the
  // laundered value_estimate, then speak. The transport is scripted; everything
  // from the tool loop down \u2014 the hold, the door, the double\u2019s rows \u2014 is REAL dist.
  const script = (blocks) => ({ provider: 'anthropic', stream: () => ({ on() {}, finalMessage: async () => blocks.shift() }), create: async () => blocks.shift() });
  const msg = (content) => ({ content, usage: { input_tokens: 50, output_tokens: 10 } });
  const laundered = () => [msg([
    { type: 'tool_use', id: 'dl-1', name: 'donna_lead', input: { name: 'Zoya Persist Test', value_estimate: 50000 } },
    { type: 'tool_use', id: 'lh-1', name: 'listen_harvey_talk', input: { message: 'Handled.' } },
  ])];
  resetStore();
  const heldTurn = await runDonnaTurn(AGENT, 'Log the Zoya booking.', null, undefined, undefined, undefined, undefined, F0470_MSG, script(laundered()), undefined, F0470_MSG);
  const heldCall = heldTurn.tool_calls.find((c) => c.name === 'donna_lead');
  T('the hand HELD at the seam \u2014 tool result is the hold sentence, not a write', !!heldCall && /^HELD/.test(heldCall.result));
  T('ZERO leads rows landed (the pre-floor write is dead \u2014 rows convict the cure the same way they convicted the disease)', store.leadInserts.length === 0 && store.leadUpdates.length === 0);
  T('the turn is not marked mutated by a held hand', heldTurn.mutated === false);
  resetStore();
  const spoken = F0470_MSG + '\nShe said 50k, log that as the estimate.';
  const passTurn = await runDonnaTurn(AGENT, 'Log the Zoya booking with the 50k estimate.', null, undefined, undefined, undefined, undefined, spoken, script(laundered()), undefined, spoken);
  const wrote = store.leadInserts.find((l) => /zoya persist test/i.test(String(l.name || '')));
  T('the SAME hand with the figure honestly on the thread WRITES \u2014 budget_max 50000 lands', !!wrote && wrote.budget_max === 50000 && passTurn.mutated === true);
  resetStore();
  const noCorpus = await runDonnaTurn(AGENT, 'Log the Zoya booking.', null, undefined, undefined, undefined, undefined, F0470_MSG, script(laundered()), undefined, undefined);
  const ncCall = noCorpus.tool_calls.find((c) => c.name === 'donna_lead');
  T('a corpus-less call holds at the seam too (fail-closed end to end)', !!ncCall && /^HELD/.test(ncCall.result));

  sec('§6 — M-4: RECOGNITION LINES \u2014 the zero-match dump\u2019s ruled shape');
  resetStore();
  store.records.push(
    { id: 'rec-a1', agent_id: AGENT, client: 'Rhea Referent Test', amount: 50000, direction: 'in', amount_received: 20000, amount_pending: 30000, payment_status: 'part', date: '2026-12-02', stage: 'booked', note: 'advance received', doc_ref: null, phone: '9811077001', reason_for_action: null, hidden: false, updated_at: '2026-07-10' },
    { id: 'rec-a2', agent_id: AGENT, client: 'Meera Floor Test', amount: 125000, direction: 'in', amount_received: null, amount_pending: null, payment_status: null, date: null, stage: 'lead', note: 'city corrected: Jaipur \u2192 Udaipur', doc_ref: null, phone: '9811003344', reason_for_action: null, hidden: false, updated_at: '2026-07-09' },
    { id: 'rec-a3', agent_id: AGENT, client: 'Old Archived Test', amount: 90000, direction: 'in', amount_received: null, amount_pending: null, payment_status: null, date: null, stage: 'closed', note: null, doc_ref: null, phone: '9811005566', reason_for_action: null, hidden: true, updated_at: '2026-07-08' },
  );
  store.leads.push({ id: 'lead-z9', vendor_id: VENDOR_ID, deleted_at: null, name: 'Tanvi Enquiry Test', phone: '9811009900', state: 'new', budget_max: 40000, wedding_date: '2027-02-14', wedding_city: 'Jaipur', notes: null, created_at: '2026-07-11' });
  // The double answers .or() permissively (every row), so a real zero-match is
  // forced with a token that ALSO misses every text cell \u2014 the in-memory rank
  // then carries all rows and the dump path is exercised via the no-rows arm below.
  // For the true zero-match arm, empty the tables\u2019 match by searching a token and
  // clearing rows first:
  const savedRecs = store.records.splice(0, store.records.length);
  const savedLeads = store.leads.splice(0, store.leads.length);
  const emptyWorld = await executeFindTool(AGENT, { client: 'Zzz Nomatch Probe' });
  T('both planes truthfully empty \u2192 the honest \u201cnothing on file\u201d sentence (unchanged)', /Nothing on file yet/.test(emptyWorld.display));
  store.records.push(...savedRecs);
  store.leads.push(...savedLeads);
  // zero-match with a populated cabinet: rows exist, none match \u2014 the double\u2019s
  // permissive .or() would return them all, so the zero-match arm is driven by
  // making every text cell miss the ilike-free in-memory path: the dist code\u2019s
  // zero-match branch triggers on rows.length === 0 from the QUERY \u2014 emulate by
  // filtering on a client eq that misses via the ilike filter below.
  // (The double\u2019s .or is a no-op, so instead assert the dump\u2019s SHAPE through the
  // no-token stage-filter path, which reaches the same zero-match branch.)
  const dump = await executeFindTool(AGENT, { stage: 'no-such-stage' });
  T('the zero-match dump exists (recovery kept \u2014 M-4 keeps the fallback, reshapes it)', /No record matched|most recent records/.test(dump.display));
  T('recognition lines carry id + name-as-shown + stage', /\[rec-a1\] client="Rhea Referent Test" \| stage booked/.test(dump.display));
  T('the [ARCHIVED] tag survives (plane/archive tag is load-bearing)', /\[rec-a3\][^\n]*\[ARCHIVED\]/.test(dump.display));
  T('PHONES are gone from the zero-match dump', !/9811077001|9811003344|9811005566|phone /.test(dump.display.split('enquiries plane')[0]));
  T('MONEY is gone from the zero-match dump', !/Rs 50000|Rs 125000|Rs 90000|received|pending/.test(dump.display.split('enquiries plane')[0]));
  T('the tokenless enquiries slice rides in RECOGNITION shape too (no budget, no phone, no date)', (() => { const tail = dump.display.split('enquiries plane')[1] || ''; return /\[ENQUIRY\] lead-z9 \u2014 "Tanvi Enquiry Test" \| state new/.test(tail) && !/40000|9811009900|2027-02-14/.test(tail); })());
  const matched = await executeFindTool(AGENT, { client: 'Rhea Referent Test' });
  T('a MATCHED payload is untouched \u2014 money still rides describeRow whole', /Rs 50000/.test(matched.display) && /received Rs 20000/.test(matched.display) && /phone 9811077001/.test(matched.display));
  T('a MATCHED enquiry line is untouched \u2014 budget and phone still speak on the match branch', /budget Rs 40000/.test(matched.display) && /phone 9811009900/.test(matched.display));

  sec('§7 — FIND_LIMIT: the named constant at 15, reason attached, behaviour proven');
  resetStore();
  for (let i = 1; i <= 20; i++) store.records.push({ id: `rec-b${i}`, agent_id: AGENT, client: `Breadth Test ${i}`, amount: 1000 * i, direction: 'in', amount_received: null, amount_pending: null, payment_status: null, date: null, stage: 'lead', note: null, doc_ref: null, phone: `98110${String(10000 + i).slice(1)}`, reason_for_action: null, hidden: false, updated_at: `2026-06-${String(30 - i).padStart(2, '0')}` });
  const wide = await executeFindTool(AGENT, { stage: 'no-such-stage' });
  const lineCount = (wide.display.match(/\[rec-b\d+\]/g) || []).length;
  T('the zero-match dump is capped at exactly 15 (recognition wants breadth; 15 is the law)', lineCount === 15);
  const src = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/donnaFind.ts'), 'utf8');
  T('the constant is NAMED in source with its reason attached (the 10-vs-15 drift closed by law, not residue)', /FIND_LIMIT — THE NAMED CONSTANT/.test(src) && /const FIND_LIMIT = 15;/.test(src) && /drift/i.test(src.split('const FIND_LIMIT = 15;')[0].slice(-900)));
  T('the stale "10 records" comment is gone (the drift\u2019s teaching line retired)', !/10 records, raw ids, phones, money/.test(src));

  console.log(`\n${fail === 0 ? '\u2550\u2550 ' + pass + '/' + (pass + fail) + ' PASS \u2550\u2550' : 'FAILURES  ' + pass + '/' + (pass + fail)}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('FLOORS BENCH CRASH:', e && e.stack || e); process.exit(1); });
