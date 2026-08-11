// src/lib/vendor/relayToCouple.js
// ── TDW_06 · THE HAND · SITTING TWO — THE RE-SITED VENDOR→BRIDE SEND ─────────
//
// R-29.3: RE-SITE, NEVER REVIVE. `src/lib/vendor/replyToCouple.js` is the
// corpse — complete, window-honest, and dead since arc M5 — and it stays
// byte-dead and READ-ONLY. Reviving its caller (`executeTool` in
// `src/agent/engine.js`) would resurrect `src/agent/systemPrompt.js`, including
// its dead money copy and its capability claim that the agent CAN send. THE
// LOGIC RE-SITES; THE MACHINERY DOES NOT REVIVE. What follows is that logic,
// rewritten against the foundations sitting one built, not a copy of it.
//
// WHAT CHANGED IN THE RE-SITING, EACH FOR A NAMED FINDING:
//   · THE WINDOW IS ASKED FIRST, and it is asked of `coupleWaWindow.js`
//     (`coupleWindowOpen`), which keys on the (business PNID, user MSISDN) PAIR.
//     The corpse keyed its own check on ONE `conversation_id` — F-06.147's
//     "incidental and unenforced" exactly. A bride in-window via vendor B was
//     invisible to vendor A.
//   · THE LANE IS PINNED EXPLICITLY. See below; this is the estate's FIRST.
//   · THE RETURN VALUE IS READ. See below; this is the estate's FIRST honest
//     reader of `whatsapp.js`'s `blocked` sentinels (F-06.146).
//   · THE SID IS PERSISTED. The thread row carries it here; the draft row
//     carries it through `coupleDrafts.markSent`. Both, deliberately (F-06.143).
//   · THE THREAD ROW IS STAMPED `sent_by: 'vendor_relay'`. The corpse wrote
//     `sent_by: 'agent'`, which is a true statement about the transport and a
//     false one about the author. Sitting one minted `vendor_relay` as a
//     reserved value with zero writers and taught the history builder to read
//     it (F-06.152). THIS FILE IS ITS FIRST AND ONLY WRITER.
//
// ── THE LANE PIN (F-06.147, R-29.16) — THE ESTATE'S FIRST ────────────────────
// Derived at 9d0bc62: `sendWhatsApp(toPhone, body, mediaUrls, from, deps)`
// (`src/lib/whatsapp.js`), and a census of all 42 call sites across `src/**/*.js`
// found NOT ONE passing a literal `from`. Every send in the estate rides
// `defaultFrom(env)` and lands on the right number by service scoping — which is
// how every 2026-08-08 bride message went out `[line=vendor]` correctly and
// ACCIDENTALLY. The agreement was real and unenforced; here it is enforced.
//
// WE RESOLVE `VENDOR_WHATSAPP_NUMBER` OURSELVES AND REFUSE WITHOUT IT (ruled).
// We deliberately do NOT ride `sendWa.js`'s `resolveFrom('vendor')`: that helper
// falls back to `TWILIO_WHATSAPP_NUMBER`, which `metaLaneFor` matches to no lane,
// so a mis-provisioned service would walk a relay into a `no_meta_lane` refusal
// via a dead transport instead of stopping at the honest fact — that this
// process has no vendor lane to send from. A refusal the vendor can read beats a
// refusal the vendor has to decode.
//
// ── THE SENTINEL READ (F-06.146) — ALSO THE ESTATE'S FIRST ───────────────────
// `whatsapp.js` reports refusal BY RETURN, never by throw:
// `{ blocked: 'opted_out' }` (:133) · `{ blocked: 'meta_media_unsupported' }`
// (:139) · `{ blocked: 'no_meta_lane' }` (:153). 38 of 56 send sites discard
// that return, so an opted-out recipient is a silent success. This site reads
// `sent === true` STRICTLY — `collab.js:658` is the model, and its own comment
// notes that `.sid` is not a success oracle.
//
// ── NEVER THROWS ─────────────────────────────────────────────────────────────
// Posture mirrored from `waWindow.js` / `coupleWaWindow.js`: typed reasons, no
// throw, fail closed. The caller is the WhatsApp door mid-turn; a throw here
// would re-instance F-08.85's bride-turn corruption, which is F-06.141 at a
// neighbouring site and not a mistake to make twice in one block.

'use strict';

const { coupleWindowOpen } = require('./coupleWaWindow');

// The window predicate's reasons, split by what they let us HONESTLY SAY.
//
// This split is the whole reason bytes ④ and ⑤ are two sentences and not one.
// `window_closed` / `no_inbound_ever` / `no_conversation` are POSITIVE KNOWLEDGE
// that she has not written — we may say so. A failed query or a thrown client is
// NOT knowledge of anything; saying "she hasn't written" there would be a false
// statement of fact wearing a courteous face.
const CLOSED_REASONS = ['window_closed', 'no_inbound_ever', 'no_conversation'];

