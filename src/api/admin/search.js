// src/api/admin/search.js
// THE COMMAND PALETTE'S BACK END — TDW_10 P1 item 3.
// Mounted at /api/v2/admin/search on the vendor/admin service.
//
//   GET  /api/v2/admin/search?q=          typeahead across five sources
//   GET  /api/v2/admin/search/recents     the recent-jumps list
//   POST /api/v2/admin/search/recents     record a jump (fire-and-forget)
//
// ═════════════════════════════════════════════════════════════════════════════
// WHY THIS IS NOT ONE UNION QUERY — CE ruling R-A5
// ═════════════════════════════════════════════════════════════════════════════
// TDW_10_ADMIN_FINAL P1.3 says "one UNION query, limit 20, grouped". A literal
// UNION is not reachable from this process: package.json's dependencies carry
// `@supabase/supabase-js` and NOTHING ELSE that speaks SQL — no `pg`, no
// `knex`. PostgREST cannot express a cross-table UNION, so the only way to run
// one would be a Postgres function, which is DDL, which P1 does not have and
// which R-A6 has just re-homed to 0113 for an entirely different table.
//
// The chair ruled the UNION sentence a SHAPE, not a promise: what the spec
// actually asks for is one round trip from the client, five grouped sources,
// twenty results. That is what this file delivers — N parallel PostgREST
// queries merged and capped in Node. ZERO .sql files ship with it, and the
// bench asserts that mechanically rather than trusting this paragraph.
//
// ═════════════════════════════════════════════════════════════════════════════
// SQL PROVENANCE — every column below has a witness
// ═════════════════════════════════════════════════════════════════════════════
// Witness: docs/db/PUBLIC_SCHEMA.md at dream-os 218ed59, read column-by-column
// before a line was authored. The exact declarations relied upon:
//   public.users        (9 cols)   : id, phone, name
//   public.vendors      (38 cols)  : id, user_id, business_name, category, city,
//                                    routing_handle, instagram_handle
//   public.couples      (21 cols)  : id, user_id, partner_name, wedding_city,
//                                    wedding_date
//   public.prospects    (14 cols)  : id, phone, name, ig_handle, category, city, state
//   public.demo_vendors (14 cols)  : id, ig_handle, display_name, category, city
//   public.leads        (27 cols)  : id, vendor_id, name, phone, wedding_city,
//                                    state, deleted_at
//   public.admin_config (4 cols)   : key (PK), value, description, updated_at
// NOTE, stated rather than assumed: `vendors` and `couples` carry NO name and NO
// phone of their own — both live on `users` via user_id. That is why a name or
// phone search costs a users lookup first and a second wave after it, and why
// there is no shortcut here that would have been simpler.
//
// ═════════════════════════════════════════════════════════════════════════════
// THE TERM IS STRIPPED, NOT ESCAPED, AND THAT IS THE SAFER FAILURE
// ═════════════════════════════════════════════════════════════════════════════
// PostgREST's `or=` filter is a comma-and-dot-delimited mini-language, and
// ILIKE has its own wildcards. A term carrying `,` `(` `)` `.` `%` `_` can
// therefore either break the filter's parse or silently widen the match. Both
// failure modes are invisible to the caller, which is the class the
// independent-method law exists to refuse.
//
// So the term is REDUCED to a conservative character set before it is allowed
// anywhere near a query. Stripping over-narrows in the worst case (a search for
// "a.b" looks for "a b"); escaping, done wrong, over-MATCHES — and a palette
// that quietly returns the wrong rows is worse than one that returns none.

'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ── Caps, named ─────────────────────────────────────────────────────────────
const TOTAL_CAP    = 20;   // the spec's own number
const PER_SOURCE    = 6;   // so one loud source cannot eat the answer
const USER_LOOKUP   = 40;  // the widening wave; never returned, only joined on
const MIN_TERM      = 2;
const MAX_TERM      = 64;

// ── Recents (R-A7) ──────────────────────────────────────────────────────────
const RECENTS_KEY = 'admin.palette_recents';
const RECENTS_CAP = 12;

