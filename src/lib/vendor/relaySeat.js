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

// ══ R-29.32 · THE DOOR OWNS THE STAGE ═══════════════════════════════════════
// FOUR WALKS PROVED THE MODEL IS AN UNRELIABLE TRIGGER. Every relay turn came
// back `(0 tool calls)` while the vendor's screen filled with plausible prose,
// and every cure that added CONTEXT handed the costume better material
// (F-06.166: the true draft verbatim in his context, a fabricated sibling in his
// prose, ten seconds apart). The trigger leaves the model.
//
// ── ① DETECTION ────────────────────────────────────────────────────────────
// The verb family has ONE home in chat.js (production owns, the rig borrows).
// The RECIPIENT must resolve to EXACTLY ONE open couple_thread — the corpse's
// own refuse-to-guess precedent (`replyToCouple.js`, recovery 2) made law.
// Ambiguous or unresolvable → the door ASKS (byte №12). ZERO ROWS ON A GUESS.

// ── BYTE №12 — the ambiguous / unresolvable recipient ask ──────────────────
// FOUNDER-VETOED 2026-08-11 「 yes approved 」 (and see the ZIP note: the veto
// word arrived before these bytes had been drafted, so the founder is reading
// them for the first time at delivery and holds the gate by holding the push).
const askWhoLine = (given) =>
  `Who should that go to? I have more than one client on file matching "${given}", ` +
  `and I won't guess with a message. Give me her name as it's saved, or her number, ` +
  `and I'll put the draft in front of you.`;

// ── BYTE №13 — the plain decline ──────────────────────────────────────────
// FOUNDER-VETOED 2026-08-11 「 approve 」. A decline NEVER deletes; the row stays.
const declinedLine = (name) =>
  `Not sent — I've dropped it. Nothing went to ${name || 'her'}. ` +
  `Tell me when you want to write to her again.`;

// ── ② THE BODY FORK ───────────────────────────────────────────────────────
// VERBATIM: the vendor gave the words, so the estate delivers HIS bytes,
// byte-exact, with zero model in the body path. COMPOSE: intent without content
// — the model still composes (the founder's 「 i want it 」 stands) but the
// ROUTING is the door's.
function verbatimBody(text) {
  const m = require('../../api/vendor-engine/chat').VERBATIM_RE.exec(String(text || ''));
  if (!m) return null;
  const body = (m[1] || m[2] || '').trim();
  return body.length >= 8 ? body : null;
}

// THE COMPOSE INVOCATION, AND ITS EVIDENCE — the chair required an EXISTING
// entry point rather than a new one, and there is one: `src/agent/harvest.js:35`
// already does `require('../engine/dist/core/donna')` from the door plane. This
// is that same module and that same plane; no new engine entry point is minted.
// Donna composes and the door reads her STRUCTURED signal — never her prose —
// so the body that reaches the store is the one her own hand named.
async function composeBody(agentId, instruction) {
  try {
    const { runDonnaTurn } = require('../../engine/dist/core/donna');
    const turn = await runDonnaTurn(agentId, instruction);
    for (const tc of (turn && turn.tool_calls) || []) {
      if (tc.name === STAGE_SIGNAL && tc.input && typeof tc.input.message === 'string') {
        const b = tc.input.message.trim();
        if (b) return b;
      }
    }
    return null;
  } catch (e) {
    console.warn('[relaySeat] compose failed:', e && e.message);
    return null;
  }
}

/**
 * THE DOOR'S STAGE. Returns a line to append, or null when this turn is not a
 * relay instruction at all.
 */
async function doorStage(supabase, vendor, text, deps) {
  const chat = require('../../api/vendor-engine/chat');
  const raw = String(text || '').trim();
  if (!raw || !chat.RELAY_VERB_RE.test(raw)) return null;

  const who = await resolveRecipient(supabase, vendor.id, extractRecipient(raw));
  if (who.reason === 'ambiguous_recipient') return { line: askWhoLine(who.name || 'that name'), kind: 'ask_who' };
  if (!who.phone) return null;   // not a resolvable relay instruction — the door stays silent

  const body = verbatimBody(raw) || (deps.agentId ? await composeBody(deps.agentId, raw) : null);
  if (!body) return null;

  const staged = await drafts.stage(supabase, {
    vendorId: vendor.id, conversationId: deps.conversationId || null,
    couplePhone: who.phone, body,
  });
  if (!staged.ok) { console.warn('[relaySeat] door stage failed:', staged.reason); return null; }
  return {
    line: showBlock(staged.draft.body, who.name, staged.draft.couple_phone),
    kind: 'door_staged', draftId: staged.draft.id,
  };
}

// The recipient, lifted from the instruction. Deliberately dumb: the first
// capitalised token or a phone-like run. It never DECIDES anything — whatever it
// lifts is handed to `resolveRecipient`, which answers against the store and
// refuses to guess among several. A bad lift resolves to nothing and the door
// stays silent, which is the status quo, not a new harm.
function extractRecipient(text) {
  const t = String(text || '');
  const phone = t.match(/\+?\d[\d\s\-()]{8,}/);
  if (phone) return phone[0];
  // Case-insensitive on the VERB (a sentence opens with "Tell Priya…", capital T)
  // and case-SENSITIVE on the name, so the verb itself can never be lifted as the
  // recipient — which is exactly what an all-case-sensitive pattern did.
  const m = t.match(/\b(?:to|tell|ask|message|msg|text|whatsapp|inform)\s+([A-Z][a-z]+)\b/i)
         && t.match(/\b(?:to|tell|ask|message|msg|text|whatsapp|inform)\s+([A-Z][a-z]+)\b/i);
  if (m && m[1] && !/^(?:to|tell|ask|message|msg|text|whatsapp|inform)$/i.test(m[1])) return m[1];
  const cap = t.match(/\b([A-Z][a-z]{2,})\b/);
  return cap ? cap[1] : '';
}

