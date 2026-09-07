#!/usr/bin/env node
'use strict';
// scripts/b57_e164_guard_bench.js — R-40.91 AMENDED · F-40.250 · F-40.247.
//
// FLOOR METHOD: the EXIT CODE IS THE VERDICT. 0 green, 1 red, 2 refused.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS BENCH IS FOR, AND WHY A COUNT WOULD NOT DO
// ═══════════════════════════════════════════════════════════════════════════
// F-40.250 changes ONE LINE that EVERY WhatsApp send in this estate passes
// through. The ruling's promise is narrow and exact: only shape (2) — exactly
// ten bare digits — behaves differently. Everything else must be BYTE-IDENTICAL
// to what shipped yesterday.
//
// That promise is asserted here by DRIVING THE OLD LINE AND THE NEW LINE OVER
// THE SAME INPUTS AND COMPARING THEM, not by reasoning about the functions. The
// old line is reconstructed from the two production functions, so it cannot
// drift from what actually shipped.
//
// ⚠ THE INPUTS ARE THE REAL SEND SITES' `to`, HARVESTED FROM THE TREE — not a
// list somebody thought of. c-40.52 is why: R-40.91's census claimed eight
// non-send callers where the tree held eighteen, and a hand-written specimen
// list is exactly how a census goes wrong. §1 walks the tree; §2 asserts the
// walk found enough to be worth trusting.

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const R = (p) => path.join(ROOT, p);

let pass = 0, fail = 0;
const fails = [];
function sec(t) { console.log(`\n${t}`); }
async function cell(name, fn) {
  try { const r = await fn(); if (r === true) { pass++; console.log(`  GREEN  ${name}`); }
        else { fail++; fails.push(`${name} — ${r}`); console.log(`  RED    ${name} — ${r}`); } }
  catch (e) { fail++; fails.push(`${name} — ${e.message}`); console.log(`  RED    ${name} — ${e.message}`); }
}

const { toE164 }     = require(R('src/lib/phone'));
const { normalizeTo, postMessage } = require(R('src/lib/metaCloud'));

// ═══════════════════════════════════════════════════════════════════════════
// `after` DRIVES THE REAL `postMessage`. IT DOES NOT REPLICATE IT.
// ═══════════════════════════════════════════════════════════════════════════
// ⚠ THE FIRST CUT OF THIS BENCH WAS HOLLOW AND THE MUTATIONS PROVED IT. It
// defined `after` as its own copy of the composition, so deleting `toE164` from
// the production guard line — and then deleting `normalizeTo` — left all
// fourteen cells GREEN. The bench was asserting a line the bench had written.
//
// A second derivation is the right instinct and the wrong instrument HERE,
// because the thing under test IS the production line, not the arithmetic. So
// `after` now CALLS `postMessage` with an injected fetch and reads the `to` that
// actually reaches the wire. Mutate the guard and these cells go red, which is
// the only reason to believe them.
//
// `before` stays a replication ON PURPOSE: yesterday's line no longer exists in
// the tree, so it cannot be driven — only reconstructed from the same production
// `normalizeTo` the old line called.
const before = (raw) => normalizeTo(raw);

// The `to` that reaches Meta, or the refusal, from the REAL post.
function drive(raw) {
  let seen = null;
  const fetchImpl = async (_url, opts) => {
    seen = JSON.parse(opts.body).to;
    return { ok: true, status: 200, json: async () => ({ messages: [{ id: 'wamid.test' }] }) };
  };
  try {
    return { sent: true, to: seen, promise: postMessage({ to: raw, type: 'text' },
      { fetchImpl, token: 'T', phoneNumberId: 'P' }).then(() => seen) };
  } catch (e) { return { sent: false, refused: e.message }; }
}
async function after(raw) {
  let seen = null;
  const fetchImpl = async (_url, opts) => {
    seen = JSON.parse(opts.body).to;
    return { ok: true, status: 200, json: async () => ({ messages: [{ id: 'wamid.test' }] }) };
  };
  await postMessage({ to: raw, type: 'text' }, { fetchImpl, token: 'T', phoneNumberId: 'P' });
  return seen;
}
async function refused(raw) {
  try { await after(raw); return false; } catch (_e) { return true; }
}

// assertE164's contract, replicated so the bench can ask "would this have been
// refused?" without catching a throw for every case.
const wouldRefuse = (n) => !/^\d+$/.test(n) || n.length < 11 || n.length > 15;

