#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b36_leadgate_a_bench.js
// M-LEADGATE-RECUT · R-36.13 / R-37.4–.11 — THE CONNECT-GATE BENCH.
//
// ── RE-FOUNDED, NOT REPLACED (R-36.12, retire-with-the-reader) ──────────────
// This file was born at M-LEADGATE-A as the payload-proof instrument for an
// EXISTENCE-ONLY wire: its cells asserted that her NAME was absent from a basic
// vendor's payload. R-36.13 inverted that policy — the withheld set is exactly
// {phone, email} and her name is GRANTED — so every cell asserting the old
// withheld set has been RE-FOUNDED BY LABEL rather than deleted. The file keeps
// its name because it is the only instrument for this law, and one law wants one
// instrument.
//
// COUNTS DISCLOSED, never padded — every number below derived by running the
// bench and counting its own output, never estimated:
//   at 5be80d6 (the A-cut), run at the untouched tip     60 cells, 60/60
//   at this tree (the recut)                             94 cells
//   at Seat B′ (F-16.25's disposition, labelled)          95 cells
//   carrying the [re-founded] label                      14 cells
//
//   per section, this tree:
//     §0 wiring state ................  6   (was 3 — the flip plus two cells
//                                            asserting WHICH handler is gated)
//     §1 canon spellings .............. 11   unchanged
//     §2 list door ....................  9   (+1 at Seat B′, labelled — the
//                                            budget_min disposition proven)
//     §3 essential+ unmoved ...........  6   unchanged
//     §4 detail door .................. 15
//     §5 tier flip ....................  5
//     §6 template ..................... 14   (+1: the OOW body's no-name cell)
//     §7 in-window alert .............. 12
//     §8 shape guards .................  7
//     §9 census guard ................. 10   NEW WHOLE (R-37.4's second half)
//
// ── WHAT MAKES THESE CELLS THE 08 STANDARD ──────────────────────────────────
// Every connect cell asserts against the SERIALIZED WIRE BYTES — the response
// object run through JSON.stringify — and searches for the literal characters of
// a phone number and an email address. Not a field check. Not a key check.
//
// AND UNDER R-36.13 THE PROOF RUNS BOTH WAYS. Absence alone is no longer the
// whole policy: the ruling says "let it all be there", so a cure that quietly
// withheld her name would satisfy an absence-only bench and violate the ruling.
// So PRESENCE IS PROVEN AS HARD AS ABSENCE — her name is searched for in the
// bytes and must be FOUND, in the list row, in the detail envelope, and in the
// in-window alert.
//
// Client masking was refused BY NAME at the charter, and this bench is what
// makes that refusal checkable rather than aspirational.
//
// Run: node scripts/b36_leadgate_a_bench.js
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.join(__dirname, '..');

const {
  resolveTier, hasFullLeadAccess,
  serializeLeadRow, serializeLeadRows, serializeLeadDetail,
  WITHHELD_FIELDS, CLIENT_BASIC_FIELDS,
  LEADS_COLUMN_CENSUS, LIST_SELECT_CENSUS, LIST_WIRE_CENSUS,
  DETAIL_SELECT_CENSUS, DETAIL_ENVELOPE_CENSUS,
} = require(path.join(ROOT, 'src/lib/vendor/leadSerializer'));
const { getTemplate, buildTemplatePayload, isApproved } =
  require(path.join(ROOT, 'src/lib/templates'));

let pass = 0, fail = 0;
const reds = [];
function t(name, fn) {
  let ok = false, detail = '';
  try { const r = fn(); ok = r === true; if (!ok) detail = String(r); }
  catch (e) { ok = false; detail = e.message; }
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; reds.push(name); console.log(`  RED  ${name}${detail ? ' — ' + detail : ''}`); }
}

// ── [F-06.192] SOURCE CELLS READ CODE, NEVER PROSE ──────────────────────────
// F-06.192's lesson, paid for once already: a structural cell that greps raw
// source can be satisfied by a COMMENT. This file's own production comments now
// contain the word `leadSerializer` several times, so a mutation deleting the
// `require` would leave §0 GREEN over a door that imports nothing — a one-way
// cell wearing a both-ways costume.
//
// So every source-reading cell below reads COMMENT-STRIPPED source. The strip is
// deliberately conservative: block comments and WHOLE-LINE `//` comments only,
// never trailing ones, because a naive trailing strip would cut `https://…` in
// half and this repo's sources carry URLs. That is enough for this file's risk —
// its prose lives in whole-line comments — and the limitation is stated here
// rather than discovered later.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
}
function readCode(rel) {
  return stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}
