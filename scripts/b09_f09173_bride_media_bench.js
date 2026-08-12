// scripts/b09_f09173_bride_media_bench.js — B-09H · F-09.173 · THE BRIDE-LANE MEDIA SEAM.
//
// THE DISEASE: a WhatsApp photo could not reach the estate and was eaten silently.
// `metaInputsFrom` hardcoded `mediaContentType: null, mediaUrl: null` for every Meta inbound
// (the M1 gap that outlived Twilio), so BOTH bride-lane media doors — the bride's own
// (brideInbound.js) and the circle member's (brideIndex.js) — read nulls forever. Mehek's
// photograph became `[circle-handler] note captured`, zero pipeline lines, muse_saves untouched.
//
// THE CURE: ONE SEAM. The resolve happens at the webhook (brideIndex.js, the src/index.js
// vendor precedent mirrored) and the result reaches the normalizer as its third argument.
// Both doors read the same two normalized fields, so neither door needed an edit.
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5) — every path below is resolved off __dirname.
//
// BOTH-WAYS DISCIPLINE. Every cell in §3-§6 is reddened by mutating PRODUCTION code, not test
// setup. The mutation table lives in the handover; the sentinel mutations are:
//   · metaInputsFrom returns hardcoded nulls again (the uncured tree)  → §3.1 §4.1 §5.1 §5.3 RED
//   · metaInputsFrom fills mediaUrl but not mediaContentType           → §3.1 §4.1 §5.1 RED
//   · the webhook stops passing the third argument                     → §6.1 RED
//   · resolveBrideMedia rethrows instead of returning null             → §2.3 §2.4 RED
//   · the bride policy drifts off the vendor's                         → §2.5 RED
//   · the circle door's `else if` becomes a second `if` (F5)           → §5.4 RED
//   · metaMedia drops objectPrefix from the object path                → §1.1 RED
//   · resolveVendorMedia starts passing a prefix                       → §1.4 RED
//
// DECLARED LIMIT, NOT PAPERED: `src/brideIndex.js` calls `app.listen()` at module scope and
// cannot be required from a bench without booting a server. Its two media expressions are
// therefore driven by EXTRACTION — cut from the production file on stable code markers and
// evaluated (§5). The extraction FAILS LOUDLY if a marker moves; it is not a grep. The envelope
// those expressions receive is NOT extracted — it is captured from a REAL
// `handleCircleMemberMessage` call driven through the REAL `processBrideInbound` (§4.3).
'use strict';
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.join(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

for (const m of ['../src/lib/metaMedia.js', '../src/lib/brideInbound.js', '../src/lib/vendorInbound.js']) {
  delete require.cache[require.resolve(m)];
}
const { resolveMetaMedia } = require('../src/lib/metaMedia.js');
const {
  processBrideInbound, metaInputsFrom, resolveBrideMedia,
  BRIDE_MEDIA_BUCKET, BRIDE_MEDIA_PREFIX, BRIDE_MEDIA_ALLOW_MIMES, BRIDE_MEDIA_MAX_BYTES,
} = require('../src/lib/brideInbound.js');
const {
  resolveVendorMedia, WA_MEDIA_BUCKET, VENDOR_MEDIA_ALLOW_MIMES, VENDOR_MEDIA_MAX_BYTES,
} = require('../src/lib/vendorInbound.js');
const webhookCore = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

const TOKEN = 'SENTINEL_WABA_TOKEN_NEVER_LOG';

// ── fakes ────────────────────────────────────────────────────────────────────────────────
function fakeFetch(steps) {
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url, opts });
    const step = steps.shift();
    if (!step) throw new Error(`fakeFetch: no scripted response for ${url}`);
    if (step.throw) throw new Error(step.throw);
    return step.res;
  };
  fn.calls = calls;
  return fn;
}
const graphRes = (json, ok = true, status = 200) => ({ ok, status, json: async () => json });
const binRes   = (bytes, ok = true, status = 200) => ({ ok, status, arrayBuffer: async () => new Uint8Array(bytes).buffer });

