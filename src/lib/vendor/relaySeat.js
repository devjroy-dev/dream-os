// src/lib/vendor/relaySeat.js
// ── TDW_06 · THE HAND · SITTING TWO — THE DOOR'S RELAY SEAT ─────────────────
//
// EVERYTHING VENDOR-FACING IN THIS ARC IS COMPOSED HERE, AND HERE IS A DOOR.
//
// R-29.18 / R-29.23: the SHOW frame, the E3 confirm and every deed line are
// composed AT THE DOOR from the tools' STRUCTURED RETURNS — never voiced by a
// model. The ruling's ground is 2026-08-08 itself: a frame the model voices is a
// frame the model can paraphrase, and 「 Message is ready. Send it? 」 is the
// specimen of exactly that death — the founder approved bytes he never saw.
// QUOTED-ARTEFACT IS MECHANICAL OR IT IS NOTHING.
//
// ── WHY THIS IS ITS OWN FILE AND NOT A BLOCK INSIDE vendorInbound.js ────────
// `vendorInbound.js` is 1661 lines and is the estate's most-read door. The
// relay's composition is a self-contained function of (supabase, vendor, result,
// deps) — the same property that let the wire guard seat at both doors from one
// home. Siting it here keeps the door's diff small and gives the PWA-door parity
// micro (R-29.21, chartered) ONE home to call rather than a block to copy.
// DECLARED AS A SITING CHOICE, cheap to move, the chair's to overrule.
//
// ── R-29.22 IS VACATED AND THIS FILE IS WHY (R-29.23, chair correction №6) ──
// The deed does NOT ride `loop.ts`'s `appendDeedTail` seam. That seam annotates
// `listen_harvey_talk.result` — DONNA'S REPORT TO HARVEY — so a deed sat there
// reaches the vendor only after a model reads it and composes a sentence about
// it, which is 08-08's mechanism one field over. Two further walls, both
// derived: `RELAY_DEED_SEAM`'s bytes (`\n— from the file: `) are a
// founder-vetoed RECORD-CORRECTION register and read as nonsense on a send; and
// `b06_f0613_relay_bench.js` §2.11 asserts `!/const RELAY_DEED_SEAM/.test(loop)`,
// so a second seam constant in `loop.ts` turns a green sealed cell red.
// `src/engine/src/core/relaySeam.ts` is BYTE-UNTOUCHED by this sitting and its
// site-count comment ("`refused` is authored at TWO sites") stays true — this
// file authors no `refused` array anywhere.
//
// ── THE ELEVEN BYTES ────────────────────────────────────────────────────────
// Every vendor-facing string below is FOUNDER-VETOED, 2026-08-11, 「 approve all 」
// on the eleven-byte slate, plus 「 approve 」 on ④b at the doorbell rider's
// ruling. APPROVED-COPY-CARRIES-ITS-HASH: the veto words ride beside the
// constants so the next session inherits the RULING and not merely the string.
// Byte ids below are the slate's own numbering and are load-bearing for the
// register — do not renumber them to tidy the file.
//
// ── THE PHONE RENDERS AS THE STORED BYTE, VERBATIM (R-5, founder 「 confirm 」) ─
// `+919625759924`, not `+91 96257 59924`. His own spaced form is retired as
// placeholder shape ON HIS WORD. House precedent is verbatim rendering
// (`vendorInbound.js:863`, founder-vetoed fixed copy) and the estate holds ZERO
// phone formatters. A formatter would make the displayed phone a TRANSFORMATION
// of the stored anchor rather than the anchor itself, and would owe an inverse
// cell over both of F-06.154's stored shapes. It buys nothing the guard needs.

'use strict';

const drafts = require('./coupleDrafts');
const { relayToCouple, resolveRecipient, coupleDisplayName } = require('./relayToCouple');

// ── THE SIGNAL NAMES. One home, mirrored from the engine's own
// `RELAY_SIGNAL_NAMES` (src/engine/src/core/tools/relayCouple.ts). Two strings
// that must agree across a module boundary the engine cannot cross; a cell
// asserts the agreement in both directions rather than trusting the eye.
const STAGE_SIGNAL = 'donna_relay_stage';
const SEND_SIGNAL = 'donna_relay_send';

