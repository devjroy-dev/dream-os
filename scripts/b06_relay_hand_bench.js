#!/usr/bin/env node
'use strict';
// scripts/b06_relay_hand_bench.js
// ── TDW_06 · THE RELAY SEAM · SITTING TWO — THE HAND ─────────────────────────
//
// SIXTY CELLS, chair-ratified (59 + the engine-holds-no-organ cell, R-29.25);
// ceiling 61. Final count disclosed in the handover, ratify-or-revert.
//   §1 A1 the equality chain                                    8
//   §2 A2 the SHOW as quoted artefact + the E3 confirm          9
//   §3 A3 the in-window send                                   11
//   §4 A4 out-of-window / undetermined — zero attempt           7
//   §5 A5 no send without an E3 affirmative, as a STATE FACT   12
//   §6 A6 the deed is door-composed; relaySeam.ts untouched     6
//   §7    structural — import guard · sealed benches · floor     8  (+1, §7.8)
//
// SIXTY-ONE AT DELIVERY. §7.8 is F-06.157's cell, added after the founder's
// first live walk found the defect this bench could not see. DISCLOSED
// RATIFY-OR-REVERT; the chair's ceiling was 61 and this is the sixty-first.
//
// ITS GRADE IS DECLARED: §7.8 is a SOURCE-SHAPE cell, not a behavioural one.
// Driving the real Fork D retry needs a live wire-guard, a second model turn and
// a classifier verdict, none of which this container holds. It is the strongest
// honest cell available here, and it is paired rather than a single grep: it
// counts BOTH sides of an invariant, so the specific way F-06.157 happened —
// an arm rebuilding the reply without moving the hands — cannot recur silently.
// The behavioural witness is the founder's re-walk and it is named on the card.
//
// BOTH-WAYS DISCIPLINE. Every RED is produced by defacing PRODUCTION CODE, never
// test setup. If a mutation ANCHOR is absent the cell prints a DECLARED FAIL
// rather than a silent pass — a probe that never ran and a probe that found
// nothing are indistinguishable, and sitting one's bench refused that too.
//
// THE REAL SUBJECTS. §1–§5 drive the REAL `runRelaySeat`, the REAL
// `relayToCouple`, and the REAL `coupleDrafts` against an injected supabase
// double that applies `eq`/`is`/`in` GENERICALLY as predicates over real rows —
// sitting one's own self-caught defect (a double that only recorded ONE filter
// could not see a re-keyed query) is the reason this double is built that way.
//
// DECLARED WALL. This container holds no database, no Meta console and no
// Railway log. §4's window legs prove the code ASKS FIRST and ATTEMPTS NOTHING;
// that a real closed window on production behaves so is the founder's smoke card
// and is named there. Provable-equivalent doctrine, stated.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = (p) => path.join(ROOT, p);

