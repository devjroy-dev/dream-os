#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b36_leadgate_a_bench.js
// M-LEADGATE-A · R-36.8 / R-36.10 — THE PAYLOAD-PROOF BENCH.
//
// ── WHAT MAKES THESE CELLS THE 08 STANDARD ──────────────────────────────────
// Every identity cell asserts against the SERIALIZED WIRE BYTES — the response
// object run through JSON.stringify — and searches for the literal characters of
// a name and a phone number. Not a field check. Not a key check.
//
// The reason is the disease this arc exists to prevent: a field check passes
// when `name` is absent and her name is sitting inside `raw_message`, or inside
// `draft.tell_victor.primer`, or inside a `conversation[].body`. A byte search
// over the whole payload cannot be satisfied that way. If her name is anywhere
// in what leaves the process, the cell REDS.
//
// Client masking was refused BY NAME at the charter, and this bench is what
// makes that refusal checkable rather than aspirational.
//
// Run: node scripts/b36_leadgate_a_bench.js
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');

const {
  resolveTier, hasFullLeadAccess,
  serializeLeadRow, serializeLeadRows, serializeLeadDetail,
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

// ── THE FIXTURES ────────────────────────────────────────────────────────────
// One name and one phone, used everywhere, so the byte search has a single
// needle. Deliberately distinctive strings: a substring collision with ordinary
// English would make a cell pass or fail for the wrong reason.
const HER_NAME  = 'Priya Sharma';
const HER_PHONE = '+919625759924';
const HER_EMAIL = 'priya.sharma@example.com';
const VENDOR_ID = '23165e38-6510-4639-ab6a-9f35bab93742';

// Every identity needle that must not appear on a basic wire.
const NEEDLES = [HER_NAME, HER_PHONE, HER_EMAIL, '9625759924', 'Priya'];

/** The payload-proof primitive: does the SERIALIZED payload contain any needle? */
function leaks(payload) {
  const wire = JSON.stringify(payload);
  return NEEDLES.filter((n) => wire.includes(n));
}

// A list row exactly as leads.js's mapper builds it (keys copied from the
// mapper at src/api/vendor/leads.js:176-212, not invented).
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

// The detail envelope exactly as getLeadDetail returns it (shape copied from
// src/lib/vendor/leads.js:241-249).
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
      { direction: 'inbound', body: `Hi, this is ${HER_NAME}, my number is ${HER_PHONE}`, created_at: 'x', sent_by: 'couple' },
    ],
    invoices: [{ id: 'inv-1', invoice_number: 'INV-1', client_name: HER_NAME, amount_total: 50000, amount_paid: 0, state: 'draft', due_date: null }],
    events: [],
    client: { id: 'client-1', name: HER_NAME, phone: HER_PHONE, email: HER_EMAIL },
  };
}

console.log('\n§0 · THE WIRING STATE — WHAT IS ACTUALLY CALLED TODAY');
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS SECTION EXISTS, AND WHY IT ASSERTS THE *ABSENCE* OF A CALL.
//
// Every other section in this file tests the serializer MODULE by calling it
// directly. After the ARM A revert (2026-08-24) the two leads doors DO NOT call
// it — so without this section the bench would go on reporting 57/57 while the
// doors it was written to protect ran completely ungated. That is a green over
// an unreachable path, which §9 forbids by name, and it is the failure mode a
// revert quietly creates in every bench that tests a module instead of a wire.
//
// SO THE BENCH STATES THE WIRING RATHER THAN IMPLYING IT. These cells read the
// door files off disk and assert which of them import the gate.
//
// ── THE RE-LANDING LAW, RULED 2026-08-24, VERBATIM ─────────────────────────
// "The two doors' redaction re-lands only after Seat B is at origin, deployed,
//  and walked."
//
// The order is STRUCTURAL, not scheduling. Seat B is backward-compatible — with
// no `redacted` flag on the wire it renders exactly today's behaviour — so
// B-first opens no gap in either direction. Doors-first is what tonight proved:
// the pwa's own fallback is `l.name ?? 'Unknown'` (leads.tsx:55), so an absent
// name rendered as the estate CLAIMING IGNORANCE about data it holds and is
// withholding. The costume class, on a money surface, on seventeen real vendors.
//
// WHEN SEAT B LANDS AND THE DOORS RE-LAND, THE FIRST CELL BELOW GOES RED. That
// is not a defect — it is this instrument demanding that the re-landing be a
// DELIBERATE act with a ruling behind it, rather than something that slides back
// in because a file got restored. Flip the expectation then, and only then.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const LEADS_DOOR   = fs.readFileSync(path.join(ROOT, 'src/api/vendor/leads.js'), 'utf8');
const ENQUIRE_DOOR = fs.readFileSync(path.join(ROOT, 'src/api/couple/enquire.js'), 'utf8');

