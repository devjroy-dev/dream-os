// src/lib/vendor/enquiryAlert.js — THE ONE DOOR FOR THE VENDOR ENQUIRY ALERT.
//
// TDW_08 P5 RIDER built this door (F-08.85, CE R-R1–R-R6, twenty-second chair,
// 2026-08-05). TDW_06/07 THE OOW COMPLETION rewrites its middle: the door now
// ASKS THE WINDOW FIRST and carries HER WORDS out-of-window.
//
// ═══ WHY A DOOR AND NOT THREE PATCHES (CE R-R3, unchanged) ═══════════════════
// There were THREE identical relay sites — `vendorInbound.js` at the
// disambiguated, sticky and returning branches. Wrapping three call sites in
// place would have created three drift surfaces for one behaviour. This module
// is the estate's sole-writer idiom, so "one site, named by path and symbol" is
// true BY CONSTRUCTION rather than by hope. The bench asserts the sole-caller
// property.
//
// ═══ VENDOR NOTIFICATION IS BEST-EFFORT BY RULING (R-R4, unchanged) ══════════
// This function NEVER THROWS. A bride's turn must not abort because a vendor's
// phone could not be reached. ONE CLOSED VENDOR WINDOW ONCE CORRUPTED A BRIDE'S
// CONVERSATION (F-08.85): `sendWhatsApp` did not catch, `_sendMetaText` threw,
// nothing guarded the relay call, and the throw reached vendorInbound's
// function-level dead-letter — abandoning her turn AFTER her reply had already
// gone. Every exit here is a returned verdict object and every failure is
// ledgered loudly, because the failure this cures was invisible for lack of
// that line.
//
// ═══ THE WINDOW IS ASKED FIRST — TDW_06/07, M1 ══════════════════════════════
// F-06.140: `metaCloud.js` (symbol `postMessage`) throws only on non-2xx, and an
// out-of-window failure arrives 200-THEN-WEBHOOK. Founder-witnessed on
// production 2026-08-08: two vendor notifications took a wamid and THEN reported
// `status=failed` out-of-window (16:44:22, 16:45:44), while a third rode the
// window his own 「 Hi 」 at 16:46:19 had opened (FINDINGS_LOG CE-212 §②). So the
// 131047 catch could never fire and the template fallback was never once
// reachable.
//
// **THE CATCH IS RETIRED WHOLE, NOT IMPROVED.** `WINDOW_CLOSED_CODE` and
// `isWindowClosed` are gone with it. A branch that can only fire on a predicate
// defect is the "dead branch pretending to be caution" this file's own R-R1
// comment refused elsewhere, and the false-open case is a CELL's job rather than
// a runtime limb. What replaces it is the estate's settled doctrine, already
// proven at the sibling site (`relayToCouple.js`, symbol `relayToCouple`, which
// states it in its own words: "there is no attempt, so there is no catch that
// needs to be reachable"): ASK, THEN CHOOSE THE ORGAN.
//
// A DISCLOSED-GAP COMMENT RETIRES WITH IT (F-06.191, proposed). The R-R5 block
// that stood here read "No live witness exists for which path fires on THIS
// lane." That witness arrived THREE DAYS after the comment was written and the
// sentence never moved — an F-06.85 conditional outliving its own condition,
// quoted as current truth by a later seat. Named here so the class is visible
// even though this cure retires the instance for free.
//
// ═══ WHAT THE OUT-OF-WINDOW VENDOR NOW HEARS ════════════════════════════════
// Until this sitting the alert said a bride enquired and never said WHAT SHE
// ASKED — `tdw_enquiry_brief_vendor` has been approved-and-unmapped on the WABA
// since 2026-08-05 because its mapper may be authored ONLY from the wire witness
// the founder pastes (F-08.75), and that witness landed at this sitting's
// charter. `{{3}}` is HER OWN SENTENCE. See `briefSummary` below.
'use strict';

const { sendWhatsApp }     = require('../whatsapp');
const { sendWa }           = require('../sendWa');
const { readLaneFlag }     = require('../laneFlags');
const { scrubText }        = require('./scrub');
const { vendorWindowOpen } = require('./waWindow');

