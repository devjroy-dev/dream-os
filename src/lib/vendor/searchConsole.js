// src/lib/vendor/searchConsole.js
// TDW · BLOCK 19 · G3.1 sitting 2 — THE SEARCH CONSOLE PULL, AND THE REPORT.
//
// TWO HALVES, DELIBERATELY SEPARATE:
//   `pull()`   — talks to Google, writes 0147's daily and query rows. Runs on a
//                schedule or on the room's Sync tap; needs the vendor's grant.
//   `report()` — reads those rows and answers the room. NEVER calls Google. So
//                the room is fast, works offline from Google, and shows the
//                same numbers to every seat that asks on the same day.
//
// THE REPORT IS TWO NAMED WINDOWS (R-40.123): `last_28` and `prior_28`, each a
// SUM over search_console_daily — never a stored total. `queries` is the top
// five by impressions for the latest window_end. `has_data` is the room's
// F-40.138 guard: connected-but-empty is a STATE with its own sentence, not a
// zero that reads as broken.
//
// F-40.261 RULED (a) — TWO ARMS, ONE FUNCTION:
//   /v/<handle>   — read through the HOUSE row (vendor_id NULL: the founder's
//                   grant, owner of sc-domain:thedreamwedding.in) with
//                   `page contains /v/<handle>`. Every vendor, one grant.
//   own domain    — read through HER row and her `sc_property` (P2; she
//                   verified it herself with siteverification).
// `pull()` tries the house arm first; if the house row is absent it returns
// `{ ok:false, reason:'no_house' }` and writes nothing. Rows land under HER
// vendor_id either way — the report never knows which arm fed it.

'use strict';

const gOAuth = require('./googleOAuth');
const gConn  = require('./googleConnection');

const SC_API = 'https://searchconsole.googleapis.com/webmasters/v3/sites';
const WINDOW_DAYS = 28;
const QUERY_ROWS  = 5;

function isoDay(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; }

/**
 * Pull the last 2×28 days (Search Console lags ~3 days; the report's windows
 * end at the newest day present, not at "today"). Writes:
 *   search_console_daily   — 0147 §2, upsert onConflict (vendor_id, day) [PK]
 *   search_console_queries — 0147 §3, upsert onConflict (vendor_id, window_end, query) [PK]
 */