// ── THE RECIPIENT LABEL — the founder's ruling in one function ──────────────
// 「 1-yes. infact, even when name is known, phone number should be mentioned. 」
// (2026-08-11). ONE form plus its nameless fallback. The phone is the draft
// row's own `couple_phone`: NOT NULL, stored, the mechanical subject itself.
// The name is display sugar from the one-home resolver on top of it.
function recipientLabel(name, phone) {
  return name ? `${name} (${phone})` : `${phone}`;
}

// ── ① THE SHOW FRAME + ② THE E3 CONFIRM ────────────────────────────────────
// Rendered from the STORED `body`, read back off the row the door just wrote.
// That read-back is A1's first hop and it is why the frame cannot drift: there
// is no variable here holding a second copy of the bytes.
function showBlock(body, name, phone) {
  return `Here is the draft, word for word:\n\n"${body}"\n\nSend this to ${recipientLabel(name, phone)}?`;
}

// ── THE DEED LINES ─────────────────────────────────────────────────────────
// Each is a pure function of the structured return. No model prose reaches any
// of them, and none of them narrates machinery: the vendor hears the fact and
// the register (`refusal_reason`, 0118) keeps the reason.

// ③ SENT.
const sentLine = (name, phone) => `Sent to ${recipientLabel(name, phone)}.`;

// ④ WINDOW CLOSED — she has not written. POSITIVE KNOWLEDGE ONLY.
// A BYTE WITH A NAMED SUCCESSOR: when the doorbell template is mapped, ④b
// replaces this on the mapped path and ④ survives as the fallback forever —
// a doorbell that did not go never claims it did.
const windowClosedLine = (name) =>
  `Not sent. ${name || 'She'} hasn't written in over 24 hours, and I can't open a new message to her until she does. ` +
  `The draft is saved — the moment she writes, say the word and it goes.`;

// ⑤ WINDOW UNDETERMINED — we do not know, and we do not say we do.
// This is a SEPARATE byte from ④ deliberately: ④ asserts she has not written,
// and on a failed query or a thrown client that assertion would be a false
// statement of fact wearing a courteous face.
const windowUndeterminedLine = () =>
  `Not sent. I couldn't confirm whether her line is open, and I won't send blind. The draft is saved.`;

// ⑥ EXPIRED.
const expiredLine = () =>
  `That draft is more than 24 hours old, so I haven't sent it. Tell me again and I'll write it fresh.`;

// ⑦ SEND FAILED — ONE byte for every failure mode (ruled). The WHY lives in
// `refusal_reason`; the opt-out split is on the founder's shelf, not minted.
const sendFailedLine = (name) =>
  `I couldn't send it. Nothing reached ${name || 'her'}. The draft is saved and nothing has gone out.`;

// ⑧a CANNOT REACH — HER SIDE. A fact he can act on.
const noNumberLine = (name) =>
  `I don't have a number on file for ${name || 'her'}, so there's nothing to send to. ` +
  `Send me her number and I'll write it again.`;

// ⑧b CANNOT REACH — OUR SIDE. Never dressed as ⑧a: telling a vendor his
// customer has no number when the fault is ours is a false statement of fact.
const noLaneLine = (name) =>
  `I can't send from our number right now, so I haven't tried. Nothing has gone to ${name || 'her'}. The draft is saved.`;

// ⑨ THE MISMATCHED AFFIRMATIVE — re-show, never send (R-29.19). It never
// repeats the wrong name back: repeating a wrong name is how a wrong-recipient
// send starts.
const mismatchBlock = (body, name, phone) =>
  `I haven't sent anything. The draft I'm holding is for ${recipientLabel(name, phone)} — here it is again:\n\n` +
  `"${body}"\n\nSend this to ${recipientLabel(name, phone)}?`;

