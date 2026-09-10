// src/lib/vendor/sundayBrief.js — G4.1 · THE SUNDAY BRIEF. CE-42 seat R6, packet 4b-3b.
//
// THE ONE WRITER of public.instagram_briefs (0165) and the one reader the door
// and the job share. Governed by the 4b-3b read-first rulings (2026-09-10):
//   store (a)   one row per vendor-week, UNIQUE (vendor_id, week_start) plain;
//               the upsert REPLACES an error row with the next live one.
//   window (b)  Monday 00:00 → Saturday 23:59:59 IST through istDayWindowUtc;
//               the label stays the calendar week (Monday–Sunday), so the
//               pwa's weekLine reads "7–13 September" as the frames were vetoed.
//   Check again (b)  generate NOW for this vendor, throttled 10 minutes on the
//               latest row's generated_at.
//   S9          a week-old brief reads `stale` BY COMPARISON AT THE DOOR — the
//               current week's Monday against the row's — never by a job.
//   S1          the door reads cap.on(PERM_INSIGHTS) FIRST and answers
//               `pending` before any row is touched: cap off → no network.
//
// EVERY STATE THE SHELL DRAWS IS A CODE THIS FILE ANSWERS (lib/worklist/sunday.ts
// SundayState, dreamos-pwa 948176dc):
//   pending      the plane is off on the Switchboard
//   notconnected no vendor_ig_connections row that finished a connect        } three codes,
//   connect      a row, but insights_granted_at is null (she connected for photos) } one button,
//   expired      refreshDecision says expired — H11's state                       } three sentences
//   error        the latest row is status='error' (its reason stays server-side)
//   stale        the latest live row is not this week's
//   empty        this week's row saw zero media posted in the window
//   live         this week's row, tiles from the payload; under-100 and the
//                arrows are PAYLOAD shapes (new_followers null · prev null),
//                not codes — that is how the shell already reads them.
//   share        is the glass's own state (the tap); the door hands the card URL.
//
// THE PAYLOAD IS THE ACCEPTED SHAPE, byte for byte the pwa's `Brief` type:
//   { week_start, week_end, generated_at, reach:{value,prev}, new_followers:{value,prev}|null,
//     saves:{value,prev}, shares:{value,prev}, best_post:{media_id,photo_url,saves,shares,permalink}|null,
//     best_time:null, follower_count }  plus `media_count` (this file's own, the `empty` witness).
// Meta's wire names differ in one place — media `saved` → stored `saves` — mapped
// in igOAuth.fetchMediaInsights so this file never spells the wire.
//
// THE SECRETS LAW: no token reaches a row, a log line or a reason. A failure's
// `reason` is igOAuth's metaRefusal sentence (status + Meta's code) or one of
// the named codes below.
//
// DECLARED, NOT CURED (the handover carries both):
//   · Meta's insights data "may be delayed up to 48 hours" (reference) — a
//     Sunday 07:00 read of Friday/Saturday can under-count; the row says when it read.
//   · best_post.photo_url is Meta's CDN address as listed; its lifetime is Meta's,
//     not the estate's (F-42.178 filed at the cut).
'use strict';

const cap      = require('../capabilities');
const igOAuth  = require('./igOAuth');
const igConn   = require('./igConnection');
const { istTodayISO, istDayWindowUtc } = require('./istClock');

const TABLE = 'instagram_briefs';
const REFRESH_THROTTLE_MS = 10 * 60 * 1000;   // ruled: Check again, 10 min on generated_at
const STALE_AFTER_MS      = 7 * 24 * 60 * 60 * 1000;
// One media-insights call per post in the window. A vendor who posts more than
// this in a week has her best post chosen among the newest MEDIA_INSIGHTS_CAP;
// the row records `media_truncated` so the ceiling is a readable fact.
const MEDIA_INSIGHTS_CAP  = 20;

const PERM = cap.CAPABILITY_KEYS.PERM_INSIGHTS;