async function pull(supabase, vendorId, { handle, arm = 'house' } = {}) {
  // Which grant, which property, which page filter.
  let grantOwner, property, pageFilter;
  if (arm === 'house') {
    const h = await gConn.getStatus(supabase, gConn.HOUSE);
    if (!h.ok) return h;
    if (!h.row) return { ok: false, reason: 'no_house' };
    if (!handle) return { ok: false, reason: 'no_handle' };
    grantOwner = gConn.HOUSE; property = gOAuth.HOUSE_SC_PROPERTY; pageFilter = `/v/${String(handle).toLowerCase()}`;
  } else {
    const st = await gConn.getStatus(supabase, vendorId);
    if (!st.ok) return st;
    if (!st.row) return { ok: false, reason: 'not_connected' };
    if (!st.row.sc_property) return { ok: false, reason: 'no_property' };
    grantOwner = vendorId; property = st.row.sc_property; pageFilter = null;
  }

  const tok = await gConn.openRefreshToken(supabase, grantOwner);
  if (!tok.ok) return { ok: false, reason: 'token', error: tok.error };
  const acc = await gOAuth.refreshAccess(tok.refreshToken);
  if (!acc.ok) return { ok: false, reason: 'refresh', error: acc.error };

  const endDate = daysAgo(3), startDate = daysAgo(3 + 2 * WINDOW_DAYS);
  const site = encodeURIComponent(property);
  const body = (dims) => ({
    startDate: isoDay(startDate), endDate: isoDay(endDate), dimensions: dims, rowLimit: dims[0] === 'query' ? 50 : 100,
    ...(pageFilter ? { dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: pageFilter }] }] } : {}),
  });
  const ask = async (dims) => {
    const res = await fetch(`${SC_API}/${site}/searchAnalytics/query`, {
      method: 'POST', headers: { Authorization: `Bearer ${acc.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body(dims)),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: `Search Console refused (${res.status}).` };
    return { ok: true, rows: (j && j.rows) || [] };
  };

  const daily = await ask(['date']);
  if (!daily.ok) return { ok: false, reason: 'api', error: daily.error };
  const queries = await ask(['query']);
  if (!queries.ok) return { ok: false, reason: 'api', error: queries.error };

  const now = new Date().toISOString();
  if (daily.rows.length) {
    // 0147 §2 — PK (vendor_id, day); CHECK impressions >= 0, clicks >= 0 (Google never sends negatives; Math.max keeps the CHECK unreachable).
    const rows = daily.rows.map((r) => ({ vendor_id: vendorId, day: r.keys[0], impressions: Math.max(0, Math.round(r.impressions || 0)), clicks: Math.max(0, Math.round(r.clicks || 0)), pulled_at: now }));
    const { error } = await supabase.from('search_console_daily').upsert(rows, { onConflict: 'vendor_id,day' });
    if (error) return { ok: false, reason: 'write', error: error.message };
  }
  if (queries.rows.length) {
    // 0147 §3 — PK (vendor_id, window_end, query); same CHECKs. window_end = the pull's end day.
    const rows = queries.rows.map((r) => ({ vendor_id: vendorId, window_end: isoDay(endDate), query: String(r.keys[0]).slice(0, 200), impressions: Math.max(0, Math.round(r.impressions || 0)), clicks: Math.max(0, Math.round(r.clicks || 0)), pulled_at: now }));
    const { error } = await supabase.from('search_console_queries').upsert(rows, { onConflict: 'vendor_id,window_end,query' });
    if (error) return { ok: false, reason: 'write', error: error.message };
  }
  await gConn.markSynced(supabase, grantOwner);
  return { ok: true, arm, days: daily.rows.length, queries: queries.rows.length };
}

/** Pure: the two windows from a list of { day, impressions, clicks }. Exported for the bench. */
function windows(rows) {
  if (!rows.length) return { has_data: false, last_28: null, prior_28: null, window_end: null };
  const days = rows.map((r) => r.day).sort();
  const end = new Date(days[days.length - 1] + 'T00:00:00Z');
  const cut1 = new Date(end); cut1.setUTCDate(cut1.getUTCDate() - (WINDOW_DAYS - 1));
  const cut2 = new Date(cut1); cut2.setUTCDate(cut2.getUTCDate() - WINDOW_DAYS);
  const sum = (from, to) => rows.reduce((a, r) => {
    const d = new Date(r.day + 'T00:00:00Z');
    return d >= from && d <= to ? { impressions: a.impressions + (r.impressions || 0), clicks: a.clicks + (r.clicks || 0) } : a;
  }, { impressions: 0, clicks: 0 });
  const prev1 = new Date(cut1); prev1.setUTCDate(prev1.getUTCDate() - 1);
  return { has_data: true, window_end: isoDay(end), last_28: sum(cut1, end), prior_28: sum(cut2, prev1) };
}

/** What the room reads. Reads 0147 §2/§3 only; never Google. */
async function report(supabase, vendorId) {
  const { data: daily, error: e1 } = await supabase.from('search_console_daily')
    .select('day, impressions, clicks').eq('vendor_id', vendorId).order('day', { ascending: false }).limit(2 * WINDOW_DAYS + 7);
  if (e1) return { ok: false, error: e1.message };
  const w = windows(daily || []);
  let queries = [];
  if (w.has_data) {
    const { data: q, error: e2 } = await supabase.from('search_console_queries')
      .select('window_end, query, impressions, clicks').eq('vendor_id', vendorId)
      .order('window_end', { ascending: false }).order('impressions', { ascending: false }).limit(60);
    if (e2) return { ok: false, error: e2.message };
    const latest = q && q.length ? q[0].window_end : null;
    queries = (q || []).filter((r) => r.window_end === latest).slice(0, QUERY_ROWS).map((r) => ({ query: r.query, impressions: r.impressions, clicks: r.clicks }));
  }
  return { ok: true, ...w, queries };
}

module.exports = { pull, report, windows, WINDOW_DAYS, QUERY_ROWS };
