#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b51_referrals_bench.js — TDW_19 G5.1, the overflow exchange.
//
//   node scripts/b51_referrals_bench.js
//
// WHAT IT DRIVES: the REAL src/lib/vendor/referrals.js and, through it, the
// REAL createLead in src/lib/vendor/leads.js. Nothing under test is stubbed.
// The only double is the supabase client — an in-memory store honouring the
// select/eq/is/in/not/order/maybeSingle/single/insert/update chain the
// production callers actually use.
//
// BOTH-WAYS (non-vacuous by PRODUCTION mutation, never test setup):
//   §2  delete the `if (existing)` refusal in forwardLead        → §2 flips RED
//   §3  change PEER_REFERRAL_SOURCE to 'referral'                → §3 flips RED
//   §4  drop the `member_vendor_id` eq from the roster read      → §4 flips RED
//   §5  add `state: 'forwarded'` to the original lead            → §5 flips RED
//   §6  delete the step-4 dedupe refusal from forwardLead        → §6 flips RED
//   §6b add a tier gate to forwardLead                          → §6b flips RED
//   §8b delete `forwarded_by` from the leads list mapper         → §8b flips RED
//   ── SITTING 2 ──
//   §10 drop `.eq('peer_discoverable', true)` from searchPeers   → §10 flips RED
//   §10 drop `.neq('id', vendorId)` from searchPeers             → §10 flips RED
//   §10 return empty groups instead of filtering them out        → §10 flips RED
//   §10 raw category compare instead of normaliseCategory        → §10 flips RED
//   §11 read `out.wamid` instead of `out.result.wamid`           → §11 flips RED
//   §11 delete the recordAlert call on the failure path          → §11 flips RED
//   §12 set `told` from status instead of from a wamid           → §12 flips RED
//   §14 flip referral_alert's status to 'approved'               → §14 flips RED
//   §15 drop the WHERE from uq_referral_alerts_referral_sent     → §15 flips RED
//   §16 remove peer_discoverable from BOOLEAN_FIELDS             → §16 flips RED
//       (BEHAVIOURALLY INERT — see §6's own note. The guard it removes is
//        outcome-equivalent to createLead's own dedupe on this path, so §2's
//        cells stay green. The cell that catches it is structural, and that
//        asymmetry is disclosed at the cell rather than papered over.)
// Each is a real edit to a shipped file, reverted after. Run them; a cell that
// cannot go red is a cell that proves nothing.
//
// WHAT IT DOES NOT PROVE, NAMED SO IT IS NOT ASSUMED:
//   · that 0135 has run. The plane is founder-run in the editor; this bench
//     drives the code that will write to it, on a double.
//   · any live DB behaviour, any RLS, any FK enforcement. The double honours
//     no constraint — the UNIQUE on new_lead_id and both FK delete rules are
//     asserted by READING 0135, not by exercising it (§8).
//   · that the pwa calls any of this. The surfaces are the pwa arm's.
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.resolve(__dirname, '..');

// ⚠ ORDER IS LOAD-BEARING. `referralAlert.js` DESTRUCTURES `{ sendWa }` at
// module load, so the export must be replaced BEFORE anything that requires it
// is required. Patching after the fact would leave the real transport bound and
// this bench would attempt a live Meta POST. Node's module cache is what makes
// the swap reach the destructure: one object, mutated before the reader runs.
const sendWaMod = require(path.join(ROOT, 'src/lib/sendWa.js'));
let waCalls = [];
let waBehaviour = 'ok';
sendWaMod.sendWa = async (opts) => {
  waCalls.push(opts);
  if (waBehaviour === 'opted_out') { const e = new Error('opted out'); e.name = 'WaOptedOutError'; throw e; }
  if (waBehaviour === 'boom')      { const e = new Error('meta said no'); e.code = '131049'; throw e; }
  // THE RETURN SHAPE IS sendWa's OWN, asserted against the real file in §11 so
  // a future flattening reds both sides at once (F-40.210's cell, inherited).
  return { sent: true, mode: 'template', key: opts.templateKey, from: 'X', to: opts.to,
           payload: {}, result: { ok: true, wamid: 'wamid.HBgM' + waCalls.length } };
};

const referrals = require(path.join(ROOT, 'src/lib/vendor/referrals.js'));
const leadsLib  = require(path.join(ROOT, 'src/lib/vendor/leads.js'));
const alertLib  = require(path.join(ROOT, 'src/lib/vendor/referralAlert.js'));
// ── CE-41 C1 AMENDMENT (labeled, ratify-or-revert; R-38.19's bench-follows-the-law) ──
// The flag this bench toggled through `process.env` now lives on the switchboard
// (`src/lib/capabilities.js`, R-41.8). The cells below keep their names and their
// questions; the LEVER is the register's bind seam instead of the env var.
const cap = require(path.join(ROOT, 'src/lib/capabilities.js'));
function capDouble(states) {
  return { from: () => { let key = null; const api = {
    select() { return api; }, order() { return api; }, update() { return api; },
    eq(_c, v) { key = v; return api; },
    maybeSingle: async () => ({ data: key in states ? { key, kind: 'flag', status: states[key], evidence: null, auto_on: false, walk_ref: null } : null, error: null }),
    // list() reads through here: answer the same rows the prime did, so the
    // bind's async warm cannot wipe the table a tick after `switchboard()` set it.
    then(res) { return Promise.resolve({ data: Object.entries(states).map(([key, status]) => ({ key, kind: 'flag', status, evidence: null, auto_on: false, walk_ref: null })), error: null }).then(res); },
  }; return api; } };
}
function switchboard(states) { cap._resetCapabilitiesCache(); cap.bind(capDouble(states)); cap._prime(Object.entries(states).map(([key, status]) => ({ key, kind: 'flag', status }))); }

const templates = require(path.join(ROOT, 'src/lib/templates.js'));

// COMMENT-STRIPPED SOURCE. Three cells in sitting 1 read PROSE AS CODE — a
// money cell matched the local `inRes`, a sole-writer cell counted a table named
// in a comment, and §8b's regex could not cross a `)`. This sitting's own census
// hit the same wall within the hour: `grep "from('referral_alerts')"` returned
// TWO files, and the second was the comment in referrals.js explaining why there
// is only one. Every textual assertion below reads `codeOf`, never the raw file.
const codeOf = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');

let pass = 0, fail = 0;
const ok = (label, cond) => {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else      { fail++; console.log(`  FAIL  ${label}`); }
};
const section = (t) => console.log(`\n── ${t} ──`);

const FROM = 'vendor-dev440';
const TO   = 'vendor-droy550';
const STRANGER = 'vendor-stranger';
const fromVendor = { id: FROM, business_name: 'Dev Roy Photography' };

