// src/lib/capabilities.js — THE SWITCHBOARD'S ONE READER. CE-41 seat C, R-41.8.
//
// ═══ WHY THIS FILE EXISTS ═════════════════════════════════════════════════════
// Until CE-41 every gated feature in Business Solutions was a Railway env
// variable (eight `*_SEND_ENABLED` / `WEDDING_REEL_ENABLED` names, nine read
// sites) or a code push. The founder may be without a shell or GitHub for a
// stretch. After this file every gate is a ROW he reads and flips from the admin
// panel on his phone: the sweep (`src/capabilitiesSweep.js`) moves a row up to
// `armed` when Meta or Google says yes; his one tap moves `armed → on`; a plane
// he has already walked may carry `auto_on` and go straight to `on`.
//
// ═══ THE PLANE (roadmap §4, R-41.36) ═════════════════════════════════════════
// `public.capabilities` — key PK · kind (template|permission|scope|flag) ·
// status (pending|approved|rejected|paused|armed|on|off) · evidence · checked_at ·
// flipped_at · flipped_by · auto_on · walk_ref · updated_at.
//
// ═══ ONE HOME, TWO WRITERS ═══════════════════════════════════════════════════
// This module is the ONLY reader of the table (R-40.94's one-home law; no second
// cache anywhere). It carries both writers so their rules sit beside each other:
//   • `recordSweep(key, ...)`   — the sweep's hand: may set any status ≤ `armed`
//     (`pending|approved|rejected|paused|armed`). It never writes `on`/`off`
//     EXCEPT the two ruled cases: R-41.35 (a REJECTED/PAUSED/DISABLED template
//     disarms the flag that guards its arm — `on → off`) and `auto_on` (an
//     `approved` reading on a row whose `auto_on` is true AND whose `walk_ref`
//     is set goes straight to `on`, fork iii).
//   • `flip(key, 'on'|'off', by)` — the admin door's hand: `armed|on|off → on|off`.
//     It refuses to turn on a row that has never been armed or approved.
//
// ═══ FAILS CLOSED, LIKE laneFlags.js ═════════════════════════════════════════
// An absent row, an unreachable database, an unknown status: `on()` answers
// false. The cost of a false OFF is a delayed send; the cost of a false ON is a
// message reaching a real handset nobody decided to send. Not symmetric.
//
// 60-second in-process cache (the estate's window, `laneFlags.js`/`modelRouter.js`),
// busted by the admin door so a tap lands before the next request, not the next
// minute.
//
// ═══ THE CONTRACT SEAT A WROTE AGAINST (R-41.20), KEPT ═══════════════════════
//   on(key: string): boolean — SYNCHRONOUS, never throws, false for unknown keys.
// `src/lib/couple/assistance.js:384` reads `capFn(KEY) === true`; an async `on()`
// would hand it a Promise and the arm could never wake. So `on()` reads the
// in-process cache, which `bind(supabase)` warms with one `list()` at boot and
// re-warms every CACHE_MS; every writer in this file busts and re-warms it. Before
// the first warm — or with no client bound — `on()` is false: fail closed.
// The async reads (`get`, `list`, `refresh`) exist for the sweep and the doors.
'use strict';

const CACHE_MS = 60_000;
const TABLE = 'capabilities';
const COLS = 'key, kind, status, evidence, checked_at, flipped_at, flipped_by, auto_on, walk_ref, updated_at';

const KINDS = Object.freeze(['template', 'permission', 'scope', 'flag']);
const STATUSES = Object.freeze(['pending', 'approved', 'rejected', 'paused', 'armed', 'on', 'off']);
/** The sweep may write these and nothing above them (roadmap §4: "the sweep for status ≤ armed"). */
const SWEEP_STATUSES = Object.freeze(['pending', 'approved', 'rejected', 'paused', 'armed']);

