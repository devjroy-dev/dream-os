// src/api/vendor/bands.js
// GET /api/v2/vendor/bands/:vendorId?from=YYYY-MM-DD&to=YYYY-MM-DD
// TDW_04.5 · P2 — THE WEDDING-BAND VIEW's one round trip (spec §P2, CE-ruled F1–F7).
//
// Spec §P2 verbatim: "one round trip" returning `{ ok, bands: [...], loose: [...] }`,
// grouping = `linked_binder_id`, "binder title/money from the cabinet loader (read-only,
// per its cardinal law)".
//
// ── WHAT THIS FILE IS NOT ────────────────────────────────────────────────────
// It is NOT a writer. It is NOT a second money rule. It is NOT a second occupancy
// vocabulary. Each of those three is somebody else's one home and this file asks
// rather than re-decides:
//   · `isOccupying` (src/lib/vendor/occupancy.js:115, OCCUPYING_KINDS :103) decides
//     what a "function" is for the GAP flag. The three kinds are NOT re-listed here.
//   · The MONEY RULE is NOT applied here at all — CE ruling F2(b). This endpoint
//     ships the four RAW WITNESSED CELLS and the band view applies the estate's
//     CANON, `dreamos-pwa/lib/vendor/derive.ts::pendingOf` (F-04.13, CE-ratified
//     2026-07-15). Zero new derivation, zero third copy of the rule, and no sealed
//     money surface touched. `cabinet.js:103` stays the backend's only mirror.
//   · `normaliseCategory` (src/lib/vendor/categoryFraming.js:110) decides who is a
//     planner — the same call the staffing-gap line makes at
//     src/api/vendor-engine/chat.js:1202. The predicate keeps its ONE home and the
//     client obeys the answer (CE ruling F1(c)).
//
// ── PLANE (SQL-provenance law: every column below names its witness) ─────────
// PUBLIC (`req.app.locals.supabase`, the public-default client):
//   · events                — 16 cols, docs/db/PUBLIC_SCHEMA.md; `assigned_member_ids`
//                             is 0087 §A (post-dating the 2026-07-16 snapshot — its
//                             witness is db/migrations/0087_crew_assignment.sql plus
//                             the founder's PRESENT×4 information_schema run, CE-48).
//   · team_members          — 11 cols, PUBLIC_SCHEMA.md:732-746 (id, vendor_id, name,
//                             role, active, deleted_at used below).
//   · crew_confirmations    — 0087 §D (event_id, member_id, status ∈ pending|confirmed|
//                             declined). Same post-snapshot witness as above.
// ENGINE (`.schema('engine')`, ONE enumerated hop — day.js:155's exact class):
//   · records               — 21 cols, docs/db/ENGINE_SCHEMA.md:341-362. Read here:
//                             id, client (the band title) and the FOUR money cells
//                             amount (:344) · direction (:340 as col 6) ·
//                             amount_received (:359) · amount_pending (:360).
//
// ── FAIL POSTURE (day.js's ruled shape, restated because it binds here too) ──
// The CALENDAR half is the spine: a failed events read is a failed request (500),
// never a silently empty board. The DECORATION halves — binder titles, the money
// cells, crew names, confirmation rings — fail SOFT to null/[] with a console.warn.
// A band whose engine hop failed renders as "Untitled wedding" with NO money whisper,
// which is ST-2's disclosed blindness, not a lie. Absent-honesty is the CE's ruled
// boundary on the whisper specifically: no cells => no whisper, NEVER ₹0.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const asyncHandler   = require('../../lib/asyncHandler');
const { resolveAgentForVendor } = require('../middleware/agentBridge');
const { isOccupying }     = require('../../lib/vendor/occupancy');
const { normaliseCategory } = require('../../lib/vendor/categoryFraming');
const { binderRecordsByIds, titleOfRecord } = require('../../lib/vendor/binderTitles');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The grid reads month±1 (page.tsx:101-107) — roughly 92 days, a handful of rows per
// day at worst. The cap exists so a pathological span cannot page the whole table into
// memory; it is STATED on the wire rather than inherited silently (events.js:78's
// HARD_CAP is 200 over a 400-day horizon and its truncation is invisible until you read
// `truncated`). If this ever fires on a real window it is a finding, not a shrug.
const BAND_CAP = 400;

