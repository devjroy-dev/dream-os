// src/capabilitiesSweep.js — THE SWITCHBOARD'S SWEEP. CE-41 seat C, R-41.8, R-41.35–.41.
//
// Three ways a reading reaches the register, all landing on ONE writer
// (`capabilities.recordSweep`):
//   1. THE WEBHOOK FAST PATH (R-41.37) — Meta's `message_template_status_update`
//      field on the existing receiver (`src/index.js` /webhook/meta →
//      `applyTemplateStatusEvent`). Seconds, zero rate limit.
//   2. THE NIGHTLY RECONCILER — 03:50 Asia/Kolkata, its own minute against the
//      nine in `src/cron.js` (2:30 · 3:00 · 3:15 · 3:20 · 3:25 · 3:40 · 3:45 ·
//      4:15) and the marketing opener (4:30 UTC = 10:00 IST). The
//      `marketingCron.js` shape: a start function, handles returned, IST named.
//   3. ON DEMAND — `POST /api/v2/admin/capabilities/sweep` and the per-row
//      `Check now` (`POST .../:key/check`).
//
// WHAT EACH KIND IS ASKED (roadmap §4):
//   template   GET /{META_WABA_ID}/message_templates?fields=name,status,category,id
//              &name_or_content=<name>  — exact-name match on the page; Meta's own
//              status word is the evidence VERBATIM (R-41.36). Meta reference
//              "Template fundamentals", fetched 2026-09-08 (page dated 2026-05-05):
//              APPROVED · PENDING · REJECTED · PAUSED · DISABLED, plus IN_APPEAL
//              and the Manager-only quality tiers. Mapping (R-41.36):
//              APPROVED→approved · PENDING/IN_APPEAL→pending · REJECTED/DISABLED→rejected
//              · PAUSED→paused. Anything else → pending with the word as evidence.
//   scope      https://oauth2.googleapis.com/tokeninfo on the HOUSE grant's access
//              token (refreshed from the vault) — `scope` is a space-separated
//              string (Google "Token types", fetched 2026-09-08). A scope present
//              → approved; absent → pending; no house grant → pending with reason.
//              READS `vendor_google_connections` (0147) — the R-41.9 regen is owed
//              by this packet, named in its handover.
//   permission WITHHELD (R-41.39). The IG probes need the IG user id seat B
//              derives at `instagram_business_basic`; until then the arm below is
//              fully commented and every `perm.*` row keeps its seeded status.
//   flag       Not probed. `flag.wedding_reel` alone carries an evidence line —
//              the ffmpeg probe (R-41.38) — refreshed by the reel probe's own
//              route, not here.
//
// THE DISARM (R-41.35): a `template.*` reading of rejected/paused walks
// TEMPLATE_GUARDS to the `flag.*` row that guards its arm and disarms it
// (`on → off`) through the same writer; the founder is told.
// THE ARMING: a `template.*` reading of approved arms a guarding `flag.*` row
// that is still `pending` (never a founder-set on/off — R-40.96, his hand
// outranks a re-read). Seeds from env carry on|off, so today's flags are not
// re-armed by the first sweep; a flag born `pending` (a future arm) is.
//
// THE FOUNDER NOTICE (R-41.41): one Utility message on ADMIN_PHONE, the vendor
// lane's PNID, template `tdw_capability_armed` — AWAKE since Meta made that
// template Active (2026-09-08, ID 1063533856046167). It is itself gated on
// `template.tdw_capability_armed` in the register: the founder's own notice waits
// for his tap like every other send.
//
// NEVER A LIVE META CALL FROM A BENCH (kickoff §9): every network read goes
// through `deps.fetch`, which the bench replaces; production passes nothing and
// gets global fetch.
'use strict';

const cron = require('node-cron');
const cap  = require('./lib/capabilities');
const gOAuth = require('./lib/vendor/googleOAuth');
const gConn  = require('./lib/vendor/googleConnection');

const IST = 'Asia/Kolkata';
const SWEEP_CRON = '50 3 * * *';        // 03:50 IST nightly — its own minute
const GRAPH_BASE = 'https://graph.facebook.com';
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

