// src/api/admin/prospects.js — admin surface for the prospect lane (Block 05, P3).
//
// Mounted at /api/v2/admin/prospects on the vendor/admin service (the same service that hosts
// /api/v2/admin/failed-turns). Follows the established admin sub-router shape verbatim:
// requireAdmin + asyncHandler + req.app.locals.supabase + ok/err. Field parity with the existing
// Vendor Pipeline intake: phone, ig_handle, name, category, city.
//
// Sends (send-opener) go through the real sendWa gate → the Meta Cloud API template transport.
// With Meta creds unset (Movement A) that path returns a typed 'meta_not_configured' error rather
// than a silent success — the live send is founder-gated (Movement B).
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { normalizeTo } = require('../../lib/metaCloud');
const { sendWa } = require('../../lib/sendWa');
const { readDailyCap } = require('../../lib/prospects');
const { DISCARDED, REFUSAL, deleteRefusal, discardRefusal, restoreRefusal, exitKind } = require('../../lib/prospectExit');

// ═════════════════════════════════════════════════════════════════════════════
// THE INTAKE GUARD (F-08.55's protection, moved to the door) — CE-ruled
// ═════════════════════════════════════════════════════════════════════════════
//
// F-08.55 stopped a registered vendor being SOLD to on the marketing line, at
// the turn. It could not stop one being LOADED onto the lane in the first place
// — and the console this router now serves puts intake under the founder's own
// thumb, at speed, from a phone. The likeliest accident in the estate is him
// pasting a list that contains his own customers.
//
// THE PREDICATE IS demoLeadAlert's OWN, not a second opinion: both phone forms,
// because `users.phone` has no single normalizer governing writes so its
// canonical shape is DECLARED, never derived. `closerEngine.isRegisteredUser`
// uses the same pair for the same reason.
//
// IT FAILS **CLOSED**, and that asymmetry is deliberate and OPPOSITE to the
// turn's. At the turn a human has already spoken and silence is the ruder
// failure, so a broken lookup proceeds. HERE nothing is waiting: the cost of a
// refused intake is one row the founder re-adds; the cost of a wrong intake is
// a customer receiving a sales pitch from the house. So a lookup that throws
// REFUSES, loudly logged.
//
// KEY-NEVER-PROSE: the screen renders on `already_registered`, so the sentence
// can change without a client edit.
async function isRegisteredPhone(supabase, phone) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .in('phone', [phone, `+${phone}`])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// PHONE SHAPE AT THE DOOR, so the register law holds at INTAKE and not only on
// the wire. `normalizeTo` strips `+` and the `whatsapp:` prefix and stops there
// — a bare ten-digit Indian number survives it intact and then fails silently
// at Meta, hours later, as a send that never arrives. Refused here with a key
// the screen can render, because a number the founder can still see on his own
// screen is a number he can still fix.
const BARE_TEN_DIGIT_RE = /^\d{10}$/;

function phoneFault(phone) {
  if (!phone) return 'phone_required';
  if (BARE_TEN_DIGIT_RE.test(phone)) return 'missing_country_code';
  if (!/^\d{8,15}$/.test(phone)) return 'phone_not_numeric';
  return null;
}

// ── THE SECOND VOCABULARY (P3-D read-first §4.4) ─────────────────────────────
// This list is NOT decoration and it is not bridge.js's. It governs two things:
// the `?state=` filter (:below) and the seed of the `counts` object — and the
// counts object is what the console's FilterPills are built from
// (`dreamos-pwa app/admin/prospects/page.tsx`, `Object.keys(counts)`). Leave
// `discarded` out of this array and the sequence is: no `discarded` key in
// counts → no Discarded pill on the board → the rows this delivery creates are
// invisible on the very screen that created them, while `?state=discarded`
// answers 400. A state whose own screen cannot show it is F-06.196's disease in
// UI form. Both vocabularies move together or neither does.
const VALID_STATES = ['cold', 'templated', 'replied', 'in_session', 'converted', 'opted_out', 'expired', DISCARDED];
const VALID_SOURCES = ['sheet', 'manual', 'other'];
const CAP_KEY = 'marketing.daily_template_cap';

