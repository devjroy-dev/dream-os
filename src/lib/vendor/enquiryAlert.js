// src/lib/vendor/enquiryAlert.js — TDW_08 P5 RIDER: THE ONE DOOR FOR THE VENDOR
// ENQUIRY ALERT. F-08.85's cure. CE ruling R-R1–R-R6, twenty-second chair, 2026-08-05.
//
// ═══ WHY A DOOR AND NOT THREE PATCHES (CE R-R3, fork 2 arm (a)) ══════════════
// The charter ruled "the enquiry-alert relay site ONLY — one site, named by path
// and symbol." Derived at `9a1cbcb`: there were THREE, all identical in shape, at
// `vendorInbound.js:591` (disambiguated), `:700` (sticky) and `:989` (returning).
// Wrapping three call sites in place would have created three drift surfaces for
// one behaviour. This module is the estate's sole-writer idiom — the same shape P6
// just gave the deletion path — so "one site, named by path and symbol" is true BY
// CONSTRUCTION rather than by hope. The bench asserts the sole-caller property.
//
// ═══ WHAT F-08.85 ACTUALLY WAS (finding text AMENDED at R-R4) ════════════════
// The finding read "an out-of-window vendor silently never learns a lead arrived."
// That understated it, and the chair confirmed every link:
//   `sendWhatsApp` does not catch. `_sendMetaText` throws `MetaSendError`. Nothing
//   guarded the relay call, so the throw reached vendorInbound's FUNCTION-LEVEL
//   catch (`:1425`), which dead-letters the whole payload. The bride's reply had
//   ALREADY been sent (the message insert precedes the relay), and the work
//   downstream of the relay — including `conversations.last_message_at` — was
//   abandoned. She then received the graceful failure line for a turn that worked.
// SO: ONE CLOSED VENDOR WINDOW CORRUPTED A BRIDE'S CONVERSATION. That is the real
// finding, and it is why this door swallows EVERY error class, not just the window.
//
// ═══ VENDOR NOTIFICATION IS BEST-EFFORT BY RULING (R-R4) ═════════════════════
// This function NEVER THROWS. A bride's turn must not abort because a vendor's
// phone could not be reached. Every exit is a returned verdict object, and every
// failure is ledgered loudly with its code and the caller's context tag — because
// the failure this cures was invisible precisely for lack of that line.
'use strict';

const { sendWhatsApp } = require('../whatsapp');
const { sendWa }       = require('../sendWa');
const { readLaneFlag } = require('../laneFlags');
const { scrubText }    = require('./scrub');

// ── the out-of-window registry (fork 3, RULED) ───────────────────────────────
// Each entry carries its OWN param builder, because a template's variables are
// part of the template and a shared mapper would silently mis-order the day a
// second entry's slots differ. The `admin_config` dial picks the key.
//
// ⚠ `tdw_enquiry_brief_vendor` IS DELIBERATELY ABSENT. It is approved on the WABA
// (founder screenshot, 2026-08-05) but its mapper may be authored ONLY against the
// wire witness the founder pastes — name, LANGUAGE CODE, and the body's {{n}} slots
// as Meta shows them. `en` and `en_US` are not interchangeable on the wire and the
// dashboard prints only the word "English". Authoring a mapper from the draft I
// proposed rather than from the filed bytes is the name-vs-wire class (F-08.75),
// and that class stays dead. The dial refuses an unknown key loudly (below), so
// pointing at it before it exists sends NOTHING rather than guessing.
const OOW_REGISTRY = {
  enquiry_alert_vendor: {
    templateKey: 'enquiry_alert_vendor',
    // `enquiry_alert_vendor` is chair-verified at templates.js:213 —
    // variables ['name','bride','link'], status 'approved', line 'vendor'.
    // All three values already exist at every relay site, so this mapper
    // authors NO new copy and needs no founder veto.
    build: ({ vendorName, brideName, link }) => ({
      name:  vendorName,
      bride: brideName,
      link,
    }),
  },
};

const OOW_DIAL_KEY  = 'vendor.enquiry_alert_oow_template';
const OOW_FLAG_KEY  = 'vendor.enquiry_alert_oow_enabled';
const DEFAULT_OOW_KEY = 'enquiry_alert_vendor';

// ── the window error class (fork 1, RULED at R-R1) ───────────────────────────
// ONE MEMBER. Meta returns 131047 — "Re-engagement message" — when a free-form
// send lands outside the 24-hour customer-service window, and names a pre-approved
// template as the remedy. That is exactly this cure.
//
// ENUMERATED AND EXCLUDED, each with its reason, because a fallback branch that
// can never fire is a dead branch pretending to be caution:
//   131049 — "Meta chose not to deliver" (per-user messaging limits). The
//            documented guidance is to BACK OFF; a template here would worsen it.
//   131026 — message undeliverable (the recipient cannot receive). A template
//            fails identically.
//   470    — the legacy On-Premise code for this same condition. This estate is
//            Cloud-API-direct (P-06.T), so it cannot arrive. Named, not coded.
const WINDOW_CLOSED_CODE = 131047;

// R-R1: optional-chained deliberately. Meta's body shape is EXTERNAL. A malformed
// or absent body must fall to the generic branch, never throw a second time inside
// the catch that exists to stop a throw.
function isWindowClosed(err) {
  return err?.body?.error?.code === WINDOW_CLOSED_CODE;
}