function readRaw(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ── THE FIXTURES ────────────────────────────────────────────────────────────
// One name, one phone, one email, used everywhere, so the byte searches have
// single needles. Deliberately distinctive strings: a substring collision with
// ordinary English would make a cell pass or fail for the wrong reason.
const HER_NAME  = 'Priya Sharma';
const HER_PHONE = '+919625759924';
const HER_EMAIL = 'priya.sharma@example.com';
const VENDOR_ID = '23165e38-6510-4639-ab6a-9f35bab93742';

// R-36.13's WITHHELD SET, as bytes. Nothing here may appear on a basic wire.
const CONNECT_NEEDLES = [HER_PHONE, '9625759924', HER_EMAIL];
// R-36.13's GRANTED identity, as bytes. This MUST appear on a basic wire —
// the presence half of the proof, without which a silent over-redaction passes.
const GRANTED_NEEDLE  = HER_NAME;

/** Does the SERIALIZED payload contain any member of the connect set? */
function connectLeaks(payload) {
  const wire = JSON.stringify(payload);
  return CONNECT_NEEDLES.filter((n) => wire.includes(n));
}
/** Does the SERIALIZED payload carry the granted name? */
function carriesName(payload) {
  return JSON.stringify(payload).includes(GRANTED_NEEDLE);
}

// A list row exactly as leads.js's mapper builds it (keys copied from the
// mapper, not invented — and §9 below proves the copy is still faithful).
function listRow() {
  return {
    id: 'lead-1',
    name: HER_NAME,
    phone: HER_PHONE,
    wedding_date: '2026-12-14',
    wedding_date_precision: 'exact',
    wedding_city: 'Delhi',
    budget_total: 200000,
    state: 'new',
    source: 'discover',
    referrer: null,
    raw_message: `${HER_NAME} enquired via the Discover feed on The Dream Wedding.`,
    notes: 'Discover enquiry — she found you on the feed.',
    created_at: '2026-08-21T10:00:00Z',
    tdw: true,
    tdw_enquired_at: '2026-08-21T10:00:00Z',
    // The wishbone — her name nested two levels down, per leadDraftWire.
    draft: {
      missing: ['phone'],
      complete_inline: { method: 'PATCH', path: '/api/v2/vendor/leads/lead-1' },
      tell_victor: { path: '/vendor', primer: `About ${HER_NAME}: the phone is ` },
    },
  };
}

// The detail envelope exactly as getLeadDetail returns it.
function detailEnvelope() {
  return {
    ok: true,
    lead: {
      id: 'lead-1',
      name: HER_NAME,
      phone: HER_PHONE,
      email: HER_EMAIL,
      wedding_date: '2026-12-14',
      wedding_city: 'Delhi',
      event_types: ['sangeet'],
      budget_min: 100000,
      budget_max: 200000,
      state: 'new',
      source: 'discover',
      referrer_name: HER_NAME,
      raw_message: `${HER_NAME} enquired via the Discover feed.`,
      notes: `Called ${HER_NAME} on Tuesday.`,
      client_id: 'client-1',
      vendor_summary: `${HER_NAME} wants a December wedding shoot.`,
      draft_meta: {},
      created_at: '2026-08-21T10:00:00Z',
    },
    vendor_summary: `${HER_NAME} wants a December wedding shoot.`,
    conversation: [
      { direction: 'inbound', body: `Hi, this is ${HER_NAME}, looking for a December shoot`, created_at: 'x', sent_by: 'couple' },
    ],
    invoices: [{ id: 'inv-1', invoice_number: 'INV-1', client_name: HER_NAME, amount_total: 50000, amount_paid: 0, state: 'draft', due_date: null }],
    events: [{ id: 'ev-1', title: 'Sangeet shoot', kind: 'shoot', event_date: '2026-12-14', event_time: null, state: 'upcoming' }],
    client: { id: 'client-1', name: HER_NAME, phone: HER_PHONE, email: HER_EMAIL },
  };
}

console.log('\n§0 · THE WIRING STATE — WHAT IS ACTUALLY CALLED TODAY');
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS SECTION EXISTS. Every other section tests the serializer MODULE by
// calling it directly. A module can be perfect and called by nobody: after the
// ARM A revert this bench went on reporting 57/57 while the two doors it was
// written to protect ran completely ungated. That is a green over an
// unreachable path, which §9 of the protocol forbids by name, and it is the
// failure mode a revert quietly creates in any bench that tests a module
// instead of a wire.
//
// ── THE FLIP, EXECUTED UNDER R-37.10 ───────────────────────────────────────
// The A-cut's first cell asserted the doors were UNGATED and carried its own
// instruction: "when Seat B lands and the doors re-land, this cell goes RED —
// flip the expectation then, and only then."
//
// THIS IS THEN. R-36.13 dissolved the falsehood the revert existed to prevent:
// the `Unknown` render was possible only because the name left the wire, and the
// name no longer leaves the wire. The two-step re-landing law was relaxed by the
// same amendment that made it unnecessary. So the cell is flipped, and the
// incident stays written down beside it:
//
//   ARM A, 2026-08-24 — the A-cut redacted identity; dreamos-pwa's `leads.tsx`
//   renders an absent name through `l.name ?? 'Unknown'`; twelve leads on a live
//   basic vendor's screen read `Unknown`. THE ESTATE CLAIMING IGNORANCE ABOUT
//   DATA IT HOLDS AND IS WITHHOLDING — a false statement on a money surface, the
//   F-04.71 costume class. The doors were reverted the same night.
//
// If a future sitting ever narrows the wire back past a name, THIS PARAGRAPH IS
// THE RECEIPT for what that costs.
// ═══════════════════════════════════════════════════════════════════════════
const LEADS_DOOR   = readCode('src/api/vendor/leads.js');
const DETAIL_LIB   = readCode('src/lib/vendor/leads.js');
const ENQUIRE_DOOR = readCode('src/api/couple/enquire.js');

t('the LEADS door IMPORTS the connect gate (R-37.10 — the deliberate re-landing)', () =>
  /require\(['"][^'"]*leadSerializer['"]\)/.test(LEADS_DOOR)
    ? true
    : 'the leads door does not import the gate — phone and email are on a basic wire right now');
t('the LIST handler serializes its page through the gate', () =>
  /leads:\s*serializeLeadRows\(/.test(LEADS_DOOR)
    ? true : 'the list response does not run through serializeLeadRows');
t('the DETAIL handler serializes its envelope through the gate', () =>
  /okRes\(res,\s*serializeLeadDetail\(/.test(LEADS_DOOR)
    ? true : 'the detail response does not run through serializeLeadDetail');
t('the gate is passed the vendor TIER, not a hardcoded value', () =>
  /serializeLeadRows\([^)]*vendor\.tier/.test(LEADS_DOOR)
  && /serializeLeadDetail\([^)]*vendor\.tier/.test(LEADS_DOOR)
    ? true : 'a door is not reading vendors.tier — read-time redaction is broken');
t('the ALERT half IS gated (the lie-free half stays live)', () =>
  ENQUIRE_DOOR.includes('hasFullLeadAccess') && ENQUIRE_DOOR.includes('lead_alert_basic')
    ? true : 'the alert half lost its gate — basic vendors are being sent her contact');
t('the alert still composes BOTH bodies', () =>
  ENQUIRE_DOOR.includes('basicBody') && ENQUIRE_DOOR.includes('fullBody'));

console.log('\n§1 · R-36.10 — THE FOUR CANON SPELLINGS');
t('basic resolves to basic',        () => resolveTier('basic', VENDOR_ID) === 'basic');
t('essential resolves to essential',() => resolveTier('essential', VENDOR_ID) === 'essential');
t('signature resolves to signature',() => resolveTier('signature', VENDOR_ID) === 'signature');
t('prestige resolves to prestige',  () => resolveTier('prestige', VENDOR_ID) === 'prestige');
t('case and whitespace are canon-folded', () => resolveTier('  PRESTIGE ', VENDOR_ID) === 'prestige');
t('unknown spelling FAILS TO REDACTED', () => resolveTier('gold', VENDOR_ID) === 'basic');
t('empty string fails to redacted',  () => resolveTier('', VENDOR_ID) === 'basic');
t('null fails to redacted',          () => resolveTier(null, VENDOR_ID) === 'basic');
t('undefined fails to redacted',     () => resolveTier(undefined, VENDOR_ID) === 'basic');
t('unknown tier LOGS LOUDLY (R-36.10 second half)', () => {
  // A silent fail-to-redacted would demote a payer invisibly. The ruling
  // requires the noise, so the noise is a cell.
  const orig = console.error; let said = '';
  console.error = (m) => { said += m; };
  try { resolveTier('gold', VENDOR_ID); } finally { console.error = orig; }
  return said.includes('UNKNOWN TIER') && said.includes('gold') && said.includes(VENDOR_ID)
    ? true : `log line missing or incomplete: ${said}`;
});
t('a CANON tier logs NOTHING (no false alarms)', () => {
  const orig = console.error; let said = '';
  console.error = (m) => { said += m; };
  try { resolveTier('prestige', VENDOR_ID); } finally { console.error = orig; }
  return said === '' ? true : `unexpected log: ${said}`;
});

console.log('\n§2 · THE LIST DOOR — PAYLOAD-PROOF, BOTH DIRECTIONS');
// RE-FOUNDED BY LABEL. The A-cut's cells here read "leaks NO identity byte",
// "drops raw_message", "drops the draft wishbone". Under R-36.13 raw_message and
// the wishbone are GRANTED, so those three cells now assert the opposite and say
// so in their own labels.
t('[re-founded] BASIC list row leaks NO CONNECT byte', () => {
  const l = connectLeaks(serializeLeadRow(listRow(), 'basic', VENDOR_ID));
  return l.length === 0 ? true : `LEAKED: ${l.join(', ')}`;
});
t('[re-founded] BASIC list row CARRIES her name (R-36.13 presence half)', () =>
  carriesName(serializeLeadRow(listRow(), 'basic', VENDOR_ID))
    ? true : 'her name was withheld — over-redaction against the founder ruling');
t('[re-founded] BASIC list row KEEPS raw_message (the prose vector, now granted)', () =>
  serializeLeadRow(listRow(), 'basic', VENDOR_ID).raw_message
    === `${HER_NAME} enquired via the Discover feed on The Dream Wedding.`);
t('[re-founded] BASIC list row KEEPS the draft wishbone incl. its nested name', () => {
  const r = serializeLeadRow(listRow(), 'basic', VENDOR_ID);
  return r.draft && r.draft.tell_victor.primer.includes(HER_NAME)
    ? true : 'the wishbone or its primer was dropped';
});
t('BASIC list row DROPS phone and nothing else it holds', () => {
  const before = Object.keys(listRow());
  const after  = Object.keys(serializeLeadRow(listRow(), 'basic', VENDOR_ID));
  const lost   = before.filter((k) => !after.includes(k));
  return lost.length === 1 && lost[0] === 'phone'
    ? true : `expected exactly ['phone'] lost, got ${JSON.stringify(lost)}`;
});
t('BASIC list row KEEPS existence + context', () => {
  const r = serializeLeadRow(listRow(), 'basic', VENDOR_ID);
  return r.id === 'lead-1' && r.state === 'new' && r.wedding_city === 'Delhi'
      && r.wedding_date === '2026-12-14' && r.budget_total === 200000
      && r.tdw === true && r.tdw_enquired_at === '2026-08-21T10:00:00Z'
      ? true : `existence fields lost: ${JSON.stringify(r)}`;
});
// ── LABELLED AMENDMENT · SEAT B′ (F-16.25 / R-37.21) · +1 cell, 94 -> 95 ────
// The census constants above were AMENDED to disposition `budget_min` PRESENT.
// A disposition that only edits a constant is a declaration; this cell is the
// proof, so the guard's answer and the wire's behaviour cannot drift apart.
t('[B′ amendment] BASIC list row KEEPS budget_min (dispositioned PRESENT)', () => {
  const row = { ...listRow(), budget_min: 1000000, budget_total: null };
  const out = serializeLeadRow(row, 'basic', VENDOR_ID);
  return out.budget_min === 1000000
    ? true : `the floor was withheld from a basic wire: ${JSON.stringify(out.budget_min)}`;
});
t('BASIC list row carries the redacted tell', () =>
  serializeLeadRow(listRow(), 'basic', VENDOR_ID).redacted === true);
t('[re-founded] an UNKNOWN tier withholds contact on the list row too', () => {
  const orig = console.error; console.error = () => {};
  try { return connectLeaks(serializeLeadRow(listRow(), 'gold', VENDOR_ID)).length === 0; }
  finally { console.error = orig; }
});

console.log('\n§3 · ESSENTIAL+ BYTES PROVEN UNMOVED');
for (const tier of ['essential', 'signature', 'prestige']) {
  t(`${tier} list row is BYTE-IDENTICAL to the ungated row`, () => {
    const before = JSON.stringify(listRow());
    const after  = JSON.stringify(serializeLeadRow(listRow(), tier, VENDOR_ID));
    return before === after ? true : 'row was altered for a paying tier';
  });
  t(`${tier} detail envelope is BYTE-IDENTICAL`, () => {
    const before = JSON.stringify(detailEnvelope());
    const after  = JSON.stringify(serializeLeadDetail(detailEnvelope(), tier, VENDOR_ID));
    return before === after ? true : 'detail was altered for a paying tier';
  });
}

console.log('\n§4 · THE DETAIL DOOR — THE CONNECT SET OUT, EVERYTHING ELSE IN');
t('[re-founded] BASIC detail leaks NO CONNECT byte anywhere in the payload', () => {
  const l = connectLeaks(serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID));
  return l.length === 0 ? true : `LEAKED: ${l.join(', ')}`;
});
t('[re-founded] BASIC detail CARRIES her name (R-36.13 presence half)', () =>
  carriesName(serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID))
    ? true : 'her name was withheld from the detail envelope');
t('lead.phone and lead.email are GONE', () => {
  const d = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID);
  return d.lead.phone === undefined && d.lead.email === undefined;
});
t('[re-founded] lead.name SURVIVES', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).lead.name === HER_NAME);
t('[re-founded] lead.raw_message SURVIVES (free text, granted)', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).lead.raw_message
    === `${HER_NAME} enquired via the Discover feed.`);