// ── the out-of-window registry ───────────────────────────────────────────────
// Each entry carries its OWN param builder, because a template's variables are
// part of the template and a shared mapper would silently mis-order the day a
// second entry's slots differ. The `admin_config` dial picks the key.
//
// ── `enquiry_alert_vendor` IS RETIRED FROM THIS REGISTRY (CE Fork 5) ─────────
// It carried three slots — name/bride/link — and by construction could not say
// what she asked. The brief inherits its lane and its job HERE. Its reader at
// this door is gone, which is the whole of the retire-with-the-reader law that
// applies to this file.
//
// **IT IS NOT RETIRED FROM `src/lib/templates.js`, AND THAT IS A §0.2 REPORT,
// NOT A DRIFT.** A census at `dd48506` found a SECOND, LIVE, INDEPENDENT reader
// outside this sitting's radius: `src/api/couple/enquire.js` (symbol
// `POST /api/couple/enquire`) sends it as the PWA enquiry path's own
// window-closed fallback, wired at F-07.40, and a SEALED cell asserts the
// registry entry's presence (`scripts/b07_p5_bench.js`, §7.6). The ruling was
// issued from this door's reader; the second was found by command. Removing the
// registry entry would break a live surface and redden a sealed bench.
const OOW_REGISTRY = {
  enquiry_brief_vendor: {
    templateKey: 'enquiry_brief_vendor',
    // Chair-verified against `src/lib/templates.js`, symbol `TEMPLATES` —
    // variables ['name','bride','summary','link'], line 'vendor', status
    // 'approved', authored from the founder's own Edit screen and no other
    // source. All four values are resolvable at every relay site, so this mapper
    // authors NO new copy and needs no founder veto.
    build: ({ vendorName, brideName, summary, link }) => ({
      name:    vendorName,
      bride:   brideName,
      summary,
      link,
    }),
  },
};

const OOW_DIAL_KEY    = 'vendor.enquiry_alert_oow_template';
const OOW_FLAG_KEY    = 'vendor.enquiry_alert_oow_enabled';
const DEFAULT_OOW_KEY = 'enquiry_brief_vendor';

// ══ {{3}} — WHAT SHE SHARED, TRUTHFULLY, AND NOTHING INVENTED ═══════════════
//
// CE ruling, Fork 2 arm (a): HER SENTENCE VERBATIM — scrubbed, newline-collapsed,
// truncated with an ellipsis at the declared cap.
//
// WHY NOT THE MODEL'S NOTIFICATION FRAME, which the door already holds as
// `text`. Two reasons, both mechanical:
//   · it is MULTI-LINE on the returning-bride shape (`src/agent/engine.js`,
//     symbol `runCoupleAgenticTurn`, builds `${summary}\n\nHer message: "..."`)
//     and docs/TEMPLATES.md §1 states Meta rejects a newline inside a parameter;
//   · pulling her quote back out of it by regex is forbidden by this estate's
//     own written law, at the caller, one function above the call site:
//     `src/lib/vendorInbound.js` (symbol `scrubModelFrame`) — "Deriving the
//     quote here by regex would be guessing at a boundary the door already
//     holds as a fact; each call site passes the value it actually sent."
// So her words arrive as a PARAMETER (`brideMessage`), from the three call sites
// that hold them, exactly as `scrubModelFrame`'s `verbatim` already does.
//
// WHY NOT `leads.intent_summary`, which would read better. It is reachable only
// inside the engine and does not travel out on the turn's return object.
// CHARTERED AS A NOTE to the hygiene micro's successor (engine radius), never
// smuggled in here.
//
// THE TERSE-「 hi 」 COST IS ACCEPTED AS TRUTH'S PRICE (ruled). A bride who wrote
// "hi" renders as "here's what they shared: hi", which is what she shared.
//
// SCRUBBED, because every vendor-facing param passes the scrub door. NOTE the
// asymmetry with `scrubModelFrame`, and it is deliberate: there the FRAME scrubs
// and her QUOTE passes byte-exact, because scrubbing her words inside a quoted
// sentence would rewrite the witness. HERE there is no frame and no quotation —
// the value is handed to Meta as a bare parameter — so the firewall applies
// whole and nothing is being misattributed to her by it.
const SUMMARY_MAX_CHARS = 400;
const SUMMARY_FALLBACK  = 'no message text';

function briefSummary(raw) {
  const s = scrubText(String(raw == null ? '' : raw));
  // §1's own mechanical rule: no newline, no tab, no run of 4+ spaces may reach
  // a Meta body parameter. Collapsed rather than refused — her words survive,
  // their whitespace does not.
  const flat = s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!flat) return SUMMARY_FALLBACK;
  if (flat.length <= SUMMARY_MAX_CHARS) return flat;
  return `${flat.slice(0, SUMMARY_MAX_CHARS - 1).trimEnd()}…`;
}