// ── the in-memory supabase double (transport only) ──────────────────────────
function makeDb(seed = {}) {
  const tables = { leads: [], vendors: [], vendor_roster: [], lead_referrals: [],
                   referral_alerts: [], users: [], clients: [], ...seed };
  let uid = 0;
  const nextId = (p) => `${p}-${++uid}`;

  function from(table) {
    const rows = tables[table] || (tables[table] = []);
    const q = { _filters: [], _table: table };
    q.select = () => q;
    q.eq  = (c, v) => { q._filters.push(r => r[c] === v); return q; };
    q.is  = (c, v) => { q._filters.push(r => (r[c] ?? null) === v); return q; };
    q.in  = (c, vs) => { q._filters.push(r => vs.includes(r[c])); return q; };
    q.not = (c, _op, v) => { q._filters.push(r => (r[c] ?? null) !== v); return q; };
    q.neq = (c, v) => { q._filters.push(r => r[c] !== v); return q; };
    // PostgREST's `or` takes `col.ilike.*term*` clauses joined by commas. PARSED
    // here rather than accepted blindly, so a cell can prove WHICH columns the
    // door searches — a double that ignored the filter string would let the
    // phone key (c-40.45) come back and redden nothing.
    q.or = (expr) => {
      const clauses = String(expr).split(',').map((c) => {
        const m = c.match(/^([a-z_]+)\.ilike\.\*(.*)\*$/i);
        return m ? { col: m[1], term: m[2].toLowerCase() } : null;
      }).filter(Boolean);
      q._orCols = clauses.map((c) => c.col);
      q._filters.push((r) => clauses.some((c) => String(r[c.col] == null ? '' : r[c.col]).toLowerCase().includes(c.term)));
      return q;
    };
    q.order = () => q;
    q.limit = (n) => { q._limit = n; return q; };
    const matched = () => {
      const hit = rows.filter(r => q._filters.every(f => f(r)));
      return q._limit ? hit.slice(0, q._limit) : hit;
    };
    q.maybeSingle = async () => ({ data: matched()[0] || null, error: null });
    q.single      = async () => ({ data: matched()[0] || null, error: null });
    q.then = (res) => res({ data: matched(), error: null });   // bare await
    q.insert = (payload) => {
      const row = { id: nextId(table), created_at: new Date().toISOString(), deleted_at: null, ...payload };
      rows.push(row);
      const ins = {
        select: () => ins,
        single:      async () => ({ data: row, error: null }),
        maybeSingle: async () => ({ data: row, error: null }),
      };
      return ins;
    };
    q.update = (patch) => {
      const upd = {
        _f: [],
        eq(c, v) { this._f.push(r => r[c] === v); return this; },
        is(c, v) { this._f.push(r => (r[c] ?? null) === v); return this; },
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

const PRIYA = () => ({
  id: 'lead-priya', vendor_id: FROM, name: 'Priya Nair', phone: '+919812345678',
  email: null, wedding_date: '2027-02-14', wedding_date_precision: 'day',
  wedding_city: 'Jaipur', event_types: null, budget_min: null, budget_max: 350000,
  state: 'new', source: 'whatsapp', referrer_name: null, notes: 'Called twice. Wants film.',
  raw_message: 'Hi, saw your work', deleted_at: null, client_id: null, draft_meta: null,
  created_at: '2026-08-28T00:00:00Z',
});
// ── ⚠ THE FIXTURE, CORRECTED. THREE ACCOUNTS EXIST AND THE KICKOFF CONFLATED
//    TWO OF THEM.
//   DEV440           Dev Roy Photography    photography  essential  +919888294440
//   DROY550          Dev Roy Photography 1  photography  BASIC      +918757788550
//   MAKEUPBYSWATIROY Make Up by Swati Roy   makeup       prestige   +918595356978
//
// The kickoff said 「DROY550 (`makeupbyswatiroy`)」 and gave DROY550's number as
// `8595356978`. Those are two different vendors. This seat matched the fixture
// SELECT on the PHONE, got MAKEUPBYSWATIROY back, and wrote the kickoff's label
// onto that row — so it reported the pair as cross-trade, "corrected" the
// acceptance card twice, and was wrong both times. Derived properly only when
// the founder's own walk drew a roster row naming `Dev Roy Photography 1`.
//
// ⚠ THE SEED BELOW BINDS `TO` TO SWATI DELIBERATELY, AND THAT IS NOW A CHOICE
// RATHER THAN A MISTAKE. It gives the bench a CROSS-TRADE pair, which is what
// the grouping cells need: with two photographers, `same_trade` and
// `worked_with` could not be told apart. The production walk used DROY550 —
// same trade, on the roster, basic tier — and proved the other precedence.
// Neither seeding is "the" fixture; each tests what the other cannot.
//
// The lesson kept: a kickoff is a chair document, not a source of facts about
// the database, and a label is not derived by matching a different column.
const V = (id, name, cat, city, over = {}) => ({
  id, business_name: name, category: cat, city,
  // ⚠ THE HANDLE WAS MISSING FROM THE FIRST CUT and the handle cell went RED on
  // correct code. A fixture that omits a column the door searches is a cell that
  // tests nothing — the same family as sitting 1's four instrument defects.
  routing_handle: name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20),
  status: 'active', discover_paused: false, peer_discoverable: true,
  user_id: 'user-' + id, tier: 'essential', ...over,
});
const seedBase = () => ({
  leads: [PRIYA()],
  vendors: [
    V(FROM, 'Dev Roy Photography',  'photography', 'Delhi'),
    V(TO,   'Make Up by Swati Roy', 'makeup',      'Delhi'),
  ],
  users: [
    { id: 'user-' + FROM, phone: '+919888294440' },
    { id: 'user-' + TO,   phone: '+918595356978' },
  ],
  vendor_roster: [{ id: 'r1', owner_vendor_id: FROM, member_vendor_id: TO, name: 'Make Up by Swati Roy', category: 'makeup', source: 'collab_accepted' }],
});

// The wider table the SEARCH has to sort, group and refuse.
const seedSearch = () => {
  const base = seedBase();
  base.vendors.push(
    V('v-zeta',   'Zeta Films',       'videography', 'Delhi'),   // same trade, alias-normalised
    V('v-anchal', 'Anchal Photo Co',  'Photography', 'Mumbai'),  // same trade, case differs
    V('v-hidden', 'Hidden House',     'photography', 'Delhi', { peer_discoverable: false }),
    V('v-paused', 'Paused Studio',    'photography', 'Delhi', { discover_paused: true }),
    V('v-gone',   'Retired Studio',   'photography', 'Delhi', { status: 'inactive' }),
    V('v-jewel',  'Aurum Jewellery',  'jewellery',   'Delhi'),
  );
  return base;
};

(async () => {

// ══ §1 — THE FORWARD LANDS ═════════════════════════════════════════════════
section('1. the forward lands, and lands through createLead');
{
  const db = makeDb(seedBase());
  const r = await referrals.forwardLead(db, fromVendor, {
    leadId: 'lead-priya', toVendorId: TO, note: 'Booked that weekend.',
  });
  ok('the forward reports ok', r.ok === true);
  ok('a referral row was filed', !!r.referral);
  ok('exactly ONE lead_referrals row exists', db._tables.lead_referrals.length === 1);

  const copy = db._tables.leads.find(l => l.vendor_id === TO);
  ok('the peer has a NEW lead row', !!copy);
  ok('the copy carries the couple\'s phone', copy.phone === '+919812345678');
  ok('the copy carries the wedding date', copy.wedding_date === '2027-02-14');
  ok('the copy enters the peer\'s pipeline as `new` — leads.js\'s own literal, not this plane\'s',
     copy.state === 'new');
  ok('the referral row points at the copy', db._tables.lead_referrals[0].new_lead_id === copy.id);
  ok('the referral row points back at the original', db._tables.lead_referrals[0].lead_id === 'lead-priya');
  ok('the note is on the row', db._tables.lead_referrals[0].note === 'Booked that weekend.');

  // ── R-G51.14 / F-40.120 · THE NOTE LIVES IN ONE PLACE ────────────────────
  // MUTATION: restore `notes: note || null` to the createLead call → these red.
  //
  // The first cut wrote the sender's note onto BOTH the referral row and the
  // peer's `leads.notes`, and the founder's walk showed it rendering twice on
  // one record. No bench saw it: every cell asserted the note REACHED the wire,
  // none asked how many places it arrived in. Counting is the cure.
  ok('the peer\'s copy carries NO notes — the note is the sender\'s provenance, not the peer\'s working record',
     (copy.notes ?? null) === null);
  ok('and the note is on the referral row, which is its one home',
     db._tables.lead_referrals[0].note === 'Booked that weekend.');
  ok('the ORIGINAL lead\'s own notes are not carried either — a forward is not consent to publish them',
     (copy.notes ?? null) !== 'Called twice. Wants film.');
}

// ══ §2 — THE REFUSAL · R-G51.2 / F-40.84 ═══════════════════════════════════
// MUTATION: delete the `if (existing)` branch in forwardLead → these go RED.
section('2. the peer already holds the couple — REFUSED, and nothing is written');
{
  const seed = seedBase();
  seed.leads.push({ ...PRIYA(), id: 'lead-peer-already', vendor_id: TO, source: 'whatsapp' });
  const db = makeDb(seed);
  const before = db._tables.leads.length;

  const r = await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: 'x' });

  ok('the forward is REFUSED', r.ok === false);
  ok('it refuses with a NAMED CODE, not a sentence the founder never vetoed',
     r.code === referrals.REFUSE.ALREADY_HAS);
  ok('NO lead was created — the false-done is structurally impossible',
     db._tables.leads.length === before);
  ok('NO lead_referrals row was filed, so the balance cannot count a forward that did not happen',
     db._tables.lead_referrals.length === 0);
  ok('the original lead is untouched by a refusal',
     db._tables.leads.find(l => l.id === 'lead-priya').state === 'new');
}

// ══ §3 — THE TOKEN · R-G51.4 ═══════════════════════════════════════════════
// MUTATION: set PEER_REFERRAL_SOURCE = 'referral' → §3 goes RED.
section('3. the provenance token is distinct from Victor\'s word-of-mouth `referral`');
{
  const db = makeDb(seedBase());
  await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: null });
  const copy = db._tables.leads.find(l => l.vendor_id === TO);

  ok('the copy is stamped peer_referral', copy.source === 'peer_referral');
  ok('and NOT `referral`, which systemPrompt.js:297 already teaches Victor to emit',
     copy.source !== 'referral');
  ok('the token has ONE home and it is exported', leadsLib.PEER_REFERRAL_SOURCE === 'peer_referral');
  ok('the copy names the SENDER as referrer, off her vendor row',
     copy.referrer_name === 'Dev Roy Photography');

  // The literal must not be spelled anywhere but its home.
  const src = ['src/lib/vendor/referrals.js', 'src/api/vendor/leads.js', 'src/api/vendor/referrals.js']
    .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'))
    .join('\n')
    .replace(/^\s*\/\/.*$/gm, '');        // comments may NAME the value; code may not spell it
  ok('no file outside its home carries the literal in CODE', !/['"]peer_referral['"]/.test(src));
}

// ══ §4 — THE PEER MUST BE A LINKED PEER · R-G51.1 ══════════════════════════
// MUTATION: drop `.eq('member_vendor_id', toVendorId)` → §4 goes RED.
section('4. the peer must be FORWARDABLE — R-40.104 repealed the roster boundary');
{
  // ⚠ THIS SECTION USED TO ASSERT THE OPPOSITE, AND ITS OLD TITLE IS THE POINT:
  // "only a linked peer on her own roster can receive a forward". R-G51.1 made
  // that the law and R-40.104 repealed it. The cell is REWRITTEN rather than
  // deleted, so a reader of this file can see which ruling moved and when — a
  // deleted cell tells nobody that the rule ever existed.
  const db = makeDb(seedSearch());
  const rStranger = await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: 'v-anchal', note: 'Overflow.' });
  ok('A VENDOR SHE HAS NEVER WORKED WITH NOW RECEIVES THE FORWARD — the repeal, as behaviour',
     rStranger.ok === true && !!rStranger.referral);
  ok('and the peer actually holds the lead', !!db._tables.leads.find(l => l.vendor_id === 'v-anchal'));

  // The three clauses, each refused on its own, each with the SAME code and the
  // SAME sentence — see the door's own note on why they are not distinguished.
  for (const [id, why] of [
    ['v-hidden', 'a vendor who withdrew from peer search (R-40.107) cannot be forwarded to'],
    ['v-paused', 'a vendor who un-published her storefront cannot be forwarded to — she published nothing'],
    ['v-gone',   'a vendor whose status is not active cannot be forwarded to'],
  ]) {
    const d = makeDb(seedSearch());
    const r = await referrals.forwardLead(d, fromVendor, { leadId: 'lead-priya', toVendorId: id, note: null });
    ok(why, r.ok === false && r.code === referrals.REFUSE.NOT_A_PEER);
    ok(`and nothing was written for ${id}`, d._tables.lead_referrals.length === 0);
  }

  const dGhost = makeDb(seedSearch());
  const rGhost = await referrals.forwardLead(dGhost, fromVendor, { leadId: 'lead-priya', toVendorId: 'vendor-does-not-exist', note: null });
  ok('a vendor id that names nobody is refused with the same code — the sender cannot probe existence',
     rGhost.ok === false && rGhost.code === referrals.REFUSE.NOT_A_PEER);

  // ⚠ THE PRIVACY PROPERTY, ASSERTED AS A BEHAVIOUR AND NOT AS A COMMENT.
  // Four different worlds, one indistinguishable answer. If a future seat splits
  // these into named codes to be "helpful", this cell reds — and it should,
  // because distinguishing them turns the forward door into an oracle for
  // whether a given vendor exists and whether she has hidden herself.
  const answers = [];
  for (const id of ['v-hidden', 'v-paused', 'v-gone', 'vendor-does-not-exist']) {
    const d = makeDb(seedSearch());
    const r = await referrals.forwardLead(d, fromVendor, { leadId: 'lead-priya', toVendorId: id, note: null });
    answers.push(JSON.stringify({ ok: r.ok, code: r.code, error: r.error }));
  }
  ok('all four refusals are BYTE-IDENTICAL — the door is not an existence oracle',
     new Set(answers).size === 1);

  const rSelf = await referrals.forwardLead(makeDb(seedBase()), fromVendor, { leadId: 'lead-priya', toVendorId: FROM, note: null });
  ok('a self-forward is refused at the door, where she can be told why — never by a 500 from a CHECK',
     rSelf.ok === false && rSelf.code === referrals.REFUSE.SELF);

  // The roster is now a SUGGESTION and not a gate — proven from the door's own
  // source, because the behavioural cells above cannot see the difference
  // between "no roster read" and "a roster read that never refuses".
  const fwdSrc = codeOf('src/lib/vendor/referrals.js').split('async function getReferralRoom')[0];
  ok('forwardLead no longer reads vendor_roster at all', !/vendor_roster/.test(fwdSrc));
  ok('and it refuses on the three-clause predicate instead',
     /peer_discoverable/.test(fwdSrc) && /discover_paused/.test(fwdSrc) && /status/.test(fwdSrc));
}

// ══ §5 — THE ORIGINAL DOES NOT MOVE · R-G51.3 / F-40.87 / W-1 ══════════════
// MUTATION: have forwardLead UPDATE the original to state 'forwarded' → §5 RED.
section('5. the original lead\'s state is NOT touched — the row is the record');
{
  const db = makeDb(seedBase());
  await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: 'n' });
  const original = db._tables.leads.find(l => l.id === 'lead-priya');

  ok('state still reads `new` after a successful forward', original.state === 'new');
  ok('no new state value entered the vocabulary', ['new','contacted','quoted','booked','lost'].includes(original.state));

  // The eight homes stay eight. A `forwarded` value would need three engine
  // files, which W-1 forbids this sitting from writing.
  const allowed = fs.readFileSync(path.join(ROOT, 'src/api/vendor/leads.js'), 'utf8')
    .match(/const ALLOWED_STATES\s*=\s*\[([^\]]*)\]/);
  ok('ALLOWED_STATES is unchanged by this sitting',
     !!allowed && !/forwarded/.test(allowed[1]));
  const engine = fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/donnaLead.ts'), 'utf8');
  ok('W-1 holds: no engine byte learned the word', !/forwarded/.test(engine));
}