/**
 * The band board for one vendor over one window.
 *
 * Exported so the bench drives the REAL builder rather than a re-implementation
 * (protocol §9: "a bench asserts reality only if its calls are producible by a real
 * caller"). The route below is its ONLY caller and passes straight through — there is
 * no second code path to drift.
 *
 * @param {object}  args
 * @param {object}  args.supabase  the public-default client
 * @param {object}  args.vendor    the resolved vendor row (id, category)
 * @param {string}  args.from      inclusive ISO date
 * @param {string}  args.to        inclusive ISO date
 * @param {?string} args.agentId   engine agent, or null => the engine hop is skipped
 */
async function buildBands({ supabase, vendor, from, to, agentId }) {
  // ── THE SPINE ────────────────────────────────────────────────────────────
  // The covenant, read side, every events read: deleted_at IS NULL + not cancelled.
  // Blocks are excluded by the same law page.tsx:145 states for the grid — "a block is
  // not an engagement" (F-04.36). A held day is not a wedding function.
  const { data: rows, error } = await supabase
    .from('events')
    .select('id, title, kind, slot, event_date, event_time, state, linked_binder_id, assigned_member_ids')
    .eq('vendor_id', vendor.id)
    .gte('event_date', from)
    .lte('event_date', to)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .neq('kind', 'blocked')
    .order('event_date', { ascending: true })
    .limit(BAND_CAP);
  if (error) {
    const e = new Error(error.message);
    e.__bandsSpine = true;
    throw e;
  }

  const events = rows || [];

  // ── DECORATION 1 — the crew (names + rings) ──────────────────────────────
  // Two PUBLIC reads keyed on the ids the events themselves carry. A member who was
  // assigned and has since been deleted/deactivated simply does not resolve: their
  // circle is absent rather than invented (the assignment row is not rewritten — that
  // would be a write, and this endpoint does not write).
  const memberIds = [...new Set(events.flatMap((e) => (Array.isArray(e.assigned_member_ids) ? e.assigned_member_ids : [])))];
  const eventIds  = events.map((e) => e.id);
  const memberById = new Map();
  const confirmByPair = new Map();   // `${event_id}:${member_id}` -> status
  if (memberIds.length) {
    try {
      const [{ data: mem, error: memErr }, { data: conf, error: confErr }] = await Promise.all([
        supabase.from('team_members')
          .select('id, name, role, active, deleted_at')
          .eq('vendor_id', vendor.id)
          .in('id', memberIds),
        supabase.from('crew_confirmations')
          .select('event_id, member_id, status')
          .in('event_id', eventIds),
      ]);
      if (memErr || confErr) throw (memErr || confErr);
      for (const m of (mem || [])) {
        if (m.deleted_at != null) continue;
        memberById.set(m.id, m);
      }
      for (const c of (conf || [])) confirmByPair.set(`${c.event_id}:${c.member_id}`, c.status);
    } catch (e) {
      console.warn('[GET /vendor/bands] crew read failed (soft):', e.message);
    }
  }

  // ── DECORATION 2 — the binder (title + the FOUR raw money cells) ─────────
  // ONE enumerated engine hop, resolved in-handler and never as blocking middleware
  // (day.js:145's precedent, cited in its own comment): the board must not fail
  // because an engine agent didn't resolve.
  const binderIds = [...new Set(events.map((e) => e.linked_binder_id).filter(Boolean))];
  // P5 (CE ruling, Fork D1): the hop MOVED to src/lib/vendor/binderTitles.js so
  // the payments plane's `By wedding` grouping asks the same question of the same
  // organ. Pure move — same query, same columns, same soft-fail. This endpoint's
  // behaviour is unchanged and b0450 stays 46.
  const binderById = await binderRecordsByIds(supabase, {
    agentId, binderIds, label: '[GET /vendor/bands]',
  });

  // ── SHAPE ────────────────────────────────────────────────────────────────
  const fnOf = (ev) => {
    const ids = Array.isArray(ev.assigned_member_ids) ? ev.assigned_member_ids : [];
    const crew = ids
      .map((id) => {
        const m = memberById.get(id);
        if (!m) return null;
        return {
          member_id:    m.id,
          name:         m.name,
          initials:     initialsOf(m.name),
          role:         m.role || null,
          // The ring vocabulary, DB-sourced: 0087 §D's three states, verbatim. An
          // assignment with no confirmations row reads 'pending' — which is exactly
          // what P1.5's upsert writes at assign time, so absence and 'pending' agree.
          confirmation: confirmByPair.get(`${ev.id}:${m.id}`) || 'pending',
          external:     (m.role || '') === 'external_vendor',   // P4's bridge row; false for all crew today
        };
      })
      .filter(Boolean);
    return {
      event_id:   ev.id,
      date:       ev.event_date,
      slot:       ev.slot,
      kind:       ev.kind,
      title:      ev.title,
      event_time: ev.event_time,
      crew,
      // Spec §P2: "gap = occupying && crew empty". `isOccupying` is asked, never
      // re-listed — occupancy.js is that predicate's one home.
      gap: isOccupying(ev.kind) && crew.length === 0,
    };
  };

  const grouped = new Map();
  const loose   = [];
  for (const ev of events) {
    if (!ev.linked_binder_id) { loose.push(fnOf(ev)); continue; }
    const g = grouped.get(ev.linked_binder_id) || [];
    g.push(ev);
    grouped.set(ev.linked_binder_id, g);
  }

  const bands = [];
  for (const [binderId, evs] of grouped) {
    const rec   = binderById.get(binderId) || null;
    const dates = evs.map((e) => e.event_date).sort();
    bands.push({
      binder_id: binderId,
      // Null title => the client renders "Untitled wedding" (the vetoed string lives
      // on the client with its siblings; the wire stays honest about absence).
      title: titleOfRecord(rec),
      span: { start: dates[0], end: dates[dates.length - 1] },
      // THE FOUR RAW CELLS, CE ruling F2(b). Not a money story — the cells the canon
      // eats. `null` here means the hop failed or the binder holds nothing; either way
      // the client elides the whisper rather than printing a zero.
      money: rec
        ? {
            amount:          rec.amount,
            direction:       rec.direction,
            amount_received: rec.amount_received,
            amount_pending:  rec.amount_pending,
          }
        : null,
      functions: evs.map(fnOf),
    });
  }
  // Bands sort by when the wedding starts; loose functions by their own date.
  bands.sort((a, b) => (a.span.start < b.span.start ? -1 : a.span.start > b.span.start ? 1 : 0));
  loose.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    bands,
    loose,
    // CE ruling F1(c) + the §1 field: the predicate's one home answers, and it ships
    // the category it answered FROM so the founder's smoke step 1 is self-witnessing
    // (the executor could not derive the account's category by command — no DB reach —
    // and the payload closes that gap without a pre-read).
    default_view: normaliseCategory(vendor.category) === 'planning' ? 'weddings' : 'month',
    category: vendor.category || null,
    truncated: events.length >= BAND_CAP,
  };
}

/** "Swati Rao" -> "SR" · "Swati" -> "S" · "" -> "?" (never an empty circle). */
function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const from = String(req.query.from || '').trim();
  const to   = String(req.query.to   || '').trim();
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return res.status(400).json({ ok: false, error: 'from and to must be in YYYY-MM-DD format.' });
  }
  if (from > to) {
    return res.status(400).json({ ok: false, error: 'from must not be after to.' });
  }

  let agentId = null;
  try {
    const uid = req.auth && req.auth.user_id;
    if (uid) ({ agentId } = await resolveAgentForVendor(req.app.locals.supabase, req.vendor, uid));
  } catch (e) {
    console.warn('[GET /vendor/bands] agent resolve failed (soft):', e.message);
  }

  try {
    const payload = await buildBands({
      supabase: req.app.locals.supabase,
      vendor:   req.vendor,
      from, to, agentId,
    });
    return res.json({ ok: true, ...payload });
  } catch (e) {
    if (e && e.__bandsSpine) {
      console.error('[GET /vendor/bands] events read failed:', e.message);
      return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    }
    throw e;
  }
}));

module.exports = router;
module.exports.buildBands = buildBands;
module.exports.initialsOf = initialsOf;
module.exports.BAND_CAP   = BAND_CAP;
