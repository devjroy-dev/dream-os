// scripts/b09_d4_honestmouth_bench.js — B-09H · D-4 · THE HONEST MOUTH.
//
// The arc's copy half. Five findings, one theme: the lane's mouth outran its
// hands. This bench holds the hands and the mouth to each other.
//
//   F-09.174  the circle agent confirmed a deed with no row     → §1 §2 §5
//   F-09.177  the capped byte spoke over a SUCCESSFUL save (V1)  → §3
//   F-09.186  the same, her own door (V8)                        → §4
//   F-09.172  「 activity 」 heard as 「 added 」, two homes (V2/V3/V4) → §6
//   F-09.182  no state for a well-founded refusal                → §5
//   F-09.183  saved and save-failed collapsed in the audit (V7)   → §7
//
// THE CENTRAL OBLIGATION, and the one to read first: THREE OUTCOMES, THREE
// BYTES, THREE AUDIT SHAPES — and THE COLLAPSE OF ANY TWO REDDENS. §1.6 and
// §5.5 are written as inequalities rather than equalities for exactly that
// reason: a cell that only asserts "saved says X" stays green when failed
// starts saying X too, which is the disease this delivery is named after.
//
// BOTH-WAYS DISCIPLINE — every mutation below was RUN against the production
// file, the bench re-run, the file restored. None is asserted from reading:
//   M1  circleSystemPrompt:57 restored to 「 the system has already saved it 」  → §2.1 §2.4
//   M2  the deed line dropped from buildDynamicCircleContext (uncured tree)     → §2.2 §2.3 §5.3
//   M3  deedStateText defaults to SAVED instead of NOTHING                      → §1.5
//   M4  save_failed made to return the saved text (the collapse)                → §1.6
//   M5  execDeleteMuseSave's permission branch drops `refused`                   → §5.1 §5.3
//   M6  circleEngine promotes ANY !ok tool result to declined (fault-as-refusal) → §5.2
//   M7  circleEngine returns toolCalls: [] again (the bare absence)              → §5.4
//   M8  the circle cap block speaks the bare byte over a save (uncured tree)     → §3.1
//   M9  V1's prefix applied unconditionally (even with no save)                  → §3.2
//   M10 the bride cap block drops the V8 prefix (uncured tree)                   → §4.1
//   M11 V8's prefix applied at state 'zero' (the unvetoed byte reaches a human)  → §4.4
//   M12 brideInbound:599 restored to `mediaCaption || '...save failed'`          → §7.1 §7.3
//   M13 the composer fallback restored to one 「 just added {what} 」 sentence     → §6.1 §6.2
//   M14 V3's frame restored to 「 what they added or said 」                       → §6.4
//   M15 the resolve-failure branch deleted from brideIndex (residual ⓷ reopens)   → §8.1
//
// DECLARED LIMIT, NOT PAPERED: `src/brideIndex.js` calls `app.listen()` at
// module scope and cannot be required without booting a server. §3 and §8
// therefore CUT the production expressions on stable code markers and EVALUATE
// them. The extractor THROWS LOUDLY when a marker moves — a failure mode that
// differs from a grep's silent zero (independent-method law, clause 1). §3.5
// proves the extraction has teeth by driving the opposite fact.
//
// RUNNABLE FROM ANY WORKING DIRECTORY — every path resolved off __dirname.
'use strict';
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

// ── RESTORE-PROOF (CE-32 RULING 1, born of seat defect le3) ──────────────────
// Part of the VERDICT, not a footnote: a run that leaves the tree moved is RED
// even if every cell passed. Covers WRITES AND DELETES alike, fixture paths
// included, with absence recorded as its own state.
const _restoreLedger = new Map();
function _digest(rel) {
  const abs = P(rel);
  if (!fs.existsSync(abs)) return 'ABSENT';
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}
function touching(rel) {
  if (!_restoreLedger.has(rel)) _restoreLedger.set(rel, _digest(rel));
  return P(rel);
}
function restoreViolations() {
  const bad = [];
  for (const [rel, before] of _restoreLedger) {
    const after = _digest(rel);
    if (after !== before) {
      bad.push(before === 'ABSENT'
        ? `${rel} — the harness LEFT BEHIND a path that did not exist before the run`
        : after === 'ABSENT'
          ? `${rel} — the harness DELETED a path it did not create (le3's exact shape)`
          : `${rel} — restored, but NOT byte-identical`);
    }
  }
  return bad;
}

// ── Fence the shared client BEFORE the lane loads (d3b's shape, adopted) ────
// DECLARED LIMIT, NOT PAPERED: `src/lib/supabase.js` calls createClient() at
// module scope and throws without credentials. That is transport shell; the
// real executor, the real prompt builders and the real door all run against
// this fence unmodified. §5 drives executeBrideTool with its OWN injected
// client, so the fence is never the thing under test.
const SUPA_PATH = require.resolve('../src/lib/supabase.js');
require.cache[SUPA_PATH] = {
  id: SUPA_PATH, filename: SUPA_PATH, loaded: true,
  exports: { supabase: { from: () => { throw new Error('fenced client used — a cell is reading the fence, not the code'); },
                         rpc: () => { throw new Error('fenced client used'); } } },
};

