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

const referrals = require(path.join(ROOT, 'src/lib/vendor/referrals.js'));
const leadsLib  = require(path.join(ROOT, 'src/lib/vendor/leads.js'));

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
  const tables = { leads: [], vendors: [], vendor_roster: [], lead_referrals: [], clients: [], ...seed };
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
    q.order = () => q;
    q.limit = () => q;
    const matched = () => rows.filter(r => q._filters.every(f => f(r)));
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
const seedBase = () => ({
  leads: [PRIYA()],
  vendors: [
    { id: FROM, business_name: 'Dev Roy Photography', category: 'photography', city: 'Delhi' },
    { id: TO,   business_name: 'DROY550',             category: 'photography', city: 'Jaipur' },
  ],
  vendor_roster: [{ id: 'r1', owner_vendor_id: FROM, member_vendor_id: TO, name: 'DROY550', category: 'photography', source: 'collab_accepted' }],
});

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
section('4. only a linked peer on her own roster can receive a forward');
{
  const db = makeDb(seedBase());
  const r = await referrals.forwardLead(db, fromVendor, { leadId: 'lead-priya', toVendorId: STRANGER, note: null });
  ok('a vendor who is not on her roster is refused', r.ok === false && r.code === referrals.REFUSE.NOT_A_PEER);
  ok('nothing was written for a stranger', db._tables.lead_referrals.length === 0);

  // The phone-only roster row — a manual entry with no vendor behind it.
  const seed2 = seedBase();
  seed2.vendor_roster = [{ id: 'r2', owner_vendor_id: FROM, member_vendor_id: null, name: 'Someone', phone: '+919800000000', source: 'manual' }];
  const db2 = makeDb(seed2);
  const r2 = await referrals.forwardLead(db2, fromVendor, { leadId: 'lead-priya', toVendorId: TO, note: null });
  ok('a phone-only roster row is NOT a forwardable peer — it has no Victor to take it from there',
     r2.ok === false && r2.code === referrals.REFUSE.NOT_A_PEER);

  const rSelf = await makeDb(seedBase()) && await referrals.forwardLead(makeDb(seedBase()), fromVendor, { leadId: 'lead-priya', toVendorId: FROM, note: null });
  ok('a self-forward is refused at the door, where she can be told why — never by a 500 from a CHECK',
     rSelf.ok === false && rSelf.code === referrals.REFUSE.SELF);
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
  ok('the peer is named from her vendor row', room.peers[0].name === 'DROY550');

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
  ok('naming the peer', s.sentBy.get('lead-priya').peer_name === 'DROY550');
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
  const CONTACT = /^(phone|email|whatsapp|pin_hash|upi_id|account_number|ifsc|gstin|address)$/i;
  const peerCols = doorSrc.match(/const PEER_COLS = '([^']+)'/);
  ok('the picker declares its columns in one place', !!peerCols);
  ok('and none of them is a contact detail — a picker is for choosing, not for reaching',
     !!peerCols && !peerCols[1].split(',').map(c => c.trim()).some(c => CONTACT.test(c)));

  const libSrc = fs.readFileSync(path.join(ROOT, 'src/lib/vendor/referrals.js'), 'utf8');
  ok('the plane mints the peer\'s lead through createLead and never through a raw INSERT',
     /createLead\(/.test(libSrc) && !/from\('leads'\)[\s\S]{0,80}\.insert\(/.test(libSrc));
}

console.log(`\n${pass} PASS · ${fail} FAIL`);
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error('BENCH THREW: ' + e.stack); process.exit(1); });