/**
 * The one door. Notifies a vendor that a bride has enquired — free-form when his
 * 24-hour window is open, the approved brief when it is not.
 *
 * NEVER THROWS. Returns a verdict:
 *   { sent, path: 'text'|'template'|null, reason?, code?, key?, sid? }
 */
async function sendVendorEnquiryAlert({
  toPhone, text, vendorName, brideName, brideMessage, link,
  supabase = null, vendorId = null, ctx = 'enquiryAlert',
} = {}, deps = {}) {
  const _sendWhatsApp     = deps.sendWhatsApp     || sendWhatsApp;
  const _sendWa           = deps.sendWa           || sendWa;
  const _readLaneFlag     = deps.readLaneFlag     || readLaneFlag;
  const _vendorWindowOpen = deps.vendorWindowOpen || vendorWindowOpen;

  if (!toPhone) {
    console.warn(`[enquiry:oow] no vendor phone — nothing sent (ctx=${ctx})`);
    return { sent: false, path: null, reason: 'no_phone' };
  }

  // ── 1 · THE WINDOW, ASKED FIRST ────────────────────────────────────────────
  // `vendorWindowOpen` (src/lib/vendor/waWindow.js) resolves the vendor's
  // `vendor_self` conversations and asks the age of the newest inbound across
  // them. It NEVER THROWS and it FAILS CLOSED: no conversation, no inbound ever,
  // or a failed query all read CLOSED, never "assume open".
  //
  // ── A DERIVED ARM, DECLARED AND RATIFY-OR-REVERT ──────────────────────────
  // The charter ruled a BINARY (in-window ⇒ free-form · out-of-window ⇒ brief)
  // and the predicate is not binary — it also speaks `conversation_query_failed`,
  // `message_query_failed` and `window_check_threw:*`, which `relayToCouple`
  // treats as a THIRD verdict (`window_undetermined`) and refuses on.
  //
  // THIS DOOR TREATS `open !== true` AS OUT-OF-WINDOW, and the asymmetry with
  // `relayToCouple` is the point rather than an oversight. There, the arm under
  // an undetermined window is a FREE-FORM send, which Meta rejects outright if
  // the window is in fact shut — so refusing is the only honest move. HERE the
  // arm is an APPROVED UTILITY TEMPLATE, which is lawful in BOTH window states.
  // A template sent on an undetermined window is therefore never an unlawful
  // send; its only cost is a template charge where free-form would have done.
  // Silence would cost the vendor the lead.
  //
  // NAMED AS AN INFERENCE RATHER THAN ACTED ON SILENTLY (the unruled-arm law).
  // TO REVERT: change the test below to `w.open !== true &&
  // ['window_closed','no_inbound_ever','no_conversation'].includes(w.reason)`
  // and return a `window_undetermined` verdict otherwise. One line, one cell.
  const w = await _vendorWindowOpen(supabase, vendorId);
  const inWindow = !!(w && w.open === true);
  console.log(`[enquiry:oow] window ${inWindow ? 'OPEN' : 'SHUT'} reason=${(w && w.reason) || 'unknown'} `
    + `vendor=${vendorId || 'none'} ctx=${ctx}`);

  // ── 2 · IN WINDOW — the free-form alert, exactly as before this sitting ────
  if (inWindow) {
    try {
      const res = await _sendWhatsApp(toPhone, text);
      // THE SENTINEL, READ. `sendWhatsApp` reports refusal BY RETURN, never by
      // throw — `{ blocked: 'opted_out' | 'meta_media_unsupported' |
      // 'no_meta_lane' }`. Those are NOT window problems and must not fall
      // through to a template: an opted-out vendor is opted out of templates too.
      if (res && res.blocked) {
        console.warn(`[enquiry:oow] refused by the send door: ${res.blocked} (ctx=${ctx})`);
        return { sent: false, path: null, reason: res.blocked };
      }
      return { sent: true, path: 'text', sid: (res && res.sid) ?? null };
    } catch (err) {
      // EVERY CLASS: ledger loudly, RETURN, never throw (R-R4). This branch is
      // the bride's protection — before the rider that minted it, the throw
      // reached the function-level dead-letter and cost her the rest of her turn.
      // NOTE what is NOT here any more: the 131047 limb. It is retired, and this
      // is the generic branch it used to sit beside, unchanged.
      const code = err?.body?.error?.code ?? err?.code ?? '?';
      console.error(`[enquiry:oow] in-window send failed code=${code} ctx=${ctx} to=${String(toPhone).slice(-4)} — `
        + `vendor not notified; the turn continues (best-effort by ruling R-R4): ${err?.message || err}`);
      return { sent: false, path: null, reason: 'send_failed', code };
    }
  }

  // ── 3 · OUT OF WINDOW — the brief ─────────────────────────────────────────
  // PUSH IS NOT SPEAK (F-08.56). Default OFF; the founder arms it at the walk.
  // The flag SURVIVES the catch's retirement as the arming dial (CE Fork 5) —
  // founder-witnessed NO-ROW ⇒ false at CE-212 ⑥, and `readLaneFlag` fails
  // closed on an absent key, an unreachable database or a malformed value.
  const enabled = await _readLaneFlag(supabase, OOW_FLAG_KEY);
  if (!enabled) {
    console.warn(`[enquiry:oow] out-of-window brief is OFF (${OOW_FLAG_KEY}) — `
      + `vendor NOT notified, and this line is the record that he was not (ctx=${ctx})`);
    return { sent: false, path: null, reason: 'window_closed_fallback_disabled' };
  }

  const key = await readDial(supabase);
  const entry = OOW_REGISTRY[key];
  if (!entry) {
    // LOUD REFUSAL, ZERO SEND. A dial pointing at a template that does not exist
    // here must never fall back to "send something" — a guessed template is a
    // vendor-facing byte nobody approved.
    console.error(`[enquiry:oow] dial '${OOW_DIAL_KEY}' names unknown template '${key}' — `
      + `REFUSING, zero send. Known keys: ${Object.keys(OOW_REGISTRY).join(', ')} (ctx=${ctx})`);
    return { sent: false, path: null, reason: 'unknown_template_key', key };
  }

  try {
    const vars = entry.build({
      vendorName: scrubText(vendorName || 'there'),
      brideName:  scrubText(brideName  || 'a couple'),
      summary:    briefSummary(brideMessage),
      link,
    });
    const out = await _sendWa({
      line: 'vendor', to: toPhone, templateKey: entry.templateKey, vars, supabase,
    });

    // ── THE SID, READ THROUGH THE RIGHT CONTRACT (F-06.172, M4) ─────────────
    // `sendWa`'s template path is a COMPOSITE and this is the one place in the
    // estate that had to notice: its OUTER return speaks the free-form contract
    // (`{ sent: true, mode, key, ... }`) and its INNER `result` speaks the
    // template contract (`{ ok, wamid }`, from `metaCloud.js` symbol
    // `postMessage`). Reading `out.sid` would harvest undefined from a genuine
    // success — walk seven's exact defect, one lane over. The written home for
    // all three shapes is `src/lib/vendor/relayToCouple.js`, symbol
    // `SENDER_CONTRACTS`; this site names which one it reads.
    const wamid = (out && out.sent === true && out.result && out.result.wamid) || null;

    console.log(`[enquiry:oow] brief sent key=${entry.templateKey} wamid=${wamid || 'nosid'} ctx=${ctx}`);
    // THE META NAME, not the registry key — the `ringDoorbell` precedent writes
    // `[doorbell] <t.name>`, and a marker naming an internal key would tell a
    // reader of his history nothing about what Meta actually delivered.
    const { getTemplate } = require('../templates');
    const metaName = (getTemplate(entry.templateKey) || {}).name || entry.templateKey;
    await recordBriefSend(supabase, vendorId, metaName, wamid, ctx);
    return { sent: true, path: 'template', key: entry.templateKey, sid: wamid };
  } catch (tErr) {
    // The brief itself failed. Still no throw — same reasoning as above. sendWa
    // THROWS its refusals (opted out, not approved, line not configured), so
    // this catch is the honest reader of them and the code travels back.
    console.error(`[enquiry:oow] brief FAILED key=${entry.templateKey} ctx=${ctx}: ${tErr?.message || tErr}`);
    return { sent: false, path: null, reason: 'template_failed', code: tErr?.body?.error?.code ?? tErr?.code ?? null };
  }
}