t('[re-founded] lead.notes SURVIVES (his own writing)', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).lead.notes
    === `Called ${HER_NAME} on Tuesday.`);
t('[re-founded] lead.referrer_name SURVIVES', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).lead.referrer_name === HER_NAME);
t('[re-founded] vendor_summary SURVIVES on the envelope', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).vendor_summary
    === `${HER_NAME} wants a December wedding shoot.`);
t('budget_min and budget_max both survive', () => {
  const l = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).lead;
  return l.budget_min === 100000 && l.budget_max === 200000;
});
t('[R-37.7] client field-filters to {id, name} — contact gone, name kept', () => {
  const c = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).client;
  const keys = Object.keys(c).sort();
  return c.name === HER_NAME && c.phone === undefined && c.email === undefined
    && JSON.stringify(keys) === JSON.stringify([...CLIENT_BASIC_FIELDS].sort())
    ? true : `client shape wrong: ${JSON.stringify(c)}`;
});
t('[R-37.8, re-founded] conversation RIDES — the thread is not withheld', () => {
  const d = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID);
  return d.conversation.length === 1 && d.conversation[0].body.includes(HER_NAME)
    ? true : 'the thread was withheld — R-37.8 ruled it present';
});
t('[R-37.6, re-founded] invoices KEEP client_name AND their money', () => {
  const inv = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).invoices[0];
  return inv.client_name === HER_NAME && inv.amount_total === 50000
    ? true : `invoice shape wrong: ${JSON.stringify(inv)}`;
});
t('[R-37.9] events RIDE — the envelope no longer loses a block silently', () => {
  const d = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID);
  return Array.isArray(d.events) && d.events.length === 1 && d.events[0].title === 'Sangeet shoot'
    ? true : 'the events block is missing — c-A′.2 has regressed';
});
t('the basic envelope carries EVERY key the ungated envelope carries', () => {
  const before = Object.keys(detailEnvelope()).sort();
  const after  = Object.keys(serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID))
    .filter((k) => k !== 'redacted').sort();
  return JSON.stringify(before) === JSON.stringify(after)
    ? true : `envelope shape drifted\n    ungated: ${before}\n    basic:   ${after}`;
});
t('the envelope carries the redacted tell', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).redacted === true);