// ══ §6 — THE ORDER IS THE RULING · R-G51.2 ═════════════════════════════════
// MUTATION: move the dedupe read to AFTER the createLead call → §6 goes RED,
// because a lead will exist on the peer's side at the moment of refusal.
section('6. every refusal is decided BEFORE anything is written');
{
  const seed = seedBase();
  seed.leads.push({ ...PRIYA(), id: 'lead-peer-already', vendor_id: TO });
  const db = makeDb(seed);
  const idsBefore = db._tables.leads.map(l => l.id).join(',');

  await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: 'x' });

  ok('the lead set is byte-identical after a refused forward — nothing was written then withdrawn',
     db._tables.leads.map(l => l.id).join(',') === idsBefore);

  // ⚠ WHAT THIS SECTION COULD NOT PROVE, FOUND BY MUTATING RATHER THAN BY
  // READING, AND FIXED HERE RATHER THAN CLAIMED.
  //
  // Deleting the step-4 `if (existing)` refusal from forwardLead did NOT redden
  // a single cell. The reason is real and worth recording: `createLead` carries
  // its own (vendor_id, phone) dedupe, and this door passes no `enrich`, so on
  // the already-has path the two guards are OUTCOME-EQUIVALENT — nothing is
  // written either way. The behavioural cells above therefore cannot see the
  // difference between checking first and checking second, and a bench that
  // cannot see a difference must not claim to police it.
  //
  // The ruling (R-G51.2) is about ORDER, so the cell that guards it is
  // structural: the dedupe read must appear BEFORE the createLead call in the
  // file. That is not decoration — the two guards answer different questions
  // (step 4: "can this land?", the deduped flag: "did it?"), and the second
  // exists for the race window the first cannot close. Keeping only the later
  // one would still be correct today and would silently become wrong the moment
  // this door ever passes `enrich`, because then the dedupe path WRITES.
  const fwdSrc = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/referrals.js'), 'utf8');
  const iDupe   = fwdSrc.indexOf("REFUSE.ALREADY_HAS");
  const iCreate = fwdSrc.indexOf("await createLead(");
  ok('the dedupe refusal is READ before the createLead call, not inferred after it',
     iDupe > 0 && iCreate > 0 && iDupe < iCreate);
  ok('and the post-write guard is still there for the race the first cannot close',
     fwdSrc.lastIndexOf('REFUSE.ALREADY_HAS') > iCreate);

  // A lead with no phone cannot be forwarded: the peer would get a name and no
  // way to answer, and the dedupe the whole ruling turns on is phone-keyed.
  const seed3 = seedBase();
  seed3.leads = [{ ...PRIYA(), phone: null }];
  const db3 = makeDb(seed3);
  const r3 = await referrals.forwardLead(db3, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: null });
  ok('a lead with no phone is refused, and refused by name', r3.ok === false && r3.code === referrals.REFUSE.NO_PHONE);
  ok('and nothing was written for it', db3._tables.lead_referrals.length === 0);
}

// ══ §6b — TIER · R-G51.8 ═══════════════════════════════════════════════════
// MUTATION: add a tier gate to forwardLead (`if (fromVendor.tier === 'basic')
// return { ok:false, ... }`) → §6b flips RED.
//
// ⚠ THIS SECTION ASSERTS A BEHAVIOUR, NOT AN ABSENCE, AND THE DIFFERENCE IS THE
// WHOLE REASON IT EXISTS. The first attempt at this cell was refused by its own
// author and named as owed rather than written: a cell that greps a file for the
// non-existence of a tier check is vacuous by construction — it passes on an
// empty file, it passes if the check moves one module away, and it can never
// distinguish "no gate" from "gate spelled differently". The chair's correction
// (relay 4) is the shape that binds: drive a BASIC-TIER vendor through the real
// door and assert the forward LANDS.
//
// AND THE RULING IT GUARDS IS NOT A TECHNICALITY. A basic vendor is exactly the
// one whose lead record withholds the couple's phone — `WITHHELD_FIELDS` at
// leadSerializer.js, `FULL_ACCESS_TIERS` excludes 'basic'. She is the vendor who
// CANNOT ring this couple herself. Gating the forward on tier would take the one
// thing she can still do with an enquiry she cannot serve, and hand it to nobody:
// the couple goes unanswered, the peer never hears, and the exchange is dead at
// the tier where overflow is most likely. R-G51.8 is that reasoning, ruled.
section('6b. a basic-tier vendor may forward — the exchange is not tier-gated');
{
  const basicVendor = { id: FROM, business_name: 'Dev Roy Photography', tier: 'basic' };
  const db = makeDb(seedBase());
  const r = await referrals.forwardLead(db, basicVendor, {
    leadId: 'lead-priya', toVendorId: TO, note: 'Booked that weekend.',
  });

  ok('the forward LANDS for a basic-tier vendor', r.ok === true);
  ok('and the door returns the referral row, not a refusal shape', !!r.referral && !r.code);
  ok('the peer really has the lead — the success is not cosmetic',
     !!db._tables.leads.find(l => l.vendor_id === TO));
  ok('and it is stamped like any other forward',
     db._tables.leads.find(l => l.vendor_id === TO).source === 'peer_referral');

  // The same vendor at a paid tier must be indistinguishable, or the cell above
  // would pass on a door that happened to allow everyone by accident rather than
  // by ruling.
  const paid = await referrals.forwardLead(makeDb(seedBase()),
    { id: FROM, business_name: 'Dev Roy Photography', tier: 'signature' },
    { leadId: 'lead-priya', toVendorId: TO, note: 'Booked that weekend.' });
  ok('a paid tier behaves identically — tier is not read on this path at all',
     paid.ok === r.ok && !!paid.referral === !!r.referral);

  // And a vendor row with NO tier at all (the shape `resolveVendor` hands over
  // when the column is empty) must not fall into a refusal by accident.
  const untiered = await referrals.forwardLead(makeDb(seedBase()),
    { id: FROM, business_name: 'Dev Roy Photography' },
    { leadId: 'lead-priya', toVendorId: TO, note: null });
  ok('a vendor carrying no tier at all still forwards', untiered.ok === true);
}

// ══ §7 — THE ROOM · R-G51.6 ════════════════════════════════════════════════
section('7. the room counts FORWARDS — never weddings, never money');
{
  const seed = seedBase();
  seed.leads.push({ ...PRIYA(), id: 'lead-2', phone: '+919800000002' });
  seed.leads.push({ ...PRIYA(), id: 'lead-in', vendor_id: TO, phone: '+919800000003' });
  seed.lead_referrals = [
    { id: 'lr1', from_vendor_id: FROM, to_vendor_id: TO, lead_id: 'lead-priya', new_lead_id: 'x1', note: null, created_at: '2026-09-05T00:00:00Z' },
    { id: 'lr2', from_vendor_id: FROM, to_vendor_id: TO, lead_id: 'lead-2',     new_lead_id: 'x2', note: null, created_at: '2026-09-01T00:00:00Z' },
    { id: 'lr3', from_vendor_id: TO,   to_vendor_id: FROM, lead_id: 'lead-in',  new_lead_id: 'x3', note: null, created_at: '2026-08-22T00:00:00Z' },
  ];
  const db = makeDb(seed);
  const room = await referrals.getReferralRoom(db, FROM);

  ok('the room reads', room.ok === true);
  ok('sent counts the forwards she sent', room.sent_count === 2);
  ok('received counts the forwards she received', room.received_count === 1);
  ok('one peer row, both directions on it', room.peers.length === 1);
  ok('the peer row reads 2 sent', room.peers[0].sent === 2);
  ok('the peer row reads 1 received', room.peers[0].received === 1);
  ok('the peer is named from her vendor row — her BUSINESS NAME, not her handle',
     room.peers[0].name === 'Make Up by Swati Roy');

  // The head figures are the LENGTHS of the two lists, never a sum over peers —
  // one derivation per number (F-04.13).
  const summed = room.peers.reduce((n, p) => n + p.sent, 0);
  ok('and the two derivations agree, which is the only reason to keep one',
     summed === room.sent_count);

  // ⚠ THIS CELL WAS A SUBSTRING SCAN AND IT WAS WORTHLESS. Its first cut grepped
  // the file for /budget|amount|inr|.../ and went RED on the local variable
  // `inRes`. A cell that cannot tell a money column from four letters inside an
  // identifier proves nothing about money; it proves the author can spell. It is
  // replaced with the two assertions that actually bind:
  //   (a) the plane's own column list carries no money column, and
  //   (b) the room's peer rows carry EXACTLY the declared keys, so a money field
  //       cannot arrive later by being spread in from somewhere.
  const MONEY = /^(budget|amount|rupees?|inr|price|fee|commission|total|paid|due)/i;
  ok('the plane\'s column list carries no money column',
     !referrals.REFERRAL_COLS.split(',').map(c => c.trim()).some(c => MONEY.test(c)));
  ok('a peer row carries exactly its declared keys — money cannot arrive by a spread',
     JSON.stringify(Object.keys(room.peers[0]).sort()) ===
     JSON.stringify(['category', 'last_at', 'name', 'received', 'sent', 'vendor_id']));
  ok('and the room\'s own envelope is three keys, none of them money',
     JSON.stringify(Object.keys(room).filter(k => k !== 'ok').sort()) ===
     JSON.stringify(['peers', 'received_count', 'sent_count']));
}

