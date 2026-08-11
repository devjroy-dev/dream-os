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
//   §8 ZIP 2 — F-06.158 · F-06.159 · F-06.160                    12
//   §9 ZIP 3 — F-06.162 · F-06.163 · F-06.164                    14
//   §10 ZIP 4 — R-29.32 door-stage · R-29.33 E3-prime · .165-.167 16
//   §11 F-06.169 — the temporal dead zone                          3
//   §12 THE DOORBELL (R-29.24) — the ④-fork's template arm         8
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

// chat.js builds a client at import time. The bench never reaches a network —
// every cell drives pure predicates or the injected double — but the module
// refuses to load without these. Fenced here, declared, never real credentials.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://bench.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-not-a-key';

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
        eq(c, v) { rows = rows.filter((r) => r[c] === v); return api; },
        is(c, v) { rows = rows.filter((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
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
            // A sweep UPDATE (filters only, no id) must hit EVERY matching row.
            // `rows` is already the filtered set — filters after .update() are
            // filters, exactly as in supabase-js.
            const targets = rows.slice();
            if (!targets.length) out = { data: single ? null : [], error: null };
            else {
              delete patch.id;
              for (const t of targets) { Object.assign(t, patch); log.updates.push({ table: name, row: { ...t } }); }
              out = { data: single ? { ...targets[0] } : targets.map((t) => ({ ...t })), error: null };
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
      // EXECUTABLE LINES ONLY. loop.ts now NAMES `public.pending_couple_drafts`
      // in the comment explaining why the engine cannot read it — the third time
      // this bench has had to learn that a file documenting a law is not
      // breaking it. Comments stripped; the assertion is about code.
      const s = fs.readFileSync(p, 'utf8').split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
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

await t('§5.6 A BARE YES TO NOTHING (no open draft at all) moves no state', async () => {
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


// ── §8 · ZIP 2 — THE THREE CURES FROM THE FIRST LIVE WALK ───────────────────
H('§8 F-06.158/.159/.160 — the walk\'s own findings, cured');

await t('§8.1 F-06.158 — the WA door patches the relay line onto VICTOR\'S OWN thread', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  assert.ok(/patchComposedReply\(supabase, effectiveResult,/.test(d),
    'the WA door does not write the relay line back into engine.messages');
  // F-06.157's lesson, held: the witnessed row must belong to the turn that shipped.
  assert.ok(!/patchComposedReply\(supabase, result,/.test(d), 'the patch reads the wrong turn');
});

await t('§8.2 F-06.158 — ONE HOME: the core is extracted and the PWA wrapper calls it', async () => {
  const c = fs.readFileSync(SRC('src/api/vendor-engine/chat.js'), 'utf8');
  assert.ok(/async function patchComposedReply\(supabase, result, tail\)/.test(c), 'the core is missing');
  assert.ok(/return patchComposedReply\(req\.app\.locals\.supabase, result, tail\)/.test(c),
    'the PWA wrapper does not delegate — two copies would drift');
  assert.strictEqual((c.match(/\.schema\('engine'\)\s*\n?\s*\.from\('messages'\)\s*\n?\s*\.update\(\{ content:/g) || []).length, 1,
    'the composed-reply UPDATE has more than one home');
});

await t('§8.3 F-06.158 — the two early returns survive extraction (no tail · no witnessed id)', async () => {
  const { patchComposedReply } = require(SRC('src/api/vendor-engine/chat.js'));
  const db = makeDb({ messages: [{ id: 'am1', content: 'orig' }] });
  await patchComposedReply(db, { assistant_message_id: 'am1', reply: 'x' }, '');    // no tail
  await patchComposedReply(db, { assistant_message_id: null, reply: 'x' }, '\n\ntail'); // no id
  assert.strictEqual(db._log.updates.length, 0, 'an early return wrote a row it must not');
});

await t('§8.4 MUTATION — stripping the WA patch turns §8.1 RED', async () => {
  const m = mutate('src/lib/vendorInbound.js', 'await patchComposedReply(supabase, effectiveResult,', '// removed', 'f158');
  assert.ok(m, 'DECLARED FAIL — the WA patch anchor is absent');
  assert.ok(!/patchComposedReply\(supabase, effectiveResult,/.test(fs.readFileSync(m, 'utf8')),
    'the mutation did not bite — §8.1 proves nothing');
});

await t('§8.5 F-06.159 — THE NAMED RED SPECIMEN: the founder\'s 09:08:18 sentence convicts', async () => {
  const { RELAY_CLAIM_RE } = require(SRC('src/api/vendor-engine/chat.js'));
  const spec = 'Understood. Message to Priya is live — "The December shoot amount is Rs 80k — does that work for you?"';
  assert.ok(RELAY_CLAIM_RE.test(spec), 'the guard is still blind to the sentence that walked');
  assert.ok(RELAY_CLAIM_RE.test('Message sent to Priya.'), '09:07:55\'s claim walks');
  assert.ok(RELAY_CLAIM_RE.test("I've sent it to Priya."), 'the first-person limb is blind');
});

await t('§8.6 F-06.159 — honest relay speech does NOT convict', async () => {
  const { RELAY_CLAIM_RE } = require(SRC('src/api/vendor-engine/chat.js'));
  for (const ok of [
    'Send this to Priya (+919625759924)?',
    'Not sent. Priya hasn\'t written in over 24 hours.',
    'Nothing goes to her until you approve it.',
    'Shall I send it to her?',
  ]) assert.ok(!RELAY_CLAIM_RE.test(ok), `false conviction on honest speech: ${ok}`);
});

await t('§8.7 F-06.159 — THE CLASS MATCH: only the SEND signal witnesses a relay claim', async () => {
  const { RELAY_DEED_RE } = require(SRC('src/api/vendor-engine/chat.js'));
  const s2 = seat();
  assert.ok(RELAY_DEED_RE.test(s2.SEND_SIGNAL), 'the send signal does not witness its own class');
  assert.ok(!RELAY_DEED_RE.test(s2.STAGE_SIGNAL),
    'the STAGE signal acquits a send claim — staging is not sending, and that is 09:07:55 exactly');
  assert.ok(!RELAY_DEED_RE.test('donna_lead') && !RELAY_DEED_RE.test('donna_book_event'));
});

await t('§8.8 F-06.161 — THE STEMS ARE A QUOTATION, SO THE TENTH WAS NOT TAKEN', async () => {
  // R-29.27's second clause ordered `send|message` into IMPERATIVE_STEMS. It is
  // §0.2-BLOCKED and the block is asserted here rather than described in a
  // handover nobody re-runs: the nine ARE harveySoul.ts:98's nine verbs, and
  // b06_forkc_wireguard_bench §14.2 asserts there is never a tenth. A tenth is a
  // sealed-floor RED or a soul byte, and W-1 shuts the soul this sitting.
  const { IMPERATIVE_STEMS } = require(SRC('src/api/vendor-engine/chat.js'));
  const soul = fs.readFileSync(SRC('src/engine/src/core/harveySoul.ts'), 'utf8');
  const NINE = ['unblock','block','log','file','book','cancel','move','note','update'];
  assert.deepStrictEqual(IMPERATIVE_STEMS.split('|').sort(), NINE.slice().sort(),
    'the stem list moved — F-06.161 is unruled and this list is the soul\'s quotation');
  for (const v of NINE) assert.ok(new RegExp(`\\b${v}\\b`).test(soul), `the soul no longer carries ${v}`);
});

await t('§8.9 F-06.160 — staging supersedes every prior OPEN STAGED row, successor named', async () => {
  const world = { conversations: [convoRow()], messages: [], leads: [LEAD],
                  pending_couple_drafts: [draftRow({ id: 'old1' }), draftRow({ id: 'old2' })] };
  const db = makeDb(world);
  const res = await fresh(DRAFTS).stage(db, { vendorId: 'v1', couplePhone: PHONE, body: 'new one' });
  assert.ok(res.ok);
  for (const id of ['old1', 'old2']) {
    const r = world.pending_couple_drafts.find((x) => x.id === id);
    assert.strictEqual(r.state, 'expired', `${id} was left open`);
    assert.ok(r.resolved_at, `${id} did not stamp resolved_at`);
    assert.strictEqual(r.refusal_reason, `superseded:${res.draft.id}`, `${id} does not name its successor`);
  }
});

await t('§8.10 F-06.160 — AN APPROVED ROW IS THE VENDOR\'S WORD AND IS NEVER TOUCHED', async () => {
  const world = { conversations: [convoRow()], messages: [], leads: [LEAD],
                  pending_couple_drafts: [draftRow({ id: 'appr', state: 'approved' }),
                                          draftRow({ id: 'sentd', state: 'sent', resolved_at: new Date().toISOString() })] };
  const db = makeDb(world);
  await fresh(DRAFTS).stage(db, { vendorId: 'v1', couplePhone: PHONE, body: 'new one' });
  assert.strictEqual(world.pending_couple_drafts.find((x) => x.id === 'appr').state, 'approved');
  assert.strictEqual(world.pending_couple_drafts.find((x) => x.id === 'sentd').state, 'sent');
});

await t('§8.11 MUTATION — removing the state filter would eat an approved row (RED)', async () => {
  const m = mutate('src/lib/vendor/coupleDrafts.js', ".eq('state', STATES.STAGED)\n      .is('resolved_at', null)", ".is('resolved_at', null)", 'f160');
  assert.ok(m, 'DECLARED FAIL — the supersede state-filter anchor is absent');
  const world = { pending_couple_drafts: [draftRow({ id: 'appr', state: 'approved' })] };
  await fresh(m).supersedeOpenStaged(makeDb(world), 'v1');
  assert.strictEqual(world.pending_couple_drafts[0].state, 'expired',
    'the mutation did not bite — the approved-row boundary proves nothing');
});

await t('§8.12 F-06.160 — another vendor\'s open draft is untouched', async () => {
  const world = { conversations: [convoRow()], messages: [], leads: [LEAD],
                  pending_couple_drafts: [draftRow({ id: 'other', vendor_id: 'v2' })] };
  await fresh(DRAFTS).stage(makeDb(world), { vendorId: 'v1', couplePhone: PHONE, body: 'new one' });
  assert.strictEqual(world.pending_couple_drafts.find((x) => x.id === 'other').state, 'staged');
});


// ── §9 · ZIP 3 — THE INSTRUCTION GAP BEHIND THE RECORD GAP ──────────────────
H('§9 F-06.162/.163/.164 — the pending-relay block, the route, the lane');

await t('§9.1 F-06.162 — the block exists when a draft is open, and is EMPTY when none is', async () => {
  const s9 = seat();
  const withDraft = await s9.buildPendingRelay(makeDb(openWorld()), 'v1');
  assert.ok(withDraft.length > 0, 'no block for an open commitment');
  const none = await s9.buildPendingRelay(makeDb({ pending_couple_drafts: [], leads: [LEAD] }), 'v1');
  assert.strictEqual(none, '', 'a block was built with nothing pending — the regression law');
});

await t('§9.2 F-06.163 — the block carries the VERBATIM body and tells Harvey not to re-quote', async () => {
  const s9 = seat();
  const b = s9.pendingRelayBlock(draftRow(), 'Priya');
  assert.ok(b.includes(`"${BODY}"`), 'the block does not carry the exact bytes');
  assert.ok(/do not need to quote the draft to him again/.test(b),
    'nothing suppresses the drift-prone second copy');
});

await t('§9.3 E3-PRIME — the block says a PLAIN YES SENDS, and forbids asking for the name', async () => {
  // RE-AIMED (R-29.33), DISCLOSED RATIFY-OR-REVERT. Under the pre-amendment guard
  // this cell asserted the block demanded a naming affirmative. E3-prime retired
  // that, the code moved, and this text did not — so Victor kept enforcing it.
  // THE INSTRUCTION IS THE INTERFACE and this cell now guards it as one.
  const b = seat().pendingRelayBlock(draftRow(), 'Priya');
  assert.ok(/ANY plain yes sends it/.test(b), 'the block does not tell him a plain yes works');
  assert.ok(/NEVER ask for it/.test(b), 'the block still permits demanding the name back');
  assert.ok(!/A bare "yes" is not enough/.test(b), 'the retired instruction survives');
});

await t('§9.4 F-06.162 — A NAMING AFFIRMATIVE ROUTES WITH ZERO TOOL CALLS', async () => {
  // The founder's 09:29 turn shape exactly: no signal in the result at all.
  const world = openWorld();
  const db = makeDb(world);
  const send = transport();
  const out = await seat().runRelaySeat(db, VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, ownerWords: 'yes, send it to Priya',
  });
  assert.ok(out, 'the affirmative found no route — F-06.162 uncured');
  assert.strictEqual(out.kind, 'sent');
  assert.strictEqual(send.calls.length, 1);
});

await t('§9.5 E3-PRIME RE-AIM — a bare yes that is NOT door-adjacent moves nothing', async () => {
  // ── RE-AIMED (R-29.33), DISCLOSED RATIFY-OR-REVERT. The cell used to assert
  // that a bare yes NEVER approves. Under E3-prime it approves when it is
  // door-adjacent, and the property that survives — and is the one that always
  // mattered — is that a bare yes with no door ask behind it moves nothing.
  // The world here has NO outbound confirm on record, so adjacency is false.
  const world = openWorld();
  world.messages = [inboundAgeHours(1)];   // no outbound confirm ⇒ not adjacent
  const send = transport();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: 'Yes',
  });
  assert.strictEqual(send.calls.length, 0, 'a non-adjacent bare yes reached the wire');
  assert.strictEqual(world.pending_couple_drafts[0].state, 'staged');
  assert.ok(out && out.kind === 'not_adjacent', 'the stale yes was not answered honestly');
});

await t('§9.6 E3 HOLDS — an affirmative naming a DIFFERENT person moves nothing', async () => {
  // ── RE-AIMED (R-29.33 lane ③), DISCLOSED RATIFY-OR-REVERT. The behaviour the
  // cell guards is UNCHANGED and is asserted unchanged: no send, no transition.
  // What changed is that the vendor is no longer met with silence — a wrong name
  // now RE-SHOWS, which is the safe direction R-29.19 already ruled and which the
  // door could not reach before it owned this lane.
  const world = openWorld();
  const send = transport();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: 'yes send it to Ananya',
  });
  assert.strictEqual(send.calls.length, 0, 'the wrong name reached the wire');
  assert.strictEqual(world.pending_couple_drafts[0].state, 'staged');
  assert.ok(out && out.line.includes(BODY) && !/Ananya/.test(out.line),
    'the re-show is missing, or it echoed the wrong name back');
});

await t('§9.7 the PHONE also names her — the stored anchor is a legal naming', async () => {
  const s9 = seat();
  assert.ok(s9.affirmativeNames('yes send to +919625759924', null, PHONE));
  assert.ok(s9.affirmativeNames('ok, 9625759924 please', 'Priya', PHONE));
  assert.ok(!s9.affirmativeNames('9625759924', 'Priya', PHONE), 'a phone with no affirmative routed');
});

await t('§9.8 MUTATION — dropping the naming conjunction turns §9.5 RED', async () => {
  const m = mutate('src/lib/vendor/relaySeat.js', 'if (!AFFIRM_RE.test(t)) return false;', 'if (!AFFIRM_RE.test(t)) return false;\n  return true;', 'f162');
  assert.ok(m, 'DECLARED FAIL — the affirmative-guard anchor is absent');
  assert.ok(fresh(m).affirmativeNames('Yes', 'Priya', PHONE),
    'the mutation did not bite — §9.5 proves nothing');
});

await t('§9.9 F-06.164 — a RELAY costume interception ships a relay byte, never F3', async () => {
  const line = await seat().relayLaneLine(makeDb(openWorld()), VENDOR, { reply: 'Message sent to Priya.' });
  assert.ok(line, 'the relay lane stayed silent and F3 would have shipped');
  assert.ok(line.includes(BODY) && /Send this to Priya \(\+919625759924\)\?/.test(line));
  assert.ok(!/didn't land/.test(line), 'F3 leaked into the relay lane');
});

await t('§9.10 F-06.164 — a FILING-lane costume leaves F3 alone, even with a draft open', async () => {
  const line = await seat().relayLaneLine(makeDb(openWorld()), VENDOR, { reply: "Done — that's filed." });
  assert.strictEqual(line, null, 'the relay lane spoke for a claim that was not its business');
});

await t('§9.11 F-06.164 — the claim family has ONE home; the lane reads chat.js, not a copy', async () => {
  const { RELAY_CLAIM_RE } = require(SRC('src/api/vendor-engine/chat.js'));
  const src = fs.readFileSync(SEAT, 'utf8');
  assert.ok(/require\('\.\.\/\.\.\/api\/vendor-engine\/chat'\)\.RELAY_CLAIM_RE/.test(src),
    'the seat authored its own copy of the claim family');
  assert.ok(RELAY_CLAIM_RE.test('Message sent to Priya.'));
});

await t('§9.12 the door hands the OWNER\'S words, and the block rides the retry too', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  assert.ok(/ownerWords: body,/.test(d), 'the seat is not given the owner\'s own inbound');
  assert.ok(/pendingRelay, vendorCategory,/.test(d),
    'the retry runs without the block — the re-run would lose the fact the first turn had');
  assert.strictEqual((d.match(/pendingRelay,/g) || []).length, 2, 'the block reaches one path only');
});

await t('§9.13 the engine seam is gated and never cached, like its two siblings', async () => {
  const l = fs.readFileSync(SRC('src/engine/src/core/loop.ts'), 'utf8');
  assert.ok(/const relayBlock = \(estateInRoom && args\.pendingRelay\)/.test(l),
    'the block is not estate-room-gated — the F-04.70 donor pool reopens');
  assert.ok(/pingBlock \+ relayBlock;/.test(l), 'the block is not in the dynamic tail');
  // NEVER CACHED, asserted structurally: the cached block is `staticPrefix` and
  // the relay block is a term of `dynamic`. If the block ever joined the cached
  // prefix, a draft staged at 14:00 would still be "waiting" at 14:05.
  assert.ok(/\{ type: 'text', text: staticPrefix, cache_control: \{ type: 'ephemeral' \} \}/.test(l),
    'the cached block is no longer staticPrefix — re-derive this cell\'s premise');
  assert.ok(!/staticPrefix[^\n]*pendingRelay|pendingRelay[^\n]*staticPrefix/.test(l),
    'the block touches the cached prefix');
});

await t('§9.14 ABSENT => byte-identical dynamic block (the regression law)', async () => {
  const l = fs.readFileSync(SRC('src/engine/src/core/loop.ts'), 'utf8');
  assert.ok(/args\.pendingRelay\) \? `\\n\\n\$\{args\.pendingRelay\}` : ''/.test(l),
    'an absent block does not collapse to the empty string');
});


// ── §10 · ZIP 4 — THE DOOR OWNS THE STAGE, AND E3-PRIME ─────────────────────
H('§10 R-29.32/.33 — the trigger leaves the model');

const withAsk = (over = {}) => {
  const w = openWorld(over);
  w.messages = [inboundAgeHours(1),
    { id: 'ask', conversation_id: 'c9', direction: 'outbound',
      body: `Here is the draft, word for word:\n\n"${BODY}"\n\nSend this to Priya (+919625759924)?`,
      created_at: new Date().toISOString() }];
  return w;
};

await t('§10.1 R-29.33 LANE ① — a door-adjacent PLAIN yes APPROVES and SENDS', async () => {
  const world = withAsk();
  const send = transport();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: 'Yes',
  });
  assert.strictEqual(out.kind, 'sent');
  assert.strictEqual(send.calls.length, 1);
});

await t('§10.2 WALK FOUR\'S THREE REFUSED AFFIRMATIVES NOW APPROVE — the named specimens', async () => {
  for (const said of ['Send', 'Yes', 'Send it']) {
    const world = withAsk();
    const send = transport();
    const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
      sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: said,
    });
    assert.strictEqual(out.kind, 'sent', `walk four's "${said}" still refuses`);
    assert.strictEqual(send.calls.length, 1);
  }
});

