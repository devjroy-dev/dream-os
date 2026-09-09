#!/usr/bin/env node
'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// b64 · R-41.97 · THE TEMPLATE SLOT TRIPWIRE — two cells, two directions.
// CE-41 seat D, the F-41.63 rider. Cut at dream-os c4733904f567ae3b7e97af9d310a612306e849eb.
//
// ⚠ R-41.97's SEVENTH RULE, FIRST, BECAUSE IT GOVERNS HOW TO READ A GREEN HERE:
//   THIS BENCH IS A TRIPWIRE BETWEEN TWO INTERNAL DOCUMENTS. NEITHER IS META.
//   §1 compares src/lib/templates.js against docs/TEMPLATES.md §2. Both are ours.
//   A green means the registry and the document agree; it does NOT mean either
//   agrees with what Meta actually holds. F-41.63 is the proof: BOTH sides were
//   internally consistent for a day, and the send still arrived garbled, because
//   the registry and the document had drifted from the WABA together. Only the
//   founder's WhatsApp Manager is the witness. This bench catches the SECOND
//   drift, never the first.
//
// ── WHY IT EXISTS (F-41.63) ───────────────────────────────────────────────────
// `tdw_assist_lead_outside` carried a registry body and slot order that were not
// Meta's. Meta substitutes POSITIONALLY, so {{3}} rendered the city where the
// month belonged and A10's live send to the founder's handset arrived garbled.
//
// ── WHY "TOKENS AGAINST THE INDEX" WOULD HAVE BEEN GREEN (seat B's correction) ─
// Both bodies were {{1}}..{{5}}, sequential, length 5. A cell that checked the
// token sequence and the array length would have PASSED the defect. What carried
// the meaning was the LITERAL TEXT BETWEEN the tokens. §1(c) is that assertion.
//
// ── §1 · THE DOCUMENT SIDE (seat B's spec, rules 1-5) ─────────────────────────
// Per `tdw_*` entry: the registry `body` (its `+` parts concatenated) and
// `variables`; the §2 entry whose HEADING carries the same Meta name, and that
// entry's single blockquote line. Normalise both ONLY by: strip a leading '> ',
// collapse whitespace runs to one space, trim. No case folding, no punctuation
// stripping, no entity decoding. Split each on /\{\{\d+\}\}/ KEEPING delimiters.
// Assert, in order: (a) token subsequences identical and 1..N with no gap or
// repeat; (b) variables.length === N; (c) the LITERAL subsequences identical,
// element for element. (c) is the assertion that catches F-41.63.
//
// ── THE NAMED PARTITIONS (R-41.97 as ruled, both directions) ──────────────────
// Rule 5 says a registry entry with no §2 row FAILS, never skips. Derived at the
// cut: 31 registry `tdw_*` entries, 10 with a §2 heading, 21 without. A cell that
// simply failed on all 21 could never be green, so the ruling is a PARTITION:
// every entry is either COMPARED slot-for-slot, or named on an explicit list —
// and the LIST ITSELF is asserted. A name that gains a §2 row while still on the
// list REDS. A name that leaves the list without a §2 row REDS. Nothing is
// silently uncompared; the uncompared set is an assertion, not a gap.
// The same discipline runs the other way (§3): a §2 heading with no registry
// entry is on NOT_YET_REGISTERED or it REDS. `assist_found_vendor` and
// `assist_found_outside` sit there now and LEAVE IT in D2/D3 when seat D
// registers them — which is the moment the slot comparison switches on for the
// two templates F-41.63 proved load-bearing.
//
// ── §2 · THE WIRE SIDE (Q3, the chair's addition) ─────────────────────────────
// §1 compares two documents. Neither knows what the SEND ARM actually passes.
// F-41.63's live defect was `forwardToProspect`'s `vars` ARRAY ORDER, and §1
// would not have caught it: `variables` names are compared to nothing, so a
// permuted array with an untouched body is invisible to §1 (seat B's rule 6).
//
// ⚠ COMMENT-BLINDNESS, EARNED IN THIS FILE. The first cut of §2 bound the
// registry's `variables` to the trailing `// {{n}} <name>` annotations on the
// `vars` elements. Its own mutation M3 walked straight through it: swap two
// expressions, carry their annotations along, and the cell stayed green while
// the wire was garbled. A cell that reads a COMMENT asserts a comment — the
// exact class this rider struck from b20_a2:405 under c-41.39. §2 now STRIPS
// line comments first and binds the EXPRESSION.
//
// ⚠ D2b: THE SEND SITE NOW PASSES AN OBJECT, AND THE CELL IS STRONGER FOR IT.
// F-41.123 forced `vars` from a positional array to a keyed object, because the
// builder reads a url button's suffix BY NAME and cannot read it from a list. §2
// used to infer the binding from ORDER — expression i against variables[i]. It now
// reads the KEY the call site itself writes, which removes the inference entirely:
// a mis-keyed value is wrong on its face rather than wrong by position. The old
// order-based form could not have caught a swap that also swapped the annotations
// (its own M3 tuition); this form has no annotations to be fooled by.
//
// The binding rule, derived and not transcribed: fold the registry variable name
// and the expression to lowercase alphanumerics, and require the expression to
// contain the folded name. `month_year` → `monthyear` ⊂ `monthYearOnly(...)`;
// `city` ⊂ `request.city`; `category_noun` → `categorynoun` ⊂ `categoryNoun(...)`;
// `budget_rs` → `budgetrs` ⊂ `formatRs(item.budget_rs || 0)`; `name` ⊂
// `prospect.name`. No per-site expected list, so there is no second home for the
// order — the registry remains the only one.
//
// ── §3 · LITERAL + VALUE COMPOSE (F-41.80, added after the defect it missed) ──
// §1 compares literals between two documents. §2 binds array order. NEITHER
// COMPOSES A LITERAL WITH THE VALUE THAT FOLLOWS IT, and F-41.80 lived in exactly
// that gap: Meta's body reads "...to find them a {{4}}" and the send arm passed
// "a makeup artist", so every outsider join alert rendered "find them a a makeup
// artist" while this bench was green. The body was right, the array order was
// right, and the message was wrong.
// §3 renders each body with the arm's own value functions and asserts no doubled
// article survives. It is still not Meta — but it is the first cell here that
// reads what a HUMAN would read rather than what a document says.
//
// ── THE RESIDUE, STATED PRECISELY (rule 6) ────────────────────────────────────
// Permute the registry `variables` AND permute the send arm's expressions to
// match, leaving both bodies untouched. The two mutations CANCEL: §1 is green
// because no literal moved, §2 is green because each expression still sits at
// the index its variable names. Every source inside the estate agrees. Meta does
// not — {{2}} now carries the city into a body that reads "a {{2}} wedding".
// NOTHING IN THIS FILE CAN SEE THAT. It is THE MANAGER'S TO WITNESS, not a
// cell's, and no cell here claims it. b64_mutations M6 asserts it SURVIVES, so
// this paragraph is proven rather than promised.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = (...a) => path.join(ROOT, ...a);