// ══ §8 — THE STAMPS, AND WHAT ONLY 0135 CAN SAY ════════════════════════════
section('8. the two lead records\' one row each, and the DDL\'s own guarantees');
{
  const db = makeDb({ ...seedBase(), lead_referrals: [
    { id: 'lr1', from_vendor_id: FROM, to_vendor_id: TO, lead_id: 'lead-priya', new_lead_id: 'copy-1', note: 'Booked that weekend.', created_at: '2026-09-05T00:00:00Z' },
  ] });

  const s = await referrals.referralStampsForLeads(db, FROM, ['lead-priya']);
  ok('the sender\'s record gets a `Forwarded to` stamp', s.sentBy.has('lead-priya'));
  ok('naming the peer', s.sentBy.get('lead-priya').peer_name === 'Make Up by Swati Roy');
  ok('and carrying the note', s.sentBy.get('lead-priya').note === 'Booked that weekend.');

  const p = await referrals.referralStampsForLeads(db, TO, ['copy-1']);
  ok('the peer\'s record gets a `Forwarded by` stamp — F-40.85\'s cure', p.receivedBy.has('copy-1'));
  ok('naming the referrer', p.receivedBy.get('copy-1').peer_name === 'Dev Roy Photography');

  ok('an empty lead list asks the database nothing', (await referrals.referralStampsForLeads(db, FROM, [])).sentBy.size === 0);

  // ⚠ THESE FOUR ARE READ OFF THE DDL, NOT EXERCISED. The double honours no
  // constraint, so a cell that "passed" a UNIQUE here would be vacuous. Stated
  // as what it is: the migration is the witness, and this asserts the witness
  // says what the ruling requires.
  const ddl = fs.readFileSync(path.join(ROOT, 'db/migrations/0135_lead_referrals.sql'), 'utf8');
  ok('0135 makes new_lead_id NOT NULL — no row without a landed lead',
     /new_lead_id\s+uuid NOT NULL/.test(ddl));
  ok('0135 makes new_lead_id UNIQUE — a lead is the landing place of at most one forward',
     /UNIQUE INDEX[\s\S]{0,120}idx_lead_referrals_new_lead/.test(ddl));
  ok('0135 SET NULLs lead_id — deleting her own lead never erases the peer\'s evidence',
     /lead_id\s+uuid NULL\s+REFERENCES public\.leads \(id\) ON DELETE SET NULL/.test(ddl));
  ok('0135 adds NO column to leads and NO CHECK on state',
     !/ALTER TABLE public\.leads/.test(ddl) && !/leads_state_check/.test(ddl));
  ok('0135 carries no money column', !/amount|price|fee|commission|inr/i.test(ddl.replace(/^--.*$/gm, '')));
}