await t('§10.3 MUTATION — stripping the adjacency check lets a STALE yes send (RED)', async () => {
  const m = mutate('src/lib/vendor/relaySeat.js', 'const adjacent = (plain || decline) ? await doorAsked(supabase, deps.conversationId) : false;', 'const adjacent = true;', 'e3p');
  assert.ok(m, 'DECLARED FAIL — the adjacency anchor is absent');
  const world = openWorld(); world.messages = [inboundAgeHours(1)];
  const send = transport();
  await fresh(m).runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: 'Yes',
  });
  assert.strictEqual(send.calls.length, 1, 'the mutation did not bite — §9.5 proves nothing');
});

await t('§10.4 LANE ② — a NAMING affirmative still approves without adjacency', async () => {
  const world = openWorld(); world.messages = [inboundAgeHours(1)];
  const send = transport();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: 'yes send it to Priya',
  });
  assert.strictEqual(out.kind, 'sent', 'the strong signal lost its standing power');
});

await t('§10.5 LANE ③ — a DIFFERENT name still refuses, adjacent or not', async () => {
  const world = withAsk();
  const send = transport();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: 'yes send it to Ananya',
  });
  assert.strictEqual(send.calls.length, 0, 'the wrong-bride guard fell to E3-prime');
  assert.strictEqual(world.pending_couple_drafts[0].state, 'staged');
});

