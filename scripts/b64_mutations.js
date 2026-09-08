#!/usr/bin/env node
// scripts/b64_mutations.js — the both-ways half of b64 (R-41.97, rule 6).
// Each mutation edits PRODUCTION code in a scratch copy of the tree; the named
// cell must RED. A mutation may carry SEVERAL edits across SEVERAL files — M6
// needs that, and a harness that could only edit one file would have forced a
// dishonest version of it.
//
// M1 is seat B's first ruled mutation: restore `assist_lead_outside`'s pre-F-41.63
//    body and array. It must red on 1.c — and at the uncured tree 1.a (tokens) and
//    1.b (length) BOTH PASS, because the two bodies were {{1}}..{{5}}, sequential,
//    length 5. A tokens-against-the-index cell would have been GREEN on the live
//    defect. Seat B's correction to the chair's spec is why this bench convicts.
//
// M3 IS THIS CELL'S OWN TUITION, RECORDED RATHER THAN QUIETLY FIXED. §2's first
//    cut bound `variables` to the trailing `// {{n}} <name>` annotations on the
//    `vars` elements. M3 swapped two expressions and carried their annotations
//    along; the cell read the annotations, stayed GREEN, and the wire was garbled
//    — F-41.63's exact live defect walking through the cell built to catch it.
//    That is the comment-blindness class (R-40.105) and R-40.94's, which this same
//    rider struck out of b20_a2:405 under c-41.39. §2 was rebuilt to strip line
//    comments and bind the EXPRESSION. M3 now convicts.
//
// M6 IS A DECLARED SURVIVOR, NOT A FAILURE. It permutes the registry `variables`,
//    the registry body AND the send arm's expressions together, so every source
//    inside the estate stays consistent and both cells stay GREEN. That case is
//    wrong only against META, and no cell here claims it. The harness asserts it
//    SURVIVES, so b64's header is proven honest rather than promised honest.
'use strict';
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const TPL = 'src/lib/templates.js';
const ARM = 'src/lib/couple/assistance.js';
const BEN = 'scripts/b64_template_slots_bench.js';

const CURED_VARS = "    variables: ['name', 'month_year', 'city', 'category_noun', 'budget_rs'],";
const CURED_BODY =
  '    body:\n' +
  '      "Hi {{1}}, a couple planning a {{2}} wedding in {{3}} asked The Dream Wedding to " +\n' +
  '      "find them a {{4}}, and their request has been matched to you with a budget of " +\n' +
  '      "about Rs {{5}}. The request is held on the page below. Reply STOP REQUESTS if " +\n' +
  '      "you would rather not receive these.",';

const PRE_CURE =
  "    variables: ['name', 'city', 'category_words', 'month_year', 'budget_rs'],\n" +
  '    body:\n' +
  '      "Hello {{1}}, this is The Dream Wedding. A couple in {{2}} is looking for {{3}} " +\n' +
  '      "for a wedding in {{4}}, with a budget around Rs {{5}}. Join The Dream Wedding to " +\n' +
  '      "see the request and reply to them from your own account.",';

// The two adjacent send-arm lines, cured. Swapping them is the live F-41.63 defect.
const ARM_23 =
  "    monthDayYear(request.wedding_date) ? monthYearOnly(request.wedding_date) : 'a date to be decided', // {{2}} month_year\n" +
  "    request.city || 'India',                                                                          // {{3}} city";
const ARM_23_SWAPPED =
  "    request.city || 'India',                                                                          // {{2}} month_year\n" +
  "    monthDayYear(request.wedding_date) ? monthYearOnly(request.wedding_date) : 'a date to be decided', // {{3}} city";
// M6's arm half: swapped AND re-annotated, so even the comments agree.
const ARM_23_CONSISTENT =
  "    request.city || 'India',                                                                          // {{2}} city\n" +
  "    monthDayYear(request.wedding_date) ? monthYearOnly(request.wedding_date) : 'a date to be decided', // {{3}} month_year";