/**
 * THE CENSUS OF GUARDS — which `flag.*` row a `template.*` row guards.
 * Derived at C0 from the nine read sites (kickoff §3.4). A template with no
 * entry guards nothing on the switchboard (OTP, nudges, enquiry templates —
 * their gates are lane law, out of radius).
 */
const TEMPLATE_GUARDS = Object.freeze({
  'template.tdw_contract_sign':     'flag.contract_sign_send',
  'template.tdw_contract_sign_otp': 'flag.contract_sign_send',
  'template.tdw_contract_copy':     'flag.contract_copy_send',
  'template.tdw_payment_reminder':  'flag.payment_reminder_send',
  'template.tdw_referral_alert':    'flag.referral_alert_send',
  'template.tdw_wedding_credit':    'flag.wedding_credit_send',
  'template.tdw_wedding_consent':   'flag.wedding_consent_send',
  'template.tdw_review_request':    'flag.review_ask_send',
});

/** Meta's word → the register's word (R-41.36). The word itself is the evidence. */
function mapMetaTemplateStatus(word) {
  const w = String(word || '').toUpperCase();
  if (w === 'APPROVED') return 'approved';
  if (w === 'REJECTED' || w === 'DISABLED') return 'rejected';
  if (w === 'PAUSED') return 'paused';
  return 'pending'; // PENDING, IN_APPEAL, PENDING_DELETION, unknown
}

function graphVersion(env) { return env.META_GRAPH_VERSION || 'v21.0'; }

/**
 * One template's status from the WABA. Exact-name match — `name_or_content` is
 * a substring filter, so `tdw_contract_sign` would also return `tdw_contract_sign_otp`.
 * Returns { ok, status?, meta?, evidence }.
 */
async function probeTemplate(name, { env = process.env, fetch: f = globalThis.fetch } = {}) {
  const waba = env.META_WABA_ID, token = env.META_WABA_TOKEN;
  if (!waba)  return { ok: false, evidence: 'META_WABA_ID is not set — the sweep cannot ask Meta' };
  if (!token) return { ok: false, evidence: 'META_WABA_TOKEN is not set' };
  const url = `${GRAPH_BASE}/${graphVersion(env)}/${waba}/message_templates?fields=name,status,category,id&name_or_content=${encodeURIComponent(name)}&limit=50`;
  let res, body;
  try {
    res = await f(url, { headers: { Authorization: `Bearer ${token}` } });
    body = await res.json().catch(() => null);
  } catch (e) {
    return { ok: false, evidence: `Graph unreachable: ${e && e.message}` };
  }
  if (!res.ok || !body || body.error) {
    const err = (body && body.error) || {};
    // The error page (Meta, fetched 2026-09-08, dated 2026-06-18): code 10 / 200–299 =
    // permission; 190 = token expired; bare 200 = no token provided; 4 / 80007 = throttled.
    return { ok: false, evidence: `Graph ${res.status}: (#${err.code || '?'}) ${err.message || 'no message'}` };
  }
  const rows = Array.isArray(body.data) ? body.data.filter((t) => t && t.name === name) : [];
  if (rows.length === 0) return { ok: true, status: 'pending', evidence: `Meta: no template named ${name} on WABA ${waba}` };
  // Several languages share a name; one APPROVED is enough to arm, one REJECTED/PAUSED disarms.
  const words = rows.map((t) => String(t.status || '').toUpperCase());
  const worst = words.find((w) => w === 'REJECTED' || w === 'DISABLED' || w === 'PAUSED');
  const chosen = worst || (words.includes('APPROVED') ? 'APPROVED' : words[0]);
  const t = rows[words.indexOf(chosen)];
  return {
    ok: true,
    status: mapMetaTemplateStatus(chosen),
    meta: { id: t.id, status: chosen, category: t.category },
    evidence: `Meta: ${chosen} · ${t.category || '?'} · id ${t.id} · ${new Date().toISOString().slice(0, 16)}Z`,
  };
}

