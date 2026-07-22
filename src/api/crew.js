// src/api/crew.js
// TDW_04.5 · P3 — THE CREW PAGE (interactive, no login — founder ruling P-1).
//
//   GET  /api/v2/crew/:token                 — the member's own board
//   POST /api/v2/crew/:token/confirm         — { event_id, status, note? }
//   POST /api/v2/crew/:token/task            — { task_id, done: true }
//
// Mounted in src/api/router.js beside the PUBLIC routers (CE-ruled). It must NEVER
// mount under src/api/vendor/core.js: that sub-router lives at /api/v2/vendor and its
// siblings all carry requireAuth + resolveVendor. This door has no session by design.
//
// ── THE CAPABILITY LAW (spec §3, absolute; CE-ruled as ACCEPTANCE) ───────────
// The token is a capability, and THE RESPONSE SHAPE IS THE SECURITY BOUNDARY. Not a
// filter applied late, not a `delete payload.x` — the shape is built field by named
// field and nothing is ever spread in from a row. Concretely, and asserted by the
// bench as ABSENT FROM THE RESPONSE rather than merely unselected:
//   · NO vendor financials      — no amount / amount_received / amount_pending /
//                                 direction. The engine hop selects `id, client` and
//                                 NOTHING ELSE (engine.records also carries phone :347
//                                 and four money cells :343/:358/:359 — a select('*')
//                                 here would put a client's phone number and the
//                                 wedding's money on a public URL).
//   · NO other members' data    — every read is keyed to THIS member's id.
//   · NO lead/client data beyond the function title — and, CE ruling F7:
//         `note` IS `crew_confirmations.note` ONLY — the crew member's OWN words.
//         `public.events.notes` NEVER LEAVES THE VENDOR PLANE. It is the shared
//         note trail: CE-57's ×3 anomaly lines ("recce for the Malhotra sangeet")
//         lived in exactly that column, and it also carries the assignment trail.
//         It is not selected anywhere in this file. Grep it: it is not here.
//   · No member id, no phone, no daily_rate_inr, no member notes, no vendor_id.
//
// ── THE READ GATE IS LOAD-BEARING (CE ruling F5, from CE-48/Ruling №2) ───────
// `events.assigned_member_ids` is the SOURCE OF TRUTH for a member being on a
// function; `crew_confirmations` carries only the RESPONSE (0087:69-71). Rows are
// NOT pruned on unassign — so a stale confirmations row can outlive the assignment.
// Therefore the gate runs on BOTH sides: an unassigned member cannot SEE the
// function, and an unassigned member's POST is REFUSED. Never one without the other.
//
// ── PLANE + WITNESSES (SQL-provenance law: every column names its source) ────
// PUBLIC (`req.app.locals.supabase`):
//   · team_members  — 0087 §B for `page_token` (+ its unique index :52); the rest
//                     PUBLIC_SCHEMA.md:732-746. Note that doc predates 0087 and shows
//                     11 columns: the migration file is the settling witness for the
//                     token, per the SQL-provenance law's own staleness clause.
//   · events        — 16 cols, PUBLIC_SCHEMA.md:390-408. `assigned_member_ids` is
//                     0087 §A (same post-snapshot witness).
//   · team_tasks    — 13 cols, PUBLIC_SCHEMA.md:778-792.
//   · crew_confirmations — 0087 §D (status CHECK ∈ pending|confirmed|declined :80;
//                     unique(event_id, member_id) :83). NOT a Postgres enum — a CHECK.
//   · vendors       — `business_name` only (PUBLIC_SCHEMA.md col 3).
//   · users         — `auth_user_id` only, for the read-only agent chain below.
// ENGINE (`.schema('engine')`, read-only, ONE title hop — bands.js:145's class):
//   · users :340 · agents · records `id, client` (ENGINE_SCHEMA.md:339-362).
//
// ── FAIL POSTURE (day.js/bands.js's ruled shape, restated because it binds) ──
// The ASSIGNMENTS read is the spine: a failed events read is a failed request (500),
// never a silently empty board — "a failed read says nothing" (F-04.21's family).
// The DECORATIONS — wedding titles, confirmation rings, tasks — fail SOFT to
// null/[] with a console.warn. A function with no wedding title renders without one;
// that is disclosed blindness, not a lie.
//
// ── WHAT THIS FILE IS NOT ───────────────────────────────────────────────────
// It is not a calendar writer: it never touches eventWrite, occupancy or public.events
// (a single events write here would be a STOP). Its only writes are to
// `crew_confirmations` — the confirm door's own table — and a `state`/`completed_at`
// transition on `team_tasks` copied byte-for-byte from the vendor door's own shape
// (studio/tasks.js:88). It mints no second vocabulary: "open" is the vendor door's
// predicate (CE ruling F4), asked rather than re-decided.
//
// ── BLOCK 05 WIRE POINT, NAMED AND NOT BUILT (spec §P3:67, W-1) ─────────────
// The templated WhatsApp auto-send fires on `crew_confirmations` INSERT. That is the
// webhook block's, never this sitting's. No engine, soul, prompt or voice file is
// touched here.
//
// ── THE DECLINE WHISPER: DEFERRED, NAMED, NOT SILENT (CE ruling F3) ─────────
// Spec §P3:65 also routes declines to a snapshot whisper. That home is
// `src/api/vendor-engine/chat.js::fetchCalendarSnapshot`, which IS engine context
// assembly — reported at read-first, and the chair CHARTERED-PARKED it as its own
// small sitting behind a W-1 ruling. THIS sitting closes the ring half only: the
// decline lands in `crew_confirmations` and CalendarBands.tsx:92 renders terracotta.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../lib/asyncHandler');
const { ok: okRes } = require('../lib/response');