let _client = null;           // set once at boot by `bind(supabase)`; tests pass their own
const _cache = new Map();     // key -> { at, row }   (per-key async reads)
let _listAt = 0;
let _listRows = null;
const _live = new Map();      // key -> row            (the SYNC table `on()` reads; warmed by list())
let _warmTimer = null;

/**
 * Bind the client at boot and warm the sync table. Returns the warm promise so a
 * caller that wants to wait may; production does not. The timer is unref'd so it
 * never keeps a process alive.
 */
function bind(supabase) {
  _client = supabase;
  if (_warmTimer) { clearInterval(_warmTimer); _warmTimer = null; }
  const warm = () => refresh().catch((e) => console.warn(`[capabilities] warm: ${e && e.message}`));
  _warmTimer = setInterval(warm, CACHE_MS);
  if (typeof _warmTimer.unref === 'function') _warmTimer.unref();
  return warm();
}

/** Re-read every row into the sync table. The writers call this after each write. */
async function refresh(opts = {}) {
  const rows = await list({ ...opts, fresh: true });
  _live.clear();
  for (const r of rows) _live.set(r.key, r);
  return rows;
}

/** Test seam: prime the sync table without a client. The bench double's `switchboard()`. */
function _prime(rows) { _live.clear(); for (const r of rows || []) _live.set(r.key, r); }
function client(explicit) {
  const c = explicit || _client;
  if (!c) throw new Error('capabilities: no supabase client bound (call bind(supabase) at boot)');
  return c;
}

function _bust(key) {
  if (key) _cache.delete(key); else _cache.clear();
  _listRows = null; _listAt = 0;
}
/** Test seam only — the estate's `_resetLaneFlagCache` precedent. */
function _resetCapabilitiesCache() { _bust(); _live.clear(); }

/** The flag-key grammar (§4, R-41.43): `flag.<name>` for the ex-env gates. */
function isValidKey(key) {
  return typeof key === 'string' && /^(template|perm|scope|flag)\.[a-z0-9_.]+$/.test(key);
}

/**
 * Read one row, cached for 60s. Returns the row or null. Never throws on a
 * DB error — logs once and returns null, so `on()` fails closed.
 */
let _unboundWarned = false;
async function get(key, opts = {}) {
  // FAIL CLOSED BEFORE BIND. A door asked before boot bound the client (or a
  // bench that never binds) gets `null` → `on()` is false. Throwing here would
  // turn a shut gate into a 500 at the door, which is the louder and worse failure.
  const sb = opts.supabase || _client;
  if (!sb) {
    if (!_unboundWarned) { _unboundWarned = true; console.warn('[capabilities] no client bound — every gate reads shut until bind(supabase) runs at boot'); }
    return null;
  }
  const now = Date.now();
  const hit = _cache.get(key);
  if (hit && now - hit.at < CACHE_MS && !opts.fresh) return hit.row;
  try {
    const { data, error } = await sb.from(TABLE).select(COLS).eq('key', key).maybeSingle();
    if (error) { console.warn(`[capabilities] read ${key}: ${error.message}`); return hit ? hit.row : null; }
    const row = data || null;
    _cache.set(key, { at: now, row });
    return row;
  } catch (e) {
    console.warn(`[capabilities] read ${key}: ${e && e.message}`);
    return hit ? hit.row : null;
  }
}

/**
 * THE READ AT THE DOOR — synchronous, from the warmed table. `true` only when the
 * row is present and its status is exactly `on`. Never throws.
 */
function on(key) {
  const row = _live.get(key);
  return !!row && row.status === 'on';
}

/**
 * Why a door is shut, in one sentence a log or a handover can quote. Mirrors the
 * shape every `sendGate()` returned before C1 (`reason: '<NAME> is not set'`), so
 * the walk can still say which gate refused. Synchronous, same table as `on()`.
 */
function reason(key) {
  const row = _live.get(key);
  if (!row) return `${key} has no row on the switchboard`;
  if (row.status === 'on') return null;
  return `${key} is ${row.status} on the switchboard`;
}

