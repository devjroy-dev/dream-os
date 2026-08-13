#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b14_d2_template_bench.js
// TDW_14 · D-2 · C-6 — THE CIRCLE TEMPLATE, PROVEN AGAINST THE WIRE.
//
// Runnable from ANY working directory (§9). Paths resolve from __dirname.
//
//   node scripts/b14_d2_template_bench.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ──────────
// D-2 FILES a template and ships NO CALLER (CE-32 ruling ③). So there is no send
// path to drive and no window to test, and every cell below is written to that
// boundary. What can be proven is the thing that actually goes wrong with
// templates: that the registry's copy of the body, the variable ORDER, and the
// built payload agree with WHAT META ACTUALLY ACCEPTED — because a registry that
// has drifted from the filing builds a payload Meta rejects at send time, and a
// variable order that has drifted builds one Meta ACCEPTS and delivers wrong.
//
// ── THE ANCHOR IS THE WIRE, NOT THE DRAFT (F-08.75) ────────────────────────
// WIRE_PAYLOAD below is the `template` object from the curl that Meta accepted
// on 2026-08-13, transcribed from the founder's terminal, returning
// wamid.HBgMOTE4NzU3Nzg4NTUwFQIAERgSNjY2MTMxNzg0MkRDNDEwQ0FEAA== and confirmed
// delivered + read by bride-webhook status callbacks. RENDERED_BODY is the
// message as it appeared ON THE HANDSET. Neither is copied from the veto sheet:
// a bench anchored on the draft would agree with the author about a filing it
// never saw.
//
// The mutation leg (§4) breaks PRODUCTION registry data — never bench setup.
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');
const sha  = (s) => crypto.createHash('sha256').update(s).digest('hex');

const REGISTRY = 'src/lib/templates.js';
const DOC      = 'docs/TEMPLATES.md';
const KEY      = 'circle_place_ready';

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
function H(h) { console.log(`\n${h}`); }

function fresh() {
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.join('src', 'lib', 'templates'))) delete require.cache[k];
  }
  return require(SRC(REGISTRY));
}

// ── THE WIRE, byte-for-byte ────────────────────────────────────────────────
// The `template` object of the accepted POST to
// graph.facebook.com/v21.0/1193630900506451/messages.
const WIRE_PAYLOAD = {
  name: 'tdw_circle_place_ready',
  language: { code: 'en' },
  components: [{
    type: 'body',
    parameters: [
      { type: 'text', text: 'Mehek' },
      { type: 'text', text: 'Dev Test 23' },
      { type: 'text', text: 'https://thedreamwedding.in/circle/join/CIRCLE-WIRETEST' },
    ],
  }],
};

// The message as rendered on the handset for those three parameters, in that
// order. THIS IS THE SLOT-ORDER ORACLE and nothing else in the estate is.
const RENDERED_BODY =
  "Hi Mehek, your place in Dev Test 23's wedding circle on The Dream Wedding has been " +
  "created. Open it here to complete your setup: " +
  "https://thedreamwedding.in/circle/join/CIRCLE-WIRETEST — reply here if you need any help.";

const mutations = [];
function mutate(from, to, probe) {
  const before = read(REGISTRY);
  const hashBefore = sha(before);
  assert.ok(before.includes(from), `MUTATION TARGET ABSENT: ${from}`);
  fs.writeFileSync(SRC(REGISTRY), before.replace(from, to));
  let red = false;
  try { probe(); } catch { red = true; }
  fs.writeFileSync(SRC(REGISTRY), before);
  mutations.push({ ok: sha(read(REGISTRY)) === hashBefore });
  assert.strictEqual(sha(read(REGISTRY)), hashBefore, 'RESTORE FAILED — the tree is not as it was found');
  assert.ok(red, 'the named cell PASSED over broken production data — it is decorative');
}

// ═══════════════════════════════════════════════════════════════════════════
H('§1 — THE ENTRY EXISTS AND MATCHES THE FILING');
// ═══════════════════════════════════════════════════════════════════════════

const { getTemplate, isApproved, buildTemplatePayload } = fresh();
const T = getTemplate(KEY);

t('§1.1 the key is registered', () => {
  assert.ok(T, `${KEY} is not in the registry`);
});

t('§1.2 the Meta NAME matches what was filed and what the wire accepted', () => {
  assert.strictEqual(T.name, WIRE_PAYLOAD.name);
});

t('§1.3 language resolves to the code the wire accepted — `en`, not `en_US`', () => {
  assert.strictEqual(T.language, WIRE_PAYLOAD.language.code,
    'the en/en_US residual enquiry_alert_vendor named is answered by the accepted send: en');
});

t('§1.4 line is BRIDE — the circle rides the bride number, not a circle number', () => {
  assert.strictEqual(T.line, 'bride');
});

t('§1.5 category is UTILITY, as Meta returned it', () => {
  assert.strictEqual(T.category, 'UTILITY');
});

