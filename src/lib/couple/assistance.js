// src/lib/couple/assistance.js — BLOCK 20 · CONCIERGE · THE ASSISTANCE PLANE'S ONE HOME.
//
// A couple asks The Dream Wedding to find and book her vendors (R-41.2): one
// sheet, categories with a `Rs` budget each, the look, one Send. The request
// lands in the admin queue. The founder forwards each category by hand to a
// vendor on the platform (a lead through `createLead`, the sole lead writer,
// `source='tdw_assist'`) or to an outsider (a `prospects` row on Mira's line,
// R-41.13). A request is NOT a lead until TDW forwards it (roadmap §2).
//
// ── ONE-HOME LAW, EXECUTED ──────────────────────────────────────────────────
// `.from('assistance_requests')`, `.from('assistance_request_items')` and
// `.from('assistance_forwards')` appear in THIS FILE and in
// src/lib/vendor/relayStatus.js (the receipt router's UPDATE by wamid) and
// nowhere else in src/. Three doors call the writer — src/api/couple/assistance.js
// (bride), src/api/admin/assistance.js (admin-typed + the queue + the forward),
// and the s2 public link (reserved; a commented stub in the bride door). A bench
// asserts the census (scripts/b20_a2_assistance_bench.js §1).
//
// `createLead` is called here and NOT re-implemented (roadmap §7: no third lead
// writer). `PEER_REFERRAL_SOURCE`'s sibling, `TDW_ASSIST_SOURCE`, is exported from
// here so the door hands it rather than spelling it.
//
// ── THE PHONE (R-41.29) ─────────────────────────────────────────────────────
// `assistance_requests.phone` is the LAST TEN DIGITS, always. `normalizePhone`
// below is the one home for that reading in this plane. (src/api/vendor/leads.js
// `leadPhoneKey` is an annotation-only twin on the vendor lane; it never drives a
// write and is out of this packet's radius — named in the handover, not folded.)
// `users.phone` is E.164 with a leading `+` (src/api/pin-status.js:108); the lead a
// forward creates carries the couple's E.164 phone from `users` when a couple row
// exists, so `createLead`'s (vendor_id, phone) dedupe meets the enquiry door's
// format (src/api/couple/enquire.js:358, hydratedPhone). For an admin-typed
// request with no couple yet, the lead phone is `+` + DEFAULT_COUNTRY + last ten.
//
// ── PROVENANCE (SQL-provenance law) ─────────────────────────────────────────
// Own tables: db/migrations/0148_assistance_requests.sql, sections 1–3.
// couples (:396 block, 0138 snapshot): id :399 · user_id :400 · wedding_date :402 · wedding_city :403
// users   (:1066 block): id :1069 · phone :1070 · name :1071
// vendors (:1198 block): id :1201 · business_name :1203 · category :1204 · city :1206 ·
//         status :1209 · routing_handle :1215 · discover_paused :1240 ·
//         peer_discoverable — db/migrations/0142_referral_alerts.sql §2 (post-0138; regen owed, R-41.9)
// prospects (:918 block): id :921 · phone :922 · name :923 · ig_handle :924 · category :925 ·
//         city :926 · source :927 · state :928 · notes :930 ·
//         constraints :1895-:1905 — prospects_source_check (sheet|manual|other),
//         prospects_state_check, prospects_phone_key UNIQUE (phone)
// leads: written only through createLead (src/lib/vendor/leads.js:164); no column named here.
//
// ── THE SEND ARMS ARE DARK (R-41.8, R-41.20) ────────────────────────────────
// The outsider forward's template send sits FULLY COMMENTED behind
// `cap.on('template.tdw_assist_lead_outside_v2')` (R-41.118; v1's key retired in 0155) — the read is a stub returning
// false until seat C ships the register. The bride "we found you" templates are
// seat D's (roadmap §2 row D). Template names and Meta ids, filed by seat B and
// Active at Meta 2026-09-08, are recorded in TEMPLATE_REFS below so the arm that
// wakes them names them from one place.

'use strict';

const { createLead } = require('../vendor/leads');
const { VENDOR_CATEGORIES } = require('../../agent/categories');
const { normalizeTo } = require('../metaCloud');
const cap = require('../capabilities');
const { monthPhrase } = require('../discover/demoLeadAlert');   // its ONE HOME (enquire.js:67 names the same coupling)
const { logWaSend } = require('../waSendLog');                  // R-41.90: the estate's one send-log grammar, masked recipient
const VENDOR_LEADS_URL = require('../pwaPaths').vendorUrl('leadsList');

const TDW_ASSIST_SOURCE = 'tdw_assist';
const TDW_REFERRER_NAME = 'The Dream Wedding';
const DEFAULT_COUNTRY = '91';       // India-only BY RULING (R-41.34); one home for the assumption
const FANOUT_DEFAULT = 3;           // §6.2 ruled: 3 per category, admin override in the queue

// ── R-41.131 · THE LINK THE FOUNDER SENDS HER ────────────────────────────────
// She taps it, WhatsApp opens on OUR marketing line with the message pre-typed, and
// her first send both opens the 24h window AND names the enquiry. That is why the
// token is in the text and not only in the URL: a `wa.me` link carries no metadata
// through, so the only thing that survives her tapping it is what she sends.
//
// THE TOKEN IS `enq-<first eight hex of the item id>` — the SAME prefix family as
// R-41.119's button suffix, deliberately. One vocabulary: a reader who has seen
// `enq-` on the `/r/` route knows what this is without being told twice.
// Eight hex is a uuid's first block; it is not a secret and does not need to be —
// it names an enquiry, and the page behind it shows no phone (F-41.128).
//
// THE NUMBER IS DERIVED, NEVER TYPED. `MARKETING_WHATSAPP_NUMBER` holds the E.164 in
// Twilio dress (`whatsapp:+918810531764`) and `normalizeTo` (metaCloud.js:65) already
// folds `whatsapp:` and `+` to bare digits — the one home, not a sibling. F-41.149
// records that this variable was documented as a Meta phone-number-id and is not one;
// deriving through normalizeTo means the link is right whichever dress the value wears.
function enquiryToken(itemId) {
  const hex = String(itemId || '').replace(/[^0-9a-f]/gi, '').slice(0, 8).toLowerCase();
  return hex.length === 8 ? `enq-${hex}` : null;
}

function enquiryWaLink(itemId, deps = {}) {
  const raw = deps.marketingNumber || process.env.MARKETING_WHATSAPP_NUMBER || '';
  const number = normalizeTo(raw);
  const token = enquiryToken(itemId);
  // No number or no token → NO LINK. A half-built wa.me URL opens WhatsApp on nothing
  // and looks like the estate is working; null is the honest answer and the queue
  // simply shows no link.
  if (!number || !token) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Send me the enquiry ${token}`)}`;
}
// F-41.37 / R-41.68 — the vendor is TOLD a concierge forward landed, by the same
// Utility alert the enquiry door sends (registry key lead_alert_utility), behind a
// register flag seeded OFF in 0151: a new send to real vendors walks before it is on.
const ASSIST_FORWARD_ALERT_FLAG = 'flag.assist_forward_alert';
const FORWARD_ALERT_TEMPLATE_KEY = 'lead_alert_utility';
const MAX_ITEMS = VENDOR_CATEGORIES.length;
const MAX_SEARCH = 10;              // R-40.72's ≤10 precedent for a forward list

// Filed by seat B; referenced, never sent, in s1.
const TEMPLATE_REFS = Object.freeze({
  // R-41.118 - THE OUTSIDER ALERT IS v2, AND IT IS UTILITY.
  // v1 was Marketing filed as Utility (R-41.30, "accept, no appeal"), and the
  // per-user MARKETING cap is what refused it: 131049, four times, on one test
  // handset in a single night. The honest Utility shape existed all along - an
  // ENQUIRY NOTICE, not an invitation - and the re-file found it. v1's key is
  // retired in 0155; its rows keep their words (S2-5 is keyed on the code, and
  // 131049 cannot arise on a Utility send, so the sentence stays true for the
  // rows that carry it).
  // CATEGORY AND LINE ARE INDEPENDENT: Utility on the MARKETING PNID. Receipts
  // therefore stay on marketingIndex's arm, which F-41.60 gave applyStatusEvent.
  lead_outside:  { name: 'tdw_assist_lead_outside_v2', meta_id: '2544506315978894', category: 'UTILITY',  line: 'marketing' },
  // R-41.4(b)/(c) - the two bride arms. Derived from docs/TEMPLATES.md rows 11
  // and 12 (seat B's Manager readings), NEVER authored beside them: row 10's
  // whole lesson was an entry written independently of its filing.
  // found_vendor is IN REVIEW at Meta, not Active (F-41.114 re-filed its button),
  // so its key stays shut until the Manager says otherwise. The register is what
  // tells us; this constant records only what was witnessed.
  found_vendor:  { name: 'tdw_assist_found_vendor',    meta_id: '3160852754105015', category: 'UTILITY',  line: 'bride' },
  found_outside: { name: 'tdw_assist_found_outside',   meta_id: '3115277355330375', category: 'UTILITY',  line: 'bride' },
  found_vendor:  { name: 'tdw_assist_found_vendor',  meta_id: '3160852754105015', category: 'UTILITY',   line: 'bride' },
  found_outside: { name: 'tdw_assist_found_outside', meta_id: '3115277355330375', category: 'UTILITY',   line: 'bride' },
});