console.log('\n§5 · THE TIER FLIP, BOTH DIRECTIONS (read-time proof)');
t('[re-founded] UPGRADE unlocks CONTACT on history — same row, basic then prestige', () => {
  const row = listRow();
  const locked   = serializeLeadRow(row, 'basic', VENDOR_ID);
  const unlocked = serializeLeadRow(row, 'prestige', VENDOR_ID);
  // One row object, two tiers, two answers — only possible because redaction is
  // read-time. A write-time stamp could not produce this.
  return locked.phone === undefined && unlocked.phone === HER_PHONE
    ? true : 'upgrade did not unlock contact on the pre-existing row';
});
t('[re-founded] LAPSE re-locks CONTACT — prestige then basic', () => {
  const row = listRow();
  const unlocked = serializeLeadRow(row, 'prestige', VENDOR_ID);
  const relocked = serializeLeadRow(row, 'basic', VENDOR_ID);
  return unlocked.phone === HER_PHONE && connectLeaks(relocked).length === 0
    ? true : 'lapse did not re-lock';
});
t('a LAPSE never costs him her NAME (the whole point of R-36.13)', () => {
  const relocked = serializeLeadRow(listRow(), 'basic', VENDOR_ID);
  return relocked.name === HER_NAME ? true : 'a lapse withheld the name';
});
t('the flip mutates NOTHING on the stored row', () => {
  const row = listRow();
  const snapshot = JSON.stringify(row);
  serializeLeadRow(row, 'basic', VENDOR_ID);
  serializeLeadRow(row, 'prestige', VENDOR_ID);
  return JSON.stringify(row) === snapshot
    ? true : 'the serializer mutated its input — history would be destroyed';
});
t('the detail flip mutates NOTHING on the stored envelope', () => {
  const env = detailEnvelope();
  const snapshot = JSON.stringify(env);
  serializeLeadDetail(env, 'basic', VENDOR_ID);
  return JSON.stringify(env) === snapshot
    ? true : 'the detail serializer mutated its input';
});