// ⑩ THE PWA DOOR'S DECLARED REFUSAL (R-29.21). A POSITIVE BRANCH, not an
// absent organ throwing. ALSO A BYTE WITH A NAMED SUCCESSOR: it is true at this
// tip and stops being true when the PWA-door parity micro lands, whose charter
// owes its retirement.
const PWA_RELAY_UNAVAILABLE_LINE =
  `I can't send messages to your clients from here yet — that only works over WhatsApp for now. ` +
  `Message me on WhatsApp and I'll send it from there.`;

// ── THE PENDING-RELAY BLOCK (R-29.29) — THE DOOR'S FACT, NOT A TOOL ────────
// Built at the door from the OPEN STAGED ROW and injected into Harvey's system
// tail on the CE-4 seam (loop.ts, `pendingRelay`). It carries three things and
// each one closes a named finding:
//   · that a commitment is OPEN and an affirmative is expected      — F-06.162
//   · the draft's VERBATIM body, so he need not quote it himself    — F-06.163
//   · the recipient's name AND stored phone, so his ask can name her — E3
//
// THE INSTRUCTION NAMES HER, AND THAT IS A DISCLOSED DEVIATION FROM R-29.29's
// LITERAL COPY, REPORTED IN THE HANDOVER RATHER THAN TAKEN SILENTLY. The ruling
// wrote 「 reply Yes and it goes to her 」 while its own trigger clause requires
// 「 an affirmative NAMING HER 」. Those cannot both hold: a block that teaches
// the vendor to answer 「 Yes 」 teaches him the one answer E3 refuses, and the
// founder's own 09:29:03 turn was exactly that bare Yes. Resolved in the SAFE
// direction — the block asks for a naming affirmative — because the alternative
// silently retires the founder's wrong-bride guard. The chair's to overrule.
function pendingRelayBlock(draft, name) {
  if (!draft) return '';
  const who = recipientLabel(name, draft.couple_phone);
  return [
    'A DRAFT IS WAITING FOR THE OWNER\'S APPROVAL.',
    '',
    `It is addressed to ${who}, and these are its exact words:`,
    `"${draft.body}"`,
    '',
    'The estate has already shown him these words verbatim and asked him whether to',
    `send them to ${who} — you do not need to quote the draft to him again.`,
    'Nothing has gone to her and nothing will until he approves it.',
    '',
    `If he wants it sent, he must say so NAMING her — "yes, send it to ${name || draft.couple_phone}".`,
    'A bare "yes" is not enough, and that is deliberate: naming her is what keeps a',
    'message from reaching the wrong client. If his answer does not name her, ask him',
    'to confirm who it goes to. If he wants it changed or dropped, say so plainly.',
  ].join('\n');
}

/**
 * The block for this vendor's open staged draft, or '' when nothing is pending.
 * Returns '' on every failure — a Victor without the block is diminished, not
 * wrong, and a relay fault must never cost the vendor his turn (leadPings' own
 * fail-safe-to-empty contract, and F-06.141's class at a neighbouring site).
 */
async function buildPendingRelay(supabase, vendorId) {
  try {
    const open = await drafts.openStagedFor(supabase, vendorId);
    if (!open.draft) return '';
    const name = await coupleDisplayName(supabase, vendorId, open.draft.couple_phone);
    return pendingRelayBlock(open.draft, name);
  } catch (e) {
    console.warn('[relaySeat] pending-relay block failed:', e && e.message);
    return '';
  }
}

// ── THE AFFIRMATIVE, READ AT THE DOOR (R-29.29's trigger) ──────────────────
// R-29.19 refused arm (3c) — the door word-matching the vendor's raw text — and
// that refusal is NOT overturned here, because (3c) had the door CHOOSE THE
// RECIPIENT from prose. It does not choose anything. The recipient is already
// pinned on the stored row; this reads the owner's words only to ask whether he
// AFFIRMED and whether he NAMED THE STORED SUBJECT. The identity anchor stays
// the draft row, exactly as R-29.19 ruled — the text is checked against the
// store, never mined for a new fact.
//
// TWO CONDITIONS, BOTH REQUIRED, and the conjunction is the guard:
//   (1) an affirmative is present
//   (2) the stored name OR the stored phone appears in his words
// A bare 「 yes 」 satisfies (1) and not (2) and moves NOTHING — the founder's
// own 09:29:03 turn, and E3's whole point.
const AFFIRM_RE = /\b(?:yes|yep|yeah|yup|ok|okay|sure|send it|send|go ahead|approve[d]?|confirmed?|do it|please do)\b/i;