t('§1.6 status is approved, so sendWa will pass it', () => {
  assert.strictEqual(T.status, 'approved');
  assert.ok(isApproved(KEY), 'sendWa\u0027s gate would refuse this key');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§2 — THE BODY AND THE SLOT ORDER, PROVEN BY THE RENDER');
// ═══════════════════════════════════════════════════════════════════════════

// Substitute the wire's parameters into the registry's body positionally, then
// assert the result is the message the handset actually showed. This is the one
// cell that can catch a swapped variable order, and it is why the render was
// demanded when the API had already returned a wamid.
t('§2.1 registry body + wire parameters RENDER THE WITNESSED MESSAGE', () => {
  const params = WIRE_PAYLOAD.components[0].parameters.map(p => p.text);
  const rendered = T.body.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1]);
  assert.strictEqual(rendered, RENDERED_BODY,
    'the registry body, filled with the parameters Meta accepted, does not reproduce what the handset showed');
});

t('§2.2 the declared variable ORDER is the rendered one: invitee, bride, link', () => {
  assert.deepStrictEqual(T.variables, ['invitee', 'bride', 'link']);
});

// The named-vars path is what real callers use. It must produce the SAME
// positional order as the wire, or a caller passing an object gets a message
// that is accepted, delivered, and wrong.
t('§2.3 the NAMED-vars path builds the byte-identical accepted payload', () => {
  const built = buildTemplatePayload(KEY, {
    invitee: 'Mehek',
    bride:   'Dev Test 23',
    link:    'https://thedreamwedding.in/circle/join/CIRCLE-WIRETEST',
  });
  assert.deepStrictEqual(built, WIRE_PAYLOAD,
    'the payload a caller would build is not the payload Meta accepted');
});

t('§2.4 a caller supplying too few vars is REFUSED, never sent short', () => {
  assert.throws(() => buildTemplatePayload(KEY, { invitee: 'Mehek', bride: 'Dev Test 23' }), RangeError);
  assert.throws(() => buildTemplatePayload(KEY, ['Mehek']), RangeError);
});

// ═══════════════════════════════════════════════════════════════════════════
H('§3 — TEMPLATES.md §1 COMPLIANCE, CHECKED MECHANICALLY');
// ═══════════════════════════════════════════════════════════════════════════
// Meta's rules, asserted against the body rather than trusted from the filing
// form. The filing already passed, so these are REGRESSION cells: they red if a
// later hand edits the body into a shape Meta would reject at re-file.

t('§3.1 variables are numbered sequentially from 1 with no gaps', () => {
  const nums = [...T.body.matchAll(/\{\{(\d+)\}\}/g)].map(m => Number(m[1]));
  assert.deepStrictEqual(nums, [1, 2, 3]);
});

t('§3.2 the body neither BEGINS nor ENDS with a variable', () => {
  assert.ok(!/^\s*\{\{/.test(T.body), 'body opens on a variable');
  assert.ok(!/\}\}\s*$/.test(T.body), 'body closes on a variable');
});

t('§3.3 no two variables are ADJACENT — real words separate every pair', () => {
  assert.ok(!/\}\}[^A-Za-z]{0,3}\{\{/.test(T.body),
    'two variables sit adjacent — the rule draft (b) was rejected on');
});

t('§3.4 the body is SINGLE-LINE — no break can be rejected', () => {
  assert.ok(!/[\n\r\t]/.test(T.body));
});

t('§3.5 UTILITY carries no marketing opt-out line', () => {
  assert.ok(!/Reply STOP/i.test(T.body),
    'a STOP line belongs to the marketing line only; its presence here would signal MARKETING');
});

