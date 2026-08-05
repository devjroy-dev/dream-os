#!/usr/bin/env node
// scripts/b08_p5_oow_relay_bench.js — TDW_08 P5 RIDER: THE OUT-OF-WINDOW RELAY.
// F-08.85's cure (CE R-R1–R-R6, twenty-second chair, 2026-08-05).
//
// Runnable from ANY working directory (Q-SP-5). `--mutations` lists arms,
// `--mutate=NAME` drives one.
//
// ═══ WHAT THIS BENCH IS FOR ═════════════════════════════════════════════════
// F-08.85 was filed as "an out-of-window vendor silently never learns a lead
// arrived." It was worse: `sendWhatsApp` threw, nothing guarded the relay, the
// throw reached vendorInbound's function-level dead-letter, and THE BRIDE lost the
// rest of her turn and received a failure line for a turn that had worked.
// So the cells below assert TWO properties, and the second is the one that matters:
//   (1) a 131047 falls back to the approved template, flag-gated;
//   (2) NO failure of ANY class escapes the door — because the bride's turn
//       continuing is the actual cure.
//
// ═══ NO SPECULATION ABOUT UNWITNESSED PATHS (R-R5) ══════════════════════════
// Every error fixture here is shaped like `MetaSendError` — `.body.error.code` —
// because that is the SYNCHRONOUS send response, the only path anyone has
// witnessed. The webhook-status path is named in the door's comment and is the
// walk's first question. No cell here pretends to know which one production takes.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const DOOR_P  = 'src/lib/vendor/enquiryAlert.js';
const INBND_P = 'src/lib/vendorInbound.js';

const MUTATIONS = {
  window_code_wrong: [DOOR_P, (s) =>
    s.replace('const WINDOW_CLOSED_CODE = 131047;', 'const WINDOW_CLOSED_CODE = 131049;')],

  generic_errors_rethrow: [DOOR_P, (s) =>
    s.replace("      return { sent: false, path: null, reason: 'send_failed', code };",
              '      throw err;')],

  flag_default_open: [DOOR_P, (s) =>
    s.replace('    const enabled = await _readLaneFlag(supabase, OOW_FLAG_KEY);',
              '    const enabled = true;')],

  unknown_key_falls_back: [DOOR_P, (s) =>
    s.replace('    const entry = OOW_REGISTRY[key];',
              '    const entry = OOW_REGISTRY[key] || OOW_REGISTRY[DEFAULT_OOW_KEY];')],

  optout_sentinel_reaches_template: [DOOR_P, (s) =>
    s.replace('    if (res && res.blocked) {', '    if (false) {')],

  door_bypassed_at_a_site: [INBND_P, (s) =>
    s.replace('              await sendVendorEnquiryAlert({\n                toPhone: vendorUser.phone,',
              '              await sendWhatsApp(vendorUser.phone, \'\') || await sendVendorEnquiryAlert({\n                toPhone: vendorUser.phone,')],
};

const argv   = process.argv.slice(2);
const MUTATE = (argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1] || null;
if (argv.includes('--mutations')) { console.log(Object.keys(MUTATIONS).join('\n')); process.exit(0); }

const ORIGINALS = new Map();
if (MUTATE) {
  const m = MUTATIONS[MUTATE];
  if (!m) { console.error(`unknown mutation: ${MUTATE}`); process.exit(2); }
  const full = path.join(ROOT, m[0]);
  const before = fs.readFileSync(full, 'utf8');
  const after  = m[1](before);
  if (after === before) {
    console.error(`MUTATION ANCHOR STALE: "${MUTATE}" changed no byte of ${m[0]}. Re-derive it.`);
    process.exit(2);
  }
  ORIGINALS.set(full, before);
  fs.writeFileSync(full, after);
}
function restoreAll() { for (const [f, b] of ORIGINALS) fs.writeFileSync(f, b); }
process.on('exit', restoreAll);
process.on('SIGINT', () => { restoreAll(); process.exit(130); });

const door = require(path.join(ROOT, DOOR_P));
const { sendVendorEnquiryAlert, OOW_FLAG_KEY, OOW_DIAL_KEY, DEFAULT_OOW_KEY } = door;

