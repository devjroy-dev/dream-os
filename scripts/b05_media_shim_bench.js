// scripts/b05_media_shim_bench.js — TDW_05 MEDIA-SHIM bench (Shape A, CE-ruled eighth chair).
// Proves Meta media inbound now reaches the vendor OCR/media branches with a STABLE url, plus the
// F-05.14 media-only fallback cure. Non-vacuous BOTH WAYS: the media-gate axis is exercised with a
// resolved url (OCR fires, stable url persists to both audit columns) AND a null url (OCR skipped,
// text-only :182 line, never a dead turn). The physical mutation run (cures reverted -> RED) is a
// disclosed companion step in the handover; the in-bench guards below pin the same contracts.
//
// PROOFS:
//   A. resolver (metaMedia.js): two-step Bearer resolve -> re-host -> { stableUrl, bytes, mime };
//      mime allowlist; size cap (declared + downloaded); token never logged (source scan).
//   B. vendor adapter (resolveVendorMedia): success -> {stableUrl,mime}; failure -> null + typed log;
//      no media -> null.
//   C. metaInputsFrom: resolved -> mediaUrl=stableUrl; null -> mediaUrl=null (text-only).
//   D. shared core integration: onboarded vendor + Meta media -> OCR fires, image_url=stableUrl,
//      source_image_url=stableUrl, messages.media_url=stableUrl. Both-ways: null url -> OCR skipped.
//   E. F-05.14: media-only inbound over the REAL core -> the :182 line EXACTLY, not GRACEFUL_TURN_LINE.
//   F. Vision downloader auth-by-host: Twilio host -> Basic; Supabase host -> plain GET (no auth).
'use strict';
const assert = require('assert');
const fs = require('fs');

delete require.cache[require.resolve('../src/lib/metaMedia.js')];
delete require.cache[require.resolve('../src/lib/vendorInbound.js')];
delete require.cache[require.resolve('../src/lib/vendorCalendarImage.js')];
const { resolveMetaMedia } = require('../src/lib/metaMedia.js');
const { processVendorInbound, metaInputsFrom, resolveVendorMedia, WA_MEDIA_BUCKET } = require('../src/lib/vendorInbound.js');
const { downloadMedia } = require('../src/lib/vendorCalendarImage.js');
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

function fakeStorage({ uploadError = null } = {}) {
  const uploads = [];
  const storage = {
    from: (bucket) => ({
      upload: async (path, bytes, up) => { uploads.push({ bucket, path, bytes, up }); return { error: uploadError }; },
      getPublicUrl: (path) => ({ data: { publicUrl: `https://proj.supabase.co/storage/v1/object/public/${bucket}/${path}` } }),
    }),
  };
  return { supabase: { storage }, uploads };
}

const IMG_ALLOW = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const CAP_5MB   = 5 * 1024 * 1024;