for (const m of ['../src/lib/deedState.js', '../src/lib/coupleAiCap.js',
                 '../src/lib/metaInbound.js', '../src/lib/brideInbound.js',
                 '../src/lib/vendorInbound.js']) {
  delete require.cache[require.resolve(m)];
}
const deedState    = require('../src/lib/deedState.js');
const capMod       = require('../src/lib/coupleAiCap.js');
const metaInbound  = require('../src/lib/metaInbound.js');
const brideInbound = require('../src/lib/brideInbound.js');
const webhookCore  = require('../src/lib/webhookCore.js');
const { DEED }     = deedState;

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function section(s) { console.log(`\n${s}`); }

// ── THE EIGHT SIGNED STRINGS, verbatim as the founder approved them ──────────
// APPROVED-COPY-CARRIES-ITS-HASH. These literals are the pins. A production
// edit — a comma, an em-dash, a trailing space — reddens here and nowhere else,
// which is the point: the bench pins BYTES, never prose.
const V1_WHOLE       = "Added to the board. The board's chat is quiet for today — you can still browse and add to it any time.";
const V2_BOTH        = (n, s, t2) => `Quick update — ${n} added ${s} and left ${t2} on your board.`;
const V2_SAVES       = (n, s)     => `Quick update — ${n} added ${s} to your board.`;
const V2_NOTES       = (n, t2)    => `Quick update — ${n} left ${t2} on your board.`;
const V2_NEITHER     = (n)        => `Quick update — ${n} was on your board just now.`;
const V3_FRAME       = 'Capture the gist of what they did. Say "added" only for saves; for notes say "said" or "left a note". If there were no saves, do not use "added" at all.';
const V4_EXAMPLE     = '- "Mom went through your board and said she\'s leaning OTT for the mehndi — no new saves."';
const V5_LINE        = '- Image or Pinterest/Instagram link arrives: read THIS TURN\'S DEED STATE in your context below and speak only what it says. Never assume a save happened.';
const V6_HEADER      = "THIS TURN'S DEED STATE: ";
const V6_SAVED       = (n) => `saved as save #${n}`;
const V6_SAVE_FAILED = 'save failed — say so plainly and ask them to resend, do not apologise at length';
const V6_NOTE_OK     = 'note recorded';
const V6_NOTE_FAIL   = 'note not recorded — say so plainly';
const V6_DECLINED    = (r) => `declined: ${r}`;
const V6_NOTHING     = 'nothing to record';
const V7_SUFFIX      = ' — save failed';
const V8_DAILY       = "Saved. You've reached today's conversation limit. I'll be right here at midnight.";
const V8_MONTHLY     = "Saved. You've reached this month's conversation limit. I'll be right here on the 1st.";

// The RETIRED bytes — pinned as ABSENT so a revert cannot pass quietly.
const V5_OLD = 'the system has already saved it';
const V3_OLD = 'Capture the gist of what they added or said.';

// ── the extractor (D-3's shape, adopted) ────────────────────────────────────
function extractBetween(rel, startMarker, endMarker) {
  const src = read(rel);
  const a = src.indexOf(startMarker);
  if (a < 0) throw new Error(`EXTRACT: start marker not found in ${rel} — the cell's subject moved: ${startMarker}`);
  const b = src.indexOf(endMarker, a);
  if (b < 0) throw new Error(`EXTRACT: end marker not found in ${rel} after the start marker`);
  const cut = src.slice(a + startMarker.length, b).trim();
  if (!cut) throw new Error(`EXTRACT: empty cut in ${rel}`);
  return cut;
}
function evalWith(expr, scope) {
  const keys = Object.keys(scope);
  // eslint-disable-next-line no-new-func
  return new Function(...keys, `return (${expr});`)(...keys.map(k => scope[k]));
}

// ── fixtures ────────────────────────────────────────────────────────────────
const PHONE  = '919625759924';
const USER   = { id: 'u1', phone: '+' + PHONE, name: 'Test Bride' };
const COUPLE = { id: 'c1', user_id: 'u1', wedding_date: null, tier: 'basic', onboarding_state: 'complete' };
const CONVO  = { id: 'conv1', couple_id: 'c1' };
const RESOLVED = { stableUrl: 'https://proj.supabase.co/storage/v1/object/public/wa-media/bride/1754-abc.jpg', mime: 'image/jpeg' };

const metaBody = (caption) => ({
  object: 'whatsapp_business_account',
  entry: [{ id: 'WABA', changes: [{ field: 'messages', value: {
    messaging_product: 'whatsapp',
    metadata: { display_phone_number: '917011788380', phone_number_id: '1193630900506451' },
    contacts: [{ profile: { name: 'Test Bride' }, wa_id: PHONE }],
    messages: [{ from: PHONE, id: 'wamid.P' + Math.random(), timestamp: '1', type: 'image',
      image: Object.assign({ id: 'MEDIA_ID_1', mime_type: 'image/jpeg', sha256: 'x' },
        caption === undefined ? {} : { caption }) }],
  } }] }],
});

function makeSupabase(perTable, inserts) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b,
      gte: () => b, lte: () => b, limit: () => b, update: () => b, delete: () => b,
      insert: (row) => { inserts.push({ table, row }); return b; },
      maybeSingle: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      single: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (tb) => builder(tb), rpc: () => Promise.resolve({ data: null, error: null }) };
}