// ═════════════════════════════════════════════════════════════════════════════
// THE n=1 ASSUMPTION, WRITTEN DOWN WITH ITS BREAKING POINT — CE ruling R-A7
// ═════════════════════════════════════════════════════════════════════════════
// The spec says recent jumps are "per admin user". THERE IS NO ADMIN USER.
// src/lib/adminSession.js mints `nonce.expiry.hmac` with `subject: []` — empty
// BY CONSTRUCTION, and deliberately so: F-07.82's cure was that a token which
// cannot carry the secret cannot leak it, and the same shape means it carries
// no identity either. `verifyAdminSession` returns a bare boolean. There is
// nothing to key a per-user list on, and requireAdmin is byte-untouched this
// phase by charter, so widening it is not on the table.
//
// The chair ruled ONE GLOBAL ROW. It is correct at n=1 admin — the founder —
// which is the documented population (TDW_10_ADMIN_FINAL §"User: exactly one").
//
// WHAT BREAKS AT n=2, precisely: nothing errors and nothing is lost. The two
// operators SHARE one twelve-entry history, so each sees the other's jumps
// interleaved with their own. No data crosses that they could not already both
// read — every admin sees every surface — so this is a privacy non-event and a
// UX annoyance. THE FIX, when it is needed: an identity on the session token,
// which means re-opening F-07.82's shape, which is a security decision and not
// a palette one. Do not solve it here by hashing the bearer: a token rotates
// every seven days, so the history would silently reset and look like a bug.