await t('§10.6 THE DECLINE LANE — byte №13, row refused, never deleted', async () => {
  const world = withAsk();
  const send = transport();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, { tool_calls: [] }, {
    sendWhatsApp: send, env: ENV, hasTransport: true, conversationId: 'c9', ownerWords: "don't send",
  });
  assert.strictEqual(out.kind, 'declined');
  assert.strictEqual(send.calls.length, 0);
  const d = world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'refused');
  assert.strictEqual(d.refusal_reason, 'vendor_declined');
  assert.ok(d.resolved_at && world.pending_couple_drafts.length === 1, 'a decline deleted the row');
});

await t('§10.7 R-29.32 ② VERBATIM — the vendor\'s own bytes stage byte-exact, zero model', async () => {
  const s10 = seat();
  assert.strictEqual(s10.verbatimBody('Tell Priya: "The shoot is confirmed for 12 December."'),
    'The shoot is confirmed for 12 December.');
  assert.strictEqual(s10.verbatimBody('ask her if she is free'), null, 'an intent was read as verbatim');
});

await t('§10.8 R-29.32 ① — the door stages from the vendor\'s instruction, ZERO tool calls', async () => {
  const world = { conversations: [convoRow()], messages: [inboundAgeHours(1)], leads: [LEAD], pending_couple_drafts: [] };
  const db = makeDb(world);
  const out = await seat().runRelaySeat(db, VENDOR, { tool_calls: [] }, {
    sendWhatsApp: transport(), env: ENV, hasTransport: true, conversationId: 'c9',
    ownerWords: 'Tell Priya: "The shoot is confirmed for 12 December."',
  });
  assert.ok(out && out.kind === 'door_staged', 'walk four repeats — the door did not stage');
  assert.ok(out.line.includes('The shoot is confirmed for 12 December.'));
  assert.strictEqual(world.pending_couple_drafts.length, 1);
});