t('the two LEADS doors are UNGATED (ARM A revert holds)', () =>
  !LEADS_DOOR.includes('leadSerializer')
    ? true
    : 'the leads doors import the gate again — if this is the deliberate re-landing '
      + 'after Seat B walked, flip this cell; if it is not, the Unknown lie is back live');
t('the ALERT half IS gated (the lie-free half stays live)', () =>
  ENQUIRE_DOOR.includes('hasFullLeadAccess') && ENQUIRE_DOOR.includes('lead_alert_basic')
    ? true : 'the alert half lost its gate — basic vendors are being sent her name');
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

console.log('\n§2 · THE LIST DOOR — PAYLOAD-PROOF ON RAW BYTES');
t('BASIC list row leaks NO identity byte', () => {
  const l = leaks(serializeLeadRow(listRow(), 'basic', VENDOR_ID));
  return l.length === 0 ? true : `LEAKED: ${l.join(', ')}`;
});
t('BASIC list row drops raw_message (the prose vector)', () =>
  serializeLeadRow(listRow(), 'basic', VENDOR_ID).raw_message === undefined);
t('BASIC list row drops the draft wishbone (the nested vector)', () =>
  serializeLeadRow(listRow(), 'basic', VENDOR_ID).draft === undefined);
t('BASIC list row KEEPS existence + context', () => {
  const r = serializeLeadRow(listRow(), 'basic', VENDOR_ID);
  return r.id === 'lead-1' && r.state === 'new' && r.wedding_city === 'Delhi'
      && r.tdw === true && r.tdw_enquired_at === '2026-08-21T10:00:00Z'
      ? true : `existence fields lost: ${JSON.stringify(r)}`;
});
t('BASIC list row carries the redacted tell', () =>
  serializeLeadRow(listRow(), 'basic', VENDOR_ID).redacted === true);
t('an UNKNOWN tier redacts the list row too', () => {
  const orig = console.error; console.error = () => {};
  try { return leaks(serializeLeadRow(listRow(), 'gold', VENDOR_ID)).length === 0; }
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

console.log('\n§4 · THE DETAIL DOOR — FIVE VECTORS, EACH CLOSED');
t('BASIC detail leaks NO identity byte anywhere in the payload', () => {
  const l = leaks(serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID));
  return l.length === 0 ? true : `LEAKED: ${l.join(', ')}`;
});
t('vector 1 — lead.name/phone/email gone', () => {
  const d = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID);
  return d.lead.name === undefined && d.lead.phone === undefined && d.lead.email === undefined;
});
t('vector 2 — raw_message (prose) gone', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).lead.raw_message === undefined);
t('vector 3 — client object nulled whole', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).client === null);
t('vector 4 — conversation withheld', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).conversation.length === 0);
t('vector 5 — invoices keep money, lose client_name', () => {
  const d = serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID);
  return d.invoices[0].client_name === undefined && d.invoices[0].amount_total === 50000
    ? true : 'invoice redaction wrong shape';
});
t('vendor_summary (a description of her) withheld', () =>
  serializeLeadDetail(detailEnvelope(), 'basic', VENDOR_ID).vendor_summary === null);

