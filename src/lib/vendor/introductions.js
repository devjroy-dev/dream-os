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
// F-42.90 · THE ESTATE'S NORMALISER, NOT A SECOND SPELLING. `normalizePhone`
// takes the last ten and returns null below ten; `e164FromLastTen` prefixes
// DEFAULT_COUNTRY ('91', assistance.js:68, India-only by R-41.34). Both come from
// the one home rather than being re-minted here, because a '+91' literal in this
// file would be a second place to change on the day the estate is not India-only.
const { normalizePhone, e164FromLastTen } = require('../couple/assistance');
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

  // ── F-42.90 · THE COLUMN HAD NO STORED FORM ────────────────────────────────
  // THIS LINE READ `trim(draft.recipient_phone)` — whatever the vendor typed.
  // `+918757788550`, `8757788550` and `+91 87577 88550` all landed verbatim and
  // were three different values to every equality in the estate. What that cost:
  //   • `alreadyIntroduced` below matches `.eq('recipient_phone', …)`, and
  //   • `uq_introductions_vendor_recipient` (0161) is the same equality at the
  //     database — so R-41.11's no-follow-up law, the ONE law this table exists
  //     to make structural, was bypassed by retyping the number differently.
  //     The double refused nothing, because neither half could see two spellings
  //     of one handset as one handset.
  //   • and her reply arrives as bare digits through `normalizeTo`
  //     (metaCloud.js:65), which never matches a stored '+'-form by equality.
  // NOT a wire defect: `postMessage` repairs exactly-ten at metaCloud.js:163
  // (F-40.250), so the message did reach her. It repaired the SEND and never
  // wrote back, so the row kept disagreeing with what was actually sent.
  const phone = e164FromLastTen(normalizePhone(draft.recipient_phone));

  // `nextSlot` proved the field non-EMPTY; it cannot prove it is a number. A
  // string of fewer than ten digits normalises to null, and the refusal is the
  // one the door already speaks — REFUSE.NO_NUMBER with the founder's own vetoed
  // ask. ZERO NEW BYTES: this arm asks again, it does not invent a sentence.
  if (!phone) {
    return { ok: false, code: REFUSE.NO_NUMBER, ask: SLOT_ASKS.recipient_phone };
  }

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

// ═══════════════════════════════════════════════════════════════════════════
// J1-IN · THE INBOUND ARM (F-42.69). CE-42 seat E, packet 4a's last.
// ═══════════════════════════════════════════════════════════════════════════
// A stranger who received an introduction and replies on the marketing line
// landed in `handleMarketingInbound`, which knew prospects and STOP and did not
// know this table. Her reply became nothing.
//
// IT LIVES HERE AND NOT IN `prospects.js` BECAUSE OF THE FIRST LINE OF THIS
// FILE. This module is THE ONE WRITER for `introductions`; `prospects.js` is the
// marketing lane's own writer and is guarded. So the lane calls in, and the arm
// below writes — `prospects.js` gains a branch and not a second writer.
//
// SHE IS NEVER A PROSPECT — the chair's Fork A ruling, and the reason the branch
// sits ABOVE the STOP arm rather than after it. `prospects.js:185` opens the STOP
// arm with `findOrCreateProspectByPhone`, so "STOP first" IS "create a prospect
// first": a stranger who says no to Mira would have been minted as one of TDW's
// own marketing rows by saying it. The arm identifies her with a READ, and only
// an unmatched number reaches :184 — where today's file runs byte-unchanged.

const REACHED = Object.freeze(new Set(['sent', 'sent_no_receipt', 'delivered', 'read']));

/**
 * DID THIS ROW ACTUALLY REACH HER? Asked through `chipState` and never through a
 * second list of status words. `chipState` is already the estate's answer to
 * "row-presence is not a send" and is already benched; a private status set here
 * would be a second vocabulary for one fact, and the two would drift.
 *
 * ⚠ DECLARED WIDENING OF THE RULING'S WORDS. The chair ruled "most recent
 * sent/delivered row". This set also admits `read` and `sent_no_receipt`. A
 * `read` row is the LIKELIEST match of all — she read it and then replied — and
 * excluding it would drop the ordinary case; `sent_no_receipt` is a message that
 * left with no wamid to prove it, which is a receipt gap and not a send that
 * did not happen. Named here and in the handover rather than taken quietly.
 */
function reachedHer(row) {
  return REACHED.has(chipState(row));
}

/**
 * THE MATCH · BY SUFFIX, NEVER BY EQUALITY.
 * Her inbound arrives as bare digits (`normalizeTo`, metaCloud.js:65) and this
 * column has held, historically, whatever the vendor typed (F-42.90). Equality
 * cannot join those two. `vendorForPhone`'s pattern is the estate's settled
 * shape for exactly this and is what is used: last ten, `like '%<ten>'`.
 *
 * TWO VENDORS, ONE HANDSET: `uq_introductions_vendor_recipient` is PER-VENDOR,
 * so two vendors may each introduce to one number. The chair ruled MOST RECENT
 * WINS — she replied to the message she saw, and one message is one lead. The
 * other vendors' rows stay unanswered, which is the honest outcome: she did not
 * write to them.
 *
 * NO INDEX ON `recipient_phone` ALONE and none added here (0161 indexes
 * `(vendor_id, created_at desc)` and `wamid`). This is a scan of a small table on
 * every marketing inbound. NAMED, per the ruling, rather than cured unasked.
 *
 * A STOPPED ROW STILL MATCHES. It must: if a stopped row fell through, her next
 * message would reach :184 and mint the prospect the STOP existed to prevent.
 */
