#!/usr/bin/env node
// scripts/b0607_oow_completion_bench.js
// ── TDW_06/07 · THE OOW COMPLETION — A1 · A2 · A3 · A4 ──────────────────────
//
// FOUR MEMBERS, 74 CELLS, ratified before build:
//   A1 (22) the enquiry alert asks the WINDOW FIRST and carries HER WORDS
//   A2 (26) the OOW fork's CONTENT ARM, and the equality law's true object
//   A3 (18) №16's expiry sweep — the estate's first clock-speaker
//   A4  (8) the sid discipline at the alert path's own site
//
// R-29.34 BOTH MEMBERS. (a) cells drive the DOOR'S REAL ENTRY — `runRelaySeat`
// for A2, `sendVendorEnquiryAlert` for A1/A4, `relayExpirySweep` for A3 — never
// a helper standing in for one. (b) every path carries a named log class the
// founder can read on the walk: `[enquiry:oow]` · `[relay:oow]` · `[relay:expiry]`.
//
// BOTH-WAYS BY PRODUCTION MUTATION. Every guard cell has a sibling that defaces
// the SHIPPED FILE and asserts RED. A guard that survives the defacement of the
// thing it guards is not a guard.
//
// Runnable from any working directory (Q-SP-5).
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = (p) => path.join(ROOT, p);

const ALERT  = SRC('src/lib/vendor/enquiryAlert.js');
const RELAY  = SRC('src/lib/vendor/relayToCouple.js');
const SEAT   = SRC('src/lib/vendor/relaySeat.js');
const DRAFTS = SRC('src/lib/vendor/coupleDrafts.js');
const TPL    = SRC('src/lib/templates.js');
const CRON   = SRC('src/cron.js');
const INB    = SRC('src/lib/vendorInbound.js');
const ARRIVE = SRC('src/lib/vendor/coupleArrival.js');