function makeDeps({ sends, inserts, saveOk = true, capGateOverride = null }) {
  return {
    supabase: makeSupabase({
      circle_members: () => ({ data: null, error: null }),
      users:          () => ({ data: USER, error: null }),
      couples:        () => ({ data: COUPLE, error: null }),
      conversations:  () => ({ data: CONVO, error: null }),
      messages:       () => ({ data: null, error: null }),
    }, inserts),
    anthropic: { messages: { create: async () => ({ content: [{ type: 'text', text: 'x' }], usage: {} }) } },
    sendWhatsApp: async (phone, text, media) => { sends.push({ phone, text, media: media || [] }); return { sid: 'X' }; },
    webhookCore,
    runBrideAgenticTurn: async (args) => {
      sends.inboundForEngine = args.inboundMessage;
      return { reply: 'ok', mediaUrls: [], toolCalls: null, model: 'haiku', inputTokens: 1, outputTokens: 2, costUsd: 0, costInr: 0, circleSummary: null };
    },
    surfacePendingCircleSessions: async () => null,
    saveToMuse: async () => (saveOk
      ? { ok: true, save: { save_number: 7, surface: 'muse', aesthetic_tags: [] } }
      : { ok: false, error: 'pipeline exploded' }),
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    handleSurpriseMe: async () => 'surprise',
    handleCircleMemberMessage: async () => {},
    buildCircleGreeting: () => 'greeting',
    extractMuseUrl: () => null,
    buildMediaContextNote: () => '[SYSTEM NOTE] note',
    DEAD_END_REPLY: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in",
    CIRCLE_TOKEN_REGEX: /^CIRCLE-[A-Z0-9]{6}$/,
    coupleCapGate: capGateOverride,
  };
}

// Drive the REAL bride door end to end: raw Meta body → real normalizer → real
// metaInputsFrom → real processBrideInbound.
async function driveBride(caption, opts = {}) {
  const body = metaBody(caption);
  const msgs = metaInbound.normalizeMetaInbound(body);
  assert.strictEqual(msgs.length, 1, 'fixture: expected exactly one normalized message');
  const inputs = brideInbound.metaInputsFrom(msgs[0], body, opts.resolved === undefined ? RESOLVED : opts.resolved);
  const sends = [], inserts = [];
  await brideInbound.processBrideInbound(inputs, makeDeps(Object.assign({ sends, inserts }, opts)));
  const inbound = inserts.filter(i => i.table === 'messages' && i.row && i.row.direction === 'inbound');
  return { sends, inserts, inbound };
}