// ── E3-PRIME (R-29.33) — THREE LANES ───────────────────────────────────────
// The founder's amendment, and the chair's reason stated where it is read: the
// original 「 bare yes to nothing 」 refusal guarded a MODEL-anchored flow, where
// the yes had nothing mechanical to attach to. Under R-29.32 the DOOR asks the
// question, on a row the DOOR staged, shown with her name AND phone. A bare
// affirmative arriving as the next vendor inbound after THE DOOR'S OWN ASK is
// not a yes to nothing — the anchor is the door's own state.
//
// The founder felt his own guard refuse him three times in walk four. It was
// right then because the anchor was the model's; his amendment is right now
// because the anchor is the door's.
const AFFIRM_PLAIN_RE = /^(?:\s*(?:yes|yeah|yep|yup|ya|ok|okay|k|sure|go|go ahead|do it|send|send it|send it now|confirm|confirmed|approve|approved|yes please|please send|haan|haa|bhej do|bhejo|theek hai)\s*[.!]?\s*)+$/i;
const DECLINE_PLAIN_RE = /^(?:\s*(?:no|nope|nah|don'?t|do not|don'?t send|dont send|cancel|stop|wait|hold on|hold|drop it|mat bhejo|rehne do|nahi)\s*[.!]?\s*)+$/i;

/**
 * DOOR-ADJACENCY — was the estate's OWN confirm ask the last thing this vendor
 * was shown? Read off `public.messages`, the door's own stored bytes, so the
 * anchor is a fact the door wrote and not a claim anyone made about it.
 */
async function doorAsked(supabase, conversationId) {
  if (!supabase || !conversationId) return false;
  try {
    const { data } = await supabase
      .from('messages').select('body, direction')
      .eq('conversation_id', conversationId).eq('direction', 'outbound')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    return !!(data && /Send this to .*\(\+\d/.test(String(data.body || '')));
  } catch (_e) { return false; }
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

  // ── THE DOOR'S OWN LANES (R-29.32 · R-29.33) ──────────────────────────────
  // ORDER IS LOAD-BEARING and each step is named:
  //   1. DECLINE before approve — a 「 no 」 must never race a 「 yes 」 family.
  //   2. APPROVE before stage — an affirmative answers a draft already shown; a
  //      stage in the same breath has not been in front of him yet.
  //   3. STAGE before the signals — the door is the trigger now; a model signal
  //      arriving on the same turn is decoration, not a second stage.
  if (deps.hasTransport !== false && deps.ownerWords) {
    const open = await drafts.openStagedFor(supabase, vendor.id);
    if (open.expired) return { line: expiredLine(), kind: 'expired' };

    if (open.draft) {
      const name = await coupleDisplayName(supabase, vendor.id, open.draft.couple_phone);
      const plain = AFFIRM_PLAIN_RE.test(String(deps.ownerWords).trim());
      const decline = DECLINE_PLAIN_RE.test(String(deps.ownerWords).trim());
      // ADJACENCY, asked ONCE and only when a plain lane is in play — a naming
      // affirmative keeps its standing power and never needs it (lane ②).
      const adjacent = (plain || decline) ? await doorAsked(supabase, deps.conversationId) : false;

      if (decline && adjacent) {
        await drafts.refuse(supabase, open.draft.id, 'vendor_declined');
        return { line: declinedLine(name), kind: 'declined', draftId: open.draft.id };
      }
      // LANE ① plain + door-adjacent · LANE ② naming, anytime. All three
      // conditions of lane ① or nothing: the ask was the door's, exactly one
      // open staged row exists (openStagedFor's own contract), and expiry has
      // already been enforced at read above.
      if ((plain && adjacent) || affirmativeNames(deps.ownerWords, name, open.draft.couple_phone)) {
        return sendApproved(supabase, vendor, open.draft, name, deps);
      }
      // LANE ③ — an affirmative naming SOMEONE ELSE still re-shows and moves
      // nothing. A plain affirmative that is NOT door-adjacent falls through to
      // the same place: never a send.
      if (/\b(?:yes|yeah|yep|send|ok|okay|sure|approve)\b/i.test(String(deps.ownerWords))) {
        return { line: mismatchBlock(open.draft.body, name, open.draft.couple_phone), kind: 'not_adjacent' };
      }
    }

    // ── R-29.32 — THE DOOR STAGES. The last model-dependent step, removed.
    const staged = await doorStage(supabase, vendor, deps.ownerWords, deps);
    if (staged) return staged;
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
async function relayLaneLine(supabase, vendor, result, opts = {}) {
  // Only speak for a turn that CLAIMED the relay. A filing-lane costume in a
  // conversation that happens to hold a draft is not this lane's to answer.
  // `anyClaim` is the confirm-shape caller (F-06.166), which has already decided
  // the turn is the relay's business by a different family and must not be
  // second-guessed by this one.
  const claimed = opts.anyClaim || RELAY_CLAIM_RE_LOCAL.test(String((result && result.reply) || ''));
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
  doorStage,
  doorAsked,
  verbatimBody,
  extractRecipient,
  askWhoLine,
  declinedLine,
  AFFIRM_PLAIN_RE,
  DECLINE_PLAIN_RE,
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