/**
 * C1b (F-41.6's instrument) — EVERY template on the WABA, raw, paginated to
 * completion. Meta pages `message_templates` with `paging.next` (an absolute URL
 * carrying the cursor); a listing that reads one page and stops would hand seat B
 * a partial register and call it whole. Read-only; the admin door serves it.
 * Returns { ok, templates: [{name,status,category,id,language?}], pages, evidence }.
 */
async function listWabaTemplates({ env = process.env, fetch: f = globalThis.fetch, maxPages = 20 } = {}) {
  const waba = env.META_WABA_ID, token = env.META_WABA_TOKEN;
  if (!waba)  return { ok: false, templates: [], pages: 0, evidence: 'META_WABA_ID is not set' };
  if (!token) return { ok: false, templates: [], pages: 0, evidence: 'META_WABA_TOKEN is not set' };
  let url = `${GRAPH_BASE}/${graphVersion(env)}/${waba}/message_templates?fields=name,status,category,id,language&limit=100`;
  const out = []; let pages = 0;
  while (url && pages < maxPages) {
    let res, body;
    try { res = await f(url, { headers: { Authorization: `Bearer ${token}` } }); body = await res.json().catch(() => null); }
    catch (e) { return { ok: false, templates: out, pages, evidence: `Graph unreachable on page ${pages + 1}: ${e && e.message}` }; }
    if (!res.ok || !body || body.error) {
      const err = (body && body.error) || {};
      return { ok: false, templates: out, pages, evidence: `Graph ${res.status} on page ${pages + 1}: (#${err.code || '?'}) ${err.message || 'no message'}` };
    }
    pages += 1;
    for (const t of (Array.isArray(body.data) ? body.data : [])) {
      if (t && t.name) out.push({ name: t.name, status: t.status || null, category: t.category || null, id: t.id || null, language: t.language || null });
    }
    url = body.paging && body.paging.next ? body.paging.next : null;
  }
  const truncated = !!url;
  out.sort((a, b) => a.name.localeCompare(b.name));
  return { ok: !truncated, templates: out, pages, truncated,
    evidence: `${out.length} templates on WABA ${waba} across ${pages} page(s)${truncated ? ' — TRUNCATED at maxPages' : ''} · ${new Date().toISOString().slice(0, 16)}Z` };
}

/**
 * Google scope presence on the HOUSE grant via token-info. `scopeKey` is the
 * register's short form (R-41.43): `scope.google.webmasters.readonly` →
 * `https://www.googleapis.com/auth/webmasters.readonly`.
 */
function scopeUrlFor(key) {
  const short = String(key).replace(/^scope\.google\./, '');
  if (short === 'openid') return 'openid';
  return `https://www.googleapis.com/auth/${short}`;
}
async function probeScope(key, { supabase, fetch: f = globalThis.fetch } = {}) {
  const h = await gConn.getStatus(supabase, gConn.HOUSE);
  if (!h.ok)  return { ok: false, evidence: `house grant read failed: ${h.error}` };
  if (!h.row) return { ok: true, status: 'pending', evidence: 'no house Google grant yet' };
  const tok = await gConn.openRefreshToken(supabase, gConn.HOUSE);
  if (!tok.ok) return { ok: false, evidence: `token vault: ${tok.error}` };
  const acc = await gOAuth.refreshAccess(tok.refreshToken);
  if (!acc.ok) return { ok: false, evidence: `Google refresh refused: ${acc.error}` };
  let res, body;
  try {
    res = await f(`${TOKENINFO_URL}?access_token=${encodeURIComponent(acc.accessToken)}`);
    body = await res.json().catch(() => null);
  } catch (e) {
    return { ok: false, evidence: `tokeninfo unreachable: ${e && e.message}` };
  }
  if (!res.ok || !body) return { ok: false, evidence: `tokeninfo ${res.status}: ${(body && (body.error_description || body.error)) || 'no body'}` };
  const granted = String(body.scope || '').split(/\s+/).filter(Boolean);
  const want = scopeUrlFor(key);
  const has = granted.includes(want);
  return {
    ok: true,
    status: has ? 'approved' : 'pending',
    evidence: `Google: ${has ? 'granted' : 'absent'} on ${body.email || 'house'} · scopes ${granted.length} · ${new Date().toISOString().slice(0, 16)}Z`,
  };
}