await t('§10.9 ① ZERO ROWS ON A GUESS — an ambiguous recipient ASKS (byte №12)', async () => {
  const world = { conversations: [convoRow()], messages: [], pending_couple_drafts: [],
                  leads: [LEAD, { id: 'l2', vendor_id: 'v1', name: 'Priya', phone: '+919999999999' }] };
  const db = makeDb(world);
  const out = await seat().runRelaySeat(db, VENDOR, { tool_calls: [] }, {
    sendWhatsApp: transport(), env: ENV, hasTransport: true, conversationId: 'c9',
    ownerWords: 'Tell Priya: "The shoot is confirmed."',
  });
  assert.strictEqual(out.kind, 'ask_who');
  assert.ok(/won't guess with a message/.test(out.line));
  assert.strictEqual(world.pending_couple_drafts.length, 0, 'a row was minted on a guess');
});

await t('§10.10 the door stays SILENT on a non-relay turn — no rows, no lines', async () => {
  const world = { conversations: [convoRow()], messages: [], leads: [LEAD], pending_couple_drafts: [] };
  const db = makeDb(world);
  const out = await seat().runRelaySeat(db, VENDOR, { tool_calls: [] }, {
    sendWhatsApp: transport(), env: ENV, hasTransport: true, conversationId: 'c9',
    ownerWords: 'what is my thursday looking like',
  });
  assert.strictEqual(out, null);
  assert.strictEqual(db._log.inserts.length, 0);
});

await t('§10.11 F-06.160 FINALLY FIRES — a door-staged row supersedes the stale one', async () => {
  const world = { conversations: [convoRow()], messages: [inboundAgeHours(1)], leads: [LEAD],
                  pending_couple_drafts: [draftRow({ id: 'stale' })] };
  const db = makeDb(world);
  const out = await seat().runRelaySeat(db, VENDOR, { tool_calls: [] }, {
    sendWhatsApp: transport(), env: ENV, hasTransport: true, conversationId: 'c9',
    ownerWords: 'Tell Priya: "A completely new message for her."',
  });
  assert.strictEqual(out.kind, 'door_staged', 'the stage never happened, so nothing superseded');
  const stale = world.pending_couple_drafts.find((r) => r.id === 'stale');
  assert.strictEqual(stale.state, 'expired', 'walk four\'s two-drafts-one-screen survives');
  assert.ok(/^superseded:/.test(String(stale.refusal_reason)));
});

await t('§10.12 F-06.166 — the fabricated 50k frame is a costume shape', async () => {
  const { CONFIRM_SHAPE_RE } = require(SRC('src/api/vendor-engine/chat.js'));
  const spec = 'Draft ready for approval:\n"Are you interested in a pre-wedding shoot for Rs 50,000? We can get on a call and finalise the details."\nSend this to Priya?';
  assert.ok(CONFIRM_SHAPE_RE.test(spec), 'the 09:49:37 specimen still walks');
  assert.ok(!CONFIRM_SHAPE_RE.test('Not sent. Priya hasn\'t written in over 24 hours.'),
    'an honest refusal was read as an imitated commitment');
});

await t('§10.13 F-06.166 — the guard acquits on the STORE, not the words', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  assert.ok(/if \(!s2line && !\(relayOut && relayOut\.draftId\)\)/.test(d),
    'the confirm-shape guard does not consult this turn\'s own staging outcome');
});

