// scripts/b09_d3_structural_bench.js — B-09H · D-3 · THE STRUCTURAL HALF.
//
// SIX CURES, CE-32-RULED, BUILT THIS SITTING:
//   F-05.79  the Meta normalizer discarded image captions       (fork c-2 + the ruled bodyForLog sub-fork)
//   F-09.178 messages.media_url null on [image] inbounds        (fork b: SYMMETRY with the vendor lane)
//   F-09.178 (b′) the circle member's row, same disease         (narrow radius into brideIndex.js)
//   F-09.179 one warn for two opposite facts                    (fork d: the log honesty split)
//
// NOT IN THIS BENCH, AND SAYING SO IS THE POINT: F-09.171 (the marker), F-09.175 (/surprise
// sends the raw system note) and F-09.176 (the stale injection narrative) are the (a)-CLUSTER
// and are HELD UNRULED by CE-32 — the marker limb cannot be cured until duty (a)'s body is
// relayed, because `execListMuse`'s playback channel reads that marker out of history and
// dies with it. Three of nine items are absent BY RULING, never by omission.
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5) — every path resolved off __dirname.
//
// BOTH-WAYS DISCIPLINE (non-vacuous, production mutation only — never test setup). The
// mutation table lives in the handover; the sentinel mutations are:
//   · _messageMedia drops `caption` from the descriptor (the uncured tree) → §1.1 §2.1 §3.4 RED
//   · metaInputsFrom stops surfacing mediaCaption                          → §1.4 §2.1 §3.4 RED
//   · the caption is promoted into _messageText (the REJECTED arm c-1)     → §1.3 §1.5 §2.4 RED
//   · sourceCaption stops reading mediaCaption                             → §2.1 RED
//   · bodyForLog stops preferring the caption                              → §3.4 RED
//   · the bride inbound row drops media_url (the uncured tree)             → §3.1 §3.3 RED
//   · the bride row writes an object path instead of the stable url        → §3.3 RED
//   · the circle row drops media_url (the uncured tree, b′)                → §4.1 RED
//   · the .179 split collapses back to one warn line                       → §5.1 §5.2 §5.3 RED
//   · the .179 EMPTY branch stops defaulting to muse (behaviour guard)     → §5.4 RED
//
// DECLARED LIMIT, NOT PAPERED: `src/brideIndex.js` calls `app.listen()` at module scope and
// cannot be required from a bench without booting a server. §4 therefore CUTS the production
// insert object on stable code markers and EVALUATES it. The extractor THROWS LOUDLY when a
// marker moves — a failure mode that differs from a grep's silent zero (independent-method
// law, clause 1). §4.2 proves the extraction has teeth by driving the opposite fact.
'use strict';
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

for (const m of ['../src/lib/metaInbound.js', '../src/lib/brideInbound.js', '../src/lib/vendorInbound.js', '../src/lib/imageOCRRouter.js']) {
  delete require.cache[require.resolve(m)];
}
const metaInbound  = require('../src/lib/metaInbound.js');
const brideInbound = require('../src/lib/brideInbound.js');
const vendorInbound = require('../src/lib/vendorInbound.js');
const imageOCRRouter = require('../src/lib/imageOCRRouter.js');
const webhookCore  = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0, skipped = 0;
const skipReasons = [];
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function skip(name, reason) {
  console.log(`  SKIP ${name} — ${reason}`);
  skipped++; skipReasons.push(`${name}: ${reason}`);
}

// ── fixtures ─────────────────────────────────────────────────────────────────────────────
const PHONE  = '919625759924';
const USER   = { id: 'u1', phone: '+' + PHONE, name: 'Test Bride' };
const COUPLE = { id: 'c1', user_id: 'u1', wedding_date: null, tier: 'basic' };
const CONVO  = { id: 'conv1', couple_id: 'c1' };

const STABLE_URL = 'https://proj.supabase.co/storage/v1/object/public/wa-media/bride/1754-abc.jpg';
const OBJECT_PATH = 'bride/1754-abc.jpg';
const RESOLVED   = { stableUrl: STABLE_URL, mime: 'image/jpeg' };