// ══ §8b — THE DOOR SENDS THE STAMP · F-40.109's CURE ═══════════════════════
// MUTATION: delete the `forwarded_by` line from the leads list mapper → §8b RED.
//
// ⚠ THIS SECTION EXISTS BECAUSE §8 PASSED WHILE THE FEATURE WAS DEAD.
// `referralStampsForLeads` shipped in the sealed half exported, benched by §8,
// and MOUNTED ON NO DOOR. Every cell above was green because every cell tested
// the FUNCTION; not one asked whether anything CALLED it. The peer's lead record
// could never have rendered "Forwarded by" — the acceptance card's own line 2 —
// and the pwa would have read a field the backend never sent, on every lead,
// silently, forever.
//
// It is the same defect class as the two mutations in §4 of the handover that
// reddened nothing: a cell can only see what it looks at, and "the function is
// correct" and "the function is reachable" are different questions. §9's
// sole-writer cells ask who CALLS the table. Nothing asked who calls the lib.
//
// So this section reads the DOOR, not the lib. It is structural — the door needs
// a live supabase and a mounted express app to drive, and standing one up here
// would be a second integration harness for four lines of mapper. What it
// asserts is exactly what was missing: the call exists, both keys are mapped,
// and they are mapped from the stamp maps rather than from anything else.
section('8b. the leads list door actually SENDS the stamps (F-40.109)');
{
  const doorSrc = fs.readFileSync(path.join(ROOT, 'src/api/vendor/leads.js'), 'utf8');
  const live = doorSrc.replace(/^\s*\/\/.*$/gm, '');   // comments name the keys; code must map them

  ok('the door imports the stamp reader', /referralStampsForLeads/.test(live.split('\n')[0] + live));
  ok('and CALLS it — the cure for a function that shipped with no caller',
     /await referralStampsForLeads\(/.test(live));
  // ⚠ THE FIRST CUT OF THIS CELL WENT RED ON CORRECT CODE. Its matcher was
  // `\(supabase,[^)]*\.map\(` — and `[^)]*` cannot cross the `)` in
  // `(rows || []).map(...)`, so the negated class stopped one character short of
  // the thing it was looking for. Same family as the money cell that matched the
  // local `inRes`: a regex asserting a property it cannot actually see. Matched
  // on the ARGUMENT SHAPE instead — the ids arrive as an array derived from the
  // page's rows, which is the property that matters, and one-per-row would not
  // pass an array at all.
  const call = (live.replace(/\n/g, ' ').match(/referralStampsForLeads\(([^;]*)\)/) || [])[1] || '';
  ok('the call is batched over the page\'s lead ids, not one per row',
     /\.map\(/.test(call) && /rows/.test(call));

  ok('`forwarded_to` is mapped onto the wire from sentBy',
     /forwarded_to:\s*refStamps\.sentBy\.get\(l\.id\)/.test(live));
  ok('`forwarded_by` is mapped onto the wire from receivedBy',
     /forwarded_by:\s*refStamps\.receivedBy\.get\(l\.id\)/.test(live));

  // ── R-G51.11 · NOT TIER-GATED ────────────────────────────────────────────
  // The stamps are another vendor's words about a lead she chose to hand over,
  // not the couple's contact detail. Withholding them from a basic-tier vendor
  // would hide WHO SENT HER WORK from the vendor least able to chase it down.
  // Asserted as a BEHAVIOUR of the serializer, not as the absence of a gate —
  // relay 4's correction, applied a second time.
  const { serializeLeadRows } = require(path.join(ROOT, 'src/lib/vendor/leadSerializer.js'));
  const row = {
    id: 'lead-x', vendor_id: TO, name: 'Priya Nair', phone: '+919812345678', email: 'p@x.com',
    state: 'new', source: 'peer_referral', referrer: 'Dev Roy Photography',
    forwarded_by: { peer_name: 'Dev Roy Photography', note: 'Booked that weekend.', at: '2026-09-05T00:00:00Z' },
    forwarded_to: null,
  };
  const [basic] = serializeLeadRows([{ ...row }], 'basic', TO);
  const [paid]  = serializeLeadRows([{ ...row }], 'signature', TO);

  ok('a BASIC-tier vendor still receives the referrer\'s name',
     basic.forwarded_by && basic.forwarded_by.peer_name === 'Dev Roy Photography');
  ok('and still receives the note', basic.forwarded_by && basic.forwarded_by.note === 'Booked that weekend.');
  ok('the stamp is identical at a paid tier — the gate does not touch it',
     JSON.stringify(basic.forwarded_by) === JSON.stringify(paid.forwarded_by));
  ok('and WITHHELD_FIELDS is untouched: her phone is still gated at basic',
     basic.phone !== row.phone && paid.phone === row.phone);
}

// ══ §9 — ONE WRITER, ONE HOME ══════════════════════════════════════════════
section('9. sole-writer: lead_referrals has exactly one writer in src/');
{
  const { execSync } = require('child_process');
  // ⚠ THE FIRST CUT COUNTED FILES THAT NAME THE TABLE and asserted two. It went
  // RED on three, because the forward door's header NAMES `lead_referrals` in a
  // comment explaining what a refusal does not write. That comment is correct
  // and should stay; the CELL was wrong. Naming a table is not touching it —
  // what sole-writer means is that one file CALLS it.
  const callers = execSync(
    `grep -rl "from('lead_referrals')" ${path.join(ROOT, 'src')} || true`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean).map(f => path.relative(ROOT, f)).sort();

  ok('exactly ONE file in src/ calls the plane', callers.length === 1);
  ok('and it is the lib, not a door', callers[0] === 'src/lib/vendor/referrals.js');

  const doorSrc = fs.readFileSync(path.join(ROOT, 'src/api/vendor/referrals.js'), 'utf8');
  ok('the read door performs no insert, update or delete on the plane',
     !/\.insert\(|\.update\(|\.delete\(/.test(doorSrc));

  // ⚠ ADDED BECAUSE A MUTATION FOUND NOTHING. Growing the picker's column list
  // to `..., phone` reddened no cell, and the door's own header claims the
  // opposite — that a peer's number never travels for a list she only means to
  // choose from. A refusal stated in a comment and guarded by nothing is a
  // refusal that lasts until the next person needs a phone number.
  // ⚠ THE CONSTANT MOVED THIS SITTING and the cell followed it. PEER_COLS now
  // lives in the LIB beside `forwardLead`, because the search and the write door
  // must share one predicate and one column list; the router does address, auth
  // and envelope. A cell left pointing at the router would have gone red on
  // correct code — which is what it did, and is why this comment exists.
  const CONTACT = /^(phone|email|whatsapp|pin_hash|upi_id|account_number|ifsc|gstin|address)$/i;
  const libCode = codeOf('src/lib/vendor/referrals.js');
  const peerCols = libCode.match(/const PEER_COLS = '([^']+)'/);
  ok('the peer search declares its columns in one place', !!peerCols);
  ok('and none of them is a contact detail — a search is for choosing, not for reaching',
     !!peerCols && !peerCols[1].split(',').map(c => c.trim()).some(c => CONTACT.test(c)));
  ok('the router declares no column list of its own — one home, and it is the lib',
     !/const PEER_COLS/.test(codeOf('src/api/vendor/referrals.js')));
  // ⚠ AND THE FOUR ARE EXACTLY THE PUBLIC CARD'S. R-40.107's whole argument for
  // default-ON is that this directory publishes nothing the storefront does not.
  // Add a fifth column and that sentence becomes false and 0142 §2 becomes a
  // lie — so the claim is asserted against vendorCard.js's OWN select, both
  // ways: this cell reds if the peer list grows a column the public card lacks.
  const cardSel = codeOf('src/api/public/vendorCard.js').match(/const VENDOR_SELECT\s*=\s*'([^']+)'/);
  const cardCols = new Set((cardSel ? cardSel[1] : '').split(',').map(c => c.trim()));
  ok('every peer-search column is already on the PUBLIC storefront card — R-40.107\'s premise, mechanised',
     !!peerCols && !!cardSel && peerCols[1].split(',').map(c => c.trim()).every(c => cardCols.has(c)));

  const libSrc = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/referrals.js'), 'utf8');
  ok('the plane mints the peer\'s lead through createLead and never through a raw INSERT',
     /createLead\(/.test(libSrc) && !/from\('leads'\)[\s\S]{0,80}\.insert\(/.test(libSrc));
}

// ══ §10 — THE PEER SEARCH · R-40.104 ═══════════════════════════════════════
// MUTATIONS (each a real edit to searchPeers, reverted after):
//   drop `.eq('peer_discoverable', true)`  → the withdrawn vendor appears → RED
//   drop `.neq('id', vendorId)`            → she finds herself            → RED
//   stop filtering empty groups            → the empty head travels       → RED
//   raw `v.category === me.category`       → videography leaves the trade → RED
section('10. the picker became a search — groups, predicate, budget');
{
  const db = makeDb(seedSearch());

  // ── THE RESTING STATE. Empty box ⇒ the roster ONLY, never the whole table.
  const rest = await referrals.searchPeers(db, FROM, { q: '' });
  ok('an empty box is not a search', rest.searching === false);
  ok('and it answers with the roster alone — one group', rest.groups.length === 1);
  ok('which is `worked_with`', rest.groups[0].key === 'worked_with');
  ok('holding the one peer she has actually worked with',
     rest.groups[0].peers.length === 1 && rest.groups[0].peers[0].id === TO);

  // ── BELOW THE MINIMUM. One character is not a search either; it must not
  //    degrade into "return everyone".
  const one = await referrals.searchPeers(db, FROM, { q: 'a' });
  ok('a single character is below the minimum and does NOT open the table',
     one.searching === false && one.groups.length === 1 && one.groups[0].key === 'worked_with');
  ok('the minimum is declared, not inlined', referrals.MIN_PEER_QUERY === 2);

  // ── THE WALK'S OWN PROBE. `swati` finds her — under WORKED WITH, because she
  //    is on his roster from sitting 1's forward, and NOT under `same_trade`:
  //    he is photography, she is makeup. The kickoff's card said otherwise and
  //    the card was wrong; this cell is where that is written down.
  const swati = await referrals.searchPeers(db, FROM, { q: 'swati' });
  ok('`swati` is a search', swati.searching === true);
  ok('and finds exactly one vendor', swati.groups.reduce((n, g) => n + g.peers.length, 0) === 1);
  ok('under `worked_with` — the roster wins over the trade', swati.groups[0].key === 'worked_with');
  ok('NOT under `same_trade`: photography and makeup are different trades',
     !swati.groups.some(g => g.key === 'same_trade'));
  // ⚠ EMPTY HEADS DO NOT TRAVEL. Founder-vetoed, and enforced at the door so the
  // surface never decides it a second time.
  ok('the empty groups are ABSENT from the wire, not present and empty',
     swati.groups.length === 1);

  // ── THE HANDLE IS THE SECOND KEY, AND THE ONLY OTHER ONE.
  const byHandle = await referrals.searchPeers(db, FROM, { q: 'MAKEUPBY' });
  ok('a routing handle finds her too', byHandle.groups.some(g => g.peers.some(p => p.id === TO)));
  const orCols = [];
  {
    // Read the filter the door actually built, through the double's own parser.
    const spy = makeDb(seedSearch());
    const realFrom = spy.from;
    spy.from = (t) => { const q = realFrom(t); const o = q.or; q.or = (e) => { orCols.push(...String(e).split(',').map(c => c.split('.')[0])); return o(e); }; return q; };
    await referrals.searchPeers(spy, FROM, { q: 'swati' });
  }
  ok('the search matches business_name and routing_handle', orCols.includes('business_name') && orCols.includes('routing_handle'));
  // ⚠ c-40.45 · THE PHONE IS NOT A KEY, AND THIS IS THE CELL THAT KEEPS IT OUT.
  // R-40.104 named phone as a search key; it was struck because the MATCH is the
  // disclosure — type a number, get a confirmed business name, which is a reverse
  // lookup on a column nothing publishes. Re-add it and this reds.
  ok('and NOTHING else — no phone key (c-40.45)', orCols.length === 2 && !orCols.some(c => /phone/.test(c)));

  // ── SAME TRADE, THROUGH THE ONE HOME. `videography` normalises INTO
  //    `photography` (categoryFraming.js:115) and `Photography` differs only by
  //    case. A raw compare fails both; normaliseCategory is why it does not.
  // ⚠ PER-VENDOR PROBES, AND THE FIRST CUT GOT THIS WRONG. It searched `q: 'o'`
  // — ONE character, BELOW the minimum two cells above assert — so the door
  // correctly answered with the roster and every grouping cell went red on
  // correct code. The bench was wrong, not the door. Probing one vendor at a
  // time also tests the rule more exactly: it asserts WHICH group she lands in,
  // not merely that she is somewhere in the result.
  const groupOf = async (q, id) => {
    const res = await referrals.searchPeers(db, FROM, { q });
    const g = res.groups.find((gr) => gr.peers.some((p) => p.id === id));
    return g ? g.key : null;
  };
  ok('a videographer counts as the SAME TRADE as a photographer — normaliseCategory, not a raw compare',
     await groupOf('zeta', 'v-zeta') === 'same_trade');
  ok('and `Photography` matches `photography` — case is not a trade',
     await groupOf('anchal', 'v-anchal') === 'same_trade');
  ok('a jeweller lands in `everyone`, not in her trade',
     await groupOf('aurum', 'v-jewel') === 'everyone');
  const everyRes = await referrals.searchPeers(db, FROM, { q: 'aurum' });
  const every = everyRes.groups.find(g => g.key === 'everyone');
  ok('and her group is the only one that travels — the other two heads are suppressed',
     everyRes.groups.length === 1);

  // ── THE THREE CLAUSES, AS BEHAVIOUR. Each hidden vendor is absent from EVERY
  //    group, not merely from the one she would have sorted into.
  const all = (res) => res.groups.flatMap(g => g.peers.map(p => p.id));
  // Two characters, matching every fixture vendor's handle suffix pattern is not
  // available — so the exclusions are probed BY NAME, one each, which is what a
  // vendor would actually type when she cannot find someone.
  const wide = { groups: [] };
  for (const [id, q] of [['v-hidden','hidden'],['v-paused','paused'],['v-gone','retired'],[FROM,'dev roy']]) {
    const res = await referrals.searchPeers(db, FROM, { q });
    wide.groups.push(...res.groups);
    void id;
  }
  ok('a vendor who withdrew from peer search is absent (R-40.107)', !all(wide).includes('v-hidden'));
  ok('a vendor who un-published her storefront is absent', !all(wide).includes('v-paused'));
  ok('a vendor whose status is not active is absent', !all(wide).includes('v-gone'));
  ok('and she never finds HERSELF', !all(wide).includes(FROM));

  // ── ORDER. Alphabetical inside a group, because master §7 refuses a ranked
  //    surface and every other order is a ranking wearing a sort.
  const alpha = await referrals.searchPeers(db, FROM, { q: 'st' });
  const alphaEvery = alpha.groups.find(g => g.key === 'everyone');
  const names = (alphaEvery ? alphaEvery.peers : (every ? every.peers : [])).map(p => p.business_name);
  ok('`everyone` is alphabetical by business name',
     JSON.stringify(names) === JSON.stringify([...names].sort((a, b) => a.localeCompare(b))));

  // ── MUTUAL EXCLUSION. A peer appears once.
  const excl = await referrals.searchPeers(db, FROM, { q: 'st' });
  const ids = all(excl);
  ok('no peer appears in two groups', new Set(ids).size === ids.length);

  // ── THE BUDGET. A cap the caller cannot raise.
  const capped = await referrals.searchPeers(db, FROM, { q: 'o', limit: 9999 });
  ok('the caller cannot raise the server cap',
     capped.groups.reduce((n, g) => n + g.peers.length, 0) <= referrals.MAX_PEER_RESULTS);

  // ── THE SANITISER. PostgREST metacharacters and LIKE wildcards, together.
  ok('a comma cannot break out of the or() filter', !/[,()]/.test(referrals.safeTerm('a,b(c)')));
  ok('a bare % cannot turn a two-character minimum into match-everything',
     !/%/.test(referrals.safeTerm('%%%')) );
  ok('and a term of only metacharacters collapses below the minimum rather than matching all',
     referrals.safeTerm('%_*').length < referrals.MIN_PEER_QUERY);

  // ── ⚠ THE SHEET AND THE DOOR MUST NOT DISAGREE. The search shapes the choice;
  //    forwardLead authorises it. Asserted as BEHAVIOUR across both: everything
  //    the search offers must actually forward, and nothing it hides may.
  for (const id of all(excl)) {
    const d = makeDb(seedSearch());
    const r = await referrals.forwardLead(d, fromVendor, { leadId: 'lead-priya', toVendorId: id, note: null });
    ok(`the door accepts ${id}, which the search offered`, r.ok === true);
  }
  for (const id of ['v-hidden', 'v-paused', 'v-gone']) {
    const d = makeDb(seedSearch());
    const r = await referrals.forwardLead(d, fromVendor, { leadId: 'lead-priya', toVendorId: id, note: null });
    ok(`the door refuses ${id}, which the search hid`, r.ok === false);
  }
}

// ══ §11 — THE ALERT · R-G51.15 ═════════════════════════════════════════════
// MUTATIONS: read `out.wamid` → the wamid nulls → RED; delete the recordAlert
// on the catch path → the opted-out row vanishes → RED.
section('11. the peer is told, and every outcome is written down');
{
  // ── THE FLAG IS THE FIRST GATE, AND IT IS DOWN EVERYWHERE TODAY.
  // (C1 amendment: `flag.referral_alert_send` off on the switchboard, not an env var.)
  switchboard({ 'flag.referral_alert_send': 'off' });
  waCalls = []; waBehaviour = 'ok';
  const dark = makeDb(seedBase());
  const rDark = await referrals.forwardLead(dark, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: 'Overflow.' });
  ok('the forward still lands with the flag down — the alert is a courtesy, not a condition', rDark.ok === true);
  ok('and NOTHING was sent', waCalls.length === 0);
  ok('and no row was written for a decision about the feature, not about this peer',
     dark._tables.referral_alerts.length === 0);
  ok('the gate names itself so a walk can say WHICH gate refused',
     (await alertLib.sendGate()).on === false && /flag\.referral_alert_send/.test((await alertLib.sendGate()).reason));

  // ── FLAG UP: the send, the row, the wamid.
  switchboard({ 'flag.referral_alert_send': 'on' });
  waCalls = []; waBehaviour = 'ok';
  const db = makeDb(seedBase());
  const r = await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: 'Overflow.' });
  ok('the forward lands', r.ok === true);
  ok('exactly ONE message was sent', waCalls.length === 1);
  ok('on the VENDOR line', waCalls[0].line === 'vendor');
  ok('as a TEMPLATE, never free-form — she is out of window by construction', !!waCalls[0].templateKey && !waCalls[0].text);
  ok('with the referral_alert key', waCalls[0].templateKey === alertLib.TEMPLATE_KEY);
  ok('declared not-nudge-class, so a vendor who paused MORNINGS is not silenced on work',
     waCalls[0].nudgeClass === false);
  ok('to HER OWN number, off public.users via vendors.user_id', waCalls[0].to === '+918595356978');

  const vars = waCalls[0].vars;
  ok('three variables, positional', Array.isArray(vars) && vars.length === 3);
  ok('{{1}} is the PEER\'s own business name', vars[0] === 'Make Up by Swati Roy');
  ok('{{2}} is the REFERRER\'s business name, off her vendor row', vars[1] === 'Dev Roy Photography');
  ok('{{3}} is her LEADS link — the work is on her Leads', /\/leads/i.test(String(vars[2])));
  // ⚠ THE COUPLE APPEARS NOWHERE. Asserted against the actual couple fixture
  // rather than against a list of field names, so a future variable carrying her
  // city or her date reds too.
  const forbidden = ['Priya', 'Nair', '9812345678', 'Jaipur', '2027-02-14', '350000'];
  ok('and the COUPLE is named in none of them — not her name, city, date, phone or budget',
     !forbidden.some(f => vars.some(v => String(v).includes(f))));

  const rows = db._tables.referral_alerts;
  ok('one referral_alerts row per send', rows.length === 1);
  ok('keyed on the FORWARD, not on the lead', rows[0].referral_id === r.referral.id);
  ok('R-40.92 · the row names its recipient', rows[0].to_vendor_id === TO);
  ok('and the template it actually sent, per row (0141\'s lesson)', rows[0].template_key === alertLib.TEMPLATE_KEY);
  ok('status sent', rows[0].status === 'sent');
  // ⚠ F-40.210 · THE WAMID LIVES AT out.result.wamid. This is the cell that
  // reds if a future edit reaches for `out.wamid`, which does not exist and
  // which silently nulled every lead_alerts row on the 2026-09-07 walk.
  ok('the wamid is READ, not null — F-40.210\'s cure held at the first cut', !!rows[0].wamid);
  ok('and it is the one sendWa actually returned', rows[0].wamid === 'wamid.HBgM1');
  // Asserted against sendWa's OWN return statement, so a flattening upstream
  // reds both sides at once rather than only here.
  ok('sendWa still returns the wamid one level down, under `result`',
     /return\s*\{\s*sent:\s*true,\s*mode:\s*'template'[^}]*result:\s*res\s*\}/.test(codeOf('src/lib/sendWa.js')));

  // ── FAILURES GET ROWS TOO, and they are the ones worth having.
  waCalls = []; waBehaviour = 'opted_out';
  const dOut = makeDb(seedBase());
  const rOut = await referrals.forwardLead(dOut, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: null });
  ok('an opted-out peer does NOT cost the sender her forward', rOut.ok === true);
  ok('and the skip is WRITTEN DOWN — the only durable evidence she was skipped lawfully',
     dOut._tables.referral_alerts.length === 1);
  ok('classified as opted_out, not as a failure', dOut._tables.referral_alerts[0].status === 'opted_out');
  ok('with a null wamid, which is why 0142\'s uniques are PARTIAL', dOut._tables.referral_alerts[0].wamid === null);

  waCalls = []; waBehaviour = 'boom';
  const dErr = makeDb(seedBase());
  const rErr = await referrals.forwardLead(dErr, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: null });
  ok('a Meta refusal does not turn a successful forward into a refusal on her glass', rErr.ok === true);
  ok('the failure is recorded', dErr._tables.referral_alerts.length === 1);
  ok('carrying Meta\'s own code so a walk can name what happened', dErr._tables.referral_alerts[0].error_code === '131049');

  // ── NO PHONE. A fact about that account, not an error.
  waCalls = []; waBehaviour = 'ok';
  const noPhone = seedBase(); noPhone.users = [{ id: 'user-' + FROM, phone: '+919888294440' }];
  const dNo = makeDb(noPhone);
  const rNo = await referrals.forwardLead(dNo, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: null });
  ok('a peer with no phone on public.users still receives the LEAD', rNo.ok === true);
  ok('nothing was sent', waCalls.length === 0);
  ok('and the reason is on the record', dNo._tables.referral_alerts[0].status === 'no_phone');

  switchboard({});
}