// ── THE WEEK ──────────────────────────────────────────────────────────────────
function addDaysISO(dateISO, days) {
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
/** Monday=0 … Sunday=6 for an ISO date (the IST calendar week starts Monday). */
function dowMonday0(dateISO) {
  return (new Date(`${dateISO}T00:00:00Z`).getUTCDay() + 6) % 7;
}
/**
 * The calendar week containing `now` (IST), and the READ window ruled (b):
 * since = Monday 00:00 IST, until = Saturday 23:59:59 IST, both as Unix seconds
 * (the reference's since/until). `until` may lie in the future on a mid-week
 * "Check again"; Meta returns what exists.
 */
function weekFor(now = Date.now()) {
  const today = istTodayISO(now);
  const weekStart = addDaysISO(today, -dowMonday0(today));
  const weekEnd   = addDaysISO(weekStart, 6);
  const saturday  = addDaysISO(weekStart, 5);
  const since = Math.floor(Date.parse(istDayWindowUtc(weekStart).start) / 1000);
  const until = Math.floor(Date.parse(istDayWindowUtc(saturday).end) / 1000) - 1;   // 23:59:59 IST Saturday
  return { week_start: weekStart, week_end: weekEnd, since, until };
}

// ── THE ROWS ──────────────────────────────────────────────────────────────────
async function latestRow(supabase, vendorId) {
  const { data, error } = await supabase.from(TABLE)
    .select('id, vendor_id, week_start, week_end, status, payload, reason, generated_at')
    .eq('vendor_id', vendorId).order('generated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data || null };
}
async function rowForWeek(supabase, vendorId, weekStart) {
  const { data, error } = await supabase.from(TABLE)
    .select('id, vendor_id, week_start, week_end, status, payload, reason, generated_at')
    .eq('vendor_id', vendorId).eq('week_start', weekStart).maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data || null };
}
/** The upsert on (vendor_id, week_start) — an error row is replaced, a live row re-generated. */
async function writeRow(supabase, row) {
  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'vendor_id,week_start' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── THE READS ─────────────────────────────────────────────────────────────────
function metric(value, prev) {
  return { value: value == null ? 0 : value, prev: prev == null ? null : prev };
}

/**
 * Generate this week's brief for one vendor and write its row. The caller has
 * already read cap.on — this function is reachable only from the door (after
 * S1) and the job (after its own cap read). Returns { ok:true, row } or
 * { ok:false, code } for the three connection codes; a Meta refusal WRITES an
 * error row and returns { ok:true, row } — the door reads it as S8.
 */
async function generateForVendor(supabase, vendorId, deps = {}) {
  const now = deps.now || Date.now();
  const week = weekFor(now);
  const t = await igConn.tokenForCall(supabase, vendorId);
  if (!t.ok) {
    if (t.error === 'not_connected') return { ok: false, code: 'notconnected' };
    if (t.error === 'expired')       return { ok: false, code: 'expired' };
    return { ok: false, code: 'error', reason: t.error };
  }
  if (!t.insightsGrantedAt) return { ok: false, code: 'connect' };

  const generatedAt = new Date(now).toISOString();
  const fail = async (reason) => {
    const row = { vendor_id: vendorId, week_start: week.week_start, week_end: week.week_end, status: 'error', payload: null, reason: String(reason), generated_at: generatedAt };
    const w = await writeRow(supabase, row);
    if (!w.ok) return { ok: false, code: 'error', reason: w.error };
    return { ok: true, row };
  };

  // Last week's row is `prev` — the store's own reason for existing (fork (a)).
  const prevRes = await rowForWeek(supabase, vendorId, addDaysISO(week.week_start, -7));
  const prev = prevRes.ok && prevRes.row && prevRes.row.status === 'live' && prevRes.row.payload ? prevRes.row.payload : null;
  const prevOf = (k) => (prev && prev[k] && Number.isFinite(Number(prev[k].value)) ? Number(prev[k].value) : null);

  const acct = await igOAuth.fetchAccountInsights(t.accessToken, t.igUserId, { since: week.since, until: week.until });
  if (!acct.ok) return fail(acct.error);
  const m = acct.metrics || {};

  const list = await igOAuth.listInstagramMedia(t.accessToken);
  if (!list.ok) return fail(list.error);
  const sinceMs = week.since * 1000, untilMs = (week.until + 1) * 1000;
  const inWeek = list.items.filter((it) => {
    const ts = it.timestamp ? Date.parse(it.timestamp) : NaN;
    return Number.isFinite(ts) && ts >= sinceMs && ts < untilMs;
  });
  const candidates = inWeek.slice(0, MEDIA_INSIGHTS_CAP);
  let best = null;
  for (const it of candidates) {
    const mi = await igOAuth.fetchMediaInsights(t.accessToken, it.id);
    if (!mi.ok) return fail(mi.error);
    const score = (mi.saves || 0) + (mi.shares || 0);
    if (!best || score > best.score) best = { score, media_id: it.id, photo_url: it.source_url || null, saves: mi.saves || 0, shares: mi.shares || 0, permalink: it.permalink || null };
  }

  // The count is a caption, not a gate: a refusal here lands as null.
  const fc = await igOAuth.fetchFollowersCount(t.accessToken);
  const followerCount = fc.ok ? fc.followers_count : null;

  const payload = {
    week_start: week.week_start, week_end: week.week_end, generated_at: generatedAt,
    reach:  metric(m.reach, prevOf('reach')),
    // Meta withholds follows_and_unfollows under 100 followers → null, the shell's S3.
    new_followers: m.follows_and_unfollows == null ? null : metric(m.follows_and_unfollows, prevOf('new_followers')),
    saves:  metric(m.saves, prevOf('saves')),
    shares: metric(m.shares, prevOf('shares')),
    best_post: best ? { media_id: best.media_id, photo_url: best.photo_url, saves: best.saves, shares: best.shares, permalink: best.permalink } : null,
    best_time: null,
    follower_count: followerCount,
    media_count: inWeek.length,
    media_truncated: inWeek.length > MEDIA_INSIGHTS_CAP || list.truncated === true,
  };
  const row = { vendor_id: vendorId, week_start: week.week_start, week_end: week.week_end, status: 'live', payload, reason: null, generated_at: generatedAt };
  const w = await writeRow(supabase, row);
  if (!w.ok) return { ok: false, code: 'error', reason: w.error };
  return { ok: true, row };
}

// ── THE DOOR'S ARITHMETIC ─────────────────────────────────────────────────────
function stateOfRow(row, week, now) {
  if (!row) return null;
  if (row.status === 'error') return 'error';
  const age = now - Date.parse(row.generated_at);
  if (row.week_start !== week.week_start || !(age < STALE_AFTER_MS)) return 'stale';
  if (row.payload && Number(row.payload.media_count) === 0) return 'empty';
  return 'live';
}

/** The public shape: the accepted `Brief`, nothing of the row's own. */
function briefOf(row) {
  if (!row || !row.payload) return null;
  const p = row.payload;
  return {
    week_start: p.week_start, week_end: p.week_end, generated_at: p.generated_at,
    reach: p.reach, new_followers: p.new_followers, saves: p.saves, shares: p.shares,
    best_post: p.best_post, best_time: null, follower_count: p.follower_count == null ? null : p.follower_count,
  };
}

/**
 * What the door answers. `opts.generate` (Check again, or a first read with no
 * row) runs generateForVendor first, throttled on the latest row. Returns
 * { state, brief, share_card_url } — never a token, never a reason.
 */
async function readForDoor(supabase, vendor, opts = {}, deps = {}) {
  const now = deps.now || Date.now();
  const capMod = deps.cap || cap;
  if (!capMod.on(PERM)) return { state: 'pending', brief: null, share_card_url: null };

  const c = await igConn.getConnection(supabase, vendor.id);
  if (!c.ok) return { state: 'error', brief: null, share_card_url: null };
  const conn = c.connection;
  const connected = Boolean(conn && conn.ig_user_id && conn.token_expires_at);
  if (!connected) return { state: 'notconnected', brief: null, share_card_url: null };
  if (igOAuth.refreshDecision({ expiresAt: conn.token_expires_at, connectedAt: conn.connected_at, now }) === 'expired') {
    return { state: 'expired', brief: null, share_card_url: null };
  }
  if (!conn.insights_granted_at) return { state: 'connect', brief: null, share_card_url: null };

  const week = weekFor(now);
  let latest = await latestRow(supabase, vendor.id);
  if (!latest.ok) return { state: 'error', brief: null, share_card_url: null };

  const wantGenerate = opts.generate === true || !latest.row;
  if (wantGenerate) {
    const recent = latest.row && (now - Date.parse(latest.row.generated_at)) < REFRESH_THROTTLE_MS;
    if (!recent) {
      const g = await generateForVendor(supabase, vendor.id, { now });
      if (!g.ok) return { state: g.code, brief: null, share_card_url: null };
      latest = { ok: true, row: g.row };
    }
  }

  const state = stateOfRow(latest.row, week, now) || 'error';
  const brief = state === 'error' ? null : briefOf(latest.row);
  let shareUrl = null;
  if (brief && (state === 'live' || state === 'stale') && deps.shareCard) {
    try { shareUrl = await deps.shareCard(supabase, vendor, brief); } catch (e) { shareUrl = null; console.warn('[sunday] share card not built:', e && e.message); }
  }
  return { state, brief, share_card_url: shareUrl };
}

// ── THE JOB — Sunday 07:00 IST (src/cron.js) ──────────────────────────────────
/**
 * One brief per vendor-week. Reads the Switchboard FIRST: with the plane off
 * nothing is read from Meta for anyone (R-41.35's disarm respected without a
 * guard entry). Failures per vendor land as error rows; the job never throws
 * past one vendor.
 */
async function runSundayJob(supabase, deps = {}) {
  const capMod = deps.cap || cap;
  if (!capMod.on(PERM)) return { ok: true, skipped: true, reason: capMod.reason(PERM), written: 0, errors: 0 };
  const l = await igConn.listInsightsConnections(supabase);
  if (!l.ok) return { ok: false, error: l.error, written: 0, errors: 0 };
  let written = 0, errors = 0, refused = 0;
  for (const conn of l.connections) {
    try {
      const g = await generateForVendor(supabase, conn.vendor_id, { now: deps.now });
      if (!g.ok) { refused += 1; continue; }
      if (g.row.status === 'live') written += 1; else errors += 1;
    } catch (e) {
      errors += 1;
      console.warn('[sunday] brief failed for vendor', conn.vendor_id, e && e.message);
    }
  }
  return { ok: true, skipped: false, vendors: l.connections.length, written, errors, refused };
}

module.exports = {
  TABLE, PERM, REFRESH_THROTTLE_MS, STALE_AFTER_MS, MEDIA_INSIGHTS_CAP,
  weekFor, addDaysISO,
  generateForVendor, readForDoor, runSundayJob,
  stateOfRow, briefOf, latestRow, rowForWeek,
};