await t('§10.14 F-06.165 arm (α) IS MECHANICAL — the costume row is patched, not hand-fixed', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  assert.ok(/relay_lane\|confirm_shape_costume/.test(d), 'the standing patch does not cover both relay arms');
  assert.ok(/patchComposedReply\(supabase, \{ \.\.\.effectiveResult, reply: '' \}, s2line\)/.test(d),
    'the costume row is not replaced by the honest line');
});

await t('§10.15 F-06.167 — the founder\'s walked specimen now convicts', async () => {
  const { RELAY_CLAIM_RE } = require(SRC('src/api/vendor-engine/chat.js'));
  assert.ok(RELAY_CLAIM_RE.test('Nothing waiting to send. The last message to Priya went through.'));
  assert.ok(RELAY_CLAIM_RE.test('The message is with her.'));
  assert.ok(!RELAY_CLAIM_RE.test('Shall I send this to Priya?'), 'a question was convicted');
});

await t('§10.16 R-29.32 ② — the COMPOSE fork uses an EXISTING engine entry point', async () => {
  const src = fs.readFileSync(SEAT, 'utf8');
  assert.ok(/require\('\.\.\/\.\.\/engine\/dist\/core\/donna'\)/.test(src),
    'the compose fork does not reach Donna through the door plane\'s existing path');
  const harvest = fs.readFileSync(SRC('src/agent/harvest.js'), 'utf8');
  assert.ok(/require\('\.\.\/engine\/dist\/core\/donna'\)/.test(harvest),
    'the precedent this cure cited no longer exists — re-derive before shipping');
});