function cleanProspectInput(b) {
  return {
    // SPACES AND DASHES ARE WHAT A HUMAN TYPES, and `normalizeTo` strips only
    // `+` and the `whatsapp:` prefix. Caught by this router's own bench: the
    // shape "+91 98882 94440" — which is how the number appears on a phone —
    // survived normalization as "91 98882 94440" and was refused as non-numeric.
    // A door that rejects the format printed on the handset is not a door.
    phone:     b.phone ? normalizeTo(String(b.phone).replace(/[\s\-().]/g, '')) : null,
    name:      b.name || null,
    ig_handle: b.ig_handle || b.ig || null,
    category:  b.category || null,
    city:      b.city || null,
  };
}

// GET / — state board (counts per state) + a filtered list. ?state, ?limit, ?offset.
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'all';
  if (state !== 'all' && !VALID_STATES.includes(state)) {
    return errRes(res, 400, `state must be one of ${VALID_STATES.join(', ')} or 'all'.`);
  }
  const limit  = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
  const offset = parseInt(req.query.offset || '0', 10) || 0;

  // ── THE STATE BOARD (F-05.70 limb 2 · R-30.23) ────────────────────────────
  // THIS LOOP READ: `if (counts[row.state] != null) counts[row.state]++`, over an
  // object seeded from VALID_STATES alone. A state the vocabulary did not name
  // was not bucketed to `other` and not emitted — it was DROPPED, and the board
  // above it still added up, which is the fixed-list filter under-reporting while
  // looking complete. The screen cure (a tile row generated from this object)
  // would have been a cure of the symptom's symptom: a ninth state can only
  // auto-render if this payload names it FIRST.
  //
  // THE SEED IS NOW BOTH: the vocabulary (so a state with zero rows still renders
  // its tile at 0, which is a real fact and not an absence) AND the rows actually
  // observed (so a state nobody declared is counted rather than censored). The
  // screen's humanising fallback is what turns the unrecognised key into a label.
  const counts = {};
  for (const s of VALID_STATES) counts[s] = 0;
  const { data: all } = await supabase.from('prospects').select('state, last_template_at');
  for (const row of (all || [])) {
    const k = row && row.state;
    if (k == null) continue;
    counts[k] = (counts[k] || 0) + 1;
  }

  // ── THE CUMULATIVE FIGURE (F-05.70 limb 1 · R-30.22 §2) ───────────────────
  // `counts.templated` is a WAYPOINT: the sweep writes `templated`, and the first
  // inbound writes it straight back out to `replied`/`in_session`, and 24h later
  // to `expired`. Reading it as "openers sent" told the founder ZERO over a lane
  // that had sent four. `last_template_at` is the RECORD of a send — it has
  // exactly two writers (this file's send-opener and runOpenerJob) and nothing
  // ever clears it, INCLUDING restore, because the send genuinely happened.
  // This is the founder's own audit query made a served fact.
  const openers_sent_total = (all || []).filter(r => r && r.last_template_at).length;

  let q = supabase
    .from('prospects')
    .select('id, phone, name, ig_handle, category, city, source, state, demo_vendor_ref, last_template_at, session_opened_at, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (state !== 'all') q = q.eq('state', state);

  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);

  // ── THE CONVERSATION MEMBER, DERIVED SERVER-SIDE (R-30.13) ────────────────
  // "The founder is never offered a button that will refuse him." The board row
  // can answer two of R-30.10's three members from columns it already carries
  // (`last_template_at`, `demo_vendor_ref`); it cannot answer the third, because
  // conversation existence lives in another table.
  //
  // A PROXY WAS AVAILABLE AND IS REFUSED. `session_opened_at` is stamped in the
  // same breath as the only `openProspectConversation` call in the estate
  // (`src/lib/prospects.js:264-269`; that function has exactly one caller,
  // grepped) — so today it is an exact proxy. Today. A proxy that is exact until
  // someone adds a second caller is a silent drift waiting to hand the founder a
  // Delete button over a live thread, and the cascade is the cost. ONE query,
  // over the ids on the page, answers it truthfully instead.
  //
  // FAIL-CLOSED, matching the intake guard's asymmetry: if the lookup errors,
  // every row is stamped `has_conversation: true`, so the screen offers Discard
  // and never Delete. The delete route re-derives this itself and refuses on its
  // own broken lookup — the screen's copy is a courtesy, never the guard.
  const rows = data || [];
  const ids  = rows.map(r => r.id);
  let convIds = null;                                   // null = undetermined
  if (ids.length) {
    const { data: convs, error: cErr } = await supabase
      .from('conversations').select('prospect_id')
      .eq('kind', 'prospect_marketing').in('prospect_id', ids);
    if (cErr) {
      console.warn(`[admin:prospects] conversation stamp FAILED: ${cErr.message} — every row reads as contacted`);
    } else {
      convIds = new Set((convs || []).map(c => c.prospect_id));
    }
  } else {
    convIds = new Set();
  }
  // ── ONE AUTHORITY, NOT TWO (R-30.13) ──────────────────────────────────────
  // `exit_kind` is stamped HERE rather than derived on the screen, and the reason
  // is this page's own founding law: the state vocabulary is rendered from the
  // wire because a hardcoded list would make the console a second opinion about a
  // state machine that lives in the other repository. The exit RULES are the same
  // kind of thing — four members, one of them a table the screen cannot see. The
  // screen renders what this router ruled; it never re-derives it, so the button
  // the founder is offered and the answer he would get cannot drift apart.
  const stamped = rows.map(r => {
    const has = convIds ? convIds.has(r.id) : true;
    return { ...r, has_conversation: has, exit_kind: exitKind(r, has) };
  });

  return okRes(res, { prospects: stamped, counts, openers_sent_total, state, limit, offset });
}));