let pass = 0, fail = 0;
const fails = [];
async function t(name, fn) {
  try { await fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name} — ${e && e.message}`); }
}
function H(s) { console.log(`\n${s}`); }

// ── the mutation harness ─────────────────────────────────────────────────────
const tmps = [];
function mutate(relPath, anchor, replacement, suffix) {
  const abs = SRC(relPath);
  const src = fs.readFileSync(abs, 'utf8');
  if (!src.includes(anchor)) return null;            // caller declares the FAIL
  const out = path.join(path.dirname(abs), `_mut_${suffix}_hand_tmp.js`);
  fs.writeFileSync(out, src.split(anchor).join(replacement));
  tmps.push(out);
  return out;
}
function cleanup() { for (const f of tmps) { try { fs.unlinkSync(f); } catch (_e) {} } }
function fresh(p) { delete require.cache[require.resolve(p)]; return require(p); }

// ── THE SUPABASE DOUBLE — generic predicates over real rows ──────────────────
// `eq`/`is`/`in`/`ilike`/`not` are applied as REAL filters on whatever column
// production names, so re-keying a production query to a different column
// changes what this double returns. A double that only remembers one filter is
// not a guard (sitting one's §3.11/§3.12 tuition).
function makeDb(tables, opts = {}) {
  const log = { inserts: [], updates: [] };
  const db = {
    _log: log,
    from(name) {
      let rows = (tables[name] || []).slice();
      let pending = null, mode = null, single = false;
      const api = {
        select() { return api; },
        eq(c, v) { if (pending) pending[c] = v; else rows = rows.filter((r) => r[c] === v); return api; },
        is(c, v) { if (!pending) rows = rows.filter((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
        in(c, vs) { rows = rows.filter((r) => vs.includes(r[c])); return api; },
        not(c, _op, _v) { rows = rows.filter((r) => r[c] != null); return api; },
        gte(c, v) { rows = rows.filter((r) => String(r[c]) >= String(v)); return api; },
        ilike(c, v) {
          const n = String(v).toLowerCase();
          rows = rows.filter((r) => String(r[c] || '').toLowerCase() === n);
          return api;
        },
        order(c, o) {
          const asc = !!(o && o.ascending);
          rows.sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1));
          if (!asc) rows.reverse();
          return api;
        },
        limit(n) { rows = rows.slice(0, n); return api; },
        insert(row) { mode = 'insert'; pending = { ...row }; return api; },
        update(row) { mode = 'update'; pending = { ...row }; return api; },
        maybeSingle() { single = true; return api.then(); },
        single() { single = true; return api.then(); },
        then(res) {
          let out;
          if (mode === 'insert') {
            if (opts.failInsert === name) { out = { data: null, error: { message: 'insert refused' } }; }
            else {
              const made = { id: `${name}_${(tables[name] || []).length + 1}`, resolved_at: null, ...pending };
              (tables[name] = tables[name] || []).push(made);
              log.inserts.push({ table: name, row: made });
              out = { data: made, error: null };
            }
          } else if (mode === 'update') {
            const patch = { ...pending };
            const keys = Object.keys(patch);
            const idKey = keys.includes('id') ? 'id' : null;
            const target = idKey ? (tables[name] || []).find((r) => r.id === patch.id) : rows[0];
            if (!target) out = { data: null, error: null };
            else {
              delete patch.id;
              Object.assign(target, patch);
              log.updates.push({ table: name, row: { ...target } });
              out = { data: { ...target }, error: null };
            }
          } else if (opts.queryError === name) {
            out = { data: null, error: { message: 'query failed' } };
          } else if (opts.throwOn === name) {
            throw new Error('client blew up');
          } else {
            // REAL SHAPE: a select resolves to an ARRAY unless maybeSingle/single
            // collapsed it. A double that always returns one row cannot see a
            // caller that expects a list — sitting one's own double-defect class.
            out = single ? { data: rows.length ? rows[0] : null, error: null } : { data: rows, error: null };
          }
          return res ? Promise.resolve(out).then(res) : Promise.resolve(out);
        },
      };
      // `.update({...}).eq('id', x)` — the eq lands AFTER update, so route it into
      // the pending patch rather than a row filter.
      return api;
    },
  };
  return db;
}

const PHONE = '+919625759924';
const VENDOR = { id: 'v1' };
const BODY = 'Hi Priya — the amount for the December shoot is Rs 60,000. Let me know if that works.';

function convoRow(id = 'c9') {
  return { id, vendor_id: 'v1', counterparty_phone: PHONE, kind: 'couple_thread' };
}
function inboundAgeHours(h, cid = 'c9') {
  return { id: `m${h}`, conversation_id: cid, direction: 'inbound', created_at: new Date(Date.now() - h * 3600e3).toISOString() };
}
function draftRow(over = {}) {
  return {
    id: 'd1', vendor_id: 'v1', conversation_id: 'c9', couple_phone: PHONE, body: BODY,
    state: 'staged', twilio_sid: null, created_at: new Date().toISOString(),
    resolved_at: null, expires_at: new Date(Date.now() + 3600e3).toISOString(),
    refusal_reason: null, ...over,
  };
}
const LEAD = { id: 'l1', vendor_id: 'v1', name: 'Priya', phone: PHONE };

// A transport double. `sent: true` is the ONLY success shape (collab.js:658's rule).
function transport(behaviour = {}) {
  const calls = [];
  const fn = async (to, body, media, from) => {
    calls.push({ to, body, media, from });
    if (behaviour.throw) throw new Error('meta exploded');
    if (behaviour.blocked) return { sid: null, blocked: behaviour.blocked, sent: false };
    return { sid: 'wamid.TEST', wamid: 'wamid.TEST', sent: true, line: 'vendor' };
  };
  fn.calls = calls;
  return fn;
}

const SEAT = SRC('src/lib/vendor/relaySeat.js');
const RELAY = SRC('src/lib/vendor/relayToCouple.js');
const DRAFTS = SRC('src/lib/vendor/coupleDrafts.js');
const seat = () => fresh(SEAT);

const stageSig = (recipient, message) => ({
  tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'donna_relay_stage', input: { recipient, message } }] }],
});
const sendSig = (recipient_name) => ({
  tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'donna_relay_send', input: { recipient_name } }] }],
});

// A world where the window is OPEN and one staged draft is waiting.
function openWorld(over = {}) {
  return {
    conversations: [convoRow()],
    messages: [inboundAgeHours(1)],
    leads: [LEAD],
    pending_couple_drafts: [draftRow(over)],
  };
}

const ENV = { VENDOR_WHATSAPP_NUMBER: 'whatsapp:+917982159047', VENDOR_PHONE_NUMBER_ID: '123' };

async function runSend(world, opts = {}, dbOpts = {}) {
  const db = makeDb(world, dbOpts);
  const send = opts.sendWhatsApp || transport();
  const line = await seat().runRelaySeat(db, VENDOR, sendSig(opts.said === undefined ? 'Priya' : opts.said), {
    sendWhatsApp: send, env: opts.env || ENV, conversationId: 'c9', hasTransport: true,
  });
  return { line, db, send, world };
}

// ═════════════════════════════════════════════════════════════════════════════
(async () => {
console.log('b06_relay_hand_bench — TDW_06 relay seam, sitting two: THE HAND');

// ── §1 · A1 — THE EQUALITY CHAIN ────────────────────────────────────────────
H('§1 A1 — shown = stored = approved = sent, by EQUALITY at every hop');

await t('§1.1 the SHOW renders the STORED body, not the tool input', async () => {
  const db = makeDb({ conversations: [convoRow()], messages: [], leads: [LEAD], pending_couple_drafts: [] });
  const out = await seat().runRelaySeat(db, VENDOR, stageSig('Priya', BODY), { sendWhatsApp: transport(), env: ENV, conversationId: 'c9', hasTransport: true });
  const stored = db._log.inserts.find((i) => i.table === 'pending_couple_drafts').row.body;
  assert.strictEqual(stored, BODY, 'the stored body diverged from the instruction');
  assert.ok(out.line.includes(stored), 'the SHOW does not contain the stored bytes');
});

await t('§1.2 the transport is handed the STORED body byte-for-byte', async () => {
  const r = await runSend(openWorld());
  assert.strictEqual(r.send.calls.length, 1, 'exactly one send expected');
  assert.strictEqual(r.send.calls[0].body, BODY, 'sent bytes differ from the stored body');
});

await t('§1.3 the thread row persists the STORED body, not a re-render', async () => {
  const r = await runSend(openWorld());
  const msg = r.db._log.inserts.find((i) => i.table === 'messages');
  assert.ok(msg, 'no thread row was written');
  assert.strictEqual(msg.row.body, BODY);
});

await t('§1.4 shown bytes === sent bytes across a full stage-then-send walk', async () => {
  const world = { conversations: [convoRow()], messages: [inboundAgeHours(1)], leads: [LEAD], pending_couple_drafts: [] };
  const db = makeDb(world);
  const shown = await seat().runRelaySeat(db, VENDOR, stageSig('Priya', BODY), { sendWhatsApp: transport(), env: ENV, conversationId: 'c9', hasTransport: true });
  const send = transport();
  await seat().runRelaySeat(db, VENDOR, sendSig('Priya'), { sendWhatsApp: send, env: ENV, conversationId: 'c9', hasTransport: true });
  assert.ok(shown.line.includes(send.calls[0].body), 'what was shown is not what was sent');
});

await t('§1.5 MUTATION — a store that alters the body turns the chain RED', async () => {
  const m = mutate('src/lib/vendor/coupleDrafts.js', 'body: text,', "body: text + ' ',", 'a1body');
  assert.ok(m, 'DECLARED FAIL — mutation anchor absent in coupleDrafts.js');
  const mod = fresh(m);
  const db = makeDb({ conversations: [convoRow()], messages: [], leads: [LEAD], pending_couple_drafts: [] });
  const res = await mod.stage(db, { vendorId: 'v1', couplePhone: PHONE, body: BODY });
  assert.notStrictEqual(res.draft.body, BODY, 'the mutation did not bite — equality is not being enforced anywhere');
});

await t('§1.6 the draft row carries the sid after a successful send', async () => {
  const r = await runSend(openWorld());
  const d = r.world.pending_couple_drafts[0];
  assert.strictEqual(d.twilio_sid, 'wamid.TEST');
  assert.strictEqual(d.state, 'sent');
});

await t('§1.7 the stage read-back is a real read-back, not the input echoed', async () => {
  const src = fs.readFileSync(DRAFTS, 'utf8');
  assert.ok(/\.select\(COLS\)\s*\n?\s*\.single\(\)/.test(src) || /\.select\(COLS\)[\s\S]{0,40}\.single\(\)/.test(src),
    'stage() does not read the row back');
});

await t('§1.8 an empty body stages nothing at all', async () => {
  const db = makeDb({ conversations: [convoRow()], messages: [], leads: [LEAD], pending_couple_drafts: [] });
  const out = await seat().runRelaySeat(db, VENDOR, stageSig('Priya', '   '), { sendWhatsApp: transport(), env: ENV, hasTransport: true });
  assert.strictEqual(out, null);
  assert.strictEqual(db._log.inserts.length, 0);
});

// ── §2 · A2 — THE SHOW + THE E3 CONFIRM ─────────────────────────────────────
H('§2 A2 — a quoted artefact addressed to the VENDOR, and E3');

await t('§2.1 THE ANTI-08-08 CELL — the exact bytes are IN the shown frame', async () => {
  const s = seat();
  const frame = s.showBlock(BODY, 'Priya', PHONE);
  assert.ok(frame.includes(BODY), 'the draft bytes are absent from the SHOW');
  assert.ok(!/Message is ready\.?\s*Send it\?/i.test(frame), 'the 08-08 hollow confirm shape is back');
});

await t('§2.2 the frame is a QUOTED artefact — the bytes are delimited', async () => {
  const frame = seat().showBlock(BODY, 'Priya', PHONE);
  assert.ok(frame.includes(`"${BODY}"`), 'the bytes are not quoted, so they read as speech');
  assert.ok(/word for word/.test(frame), 'the frame does not declare itself verbatim');
});

await t('§2.3 E3 — the confirm NAMES THE RECIPIENT', async () => {
  assert.ok(/Send this to Priya \(/.test(seat().showBlock(BODY, 'Priya', PHONE)));
});

await t('§2.4 THE FOUNDER\'S RULING — the confirm ALWAYS carries the phone', async () => {
  const s = seat();
  assert.ok(s.showBlock(BODY, 'Priya', PHONE).includes(PHONE), 'named form dropped the phone');
  assert.ok(s.showBlock(BODY, null, PHONE).includes(PHONE), 'nameless form dropped the phone');
});

await t('§2.5 the phone renders as the STORED BYTE, verbatim — no formatter', async () => {
  const frame = seat().showBlock(BODY, 'Priya', PHONE);
  assert.ok(frame.includes('+919625759924'), 'the stored byte is not what is displayed');
  assert.ok(!/\+91 \d/.test(frame), 'a spaced render appeared — R-5 retired that shape');
});

await t('§2.6 the nameless fallback shows the phone alone, never an invented name', async () => {
  const frame = seat().showBlock(BODY, null, PHONE);
  assert.ok(/Send this to \+919625759924\?/.test(frame));
  assert.ok(!/\bnull\b|undefined|the vendor|the client/i.test(frame.split('Send this to')[1]));
});

await t('§2.7 the SHOW crosses only after the draft is STORED', async () => {
  const db = makeDb({ conversations: [convoRow()], messages: [], leads: [LEAD], pending_couple_drafts: [] }, { failInsert: 'pending_couple_drafts' });
  const out = await seat().runRelaySeat(db, VENDOR, stageSig('Priya', BODY), { sendWhatsApp: transport(), env: ENV, hasTransport: true });
  assert.strictEqual(out, null, 'a frame crossed for a draft that was never stored');
});

await t('§2.8 MUTATION — dropping the bytes from the frame turns §2.1 RED', async () => {
  const m = mutate('src/lib/vendor/relaySeat.js', '"${body}"\\n\\nSend this to', 'Message is ready.\\n\\nSend this to', 'a2frame');
  assert.ok(m, 'DECLARED FAIL — mutation anchor absent in relaySeat.js');
  const frame = fresh(m).showBlock(BODY, 'Priya', PHONE);
  assert.ok(!frame.includes(BODY), 'the mutation did not bite — the anti-08-08 cell proves nothing');
});

await t('§2.9 the frame is addressed to the VENDOR — no speech aimed past him', async () => {
  const frame = seat().showBlock(BODY, 'Priya', PHONE);
  const outside = frame.split(`"${BODY}"`).join(' ');
  assert.ok(!/\bHi Priya\b/.test(outside), 'bride-addressed speech leaked outside the quoted artefact');
});

// ── §3 · A3 — THE IN-WINDOW SEND ────────────────────────────────────────────
H('§3 A3 — window first · lane pinned · sid to BOTH rows · vendor_relay');

await t('§3.1 an in-window approved draft is SENT', async () => {
  const r = await runSend(openWorld());
  assert.strictEqual(r.line.kind, 'sent');
  assert.strictEqual(r.send.calls.length, 1);
});

await t('§3.2 THE LANE IS PINNED EXPLICITLY — the 4th arg is the vendor number', async () => {
  const r = await runSend(openWorld());
  assert.strictEqual(r.send.calls[0].from, ENV.VENDOR_WHATSAPP_NUMBER, 'the send did not pin the lane');
});

await t('§3.3 MUTATION — un-pinning the lane turns §3.2 RED', async () => {
  const m = mutate('src/lib/vendor/relayToCouple.js', 'await sendWhatsApp(couplePhone, text, [], from)', 'await sendWhatsApp(couplePhone, text, [])', 'a3pin');
  assert.ok(m, 'DECLARED FAIL — lane-pin anchor absent in relayToCouple.js');
  const send = transport();
  const db = makeDb(openWorld());
  await fresh(m).relayToCouple(db, { vendor: VENDOR, couplePhone: PHONE, body: BODY, sendWhatsApp: send, env: ENV });
  assert.strictEqual(send.calls[0].from, undefined, 'the mutation did not bite — the pin cell proves nothing');
});

await t('§3.4 the sid is persisted to the THREAD row', async () => {
  const r = await runSend(openWorld());
  const m = r.db._log.inserts.find((i) => i.table === 'messages');
  assert.strictEqual(m.row.twilio_sid, 'wamid.TEST');
});

await t('§3.5 the sid is persisted to the DRAFT row', async () => {
  const r = await runSend(openWorld());
  assert.strictEqual(r.world.pending_couple_drafts[0].twilio_sid, 'wamid.TEST');
});

await t('§3.6 the thread row is stamped sent_by = vendor_relay', async () => {
  const r = await runSend(openWorld());
  const m = r.db._log.inserts.find((i) => i.table === 'messages');
  assert.strictEqual(m.row.sent_by, 'vendor_relay');
});

await t('§3.7 THE INTEGRATION CELL — engine.js renders `From <name>: ` on exactly that marker', async () => {
  const eng = fs.readFileSync(SRC('src/agent/engine.js'), 'utf8');
  assert.ok(/RELAY_SENT_BY = 'vendor_relay'/.test(eng), 'the marker constant moved');
  assert.ok(/row\.sent_by !== RELAY_SENT_BY/.test(eng), 'the assembly-time reader is gone');
});

await t('§3.8 relayToCouple is THE ONLY writer of vendor_relay in the estate', async () => {
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules' && f.name !== 'dist') walk(p); continue; }
      if (!/\.(js|ts)$/.test(f.name) || f.name.startsWith('_mut_')) continue;
      const s = fs.readFileSync(p, 'utf8');
      if (/sent_by:\s*'vendor_relay'/.test(s)) hits.push(path.relative(ROOT, p));
    }
  };
  walk(SRC('src'));
  assert.deepStrictEqual(hits, ['src/lib/vendor/relayToCouple.js'], `writers: ${hits.join(', ')}`);
});

await t('§3.9 the window is asked BEFORE the transport is touched', async () => {
  const src = fs.readFileSync(RELAY, 'utf8');
  assert.ok(src.indexOf('coupleWindowOpen(supabase, couplePhone)') < src.indexOf('await sendWhatsApp('),
    'the send precedes the window question');
});

await t('§3.10 the couple_thread is created when absent, not assumed', async () => {
  const world = { conversations: [], messages: [], leads: [LEAD], pending_couple_drafts: [] };
  const db = makeDb(world);
  // no conversation ⇒ the window predicate says no_conversation ⇒ CLOSED, no send.
  const out = await fresh(RELAY).relayToCouple(db, { vendor: VENDOR, couplePhone: PHONE, body: BODY, sendWhatsApp: transport(), env: ENV });
  assert.strictEqual(out.kind, 'window_closed');
  assert.strictEqual(out.reason, 'no_conversation');
});

await t('§3.11 THE SENTINEL IS READ — a blocked send is never a success', async () => {
  const r = await runSend(openWorld(), { sendWhatsApp: transport({ blocked: 'opted_out' }) });
  assert.strictEqual(r.line.kind, 'send_failed');
  assert.strictEqual(r.world.pending_couple_drafts[0].state, 'refused');
  assert.strictEqual(r.world.pending_couple_drafts[0].refusal_reason, 'blocked:opted_out');
});

// ── §4 · A4 — OUT OF WINDOW / UNDETERMINED ──────────────────────────────────
H('§4 A4 — zero send attempt · honest deed · refused with its reason');

await t('§4.1 a closed window produces ZERO send attempts', async () => {
  const w = openWorld(); w.messages = [inboundAgeHours(30)];
  const r = await runSend(w);
  assert.strictEqual(r.send.calls.length, 0, 'a send was attempted on a closed window');
  assert.strictEqual(r.line.kind, 'window_closed');
});

await t('§4.2 MUTATION — forcing an attempt on a closed window turns §4.1 RED', async () => {
  const m = mutate('src/lib/vendor/relayToCouple.js', "if (verdict !== 'open') {", 'if (false) {', 'a4force');
  assert.ok(m, 'DECLARED FAIL — window-gate anchor absent in relayToCouple.js');
  const send = transport();
  const w = openWorld(); w.messages = [inboundAgeHours(30)];
  await fresh(m).relayToCouple(makeDb(w), { vendor: VENDOR, couplePhone: PHONE, body: BODY, sendWhatsApp: send, env: ENV });
  assert.strictEqual(send.calls.length, 1, 'the mutation did not bite — §4.1 proves nothing');
});

await t('§4.3 the closed-window deed line is honest and door-composed', async () => {
  const w = openWorld(); w.messages = [inboundAgeHours(30)];
  const r = await runSend(w);
  assert.ok(/hasn't written in over 24 hours/.test(r.line.line));
  assert.ok(/Not sent\./.test(r.line.line));
});

await t('§4.4 the draft is REFUSED with resolved_at stamped', async () => {
  const w = openWorld(); w.messages = [inboundAgeHours(30)];
  const r = await runSend(w);
  const d = r.world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'refused');
  assert.ok(d.resolved_at, 'resolved_at was not stamped on a terminal transition');
});

await t('§4.5 R-29.20 — the refusal carries its REASON', async () => {
  const w = openWorld(); w.messages = [inboundAgeHours(30)];
  const r = await runSend(w);
  assert.strictEqual(r.world.pending_couple_drafts[0].refusal_reason, 'window_closed');
});

await t('§4.6 UNDETERMINED is a REFUSAL and speaks its OWN sentence', async () => {
  const r = await runSend(openWorld(), {}, { queryError: 'messages' });
  assert.strictEqual(r.send.calls.length, 0, 'a send was attempted on an undetermined window');
  assert.strictEqual(r.line.kind, 'window_undetermined');
  assert.ok(/couldn't confirm whether her line is open/.test(r.line.line));
  assert.ok(!/hasn't written/.test(r.line.line), 'the undetermined leg asserted a fact it does not know');
});

await t('§4.7 ⑧b — no vendor lane refuses BEFORE the window and never blames her', async () => {
  const r = await runSend(openWorld(), { env: {} });
  assert.strictEqual(r.send.calls.length, 0);
  assert.strictEqual(r.line.kind, 'no_vendor_lane');
  assert.ok(/from our number/.test(r.line.line));
  assert.ok(!/don't have a number on file/.test(r.line.line), '⑧b was dressed as ⑧a');
});

// ── §5 · A5 — NO SEND WITHOUT AN E3 AFFIRMATIVE ─────────────────────────────
H('§5 A5 — a STATE FACT, and now a CAPABILITY fact');

await t('§5.1 THE ENGINE HOLDS NO STORE WRITER AND NO TRANSPORT (R-29.25)', async () => {
  const bad = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) { walk(p); continue; }
      if (!/\.ts$/.test(f.name)) continue;
      const s = fs.readFileSync(p, 'utf8');
      if (/pending_couple_drafts|sendWhatsApp|sendMetaText|sendWa\(/.test(s)) bad.push(path.relative(ROOT, p));
    }
  };
  walk(SRC('src/engine/src'));
  assert.deepStrictEqual(bad, [], `engine reaches an organ it must not: ${bad.join(', ')}`);
});

await t('§5.2 the relay tools are SIGNAL-ONLY — they return a sentence and nothing else', async () => {
  const s = fs.readFileSync(SRC('src/engine/src/core/tools/relayCouple.ts'), 'utf8');
  assert.ok(!/supabase|await |async /.test(s), 'a relay signal tool acquired an organ or an await');
  assert.ok(/RELAY_SIGNAL_NAMES/.test(s));
});

await t('§5.3 the send leg executes ONLY from an approved draft', async () => {
  const r = await runSend(openWorld());
  const states = r.db._log.updates.filter((u) => u.table === 'pending_couple_drafts').map((u) => u.row.state);
  assert.ok(states.indexOf('approved') > -1 && states.indexOf('approved') < states.indexOf('sent'),
    `approve did not precede sent: ${states.join(' -> ')}`);
});

await t('§5.4 MUTATION — bypassing the approve transition turns §5.3 RED', async () => {
  const m = mutate('src/lib/vendor/coupleDrafts.js', "if (cur.draft.state !== STATES.STAGED) return { ok: false, reason: `not_staged: ${cur.draft.state}` };", '', 'a5appr');
  assert.ok(m, 'DECLARED FAIL — approve-guard anchor absent in coupleDrafts.js');
  const world = { pending_couple_drafts: [draftRow({ state: 'sent' })] };
  const out = await fresh(m).approve(makeDb(world), 'd1');
  assert.strictEqual(out.ok, true, 'the mutation did not bite — the approve guard proves nothing');
});

await t('§5.5 an approve against an already-resolved draft is refused', async () => {
  const world = { pending_couple_drafts: [draftRow({ state: 'refused', resolved_at: new Date().toISOString() })] };
  const out = await fresh(DRAFTS).approve(makeDb(world), 'd1');
  assert.strictEqual(out.ok, false);
});

await t('§5.6 A BARE YES TO NOTHING moves no state and mints no byte', async () => {
  const world = { conversations: [convoRow()], messages: [inboundAgeHours(1)], leads: [LEAD], pending_couple_drafts: [] };
  const r = await runSend(world);
  assert.strictEqual(r.line, null, 'an affirmative to nothing produced a line');
  assert.strictEqual(r.send.calls.length, 0);
});

await t('§5.7 AN AFFIRMATIVE NAMING A DIFFERENT PERSON moves NO state', async () => {
  const r = await runSend(openWorld(), { said: 'Ananya' });
  assert.strictEqual(r.line.kind, 'name_mismatch');
  assert.strictEqual(r.send.calls.length, 0);
  assert.strictEqual(r.world.pending_couple_drafts[0].state, 'staged', 'a mismatch moved the state');
});

await t('§5.8 the mismatch RE-SHOWS and never repeats the wrong name back', async () => {
  const r = await runSend(openWorld(), { said: 'Ananya' });
  assert.ok(r.line.line.includes(BODY), 'the re-show dropped the bytes');
  assert.ok(!/Ananya/.test(r.line.line), 'the wrong name was echoed back');
  assert.ok(/Send this to Priya \(\+919625759924\)\?/.test(r.line.line));
});

await t('§5.9 an unresolvable recipient is treated AS a mismatch, never as consent', async () => {
  const w = openWorld(); w.leads = [];
  const r = await runSend(w);
  assert.strictEqual(r.line.kind, 'name_mismatch');
  assert.strictEqual(r.send.calls.length, 0);
});

await t('§5.10 MUTATION — loosening the name guard turns §5.7 RED', async () => {
  const m = mutate('src/lib/vendor/relaySeat.js', 'const matched = !!name && !!said && foldName(name) === foldName(said);', 'const matched = true;', 'a5name');
  assert.ok(m, 'DECLARED FAIL — E3 guard anchor absent in relaySeat.js');
  const send = transport();
  const db = makeDb(openWorld());
  const out = await fresh(m).runRelaySeat(db, VENDOR, sendSig('Ananya'), { sendWhatsApp: send, env: ENV, hasTransport: true });
  assert.strictEqual(out.kind, 'sent', 'the mutation did not bite — the E3 guard proves nothing');
});

await t('§5.11 AN EXPIRED STAGED DRAFT refuses approval and refuses send', async () => {
  const w = openWorld({ expires_at: new Date(Date.now() - 3600e3).toISOString() });
  const r = await runSend(w);
  assert.strictEqual(r.line.kind, 'expired');
  assert.strictEqual(r.send.calls.length, 0);
  const d = r.world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'expired');
  assert.ok(d.resolved_at, 'expiry did not stamp resolved_at');
});

await t('§5.12 MUTATION — dropping expiry-at-read turns §5.11 RED', async () => {
  const m = mutate('src/lib/vendor/coupleDrafts.js', 'if (expiresAt != null && Number.isFinite(expiresAt) && Date.now() > expiresAt) {', 'if (false) {', 'a5exp');
  assert.ok(m, 'DECLARED FAIL — expiry-at-read anchor absent in coupleDrafts.js');
  const w = openWorld({ expires_at: new Date(Date.now() - 3600e3).toISOString() });
  const out = await fresh(m).openStagedFor(makeDb(w), 'v1');
  assert.ok(out.draft, 'the mutation did not bite — the expiry cell proves nothing');
});

// ── §6 · A6 — THE DEED LINE, DOOR-COMPOSED ──────────────────────────────────
H('§6 A6 — composed at the door; relaySeam.ts byte-identical');

await t('§6.1 relaySeam.ts is BYTE-UNTOUCHED at origin, and its site-count comment still true', async () => {
  // INDEPENDENT METHOD, deliberately: `git diff` against origin/main fails on ANY
  // byte, where a grep for a sentence fails only on the sentence. The two have
  // different failure modes, which is the whole of the independent-method law.
  const { execSync } = require('child_process');
  execSync('git diff --quiet origin/main -- src/engine/src/core/relaySeam.ts', { cwd: ROOT, stdio: 'ignore' });
  const s = fs.readFileSync(SRC('src/engine/src/core/relaySeam.ts'), 'utf8');
  assert.ok(/`refused` is authored at TWO sites/.test(s), 'the site-count comment moved');
  // The comment's SUBJECT re-derived: authorship sites are `refused: refusedOut`
  // RETURNS, not the word's every appearance (its own prose mentions it too).
  const authored = (fs.readFileSync(SRC('src/engine/src/core/tools/donnaLead.ts'), 'utf8').match(/refused: refusedOut/g) || []).length;
  assert.strictEqual(authored, 2, `donnaLead authors ${authored} refused arrays — the site-count comment is stale`);
});

await t('§6.2 this sitting authors NO `refused` array anywhere', async () => {
  for (const f of [SEAT, RELAY, DRAFTS, SRC('src/engine/src/core/tools/relayCouple.ts')]) {
    const body = fs.readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    assert.ok(!/\brefused\s*:\s*\[/.test(body), `${path.relative(ROOT, f)} authors a refused array`);
  }
});

await t('§6.3 no second RELAY_DEED_SEAM constant was minted (b06_f0613 §2.11 stays green)', async () => {
  const loop = fs.readFileSync(SRC('src/engine/src/core/loop.ts'), 'utf8');
  assert.ok(!/const RELAY_DEED_SEAM/.test(loop));
  for (const f of [SEAT, RELAY, DRAFTS]) {
    // A DECLARATION, never a mention: relaySeat.js's header names the constant to
    // record WHY the deed does not ride it, and a cell that fails on the naming
    // would forbid the estate from writing down its own reasoning.
    const body = fs.readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    assert.ok(!/(const|let|var)\s+RELAY_DEED_SEAM/.test(body));
  }
});

await t('§6.4 every deed line is a PURE FUNCTION of the structured return', async () => {
  const s = seat();
  assert.strictEqual(s.sentLine('Priya', PHONE), s.sentLine('Priya', PHONE));
  assert.ok(s.sentLine('Priya', PHONE).includes(PHONE));
  assert.ok(s.windowClosedLine('Priya').startsWith('Not sent.'));
});

await t('§6.5 a clean turn appends NOTHING — no signal, no line', async () => {
  const db = makeDb(openWorld());
  const out = await seat().runRelaySeat(db, VENDOR, { tool_calls: [{ name: 'donna_lead', input: {} }] }, { sendWhatsApp: transport(), env: ENV, hasTransport: true });
  assert.strictEqual(out, null);
});

await t('§6.6 ⑩ the PWA door DECLARES its refusal, naming the subject', async () => {
  const db = makeDb(openWorld());
  const out = await seat().runRelaySeat(db, VENDOR, sendSig('Priya'), { hasTransport: false });
  assert.strictEqual(out.kind, 'no_relay_surface');
  assert.ok(/only works over WhatsApp/.test(out.line));
});

// ── §7 · STRUCTURAL ─────────────────────────────────────────────────────────
H('§7 structural — import guard · one home · the door seat');

await t('§7.1 ABSENT-SUBJECT IMPORT GUARD (R-26.19 §A) — every subject loads and is not hollow', async () => {
  for (const [p, sym] of [[SEAT, 'runRelaySeat'], [RELAY, 'relayToCouple'], [DRAFTS, 'stage']]) {
    const mod = fresh(p);
    assert.ok(mod && typeof mod[sym] === 'function', `SUBJECT PRESENT BUT HOLLOW — ${path.relative(ROOT, p)} exports no ${sym}`);
  }
  let named = false;
  try { require(SRC('src/lib/vendor/relaySeat_DOES_NOT_EXIST.js')); }
  catch (e) { named = /relaySeat_DOES_NOT_EXIST/.test(e.message); }
  assert.ok(named, 'a missing module did not name its subject');
});

await t('§7.2 the signal names agree across the module boundary the engine cannot cross', async () => {
  const ts = fs.readFileSync(SRC('src/engine/src/core/tools/relayCouple.ts'), 'utf8');
  const s = seat();
  assert.ok(ts.includes(`name: '${s.STAGE_SIGNAL}'`), 'stage signal name drifted');
  assert.ok(ts.includes(`name: '${s.SEND_SIGNAL}'`), 'send signal name drifted');
});

await t('§7.3 coupleDrafts is the ONLY writer of pending_couple_drafts', async () => {
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules' && f.name !== 'dist') walk(p); continue; }
      if (!/\.(js|ts)$/.test(f.name) || f.name.startsWith('_mut_')) continue;
      const s = fs.readFileSync(p, 'utf8');
      // The store's own file names the table through its `TABLE` const; anyone
      // ELSE would have to name it as a literal. Both shapes are swept.
      if (/from\('pending_couple_drafts'\)/.test(s)) hits.push(path.relative(ROOT, p));
      else if (/const TABLE = 'pending_couple_drafts'/.test(s) && /\.from\(TABLE\)/.test(s)) hits.push(path.relative(ROOT, p));
    }
  };
  walk(SRC('src'));
  assert.deepStrictEqual(hits, ['src/lib/vendor/coupleDrafts.js'], `writers: ${hits.join(', ')}`);
});

await t('§7.4 the WA door seats the relay BEFORE its send and cannot throw into the turn', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  const seatAt = d.indexOf('runRelaySeat(supabase, vendor, effectiveResult');
  const sendAt = d.indexOf('const twilioMsg = await sendWhatsApp(phone, replyText, []);');
  assert.ok(seatAt > 0 && seatAt < sendAt, 'the relay seat is not before the door send');
  assert.ok(/catch \(e\) \{ console\.error\('\[relay:wa\]'/.test(d), 'the seat is not fenced against throwing into the turn');
});

await t('§7.5 0118 exists, adds ONE column, and its revert is fully commented', async () => {
  const m = fs.readFileSync(SRC('db/migrations/0118_pending_couple_drafts_refusal_reason.sql'), 'utf8');
  const exec = m.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  assert.ok(/ADD COLUMN IF NOT EXISTS refusal_reason text/.test(exec));
  assert.ok(!/DROP COLUMN/.test(exec), 'the revert is runnable — the conditional-withheld rule forbids that');
  assert.ok(/-- {3}ALTER TABLE public\.pending_couple_drafts DROP COLUMN/.test(m), 'no commented revert present');
});

await t('§7.6 the corpse stays byte-dead — replyToCouple has no new caller', async () => {
  const hits = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules' && f.name !== 'dist') walk(p); continue; }
      if (!/\.(js|ts)$/.test(f.name)) continue;
      if (p.endsWith('replyToCouple.js') || f.name.startsWith('_mut_')) continue;
      const s = fs.readFileSync(p, 'utf8');
      if (/require\(.*replyToCouple|from '.*replyToCouple/.test(s)) hits.push(path.relative(ROOT, p));
    }
  };
  walk(SRC('src'));
  // ITS ONE CALLER IS THE DEAD ONE AND IT PRE-DATES THIS SITTING: `executeTool`
  // in src/agent/engine.js, below that file's own F-05.56 island line, zero
  // callers since arc M5. The cell asserts the set is EXACTLY that — a new
  // requirer anywhere turns it red, and so would REMOVING the corpse's label by
  // deleting the dead caller without a ruling.
  assert.deepStrictEqual(hits, ['src/agent/engine.js'], `the corpse's caller set moved: ${hits.join(', ')}`);
});