const MUT = [
  { id: 'M1 F-41.63 returns — the pre-cure body and slot order restored',
    edits: [[TPL, CURED_VARS + '\n' + CURED_BODY, PRE_CURE]],
    cell: 'literal subsequences identical' },

  { id: 'M2 the variables array is permuted, the body untouched (§1 cannot see it; §2 must)',
    edits: [[TPL, CURED_VARS, "    variables: ['name', 'city', 'month_year', 'category_noun', 'budget_rs'],"]],
    cell: 'vars order is bound to templates.js variables' },

  { id: "M3 the send arm's expressions are swapped, annotations carried along (the live defect)",
    edits: [[ARM, ARM_23, ARM_23_SWAPPED]],
    cell: 'vars order is bound to templates.js variables' },

  { id: 'M4 a registry entry gains a §2 row while still named witnessless (partition, rule 5)',
    edits: [[BEN, "  'tdw_lead_alert_basic', 'tdw_lead_alert_utility', 'tdw_payment_reminder',",
                  "  'tdw_lead_alert_basic', 'tdw_lead_alert_utility', 'tdw_payment_reminder', 'tdw_assist_lead_outside',"]],
    cell: 'is NOT on NO_S2_WITNESS' },

  { id: 'M5 a name leaves NO_S2_WITNESS without gaining a §2 row (partition, other edge)',
    edits: [[BEN, "  'tdw_vendor_welcome', 'tdw_wedding_consent', 'tdw_wedding_credit',",
                  "  'tdw_wedding_consent', 'tdw_wedding_credit',"]],
    cell: 'is named on NO_S2_WITNESS' },

  // M6 IS EXACTLY M2 AND M3 APPLIED TOGETHER, AND THEY CANCEL. Permute the registry
  // `variables` and permute the send arm's expressions to match: both bodies are
  // untouched, so §1 is green (the literals never moved), and §2 is green (each
  // expression still sits at the index its variable names). Every source inside
  // the estate agrees. Meta does not — {{2}} now carries the city into a body that
  // reads "a {{2}} wedding". Nothing here can see that. The Manager can.
  { id: 'M7 F-41.80 returns — the article goes back into the value (the doubled article)',
    edits: [['src/lib/couple/assistance.js',
      "  makeup: 'makeup artist', hairstylist: 'hairstylist', jewellery: 'jeweller', decor: 'decorator',",
      "  makeup: 'a makeup artist', hairstylist: 'a hairstylist', jewellery: 'a jeweller', decor: 'a decorator',"]],
    cell: 'no doubled article' },

  { id: 'M6 DECLARED SURVIVOR — registry variables and the send arm permuted together (M2+M3, cancelling)',
    edits: [
      [TPL, CURED_VARS, "    variables: ['name', 'city', 'month_year', 'category_noun', 'budget_rs'],"],
      [ARM, ARM_23, ARM_23_CONSISTENT],
    ],
    survives: true },
];

let bad = 0;
for (const m of MUT) {
  const scratch = fs.mkdtempSync('/tmp/b64m-');
  execSync(`cp -r ${ROOT}/src ${ROOT}/docs ${ROOT}/scripts ${ROOT}/package.json ${scratch}/ && ln -s ${ROOT}/node_modules ${scratch}/node_modules`);
  let anchored = true;
  for (const [file, from, to] of m.edits) {
    const p = path.join(scratch, file); const s = fs.readFileSync(p, 'utf8');
    const n = s.split(from).length - 1;
    if (n !== 1) {
      console.log(`  ??     ${m.id} — anchor in ${file} matched ${n} times (must be 1)`);
      anchored = false; break;
    }
    fs.writeFileSync(p, s.replace(from, to));
  }
  if (!anchored) { bad++; fs.rmSync(scratch, { recursive: true, force: true }); continue; }

  let out = '';
  try { out = execSync(`node ${scratch}/scripts/b64_template_slots_bench.js`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const line = out.split('\n').find(l => l.includes('FAILED:')) || '';

  if (m.survives) {
    const green = /\bGREEN\b/.test(out) && !line;
    console.log(`  ${green ? 'ok   ' : 'MISS '} ${m.id}`);
    console.log("         must stay GREEN — this one is the Manager's to witness, not a cell's");
    if (!green) { bad++; console.log(`         expected GREEN; got: ${line.slice(0, 300)}`); }
  } else {
    const hit = line.includes(m.cell);
    console.log(`  ${hit ? 'ok   ' : 'MISS '} ${m.id}`);
    if (!hit) { bad++; console.log(`         expected RED: ${m.cell}`); console.log(`         got: ${line.slice(0, 300)}`); }
  }
  fs.rmSync(scratch, { recursive: true, force: true });
}
console.log(`\n  b64_mutations  ${MUT.length - bad}/${MUT.length}`);
process.exit(bad ? 1 : 0);
