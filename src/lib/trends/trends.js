'use strict';
// src/lib/trends/trends.js · CE-47 · PRO · P3 · THE TREND ROOM, the reads and writes (the store is passed in).
// makeWeek(): Monday 01:10 am India time (cron.js), the briefs for the week that just ended are counted and saved as
// drafts. An admin approves or withholds each one before 9:00 am (admin More > Trend briefs). A vendor sees an approved
// brief for her trade and city from Monday 9:00 am India time. A brief already approved or withheld is never rewritten.
const B = require('./build');
const { tradeKey } = require('../brands/rules');

const BRIEF_COLS = 'id, trade, city, week_start, counts, news, state, decided_by, decided_at, made_at';
const PAGE = 1000, MAX_ROWS = 50000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const no = (status, error) => ({ ok: false, status, error });

/** Count one week and save its drafts. Returns { ok, made, kept } (kept: briefs already decided, left as they are). */
async function makeWeek({ supabase, weekStart }) {
  const w = B.weekBounds(weekStart);
  const leads = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const r = await supabase.from('leads').select('vendor_id, wedding_date, budget_min, budget_max, raw_message, vendor_summary, event_types')
      .gte('created_at', w.from).lt('created_at', w.to).is('deleted_at', null).order('created_at', { ascending: true }).range(from, from + PAGE - 1);
    if (r.error) return no(500, 'leads');
    leads.push(...(r.data || []));
    if (!r.data || r.data.length < PAGE) break;
  }
  const ids = [...new Set(leads.map((l) => l.vendor_id))];
  const vendors = {};
  for (let i = 0; i < ids.length; i += 500) {
    const v = await supabase.from('vendors').select('id, category, city, status').in('id', ids.slice(i, i + 500));
    if (v.error) return no(500, 'vendors');
    for (const x of (v.data || [])) if (x.status === 'active') vendors[x.id] = { category: x.category, city: x.city };
  }
  const briefs = B.build({ leads, vendors });
  let made = 0, kept = 0;
  for (const b of briefs) {
    const ex = await supabase.from('pro_trend_briefs').select('id, state').eq('trade', b.trade).eq('city', b.city).eq('week_start', weekStart).maybeSingle();
    if (ex.error) return no(500, 'pro_trend_briefs');
    if (ex.data && ex.data.state !== 'draft') { kept += 1; continue; }
    const row = { trade: b.trade, city: b.city, week_start: weekStart, counts: b.counts, made_at: new Date().toISOString() };
    const r = ex.data ? await supabase.from('pro_trend_briefs').update(row).eq('id', ex.data.id) : await supabase.from('pro_trend_briefs').insert({ ...row, state: 'draft' });
    if (r.error) return no(500, 'pro_trend_briefs');
    made += 1;
  }
  return { ok: true, made, kept, groups: briefs.length };
}

const shown = (b, now) => b.state === 'approved' && Date.parse(B.weekBounds(b.week_start).showFrom) <= now;
function view(b) {
  return { id: b.id, week_start: b.week_start, head: B.HEAD(b), lines: B.lines(b), note: B.NOTE,
    news: (Array.isArray(b.news) ? b.news : []).map((n) => ({ line: n.line, source_url: n.source_url })) };
}

/** The Trend room: the newest brief she may see, and the weeks before it. */
async function room({ supabase, vendor, now = Date.now() }) {
  const trade = tradeKey(vendor.category); const city = B.cityKey(vendor.city);
  if (city.length < 2) return { ok: true, room: { brief: null, past: [], made_line: B.MADE_LINE, empty: 'Add your city in Settings. TDW then shows the brief for your trade in your city.' } };
  const r = await supabase.from('pro_trend_briefs').select(BRIEF_COLS).eq('trade', trade).eq('city', city).eq('state', 'approved').order('week_start', { ascending: false }).limit(12);
  if (r.error) return no(500, 'TDW could not read the Trend room just now. Please try again.');
  const list = (r.data || []).filter((b) => shown(b, now));
  return { ok: true, room: {
    brief: list[0] ? view(list[0]) : null,
    past: list.slice(1, 9).map((b) => ({ id: b.id, week_start: b.week_start, title: `Week of ${require('../brands/rules').fullDate(b.week_start)}` })),
    made_line: B.MADE_LINE,
    empty: list.length ? null : 'There is no brief for your trade in your city yet. A brief is made only when enough clients asked in a week, so that no one can be picked out.',
  } };
}
/** One past week's brief, only her own trade and city. */
async function week({ supabase, vendor, briefId, now = Date.now() }) {
  if (!UUID.test(String(briefId))) return no(404, 'That brief is not available.');
  const r = await supabase.from('pro_trend_briefs').select(BRIEF_COLS).eq('id', briefId).maybeSingle();
  if (r.error) return no(500, 'TDW could not read this brief just now. Please try again.');
  const b = r.data;
  if (!b || b.trade !== tradeKey(vendor.category) || b.city !== B.cityKey(vendor.city) || !shown(b, now)) return no(404, 'That brief is not available.');
  return { ok: true, brief: view(b) };
}

// ── admin: More > Trend briefs ───────────────────────────────────────────────────────────────────────────────────
function checkNews(list) {
  const arr = Array.isArray(list) ? list : [];
  if (arr.length > 3) return { ok: false, error: 'Add up to three news lines.' };
  const out = [];
  for (const n of arr) {
    const line = String((n || {}).line || '').trim().replace(/\s+/g, ' ');
    const src = String((n || {}).source_url || '').trim();
    if (!line && !src) continue;
    if (line.length < 10 || line.length > 200) return { ok: false, error: 'Write each news line as one sentence of 10 to 200 letters.' };
    if (!/[.!?]$/.test(line)) return { ok: false, error: 'End each news line with a full stop.' };
    try { if (new URL(src).protocol !== 'https:') throw new Error('x'); } catch (_e) { return { ok: false, error: 'Add the full https address of the news source for each line.' }; }
    out.push({ line, source_url: src });
  }
  return { ok: true, news: out };
}
async function adminList({ supabase, weekStart }) {
  let q = supabase.from('pro_trend_briefs').select(BRIEF_COLS).order('week_start', { ascending: false }).order('trade').order('city').limit(200);
  if (weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) q = q.eq('week_start', weekStart);
  const r = await q;
  if (r.error) return no(500, 'TDW could not read the briefs.');
  return { ok: true, briefs: (r.data || []).map((b) => ({ ...b, head: B.HEAD(b), lines: B.lines(b), note: B.NOTE, shows_from: B.weekBounds(b.week_start).showFrom })) };
}
async function adminDecide({ supabase, id, body, who }) {
  if (!UUID.test(String(id))) return no(404, 'TDW has no such brief.');
  const to = String((body || {}).state || '');
  if (!['approved', 'withheld', 'draft'].includes(to)) return no(400, 'Choose Approve, Withhold or Back to draft.');
  const n = checkNews((body || {}).news); if (!n.ok) return no(400, n.error);
  const patch = { state: to, news: n.news, decided_by: to === 'draft' ? null : (who || 'admin'), decided_at: to === 'draft' ? null : new Date().toISOString() };
  const r = await supabase.from('pro_trend_briefs').update(patch).eq('id', id).select(BRIEF_COLS).maybeSingle();
  if (r.error) return no(500, 'TDW could not save the brief.');
  if (!r.data) return no(404, 'TDW has no such brief.');
  return { ok: true, brief: r.data };
}

module.exports = { makeWeek, room, week, adminList, adminDecide, checkNews, shown, view, BRIEF_COLS };