function windowVerdict(w) {
  if (w && w.open === true) return 'open';
  if (w && CLOSED_REASONS.includes(w.reason)) return 'closed';
  return 'undetermined';
}

/**
 * Send an already-composed, already-approved message from a vendor to a bride.
 *
 * THIS LIB DOES NOT COMPOSE AND DOES NOT DECIDE. The bytes arrive already
 * approved and already stored; composition is Harvey's, the affirmative is the
 * vendor's, the store is `coupleDrafts.js`. Keeping delivery separate from
 * composition is the corpse's own ruling and it was right.
 *
 * @param {object} supabase
 * @param {object} args
 * @param {object} args.vendor         — `{ id }` at minimum
 * @param {string} args.couplePhone    — +E164, the draft row's own `couple_phone`
 * @param {string} args.body           — the stored bytes, read back, never re-rendered
 * @param {function} args.sendWhatsApp — DOOR-INJECTED (R-29.2). Never required at import.
 * @param {object} [args.env]
 * @returns {Promise<{ok: boolean, kind: string, reason?: string, threadId?: string, twilioSid?: string|null}>}
 */
async function relayToCouple(supabase, { vendor, couplePhone, body, sendWhatsApp, env } = {}) {
  const environment = env || process.env;

  if (!supabase) return { ok: false, kind: 'internal', reason: 'no_supabase' };
  if (!vendor || !vendor.id) return { ok: false, kind: 'internal', reason: 'no_vendor' };
  if (!couplePhone) return { ok: false, kind: 'no_recipient', reason: 'no_couple_phone' };
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) return { ok: false, kind: 'internal', reason: 'empty_body' };

  // TRANSPORT IS DOOR-INJECTED AND ITS ABSENCE IS A DECLARED REFUSAL, never a
  // TypeError. R-26.19 §A's spirit at runtime: a missing organ names itself.
  if (typeof sendWhatsApp !== 'function') {
    return { ok: false, kind: 'no_transport', reason: 'sendWhatsApp not injected into relayToCouple' };
  }

  // ── 1 · THE LANE, PINNED — before the window, before the thread, before any
  // work at all. If this process cannot name the number it would send FROM,
  // nothing downstream is worth doing.
  const from = environment.VENDOR_WHATSAPP_NUMBER;
  if (!from) return { ok: false, kind: 'no_vendor_lane', reason: 'VENDOR_WHATSAPP_NUMBER unset' };

  // ── 2 · THE WINDOW, ASKED FIRST (the window-first doctrine) ────────────────
  // F-06.140's class dies here by construction: there is no attempt, so there is
  // no catch that needs to be reachable. An UNDETERMINED window is a REFUSAL —
  // `sendWa.js`'s own "refusing to assume open" is the house precedent.
  const w = await coupleWindowOpen(supabase, couplePhone);
  const verdict = windowVerdict(w);
  if (verdict !== 'open') {
    return {
      ok: false,
      kind: verdict === 'closed' ? 'window_closed' : 'window_undetermined',
      reason: (w && w.reason) || 'unknown',
    };
  }

  // ── 3 · Find or create the couple_thread for (vendor, phone) ───────────────
  // The find-or-create order is the corpse's and is why 0117's `conversation_id`
  // is nullable: a draft can be staged before this row exists.
  let threadId = null;
  try {
    const { data: found, error: findErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('counterparty_phone', couplePhone)
      .eq('kind', 'couple_thread')
      .maybeSingle();
    if (findErr) return { ok: false, kind: 'internal', reason: 'thread_query_failed' };
    if (found) {
      threadId = found.id;
    } else {
      const { data: made, error: createErr } = await supabase
        .from('conversations')
        .insert({
          vendor_id: vendor.id,
          counterparty_phone: couplePhone,
          kind: 'couple_thread',
          state: 'new',
          mode: 'auto',
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (createErr || !made) {
        return { ok: false, kind: 'internal', reason: `thread_create_failed: ${(createErr && createErr.message) || 'unknown'}` };
      }
      threadId = made.id;
    }
  } catch (e) {
    return { ok: false, kind: 'internal', reason: `thread_threw: ${e && e.message}` };
  }

  // ── 4 · THE SEND, LANE-PINNED, RETURN READ ────────────────────────────────
  let out;
  try {
    out = await sendWhatsApp(couplePhone, text, [], from);
  } catch (e) {
    return { ok: false, kind: 'send_failed', reason: `send_threw: ${e && e.message}`, threadId };
  }
  if (!out || out.sent !== true) {
    // THE SENTINEL, READ. `blocked` carries which refusal it was; `sent !== true`
    // with no sentinel is the residual case and is still a failure, never a
    // success we round up.
    return {
      ok: false,
      kind: 'send_failed',
      reason: (out && out.blocked) ? `blocked:${out.blocked}` : 'not_sent',
      threadId,
    };
  }

  const twilioSid = out.sid || null;

  // ── 5 · THE THREAD ROW — `vendor_relay`'s FIRST AND ONLY WRITER ────────────
  // Sitting one taught `src/agent/engine.js` to render `From <name>: ` on rows
  // carrying this marker, assembly-time only, and that reader has fired on zero
  // production rows until now. This insert is what turns it on.
  //
  // `twilio_sid` is written HERE so `src/index.js`'s status callback has a row to
  // land on. F-06.143 is the estate's majority condition; this site is not
  // joining it.
  try {
    await supabase.from('messages').insert({
      conversation_id: threadId,
      direction: 'outbound',
      channel: 'whatsapp',
      body: text,
      sent_by: 'vendor_relay',
      twilio_sid: twilioSid,
    });
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId);
  } catch (logErr) {
    // The message HAS gone to her. Logging failure is real and must not be
    // reported as a send failure — telling the vendor it failed would be as
    // false as telling him it succeeded when it did not. It is surfaced, not
    // swallowed, and the send stands.
    console.warn('[relayToCouple] sent but thread logging failed:', logErr && logErr.message);
    return { ok: true, kind: 'sent', threadId, twilioSid, logged: false };
  }

  return { ok: true, kind: 'sent', threadId, twilioSid, logged: true };
}

// ── THE COUPLE DISPLAY NAME — ITS FIRST WRITTEN HOME ────────────────────────
// R-29.19 orders the E3 ask and the mismatch guard to render the bride's display
// name through ONE resolver, and orders a §0.2 if it turns out to have two homes.
// DERIVED at 9d0bc62 — it has none, and it has two inline SIBLINGS that agree:
//   · `src/agent/engine.js` (symbol `runCoupleAgenticTurn`) — leads.name by
//     (vendor_id, phone), `lead?.name || null`
//   · `src/agent/briefing.js` (symbol `buildBriefing`)      — the same query,
//     the same precedence, `lead?.name || null`
// SAME query, SAME precedence, no divergence — so this is F-06.153's species (a
// fact with no written home), NOT F-06.155's (two homes disagreeing), and it is
// not a §0.2. This function is the first written home; the two siblings are
// DECLARED AND LEFT, exactly as sitting one declared and left `brideNudge.js`
// rather than folding a live cron surface in passing. The fold is its own micro.
//
// A NAME IS NEVER INVENTED. Absent, blank or whitespace-only resolves to null and
// the caller renders the phone alone — the founder's own ruling that the confirm
// ALWAYS carries the phone means the guard never depends on a name existing.
async function coupleDisplayName(supabase, vendorId, couplePhone) {
  if (!supabase || !vendorId || !couplePhone) return null;
  try {
    const { data } = await supabase
      .from('leads')
      .select('name')
      .eq('vendor_id', vendorId)
      .eq('phone', couplePhone)
      .maybeSingle();
    const name = data && typeof data.name === 'string' ? data.name.trim() : '';
    return name || null;
  } catch (_e) {
    return null;
  }
}

// A recipient the vendor gave as a phone number rather than a name. Deliberately
// narrow: +E164 or a bare run of digits long enough to be a number and not a
// count. `couple_phone` is stored +E164 on this lane (the founder's 2026-08-11
// paste; `coupleWaWindow.js`'s stated matching contract), so a bare form is
// normalised UP to +E164 here rather than being matched loosely downstream —
// F-06.154 is a real hazard and this is the one door that can close it locally.
const PHONE_LIKE = /^\+?\d{10,15}$/;

function asPhone(raw) {
  const s = String(raw || '').replace(/[\s\-()]/g, '');
  if (!PHONE_LIKE.test(s)) return null;
  if (s.startsWith('+')) return s;
  if (s.length === 10) return `+91${s}`;   // the estate's lane is India; a bare 10 is national
  return `+${s}`;
}

/**
 * WHO THE MESSAGE IS FOR. Re-sited from the corpse's resolution block with its
 * refusal intact and its guessing removed.
 *
 * THE CORPSE'S ONE RULE WORTH KEEPING VERBATIM (`replyToCouple.js`, recovery 2):
 * with more than one candidate it DOES NOT GUESS. Under E3 that refusal stops
 * being a lookup nicety and becomes the wrong-bride guard's outer wall — and the
 * inner wall is the named confirm the founder ruled.
 *
 * @returns {Promise<{phone: string|null, name: string|null, reason: string}>}
 */
async function resolveRecipient(supabase, vendorId, recipient) {
  const raw = String(recipient || '').trim();
  if (!supabase || !vendorId) return { phone: null, name: null, reason: 'no_supabase_or_vendor' };
  if (!raw) return { phone: null, name: null, reason: 'no_recipient_given' };

  // (a) He gave a number. Take it, and look up a name for display only.
  const direct = asPhone(raw);
  if (direct) {
    return { phone: direct, name: await coupleDisplayName(supabase, vendorId, direct), reason: 'phone_given' };
  }

  // (b) He gave a name. Leads first — the typed plane owns clients (LD-1).
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('name, phone')
      .eq('vendor_id', vendorId)
      .ilike('name', raw)
      .not('phone', 'is', null);
    if (error) return { phone: null, name: null, reason: 'lead_query_failed' };
    const rows = (leads || []).filter((l) => l && l.phone);
    const distinct = Array.from(new Set(rows.map((l) => l.phone)));
    if (distinct.length === 1) {
      const match = rows.find((l) => l.phone === distinct[0]);
      return { phone: distinct[0], name: (match && match.name) || raw, reason: 'lead_matched' };
    }
    if (distinct.length > 1) return { phone: null, name: raw, reason: 'ambiguous_recipient' };
  } catch (e) {
    return { phone: null, name: null, reason: `lead_threw: ${e && e.message}` };
  }

  return { phone: null, name: raw, reason: 'no_phone_on_file' };
}