// POST / — manual add (source='manual'). phone required.
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const input = cleanProspectInput(req.body || {});
  const fault = phoneFault(input.phone);
  if (fault === 'phone_required')       return errRes(res, 400, 'phone is required.', fault);
  if (fault === 'missing_country_code') return errRes(res, 400, 'Add the country code — 91 and then the ten digits.', fault);
  if (fault)                            return errRes(res, 400, 'That phone number has characters in it that a number cannot have.', fault);

  // THE GUARD, before any write.
  try {
    if (await isRegisteredPhone(supabase, input.phone)) {
      return errRes(res, 409, 'That number already belongs to a vendor on The Dream Wedding. This lane is for people who have not joined yet.', 'already_registered');
    }
  } catch (e) {
    console.error(`[admin:prospects] registered check FAILED for ${input.phone}: ${e && e.message} — REFUSING: nothing is waiting on this, and the wrong intake sells to a customer`);
    return errRes(res, 503, 'Could not check that number against existing vendors. Nothing was added — try again.', 'registered_check_failed');
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert({ ...input, source: 'manual', state: 'cold' })
    .select('*').single();
  if (error) {
    if (error.code === '23505') {
      // ── R-30.11 · F2 ARM (b) — A DISCARDED ROW SAYS SO ────────────────────
      // `phone` is UNIQUE (0085:25), so re-adding a discarded number lands here
      // as a duplicate and WOULD have read "Already on the board" — a sentence
      // that is true and useless, because the board's default filter does not
      // show him the row it is talking about.
      //
      // THE ARM NOT TAKEN, and why: un-discarding back to `cold` on collision
      // (F2-a) would re-arm the morning sweep from a paste, silently. This door
      // fails closed for exactly the reason its own guard block gives at :37-42
      // — nothing is waiting at intake. Re-engagement is the Restore verb, an
      // explicit act on a named row, never a side effect of a list.
      const { data: existing } = await supabase
        .from('prospects').select('state').eq('phone', input.phone).maybeSingle();
      if (existing && existing.state === DISCARDED) {
        return errRes(res, 409, 'That number was discarded. Restore it from the Discarded list to re-add.', REFUSAL.ALREADY_DISCARDED);
      }
      return errRes(res, 409, 'A prospect with that phone already exists.', 'duplicate_phone');
    }
    return errRes(res, 500, error.message);
  }
  return okRes(res, { prospect: data });
}));

