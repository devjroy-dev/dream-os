// src/lib/metaGates.js — R-46.15, THE ONE HOME of which Meta permissions each Meta-gated feature needs.
// CE-46 ADS-2 cut 2 item 3 (the chair's ruling of 28 Sept, answered 30 Sept 2026).
//
// A feature moves only when EVERY permission in its list reads live on its app's GET /{app-id}/permissions.
// THE MAPPING (the founder's Graph Explorer reads of 30 Sept, ruled): listed and "live" means approved; absent or
// any other word means not approved; a word other than "live" is recorded verbatim and named, never mapped.
// The lines go ONLY to the founder (never to vendors), one WhatsApp line each, in the chair's words.
'use strict';

const APPS = Object.freeze({
  tdw_ads:  Object.freeze({ name: 'TDW ADS',  idEnv: 'ADS_APP_ID',  secretEnv: 'ADS_APP_SECRET' }),
  app_live: Object.freeze({ name: 'App-LIVE', idEnv: 'META_APP_ID', secretEnv: 'META_APP_SECRET' }),
});

const FEATURES = Object.freeze([
  Object.freeze({ gate: 'flag.ads', feature: 'Instagram ads', app: 'tdw_ads',
    permissions: Object.freeze(['ads_management', 'ads_read', 'pages_read_engagement', 'pages_show_list', 'pages_manage_ads', 'instagram_basic']),   // six: instagram_manage_insights not filed (CE-47, 4 Oct)
    plural: true, onLine: 'Instagram ads are now live for every vendor.' }),
  Object.freeze({ gate: 'perm.instagram_business_manage_messages', feature: 'Instagram messages', app: 'app_live',
    permissions: Object.freeze(['instagram_business_basic', 'instagram_business_manage_messages']),
    plural: true, onLine: 'Instagram messages are now live for every vendor.' }),
  Object.freeze({ gate: 'flag.ig_photo_import', feature: 'The Instagram photo import', app: 'app_live',
    permissions: Object.freeze(['instagram_business_basic']),   // the import needs basic alone (CE-47, 4 Oct)
    onLine: 'The Instagram photo import is now live for every vendor.' }),
  // CLB part C (CE-47, 8 Oct 2026): her packages as cards in her Instagram messages; the same pair as Instagram messages.
  Object.freeze({ gate: 'flag.ig_package_cards', feature: 'Package cards in Instagram messages', app: 'app_live',
    permissions: Object.freeze(['instagram_business_basic', 'instagram_business_manage_messages']),
    plural: true, onLine: 'Package cards in Instagram messages are now live for every vendor.' }),
]);

// Every perm.* row the sweep reads, with its app and the permissions that make it approved. The feature gates above
// are read as features, not here. perm.instagram_business_manage_insights keeps its own token probe (CE-42 4b-3b).
const PERM_ROWS = Object.freeze({
  'perm.ads_management':             { app: 'tdw_ads',  permissions: ['ads_management'] },
  'perm.ads_read':                   { app: 'tdw_ads',  permissions: ['ads_read'] },
  'perm.business_management':        { app: 'tdw_ads',  permissions: ['business_management'] },
  'perm.pages_read_engagement':      { app: 'tdw_ads',  permissions: ['pages_read_engagement'] },
  'perm.pages_show_list':            { app: 'tdw_ads',  permissions: ['pages_show_list'] },
  'perm.pages_manage_ads':           { app: 'tdw_ads',  permissions: ['pages_manage_ads'] },
  'perm.instagram_basic':            { app: 'tdw_ads',  permissions: ['instagram_basic'] },
  'perm.instagram_manage_insights':  { app: 'tdw_ads',  permissions: ['instagram_manage_insights'] },
  'perm.instagram_business_basic':   { app: 'app_live', permissions: ['instagram_business_basic'] },
  'perm.instagram_business_content_publish':  { app: 'app_live', permissions: ['instagram_business_content_publish'] },
  'perm.instagram_business_manage_comments':  { app: 'app_live', permissions: ['instagram_business_manage_comments'] },
  'perm.whatsapp_business_pair':     { app: 'app_live', permissions: ['whatsapp_business_management', 'whatsapp_business_messaging'] },
});

const LIVE = 'live';

/** The app token, built here and nowhere else; never logged, never returned to a caller that prints. */
function appToken(appKey, env = process.env) {
  const a = APPS[appKey]; if (!a) return null;
  const id = String(env[a.idEnv] || '').trim(); const secret = String(env[a.secretEnv] || '').trim();
  return id && secret ? { id, token: `${id}|${secret}` } : null;
}

/** Meta's list → Map(permission → its word, verbatim). PURE. */
function listingFrom(body) {
  const m = new Map();
  for (const r of (body && Array.isArray(body.data) ? body.data : [])) if (r && r.permission) m.set(String(r.permission), String(r.status == null ? '' : r.status));
  return m;
}

/** One reading for a list of permissions. PURE. */
function readingFor(listing, permissions) {
  const missing = []; const newWords = [];
  for (const p of permissions) {
    const w = listing.get(p);
    if (w !== LIVE) missing.push(p);
    if (w !== undefined && w !== LIVE) newWords.push({ permission: p, word: w });
  }
  return { status: missing.length ? 'pending' : 'approved', missing, newWords };
}

function evidenceFor(appKey, permissions, r, when = new Date()) {
  const app = APPS[appKey] ? APPS[appKey].name : appKey;
  const parts = [`Meta ${app}: ${permissions.length - r.missing.length}/${permissions.length} live`];
  if (r.missing.length) parts.push(`not live: ${r.missing.join(', ')}`);
  for (const n of r.newWords) parts.push(`word "${n.word}" on ${n.permission}`);
  return `${parts.join(' · ')} · ${when.toISOString().slice(0, 16)}Z`;
}

/** The founder's lines, in the chair's words (30 Sept 2026). PURE. */
function lineOn(f) { return f.onLine; }
// "are back" for the plural features (CE-47's ruling, 1 Oct 2026); the photo import stays "is back".
function lineWithdrawn(f, permission) { return `Meta has withdrawn ${permission}. ${f.feature} ${f.plural ? 'are' : 'is'} back to Coming soon for vendors.`; }

// THE FOUNDER'S TEMPLATE (CE-47 ruling 1): tdw_capability_line, Utility, body {{1}} = the line; filed in IGD-3's
// sitting. Until Meta approves it, the line rides today's tdw_capability_armed and is logged verbatim beside it.
const LINE_TEMPLATE = 'tdw_capability_line';
function liveStep(appKey) { return `One step is yours: switch ${APPS[appKey].name} to Live in Meta's dashboard.`; }

module.exports = { APPS, FEATURES, PERM_ROWS, LIVE, LINE_TEMPLATE, appToken, listingFrom, readingFor, evidenceFor, lineOn, lineWithdrawn, liveStep };