// ══ THE DOORBELL (R-29.24) — THE ④-FORK'S TEMPLATE ARM ══════════════════════
//
// ON A CLOSED WINDOW the estate has, until now, had exactly one honest answer:
// byte ④, the draft waits, and nothing reaches her until she happens to write.
// The doorbell is the other arm: a UTILITY template that tells her there IS an
// update, whose reply RE-OPENS the window so the vendor's real words can follow
// verbatim.
//
// FIVE PROPERTIES, EACH RULED AND EACH CELLED:
//  ① it fires ONLY on `window_closed` — never on `window_undetermined`, because
//    a doorbell rung on a window we could not read is a message sent on a guess;
//  ② THE LANE IS PINNED, exactly as the free-form send pins it. A doorbell from
//    the bride PNID invites her reply onto the wrong number and the mechanic
//    dies silently — she answers into a lane holding no draft;
//  ③ SID DISCIPLINE on its own send, same as every other write in this file;
//  ④ ITS FAILURE FALLS BACK TO BYTE ④ VERBATIM. A doorbell that did not go never
//    claims it did — the whole arc's law, applied to its newest limb;
//  ⑤ THE DRAFT'S STATE MACHINE IS UNTOUCHED. The doorbell is a NOTIFICATION
//    BESIDE the flow, never a transition in it: the draft stays `refused` with
//    `window_closed`, exactly as it would with no doorbell at all. What changes
//    is only what the VENDOR is told, and only when she was actually rung.
async function ringDoorbell(supabase, { vendor, couplePhone, brideName, env, deps = {} }) {
  const environment = env || process.env;
  try {
    const { getTemplate, isApproved, buildTemplatePayload } = require('../templates');
    const KEY = 'enquiry_update_couple';
    const t = getTemplate(KEY);
    // ① the fork point: no mapped+approved template ⇒ byte ④, unchanged.
    if (!t || !isApproved(KEY)) return { ok: false, reason: 'no_mapped_template' };

    // ② THE LANE, PINNED — by the template's own declared line, resolved through
    // sendWa's one home. An unset PNID is a REFUSAL, never a send to marketing's
    // default (metaCloud.resolveConfig would fall back there, which is exactly
    // the silent wrong-number failure ② exists to prevent).
    const { phoneNumberIdFor } = require('../sendWa');
    const pnid = phoneNumberIdFor(t.line);
    if (!pnid) return { ok: false, reason: `no_pnid_for_lane:${t.line}` };

    const vendorName = vendor.business_name || vendor.name || 'your vendor';
    const first = String(brideName || '').trim().split(/\s+/)[0] || 'there';
    const payload = buildTemplatePayload(KEY, { name: first, vendor: vendorName });

    const send = deps.sendMetaTemplate
      || require('../metaCloud').sendMetaTemplate;
    const out = await send({ to: couplePhone, payload }, { phoneNumberId: pnid });
    // The sentinel is READ here too — `sent !== true` is a failure, never rounded up.
    if (!out || out.sent !== true) return { ok: false, reason: (out && out.blocked) ? `blocked:${out.blocked}` : 'not_sent' };
    return { ok: true, twilioSid: out.sid || null, line: t.line, template: t.name };
  } catch (e) {
    return { ok: false, reason: `doorbell_threw: ${e && e.message}` };
  }
}

module.exports = {
  relayToCouple,
  ringDoorbell,
  resolveRecipient,
  coupleDisplayName,
  asPhone,
  CLOSED_REASONS,
  windowVerdict,
};