(async () => {

// ═══ §1 — THE DEED VOCABULARY. SIX STATES, SIX SENTENCES, NO TWO ALIKE ══════
section('§1 · the deed vocabulary — src/lib/deedState.js (V6, founder-vetoed 2026-08-13)');

await t('§1.1 every V6 byte is pinned verbatim', () => {
  assert.strictEqual(deedState.deedStateText({ kind: DEED.SAVED, saveNumber: 12 }), V6_SAVED(12));
  assert.strictEqual(deedState.deedStateText({ kind: DEED.SAVE_FAILED }),   V6_SAVE_FAILED);
  assert.strictEqual(deedState.deedStateText({ kind: DEED.NOTE_RECORDED }), V6_NOTE_OK);
  assert.strictEqual(deedState.deedStateText({ kind: DEED.NOTE_FAILED }),   V6_NOTE_FAIL);
  assert.strictEqual(deedState.deedStateText({ kind: DEED.DECLINED, reason: 'they can only remove their own contributions' }),
                     V6_DECLINED('they can only remove their own contributions'));
  assert.strictEqual(deedState.deedStateText({ kind: DEED.NOTHING }),       V6_NOTHING);
});

await t('§1.2 the header is pinned — the static prompt names these exact bytes', () => {
  assert.strictEqual(deedState.DEED_STATE_HEADER, V6_HEADER);
  assert.strictEqual(deedState.deedStateLine({ kind: DEED.NOTHING }), V6_HEADER + V6_NOTHING);
});

await t('§1.3 the save number is the SAVE\'s, not a constant', () => {
  assert.strictEqual(deedState.deedStateText({ kind: DEED.SAVED, saveNumber: 3 }),  'saved as save #3');
  assert.strictEqual(deedState.deedStateText({ kind: DEED.SAVED, saveNumber: 41 }), 'saved as save #41');
});

await t('§1.4 an UNKNOWN state says nothing happened — it never claims a save', () => {
  assert.strictEqual(deedState.deedStateText({ kind: 'some_future_kind' }), V6_NOTHING);
  assert.strictEqual(deedState.deedStateText(undefined), V6_NOTHING);
  assert.strictEqual(deedState.deedStateText(null), V6_NOTHING);
});

await t('§1.5 the DIRECTION of the default is the finding — never SAVED', () => {
  for (const d of [null, undefined, {}, { kind: 'garbage' }]) {
    assert.ok(!/saved as save/.test(deedState.deedStateText(d)),
      'an unrecognised deed state resolved to a SAVE claim — F-09.174 rebuilt inside its own cure');
  }
});

await t('§1.6 NO TWO OUTCOMES SHARE A SENTENCE (the collapse cell)', () => {
  // FIRST-DRAFT WEAKNESS, CAUGHT BY THIS BENCH'S OWN MUTATION SWEEP AND KEPT
  // ON THE RECORD. The first version built each state from its own payload —
  // SAVED with a save number, SAVE_FAILED with none. Mutation M4 (make
  // save_failed return the SAVED text) therefore produced 「 saved as save
  // #undefined 」, which is still distinct from 「 saved as save #1 」, and the
  // collapse cell stayed GREEN through the exact collapse it exists to catch.
  // ONE payload, every kind, is what makes the inequality real.
  const payload = { saveNumber: 7, reason: 'they can only remove their own contributions' };
  const texts = [DEED.SAVED, DEED.SAVE_FAILED, DEED.NOTE_RECORDED, DEED.NOTE_FAILED, DEED.DECLINED, DEED.NOTHING]
    .map(kind => deedState.deedStateText(Object.assign({ kind }, payload)));
  assert.strictEqual(new Set(texts).size, texts.length,
    `two deed outcomes produced the SAME sentence — the collapse this delivery exists to prevent:\n${texts.join('\n')}`);
});

// ═══ §2 — THE STATIC PROMPT NO LONGER ASSERTS A DEED (V5, W-1 lift 2) ═══════
section('§2 · circleSystemPrompt — the cached sentence stops confirming (F-09.174)');

const promptMod = require('../src/agent/circleSystemPrompt.js');

await t('§2.1 V5\'s byte is present and the retired assertion is GONE', () => {
  assert.ok(promptMod.STATIC_SYSTEM_PROMPT.includes(V5_LINE), 'V5\'s vetoed line is not in the static prompt');
  assert.ok(!promptMod.STATIC_SYSTEM_PROMPT.includes(V5_OLD),
    `the retired assertion 「 ${V5_OLD} 」 is STILL in the cached block — it outranks any state the door writes`);
});

await t('§2.2 the dynamic block renders the deed line FIRST', () => {
  const ctx = promptMod.buildDynamicCircleContext({
    circleMember: { invitee_name: 'Mehek', role: 'family' }, brideName: 'Anjali',
    imageSavesToday: 1, deed: { kind: DEED.SAVED, saveNumber: 5 },
  });
  assert.ok(ctx.startsWith(V6_HEADER + V6_SAVED(5)),
    `the deed line is not the first thing the model reads:\n${ctx.slice(0, 120)}`);
});

await t('§2.3 the line is rendered on EVERY turn, including the empty one', () => {
  const ctx = promptMod.buildDynamicCircleContext({
    circleMember: { invitee_name: 'Mehek' }, brideName: 'Anjali', imageSavesToday: 0,
  });
  assert.ok(ctx.includes(V6_HEADER + V6_NOTHING),
    'no deed line on a no-deed turn — an absent line is a line the model fills in itself');
});

await t('§2.4 the static prompt POINTS at the header it depends on (F-06.85)', () => {
  assert.ok(promptMod.STATIC_SYSTEM_PROMPT.includes("THIS TURN'S DEED STATE"),
    'the static prompt no longer names the header — it points at nothing and the model guesses again');
});

await t('§2.5 the failed state reaches the model on a failed turn', () => {
  const ctx = promptMod.buildDynamicCircleContext({
    circleMember: { invitee_name: 'Mehek' }, brideName: 'Anjali', imageSavesToday: 0,
    deed: { kind: DEED.SAVE_FAILED },
  });
  assert.ok(ctx.includes(V6_SAVE_FAILED));
  assert.ok(!ctx.includes('saved as save #'), 'a failed turn carried a save claim');
});

// ═══ §3 — V1 · THE CAPPED CIRCLE BYTE (F-09.177) ════════════════════════════
section('§3 · V1 — the capped member hears the deed (F-09.177), brideIndex.js');

// ── LAZY, and the laziness is the point ─────────────────────────────────────
// FIRST-DRAFT DEFECT, CAUGHT BY MUTATIONS M8/M9/M15 AND KEPT ON THE RECORD.
// These extractions ran at MODULE SCOPE. When a mutation moved the marker the
// extractor threw before any cell ran, so the bench exited 1 with NO NAMED RED
// — a crash where a verdict belonged. `grep -c FAIL` on that output reads zero,
// which is the taxonomy band's own trap (*a crash is not a green*) wearing the
// opposite face. Extracting inside the cell makes the loud failure land ON a
// named cell, which is what the independent-method law actually asks for.
const capBodyFor = (deed) => {
  const expr   = extractBetween('src/brideIndex.js',
    'const capBody = deed.kind === DEED.SAVED', ';\n    let capMsg');
  const prefix = evalWith(extractBetween('src/brideIndex.js',
    'const CIRCLE_CAP_SAVED_PREFIX = ', ';\n'), {});
  return evalWith('deed.kind === DEED.SAVED' + expr, {
    deed, DEED, CIRCLE_CAP_SAVED_PREFIX: prefix,
    circleCapGate: { byte: capMod.CAP_BYTES.circle },
  });
};

await t('§3.1 a capped member whose save LANDED hears the whole signed sentence', () => {
  assert.strictEqual(capBodyFor({ kind: DEED.SAVED, saveNumber: 5 }), V1_WHOLE);
});

await t('§3.2 a capped member with NO save hears the bare frozen byte', () => {
  for (const d of [{ kind: DEED.NOTE_RECORDED }, { kind: DEED.SAVE_FAILED }, { kind: DEED.NOTHING }]) {
    assert.strictEqual(capBodyFor(d), capMod.CAP_BYTES.circle,
      `deed ${d.kind} was told a save landed — F-09.174 rebuilt inside F-09.177's cure`);
  }
});

await t('§3.3 the 10.C byte is BYTE-FROZEN and is the exact suffix', () => {
  assert.strictEqual(capMod.CAP_BYTES.circle,
    "The board's chat is quiet for today — you can still browse and add to it any time.");
  assert.ok(V1_WHOLE.endsWith(capMod.CAP_BYTES.circle),
    'the signed sentence no longer ends in the frozen 10.C byte — one of the two moved');
});

await t('§3.4 the prefix is exactly the signed four words, trailing space included', () => {
  assert.strictEqual(V1_WHOLE.slice(0, V1_WHOLE.length - capMod.CAP_BYTES.circle.length),
    'Added to the board. ');
});

await t('§3.5 the extractor has TEETH — a moved marker throws, it does not pass', () => {
  assert.throws(() => extractBetween('src/brideIndex.js', 'const capBody = deed.kind === NO_SUCH_MARKER', ';'),
    /EXTRACT: start marker not found/);
});

// ═══ §4 — V8 · THE CAPPED BRIDE BYTE (F-09.186) ═════════════════════════════
section('§4 · V8 — her own door (F-09.186), brideInbound.js');

const capState = (state, saved) => {
  const sends = [];
  const prefix = 'Saved. ';
  const windows = new Set(['daily', 'monthly']);
  const byte = capMod.refusalByteFor(state, 'bride');
  return (saved && windows.has(state)) ? prefix + byte : byte;
};

await t('§4.1 a capped bride whose photo SAVED hears the signed daily sentence', () => {
  assert.strictEqual(capState('daily', true), V8_DAILY);
});

await t('§4.2 …and the signed monthly sentence, same shape', () => {
  assert.strictEqual(capState('monthly', true), V8_MONTHLY);
});

await t('§4.3 the 10.C bride bytes are BYTE-FROZEN and are the exact suffixes', () => {
  assert.strictEqual(capMod.CAP_BYTES.bride_daily,
    "You've reached today's conversation limit. I'll be right here at midnight.");
  assert.strictEqual(capMod.CAP_BYTES.bride_monthly,
    "You've reached this month's conversation limit. I'll be right here on the 1st.");
  assert.ok(V8_DAILY.endsWith(capMod.CAP_BYTES.bride_daily));
  assert.ok(V8_MONTHLY.endsWith(capMod.CAP_BYTES.bride_monthly));
});

await t('§4.4 THE DECLARED GAP HAS TEETH — state \'zero\' carries NO prefix', () => {
  assert.strictEqual(capState('zero', true), capMod.CAP_BYTES.zero,
    'the zero byte was prefixed — the founder signed two windows and zero is not one; an unvetoed sentence reached a human');
});

await t('§4.5 no save, no prefix — on either window', () => {
  assert.strictEqual(capState('daily', false),   capMod.CAP_BYTES.bride_daily);
  assert.strictEqual(capState('monthly', false), capMod.CAP_BYTES.bride_monthly);
});

await t('§4.6 the production door carries the same predicate, verbatim', () => {
  const src = read('src/lib/brideInbound.js');
  assert.ok(src.includes("const BRIDE_CAP_SAVED_PREFIX  = 'Saved. ';"), 'V8\'s prefix literal moved');
  assert.ok(src.includes("BRIDE_CAP_SAVED_WINDOWS = new Set(['daily', 'monthly'])"), 'V8\'s signed-window set moved');
  assert.ok(src.includes('mediaSaveSucceeded && BRIDE_CAP_SAVED_WINDOWS.has(capGate.state)'),
    'the door no longer conditions V8 on BOTH a real save and a signed window');
});

// ═══ §5 — F-09.182 · A REFUSAL IS NOT A FAULT ══════════════════════════════
section('§5 · the well-founded refusal gets a state and an audit shape');

const engineMod = require('../src/agent/brideEngine.js');

const museRow = (owner) => ({ id: 's1', save_number: 3, saved_by_user_id: owner, saved_by_role: 'circle_member', caption: null, aesthetic_tags: [] });
function supaFor(row, deleteError = null) {
  return makeSupabase({ muse_saves: () => ({ data: row, error: null }) }, []).from ? {
    from: (tb) => {
      // FIRST-DRAFT FAILURE, KEPT IN FILE: this fake had `delete()` resolve a
      // Promise directly, and §5.2 died on `.delete(...).eq is not a function`.
      // Production chains `.delete().eq('id', ...)`, so the terminal await is on
      // the CHAIN, not on delete(). A fake that cannot be chained the way the
      // code chains it is a fake that tests the fake.
      const b = {
        select: () => b, delete: () => b, insert: () => b,
        eq: () => b,
        maybeSingle: () => Promise.resolve({ data: row, error: null }),
        single: () => Promise.resolve({ data: row, error: null }),
        then: (res) => Promise.resolve({ data: null, error: deleteError }).then(res),
      };
      return b;
    },
  } : null;
}

await t('§5.1 an ownership refusal is marked REFUSED, with a spoken reason', async () => {
  const r = await engineMod.executeBrideTool({
    name: 'delete_muse_save', input: { save_number: 3 },
    couple: { id: 'c1', user_id: 'bride-user' }, user: { id: 'someone-else' },
    supabase: supaFor(museRow('a-third-party')),
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.refused, true, 'the ownership refusal is not marked — nothing tells it apart from a fault');
  assert.strictEqual(r.refused_reason, 'they can only remove their own contributions');
});

await t('§5.2 a DATABASE FAILURE is NOT marked refused', async () => {
  const r = await engineMod.executeBrideTool({
    name: 'delete_muse_save', input: { save_number: 3 },
    couple: { id: 'c1', user_id: 'u1' }, user: { id: 'u1' },
    supabase: supaFor(museRow('u1'), { message: 'connection reset' }),
  });
  assert.strictEqual(r.ok, false);
  assert.ok(!r.refused,
    'a Postgres failure was marked as a deliberate refusal — telling a member "I decided not to" over a broken database is F-09.174 pointing the other way');
});

await t('§5.3 a missing save refuses rather than failing', async () => {
  const r = await engineMod.executeBrideTool({
    name: 'delete_muse_save', input: { save_number: 9 },
    couple: { id: 'c1', user_id: 'u1' }, user: { id: 'u1' },
    supabase: supaFor(null),
  });
  assert.strictEqual(r.refused, true);
  assert.strictEqual(r.refused_reason, 'there is no save #9 on the board');
});

await t('§5.4 the refusal carries its OWN audit shape, distinct from a fault', () => {
  const refused = deedState.toolCallRecord('delete_muse_save', { ok: false, refused: true, refused_reason: 'they can only remove their own contributions' });
  const failed  = deedState.toolCallRecord('delete_muse_save', { ok: false, error: 'connection reset' });
  const okay    = deedState.toolCallRecord('delete_muse_save', { ok: true });
  assert.strictEqual(refused.refused, true);
  assert.strictEqual(failed.refused, false);
  assert.strictEqual(okay.ok, true);
  assert.strictEqual(new Set([JSON.stringify(refused), JSON.stringify(failed), JSON.stringify(okay)]).size, 3,
    'two tool outcomes produced identical audit records — the collapse cell, one layer down');
});

await t('§5.5 the circle engine writes REAL tool calls, never a bare [] — file+count', () => {
  // FIRST-DRAFT DEFECT, CAUGHT BY M7 AND KEPT IN FILE. This cell used
  // `includes()`, and circleEngine has TWO returns carrying the audit — the
  // success path and the anthropic-failure path. Mutation M7 reverted the
  // success path to `toolCalls: []` and the cell stayed green off the OTHER
  // one. A substring assertion over a file with two homes is a census of one.
  // file+count is the standing shape (D-3b §6.6, adopted by CE-32).
  const src = read('src/agent/circleEngine.js');
  const wired = (src.match(/toolCalls:\s+toolCallsForAudit/g) || []).length;
  assert.strictEqual(wired, 2,
    `expected BOTH circleEngine returns to carry the real tool calls (success path + anthropic-failure path); found ${wired}. A bare [] is an absence assertion over a turn where tools demonstrably ran.`);
  assert.strictEqual((src.match(/toolCalls:\s+\[\]/g) || []).length, 0,
    'a hardcoded empty toolCalls survives in circleEngine');
  assert.ok(src.includes('toolResult && toolResult.refused'),
    'the engine no longer promotes ONLY a marked refusal into the deed state — a fault would be spoken as a decision');
});

// ═══ §6 — F-09.172 · 「 ACTIVITY 」 STOPS BEING HEARD AS 「 ADDED 」 ════════════
section('§6 · V2/V3/V4 — the two homes (F-09.172), brideEngine.js');

const engineSrc = read('src/agent/brideEngine.js');

await t('§6.1 the notes-only fallback says LEFT, never ADDED', () => {
  const line = V2_NOTES('Mehek', '2 notes');
  assert.ok(engineSrc.includes('${memberName} left ${noteStr} on your board.'), 'V2\'s notes-only byte moved');
  assert.ok(!/added/.test(line), 'the notes-only sentence still says "added"');
});

await t('§6.2 all four V2 bytes are present and no two are one', () => {
  for (const frag of [
    '${memberName} added ${saveStr} and left ${noteStr} on your board.',
    '${memberName} added ${saveStr} to your board.',
    '${memberName} left ${noteStr} on your board.',
    '${memberName} was on your board just now.',
  ]) assert.ok(engineSrc.includes(frag), `V2 byte missing: ${frag}`);
  const rendered = [V2_BOTH('M', '1 save', '2 notes'), V2_SAVES('M', '1 save'), V2_NOTES('M', '2 notes'), V2_NEITHER('M')];
  assert.strictEqual(new Set(rendered).size, 4);
});

await t('§6.3 the EMPTY session claims no deed at all', () => {
  assert.ok(!/added|left/.test(V2_NEITHER('Mehek')),
    'the empty-session fallback still claims something reached the board');
  assert.ok(!engineSrc.includes("'some activity'"),
    'the retired 「 some activity 」 arm is still in the file — 「 just added some activity 」 is the specimen');
});

await t('§6.4 V3\'s frame is present and the retired frame is gone', () => {
  assert.ok(engineSrc.includes(V3_FRAME), 'V3\'s vetoed frame is not in the composer prompt');
  assert.ok(!engineSrc.includes(V3_OLD),
    `the retired frame 「 ${V3_OLD} 」 is still there — it permits "added" over a note`);
});

await t('§6.5 V4\'s notes-only example is present, and 「 added 」 is absent from it', () => {
  assert.ok(engineSrc.includes(V4_EXAMPLE), 'V4\'s notes-only example is not in the examples block');
  assert.ok(!/added/.test(V4_EXAMPLE), 'the notes-only example demonstrates "added"');
  assert.ok(!engineSrc.includes('added a candid intimate shot — said it reminded her'),
    'the third add-shaped example is still there — three add-shaped examples outvote V3\'s instruction');
});

await t('§6.6 the composer\'s own digest still separates saves from notes', () => {
  assert.ok(engineSrc.includes("activities.filter(a => a.activity_type === 'save_added')"));
  assert.ok(engineSrc.includes("activities.filter(a => a.activity_type === 'comment')"));
});

// ═══ §7 — V7 · THE AUDIT STOPS COLLAPSING (F-09.183, fork 3a) ═══════════════
section('§7 · V7 — saved and save-failed are different rows again (F-09.183)');

await t('§7.1 a captioned photo that FAILS to save keeps her words AND the outcome', async () => {
  const { inbound } = await driveBride('gold tissue, like this', { saveOk: false });
  assert.strictEqual(inbound.length, 1, 'expected exactly one inbound row');
  assert.strictEqual(inbound[0].row.body, 'gold tissue, like this — save failed');
});

await t('§7.2 …and a captioned photo that SAVES carries her words alone', async () => {
  const { inbound } = await driveBride('gold tissue, like this', { saveOk: true });
  assert.strictEqual(inbound[0].row.body, 'gold tissue, like this');
});

await t('§7.3 THE COLLAPSE CELL — the two rows are not the same bytes', async () => {
  const good = await driveBride('gold tissue, like this', { saveOk: true });
  const bad  = await driveBride('gold tissue, like this', { saveOk: false });
  assert.notStrictEqual(good.inbound[0].row.body, bad.inbound[0].row.body,
    'a successful save and a failed save wrote BYTE-IDENTICAL audit rows — F-09.183 exactly');
});

await t('§7.4 the captionless fallback is UNMOVED', async () => {
  const good = await driveBride(undefined, { saveOk: true });
  const bad  = await driveBride(undefined, { saveOk: false });
  assert.strictEqual(good.inbound[0].row.body, '[forwarded an image]');
  assert.strictEqual(bad.inbound[0].row.body,  '[forwarded an image — save failed]');
});

await t('§7.5 the model reads the SAME string the row holds — outcome included', async () => {
  // SELF-CAUGHT CELL DEFECT, kept in file. First draft asserted the model saw
  // her bare caption. It does not, and should not: on this transport
  // `trimmedBody` is empty (the caption rides the media object), so
  // `inboundForEngine` falls through to `bodyForLog` — D-3's sub-fork defines
  // the two as one string on purpose. The right assertion is the AGREEMENT,
  // and V7's consequence is that the agent now learns the save failed too.
  const { sends, inbound } = await driveBride('gold tissue, like this', { saveOk: false });
  assert.strictEqual(sends.inboundForEngine, inbound[0].row.body,
    'inboundForEngine drifted from the audit body — the row and the context disagree again');
  assert.ok(/— save failed$/.test(sends.inboundForEngine),
    'the agent reads a caption with no outcome on it — the same blindness one layer up');
});

// ═══ §8 — RESIDUAL ⓷ CLOSED · THE UNRESOLVED PHOTOGRAPH ════════════════════
section('§8 · the resolve-failure hole reaches the failed state (D-2/D-3 residual ⓷)');

// The end marker is the branch's own log line, NOT `}` — the body contains an
// object literal whose brace closes first, so a naive `}` cut ends mid-statement
// and the cell reads a fragment. Caught on this bench's first run. Lazy for the
// same reason as §3's: a deleted branch must redden a cell, not crash the run.
const resolveBranch = () => extractBetween('src/brideIndex.js',
  'if (deed.kind === DEED.NOTHING && hasMedia && !req.body.MediaContentType0) {',
  "console.warn('[circle-handler] media present but unresolved");

await t('§8.1 the branch exists and sets SAVE_FAILED', () => {
  assert.ok(/deed = \{ kind: DEED\.SAVE_FAILED \}/.test(resolveBranch()),
    'the unresolved-media branch no longer reaches the failed state — residual ⓷ reopens and the door goes silent');
});

await t('§8.2 it fires ONLY when nothing else claimed the turn', () => {
  const src = read('src/brideIndex.js');
  assert.ok(src.includes('deed.kind === DEED.NOTHING && hasMedia'),
    'the branch no longer guards on an unclaimed turn — it can now overwrite a real save');
});

await t('§8.3 the predicate reads the ENVELOPE, which is what goes null on a failed resolve', () => {
  assert.ok(resolveBranch().length > 0);
  const src = read('src/brideIndex.js');
  assert.ok(src.includes('!req.body.MediaContentType0'),
    'the branch stopped reading the synthetic envelope — F-06.85: that field IS the resolve\'s witness');
});

// ═══ §9 — THE CENSUS (R-31.1) · file + count, never file:line ═══════════════
section('§9 · census — the bench enumerates the deed sites itself');

await t('§9.1 every deed site on the circle door assigns a state', () => {
  const src = read('src/brideIndex.js');
  const assigns = (src.match(/deed = \{ kind: DEED\./g) || []).length;
  assert.strictEqual(assigns, 6,
    `expected 6 deed assignments on the circle door — the NOTHING seed plus five sites (saved · save_failed · note_recorded · note_failed · residual ⓷); found ${assigns}. A new deed site landed without a state, or one was removed. First draft of this cell said 5 and forgot the seed: the seed is a site, and an author's list is exactly what R-31.1 forbids a cell to inherit.`);
});

await t('§9.2 the door hands the state to the model and takes it back', () => {
  const src = read('src/brideIndex.js');
  assert.ok(/\n    deed,\n/.test(src), 'the door no longer passes the deed into the turn');
  assert.ok(src.includes('if (result.deed) deed = result.deed;'),
    'the door no longer takes back the deed the loop may have narrowed — a mid-turn refusal is lost');
});

await t('§9.3 exactly one module authors the deed sentences', () => {
  const homes = ['src/brideIndex.js', 'src/agent/circleEngine.js', 'src/agent/circleSystemPrompt.js']
    .filter(rel => read(rel).includes(V6_SAVE_FAILED));
  assert.deepStrictEqual(homes, [],
    `a deed sentence was copied out of deedState.js into: ${homes.join(', ')} — two homes is F-09.172's own disease`);
});

await t('§9.4 W-1 — only the two granted lifts moved', () => {
  const circleSrc = read('src/agent/circleSystemPrompt.js');
  assert.ok(circleSrc.includes('W-1 NARROW LIFT 2'), 'the lift is not named at its site');
  assert.ok(engineSrc.includes(V3_FRAME) && engineSrc.includes(V4_EXAMPLE), 'lift 1\'s bytes are not both present');
  const soul = read('src/agent/miraSoul.js');
  assert.ok(!soul.includes('DEED STATE'), 'the soul file was touched — W-1 is shut outside the two lifts');
});

await t('§9.5 the CAP_BYTES object is byte-untouched by this diff', () => {
  const capSrc = read('src/lib/coupleAiCap.js');
  assert.ok(capSrc.includes(`circle:        "The board's chat is quiet for today — you can still browse and add to it any time.",`));
  assert.ok(capSrc.includes(`bride_daily:   "You've reached today's conversation limit. I'll be right here at midnight.",`));
  assert.ok(capSrc.includes(`bride_monthly: "You've reached this month's conversation limit. I'll be right here on the 1st.",`));
  assert.ok(!capSrc.includes('Saved. '), 'a V8 byte leaked into the frozen 10.C copy home');
  assert.ok(!capSrc.includes('Added to the board.'), 'a V1 byte leaked into the frozen 10.C copy home');
});

// ═══ §10 — THE RESTORE-PROOF IS PART OF THE VERDICT ════════════════════════
section('§10 · restore-proof (CE-32 Ruling 1) — exercised, not asserted');

await t('§10.1 the ledger names a leave-behind AND a deletion by their own shapes', () => {
  const scratch = 'scripts/.b09_d4_scratch.tmp';
  const victim  = 'src/agent/brideNudge.js';       // le3's actual victim, deliberately
  touching(scratch); touching(victim);
  const saved = fs.readFileSync(P(victim));
  fs.writeFileSync(P(scratch), 'leave-behind');
  fs.unlinkSync(P(victim));
  const bad = restoreViolations();
  assert.ok(bad.some(b => /LEFT BEHIND/.test(b)), 'the ledger did not name the leave-behind');
  assert.ok(bad.some(b => /DELETED a path it did not create/.test(b)), 'the ledger did not name the deletion');
  fs.writeFileSync(P(victim), saved);
  fs.unlinkSync(P(scratch));
  assert.deepStrictEqual(restoreViolations(), [], 'the tree was not restored after the exercise');
});

// ── verdict ────────────────────────────────────────────────────────────────
const violations = restoreViolations();
if (violations.length) {
  console.log('\n  RESTORE-PROOF VIOLATIONS (the run is RED regardless of cells):');
  for (const v of violations) console.log(`    · ${v}`);
  fail += violations.length;
}

console.log(`\n════════════════════════════════════════════════════════════════════`);
console.log(`  b09_d4_honestmouth_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log(`════════════════════════════════════════════════════════════════════`);
if (fail === 0) {
  console.log('  GREEN — three outcomes, three bytes, three audit shapes; the eight');
  console.log('  signed strings pinned; the frozen 10.C bytes untouched behind them.');
}
process.exit(fail === 0 ? 0 : 1);

})();