function affirmativeNames(text, name, phone) {
  const t = String(text || '');
  if (!AFFIRM_RE.test(t)) return false;
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits && t.replace(/\D/g, '').includes(digits.slice(-10))) return true;
  if (!name) return false;
  return new RegExp(`\\b${foldName(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(foldName(t));
}

// ── THE SIGNAL COLLECTOR ───────────────────────────────────────────────────
// Signals nest inside `tool_calls[].donna_calls` — a top-level-only scan
// collects nothing. Same shape as `blockHands.js`'s collector and the invoice
// collector at `vendorInbound.js:1346-1351`; the door reads name + input, which
// is exactly what `deriveFiling(vendorId, name, input, result)` reads.
function collectSignals(result) {
  const out = [];
  const take = (call) => {
    if (!call || !call.input) return;
    if (call.name === STAGE_SIGNAL || call.name === SEND_SIGNAL) out.push({ name: call.name, input: call.input });
  };
  for (const tc of (result && result.tool_calls) || []) {
    take(tc);
    for (const dc of (tc && tc.donna_calls) || []) take(dc);
  }
  return out;
}

// Loose equality on the name the owner said vs the name the store resolves.
// Case- and whitespace-insensitive, punctuation folded — NOT fuzzy. "Priya" does
// not match "Riya" and must not: this comparison is the wrong-bride guard.
const foldName = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * THE SEAT. Returns the lines to append to the vendor's reply, or null when the
 * relay did nothing this turn.
 *
 * `hasTransport: false` is the PWA door's shape (R-29.21) — `src/api/vendor-
 * engine/chat.js` passes the llm transport and holds NO WhatsApp organ at all,
 * so the tool is reachable there and the deed is not. That is a DECLARED, TYPED
 * refusal naming its subject, never a silent throw.
 *
 * @returns {Promise<{line: string, kind: string}|null>}
 */
async function runRelaySeat(supabase, vendor, result, deps = {}) {
  const signals = collectSignals(result);

  // ── F-06.162's ROUTE (R-29.29) ────────────────────────────────────────────
  // When a commitment is OPEN and the owner's own words affirm it BY NAME, the
  // door acts on the store — no Harvey tool call required, because R-29.23
  // already put the door in charge of reading the turn and R-29.25 already put
  // every organ on this side of the boundary. Harvey holds no tool and needs
  // none; the block told him a fact, the vendor answered it, and the door owns
  // the deed. Seated BEFORE the signal branch so a turn that both affirms and
  // (wrongly) re-stages is governed by the affirmative, exactly as the two
  // signals are ordered below and for the same reason.
  if (deps.hasTransport !== false && deps.ownerWords) {
    const open = await drafts.openStagedFor(supabase, vendor.id);
    if (open.expired) return { line: expiredLine(), kind: 'expired' };
    if (open.draft) {
      const name = await coupleDisplayName(supabase, vendor.id, open.draft.couple_phone);
      if (affirmativeNames(deps.ownerWords, name, open.draft.couple_phone)) {
        return sendApproved(supabase, vendor, open.draft, name, deps);
      }
    }
  }

  if (!signals.length) return null;

  if (deps.hasTransport === false) {
    return { line: PWA_RELAY_UNAVAILABLE_LINE, kind: 'no_relay_surface' };
  }

  // ORDER IS LOAD-BEARING. A turn carrying BOTH signals is governed by the SEND,
  // because an approval can only ever answer a draft that was already shown — a
  // stage in the same turn has not been in front of him yet, and approving it
  // would be the affirmative-to-nothing this whole guard exists to refuse.
  const send = signals.find((s) => s.name === SEND_SIGNAL);
  if (send) return handleSend(supabase, vendor, send.input, deps);

  const stage = signals.find((s) => s.name === STAGE_SIGNAL);
  if (stage) return handleStage(supabase, vendor, stage.input, deps);
  return null;
}

async function handleStage(supabase, vendor, input, deps) {
  const recipient = typeof input.recipient === 'string' ? input.recipient.trim() : '';
  const body = typeof input.message === 'string' ? input.message.trim() : '';
  if (!body) return null;   // a hand with no bytes stages nothing and says nothing

  const who = await resolveRecipient(supabase, vendor.id, recipient);
  if (!who.phone) {
    // NO DRAFT IS STAGED when there is nobody to stage it for. `ambiguous_recipient`
    // lands here too: the corpse's own refusal to guess among several threads,
    // which under E3 is the wrong-bride guard's OUTER wall.
    return { line: noNumberLine(who.name || recipient), kind: `no_recipient:${who.reason}` };
  }

  const staged = await drafts.stage(supabase, {
    vendorId: vendor.id,
    conversationId: deps.conversationId || null,
    couplePhone: who.phone,
    body,
  });
  if (!staged.ok) {
    console.warn('[relaySeat] stage failed:', staged.reason);
    return null;   // nothing was stored, so nothing is shown and nothing is claimed
  }

  // THE EQUALITY CHAIN'S FIRST HOP. The frame renders `staged.draft.body` — the
  // bytes READ BACK OFF THE ROW — never the `body` variable above. If the store
  // altered them in any way, the vendor sees what the store holds, which is what
  // the transport will be handed.
  return {
    line: showBlock(staged.draft.body, who.name, staged.draft.couple_phone),
    kind: 'staged',
    draftId: staged.draft.id,
  };
}

async function handleSend(supabase, vendor, input, deps) {
  const said = typeof input.recipient_name === 'string' ? input.recipient_name.trim() : '';

  // THE DOOR ANCHORS THE AFFIRMATIVE TO THE DRAFT IT SHOWED — by id, through the
  // store's own open partial index, expiry enforced at read. The model supplies
  // NO identifier: a model-supplied draft id is this arc's founding disease
  // wearing a parameter's clothes.
  const open = await drafts.openStagedFor(supabase, vendor.id);

  if (open.expired) return { line: expiredLine(), kind: 'expired' };   // ⑥

  if (!open.draft) {
    // AN AFFIRMATIVE TO NOTHING MOVES NO STATE AND MINTS NO BYTE. Victor's own
    // reply ships untouched — the `imperative_second_refusal` precedent
    // (`vendorInbound.js`, Fork D outcome B). Appending a refusal here would put
    // an unvetoed sentence on the wire for a turn where nothing was pending.
    console.warn('[relaySeat] send signal with no open draft:', open.reason);
    return null;
  }

  const draft = open.draft;
  const name = await coupleDisplayName(supabase, vendor.id, draft.couple_phone);

  // ── THE E3 GUARD. Mismatch OR unresolvable → NO TRANSITION, RE-SHOW. ───────
  // Unresolvable counts as mismatch deliberately: if the store cannot say who
  // this draft is for, nothing he said can be checked against it, and an
  // unchecked affirmative is the one thing E3 exists to refuse.
  const matched = !!name && !!said && foldName(name) === foldName(said);
  if (!matched) {
    return { line: mismatchBlock(draft.body, name, draft.couple_phone), kind: 'name_mismatch' };   // ⑨
  }

  return sendApproved(supabase, vendor, draft, name, deps);
}

// THE APPROVED LEG. One home, reached from the door's own affirmative route and
// from the SEND signal alike — so the state machine, the window question, the
// lane pin and every deed line have exactly one implementation regardless of how
// the owner's yes arrived.
async function sendApproved(supabase, vendor, draft, name, deps) {
  const approved = await drafts.approve(supabase, draft.id);
  if (!approved.ok) {
    console.warn('[relaySeat] approve refused:', approved.reason);
    return null;   // the state machine refused; nothing moved and nothing is claimed
  }

  // ── THE SEND. Window asked FIRST, lane pinned, return read. ────────────────
  const out = await relayToCouple(supabase, {
    vendor,
    couplePhone: draft.couple_phone,
    body: draft.body,          // THE STORED BYTES. A1's last hop — same column, same row.
    sendWhatsApp: deps.sendWhatsApp,
    env: deps.env,
  });

  if (out.ok) {
    // THE SID TO BOTH ROWS. `relayToCouple` wrote the thread row's; this writes
    // the draft row's. F-06.143's class dies by construction at this site.
    await drafts.markSent(supabase, draft.id, out.twilioSid);
    return { line: sentLine(name, draft.couple_phone), kind: 'sent', draftId: draft.id };   // ③
  }

  // EVERY REFUSAL IS RECORDED WITH ITS REASON (0118, R-29.20), and every one
  // stamps `resolved_at` through the store's single transition primitive.
  await drafts.refuse(supabase, draft.id, out.reason || out.kind);

  if (out.kind === 'window_closed') return { line: windowClosedLine(name), kind: 'window_closed', draftId: draft.id };          // ④
  if (out.kind === 'window_undetermined') return { line: windowUndeterminedLine(), kind: 'window_undetermined', draftId: draft.id }; // ⑤
  if (out.kind === 'no_vendor_lane') return { line: noLaneLine(name), kind: 'no_vendor_lane', draftId: draft.id };              // ⑧b
  if (out.kind === 'no_recipient') return { line: noNumberLine(name), kind: 'no_recipient', draftId: draft.id };                // ⑧a
  return { line: sendFailedLine(name), kind: out.kind || 'send_failed', draftId: draft.id };                                     // ⑦
}

/**
 * R-29.30 — the RELAY LANE'S OWN SENTENCE for a stage-2 interception.
 *
 * Returns null when this interception is NOT the relay's business, so F3 ships
 * exactly as it does today for every filing-lane costume. Returns a
 * founder-vetoed relay byte when a draft is open: the re-show, which is the safe
 * direction R-29.19 already ruled for an affirmative that could not be honoured.
 *
 * NOTHING IS SENT AND NO STATE MOVES HERE. The interception means the model
 * claimed a deed it did not do; the draft is exactly where it was and the vendor
 * is told so with the bytes written for that fact.
 */
async function relayLaneLine(supabase, vendor, result) {
  // Only speak for a turn that CLAIMED the relay. A filing-lane costume in a
  // conversation that happens to hold a draft is not this lane's to answer.
  const claimed = RELAY_CLAIM_RE_LOCAL.test(String((result && result.reply) || ''));
  if (!claimed) return null;
  const open = await drafts.openStagedFor(supabase, vendor.id);
  if (open.expired) return expiredLine();
  if (!open.draft) return null;
  const name = await coupleDisplayName(supabase, vendor.id, open.draft.couple_phone);
  return mismatchBlock(open.draft.body, name, open.draft.couple_phone);
}

// The claim family has ONE home (chat.js, F-06.159). Required lazily so this
// module never depends on the door's import order, and asserted equal to that
// home by a cell rather than trusted.
const RELAY_CLAIM_RE_LOCAL = (() => {
  try { return require('../../api/vendor-engine/chat').RELAY_CLAIM_RE; }
  catch (_e) { return /\bmessage\s+(?:to\s+[^\s,.]+\s+)?(?:is|has been)\s+(?:live|sent)\b/i; }
})();

module.exports = {
  runRelaySeat,
  relayLaneLine,
  buildPendingRelay,
  pendingRelayBlock,
  affirmativeNames,
  AFFIRM_RE,
  collectSignals,
  recipientLabel,
  showBlock,
  mismatchBlock,
  sentLine,
  windowClosedLine,
  windowUndeterminedLine,
  expiredLine,
  sendFailedLine,
  noNumberLine,
  noLaneLine,
  PWA_RELAY_UNAVAILABLE_LINE,
  STAGE_SIGNAL,
  SEND_SIGNAL,
  foldName,
};