// ── §11 · F-06.169 — THE TEMPORAL DEAD ZONE ────────────────────────────────
H('§11 F-06.169 — a reference above its own `let` took the whole door down');

await t('§11.1 NO `let` IN THE WA DOOR IS READ ABOVE ITS OWN DECLARATION', async () => {
  // THE CELL THAT WOULD HAVE CAUGHT IT, and the reason it did not exist: every
  // §10 cell about the door was a GREP over source text, and a grep cannot see
  // ordering. `node --check` cannot see a TDZ either — it is a runtime throw on a
  // syntactically perfect file. On 2026-08-11 10:18 that cost EVERY vendor turn,
  // relay or not: the founder received the dead-letter line twice and nothing
  // else worked.
  //
  // METHOD, DECLARED: scan the door for `let <name>` declarations that this arc
  // introduced, then assert no earlier line in the same function body reads that
  // identifier. BLIND SPOT, DECLARED: it checks the names this arc owns, not
  // every binding in a 1700-line file, and it is line-ordered rather than
  // scope-aware — a `let` inside a nested block would read as a false positive.
  // Narrow and honest beats broad and vacuous.
  const src = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  const lines = src.split('\n');
  const OURS = ['relayOut', 'effectiveResult', 'pendingRelay', 's2line', 's2arm', 's2run'];
  for (const name of OURS) {
    const declIdx = lines.findIndex((l) => new RegExp(`^\\s*let\\s+${name}\\b`).test(l));
    assert.ok(declIdx > -1, `DECLARED FAIL — no \`let ${name}\` found; the anchor moved`);
    const re = new RegExp(`\\b${name}\\b`);
    for (let i = 0; i < declIdx; i++) {
      const l = lines[i];
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) continue;   // comments explain, they do not execute
      assert.ok(!re.test(l),
        `TDZ: \`${name}\` is read at line ${i + 1}, above its own \`let\` at ${declIdx + 1}`);
    }
  }
});