// ══ §12 — THE 「Told」 STATE ═════════════════════════════════════════════════
// MUTATION: set `told` from `status === 'sent'` rather than from a wamid → RED.
section('12. `told` reads a wamid and nothing else, inside the stamp');
{
  const base = () => ({ ...seedBase(), lead_referrals: [
    { id: 'lr1', from_vendor_id: FROM, to_vendor_id: TO, lead_id: 'lead-priya', new_lead_id: 'copy-1', note: 'Overflow.', created_at: '2026-09-07T00:00:00Z' },
  ] });

  const dNone = makeDb(base());
  const sNone = await referrals.referralStampsForLeads(dNone, FROM, ['lead-priya']);
  ok('an unalerted forward is NOT told', sNone.sentBy.get('lead-priya').told === false);

  const dSent = makeDb({ ...base(), referral_alerts: [
    { id: 'ra1', referral_id: 'lr1', to_vendor_id: TO, template_key: 'referral_alert', wamid: 'wamid.X', status: 'sent' },
  ] });
  const sSent = await referrals.referralStampsForLeads(dSent, FROM, ['lead-priya']);
  ok('a forward whose alert carries a WAMID is told', sSent.sentBy.get('lead-priya').told === true);

  // ⚠ THE CELL THAT MAKES THE RULING REAL. A row that says `sent` with a null
  // wamid is the F-40.210 state: the message may well have arrived and the
  // estate cannot prove it. A surface claiming proof it does not have is worse
  // than one that stays quiet.
  const dLies = makeDb({ ...base(), referral_alerts: [
    { id: 'ra1', referral_id: 'lr1', to_vendor_id: TO, template_key: 'referral_alert', wamid: null, status: 'sent' },
  ] });
  const sLies = await referrals.referralStampsForLeads(dLies, FROM, ['lead-priya']);
  ok('`status: sent` with a NULL wamid is NOT told — proof, not optimism',
     sLies.sentBy.get('lead-priya').told === false);

  const dFail = makeDb({ ...base(), referral_alerts: [
    { id: 'ra1', referral_id: 'lr1', to_vendor_id: TO, template_key: 'referral_alert', wamid: null, status: 'opted_out' },
  ] });
  const sFail = await referrals.referralStampsForLeads(dFail, FROM, ['lead-priya']);
  ok('and an opted-out peer is not told either', sFail.sentBy.get('lead-priya').told === false);

  // ⚠ SENDER-SIDE ONLY. The peer was the one told; a stamp on her record saying
  // so is noise about a message she is holding.
  const sPeer = await referrals.referralStampsForLeads(dSent, TO, ['copy-1']);
  ok('the peer\'s own `Forwarded by` stamp carries no told state',
     sPeer.receivedBy.has('copy-1') && !('told' in sPeer.receivedBy.get('copy-1')));

  // ⚠ INSIDE THE STAMP, NOT A TOP-LEVEL WIRE KEY. `LIST_WIRE_CENSUS` classifies
  // top-level keys and `leadSerializer.js` is not this sitting's to touch; a new
  // top-level key would redden b36 leg C, exactly as forwarded_to/forwarded_by
  // did when they joined.
  ok('`told` is not a new top-level wire key',
     !/'told'/.test(codeOf('src/lib/vendor/leadSerializer.js')));
  ok('and leadSerializer.js is untouched by this sitting',
     !/G5\.1 SITTING 2|R-40\.104|R-40\.107/.test(codeOf('src/lib/vendor/leadSerializer.js')));

  // A failed alert read costs the STATE, never the row.
  const dBroken = makeDb(base());
  const realFrom = dBroken.from;
  // ⚠ THE STUB FOLLOWS THE CHAIN. F-40.226's cure added `.neq('status','failed')`
  // to `toldByReferralIds`, and this hand-rolled double ended at `.not()` — so it
  // THREW rather than reddened, which is a bench defect wearing a failure. Ends
  // in a thenable so the whole chain resolves however long it grows.
  const deadRead = { data: null, error: { message: 'down' } };
  const chain = { select: () => chain, in: () => chain, not: () => chain, neq: () => chain,
                  then: (res) => res(deadRead) };
  dBroken.from = (t) => (t === 'referral_alerts' ? chain : realFrom(t));
  const sBroken = await referrals.referralStampsForLeads(dBroken, FROM, ['lead-priya']);
  ok('a dead alert read still returns the stamp', sBroken.sentBy.has('lead-priya'));
  ok('it just is not told', sBroken.sentBy.get('lead-priya').told === false);
}