let pass = 0; const fails = [];
async function t(name, fn) {
  try { await fn(); pass += 1; console.log(`  ok   ${name}`); }
  catch (e) { fails.push(`${name} — ${e.message}`); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
const H = (s) => console.log(`\n${s}\n${'─'.repeat(Math.min(s.length, 78))}`);

const read = (p) => fs.readFileSync(p, 'utf8');
// A CELL THAT FAILS WHEN A FILE WRITES DOWN ITS OWN REASONING IS A CELL THAT
// FORBIDS THE ESTATE FROM EXPLAINING ITSELF. Strip comments before asserting
// about code — and, per F-06.192 (proposed), before MUTATING it too.
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

function fresh(p) { delete require.cache[require.resolve(p)]; return require(p); }

// ── PRODUCTION MUTATION, COMMENT-BLIND (F-06.192's cure, applied here) ───────
// Replaces inside CODE only: a comment quoting the anchor can no longer absorb
// the mutation and silently reduce a both-ways proof to a one-way one.
async function underMutation(absPath, from, to, fn) {
  const original = fs.readFileSync(absPath, 'utf8');
  const lines = original.split('\n');
  let done = false;
  const mutated = lines.map((l) => {
    if (done) return l;
    if (/^\s*\/\//.test(l)) return l;          // comment lines are not code
    if (!l.includes(from)) return l;
    done = true;
    return l.replace(from, to);
  }).join('\n');
  assert.ok(done, `MUTATION TARGET ABSENT IN CODE — "${String(from).slice(0, 70)}"`);
  try {
    fs.writeFileSync(absPath, mutated);
    delete require.cache[require.resolve(absPath)];
    await fn();
  } finally {
    fs.writeFileSync(absPath, original);
    delete require.cache[require.resolve(absPath)];
  }
}

// ── DOUBLES, DERIVED FROM THE REAL SENDERS' RETURNS (F-06.172) ──────────────
// `whatsapp.js` (symbol sendWhatsApp): { sent, sid } / { blocked }. Never throws.
// `metaCloud.js` (symbol sendMetaTemplate): { ok, wamid }. THROWS on failure.
// `sendWa.js` (symbol sendWa) template path: { sent:true, ..., result:{ok,wamid} }.
//                                            THROWS its typed refusals.
const wa = (behaviour = {}) => {
  const calls = [];
  const fn = async (to, text, media, from) => {
    calls.push({ to, text, from });
    if (behaviour.throw) { const e = new Error('meta refused'); e.body = { error: { code: behaviour.code || 131047 } }; throw e; }
    if (behaviour.blocked) return { sid: null, blocked: behaviour.blocked, sent: false };
    return { sid: behaviour.sid || 'wamid.FREEFORM', wamid: behaviour.sid || 'wamid.FREEFORM', sent: true };
  };
  fn.calls = calls; return fn;
};
const sendwa = (behaviour = {}) => {
  const calls = [];
  const fn = async (opts) => {
    calls.push(opts);
    if (behaviour.throw) { const e = new Error(behaviour.throw); e.code = behaviour.code || 'opted_out'; throw e; }
    return { sent: true, mode: 'template', key: opts.templateKey, from: 'F', to: opts.to,
             payload: {}, result: { ok: true, wamid: behaviour.wamid || 'wamid.BRIEF', raw: {} } };
  };
  fn.calls = calls; return fn;
};
const meta = (behaviour = {}) => {
  const calls = [];
  const fn = async (arg, opts) => {
    calls.push({ to: arg.to, payload: arg.payload, phoneNumberId: opts && opts.phoneNumberId });
    if (behaviour.throw) throw new Error('meta refused');
    if (behaviour.fail) return { ok: false, error: behaviour.fail };
    return { ok: true, wamid: behaviour.wamid || 'wamid.CONTENT', raw: {} };
  };
  fn.calls = calls; return fn;
};

// ── THE SUPABASE DOUBLE ─────────────────────────────────────────────────────
// COPIED FROM THE PROVEN ONE, NOT RE-IMPLEMENTED. `scripts/b06_relay_hand_bench.js`
// (symbol `makeDb`) drives `runRelaySeat` green 126 times, and a second hand-rolled
// double is exactly the "two authorities on one question" this estate has paid for
// twice. Two predicates are ADDED for this sitting's readers, and they are the only
// divergence: `like` (the `content:%` / `doorbell:%` prefix filters) and `lt` (the
// sweep's `expires_at < now`). Both apply as REAL filters on whatever column
// production names, so re-keying a production query changes what this returns.
function makeDb(tables, opts = {}) {
  const log = { inserts: [], updates: [] };
  return {
    _log: log,
    from(name) {
      let rows = (tables[name] || []).slice();
      let pending = null, mode = null, single = false;
      const api = {
        select() { return api; },
        eq(c, v) { rows = rows.filter((r) => r[c] === v); return api; },
        is(c, v) { rows = rows.filter((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
        in(c, vs) { rows = rows.filter((r) => vs.includes(r[c])); return api; },
        not(c, _op, _v) { rows = c ? rows.filter((r) => r[c] != null) : api && rows; return api; },
        gte(c, v) { rows = rows.filter((r) => String(r[c]) >= String(v)); return api; },
        gt(c, v) { rows = rows.filter((r) => String(r[c]) > String(v)); return api; },
        lt(c, v) { rows = rows.filter((r) => String(r[c]) < String(v)); return api; },
        like(c, v) {
          const pre = String(v).replace(/%$/, '');
          rows = rows.filter((r) => String(r[c] || '').startsWith(pre));
          return api;
        },
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
            const targets = rows.slice();
            if (!targets.length) out = { data: single ? null : [], error: null };
            else {
              delete patch.id;
              for (const tg of targets) { Object.assign(tg, patch); log.updates.push({ table: name, row: { ...tg } }); }
              out = { data: single ? { ...targets[0] } : targets.map((tg) => ({ ...tg })), error: null };
            }
          } else if (opts.queryError === name) {
            out = { data: null, error: { message: 'query failed' } };
          } else {
            out = single ? { data: rows.length ? rows[0] : null, error: null } : { data: rows, error: null };
          }
          return res ? Promise.resolve(out).then(res) : Promise.resolve(out);
        },
      };
      return api;
    },
  };
}

// The door's real signal shape, copied from the proven harness.
const sendSig = (recipient_name) => ({
  tool_calls: [{ name: 'dear_donna_talk', donna_calls: [{ name: 'donna_relay_send', input: { recipient_name } }] }],
});

const VENDOR_ID = 'v1';
const PHONE = '+919625759924';
const LEADS_LINK = 'https://thedreamwedding.in/vendor/leads';
const ENV = { VENDOR_WHATSAPP_NUMBER: 'whatsapp:+917982159047', VENDOR_PHONE_NUMBER_ID: '123' };

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
const withPnid = (v) => { process.env.VENDOR_PHONE_NUMBER_ID = v; };

// Vendor-side world: a `vendor_self` thread whose newest inbound sets the window.
const vendorWorld = (inboundHours) => ({
  conversations: [{ id: 'vs1', vendor_id: VENDOR_ID, kind: 'vendor_self', counterparty_phone: '+919888294440', last_message_at: hoursAgo(inboundHours) }],
  messages: inboundHours == null ? [] : [{ id: 'm1', conversation_id: 'vs1', direction: 'inbound', created_at: hoursAgo(inboundHours) }],
  admin_config: [{ key: 'vendor.enquiry_alert_oow_enabled', value: 'true' }],
  vendors: [{ id: VENDOR_ID, user_id: 'u1', business_name: 'Studio Nine' }],
  users: [{ id: 'u1', phone: '+919888294440', name: 'Swati' }],
});

const alertArgs = (over = {}) => Object.assign({
  toPhone: '+919888294440',
  text: 'Priya just messaged: "Do you have December 12 free?"',
  vendorName: 'Swati',
  brideName: 'Priya',
  brideMessage: 'Do you have December 12 free?',
  link: LEADS_LINK,
  vendorId: VENDOR_ID,
  ctx: 'bench',
}, over);

(async () => {
console.log('b0607_oow_completion_bench — TDW_06/07 THE OOW COMPLETION');

// ══════════════════════════════════════════════════════════════════════════
H('A1 — THE ALERT ASKS THE WINDOW FIRST AND CARRIES HER WORDS (22)');
// ══════════════════════════════════════════════════════════════════════════

await t('A1.1 IN WINDOW — the free-form alert goes, and no template is touched', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const w = wa(); const sw = sendwa();
  const out = await sendVendorEnquiryAlert(alertArgs(), { sendWhatsApp: w, sendWa: sw, vendorWindowOpen: async () => ({ open: true, reason: 'in_window', hours: 2 }) });
  assert.strictEqual(out.sent, true);
  assert.strictEqual(out.path, 'text');
  assert.strictEqual(sw.calls.length, 0, 'a template went out on an OPEN window');
  assert.strictEqual(w.calls.length, 1);
});

await t('A1.2 OUT OF WINDOW — the BRIEF goes, and no free-form is attempted', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const w = wa(); const sw = sendwa();
  const db = makeDb(vendorWorld(null));
  const out = await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: w, sendWa: sw, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed', hours: 30 }) });
  assert.strictEqual(out.sent, true);
  assert.strictEqual(out.path, 'template');
  assert.strictEqual(out.key, 'enquiry_brief_vendor');
  assert.strictEqual(w.calls.length, 0,
    'a free-form send was attempted out-of-window — the window-first doctrine is not in force');
});

await t('A1.3 THE FOUR SLOTS ARE ALL RESOLVED, TRUTHFULLY', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const sw = sendwa();
  await sendVendorEnquiryAlert(alertArgs({ supabase: makeDb(vendorWorld(null)) }), { sendWhatsApp: wa(), sendWa: sw, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  const v = sw.calls[0].vars;
  assert.strictEqual(v.name, 'Swati');
  assert.strictEqual(v.bride, 'Priya');
  assert.strictEqual(v.summary, 'Do you have December 12 free?', '{{3}} is not her sentence');
  assert.strictEqual(v.link, LEADS_LINK);
});

await t('A1.4 {{3}} IS THE ALERT\'S WHOLE REASON TO EXIST — the old carrier could not say it', async () => {
  const { TEMPLATES } = fresh(TPL);
  assert.strictEqual(TEMPLATES.enquiry_alert_vendor.variables.length, 3);
  assert.strictEqual(TEMPLATES.enquiry_brief_vendor.variables.length, 4);
  assert.ok(TEMPLATES.enquiry_brief_vendor.variables.includes('summary'),
    'the brief has no slot for what she asked');
});

await t('A1.5 THE REGISTRY ENTRY IS BYTE-IDENTICAL TO THE WIRE WITNESS', async () => {
  const { TEMPLATES } = fresh(TPL);
  assert.strictEqual(TEMPLATES.enquiry_brief_vendor.body,
    "Hi {{1}}, a new enquiry just came in on The Dream Wedding. It's from {{2}}, "
    + "and here's what they shared: {{3}}. Open your Leads at {{4}} to see everything and reply.");
  assert.strictEqual(TEMPLATES.enquiry_brief_vendor.name, 'tdw_enquiry_brief_vendor');
  assert.strictEqual(TEMPLATES.enquiry_brief_vendor.line, 'vendor');
});

await t('A1.6 TEMPLATES.md §1 — single line, no gaps, never begins or ends on a variable', async () => {
  const { TEMPLATES } = fresh(TPL);
  const b = TEMPLATES.enquiry_brief_vendor.body;
  assert.ok(!/[\r\n]/.test(b), 'the body is multi-line — Meta rejects a double break');
  assert.deepStrictEqual((b.match(/\{\{(\d)\}\}/g) || []), ['{{1}}', '{{2}}', '{{3}}', '{{4}}']);
  assert.ok(!/^\{\{/.test(b) && !/\}\}$/.test(b.trim()), 'the body begins or ends on a variable');
  assert.ok(!/\}\}\s*\{\{/.test(b), 'two variables are adjacent');
});

await t('A1.7 THE 131047 CATCH IS RETIRED WHOLE — not improved, not kept as caution', async () => {
  const d = code(ALERT);
  assert.ok(!/131047/.test(d), 'the window code survives in the shipped door');
  assert.ok(!/isWindowClosed/.test(d), 'the unreachable predicate survives');
  assert.ok(!/WINDOW_CLOSED_CODE/.test(d), 'the constant survives its reader');
});

await t('A1.8 THE RETIREMENT SAYS WHY, BY PATH AND SYMBOL (path-over-range)', async () => {
  const d = read(ALERT);
  assert.ok(/F-06\.140/.test(d), 'the retirement names no finding');
  assert.ok(/metaCloud\.js/.test(d) && /postMessage/.test(d),
    'a retirement that does not say where the evidence lives is a deletion');
  assert.ok(/CE-212/.test(d), 'the dated production witness is not cited');
});

await t('A1.9 THE WINDOW PREDICATE IS THE ESTATE\'S ONE HOME, not a fourth inline copy', async () => {
  const d = code(ALERT);
  assert.ok(/require\('\.\/waWindow'\)/.test(d), 'the door re-derives the window itself');
  assert.ok(/vendorWindowOpen/.test(d));
  assert.ok(!/from\('conversations'\)[\s\S]{0,200}vendor_self[\s\S]{0,200}created_at/.test(d),
    'an inline window query appeared beside the one home');
});

await t('A1.10 SOLE-CALLER PRESERVED — nothing but the three sites calls this door', async () => {
  const inb = code(INB);
  const hits = (inb.match(/sendVendorEnquiryAlert\(/g) || []).length;
  assert.strictEqual(hits, 3, 'the enquiry alert acquired or lost a caller');
});

await t('A1.11 ALL THREE CALL SITES PASS HER WORDS', async () => {
  const inb = code(INB);
  assert.strictEqual((inb.match(/brideMessage:/g) || []).length, 3,
    'a call site sends the brief with no {{3}} to fill');
  assert.ok(/brideMessage: originalMessage/.test(inb), 'the disambiguated site passes the wrong variable');
  assert.strictEqual((inb.match(/brideMessage: body/g) || []).length, 2);
});

await t('A1.12 {{3}} NEVER CARRIES A NEWLINE, A TAB, OR A 4-SPACE RUN', async () => {
  const { briefSummary } = fresh(ALERT);
  const out = briefSummary('line one\nline two\ttabbed    spaced');
  assert.ok(!/[\r\n\t]/.test(out), 'a newline or tab reached a Meta parameter');
  assert.ok(!/\s{4,}/.test(out), 'a 4+ space run reached a Meta parameter');
  assert.strictEqual(out, 'line one line two tabbed spaced');
});

await t('A1.13 {{3}} TRUNCATES AT THE DECLARED CAP, with an ellipsis', async () => {
  const { briefSummary, SUMMARY_MAX_CHARS } = fresh(ALERT);
  const out = briefSummary('x'.repeat(SUMMARY_MAX_CHARS + 500));
  assert.strictEqual(out.length, SUMMARY_MAX_CHARS, 'the cap is not enforced');
  assert.ok(out.endsWith('…'), 'a truncation that does not show itself is a lie of omission');
});

await t('A1.14 A NAMELESS MESSAGE RENDERS THE DECLARED FALLBACK, never empty', async () => {
  const { briefSummary, SUMMARY_FALLBACK } = fresh(ALERT);
  assert.strictEqual(briefSummary(''), SUMMARY_FALLBACK);
  assert.strictEqual(briefSummary(null), SUMMARY_FALLBACK);
  assert.strictEqual(briefSummary('   '), SUMMARY_FALLBACK);
});

await t('A1.15 THE TERSE BRIDE IS CARRIED HONESTLY — "hi" is what she shared', async () => {
  const { briefSummary } = fresh(ALERT);
  assert.strictEqual(briefSummary('hi'), 'hi',
    'her actual words were replaced by something more presentable');
});

await t('A1.16 THE SCRUB DOOR IS APPLIED TO EVERY VENDOR-FACING PARAM', async () => {
  const d = code(ALERT);
  assert.ok(/scrubText\(vendorName/.test(d) && /scrubText\(brideName/.test(d));
  assert.ok(/scrubText\(/.test(code(ALERT).match(/function briefSummary[\s\S]{0,400}/)[0]),
    'her sentence bypasses the firewall');
});

await t('A1.17 THE ARMING FLAG STILL GATES THE BRIEF — push is not speak', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const sw = sendwa();
  const out = await sendVendorEnquiryAlert(alertArgs({ supabase: makeDb(vendorWorld(null)) }), { sendWhatsApp: wa(), sendWa: sw, readLaneFlag: async () => false, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  assert.strictEqual(out.sent, false);
  assert.strictEqual(out.reason, 'window_closed_fallback_disabled');
  assert.strictEqual(sw.calls.length, 0, 'the brief went out with the lane disarmed');
});

await t('A1.18 AN UNKNOWN DIAL KEY REFUSES LOUDLY WITH ZERO SEND', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const sw = sendwa();
  const db = makeDb({ admin_config: [{ key: 'vendor.enquiry_alert_oow_template', value: '"nonesuch"' }] });
  const out = await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: wa(), sendWa: sw, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  assert.strictEqual(out.sent, false);
  assert.strictEqual(out.reason, 'unknown_template_key');
  assert.strictEqual(sw.calls.length, 0, 'a guessed template reached a vendor');
});

await t('A1.19 THE DOOR NEVER THROWS — every failure class returns a verdict', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const thrower = async () => { throw new Error('window predicate exploded'); };
  const out = await sendVendorEnquiryAlert(alertArgs(), { sendWhatsApp: wa({ throw: true }), sendWa: sendwa(), vendorWindowOpen: async () => ({ open: true, reason: 'in_window' }) });
  assert.strictEqual(out.sent, false);
  assert.strictEqual(out.reason, 'send_failed');
  const out2 = await sendVendorEnquiryAlert(alertArgs({ supabase: makeDb(vendorWorld(null)) }), { sendWhatsApp: wa(), sendWa: sendwa({ throw: 'opted out' }), readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  assert.strictEqual(out2.sent, false);
  assert.strictEqual(out2.reason, 'template_failed');
  await thrower.name; // the sentinel below proves the predicate arm too
});

await t('A1.20 A BLOCKED SENTINEL IS NOT A WINDOW PROBLEM — no template chases it', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const sw = sendwa();
  const out = await sendVendorEnquiryAlert(alertArgs(), { sendWhatsApp: wa({ blocked: 'opted_out' }), sendWa: sw, vendorWindowOpen: async () => ({ open: true, reason: 'in_window' }) });
  assert.strictEqual(out.reason, 'opted_out');
  assert.strictEqual(sw.calls.length, 0,
    'an opted-out vendor was chased with a template — he is opted out of those too');
});

await t('A1.21 BOTH-WAYS · HARNESS HALF — the injected predicate forced OPEN goes free-form', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const w = wa(); const sw = sendwa();
  await sendVendorEnquiryAlert(alertArgs({ supabase: makeDb(vendorWorld(null)) }), { sendWhatsApp: w, sendWa: sw, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: true, reason: 'in_window' }) });
  assert.strictEqual(w.calls.length, 1, 'a forced-open window did not take the free-form arm');
  assert.strictEqual(sw.calls.length, 0);
});

await t('A1.22 BOTH-WAYS · PRODUCTION MUTATION — the DOOR\'S OWN BRANCH inverted goes RED', async () => {
  // A GUARD PROVEN ONLY AGAINST ITS OWN DOUBLE IS A WEAKER PROOF — the seat's
  // own sentence, made a cell by the chair. A1.21 drives an injected predicate;
  // THIS defaces the shipped file so the verdict is consulted and then IGNORED.
  await underMutation(ALERT, 'const inWindow = !!(w && w.open === true);',
                             'const inWindow = true;', async () => {
    const { sendVendorEnquiryAlert } = fresh(ALERT);
    const w = wa(); const sw = sendwa();
    await sendVendorEnquiryAlert(alertArgs({ supabase: makeDb(vendorWorld(null)) }), { sendWhatsApp: w, sendWa: sw, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
    assert.strictEqual(sw.calls.length, 0, 'the mutation did not bite');
    assert.strictEqual(w.calls.length, 1, 'a shut window took the free-form arm — as the mutation intends');
  });
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const sw2 = sendwa();
  await sendVendorEnquiryAlert(alertArgs({ supabase: makeDb(vendorWorld(null)) }), { sendWhatsApp: wa(), sendWa: sw2, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  assert.strictEqual(sw2.calls.length, 1, 'restored tree must be green again');
});

// ══════════════════════════════════════════════════════════════════════════
H('A2 — THE CONTENT ARM, AND THE EQUALITY LAW\'S TRUE OBJECT (26)');
// ══════════════════════════════════════════════════════════════════════════

const draftRow = (over = {}) => Object.assign({
  id: 'd1', vendor_id: VENDOR_ID, conversation_id: 'c9', couple_phone: PHONE,
  body: 'Hi Priya — the December shoot is Rs 60,000. Let me know if that works.',
  // `staged` is the door's real entry state: `handleSend` approves it, then the
  // fork runs. Seeding `approved` would skip the state machine the cells exist
  // to prove — the proven harness's own default, and its reason.
  state: 'staged', twilio_sid: null, created_at: hoursAgo(1),
  resolved_at: null, expires_at: hoursAgo(-23), refusal_reason: null,
}, over);

const shutWorld = (over = {}) => ({
  conversations: [{ id: 'c9', vendor_id: VENDOR_ID, counterparty_phone: PHONE, kind: 'couple_thread', last_message_at: hoursAgo(30) }],
  messages: [{ id: 'mm', conversation_id: 'c9', direction: 'inbound', created_at: hoursAgo(30) }],
  leads: [{ vendor_id: VENDOR_ID, name: 'Priya', phone: PHONE }],
  vendors: [{ id: VENDOR_ID, user_id: 'u1', business_name: 'Studio Nine' }],
  users: [{ id: 'u1', phone: '+919888294440', name: 'Swati' }],
  pending_couple_drafts: [draftRow(over)],
});

await t('A2.1 THE FIT TEST — a short single-line draft FITS', async () => {
  const { contentFits } = fresh(RELAY);
  assert.strictEqual(contentFits('Hi Priya — Rs 60,000 works.').fits, true);
});

await t('A2.2 A MULTI-LINE DRAFT DOES NOT FIT — §1\'s own rule, not a taste', async () => {
  const { contentFits } = fresh(RELAY);
  assert.strictEqual(contentFits('line one\nline two').fits, false);
  assert.strictEqual(contentFits('a\tb').fits, false);
  assert.strictEqual(contentFits('a    b').fits, false, 'a 4-space run is a Meta rejection');
});

await t('A2.3 AN OVER-LENGTH DRAFT DOES NOT FIT, and the reason names the length', async () => {
  const { contentFits, MAX_CONTENT_BODY_CHARS } = fresh(RELAY);
  const r = contentFits('x'.repeat(MAX_CONTENT_BODY_CHARS + 1));
  assert.strictEqual(r.fits, false);
  assert.ok(/^over_length:/.test(r.reason));
  assert.strictEqual(contentFits('x'.repeat(MAX_CONTENT_BODY_CHARS)).fits, true, 'the boundary is off by one');
});

await t('A2.4 THE CAP IS 700 AND DOCUMENTS ITS OWN UNRESOLVED RESIDUAL', async () => {
  const { MAX_CONTENT_BODY_CHARS } = fresh(RELAY);
  assert.strictEqual(MAX_CONTENT_BODY_CHARS, 700);
  const d = read(RELAY);
  assert.ok(/1036/.test(d), 'the counter residual is not named — a constant that hides its uncertainty');
  assert.ok(/1024/.test(d), 'the arithmetic the constant rests on is absent');
});

await t('A2.5 AN EMPTY BODY NEVER RIDES THE ENVELOPE', async () => {
  const { contentFits } = fresh(RELAY);
  assert.strictEqual(contentFits('').fits, false);
  assert.strictEqual(contentFits('   ').fits, false);
  assert.strictEqual(contentFits(null).fits, false);
});

await t('A2.6 THE FORK — a FITTING draft on a shut window SENDS THE CONTENT TEMPLATE', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld(); const m = meta();
  const out = await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID, business_name: 'Studio Nine' },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(out.kind, 'sent', 'the content arm did not fire on a fitting draft');
  assert.strictEqual(m.calls.length, 1);
  assert.strictEqual(m.calls[0].payload.name, 'tdw_enquiry_reply_couple',
    'the doorbell rang where the content template should have gone');
});

await t('A2.7 ③ SPEAKS, UNCHANGED AND TRUE — the envelope is Meta\'s, not the message', async () => {
  withPnid('123456');
  const seat = fresh(SEAT);
  const out = await seat.runRelaySeat(makeDb(shutWorld()), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta(), env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.ok(/^Sent to /.test(out.line), 'byte ③ did not ship on a delivered content send');
  assert.ok(/\+919625759924/.test(out.line), 'the founder\'s standing word: the phone is always shown');
});

await t('A2.8 THE EQUALITY CELL — {{3}} IS THE STORED BODY, BYTE-EXACT', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld(); const m = meta();
  await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  const params = m.calls[0].payload.components[0].parameters.map((p) => p.text);
  assert.strictEqual(params[2], draftRow().body,
    'THE EQUALITY LAW BROKE: what he approved is not what she received');
});

await t('A2.9 EQUALITY SURVIVES A BODY WITH QUOTES AND PUNCTUATION', async () => {
  withPnid('123456');
  const body = 'Rs 60,000 — "all in", no extras. OK?';
  const seat = fresh(SEAT); const m = meta();
  await seat.runRelaySeat(makeDb(shutWorld({ body })), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(m.calls[0].payload.components[0].parameters[2].text, body);
});

await t('A2.10 THE DRAFT IS SPENT — `sent`, resolved, and never re-sendable', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld();
  await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta(), env: ENV, hasTransport: true, conversationId: 'c9' });
  const d = world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'sent', 'a delivered draft was left alive and re-sendable');
  assert.ok(d.resolved_at, 'a terminal transition did not stamp resolved_at');
});

await t('A2.11 THE REGISTER CARRIES `content:<wamid>` — which send, not just that one went', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld();
  await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta({ wamid: 'wamid.XYZ' }), env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(world.pending_couple_drafts[0].refusal_reason, 'content:wamid.XYZ');
  assert.strictEqual(world.pending_couple_drafts[0].twilio_sid, 'wamid.XYZ');
});

await t('A2.12 HER THREAD HOLDS THE BYTES SHE RECEIVED, not a marker', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const db = makeDb(shutWorld());
  await seat.runRelaySeat(db, { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta(), env: ENV, hasTransport: true, conversationId: 'c9' });
  const row = db._log.inserts.find((i) => i.table === 'messages' && i.row.sent_by === 'vendor_relay');
  assert.ok(row, 'bytes reached her handset with no row on her thread — walk seven exactly');
  assert.strictEqual(row.row.body, draftRow().body);
  assert.strictEqual(row.row.twilio_sid, 'wamid.CONTENT', 'the receipt chain has no sid to land on');
});

await t('A2.13 №14 IS REACHABLE — `vendor_relay` is the marker the receipt chain reads', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const db = makeDb(shutWorld());
  await seat.runRelaySeat(db, { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta(), env: ENV, hasTransport: true, conversationId: 'c9' });
  const row = db._log.inserts.find((i) => i.table === 'messages' && i.row.twilio_sid === 'wamid.CONTENT');
  assert.strictEqual(row.row.sent_by, 'vendor_relay',
    'the content send cannot produce a receipt — LEG 1\'s promise on his handset is unkeepable');
});

await t('A2.14 THE LANE IS PINNED — the content template rides the VENDOR PNID', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const m = meta();
  await seat.runRelaySeat(makeDb(shutWorld()), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(m.calls[0].phoneNumberId, '123456',
    'her reply is invited onto a number holding no draft');
  assert.strictEqual(m.calls[0].to, PHONE);
});

await t('A2.15 NO VENDOR PNID ⇒ NO CONTENT SEND, and the doorbell inherits the refusal', async () => {
  delete process.env.VENDOR_PHONE_NUMBER_ID;
  const { sendContentTemplate } = fresh(RELAY);
  const out = await sendContentTemplate(makeDb(shutWorld()), {
    vendor: { id: VENDOR_ID }, couplePhone: PHONE, brideName: 'Priya',
    body: draftRow().body, deps: { sendMetaTemplate: meta() },
  });
  assert.strictEqual(out.ok, false);
  assert.ok(/no_pnid_for_lane/.test(out.reason));
  withPnid('123456');
});

await t('A2.16 A NON-FITTING DRAFT FALLS TO THE DOORBELL — ④b-v2, not ③', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const m = meta();
  const out = await seat.runRelaySeat(makeDb(shutWorld({ body: 'line one\nline two' })), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(out.kind, 'window_closed_doorbell', 'a multi-line draft rode the envelope');
  assert.strictEqual(m.calls[0].payload.name, 'tdw_enquiry_update_couple');
  assert.ok(/been notified on WhatsApp/.test(out.line), 'byte ④b-v2 did not ship');
});

await t('A2.17 THE DOORBELL\'S DRAFT STAYS APPROVED — R-29.35 unbroken beneath the new arm', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld({ body: 'line one\nline two' });
  await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta(), env: ENV, hasTransport: true, conversationId: 'c9' });
  const d = world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'approved');
  assert.strictEqual(d.resolved_at, null);
  assert.ok(/^doorbell:/.test(String(d.refusal_reason)));
});