await t('§11.2 the SEAT runs BEFORE the interception, which runs BEFORE the send', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  const seatAt = d.indexOf('runRelaySeat(supabase, vendor, effectiveResult');
  const guardAt = d.indexOf('CONFIRM_SHAPE_RE.test(');
  // NEWLINE-ANCHORED, and that is not fussiness: `d.indexOf` found the copy of
  // this statement inside the ORDERING COMMENT eight lines above the real one,
  // and the cell went red on a file that was correct. Fourth time this sitting a
  // cell has read the estate's own explanation as its code. The banner explains
  // the order; this finds the statement that enforces it.
  const applyAt = d.search(/\n\s*if \(s2line\) replyText = s2line;/);
  const sendAt = d.indexOf('const twilioMsg = await sendWhatsApp(phone, replyText, []);');
  assert.ok(seatAt > 0 && guardAt > seatAt, 'the confirm-shape guard cannot read this turn\'s staging outcome');
  assert.ok(applyAt > guardAt, 'the interception applies before the guard can select its line');
  assert.ok(sendAt > applyAt, 'the send precedes the interception — a costume reaches the vendor');
});

await t('§11.3 the interception statement is STILL byte-identical (forkc §11.5 unbroken)', async () => {
  const d = fs.readFileSync(SRC('src/lib/vendorInbound.js'), 'utf8');
  assert.ok(/\n\s*if \(s2line\) replyText = s2line;/.test(d),
    'the one line that ships an interception was reshaped by a neighbouring feature');
});


// ── §12 · THE DOORBELL (R-29.24) — THE ④-FORK'S TEMPLATE ARM ────────────────
H('§12 the doorbell — a closed window stops being a dead end');

const closedWorld = () => { const w = openWorld(); w.messages = [inboundAgeHours(30)]; return w; };
const bell = (behaviour = {}) => {
  const calls = [];
  const fn = async (arg, opts) => {
    calls.push({ to: arg.to, payload: arg.payload, phoneNumberId: opts && opts.phoneNumberId });
    if (behaviour.throw) throw new Error('meta refused');
    if (behaviour.fail) return { sent: false, blocked: behaviour.fail };
    return { sent: true, sid: 'wamid.DOORBELL' };
  };
  fn.calls = calls;
  return fn;
};
// THE PNID IS RESOLVED THROUGH `sendWa.phoneNumberIdFor`, WHICH READS
// process.env — one home for the lane→PNID map, and this bench drives the REAL
// resolver rather than an injected shadow of it. Setting it here (and restoring
// it after §12) is the honest way to exercise the production path; passing a
// fake `env` object would have tested a parameter production does not use, which
// is exactly the hollow-green shape this bench refuses.
const PNID_WAS = process.env.VENDOR_PHONE_NUMBER_ID;
const ENVB = ENV;
const withPnid = (v) => { if (v == null) delete process.env.VENDOR_PHONE_NUMBER_ID; else process.env.VENDOR_PHONE_NUMBER_ID = v; };

await t('§12.1 the template is registered FROM THE WIRE WITNESS, byte-exact', async () => {
  const { getTemplate, isApproved, buildTemplatePayload } = require(SRC('src/lib/templates.js'));
  const t12 = getTemplate('enquiry_update_couple');
  assert.ok(t12, 'the doorbell is not on the registry');
  assert.strictEqual(t12.name, 'tdw_enquiry_update_couple');
  assert.strictEqual(t12.category, 'UTILITY');
  assert.strictEqual(t12.line, 'vendor');
  assert.deepStrictEqual(t12.variables, ['name', 'vendor']);
  assert.strictEqual(t12.body,
    'Hi {{1}} — your vendor {{2}} has an update on your wedding enquiry. ' +
    'Reply here and it will be shared with you right away.');
  assert.ok(isApproved('enquiry_update_couple'));
  const p = buildTemplatePayload('enquiry_update_couple', { name: 'Priya', vendor: 'Studio' });
  assert.deepStrictEqual(p.components[0].parameters.map((x) => x.text), ['Priya', 'Studio']);
});

