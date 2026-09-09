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
  ok('4.3 BEFORE the answer is composed — the record lands whatever the reply does',
     at('consent_source') < at('openProspectConversation'));
}

section('5. limb (a) is NOT asserted here, and the file says why');
ok('5.1 the arm does not re-implement consentEvidences or test for the number',
   !/consentEvidences/.test(arm) && !/slice\(-10\)/.test(arm));
ok('5.2 the reason is written down: she is messaging FROM the number, Meta witnesses it',
   /SHE IS MESSAGING FROM THAT NUMBER/.test(raw));

console.log(`\n${fail ? 'RED' : 'GREEN'} — b66_inbound_consent ${pass}/${pass + fail}`);
if (fail) { console.log('FAILED: ' + fails.join(' · ')); process.exit(1); }