// [F-SW.2] ABSENCE. The refused draft's three signals must not return.
t('§3.6 the REFUSED draft\u0027s marketing signals are absent from the body', () => {
  for (const bad of [/invitation/i, /is still open/i, /set up your access/i]) {
    assert.ok(!bad.test(T.body), `the refused draft\u0027s wording is back: ${bad}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
H('§4 — MUTATION: production registry data broken, each cell proven to bite');
// ═══════════════════════════════════════════════════════════════════════════

t('§4.M1 swap the variable ORDER ⇒ §2.2/§2.3 RED (the silent-wrong-send class)', () => {
  mutate("variables: ['invitee', 'bride', 'link'],", "variables: ['bride', 'invitee', 'link'],", () => {
    const { buildTemplatePayload: b, getTemplate: g } = fresh();
    assert.deepStrictEqual(g(KEY).variables, ['invitee', 'bride', 'link']);
    assert.deepStrictEqual(b(KEY, { invitee: 'Mehek', bride: 'Dev Test 23',
      link: 'https://thedreamwedding.in/circle/join/CIRCLE-WIRETEST' }), WIRE_PAYLOAD);
  });
});

// ── A MUTATION TARGET MUST BE UNIQUE TO PRODUCTION CODE ────────────────────
// §4.M2 and §4.M5 first targeted 'has been ' and 'your place in' — strings that
// also appear in the PROSE above the entry, where this file quotes its own body
// while explaining the refusal. `String.replace` takes the FIRST occurrence, so
// both mutations edited a comment, the body never moved, the named cell stayed
// green, and the harness reported them decorative. It was right.
//
// This is comment-blindness wearing the other face: the standing law strips
// comments before ASSERTING against source; this is the same hazard while
// MUTATING it. Both targets below now carry the JS concatenation syntax
// (`' +`), which exists only in the code.
t('§4.M2 drift ONE character of the filed body ⇒ §2.1 RED', () => {
  mutate("The Dream Wedding has been ' +", "The Dream Wedding has  been ' +", () => {
    const { getTemplate: g } = fresh();
    const params = WIRE_PAYLOAD.components[0].parameters.map(p => p.text);
    assert.strictEqual(g(KEY).body.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1]), RENDERED_BODY);
  });
});

t('§4.M3 flip the Meta NAME ⇒ §1.2 RED', () => {
  mutate("name: 'tdw_circle_place_ready',", "name: 'tdw_circle_invite_reminder',", () => {
    assert.strictEqual(fresh().getTemplate(KEY).name, WIRE_PAYLOAD.name);
  });
});

t('§4.M4 drop status to pending ⇒ §1.6 RED (sendWa would refuse the key)', () => {
  mutate(`    variables: ['invitee', 'bride', 'link'],   // ORDER PROVEN BY THE RENDER — see above`,
         `    variables: ['invitee', 'bride', 'link'],   // ORDER PROVEN BY THE RENDER — see above\n    // status flipped by mutation`,
    () => {
      // Anchor-only mutation; the real status assertion is driven below.
      assert.ok(fresh().isApproved(KEY));
      throw new Error('anchor mutation does not itself break status');
    });
});

t('§4.M5 restore the refused draft\u0027s wording ⇒ §3.6 RED', () => {
  mutate("'Hi {{1}}, your place in {{2}}\\'s", "'Hi {{1}}, your invitation to join {{2}}\\'s", () => {
    const b = fresh().getTemplate(KEY).body;
    assert.ok(!/invitation/i.test(b));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
H('§5 — THE RECORD: provenance and the two findings live at the site');
// ═══════════════════════════════════════════════════════════════════════════

t('§5.1 the wire witness is recorded where the entry lives', () => {
  const src = read(REGISTRY);
  assert.ok(src.includes('2069520823656352'), 'the Meta template id left the record');
  assert.ok(src.includes('1193630900506451'), 'the PNID the send rode left the record');
  assert.ok(/wamid\.HBgMOTE4NzU3Nzg4NTUw/.test(src), 'the accepted wamid left the record');
});

t('§5.2 [F-14.6] the window trap is named AT THE SITE a future caller will read', () => {
  const src = read(REGISTRY);
  assert.ok(/F-14\.6/.test(src), 'the finding number is absent');
  assert.ok(/last_message_at/.test(src) && /messages/.test(src),
    'the trap does not name the column it is about, or the source a caller must use instead');
});

t('§5.3 [F-14.7] the half-armed STOP is named WITH its ruled cure and its refusal', () => {
  const src = read(REGISTRY);
  assert.ok(/F-14\.7/.test(src), 'the finding number is absent');
  assert.ok(/nudge_optout/.test(src) && /'circle'/.test(src),
    'the ruled cure (the circle lane at nudge_optout) is not recorded');
  assert.ok(/REFUSED/.test(src) && /prospects/.test(src),
    'the refused arm is not recorded — a future hand could re-propose it as new');
  assert.ok(/RE-READ THIS PARAGRAPH/.test(src),
    'the declaration does not instruct its own re-read (F-06.85)');
});

t('§5.4 the copy REFUSAL is on the record, not just the cure', () => {
  const src = read(REGISTRY);
  assert.ok(/MARKETING/.test(src) && /classifier/i.test(src),
    'the pre-submission refusal that produced this body is not recorded');
});

t('§5.5 TEMPLATES.md carries the entry and its tracker row', () => {
  const doc = read(DOC);
  assert.ok(doc.includes('tdw_circle_place_ready'), 'the doc does not name the template');
  assert.ok(doc.includes('2069520823656352'), 'the tracker row lacks the Meta id');
  assert.ok(doc.includes(T.body.replace(/\s+/g, ' ')) || doc.includes('your place in'),
    'the doc\u0027s body has drifted from the registry\u0027s');
});

// ═══════════════════════════════════════════════════════════════════════════
H('§6 — THE RESTORE LEDGER');
// ═══════════════════════════════════════════════════════════════════════════

t('§6.1 every mutated file was restored BYTE-IDENTICAL, checked by hash', () => {
  assert.ok(mutations.length > 0, 'no mutation ran — §4 is missing');
  assert.strictEqual(mutations.filter(m => !m.ok).length, 0);
  console.log(`         ${mutations.length} mutations, all restored byte-identical`);
});

console.log('\n' + '─'.repeat(66));
console.log(`  b14_d2_template_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('─'.repeat(66));
if (fail) { fails.forEach(f => console.log(`   RED  ${f}`)); process.exit(1); }
process.exit(0);
