// src/lib/whatsapp.js — shared WhatsApp sender.
// Used by webhook handlers (src/index.js, src/brideIndex.js) and the morning
// briefing cron (src/cron.js).
//
// B2: added optional mediaUrls parameter for outbound media.
// Block 05 P2: added optional `from` parameter so a caller can resolve the FROM
// number per line (bride/vendor/marketing). Defaults to TWILIO_WHATSAPP_NUMBER.
//
// ═══════════════════════════════════════════════════════════════════════════
// TDW_05 TRANSPORT MIGRATION — M1 (bride lane), CE-ruled §4 (body-rewire).
// ───────────────────────────────────────────────────────────────────────────
// This module's BODY now routes a send to the Meta Cloud API when `from` resolves
// to a Meta-live lane IN THIS PROCESS; otherwise it falls through to Twilio,
// BYTE-IDENTICAL to the pre-migration sender. The ~80 call sites are unchanged —
// they inherit the transport from here (CE §4: rewire the body, not the sites).
//
// LANE RESOLUTION IS SERVICE-SCOPED AND COLLISION-PROOF (CE §2 refinement). A lane
// is Meta-live in a process ONLY when that lane's phone-number-id env is present in
// THAT process AND that lane's number is set EXPLICITLY. Both lanes now demand an
// explicit *_WHATSAPP_NUMBER (BRIDE_WHATSAPP_NUMBER / VENDOR_WHATSAPP_NUMBER) — there is
// NO literal/Twilio fallback for either identity. VENDOR_PHONE_NUMBER_ID stays unset until
// M2, so vendor sends remain Twilio automatically ("dormant until provisioned").
//
// F-05.16 (CE-43): PNID-presence ALONE was not collision-proof. A stale BRIDE_PHONE_NUMBER_ID
// on the vendor service, combined with brideNum inheriting TWILIO_WHATSAPP_NUMBER (the old
// literal fallback), routed every from-inferred vendor send onto the dead bride PNID → (#200).
// The cure (CE-ruled): the bride branch mirrors the vendor branch EXACTLY — explicit PNID AND
// explicit number, or the branch is unreachable. The TWILIO/literal inheritance is dead.
//
// F-05.2 CURE LIVES HERE (CE §4), INSIDE the Meta branch: the cross-line opt-out gate
// runs only when a send resolves to a Meta lane, so the Twilio fallthrough stays BYTE-
// IDENTICAL (no new round-trip). The cure is thus the shared-sender MECHANISM and
// activates per-lane at each cutover (bride at M1, vendor at M2) — "all sites in one
// place" because every migrated lane inherits this single gate. An opted-out recipient
// is BLOCKED with a loud log line and a typed sentinel return ({ sid:null,
// blocked:'opted_out' }); the caller's control flow is unchanged (no new throw → W-1-safe).
// The gate DEGRADES TO A NO-OP when no supabase is reachable (no env / bench).
//
// W-1: transport only. Message BODY bytes are never touched here.
// ═══════════════════════════════════════════════════════════════════════════

const twilio = require('twilio');
const { sendMetaText, normalizeTo } = require('./metaCloud');

const TWILIO_ACCOUNT_SID     = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN      = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ── digits-only normalizer for number comparison (strip 'whatsapp:' and '+') ──
function _bare(n) {
  let s = String(n == null ? '' : n).trim();
  if (s.startsWith('whatsapp:')) s = s.slice('whatsapp:'.length);
  if (s.startsWith('+')) s = s.slice(1);
  return s;
}

// ── Meta lane resolution (service-scoped; see header) ─────────────────────────
// Returns { line, phoneNumberId } when `from` is a Meta-live lane in THIS process,
// else null. Injectable env via `env` for the bench.
function metaLaneFor(from, env = process.env) {
  const f = _bare(from);
  // F-05.16 (CE-43): the bride identity requires an EXPLICIT BRIDE_WHATSAPP_NUMBER,
  // exactly as vendor requires an explicit VENDOR_WHATSAPP_NUMBER. The old
  // `|| TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550'` inheritance is DEAD: it let a
  // stale BRIDE_PHONE_NUMBER_ID on the vendor service collapse brideNum onto the vendor
  // number and route every from-inferred send onto the dead bride PNID → (#200).
  const brideNum  = _bare(env.BRIDE_WHATSAPP_NUMBER || '');
  const vendorNum = _bare(env.VENDOR_WHATSAPP_NUMBER || '');
  // Bride: id present in this process AND an explicit bride number is set AND from matches it.
  if (env.BRIDE_PHONE_NUMBER_ID && brideNum && f === brideNum) {
    return { line: 'bride', phoneNumberId: env.BRIDE_PHONE_NUMBER_ID };
  }
  // Vendor (M2): only when an explicit distinct vendor number is configured, so it
  // can never collide with the bride literal.
  if (env.VENDOR_PHONE_NUMBER_ID && vendorNum && f === vendorNum) {
    return { line: 'vendor', phoneNumberId: env.VENDOR_PHONE_NUMBER_ID };
  }
  return null;
}