// uuid_generate_v4() shape — 0087 §B. Rejecting a malformed token before any query
// keeps garbage off the DB and makes the per-IP bucket the only cost of a scan.
const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The vendor door's own predicate for "open", adopted whole (CE ruling F4). Two
// independent witnesses agree and neither is re-decided here:
//   · studio/tasks.js:37 — the vendor list's default is exactly these two states.
//   · PUBLIC_SCHEMA.md:2499 — the DB's own partial index
//     team_tasks_vendor_open_idx WHERE state = ANY (ARRAY['open','in_progress'])
//                                  AND deleted_at IS NULL
const OPEN_TASK_STATES = ['open', 'in_progress'];

// 0087 §D:80's CHECK list, minus 'pending' — a member can confirm or decline; only
// the assignment write may create the pending state (P1.5's upsert).
const RESPONDABLE = ['confirmed', 'declined'];

// ══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING (CE ruling F1(b) — hand-rolled, in-memory, zero dependencies)
//
// ⚠ DISCLOSED IN THE FILE'S OWN COMMENT BY CE RULING: this ceiling is PER PROCESS.
// Railway can run more than one instance of this service, and each would hold its
// own buckets — so the effective global ceiling is (limit × instances), and a
// restart forgets every bucket. At the estate's present scale (three test accounts,
// no real vendors in production) that is priced and accepted. It is a filed gap the
// day this door carries real crews: the durable shape is a DB-backed counter on
// src/lib/imageThrottle.js's pattern, which needs a table and therefore a migration —
// out of scope this sitting by the same ruling (SQL scope is ZERO).
//
// Budgets CE-RULED, not chosen here:
//   GET  60 / 10 min / token
//   POST 20 / 10 min / token
//   unresolved-token lookups 30 / 10 min / IP   ← the only brute-force surface
// `app.set('trust proxy', true)` (src/index.js:55) means req.ip is the real client.
// ══════════════════════════════════════════════════════════════════════════════
const WINDOW_MS      = 10 * 60 * 1000;
const LIMIT_GET      = 60;
const LIMIT_POST     = 20;
const LIMIT_IP_MISS  = 30;
const SWEEP_AT       = 5000;   // prune only when the map has actually grown

const buckets = new Map();     // key -> { count, resetAt }

function hit(key, limit, now = Date.now()) {
  if (buckets.size > SWEEP_AT) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) { b = { count: 0, resetAt: now + WINDOW_MS }; buckets.set(key, b); }
  b.count += 1;
  return { allowed: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}