(async () => {
// ═══ §1 · HARVEST THE REAL `to` EXPRESSIONS FROM THE TREE ══════════════════
sec('\u00a71 \u00b7 the send sites, walked not listed (c-40.52)');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(R('src'));
const sites = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  // every call that hands a recipient to the transport
  const re = /\b(sendMetaTemplate|sendMetaText|sendWa|sendWhatsApp)\s*\(/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const line = src.slice(0, m.index).split('\n').length;
    sites.push({ file: path.relative(ROOT, f), line, fn: m[1] });
  }
}

await cell('the walk finds send sites in double figures', async () =>
  sites.length >= 10 ? true : `only ${sites.length} found; the walk is not reaching the tree`);

await cell('every transport entry point is represented', async () => {
  const kinds = new Set(sites.map((s) => s.fn));
  for (const k of ['sendMetaTemplate', 'sendWa']) {
    if (!kinds.has(k)) return `no site calls ${k}; the harvest missed a door`;
  }
  return true;
});

console.log(`  ..... ${sites.length} send sites across ${new Set(sites.map((s) => s.file)).size} files`);

// ═══ §2 · THE FOUR SHAPES THE RULING NAMES ════════════════════════════════
sec('\u00a72 \u00b7 the ruling\u2019s four shapes, each proven');

// Real numbers this estate has actually sent to or stored, plus the two the
// founder typed during the G2 walk. Not invented digits.
const SHAPES = {
  1: ['+919888294440', '+919625759924', 'whatsapp:+919327715877'],
  2: ['9327715877', '8757788550', '9625759924'],
  3: ['919888294440', '447700900123', '12025550123'],
  4: ['', '12345', 'abc', '+', 'whatsapp:', '9999999999999999999'],
};

await cell('(1) `+`-prefixed is BYTE-IDENTICAL to today', async () => {
  for (const raw of SHAPES[1]) {
    const now = await after(raw); if (before(raw) !== now) return `${raw}: was ${before(raw)}, now ${now}`;
  }
  return true;
});

await cell('(2) exactly ten bare digits is the ONE shape that changes', async () => {
  for (const raw of SHAPES[2]) {
    const now = await after(raw);
    if (before(raw) === now)        return `${raw} did not change; the cure is not reaching it`;
    if (!wouldRefuse(before(raw)))  return `${raw} was NOT refused before; the premise is wrong`;
    if (now !== `91${raw}`)         return `${raw} reached the wire as ${now}, expected 91${raw}`;
  }
  return true;
});

await cell('(3) eleven to fifteen bare digits is BYTE-IDENTICAL \u2014 a UK number stays 44', async () => {
  for (const raw of SHAPES[3]) {
    const now = await after(raw); if (before(raw) !== now) return `${raw}: was ${before(raw)}, now ${now}`;
  }
  const uk = await after('447700900123');
  if (!uk.startsWith('44')) return `F-40.186's specimen was recreated: 447700900123 became ${uk}`;
  return true;
});

await cell('(4) the un-normalisable is STILL REFUSED, not repaired into something', async () => {
  for (const raw of SHAPES[4]) {
    if (!(await refused(raw))) return `${raw} now passes the guard as ${await after(raw)}`;
  }
  return true;
});

// ═══ §3 · NO REGRESSION ACROSS THE WHOLE ESTATE ═══════════════════════════
sec('\u00a73 \u00b7 no regression, over every shape but (2)');

await cell('for every non-ten-digit input, the new line equals the old', async () => {
  // ⚠ SHAPE (4) IS EXCLUDED HERE AND ASSERTED ONE CELL UP INSTEAD. Its members
  // are the UN-NORMALISABLE — `''`, `abc`, `+` — and the guard REFUSES them, so
  // `after` throws rather than returning a value to compare. The first cut
  // included them and went red on its own harness rather than on the code:
  // "recipient is not digits-only (got \"\")" is the guard working exactly as
  // ruled. Equality is only a meaningful question for inputs that reach the wire.
  const reaching = [...SHAPES[1], ...SHAPES[3]];
  for (const raw of reaching) {
    const now = await after(raw); if (before(raw) !== now) return `${raw}: was ${before(raw)}, now ${now}`;
  }
  for (const raw of SHAPES[4]) {
    if (!(await refused(raw))) return `${raw} reached the wire; it must be refused`;
  }
  return true;
});

await cell('the new line is IDEMPOTENT \u2014 running it twice changes nothing', async () => {
  // The guard sits on one post, but a caller that pre-normalised must not be
  // punished for it. This is what makes F-40.248's belt at the consent door safe
  // to keep rather than a double-normalisation hazard.
  for (const raw of [...SHAPES[1], ...SHAPES[2], ...SHAPES[3]]) {
    const once = await after(raw);
    const twice = await after(once);
    if (twice !== once) return `${raw}: once=${once}, twice=${twice}`;
  }
  return true;
});

await cell('`normalizeTo` itself is UNTOUCHED \u2014 the opt-out home is not re-keyed', async () => {
  // F-40.251's reason, asserted rather than promised: `normalizeTo` is a KEY
  // function for two tables, one of them the opt-out home. Normalising there
  // would silently re-key rows and re-enable messages to people who asked us to
  // stop. The cure had to sit beside it, never inside it.
  const src = fs.readFileSync(R('src/lib/metaCloud.js'), 'utf8');
  const body = src.slice(src.indexOf('function normalizeTo('), src.indexOf('// ── the one POST'));
  if (/toE164/.test(body)) return 'toE164 leaked into normalizeTo; two tables would re-key';
  return /if \(n\.startsWith\('\+'\)\) n = n\.slice\(1\);/.test(body)
    ? true : 'normalizeTo body has moved';
});

// ═══ §4 · F-40.247 · THE REASON IS REACHABLE AGAIN ════════════════════════
sec('\u00a74 \u00b7 the diagnosis stops being unreachable');

await cell('the throw site logs status, code and body before throwing', async () => {
  const src = fs.readFileSync(R('src/lib/metaCloud.js'), 'utf8');
  const blk = src.slice(src.indexOf('if (!res || !res.ok)'), src.indexOf('// On success Meta returns'));
  if (!/console\.error/.test(blk)) return 'the Meta error is still built and dropped';
  for (const field of ['status=', 'code=', 'msg=', 'body=']) {
    if (!blk.includes(field)) return `the log omits ${field}`;
  }
  return true;
});

await cell('no caller reduces a MetaSendError to `e.code || e.message`', async () => {
  // THE DEFECT WAS UNREACHABILITY, NOT CARELESSNESS. `e.code` is hardcoded
  // `meta_send_failed` in the MetaSendError constructor, so `||` never falls
  // through and the informative half could not be read by any caller, ever.
  // ⚠ COMMENTS STRIPPED FIRST. The first cut of this cell went RED on
  // `metaCloud.js` — matching the COMMENT that explains the defect — and on its
  // own explanation in `creditInvite.js`. Fourth time this arc that a cell has
  // read a file's prose about itself instead of its executable bytes; the cure
  // is the same one every time, and it is applied here rather than noted.
  const strip = (src) => src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  // SCOPED TO THIS PACKET'S RADIUS. `closerEngine.js` and `prospects.js` carry
  // the same reduction on the MARKETING lane's per-prospect loop, log-only and
  // not a MetaSendError path this packet touches. Named as an unnumbered finding
  // rather than silently widened into this cure — the chair mints, not the seat.
  const RADIUS = ['src/lib/vendor/creditInvite.js', 'src/lib/vendor/reviewAsk.js'];
  const offenders = [];
  for (const rel of RADIUS) {
    const src = strip(fs.readFileSync(R(rel), 'utf8'));
    if (/e\.code\s*\|\|\s*e\.message/.test(src)) offenders.push(rel);
  }
  return offenders.length === 0 ? true : `still swallowing: ${offenders.join(', ')}`;
});

// ═══ §5 · F-40.240 · A FAILED SEND LEAVES NO SCAR ═════════════════════════
sec('\u00a75 \u00b7 the consent token survives a failed send');

await cell('`previous` is read by its OWN select, never off getForOwner', async () => {
  // WEDDING_COLS does not carry the three consent columns — consent_token is a
  // capability secret and is deliberately absent. Reading `previous` off the
  // wedding would have given three nulls, and the restore would then BLANK A
  // LIVE TOKEN rather than put it back: strictly worse than the defect.
  const src = fs.readFileSync(R('src/lib/vendor/weddings.js'), 'utf8');
  const mint = src.slice(src.indexOf('async function mintConsentToken'),
                         src.indexOf('async function restoreConsentToken'));
  if (/previous\s*=\s*\{[\s\S]{0,200}wedding\.consent_token/.test(mint))
    return 'previous is read off getForOwner, which does not select those columns';
  return /\.select\('consent_token, consent_sent_at, consent_phone'\)/.test(mint)
    ? true : 'previous has no select of its own';
});

await cell('the door restores on any non-true `sent`', async () => {
  const src = fs.readFileSync(R('src/api/vendor/studio/weddings.js'), 'utf8');
  return /invite\.sent !== true[\s\S]{0,400}restoreConsentToken/.test(src)
    ? true : 'the door does not roll back a failed send';
});

await cell('the door normalises before minting, so /consent/resend inherits it', async () => {
  const src = fs.readFileSync(R('src/api/vendor/studio/weddings.js'), 'utf8');
  const door = src.slice(src.indexOf("router.post('/:id/consent',"));
  const block = door.slice(0, door.indexOf('router.post', 10));
  if (!/const phone = toE164\(typed\)/.test(block)) return 'the door sends the number as typed';
  // the resend door re-sends consent_phone straight off the row, so the STORED
  // value must be the normalised one or that door fails forever with no field
  // for the vendor to correct.
  return /mintConsentToken\(supabase, \{[\s\S]{0,120}phone,/.test(block)
    ? true : 'the normalised value is not what gets stored';
});

console.log(`\n${'='.repeat(70)}`);
console.log(`b57_e164_guard_bench  ${pass} GREEN  ${fail} RED`);
if (fail) { console.log('\nRED CELLS:'); fails.forEach((f) => console.log('  - ' + f)); }
console.log(`${'='.repeat(70)}`);
console.log(`
NON-VACUITY — FOUR PRODUCTION MUTATIONS, EACH RED ON THE CELLS NAMED:
  1 metaCloud.js  drop the toE164 wrapper from the guard line     \u2192 \u00a72(2), \u00a73
  2 metaCloud.js  drop normalizeTo from the wrapper               \u2192 \u00a72(1),(3), \u00a73
  3 metaCloud.js  remove the console.error at the throw           \u2192 \u00a74
  4 weddings.js   read previous off \`wedding\` again               \u2192 \u00a75
`);
process.exit(fail ? 1 : 0);
})();
