#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// b66 · R-41.131 · HER REPLY IS THE RECORD — the inbound consent arm.
// CE-41 seat D, D3c1. Cut at dream-os 1267e43de63d7d888e478890360d9ef8e001750d.
//
// R-41.122 gave consent a column, R-41.132 made it evidence rather than a gate, and
// both still required the founder to ask in a DM and paste the answer. This arm
// closes the loop: when she replies to US, her own message IS the record — TDW never
// typed it and did not have to.
// ═══════════════════════════════════════════════════════════════════════════════
const fs = require('fs'); const path = require('path');
const P = (...a) => path.join(__dirname, '..', ...a);
// A cell that cannot see its subject must FAIL, never throw (seat A's close note §6).
const read = (rel) => (fs.existsSync(P(rel)) ? fs.readFileSync(P(rel), 'utf8') : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

let pass = 0, fail = 0; const fails = [];
const ok = (l, c) => { if (c === true) pass++; else { fail++; fails.push(l); }
  console.log(`  ${c === true ? 'ok  ' : 'FAIL'}  ${l}`); };
const section = (t) => console.log(`\n── ${t}`);

const raw = read('src/lib/prospects.js');
const src = strip(raw);
const arm = src.slice(src.indexOf('async function _handleMarketingInbound'));

console.log('b66 · R-41.131 — her reply is the record');

section('1. the arm records, and records HER words');
ok('1.1 it writes consent_text from the inbound text, verbatim',
   /consent_text: text,/.test(arm));
ok('1.2 the source is `whatsapp`, not instagram_dm — Meta delivered this one',
   /consent_source: 'whatsapp'/.test(arm));
ok('1.3 it stamps who recorded it as the inbound itself, never a person',
   /consent_recorded_by: 'inbound:whatsapp'/.test(arm));
ok('1.4 `whatsapp` is admitted by 0156\'s CHECK — no migration is owed',
   /'whatsapp'/.test(read('db/migrations/0156_prospect_consent_record.sql')));

section('2. it NEVER overwrites — evidence is not editable after the fact');
ok('2.1 guarded on the absence of an existing record',
   /if \(!prospect\.consent_text && text && text\.trim\(\)\)/.test(arm));
ok('2.2 an empty or whitespace reply is not a record',
   /text && text\.trim\(\)/.test(arm));

section('3. it never fails the turn');
ok('3.1 the write is in a try, and the catch only warns',
   /console\.warn\('\[prospects:consent\]'/.test(arm)
   && arm.indexOf('consent_recorded_by') < arm.indexOf("console.warn('[prospects:consent]'"));
ok('3.2 nothing rethrows — she has written to us and must get an answer',
   !/\[prospects:consent\][\s\S]{0,120}throw/.test(arm));

section('4. it sits in the right place in the arm order');
{
  const at = (needle) => arm.indexOf(needle);
  ok('4.1 AFTER the discarded arm — a discarded row is not re-consented',
     at("'noop_discarded'") !== -1 && at("'noop_discarded'") < at('consent_source'));
  ok('4.2 AFTER opted_out — someone who said STOP is never recorded as consenting',
     at("'noop_opted_out'") !== -1 && at("'noop_opted_out'") < at('consent_source'));
  // ── F-41.107 CURED (R-41.144) ────────────────────────────────────────────
  // This compared the consent arm against the FIRST `openProspectConversation` in the
  // file — and there are three (the START arm opens one too). It passed for the wrong
  // reason: it would pass identically if the arm moved ABOVE the START arm's call,
  // which is not the claim. FIFTH first-match specimen this sitting.
  // Anchored now on the slice that begins at the consent arm itself, so "the next
  // conversation opened after this record" is the only thing it can read.
  ok('4.3 BEFORE the answer is composed — the record lands whatever the reply does',
     (() => {
       const from = arm.indexOf('consent_source');
       if (from === -1) return 'no consent arm';
       const after = arm.slice(from);
       return after.indexOf('openProspectConversation') !== -1;
     })() === true);
  ok('4.4 and the cell can tell the arm apart from the START arm that also opens one',
     (arm.match(/openProspectConversation/g) || []).length >= 2);
}

section('5. limb (a) is NOT asserted here, and the file says why');
ok('5.1 the arm does not re-implement consentEvidences or test for the number',
   !/consentEvidences/.test(arm) && !/slice\(-10\)/.test(arm));
ok('5.2 the reason is written down: she is messaging FROM the number, Meta witnesses it',
   /SHE IS MESSAGING FROM THAT NUMBER/.test(raw));

section('6. R-41.131 — the link the founder sends her');
{
  // A CELL THAT CANNOT SEE ITS SUBJECT MUST FAIL, NEVER THROW — seat A's close note §6,
  // and the FOURTH bench this sitting to need it (§7c, b65's read, §7f, here). At an
  // uncured tree the helpers do not exist and an unguarded call takes the whole bench
  // down: zero failures, no verdict, which reads as a clean run at a glance.
  let A = {};
  try { A = require(P('src/lib/couple/assistance.js')); } catch (_e) { /* uncured */ }
  const has = typeof A.enquiryToken === 'function' && typeof A.enquiryWaLink === 'function';
  const ID = '5b253fb2-1287-41e0-a3d4-eac192c28269';
  if (!has) {
    for (let i = 0; i < 6; i++) ok('§6 cell — assistance.js exports no link builder (R-41.131 uncured)', false);
  }
  if (has) {
  ok('6.1 the token is enq- + the id\'s first eight hex — R-41.119\'s vocabulary',
     A.enquiryToken(ID) === 'enq-5b253fb2');
  // THE NUMBER IS DERIVED THROUGH normalizeTo, SO BOTH DRESSES FOLD. The estate holds
  // it as `whatsapp:+918810531764`; a builder that trusted the raw value would emit
  // `wa.me/whatsapp:+91...` and open WhatsApp on nothing.
  const want = 'https://wa.me/918810531764?text=Send%20me%20the%20enquiry%20enq-5b253fb2';
  ok('6.2 the Twilio dress folds to bare digits', A.enquiryWaLink(ID, { marketingNumber: 'whatsapp:+918810531764' }) === want);
  ok('6.3 and a bare E.164 gives the identical link', A.enquiryWaLink(ID, { marketingNumber: '918810531764' }) === want);
  // NULL, NEVER A HALF-BUILT URL. A wa.me link with no number opens WhatsApp on
  // nothing and looks like the estate working; the queue shows no link instead.
  ok('6.4 no number → null, not a broken link', A.enquiryWaLink(ID, { marketingNumber: '' }) === null);
  ok('6.5 an id too short to name an enquiry → null', A.enquiryWaLink('abc', { marketingNumber: '918810531764' }) === null);
  ok('6.6 the number is never typed into this file — it is derived',
     !/918810531764/.test(strip(read('src/lib/couple/assistance.js'))));
  }
}

section('7. F-41.149 — the comment said the wrong variable');
{
  const pr = read('src/lib/prospects.js');
  ok('7.1 MARKETING_WHATSAPP_NUMBER is no longer called a Meta phone-number-id',
     !/MARKETING_WHATSAPP_NUMBER is a Meta phone-number-id/.test(pr));
  ok('7.2 and the correction names which variable actually holds the id',
     /MARKETING_PHONE_NUMBER_ID` is the Meta id/.test(pr));
}

section('8. F-41.151 — a number already on TDW is redirected, not invited');
{
  const w = strip(read('src/lib/couple/assistance.js'));
  const d = strip(read('src/api/admin/assistance.js'));
  ok('8.1 the lookup goes phone → users → vendors (vendors HAS NO phone column)',
     /from\('users'\)[\s\S]{0,80}like\('phone'/.test(w) && /from\('vendors'\)[\s\S]{0,120}eq\('user_id'/.test(w));
  // R-41.69's law, carried: two users on one last-ten → attach NOTHING. A redirect
  // naming the wrong handle is worse than no redirect.
  ok('8.2 two users sharing a last ten → null, never a guess',
     /\.limit\(2\)/.test(w) && /users\.length !== 1\) return null/.test(w));
  // The first `consentEvidences(prospect` in the file is the FUNCTION DEFINITION, not
  // a call — this cell's first cut matched it and read the gate as misplaced when it
  // was not. F-41.107's family: an anchor that cannot tell a declaration from a use.
  // Scoped to forwardToProspect's own slice, where only the call exists.
  ok('8.3 it refuses BEFORE anything is written or sent', (() => {
    const fn = w.slice(w.indexOf('async function forwardToProspect('));
    return fn.indexOf('REFUSE.ALREADY_A_VENDOR') !== -1
        && fn.indexOf('REFUSE.ALREADY_A_VENDOR') < fn.indexOf('const consent = consentEvidences(prospect)')
        && fn.indexOf('REFUSE.ALREADY_A_VENDOR') < fn.indexOf('writeForward');
  })() === true);
  ok('8.4 the refusal names the handle and the door offers the TDW forward',
     /already on TDW as @\$\{already\.routing_handle\}/.test(w)
     && /vendor: out\.vendor \|\| undefined/.test(d));
  ok('8.5 mapped to the caller-at-fault branch, not the 500 fallback',
     /REFUSE\.ALREADY_A_VENDOR/.test(d) && d.indexOf('REFUSE.ALREADY_A_VENDOR') < d.indexOf(': 500;'));
}

section('9. F-41.100 / R-41.123 — the cap asks, then passes');
{
  const w = strip(read('src/lib/couple/assistance.js'));
  const d = strip(read('src/api/admin/assistance.js'));
  ok('9.1 the gate reads FANOUT_DEFAULT — the number is finally kept, not just shown',
     /if \(!confirm && \(item\.forwarded_count \|\| 0\) >= FANOUT_DEFAULT\)/.test(w));
  // ABOVE BOTH ARMS: the cap counts vendors who have seen the category, and a TDW
  // vendor counts as much as an outsider. Inside either arm it would be half a rule.
  ok('9.2 it gates on the ITEM, above the vendor/prospect branch',
     w.indexOf('REFUSE.FANOUT_REACHED') < w.indexOf("if (kind === 'vendor')"));
  ok('9.3 confirm passes it, and the confirm is the CALLER\'s',
     /confirm: b\.confirm === true/.test(d));
  ok('9.4 the refusal carries both counts so the sentence can name them',
     /forwarded_count: item\.forwarded_count \|\| 0/.test(w) && /fanout_default: out\.fanout_default/.test(d));
}

section('10. F-41.128 — the public door, judged by what it REFUSES');
{
  const e = strip(read('src/api/public/enquiry.js'));
  const raw = read('src/api/public/enquiry.js');
  // THE ONE-HOME LAW HELD AND THE DOOR WAS WRONG. b20_a2 asserts `.from('assistance_*')`
  // lives in exactly two files; the first cut of this door made a third. The QUERY is
  // the writer's now and the door is a shape — so the "never selects phone" cell reads
  // publicEnquiry, and the "never renders it" cells read the door.
  const q = strip(read('src/lib/couple/assistance.js'));
  const pe = q.slice(q.indexOf('async function publicEnquiry'), q.indexOf('async function bumpForwarded'));
  // ⚠ THE ONLY CELLS THAT MATTER ON AN UNAUTHENTICATED DOOR.
  ok('10.1 the reader names its columns and NEVER selects phone or name',
     /select\('id, city, wedding_date, status'\)/.test(pe) && !/phone/.test(pe));
  ok('10.1b the door itself touches no assistance table — the read is the writer\'s',
     !/from\('assistance_/.test(e) && /publicEnquiry\(req\.app\.locals\.supabase/.test(e));
  ok('10.2 no row is ever spread — every field is named, one by one',
     !/\.\.\.request/.test(e + pe) && !/\.\.\.item/.test(e + pe) && !/\.\.\.row/.test(e));
  ok('10.3 the budget leaves as a BAND, and the figure never does',
     /budget_band: budgetBand\(row\.budget_rs\)/.test(e) && !/budget_rs:/.test(e));
  ok('10.4 the date leaves as month and year — the day is dropped inside monthYear',
     /month:\s*monthYear\(row\.wedding_date\)/.test(e) && !/getUTCDate/.test(e));
  ok('10.5 no id of any kind rides out',
     !/id:\s*(item|request|row)\./.test(e));
  // AN ORACLE IS THE OTHER FAILURE. Missing, closed and malformed must be one answer.
  ok('10.6 every miss answers identically — the door is not an oracle',
     (() => {
       // THE ORACLE TEST, ASSERTED ACROSS BOTH HOMES. The reader returns null for
       // every miss — malformed prefix, no match, ambiguous prefix, closed request —
       // and the door turns EVERY null into the one NOTHING. Counting `NOTHING` alone
       // was the wrong shape: it moved when the query moved, and a count is not the
       // guarantee (R-41.138). What matters is that no branch answers differently.
       const misses = ['test(String(prefix', 'items.length !== 1) return null',
                       "status === 'closed'"];
       const readerRefuses = misses.every((m) => pe.includes(m));
       const doorFolds = /if \(!m\) return res\.json\(NOTHING\)/.test(e)
                      && /if \(!row\) return res\.json\(NOTHING\)/.test(e);
       return readerRefuses && doorFolds;
     })() === true);
  ok('10.7 a prefix matching two items answers NOTHING rather than picking one',
     /items\.length !== 1\) return null/.test(pe));
  ok('10.8 the token shape is anchored — enq- plus exactly eight hex',
     /\^enq-\(\[0-9a-f\]\{8\}\)\$/.test(raw));
  ok('10.9 it is mounted beside the other public read',
     /public\/enquiry/.test(strip(read('src/api/router.js'))));
}

console.log(`\n${fail ? 'RED' : 'GREEN'} — b66_inbound_consent ${pass}/${pass + fail}`);
if (fail) { console.log('FAILED: ' + fails.join(' · ')); process.exit(1); }