/** Test seam: the bench drives the real limiter rather than re-implementing it. */
function _resetBuckets() { buckets.clear(); }

// ══════════════════════════════════════════════════════════════════════════════
// THE ONE FAILURE SHAPE (CE ruling F2(b))
//
// 404, information-free, and NEVER-EXISTED ≡ ROTATED byte-identically. A body that
// said "this link was rotated" would confirm the token once existed; a body naming
// the vendor would leak past the capability. The client owns every user-facing word
// (all sixteen crew-page strings live on the page, where the founder's veto lives) —
// this door ships a machine code and nothing else.
//
// DOCTRINE BOUNDARY, CE-recorded for the estate: invite.js:10-13's "200 + valid:false"
// stands for SHORT ENUMERABLE codes, which is its committed threat model. A
// uuid_generate_v4 token is 122 bits, where enumeration is not the threat, and 404 is
// the honest HTTP shape for a resource that is not there. Two doctrines, both named,
// neither universal.
// ══════════════════════════════════════════════════════════════════════════════
function dead(res) { return res.status(404).json({ ok: false, code: 'not_found' }); }
function limited(res, retryAfter) {
  res.set('Retry-After', String(retryAfter));
  return res.status(429).json({ ok: false, code: 'rate_limited' });
}

/**
 * Token -> { member, vendor } | null. Read-only, two PUBLIC reads, no writes.
 *
 * The member must be live (active, not soft-deleted) — deactivating a member kills
 * their page as surely as rotating the token, and it must do so with the SAME dead
 * shape rather than a distinguishable one.
 */
async function resolveToken(supabase, token) {
  const { data: member, error } = await supabase
    .from('team_members')
    .select('id, vendor_id, name, active, deleted_at')
    .eq('page_token', token)
    .maybeSingle();
  if (error) { const e = new Error(error.message); e.__crewSpine = true; throw e; }
  if (!member || member.active !== true || member.deleted_at != null) return null;

  const { data: vendor, error: vErr } = await supabase
    .from('vendors')
    .select('id, user_id, business_name')
    .eq('id', member.vendor_id)
    .maybeSingle();
  if (vErr) { const e = new Error(vErr.message); e.__crewSpine = true; throw e; }
  if (!vendor) return null;

  return { member, vendor };
}

/**
 * The vendor's engine agent, READ-ONLY.
 *
 * ⚠ This deliberately does NOT call middleware/agentBridge.js::resolveAgentForVendor.
 * That function is a GET-OR-CREATE: it upserts engine.users, inserts engine.agents and
 * inserts agent_owner (:27-71). A public, unauthenticated door must never be able to
 * mint engine identities, and it has no authUserId to give it anyway. So the chain is
 * walked read-only and every hop fails soft to null — no agent, no wedding titles,
 * and the board still renders.
 *
 *   vendors.user_id -> public.users.auth_user_id -> engine.users.id
 *                   -> engine.agents.user_id -> agents.id
 */
async function resolveAgentIdReadOnly(supabase, vendor) {
  try {
    if (!vendor.user_id) return null;
    const { data: pu } = await supabase
      .from('users').select('auth_user_id').eq('id', vendor.user_id).maybeSingle();
    if (!pu || !pu.auth_user_id) return null;

    const eng = supabase.schema('engine');
    const { data: eu } = await eng
      .from('users').select('id').eq('auth_user_id', pu.auth_user_id).maybeSingle();
    if (!eu) return null;

    const { data: ag } = await eng
      .from('agents').select('id').eq('user_id', eu.id).maybeSingle();
    return ag ? ag.id : null;
  } catch (e) {
    console.warn('[GET /crew] agent resolve failed (soft):', e.message);
    return null;
  }
}

