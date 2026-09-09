'use strict';
// src/lib/vendor/introductions.js — R9-J1 · INTRODUCTIONS. THE ONE WRITER.
// CE-42 seat E2, packet 4a. Cut at fd9d0da4; RE-CUT at 09317d6bceb168afa23bac01ab7fa088f18a0b14.
//
// ═══ WHAT THIS IS ════════════════════════════════════════════════════════════
// R-41.11: a vendor hands over a number she met and what to send; the estate
// drafts ONE message in the filed template's own words, shows it to her, and
// sends only on her affirmative. The recipient gets her work, not a pitch. A
// reply is an enquiry. NO REPLY, NO FOLLOW-UP, EVER.
//
// ═══ WHAT THIS IS NOT ════════════════════════════════════════════════════════
// • NOT a prospect writer. The chair's Fork A ruling: the recipient never becomes
//   a `prospects` row. Three derived reasons, kept here so nobody re-adds it:
//   `prospects_source_check` refuses 'introduction' outright; `prospects.phone`
//   is UNIQUE, so two vendors introducing to one handset would collide; and
//   `state='opted_out'` is "terminal, CROSS-LINE" (src/lib/prospects.js:4) — a
//   stranger's STOP here would have silenced TDW's own marketing lane, and anyone
//   who had ever STOPped it would have silently refused her introduction. One
//   register, two owners. Per-vendor STOP and the per-vendor daily cap are R9's,
//   DECLARED AND NOT BUILT (F-42.40, F-42.41).
// • NOT a second lead writer. A reply becomes a lead through `createLead` with
//   `source='introduction'` and the meeting place in `notes` — `createLead` stays
//   the sole writer (roadmap §7). `leads.source` carries no CHECK
//   (docs/db/PUBLIC_SCHEMA.md:834), so that value needs no migration.
// • NOT a composer. The body is fixed at Meta (docs/TEMPLATES.md §2 entry 13).
//   Nothing here drafts prose; this module fills three slots and refuses.
//
// ═══ THE GATE ════════════════════════════════════════════════════════════════
// `cap.on('template.tdw_introduction') === true` or the row is filed DARK, the
// refusal is logged with `reason()`'s sentence, and nothing touches the network.
// A `template.*` row is a gate in its own right (0149:61-65; the precedent read
// is src/lib/couple/assistance.js:384) — chair-ruled, so there is no
// `flag.introduction_send` and no TEMPLATE_GUARDS entry.
//
// ═══ THE ROW IS FILED BEFORE THE GATE REFUSES ════════════════════════════════
// The shape is `notifyCoupleOfFound`'s (src/lib/couple/assistance.js:685-706) and
// its comment is the reason: a walk must never find a send that left no trace.
// So a dark refusal still writes a row — and that is exactly why `chipState`
// below exists.
//
// ═══ ROW-PRESENCE IS NOT A SEND ══════════════════════════════════════════════
// The open finding on the reminders room was a chip reading row-presence as sent
// over a null wamid. `chipState(row)` derives the vendor-facing state from
// `status` and `wamid` ONLY, and it returns 'not_sent' for a dark, staged,
// declined or failed row no matter how present that row is. It returns TOKENS,
// never sentences: W-1 caps 4a's soul radius at four strings and a chip label is
// the pwa's copy map, not this module's.
//
// ═══ E3, INHERITED (chair-ruled) ═════════════════════════════════════════════
// A bare "yes" does not send an introduction. `approvalNames` requires the
// vendor's affirmative to NAME the recipient, exactly as the relay lane's
// wrong-bride guard does. The relay lane's worst case is a message to a known
// client; this lane's is a MARKETING template landing on the wrong stranger's
// handset, from a WABA that carries her quality rating, with no follow-up
// permitted to explain it. Same guard, higher stakes.
//
// ═══ COPY ════════════════════════════════════════════════════════════════════
// Four founder-vetoed bytes from src/lib/victorLines.js (hash-carried, and that
// module now dies at boot on drift — F-42.46). Four bytes REUSED byte-exact from
// src/lib/vendor/relaySeat.js: `showBlock`, `sentLine`, `deliveredLine`,
// `mismatchBlock`. No second home was minted for the confirm frame: relaySeat's
// already carries the founder's own 2026-08-11 strike of "word for word"
// (F-06.185), and a twin would silently re-open a correction he made by hand.
// Its five gendered / "your client" lines are REFUSED here for the same reason
// they were vetoed there — they say things that are not true on this plane.