async function matchInboundIntroduction(supabase, fromPhone) {
  const ten = normalizePhone(fromPhone);
  if (!ten) return null;

  // ⚠ THE TRY IS THE WHOLE CLAIM, AND THE FIRST CUT DID NOT HAVE IT.
  // This arm handled the RETURNED `error` and nothing else, while the comment
  // below it promised the lane could never be taken down. The floor proved the
  // promise false: three prospect-lane benches went ERROR, not RED, on
  // `supabase.from(...).select(...).like is not a function` — a throw from the
  // client itself, sailing straight past an `error` check that never ran.
  // Production always has the table, so this would have sat here as a true-
  // sounding sentence over code that could not keep it, and the day it mattered
  // would have been a day the whole marketing lane stopped answering.
  // The estate's own doctrine at the sibling sites (assistance.js's
  // notifyCoupleOfFound, enquiryAlert.js's R-R4): every exit is a returned
  // verdict, every failure is loud, nothing propagates.
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, vendor_id, recipient_phone, recipient_name, where_met, page_code, status, wamid, sent_at, stopped_at, created_at')
      .like('recipient_phone', `%${ten}`)
      .order('sent_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Degrades to exactly today's behaviour — she falls through to :184. Loud,
      // because a silent degrade to the old disease is what this packet ends.
      console.error(`[introduction:in] match FAILED for ${ten}: ${error.message} — falling through to the prospect arms`);
      return null;
    }

    const rows = Array.isArray(data) ? data : [];
    const reached = rows.filter(reachedHer);
    if (!reached.length) return null;
    return reached[0];            // already ordered: sent_at desc, then created_at desc
  } catch (e) {
    console.error(`[introduction:in] match THREW for ${ten}: ${(e && e.message) || e} — falling through to the prospect arms`);
    return null;
  }
}

/**
 * HER STOP · THE ROW IS MARKED AND NO PROSPECT IS BORN.
 * `stopped_at` and NOT a `status` value — migration 0162, and the reason is the
 * receipt lane: `relayStatus.js:420-425` writes `status` by wamid, so a `stopped`
 * status would be overwritten by a `read` arriving afterwards, and writing it
 * over `delivered` would destroy the receipt. Two facts, two columns.
 *
 * IDEMPOTENT. A second STOP re-stamps and returns the same verdict; there is
 * nothing to refuse and refusing would be a message she did not ask for.
 */
async function markIntroductionStopped(supabase, rowId) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(TABLE).update({ stopped_at: now, updated_at: now }).eq('id', rowId);
  if (error) {
    console.error(`[introduction:in] id=${rowId} STOP not recorded: ${error.message}`);
    return { ok: false, error: error.message };
  }
  console.log(`[introduction:in] id=${rowId} STOPPED — row marked, NO prospect created (Fork A)`);
  return { ok: true, stopped_at: now };
}

/**
 * HER REPLY · ONE LEAD, THROUGH THE SOLE WRITER.
 * `createLead` stays the only door onto `leads` (roadmap §7). `leads.source`
 * carries no CHECK (PUBLIC_SCHEMA.md:834), so `'introduction'` needs no migration.
 *
 * THE SUFFIX PRE-RESOLVE IS RULING §6(a), AND IT IS HERE BECAUSE `leads.js` IS
 * GUARDED. `createLead`'s dedupe is exact equality (`leads.js:231`) over a column
 * that holds mixed forms (F-42.70 — one bare-ten row exists). Writing E.164 past
 * that dedupe would MISS a legacy row and mint a duplicate, which is the second
 * acceptance cell failing on real data. So the arm carries the widened match and
 * hands `updateLead` a row id; widening the dedupe itself is F-42.92's charter.
 *
 * FILL WHAT IT LACKS, NEVER MOVE WHAT IT HOLDS — `leads.js`'s own R-37.32
 * doctrine, applied by this caller rather than re-implemented. In particular
 * `source` IS NOT OVERWRITTEN: a lead that arrived through Discover and later
 * replied to an introduction still arrived through Discover, and rewriting that
 * column would be this arm telling a lie about where she came from.
 */