/** Every row, ordered by kind then key. Cached 60s. */
async function list(opts = {}) {
  const sb = client(opts.supabase);
  const now = Date.now();
  if (_listRows && now - _listAt < CACHE_MS && !opts.fresh) return _listRows;
  const { data, error } = await sb.from(TABLE).select(COLS).order('kind', { ascending: true }).order('key', { ascending: true });
  if (error) throw new Error(`capabilities list: ${error.message}`);
  _listRows = data || []; _listAt = now;
  return _listRows;
}

// ── WRITER 1 · THE SWEEP ────────────────────────────────────────────────────
/**
 * Record a sweep reading on `key`. `status` must be one of SWEEP_STATUSES.
 * Rules, in order, each named so the bench can assert it:
 *  (a) `on`/`off` rows are not overwritten by `approved`/`pending` — the founder's
 *      hand outranks a re-read of the same fact. `checked_at`/`evidence` still move.
 *  (b) R-41.35/.36: `rejected`/`paused` on a row that is `on` → the row goes `off`
 *      and `disarmed: true` is returned so the sweep tells the founder. On an
 *      `armed` row it becomes the reading itself.
 *  (c) fork iii: `approved` on a row with `auto_on = true` AND `walk_ref` set
 *      (and the row is not already on/off) → `on`, `flipped_by = 'sweep:auto_on'`.
 *  (d) otherwise the reading is written as given.
 * Returns { key, before, after, disarmed, auto_flipped }.
 */
async function recordSweep(key, { status, evidence }, opts = {}) {
  if (!SWEEP_STATUSES.includes(status)) throw new Error(`capabilities recordSweep: status "${status}" is above the sweep's hand`);
  const sb = client(opts.supabase);
  const row = await get(key, { supabase: sb, fresh: true });
  if (!row) throw new Error(`capabilities recordSweep: no row for ${key}`);
  const nowIso = new Date().toISOString();
  const patch = { evidence: evidence == null ? row.evidence : String(evidence), checked_at: nowIso, updated_at: nowIso };
  let after = row.status;
  let disarmed = false, auto_flipped = false;

  if (status === 'rejected' || status === 'paused') {
    if (row.status === 'on') { after = 'off'; disarmed = true; patch.flipped_at = nowIso; patch.flipped_by = `sweep:${status}`; }
    else if (row.status !== 'off') after = status;
  } else if (row.status === 'on' || row.status === 'off') {
    // (a) a founder-set state is not undone by a re-read
  } else if (status === 'approved' && row.auto_on === true && row.walk_ref) {
    after = 'on'; auto_flipped = true; patch.flipped_at = nowIso; patch.flipped_by = 'sweep:auto_on';
  } else {
    after = status;
  }
  patch.status = after;
  const { error } = await sb.from(TABLE).update(patch).eq('key', key);
  if (error) throw new Error(`capabilities recordSweep ${key}: ${error.message}`);
  _bust(key); await refresh({ supabase: sb });
  return { key, before: row.status, after, disarmed, auto_flipped };
}

/**
 * A failed probe (Graph down, token expired) moves `checked_at` and `evidence`
 * and NEVER the status — the card shows the founder what the sweep saw.
 */
async function touch(key, { evidence }, opts = {}) {
  const sb = client(opts.supabase);
  const nowIso = new Date().toISOString();
  const { error } = await sb.from(TABLE).update({ evidence: String(evidence || ''), checked_at: nowIso, updated_at: nowIso }).eq('key', key);
  if (error) throw new Error(`capabilities touch ${key}: ${error.message}`);
  _bust(key); await refresh({ supabase: sb });
}