// POST /bulk — n8n / sheet flow. { prospects: [ {phone, name, ig_handle, category, city}, ... ] }
// source='sheet'. Duplicates by phone are skipped (not errored) so a re-run is idempotent.
router.post('/bulk', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const rows = Array.isArray(req.body && req.body.prospects) ? req.body.prospects : null;
  if (!rows) return errRes(res, 400, 'body.prospects must be an array.');

  // `refused` is a FOURTH bucket and it is additive on purpose: the n8n sheet
  // flow reads insertedCount/skippedCount/failedCount and must not break, while
  // a refusal is genuinely none of those three — the row was valid, well-formed
  // and deliberately not taken.
  const inserted = [], skipped = [], failed = [], refused = [];
  for (const raw of rows) {
    const input = cleanProspectInput(raw);
    const fault = phoneFault(input.phone);
    if (fault) { failed.push({ phone: input.phone || null, input: raw, error: fault }); continue; }
    try {
      if (await isRegisteredPhone(supabase, input.phone)) {
        refused.push({ phone: input.phone, error: 'already_registered' });
        continue;
      }
    } catch (e) {
      console.error(`[admin:prospects] registered check FAILED for ${input.phone}: ${e && e.message} — REFUSING that row`);
      refused.push({ phone: input.phone, error: 'registered_check_failed' });
      continue;
    }
    const { data, error } = await supabase
      .from('prospects')
      .insert({ ...input, source: 'sheet', state: 'cold' })
      .select('id, phone').single();
    if (error) {
      if (error.code === '23505') {
        // THE TWIN DOOR, R-30.11. `skipped` means "already on the board and
        // nothing to do"; a discarded row is neither. It goes to `refused` —
        // the bucket this router already minted for a row that was valid,
        // well-formed and deliberately not taken — so a sheet re-run surfaces
        // the discarded number by name instead of burying it in a count.
        const { data: existing } = await supabase
          .from('prospects').select('state').eq('phone', input.phone).maybeSingle();
        if (existing && existing.state === DISCARDED) refused.push({ phone: input.phone, error: REFUSAL.ALREADY_DISCARDED });
        else skipped.push(input.phone);
      }
      else failed.push({ phone: input.phone, error: error.message });
    } else {
      inserted.push(data);
    }
  }
  return okRes(res, { insertedCount: inserted.length, skippedCount: skipped.length,
                      failedCount: failed.length, refusedCount: refused.length,
                      inserted, skipped, failed, refused });
}));

// GET /cap — the current daily template cap (defaults to 25 when unseeded).
router.get('/cap', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const cap = await readDailyCap(supabase);
  return okRes(res, { cap });
}));

// PATCH /cap — set the cap. Upserts the admin_config key (works pre-seed; value stored as text).
router.patch('/cap', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const raw = req.body && req.body.cap;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return errRes(res, 400, 'cap must be a non-negative integer.');
  const { error } = await supabase
    .from('admin_config')
    .upsert({ key: CAP_KEY, value: String(n), description: 'Marketing new-prospect template cap per day (TDW_05 P3, W-9)' }, { onConflict: 'key' });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { cap: n });
}));

// GET /:id/conversation — per-prospect conversation view (read): the prospect_marketing thread
// (joined by prospect_id, the 0085 owner model) and its messages, oldest-first.
router.get('/:id/conversation', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: prospect, error: pErr } = await supabase
    .from('prospects').select('*').eq('id', id).single();
  if (pErr || !prospect) return errRes(res, 404, 'Prospect not found.');

  const { data: conversation } = await supabase
    .from('conversations').select('*')
    .eq('prospect_id', id).eq('kind', 'prospect_marketing').maybeSingle();

  let messages = [];
  if (conversation) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, direction, channel, body, sent_by, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    messages = msgs || [];
  }
  return okRes(res, { prospect, conversation: conversation || null, messages });
}));