// ── lazy supabase for the opt-out gate (Meta + Twilio paths; no-op without env) ─
let _sb = null;
function _supabase() {
  if (_sb !== null) return _sb;               // cached (may be `false` = unavailable)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { _sb = false; return false; }
  const { createClient } = require('@supabase/supabase-js');
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}
function _setSupabase(sb) { _sb = sb; }        // test hook

// ── cross-line opt-out check (F-05.2). True iff `to` opted out. No-op w/o supabase.
async function _isOptedOut(to, deps = {}) {
  const sb = deps.supabase !== undefined ? deps.supabase : _supabase();
  if (!sb) return false;                       // cannot check → degrade to no-op (never a false block)
  const phone = normalizeTo(to);
  const { data } = await sb
    .from('prospects')
    .select('state')
    .eq('phone', phone)
    .eq('state', 'opted_out')
    .limit(1)
    .maybeSingle();
  return !!data;
}

// sendWhatsApp(toPhone, body, mediaUrls?, from?, deps?)
//
// toPhone   : string  — recipient phone (E.164 or whatsapp:E.164)
// body      : string  — message text
// mediaUrls : string[] — optional public image URLs (Twilio path)
// from      : string  — optional sender; defaults to TWILIO_WHATSAPP_NUMBER
// deps      : object  — test injection: { sendMetaText, isOptedOut, supabase, env }
async function sendWhatsApp(toPhone, body, mediaUrls = [], from = TWILIO_WHATSAPP_NUMBER, deps = {}) {
  const _sendMetaText = deps.sendMetaText || sendMetaText;
  const _optedOut     = deps.isOptedOut   || ((to) => _isOptedOut(to, deps));
  const env           = deps.env || process.env;

  const lane = metaLaneFor(from, env);

  // ── Meta path (bride at M1; vendor at M2) ────────────────────────────────────
  // DORMANT until the lane's phone-number-id is provisioned. The F-05.2 opt-out gate
  // lives HERE (inside the Meta branch), NOT before it, so the Twilio fallthrough below
  // stays BYTE-IDENTICAL — no new round-trip, no behavior change (chair's #1 re-derivation).
  // The cure therefore activates per-lane at each cutover; it is "all sites in one place"
  // because every migrated lane inherits this single gate.
  if (lane) {
    // F-05.2 cross-line opt-out gate (degrades to no-op without supabase).
    if (await _optedOut(toPhone)) {
      console.warn(`[whatsapp:out->meta] BLOCKED opted_out to=${_bare(toPhone)} line=${lane.line} (F-05.2 cross-line gate)`);
      return { sid: null, blocked: 'opted_out', sent: false };
    }
    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      // M1 is text-only on Meta. Outbound media on a Meta lane is a NAMED gap (needs a
      // Meta media send — follow-up), refused loudly, never silently dropped.
      console.warn(`[whatsapp:out->meta] media send unsupported on Meta lane '${lane.line}' (M1 text-only); refusing to=${_bare(toPhone)}`);
      return { sid: null, blocked: 'meta_media_unsupported', sent: false };
    }
    const res = await _sendMetaText({ to: toPhone, text: body }, { phoneNumberId: lane.phoneNumberId });
    const wamid = res && res.wamid ? res.wamid : null;
    console.log(`[whatsapp:out->meta] ${_bare(toPhone)} <- ${String(body).slice(0, 60)} (${wamid}) [line=${lane.line}]`);
    // Return the wamid in `.sid` so every `.sid` caller keeps working (documented misnomer).
    return { sid: wamid, wamid, meta: true, line: lane.line, result: res, sent: true };
  }

  // ── Twilio path (unmigrated lanes — BYTE-IDENTICAL to pre-migration) ──────────
  const to        = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const fromAddr  = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  const params = { from: fromAddr, to, body };
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
    params.mediaUrl = mediaUrls.slice(0, 10);
  }

  const _twilioCreate = deps.twilioCreate || ((p) => twilioClient.messages.create(p));
  const msg = await _twilioCreate(params);
  const mediaCount = params.mediaUrl ? params.mediaUrl.length : 0;
  console.log(`[whatsapp:out] ${to} <- ${body.slice(0, 60)}${mediaCount ? ` [+${mediaCount} media]` : ''} (${msg.sid})`);
  return msg;
}

module.exports = { sendWhatsApp, metaLaneFor, _setSupabase, _isOptedOut };
