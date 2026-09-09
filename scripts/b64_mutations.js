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
// D2 / R-41.118: the cured body is v2's. M1's "pre-cure" is now v1's MARKETING body,
// which is what F-41.63 fixed and R-41.118 then replaced wholesale — restoring it still
// reds 1.c, and for the same reason: its literals are not the document's.
// ANCHOR DRIFT IS THE HAZARD HERE. These constants are transcribed from templates.js and
// die silently the moment it moves — seat G lost eight anchors this way one packet ago
// (its §5), and this seat lost b62_mutations M6 to its own byte (c-41.43). The harness
// reports "matched 0 times" rather than passing, which is the only reason that is survivable.
const CURED_BODY =
  '    body:\n' +
  '      "Hi {{1}}, you have a new enquiry through The Dream Wedding: a couple planning " +\n' +
  '      "a {{2}} wedding in {{3}} needs a {{4}}, with a budget of about Rs {{5}}. The full " +\n' +
  '      "enquiry is on the page below.",';

// PRE_CURE retired: M1 now carries its two halves inline (see M1's note).

// The two adjacent send-arm lines, cured. Swapping them is the live F-41.63 defect.
// D2b / F-41.123: the send site passes an OBJECT now. The defect these mutations
// model is no longer "two list positions swapped" but "two KEYS given each other's
// expression" — which is what a keyed binding exists to convict.
// ⚠ RE-DERIVED AT F-41.154 (this is the sixth anchor this sitting to die on a real
// edit, and the harness reporting "matched 0 times" is the only reason each was
// survivable). The date fallback moved from four inline copies into `assistanceMonth`,
// so the old two-line anchor no longer exists. Read from the live file, not recalled.
const ARM_23 =
  "    month_year:  assistanceMonth(request.wedding_date), // {{2}}\n" +
  "    city:        assistanceCity(request.city),                                                             // {{3}}";
const ARM_23_SWAPPED =
  "    month_year:  assistanceCity(request.city), // {{2}}\n" +
  "    city:        assistanceMonth(request.wedding_date),                                                             // {{3}}";


const MUT = [
  // TWO EDITS, not one concatenated anchor: a comment block now sits between the
  // `variables` line and the `body` line, and the joined anchor died on it
  // ("matched 0 times"). Two edits is also the truer shape — F-41.63 was a wrong
  // body AND a wrong slot order, and either alone reds 1.c.
  { id: 'M1 F-41.63 returns — the pre-cure body and slot order restored',
    edits: [
      [TPL, CURED_VARS, "    variables: ['name', 'city', 'category_noun', 'month_year', 'budget_rs'],"],
      [TPL, CURED_BODY,
        '    body:\n' +
        '      "Hello {{1}}, this is The Dream Wedding. A couple in {{2}} is looking for {{3}} " +\n' +
        '      "for a wedding in {{4}}, with a budget around Rs {{5}}. Join The Dream Wedding to " +\n' +
        '      "see the request and reply to them from your own account.",'],
    ],
    cell: 'literal subsequences identical' },

  // ── M2 RETIRED INTO M8, AND SAID SO RATHER THAN DELETED ──────────────────
  // M2 permuted `variables` and expected §2 to catch it. Under the ARRAY form it
  // did — the binding was positional. Under the KEYED form it cannot: a key carries
  // its own meaning, so there is no order at the send site to break. M2 and M8 are
  // THE SAME EDIT EXPECTING OPPOSITE VERDICTS, and a harness that holds both is
  // contradicting itself. M8 is the honest one and names where the conviction
  // actually lives (b20_a2's driven cell, verified by command at the cut).

  { id: "M3 the send arm's expressions are swapped, annotations carried along (the live defect)",
    edits: [[ARM, ARM_23, ARM_23_SWAPPED]],
    cell: 'each value\'s expression matches the variable it is keyed to' },

  { id: 'M4 a registry entry gains a §2 row while still named witnessless (partition, rule 5)',
    // The old target (`tdw_assist_lead_outside`) is RETIRED and unregistered since
    // R-41.118, so 1.q never fires for it — the mutation went unobservable rather
    // than uncaught. Re-aimed at the live compared entry.
    edits: [[BEN, "  'tdw_lead_alert_basic', 'tdw_lead_alert_utility', 'tdw_payment_reminder',",
                  "  'tdw_lead_alert_basic', 'tdw_lead_alert_utility', 'tdw_payment_reminder', 'tdw_assist_lead_outside_v2',"]],
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

  // ── M6 RETIRED, AND WHY, BECAUSE A RETIRED MUTATION MUST SAY SO ───────────
  // M6 modelled "permute `variables` AND permute the send arm to match — they
  // cancel." Under the ARRAY form that was a real, invisible pair. Under the KEYED
  // form the send arm has no order to permute: a key carries its own meaning, so
  // there is nothing to cancel against. The residue M6 declared no longer exists in
  // that shape. Its replacement is M8, which measures what the keyed form actually
  // gave up. Deleting M6 silently would have quietly shrunk the harness's claim.

  // ── M8 · WHAT THE KEYED FORM COSTS, MEASURED NOT ASSUMED ──────────────────
  // Permuting `variables` alone changes the ORDER META RECEIVES (the builder does
  // `declared.map(nm => vars[nm])`), and §1 cannot see it (no literal moves) and §2
  // cannot see it (keys bind by name, not position). So b64 is BLIND to it, and this
  // mutation asserts that blindness out loud rather than letting a reader assume
  // coverage. THE CONVICTION LIVES IN b20_a2's DRIVEN CELL, which builds the payload
  // and compares the order Meta actually gets — behaviour, not text. That is the
  // better instrument for it, and this note is the pointer to it.
  { id: 'M8 DECLARED BLIND SPOT — `variables` permuted alone (b64 cannot see it; b20_a2 convicts it)',
    edits: [
      [TPL, CURED_VARS, "    variables: ['name', 'city', 'month_year', 'category_noun', 'budget_rs'],"],
    ],
    survives: true,
    why: 'b64 is blind here BY DESIGN of the keyed form; b20_a2\'s driven cell builds the payload and convicts it' },
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
    console.log(`         must stay GREEN — ${m.why || "this one is the Manager's to witness, not a cell's"}`);
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