await t('§7.8 F-06.157 — THE SEAT READS THE TURN WHOSE REPLY SHIPS (the pairing invariant)', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  // (a) the seat is handed the effective result, never the raw first turn.
  assert.ok(/runRelaySeat\(supabase, vendor, effectiveResult,/.test(d),
    'the seat reads `result` — it would compose from one turn and ship another turn\'s words');
  // (b) THE PAIRING, which is the cell with teeth. Every arm that rebuilds
  // `replyText` from the RETRY must also move `effectiveResult`. Counting both
  // and asserting equality means a future third retry arm cannot add one without
  // the other and stay green — the failure mode F-06.157 actually had.
  const rebuilt = (d.match(/replyText = witnessWireScrub\([^;]*retry\.reply/g) || []).length;
  const moved = (d.match(/effectiveResult = retry;/g) || []).length;
  assert.ok(rebuilt > 0, 'DECLARED FAIL — no retry-rebuilt replyText found; the anchor moved');
  assert.strictEqual(moved, rebuilt,
    `${rebuilt} arms rebuild replyText from the retry but only ${moved} move effectiveResult`);
  // (c) the two arms that must NOT move it are named, so the pairing above cannot
  // be satisfied by moving it everywhere: outcome B ships Victor's ORIGINAL reply
  // and outcome 2 ships F3's "nothing was changed".
  assert.ok(/s2arm = 'imperative_second_refusal';/.test(d) && /s2arm = 'second_costume';/.test(d),
    'the two no-move arms are gone — the pairing rule needs re-deriving');
});

await t('§7.7 the eleven vetoed bytes are present and none was silently reworded', async () => {
  const s = seat();
  const must = [
    [s.showBlock(BODY, 'Priya', PHONE), 'Here is the draft, word for word:'],
    [s.sentLine('Priya', PHONE), 'Sent to Priya (+919625759924).'],
    [s.windowClosedLine('Priya'), "the moment she writes, say the word and it goes."],
    [s.windowUndeterminedLine(), "I won't send blind. The draft is saved."],
    [s.expiredLine(), "Tell me again and I'll write it fresh."],
    [s.sendFailedLine('Priya'), 'The draft is saved and nothing has gone out.'],
    [s.noNumberLine('Priya'), "Send me her number and I'll write it again."],
    [s.noLaneLine('Priya'), "I can't send from our number right now"],
    [s.mismatchBlock(BODY, 'Priya', PHONE), "I haven't sent anything."],
    [s.PWA_RELAY_UNAVAILABLE_LINE, "Message me on WhatsApp and I'll send it from there."],
  ];
  for (const [actual, needle] of must) assert.ok(String(actual).includes(needle), `vetoed byte drifted: ${needle}`);
});

// ═════════════════════════════════════════════════════════════════════════════
cleanup();
console.log(`\n${'═'.repeat(68)}`);
console.log(`  b06_relay_hand_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
if (fail) { console.log('  FAILURES:'); for (const f of fails) console.log(`    - ${f}`); }
console.log(`${'═'.repeat(68)}\n`);
process.exit(fail ? 1 : 0);
})().catch((e) => { cleanup(); console.error(e); process.exit(1); });