// ── WRITER 2 · THE ADMIN DOOR ───────────────────────────────────────────────
/**
 * The founder's tap. `to` is `on` or `off`. Turning ON requires the row to be
 * `armed`, `approved`, `on` or `off` (never `pending`/`rejected`/`paused` — a
 * plane Meta has not said yes to cannot be switched on from the glass; R-40.127:
 * approval never substitutes for the walk, and the walk never for approval).
 * `by` is the admin session's identity, recorded as `flipped_by`.
 */
async function flip(key, to, by, opts = {}) {
  if (to !== 'on' && to !== 'off') throw new Error(`capabilities flip: "${to}" is not on|off`);
  const sb = client(opts.supabase);
  const row = await get(key, { supabase: sb, fresh: true });
  if (!row) return { ok: false, reason: 'no_row', key };
  if (to === 'on' && !['armed', 'approved', 'on', 'off'].includes(row.status)) {
    return { ok: false, reason: `cannot_turn_on_from_${row.status}`, key, status: row.status };
  }
  const nowIso = new Date().toISOString();
  const { error } = await sb.from(TABLE)
    .update({ status: to, flipped_at: nowIso, flipped_by: String(by || 'admin'), updated_at: nowIso })
    .eq('key', key);
  if (error) throw new Error(`capabilities flip ${key}: ${error.message}`);
  _bust(key); await refresh({ supabase: sb });
  return { ok: true, key, before: row.status, after: to };
}

/**
 * Pre-authorise the sweep to flip straight to `on` (fork iii, chair leans yes,
 * ruled: `auto_on` requires `walk_ref`, the seal hash of the walk that licenses
 * it). Setting `auto_on = true` with no `walk_ref` is refused.
 */
async function setAutoOn(key, { auto_on, walk_ref }, by, opts = {}) {
  const sb = client(opts.supabase);
  const row = await get(key, { supabase: sb, fresh: true });
  if (!row) return { ok: false, reason: 'no_row', key };
  const wantOn = auto_on === true;
  const ref = walk_ref == null ? row.walk_ref : String(walk_ref).trim();
  if (wantOn && !ref) return { ok: false, reason: 'auto_on_requires_walk_ref', key };
  const nowIso = new Date().toISOString();
  const { error } = await sb.from(TABLE)
    .update({ auto_on: wantOn, walk_ref: ref || null, flipped_by: String(by || 'admin'), updated_at: nowIso })
    .eq('key', key);
  if (error) throw new Error(`capabilities setAutoOn ${key}: ${error.message}`);
  _bust(key); await refresh({ supabase: sb });
  return { ok: true, key, auto_on: wantOn, walk_ref: ref || null };
}

/**
 * Every key a reader in this tree names — seat A's constant kept byte-for-byte
 * (R-41.20) and the nine doors' keys beside it, so grep finds every reader.
 */
const CAPABILITY_KEYS = Object.freeze({
  TDW_ASSIST_LEAD_OUTSIDE: 'template.tdw_assist_lead_outside',   // Block 20 s1, forwardAssistanceItem (dark)
  CONTRACT_SIGN_SEND:      'flag.contract_sign_send',
  CONTRACT_COPY_SEND:      'flag.contract_copy_send',
  PAYMENT_REMINDER_SEND:   'flag.payment_reminder_send',
  REFERRAL_ALERT_SEND:     'flag.referral_alert_send',
  WEDDING_CREDIT_SEND:     'flag.wedding_credit_send',
  WEDDING_CONSENT_SEND:    'flag.wedding_consent_send',
  REVIEW_ASK_SEND:         'flag.review_ask_send',
  WEDDING_REEL:            'flag.wedding_reel',
});

module.exports = {
  bind, refresh, on, get, reason, list, recordSweep, touch, flip, setAutoOn,
  isValidKey, KINDS, STATUSES, SWEEP_STATUSES, TABLE, CACHE_MS, CAPABILITY_KEYS,
  IS_STUB: false,               // seat A's stub said true; the register is real now
  _resetCapabilitiesCache, _prime,
};