console.log('\n§5 · THE TIER FLIP, BOTH DIRECTIONS (read-time proof)');
t('UPGRADE unlocks HISTORY — the same stored row, basic then prestige', () => {
  const row = listRow();
  const locked   = serializeLeadRow(row, 'basic', VENDOR_ID);
  const unlocked = serializeLeadRow(row, 'prestige', VENDOR_ID);
  // One row object, two tiers, two answers — which is only possible because
  // redaction is read-time. A write-time stamp could not produce this.
  return locked.name === undefined && unlocked.name === HER_NAME
    ? true : 'upgrade did not unlock the pre-existing row';
});
t('LAPSE re-locks HISTORY — prestige then basic', () => {
  const row = listRow();
  const unlocked = serializeLeadRow(row, 'prestige', VENDOR_ID);
  const relocked = serializeLeadRow(row, 'basic', VENDOR_ID);
  return unlocked.name === HER_NAME && leaks(relocked).length === 0
    ? true : 'lapse did not re-lock';
});
t('the flip mutates NOTHING on the stored row', () => {
  const row = listRow();
  const snapshot = JSON.stringify(row);
  serializeLeadRow(row, 'basic', VENDOR_ID);
  serializeLeadRow(row, 'prestige', VENDOR_ID);
  return JSON.stringify(row) === snapshot
    ? true : 'the serializer mutated its input — history would be destroyed';
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
t('rendered body matches the founder\'s Meta preview byte-for-byte', () => {
  const got = getTemplate('lead_alert_basic').body
    .replace('{{1}}', "registered vendor's name").replace('{{2}}', 'month').replace('{{3}}', 'lead link');
  const want = 'Hi registered vendor\'s name, a couple just asked about your work for their '
    + 'month wedding on The Dream Wedding. Open your Leads to see more: lead link"';
  return got === want ? true : `\n    got:  ${got}\n    want: ${want}`;
});
t('NO identity needle in the template body', () => leaks(getTemplate('lead_alert_basic').body).length === 0);
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
t('the built payload leaks NO identity', () => leaks(buildTemplatePayload('lead_alert_basic', {
  vendor_name: 'Droy Photography', month: 'December 2026', leads_link: 'https://x' })).length === 0);
t('body carries no newline (TEMPLATES.md single-line rule)', () =>
  !getTemplate('lead_alert_basic').body.includes('\n'));
t('body does not BEGIN with a variable (TEMPLATES.md:19)', () =>
  !getTemplate('lead_alert_basic').body.trimStart().startsWith('{{'));
t('body does not END with a variable (TEMPLATES.md:19) — the quote is why', () =>
  !getTemplate('lead_alert_basic').body.trimEnd().endsWith('}}'));
t('essential+ template enquiry_alert_vendor is UNTOUCHED', () => {
  const b = getTemplate('enquiry_alert_vendor');
  return b && b.name === 'tdw_enquiry_alert_vendor' ? true : 'the essential+ carrier moved';
});

console.log('\n§7 · THE ALERT BODIES (composed exactly as enquire.js composes them)');
// The composition is reproduced here from the shipped expressions. It is a
// STRUCTURAL cell, not a wording cell (LD-5: benches assert behaviour, never
// wording) — what it asserts is that the basic body cannot contain identity,
// whatever the founder later vetoes the words to be.
const VENDOR_LEADS_URL = 'https://thedreamwedding.in/vendor/list/leads';
function basicBodyOf(businessName, monthPhrase) {
  return `\u2726 New enquiry from The Dream Wedding\n\nHi ${businessName || 'there'}, a couple just asked about your work for their ${monthPhrase} wedding. Open your Leads to see more: ${VENDOR_LEADS_URL}\n\n\u2014 TDW`;
}
t('the basic in-window body leaks NO identity', () =>
  leaks(basicBodyOf('Droy Photography', 'December 2026')).length === 0);
t('the basic body carries the vendor\'s OWN name, not hers', () =>
  basicBodyOf('Droy Photography', 'December 2026').includes('Droy Photography'));
t('the basic body carries the leads link', () =>
  basicBodyOf('Droy Photography', 'December 2026').includes(VENDOR_LEADS_URL));
t('the basic body carries NO Contact: line', () =>
  !basicBodyOf('Droy Photography', 'December 2026').includes('Contact:'));
t('an undated enquiry says "upcoming", never a blank', () => {
  const { monthPhrase } = require(path.join(ROOT, 'src/lib/discover/demoLeadAlert'));
  return monthPhrase(null) === 'upcoming' && basicBodyOf('X', monthPhrase(null)).includes('upcoming');
});
t('the free-form basic body does NOT carry the template\'s stray quote', () =>
  !basicBodyOf('Droy Photography', 'December 2026').includes('more: ' + VENDOR_LEADS_URL + '"'));

console.log('\n§8 · SHAPE GUARDS');
t('serializeLeadRows maps a whole page', () => {
  const out = serializeLeadRows([listRow(), listRow()], 'basic', VENDOR_ID);
  return out.length === 2 && leaks(out).length === 0;
});
t('a null row survives without throwing', () => serializeLeadRow(null, 'basic', VENDOR_ID) === null);
t('an empty page survives', () => serializeLeadRows(null, 'basic', VENDOR_ID).length === 0);
t('hasFullLeadAccess agrees with resolveTier on all four', () =>
  hasFullLeadAccess('essential') && hasFullLeadAccess('signature')
  && hasFullLeadAccess('prestige') && !hasFullLeadAccess('basic'));

console.log(`\n${'═'.repeat(64)}`);
console.log(`b36_leadgate_a_bench: ${pass}/${pass + fail}`);
if (fail) { console.log('REDS:'); reds.forEach((r) => console.log('  - ' + r)); }
console.log('═'.repeat(64));
process.exit(fail ? 1 : 0);
