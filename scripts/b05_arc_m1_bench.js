// scripts/b05_arc_m1_bench.js — TDW_05 THE COUPLE-LANE MECHANICAL ARC, MOVEMENT M1.
//
// Runnable from any working directory (Q-SP-5): every path is resolved from __dirname.
//   node scripts/b05_arc_m1_bench.js
//
// THE NAMED TESTS, each reproduced RED at the uncured tree by the §7 mutation section
// which edits PRODUCTION CODE, never test setup:
//   §1  the doubled-booking sequence   F-05.41 / C5   (the seal evening's own 1.1s)
//   §2  the swallowed refusal          F-05.33 / C1   (the sentinel nobody read)
//   §3  the opted-out question         G-A    / C1    (her answer always lands)
//   §4  a filed turn vs a narrated one F-05.34 / C2   (the witness, from hands only)
//   §5  the dead-letter row            F-05.42        (the cell whose absence let it live)
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
// Comment-stripped source. Read raw, a file's own prose describing a property
// convicts or acquits it on its disclaimer — the class this estate has convicted
// itself of four times. Assertions read CODE.
const code = (rel) => read(rel).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

const turnLock    = require(P('src/lib/turnLock.js'));
const sendOutcome = require(P('src/lib/sendOutcome.js'));
const witness     = require(P('src/lib/witnessLine.js'));
const { processBrideInbound, metaInputsFrom } = require(P('src/lib/brideInbound.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
async function ta(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function H(s) { console.log(`\n${s}`); }

// ── fakes ───────────────────────────────────────────────────────────────────
// Modelled on b05_m1b_inbound_bench's faithful supabase fake so this bench and the
// floor bench agree about what the core is being driven through.
function makeSupabase(perTable, opts = {}) {
  const inserts = [];
  function builder(table) {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, not: () => b,
      gte: () => b, lte: () => b, limit: () => b,
      insert: (row) => { inserts.push({ table, row }); return b; },
      update: () => b, delete: () => b,
      maybeSingle: () => {
        if (opts.throwOn === table) return Promise.reject(new Error('boom: ' + table));
        return Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null });
      },
      single: () => Promise.resolve((perTable[table] && perTable[table]()) || { data: null, error: null }),
      then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return b;
  }
  return { from: (t2) => builder(t2), rpc: () => Promise.resolve({ data: null, error: null }), __inserts: inserts };
}

const PHONE  = '919625759924';                       // the canonical test bride (CE-64)
const USER   = { id: 'u1', phone: '+' + PHONE, name: 'Test Bride' };
const COUPLE = { id: 'c1', user_id: 'u1', wedding_date: null };
const CONVO  = { id: 'conv1', couple_id: 'c1' };

const realWebhookCore = require(P('src/lib/webhookCore.js'));
function makeCore(spy) {
  return Object.assign(Object.create(realWebhookCore), realWebhookCore, {
    captureDeadLetter: async (args) => { spy.deadLetters.push(args); return { id: 'dl1' }; },
  });
}

function makeDeps({ sends, turn, supabase, core, sendImpl }) {
  return {
    supabase: supabase || makeSupabase({
      circle_members: () => ({ data: null, error: null }),
      users:          () => ({ data: USER, error: null }),
      couples:        () => ({ data: COUPLE, error: null }),
      conversations:  () => ({ data: CONVO, error: null }),
      messages:       () => ({ data: null, error: null }),
    }),
    anthropic: {},
    sendWhatsApp: sendImpl || (async (phone, text, media) => {
      sends.push({ phone, text, media: media || [] });
      return { sid: 'X' };                      // NO `sent` field — the vacuity trap
    }),
    webhookCore: core || realWebhookCore,
    runBrideAgenticTurn: turn || (async () => ({
      reply: 'ok', mediaUrls: [], toolCalls: null, model: 'haiku',
      inputTokens: 1, outputTokens: 2, costUsd: 0, costInr: 0, circleSummary: null,
    })),
    surfacePendingCircleSessions: async () => '',
    saveToMuse: async () => ({ ok: false, error: 'n/a' }),
    checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => {},
    handleSurpriseMe: async () => 'surprise',
    handleCircleMemberMessage: async () => {},
    buildCircleGreeting: () => 'greeting',
    extractMuseUrl: () => null,
    buildMediaContextNote: () => 'note',
    DEAD_END_REPLY: "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in",
    CIRCLE_TOKEN_REGEX: /^CIRCLE-[A-Z0-9]{6}$/,
  };
}
let wamid = 0;
const msg = (text) => ({ from: PHONE, text, messageId: `wamid.M1.${++wamid}`, type: 'text', timestamp: '1', media: [] });
const BOOKING_OK = (amt) => ([{
  name: 'add_booking',
  input: { vendor_name: 'DJ Nashaa', category: 'music', amount_total: amt },
  result: { ok: true, booking: { id: 'b1', vendor_name: 'DJ Nashaa', amount_total: amt } },
}]);

(async () => {

// ══════════════════════════════════════════════════════════════════════════
H('§1 — C5 / F-05.41: THE DOUBLED-BOOKING SEQUENCE');

await ta('§1.1 two turns 1.1s apart on ONE phone do NOT overlap', async () => {
  turnLock._reset();
  const order = [], sends = [];
  let live = 0, maxLive = 0;
  const turn = async () => {
    live++; maxLive = Math.max(maxLive, live);
    order.push('enter');
    // Yield across several microtask/macrotask boundaries — an unlocked core
    // interleaves here, which is exactly what the log witnessed at 300ms apart.
    await new Promise(r => setTimeout(r, 5));
    order.push('exit'); live--;
    return { reply: 'yes', mediaUrls: [], toolCalls: BOOKING_OK(45000), model: 'haiku',
             inputTokens: 1, outputTokens: 1, costUsd: 0, costInr: 0, circleSummary: null };
  };
  const a = processBrideInbound(metaInputsFrom(msg('yeah'), { entry: [] }), makeDeps({ sends, turn }));
  const b = processBrideInbound(metaInputsFrom(msg('Is my haldi on the calendar?'), { entry: [] }), makeDeps({ sends, turn }));
  await Promise.all([a, b]);
  assert.strictEqual(maxLive, 1, `two agentic turns ran CONCURRENTLY (max in flight ${maxLive}) — the estate holds Rs 90,000 for one Rs 45,000 yes`);
  assert.deepStrictEqual(order, ['enter', 'exit', 'enter', 'exit'], `turns interleaved: ${order.join(',')}`);
  assert.strictEqual(sends.length, 2, 'both turns must still answer — serialize, never drop');
});

await ta('§1.2 DIFFERENT phones are NOT serialized (the lock must not become a global queue)', async () => {
  turnLock._reset();
  let live = 0, maxLive = 0;
  const turn = async () => {
    live++; maxLive = Math.max(maxLive, live);
    await new Promise(r => setTimeout(r, 5)); live--;
    return { reply: 'ok', mediaUrls: [], toolCalls: null, model: 'haiku', inputTokens: 1, outputTokens: 1, costUsd: 0, costInr: 0, circleSummary: null };
  };
  const s = [];
  const one = { ...msg('a'), from: '919800000001' };
  const two = { ...msg('b'), from: '919800000002' };
  await Promise.all([
    processBrideInbound(metaInputsFrom(one, { entry: [] }), makeDeps({ sends: s, turn })),
    processBrideInbound(metaInputsFrom(two, { entry: [] }), makeDeps({ sends: s, turn })),
  ]);
  assert.strictEqual(maxLive, 2, 'two different brides must not wait on each other');
});

t('§1.3 the key is lane-scoped — one number on both lanes does not self-block', () => {
  assert.notStrictEqual(turnLock.turnKey('bride', '+919625759924'), turnLock.turnKey('vendor', '+919625759924'),
    'the P4 makeup artist: her vendor briefing must not queue behind her bride turn');
});

await ta('§1.4 the map is REAPED — an in-memory lock with no reaping is an outage with a fuse', async () => {
  turnLock._reset();
  const s = [];
  for (let i = 0; i < 5; i++) {
    await processBrideInbound(metaInputsFrom({ ...msg('x'), from: `9198000001${i}` }, { entry: [] }), makeDeps({ sends: s }));
  }
  await new Promise(r => setTimeout(r, 5));
  assert.strictEqual(turnLock._size(), 0, `five drained conversations left ${turnLock._size()} entries behind`);
});

await ta('§1.5 a THROWN turn does not wedge the conversation forever', async () => {
  turnLock._reset();
  const k = turnLock.turnKey('bride', '+91test');
  await assert.rejects(() => turnLock.withTurnLock(k, async () => { throw new Error('nope'); }));
  const r = await turnLock.withTurnLock(k, async () => 'survivor');
  assert.strictEqual(r, 'survivor', 'the successor never ran — one thrown turn killed the lane');
});

t('§1.6 the single-replica gap is DISCLOSED IN-FILE (F1(b)/CE-58 precedent)', () => {
  const src = read('src/lib/turnLock.js');
  assert.ok(/single-replica/i.test(src) && /replica/i.test(src),
    'the gap must be stated where the next engineer will read it');
  assert.ok(/DEFERRED-NAMED|deferred-named/i.test(src), 'the durable cure must be named, not forgotten');
});

// ══════════════════════════════════════════════════════════════════════════
H('§2 — C1 / F-05.33: THE SWALLOWED REFUSAL');

t('§2.1 the sentinel shape is READ — a blocked return is not a delivery', () => {
  const r = sendOutcome.classifyResult({ sid: null, blocked: 'opted_out', sent: false });
  assert.strictEqual(r.delivered, false);
  assert.strictEqual(r.refusal, 'opted_out');
});

t('§2.2 THE VACUITY TRAP: a bare { sid } with no `sent` field reads DELIVERED', () => {
  // Keying refusal on `sent === false` instead of `blocked` would read every real
  // caller and every existing floor fake as a refusal and invent an outage.
  const r = sendOutcome.classifyResult({ sid: 'X' });
  assert.strictEqual(r.delivered, true);
  assert.strictEqual(r.sid, 'X');
});

t('§2.3 BOTH live shapes: sendWa THROWS where whatsapp.js RETURNS', () => {
  const { WaOptedOutError } = require(P('src/lib/sendWa.js'));
  const thrown = sendOutcome.classifyError(new WaOptedOutError('x'));
  assert.strictEqual(thrown.refusal, 'opted_out', 'the throwing API must classify identically to the returning one');
  const real = sendOutcome.classifyError(new Error('socket hang up'));
  assert.strictEqual(real.refusal, null, 'a transport failure must NOT be laundered into a refusal');
  assert.ok(real.error, 'and it must keep its error');
});

t('§2.4 all three sentinels are enumerated from whatsapp.js, not guessed', () => {
  const wa = code('src/lib/whatsapp.js');
  for (const v of Object.values(sendOutcome.REFUSAL))
    assert.ok(wa.includes(`'${v}'`), `whatsapp.js does not emit '${v}' — the vocabulary drifted`);
});

await ta('§2.5 a REFUSED reply is spoken, not swallowed — and the audit row still lands', async () => {
  turnLock._reset();
  const sends = [], seen = [];
  const supabase = makeSupabase({
    circle_members: () => ({ data: null, error: null }),
    users:  () => ({ data: USER, error: null }),
    couples: () => ({ data: COUPLE, error: null }),
    conversations: () => ({ data: CONVO, error: null }),
    messages: () => ({ data: null, error: null }),
  });
  // The production gate's exact return, reproduced: whatsapp.js:133.
  const sendImpl = async (phone, text, media, from, deps) => {
    seen.push({ text, bypassed: !!deps });
    if (deps) return { sid: 'ACK', sent: true };          // bypass honoured
    return { sid: null, blocked: 'opted_out', sent: false };
  };
  await processBrideInbound(metaInputsFrom(msg('book DJ Nashaa'), { entry: [] }),
    makeDeps({ sends, supabase, sendImpl }));
  const rows = supabase.__inserts.filter(i => i.table === 'messages' && i.row.direction === 'outbound');
  assert.ok(rows.length >= 1, 'the outbound audit row must still be written — it is how we know any of this');
  assert.ok(seen.length >= 1, 'the reply must at least have been attempted');
});

t('§2.6 F-05.48 is NAMED in-file, not silently inherited', () => {
  assert.ok(/F-05\.48/.test(read('src/lib/sendOutcome.js')),
    'the estate-wide sentinel sweep must be named where its seam lives');
});

// ══════════════════════════════════════════════════════════════════════════
H('§3 — G-A / C1: HER ANSWER ALWAYS LANDS');

await ta('§3.1 EVERY send in the inbound frame carries the bypass — asserted STRUCTURALLY', async () => {
  turnLock._reset();
  const seen = [];
  const sendImpl = async (phone, text, media, from, deps) => {
    seen.push({ text, bypassed: !!(deps && typeof deps.isOptedOut === 'function') });
    return { sid: 'X' };
  };
  const sends = [];
  await processBrideInbound(metaInputsFrom(msg('is my sangeet on the calendar?'), { entry: [] }),
    makeDeps({ sends, sendImpl }));
  assert.ok(seen.length >= 1, 'no send was made at all');
  for (const s of seen)
    assert.ok(s.bypassed, `a send inside the inbound frame carried NO bypass — under G-A an answer must land:\n       ${JSON.stringify(s.text).slice(0, 90)}`);
});

t('§3.2 the bypass has ONE home — sendOutcome re-exports, never re-declares', () => {
  const so = code('src/lib/sendOutcome.js');
  assert.ok(!/isOptedOut: async \(\) => false/.test(so),
    'a second home for the bypass object — the next edit drifts one of them');
  assert.ok(/require\('\.\/fullStop'\)/.test(so), 'it must take the constant from fullStop.js');
  assert.strictEqual(sendOutcome.INBOUND_BYPASS, require(P('src/lib/fullStop.js')).ACK_BYPASS,
    'they must be the SAME object, not two objects that agree today');
});

t('§3.3 the four ack sites are BYTE-UNTOUCHED and still carry ACK_BYPASS (F-05.27 held)', () => {
  const bi = code('src/lib/brideInbound.js');
  const acks = bi.split('\n').filter(l => /sendWhatsApp\(phone, getNudgeCopy\(/.test(l));
  assert.strictEqual(acks.length, 4, `expected the four ack sites verbatim, found ${acks.length}`);
  for (const l of acks) assert.ok(/ACK_BYPASS/.test(l), `an ack lost its bypass:\n       ${l.trim()}`);
});

t('§3.4 NO non-ack send in the bride core calls the raw sendWhatsApp', () => {
  const bi = code('src/lib/brideInbound.js');
  const raw = bi.split('\n')
    .filter(l => /sendWhatsApp\(/.test(l))
    .filter(l => !/getNudgeCopy\(/.test(l))
    .filter(l => !/makeInboundSend\(sendWhatsApp\)/.test(l));
  assert.deepStrictEqual(raw.map(s => s.trim()), [],
    'a send bypassed the frame wrapper — that is the drift hole F2(b) was ruled to close');
});

t('§3.5 the circle wire is threaded, not closed over (M-C by inclusion)', () => {
  assert.ok(/handleCircleMemberMessage\(\{[\s\S]{0,400}?\bsend,/.test(code('src/lib/brideInbound.js')),
    'brideInbound must pass `send` into the circle handler');
  const bx = code('src/brideIndex.js');
  assert.ok(/async function handleCircleMemberMessage\(\{\s*\n\s*send,/.test(bx),
    'the circle handler must REQUIRE send — a default would restore the silence invisibly');
  const inFn = bx.slice(bx.indexOf('async function handleCircleMemberMessage'));
  const body = inFn.slice(0, inFn.indexOf('\napp.listen'));
  assert.ok(!/await sendWhatsApp\(/.test(body), 'a circle-wire send still calls the raw API');
});

t('§3.6 the typed refusal exists, is the LOCKED string, and lands on its own bypass', () => {
  const bi = read('src/lib/brideInbound.js');
  assert.ok(bi.includes("I've got that — but you're opted out, so I can't send you anything right now. Reply START and I'll pick this straight up."),
    'V-3 must ship byte-exact');
  assert.ok(/OPTED_OUT_REFUSAL_REPLY/.test(code('src/lib/brideInbound.js')), 'and it must be reachable');
});

// ══════════════════════════════════════════════════════════════════════════
H('§4 — C2 / F-05.34: A FILED TURN IS NOT A NARRATED ONE');

t('§4.1 THE NAMED SPECIMEN: "Saved that." with tool_calls [] gets NO witness', () => {
  assert.strictEqual(witness.witnessFooter([]), null);
  assert.strictEqual(witness.witnessFooter(null), null);
  assert.strictEqual(witness.appendWitness('Saved that.', []), 'Saved that.',
    'a narrated turn must come back byte-identical — the difference is produced by hands or not at all');
});

t('§4.2 a filed booking carries the founder-locked form', () => {
  assert.strictEqual(witness.witnessFooter(BOOKING_OK(80000)), '— Saved: DJ Nashaa, Rs 80,000');
});

t('§4.3 an event files as "— Saved: sangeet, 20 Dec"', () => {
  const f = witness.witnessFooter([{ name: 'add_event',
    input: { title: 'sangeet', event_date: '2026-12-20', kind: 'family' },
    result: { ok: true, event: { id: 'e1', title: 'sangeet', event_date: '2026-12-20' } } }]);
  assert.strictEqual(f, '— Saved: sangeet, 20 Dec');
});

t('§4.4 *** THE 10x WRITE IS VISIBLE ON THE HANDSET *** (F-05.35, why V-4 won)', () => {
  // Indian grouping is the safety property: "Rs 40,00,000" reads as forty lakh to
  // the person who has to catch it in one second. "Rs 4,000,000" does not.
  assert.strictEqual(witness.rupees(400000),  'Rs 4,00,000');
  assert.strictEqual(witness.rupees(4000000), 'Rs 40,00,000');
  assert.strictEqual(witness.rupees(80000),   'Rs 80,000');
  assert.strictEqual(witness.witnessFooter(BOOKING_OK(4000000)), '— Saved: DJ Nashaa, Rs 40,00,000');
});

t('§4.5 an ERRORED hand is not a filing (§2.2 sentence 2)', () => {
  assert.strictEqual(witness.witnessFooter([{ name: 'add_booking',
    input: { vendor_name: 'X', amount_total: 1 }, result: { ok: false, error: 'nope' } }]), null);
});

t('§4.6 READS are never witnessed — only hands that filed', () => {
  assert.strictEqual(witness.witnessFooter([{ name: 'list_events', input: {}, result: { ok: true, events: [] } }]), null);
});

t('§4.7 the create vocabulary never speaks for a change (AMENDED — V-5 closed M1\'s gap)', () => {
  // ══ LABELED AMENDMENT — ARC M2 (V-5, founder 「 A 」). ONE cell amended in place. ══
  // AS SHIPPED AT M1 this cell asserted that delete_event gets NO footer at all —
  // the DECLARED GAP, correct then, because "Saved:" is a false word for a deletion
  // and the honest verbs were copy nobody had approved. V-5 approved them. Left
  // unamended, the cell would now forbid the receipt the founder just ruled in, and
  // would report green about a gap that no longer exists. CE-63's B2 class, second
  // instance in this arc; handled the same way, in the open.
  //
  // The cell's PURPOSE is preserved exactly — no filing may wear a false verb — and
  // is now asserted the only way that still means something: the create vocabulary
  // and the change vocabulary must not overlap, and a change must never render as
  // "Saved:". §8.1-§8.7 assert the receipts themselves.
  const del = witness.witnessFooter([{ name: 'delete_event', input: { event_id: 'e1' },
    result: { ok: true, deleted_event: { title: 'sangeet', event_date: '2026-12-20' } } }]);
  assert.ok(del && !del.includes(witness.PREFIX),
    'a deletion rendered under "Saved:" — the false word this cell has always existed to stop');
  assert.ok(del.startsWith(witness.REMOVED_PREFIX), 'and it must use its own ruled verb');
  assert.ok(!/DECLARED GAP/.test(read('src/lib/witnessLine.js')),
    'the in-file gap notice must go with the gap — a cured finding wearing an open flag is the stale-comment class');
});

await ta('§4.8 the witness reaches the WIRE and the PERSISTED ROW as one body', async () => {
  turnLock._reset();
  const sends = [];
  const supabase = makeSupabase({
    circle_members: () => ({ data: null, error: null }),
    users: () => ({ data: USER, error: null }), couples: () => ({ data: COUPLE, error: null }),
    conversations: () => ({ data: CONVO, error: null }), messages: () => ({ data: null, error: null }),
  });
  const turn = async () => ({ reply: 'Booked.', mediaUrls: [], toolCalls: BOOKING_OK(80000),
    model: 'haiku', inputTokens: 1, outputTokens: 1, costUsd: 0, costInr: 0, circleSummary: null });
  await processBrideInbound(metaInputsFrom(msg('book DJ Nashaa for 80k'), { entry: [] }),
    makeDeps({ sends, supabase, turn }));
  const wire = sends.find(s => /Booked\./.test(s.text));
  assert.ok(wire, 'the reply never reached the wire');
  assert.ok(wire.text.includes('— Saved: DJ Nashaa, Rs 80,000'), `the handset shows no witness:\n       ${wire.text}`);
  const row = supabase.__inserts.find(i => i.table === 'messages' && i.row.direction === 'outbound');
  assert.ok(row, 'no outbound row');
  assert.strictEqual(row.row.body, wire.text,
    'the persisted row and the wire must be ONE body — a witness that only exists in the DB is invisible to S4');
});

t('§4.9 the REPLAY reads tool_calls and reconstructs from hands, never from prose', () => {
  const be = code('src/agent/brideEngine.js');
  assert.ok(/\.select\('direction, body, sent_by, created_at, tool_calls'\)/.test(be),
    'the replay select must carry tool_calls — the indistinguishability WAS the select');
  assert.ok(/appendWitness\(m\.body, m\.tool_calls\)/.test(be), 'and it must use the one home');
  assert.ok(/require\('\.\.\/lib\/witnessLine'\)/.test(be), 'one derivation, both seams');
});

t('§4.10 replay reconstruction is idempotent — a row persisted WITH a footer is not double-marked', () => {
  const once = witness.appendWitness('Booked.', BOOKING_OK(80000));
  assert.strictEqual(witness.appendWitness(once, BOOKING_OK(80000)), once);
});

// ══════════════════════════════════════════════════════════════════════════
H('§5 — F-05.42: THE NET THAT DIED WHEN IT WAS NEEDED');

t('§5.1 the TDZ line is GONE', () => {
  // COMMENT-STRIPPED: the cure's own comment QUOTES the defective line to teach it.
  // Reading raw would convict the file on its own tombstone — the estate's fourth
  // instance of that class, and the reason `code()` exists in this bench.
  assert.ok(!/const phone = phone;/.test(code('src/lib/brideInbound.js')),
    "`const phone = phone` — a const initialised from itself inside its own dead zone");
});

t('§5.2 the dead duplicate return is gone (C10 prose set)', () => {
  assert.ok(!/return;\n\s*return;/.test(code('src/lib/brideInbound.js')), 'unreachable duplicate return');
});

await ta('§5.3 *** THE CELL WHOSE ABSENCE LET THE BUG LIVE *** — drive the catch, assert the ROW lands', async () => {
  turnLock._reset();
  const spy = { deadLetters: [] };
  const sends = [];
  // Make the turn throw AFTER the branches, so the outer catch is the one entered.
  const turn = async () => { throw new Error('engine 400'); };
  await processBrideInbound(metaInputsFrom(msg('what is due this week'), { entry: [] }),
    makeDeps({ sends, turn, core: makeCore(spy) }));
  assert.strictEqual(spy.deadLetters.length, 1,
    'the dead-letter path did not run — the safety net crashed with the turn it exists to record');
  assert.strictEqual(spy.deadLetters[0].service, 'bride');
  assert.strictEqual(spy.deadLetters[0].phone, '+' + PHONE, 'the row must carry the phone, not undefined');
  assert.ok(sends.some(s => /moment|wrong|sorry/i.test(s.text) || s.text.length > 0),
    'the graceful line never went out either');
});

t('§5.4 the vendor twin — the living contrast — still has no shadow declaration', () => {
  assert.ok(!/const phone = phone;/.test(code('src/lib/vendorInbound.js')));
});

// ══════════════════════════════════════════════════════════════════════════
H('§6 — C10 + THE NARROW VENDOR FENCE');

t('§6.1 the stale "via Twilio" heading is dead on a Meta-only estate', () => {
  assert.ok(!/Send the reply via Twilio/.test(code('src/lib/brideInbound.js')));
});

t('§6.2 loop.ts:536 is NOT touched by M1 (it is M4 with the wall)', () => {
  assert.ok(/clean re-run on Sonnet/.test(read('src/engine/src/core/loop.ts')),
    'M1 must not reach into the engine — that comment is M4 and rides the wall opening');
});

t('§6.3 the vendor fence held: lock wiring ALONE', () => {
  const vi = read('src/lib/vendorInbound.js');
  assert.ok(/require\('\.\/turnLock'\)/.test(vi), 'the import');
  assert.ok(/async function _processVendorInbound/.test(vi), 'the wrap');
  assert.ok(/withTurnLock\(turnKey\('vendor'/.test(vi), 'keyed on its own lane');
  assert.ok(!/witnessLine|sendOutcome|makeInboundSend|appendWitness/.test(vi),
    'M1 leaked bride machinery into the vendor lane — the fence was widened NARROWLY');
});

t('§6.4 W-1 HELD: zero soul/prompt bytes in M1', () => {
  const { execSync } = require('child_process');
  const out = execSync('git diff --name-only HEAD', { cwd: ROOT }).toString();
  for (const f of ['miraSoul.js', 'brideSystemPrompt.js', 'circleSystemPrompt.js', 'brideTools.js', 'donnaSoul', 'harveySoul'])
    assert.ok(!out.includes(f), `W-1 BREACH: ${f} was touched by a movement that is not the wall opening`);
});

t('§6.5 the :1892 pre-insert has NO gated Class-C caller — asserted, not assumed', () => {
  // THE RULING ASKED FOR THE MINIMAL SHAPE (gate-before-insert or mark-skipped).
  // Derived by command at this base, the answer is that NEITHER IS NEEDED, because
  // the gated Class-C send the shape would protect against DOES NOT EXIST here:
  //   surfacePendingCircleSessions has exactly two callers —
  //     brideEngine.js:117   (inside runBrideAgenticTurn)
  //     brideInbound.js:516  (the /surprise path, which skips the agent)
  //   and runBrideAgenticTurn has exactly three —
  //     brideInbound.js:569  · api/couple/chat.js:157 · api/couple/chat.js:231
  // Every WhatsApp path reaching the pre-insert sends through the bypassed `send`
  // and therefore LANDS; the remaining path is the sanctuary PWA door, which makes
  // no WhatsApp send at all and so has nothing to gate. NO CRON reaches it.
  // Building a guard for an unreachable path would be inventing a cure for a
  // disease with no specimen — so this cell guards the CENSUS instead: the day
  // someone adds a proactive caller, it fires and the shape gets built then.
  const callers = [];
  for (const f of ['src/agent/brideEngine.js', 'src/lib/brideInbound.js', 'src/brideIndex.js',
                   'src/agent/brideNudge.js', 'src/agent/briefing.js', 'src/api/couple/chat.js']) {
    if (!fs.existsSync(P(f))) continue;
    for (const l of code(f).split('\n'))
      if (/surfacePendingCircleSessions\(\{/.test(l) && !/function/.test(l)) callers.push(f);
  }
  assert.deepStrictEqual([...new Set(callers)].sort(), ['src/agent/brideEngine.js', 'src/lib/brideInbound.js'],
    `a NEW caller of the circle pre-insert appeared: ${callers.join(', ')} — if it is proactive it can now mint a row for a send the full stop gates, and the :1892 shape must be built`);
});

// ══════════════════════════════════════════════════════════════════════════
// §8 — LABELED EXTENSION (ARC M2's ZIP, V-5 founder-locked 「 A 」).
// COUNT DISCLOSED: this bench moves 46 -> 53. Seven cells ADDED, ONE AMENDED
// (§4.7, labeled at its own site — V-5 closed the gap it asserted), zero removed — M1's own thirty-six and its eight mutations plus §7.0 stand
// byte-identical. The extension lands here rather than in M2's bench because the
// witness footer is M1's machinery; V-5 only widened its vocabulary.
H('§8 — V-5: THE UPDATE AND REMOVAL RECEIPTS (labeled extension, 46 -> 53)');

t('§8.1 an update renders the SPECIFIC form from the row the door returned', () => {
  assert.strictEqual(witness.witnessFooter([{ name: 'update_booking',
    input: { booking_id: 'b1', amount_total: 90000 },
    result: { ok: true, booking: { vendor_name: 'DJ Nashaa', amount_total: 90000 } } }]),
    '— Updated: DJ Nashaa, Rs 90,000');
});

t('§8.2 a removal renders the SPECIFIC form — the ruling\'s own worked example', () => {
  // delete_event's ARGUMENTS are event_id alone (brideTools.js:281). This line is
  // producible only from the returned row, which is why the render-from-args law
  // is read as "the witnessed toolCall record", stated in witnessLine.js.
  assert.strictEqual(witness.witnessFooter([{ name: 'delete_event',
    input: { event_id: 'e1' },
    result: { ok: true, deleted_event: { title: 'sangeet', event_date: '2026-12-20' } } }]),
    '— Removed: sangeet, 20 Dec');
});

t('§8.3 *** DEGRADE: no clean entity -> the BARE form, never a guess ***', () => {
  assert.strictEqual(witness.witnessFooter([{ name: 'delete_event',
    input: { event_id: 'e1' }, result: { ok: true, deleted_event: { event_date: '2026-12-20' } } }]),
    '— Removed from your file.');
  assert.strictEqual(witness.witnessFooter([{ name: 'update_event',
    input: { event_id: 'e1' }, result: { ok: true, event: {} } }]),
    '— Updated your file.');
});

t('§8.4 DEGRADE: a hand whose door returns no row at all still gets its receipt', () => {
  assert.strictEqual(witness.witnessFooter([{ name: 'delete_muse_save',
    input: { save_id: 's1' }, result: { ok: true } }]), '— Removed from your file.');
});

t('§8.5 RENDER-FROM-ARGS: model prose can never reach the footer', () => {
  // The reply text is not an input to the derivation at any seam. A turn that says
  // "Removed the sangeet." with an ERRORED hand gets nothing at all.
  assert.strictEqual(witness.witnessFooter([{ name: 'delete_event',
    input: { event_id: 'e1' }, result: { ok: false, error: 'not found' } }]), null);
  assert.strictEqual(witness.appendWitness('Removed the sangeet.',
    [{ name: 'delete_event', input: { event_id: 'e1' }, result: { ok: false, error: 'x' } }]),
    'Removed the sangeet.');
});

t('§8.6 the four V-5 strings ship BYTE-EXACT as locked', () => {
  assert.strictEqual(witness.UPDATED_PREFIX, '— Updated: ');
  assert.strictEqual(witness.REMOVED_PREFIX, '— Removed: ');
  assert.strictEqual(witness.UPDATED_BARE,   '— Updated your file.');
  assert.strictEqual(witness.REMOVED_BARE,   '— Removed from your file.');
});

t('§8.7 the hand census is enumerated from brideTools.js, not guessed', () => {
  const tools = read('src/agent/brideTools.js');
  for (const h of [...Object.keys(witness.UPDATE_HANDS), ...Object.keys(witness.REMOVE_HANDS)])
    assert.ok(tools.includes(`name: '${h}'`), `${h} is not a tool at this tip`);
  // Every create hand keeps "Saved:" — the vocabularies must not overlap or one
  // filing would render under two verbs.
  for (const h of Object.keys(witness.UPDATE_HANDS))
    assert.ok(!witness.FILING_HANDS.has(h), `${h} is in both vocabularies`);
});

// ══════════════════════════════════════════════════════════════════════════
// §7 — THE BOTH-WAYS FLOOR, BY PRODUCTION MUTATION
//
// Each mutation restores a PRE-CURE BYTE into the REAL SOURCE FILE — never into a
// fixture, never into this harness's setup — re-runs this bench in a child process,
// and requires it to go RED on the NAMED cell. A green that survives its own
// disease is indistinguishable from no test at all; this section is what makes the
// thirty-six above evidence rather than decoration. The tree is restored in a
// `finally` whether the child passes, fails, or throws.
if (!process.env.M1_BENCH_CHILD) {
  H('§7 — NON-VACUOUS: EACH CURE REPRODUCED RED AT THE UNCURED TREE');
  const { execFileSync } = require('child_process');

  const MUTATIONS = [
    { cell: '§1.1', why: 'C5 · the turn lock removed — the doubled booking returns',
      file: 'src/lib/brideInbound.js',
      from: "return withTurnLock(turnKey('bride', inputs && inputs.phone), () => _processBrideInbound(inputs, deps));",
      to:   "return _processBrideInbound(inputs, deps);" },

    { cell: '§2.2', why: 'C1 · the sentinel keyed on `sent` instead of `blocked` (the vacuity trap)',
      file: 'src/lib/sendOutcome.js',
      from: '  if (res && res.blocked) {',
      to:   '  if (res && !res.sent) {' },

    { cell: '§2.1', why: 'C1 · the return value discarded again — F-05.33 restored',
      file: 'src/lib/sendOutcome.js',
      from: '  if (res && res.blocked) {',
      to:   '  if (false) {' },

    { cell: '§3.1', why: 'F2(b) · the frame bypass dropped — her answer stops landing',
      file: 'src/lib/sendOutcome.js',
      from: '        opts.bypass === false ? undefined : bypass);',
      to:   '        undefined);' },

    { cell: '§4.8', why: 'C2 · the witness never reaches the body — filed reads like narrated',
      file: 'src/lib/witnessLine.js',
      from: '  const footer = witnessFooter(toolCalls);\n  const text = String(body == null ? \'\' : body);',
      to:   '  const footer = null;\n  const text = String(body == null ? \'\' : body);' },

    { cell: '§4.4', why: 'C2 · western grouping — the 10x write stops being visible in one second',
      file: 'src/lib/witnessLine.js',
      from: '  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }',
      to:   '  while (rest.length > 3) { parts.unshift(rest.slice(-3)); rest = rest.slice(0, -3); }' },

    { cell: '§4.9', why: 'C2 · the replay select narrowed back — the model blind to its own hands',
      file: 'src/agent/brideEngine.js',
      from: ".select('direction, body, sent_by, created_at, tool_calls')",
      to:   ".select('direction, body, sent_by, created_at')" },

    { cell: '§5.3', why: 'F-05.42 · the TDZ restored — the net dies with the turn again',
      file: 'src/lib/brideInbound.js',
      from: '      await webhookCore.captureDeadLetter({ supabase, service: \'bride\', phone, payload: rawPayload, error: err });\n      await send(phone, webhookCore.GRACEFUL_TURN_LINE);',
      to:   '      const phone = phone;\n      await webhookCore.captureDeadLetter({ supabase, service: \'bride\', phone, payload: rawPayload, error: err });\n      await send(phone, webhookCore.GRACEFUL_TURN_LINE);' },
  ];

  for (const m of MUTATIONS) {
    const abs = P(m.file);
    const original = fs.readFileSync(abs, 'utf8');
    try {
      if (!original.includes(m.from)) {
        console.log(`  FAIL ${m.cell} MUTATION — anchor not found in ${m.file} (the mutation is stale, which makes the cell unproven)`);
        fail++; continue;
      }
      fs.writeFileSync(abs, original.replace(m.from, m.to));
      let red = false, out = '';
      try {
        execFileSync(process.execPath, [P('scripts/b05_arc_m1_bench.js')],
          { env: { ...process.env, M1_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' });
      } catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) {
        console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`);
        fail++;
      } else if (!out.includes(`FAIL ${m.cell}`)) {
        const failed = out.split('\n').filter(l => l.startsWith('  FAIL')).map(l => l.slice(7, 14).trim());
        console.log(`  FAIL ${m.cell} MUTATION went red on the WRONG cell(s) [${failed.join(' ')}] — ${m.why}`);
        fail++;
      } else {
        console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`);
        pass++;
      }
    } finally {
      fs.writeFileSync(abs, original);
    }
  }
  // The tree must be byte-identical to how this section found it, or the next
  // reader inherits a mutant. Asserted, not assumed.
  t('§7.0 every mutated file is restored BYTE-IDENTICAL', () => {
    for (const m of MUTATIONS) {
      const now = fs.readFileSync(P(m.file), 'utf8');
      assert.ok(!now.includes(m.to) || m.to === m.from,
        `${m.file} still carries a mutant byte — the next reader would inherit it`);
      assert.ok(now.includes(m.from), `${m.file} did not come back — the cure byte is missing`);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — one bride, one turn at a time · a refusal that speaks · a witness the');
  console.log('founder can read on his own handset · and a dead-letter net that survives the');
  console.log('turn it exists to record. Live witness is the FOUNDER\'s, declared-not-claimed.');
}
process.exit(fail === 0 ? 0 : 1);
})();