const REFUSE = Object.freeze({
  NO_PHONE:        'no_phone',
  NO_ITEMS:        'no_items',
  BAD_CATEGORY:    'bad_category',
  BAD_BUDGET:      'bad_budget',
  TOO_MANY_ITEMS:  'too_many_items',
  NOT_FOUND:       'not_found',
  CLOSED:          'closed',
  VENDOR_UNAVAILABLE: 'vendor_unavailable',
  ALREADY_HAS:     'peer_already_has',
  BAD_TARGET:      'bad_target',
  // F-41.151 — she is already one of ours. Not a failure: a REDIRECT, and the queue
  // offers the TDW forward that was the right door all along.
  ALREADY_A_VENDOR: 'already_a_vendor',
  // F-41.100 / R-41.123 — the ruled cap, warn-and-confirm. Not a wall: the founder
  // can pass it, but he passes it ON PURPOSE.
  FANOUT_REACHED:  'fanout_reached',
  // R-41.122 — Meta Messaging Policy §1's two limbs, refused under one code because
  // the founder's next step is the same either way: go back to the DM and get her
  // words. The SENTENCE distinguishes them; the code does not need to.
  NO_CONSENT_RECORD: 'no_consent_record',
});

// ── normalizePhone — the one home (R-41.29) ─────────────────────────────────
// Last ten digits or null. Accepts anything a human or a session hands over:
// "+91 96257 59924", "919625759924", "9625759924", "whatsapp:+91…".
function normalizePhone(raw) {
  if (raw === null || raw === undefined) return null;
  const digits = String(raw).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function e164FromLastTen(lastTen) {
  return lastTen ? `+${DEFAULT_COUNTRY}${lastTen}` : null;
}

function isCanonicalCategory(c) {
  return typeof c === 'string' && VENDOR_CATEGORIES.includes(c);
}

function toWholeRupees(v) {
  if (v === null || v === undefined || v === '') return null;
  const digits = typeof v === 'number' ? String(v) : String(v).replace(/[^\d]/g, '');
  if (digits === '') return NaN;                 // "lots" is not a number of rupees
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n);
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

// ── createAssistanceRequest — the sole writer of requests + items ───────────
// params: { couple_id?, phone, name?, city?, area?, wedding_date?, brief?, origin,
//           items: [{ category, budget_rs }] }
// Returns { ok, request, items } or { ok:false, code, error }.
async function createAssistanceRequest(supabase, params, deps = {}) {
  const p = params || {};
  const phone = normalizePhone(p.phone);
  if (!phone) return { ok: false, code: REFUSE.NO_PHONE, error: 'A ten-digit phone is required.' };

  const rawItems = Array.isArray(p.items) ? p.items : [];
  if (rawItems.length === 0) return { ok: false, code: REFUSE.NO_ITEMS, error: 'Pick at least one category.' };
  if (rawItems.length > MAX_ITEMS) return { ok: false, code: REFUSE.TOO_MANY_ITEMS, error: 'Too many categories.' };

  const items = [];
  const seen = new Set();
  for (const it of rawItems) {
    const category = it && it.category;
    if (!isCanonicalCategory(category)) {
      return { ok: false, code: REFUSE.BAD_CATEGORY, error: `Unknown category: ${String(category)}` };
    }
    if (seen.has(category)) continue;          // the sheet cannot send one trade twice
    seen.add(category);
    const budget_rs = toWholeRupees(it.budget_rs);
    if (Number.isNaN(budget_rs)) return { ok: false, code: REFUSE.BAD_BUDGET, error: 'Budgets are whole rupees.' };
    items.push({ category, budget_rs });
  }

  const origin = ['bride', 'admin', 'public'].includes(p.origin) ? p.origin : 'bride';

  // R-41.69 (F-41.43): an admin-typed (or public) request for a phone that already
  // belongs to a couple attaches her couple_id AT WRITE, so her own read (F-41.29)
  // sees it. users.phone is E.164 (:1070); couples.user_id (:400) joins it. Seat D's
  // backfill is for couples who join LATER; this is the one home for the match now.
  let couple_id = p.couple_id || null;
  if (!couple_id) couple_id = await findCoupleIdByLastTen(supabase, phone);

  const { data: request, error: reqErr } = await supabase
    .from('assistance_requests')
    .insert({
      couple_id,
      phone,
      name:         p.name ? String(p.name).trim().slice(0, 120) : null,
      city:         p.city ? String(p.city).trim().slice(0, 120) : null,
      area:         p.area ? String(p.area).trim().slice(0, 120) : null,
      wedding_date: toDateOrNull(p.wedding_date),
      brief:        p.brief ? String(p.brief).trim().slice(0, 2000) : null,
      origin,
      status:       'open',
    })
    .select('id, couple_id, phone, name, status, city, area, wedding_date, brief, origin, created_at')
    .single();
  if (reqErr) return { ok: false, code: 'insert_failed', error: `Could not file the request: ${reqErr.message}` };

  const { data: rows, error: itemErr } = await supabase
    .from('assistance_request_items')
    .insert(items.map(i => ({ request_id: request.id, category: i.category, budget_rs: i.budget_rs })))
    .select('id, request_id, category, budget_rs, forwarded_count, created_at');
  if (itemErr) {
    // The request row stands (she did her part); the items did not. Loud, never silent.
    console.error(`[assistance:create] items INSERT FAILED for request ${request.id}: ${itemErr.message}`);
    return { ok: false, code: 'items_failed', error: `Could not file the categories: ${itemErr.message}`, request };
  }

  // ── The founder's notify — CARRIED from the folded door, not invented ────
  // src/api/couple/concierge.js (pre-fold) sent one WhatsApp line to ADMIN_PHONE
  // on every request (F-07.76: env-only recipient, absent env is a LOUD SKIP;
  // F-05.48: the door reads its own result, `sent === true` is the only honest
  // key). Deleting that notify silently would be a regression; it rides here so
  // the founder still hears a request land. Free-form text on the existing
  // session lane — NOT a template, NOT gated, exactly as before.
  const notify = await notifyFounder(supabase, request, rows, deps);

  return { ok: true, request, items: rows || [], notify };
}

// ── THE FOUNDER'S NOTIFY · F-41.26 / R-41.63 — a Utility TEMPLATE, live ──────
// The free-form line carried from the folded door failed at Meta 131047
// (re-engagement) outside the 24-hour window — the founder's glass, 2026-09-08
// 18:00:57. It now rides `tdw_admin_assist_request` (Utility, founder-filed,
// Meta ID 1106894635324625, registry key `admin_assist_request`) through the
// estate's one template-send home, `sendWa` (src/lib/sendWa.js:189), on the
// VENDOR line to ADMIN_PHONE only (env, F-07.76; unset ⇒ LOUD SKIP).
//
// THE MECHANISM, with its condition (F-06.85 convention): `sendWa` has FIVE
// exits and FOUR of them THROW —
//   registry/approval   -> THROWS WaTemplateNotApprovedError     (sendWa.js:218)
//   vars                -> THROWS WaTemplateVarsError            (sendWa.js:228)
//   opted out           -> THROWS WaOptedOutError                (sendWa.js:209)
//   no FROM for line    -> THROWS WaLineNotConfiguredError       (sendWa.js:206)
//   sent                -> RETURNS { sent:true, mode:'template', result:{ wamid } } (sendWa.js:234)
// So every refusal is a NAMED throw caught below and written to the row as
// notify_status='failed' + notify_error_code (R-41.30's shape, R-40.110's home),
// and success is `out.sent === true` STRICTLY with `out.result.wamid` the only
// honest handle (metaCloud.js:208 admits null). No bare `await sendWa(`.
// [F-06.85: this paragraph is conditioned on those five exits; if sendWa gains
//  or loses one it is false and must be re-read before this block is trusted.]
// The row's notify_* columns: db/migrations/0150_assistance_notify_wamid.sql.
async function notifyFounder(supabase, request, items, deps) {
  const ADMIN_PHONE = (deps.env || process.env).ADMIN_PHONE;
  const sendWaFn = deps.sendWa || require('../sendWa').sendWa;
  const vars = {
    couple_name:      request.name || 'a couple',
    date_words:       monthDayYear(request.wedding_date) || 'a date to be decided',
    city:             request.city || 'a city to be decided',
    categories_words: categoriesWords((items || []).map(i => i.category)),
    budget_rs:        formatRs((items || []).reduce((n, i) => n + (Number(i.budget_rs) || 0), 0)),
  };

  const record = async (patch) => {
    try {
      await supabase.from('assistance_requests')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', request.id);
    } catch (e) { console.error(`[assistance:create] notify_* write failed for ${request.id}: ${e && e.message}`); }
  };

  if (!ADMIN_PHONE) {
    console.error(`[assistance:create] ADMIN_PHONE is not set — NO founder notify sent for request ${request.id} (F-07.76). The request IS on file.`);
    await record({ notify_status: 'skipped', notify_error_code: 'admin_phone_unset' });
    return { sent: false, refusal: 'admin_phone_unset', wamid: null };
  }
  try {
    const out = await sendWaFn({ line: 'vendor', to: ADMIN_PHONE, templateKey: 'admin_assist_request', vars, supabase });
    const sent = !!(out && out.sent === true);
    const wamid = sent && out.result && out.result.wamid ? String(out.result.wamid) : null;
    if (!sent) {
      console.error(`[assistance:create] founder notify REFUSED (unknown) for request ${request.id}. The request IS on file.`);
      await record({ notify_status: 'failed', notify_error_code: 'unknown' });
      return { sent: false, refusal: 'unknown', wamid: null };
    }
    await record({ notify_wamid: wamid, notify_status: wamid ? 'sent' : 'sent_no_wamid', notify_sent_at: new Date().toISOString() });
    return { sent: true, refusal: null, wamid };
  } catch (err) {
    const code = (err && (err.code || err.name)) || 'send_failed';
    console.error(`[assistance:create] founder notify THREW (${code}: ${err && err.message}) for request ${request.id}. The request IS on file.`);
    await record({ notify_status: 'failed', notify_error_code: String(code).slice(0, 80), notify_error_title: String(err && err.message || '').slice(0, 500) });
    return { sent: false, refusal: code, wamid: null };
  }
}

// "22 December 2026" — words, never a locale abbreviation.
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function monthDayYear(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Tokens → plain words for a message body: "photography and makeup".
const CATEGORY_WORDS = Object.freeze({
  planning: 'planning', designer: 'outfits', photography: 'photography', makeup: 'makeup', hairstylist: 'hair',
  jewellery: 'jewellery', decor: 'décor', venue_catering: 'venue and catering', performer: 'music and anchors',
  content_creator: 'content', other: 'mehendi and more',
});
// "February 2027" — the body reads "for a wedding in {{4}}".
function monthYearOnly(iso) {
  const w = monthDayYear(iso);
  if (!w) return null;
  const parts = w.split(' ');
  return `${parts[1]} ${parts[2]}`;
}

// ── F-41.80 · THE BODY SUPPLIES THE ARTICLE, SO THE VALUE MUST NOT ──────────
// Meta's body reads "...to find them a {{4}}" (docs/TEMPLATES.md §2 row 10, and
// the founder's Manager preview renders the filed sample as "a makeup artist",
// i.e. Meta's own sample for {{4}} is the BARE NOUN). The map below used to be
// CATEGORY_ARTICLE and carried the article in the VALUE — correct against the
// PRE-F-41.63 body, which read "is looking for {{3}}" with no article of its own.
// F-41.63 replaced the body and did not re-read the values the new body expects,
// so every outsider join alert rendered "find them a a makeup artist". Live on
// real outsiders until this rider. THE LESSON, NAMED: a literal and its value
// COMPOSE; a slot-order cure that treats literals as inert is one layer short.
// [F-06.85: this map is conditioned on the body supplying the article. If the
//  body ever loses its "a ", these values are wrong again — b64 §3 composes the
//  two and reds on "a a"/"a an", so the next sitting is forced to re-read this.]
// Sole reader: categoryNoun below. Derived by command at 18e46be — CATEGORY_WORDS
// and categoriesWords (the founder's notify) are a SEPARATE home and untouched.
const CATEGORY_NOUN = Object.freeze({
  planning: 'wedding planner', designer: 'outfit designer', photography: 'photographer',
  makeup: 'makeup artist', hairstylist: 'hairstylist', jewellery: 'jeweller', decor: 'decorator',
  venue_catering: 'venue and caterer', performer: 'performer', content_creator: 'content creator',
  other: 'mehendi artist or similar',
});
function categoryNoun(token) { return CATEGORY_NOUN[token] || 'vendor'; }

function categoriesWords(tokens) {
  const w = (tokens || []).map(t => CATEGORY_WORDS[t] || t);
  if (w.length === 0) return 'vendors';
  if (w.length === 1) return w[0];
  return `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}`;
}

// Indian grouping, no glyph (wallet law). Twin of witnessLine.rupees for the
// notify line only; the PWA renders with its own home (formatRs, c-41.2).
function formatRs(n) {
  const s = String(Math.round(Number(n) || 0));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

// The last-ten → couple_id match (R-41.69). `users.phone` is E.164; `like '%<ten>'`
// is the same join law prospects use. Two users sharing a last-ten (a country-code
// twin) → attach nothing rather than guess.
async function findCoupleIdByLastTen(supabase, lastTen) {
  if (!lastTen) return null;
  const { data: users } = await supabase.from('users').select('id, phone').like('phone', `%${lastTen}`).limit(2);
  if (!Array.isArray(users) || users.length !== 1) return null;
  const { data: couple } = await supabase.from('couples').select('id, user_id').eq('user_id', users[0].id).maybeSingle();
  return couple ? couple.id : null;
}

// ── loadItemWithRequest — the forward's ground truth ────────────────────────
async function loadItem(supabase, itemId) {
  const { data: item } = await supabase
    .from('assistance_request_items')
    .select('id, request_id, category, budget_rs, forwarded_count')
    .eq('id', itemId)
    .maybeSingle();
  if (!item) return null;
  const { data: request } = await supabase
    .from('assistance_requests')
    .select('id, couple_id, phone, name, status, city, area, wedding_date, brief, origin')
    .eq('id', item.request_id)
    .maybeSingle();
  if (!request) return null;
  return { item, request };
}

// The couple's E.164 phone and name from users, when a couple row exists.
async function coupleContact(supabase, request) {
  if (!request.couple_id) {
    return { phone: e164FromLastTen(request.phone), name: request.name || null };
  }
  const { data: couple } = await supabase
    .from('couples')
    .select('id, user_id')
    .eq('id', request.couple_id)
    .maybeSingle();
  if (!couple || !couple.user_id) return { phone: e164FromLastTen(request.phone), name: request.name || null };
  const { data: user } = await supabase
    .from('users')
    .select('id, phone, name')
    .eq('id', couple.user_id)
    .maybeSingle();
  return {
    phone: (user && user.phone) || e164FromLastTen(request.phone),
    name:  request.name || (user && user.name) || null,
  };
}

// ── forwardAssistanceItem — the sole writer of assistance_forwards ──────────
// target: { kind:'vendor', vendor_id } | { kind:'prospect', phone, ig_handle?, name? }
// Returns { ok, forward, lead?, prospect?, dark?: {reason} } or { ok:false, code, error }.
async function forwardAssistanceItem(supabase, { itemId, target, actor, confirm } = {}, deps = {}) {
  const loaded = await loadItem(supabase, itemId);
  if (!loaded) return { ok: false, code: REFUSE.NOT_FOUND, error: 'No such item.' };
  const { item, request } = loaded;
  if (request.status === 'closed') return { ok: false, code: REFUSE.CLOSED, error: 'This request is closed.' };

  // ── F-41.100 / R-41.123 · THE CAP IS ENFORCED, AND IT ASKS ────────────────
  // §6.2 ruled three per category with an admin override, and NOTHING EVER CHECKED
  // IT: FANOUT_DEFAULT was read only to be handed to the queue for display, while
  // bumpForwarded incremented unconditionally. The founder's walk showed `6 of 3`
  // today. A number the code never keeps is worse than no number — it reads as a rule.
  //
  // WARN AND CONFIRM, NOT A WALL. The override was always part of the ruling, so this
  // refuses ONCE and says what he is about to do; `confirm: true` on the retry passes.
  // The fourth forward becomes a DECISION rather than an accident or an impossibility.
  //
  // IT GATES ON THE ITEM, ABOVE BOTH ARMS. The cap counts how many vendors have seen
  // this category — a TDW vendor counts exactly as much as an outsider — so it cannot
  // live inside either arm without being half a rule.
  if (!confirm && (item.forwarded_count || 0) >= FANOUT_DEFAULT) {
    console.log(`[assistance:forward] item=${item.id} at ${item.forwarded_count || 0}/${FANOUT_DEFAULT} \u2014 REFUSED fanout_reached, awaiting confirm`);
    return {
      ok: false,
      code: REFUSE.FANOUT_REACHED,
      forwarded_count: item.forwarded_count || 0,
      fanout_default: FANOUT_DEFAULT,
      error: `This is ${(item.forwarded_count || 0) + 1} of ${FANOUT_DEFAULT} for ${categoryNoun(item.category)}. Forward anyway?`,
    };
  }

  const kind = target && target.kind;
  if (kind === 'vendor')   return forwardToVendor(supabase, { item, request, target, actor }, deps);
  if (kind === 'prospect') return forwardToProspect(supabase, { item, request, target, actor }, deps);
  return { ok: false, code: REFUSE.BAD_TARGET, error: 'target.kind must be vendor or prospect.' };
}

async function forwardToVendor(supabase, { item, request, target }, deps) {
  // The peer-search predicate, with TDW as the actor (roadmap §2; referrals.js:158-:185):
  //   status='active' AND discover_paused=false AND peer_discoverable=true.
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, user_id, business_name, category, city, status, discover_paused, peer_discoverable, routing_handle')
    .eq('id', target.vendor_id)
    .maybeSingle();
  if (!vendor || vendor.status !== 'active' || vendor.discover_paused === true || vendor.peer_discoverable !== true) {
    return { ok: false, code: REFUSE.VENDOR_UNAVAILABLE, error: 'That vendor cannot receive forwards.' };
  }

  const contact = await coupleContact(supabase, request);
  const createLeadFn = deps.createLead || createLead;
  const created = await createLeadFn(supabase, vendor.id, {
    name:          contact.name,
    phone:         contact.phone,
    wedding_date:  request.wedding_date,
    wedding_city:  request.city,
    budget_max:    item.budget_rs,
    source:        TDW_ASSIST_SOURCE,
    referrer_name: TDW_REFERRER_NAME,
    raw_message:   request.brief,
    notes:         `assistance_request ${request.id}`,
  });
  if (!created.ok) return { ok: false, code: 'lead_failed', error: created.error };
  if (created.deduped) {
    // referrals.js:256's refusal, same reason: the vendor already holds this couple.
    return { ok: false, code: REFUSE.ALREADY_HAS, error: 'This vendor already has a lead with this phone number.' };
  }

  const forward = await writeForward(supabase, {
    item_id: item.id, target_kind: 'vendor', vendor_id: vendor.id, prospect_id: null,
    lead_id: created.lead.id, wamid: null, status: 'recorded',
  });
  if (!forward.ok) return forward;
  await bumpForwarded(supabase, item, request);
  console.log(`[assistance:forward] item=${item.id} → vendor=${vendor.routing_handle || vendor.id} lead=${created.lead.id} source=${TDW_ASSIST_SOURCE}`);
  const alert = await alertVendorOfForward(supabase, { forwardId: forward.row.id, vendor, request }, deps);
  // R-41.4(b) — and SHE is told. Its own gate, its own row. A failure here NEVER
  // unwinds the forward: the lead exists and the vendor has been alerted whether or
  // not her notice went out, and the notice's own row carries why it did not.
  const found = await notifyCoupleOfFound(supabase,
    { forwardId: forward.row.id, kind: 'found_vendor', request, item, vendor }, deps);
  return { ok: true, forward: { ...forward.row, status: alert.status, wamid: alert.wamid }, lead: created.lead,
           vendor: { id: vendor.id, business_name: vendor.business_name, routing_handle: vendor.routing_handle }, alert, found };
}

// ── R-41.122 · THE CONSENT RECORD, AND WHAT EACH LIMB ACTUALLY ASKS ──────────
// Meta Messaging Policy §1: a business may message a person only if (a) SHE GAVE
// THE NUMBER and (b) SHE CONSENTED. docs/filings/META_MESSAGING_POLICY_READ.md:31
// records the strict reading of (a) — TDW obtaining the number and her merely
// agreeing to its use satisfies (b) alone. The amended R-41.122 cures both by
// asking her, in the DM, to SUPPLY the number: her reply then evidences (a) by
// containing it and (b) by existing.
//
// LIMB (a) IS A COMPARISON BETWEEN HER WORDS AND THE ROW'S PHONE, and it lives here
// rather than in a CHECK constraint for two reasons: it spans two columns that may
// be written in either order, and its refusal must carry a sentence the founder can
// act on. A CHECK can only say no.
//
// The extraction is deliberately blunt: every digit run in her words, each folded to
// its last ten, compared against the row's last ten. "+91 98765 43210",
// "9876543210", "my number is 098765-43210" all fold to the same ten — the estate's
// join law (R-41.29) applied to prose instead of a field. It does NOT try to find
// "the phone number" in her sentence; picking the right number out of free text is a
// guess, and any run that folds to her row's phone is proof enough that she wrote it.
// The queue's view of the same reading. One home: the pwa renders THIS, and never
// re-derives "is there a record" from consent_text itself — two opinions on one
// fact is how a row says No consent on file beside a record that exists.
// R-41.133 — THREE STATES, AND THE QUEUE MUST NEVER RE-DERIVE THEM. The pwa renders
// what this returns and never reads consent_source itself: two opinions on one fact
// is how a row says "No consent on file" beside a record that exists.
//
//   her_words        — she replied and her reply carries the number. Strongest.
//   founder_attested — TDW is speaking, not her. The founder's habit, made a tap and
//                      labelled as his. Real evidence, weaker than hers, never dressed
//                      as hers.
//   none             — no record at all. The DM thread is still the record (R-41.125);
//                      what is missing is TDW's copy of it.
//
// `limb` is kept on the `none` state because it says WHICH limb is unevidenced, and
// the founder's next move differs: limb (b) means ask her, limb (a) means ask her to
// send the number herself.
const CONSENT_ATTESTED_SOURCE = 'founder_attested';

// F-41.151's lookup, and the only place the estate asks "is this number ours?".
// phone → users → vendors, because `vendors` HAS NO PHONE COLUMN (verified at the
// cut: it carries routing_handle and user_id). Returns null for a number that is not
// a vendor's, which is the ordinary case and must stay cheap.
// ⚠ SHAPED ON findCoupleIdByLastTen (:390), NOT INVENTED. Its first cut pulled EVERY
// user row into memory and matched in JS — a full table scan on the ordinary path,
// where the ordinary answer is "not a vendor". The estate already had the right
// shape one function up: filter in Postgres with `like '%<ten>'`, take two, and
// REFUSE TO GUESS between country-code twins rather than picking the first.
// Two users sharing a last ten → null, exactly as R-41.69 rules for the couple side:
// a wrong redirect naming someone else's handle is worse than no redirect.
async function vendorForPhone(supabase, phone) {
  const ten = normalizePhone(phone);
  if (!ten) return null;
  const { data: users } = await supabase.from('users').select('id, phone').like('phone', `%${ten}`).limit(2);
  if (!Array.isArray(users) || users.length !== 1) return null;
  const { data: vendor } = await supabase
    .from('vendors').select('id, routing_handle, business_name, user_id')
    .eq('user_id', users[0].id).maybeSingle();
  return vendor || null;
}

function consentState(c, prospect) {
  if (prospect && prospect.consent_source === CONSENT_ATTESTED_SOURCE && prospect.consent_text) {
    return { state: 'founder_attested', limb: null };
  }
  if (c && c.ok) return { state: 'her_words', limb: null };
  return { state: 'none', limb: (c && c.limb) || 'b' };
}

function consentEvidences(prospect) {
  const text = prospect && prospect.consent_text;
  // limb (b) — she said something, and it was recorded.
  if (text == null || String(text).trim().length === 0) {
    return { ok: false, limb: 'b', error: 'No consent record for this number. Ask her in the DM and paste her reply before forwarding.' };
  }
  // limb (a) — her words carry the number.
  const rowTen = normalizePhone(prospect.phone);
  const runs = String(text).match(/\d[\d\s\-()]{7,}\d/g) || [];
  const said = runs.some((r) => {
    const digits = r.replace(/\D/g, '');
    return digits.length >= 10 && digits.slice(-10) === rowTen;
  });
  if (!said) {
    return { ok: false, limb: 'a', error: 'Her reply does not contain this number. Meta needs her to have given it herself \u2014 ask again in the DM and paste the reply.' };
  }
  return { ok: true };
}

// ── R-41.4(b)/(c) · TELLING HER WE FOUND SOMEONE ─────────────────────────────
// The couple-facing half of a forward. It fires PER FORWARD, not per request: a
// couple whose photography reaches three vendors hears three times, once each, and
// 0158's UNIQUE on forward_id makes that structural rather than a convention.
//
// ⚠ THIS IS THE ONLY ARM IN THIS FILE THAT SPEAKS TO THE COUPLE. The other three
// send to the founder, the vendor and the outsider. It therefore rides the BRIDE
// line and `coupleContact` — the one home for her number (R-41.29), which prefers
// her `users.phone` over the request's last ten and falls back only when she has no
// account yet.
//
// GATED LIKE EVERY OTHER SEND: its own register key, its own dark row, its own
// refusal words. A key that is off writes the notice as `dark` and sends nothing —
// the founder sees the plane is shut rather than wondering why she was not told.
//
// NO PHONE OF THE VENDOR'S OR THE OUTSIDER'S RIDES THIS BODY. Roadmap §7's refusal
// runs both ways: her number never leaves with an outsider, and an outsider's never
// arrives with her. The outsider arm carries an INSTAGRAM HANDLE, which is public.
async function notifyCoupleOfFound(supabase, { forwardId, kind, request, item, vendor, prospect }, deps = {}) {
  const capFn = (deps.cap && deps.cap.on) || cap.on;
  const reasonFn = (deps.cap && deps.cap.reason) || cap.reason;
  const key = kind === 'found_vendor'
    ? cap.CAPABILITY_KEYS.TDW_ASSIST_FOUND_VENDOR
    : cap.CAPABILITY_KEYS.TDW_ASSIST_FOUND_OUTSIDE;

  // One row per forward, written BEFORE the send so a process that dies mid-flight
  // leaves a row the boot reconciler can see — F-41.81's lesson, applied at birth
  // rather than after a walk found two rows stranded at `queued`.
  const armed = capFn(key) === true;
  const { data: notice, error: insErr } = await supabase
    .from('assistance_found_notices')
    .insert({ forward_id: forwardId, kind, status: armed ? 'queued' : 'dark' })
    .select('id, forward_id, kind, status')
    .single();
  if (insErr) {
    console.error(`[assistance:found] forward=${forwardId} could not file the notice: ${insErr.message}`);
    return { sent: false, status: 'failed', wamid: null, refusal: 'notice_failed' };
  }
  const record = async (patch) => {
    try {
      await supabase.from('assistance_found_notices')
        .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', notice.id);
    } catch (e) { console.error(`[assistance:found] could not record on notice ${notice.id}: ${e && e.message}`); }
  };

  if (!armed) {
    const why = reasonFn ? reasonFn(key) : `${key} is off`;
    console.log(`[assistance:found] forward=${forwardId} kind=${kind} status=dark — NOT SENT: ${why}`);
    return { sent: false, status: 'dark', wamid: null, refusal: why };
  }

  const contact = await coupleContact(supabase, request);
  if (!contact || !contact.phone) {
    await record({ status: 'failed', error_code: 'no_couple_phone' });
    console.log(`[assistance:found] forward=${forwardId} has no couple phone — NOT SENT`);
    return { sent: false, status: 'failed', wamid: null, refusal: 'no_couple_phone' };
  }

  // Both bodies take the trade as a BARE NOUN — "matched a {{2}}" / "matched to a
  // {{3}}" — so both use categoryNoun. F-41.80 is what happens when the value
  // carries an article the literal already supplies, and b64 §3 composes the two
  // for every entry with a trade slot.
  const vars = kind === 'found_vendor'
    ? {
        name:          contact.name || 'there',
        category_noun: categoryNoun(item.category),
        month_year:    monthDayYear(request.wedding_date) ? monthYearOnly(request.wedding_date) : 'a date to be decided',
        vendor_name:   (vendor && (vendor.business_name || vendor.routing_handle)) || 'a vendor',
        routing_handle: (vendor && vendor.routing_handle) || '',   // the url button's suffix, NOT a body slot
      }
    : {
        name:          contact.name || 'there',
        month_year:    monthDayYear(request.wedding_date) ? monthYearOnly(request.wedding_date) : 'a date to be decided',
        category_noun: categoryNoun(item.category),
        ig_handle:     (prospect && prospect.ig_handle) ? `@${String(prospect.ig_handle).replace(/^@/, '')}` : 'their profile',
      };

  const sendWaFn = deps.sendWa || require('../sendWa').sendWa;
  try {
    const out = await sendWaFn({
      line: 'bride', to: contact.phone, templateKey: kind === 'found_vendor' ? 'assist_found_vendor' : 'assist_found_outside',
      vars, supabase, site: 'assistance:found', ctx: `forward=${forwardId}`,
    });
    const sent = !!(out && out.sent === true);
    const wamid = sent && out.result && out.result.wamid ? String(out.result.wamid) : null;
    if (!sent) {
      await record({ status: 'failed', error_code: 'unknown' });
      console.log(`[assistance:found] forward=${forwardId} kind=${kind} REFUSED (unknown)`);
      return { sent: false, status: 'failed', wamid: null, refusal: 'unknown' };
    }
    await record({ status: wamid ? 'sent' : 'sent_no_wamid', wamid, sent_at: new Date().toISOString() });
    console.log(`[assistance:found] forward=${forwardId} kind=${kind} wamid=${wamid || 'nowamid'}`);
    return { sent: true, status: wamid ? 'sent' : 'sent_no_wamid', wamid, refusal: null };
  } catch (err) {
    const code = (err && (err.code || err.name)) || 'send_failed';
    await record({ status: 'failed', error_code: code, error_title: err && err.message ? String(err.message).slice(0, 200) : null });
    console.log(`[assistance:found] forward=${forwardId} kind=${kind} THREW (${code})`);
    return { sent: false, status: 'failed', wamid: null, refusal: code };
  }
}

// ── alertVendorOfForward — F-41.37 / R-41.68 ────────────────────────────────
// The lead exists; the vendor is told the way every other lead door tells her:
// `lead_alert_utility` (Utility, approved) on the vendor line to her users.phone.
// GATE: cap.on('flag.assist_forward_alert') — seeded OFF (0151); the founder flips
// it on the Switchboard after walking one live alert. While off: the forward row
// says `dark` and the log says why (cap.reason). While on: sendWa's named throws
// land as `failed` + error code on the row; the wamid lands on assistance_forwards
// .wamid — the R-40.110 home A2 built dark — and the fourth router arm carries
// the receipts. `sent === true` strictly; the result is bound, never discarded.
async function alertVendorOfForward(supabase, { forwardId, vendor, request }, deps = {}) {
  const capFn = (deps.cap && deps.cap.on) || cap.on;
  const reasonFn = (deps.cap && deps.cap.reason) || cap.reason;
  const record = async (patch) => {
    try { await supabase.from('assistance_forwards').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', forwardId); }
    catch (e) { console.error(`[assistance:forward-alert] row write failed for ${forwardId}: ${e && e.message}`); }
  };
  if (capFn(ASSIST_FORWARD_ALERT_FLAG) !== true) {
    const why = reasonFn ? reasonFn(ASSIST_FORWARD_ALERT_FLAG) : `${ASSIST_FORWARD_ALERT_FLAG} is off`;
    console.log(`[assistance:forward-alert] forward=${forwardId} vendor=${vendor.routing_handle || vendor.id} status=dark — NOT SENT: ${why}`);
    await record({ status: 'dark' });
    return { sent: false, status: 'dark', wamid: null, refusal: why };
  }
  const { data: user } = await supabase.from('users').select('id, phone').eq('id', vendor.user_id).maybeSingle();
  if (!user || !user.phone) {
    console.error(`[assistance:forward-alert] forward=${forwardId} vendor=${vendor.id} has no users.phone — NOT SENT`);
    await record({ status: 'failed', error_code: 'no_vendor_phone' });
    return { sent: false, status: 'failed', wamid: null, refusal: 'no_vendor_phone' };
  }
  const sendWaFn = deps.sendWa || require('../sendWa').sendWa;
  try {
    const out = await sendWaFn({
      line: 'vendor', to: user.phone, templateKey: FORWARD_ALERT_TEMPLATE_KEY,
      vars: [vendor.business_name || 'there', monthPhrase(request.wedding_date), VENDOR_LEADS_URL],
      supabase,
    });
    const sent = !!(out && out.sent === true);
    const wamid = sent && out.result && out.result.wamid ? String(out.result.wamid) : null;
    if (!sent) {
      console.error(`[assistance:forward-alert] forward=${forwardId} REFUSED (unknown) — the lead IS on file`);
      await record({ status: 'failed', error_code: 'unknown' });
      return { sent: false, status: 'failed', wamid: null, refusal: 'unknown' };
    }
    await record({ wamid, status: wamid ? 'sent' : 'sent_no_wamid', sent_at: new Date().toISOString() });
    console.log(`[assistance:forward-alert] forward=${forwardId} vendor=${vendor.routing_handle || vendor.id} template=${FORWARD_ALERT_TEMPLATE_KEY} wamid=${wamid}`);
    return { sent: true, status: wamid ? 'sent' : 'sent_no_wamid', wamid, refusal: null };
  } catch (err) {
    const code = (err && (err.code || err.name)) || 'send_failed';
    console.error(`[assistance:forward-alert] forward=${forwardId} THREW (${code}: ${err && err.message}) — the lead IS on file`);
    await record({ status: 'failed', error_code: String(code).slice(0, 80), error_title: String(err && err.message || '').slice(0, 500) });
    return { sent: false, status: 'failed', wamid: null, refusal: code };
  }
}

async function forwardToProspect(supabase, { item, request, target }, deps) {
  const lastTen = normalizePhone(target.phone);
  if (!lastTen) return { ok: false, code: REFUSE.NO_PHONE, error: 'A ten-digit WhatsApp number is required.' };
  const ig = target.ig_handle ? String(target.ig_handle).trim().replace(/^@/, '') : null;
  // R-41.122 — verbatim. The only normalisation is "is it empty", because a form
  // that submits an untouched textarea sends '' and that is not a record.
  const consentText = (target.consent_text != null && String(target.consent_text).trim().length > 0)
    ? String(target.consent_text)
    : null;
  const name = target.name ? String(target.name).trim().slice(0, 120) : null;

  // Find by last ten (the join law); insert on the prospect lane's own format
  // (prospects.js:94 — normalizeTo over a stripped string). `prospects.phone` is
  // UNIQUE, so a second writer must find before it inserts.
  let { data: found } = await supabase
    .from('prospects')
    // F-41.103 — THE FIND PATH MUST READ THE CONSENT COLUMNS TOO. It did not, so a
    // prospect that ALREADY EXISTED came back with consent_text undefined and was
    // reported as having no record no matter what the row actually held. D3a's gate
    // could therefore never pass for a found prospect — only for one inserted in the
    // same call. The founder's walk proved it: the record written at 05:17, the
    // refusal at 10:49, the same number.
    // THE BENCH DID NOT CATCH IT because every fixture inserts a FRESH prospect with
    // consent on `target`; the found-with-a-record path had no cell. It has one now.
    .select('id, phone, name, ig_handle, category, city, source, state, consent_text, consent_source, consent_at, consent_recorded_by')
    .like('phone', `%${lastTen}`)
    .limit(2);
  found = Array.isArray(found) ? found : [];
  let prospect = found.length === 1 ? found[0] : null;
  if (found.length > 1) {
    // Two prospects share a last-ten (a country-code twin). Refuse rather than pick.
    return { ok: false, code: 'ambiguous_prospect', error: 'Two prospects share those ten digits; resolve in the prospect lane first.' };
  }
  if (!prospect) {
    // R-41.14: source='manual' — the same word POST /admin/prospects writes at :224,
    // and it is literally true. The forward's provenance is assistance_forwards.prospect_id,
    // never prospects.source. The item id rides notes as a courtesy, never as the join.
    const { data: inserted, error: insErr } = await supabase
      .from('prospects')
      .insert({
        phone:     normalizeTo(`${DEFAULT_COUNTRY}${lastTen}`),
        name,
        ig_handle: ig,
        category:  item.category,
        city:      request.city || null,
        source:    'manual',
        state:     'cold',
        notes:     `assistance item ${item.id}`,
        // R-41.122 — HER WORDS, WRITTEN AT THE MOMENT THE ROW IS CREATED.
        // The founder does the Instagram DM by hand and pastes her reply into the
        // queue's form; it arrives here on `target`. Stored verbatim: not trimmed,
        // not normalised, not summarised, because the value of evidence is that it
        // is what she wrote. Null when he has not asked yet — the row still files,
        // she is simply not yet askable, and the gate below is what says so.
        consent_text:        consentText,
        consent_source:      consentText ? (target.consent_source || 'instagram_dm') : null,
        consent_at:          consentText ? (target.consent_at || new Date().toISOString()) : null,
        consent_recorded_by: consentText ? (target.consent_recorded_by || null) : null,
      })
      .select('id, phone, name, ig_handle, category, city, source, state, consent_text, consent_source, consent_at, consent_recorded_by')
      .single();
    if (insErr) return { ok: false, code: 'prospect_failed', error: `Could not file the prospect: ${insErr.message}` };
    prospect = inserted;
  }

  // ── THE SEND ARM · LIVE (A10, R-41.83 as amended) ────────────────────────
  // A2 shipped this commented; the chair woke it. The gate is the register key
  // `template.tdw_assist_lead_outside_v2` (UTILITY, Meta 2544506315978894; R-41.118).
  // v1's key is retired in 0155 and this arm no longer reads it. When
  // the key is ON this sends FOR REAL to whatever number the founder typed —
  // there is no second gate, which is why the packet's first founder step is to
  // shut the key before applying and the walk's first step is to open it.
  // The wamid lands on assistance_forwards.wamid (the R-40.110 home 0148 built).
  // RECEIPTS ROUTE. This rides the MARKETING lane, and since F-41.60/R-41.92
  // (dream-os 1a37bbc) src/marketingIndex.js's status loop calls applyStatusEvent
  // exactly as index.js:225 and brideIndex.js do. So the row reaches `delivered`
  // and `read`, and an ASYNCHRONOUS failure lands too. The note that stood here
  // said the opposite; it was true until that commit and false after it.
  // R-41.30 still holds for the SYNCHRONOUS refusal below, which no webhook can
  // ever report and which only the catch arm can write.
  // ── R-41.122 · THE CONSENT GATE SITS ABOVE THE REGISTER GATE ──────────────
  // BEFORE the switchboard read, deliberately. A missing consent record is NOT a
  // switchboard state: `dark` means "the founder has not opened this plane yet", so
  // a row that went dark for want of consent would tell him the wrong thing and be
  // flipped on to no effect. This refuses outright, writes NOTHING, and names which
  // limb failed. The prospect row still stands — she is on file, just not yet askable.
  // A row FOUND from an earlier forward may predate its consent, or he may be
  // pasting it now for the first time. Record it before the gate reads, so the
  // same call that supplies the evidence can also use it — otherwise the founder
  // pastes her words and is refused anyway, which reads as the form not working.
  // NEVER OVERWRITES: her first words stand. A second paste on a row that already
  // has a record is ignored, because evidence is not editable after the fact.
  if (consentText && !prospect.consent_text) {
    const patch = {
      consent_text:        consentText,
      consent_source:      target.consent_source || 'instagram_dm',
      consent_at:          target.consent_at || new Date().toISOString(),
      consent_recorded_by: target.consent_recorded_by || null,
    };
    await supabase.from('prospects').update(patch).eq('id', prospect.id);
    prospect = { ...prospect, ...patch };
  }

  // ── R-41.132 · THE RECORD IS EVIDENCE, NOT A PRECONDITION (founder, 09-09) ──
  // D3a made this a gate and the founder reversed it the same morning. The send
  // proceeds either way; what changes is whether the estate can SHOW the evidence
  // later. R-41.125 stands: the Instagram DM thread is the record, and this column
  // is a copy of it — so a missing copy is a gap in TDW's own filing cabinet, not a
  // reason to refuse a message the founder has already cleared by hand.
  //
  // ⚠ WHAT THIS MEANS, SAID PLAINLY BECAUSE THE CODE NO LONGER SAYS IT: Meta's
  // Messaging Policy §1 still has two limbs and TDW still has to satisfy them. The
  // enforcement is now the FOUNDER'S HABIT and the DM thread, not this function.
  // The queue shows "No consent on file" beside the send so the gap is visible
  // rather than silent, and that visibility is the whole of what replaced the gate.
  //
  // The state is COMPUTED and RETURNED, never thrown away — the queue renders it,
  // and a later sitting that wants the gate back has the reading already here.
  // ── F-41.151 · THIS NUMBER IS ALREADY ON TDW ──────────────────────────────
  // A number was three things at once on 2026-09-09: a vendor's user phone, a vendor
  // row with 57 leads, AND an outsider prospect with a forward against it. Nothing
  // stopped it. `ALREADY_HAS` guards a different question entirely — whether THIS
  // vendor already holds a lead for THIS couple — so the outsider plane could, and
  // did, invite someone who was already on the platform.
  //
  // ⚠ THE VENDOR HAS NO PHONE COLUMN. `vendors` carries `routing_handle` and a
  // `user_id`; the number lives on `users.phone`. So the lookup is phone → user →
  // vendor, the same join alertVendorOfForward walks in reverse at :688. Deriving it
  // any other way would invent a column the schema does not have.
  //
  // A REFUSAL THAT NAMES THE RIGHT DOOR. The founder is not doing something wrong —
  // he is using the outsider sheet for someone who does not need inviting. The queue
  // says so and offers the TDW forward, which is why the handle rides out on the
  // refusal: a sentence that says "no" without saying "here instead" costs him a
  // second search.
  const already = await vendorForPhone(supabase, lastTen);
  if (already) {
    console.log(`[assistance:forward] item=${item.id} \u2192 ${lastTen} REFUSED already_a_vendor (@${already.routing_handle}) \u2014 nothing written, nothing sent`);
    return {
      ok: false,
      code: REFUSE.ALREADY_A_VENDOR,
      vendor: { id: already.id, routing_handle: already.routing_handle, business_name: already.business_name },
      error: `This number is already on TDW as @${already.routing_handle}. Forward to her as a TDW vendor instead.`,
    };
  }

  const consent = consentEvidences(prospect);
  if (!consent.ok) {
    console.log(`[assistance:forward] item=${item.id} \u2192 prospect=${prospect.id} NO CONSENT ON FILE (limb ${consent.limb}) \u2014 sending anyway (R-41.132); the DM thread is the record`);
  }

  const capFn = (deps.cap && deps.cap.on) || cap.on;
  const reasonFn = (deps.cap && deps.cap.reason) || cap.reason;
  const armed = capFn(cap.CAPABILITY_KEYS.TDW_ASSIST_LEAD_OUTSIDE) === true;
  const darkReason = armed ? null : (reasonFn ? reasonFn(cap.CAPABILITY_KEYS.TDW_ASSIST_LEAD_OUTSIDE) : `${cap.CAPABILITY_KEYS.TDW_ASSIST_LEAD_OUTSIDE} is off`);

  const forward = await writeForward(supabase, {
    item_id: item.id, target_kind: 'prospect', vendor_id: null, prospect_id: prospect.id,
    lead_id: null, wamid: null, status: armed ? 'queued' : 'dark',
  });
  if (!forward.ok) return forward;
  await bumpForwarded(supabase, item, request);

  if (!armed) {
    console.log(`[assistance:forward] item=${item.id} → prospect=${prospect.id} status=dark — NOT SENT: ${darkReason}`);
    // R-41.4(c) — she is told even when the OUTSIDER's join alert is dark. The two
    // planes are gated separately on purpose: whether the outsider has been invited
    // and whether the couple has been told are different facts with different keys.
    const found = await notifyCoupleOfFound(supabase,
      { forwardId: forward.row.id, kind: 'found_outside', request, item, prospect }, deps);
    return { ok: true, forward: forward.row, prospect, consent: consentState(consent, prospect), found, dark: { reason: darkReason } };
  }

  // The join message. F-41.63: its five variables are META'S order, taken from
  // docs/TEMPLATES.md §2 row 10 (the founder's Manager screenshot, 2026-09-09) —
  //   {{1}} name · {{2}} month and year · {{3}} city · {{4}} the trade in plain
  //   words · {{5}} the budget in Indian grouping (`Rs` is in the body).
  // The old array read name/city/trade/month/budget and A10's live send arrived
  // garbled, because Meta substitutes by POSITION and never by name. This array's
  // order is bound to templates.js's `variables` by a cell
  // (scripts/b64_template_slots_bench.js §2); permute either and it reds.
  // TEMPLATE_BODIES.txt is the A1 record and is NOT the witness — it is superseded.
  const sendWaFn = deps.sendWa || require('../sendWa').sendWa;
  const t = TEMPLATE_REFS.lead_outside;
  const to = prospect.phone;
  // ── F-41.123 · AN OBJECT, NOT AN ARRAY, AND THAT IS THE WHOLE FIX HERE ─────
  // The builder reads a url button's suffix BY THE BUTTON'S OWN VARIABLE NAME
  // (`vars[t.button.variable]`) and explicitly refuses to read it from a positional
  // list — the button's {{1}} and the body's {{1}} are two different variables that
  // happen to share a number. An ARRAY therefore cannot carry a suffix at all: the
  // arm reads `undefined` and throws before Meta is ever called. Meta's own refusal
  // (131008) came first only because the entry declared no button to begin with.
  //
  // `review_request` has passed an object to this same arm in production since
  // G3.2 s2. This call site is the one that did not, and the builder's own body
  // path takes either form (`declared.map(nm => vars[nm])`), so nothing else moves.
  //
  // R-41.119 — THE SUFFIX CARRIES THE `enq-` PREFIX. One path, two families: the
  // review family owns bare codes on `/r/`, this one owns `enq-<item_id>`, and the
  // pwa's `/r/[code]` branches on the prefix EXPLICITLY, never on shape. When the
  // button base moves to `/e/` at the next edit window, the prefix retires with it.
  const vars = {
    name:        prospect.name || 'there',                                                            // {{1}}
    month_year:  monthDayYear(request.wedding_date) ? monthYearOnly(request.wedding_date) : 'a date to be decided', // {{2}}
    city:        request.city || 'India',                                                             // {{3}}
    category_noun: categoryNoun(item.category),                                                       // {{4}}
    budget_rs:   formatRs(item.budget_rs || 0),                                                       // {{5}}
    enquiry_ref: `enq-${item.id}`,                                                                    // the url button's suffix, NOT a body slot
  };
  try {
    // F-41.78: `sendWa` logs the one SENT line (R-41.90) and its own default names
    // neither the site nor the item. A10's line read `site=sendWa:template ctx=-`,
    // so the estate had no success-path byte tying a send to its assistance item.
    // `site` was always accepted and never passed; `ctx` is new on sendWa this rider.
    const out = await sendWaFn({ line: t.line === 'marketing' ? 'marketing' : t.line, to, templateKey: 'assist_lead_outside', vars, supabase,
      site: 'assistance:outsider', ctx: `item=${item.id}` });
    const sent = !!(out && out.sent === true);
    const wamid = sent && out.result && out.result.wamid ? String(out.result.wamid) : null;
    // F-41.61: no logWaSend here. `sendWa` already logs its own SENT line at the
    // dispatch seam, and this call duplicated it — two SENT lines per send. The
    // THROW path below keeps its call, because a throw never reaches that seam.
    if (!sent) {
      await recordForwardOutcome(supabase, forward.row.id, { status: 'failed', error_code: 'unknown' });
      return { ok: true, forward: { ...forward.row, status: 'failed' }, prospect, alert: { sent: false, refusal: 'unknown' } };
    }
    await supabase.from('assistance_forwards')
      .update({ wamid, status: wamid ? 'sent' : 'sent_no_wamid', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', forward.row.id);
    // R-41.4(c) — the outsider is invited and SHE is told, in that order. Its own
    // gate and its own row: a failure here never unwinds the forward, because the
    // prospect exists and the invitation went out whether or not her notice did.
    const found = await notifyCoupleOfFound(supabase,
      { forwardId: forward.row.id, kind: 'found_outside', request, item, prospect }, deps);
    return { ok: true, forward: { ...forward.row, wamid, status: wamid ? 'sent' : 'sent_no_wamid' }, found, prospect, alert: { sent: true, wamid } };
  } catch (err) {
    // R-41.30: a SYNCHRONOUS refusal (131049 and its kin) never reaches a webhook,
    // so the row is the only place it can be written. It is written here.
    const code = (err && (err.body && err.body.error && err.body.error.code)) || (err && err.code) || (err && err.name) || 'send_failed';
    logWaSend('marketing', { site: 'assistance:outsider', mode: 'template', templateKey: 'assist_lead_outside', to, err, ctx: `item=${item.id}` });
    await recordForwardOutcome(supabase, forward.row.id, { status: 'failed', error_code: code, error_title: (err && err.message) || null });
    return { ok: true, forward: { ...forward.row, status: 'failed', error_code: String(code) }, prospect, alert: { sent: false, refusal: String(code) } };
  }
  // ⚠ UNREACHABLE, AND KEPT AS A GUARD RATHER THAN A PROMISE. Every branch of the
  // try/catch above returns, so control never arrives here. D3b's first cut put the
  // couple's notice on THIS line and it would have fired for nobody — the outsider's
  // successful send would silently never have told her. The notice now sits in the
  // success branch itself. If a future edit adds a path that falls through, this
  // throws rather than returning a shape that looks fine and told no one.
  /* istanbul ignore next */
  throw new Error('forwardToProspect: unreachable — every branch above returns');
}

async function writeForward(supabase, row) {
  const { data, error } = await supabase
    .from('assistance_forwards')
    .insert(row)
    .select('id, item_id, target_kind, vendor_id, prospect_id, lead_id, wamid, status, error_code, error_title, sent_at, created_at')
    .single();
  if (error) return { ok: false, code: 'forward_failed', error: `Could not record the forward: ${error.message}` };
  return { ok: true, row: data };
}

// ── F-41.128 · THE PUBLIC ENQUIRY READ LIVES HERE, NOT IN THE DOOR ──────────
// b20_a2's one-home cell caught the first cut: `.from('assistance_*')` may appear in
// exactly TWO files — this writer and relayStatus — and src/api/public/enquiry.js
// made a third. The law held and the door was wrong, so the QUERY moved here and the
// door became a shape: it decides what a stranger may see, this decides what is read.
//
// ⚠ IT RETURNS ONLY FOUR FIELDS AND THE DOOR ADDS NOTHING. Category, city, month,
// budget BAND. Never her phone (roadmap §7's standing refusal), never her name,
// never the day, never the figure, never an id, never a second item. The selects
// below name their columns for that reason — a `select('*')` here is how `phone`
// reaches a public page the day someone adds a column.
//
// ONE ANSWER FOR EVERY MISS. Not found, closed, malformed, ambiguous prefix: all
// return null, so a prober cannot learn which enquiries exist by trying tokens.
async function publicEnquiry(supabase, prefix) {
  if (!/^[0-9a-f]{8}$/i.test(String(prefix || ''))) return null;
  const { data: items } = await supabase
    .from('assistance_request_items')
    .select('id, request_id, category, budget_rs')
    .like('id', `${String(prefix).toLowerCase()}%`)
    .limit(2);
  // Eight hex is a uuid's first block — a collision is unlikely, not impossible.
  // Two matches must answer NOTHING rather than pick one, or a stranger is shown an
  // enquiry that is not the one he was sent.
  if (!Array.isArray(items) || items.length !== 1) return null;
  const item = items[0];
  const { data: request } = await supabase
    .from('assistance_requests')
    .select('id, city, wedding_date, status')          // NOT phone, NOT name
    .eq('id', item.request_id)
    .maybeSingle();
  if (!request || request.status === 'closed') return null;
  return { category: item.category || null, city: request.city || null,
           wedding_date: request.wedding_date || null, budget_rs: item.budget_rs || null };
}

async function bumpForwarded(supabase, item, request) {
  await supabase
    .from('assistance_request_items')
    .update({ forwarded_count: (item.forwarded_count || 0) + 1 })
    .eq('id', item.id);
  if (request.status === 'open') {
    await supabase
      .from('assistance_requests')
      .update({ status: 'forwarded', updated_at: new Date().toISOString() })
      .eq('id', request.id)
      .eq('status', 'open');
  }
}

// ── recordForwardOutcome — R-41.30's write path, live now, dark caller ──────
// A synchronous Meta refusal at send (131049 "healthy ecosystem" and its kin)
// never reaches the webhook, so the router cannot record it. The send arm calls
// this in its catch; nothing else does until the arm wakes.
async function recordForwardOutcome(supabase, forwardId, { status, error_code, error_title } = {}) {
  const { data, error } = await supabase
    .from('assistance_forwards')
    .update({
      status:      status || 'failed',
      error_code:  error_code != null ? String(error_code) : null,
      error_title: error_title != null ? String(error_title).slice(0, 500) : null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', forwardId)
    .select('id, status, error_code, error_title')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data };
}

// ── reconcileStrandedForwards — F-41.81, `queued` is not a resting state ────
// `queued` is written ONCE, at the insert, when the gate is armed. From there the
// arm writes `sent`/`sent_no_wamid` or its catch writes `failed`. If the process
// dies between the insert and either write — a deploy, an OOM, a Railway restart
// mid-send — the row stays `queued` FOREVER: no wamid, no error, no sent_at, and
// nothing in the estate reads it. Two such rows exist from 2026-09-08 17:14 and
// 17:16. The admin queue renders the status verbatim, so the founder read the
// word `queued` as "still going out" when it was already terminal.
//
// This runs at BOOT, which is exactly the moment after the process that dropped
// them came back. Ten minutes is the grace: a live send resolves in seconds, so a
// `queued` row older than that had its writer taken away. The row is marked
// `failed` with `error_title='interrupted'` — NOT a Meta code, because Meta never
// answered; that is the honest word for it and it must not be mistaken for 131049.
async function reconcileStrandedForwards(supabase, { olderThanMs = 10 * 60 * 1000 } = {}) {
  const cutoff = new Date(Date.now() - olderThanMs).toISOString();
  const { data, error } = await supabase
    .from('assistance_forwards')
    .update({ status: 'failed', error_code: 'interrupted', error_title: 'interrupted', updated_at: new Date().toISOString() })
    .eq('status', 'queued')
    .lt('created_at', cutoff)
    .select('id, item_id, created_at');
  if (error) {
    console.error(`[assistance:reconcile] could not sweep stranded queued forwards: ${error.message}`);
    return { ok: false, error: error.message, swept: 0 };
  }
  const rows = data || [];
  // NAMED, NEVER SILENT (R-37.57's class): zero is a reading, not an absence.
  console.log(`[assistance:reconcile] stranded queued forwards older than ${Math.round(olderThanMs / 60000)}m marked failed: ${rows.length}`
    + (rows.length ? ` (${rows.map(r => r.id).join(', ')})` : ''));
  return { ok: true, swept: rows.length, rows };
}

// ── closeAssistanceRequest — the founder's hand ─────────────────────────────
async function closeAssistanceRequest(supabase, requestId) {
  const { data, error } = await supabase
    .from('assistance_requests')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('id, status')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, request: data };
}

// ── reads ───────────────────────────────────────────────────────────────────
async function listAssistanceRequests(supabase, { status, limit } = {}) {
  let q = supabase
    .from('assistance_requests')
    .select('id, couple_id, phone, name, status, city, area, wedding_date, brief, origin, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 100)));
  if (status && ['open', 'forwarded', 'closed'].includes(status)) q = q.eq('status', status);
  const { data: requests, error } = await q;
  if (error) return { ok: false, error: error.message };
  const ids = (requests || []).map(r => r.id);
  let items = [];
  if (ids.length) {
    const { data } = await supabase
      .from('assistance_request_items')
      .select('id, request_id, category, budget_rs, forwarded_count')
      .in('request_id', ids);
    items = data || [];
  }
  const byReq = new Map();
  for (const it of items) {
    if (!byReq.has(it.request_id)) byReq.set(it.request_id, []);
    byReq.get(it.request_id).push(it);
  }
  // F-41.42: counts are over EVERY request, never the filtered page — one read of
  // (id, status) for all rows, tallied here. The page's three cards and the nav's
  // Open: N read this, so a status filter no longer counts only itself.
  const counts = { open: 0, forwarded: 0, closed: 0 };
  const { data: all } = await supabase.from('assistance_requests').select('id, status');
  for (const r of all || []) counts[r.status] = (counts[r.status] || 0) + 1;
  return { ok: true, requests: (requests || []).map(r => ({ ...r, items: byReq.get(r.id) || [] })), counts, fanout_default: FANOUT_DEFAULT };
}

async function getAssistanceRequest(supabase, requestId) {
  const { data: request } = await supabase
    .from('assistance_requests')
    .select('id, couple_id, phone, name, status, city, area, wedding_date, brief, origin, created_at, updated_at')
    .eq('id', requestId)
    .maybeSingle();
  if (!request) return { ok: false, code: REFUSE.NOT_FOUND, error: 'No such request.' };
  const { data: items } = await supabase
    .from('assistance_request_items')
    .select('id, request_id, category, budget_rs, forwarded_count, created_at')
    .eq('request_id', request.id)
    .order('created_at', { ascending: true });
  const itemIds = (items || []).map(i => i.id);
  let forwards = [];
  if (itemIds.length) {
    const { data } = await supabase
      .from('assistance_forwards')
      .select('id, item_id, target_kind, vendor_id, prospect_id, lead_id, wamid, status, error_code, error_title, sent_at, created_at')
      .in('item_id', itemIds)
      .order('created_at', { ascending: true });
    forwards = data || [];
  }
  const vendorIds = forwards.filter(f => f.vendor_id).map(f => f.vendor_id);
  const prospectIds = forwards.filter(f => f.prospect_id).map(f => f.prospect_id);
  const vendors = new Map();
  const prospects = new Map();
  if (vendorIds.length) {
    const { data } = await supabase.from('vendors').select('id, business_name, routing_handle, city').in('id', vendorIds);
    for (const v of data || []) vendors.set(v.id, v);
  }
  if (prospectIds.length) {
    // F-41.104 — THE QUEUE'S READ MUST CARRY THE CONSENT TOO, and this is F-41.103's
    // exact class one door over: the SEND path was cured and the READ path was not.
    // Without these columns `consent` is undefined on every row and "Consent noted"
    // can never render, no matter what the database holds.
    // The row carries the STATE, not the raw columns — consentState is the one home
    // and the pwa must never re-derive it (R-41.135).
    const { data } = await supabase.from('prospects').select('id, name, ig_handle, phone, state, consent_text, consent_source').in('id', prospectIds);
    for (const p of data || []) prospects.set(p.id, p);
  }
  const byItem = new Map();
  for (const f of forwards) {
    if (!byItem.has(f.item_id)) byItem.set(f.item_id, []);
    byItem.get(f.item_id).push({
      ...f,
      vendor:   f.vendor_id ? (vendors.get(f.vendor_id) || null) : null,
      prospect: f.prospect_id ? (prospects.get(f.prospect_id) || null) : null,
      // R-41.135 — the writer's own reading, computed once here and rendered as-is.
      // Vendor forwards carry null: consent is a prospect's fact, and a vendor on TDW
      // reached us herself.
      consent: f.prospect_id
        ? consentState(consentEvidences(prospects.get(f.prospect_id) || {}), prospects.get(f.prospect_id) || {})
        : null,
    });
  }
  return {
    ok: true,
    request,
    items: (items || []).map(i => ({ ...i, forwards: byItem.get(i.id) || [] })),
    fanout_default: FANOUT_DEFAULT,
  };
}

// ── getLatestAssistanceForCouple — F-41.29, the couple's own read ───────────
// She never sees a queue (roadmap §7): per item she gets the TDW vendors found
// (name + /v/ code) and a COUNT of outsiders asked, unnamed until they join
// (§6.3 as drawn; #30/#31 struck — no count of who was asked is shown, only
// who was FOUND). Same tables, same one home.
async function getLatestAssistanceForCouple(supabase, coupleId) {
  const { data: request } = await supabase
    .from('assistance_requests')
    .select('id, status, city, area, wedding_date, brief, created_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!request) return { ok: true, request: null, items: [] };
  const { data: items } = await supabase
    .from('assistance_request_items')
    .select('id, request_id, category, budget_rs, forwarded_count')
    .eq('request_id', request.id)
    .order('created_at', { ascending: true });
  const itemIds = (items || []).map(i => i.id);
  let forwards = [];
  if (itemIds.length) {
    const { data } = await supabase
      .from('assistance_forwards')
      .select('id, item_id, target_kind, vendor_id, status')
      .in('item_id', itemIds);
    forwards = data || [];
  }
  const vendorIds = [...new Set(forwards.filter(f => f.vendor_id).map(f => f.vendor_id))];
  const vendors = new Map();
  if (vendorIds.length) {
    const { data } = await supabase.from('vendors').select('id, business_name, routing_handle').in('id', vendorIds);
    for (const v of data || []) vendors.set(v.id, v);
  }
  return {
    ok: true,
    request,
    items: (items || []).map(i => ({
      id: i.id, category: i.category, budget_rs: i.budget_rs,
      found: forwards.filter(f => f.item_id === i.id && f.target_kind === 'vendor').map(f => {
        const v = vendors.get(f.vendor_id);
        return v ? { business_name: v.business_name, routing_handle: v.routing_handle } : null;
      }).filter(Boolean),
      outsiders_asked: forwards.filter(f => f.item_id === i.id && f.target_kind === 'prospect').length,
    })),
  };
}

// ── searchForwardTargets — on-platform, trade-first, alphabetical, no ranking ─
// roadmap §2/§7: same-category first, alphabetical, never spend- or volume-ranked.
async function searchForwardTargets(supabase, { category, city, q, limit } = {}) {
  const cap_ = Math.min(MAX_SEARCH, Math.max(1, parseInt(limit, 10) || MAX_SEARCH));
  const term = String(q || '').trim().replace(/[%_,()]/g, '').slice(0, 60);
  let query = supabase
    .from('vendors')
    .select('id, business_name, routing_handle, category, city')
    .eq('status', 'active')
    .eq('discover_paused', false)
    .eq('peer_discoverable', true)
    .order('business_name', { ascending: true })
    .limit(cap_ * 3);
  if (isCanonicalCategory(category)) query = query.eq('category', category);
  if (term.length >= 2) query = query.or(`business_name.ilike.*${term}*,routing_handle.ilike.*${term}*`);
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  const rows = data || [];
  const cityLc = String(city || '').trim().toLowerCase();
  // City-first is a stable partition of an alphabetical list, not a rank.
  const inCity  = cityLc ? rows.filter(v => String(v.city || '').toLowerCase() === cityLc) : rows;
  const outCity = cityLc ? rows.filter(v => String(v.city || '').toLowerCase() !== cityLc) : [];
  return { ok: true, vendors: [...inCity, ...outCity].slice(0, cap_) };
}

module.exports = {
  createAssistanceRequest, forwardAssistanceItem, recordForwardOutcome, closeAssistanceRequest,
  listAssistanceRequests, getAssistanceRequest, searchForwardTargets, getLatestAssistanceForCouple,
  normalizePhone, formatRs,
  TDW_ASSIST_SOURCE, TDW_REFERRER_NAME, TEMPLATE_REFS, FANOUT_DEFAULT, REFUSE, consentEvidences, consentState, notifyCoupleOfFound, enquiryToken, enquiryWaLink, vendorForPhone, publicEnquiry,
  ASSIST_FORWARD_ALERT_FLAG, FORWARD_ALERT_TEMPLATE_KEY, findCoupleIdByLastTen, categoryNoun, monthYearOnly, reconcileStrandedForwards,
};