/** IST today, YYYY-MM-DD. */
function istToday(now = Date.now()) {
  // The estate holds two inline conventions and no shared home to ask: chat.js:1102
  // (this work's nearest sibling) uses bare UTC; vendorInbound.js:93 uses the IST
  // offset. IST is chosen HERE and the divergence is disclosed rather than silent:
  // the crew are in India reading this on a phone, and a UTC "today" would, between
  // 00:00 and 05:30 IST, still be showing yesterday's date as upcoming.
  return new Date(now + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * The member's board. Exported so the bench drives the REAL builder rather than a
 * re-implementation (protocol §9: a bench asserts reality only if its calls are
 * producible by a real caller). The route below is its ONLY caller.
 */
async function buildCrewPage({ supabase, member, vendor, today }) {
  const from = today || istToday();

  // ── THE SPINE — this member's own upcoming functions ─────────────────────
  // The covenant, read side, every events read: deleted_at IS NULL + not cancelled.
  // `contains` is the GIN-indexed containment test 0087 §A's index exists to serve.
  // NOTE the select list: no `notes`, no `linked_lead_id`. See THE CAPABILITY LAW.
  const { data: rows, error } = await supabase
    .from('events')
    .select('id, title, slot, event_date, event_time, linked_binder_id, assigned_member_ids')
    .eq('vendor_id', member.vendor_id)
    .contains('assigned_member_ids', [member.id])
    .gte('event_date', from)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .order('event_date', { ascending: true })
    .limit(200);
  if (error) { const e = new Error(error.message); e.__crewSpine = true; throw e; }

  // Belt AND braces on the gate. `contains` is the DB's answer; this re-asserts it in
  // JS so that a harness, a driver change or a future query edit cannot quietly widen
  // the boundary. The gate is the security property — it does not get to be implicit.
  const events = (rows || []).filter(
    (e) => Array.isArray(e.assigned_member_ids) && e.assigned_member_ids.includes(member.id),
  );
  const eventIds = events.map((e) => e.id);

  // ── DECORATION 1 — this member's confirmation state ──────────────────────
  const statusByEvent = new Map();
  const noteByEvent   = new Map();
  if (eventIds.length) {
    try {
      const { data: conf, error: cErr } = await supabase
        .from('crew_confirmations')
        .select('event_id, status, note')
        .eq('member_id', member.id)          // never another member's row
        .in('event_id', eventIds);
      if (cErr) throw cErr;
      for (const c of (conf || [])) {
        statusByEvent.set(c.event_id, c.status);
        noteByEvent.set(c.event_id, c.note);
      }
    } catch (e) {
      console.warn('[GET /crew] confirmations read failed (soft):', e.message);
    }
  }

  // ── DECORATION 2 — the wedding title, ONE enumerated engine hop ──────────
  // `id, client` and NOTHING ELSE. This select list is an acceptance criterion.
  const binderIds = [...new Set(events.map((e) => e.linked_binder_id).filter(Boolean))];
  const titleByBinder = new Map();
  if (binderIds.length) {
    const agentId = await resolveAgentIdReadOnly(supabase, vendor);
    if (agentId) {
      try {
        const { data: recs, error: rErr } = await supabase.schema('engine')
          .from('records')
          .select('id, client')
          .eq('agent_id', agentId)
          .in('id', binderIds);
        if (rErr) throw rErr;
        for (const r of (recs || [])) if (r.client) titleByBinder.set(r.id, r.client);
      } catch (e) {
        console.warn('[GET /crew] binder hop failed (soft):', e.message);
      }
    }
  }

  // ── DECORATION 3 — this member's open tasks (CE ruling F4, verbatim) ─────
  let tasks = [];
  try {
    const { data: td, error: tErr } = await supabase
      .from('team_tasks')
      .select('id, title, description, due_date, priority')
      .eq('vendor_id', member.vendor_id)
      .eq('assigned_to_member_id', member.id)
      .in('state', OPEN_TASK_STATES)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .limit(100);
    if (tErr) throw tErr;
    tasks = (td || []).map((t) => ({
      task_id:     t.id,
      title:       t.title,
      // DISCLOSED AND BOUNCEABLE (P2 §4.2's precedent — flagged, never buried):
      // `description` ships. The F7 reasoning does not reach it — a team_tasks row
      // exists BY CONSTRUCTION to be handed to `assigned_to_member_id`, and its
      // description shares an author with its title, which the spec puts on the page.
      // No client prose has ever been observed landing there. If the chair reads the
      // boundary tighter, this is one field to delete and one bench line to flip.
      description: t.description || null,
      due_date:    t.due_date || null,
      priority:    t.priority || null,
    }));
  } catch (e) {
    console.warn('[GET /crew] tasks read failed (soft):', e.message);
    tasks = [];
  }

  // ── SHAPE — built field by named field; no row is ever spread in ─────────
  return {
    member: { name: member.name },
    vendor: { name: vendor.business_name || null },
    assignments: events.map((e) => ({
      event_id:     e.id,
      date:         e.event_date,
      slot:         e.slot || null,          // the WORD is the client's: slotWords.ts (F8(d))
      title:        e.title,
      wedding:      e.linked_binder_id ? (titleByBinder.get(e.linked_binder_id) || null) : null,
      call_time:    e.event_time || null,
      confirmation: statusByEvent.get(e.id) || 'pending',
      note:         noteByEvent.get(e.id) || null,   // crew_confirmations.note ONLY — F7
    })),
    tasks,
  };
}

/**
 * Confirm or decline one assignment. CE ruling F5, whole:
 *   · last write wins — declined -> confirmed is allowed, and so is the reverse.
 *     A member who declines and then frees up should be able to say so, and the
 *     vendor should watch the ring flip. 0087:71-72's on-conflict-do-nothing protects
 *     a confirmation from being reset BY THE MACHINE on re-assignment; it says
 *     nothing about the member's own change of mind, and is not stretched to.
 *   · `updated_at` moves — set EXPLICITLY. 0087 §D declares the column with a
 *     default but creates no trigger, so an UPDATE would not otherwise bump it.
 *   · THE READ GATE APPLIES TO THE WRITE. An unassigned member's POST is refused
 *     with the SAME dead shape as a dead token: the door does not confirm that an
 *     event exists to someone who has no capability over it.
 */
async function confirmAssignment({ supabase, member, event_id, status, note }) {
  if (!RESPONDABLE.includes(status)) return { ok: false, reason: 'bad_status' };

  const { data: ev, error } = await supabase
    .from('events')
    .select('id, assigned_member_ids')
    .eq('id', event_id)
    .eq('vendor_id', member.vendor_id)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .maybeSingle();
  if (error) { const e = new Error(error.message); e.__crewSpine = true; throw e; }
  if (!ev) return { ok: false, reason: 'not_found' };
  if (!Array.isArray(ev.assigned_member_ids) || !ev.assigned_member_ids.includes(member.id)) {
    return { ok: false, reason: 'not_found' };
  }

  const trimmed = typeof note === 'string' ? note.trim().slice(0, 500) : null;
  const { error: wErr } = await supabase
    .from('crew_confirmations')
    .upsert(
      {
        event_id,
        member_id:  member.id,
        status,
        note:       trimmed || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,member_id' },   // 0087:83's unique key
    );
  if (wErr) { const e = new Error(wErr.message); e.__crewSpine = true; throw e; }

  return { ok: true, status, note: trimmed || null };
}

/**
 * Mark one task done. The state transition is the vendor door's own, copied rather
 * than invented: studio/tasks.js:88 sets state='done' + completed_at at the same
 * moment. The gate is the same load-bearing one — the task must be assigned to THIS
 * member and still open, or the door is dead to them.
 */
async function completeTask({ supabase, member, task_id }) {
  const { data: rows, error } = await supabase
    .from('team_tasks')
    .update({ state: 'done', completed_at: new Date().toISOString() })
    .eq('id', task_id)
    .eq('vendor_id', member.vendor_id)
    .eq('assigned_to_member_id', member.id)
    .in('state', OPEN_TASK_STATES)
    .is('deleted_at', null)
    .select('id');
  if (error) { const e = new Error(error.message); e.__crewSpine = true; throw e; }
  if (!rows || !rows.length) return { ok: false, reason: 'not_found' };
  return { ok: true, task_id };
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Shared front door: shape-check the token, spend the per-IP budget only on a MISS,
 * then the per-token budget. Ordering matters — a valid crew member must not be able
 * to exhaust the anti-enumeration bucket by using their own page normally.
 */
function gate(kind) {
  return asyncHandler(async (req, res, next) => {
    const token = String(req.params.token || '');
    if (!TOKEN_RE.test(token)) {
      const ip = hit(`ip:${req.ip}`, LIMIT_IP_MISS);
      if (!ip.allowed) return limited(res, ip.retryAfter);
      return dead(res);
    }

    let resolved;
    try {
      resolved = await resolveToken(req.app.locals.supabase, token);
    } catch (e) {
      console.error('[crew] token lookup failed:', e.message);
      return res.status(500).json({ ok: false, code: 'lookup_failed' });
    }

    if (!resolved) {
      const ip = hit(`ip:${req.ip}`, LIMIT_IP_MISS);
      if (!ip.allowed) return limited(res, ip.retryAfter);
      return dead(res);
    }

    const budget = hit(`t:${token}:${kind}`, kind === 'get' ? LIMIT_GET : LIMIT_POST);
    if (!budget.allowed) return limited(res, budget.retryAfter);

    req.crew = resolved;
    return next();
  });
}

router.get('/:token', gate('get'), asyncHandler(async (req, res) => {
  try {
    const payload = await buildCrewPage({
      supabase: req.app.locals.supabase,
      member:   req.crew.member,
      vendor:   req.crew.vendor,
      today:    istToday(),
    });
    return okRes(res, payload);
  } catch (e) {
    if (e && e.__crewSpine) {
      console.error('[GET /crew] assignments read failed:', e.message);
      return res.status(500).json({ ok: false, code: 'lookup_failed' });
    }
    throw e;
  }
}));

router.post('/:token/confirm', express.json(), gate('post'), asyncHandler(async (req, res) => {
  const { event_id, status, note } = req.body || {};
  if (!event_id || !TOKEN_RE.test(String(event_id))) return dead(res);
  try {
    const r = await confirmAssignment({
      supabase: req.app.locals.supabase,
      member:   req.crew.member,
      event_id: String(event_id),
      status:   String(status || ''),
      note,
    });
    if (!r.ok) {
      // bad_status is the caller's fault and says nothing about the estate;
      // not_found rides the one dead shape.
      if (r.reason === 'bad_status') return res.status(400).json({ ok: false, code: 'bad_status' });
      return dead(res);
    }
    return okRes(res, { status: r.status, note: r.note });
  } catch (e) {
    if (e && e.__crewSpine) {
      console.error('[POST /crew/confirm] write failed:', e.message);
      return res.status(500).json({ ok: false, code: 'lookup_failed' });
    }
    throw e;
  }
}));

router.post('/:token/task', express.json(), gate('post'), asyncHandler(async (req, res) => {
  const { task_id, done } = req.body || {};
  if (done !== true) return res.status(400).json({ ok: false, code: 'bad_request' });
  if (!task_id || !TOKEN_RE.test(String(task_id))) return dead(res);
  try {
    const r = await completeTask({
      supabase: req.app.locals.supabase,
      member:   req.crew.member,
      task_id:  String(task_id),
    });
    if (!r.ok) return dead(res);
    return okRes(res, { task_id: r.task_id });
  } catch (e) {
    if (e && e.__crewSpine) {
      console.error('[POST /crew/task] write failed:', e.message);
      return res.status(500).json({ ok: false, code: 'lookup_failed' });
    }
    throw e;
  }
}));

module.exports = router;
module.exports.buildCrewPage    = buildCrewPage;
module.exports.confirmAssignment = confirmAssignment;
module.exports.completeTask     = completeTask;
module.exports.resolveToken     = resolveToken;
module.exports.istToday         = istToday;
module.exports.hit              = hit;
module.exports._resetBuckets    = _resetBuckets;
module.exports.OPEN_TASK_STATES = OPEN_TASK_STATES;
module.exports.LIMIT_GET        = LIMIT_GET;
module.exports.LIMIT_POST       = LIMIT_POST;
module.exports.LIMIT_IP_MISS    = LIMIT_IP_MISS;
