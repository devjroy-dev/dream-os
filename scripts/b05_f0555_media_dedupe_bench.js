// scripts/b05_f0555_media_dedupe_bench.js — TDW_05 · F-05.55 · THE VENDOR MEDIA LANE'S
// DURABLE DEDUPE. CE rulings R2/R3/R7, eleventh chair, 2026-07-24.
//
// ═══ WHAT THIS BENCH REACHES THAT NO EARLIER ONE COULD ════════════════════════════════
// b05_arc_m6_bench §2.3 states its own limit honestly and correctly: "the DB's unique
// index does the REJECTING and a bench has no index". So M6 proved the property the
// estate controls in code — every couple door HANDS the wamid to the row-builder — and
// stopped exactly there, which was right.
//
// THIS BENCH BUILDS THE INDEX. The fake supabase below carries a seen-Set keyed on
// message_sid and returns a real PostgREST-shaped {error:{code:'23505'}} on a repeat,
// reproducing messages_message_sid_uidx. That mechanism is not a guess: the founder's
// pg_indexes paste (2026-07-24, banked in the CE addendum to the F-05.55 rulings)
// witnesses it live on public.messages as
//   CREATE UNIQUE INDEX ... USING btree (message_sid) WHERE (message_sid IS NOT NULL)
// byte-matching db/migrations/0084_message_sid_dedupe.sql:24-25. Committed AND applied.
// So this harness finally exercises THE REJECT PATH — the half of RF-1 that has never
// been driven anywhere in this estate.
//
// AND IT DRIVES THE HANDLER'S OWN TWO LINES TOO. `deliver()` below replicates
// src/index.js:186-187 (sidSeen -> recordSid -> core) because the finding's sentence is
// about a RESTART: the LRU lives in the handler, the durable index lives past it, and a
// cell that skipped the LRU would be proving a smaller thing than the one that was
// broken. Same-process redelivery must die at the LRU; post-restart redelivery must
// reach the core and die at the guard row.
//
// ═══ THE NAMED TEST (R7) ══════════════════════════════════════════════════════════════
// §1.2 — the same media wamid twice across a simulated restart (_resetSidLru between
// passes) -> ONE OCR turn, ONE guard row, ONE outbound row. That cell is the finding,
// inverted.
//
// ═══ NON-VACUOUS BY PRODUCTION MUTATION (§9, both-ways) ═══════════════════════════════
// §8 mutates src/lib/vendorInbound.js — PRODUCTION CODE, never test setup — five ways,
// each restoring the disease in a different limb, and asserts the named cell goes RED.
// §8.6 then proves every mutated file was restored BYTE-IDENTICAL.
//
// SCOPE, stated so the silence is not misread: F-05.61 (the ten-site inert-dedupe class)
// is CHARTERED SEPARATELY to the RF-1 coherence sitting per CE ruling R1. This bench
// asserts the error is read at the ONE new guard site and makes no claim about the other
// nine. F-05.62 (the bride muse-save inversion) rides that same sitting; zero bride bytes
// move here and none are asserted.
'use strict';
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

let pass = 0, fail = 0;
function H(s) { console.log(`\n${s}`); }
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

// ── the module under test, loaded fresh (§8 reloads it after each mutation) ────────────
function loadCore() {
  delete require.cache[require.resolve('../src/lib/vendorInbound.js')];
  return require('../src/lib/vendorInbound.js');
}
const webhookCore = require('../src/lib/webhookCore.js');