console.log('\n§6 · THE TEMPLATE, AGAINST THE WIRE WITNESS');
t('lead_alert_basic is in the registry', () => !!getTemplate('lead_alert_basic'));
t('it is approved (the gate tests only this)', () => isApproved('lead_alert_basic') === true);
t('Meta name is exact', () => getTemplate('lead_alert_basic').name === 'tdw_lead_alert_basic');
t('it rides the VENDOR line', () => getTemplate('lead_alert_basic').line === 'vendor');
t("body length is Meta's own 127 [F-08.104]", () => {
  const n = getTemplate('lead_alert_basic').body.length;
  return n === 127 ? true : `expected 127, got ${n} — the trailing quote may have been "fixed"`;
});
t('the trailing quote survives [F-08.104 — deleting it ends the body on a variable]', () =>
  getTemplate('lead_alert_basic').body.endsWith('{{3}}"'));
t("rendered body matches the founder's Meta preview byte-for-byte", () => {
  const got = getTemplate('lead_alert_basic').body
    .replace('{{1}}', "registered vendor's name").replace('{{2}}', 'month').replace('{{3}}', 'lead link');
  const want = 'Hi registered vendor\'s name, a couple just asked about your work for their '
    + 'month wedding on The Dream Wedding. Open your Leads to see more: lead link"';
  return got === want ? true : `\n    got:  ${got}\n    want: ${want}`;
});
t('the OOW template carries NO connect byte and NO name slot (unchanged by ruling)', () => {
  const b = getTemplate('lead_alert_basic').body;
  return connectLeaks(b).length === 0 && !b.includes(HER_NAME)
    ? true : 'the OOW template gained identity it was ruled not to carry';
});
t('the built payload carries the pinned three, in order', () => {
  const p = buildTemplatePayload('lead_alert_basic', {
    vendor_name: 'Droy Photography', month: 'December 2026',
    leads_link: 'https://thedreamwedding.in/vendor/list/leads',
  });
  const txt = p.components[0].parameters.map((x) => x.text);
  return txt[0] === 'Droy Photography' && txt[1] === 'December 2026'
      && txt[2] === 'https://thedreamwedding.in/vendor/list/leads'
      ? true : `wrong order/content: ${JSON.stringify(txt)}`;
});
t('the built payload leaks NO connect byte', () => connectLeaks(buildTemplatePayload('lead_alert_basic', {
  vendor_name: 'Droy Photography', month: 'December 2026', leads_link: 'https://x' })).length === 0);
t('body carries no newline (TEMPLATES.md single-line rule)', () =>
  !getTemplate('lead_alert_basic').body.includes('\n'));
t('body does not BEGIN with a variable (TEMPLATES.md)', () =>
  !getTemplate('lead_alert_basic').body.trimStart().startsWith('{{'));
t('body does not END with a variable (TEMPLATES.md) — the quote is why', () =>
  !getTemplate('lead_alert_basic').body.trimEnd().endsWith('}}'));
t('essential+ template enquiry_alert_vendor is UNTOUCHED', () => {
  const b = getTemplate('enquiry_alert_vendor');
  return b && b.name === 'tdw_enquiry_alert_vendor' ? true : 'the essential+ carrier moved';
});