// A RAW META WEBHOOK BODY carrying one photo, optionally captioned. This is the real wire
// shape — the bench drives the production normalizer over it rather than hand-building the
// normalized object, so a normalizer regression cannot hide behind the fixture.
const metaBody = (caption) => ({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'WABA',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '917011788380', phone_number_id: '1193630900506451' },
        contacts: [{ profile: { name: 'Test Bride' }, wa_id: PHONE }],
        messages: [{
          from: PHONE,
          id: 'wamid.PHOTO' + Math.random(),
          timestamp: '1',
          type: 'image',
          image: Object.assign(
            { id: 'MEDIA_ID_1', mime_type: 'image/jpeg', sha256: 'x' },
            caption === undefined ? {} : { caption },
          ),
        }],
      },
    }],
  }],
});

// A capturing supabase fake: every insert is RECORDED per table so a cell can read the row
// the production code actually built, never a predicted one.
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

function makeDeps({ sends, saves, inserts, circleCalls }) {
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
    surfacePendingCircleSessions: async () => null,   // the ruled return shape: { displayText, sessionIds } | null
    saveToMuse: async (args) => { saves.push(args); return { ok: true, save: { save_number: 7, surface: 'muse', caption: args.caption, aesthetic_tags: [] } }; },
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    handleSurpriseMe: async () => 'surprise',
    handleCircleMemberMessage: async (args) => { circleCalls.push(args); },
    buildCircleGreeting: () => 'greeting',
    extractMuseUrl: () => null,
    buildMediaContextNote: () => '[SYSTEM NOTE] note',
    DEAD_END_REPLY: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in",
    CIRCLE_TOKEN_REGEX: /^CIRCLE-[A-Z0-9]{6}$/,
  };
}

// Drive the REAL production path end to end: raw Meta body → real normalizer → real
// metaInputsFrom → real processBrideInbound.
async function driveBride(caption, { resolved = RESOLVED } = {}) {
  const msgs = metaInbound.normalizeMetaInbound(metaBody(caption));
  assert.strictEqual(msgs.length, 1, 'fixture: expected exactly one normalized message');
  const inputs = brideInbound.metaInputsFrom(msgs[0], metaBody(caption), resolved);
  const sends = [], saves = [], inserts = [], circleCalls = [];
  await brideInbound.processBrideInbound(inputs, makeDeps({ sends, saves, inserts, circleCalls }));
  const inbound = inserts.filter(i => i.table === 'messages' && i.row && i.row.direction === 'inbound');
  return { msgs, inputs, sends, saves, inserts, inbound, circleCalls };
}

// ── §4's extractor: cut a production object literal on stable CODE markers ────────────────
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

// A console.warn recorder — the .179 split is a LOG cure, so the log is the artifact.
function captureWarn(fn) {
  const lines = [];
  const original = console.warn;
  console.warn = (...args) => { lines.push(args.map(a => String(a)).join(' ')); };
  return Promise.resolve()
    .then(fn)
    .then(
      (value) => { console.warn = original; return { lines, value }; },
      (err)   => { console.warn = original; throw err; },
    );
}