// ── PERMISSION PROBES — WITHHELD (R-41.39) ───────────────────────────────────
// UNCOMMENT STEP: when seat B hands the IG user id and the permission is filed,
// set `IG_USER_ID` on Railway and uncomment this arm; add `perm.instagram_*` to
// `probeOne`'s switch. The probe shape, so nobody re-derives it:
//   insights: GET /{v}/{IG_USER_ID}/insights?metric=reach&period=day
//   publish:  POST /{v}/{IG_USER_ID}/media with an empty body — the refusal text
//             (code 10 / 200-class) is the evidence; a 400 "missing image_url"
//             means the permission IS granted (the door opened, the body was empty).
//   comments: GET /{v}/{IG_USER_ID}/media?fields=comments.limit(1)
// async function probePermission(key, { env = process.env, fetch: f = globalThis.fetch } = {}) {
//   const igUser = env.IG_USER_ID, token = env.META_WABA_TOKEN;
//   if (!igUser) return { ok: false, evidence: 'IG_USER_ID is not set' };
//   ...
// }

// ── THE INSIGHTS PROBE — CE-42 4b-3b, ruling 15(a), F-42.164's cure ─────────
// The withheld shape above named graph.facebook.com with META_WABA_TOKEN: the
// Facebook-Login path. The estate's tokens are Instagram-Login (igOAuth.js
// GRAPH_HOST, graph.instagram.com) and a WABA token cannot read an Instagram
// user's insights. So the probe reads THE PROBE VENDOR'S OWN TOKEN — the routing
// handle in admin_config.ig_probe_vendor (0163, seeded DEV440) — through
// igConnection.tokenForCall (refresh-on-use, the one home) and one account read
// in igOAuth.probeInsightsScope, on graph.instagram.com and nowhere else.
//   200                    → approved   (recordSweep (d): pending → approved; the founder flips)
//   4xx permission refusal → pending    (the scope is not on that token)
//   anything else          → ok:false   (touch: checked_at/evidence move, status never)
// F-42.175 — WHAT THIS CANNOT TELL: a tester-role token in Development mode
// reads 200 with no App Review grant behind it. The evidence byte therefore
// names the token's owner and says "app mode unread", and the Switchboard flip
// is the R-41.8 tap on a WALK, never a reading of Meta's verdict. Only the
// insights row is probed; the other seven perm.* rows keep the withheld line.
async function probeInsights({ supabase } = {}) {
  const igConn  = require('./lib/vendor/igConnection');
  const igOAuth = require('./lib/vendor/igOAuth');
  const { data: cfg, error: cfgErr } = await supabase.from('admin_config').select('key, value').eq('key', 'ig_probe_vendor').maybeSingle();
  if (cfgErr) return { ok: false, evidence: `admin_config read failed: ${cfgErr.message}` };
  const handle = cfg && String(cfg.value || '').trim();
  if (!handle) return { ok: false, evidence: 'admin_config.ig_probe_vendor is not set (0163)' };
  const { data: vendor, error: vErr } = await supabase.from('vendors').select('id, routing_handle').eq('routing_handle', handle).maybeSingle();
  if (vErr) return { ok: false, evidence: `vendors read failed: ${vErr.message}` };
  if (!vendor) return { ok: false, evidence: `no vendor carries routing_handle ${handle}` };
  const t = await igConn.tokenForCall(supabase, vendor.id);
  if (!t.ok) return { ok: false, evidence: `${handle}'s Instagram token: ${t.error}` };
  const p = await igOAuth.probeInsightsScope(t.accessToken, t.igUserId);
  const when = new Date().toISOString().slice(0, 16) + 'Z';
  if (!p.ok) return { ok: false, evidence: `insights read on ${handle}'s token failed: ${p.error}` };
  return {
    ok: true,
    status: p.granted ? 'approved' : 'pending',
    evidence: `${p.granted ? 'approved' : 'absent'} on ig_probe_vendor ${handle}'s token · app mode unread · ${p.evidence} · ${when}`,
  };
}