// POST /:id/send-opener — manual "send opener now". Sends marketing_opener, state → templated.
router.post('/:id/send-opener', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: p, error: pErr } = await supabase.from('prospects').select('*').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');
  if (p.state === 'opted_out') return errRes(res, 409, 'Prospect has opted out.', 'opted_out');
  // ── R-30.14 · PATH 3 OF SIX (P3-D read-first §4.3) ────────────────────────
  // This was the lane's second send door and it refused `opted_out` ALONE, so
  // the console's own Send-opener button would message a row the console had
  // just discarded. The arm the chair refused was the "deliberate override":
  // messaging a human while the row still says discarded makes the state a lie,
  // and the Restore verb makes the override unnecessary — restore first, then
  // send, and the state is true at every instant.
  if (p.state === DISCARDED) {
    return errRes(res, 409, 'This prospect is discarded — restore first if you want to message them.', REFUSAL.DISCARDED);
  }

  try {
    await sendWa(
      { line: 'marketing', to: p.phone, templateKey: 'marketing_opener', vars: { name: p.name || 'there' }, supabase },
      {},
    );
  } catch (e) {
    return errRes(res, 502, `Opener send refused: ${e && e.message}`, (e && e.code) || 'send_failed');
  }

  const { data, error } = await supabase
    .from('prospects')
    .update({ state: 'templated', last_template_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id).select('id, state, last_template_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { prospect: data });
}));

// POST /:id/mark-converted — manual conversion (interim to the Block-08 nightly match).
router.post('/:id/mark-converted', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;
  const { data: p, error: pErr } = await supabase.from('prospects').select('id, state').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');
  if (p.state === 'opted_out') return errRes(res, 409, 'Prospect has opted out.', 'opted_out');

  const { data, error } = await supabase
    .from('prospects')
    .update({ state: 'converted', updated_at: new Date().toISOString() })
    .eq('id', id).select('id, state').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { prospect: data });
}));

// ═════════════════════════════════════════════════════════════════════════════
// THE EXIT DOOR — TDW_05 P3-D, CE-30 (R-30.10 · R-30.11 · R-30.13)
// ═════════════════════════════════════════════════════════════════════════════
// A row, once entered, had no exit: this router carried ZERO `router.delete`
// while `runOpenerJob` (src/lib/prospects.js:316) picks `cold` rows oldest-first
// at 10am IST and MESSAGES them. An incorrect number sitting on this lane was
// not untidy — it was a scheduled outbound to a stranger.
//
// TWO VERBS, NOT ONE, AND THE ROW CHOOSES WHICH. Hard delete is for a row that
// was never contacted; anything else takes DISCARD, which keeps the record and
// the history and takes the human out of every reach the lane has.
//
// §4's DESTRUCTIVE-DB LAW is satisfied here by charter (R-30.9, the founder's
// word 「 c. 」 2026-08-11), by the per-row confirm the console renders as its
// runtime form, and by the log line below. The estate has no precedent for this:
// `demoAdmin.js:483` speaks the DELETE verb but calls `demoLifecycle.deactivate`
// — a flip of `active`, not a row removal. This is the first route in the estate
// that removes a public-plane row, and it is written like it.