(async () => {
  console.log('\n── A. resolver (metaMedia.js) ──────────────────────────────────────────');

  await t('resolve: two-step Bearer -> re-host -> {stableUrl,bytes,mime}', async () => {
    const bytes = Buffer.from('CALENDAR_JPEG_BYTES');
    const fetchImpl = fakeFetch([
      { res: graphRes({ url: 'https://lookaside.fbsbx.com/short-lived?token=x', mime_type: 'image/jpeg', file_size: bytes.length }) },
      { res: binRes(bytes) },
    ]);
    const { supabase, uploads } = fakeStorage();
    const out = await resolveMetaMedia({
      mediaId: 'MEDIA_123', mime: 'image/jpeg', token: TOKEN,
      supabase, bucket: 'wa-media', allowMimes: IMG_ALLOW, maxBytes: CAP_5MB, fetchImpl,
    });
    // graph GET shape + Bearer
    assert.ok(fetchImpl.calls[0].url === 'https://graph.facebook.com/v21.0/MEDIA_123', 'graph url v21.0/<id>');
    assert.strictEqual(fetchImpl.calls[0].opts.headers.Authorization, `Bearer ${TOKEN}`, 'graph GET Bearer');
    // bin GET carries Bearer too (Meta short url is authorized)
    assert.strictEqual(fetchImpl.calls[1].opts.headers.Authorization, `Bearer ${TOKEN}`, 'bin GET Bearer');
    // upload got the bytes + contentType, unguessable path, correct bucket
    assert.strictEqual(uploads.length, 1, 'one upload');
    assert.strictEqual(uploads[0].bucket, 'wa-media', 'bucket wa-media');
    assert.ok(Buffer.compare(uploads[0].bytes, bytes) === 0, 'uploaded exact bytes');
    assert.strictEqual(uploads[0].up.contentType, 'image/jpeg', 'upload contentType');
    assert.ok(/^\d+-[0-9a-f-]{36}\.jpg$/.test(uploads[0].path), 'unguessable path w/ uuid + ext');
    // return contract
    assert.ok(out.stableUrl.endsWith(`/wa-media/${uploads[0].path}`), 'stableUrl is the public url');
    assert.strictEqual(out.mime, 'image/jpeg', 'returned mime');
    assert.ok(Buffer.isBuffer(out.bytes) && out.bytes.length === bytes.length, 'returned bytes');
  });

  await t('resolve: disallowed mime -> throws, no download', async () => {
    const fetchImpl = fakeFetch([{ res: graphRes({ url: 'https://x/short', mime_type: 'application/pdf', file_size: 10 }) }]);
    const { supabase, uploads } = fakeStorage();
    await assert.rejects(
      () => resolveMetaMedia({ mediaId: 'M', token: TOKEN, supabase, bucket: 'wa-media', allowMimes: IMG_ALLOW, maxBytes: CAP_5MB, fetchImpl }),
      /mime not allowed/,
    );
    assert.strictEqual(fetchImpl.calls.length, 1, 'stopped after graph GET (no bin download)');
    assert.strictEqual(uploads.length, 0, 'no upload on disallowed mime');
  });

  await t('resolve: declared size over cap -> throws pre-download', async () => {
    const fetchImpl = fakeFetch([{ res: graphRes({ url: 'https://x/short', mime_type: 'image/jpeg', file_size: CAP_5MB + 1 }) }]);
    const { supabase } = fakeStorage();
    await assert.rejects(
      () => resolveMetaMedia({ mediaId: 'M', token: TOKEN, supabase, bucket: 'wa-media', allowMimes: IMG_ALLOW, maxBytes: CAP_5MB, fetchImpl }),
      /over size cap \(declared/,
    );
    assert.strictEqual(fetchImpl.calls.length, 1, 'no download attempted');
  });

  await t('resolve: downloaded bytes over cap (absent file_size) -> throws', async () => {
    const big = Buffer.alloc(CAP_5MB + 8, 1);
    const fetchImpl = fakeFetch([
      { res: graphRes({ url: 'https://x/short', mime_type: 'image/jpeg' }) }, // no file_size
      { res: binRes(big) },
    ]);
    const { supabase, uploads } = fakeStorage();
    await assert.rejects(
      () => resolveMetaMedia({ mediaId: 'M', token: TOKEN, supabase, bucket: 'wa-media', allowMimes: IMG_ALLOW, maxBytes: CAP_5MB, fetchImpl }),
      /over size cap \(downloaded/,
    );
    assert.strictEqual(uploads.length, 0, 'no upload on oversize download');
  });

  await t('resolve: token is NEVER logged (source scan — zero console.* in metaMedia.js)', async () => {
    const src = fs.readFileSync(require.resolve('../src/lib/metaMedia.js'), 'utf8');
    assert.ok(!/console\./.test(src), 'metaMedia.js contains no console.* (token cannot leak to logs)');
  });

  console.log('\n── B. vendor adapter (resolveVendorMedia) ──────────────────────────────');

  await t('adapter: success -> {stableUrl, mime}', async () => {
    const injected = async (args) => {
      assert.strictEqual(args.bucket, WA_MEDIA_BUCKET, 'adapter passes wa-media bucket');
      assert.deepStrictEqual(args.allowMimes, IMG_ALLOW, 'adapter passes image allowlist');
      assert.strictEqual(args.maxBytes, CAP_5MB, 'adapter passes 5MB cap');
      return { stableUrl: 'https://proj.supabase.co/storage/v1/object/public/wa-media/z.jpg', bytes: Buffer.from('x'), mime: 'image/jpeg' };
    };
    const out = await resolveVendorMedia({ id: 'M1', mime: 'image/jpeg' }, { resolveMetaMedia: injected, supabase: {} });
    assert.strictEqual(out.stableUrl, 'https://proj.supabase.co/storage/v1/object/public/wa-media/z.jpg');
    assert.strictEqual(out.mime, 'image/jpeg');
  });

  await t('adapter: resolver throws -> null + typed [meta-media] log (never a dead turn)', async () => {
    const logs = [];
    const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
    let out;
    try {
      const injected = async () => { throw new Error('graph media GET failed (401)'); };
      out = await resolveVendorMedia({ id: 'M2', mime: 'image/jpeg' }, { resolveMetaMedia: injected, supabase: {} });
    } finally { console.log = orig; }
    assert.strictEqual(out, null, 'returns null on failure');
    assert.ok(logs.some((l) => /\[meta-media\] resolve failed reason=graph media GET failed \(401\) mediaId=M2/.test(l)), 'typed failure log with reason + mediaId');
    assert.ok(!logs.some((l) => l.includes(TOKEN)), 'token never appears in logs');
  });

  await t('adapter: no media item -> null', async () => {
    assert.strictEqual(await resolveVendorMedia(null, { resolveMetaMedia: async () => ({}), supabase: {} }), null);
    assert.strictEqual(await resolveVendorMedia({ mime: 'image/jpeg' }, { resolveMetaMedia: async () => ({}), supabase: {} }), null, 'no id -> null');
  });

  console.log('\n── C. metaInputsFrom wiring ────────────────────────────────────────────');

  await t('metaInputsFrom: resolved -> mediaUrl=stableUrl ; null -> mediaUrl=null', async () => {
    const msg = { from: '919', text: '', media: [{ id: 'M', mime: 'image/jpeg' }] };
    const withMedia = metaInputsFrom(msg, {}, { stableUrl: 'https://s/u.jpg', mime: 'image/jpeg' });
    assert.strictEqual(withMedia.mediaUrl, 'https://s/u.jpg', 'resolved -> stable url');
    assert.strictEqual(withMedia.hasMedia, true, 'hasMedia true');
    const without = metaInputsFrom(msg, {}, null);
    assert.strictEqual(without.mediaUrl, null, 'null resolve -> text-only (mediaUrl null)');
  });

  console.log('\n── D. shared-core integration (OCR fires + stable url persists) ────────');

  // capturing supabase fake reaching the real OCR branch
  function makeCapturing({ user, vendor, convoId }) {
    const captured = { proposals: [], messages: [], extractCalls: [] };
    function builder(table) {
      const b = {
        select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b, is: () => b,
        gte: () => b, lte: () => b, limit: () => b, update: () => b, delete: () => b,
        insert: (payload) => {
          if (table === 'pending_event_proposals') captured.proposals.push(payload);
          if (table === 'messages') captured.messages.push(payload);
          return b;
        },
        maybeSingle: () => {
          if (table === 'users')         return Promise.resolve({ data: user, error: null });
          if (table === 'vendors')       return Promise.resolve({ data: vendor, error: null });
          if (table === 'conversations') return Promise.resolve({ data: { id: convoId }, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        single: () => {
          if (table === 'pending_event_proposals') return Promise.resolve({ data: { id: 'prop_1' }, error: null });
          if (table === 'users')                   return Promise.resolve({ data: user, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
      };
      return b;
    }
    return { supabase: { from: (t) => builder(t), schema: () => ({ from: (t) => builder(t) }) }, captured };
  }

  const VENDOR = { id: 'vend1', user_id: 'u1', onboarding_state: 'complete' };
  const STABLE = 'https://proj.supabase.co/storage/v1/object/public/wa-media/1700-abc.jpg';

  function depsFor(captured, sent) {
    return {
      checkImageThrottle: async () => ({ allowed: true }),
      markRejectionSent:  async () => {},
      extractCalendarFromImage: async ({ image_url }) => { captured.extractCalls.push(image_url); return { proposals: [{ title: 'Shoot', event_date: '2026-12-14', kind: 'shoot' }] }; },
      sendWhatsApp: async (phone, msg) => { sent.push(msg); return { sid: 'SM1' }; },
      anthropic: {}, webhookCore,
    };
  }

  await t('CURED: Meta media (stableUrl) -> OCR fires; source_image_url & messages.media_url = stableUrl', async () => {
    const { supabase, captured } = makeCapturing({ user: { id: 'u1' }, vendor: VENDOR, convoId: 'c1' });
    const sent = [];
    const deps = { ...depsFor(captured, sent), supabase };
    const inputs = metaInputsFrom({ from: '918757788550', text: '', media: [{ id: 'M', mime: 'image/jpeg' }] }, {}, { stableUrl: STABLE, mime: 'image/jpeg' });
    await processVendorInbound(inputs, deps);
    assert.deepStrictEqual(captured.extractCalls, [STABLE], 'extractCalendarFromImage got the stable url as image_url');
    assert.strictEqual(captured.proposals[0].source_image_url, STABLE, 'pending_event_proposals.source_image_url = stableUrl');
    // ══ LABELED AMENDMENT · F-05.55 / CE R2 · COUNT PRESERVED (14), zero cells added ══
    // THE BOTH-SIDES CLAUSE (CE-59). This cell read `captured.messages[0].find(...)`,
    // which encoded the media branch's OLD contract: ONE insert carrying an ARRAY of two
    // rows, written after the OCR. F-05.55's cure splits that pair — the inbound half is
    // now a GUARD ROW written at branch entry, its own insert, before the Vision call —
    // so `messages[0]` is an object and `.find` was a TypeError waiting on apply.
    // RE-AIMED at the NEW caller's payload, and the old shape's green is RETIRED, not
    // retained: this asserts the split explicitly rather than tolerating either form,
    // because a green over a shape nobody sends is indistinguishable from no test at all.
    // The media_shim property under test is unchanged — the stable url still reaches
    // messages.media_url. Its durable-dedupe siblings live in b05_f0555_media_dedupe_bench.
    assert.strictEqual(captured.messages.length, 2, 'the cure ships TWO inserts: guard row, then outbound');
    const inboundRow = captured.messages[0];
    assert.strictEqual(inboundRow.direction, 'inbound', 'the FIRST write is the inbound guard row');
    assert.strictEqual(inboundRow.media_url, STABLE, 'messages.media_url = stableUrl');
    assert.ok(sent.some((m) => /I found 1 event/.test(m)), 'preview sent');
  });

  await t('BOTH-WAYS: null url (resolve failed) -> OCR skipped (extract NOT called)', async () => {
    const { supabase, captured } = makeCapturing({ user: { id: 'u1' }, vendor: VENDOR, convoId: 'c1' });
    const sent = [];
    const deps = { ...depsFor(captured, sent), supabase };
    const inputs = metaInputsFrom({ from: '918757788550', text: '', media: [{ id: 'M', mime: 'image/jpeg' }] }, {}, null);
    await processVendorInbound(inputs, deps);
    assert.deepStrictEqual(captured.extractCalls, [], 'OCR branch skipped when mediaUrl null');
    assert.strictEqual(captured.proposals.length, 0, 'no proposal persisted');
  });

  console.log('\n── E. F-05.14 media-only fallback (the :182 line, not GRACEFUL_TURN_LINE) ──');

  const LINE_182 = "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help.";

  await t('F-05.14: media-only, no caption -> :182 line exactly (no ReferenceError -> no GRACEFUL_TURN_LINE)', async () => {
    const { supabase, captured } = makeCapturing({ user: { id: 'u1' }, vendor: VENDOR, convoId: 'c1' });
    const sent = [];
    const deps = { ...depsFor(captured, sent), supabase };
    // media-only: hasMedia true, no caption, mediaUrl null (resolve absent/failed)
    const inputs = metaInputsFrom({ from: '918757788550', text: '', media: [{ id: 'M', mime: 'image/jpeg' }] }, {}, null);
    await processVendorInbound(inputs, deps);
    assert.ok(sent.includes(LINE_182), 'sent the :182 media-only line');
    assert.ok(!sent.includes(webhookCore.GRACEFUL_TURN_LINE), 'did NOT crash into GRACEFUL_TURN_LINE');
  });

  console.log('\n── F. Vision downloader auth-by-host ───────────────────────────────────');

  async function callDownloadWith(url, envTwilio) {
    const savedFetch = global.fetch;
    const savedSid = process.env.TWILIO_ACCOUNT_SID, savedTok = process.env.TWILIO_AUTH_TOKEN;
    if (envTwilio) { process.env.TWILIO_ACCOUNT_SID = 'ACxxx'; process.env.TWILIO_AUTH_TOKEN = 'tok'; }
    let seenHeaders = null;
    global.fetch = async (u, opts) => {
      seenHeaders = opts.headers || {};
      return { ok: true, status: 200, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array(Buffer.from('x')).buffer };
    };
    try { await downloadMedia(url); } finally {
      global.fetch = savedFetch;
      process.env.TWILIO_ACCOUNT_SID = savedSid; process.env.TWILIO_AUTH_TOKEN = savedTok;
    }
    return seenHeaders;
  }

  await t('downloadMedia: Twilio host -> Basic auth header', async () => {
    const h = await callDownloadWith('https://api.twilio.com/2010-04-01/Accounts/AC/Messages/MM/Media/ME', true);
    assert.ok(h.Authorization && h.Authorization.startsWith('Basic '), 'Twilio url gets Basic auth');
  });

  await t('downloadMedia: Supabase host -> plain GET (no auth header)', async () => {
    const h = await callDownloadWith('https://proj.supabase.co/storage/v1/object/public/wa-media/x.jpg', true);
    assert.ok(!h.Authorization, 'non-Twilio url carries no Authorization header');
  });

  console.log(`\nb05_media_shim_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — Meta media -> OCR/media branches with a STABLE url · guardrails · F-05.14 · auth-by-host. Live witness is the founder\'s.');
  process.exit(fail === 0 ? 0 : 1);
})();
