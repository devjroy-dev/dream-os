// src/lib/whatsapp.js — shared WhatsApp sender.
// Used by webhook handlers (src/index.js, src/brideIndex.js) and the morning
// briefing cron (src/cron.js).
//
// B2: added optional mediaUrls parameter for outbound media.
// Block 05 P2: added optional `from` parameter so a caller can resolve the FROM
// number per line (bride/vendor/marketing). See the default-from note below (M2b).
//
// ═══════════════════════════════════════════════════════════════════════════
// TDW_05 M2b — THE TWILIO SUNSET (CE-62). Twilio is GONE from this module.
// ───────────────────────────────────────────────────────────────────────────
// Both lanes have answered on Meta for weeks. The Twilio fallthrough that lived
// beneath this sender is DELETED: there is no second transport to fall to, so a
// send that cannot resolve a Meta lane is a LOUD, TYPED refusal — never a silent
// drop and never a resurrection. The refusal keeps the sentinel shape the callers
// already handle ({ sid:null, blocked, sent:false }); no new throw, so W-1 holds.
//
// F-05.2 CLOSES HERE. The cross-line opt-out gate used to live INSIDE the Meta
// branch so the Twilio fallthrough could stay byte-identical. With the fallthrough
// gone the gate is simply on the only path there is — every free-form send in the
// estate now passes it. (OTP is the one deliberate exemption and never routes
// through this module: AUTHENTICATION templates are opt-out-exempt by design and
// otpSend.js calls metaCloud directly. See otpSend.js's header.)
//
// F3 / B-1 (CE-62) — THE DEFAULT-FROM INVERSION. The default `from` used to be
// TWILIO_WHATSAPP_NUMBER, which made a retiring transport var load-bearing for Meta
// lane resolution: delete it and metaLaneFor collapses to null on every default-from
// send, on both live lanes. The default now reads the *_WHATSAPP_NUMBER convention
// FIRST and keeps TWILIO_WHATSAPP_NUMBER only as a TRANSITIONAL fallback, so no
// deploy depends on an env change landing in the same breath. The founder adds the
// new names before deploy and deletes the old only after the smoke proves green.
//
// W-1: transport only. Message BODY bytes are never touched here.
// ═══════════════════════════════════════════════════════════════════════════

const { sendMetaText, normalizeTo } = require('./metaCloud');

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

// ── Default FROM resolution (F3 / B-1, CE-62) ────────────────────────────────
// THIS process's own lane number. Reads the *_WHATSAPP_NUMBER convention first and
// keeps TWILIO_WHATSAPP_NUMBER only as the transitional fallback (deleted post-smoke,
// founder-hand). Vendor is probed before bride deliberately: F-05.16's bug was a STALE
// BRIDE_PHONE_NUMBER_ID sitting on the vendor service, and vendor-first means the
// vendor process resolves its own identity even if that stale var is still present.
function defaultFrom(env = process.env) {
  if (env.VENDOR_PHONE_NUMBER_ID && env.VENDOR_WHATSAPP_NUMBER) return env.VENDOR_WHATSAPP_NUMBER;
  if (env.BRIDE_PHONE_NUMBER_ID  && env.BRIDE_WHATSAPP_NUMBER)  return env.BRIDE_WHATSAPP_NUMBER;
  return env.TWILIO_WHATSAPP_NUMBER || '';
}

// ── lazy supabase for the opt-out gate (no-op without env) ────────────────────
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
// mediaUrls : string[] — optional public image URLs (refused on Meta; named gap)
// from      : string  — optional sender; omitted ⇒ defaultFrom(env) (this lane's number)
// deps      : object  — test injection: { sendMetaText, isOptedOut, supabase, env }
async function sendWhatsApp(toPhone, body, mediaUrls = [], from = undefined, deps = {}) {
  const _sendMetaText = deps.sendMetaText || sendMetaText;
  const _optedOut     = deps.isOptedOut   || ((to) => _isOptedOut(to, deps));
  const env           = deps.env || process.env;

  const _from = (from === undefined || from === null || from === '') ? defaultFrom(env) : from;
  const lane  = metaLaneFor(_from, env);

  // ── Meta path — the only path (M2b) ─────────────────────────────────────────
  // M2b: this is now the ONLY path. The F-05.2 opt-out gate below is therefore on every
  // free-form send in the estate — the closure the finding claimed, delivered by deletion
  // of the alternative rather than by duplication of the gate.
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

  // ── No lane resolved — the sunset's loud floor (M2b) ─────────────────────────
  // Pre-M2b this fell through to Twilio. There is no Twilio. A send that cannot name
  // its Meta lane is REFUSED with the sentinel the callers already handle, and the
  // reason is printed with the resolved `from` so the env fault is greppable on sight.
  console.error(`[whatsapp:out] REFUSED — no Meta lane for from='${_bare(_from)}' to=${_bare(toPhone)}; check this service's *_PHONE_NUMBER_ID + *_WHATSAPP_NUMBER (M2b: no Twilio fallback exists)`);
  return { sid: null, blocked: 'no_meta_lane', sent: false };
}

module.exports = { sendWhatsApp, metaLaneFor, defaultFrom, _setSupabase, _isOptedOut };