// ── fixtures ────────────────────────────────────────────────────────────────
// Shaped exactly like metaCloud.js's MetaSendError: `.body` is Meta's parsed JSON.
function metaErr(code) {
  const e = new Error(`Meta send failed: code ${code}`);
  e.name = 'MetaSendError';
  e.body = { error: { message: 'x', code, error_data: { details: 'x' } } };
  return e;
}
const BASE = {
  toPhone: '+919888294440', text: 'New enquiry from +918595986978. Name: Priya. Lead saved.',
  vendorName: 'Swati', brideName: 'Priya', link: 'https://thedreamwedding.in/vendor/leads',
  ctx: 'bench',
};
// ⚠ THE CACHE RESET IS NOT OPTIONAL, and this bench learned it the hard way.
// `readLaneFlag` holds a 60-SECOND in-process cache (laneFlags.js:37). Without this
// reset, §2.1 (flag ON) warmed the cache and §2.2 (flag OFF) read ON out of it — the
// bench reported a template shipping on a closed lane that had not shipped. Same
// trap `b08_p5_eliza_bench` handles with `flags._resetLaneFlagCache()`. Recorded
// rather than quietly fixed: a stub that answers a question the code never asked is
// the F-08.65 class one layer in, and this was a stub answering from yesterday.
const { _resetLaneFlagCache } = require(path.join(ROOT, 'src/lib/laneFlags'));