let pass = 0, fail = 0;
const fails = [];
function ok(label, cond) {
  const good = cond === true;
  if (good) pass++; else { fail++; fails.push(label); }
  console.log(`  ${good ? 'ok  ' : 'FAIL'}  ${label}`);
}
function section(t) { console.log(`\n── ${t}`); }

// ── the two sources ───────────────────────────────────────────────────────────
const REG_PATH = P('src/lib/templates.js');
const MD_PATH  = P('docs/TEMPLATES.md');
const registry = require(REG_PATH);
const REG = registry.TEMPLATES || registry.templates || registry;
const md = fs.readFileSync(MD_PATH, 'utf8');

// ── normalise: EXACTLY seat B's rule 2, and nothing more ──────────────────────
function norm(t) {
  return String(t == null ? '' : t).replace(/^>\s?/, '').replace(/\s+/g, ' ').trim();
}
// rule 3 — split keeping delimiters
function split(body) {
  const parts = norm(body).split(/(\{\{\d+\}\}) /.source ? /(\{\{\d+\}\})/ : /(\{\{\d+\}\})/);
  const tokens = [], literals = [];
  for (const p of parts) (/^\{\{\d+\}\}$/.test(p) ? tokens : literals).push(p);
  return { tokens, literals };
}

// ── §2 index, keyed on the Meta name IN THE HEADING (rule 1) ─────────────────
const S2 = (() => {
  const start = md.indexOf('## 2.');
  const end = md.indexOf('## 3.');
  const body = md.slice(start, end);
  const out = {};
  for (const chunk of body.split(/\n### /).slice(1)) {
    const heading = chunk.split('\n')[0];
    const m = heading.match(/(tdw_[a-z0-9_]+)/);
    if (!m) continue;
    const quotes = chunk.split('\n').filter(l => /^> /.test(l));
    out[m[1]] = { quotes, heading };
  }
  return out;
})();

const regKeys = Object.keys(REG).filter(k => REG[k] && REG[k].name && /^tdw_/.test(REG[k].name));

// ── THE NAMED PARTITIONS ─────────────────────────────────────────────────────
// Derived at the cut by command; NOT carried from memory. Each name here has no
// §2 prose entry BY §8's standing decision ("restating registry bodies in longer
// form would be volume, not coverage"), not by oversight.
const NO_S2_WITNESS = [
  'tdw_admin_assist_request', 'tdw_capability_armed', 'tdw_circle_join_otp',
  'tdw_contract_copy', 'tdw_contract_sign', 'tdw_contract_sign_otp',
  'tdw_couple_login_otp', 'tdw_couple_reset_otp', 'tdw_enquiry_alert_vendor',
  'tdw_enquiry_brief_vendor', 'tdw_enquiry_reply_couple', 'tdw_enquiry_update_couple',
  'tdw_lead_alert_basic', 'tdw_lead_alert_utility', 'tdw_payment_reminder',
  'tdw_review_request', 'tdw_vendor_login_otp', 'tdw_vendor_reset_otp',
  'tdw_vendor_welcome', 'tdw_wedding_consent', 'tdw_wedding_credit',
];
// §2 entries with no registry entry. These LEAVE this list when a seat registers
// them; `assist_found_*` are seat D's in D2/D3 and that is when §1 starts
// comparing them.
// D2 moved TWO NAMES OFF THIS LIST IN ONE CUT, and that is the partition working
// exactly as ruled: registering an entry reds §4.q until its name leaves here, and
// §1 starts comparing it the same instant. `assist_found_vendor` and
// `assist_found_outside` are now registered (R-41.4(b)/(c)) and are compared.
// The v1 name `tdw_assist_lead_outside` is a THIRD case and a new one: it has a §2
// heading (row 10, kept as the v1 record) and no registry entry, because R-41.118
// renamed the entry to v2. It is not "not yet registered" — it is RETIRED, and the
// two states are not the same claim. A retired name that quietly reappeared in the
// registry should red, so it is named here with its reason rather than deleted from
// the bench's sight.
const NOT_YET_REGISTERED = [
  'tdw_assist_lead_outside',   // RETIRED by R-41.118 — row 10 is the v1 record; the entry is now v2
  'tdw_introduction',
  'tdw_referral_invite',
];

console.log('b64 · template slot tripwire (R-41.97) — TWO INTERNAL DOCUMENTS, NEITHER IS META');

// ═══ §1 · THE DOCUMENT SIDE ═══════════════════════════════════════════════════
section('1. registry body and slot order against docs/TEMPLATES.md §2');

const compared = [];
for (const k of regKeys) {
  const name = REG[k].name;
  const hit = S2[name];
  if (!hit) {
    // rule 5: never a silent skip. Either it is on the named list, or it FAILS.
    ok(`1.p ${name} has no §2 entry and is named on NO_S2_WITNESS`, NO_S2_WITNESS.includes(name));
    continue;
  }
  ok(`1.q ${name} has a §2 entry and is NOT on NO_S2_WITNESS`, !NO_S2_WITNESS.includes(name));
  ok(`1.r ${name}'s §2 entry carries exactly one blockquote line`, hit.quotes.length === 1);
  if (hit.quotes.length !== 1) continue;

  const reg = split(REG[k].body);
  const doc = split(hit.quotes[0]);
  compared.push(name);

  // (a) token subsequences identical, and 1..N with no gap or repeat
  const nums = reg.tokens.map(t => Number(t.slice(2, -2)));
  const sequential = nums.every((n, i) => n === i + 1);
  ok(`1.a ${name} · token subsequences identical, and 1..N with no gap or repeat`,
     JSON.stringify(reg.tokens) === JSON.stringify(doc.tokens) && sequential && nums.length > 0);

  // (b) variables.length === N
  ok(`1.b ${name} · variables.length matches the token count`,
     Array.isArray(REG[k].variables) && REG[k].variables.length === reg.tokens.length);

  // (c) THE ASSERTION THAT CATCHES F-41.63
  ok(`1.c ${name} · literal subsequences identical, element for element`,
     JSON.stringify(reg.literals) === JSON.stringify(doc.literals));
}

section('2. the wire side — each send site\'s vars order bound to its variables');

// The one send site in this seat's radius. A site is (file, templateKey, the
// `vars` array literal). The binding is the trailing `// {{n}} <name>` annotation
// on each element: it names which registry `variables` entry that slot carries.
// ⚠ EACH SITE NAMES ITS FUNCTION. The first cut searched the whole file for
// `const vars = {` and matched `notifyFounder`'s object — an earlier one — so it
// asserted the wrong send site while looking green on two of five cells. A
// first-match anchor in a file with more than one send is not an anchor.
// The second site is the one that mistake surfaced: notifyFounder was never
// covered, and it is a live send with five declared variables.
const WIRE_SITES = [
  { file: 'src/lib/couple/assistance.js', fn: 'async function forwardToProspect', key: 'assist_lead_outside',    reg: 'assist_lead_outside' },
  { file: 'src/lib/couple/assistance.js', fn: 'async function notifyFounder',     key: 'admin_assist_request',   reg: 'admin_assist_request' },
];
const fold = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
for (const site of WIRE_SITES) {
  const whole = fs.readFileSync(P(site.file), 'utf8');
  const at = whole.indexOf(site.fn);
  // A cell that cannot see its subject must FAIL, never silently read another's.
  ok(`2.0 ${site.key} · the send site \`${site.fn}\` is where this cell says it is`, at !== -1);
  const src = at === -1 ? '' : whole.slice(at);
  const block = (src.match(/const vars = \{([\s\S]*?)\n  \};/) || [])[1] || '';
  // COMMENT-BLIND (R-40.105, and this file's own M3 tuition): strip every line
  // comment BEFORE reading a single pair. The annotations are for a human.
  const pairs = block.split('\n')
    .map(l => l.replace(/\/\/.*$/, '').trim().replace(/,$/, ''))
    .filter(l => l.length > 0)
    .map(l => { const i = l.indexOf(':'); return { key: l.slice(0, i).trim(), expr: l.slice(i + 1).trim() }; })
    .filter(p => p.key && p.expr);
  const vars = REG[site.reg].variables;
  const btn  = REG[site.reg].button;
  const bodyPairs = pairs.filter(p => vars.includes(p.key));

  ok(`2.a ${site.key} · every registry variable has a pair at the send site, by NAME`,
     vars.every(v => pairs.some(p => p.key === v)) && bodyPairs.length === vars.length);
  ok(`2.b ${site.key} · no expression is empty once comments are stripped`,
     pairs.length > 0 && pairs.every(p => p.expr.length > 0));
  // THE BINDING, ON THE EXPRESSION AND NEVER ON A COMMENT — now keyed, not ordered.
  // ── THE CONTAINMENT RULE IS A HEURISTIC, SO ITS MISSES ARE NAMED ──────────
  // `date_words: monthDayYear(request.wedding_date)` is correct and the fold cannot
  // see it — the key and the function share no letters. Narrowing the cell to the
  // sites where the rule happens to hold would be the vacuity this file has already
  // been caught at twice. Instead the rule PARTITIONS, exactly as §1 and §4 do:
  // every pair is either self-evident by containment, or named here with the reading
  // that justifies it. A pair that stops being self-evident and is not named REDS;
  // a name here that becomes self-evident also REDS, so the list cannot rot.
  const READ_BY_HAND = {
    'admin_assist_request.date_words':  'monthDayYear(request.wedding_date) — the wedding date in words; the fold shares no letters with the key',
    'admin_assist_request.couple_name': "request.name — the couple's own name; `couple_name` and `name` fold apart",
  };
  const unbound = bodyPairs.filter(p => !fold(p.expr).includes(fold(p.key)));
  ok(`2.c ${site.key} · each value's expression matches the variable it is keyed to, or is named by hand`,
     unbound.every(p => READ_BY_HAND[`${site.key}.${p.key}`]));
  ok(`2.f ${site.key} · nothing named by hand has since become self-evident (the list cannot rot)`,
     Object.keys(READ_BY_HAND)
       .filter(n => n.startsWith(`${site.key}.`))
       .every(n => bodyPairs.some(p => p.key === n.split('.').pop() && !fold(p.expr).includes(fold(p.key)))));
  // ── F-41.123 · THE BUTTON'S SUFFIX IS SUPPLIED, AND IT IS NOT A BODY SLOT ──
  if (btn && btn.type === 'url') {
    const bp = pairs.find(p => p.key === btn.variable);
    ok(`2.d ${site.key} · the url button's suffix (${btn.variable}) is supplied at the send site`, !!bp);
    ok(`2.e ${site.key} · the suffix is NOT one of the body's declared variables`,
       !vars.includes(btn.variable));
  }
}

section('3. literal + value compose — no doubled article reaches a handset (F-41.80)');

// Render each comparable body with the arm's OWN value functions, over every
// canonical category, and read the result the way a person would. The check is
// deliberately blunt: a doubled article is the failure that shipped, and a blunt
// cell that catches the real defect beats a clever one that admires it.
const A = require(P('src/lib/couple/assistance.js'));
const { VENDOR_CATEGORIES } = require(P('src/agent/categories.js'));
const DOUBLED = /\b(a|an|the)\s+(a|an|the)\b/i;

// ⚠ THE SLOT IS FOUND BY SHAPE, NOT BY ITS CURRENT NAME. The first cut of §3 did
// `vars.indexOf('category_noun')` — the name this rider introduced — so at the
// UNCURED tree, where the variable is still `category_words`, the slot was -1 and
// THE WHOLE SECTION SKIPPED. It would have been green on the defect it exists for:
// vacuous, not passing. Matching /categor/ finds the trade slot under either name
// and under whatever the next seat calls it.
const tradeSlot = (vars) => vars.findIndex(v => /categor/i.test(String(v)));
// The arm's value function, under either name. A cell that cannot see its subject
// must FAIL, never throw (seat A's close note §6, and its own four specimens).
const nounFn = A.categoryNoun || A.categoryWords || null;
ok('3.0 the arm exposes a category value function this cell can drive', typeof nounFn === 'function');

for (const k of regKeys) {
  const name = REG[k].name;
  if (!S2[name] || !Array.isArray(REG[k].variables)) continue;
  const vars = REG[k].variables;
  const slot = tradeSlot(vars);
  if (slot === -1) continue;          // only the bodies that carry a trade
  let worst = null;
  for (const cat of VENDOR_CATEGORIES) {
    const filled = norm(REG[k].body).replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const v = vars[Number(n) - 1];
      return (Number(n) - 1) === slot ? String(nounFn ? nounFn(cat) : '') : `\u2039${v}\u203a`;
    });
    if (DOUBLED.test(filled)) { worst = { cat, filled }; break; }
  }
  ok(`3.a ${name} \u00b7 no doubled article for any of the ${VENDOR_CATEGORIES.length} categories`
     + (worst ? ` \u2014 ${worst.cat}: "${worst.filled.match(DOUBLED)[0]}"` : ''), worst === null);
  // The article lives in the BODY, so the value must be a bare noun. Asserted
  // directly, so the day someone re-adds one to the map this reds by name.
  const leading = nounFn ? VENDOR_CATEGORIES.filter(c => /^(a|an|the)\s/i.test(String(nounFn(c)))) : ['(no value function)'];
  ok(`3.b ${name} \u00b7 every category value is a bare noun, no leading article`
     + (leading.length ? ` \u2014 ${leading.join(', ')}` : ''), leading.length === 0);
}