/** Route one key to its probe; `flag.*` and every `perm.*` but insights are not probed. */
async function probeOne(row, deps) {
  if (row.kind === 'template')   return probeTemplate(row.key.replace(/^template\./, ''), deps);
  if (row.kind === 'scope')      return probeScope(row.key, deps);
  if (row.kind === 'permission' && row.key === cap.CAPABILITY_KEYS.PERM_INSIGHTS) return probeInsights(deps);
  if (row.kind === 'permission') return { ok: false, evidence: (row.evidence || 'not filed') + ' · probe withheld until the IG user id (R-41.39)' , skipped: true };
  return { ok: false, evidence: row.evidence, skipped: true };
}

/**
 * Apply one reading to the register and walk its guard. Returns the movement.
 * `notify` is the withheld notice hook; today it logs.
 */
async function applyReading(row, reading, deps) {
  const supabase = deps.supabase;
  const out = { key: row.key, ok: reading.ok, skipped: !!reading.skipped, moves: [] };
  if (reading.skipped) return out;
  if (!reading.ok) {
    // A failed read moves `checked_at` and `evidence` but never the status.
    await cap.touch(row.key, { evidence: reading.evidence }, { supabase });
    return out;
  }
  const m = await cap.recordSweep(row.key, { status: reading.status, evidence: reading.evidence }, { supabase });
  out.moves.push(m);
  const guard = TEMPLATE_GUARDS[row.key];
  if (guard) {
    const g = await cap.get(guard, { supabase, fresh: true });
    if (g) {
      if (reading.status === 'rejected' || reading.status === 'paused') {
        const gm = await cap.recordSweep(guard, { status: reading.status, evidence: `${row.key}: ${reading.evidence}` }, { supabase });
        out.moves.push(gm);
        if (gm.disarmed) await notifyFounder(`disarmed ${guard} — ${reading.evidence}`, deps);
      } else if (reading.status === 'approved' && g.status === 'pending') {
        const gm = await cap.recordSweep(guard, { status: 'armed', evidence: `${row.key}: ${reading.evidence}` }, { supabase });
        out.moves.push(gm);
        await notifyFounder(`armed ${guard} — ${reading.evidence}`, deps);
      }
    }
  }
  if (m.auto_flipped) await notifyFounder(`auto_on ${row.key} — ${reading.evidence}`, deps);
  return out;
}

/**
 * THE FOUNDER NOTICE — AWAKE (R-41.41, R-41.8). Withheld until `tdw_capability_armed`
 * existed; Meta made it Active 2026-09-08 17:49Z (ID 1063533856046167, Utility)
 * and seat B's filing closed, so the conditional-withheld block's stated
 * uncomment step is taken here and the send is live.
 *
 * ONE MESSAGE, NO PARAMETERS. The template's body is `Meta approved your
 * template.` and it declares zero variables; its button is static and carries the
 * founder to the card, where the sweep has already written the evidence line for
 * the row that moved. `buildTemplatePayload` emits `components: []` and would
 * throw on any parameter — a cell asserts both.
 *
 * ADMIN_PHONE, one home, as `concierge.js` reads it. The vendor lane's PNID
 * (R-41.41): the admin number is a vendor-side actor.
 *
 * GATED ON THE REGISTER, like every other send in the estate: the founder's own
 * notice does not leave until he switches `template.tdw_capability_armed` on. A
 * notice that ignored the switchboard would be the one send the Switchboard did
 * not govern.
 */