const cap = require('../capabilities');
const {
  showBlock, sentLine, deliveredLine, mismatchBlock, recipientLabel,
} = require('./relaySeat');
const { VICTOR_LINES } = require('../victorLines');
const { TEMPLATES } = require('../templates');

const TABLE = 'introductions';
const TEMPLATE_KEY = 'introduction';

// Typed refusals. Codes, never sentences — the door and the bench both read
// these, and a code that is also a byte is a byte with two homes.
const REFUSE = Object.freeze({
  NO_NUMBER:          'no_number',
  NO_NAME:            'no_name',
  NO_WHERE:           'no_where',
  ALREADY_INTRODUCED: 'already_introduced',
  NOT_APPROVED:       'not_approved',
  DARK:               'dark',
});

// The three slots the vendor supplies, in the order the door asks for them, each
// paired with the vetoed byte that asks. {{2}} and the button suffix are NOT here:
// they are read off her own vendor row and asking her for them is friction.
const SLOT_ASKS = Object.freeze({
  recipient_phone: VICTOR_LINES.INTRO_ASK_NUMBER,
  recipient_name:  VICTOR_LINES.INTRO_ASK_NAME,
  where_met:       VICTOR_LINES.INTRO_ASK_WHERE,
});
const SLOT_ORDER = Object.freeze(['recipient_phone', 'recipient_name', 'where_met']);