section('4. the other direction — a §2 heading with no registry entry');

const regNames = new Set(regKeys.map(k => REG[k].name));
for (const name of Object.keys(S2)) {
  if (regNames.has(name)) continue;
  ok(`4.p ${name} has a §2 entry, no registry entry, and is named on NOT_YET_REGISTERED`,
     NOT_YET_REGISTERED.includes(name));
}
// The partition's other edge: a name on the list that HAS been registered must leave it.
for (const name of NOT_YET_REGISTERED) {
  ok(`4.q ${name} is on NOT_YET_REGISTERED and is still unregistered`, !regNames.has(name));
}
for (const name of NO_S2_WITNESS) {
  ok(`4.r ${name} is on NO_S2_WITNESS and still has no §2 entry`, !S2[name]);
}

section('5. the partition is total — nothing is silently uncompared');
ok(`5.1 every registry tdw_ entry is either compared or named (compared ${compared.length} + named ${NO_S2_WITNESS.length} = ${regKeys.length})`,
   compared.length + NO_S2_WITNESS.length === regKeys.length);
ok('5.2 the two named lists do not overlap',
   !NO_S2_WITNESS.some(n => NOT_YET_REGISTERED.includes(n)));
// D2: the outsider alert is v2 now (R-41.118). This cell names the LIVE outsider
// alert, whatever its version — its point is that the send arm's own template is
// never allowed to sit on a named list unexamined. Naming v2 explicitly (rather
// than matching a prefix) keeps that: when v3 arrives, this cell reds and forces
// the reading, which a `startsWith` would have let slide.
ok('5.3 the live outsider alert (v2) is in the COMPARED set, not on a named list',
   compared.includes('tdw_assist_lead_outside_v2'));
ok('5.4 both bride arms are COMPARED now that they are registered (R-41.4(b)/(c))',
   compared.includes('tdw_assist_found_vendor') && compared.includes('tdw_assist_found_outside'));
ok('5.5 the retired v1 name has no registry entry and is named as retired',
   !regKeys.some(k => REG[k].name === 'tdw_assist_lead_outside')
   && NOT_YET_REGISTERED.includes('tdw_assist_lead_outside'));

console.log(`\n${fail === 0 ? 'GREEN' : 'RED'} — b64_template_slots_bench ${pass}/${pass + fail}`);
if (fail) { console.log('FAILED: ' + fails.join(' · ')); process.exit(1); }