function fakeStorage() {
  const uploads = [];
  const storage = {
    from: (bucket) => ({
      upload: async (p, bytes, up) => { uploads.push({ bucket, path: p, bytes, up }); return { error: null }; },
      getPublicUrl: (p) => ({ data: { publicUrl: `https://proj.supabase.co/storage/v1/object/public/${bucket}/${p}` } }),
    }),
  };
  return { supabase: { storage }, uploads };
}

// A resolver that succeeds, recording exactly what the adapter passed it.
function spyResolver(out = { stableUrl: 'https://proj.supabase.co/storage/v1/object/public/wa-media/bride/1-uuid.jpg', mime: 'image/jpeg' }) {
  const seen = [];
  const fn = async (args) => { seen.push(args); return { ...out, bytes: Buffer.from('B') }; };
  fn.seen = seen;
  return fn;
}

// ── the faithful in-memory supabase fake (b05_m1b_inbound_bench's shape, reused deliberately:
//    a second hand-rolled fake is a second thing to drift) ─────────────────────────────────
function makeSupabase(perTable) {
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b,
      gte: () => b, lte: () => b, limit: () => b, insert: () => b, update: () => b, delete: () => b,
      maybeSingle: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      single: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (tb) => builder(tb), rpc: () => Promise.resolve({ data: null, error: null }) };
}

const PHONE  = '919625759924';
const USER   = { id: 'u1', phone: '+' + PHONE, name: 'Test Bride' };
const COUPLE = { id: 'c1', user_id: 'u1', wedding_date: null, tier: 'basic' };
const CONVO  = { id: 'conv1', couple_id: 'c1' };

function makeDeps({ sends, saves, circleCalls, circleMember = null }) {
  return {
    supabase: makeSupabase({
      circle_members: () => ({ data: circleMember, error: null }),
      users:          () => ({ data: USER, error: null }),
      couples:        () => ({ data: COUPLE, error: null }),
      conversations:  () => ({ data: CONVO, error: null }),
      messages:       () => ({ data: null, error: null }),
    }),
    anthropic: { messages: { create: async () => ({ content: [{ type: 'text', text: 'x' }], usage: {} }) } },
    sendWhatsApp: async (phone, text, media) => { sends.push({ phone, text, media: media || [] }); return { sid: 'X' }; },
    webhookCore,
    runBrideAgenticTurn: async () => ({ reply: 'ok', mediaUrls: [], toolCalls: null, model: 'haiku', inputTokens: 1, outputTokens: 2, costUsd: 0, costInr: 0, circleSummary: null }),
    surfacePendingCircleSessions: async () => '',
    saveToMuse: async (args) => { saves.push(args); return { ok: true, save: { save_number: 7, surface: 'muse' } }; },
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    handleSurpriseMe: async () => 'surprise',
    handleCircleMemberMessage: async (args) => { circleCalls.push(args); },
    buildCircleGreeting: () => 'greeting',
    extractMuseUrl: () => null,
    buildMediaContextNote: () => 'note',
    DEAD_END_REPLY: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in",
    CIRCLE_TOKEN_REGEX: /^CIRCLE-[A-Z0-9]{6}$/,
  };
}

// A Meta inbound carrying one image, with an optional caption.
const metaPhoto = (caption = '') => ({
  from: PHONE, text: caption, messageId: 'wamid.PHOTO' + Math.random(),
  type: 'image', timestamp: '1', media: [{ id: 'MEDIA_ID_1', mime: 'image/jpeg', kind: 'image' }],
});

const RESOLVED = { stableUrl: 'https://proj.supabase.co/storage/v1/object/public/wa-media/bride/1754-abc.jpg', mime: 'image/jpeg' };