async function leadFromIntroduction(supabase, row, { text } = {}) {
  const { createLead, updateLead } = require('./leads');
  const ten = normalizePhone(row.recipient_phone);
  const phone = e164FromLastTen(ten);
  const notes = `Met at ${row.where_met}`;

  const { data: hits } = await supabase
    .from('leads')
    .select('id, name, notes, raw_message, source, created_at')
    .eq('vendor_id', row.vendor_id)
    .like('phone', `%${ten}`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(2);

  const existing = Array.isArray(hits) ? hits : [];

  if (existing.length) {
    if (existing.length > 1) {
      // Two leads for ONE vendor and ONE handset is a register already broken for
      // that vendor. `vendorForPhone` refuses to guess in this shape, but refusing
      // HERE would discard her enquiry entirely — strictly worse. The newest is
      // updated and the ambiguity is said out loud.
      console.warn(`[introduction:in] vendor=${row.vendor_id} has ${existing.length} leads on last-ten ${ten} — updating the newest (${existing[0].id}); F-42.70 register`);
    }
    const target = existing[0];
    const patch = {};
    if (!target.name && row.recipient_name) patch.name = row.recipient_name;
    if (!target.notes) patch.notes = notes;
    if (!target.raw_message && text) patch.raw_message = text;

    if (!Object.keys(patch).length) {
      console.log(`[introduction:in] lead ${target.id} already holds everything this reply carries — no write`);
      return { ok: true, leadId: target.id, created: false, updated: false };
    }
    const upd = await updateLead(supabase, row.vendor_id, target.id, patch);
    if (!upd.ok) {
      console.warn(`[introduction:in] lead ${target.id} update failed: ${upd.error}`);
      return { ok: true, leadId: target.id, created: false, updated: false };
    }
    console.log(`[introduction:in] lead ${target.id} UPDATED from introduction ${row.id} (${Object.keys(patch).join(', ')})`);
    return { ok: true, leadId: target.id, created: false, updated: true, fields: Object.keys(patch) };
  }

  const res = await createLead(supabase, row.vendor_id, {
    name:        row.recipient_name,
    phone,
    source:      'introduction',
    notes,
    raw_message: text || null,
  });
  if (!res.ok) {
    console.error(`[introduction:in] createLead FAILED for introduction ${row.id}: ${res.error}`);
    return { ok: false, error: res.error };
  }
  console.log(`[introduction:in] lead ${res.lead.id} CREATED source=introduction from ${row.id} (vendor ${row.vendor_id})`);
  return { ok: true, leadId: res.lead.id, created: !res.deduped, updated: false };
}

/**
 * THE ONE ENTRY POINT the marketing lane calls. Returns null when this number is
 * a stranger to the table, and the lane then runs today's arms byte-unchanged.
 *
 * SHE IS ANSWERED WITH SILENCE — §7, ruled. She replied to a MARKETING template
 * on a WABA that carries its own quality rating, and R-41.11 forbids the
 * follow-up; an unprompted second message to a stranger who has said one thing is
 * the exact shape that law exists to refuse, however bland the byte. Her vendor
 * answers her, inside the window her reply just opened. ZERO NEW BYTES here, and
 * the vendor's push notice is F-42.96's template, not this packet's.
 */
async function handleIntroductionInbound(supabase, { from, text, isStop }) {
  const row = await matchInboundIntroduction(supabase, from);
  if (!row) return null;

  // THE MATCH IS OUTSIDE THIS TRY AND THE WRITES ARE INSIDE IT, ON PURPOSE.
  // The match already fails to null and falling through is correct for an
  // unmatched number. Once she IS matched, falling through is the ONE thing that
  // must not happen — :184 would mint her as a prospect, which is Fork A broken —
  // so a failure past this point returns a verdict naming itself and stops here.
  // She gets silence either way; what changes is whether the estate lies about
  // her afterwards.
  try {
    if (isStop) {
      const out = await markIntroductionStopped(supabase, row.id);
      return { action: 'introduction_stopped', introductionId: row.id, vendorId: row.vendor_id, ok: out.ok };
    }

    if (row.stopped_at) {
      // She said stop and has written again. The row is not re-opened and no lead
      // is made, but she still does NOT fall through — falling through is what
      // would mint the prospect her STOP refused.
      console.log(`[introduction:in] id=${row.id} inbound after STOP — no lead, no prospect`);
      return { action: 'noop_introduction_stopped', introductionId: row.id, vendorId: row.vendor_id };
    }

    const lead = await leadFromIntroduction(supabase, row, { text });
    return {
      action: 'introduction_lead',
      introductionId: row.id,
      vendorId: row.vendor_id,
      leadId: lead.leadId || null,
      created: !!lead.created,
      updated: !!lead.updated,
    };
  } catch (e) {
    console.error(`[introduction:in] id=${row.id} THREW after match: ${(e && e.message) || e} — ` +
      'her reply is NOT filed as a lead and must be recovered by hand; no prospect was created');
    return { action: 'introduction_failed', introductionId: row.id, vendorId: row.vendor_id, error: String((e && e.message) || e) };
  }
}

module.exports = {
  TABLE, TEMPLATE_KEY, REFUSE, SLOT_ASKS, SLOT_ORDER,
  // J1-IN · the inbound arm
  reachedHer, matchInboundIntroduction, markIntroductionStopped,
  leadFromIntroduction, handleIntroductionInbound,
  nextSlot, filledBody, showIntroduction, approvalNames, chipState,
  alreadyIntroduced, stageIntroduction, sendIntroduction,
  // relaySeat's bytes are re-exported so a reader of THIS module sees which four
  // are reused and grep finds one home, not two.
  showBlock, sentLine, deliveredLine, mismatchBlock,
};