// DELETE /:id — hard delete, never-contacted rows only (R-30.10, arm (c)).
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: p, error: pErr } = await supabase
    .from('prospects').select('id, phone, state, last_template_at, demo_vendor_ref').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');

  // MEMBER 2 IS A QUERY AND ITS FAILURE REFUSES. The whole point of this member
  // is the cascade at 0085:69 → 0001:66 (conversation, then every message on
  // it). A lookup that throws tells us nothing about whether a thread exists, so
  // proceeding would be deleting on an unknown — the exact asymmetry this
  // router's intake guard states at :37-42, and here the stakes are a row that
  // does not come back.
  let hasConversation;
  try {
    const { data: conv, error: cErr } = await supabase
      .from('conversations').select('id')
      .eq('prospect_id', id).eq('kind', 'prospect_marketing').maybeSingle();
    if (cErr) throw cErr;
    hasConversation = !!conv;
  } catch (e) {
    console.error(`[admin:prospects] conversation check FAILED for ${id}: ${e && e.message} — REFUSING the delete: a thread we cannot see is a thread we must not cascade`);
    return errRes(res, 503, 'Could not check whether this prospect has a conversation. Nothing was deleted — try again.', 'conversation_check_failed');
  }

  const refusal = deleteRefusal(p, hasConversation);
  // R-30.19 · F-05.68. The register is the human's; the house may not erase it.
  if (refusal === REFUSAL.OPTED_OUT_LOCKED) {
    return errRes(res, 409, 'They opted out — this row stays as the record of that.', refusal);
  }
  if (refusal === REFUSAL.ALREADY_CONTACTED) {
    return errRes(res, 409, 'Already messaged — discard instead of deleting.', refusal);
  }
  if (refusal === REFUSAL.HAS_CONVERSATION) {
    return errRes(res, 409, 'This prospect has a conversation on file — discard instead of deleting.', refusal);
  }
  if (refusal === REFUSAL.HAS_DEMO) {
    return errRes(res, 409, 'A demo was built for this prospect — discard instead of deleting.', refusal);
  }

  const { data: gone, error } = await supabase
    .from('prospects').delete().eq('id', id).select('id, phone').single();
  if (error) return errRes(res, 500, error.message);

  // §4: "the action logged in the handover." A handover is written once; this
  // line is written every time, which is the only version that survives.
  console.warn(`[admin:prospects] HARD DELETE — prospect ${gone.id} / ${gone.phone} removed by admin (never templated, no conversation, no demo)`);
  return okRes(res, { deleted: gone });
}));

// POST /:id/discard — the transition a contacted row takes instead.
router.post('/:id/discard', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: p, error: pErr } = await supabase
    .from('prospects').select('id, phone, state').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');

  const refusal = discardRefusal(p);
  // R-30.20 — two refusals, two sentences. A single line for both would tell the
  // founder "already discarded" about a row that is opted out, which is a false
  // statement about the one state this delivery must not blur.
  if (refusal === REFUSAL.OPTED_OUT_LOCKED) {
    return errRes(res, 409, 'They opted out — this row stays as the record of that.', refusal);
  }
  if (refusal) return errRes(res, 409, 'This prospect is already discarded.', refusal);

  // `discarded_at` is 0119's column (R-30.12). It exists because `updated_at` is
  // stamped by every write `updateProspect` performs (src/lib/prospects.js:106),
  // so it cannot answer "when did we drop them" the moment anything else touches
  // the row.
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('prospects')
    .update({ state: DISCARDED, discarded_at: now, updated_at: now })
    .eq('id', id).select('id, phone, state, discarded_at').single();
  if (error) return errRes(res, 500, error.message);

  console.warn(`[admin:prospects] DISCARD — prospect ${data.id} / ${data.phone} removed from the lane's reach (record kept)`);
  return okRes(res, { prospect: data });
}));

// POST /:id/restore — R-30.11. discarded → cold ONLY. Never a wildcard.
router.post('/:id/restore', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: p, error: pErr } = await supabase
    .from('prospects').select('id, phone, state').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');

  const refusal = restoreRefusal(p);
  if (refusal) return errRes(res, 409, 'Only a discarded prospect can be restored.', refusal);

  // → `cold`, WHICH RE-ARMS THE MORNING SWEEP, and that is the whole reason this
  // verb is explicit and confirmed rather than implicit at intake. The confirm
  // byte names the consequence out loud; a byte never hides the state it creates.
  // `discarded_at` is cleared so the column always means "discarded right now",
  // never "was discarded once" — a stamp that outlives its state is a second,
  // disagreeing answer to the same question.
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('prospects')
    .update({ state: 'cold', discarded_at: null, updated_at: now })
    .eq('id', id).select('id, phone, state, discarded_at').single();
  if (error) return errRes(res, 500, error.message);

  console.warn(`[admin:prospects] RESTORE — prospect ${data.id} / ${data.phone} returned to the lane as cold; the morning sweep can reach them again`);
  return okRes(res, { prospect: data });
}));

module.exports = router;