function safeTerm(raw) {
  return String(raw == null ? '' : raw)
    .slice(0, MAX_TERM)
    // PostgREST filter metacharacters AND LIKE wildcards, together.
    .replace(/[,()"'\\%_*.:;<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// PostgREST `or` takes `col.ilike.*term*` clauses joined by commas. The term is
// already stripped of commas and dots above, so this join is unambiguous.
function orIlike(cols, term) {
  return cols.map(c => `${c}.ilike.*${term}*`).join(',');
}

/** Runs a promise and converts a rejection into a NAMED degradation rather than
 *  a thrown 500. One dead source must not blank the palette — but it must also
 *  never look like an empty result, so its name travels back to the caller. */
async function attempt(name, fn, degraded) {
  try {
    const { data, error } = await fn();
    if (error) { degraded.push(name); return []; }
    return Array.isArray(data) ? data : [];
  } catch (_e) {
    degraded.push(name);
    return [];
  }
}

// The label a row is known by. Never a bare id: an id the operator cannot read
// is not a search result.
function firstNonEmpty(...vals) {
  for (const v of vals) if (v != null && String(v).trim() !== '') return String(v).trim();
  return null;
}

// ── THE JUMP TARGETS, AND A DECLARED GAP ────────────────────────────────────
// Every path below is an EXISTING mounted admin route — P1 moves no path, so a
// jump can only land somewhere that already worked. `?focus=<id>` rides along
// as a FORWARD CONTRACT for P3's detail surfaces.
//
// DECLARED, NOT CLAIMED: no mounted surface reads `focus` today. The jump
// therefore lands the operator on the correct LIST with the row somewhere in
// it; it does not scroll to or open that row. That is a real gap and it is
// stated here rather than discovered on the founder's phone. Wiring the reader
// is P3's, where the detail sheets are built.
const TARGET = {
  vendors:   '/admin/makers',
  couples:   '/admin/dreamers',
  prospects: '/admin/prospects',
  demo:      '/admin/demo',
  leads:     '/admin/makers',
};

function pathFor(group, id) {
  return `${TARGET[group]}?focus=${encodeURIComponent(id)}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v2/admin/search?q=
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const term = safeTerm(req.query.q);

  if (term.length < MIN_TERM) {
    return okRes(res, { q: term, count: 0, groups: [] });
  }

  const degraded = [];

  // ── WAVE 1 — everything that can be asked directly ────────────────────────
  const [users, vendorsDirect, couplesDirect, prospects, demos, leads] = await Promise.all([
    attempt('users', () => supabase
      .from('users')
      .select('id, name, phone')
      .or(orIlike(['name', 'phone'], term))
      .limit(USER_LOOKUP), degraded),

    attempt('vendors', () => supabase
      .from('vendors')
      .select('id, user_id, business_name, category, city, routing_handle, instagram_handle')
      .or(orIlike(['business_name', 'routing_handle', 'instagram_handle'], term))
      .limit(PER_SOURCE), degraded),

    attempt('couples', () => supabase
      .from('couples')
      .select('id, user_id, partner_name, wedding_city, wedding_date')
      .ilike('partner_name', `*${term}*`)
      .limit(PER_SOURCE), degraded),

    attempt('prospects', () => supabase
      .from('prospects')
      .select('id, name, phone, ig_handle, category, city, state')
      .or(orIlike(['name', 'phone', 'ig_handle'], term))
      .limit(PER_SOURCE), degraded),

    attempt('demo', () => supabase
      .from('demo_vendors')
      .select('id, ig_handle, display_name, category, city')
      .or(orIlike(['ig_handle', 'display_name'], term))
      .limit(PER_SOURCE), degraded),

    attempt('leads', () => supabase
      .from('leads')
      .select('id, vendor_id, name, phone, wedding_city, state, vendor:vendors(business_name)')
      .is('deleted_at', null)
      .or(orIlike(['name', 'phone'], term))
      .limit(PER_SOURCE), degraded),
  ]);

  // ── WAVE 2 — the name/phone half, which lives on users ────────────────────
  const userIds  = users.map(u => u.id).filter(Boolean);
  const userById = new Map(users.map(u => [u.id, u]));

  let vendorsByUser = [];
  let couplesByUser = [];
  if (userIds.length) {
    [vendorsByUser, couplesByUser] = await Promise.all([
      attempt('vendors', () => supabase
        .from('vendors')
        .select('id, user_id, business_name, category, city, routing_handle, instagram_handle')
        .in('user_id', userIds)
        .limit(PER_SOURCE), degraded),
      attempt('couples', () => supabase
        .from('couples')
        .select('id, user_id, partner_name, wedding_city, wedding_date')
        .in('user_id', userIds)
        .limit(PER_SOURCE), degraded),
    ]);
  }

  // ── Merge, dedupe by row id, shape ────────────────────────────────────────
  const seen = new Set();
  const take = (group, rows, shape) => {
    const out = [];
    for (const row of rows) {
      const k = `${group}:${row.id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(shape(row));
      if (out.length >= PER_SOURCE) break;
    }
    return out;
  };

  const vendorHits = take('vendors', [...vendorsDirect, ...vendorsByUser], v => {
    const u = userById.get(v.user_id);
    return {
      id: v.id,
      label: firstNonEmpty(v.business_name, u && u.name, v.routing_handle) || 'Unnamed vendor',
      sub: [v.category, v.city, u && u.phone].filter(Boolean).join(' · ') || undefined,
      path: pathFor('vendors', v.id),
    };
  });

  const coupleHits = take('couples', [...couplesDirect, ...couplesByUser], c => {
    const u = userById.get(c.user_id);
    return {
      id: c.id,
      label: firstNonEmpty(u && u.name, c.partner_name) || 'Unnamed couple',
      sub: [c.partner_name, c.wedding_city, u && u.phone].filter(Boolean).join(' · ') || undefined,
      path: pathFor('couples', c.id),
    };
  });

  const prospectHits = take('prospects', prospects, p => ({
    id: p.id,
    label: firstNonEmpty(p.name, p.ig_handle, p.phone) || 'Unnamed prospect',
    sub: [p.state, p.category, p.city, p.phone].filter(Boolean).join(' · ') || undefined,
    path: pathFor('prospects', p.id),
  }));

  const demoHits = take('demo', demos, d => ({
    id: d.id,
    label: firstNonEmpty(d.display_name, d.ig_handle) || 'Unnamed demo',
    sub: [d.ig_handle, d.category, d.city].filter(Boolean).join(' · ') || undefined,
    path: pathFor('demo', d.id),
  }));

  const leadHits = take('leads', leads, l => ({
    id: l.id,
    label: firstNonEmpty(l.name, l.phone) || 'Unnamed lead',
    sub: [l.state, l.wedding_city, l.vendor && l.vendor.business_name].filter(Boolean).join(' · ') || undefined,
    path: pathFor('leads', l.vendor_id || l.id),
  }));

  // STABLE GROUP ORDER (R-A5). The operator's muscle memory is a feature; a
  // palette that reorders itself by result count teaches nothing.
  const ordered = [
    { key: 'vendors',   label: 'Vendors',   hits: vendorHits },
    { key: 'couples',   label: 'Couples',   hits: coupleHits },
    { key: 'prospects', label: 'Prospects', hits: prospectHits },
    { key: 'demo',      label: 'Demo',      hits: demoHits },
    { key: 'leads',     label: 'Leads',     hits: leadHits },
  ];

  // TOTAL_CAP applied ACROSS groups in that order, so the cap trims the tail
  // rather than silently rebalancing what the operator sees first.
  let budget = TOTAL_CAP;
  const groups = [];
  for (const g of ordered) {
    if (budget <= 0) break;
    const hits = g.hits.slice(0, budget);
    budget -= hits.length;
    if (hits.length) groups.push({ ...g, hits });
  }

  const count = groups.reduce((n, g) => n + g.hits.length, 0);
  const payload = { q: term, count, groups };
  // Dedupe the degradation names — a source can fail in both waves.
  if (degraded.length) payload.degraded = Array.from(new Set(degraded));
  return okRes(res, payload);
}));

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/v2/admin/search/recents
// ═════════════════════════════════════════════════════════════════════════════
router.get('/recents', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  // Witness: public.admin_config(key text PK, value text NOT NULL,
  // description text, updated_at timestamptz) — PUBLIC_SCHEMA.md:33–40.
  // `value` is TEXT, so the list travels as a JSON string. No DDL, by ruling.
  const { data, error } = await supabase
    .from('admin_config')
    .select('value')
    .eq('key', RECENTS_KEY)
    .maybeSingle();

  if (error) return okRes(res, { recents: [] });
  let recents = [];
  try {
    const parsed = JSON.parse((data && data.value) || '[]');
    if (Array.isArray(parsed)) recents = parsed.slice(0, RECENTS_CAP);
  } catch (_e) {
    // A malformed row reads as an empty history, never as an error the operator
    // must clear. Recents are a convenience; they never gate the palette.
    recents = [];
  }
  return okRes(res, { recents });
}));

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/v2/admin/search/recents   { label, path }
// ═════════════════════════════════════════════════════════════════════════════
// FIRE-AND-FORGET BY RULING (R-A7): the client does not await this, and it
// always answers ok. The jump has already happened by the time this runs;
// reporting a bookkeeping failure to a caller that has navigated away would be
// noise. The failure is LOGGED, so it is not silent — it is simply not the
// operator's problem.
//
// LAST-WRITE-WINS, and that is acceptable at n=1: two jumps cannot race a
// single thumb. At n=2 the loser's entry is dropped, which is the same
// annoyance the shared list already implies.
router.post('/recents', requireAdmin, express.json(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const label = String((req.body && req.body.label) || '').slice(0, 80).trim();
  const path  = String((req.body && req.body.path)  || '').slice(0, 200).trim();

  // Only admin routes may enter the history. A recents list that can be taught
  // an arbitrary URL is an open redirect wearing a convenience's clothes.
  if (!label || !path.startsWith('/admin')) {
    // err(res, status, message, code) — signature witnessed at src/lib/response.js:5.
    return errRes(res, 400, 'A jump needs a label and an /admin path.', 'bad_jump');
  }

  try {
    const { data } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', RECENTS_KEY)
      .maybeSingle();

    let list = [];
    try {
      const parsed = JSON.parse((data && data.value) || '[]');
      if (Array.isArray(parsed)) list = parsed;
    } catch (_e) { list = []; }

    const next = [{ label, path, at: Date.now() }]
      .concat(list.filter(r => r && r.path !== path))
      .slice(0, RECENTS_CAP);

    await supabase
      .from('admin_config')
      .upsert(
        {
          key: RECENTS_KEY,
          value: JSON.stringify(next),
          description: 'TDW_10 P1 — command palette recent jumps (global; see R-A7 on the n=1 assumption).',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );
  } catch (e) {
    console.error('[admin/search] recents write failed (non-fatal):', e && e.message);
  }

  return okRes(res, { recorded: true });
}));

module.exports = router;