const NOTICE_KEY = 'template.tdw_capability_armed';
async function notifyFounder(line, deps = {}) {
  const env = deps.env || process.env;
  const to = env.ADMIN_PHONE;
  if (!to) { console.log(`[capabilities] founder notice: ADMIN_PHONE is not set — ${line}`); return { sent: false, reason: 'no_admin_phone' }; }
  if (!cap.on(NOTICE_KEY)) {
    console.log(`[capabilities] founder notice: ${cap.reason(NOTICE_KEY)} — ${line}`);
    return { sent: false, reason: cap.reason(NOTICE_KEY) };
  }
  try {
    const { sendWa } = deps.sendWa ? { sendWa: deps.sendWa } : require('./lib/sendWa');
    const out = await sendWa({
      line: 'vendor', to, templateKey: 'capability_armed',
      vars: {},                        // zero variables, by the template's own shape
      site: 'capabilities:armed',      // R-41.90 — sendWa logs this once
      supabase: deps.supabase,
    });
    console.log(`[capabilities] founder notice sent — ${line}`);
    return { sent: true, out };
  } catch (err) {
    console.warn(`[capabilities] founder notice REFUSED (${err && err.code}): ${err && err.message} — ${line}`);
    return { sent: false, reason: (err && err.message) || 'send failed' };
  }
}

/** Every row, or one. Returns the movements; never throws on a single row's failure. */
async function runSweep({ supabase, env = process.env, fetch: f, keys = null, mode = 'nightly' } = {}) {
  const started = new Date().toISOString();
  const rows = await cap.list({ supabase, fresh: true });
  const targets = keys ? rows.filter((r) => keys.includes(r.key)) : rows;
  const results = [];
  for (const row of targets) {
    try {
      const reading = await probeOne(row, { env, fetch: f, supabase });
      results.push(await applyReading(row, reading, { supabase, env }));
    } catch (e) {
      results.push({ key: row.key, ok: false, error: e && e.message });
      console.warn(`[capabilities] sweep ${row.key}: ${e && e.message}`);
    }
  }
  const moved = results.filter((r) => r.moves && r.moves.some((m) => m.before !== m.after));
  console.log(`[capabilities] sweep ${mode} · ${targets.length} rows · ${moved.length} moved · started ${started}`);
  return { started, mode, checked: targets.length, moved: moved.length, results };
}

/**
 * THE WEBHOOK FAST PATH (R-41.37). Meta's `message_template_status_update`
 * value: { event: 'APPROVED'|'REJECTED'|'PAUSED'|'DISABLED'|'PENDING_DELETION'|...,
 *          message_template_id, message_template_name, message_template_language, reason }.
 * Applies to the `template.<name>` row if it exists; unknown names are ignored
 * (OTP and nudge templates live on the WABA too and have no row by design).
 */
async function applyTemplateStatusEvent(supabase, value, deps = {}) {
  const name = value && value.message_template_name;
  if (!name) return { applied: false, reason: 'no_name' };
  const key = `template.${name}`;
  const row = await cap.get(key, { supabase, fresh: true });
  if (!row) return { applied: false, reason: 'no_row', key };
  const word = String(value.event || '').toUpperCase();
  const reading = {
    ok: true,
    status: mapMetaTemplateStatus(word),
    evidence: `Meta webhook: ${word}${value.reason ? ` · ${value.reason}` : ''} · id ${value.message_template_id || '?'} · ${new Date().toISOString().slice(0, 16)}Z`,
  };
  const out = await applyReading(row, reading, { supabase, env: deps.env || process.env });
  return { applied: true, key, ...out };
}

/** Boot: the nightly reconciler. Mirrors `startMarketingCron`'s handle shape. */
function startCapabilitiesSweep({ supabase }) {
  cap.bind(supabase);   // warms the sync table `cap.on()` reads; every gate is shut until the first warm lands
  const handles = {};
  handles.nightly = cron.schedule(SWEEP_CRON, async () => {
    try { await runSweep({ supabase, mode: 'nightly' }); }
    catch (e) { console.error('[capabilities] nightly sweep failed:', e && e.message); }
  }, { timezone: IST });
  console.log(`[capabilities] nightly sweep scheduled ${SWEEP_CRON} ${IST}`);
  return handles;
}

module.exports = {
  probeInsights,
  runSweep, probeTemplate, probeScope, applyReading, applyTemplateStatusEvent, listWabaTemplates,
  startCapabilitiesSweep, mapMetaTemplateStatus, scopeUrlFor, notifyFounder,
  TEMPLATE_GUARDS, SWEEP_CRON, IST,
};