console.log('\n§7 · THE IN-WINDOW ALERT — READ OFF THE SHIPPED SOURCE');
// ═══════════════════════════════════════════════════════════════════════════
// THE A-CUT RETYPED THIS COMPOSITION INTO THE BENCH, and a retyped expression is
// a bench testing itself: enquire.js could drift and every cell here would stay
// green. THE INDEPENDENT-METHOD LAW forbids exactly that — a verification whose
// failure mode is identical to the thing it verifies is not a verification.
//
// So the composition is EXTRACTED FROM THE SHIPPED SOURCE and rendered by
// substitution. The extractor REFUSES rather than returning empty when its
// anchor is absent, because a check whose failure mode is a silent zero is not a
// check (same law, clause 1).
//
// These remain STRUCTURAL cells, not wording cells (LD-5: benches assert
// behaviour, never wording). What is asserted is that the basic body carries her
// NAME and cannot carry CONTACT, whatever the founder later vetoes the words to
// be — plus the one byte-exact cell the null-name arm genuinely requires.
// ═══════════════════════════════════════════════════════════════════════════
const VENDOR_LEADS_URL = 'https://thedreamwedding.in/vendor/list/leads';

function extractBasicBodyLiteral() {
  const m = readRaw('src/api/couple/enquire.js')
    .match(/const basicBody = `([\s\S]*?)`;/);
  if (!m) throw new Error('REFUSED — could not find `const basicBody = \\`…\\`;` in enquire.js');
  return m[1];
}
function extractNameClauseLiteral() {
  const m = readRaw('src/api/couple/enquire.js')
    .match(/const nameClause = ([^\n]*);/);
  if (!m) throw new Error('REFUSED — could not find `const nameClause = …;` in enquire.js');
  return m[1];
}
/**
 * EXECUTE the shipped expressions with real bindings — never re-substitute them.
 *
 * THIS FUNCTION'S FIRST DRAFT WAS VACUOUS AND THE MUTATION HARNESS CAUGHT IT.
 * It string-replaced `${nameClause}` with a value the BENCH computed, so the
 * cells below were asserting against the bench's own idea of the clause rather
 * than the one enquire.js ships. Mutation M8 (nameClause pinned to 'a couple
 * just') bit exactly ONE cell instead of the four it should have, and mutation
 * M11 (the fallback inventing 'Unknown') bit one instead of two. That is the
 * INDEPENDENT-METHOD LAW's clause 1 in miniature — a verification reproducing
 * the method under test — and it was found by execution, not by review.
 *
 * So both literals are compiled and RUN with the door's own variable names in
 * scope. If enquire.js changes how the clause is chosen, these cells change with
 * it, which is the only arrangement worth having.
 */
function renderBasicBody({ businessName, month, brideName }) {
  const nameClauseSrc = extractNameClauseLiteral();
  const bodySrc       = extractBasicBodyLiteral();
  // eslint-disable-next-line no-new-func
  const run = new Function(
    'brideNameFinal', 'vendor', 'monthPhrase', 'wedding_date', 'VENDOR_LEADS_URL',
    `const nameClause = ${nameClauseSrc};\nreturn \`${bodySrc}\`;`
  );
  return run(
    brideName,
    { business_name: businessName },
    () => month,
    null,
    VENDOR_LEADS_URL
  );
}

// THE PINNED PRE-RECUT BYTE. This is the string the estate has been sending
// basic vendors since the A-cut, rendered with the fixtures below. The
// null-name arm must reproduce it EXACTLY — that is what makes "falls back to
// today's byte" a fact rather than an intention.
const PRE_RECUT_BASIC_BODY =
  '\u2726 New enquiry from The Dream Wedding\n\n'
  + 'Hi Droy Photography, a couple just asked about your work for their December 2026 wedding. '
  + `Open your Leads to see more: ${VENDOR_LEADS_URL}\n\n\u2014 TDW`;

t('the shipped literal interpolates nameClause (R-37.12 arm α is wired)', () =>
  extractBasicBodyLiteral().includes('${nameClause}')
    ? true : 'the basic body does not carry the name clause');
t('the shipped nameClause branches on brideNameFinal', () => {
  const src = extractNameClauseLiteral();
  return src.includes('brideNameFinal') && src.includes('a couple just')
    ? true : `nameClause is not the ruled two-arm form: ${src}`;
});
t('[R-37.12] the basic body CARRIES her name when she has one', () =>
  renderBasicBody({ businessName: 'Droy Photography', month: 'December 2026', brideName: HER_NAME })
    .includes(HER_NAME));
t('the basic body carries NO connect byte', () =>
  connectLeaks(renderBasicBody({
    businessName: 'Droy Photography', month: 'December 2026', brideName: HER_NAME })).length === 0);
t('the basic body carries NO Contact: line', () =>
  !renderBasicBody({ businessName: 'Droy Photography', month: 'December 2026', brideName: HER_NAME })
    .includes('Contact:'));
t("the basic body carries the vendor's OWN name", () =>
  renderBasicBody({ businessName: 'Droy Photography', month: 'December 2026', brideName: HER_NAME })
    .includes('Droy Photography'));
t('the basic body carries the leads link', () =>
  renderBasicBody({ businessName: 'Droy Photography', month: 'December 2026', brideName: HER_NAME })
    .includes(VENDOR_LEADS_URL));