// ══════════════════════════════════════════════════════════════════════════════════════
// THE FAKE THAT CARRIES THE INDEX
// ══════════════════════════════════════════════════════════════════════════════════════
// `seen` is the durable state: it survives the simulated restart exactly as a database
// does, which is the entire point. Everything else resets per pass.
function makeEstate({ vendor, convoId = 'c1', seen = new Set() } = {}) {
  const captured = { messages: [], proposals: [], extractCalls: [], sends: [], order: [] };

  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b, is: () => b,
      gte: () => b, lte: () => b, limit: () => b, update: () => b, delete: () => b,
      insert: (payload) => {
        if (table === 'pending_event_proposals') { captured.proposals.push(payload); captured.order.push('proposal'); }
        if (table === 'messages') {
          const rows = Array.isArray(payload) ? payload : [payload];
          // THE INDEX: unique on message_sid WHERE message_sid IS NOT NULL.
          for (const r of rows) {
            if (r && r.message_sid) {
              if (seen.has(r.message_sid)) {
                captured.order.push('messages:23505');
                b.__err = {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "messages_message_sid_uidx"',
                  details: `Key (message_sid)=(${r.message_sid}) already exists.`,
                };
                return b;
              }
              seen.add(r.message_sid);
            }
          }
          captured.messages.push(payload);
          captured.order.push(`messages:${rows.map((r) => r && r.direction).join('+')}`);
        }
        return b;
      },
      maybeSingle: () => {
        if (table === 'users')         return Promise.resolve({ data: { id: 'u1' }, error: null });
        if (table === 'vendors')       return Promise.resolve({ data: vendor, error: null });
        if (table === 'conversations') return Promise.resolve({ data: convoId ? { id: convoId } : null, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      single: () => {
        if (table === 'pending_event_proposals') return Promise.resolve({ data: { id: 'prop_1' }, error: null });
        if (table === 'users')                   return Promise.resolve({ data: { id: 'u1' }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      then: (res, rej) => { const e = b.__err || null; b.__err = null; return Promise.resolve({ data: null, error: e }).then(res, rej); },
    };
    return b;
  }

  const supabase = { from: (tbl) => builder(tbl), schema: () => ({ from: (tb) => builder(tb) }), rpc: async () => ({ data: null, error: null }) };
  return { supabase, captured, seen };
}

const VENDOR = { id: 'vend1', user_id: 'u1', onboarding_state: 'complete' };
const STABLE = 'https://proj.supabase.co/storage/v1/object/public/wa-media/1700-abc.jpg';
const WAMID  = 'wamid.MEDIA_REDELIVERED';

// The media dep set. `extractCalendarFromImage` is the meter: every entry is one Vision
// call, which is the money F-05.55 is about.
function mediaDeps(captured, { visionThrows = false } = {}) {
  return {
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent:  async () => {},
    extractCalendarFromImage: async ({ image_url }) => {
      captured.extractCalls.push(image_url);
      captured.order.push('vision');
      if (visionThrows) throw new Error('vision 529 overloaded');
      return { proposals: [{ title: 'Sharma sangeet', event_date: '2026-12-14', kind: 'shoot' }] };
    },
    sendWhatsApp: async (phone, msg) => { captured.sends.push(msg); captured.order.push('send'); return { sid: 'wamid.OUT1' }; },
    anthropic: {}, webhookCore,
  };
}

// The full text-path dep set, for the §7 synthesis scenario only.
function textDeps(captured, reply) {
  const noop = async () => ({});
  return {
    ...mediaDeps(captured, { visionThrows: true }),
    runTurn: async () => { captured.order.push('runTurn'); return { reply, tool_calls: [] }; },
    runCoupleAgenticTurn: async () => ({ reply, tool_calls: [] }),
    resolveAgentForVendor: async () => ({ agentId: 'ag1' }),
    fetchCalendarSnapshot: async () => ({}),
    fetchScratchpad: async () => ({}),
    fetchLeadPings: async () => '',
    buildLlmForTurn: async () => ({ tierOverride: null, modelOverride: null, transport: null, donnaTransport: null, donnaModelOverride: null }),
    applyCalendarSignals: async () => ({ suffix: '' }),
    generateInvoiceForBinder: noop,
    enquiryToBinder: noop,
    ensureCoupleRow: async () => ({ id: 'cpl1' }),
    captureField: noop,
    buildDisambiguationQuestion: () => 'disambig?',
    interpretDisambiguationReply: () => ({}),
    vendorDisplayName: (v) => (v && v.business_name) || 'vendor',
    matchModeWord: () => null,
    applyModeFlip: async () => ({}),
    MODE_FLIP_LINES: {},
    matchFreshWord: () => false,
    FRESH_THREAD_LINE: '',
    abandonActiveThread: async () => ({ ok: true, closed: null }),
  };
}

function mediaMsg(text = '') {
  return { from: '918757788550', text, messageId: WAMID, type: 'image', media: [{ id: 'M', mime: 'image/jpeg' }] };
}

// THE HANDLER'S OWN TWO LINES (src/index.js:186-187), replicated so the LRU is really in
// the path. Returns 'lru-dropped' when the fast path ate it, 'processed' otherwise.
async function deliver(core, msg, deps, resolved) {
  if (webhookCore.sidSeen(msg.messageId)) return 'lru-dropped';
  webhookCore.recordSid(msg.messageId);
  await core.processVendorInbound(core.metaInputsFrom(msg, { entry: [] }, resolved), deps);
  return 'processed';
}

const inboundRows  = (c) => c.messages.flat().filter((m) => m && m.direction === 'inbound');
const outboundRows = (c) => c.messages.flat().filter((m) => m && m.direction === 'outbound');

// ══════════════════════════════════════════════════════════════════════════════════════
(async () => {
  webhookCore._setSidColumnPresent(true); // the column is witnessed live (PUBLIC_SCHEMA.md:591, entry 18)

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§1 — THE REDELIVERY CELL · THE NAMED TEST (R7)');

  await t('§1.1 pass 1: ONE Vision call, ONE guard row carrying the wamid, ONE outbound row', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const { supabase, captured } = makeEstate({ vendor: VENDOR });
    await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });

    assert.deepStrictEqual(captured.extractCalls, [STABLE], 'exactly one Vision call, on the stable url');
    const ins = inboundRows(captured);
    assert.strictEqual(ins.length, 1, `expected 1 inbound row, got ${ins.length}`);
    assert.strictEqual(ins[0].message_sid, WAMID, 'the guard row CLAIMS the wamid — RF-1 durable half reaches this lane');
    assert.strictEqual(ins[0].media_url, STABLE, 'and still carries the stable url (media_shim contract preserved)');
    assert.strictEqual(outboundRows(captured).length, 1, 'exactly one outbound row');
    assert.ok(captured.sends.some((m) => /I found 1 event/.test(m)), 'the preview went out');
  });

  await t('§1.2 *** SAME WAMID ACROSS A SIMULATED RESTART -> ONE OCR TURN, ONE AUDIT PAIR ***', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const seen = new Set();                       // the database: survives the restart
    const e1 = makeEstate({ vendor: VENDOR, seen });
    const r1 = await deliver(core, mediaMsg(), { ...mediaDeps(e1.captured), supabase: e1.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.strictEqual(r1, 'processed', 'pass 1 must run');

    // ── THE RESTART. The process dies; its LRU dies with it; the row does not. ──
    webhookCore._resetSidLru();

    const e2 = makeEstate({ vendor: VENDOR, seen });
    const r2 = await deliver(core, mediaMsg(), { ...mediaDeps(e2.captured), supabase: e2.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.strictEqual(r2, 'processed', 'the LRU is empty after a restart — the redelivery MUST reach the core');

    assert.deepStrictEqual(e2.captured.extractCalls, [], 'THE FINDING, INVERTED: no second Vision call');
    assert.strictEqual(e2.captured.proposals.length, 0, 'no second proposal staged');
    assert.deepStrictEqual(e2.captured.sends, [], 'no second preview sent to the vendor');
    assert.strictEqual(inboundRows(e2.captured).length, 0, 'no second inbound row');
    assert.strictEqual(outboundRows(e2.captured).length, 0, 'no second outbound row');
    // and the drop happened at the index, before the spend
    assert.deepStrictEqual(e2.captured.order, ['messages:23505'], `the second pass did exactly one thing — hit the index — and stopped; got ${JSON.stringify(e2.captured.order)}`);
  });

  await t('§1.3 same-process redelivery never reaches the core at all (the LRU fast path holds)', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const seen = new Set();
    const e1 = makeEstate({ vendor: VENDOR, seen });
    await deliver(core, mediaMsg(), { ...mediaDeps(e1.captured), supabase: e1.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    const e2 = makeEstate({ vendor: VENDOR, seen });
    const r2 = await deliver(core, mediaMsg(), { ...mediaDeps(e2.captured), supabase: e2.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.strictEqual(r2, 'lru-dropped', 'no restart -> the LRU eats it, zero DB cost');
    assert.deepStrictEqual(e2.captured.order, [], 'the core was never entered');
  });

  await t('§1.4 a DIFFERENT wamid is not deduped — the guard is a key, not a mute button', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const seen = new Set();
    const e1 = makeEstate({ vendor: VENDOR, seen });
    await deliver(core, mediaMsg(), { ...mediaDeps(e1.captured), supabase: e1.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    webhookCore._resetSidLru();
    const e2 = makeEstate({ vendor: VENDOR, seen });
    const other = { ...mediaMsg(), messageId: 'wamid.A_SECOND_REAL_IMAGE' };
    await deliver(core, other, { ...mediaDeps(e2.captured), supabase: e2.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.strictEqual(e2.captured.extractCalls.length, 1, 'a genuinely new image must still OCR');
    assert.strictEqual(inboundRows(e2.captured).length, 1, 'and still leave its own guard row');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§2 — THE ORDERING: THE GUARD IS CLAIMED BEFORE THE MONEY IS SPENT');

  await t('§2.1 the guard row is written BEFORE the Vision call, before the proposal, before the send', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const { supabase, captured } = makeEstate({ vendor: VENDOR });
    await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.deepStrictEqual(captured.order,
      ['messages:inbound', 'vision', 'proposal', 'send', 'messages:outbound'],
      'the branch must claim the wamid FIRST — this ordering IS the cure');
  });

  await t('§2.2 the guard row is its own insert; the pair is SPLIT (R2\'s disclosed consequence)', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const { supabase, captured } = makeEstate({ vendor: VENDOR });
    await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.strictEqual(captured.messages.length, 2, 'two inserts, not one array insert');
    assert.ok(!Array.isArray(captured.messages[0]), 'the inbound half no longer travels inside an array');
    assert.ok(!Array.isArray(captured.messages[1]), 'and neither does the outbound half');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§3 — R3: THE OUTBOUND HALF IS BYTE-UNTOUCHED AND TAKES NO message_sid');

  await t('§3.1 the outbound row carries its wamid in twilio_sid and message_sid NOWHERE', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const { supabase, captured } = makeEstate({ vendor: VENDOR });
    await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    const out = outboundRows(captured)[0];
    assert.ok(out, 'an outbound row must exist');
    assert.strictEqual(out.twilio_sid, 'wamid.OUT1', 'the outbound wamid keeps its documented home (whatsapp.js:145 misnomer)');
    assert.ok(!('message_sid' in out),
      'an outbound wamid in the inbound keyspace invites a cross-direction collision — 0084 is inbound-only');
    assert.deepStrictEqual(Object.keys(out),
      ['conversation_id', 'direction', 'channel', 'body', 'sent_by', 'twilio_sid'],
      'same five fields plus conversation_id, same order — byte-untouched from the pair it left');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§4 — THE TWO WAYS THE GUARD LAWFULLY WITHHOLDS ITSELF');

  await t('§4.1 internal replay hands NO sid -> deliberate re-run is never self-blocked', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const seen = new Set();
    const e1 = makeEstate({ vendor: VENDOR, seen });
    const inputs1 = { ...core.metaInputsFrom(mediaMsg(), { entry: [] }, { stableUrl: STABLE, mime: 'image/jpeg' }), internalReplay: true };
    await core.processVendorInbound(inputs1, { ...mediaDeps(e1.captured), supabase: e1.supabase });
    assert.strictEqual(inboundRows(e1.captured)[0].message_sid, undefined, 'a replay row must not claim the original wamid');

    const e2 = makeEstate({ vendor: VENDOR, seen });
    const inputs2 = { ...core.metaInputsFrom(mediaMsg(), { entry: [] }, { stableUrl: STABLE, mime: 'image/jpeg' }), internalReplay: true };
    await core.processVendorInbound(inputs2, { ...mediaDeps(e2.captured), supabase: e2.supabase });
    assert.strictEqual(e2.captured.extractCalls.length, 1, 'a dead-letter replay must actually re-run');
  });

  await t('§4.2 un-migrated column -> inboundRow degrades, the turn still runs (P1b graceful degrade)', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    webhookCore._setSidColumnPresent(false);
    try {
      const { supabase, captured } = makeEstate({ vendor: VENDOR });
      await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
      assert.strictEqual(inboundRows(captured)[0].message_sid, undefined, 'no sid attached when the column is absent');
      assert.strictEqual(captured.extractCalls.length, 1, 'and the vendor still gets his turn — degrade, never deny');
    } finally { webhookCore._setSidColumnPresent(true); }
  });

  await t('§4.3 no vendor_self conversation -> guard skipped, turn runs, the gap is DECLARED in-file', async () => {
    const core = loadCore();
    webhookCore._resetSidLru();
    const { supabase, captured } = makeEstate({ vendor: VENDOR, convoId: null });
    await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.strictEqual(captured.extractCalls.length, 1, 'a first-ever-image vendor is still served');
    assert.strictEqual(inboundRows(captured).length, 0, 'no conversation, no row — pre-existing shape preserved');
    const src = read('src/lib/vendorInbound.js');
    assert.ok(/UNDEDUPED \(declared\)/.test(src), 'the gap must be named in production, not discovered later');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§5 — F-05.61 SCOPE (R1): THE ERROR IS READ AT THIS ONE SITE, AND SAID SO');

  await t('§5.1 the guard site reads {error}; the other five inboundRow sites are untouched', () => {
    const L = read('src/lib/vendorInbound.js').split('\n');
    const sites = [];
    L.forEach((l, i) => { if (/\.insert\(webhookCore\.inboundRow\(\{/.test(l)) sites.push({ n: i + 1, l }); });
    assert.strictEqual(sites.length, 6, `the inboundRow census moved to ${sites.length} — re-derive before trusting this cell`);
    const reading = sites.filter((s) => /const \{ error:/.test(s.l));
    assert.strictEqual(reading.length, 1, 'exactly ONE site reads the error this micro — R1 scoped it there');
    assert.ok(/guardErr/.test(reading[0].l), 'and it is the guard');
  });

  await t('§5.2 the file names F-05.61 and points at the chartered sweep rather than widening', () => {
    const src = read('src/lib/vendorInbound.js');
    assert.ok(/F-05\.61/.test(src), 'the class must be named where the exception to it lives');
    assert.ok(/RF-1 coherence sitting/.test(src), 'and the sweep it belongs to must be pointed at');
    assert.ok(/2\.105\.4/.test(src), 'with the pinned version the no-throw was proven against');
  });

  await t('§5.3 the witnessed index is cited at the site that depends on it', () => {
    const src = read('src/lib/vendorInbound.js');
    assert.ok(/messages_message_sid_uidx/.test(src), 'the index by name');
    assert.ok(/message_sid IS NOT NULL/.test(src), 'with the partial predicate — a constraint read without its predicate is a constraint misread');
    assert.ok(/0084/.test(src), 'and its migration');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§6 — W-1: ZERO SOUL/PROMPT/VOICE BYTES, ZERO COPY');

  // ══ THE LIVE-TREE TRAP, REFUSED IN DRAFT AND SAID SO ═════════════════════════════════
  // These two cells were first written as `git diff … 0fb674a -- src/` against the WORKING
  // TREE: "the src delta is exactly this one file", "no speakable line entered the diff".
  // Both were true the minute they were written and both were the arc_m4 §4.1 disease —
  // a guard with an open end, green today and structurally RED the moment the next
  // chartered sitting adds a file or the founder commits. This estate has convicted that
  // class three times (arc_m4 §4.1 · arc_m1 §6.4 · arc_m3 §5.2) and paid for it each time.
  // RE-AIMED to properties that are true forever and are the ones actually at stake: the
  // branch's speakable bytes are unchanged, and the guard itself speaks to nobody.
  const MEDIA_COPY = [
    "I'll be able to process two at a time right now. Send the rest after I respond to these two. Good news though, I'll be able to process multiple images together, very soon!",
    "I couldn't make out any events from this image. Try cropping closer or sending a clearer screenshot of the calendar view.",
    'I read the calendar but had trouble saving the draft. Please try sending the image again.',
    "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help.",
  ];

  await t('§6.1 copy inventory STATED ZERO: every media-branch string stands byte-exact', () => {
    const src = read('src/lib/vendorInbound.js');
    for (const line of MEDIA_COPY) assert.ok(src.includes(line), `a vendor-facing line moved: ${line.slice(0, 48)}…`);
    assert.ok(src.includes('`I found ${proposals.length} event${proposals.length === 1 ? \'\' : \'s\'} in this image:\\n\\n` +'),
      'the preview template moved');
  });

  await t('§6.2 the guard speaks to NOBODY — it writes a row and returns, never a line', () => {
    const src = read('src/lib/vendorInbound.js');
    const a = src.indexOf('// ── F-05.55 GUARD ROW · BEGIN ──');
    const b = src.indexOf('// ── F-05.55 GUARD ROW · END ──');
    assert.ok(a > 0 && b > a, 'the guard markers must bracket a real region');
    const region = src.slice(a, b);
    assert.ok(!/sendWhatsApp\(/.test(region), 'a dropped redelivery must be SILENT — no line reaches the veto slot');
    for (const s of ['miraSoul', 'donnaSoul', 'harveySoul', 'advisorLens', 'src/engine/'])
      assert.ok(!src.includes(s), `W-1 BREACH: ${s}`);
  });

  await t('§6.3 the M1 lock fence still holds — lock wiring alone, no bride machinery', () => {
    const vi = read('src/lib/vendorInbound.js');
    assert.ok(/withTurnLock\(turnKey\('vendor'/.test(vi), 'the lock wrapper survives');
    assert.ok(!/witnessLine|sendOutcome|makeInboundSend|appendWitness/.test(vi), 'the vendor fence was not widened');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§7 — SYNTHESIS (§9\'s clause): THE GUARD MEETS THE TEXT PATH IT NOW SHADOWS');

  await t('§7.1 Vision throws WITH a caption -> exactly ONE inbound row survives, and the turn completes', async () => {
    // THE INTERACTION, disclosed rather than discovered. A captioned image whose Vision
    // call throws falls through this branch into the full vendor text path, which inserts
    // its OWN inbound row on the SAME wamid at the file's other inboundRow site. That
    // site does not read its error (R1 scoped this micro to the guard), so the duplicate
    // is silently rejected and the turn runs on. NET: one inbound row before this cure
    // (the text path's) and one after (the guard's) — the count is unchanged and the
    // surviving row is strictly better, since it also carries media_url. Asserted here
    // rather than reasoned about, because each half worked and the pair is the risk.
    const core = loadCore();
    webhookCore._resetSidLru();
    const { supabase, captured } = makeEstate({ vendor: VENDOR });
    const deps = { ...textDeps(captured, 'Got it — what dates were you looking at?'), supabase };
    await deliver(core, mediaMsg('are these dates free?'), deps, { stableUrl: STABLE, mime: 'image/jpeg' });

    const ins = inboundRows(captured);
    assert.strictEqual(ins.length, 1, `exactly one inbound row must survive, got ${ins.length}`);
    assert.strictEqual(ins[0].message_sid, WAMID, 'and it is the guard row, holding the wamid');
    assert.strictEqual(ins[0].media_url, STABLE, 'which the text path\'s row would not have carried');
    assert.ok(captured.order.includes('runTurn'), 'the vendor still got his turn — the guard shadows a row, never a reply');
    assert.ok(captured.order.includes('messages:23505'), 'the text path\'s duplicate was rejected by the index, as designed');
  });

  // ────────────────────────────────────────────────────────────────────────────────────
  H('§8 — NON-VACUOUS: FIVE PRODUCTION MUTATIONS, EACH RESTORING A LIMB OF THE DISEASE');

  const TARGET = 'src/lib/vendorInbound.js';
  const PRISTINE = read(TARGET);

  // A RED IS ONLY EVIDENCE IF IT IS THE RIGHT RED. A mutation that produces a syntax
  // error, a TDZ throw or a missing-dep crash also makes the cell throw, and a helper that
  // only asked "did it throw?" would score that as proof. So every mutation names the
  // failure it must produce and the message is matched against it: the mutated tree has to
  // fail AT THE ASSERTION, expressing the disease, not fall over on the way there.
  async function mutate(label, apply, expectRed, reason) {
    const src = apply(PRISTINE);
    assert.notStrictEqual(src, PRISTINE, `MUTATION ${label} DID NOT APPLY — anchor drifted, this cell proves nothing`);
    fs.writeFileSync(P(TARGET), src);
    let red = false, why = '';
    try { await expectRed(); } catch (e) { red = true; why = e.message || String(e); }
    fs.writeFileSync(P(TARGET), PRISTINE);
    assert.ok(red, `${label}: the mutated tree stayed GREEN — the cell is vacuous`);
    assert.ok(reason.test(why),
      `${label}: RED for the WRONG REASON — expected ${reason}, got "${why}". A crash is not a disease.`);
  }

  // The named cell every mutation is aimed at: the redelivery must stay single-turn.
  async function redeliveryCell() {
    const core = loadCore();
    webhookCore._resetSidLru();
    const seen = new Set();
    const e1 = makeEstate({ vendor: VENDOR, seen });
    await deliver(core, mediaMsg(), { ...mediaDeps(e1.captured), supabase: e1.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    webhookCore._resetSidLru();
    const e2 = makeEstate({ vendor: VENDOR, seen });
    await deliver(core, mediaMsg(), { ...mediaDeps(e2.captured), supabase: e2.supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
    assert.deepStrictEqual(e2.captured.extractCalls, [], 'a second Vision call fired');
  }

  await t('§8.1 M1 the guard row goes BARE (inboundRow stripped) -> the wamid is never claimed -> RED', async () => {
    await mutate('M1', (s) => s.replace(
      "const { error: guardErr } = await supabase.from('messages').insert(webhookCore.inboundRow({",
      "const { error: guardErr } = await supabase.from('messages').insert(({"), redeliveryCell, /a second Vision call fired/);
  });

  await t('§8.2 M2 the {error} read is killed -> the duplicate is not dropped -> RED', async () => {
    await mutate('M2', (s) => s.replace(
      'if (webhookCore.isDuplicateSidError(guardErr)) {',
      'if (false && webhookCore.isDuplicateSidError(guardErr)) {'), redeliveryCell, /a second Vision call fired/);
  });

  await t('§8.3 M3 the wamid stops being handed to the row-builder -> RED', async () => {
    await mutate('M3', (s) => s.replace(
      "            sent_by:   'vendor',\n            media_url: mediaUrl,\n          }, internalReplay ? null : messageSid));",
      "            sent_by:   'vendor',\n            media_url: mediaUrl,\n          }, null));"), redeliveryCell, /a second Vision call fired/);
  });

  await t('§8.4 M4 the ORDERING reverts — the guard moves after the Vision call -> RED', async () => {
    await mutate('M4', (s) => {
      const a = s.indexOf('        // ── F-05.55 GUARD ROW · BEGIN ──');
      const endMark = '        // ── F-05.55 GUARD ROW · END ──';
      const b = s.indexOf(endMark);
      const region = s.slice(a, b + endMark.length + 1);
      const without = s.slice(0, a) + s.slice(b + endMark.length + 1);
      const anchor = '        if (!proposals || proposals.length === 0) {';
      return without.replace(anchor, region + anchor);
    }, redeliveryCell, /a second Vision call fired/);
  });

  await t('§8.5 M5 the outbound half takes a message_sid -> the R3 cell RED', async () => {
    await mutate('M5', (s) => s.replace(
      "            twilio_sid: sent && sent.sid ? sent.sid : null,\n          });",
      "            twilio_sid: sent && sent.sid ? sent.sid : null,\n            message_sid: 'wamid.OUT1',\n          });"),
    async () => {
      const core = loadCore();
      webhookCore._resetSidLru();
      const { supabase, captured } = makeEstate({ vendor: VENDOR });
      await deliver(core, mediaMsg(), { ...mediaDeps(captured), supabase }, { stableUrl: STABLE, mime: 'image/jpeg' });
      const out = outboundRows(captured)[0];
      assert.ok(!('message_sid' in out), 'outbound row entered the inbound keyspace');
    }, /outbound row entered the inbound keyspace/);
  });

  await t('§8.6 every mutated file restored BYTE-IDENTICAL', () => {
    // Byte-equality against the snapshot taken at bench start — NOT `git status`. A
    // status-based check would demand a dirty tree and go RED the moment the founder
    // commits this very delivery: the same open-ended trap §6 refuses above.
    assert.strictEqual(read(TARGET), PRISTINE, 'the tree did not come back clean');
    assert.ok(/F-05\.55 GUARD ROW · BEGIN/.test(read(TARGET)), 'and the cure is still in it');
  });

  loadCore(); // leave the cache holding the pristine module

  console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
  if (fail === 0) console.log("GREEN — the media lane claims its wamid before it spends, a redelivered image OCRs once, and the outbound half stays out of the inbound keyspace.");
  process.exit(fail === 0 ? 0 : 1);
})();