const trim = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * WHICH SLOT IS STILL MISSING, and the vetoed sentence that asks for it. Returns
 * null when all three are in hand. One question at a time and in a fixed order,
 * so a vendor who supplies two of three (the walk's own shape — "send my page to
 * <number>, met at <place>") is asked exactly once.
 */
function nextSlot(draft) {
  for (const slot of SLOT_ORDER) {
    if (!trim(draft && draft[slot])) return { slot, ask: SLOT_ASKS[slot], code: slotRefusal(slot) };
  }
  return null;
}

function slotRefusal(slot) {
  if (slot === 'recipient_phone') return REFUSE.NO_NUMBER;
  if (slot === 'recipient_name') return REFUSE.NO_NAME;
  return REFUSE.NO_WHERE;
}

/**
 * THE FILLED BODY, built from the registry's own bytes. NOT a paraphrase and not
 * a second copy: `TEMPLATES.introduction.body` is byte-for-byte the string Meta
 * holds (proven at the cut against docs/TEMPLATES.md:283), and this substitutes
 * its three positional slots for the SHOW frame alone. The wire payload is built
 * by `buildTemplatePayload` from the same entry — this never becomes a second
 * path to Meta.
 */
function filledBody({ recipient_name, vendor_name, where_met }) {
  const t = TEMPLATES[TEMPLATE_KEY];
  return String(t.body)
    .replace('{{1}}', trim(recipient_name))
    .replace('{{2}}', trim(vendor_name))
    .replace('{{3}}', trim(where_met));
}

/**
 * ① THE SHOW FRAME — relaySeat.js's byte, reused. `Here is the draft: "…" Send
 * this to <name> (<phone>)?`
 */
function showIntroduction(draft) {
  return showBlock(filledBody(draft), draft.recipient_name, draft.recipient_phone);
}

/**
 * E3, INHERITED. True only when the vendor's answer NAMES the recipient. A bare
 * "yes" is deliberately not enough on this plane.
 */
function approvalNames(answer, recipientName) {
  const said = trim(answer).toLowerCase();
  const who = trim(recipientName).toLowerCase();
  if (!said || !who) return false;
  return said.includes(who);
}

/**
 * THE VENDOR-FACING STATE, DERIVED — never row-presence.
 * A row exists from the moment she is shown a draft; existing is not sending.
 * `sent` requires BOTH a sent-class status AND a wamid, because a send that
 * produced no wamid is `sent_no_wamid` and has no receipt to speak from.
 */
function chipState(row) {
  if (!row) return 'none';
  const s = row.status;
  const hasWamid = !!(row.wamid && String(row.wamid).length);
  if (s === 'delivered' && hasWamid) return 'delivered';
  if (s === 'read' && hasWamid) return 'read';
  if (s === 'sent' && hasWamid) return 'sent';
  if (s === 'sent') return 'sent_no_receipt';
  if (s === 'sent_no_wamid') return 'sent_no_receipt';
  if (s === 'failed') return 'not_delivered';
  return 'not_sent';           // staged · declined · queued · dark, and anything unknown
}

/**
 * R-41.11's no-follow-up law, refused in code BEFORE the database refuses it
 * (R-41.146: the double refuses what the database refuses).
 * The refusal SPEAKS: `VICTOR_LINES.INTRO_ALREADY_SENT`, founder-vetoed at the
 * re-cut. 4a's first cut declared this gap rather than minting a byte under W-1,
 * and the chair filled it. A structural law the vendor cannot hear is a dead end
 * wearing a rule's clothes.
 */
async function alreadyIntroduced(supabase, vendorId, phone) {
  const { data } = await supabase
    .from(TABLE)
    .select('id, status, created_at')
    .eq('vendor_id', vendorId)
    .eq('recipient_phone', phone)
    .neq('status', 'declined')
    .limit(1);
  return Array.isArray(data) && data.length ? data[0] : null;
}

/**
 * STAGE — write the row and hand back the frame she is shown. Nothing is sent.
 * The row is written here and not at send time so that a draft she never approves
 * is still a fact the estate holds.
 */
async function stageIntroduction(supabase, { vendor, draft }) {
  const missing = nextSlot(draft);
  if (missing) return { ok: false, code: missing.code, ask: missing.ask };

  const phone = trim(draft.recipient_phone);
  const dupe = await alreadyIntroduced(supabase, vendor.id, phone);
  if (dupe) {
    console.log(`[introduction] vendor=${vendor.id} → ${phone} REFUSED ${REFUSE.ALREADY_INTRODUCED} (row ${dupe.id}, ${dupe.status}) — R-41.11, one introduction and no follow-up`);
    return { ok: false, code: REFUSE.ALREADY_INTRODUCED, existing: dupe, line: VICTOR_LINES.INTRO_ALREADY_SENT };
  }

  const row = {
    vendor_id:       vendor.id,
    recipient_phone: phone,
    recipient_name:  trim(draft.recipient_name),
    where_met:       trim(draft.where_met),
    page_code:       String(vendor.routing_handle || '').toUpperCase(),
    status:          'staged',
  };
  const { data, error } = await supabase.from(TABLE).insert(row)
    .select('id, vendor_id, recipient_phone, recipient_name, where_met, page_code, status, wamid').single();
  if (error) {
    console.error(`[introduction] vendor=${vendor.id} could not stage: ${error.message}`);
    return { ok: false, code: 'stage_failed', error: error.message };
  }
  const full = { ...data, vendor_name: vendor.business_name };
  return { ok: true, row: data, show: showIntroduction(full) };
}

/**
 * SEND — the dark arm. `cap.on(KEY) === true` or the row goes dark, the refusal
 * is logged and NOTHING touches the network.
 */
async function sendIntroduction(supabase, { vendor, row, answer }, deps = {}) {
  const capFn = (deps.cap && deps.cap.on) || cap.on;
  const reasonFn = (deps.cap && deps.cap.reason) || cap.reason;
  const KEY = cap.CAPABILITY_KEYS.TDW_INTRODUCTION;

  // E3 first: an unchecked affirmative is the one thing the guard exists to
  // refuse, and refusing it BEFORE the gate means a wrong name never even asks
  // whether the plane is on.
  if (!approvalNames(answer, row.recipient_name)) {
    console.log(`[introduction] id=${row.id} NOT SENT: affirmative did not name ${recipientLabel(row.recipient_name, row.recipient_phone)} — E3, re-shown`);
    return {
      sent: false, status: row.status, wamid: null, refusal: REFUSE.NOT_APPROVED,
      reshow: mismatchBlock(filledBody({ ...row, vendor_name: vendor.business_name }), row.recipient_name, row.recipient_phone),
    };
  }

  const armed = capFn(KEY) === true;
  const nowIso = new Date().toISOString();

  if (!armed) {
    const why = reasonFn ? reasonFn(KEY) : `${KEY} is off`;
    await supabase.from(TABLE)
      .update({ status: 'dark', approved_at: nowIso, updated_at: nowIso }).eq('id', row.id);
    console.log(`[introduction] id=${row.id} vendor=${vendor.id} status=dark — NOT SENT: ${why}`);
    return { sent: false, status: 'dark', wamid: null, refusal: why };
  }

  await supabase.from(TABLE)
    .update({ status: 'queued', approved_at: nowIso, updated_at: nowIso }).eq('id', row.id);

  // Lazily required, exactly as src/lib/couple/assistance.js:1052 does, so a
  // reader of this module (or a bench) never drags the transport in behind it.
  const sendWaFn = deps.sendWa || require('../sendWa').sendWa;

  // AN OBJECT, NEVER AN ARRAY — F-41.123. The builder reads a url button's suffix
  // by the button's own variable name (`vars[t.button.variable]`) and refuses to
  // read it positionally, because the button's {{1}} and the body's {{1}} are two
  // different variables that happen to share a number. `page_code` is the row's
  // own copy of her handle, not a fresh read of `vendors`.
  const vars = {
    recipient_name: row.recipient_name,   // {{1}}
    vendor_name:    vendor.business_name, // {{2}}
    where_met:      row.where_met,        // {{3}}
    page_code:      row.page_code,        // the url button's SUFFIX, not a body slot
  };

  try {
    const out = await sendWaFn({
      line: 'marketing', to: row.recipient_phone, templateKey: TEMPLATE_KEY, vars, supabase,
      site: 'introduction', ctx: `introduction=${row.id}`,
    });
    const sent = !!(out && out.sent === true);
    const wamid = sent && out.result && out.result.wamid ? String(out.result.wamid) : null;

    if (!sent) {
      // B1_CONCIERGE_TEMPLATES.md:88-92 — the whole reason this branch speaks.
      // Meta's own code is recorded so a throttled send (131049 on a MARKETING
      // body to a stranger) is never read by the vendor as the person's silence.
      const code = (out && out.error_code) || (out && out.refusal) || 'unknown';
      await supabase.from(TABLE).update({
        status: 'failed', error_code: String(code),
        error_title: out && out.error_title ? String(out.error_title) : null,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      console.log(`[introduction] id=${row.id} NOT DELIVERED code=${code}`);
      return { sent: false, status: 'failed', wamid: null, refusal: String(code), line: VICTOR_LINES.INTRO_NOT_DELIVERED };
    }

    await supabase.from(TABLE).update({
      wamid, status: wamid ? 'sent' : 'sent_no_wamid',
      sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    return {
      sent: true, status: wamid ? 'sent' : 'sent_no_wamid', wamid,
      line: sentLine(row.recipient_name, row.recipient_phone),
    };
  } catch (e) {
    const msg = String((e && e.message) || 'threw');
    await supabase.from(TABLE).update({
      status: 'failed', error_code: 'threw', error_title: msg,
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    console.error(`[introduction] id=${row.id} threw: ${msg}`);
    return { sent: false, status: 'failed', wamid: null, refusal: 'threw', line: VICTOR_LINES.INTRO_NOT_DELIVERED };
  }
}

module.exports = {
  TABLE, TEMPLATE_KEY, REFUSE, SLOT_ASKS, SLOT_ORDER,
  nextSlot, filledBody, showIntroduction, approvalNames, chipState,
  alreadyIntroduced, stageIntroduction, sendIntroduction,
  // relaySeat's bytes are re-exported so a reader of THIS module sees which four
  // are reused and grep finds one home, not two.
  showBlock, sentLine, deliveredLine, mismatchBlock,
};