// ── §5's extractor: cut a production expression on a stable CODE marker ───────────────────
// Independent-method law clause 1: the failure mode here is a LOUD throw when a marker moves,
// which differs from the silent-zero failure of a grep.
function extractExpression(rel, marker, endMarker) {
  const src = read(rel);
  const a = src.indexOf(marker);
  if (a < 0) throw new Error(`EXTRACT: marker not found in ${rel} — the cell's subject moved: ${marker}`);
  const b = src.indexOf(endMarker, a);
  if (b < 0) throw new Error(`EXTRACT: end marker not found in ${rel} after ${marker}`);
  const expr = src.slice(a + marker.length, b).trim().replace(/;$/, '');
  if (!expr) throw new Error(`EXTRACT: empty expression in ${rel}`);
  return expr;
}
function evalWith(expr, scope) {
  const keys = Object.keys(scope);
  // eslint-disable-next-line no-new-func
  return new Function(...keys, `return (${expr});`)(...keys.map(k => scope[k]));
}

(async () => {
  console.log('\n── §1 — THE RESOLVER TOOK ONE PARAM (F1: shared bucket, lane folder) ──────────');

  await t('§1.1 objectPrefix files the object under the lane folder', async () => {
    const { supabase, uploads } = fakeStorage();
    const bytes = Buffer.from('JPEG');
    const out = await resolveMetaMedia({
      mediaId: 'M', token: TOKEN, supabase, bucket: 'wa-media', objectPrefix: 'bride/',
      allowMimes: ['image/jpeg'], maxBytes: 5 * 1024 * 1024,
      fetchImpl: fakeFetch([{ res: graphRes({ url: 'https://short', mime_type: 'image/jpeg', file_size: bytes.length }) }, { res: binRes(bytes) }]),
    });
    assert.strictEqual(uploads.length, 1);
    assert.ok(uploads[0].path.startsWith('bride/'), `object path lost its lane folder: ${uploads[0].path}`);
    assert.ok(out.stableUrl.includes('/wa-media/bride/'), `public url lost the lane folder: ${out.stableUrl}`);
  });

  await t('§1.2 DEFAULT prefix is EMPTY — the vendor lane\'s object path is byte-shape-identical', async () => {
    const { supabase, uploads } = fakeStorage();
    const bytes = Buffer.from('JPEG');
    await resolveMetaMedia({
      mediaId: 'M', token: TOKEN, supabase, bucket: 'wa-media',
      allowMimes: ['image/jpeg'], maxBytes: 5 * 1024 * 1024,
      fetchImpl: fakeFetch([{ res: graphRes({ url: 'https://short', mime_type: 'image/jpeg', file_size: bytes.length }) }, { res: binRes(bytes) }]),
    });
    assert.match(uploads[0].path, /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
      `the pre-F-09.173 vendor path shape changed: ${uploads[0].path}`);
  });

  await t('§1.3 the UNGUESSABLE part survives the prefix — a lane folder is not a secret', async () => {
    const { supabase, uploads } = fakeStorage();
    const bytes = Buffer.from('JPEG');
    await resolveMetaMedia({
      mediaId: 'M', token: TOKEN, supabase, bucket: 'wa-media', objectPrefix: 'bride/',
      allowMimes: ['image/jpeg'], maxBytes: 5 * 1024 * 1024,
      fetchImpl: fakeFetch([{ res: graphRes({ url: 'https://short', mime_type: 'image/jpeg', file_size: bytes.length }) }, { res: binRes(bytes) }]),
    });
    assert.match(uploads[0].path, /^bride\/\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/);
  });

  await t('§1.4 the VENDOR adapter passes NO prefix — this sitting did not move another lane', async () => {
    const src = read('src/lib/vendorInbound.js');
    const i = src.indexOf('async function resolveVendorMedia');
    assert.ok(i > 0, 'resolveVendorMedia moved');
    const body = src.slice(i, i + 900);
    assert.ok(!/objectPrefix/.test(body), 'the vendor adapter started passing an object prefix — its stored objects would move');
  });

  console.log('\n── §2 — THE BRIDE ADAPTER (F2 token, F3 policy) ───────────────────────────────');

  await t('§2.1 success → { stableUrl, mime }, and the lane policy is what it passes', async () => {
    const r = spyResolver();
    const out = await resolveBrideMedia({ id: 'M1', mime: 'image/jpeg' }, { resolveMetaMedia: r, supabase: {} });
    assert.strictEqual(out.mime, 'image/jpeg');
    assert.ok(out.stableUrl);
    const passed = r.seen[0];
    assert.strictEqual(passed.bucket, 'wa-media');
    assert.strictEqual(passed.objectPrefix, 'bride/');
    assert.strictEqual(passed.maxBytes, 5 * 1024 * 1024);
    assert.deepStrictEqual(passed.allowMimes, ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  });

  await t('§2.2 no media item / no id → null, no resolver call', async () => {
    const r = spyResolver();
    assert.strictEqual(await resolveBrideMedia(null, { resolveMetaMedia: r, supabase: {} }), null);
    assert.strictEqual(await resolveBrideMedia({ mime: 'image/jpeg' }, { resolveMetaMedia: r, supabase: {} }), null);
    assert.strictEqual(r.seen.length, 0, 'the adapter called the resolver with nothing to resolve');
  });

  await t('§2.3 resolver throws → null + a TYPED, READABLE log line (never silence)', async () => {
    const lines = [];
    const orig = console.log; console.log = (...a) => lines.push(a.join(' '));
    let out;
    try {
      out = await resolveBrideMedia({ id: 'M9', mime: 'image/jpeg' },
        { resolveMetaMedia: async () => { throw new Error('metaMedia: mime not allowed (image/heic)'); }, supabase: {} });
    } finally { console.log = orig; }
    assert.strictEqual(out, null, 'a failed resolve must degrade to text-only, never throw into the turn');
    const line = lines.find(l => l.includes('[meta-media]'));
    assert.ok(line, 'F-09.173 was a NIGHT of diagnosis over a lane that never said a word — the refusal must log');
    assert.ok(line.includes('reason='), 'the log line names no reason');
    assert.ok(line.includes('M9'), 'the log line names no mediaId');
  });

  await t('§2.4 F2: an ABSENT token is a first-class typed state — null, not a crash', async () => {
    const saved = process.env.META_WABA_TOKEN;
    delete process.env.META_WABA_TOKEN;
    const lines = [];
    const orig = console.log; console.log = (...a) => lines.push(a.join(' '));
    let out;
    try {
      // the REAL resolver, so the real 'token required' throw is what we degrade from
      out = await resolveBrideMedia({ id: 'M0', mime: 'image/jpeg' }, { resolveMetaMedia, supabase: {} });
    } finally { console.log = orig; if (saved !== undefined) process.env.META_WABA_TOKEN = saved; }
    assert.strictEqual(out, null, 'an absent token must cost a text-only turn, never a dead one');
    assert.ok(lines.some(l => l.includes('[meta-media]') && /token/i.test(l)), 'the absent token did not name itself in the log');
  });

  await t('§2.5 F3: the bride policy MIRRORS the vendor\'s verbatim, in separate bindings', async () => {
    assert.deepStrictEqual(BRIDE_MEDIA_ALLOW_MIMES, VENDOR_MEDIA_ALLOW_MIMES, 'the lane allowlists drifted');
    assert.strictEqual(BRIDE_MEDIA_MAX_BYTES, VENDOR_MEDIA_MAX_BYTES, 'the lane size caps drifted');
    assert.notStrictEqual(BRIDE_MEDIA_ALLOW_MIMES, VENDOR_MEDIA_ALLOW_MIMES,
      'the two lanes share ONE array object — a vendor-lane edit would silently move the bride lane');
  });

  await t('§2.6 F1: one bucket, shared with the vendor lane', async () => {
    assert.strictEqual(BRIDE_MEDIA_BUCKET, WA_MEDIA_BUCKET);
    assert.strictEqual(BRIDE_MEDIA_PREFIX, 'bride/');
  });

  await t('§2.7 the token is REFERENCED, never printed', async () => {
    const src = read('src/lib/brideInbound.js');
    const i = src.indexOf('async function resolveBrideMedia');
    const body = src.slice(i, i + 1400);
    assert.ok(/process\.env\.META_WABA_TOKEN/.test(body), 'the adapter stopped reading the token from env');
    assert.ok(!/console\.[a-z]+\([^)]*META_WABA_TOKEN/.test(src), 'a live credential reached a log statement');
    assert.ok(!/console\.[a-z]+\([^)]*\btoken\b/.test(body), 'the adapter logs a token variable');
  });

  console.log('\n── §3 — THE SEAM: metaInputsFrom (this is the cure) ───────────────────────────');

  await t('§3.1 resolved → BOTH fields filled (url AND type — a url alone leaves both doors shut)', async () => {
    const inputs = metaInputsFrom(metaPhoto('look at this'), { entry: [] }, RESOLVED);
    assert.strictEqual(inputs.mediaUrl, RESOLVED.stableUrl, 'the stable url did not reach the doors');
    assert.strictEqual(inputs.mediaContentType, 'image/jpeg',
      'mediaContentType is still null — BOTH bride doors branch on it, so a url without a type is the uncured tree');
  });

  await t('§3.2 unresolved → both null, i.e. exactly the pre-cure behaviour (never a dead turn)', async () => {
    const inputs = metaInputsFrom(metaPhoto('x'), { entry: [] }, null);
    assert.strictEqual(inputs.mediaUrl, null);
    assert.strictEqual(inputs.mediaContentType, null);
    assert.strictEqual(inputs.hasMedia, true, 'a failed resolve must not erase the fact that media arrived');
  });

  await t('§3.3 the third arg is OPTIONAL — a caller that predates it still gets today\'s behaviour', async () => {
    const inputs = metaInputsFrom(metaPhoto('x'), { entry: [] });
    assert.strictEqual(inputs.mediaUrl, null);
    assert.strictEqual(inputs.mediaContentType, null);
  });

  await t('§3.4 resolution does not touch the counts, the phone, or the wamid', async () => {
    const msg = metaPhoto('cap');
    const a = metaInputsFrom(msg, { entry: [] }, null);
    const b = metaInputsFrom(msg, { entry: [] }, RESOLVED);
    for (const k of ['phone', 'body', 'trimmedBody', 'numMedia', 'hasMedia', 'messageId', 'sidForPersist']) {
      assert.deepStrictEqual(a[k], b[k], `resolution moved ${k}`);
    }
    assert.strictEqual(a.phone, '+' + PHONE, 'the +E164 normalization broke');
  });

  console.log('\n── §4 — DOOR 1: THE BRIDE\'S OWN, driven through the REAL processBrideInbound ──');

  await t('§4.1 CURED: her photo reaches the pipeline with the stable url', async () => {
    const sends = [], saves = [], circleCalls = [];
    webhookCore._resetSidLru && webhookCore._resetSidLru();
    await processBrideInbound(
      metaInputsFrom(metaPhoto('the mandap'), { entry: [] }, RESOLVED),
      makeDeps({ sends, saves, circleCalls }));
    assert.strictEqual(saves.length, 1, 'the bride door did not reach saveToMuse — the photo was eaten');
    assert.strictEqual(saves[0].sourceUrl, RESOLVED.stableUrl);
    assert.strictEqual(saves[0].saved_by_role, 'bride');
    assert.strictEqual(saves[0].caption, 'the mandap', 'her caption did not ride the save');
  });

  await t('§4.2 UNCURED SHAPE: unresolved media reaches no pipeline (the disease, pinned)', async () => {
    const sends = [], saves = [], circleCalls = [];
    webhookCore._resetSidLru && webhookCore._resetSidLru();
    await processBrideInbound(
      metaInputsFrom(metaPhoto('the mandap'), { entry: [] }, null),
      makeDeps({ sends, saves, circleCalls }));
    assert.strictEqual(saves.length, 0,
      'with no resolved media the pipeline must NOT run — if this cell is green only because the door ignores type, §4.1 is vacuous');
  });

  await t('§4.3 DOOR 2\'s ENVELOPE, captured from a REAL circle-routed call', async () => {
    const sends = [], saves = [], circleCalls = [];
    webhookCore._resetSidLru && webhookCore._resetSidLru();
    await processBrideInbound(
      metaInputsFrom(metaPhoto('for her board'), { entry: [] }, RESOLVED),
      makeDeps({ sends, saves, circleCalls, circleMember: { id: 'cm1', couple_id: 'c1', invitee_name: 'Mehek', role: 'family', status: 'active', invitee_phone: '+' + PHONE } }));
    assert.strictEqual(circleCalls.length, 1, 'the circle member was not routed to the circle door');
    const env = circleCalls[0].req.body;
    assert.strictEqual(env.MediaContentType0, 'image/jpeg', 'the circle door was handed a null type — F-09.173 alive');
    assert.strictEqual(env.MediaUrl0, RESOLVED.stableUrl, 'the circle door was handed a null url — F-09.173 alive');
    assert.strictEqual(circleCalls[0].hasMedia, true);
  });

  await t('§4.4 …and UNRESOLVED hands the circle door the nulls it used to always get', async () => {
    const sends = [], saves = [], circleCalls = [];
    webhookCore._resetSidLru && webhookCore._resetSidLru();
    await processBrideInbound(
      metaInputsFrom(metaPhoto('for her board'), { entry: [] }, null),
      makeDeps({ sends, saves, circleCalls, circleMember: { id: 'cm1', couple_id: 'c1', invitee_name: 'Mehek', role: 'family', status: 'active', invitee_phone: '+' + PHONE } }));
    assert.strictEqual(circleCalls[0].req.body.MediaContentType0, null);
    assert.strictEqual(circleCalls[0].req.body.MediaUrl0, null);
  });

  console.log('\n── §5 — DOOR 2: THE CIRCLE MEMBER\'S, by extraction (declared limit at the head) ─');

  const CIRCLE_DETECT = extractExpression('src/brideIndex.js', '  const isMediaOrLink =', '\n\n');
  const CIRCLE_SOURCE = extractExpression('src/brideIndex.js', '\n      sourceUrlForMuse = ', ';');

  await t('§5.1 CURED: the circle door SEES the photo (its own expression, resolved envelope)', async () => {
    const scope = {
      hasMedia: true,
      req: { body: { MediaContentType0: 'image/jpeg', MediaUrl0: RESOLVED.stableUrl } },
      trimmedBody: 'for her board',
      extractMuseUrl: () => null,
    };
    assert.strictEqual(evalWith(CIRCLE_DETECT, scope), true,
      'the circle door still cannot see a resolved Meta photo');
  });

  await t('§5.2 UNCURED: the same expression over the nulls is FALSE — the disease, pinned', async () => {
    const scope = {
      hasMedia: true,
      req: { body: { MediaContentType0: null, MediaUrl0: null } },
      trimmedBody: 'for her board',
      extractMuseUrl: () => null,
    };
    assert.strictEqual(evalWith(CIRCLE_DETECT, scope), false,
      'if this is true, §5.1 proves nothing — the cell would be green on the uncured tree too');
  });

  await t('§5.3 the circle door\'s save source IS the normalized url, both ways', async () => {
    // The production expression itself, cut from the file and run. Its first draft here
    // asserted `X || true` and was VACUOUS — caught in this bench's own first run and
    // rewritten rather than left green. A cell that cannot fail is not a cell.
    assert.strictEqual(
      evalWith(CIRCLE_SOURCE, { req: { body: { MediaUrl0: RESOLVED.stableUrl } } }),
      RESOLVED.stableUrl,
      'the circle door no longer sources the save from the normalized url');
    assert.strictEqual(
      evalWith(CIRCLE_SOURCE, { req: { body: { MediaUrl0: null } } }),
      null,
      'the expression is not reading the envelope at all');
  });

  await t('§5.4 F5: ONE ACT, ONE ROW — the note branch is an `else if`, never a second `if`', async () => {
    const src = read('src/brideIndex.js');
    const i = src.indexOf('  if (isMediaOrLink) {');
    assert.ok(i > 0, 'the circle door\'s media branch moved');
    const after = src.slice(i);
    const noteAt = after.indexOf('circle_activity');
    assert.ok(noteAt > 0, 'the note branch moved');
    const between = after.slice(0, noteAt);
    assert.ok(/}\s*else if \(trimmedBody && trimmedBody\.length > 0\) \{/.test(between),
      'F5 BROKEN: a captioned photo would now write BOTH a save and a note for one act');
  });

  await t('§5.5 the F-06.85 vestige note stands where the envelope is built', async () => {
    const src = read('src/lib/brideInbound.js');
    assert.ok(/F-06\.85 MECHANISM NOTE[\s\S]{0,700}VESTIGE/.test(src),
      'the Twilio-shaped envelope lost the comment naming it a kept vestige (F4)');
    assert.ok(/MediaContentType0.*mediaContentType/.test(src), 'the envelope stopped carrying the normalized type');
  });

  console.log('\n── §6 — THE WEBHOOK: the vendor precedent, mirrored ───────────────────────────');

  await t('§6.1 the bride webhook RESOLVES before building inputs and passes the third arg', async () => {
    const src = read('src/brideIndex.js');
    assert.ok(/resolveBrideMedia\(mediaItem, \{ resolveMetaMedia, supabase \}\)/.test(src),
      'the bride webhook does not call the adapter on the vendor precedent\'s shape');
    const call = src.match(/metaInputsFrom\(msg, req\.body([^)]*)\)/);
    assert.ok(call, 'metaInputsFrom call site moved');
    assert.ok(/resolvedMedia/.test(call[1]), 'the webhook builds inputs WITHOUT the resolved media — the seam is dead');
    const iResolve = src.indexOf('await resolveBrideMedia');
    const iInputs  = src.indexOf('metaInputsFrom(msg, req.body');
    assert.ok(iResolve > 0 && iResolve < iInputs, 'the resolve must happen BEFORE inputs are built');
  });

  await t('§6.2 the normalizer stayed SYNCHRONOUS and pure (the precedent\'s whole point)', async () => {
    const src = read('src/lib/brideInbound.js');
    assert.ok(/\nfunction metaInputsFrom\(msg, rawBody, resolvedMedia\) \{/.test(src),
      'metaInputsFrom went async or lost its third arg — the vendor precedent keeps it pure');
  });

  await t('§6.3 FIRST ITEM ONLY, matching the vendor lane (multi-image arrives as N inbounds)', async () => {
    const bride  = read('src/brideIndex.js');
    const vendor = read('src/index.js');
    for (const [name, src] of [['bride', bride], ['vendor', vendor]]) {
      assert.ok(/Array\.isArray\(msg\.media\) && msg\.media\[0\]/.test(src), `${name} lane stopped taking the first media item`);
    }
  });

  console.log('\n──────────────────────────────────────────────────────────────────');
  const total = pass + fail;
  console.log(`b09_f09173_bride_media_bench: ${pass} passed, ${fail} failed  (total ${total})`);
  if (fail === 0) {
    console.log('   GREEN — the seam is filled, both doors see, and the vendor lane did not move.');
  } else {
    console.log('   RED');
  }
  process.exit(fail === 0 ? 0 : 1);
})();