await t('§12.2 A CLOSED WINDOW RINGS THE DOORBELL and speaks byte ④b', async () => {
  withPnid('123456');
  const world = closedWorld();
  const b = bell();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, sendSig('Priya'), {
    sendWhatsApp: transport(), sendMetaTemplate: b, env: ENVB, hasTransport: true, conversationId: 'c9',
  });
  assert.strictEqual(out.kind, 'window_closed_doorbell');
  assert.strictEqual(b.calls.length, 1, 'the doorbell did not ring');
  assert.ok(/sent her a WhatsApp notification/.test(out.line), 'byte ④b did not ship');
});

await t('§12.3 ② THE LANE IS PINNED — the doorbell rides the VENDOR PNID', async () => {
  withPnid('123456');
  const b = bell();
  await seat().runRelaySeat(makeDb(closedWorld()), VENDOR, sendSig('Priya'), {
    sendWhatsApp: transport(), sendMetaTemplate: b, env: ENVB, hasTransport: true, conversationId: 'c9',
  });
  assert.strictEqual(b.calls[0].phoneNumberId, '123456',
    'the doorbell did not pin the vendor lane — her reply lands on the wrong number');
  assert.strictEqual(b.calls[0].to, PHONE);
});

await t('§12.4 ② no vendor PNID ⇒ NO doorbell, and byte ④ verbatim', async () => {
  withPnid(null);
  const world = closedWorld();
  const b = bell();
  const out = await seat().runRelaySeat(makeDb(world), VENDOR, sendSig('Priya'), {
    sendWhatsApp: transport(), sendMetaTemplate: b, env: ENV, hasTransport: true, conversationId: 'c9',
  });
  assert.strictEqual(b.calls.length, 0, 'a doorbell went with no lane to send from');
  assert.strictEqual(out.kind, 'window_closed');
  assert.ok(/hasn't written in over 24 hours/.test(out.line));
});

await t('§12.5 ④ A DOORBELL THAT DID NOT GO NEVER CLAIMS IT DID', async () => {
  withPnid('123456');
  for (const b of [bell({ fail: 'opted_out' }), bell({ throw: true })]) {
    const out = await seat().runRelaySeat(makeDb(closedWorld()), VENDOR, sendSig('Priya'), {
      sendWhatsApp: transport(), sendMetaTemplate: b, env: ENVB, hasTransport: true, conversationId: 'c9',
    });
    assert.strictEqual(out.kind, 'window_closed', 'a failed doorbell was reported as rung');
    assert.ok(!/notification/.test(out.line), 'byte ④b shipped on a doorbell that never went');
  }
});

await t('§12.6 ① AN UNDETERMINED WINDOW NEVER RINGS IT', async () => {
  withPnid('123456');
  const b = bell();
  const db = makeDb(openWorld(), { queryError: 'messages' });
  await seat().runRelaySeat(db, VENDOR, sendSig('Priya'), {
    sendWhatsApp: transport(), sendMetaTemplate: b, env: ENVB, hasTransport: true, conversationId: 'c9',
  });
  assert.strictEqual(b.calls.length, 0, 'a doorbell rang on a window we could not read');
});

await t('§12.7 ⑤ THE STATE MACHINE IS UNTOUCHED — the draft is still refused', async () => {
  withPnid('123456');
  const world = closedWorld();
  await seat().runRelaySeat(makeDb(world), VENDOR, sendSig('Priya'), {
    sendWhatsApp: transport(), sendMetaTemplate: bell(), env: ENVB, hasTransport: true, conversationId: 'c9',
  });
  const d = world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'refused', 'the doorbell became a transition in the flow');
  assert.ok(d.resolved_at);
  assert.ok(/^window_closed:doorbell:/.test(String(d.refusal_reason)),
    'the register does not record which notification went');
});

await t('§12.8 MUTATION — dropping the lane pin turns §12.3 RED', async () => {
  withPnid('123456');
  const m = mutate('src/lib/vendor/relayToCouple.js', 'const pnid = phoneNumberIdFor(t.line);', "const pnid = 'MARKETING_DEFAULT';", 'bell');
  assert.ok(m, 'DECLARED FAIL — the doorbell lane-pin anchor is absent');
  const b = bell();
  await fresh(m).ringDoorbell(makeDb(closedWorld()), {
    vendor: VENDOR, couplePhone: PHONE, brideName: 'Priya', env: ENVB, deps: { sendMetaTemplate: b },
  });
  assert.strictEqual(b.calls[0].phoneNumberId, 'MARKETING_DEFAULT',
    'the mutation did not bite — the lane cell proves nothing');
});

withPnid(PNID_WAS);   // §12 restores the environment it borrowed

// ═════════════════════════════════════════════════════════════════════════════
cleanup();
console.log(`\n${'═'.repeat(68)}`);
console.log(`  b06_relay_hand_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
if (fail) { console.log('  FAILURES:'); for (const f of fails) console.log(`    - ${f}`); }
console.log(`${'═'.repeat(68)}\n`);
process.exit(fail ? 1 : 0);
})().catch((e) => { cleanup(); console.error(e); process.exit(1); });