t('[BINDING] the NULL-NAME arm renders TODAY\'S BYTE, character for character', () => {
  const got = renderBasicBody({ businessName: 'Droy Photography', month: 'December 2026', brideName: null });
  return got === PRE_RECUT_BASIC_BODY
    ? true : `\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(PRE_RECUT_BASIC_BODY)}`;
});
t('[BINDING] the null-name arm says "a couple" and never a placeholder', () => {
  const got = renderBasicBody({ businessName: 'Droy Photography', month: 'December 2026', brideName: null });
  return got.includes('a couple just')
    && !/Unknown|undefined|null|\{\{|N\/A/.test(got)
    ? true : `the fallback invented something: ${got}`;
});
t('the two arms differ ONLY in the name clause', () => {
  const named = renderBasicBody({ businessName: 'D', month: 'M', brideName: HER_NAME });
  const bare  = renderBasicBody({ businessName: 'D', month: 'M', brideName: null });
  return named.replace(`${HER_NAME} just`, 'a couple just') === bare
    ? true : 'the arms diverge beyond the name clause';
});
t('an undated enquiry says "upcoming", never a blank', () => {
  const { monthPhrase } = require(path.join(ROOT, 'src/lib/discover/demoLeadAlert'));
  return monthPhrase(null) === 'upcoming'
    && renderBasicBody({ businessName: 'X', month: monthPhrase(null), brideName: HER_NAME })
      .includes('upcoming');
});
t("the free-form basic body does NOT carry the template's stray quote", () =>
  !renderBasicBody({ businessName: 'D', month: 'M', brideName: HER_NAME })
    .includes('more: ' + VENDOR_LEADS_URL + '"'));

console.log('\n§8 · SHAPE GUARDS');
t('serializeLeadRows maps a whole page', () => {
  const out = serializeLeadRows([listRow(), listRow()], 'basic', VENDOR_ID);
  return out.length === 2 && connectLeaks(out).length === 0 && carriesName(out);
});
t('a null row survives without throwing', () => serializeLeadRow(null, 'basic', VENDOR_ID) === null);
t('an empty page survives', () => serializeLeadRows(null, 'basic', VENDOR_ID).length === 0);
t('a null detail survives without throwing', () =>
  serializeLeadDetail(null, 'basic', VENDOR_ID) === null);
t('a detail with no lead survives', () => {
  const d = serializeLeadDetail({ ok: true, lead: null }, 'basic', VENDOR_ID);
  return d.lead === null && d.conversation.length === 0 && d.events.length === 0;
});
t('hasFullLeadAccess agrees with resolveTier on all four', () =>
  hasFullLeadAccess('essential') && hasFullLeadAccess('signature')
  && hasFullLeadAccess('prestige') && !hasFullLeadAccess('basic'));
t('the withheld set is EXACTLY {phone, email} (R-36.13, closed by ruling)', () =>
  JSON.stringify([...WITHHELD_FIELDS].sort()) === JSON.stringify(['email', 'phone'])
    ? true : `the ruled connect-set was changed: ${JSON.stringify(WITHHELD_FIELDS)}`);

console.log('\n§9 · THE CENSUS GUARD — R-37.4\'s ALARM ON SCHEMA GROWTH');
// ═══════════════════════════════════════════════════════════════════════════
// A STRIP FAILS OPEN ON A FIELD NOBODY THOUGHT OF. That is the one thing the
// A-cut's allowlist bought that R-37.4 gave up, and this section buys it back —
// not by guessing at runtime, but by REDDING AT A DESK the moment the tree grows
// a key that was never classified.
//
// FOUR INDEPENDENT DERIVATIONS, each with a DIFFERENT failure mode (the
// independent-method law): the witnessed schema doc, the two doors' SELECT
// literals, the list mapper's emitted keys, and the detail envelope's own return
// keys. Every extractor REFUSES on a missing anchor rather than returning an
// empty set, because a silent zero here would report "no drift" about a file it
// could not read.
//
// IF A CELL HERE REDS, THE CURE IS A RULING — classify the new key as withheld
// or present and record it. It is never to append the name to the census and
// move on.
// ═══════════════════════════════════════════════════════════════════════════
function diffSets(label, live, pinned) {
  const added   = live.filter((k) => !pinned.includes(k));
  const removed = pinned.filter((k) => !live.includes(k));
  if (!added.length && !removed.length) return true;
  return `${label} DRIFTED — UNCLASSIFIED: [${added.join(', ')}] · VANISHED: [${removed.join(', ')}]`;
}
function parseSelectList(str) {
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

t('[leg A · the witnessed schema] public.leads columns are all classified', () => {
  const doc = readRaw('docs/db/PUBLIC_SCHEMA.md');
  const m = doc.match(/## public\.leads[^\n]*\n\n```\n([\s\S]*?)```/);
  if (!m) throw new Error('REFUSED — could not find the public.leads block in PUBLIC_SCHEMA.md');
  const cols = m[1].split('\n')
    .map((l) => l.match(/^\d+\.\s+(\w+)\s/))
    .filter(Boolean).map((x) => x[1]);
  if (!cols.length) throw new Error('REFUSED — the public.leads block parsed to zero columns');
  return diffSets('public.leads', cols, LEADS_COLUMN_CENSUS);
});
t('[leg B1 · the LIST door SELECT] every requested column is classified', () => {
  const m = readRaw('src/api/vendor/leads.js').match(/const dataSelect\s*=\s*'([^']+)'/);
  if (!m) throw new Error('REFUSED — could not find `dataSelect` in the leads door');
  return diffSets('list dataSelect', parseSelectList(m[1]), LIST_SELECT_CENSUS);
});
t('[leg B2 · the DETAIL door SELECT] every requested column is classified', () => {
  const lib = readRaw('src/lib/vendor/leads.js');
  const i = lib.indexOf('async function getLeadDetail(');
  if (i < 0) throw new Error('REFUSED — could not find getLeadDetail');
  const m = lib.slice(i).match(/from\('leads'\)\s*\n\s*\.select\('([^']+)'\)/);
  if (!m) throw new Error("REFUSED — could not find getLeadDetail's leads SELECT");
  return diffSets('detail leads SELECT', parseSelectList(m[1]), DETAIL_SELECT_CENSUS);
});
t('[leg C · the LIST mapper] every key put on the wire is classified', () => {
  const src = readRaw('src/api/vendor/leads.js');
  const start = src.indexOf('const leads = (rows || []).map(l => ({');
  if (start < 0) throw new Error('REFUSED — could not find the list mapper');
  const end = src.indexOf('\n  }));', start);
  if (end < 0) throw new Error('REFUSED — could not find the list mapper\'s close');
  const keys = (src.slice(start, end).match(/^ {4}(\w+):/gm) || [])
    .map((s) => s.trim().replace(':', ''));
  if (!keys.length) throw new Error('REFUSED — the list mapper parsed to zero keys');
  return diffSets('list wire', keys, LIST_WIRE_CENSUS);
});
t('[leg D · the DETAIL envelope] every returned key is classified', () => {
  const lib = readRaw('src/lib/vendor/leads.js');
  const i = lib.indexOf('async function getLeadDetail(');
  if (i < 0) throw new Error('REFUSED — could not find getLeadDetail');
  const slice = lib.slice(i);
  const start = slice.indexOf('  return {');
  if (start < 0) throw new Error('REFUSED — could not find getLeadDetail\'s return');
  const end = slice.indexOf('\n  };', start);
  if (end < 0) throw new Error('REFUSED — could not find the return\'s close');
  // The envelope mixes `key: value` with ES6 SHORTHAND (`lead,` `conversation,`
  // `client,`), and a colon-only pattern silently missed exactly those three —
  // found by this cell redding on its first run, which is the extractor's
  // refuse-loudly discipline working on itself.
  const keys = (slice.slice(start, end).match(/^ {4}(\w+)\s*[,:]/gm) || [])
    .map((s) => s.trim().replace(/[,:]$/, ''));
  if (!keys.length) throw new Error('REFUSED — the detail envelope parsed to zero keys');
  return diffSets('detail envelope', keys, DETAIL_ENVELOPE_CENSUS);
});
t('[the pin itself] every withheld field is a real public.leads column', () =>
  WITHHELD_FIELDS.every((f) => LEADS_COLUMN_CENSUS.includes(f))
    ? true : 'the connect-set names a column the schema does not have');
t('[the pin itself] neither door SELECT asks for a column the schema lacks', () => {
  const unknown = [...new Set([...LIST_SELECT_CENSUS, ...DETAIL_SELECT_CENSUS])]
    .filter((c) => !LEADS_COLUMN_CENSUS.includes(c));
  return unknown.length === 0
    ? true : `a door selects a phantom column: ${unknown.join(', ')} (the snapshot.js budget_total class)`;
});
t('[the pin itself] the invoice SELECT still does NOT ask for client_phone', () => {
  const lib = readRaw('src/lib/vendor/leads.js');
  const m = lib.match(/from\('invoices'\)\s*\n\s*\.select\('([^']+)'\)/);
  if (!m) throw new Error('REFUSED — could not find the invoices SELECT');
  return !parseSelectList(m[1]).includes('client_phone')
    ? true : 'the invoice SELECT gained client_phone — R-37.6 was ruled on its absence';
});
t('[the pin itself] the client SELECT is still the four-column identity object', () => {
  const lib = readRaw('src/lib/vendor/leads.js');
  const m = lib.match(/from\('clients'\)\s*\n\s*\.select\('([^']+)'\)/);
  if (!m) throw new Error('REFUSED — could not find the clients SELECT');
  const cols = parseSelectList(m[1]);
  return cols.every((c) => ['id', 'name', 'phone', 'email'].includes(c))
    ? true : `the client object grew a column R-37.7's allowlist has not ruled on: ${cols.join(', ')}`;
});
t('[F-10.122] the agent lane still does NOT read this gate', () => {
  const find = readCode('src/engine/src/core/tools/donnaFind.ts');
  const snap = readCode('src/lib/vendor/snapshot.js');
  return !find.includes('leadSerializer') && !snap.includes('leadSerializer')
    ? true
    : 'an agent-lane reader appeared — F-10.122\'s sequencing law may now be dischargeable, '
      + 'which is a RULING, not a silent bench update';
});

console.log(`\n${'═'.repeat(64)}`);
console.log(`b36_leadgate_a_bench: ${pass}/${pass + fail}`);
if (fail) { console.log('REDS:'); reds.forEach((r) => console.log('  - ' + r)); }
console.log('═'.repeat(64));
process.exit(fail ? 1 : 0);