// ⚠ DISCLOSED GAP, ACCEPTED AT R-R5 — READ BEFORE TRUSTING THIS CATCH.
// 131047 is documented on the SYNCHRONOUS send response, and that is the path this
// catch covers. Meta ALSO surfaces send failures ASYNCHRONOUSLY via webhook status
// callbacks — `marketingIndex.js:118`'s `statusLogLine` already reads that shape.
// No live witness exists for which path fires on THIS lane, because producing one
// needs a real out-of-window send, which is the founder's walk and not a bench.
// The walk card makes it the walk's first settled question. NOTHING HERE
// SPECULATES about a path nobody has witnessed: if the async path turns out to be
// the live one, this catch never fires and the walk will show it as a silent
// non-delivery rather than as a working fallback.

/**
 * The one door. Sends the vendor's enquiry alert, falling back to an approved
 * template when Meta says the 24-hour window is shut.
 *
 * NEVER THROWS. Returns a verdict:
 *   { sent, path: 'text'|'template'|null, reason?, code? }
 */
async function sendVendorEnquiryAlert({
  toPhone, text, vendorName, brideName, link,
  supabase = null, vendorId = null, ctx = 'enquiryAlert',
} = {}, deps = {}) {
  const _sendWhatsApp = deps.sendWhatsApp || sendWhatsApp;
  const _sendWa       = deps.sendWa       || sendWa;
  const _readLaneFlag = deps.readLaneFlag || readLaneFlag;

  if (!toPhone) {
    console.warn(`[enquiryAlert] no vendor phone — nothing sent (ctx=${ctx})`);
    return { sent: false, path: null, reason: 'no_phone' };
  }

  // ── the free-form attempt, exactly as before this rider ────────────────────
  try {
    const res = await _sendWhatsApp(toPhone, text);
    // sendWhatsApp returns a blocked sentinel rather than throwing for opt-out,
    // media and no-lane. Those are NOT window problems and must not reach the
    // template — an opted-out vendor is opted out of templates too.
    if (res && res.blocked) {
      console.warn(`[enquiryAlert] refused by the send door: ${res.blocked} (ctx=${ctx})`);
      return { sent: false, path: null, reason: res.blocked };
    }
    return { sent: true, path: 'text' };
  } catch (err) {
    if (!isWindowClosed(err)) {
      // ── EVERY OTHER CLASS: ledger loudly, RETURN, never throw (R-R4) ───────
      // This branch is the bride's protection. Before this rider the throw
      // reached the function-level dead-letter and cost her the rest of her turn.
      const code = err?.body?.error?.code ?? err?.code ?? '?';
      console.error(`[enquiryAlert] send failed code=${code} ctx=${ctx} to=${String(toPhone).slice(-4)} — `
        + `vendor not notified; the turn continues (best-effort by ruling R-R4): ${err?.message || err}`);
      return { sent: false, path: null, reason: 'send_failed', code };
    }

    // ── 131047: the window is shut ─────────────────────────────────────────
    console.warn(`[enquiryAlert] window CLOSED (131047) ctx=${ctx} to=${String(toPhone).slice(-4)}`);

    // FORK 4 — PUSH IS NOT SPEAK. Default OFF; the founder flips after his walk.
    const enabled = await _readLaneFlag(supabase, OOW_FLAG_KEY);
    if (!enabled) {
      console.warn(`[enquiryAlert] out-of-window fallback is OFF (${OOW_FLAG_KEY}) — `
        + `vendor NOT notified, and this line is the record that he was not (ctx=${ctx})`);
      return { sent: false, path: null, reason: 'window_closed_fallback_disabled' };
    }

    const key = await readDial(supabase);
    const entry = OOW_REGISTRY[key];
    if (!entry) {
      // LOUD REFUSAL, ZERO SEND (fork 3). A dial pointing at a template that does
      // not exist here must never fall back to "send something" — a guessed
      // template is a vendor-facing byte nobody approved.
      console.error(`[enquiryAlert] dial '${OOW_DIAL_KEY}' names unknown template '${key}' — `
        + `REFUSING, zero send. Known keys: ${Object.keys(OOW_REGISTRY).join(', ')} (ctx=${ctx})`);
      return { sent: false, path: null, reason: 'unknown_template_key', key };
    }

    try {
      // Every vendor-facing param passes the scrub door, as every vendor-facing
      // write does. The bride's name is HER text, arriving from the model's frame.
      const vars = entry.build({
        vendorName: scrubText(vendorName || 'there'),
        brideName:  scrubText(brideName  || 'a couple'),
        link,
      });
      await _sendWa({
        line: 'vendor', to: toPhone, templateKey: entry.templateKey, vars, supabase,
      });
      console.log(`[enquiryAlert] out-of-window TEMPLATE sent key=${entry.templateKey} ctx=${ctx}`);
      return { sent: true, path: 'template', key: entry.templateKey };
    } catch (tErr) {
      // The fallback itself failed. Still no throw — same reasoning as above.
      console.error(`[enquiryAlert] template fallback FAILED key=${entry.templateKey} ctx=${ctx}: ${tErr?.message || tErr}`);
      return { sent: false, path: null, reason: 'template_failed', code: tErr?.body?.error?.code ?? null };
    }
  }
}

// Reads the dial. Absent row ⇒ the default key, which is the approved template the
// estate already holds — so the flag alone is enough to turn this on.
async function readDial(supabase) {
  if (!supabase) return DEFAULT_OOW_KEY;
  try {
    const { data } = await supabase
      .from('admin_config').select('value').eq('key', OOW_DIAL_KEY).maybeSingle();
    if (data && data.value != null) {
      const parsed = JSON.parse(String(data.value));
      if (typeof parsed === 'string' && parsed) return parsed;
    }
  } catch (_e) { /* malformed or unreachable ⇒ the default */ }
  return DEFAULT_OOW_KEY;
}

module.exports = {
  sendVendorEnquiryAlert,
  OOW_REGISTRY, OOW_DIAL_KEY, OOW_FLAG_KEY, DEFAULT_OOW_KEY,
  WINDOW_CLOSED_CODE, isWindowClosed,
};