(async () => {
  console.log('\n── §1 — F-05.79: THE CAPTION RIDES THE DESCRIPTOR, AND ONLY THE DESCRIPTOR ────');

  await t('§1.1 the normalizer carries m.image.caption onto the media descriptor', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody('love this lehenga'));
    assert.strictEqual(msgs[0].media.length, 1);
    assert.strictEqual(msgs[0].media[0].caption, 'love this lehenga',
      'the caption was discarded at the front door — F-05.79 is uncured');
  });

  await t('§1.2 an uncaptioned photo carries caption null, never a fabricated string', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody(undefined));
    assert.strictEqual(msgs[0].media[0].caption, null);
  });

  await t('§1.3 the caption does NOT enter msg.text (arm c-1 stays rejected)', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody('stop'));
    assert.strictEqual(msgs[0].text, '',
      'a caption reached msg.text — routing branches (STOP / nudge / surprise me) now read a photo caption');
  });

  await t('§1.4 metaInputsFrom surfaces mediaCaption to the bride adapter', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody('mandap inspo'));
    const inputs = brideInbound.metaInputsFrom(msgs[0], {}, RESOLVED);
    assert.strictEqual(inputs.mediaCaption, 'mandap inspo');
  });

  await t('§1.5 body and trimmedBody stay empty on a captioned photo (the routing firewall)', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody('STOP'));
    const inputs = brideInbound.metaInputsFrom(msgs[0], {}, RESOLVED);
    assert.strictEqual(inputs.body, '', 'a caption reached inputs.body — a photo can now opt its sender out');
    assert.strictEqual(inputs.trimmedBody, '', 'a caption reached inputs.trimmedBody');
  });

  await t('§1.6 the caption survives a FAILED resolve (descriptor-sourced, not resolve-sourced)', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody('her words'));
    const inputs = brideInbound.metaInputsFrom(msgs[0], {}, null);
    assert.strictEqual(inputs.mediaUrl, null);
    assert.strictEqual(inputs.mediaCaption, 'her words');
  });

  console.log('\n── §2 — F-05.79: THE CAPTION REACHES THE SAVE. ONE ACT, ONE ROW (F5 UNMOVED) ──');

  await t('§2.1 a captioned photo saves WITH her caption on the save', async () => {
    const { saves } = await driveBride('love this lehenga');
    assert.strictEqual(saves.length, 1, 'expected exactly one saveToMuse call');
    assert.strictEqual(saves[0].caption, 'love this lehenga',
      "F5's caption clause is still unreachable — the caption did not ride the save");
  });

  await t('§2.2 an uncaptioned photo saves with caption null, nothing invented', async () => {
    const { saves } = await driveBride(undefined);
    assert.strictEqual(saves.length, 1);
    assert.strictEqual(saves[0].caption, null);
  });

  await t('§2.3 ONE ACT, ONE ROW — a captioned photo produces exactly one save', async () => {
    const { saves } = await driveBride('one act one row');
    assert.strictEqual(saves.length, 1, 'F5 violated: a captioned photo produced more than one save act');
    assert.strictEqual(saves[0].sourceUrl, STABLE_URL);
  });

  await t('§2.4 a photo captioned "surprise me" does NOT hit the surprise intercept', async () => {
    const { sends, saves } = await driveBride('surprise me');
    assert.strictEqual(saves.length, 1, 'the photo was not saved — the caption hijacked routing');
    assert.ok(!sends.some(s => s.text === 'surprise'),
      'the /surprise intercept fired on a photo CAPTION — the caption is inside the routing branches');
  });

  console.log('\n── §3 — F-09.178: THE ROW KEEPS A PATH TO THE PHOTOGRAPH (bride door) ─────────');

  await t('§3.1 the bride inbound audit row carries media_url', async () => {
    const { inbound } = await driveBride('with caption');
    assert.strictEqual(inbound.length, 1, 'expected exactly one inbound audit row');
    assert.strictEqual(inbound[0].row.media_url, STABLE_URL,
      'the record of a photograph still keeps no path to the photograph — F-09.178 is uncured');
  });

  await t('§3.2 a text-only inbound writes media_url null, never a stray value', async () => {
    const body = metaBody(undefined);
    body.entry[0].changes[0].value.messages[0] = {
      from: PHONE, id: 'wamid.TEXT1', timestamp: '1', type: 'text', text: { body: 'hello' },
    };
    const msgs = metaInbound.normalizeMetaInbound(body);
    const inputs = brideInbound.metaInputsFrom(msgs[0], body, null);
    const sends = [], saves = [], inserts = [], circleCalls = [];
    await brideInbound.processBrideInbound(inputs, makeDeps({ sends, saves, inserts, circleCalls }));
    const inbound = inserts.filter(i => i.table === 'messages' && i.row.direction === 'inbound');
    assert.strictEqual(inbound.length, 1);
    assert.strictEqual(inbound[0].row.media_url, null);
  });

  await t('§3.3 the value is the RESOLVED STABLE URL, not a storage object path (fork b symmetry)', async () => {
    const { inbound } = await driveBride('symmetry');
    const v = inbound[0].row.media_url;
    assert.ok(/^https:\/\//.test(v), `media_url is not a fetchable url: ${v}`);
    assert.notStrictEqual(v, OBJECT_PATH, 'media_url regressed to an object path — it is no longer openable as written');
  });

  await t('§3.4 the audit body speaks her words on a captioned photo (the ruled sub-fork)', async () => {
    const { inbound } = await driveBride('gold tissue, like this');
    assert.strictEqual(inbound[0].row.body, 'gold tissue, like this',
      'the audit body still reads a placeholder over the bride\'s own words');
  });

  await t('§3.5 an uncaptioned photo keeps its placeholder body (fallback intact)', async () => {
    const { inbound } = await driveBride(undefined);
    assert.strictEqual(inbound[0].row.body, '[forwarded an image]');
  });

  await t('§3.6 the engine context matches the audit body (the named consequence, asserted)', async () => {
    const { sends } = await driveBride('gold tissue, like this');
    assert.strictEqual(sends.inboundForEngine, 'gold tissue, like this',
      'the row and the agent context disagree about what she said');
  });

  console.log('\n── §4 — F-09.178 (b′): THE CIRCLE MEMBER\'S ROW, SAME DISEASE, SAME CURE ───────');

  const CIRCLE_ROW_START = "await supabase.from('messages').insert(webhookCore.inboundRow({\n    conversation_id: conversation.id,";
  const CIRCLE_ROW_END   = '}, twilioSid));';

  await t('§4.1 the circle inbound row carries the envelope\'s media pointer', async () => {
    const cut = extractBetween('src/brideIndex.js', CIRCLE_ROW_START, CIRCLE_ROW_END);
    const row = evalWith('{ conversation_id: conversation.id,' + cut + '}', {
      conversation: { id: 'conv-circle' },
      trimmedBody: '',
      hasMedia: true,
      req: { body: { MediaContentType0: 'image/jpeg', MediaUrl0: STABLE_URL } },
    });
    assert.strictEqual(row.body, '[image]');
    assert.strictEqual(row.media_url, STABLE_URL,
      'the circle member\'s photograph row still points at nothing — b′ is uncured');
  });

  await t('§4.2 the same production row writes null when no media rode the envelope', async () => {
    const cut = extractBetween('src/brideIndex.js', CIRCLE_ROW_START, CIRCLE_ROW_END);
    const row = evalWith('{ conversation_id: conversation.id,' + cut + '}', {
      conversation: { id: 'conv-circle' },
      trimmedBody: 'just a note',
      hasMedia: false,
      req: { body: {} },
    });
    assert.strictEqual(row.body, 'just a note');
    assert.strictEqual(row.media_url, null);
  });

  await t('§4.3 the extractor is anchored on production bytes and fails loudly when they move', async () => {
    assert.throws(
      () => extractBetween('src/brideIndex.js', 'THIS_MARKER_DOES_NOT_EXIST_IN_THE_TREE', CIRCLE_ROW_END),
      /EXTRACT: start marker not found/,
      'the extractor degraded to a silent zero — its failure mode no longer differs from a grep',
    );
  });

  console.log('\n── §5 — F-09.179: TWO OPPOSITE FACTS, TWO DISTINGUISHABLE LINES ───────────────');

  // Drive the REAL classifyImage with a scripted global fetch. Behaviour AND log are read.
  async function driveVision(payload) {
    const originalFetch = global.fetch;
    const originalKey = process.env.GOOGLE_VISION_API_KEY;
    process.env.GOOGLE_VISION_API_KEY = 'SENTINEL_VISION_KEY_NEVER_LOG';
    global.fetch = async () => ({ ok: true, status: 200, json: async () => payload });
    try {
      return await captureWarn(() => imageOCRRouter.classifyImage({ image_url: 'https://x/y.jpg' }));
    } finally {
      global.fetch = originalFetch;
      if (originalKey === undefined) delete process.env.GOOGLE_VISION_API_KEY;
      else process.env.GOOGLE_VISION_API_KEY = originalKey;
    }
  }

  let errLines = null, emptyLines = null;

  await t('§5.1 Vision ERRED logs a line that names the error and its code', async () => {
    const { lines, value } = await driveVision({ responses: [{ error: { code: 7, message: 'PERMISSION_DENIED' } }] });
    errLines = lines.join('\n');
    assert.ok(/ERROR/.test(errLines), `the ERRED fact is not named as an error: ${errLines}`);
    assert.ok(/7/.test(errLines) && /PERMISSION_DENIED/.test(errLines),
      `the error code and message are still being thrown away: ${errLines}`);
    assert.strictEqual(value.route, 'muse', 'behaviour changed — the cure was log-only by ruling');
  });

  await t('§5.2 Vision EMPTY logs a line that names the emptiness', async () => {
    const { lines, value } = await driveVision({ responses: [] });
    emptyLines = lines.join('\n');
    assert.ok(/EMPTY/.test(emptyLines), `the EMPTY fact is not named as empty: ${emptyLines}`);
    assert.strictEqual(value.route, 'muse', 'behaviour changed — the cure was log-only by ruling');
  });

  await t('§5.3 the two opposite facts produce DISTINGUISHABLE lines (class №5, cured)', async () => {
    assert.ok(errLines && emptyLines, '§5.1/§5.2 did not run — this cell asserts nothing without them');
    assert.notStrictEqual(errLines, emptyLines,
      'one string still stands for two opposite facts — watch-list class №5 is uncured');
  });

  await t('§5.4 BEHAVIOUR UNCHANGED: both facts still default to muse', async () => {
    const a = await driveVision({ responses: [{ error: { code: 3, message: 'INVALID' } }] });
    const b = await driveVision({ responses: [] });
    assert.strictEqual(a.value.route, 'muse');
    assert.strictEqual(b.value.route, 'muse');
  });

  console.log('\n── §6 — THE VENDOR LANE IS BYTE-UNMOVED (the ruled narrow-radius guard) ───────');

  await t('§6.1 the vendor normalizer output is IDENTICAL with and without a caption', async () => {
    const withCap = metaBody('a caption the vendor must never see differently');
    const without = metaBody(undefined);
    // Pin the one field that is fixture-random so the comparison is about the cure, not the id.
    withCap.entry[0].changes[0].value.messages[0].id = 'wamid.FIXED';
    without.entry[0].changes[0].value.messages[0].id = 'wamid.FIXED';
    const a = vendorInbound.metaInputsFrom(metaInbound.normalizeMetaInbound(withCap)[0], {}, RESOLVED);
    const b = vendorInbound.metaInputsFrom(metaInbound.normalizeMetaInbound(without)[0], {}, RESOLVED);
    assert.deepStrictEqual(a, b,
      'the vendor lane now behaves differently on a captioned photo — the narrow radius was breached');
  });

  await t('§6.2 no vendor-lane source reads the descriptor caption or mediaCaption', async () => {
    const src = read('src/lib/vendorInbound.js');
    assert.ok(!/mediaCaption/.test(src), 'vendorInbound.js began reading mediaCaption');
    assert.ok(!/\.caption\b/.test(src.replace(/caption:\s*\n?\s*caption,?/g, '')) || !/media\[0\]\.caption|image\.caption/.test(src),
      'vendorInbound.js began reading the descriptor caption');
  });

  await t('§6.3 the vendor inbound guard row still writes media_url (unmoved by this diff)', async () => {
    const src = read('src/lib/vendorInbound.js');
    assert.ok(/media_url:\s*mediaUrl,/.test(src),
      'the vendor lane stopped writing media_url — this diff must not have touched it');
  });

  await t('§6.4 the F-09.173 seam still fills BOTH media fields (no regression on the elder cure)', async () => {
    const msgs = metaInbound.normalizeMetaInbound(metaBody('elder cure'));
    const inputs = brideInbound.metaInputsFrom(msgs[0], {}, RESOLVED);
    assert.strictEqual(inputs.mediaUrl, STABLE_URL);
    assert.strictEqual(inputs.mediaContentType, 'image/jpeg');
    assert.strictEqual(inputs.hasMedia, true);
  });

  console.log('\n── §7 — THE (a)-CLUSTER, RULED AND BUILT: THE SINGLE-PERSIST ─────────────────');
  // These three cells were SKIPPED at 29bef95 and said so. CE-32 ruled duty (a)
  // and they come alive in the same diff that cures what they assert. The skip
  // count goes to zero; nothing was removed to get there.

  await t('§7.1 F-09.171 the marker reaches NO send()-bound or persisted string', () => {
    // The uuid used to be stapled to every summary and read by the bride. It now
    // lives ONLY on circle_sessions.summary_message_id. This cell is the byte:
    // zero `[session_id:` anywhere the composer can put text in front of her.
    const eng = read('src/agent/brideEngine.js');
    const inb = read('src/lib/brideInbound.js');
    const composed = eng.split('\n').filter(l => !l.trim().startsWith('//'));
    for (const l of composed) {
      assert.ok(!/summaryLines\.push\(`?\$\{summary\}\\n\[session_id/.test(l),
        `the marker is still being composed into a summary line: ${l.trim()}`);
    }
    // No LIVE (non-comment) code in either file may emit the literal marker.
    const liveMarker = (src) => src.split('\n')
      .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .filter(l => l.includes('[session_id:'));
    assert.deepStrictEqual(liveMarker(eng), [], 'brideEngine still has live code emitting [session_id:');
    assert.deepStrictEqual(liveMarker(inb), [], 'brideInbound still has live code emitting [session_id:');
    // And the stamp is still written — the id did not simply vanish.
    assert.ok(/summary_message_id: msgRow\.id/.test(eng),
      'the marker died but the stamp did not replace it — the association is now lost entirely');
  });

  await t('§7.2 F-09.175 /surprise cannot send a [SYSTEM NOTE] string — structurally', () => {
    // The header and the instruction paragraph are GONE from the composer, so
    // there is no such string for any send() to reach. Asserted at both ends:
    // the composer cannot build it, and /surprise sends displayText.
    const eng = read('src/agent/brideEngine.js');
    const live = eng.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    assert.ok(!live.some(l => l.includes('[SYSTEM NOTE — circle activity summary]')),
      'the surfacer can still compose the [SYSTEM NOTE] header');
    assert.ok(!live.some(l => l.includes('Weave this into your reply naturally as a preamble')),
      'the surfacer can still compose the model-addressed instruction paragraph');
    const inb = read('src/lib/brideInbound.js');
    assert.ok(/await send\(phone, circle\.displayText\)/.test(inb),
      '/surprise no longer sends circle.displayText — the composed thing is not what reaches her');
    assert.ok(!/send\(phone, circleSummary\.trim\(\)\)/.test(inb),
      '/surprise still sends the surfacer raw return');
  });

  await t('§7.3 F-09.176 the injection narrative matches the code', () => {
    const eng = read('src/agent/brideEngine.js');
    // The three sentences that described a shape this file never had.
    assert.ok(!/Injected as a system-level note so\n\/\/ +the agent knows/.test(eng),
      'the "injected as a system-level note" narrative survives');
    assert.ok(!/The preamble carries the session_id back to the agent/.test(eng),
      'the header still claims the preamble carries the session_id to the agent');
    assert.ok(!/compose a one-line preamble via Haiku, and prepend it to\n\/\/ dynamicContext/.test(eng),
      'the header still claims the summary is prepended to dynamicContext');
    // F-06.85 form: the mechanism the deliveryChannel default is conditioned on
    // is NAMED, so the next sitting on that mechanism must re-read this sentence.
    assert.ok(/F-06\.85 MECHANISM: the value is written onto public\.messages\.channel/.test(eng),
      'deliveryChannel ships without naming the mechanism it is conditioned on');
  });

  await t('§7.4 DUTY (a) — ONE ROW PER SUMMARY: no send-bound path persists a second', () => {
    // The named mutation for this cell is RESTORE THE SECOND PERSIST. Both
    // callers used to insert the summary again after sending it; the surfacer's
    // own write (before the send, for crash-durability) is now the only one.
    const inb = read('src/lib/brideInbound.js');
    const live = inb.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');
    // No insert into messages may carry a circle summary body on either path.
    assert.ok(!/body:\s+circleSummary\.trim\(\)/.test(live),
      '/surprise still persists the summary a second time');
    assert.ok(!/body:\s+result\.circleSummary/.test(live),
      'the engine path still persists the summary a second time');
    assert.ok(!/body:\s+circle\.displayText/.test(live),
      'a second persist was rebuilt around the new return shape');
    const eng = read('src/agent/brideEngine.js');
    assert.strictEqual((eng.match(/from\('messages'\)\s*\n\s*\.insert\(/g) || []).length, 1,
      'brideEngine no longer has exactly one summary insert — the single-persist has split');
  });

  await t('§7.5 DUTY (a) — the persisted row is CHANNEL-TRUE, declared by the caller', () => {
    const eng = read('src/agent/brideEngine.js');
    assert.ok(/async function surfacePendingCircleSessions\(\{ couple_id, supabase, anthropic, channel = 'web' \}\)/.test(eng),
      'the surfacer does not take a caller-declared channel with a web default');
    const live = eng.split('\n').filter(l => !l.trim().startsWith('//'));
    assert.ok(live.some(l => /^\s+channel,\s*$/.test(l)),
      'the persist no longer writes the declared channel');
    assert.ok(!live.some(l => /channel:\s+'web',/.test(l) && /messages/.test(eng)),
      'the persist still hardcodes a channel constant');
    const inb = read('src/lib/brideInbound.js');
    assert.ok(/channel: 'whatsapp'/.test(inb), '/surprise does not declare whatsapp');
    assert.ok(/deliveryChannel: 'whatsapp'/.test(inb), 'the engine path does not declare whatsapp');
    // chat.js is READ-ONLY ALWAYS and must stay byte-untouched: it declares
    // nothing and inherits 'web', which is the value its rows have always had.
    const chat = read('src/api/couple/chat.js');
    assert.ok(!/deliveryChannel/.test(chat),
      'chat.js was edited — it is READ-ONLY ALWAYS and the default exists so it need not be');
  });

  await t('§7.6 PLAYBACK — the model never names a session, the engine resolves it', () => {
    const tools = read('src/agent/brideTools.js');
    const eng   = read('src/agent/brideEngine.js');
    // The schema no longer asks the model for a uuid it can no longer obtain.
    assert.ok(!/session_id: \{/.test(tools), 'the list_muse schema still declares a session_id parameter');
    assert.ok(/from_recent_circle_session: \{/.test(tools), 'the re-aimed boolean is not in the schema');
    assert.ok(/type: 'boolean'/.test(tools.slice(tools.indexOf('from_recent_circle_session'))),
      'from_recent_circle_session is not typed boolean');
    // Resolution happens server-side, through the stamp, on the ratified key.
    assert.ok(/from\('circle_sessions'\)/.test(eng) && /\.not\('summary_message_id', 'is', null\)/.test(eng),
      'execListMuse does not resolve through the summary stamp');
    assert.ok(/\.order\('last_activity_at', \{ ascending: false \}\)/.test(eng),
      'the ratified recency key (last_activity_at DESC) is not the resolution order');
    assert.ok(!/session_id must be a valid UUID/.test(eng),
      'the uuid-from-the-model validation survives — the model is still expected to name one');
  });

  const total = pass + fail + skipped;
  console.log(`\n────────────────────────────────────────────────────────────────────────────────`);
  console.log(`  total ${total} · run ${pass + fail} · passed ${pass} · failed ${fail} · skipped ${skipped}`);
  for (const r of skipReasons) console.log(`  skipped — ${r}`);
  console.log(`  VERDICT: ${fail === 0 ? 'GREEN' : 'RED'}`);
  console.log(`────────────────────────────────────────────────────────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