await t('A2.18 A FAILED CONTENT SEND FALLS TO THE DOORBELL, never claims it went', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld();
  let n = 0;
  const flaky = async (arg, opts) => { n += 1; if (n === 1) throw new Error('meta refused'); return { ok: true, wamid: 'wamid.DOORBELL' }; };
  const out = await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: flaky, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(out.kind, 'window_closed_doorbell');
  assert.strictEqual(world.pending_couple_drafts[0].state, 'approved',
    'a content send that did not go still spent the draft');
});

await t('A2.19 BOTH ARMS FAILING ⇒ BYTE ④ VERBATIM, and the draft is refused', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const world = shutWorld();
  const out = await seat.runRelaySeat(makeDb(world), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: meta({ throw: true }), env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(out.kind, 'window_closed');
  assert.ok(/hasn't written in over 24 hours/.test(out.line), 'byte ④ did not ship');
  assert.strictEqual(world.pending_couple_drafts[0].state, 'refused');
});

await t('A2.20 AN UNDETERMINED WINDOW SENDS NOTHING — ⑤, and neither arm fires', async () => {
  withPnid('123456');
  const seat = fresh(SEAT); const m = meta();
  const world = shutWorld();
  const out = await seat.runRelaySeat(makeDb(world, { queryError: 'conversations' }), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(m.calls.length, 0,
    'a message went out on a window the estate could not read — a send on a guess');
});

await t('A2.21 ONE FIND-OR-CREATE PER FORK — two arms can never land on two rows', async () => {
  const d = code(SEAT);
  const hits = (d.match(/findOrCreateCoupleThread\(supabase, vendor\.id, draft\.couple_phone\)/g) || []).length;
  assert.strictEqual(hits, 1, 'the fork resolves her thread twice — two chances at two rows');
});

await t('A2.22 THE REGISTRY ENTRY IS BYTE-IDENTICAL TO THE WIRE WITNESS', async () => {
  const { TEMPLATES } = fresh(TPL);
  assert.strictEqual(TEMPLATES.enquiry_reply_couple.body,
    'Hi {{1}} — {{2}} has replied to your wedding enquiry: "{{3}}" Reply here to continue the conversation.');
  assert.strictEqual(TEMPLATES.enquiry_reply_couple.name, 'tdw_enquiry_reply_couple');
  assert.strictEqual(TEMPLATES.enquiry_reply_couple.line, 'vendor', 'the content template left the vendor lane');
});

await t('A2.23 THE §1 EM-DASH DIVERGENCE IS DECLARED, not silently "fixed"', async () => {
  const d = read(TPL);
  assert.ok(/NAMED §1 DIVERGENCE/.test(d),
    'the body diverges from §1 and the registry does not say so');
  assert.ok(/enquiry_update_couple/.test(d.split('NAMED §1 DIVERGENCE')[1].slice(0, 1200)),
    'the divergence cites no precedent — a decision with no record is a drift');
});

await t('A2.24 ROUTING PIN — her reply after a content send routes WITHOUT A QUESTION', async () => {
  const arrive = fresh(ARRIVE);
  const world = { pending_couple_drafts: [draftRow({ state: 'sent', resolved_at: hoursAgo(1), refusal_reason: 'content:wamid.XYZ' })] };
  const out = await arrive.doorbellRouteFor(makeDb(world), PHONE);
  assert.strictEqual(out.vendorId, VENDOR_ID,
    'she taps Reply and the router asks which of three vendors she meant — walk eight on a new limb');
  assert.strictEqual(out.reason, 'content_standing');
});

await t('A2.25 THE PIN IS BOUNDED — a content send older than 24h does NOT steer her', async () => {
  const drafts = fresh(DRAFTS);
  const stale = { pending_couple_drafts: [draftRow({ state: 'sent', resolved_at: hoursAgo(25), refusal_reason: 'content:wamid.OLD' })] };
  const out = await drafts.recentContentSendFor(makeDb(stale), PHONE);
  assert.strictEqual(out.draft, null, 'a day-old send is steering a new conversation');
  const fresh24 = { pending_couple_drafts: [draftRow({ state: 'sent', resolved_at: hoursAgo(23), refusal_reason: 'content:wamid.NEW' })] };
  assert.ok((await drafts.recentContentSendFor(makeDb(fresh24), PHONE)).draft, 'the bound is too tight');
});

await t('A2.26 BOTH-WAYS · PRODUCTION MUTATION — defeating the fit test turns A2.16 RED', async () => {
  await underMutation(RELAY, 'if (CONTENT_BAD_WHITESPACE.test(s)) return { fits: false, reason: \'multiline_or_whitespace\' };',
                             'if (false) return { fits: false, reason: \'multiline_or_whitespace\' };', async () => {
    withPnid('123456');
    delete require.cache[require.resolve(SEAT)];
    const seat = require(SEAT); const m = meta();
    const out = await seat.runRelaySeat(makeDb(shutWorld({ body: 'line one\nline two' })), { id: VENDOR_ID },
      sendSig('Priya'),
      { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
    assert.strictEqual(m.calls[0].payload.name, 'tdw_enquiry_reply_couple',
      'the mutation did not bite — a multi-line body would have been refused anyway');
  });
  delete require.cache[require.resolve(SEAT)];
  const seat = require(SEAT); const m = meta();
  await seat.runRelaySeat(makeDb(shutWorld({ body: 'line one\nline two' })), { id: VENDOR_ID },
    sendSig('Priya'),
    { sendWhatsApp: wa(), sendMetaTemplate: m, env: ENV, hasTransport: true, conversationId: 'c9' });
  assert.strictEqual(m.calls[0].payload.name, 'tdw_enquiry_update_couple', 'restored tree must be green again');
});

// ══════════════════════════════════════════════════════════════════════════
H('A3 — №16, THE ESTATE\'S FIRST CLOCK-SPEAKER (18)');
// ══════════════════════════════════════════════════════════════════════════

const NOW = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const H_ = (h) => iso(NOW - h * 3600 * 1000);

const sweepWorld = (over = {}) => ({
  pending_couple_drafts: [draftRow(Object.assign({
    state: 'approved', resolved_at: null, refusal_reason: 'doorbell:wamid.BELL',
    created_at: H_(30), expires_at: H_(6),
  }, over))],
  conversations: [{ id: 'c9', vendor_id: VENDOR_ID, counterparty_phone: PHONE, kind: 'couple_thread' }],
  messages: [{ id: 'bell', conversation_id: 'c9', direction: 'outbound', twilio_sid: 'wamid.BELL', created_at: H_(29) }],
  leads: [{ vendor_id: VENDOR_ID, name: 'Priya', phone: PHONE }],
  vendors: [{ id: VENDOR_ID, user_id: 'u1', business_name: 'Studio Nine' }],
  users: [{ id: 'u1', phone: '+919888294440', name: 'Swati' }],
});

const runSweep = async (world, deps = {}) => {
  const seat = fresh(SEAT);
  const db = makeDb(world);
  const send = deps.sendWhatsApp || wa();
  const out = await seat.relayExpirySweep(db, Object.assign({ sendWhatsApp: send, env: ENV, now: NOW }, deps));
  return { out, db, send, world };
};

await t('A3.1 №16 IS THE FOUNDER\'S BYTE, VERBATIM', async () => {
  const { expiryNoticeLine } = fresh(SEAT);
  assert.strictEqual(expiryNoticeLine('Priya', PHONE),
    "Priya didn't reply to the notification, so your message didn't go out. "
    + 'Want me to write it fresh, or send her another nudge?');
});

await t('A3.2 A NAMELESS BRIDE RENDERS THE PHONE — the guard, per the charter', async () => {
  const { expiryNoticeLine } = fresh(SEAT);
  assert.ok(expiryNoticeLine(null, PHONE).startsWith(`${PHONE} didn't reply`));
  assert.ok(expiryNoticeLine('919625759924', PHONE).startsWith(`${PHONE} didn't reply`),
    'F-06.186: a number on file as a name was spoken as though it were one');
});

await t('A3.3 №16 IS NOT ⑥ — two bytes, two jobs, neither wearing the other\'s clothes', async () => {
  const { expiryNoticeLine, expiredLine } = fresh(SEAT);
  assert.notStrictEqual(expiryNoticeLine('Priya', PHONE), expiredLine());
  assert.ok(!/Tell me again/.test(expiryNoticeLine('Priya', PHONE)));
});

await t('A3.4 THE SWEEP FIRES ONCE ON EXACTLY THE RULED STATE', async () => {
  const { out, send } = await runSweep(sweepWorld());
  assert.strictEqual(out.scanned, 1);
  assert.strictEqual(out.spoke, 1);
  assert.strictEqual(send.calls.length, 1, '№16 did not reach his handset');
  assert.ok(/didn't reply to the notification/.test(send.calls[0].text));
});

await t('A3.5 IDEMPOTENT — a second run on the same world speaks ZERO', async () => {
  const world = sweepWorld();
  await runSweep(world);
  const { out, send } = await runSweep(world);
  assert.strictEqual(out.scanned, 0, 'the swept row is still visible to the sweep');
  assert.strictEqual(send.calls.length, 0, 'the vendor was told twice');
});

await t('A3.6 THE STATE IS STAMPED, and the register says which arm took it', async () => {
  const { world } = await runSweep(sweepWorld());
  const d = world.pending_couple_drafts[0];
  assert.strictEqual(d.state, 'expired');
  assert.strictEqual(d.refusal_reason, 'expired_no_reply:wamid.BELL');
  assert.ok(d.resolved_at, 'a terminal transition did not stamp resolved_at');
});

await t('A3.7 STAMP PRECEDES SPEECH — a byte never outruns the state it reports', async () => {
  const d = code(SEAT);
  const fn = d.match(/async function relayExpirySweep[\s\S]*?\n}/)[0];
  assert.ok(fn.indexOf('markSweptExpired') < fn.indexOf('pushToVendor'),
    'the notice is spoken before the row is stamped — a stamp failure repeats it hourly');
});

await t('A3.8 FIXTURE-ABSENT · a SUPERSEDED draft refuses', async () => {
  const { out } = await runSweep(sweepWorld({ state: 'expired', refusal_reason: 'superseded' }));
  assert.strictEqual(out.scanned, 0);
});

await t('A3.9 FIXTURE-ABSENT · a CANCELLED draft refuses', async () => {
  const { out } = await runSweep(sweepWorld({ state: 'refused', refusal_reason: 'window_closed' }));
  assert.strictEqual(out.scanned, 0);
});

await t('A3.10 FIXTURE-ABSENT · a CONTENT-SENT draft refuses', async () => {
  const { out } = await runSweep(sweepWorld({ state: 'sent', resolved_at: H_(2), refusal_reason: 'content:wamid.X' }));
  assert.strictEqual(out.scanned, 0);
});

await t('A3.11 FIXTURE-ABSENT · a draft that was NEVER RUNG refuses', async () => {
  const { out } = await runSweep(sweepWorld({ refusal_reason: null }));
  assert.strictEqual(out.scanned, 0,
    'a vendor was told she ignored a notification the estate never sent her');
});

await t('A3.12 FIXTURE-ABSENT · a draft still INSIDE its 24 hours refuses', async () => {
  const { out } = await runSweep(sweepWorld({ expires_at: H_(-2) }));
  assert.strictEqual(out.scanned, 0, 'the clock was not consulted');
});

await t('A3.13 SHE REPLIED — the row is stamped and NOTHING is spoken', async () => {
  const world = sweepWorld();
  world.messages.push({ id: 'reply', conversation_id: 'c9', direction: 'inbound', created_at: H_(20) });
  const seat = fresh(SEAT);
  const send = wa();
  const out = await seat.relayExpirySweep(makeDb(world), { sendWhatsApp: send, env: ENV, now: NOW });
  assert.strictEqual(out.spoke, 0, 'a vendor was told she ignored him when she did not');
  assert.strictEqual(out.silent, 1);
  assert.strictEqual(world.pending_couple_drafts[0].refusal_reason, 'expired_after_reply:wamid.BELL');
});

await t('A3.14 A REPLY BEFORE THE DOORBELL DOES NOT SUPPRESS №16', async () => {
  const world = sweepWorld();
  world.messages.push({ id: 'old', conversation_id: 'c9', direction: 'inbound', created_at: H_(29.5) });
  const { out } = await (async () => {
    const seat = fresh(SEAT); const send = wa();
    const o = await seat.relayExpirySweep(makeDb(world), { sendWhatsApp: send, env: ENV, now: NOW });
    return { out: o };
  })();
  assert.strictEqual(out.spoke, 1, 'a message predating the ring was read as an answer to it');
});

await t('A3.15 THE ⑥-COLLISION IS UNREACHABLE, AND ITS DIRECTION IS THE CELL', async () => {
  // She arrives first ⇒ approvedForPhone self-heals the row to `expired` and the
  // ARRIVAL speaks ⑥. The sweep then finds nothing, because clause 1 is `approved`.
  const drafts = fresh(DRAFTS);
  const world = sweepWorld();
  await drafts.approvedForPhone(makeDb(world), PHONE);   // the arrival's own read
  assert.strictEqual(world.pending_couple_drafts[0].state, 'expired', 'the arrival did not self-heal');
  const { out } = await runSweep(world);
  assert.strictEqual(out.scanned, 0, 'both paths can narrate one draft — ⑥ and №16 would collide');
});

await t('A3.16 №16 RIDES F-06.180\'S ONE HOME — never `vendors.phone`', async () => {
  const d = code(SEAT);
  const fn = d.match(/async function pushToVendor[\s\S]*?\n}/)[0];
  assert.ok(/vendorHandset/.test(fn), 'the handset is assumed rather than resolved');
  assert.ok(!/vendor\.phone/.test(fn), 'a column that does not exist is being selected again');
});

await t('A3.17 THE CRON IS SITED BESIDE ITS SIBLINGS, at its own minute', async () => {
  const c = code(CRON);
  assert.ok(/cron\.schedule\('5 \* \* \* \*'/.test(c), 'the cadence is not the ruled one');
  assert.ok(/relayExpirySweep/.test(c), 'the sweep has no schedule — a clock-speaker with no clock');
  assert.ok(/timezone: 'Asia\/Kolkata'/.test(c));
  assert.strictEqual((c.match(/cron\.schedule\('5 /g) || []).length, 1, 'the slot is shared');
});

await t('A3.18 BOTH-WAYS · PRODUCTION MUTATION — dropping the doorbell clause turns A3.11 RED', async () => {
  await underMutation(DRAFTS, ".like('refusal_reason', `${DOORBELL_REASON_PREFIX}%`)", '.not()', async () => {
    const world = sweepWorld({ refusal_reason: null });
    delete require.cache[require.resolve(SEAT)];
    const seat = require(SEAT);
    const out = await seat.relayExpirySweep(makeDb(world), { sendWhatsApp: wa(), env: ENV, now: NOW });
    assert.strictEqual(out.scanned, 1, 'the mutation did not bite — the clause was never load-bearing');
  });
  delete require.cache[require.resolve(SEAT)];
  delete require.cache[require.resolve(DRAFTS)];
  const { out } = await runSweep(sweepWorld({ refusal_reason: null }));
  assert.strictEqual(out.scanned, 0, 'restored tree must be green again');
});

// ══════════════════════════════════════════════════════════════════════════
H('A4 — THE SID DISCIPLINE AT THE ALERT PATH\'S OWN SITE (8)');
// ══════════════════════════════════════════════════════════════════════════

await t('A4.1 THE BRIEF WRITES ITS OWN ROW, carrying the wamid', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const db = makeDb(vendorWorld(null));
  await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: wa(), sendWa: sendwa({ wamid: 'wamid.B1' }), readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  const row = db._log.inserts.find((i) => i.table === 'messages');
  assert.ok(row, 'the alert path still writes no row — matched=0 survives');
  assert.strictEqual(row.row.twilio_sid, 'wamid.B1', 'matched=1 is still unachievable at this path');
});

await t('A4.2 THE SID IS READ THROUGH sendWa\'S COMPOSITE CONTRACT, never `out.sid`', async () => {
  const { readSend } = fresh(RELAY);
  const real = { sent: true, mode: 'template', key: 'k', result: { ok: true, wamid: 'wamid.B1' } };
  assert.deepStrictEqual(readSend('sendwa_template', real), { ok: true, id: 'wamid.B1', reason: 'sent' });
  assert.strictEqual(readSend('freeform', real).id, null,
    'the free-form contract harvests an id from a composite — walk seven, one lane over');
});

await t('A4.3 THE ROW CARRIES A MARKER, NOT THE MESSAGE — no duplicated notification', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const db = makeDb(vendorWorld(null));
  await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: wa(), sendWa: sendwa(), readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  const row = db._log.inserts.find((i) => i.table === 'messages');
  assert.strictEqual(row.row.body, '[enquiry_brief] tdw_enquiry_brief_vendor');
  assert.ok(!/December 12/.test(row.row.body),
    'the notification is now in his history twice — a regression the sid is not worth');
});

await t('A4.4 `sent_by` MINTS NO NEW REGISTER VALUE, and cannot fire a false receipt', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const db = makeDb(vendorWorld(null));
  await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: wa(), sendWa: sendwa(), readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  const row = db._log.inserts.find((i) => i.table === 'messages');
  assert.strictEqual(row.row.sent_by, 'system');
  assert.notStrictEqual(row.row.sent_by, 'vendor_relay',
    '№14 would fire and tell the vendor his own number received his own alert');
});

await t('A4.5 THE ROW LANDS ON HIS `vendor_self` THREAD', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const db = makeDb(vendorWorld(null));
  await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: wa(), sendWa: sendwa(), readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  const row = db._log.inserts.find((i) => i.table === 'messages');
  assert.strictEqual(row.row.conversation_id, 'vs1');
  assert.strictEqual(row.row.direction, 'outbound');
});

await t('A4.6 A MISSING THREAD IS A NAMED REFUSAL, never a crash and never a silent skip', async () => {
  const { recordBriefSend } = fresh(ALERT);
  const ok = await recordBriefSend(makeDb({ conversations: [] }), VENDOR_ID, 'tdw_x', 'wamid.Z', 'bench');
  assert.strictEqual(ok, false);
});

await t('A4.7 A LOGGING FAILURE NEVER TURNS A DELIVERED BRIEF INTO A FAILURE', async () => {
  const { sendVendorEnquiryAlert } = fresh(ALERT);
  const db = makeDb(vendorWorld(null), { failInsert: 'messages' });
  const out = await sendVendorEnquiryAlert(alertArgs({ supabase: db }), { sendWhatsApp: wa(), sendWa: sendwa(), readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) });
  assert.strictEqual(out.sent, true, 'a brief that reached his handset was reported as failed');
  assert.strictEqual(out.path, 'template');
});

await t('A4.8 THE SCOPE BOUNDARY IS NAMED AT ITS OWN MECHANISM, not in a document', async () => {
  const d = read(ALERT);
  assert.ok(/F-06\.143/.test(d), 'the finding this half-cures is unnamed');
  assert.ok(/HYGIENE MICRO/.test(d) && /engine\.js/.test(d),
    'the in-window leg\'s surviving sid gap is not named where the next reader will stand');
});

// ══════════════════════════════════════════════════════════════════════════
const total = pass + fails.length;
console.log(`\n${'═'.repeat(70)}`);
if (fails.length) {
  console.log(`RED — b0607_oow_completion_bench ${pass}/${total}`);
  fails.forEach((f) => console.log(`  · ${f}`));
  process.exit(1);
}
console.log(`GREEN — b0607_oow_completion_bench ${pass}/${total}`);
})();