// ══ §13 — SOLE WRITER: referral_alerts ═════════════════════════════════════
section('13. referral_alerts has exactly one home in src/');
{
  // ⚠ COMMENT-STRIPPED, AND THIS SITTING EARNED THE LESSON AGAIN. A raw grep for
  // `from('referral_alerts')` returns TWO files — the second is the comment in
  // referrals.js explaining that there is only one. Sitting 1 filed the same
  // defect (§4.2, a cell that counted files NAMING a table); a cell that reads
  // prose as code proves that its author can spell.
  const walk = (d, acc = []) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules' && f.name !== 'dist') walk(p, acc); }
      else if (f.name.endsWith('.js') || f.name.endsWith('.ts')) acc.push(p);
    }
    return acc;
  };
  const files = walk(path.join(ROOT, 'src'));
  // ⚠ THE LAW IS ONE INSERTER, NOT ONE TOUCHER, and the first cut of this cell
  // conflated them. F-40.226's arm makes `relayStatus.js` a second file naming
  // this table — it UPDATES `status` from Meta's receipt, which is exactly the
  // shape `lead_alerts` has carried since 0141 and is the ruled design. A cell
  // that reddened on it would be demanding that receipts have nowhere to land.
  //
  // So: exactly one file may INSERT a row, and the router may UPDATE and nothing
  // else. Splitting the assertion is what keeps the law meaningful — a second
  // INSERT is how two doors start disagreeing about what an alert row means.
  const inserters = files.filter((f) => {
    const c = codeOf(path.relative(ROOT, f));
    return /\.from\('referral_alerts'\)[\s\S]{0,200}?\.insert\(/.test(c);
  });
  ok('exactly ONE file in src/ INSERTS into the alerts plane', inserters.length === 1);
  ok('and it is referralAlert.js', inserters.length === 1 && inserters[0].endsWith('referralAlert.js'));

  const routerCode = codeOf('src/lib/vendor/relayStatus.js');
  ok('the receipt router UPDATES the plane and never inserts into it',
     /from\('referral_alerts'\)[\s\S]{0,200}?\.update\(/.test(routerCode)
     && !/from\('referral_alerts'\)[\s\S]{0,200}?\.insert\(/.test(routerCode));
  // The read lives beside the insert deliberately — a second file naming the
  // table is how a second writer eventually appears in the one that only read.
  ok('the told READ lives there too, not beside its caller',
     /toldByReferralIds/.test(codeOf('src/lib/vendor/referralAlert.js')));
  ok('and referrals.js imports it rather than querying', /toldByReferralIds/.test(codeOf('src/lib/vendor/referrals.js')));
}

// ══ §14 — THE TEMPLATE, DARK ═══════════════════════════════════════════════
// MUTATION: flip status to 'approved' → RED. It must not ship sendable.
section('14. tdw_referral_alert — Utility, vendor line, and NOT approved');
{
  const t = templates.TEMPLATES.referral_alert;
  ok('the entry exists', !!t);
  ok('Meta name is tdw_referral_alert', t.name === 'tdw_referral_alert');
  ok('UTILITY — F-40.176\'s lesson: a MARKETING alert is throttled to the quiet vendors who need it most',
     t.category === 'UTILITY');
  ok('on the vendor line', t.line === 'vendor');
  ok('three variables in the declared order', JSON.stringify(t.variables) === JSON.stringify(['vendor_name', 'referrer_name', 'leads_link']));
  // ── ⚠ THIS CELL ASSERTED A FIXED VALUE AND THE FOUNDER OPENED THE GATE ────
  // It read `status !== 'approved'`, which was right while the template was
  // unfiled: the entry must not ship sendable by accident. On 2026-09-07 Meta
  // returned Active (ID 1526630866155035), the founder flipped the field
  // deliberately at `adcbc50`, and the walk sent a real alert to a live handset.
  // A cell that stayed red would be reporting a founder's decision as a defect,
  // and a cell nobody believes is worse than no cell.
  //
  // RE-AIMED AT THE PROPERTY THAT STILL MATTERS: the registry and the transport
  // must never disagree about whether this key can leave the estate. Whatever the
  // status is, `isApproved` must answer consistently — that is what actually
  // stops an accidental send, and it holds in both directions.
  ok('the registry and sendWa\u2019s gate agree about this key',
     templates.isApproved('referral_alert') === (t.status === 'approved'));
  ok('and the status is one the registry vocabulary knows',
     ['draft', 'pending', 'approved'].includes(t.status));
  // docs/TEMPLATES.md §1's shape rules, mechanised.
  ok('the body places no variable at the start', !/^\s*\{\{/.test(t.body));
  ok('none at the end', !/\}\}\s*$/.test(t.body));
  // ⚠ F-40.220 · A DECLARED RED, AND IT IS AGAINST THE VETOED BYTE RATHER THAN
  // AGAINST THIS CODE. docs/TEMPLATES.md §1 does not merely forbid variables
  // with nothing between them — it requires that "every pair is separated by
  // REAL WORDS". The approved body reads "Hi {{1}}, {{2}} just passed you…",
  // where {{1}} and {{2}} are separated by a comma and a space and by no word at
  // all. Every other body in this registry honours the rule.
  //
  // THE CELL IS LEFT ASSERTING THE ESTATE'S OWN RULE AND IS LEFT RED. The
  // alternative was to relax it to Meta's weaker whitespace test, which would
  // have turned a real filing risk into a green number — a hollow green, and
  // worse than a declared gap. The seat does NOT reword a byte the founder
  // vetoed an hour ago; the cure is one re-veto and the sheet's own alternative
  // (1) already separates the pair with real words.
  //
  // NOTHING IS AT RISK WHILE THIS STANDS: the template ships `pending` and
  // cannot send. The cost of shipping it unfixed is a rejected filing, which is
  // a round-trip with Meta and not a defect on anyone's glass.
  ok('[F-40.220 · DECLARED RED — against the vetoed body, not the code] every variable pair is separated by REAL WORDS (docs/TEMPLATES.md §1)',
     !/\}\}[^A-Za-z]*\{\{/.test(t.body));
  ok('the code\'s TEMPLATE_KEY points at this entry', alertLib.TEMPLATE_KEY === 'referral_alert');
  ok('and it is a named constant, not a literal at the call site — a re-point is one line',
     /const TEMPLATE_KEY = 'referral_alert'/.test(codeOf('src/lib/vendor/referralAlert.js')));
}

// ══ §15 — 0142's OWN GUARANTEES, READ FROM DISK ════════════════════════════
// ⚠ THIS SECTION READS THE .sql FILE AND NOT THE DATABASE. It passes whether or
// not the migration has run — sitting 1's §9.2 banked that law after 0135
// returned zero rows with the bench fully green. The migration's footer names
// the two information_schema witnesses that settle it.
section('15. 0142 — read from disk, and it proves nothing about production');
{
  const sql = fs.readFileSync(path.join(ROOT, 'db/migrations/0142_referral_alerts.sql'), 'utf8');
  ok('it creates referral_alerts', /create table if not exists public\.referral_alerts/i.test(sql));
  ok('referral_id CASCADEs from lead_referrals — an alert about a forward that no longer exists is gone too',
     /referral_id[\s\S]{0,120}references public\.lead_referrals\(id\) on delete cascade/i.test(sql));
  ok('to_vendor_id is NOT NULL and CASCADEs — a row about nobody is not a row',
     /to_vendor_id[\s\S]{0,120}not null references public\.vendors\(id\) on delete cascade/i.test(sql));
  ok('template_key is stored per row, never inferred', /template_key\s+text not null/i.test(sql));
  ok('wamid is NULLABLE — a send can fail before Meta ever sees it', /wamid\s+text\s+null/i.test(sql));

  // ⚠ F9(b) · THE `WHERE` IS THE WHOLE RULING. A bare UNIQUE(referral_id) would
  // let one opted_out row block the retry forever. Both uniques must be PARTIAL.
  const uWamid = sql.match(/create unique index if not exists uq_referral_alerts_wamid[\s\S]*?;/i);
  const uRef   = sql.match(/create unique index if not exists uq_referral_alerts_referral_sent[\s\S]*?;/i);
  ok('the wamid is UNIQUE', !!uWamid);
  ok('and PARTIAL, so failed sends do not collide on NULL', !!uWamid && /where wamid is not null/i.test(uWamid[0]));
  ok('one SUCCESSFUL alert per forward', !!uRef);
  ok('and it too is PARTIAL — a failure must never make a peer un-tellable forever',
     !!uRef && /where wamid is not null/i.test(uRef[0]));

  ok('R-40.107 · the column is added with DEFAULT true', /add column if not exists peer_discoverable boolean not null default true/i.test(sql));
  ok('and the file explains the departure from 0140 rather than leaving two columns to contradict in silence',
     /0140/.test(sql) && /vendorCard\.js:213/.test(sql));
  // R-40.27 as amended: a statement that WRITES cites the constraints section
  // for every table it writes, not the column block alone.
  ok('R-40.27 · both written tables cite their constraints section',
     /vendors_pkey/.test(sql) && /vendors_routing_handle_key/.test(sql) && /lead_referrals_pkey/.test(sql));
  ok('and the snapshot\'s staleness is checked rather than assumed', /0138/.test(sql) && /stale/i.test(sql));
  // ── 0144 · F-40.227's CORRECTION, GUARDED ─────────────────────────────────
  // ⚠ ADDED BECAUSE A MUTATION FOUND NOTHING. Rewriting the corrected comment to
  // drop the word THIRD reddened no cell — so the sentence this rider exists to
  // fix was itself unguarded, which is the same shape as the defect: a claim in
  // the database that nothing checks. The comment is the only place a reader
  // learns the router's ladder, and 0142 proved what an unguarded one costs.
  // ⚠ THE EXECUTABLE BLOCK ONLY, AND THE FIRST CUT READ THE WHOLE FILE.
  // Two cells broke on that in one run: the "does not re-ship the false claim"
  // cell went RED because 0144's HEADER quotes 0142's false sentence in order to
  // explain the finding, and the "names THIRD" cell stayed GREEN under a mutation
  // because the header also contains the words "THIRD home". A file's reasoning
  // is not its effect. `COMMENT ON` ships what is between BEGIN and COMMIT and
  // nothing above it — so that is what these cells read.
  //
  // Fourth instance of this class in one sitting (b51 §13's table census, b40
  // C114's quotation match, and this pair). The pattern: an assertion about a
  // FILE when the claim is about the ARTIFACT the file produces.
  const fixRaw  = fs.readFileSync(path.join(ROOT, 'db/migrations/0144_referral_alerts_comment.sql'), 'utf8');
  const fix     = fixRaw.split('BEGIN;')[1].split('COMMIT;')[0];
  ok('0144 corrects the table comment', /comment on table public\.referral_alerts/i.test(fix));
  ok('and its header records WHY, citing the finding', /F-40\.227/.test(fixRaw) && /F-40\.226/.test(fixRaw));
  ok('and the new sentence names the router AND its position in the ladder',
     /relayStatus\.js/.test(fix) && /THIRD home/i.test(fix));
  ok('it names the two homes tried before it, so the order is legible from the database',
     /public\.messages/.test(fix) && /public\.lead_alerts/.test(fix));
  ok('the status comment states that a failed receipt clears Told',
     /comment on column public\.referral_alerts\.status/i.test(fix) && /Told/.test(fix) && /failed/.test(fix));
  // ⚠ AND IT MUST NOT CARRY 0142's FALSE SENTENCE FORWARD. That string is the
  // finding; a correction that quoted it into the database would re-ship it.
  ok('and it does not re-ship 0142\u2019s false claim',
     !/status is advanced by the Meta receipt webhook via relayStatus\.js\./.test(fix));
  ok('0144 writes no row and no column — a COMMENT ON touches pg_description only',
     !/\b(insert|update|delete|alter table|create table)\b/i.test(fix));

  ok('no money column reaches this plane — master §7',
     !/(amount|price|inr|paise|rupee|fee|budget)/i.test(sql.split('BEGIN;')[1].split('COMMIT;')[0]));
}

// ══ §16 — THE SWITCH IS WRITABLE, AND ONLY AS A BOOLEAN ════════════════════
// MUTATION: remove peer_discoverable from BOOLEAN_FIELDS → RED.
section('16. PATCH /me carries the switch, and refuses a non-boolean');
{
  const me = codeOf('src/api/vendor/me.js');
  const allowed = me.match(/const ALLOWED_FIELDS = \[([\s\S]*?)\];/);
  const booleans = me.match(/const BOOLEAN_FIELDS = \[([\s\S]*?)\];/);
  ok('peer_discoverable is writable — without this the PATCH is dropped SILENTLY behind a 200',
     !!allowed && /'peer_discoverable'/.test(allowed[1]));
  // ⚠ IT MATTERS MORE HERE THAN FOR ANY SIBLING. This is the only column in the
  // list whose DEFAULT IS TRUE, so a value the driver has to guess at fails
  // OPEN — a vendor listed who asked not to be.
  ok('and it is a declared BOOLEAN, so a non-boolean is a 400 and never a coercion',
     !!booleans && /'peer_discoverable'/.test(booleans[1]));
  ok('it is NOT in the locked list — it is her own posture, not TDW\'s claim about her',
     !/LOCKED_FIELDS[\s\S]{0,400}peer_discoverable/.test(me));

  // ⚠ F-40.209's LAW: a control's state is a fact about the database, and the
  // only honest place to read it is the database. The switch cannot render, and
  // cannot revert on refusal, unless the door both SELECTS and RETURNS it.
  ok('the GET shape returns it, so the switch renders from the row', /peer_discoverable:\s*vendor\.peer_discoverable/.test(me));
  ok('the PATCH echoes it, so an optimistic toggle can revert on refusal', /peer_discoverable:\s*updated\.peer_discoverable/.test(me));
  const selects = me.match(/\.select\('id, business_name[^']*'\)/g) || [];
  ok('and every vendor SELECT on this door actually ASKS for the column',
     selects.length >= 2 && selects.every(sl => /peer_discoverable/.test(sl)));
  // ⚠ `!== false` AND NOT `=== true`, WHICH IS THE OPPOSITE OF ITS NEIGHBOUR.
  // date_check_enabled defaults FALSE so a null must read NO; this defaults TRUE
  // so a null must read YES. Reading `=== true` here would draw the switch OFF
  // for a vendor the search can already see.
  ok('read with the coercion its DEFAULT requires, not its neighbour\'s',
     /peer_discoverable:\s*vendor\.peer_discoverable\s*!==\s*false/.test(me));
}

// ══ §17 — EVERY TABLE THAT HOLDS A WAMID HAS A ROUTE TO THE RECEIPT ════════
// F-40.226. THE CELL THE CHAIR ASKED FOR, AND IT IS DELIBERATELY NOT ABOUT
// `referral_alerts`.
//
// The defect was NOT "the router forgot one table". It was that this estate has
// now shipped a wamid-bearing table WITHOUT its router arm TWICE — `lead_alerts`
// at F-40.177, `referral_alerts` here — and the second time was done by a seat
// that had read the first and quoted it in its own migration header. A cell
// naming `referral_alerts` would catch the specimen and let the THIRD one
// through.
//
// So it is a CENSUS: derive every table in the migration ladder that persists a
// `wamid` column, then assert the receipt router can reach each one. A future
// table gets a red the day it lands, from a bench nobody had to remember to
// update.
//
// MUTATION: delete the `referral_alerts` arm from relayStatus.js → RED.
//           add a wamid column to any new migration without an arm → RED.
section('17. no wamid-bearing table is orphaned from the receipt router (F-40.226)');
{
  const migDir = path.join(ROOT, 'db/migrations');
  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();

  // Tables whose CREATE TABLE declares a `wamid` column. Read from the DDL, not
  // from a hand-kept list — a hand-kept list is a second home for the census and
  // would go stale exactly as the comment did.
  const bearers = new Set();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8')
      .replace(/^\s*--.*$/gm, '');            // strip SQL comments: prose is not DDL
    for (const m of sql.matchAll(/create table (?:if not exists )?public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/gi)) {
      if (/^\s*wamid\s/mi.test(m[2])) bearers.add(m[1]);
    }
  }
  ok('the ladder declares at least two wamid-bearing tables — the census found something to check',
     bearers.size >= 2);

  const router = codeOf('src/lib/vendor/relayStatus.js');
  for (const t of [...bearers].sort()) {
    // ⚠ THE ASSERTION IS AN UPDATE KEYED ON THE WAMID, not a mention. A router
    // that merely NAMED the table in a comment is precisely the state F-40.227
    // found in the database: a description standing in for a mechanism.
    const arm = new RegExp(`from\\('${t}'\\)[\\s\\S]{0,400}?\\.eq\\('wamid'`);
    ok(`the receipt router can reach public.${t} by wamid`, arm.test(router));
  }

  // `public.messages` is the conversation plane and carries the sid under its own
  // name, so it is asserted separately rather than being missed by a census that
  // only reads CREATE TABLE statements in this ladder.
  ok('and public.messages, the first home, is still reachable',
     /from\('messages'\)/.test(router));

  // ⚠ ORDER IS A RULING, NOT TASTE. messages -> lead_alerts -> referral_alerts,
  // each tried only on a miss. A reorder would change which table a shared sid
  // resolves against, and `delivery_status` means something to every receipt the
  // estate already handles.
  const order = ['messages', 'lead_alerts', 'referral_alerts']
    .map(t => router.indexOf(`from('${t}')`));
  ok('the homes are tried in the ruled order — conversation plane first',
     order.every(i => i >= 0) && order[0] < order[1] && order[1] < order[2]);

  // ⚠ AND EVERY WAMID-BEARING TABLE MUST MAKE ITS SID UNIQUE, or the router's
  // own ambiguity refusal is decoration. Partial, because the failed sends these
  // tables deliberately keep carry a null wamid and would collide on it.
  for (const t of [...bearers].sort()) {
    const ddl = files.map(f => fs.readFileSync(path.join(migDir, f), 'utf8')).join('\n');
    const uq = new RegExp(`create unique index[^;]*on public\\.${t} ?\\(wamid\\)[^;]*where wamid is not null`, 'i');
    ok(`public.${t} makes its wamid UNIQUE where present, so no receipt matches ambiguously`,
       uq.test(ddl));
  }
}

// ══ §18 — 「Told」 RETREATS WHEN META RETRACTS ══════════════════════════════
// MUTATION: drop the `.neq('status','failed')` from toldByReferralIds → RED.
section('18. a failed receipt clears Told (F-40.226)');
{
  const base = () => ({ ...seedBase(), lead_referrals: [
    { id: 'lr1', from_vendor_id: FROM, to_vendor_id: TO, lead_id: 'lead-priya', new_lead_id: 'copy-1', note: null, created_at: '2026-09-07T00:00:00Z' },
  ] });
  const row = (status) => ({ id: 'ra1', referral_id: 'lr1', to_vendor_id: TO,
                             template_key: 'referral_alert', wamid: 'wamid.X', status });

  const told = async (status) => {
    const db = makeDb({ ...base(), referral_alerts: [row(status)] });
    const s = await referrals.referralStampsForLeads(db, FROM, ['lead-priya']);
    return s.sentBy.get('lead-priya').told;
  };

  ok('a `sent` receipt reads Told', await told('sent') === true);
  ok('and `delivered` — the router can now advance it that far', await told('delivered') === true);
  ok('and `read`', await told('read') === true);
  // ⚠ THE RULING. A wamid whose receipt says failed is no longer proof, and
  // leaving Told lit would be the estate claiming a delivery Meta has retracted
  // — the false-done that Told exists to refuse, arriving three days late.
  ok('a `failed` receipt CLEARS Told — Meta retracted, so the word retracts',
     await told('failed') === false);
  // ⚠ AND AN UNKNOWN STATUS DOES NOT. Meta's vocabulary grows; an allow-list of
  // good statuses would silently un-tell every forward the day a new terminal
  // status appears, reading UNKNOWN as FAILURE. Only a positively-known failure
  // removes the word.
  ok('an unrecognised status leaves Told standing — the wamid is still real',
     await told('accepted') === true);
}

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH THREW: ' + e.stack); process.exit(1); });