// ══ M4 · THE SID DISCIPLINE AT THIS PATH'S OWN SITE ═════════════════════════
//
// F-06.143's second limb, cured where this door can reach. Until now the alert
// path wrote NO row of its own: the notification row is written by
// `src/agent/engine.js` (symbol `runCoupleAgenticTurn`) with `sent_by: 'system'`
// and NO `twilio_sid`, and the send happens later, here, where the sid exists
// and the row does not. So every status callback for an alert matched zero rows
// — eleven `matched=0` firings across two nights, all vendor-bound.
//
// **SCOPE, AMENDED HONESTLY BY THE CHAIR AND STATED AT ITS MECHANISM.** This
// cures the OOW ARM'S OWN SENDS. The in-window free-form leg still rides the
// engine's sid-less row, because that row is written on an engine surface this
// sitting holds READ-ONLY. THAT REMAINS OPEN AND IS THE HYGIENE MICRO'S
// (F-06.143 limb 1, `src/agent/engine.js`). Named here so the next reader sees
// the boundary at the boundary rather than in a document.
//
// THE ROW CARRIES A MARKER, NOT THE MESSAGE — the `ringDoorbell` precedent
// exact (`src/lib/vendor/relayToCouple.js`, symbol `ringDoorbell`, which writes
// `[doorbell] <template name>`). Writing the brief's rendered text would put the
// notification into the vendor agent's history a SECOND time, beside the
// engine's own row, and a duplicated notification is a regression the sid is not
// worth. `sent_by: 'system'` MINTS NO NEW REGISTER VALUE and matches the class
// the engine's own notification rows already carry.
//
// DELIBERATELY NOT `vendor_relay`: `relaySeat.js` (symbol `relayReceipt`) fires
// №14/№15 on that marker alone, and a receipt for THIS row would tell the vendor
// "Delivered to <his own number>" — his `vendor_self` thread's counterparty is
// himself. The sid is on file so an alert-receipt class stays POSSIBLE for a
// later sitting; it is not chartered here, just not foreclosed.
//
// BEST-EFFORT AND SILENT-FAILING BY DESIGN. The brief HAS reached his handset by
// the time this runs. A logging failure must never be reported as a send
// failure — that would be as false as the reverse.
async function recordBriefSend(supabase, vendorId, templateName, wamid, ctx) {
  if (!supabase || !vendorId) return false;
  try {
    // WITNESS: `docs/db/PUBLIC_SCHEMA.md`, `## public.conversations` — 12
    // columns; `vendor_id` col 2, `kind` col 5, `last_message_at` col 8. The
    // vendor's own thread is `kind = 'vendor_self'`, the map's first written
    // home being `src/lib/vendor/coupleWaWindow.js` (symbol VENDOR_LANE_KINDS's
    // header table).
    //
    // ORDER + LIMIT where the engine uses a bare `.maybeSingle()`: a vendor with
    // two `vendor_self` rows would make that call ERROR rather than choose. The
    // divergence is deliberate and declared; it cannot pick a different row than
    // the engine does in the single-row case, which is every case witnessed.
    const { data: convo, error: cErr } = await supabase
      .from('conversations').select('id')
      .eq('vendor_id', vendorId).eq('kind', 'vendor_self')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(1).maybeSingle();
    if (cErr || !convo) {
      console.warn(`[enquiry:oow] brief row NOT written — no vendor_self thread for vendor=${vendorId} (ctx=${ctx})`);
      return false;
    }
    // WITNESS: `## public.messages` — 18 columns; conversation_id(2),
    // direction(3), channel(4), body(5), sent_by(7), twilio_sid(10).
    const { error: mErr } = await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'outbound',
      channel: 'whatsapp',
      body: `[enquiry_brief] ${templateName}`,
      sent_by: 'system',
      twilio_sid: wamid ?? null,
    });
    if (mErr) {
      console.warn(`[enquiry:oow] brief row insert failed: ${mErr.message}`);
      return false;
    }
    console.log(`[enquiry:oow] brief row written convo=${convo.id} wamid=${wamid || 'nosid'}`);
    return true;
  } catch (e) {
    console.warn('[enquiry:oow] brief row threw:', e && e.message);
    return false;
  }
}

// Reads the dial. Absent row ⇒ the default key, which is the approved brief the
// estate now holds — so the flag alone is enough to turn this on.
async function readDial(supabase) {
  if (!supabase) return DEFAULT_OOW_KEY;
  try {
    // WITNESS: `## public.admin_config` — 4 columns; key(1) text NOT NULL,
    // value(2) text NOT NULL.
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
  briefSummary,
  recordBriefSend,
  OOW_REGISTRY, OOW_DIAL_KEY, OOW_FLAG_KEY, DEFAULT_OOW_KEY,
  SUMMARY_MAX_CHARS, SUMMARY_FALLBACK,
};