function supa({ flag = null, dial = null } = {}) {
  _resetLaneFlagCache();
  const cfg = {};
  if (flag !== null) cfg[OOW_FLAG_KEY] = JSON.stringify(flag);
  if (dial !== null) cfg[OOW_DIAL_KEY] = JSON.stringify(dial);
  return { from: () => { const q = { _eq: {}, select: () => q, eq: (c, v) => { q._eq[c] = v; return q; },
    maybeSingle: async () => ({ data: cfg[q._eq.key] != null ? { value: cfg[q._eq.key] } : null }) }; return q; } };
}
function deps({ throws = null, blocked = null, templateThrows = null } = {}) {
  const seen = { text: 0, template: 0, templateArgs: null };
  return { seen, d: {
    sendWhatsApp: async () => { seen.text++; if (throws) throw throws; if (blocked) return { blocked, sent: false }; return { sid: 'w1', sent: true }; },
    sendWa: async (o) => { seen.template++; seen.templateArgs = o; if (templateThrows) throw templateThrows; return { ok: true }; },
    readLaneFlag: undefined,
  } };
}

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const H = (s) => console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 60 - s.length))}`);

(async () => {

H('§1 — THE HAPPY PATH IS UNCHANGED');

await t('§1.1 an open window still sends free-form, and never reaches a template', async () => {
  const { seen, d } = deps();
  const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
  assert.deepStrictEqual([v.sent, v.path], [true, 'text'], 'the plain send stopped working');
  assert.strictEqual(seen.template, 0, 'a template fired on a send that succeeded');
});

H('§2 — 131047: THE WINDOW, AND ONLY THE WINDOW');

await t('§2.1 flag ON + 131047 -> the approved template carries it', async () => {
  const { seen, d } = deps({ throws: metaErr(131047) });
  const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
  assert.deepStrictEqual([v.sent, v.path], [true, 'template'], 'the window fallback did not fire');
  assert.strictEqual(seen.templateArgs.templateKey, DEFAULT_OOW_KEY, 'the wrong template was chosen');
  assert.strictEqual(seen.templateArgs.line, 'vendor', 'the fallback left the vendor line');
  assert.deepStrictEqual(Object.keys(seen.templateArgs.vars).sort(), ['bride', 'link', 'name'],
    "the params do not match enquiry_alert_vendor's declared variables");
});

await t('§2.2 ⚑ PUSH IS NOT SPEAK — flag OFF sends NO template, and says so', async () => {
  const { seen, d } = deps({ throws: metaErr(131047) });
  const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: false }) }, d);
  assert.strictEqual(seen.template, 0, 'a template shipped on a lane the founder has not opened');
  assert.strictEqual(v.reason, 'window_closed_fallback_disabled', 'the miss was not named');
  assert.strictEqual(v.sent, false, 'a send was claimed that never happened');
});

await t('§2.3 the flag FAILS CLOSED — no row, junk value, and a dead database all read OFF', async () => {
  for (const [label, sb] of [
    ['no row',   supa({})],
    ['junk',     supa({ flag: 'yes' })],
    ['dead DB',  { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => { throw new Error('down'); } }) }) }) }],
  ]) {
    const { seen, d } = deps({ throws: metaErr(131047) });
    await sendVendorEnquiryAlert({ ...BASE, supabase: sb }, d);
    assert.strictEqual(seen.template, 0, `${label} opened the lane`);
  }
});

await t('§2.4 the OTHER codes never reach a template (131049 backs off, 131026 undeliverable)', async () => {
  for (const code of [131049, 131026, 470, 132001]) {
    const { seen, d } = deps({ throws: metaErr(code) });
    const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
    assert.strictEqual(seen.template, 0, `code ${code} was treated as a closed window`);
    assert.strictEqual(v.reason, 'send_failed', `code ${code} took the wrong branch`);
    assert.strictEqual(v.code, code, 'the code was not ledgered onto the verdict');
  }
});

await t('§2.5 a MALFORMED error body falls to the generic branch and never throws (R-R1)', async () => {
  for (const bad of [new Error('naked'), Object.assign(new Error('x'), { body: null }),
                     Object.assign(new Error('x'), { body: { error: null } })]) {
    const { seen, d } = deps({ throws: bad });
    const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
    assert.strictEqual(seen.template, 0, 'a shapeless error was read as a closed window');
    assert.strictEqual(v.sent, false, 'a send was claimed');
  }
});

H('§3 — ⚑ THE BRIDE\'S TURN SURVIVES EVERYTHING (R-R4, the real cure)');

await t('§3.1 NO error class escapes the door — not one of them throws', async () => {
  const fixtures = [metaErr(131047), metaErr(131049), metaErr(131026), new Error('naked'),
                    Object.assign(new Error('x'), { body: 'not-an-object' })];
  for (const f of fixtures) {
    for (const flag of [true, false]) {
      const { d } = deps({ throws: f });
      // The assertion IS that this line returns. A throw fails the cell.
      const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag }) }, d);
      assert.strictEqual(typeof v.sent, 'boolean', 'the door returned no verdict');
    }
  }
});

await t('§3.2 a FAILING TEMPLATE FALLBACK also returns — the last mile cannot abort a turn', async () => {
  const { d } = deps({ throws: metaErr(131047), templateThrows: metaErr(132001) });
  const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
  assert.deepStrictEqual([v.sent, v.reason], [false, 'template_failed'], 'the fallback failure was not named');
});

await t('§3.3 the relay call sites are no longer bare — nothing downstream can be skipped', () => {
  const src = read(INBND_P);
  const bare = (src.match(/await sendWhatsApp\(vendorUser\.phone/g) || []).length;
  assert.strictEqual(bare, 0,
    'a vendor notification still calls sendWhatsApp directly — that throw reaches the dead-letter and costs the bride her turn');
});

H('§4 — THE DIAL AND THE REGISTRY (fork 3)');

await t('§4.1 an UNKNOWN dial value = loud refusal, ZERO send — never a guessed template', async () => {
  const { seen, d } = deps({ throws: metaErr(131047) });
  const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true, dial: 'tdw_not_a_real_template' }) }, d);
  assert.strictEqual(seen.template, 0, 'an unknown key still sent something');
  assert.strictEqual(v.reason, 'unknown_template_key', 'the refusal was not named');
});

await t('§4.2 an absent dial row defaults to the approved template — the flag alone suffices', async () => {
  const { seen, d } = deps({ throws: metaErr(131047) });
  await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
  assert.strictEqual(seen.templateArgs.templateKey, DEFAULT_OOW_KEY, 'the default key is not the approved one');
});

await t('§4.3 ⚑ tdw_enquiry_brief_vendor IS ABSENT until the founder pastes the wire bytes', () => {
  assert.ok(!('tdw_enquiry_brief_vendor' in door.OOW_REGISTRY),
    'a mapper was authored from a draft rather than from the filed bytes — the name-vs-wire class (F-08.75)');
  const tpl = read('src/lib/templates.js');
  const idx = tpl.indexOf('tdw_enquiry_brief_vendor');
  assert.ok(idx === -1 || !/status: 'approved'/.test(tpl.slice(idx, idx + 400)),
    "a registry entry claims Meta's approval for a template whose wire bytes nobody has witnessed");
});

H('§5 — THE SEND DOOR\'S OWN REFUSALS ARE NOT WINDOW PROBLEMS');

await t('§5.1 an opted-out vendor is opted out of templates too', async () => {
  const { seen, d } = deps({ blocked: 'opted_out' });
  const v = await sendVendorEnquiryAlert({ ...BASE, supabase: supa({ flag: true }) }, d);
  assert.strictEqual(seen.template, 0, 'F-05.2 was routed around by the fallback');
  assert.strictEqual(v.reason, 'opted_out', 'the refusal reason was lost');
});

await t('§5.2 no phone -> no send, named, no throw', async () => {
  const { seen, d } = deps();
  const v = await sendVendorEnquiryAlert({ ...BASE, toPhone: null }, d);
  assert.deepStrictEqual([seen.text, v.reason], [0, 'no_phone'], 'a phoneless send was attempted');
});

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — one door, one window code, a template only behind the founder\'s flag,\n'
    + '        and no failure of any class can cost a bride the rest of her turn.');
}
process.exit(fail === 0 ? 0 : 1);

})();
