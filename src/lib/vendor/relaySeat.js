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
const { relayToCouple, ringDoorbell, findOrCreateCoupleThread, resolveRecipient, coupleDisplayName } = require('./relayToCouple');

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
// ── F-06.186's CURE, LAYER ① · A NUMBER IS NOT A NAME ───────────────────────
//
// FOUNDER-WITNESSED, walk ten, 7:02pm: 「 The draft I'm holding is for
// +918595986978 (+918595986978) 」 and 「 Send this to +918595986978
// (+918595986978)? 」 — the bride addressed by her own number, twice, in one
// sentence, on the vendor's screen.
//
// THE RESOLVER IS FAITHFUL AND IS NOT THE DEFECT. `coupleDisplayName` returns
// `leads.name || null`, and the lead row for that number holds THE PHONE IN ITS
// NAME COLUMN. So a true value arrived where a name was expected and the
// nameless fallback — which the founder ruled and which reads correctly — never
// got its turn.
//
// THE GUARD IS A RENDER GUARD, DELIBERATELY. It does not repair the row and does
// not touch the store: a display fix that silently rewrites data is two changes
// wearing one name. The upstream writer is named in this delivery's handover
// with its census; every code writer passes `name` through as given, so the
// phone entered as a MODEL TOOL INPUT and its cure is out of this radius.
//
// COMPARISON IS ON DIGITS. `+918595986978`, `918595986978` and `8595986978`
// are the same human and the same non-name; `counterparty_phone` is not
// format-normalized estate-wide (F-06.154), so a literal equality check would
// pass the very shapes this exists to catch. Suffix matching in both directions
// covers the country-code variance without matching two genuinely different
// numbers that merely share a tail — the shorter must be at least 7 digits.
const digitsOf = (s) => String(s || '').replace(/\D+/g, '');

function looksLikeThePhone(name, phone) {
  const a = digitsOf(name);
  const b = digitsOf(phone);
  if (!a || !b) return false;
  // A NAME WITH LETTERS IS A NAME. 「 Priya (+91…) 」 must never be swallowed by
  // this guard, and a name that happens to contain digits is still a name.
  if (/[a-z]/i.test(String(name))) return false;
  if (a === b) return true;
  const [shortD, longD] = a.length <= b.length ? [a, b] : [b, a];
  return shortD.length >= 7 && longD.endsWith(shortD);
}

function recipientLabel(name, phone) {
  if (looksLikeThePhone(name, phone)) return `${phone}`;
  return name ? `${name} (${phone})` : `${phone}`;
}

// ── ① THE SHOW FRAME + ② THE E3 CONFIRM ────────────────────────────────────
// Rendered from the STORED `body`, read back off the row the door just wrote.
// That read-back is A1's first hop and it is why the frame cannot drift: there
// is no variable here holding a second copy of the bytes.
function showBlock(body, name, phone) {
  // ── F-06.185's CURE · THE FOUNDER'S STRIKE, EXECUTED ──────────────────────
  // 「 word for word 」 was STRUCK from every vendor-facing byte by the founder on
  // 2026-08-11 (CE-214 ④; consolidated handover §4). The strike was executed on
  // ④b-v2 — its own comment records it — and NEVER on ①, so the struck phrase
  // kept shipping and the founder read it on his own handset at walk ten, 7:01pm,
  // a day after he struck it. A ruled copy act that ships half-executed is a
  // ruling the tree does not hold.
  // NO NEW VETO IS OWED: removing the struck words is the founder's own act. The
  // remaining sentence is shown to him in the delivery's cover.
  // WHY THE PHRASE WAS STRUCK, kept here so nobody restores it as a courtesy:
  // equality between what he was shown and what she receives is A1's CELL,
  // proven by the store's own row — never a sentence promising it.
  return `Here is the draft:\n\n"${body}"\n\nSend this to ${recipientLabel(name, phone)}?`;
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

// ④b-v2 THE DOORBELL RANG — FOUNDER-AUTHORED AND VETOED 2026-08-11, byte-exact.
// ④b IS RETIRED. Two things changed and both are the founder's: the 「 word for
// word 」 phrase is struck from every vendor-facing byte (equality is A1's CELL
// and stays out of every sentence), and the second affirmative is gone (R-29.35)
// — so this line no longer asks him to say anything. It promises a receipt, and
// the receipt chain below is that promise's machinery.
const doorbellLineV2 = (name) =>
  `Done — ${name || 'she'}'s been notified on WhatsApp. I'll confirm the moment it's delivered and read.`;

// №14 — the delivered receipt. ALWAYS fires: Meta sends `delivered` unconditionally.
const deliveredLine = (name, phone) => `Delivered to ${recipientLabel(name, phone)}.`;
// №15 — the read receipt. Fires ONLY when Meta sends `read`; her privacy setting
// gates it and a receipt is NEVER synthesized from a delivered.
const readLine = (name) => `${name || 'She'}'s seen it.`;

// ── ④b v1 · RETIRED IN FACT (F-06.185) ──────────────────────────────────────
// The constant lived on here after its retirement 「 kept named rather than
// deleted so the register can see the retirement rather than infer it from an
// absence 」. That reasoning is sound for a REGISTER and wrong for a TREE: the
// chair's sweep found it still carrying the founder-struck 「 word for word 」,
// which is a retired byte surviving retirement — a class above a struck phrase.
// RETIRED-COPY-LEAVES-THE-TREE is the enforcement half of
// APPROVED-COPY-CARRIES-ITS-HASH: the register remembers, the tree does not.
// Its retirement is recorded at the consolidated handover §4 (「 ④b (retired)
// doorbellLine_RETIRED_v1 — superseded 」) and its successor is `doorbellLineV2`,
// founder-authored, below. Chair-verified reader-less before removal: the only
// occurrence in `src/` was its own declaration.

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
// ── E3-PRIME (R-29.33) — AND THE FRICTION THIS BLOCK ONCE CAUSED ───────────
// The block used to instruct 「 he must say so NAMING her / a bare yes is not
// enough 」. That was correct under the pre-amendment guard and became WRONG the
// moment the founder ruled E3-prime — and the code moved while these words did
// not. On 2026-08-11 10:31 Victor obeyed them exactly and told the founder
// 「 I need you to name her to send it. Say: "Yes, send it to Priya." 」 —
// enforcing a rule the door had already retired. THE INSTRUCTION IS THE
// INTERFACE: a block that lags a ruling produces friction indistinguishable
// from a bug, and the founder felt it as one because it was one.
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
    'ANY plain yes sends it — "yes", "send", "send it", "ok", "haan". You do not need',
    'her name back from him and you must NEVER ask for it. The estate already showed',
    `him her name and her number in the question, so his yes is an answer to that`,
    'question and nothing else. Asking him to repeat what you just told him is',
    'friction he did not ask for.',
    '',
    'If he says no, or wait, or cancel — it is dropped and nothing goes to her.',
    'If he wants it changed, say so plainly and he can give you the new words.',
  ].join('\n');
}

/**
 * The block for this vendor's open staged draft, or '' when nothing is pending.
 * Returns '' on every failure — a Victor without the block is diminished, not
 * wrong, and a relay fault must never cost the vendor his turn (leadPings' own
 * fail-safe-to-empty contract, and F-06.141's class at a neighbouring site).
 */
// ── F-06.175's CURE · THE STANDING LAW, PRESENT ON EVERY TURN ───────────────
//
// THE DISEASE, STATED AS ITS FILER STATED IT: `pendingRelayBlock` is built from
// the OPEN STAGED ROW at turn start. On the turn that STAGES, no row exists yet.
// So the one instruction that prevents a duplicated draft-quote was absent on
// the only turn that produces one — walk eight, 11:20:53, Victor's own
// `Draft ready for approval:` sitting directly above the door's frame.
//
// THE CURE IS NOT A BETTER LOOKUP. There is no lookup that can find a row the
// turn has not written yet; any attempt to pre-empt it would be the door
// guessing what the model is about to do. The cure is that the instruction
// STOPS BEING CONDITIONAL ON A ROW. "The door quotes drafts, you do not" is
// true of this estate at all times — it is a fact about who owns the SHOW
// frame (R-29.32), not a fact about whether a draft happens to be open — and a
// law that is always true has no business being delivered only sometimes.
//
// THE ROW-SPECIFIC BLOCK IS UNCHANGED and still rides on top when a row is
// open: it carries her name, her number and the exact bytes, which the standing
// law cannot. Byte-for-byte `pendingRelayBlock` is untouched, so every cell
// asserting its wording still asserts it.
//
// THE FIXTURE-ABSENT CELL IS MANDATORY HERE and it is this finding's own
// tuition: .175's cells all drove a fixture their cure guaranteed. The cell that
// matters is the one with NO open draft, because that is the staging turn's
// state at the moment the block is built.
const RELAY_STANDING_LAW = [
  'THE ESTATE\'S DOOR OWNS EVERY DRAFT QUOTE.',
  '',
  'When the owner asks you to write to a bride, the estate stages the draft and',
  'shows him the exact words itself, in its own frame, with her name and her',
  'number. That happens after your turn and it happens every time.',
  '',
  'So you never quote the draft back to him and you never write your own',
  '"here is the draft" frame around it. He would read the same words twice, once',
  'from you and once from the estate, and have to work out which one he is',
  'answering. Say what you have done in your own voice and stop.',
].join('\n');

async function buildPendingRelay(supabase, vendorId) {
  try {
    const open = await drafts.openStagedFor(supabase, vendorId);
    if (!open.draft) return RELAY_STANDING_LAW;
    const name = await coupleDisplayName(supabase, vendorId, open.draft.couple_phone);
    return `${RELAY_STANDING_LAW}\n\n${pendingRelayBlock(open.draft, name)}`;
  } catch (e) {
    console.warn('[relaySeat] pending-relay block failed:', e && e.message);
    // STILL THE LAW. The row-specific half needs the store; the standing half
    // does not, and a store fault is no reason to teach the model that it owns
    // the draft quote. Fail-safe here means fail to the SMALLER truth, never to
    // silence — which is the opposite of what an empty string did.
    return RELAY_STANDING_LAW;
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
  // ── THE DECLINE LOG (F-06.171) ────────────────────────────────────────────
  // EVERY `return null` ON THIS PATH NOW SAYS WHY. Five walks have produced logs
  // with NO `[relay:wa]` line at all — not a wrong outcome, NO outcome — and a
  // silent decline is indistinguishable from a seat that never ran. That
  // ambiguity has cost the founder five walks and me five wrong guesses; a door
  // that declines without saying why is not observable, and an unobservable door
  // cannot be debugged from a log.
  const no = (why) => { console.log(`[relay:wa] no-stage (${why})`); return null; };

  if (!raw) return no('empty_instruction');
  if (!chat.RELAY_VERB_RE) return no('RELAY_VERB_RE undefined — circular require of chat.js');
  if (!chat.RELAY_VERB_RE.test(raw)) return no('no_relay_verb');

  const lifted = extractRecipient(raw);
  const who = await resolveRecipient(supabase, vendor.id, lifted);
  if (who.reason === 'ambiguous_recipient') return { line: askWhoLine(who.name || 'that name'), kind: 'ask_who' };
  if (!who.phone) return no(`recipient_unresolved lifted="${lifted}" reason=${who.reason}`);

  const verb = verbatimBody(raw);
  const body = verb || (deps.agentId ? await composeBody(deps.agentId, raw) : null);
  if (!body) return no(verb === null && !deps.agentId ? 'no_verbatim_and_no_agentId' : 'no_body_composed');

  const staged = await drafts.stage(supabase, {
    vendorId: vendor.id, conversationId: deps.conversationId || null,
    couplePhone: who.phone, body,
  });
  if (!staged.ok) return no(`stage_failed: ${staged.reason}`);
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
// ── F-06.188's CURE · STRUCTURED ADJACENCY ─────────────────────────────────
//
// AN APPROVAL GATE WAS DECIDED BY A DISPLAY STRING. This asked the last outbound
// BODY for `/Send this to .*\(\+\d/` — the PARENTHESISED named form — to decide
// whether a plain 「 yes 」 may approve. The door's act is a ROW; the predicate
// read a SENTENCE, so every copy change silently moved a gate.
//
// IT MOVED ONE, AND THIS SITTING MOVED IT. Rider 3's F-06.186 render guard
// correctly stopped printing 「 +91… (+91…) 」 for a nameless bride — and took the
// parentheses, and therefore the adjacency signal, with it. Derived at `a2439d3`:
// named -> true, phone-as-name -> FALSE (was true), nameless -> FALSE. A bride
// with no name on file could never have her draft approved by a plain 「 yes 」,
// ever, and walk ten only ran because the founder was handed a NAMING affirmative
// instead. The broken class pre-existed for nameless brides; the render guard
// widened it. Both halves are this arc's, and the general lesson is the finding.
//
// THE STAMP. The door now marks its own confirm row with a reserved `sent_by`
// value and this predicate reads THE STAMP. `messages.sent_by` is free text and
// the estate has minted a reserved value here before — `vendor_relay`, one
// writer, exact precedent — so ZERO migration. A copy change can never move this
// gate again, because the gate no longer reads copy.
//
// THE DERIVED WALL, CURED IN THE SAME DELIVERY RATHER THAN DISCOVERED LATER: two
// readers filter `sent_by = 'agent'` for the MONTHLY COST view
// (`src/admin/router.js`, symbols in the vendor-detail and cost paths). A new
// value would have dropped every relay-confirm turn out of the estate's own money
// aggregate, silently. Both readers are widened in this ZIP and a cell asserts
// they stay widened — a stamp that quietly under-counts spend would be this
// finding's own disease in a second coat.
const RELAY_CONFIRM_SENT_BY = 'relay_confirm';

// The outcomes that ARE the door asking. Derived by rendering each byte and
// testing it, never assumed: `showBlock` (① the SHOW frame) and `mismatchBlock`
// (⑨ the re-show) both end in the confirm question; ③, ④, ④b-v2, ⑤, ⑥, ⑦ do not.
const ASKING_KINDS = Object.freeze(['staged', 'not_adjacent']);
const relayOutcomeAsks = (out) => !!(out && out.kind && ASKING_KINDS.includes(out.kind));

async function doorAsked(supabase, conversationId) {
  if (!supabase || !conversationId) return false;
  try {
    const { data } = await supabase
      .from('messages').select('sent_by, direction')
      .eq('conversation_id', conversationId).eq('direction', 'outbound')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    return !!(data && data.sent_by === RELAY_CONFIRM_SENT_BY);
  } catch (_e) { return false; }
}

// ══ THE RECEIPT CHAIN (R-29.35) — ④b-v2's PROMISE, MADE MACHINERY ═══════════
//
// ④b-v2 says 「 I'll confirm the moment it's delivered and read. 」 A byte never
// promises a state the machine does not hold, so here is the machine.
//
// The status webhook already receives Meta's delivered/read events and lands
// them on `messages.delivery_status` by wamid. This reads that same event and,
// when the wamid belongs to a row THIS ARC wrote (`sent_by = 'vendor_relay'` —
// the marker with exactly one writer), speaks the receipt to the vendor.
//
// №15 IS GATED BY META, NEVER SYNTHESIZED. Her read receipts can be off; a
// `read` we never received is a read that did not happen, and inferring one from
// a `delivered` would be this arc's founding disease in its smallest possible
// form. If Meta does not send it, the vendor simply never hears it.
async function relayReceipt(supabase, { wamid, status, sendWhatsApp, env }) {
  if (!wamid || !status) return null;
  const want = String(status).toLowerCase();
  if (want !== 'delivered' && want !== 'read') return null;
  try {
    const { data: row } = await supabase
      .from('messages').select('id, conversation_id, sent_by, body')
      .eq('twilio_sid', wamid).maybeSingle();
    if (!row || row.sent_by !== 'vendor_relay') return null;   // not ours; say nothing

    const { data: convo } = await supabase
      .from('conversations').select('vendor_id, counterparty_phone')
      .eq('id', row.conversation_id).maybeSingle();
    if (!convo || !convo.vendor_id) return null;

    // ── F-06.180's CURE · THE HANDSET IS RESOLVED, NOT ASSUMED ───────────────
    // This selected `phone` from `public.vendors`, WHICH HAS NO SUCH COLUMN (38
    // columns, witnessed). `vend.phone` was therefore always undefined and this
    // function returned null on every real status Meta ever sent — №14 and №15
    // have never once reached a vendor's handset. Walk nine proved it on
    // production: `status=read matched=1 sent_by=vendor_relay` matched the right
    // row and no byte left the estate.
    const { vendorHandset } = require('./vendorHandset');
    const hand = await vendorHandset(supabase, convo.vendor_id);
    if (!hand.phone) {
      // NAMED, NOT SILENT. The old `return null` is exactly why this survived
      // from seating: a receipt that declines to speak must say why, or its
      // silence is indistinguishable from "not ours" (F-06.171's law).
      console.warn(`[relay:wa] ${want}_receipt undeliverable vendor=${convo.vendor_id} reason=${hand.reason}`);
      return null;
    }

    const name = await coupleDisplayName(supabase, convo.vendor_id, convo.counterparty_phone);
    const line = want === 'delivered'
      ? deliveredLine(name, convo.counterparty_phone)   // №14
      : readLine(name);                                 // №15
    const from = (env || process.env).VENDOR_WHATSAPP_NUMBER;
    if (typeof sendWhatsApp !== 'function' || !from) {
      console.warn(`[relay:wa] ${want}_receipt undeliverable — no transport or no vendor lane`);
      return null;
    }
    await sendWhatsApp(hand.phone, line, [], from);
    console.log(`[relay:wa] ${want}_receipt wamid=${wamid} vendor=${convo.vendor_id}`);
    return { line, kind: `${want}_receipt` };
  } catch (e) {
    console.warn('[relay:wa receipt]', e && e.message);
    return null;
  }
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
  // ENTRY IS LOGGED. "The seat never ran" and "the seat ran and declined" have
  // looked identical in every log this arc has produced. They stop looking
  // identical here.
  console.log(`[relay:wa] seat entered (words=${deps.ownerWords ? 'yes' : 'NO'} transport=${deps.hasTransport !== false})`);
  const signals = collectSignals(result);

  // ── R-29.35 · AUTO-SEND — THE CONSUMER IS RETIRED FROM THIS SEAT ──────────
  //
  // RETIRE-WITH-THE-READER, APPLIED TO ITSELF. `deps.windowJustOpened` lived
  // here from R-29.35 with ZERO production producers — F-06.178, and the census
  // that convicted it found its only two setters inside
  // `scripts/b06_relay_hand_bench.js`, which is a fixture, not a reader.
  //
  // THE TRIGGER COULD NEVER HAVE LIVED HERE. This seat runs on the VENDOR'S
  // turn, reached from the vendor path of `src/lib/vendorInbound.js`. The act
  // that opens the window is the BRIDE'S inbound, which enters the couple-lane
  // region and never calls this function at all. So the branch was not merely
  // unwired; it was wired to a moment that cannot occur. Its `approvedFor` call
  // keys on `vendor.id`, which her arrival does not hold — the shape itself was
  // evidence of the wrong seat.
  //
  // WHERE IT WENT (path + symbol, never a line range): the auto-send now fires
  // from `src/lib/vendor/coupleArrival.js`, symbol `arrivalAutoSend`, invoked at
  // the couple lane's vendor-resolved routing terminals, and it calls
  // `sendApprovedDraft` (this file) directly. Running this whole vendor seat on
  // a bride's turn is exactly the class R-29.30 polices, so the callable was
  // extracted rather than the seat re-entered.
  //
  // A cell asserts this branch is GONE (`windowJustOpened` unreadable here), so
  // a future reinstatement without a producer fails at the bench rather than in
  // eight walks.
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
  // `preApproved` is the auto-send path: the row is ALREADY `approved` (his E3
  // yes, held across a shut window), so re-approving it would fail the state
  // guard correctly and strand a draft he has already authorised.
  const approved = deps.preApproved ? { ok: true } : await drafts.approve(supabase, draft.id);
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

  // ── THE WINDOW-CLOSED FORK IS ASKED FIRST (R-29.35) ───────────────────────
  // The blanket refusal below used to run BEFORE this fork, so a doorbell that
  // rang had to un-refuse the row it had just terminated. Under R-29.35 the
  // draft must SURVIVE a rung doorbell — his approval is standing and the byte
  // promises a delivery — so the fork is asked before anything is resolved and
  // only the paths that truly end here stamp a terminal.
  if (out.kind === 'window_closed') {
    // ── THE ④-FORK (R-29.24 ②) — the doorbell arm, live. ONLY on window_closed:
    // an UNDETERMINED window falls through to ⑤ untouched, because ringing a
    // doorbell on a window we could not read is a message sent on a guess.
    const rung = await ringDoorbell(supabase, {
      vendor, couplePhone: draft.couple_phone, brideName: name, env: deps.env,
      // supabase + threadId so the doorbell's own row lands on HER thread. Walk
      // seven delivered a message to her handset the estate had no record of.
      deps: { ...deps, supabase, threadId: (await findOrCreateCoupleThread(supabase, vendor.id, draft.couple_phone)).threadId },
    });
    if (rung.ok) {
      // ⑤ THE STATE MACHINE IS UNTOUCHED — the draft is still `refused` with
      // `window_closed`, written above. The doorbell's own sid is recorded in the
      // reason so the register knows a notification went and which one.
      // ── R-29.35 · THE DRAFT STAYS APPROVED. F-06.170's principle, applied:
      // A BYTE NEVER PROMISES A STATE THE MACHINE DOES NOT HOLD. ④b-v2 promises a
      // delivery, so the draft must still be alive to deliver. His E3 approval
      // already named her and showed her phone; a shut window never invalidated
      // it, and asking for a second affirmative was the chair's own design defect
      // (correction №9). Expiry (24h) and supersede still stand, and
      // 「 cancel the <name> draft 」 revokes it — byte №13 its receipt.
      await drafts.markDoorbell(supabase, draft.id, rung.twilioSid);
      console.log(`[relay:wa] doorbell_rang wamid=${rung.twilioSid || 'nosid'} draft=${draft.id}`);
      return { line: doorbellLineV2(name), kind: 'window_closed_doorbell', draftId: draft.id };   // ④b-v2
    }
    console.warn('[relaySeat] doorbell not rung:', rung.reason);
    await drafts.refuse(supabase, draft.id, `window_closed:${rung.reason}`);
    return { line: windowClosedLine(name), kind: 'window_closed', draftId: draft.id };          // ④, the fallback
  }
  // EVERY OTHER REFUSAL IS RECORDED WITH ITS REASON (0118, R-29.20) and stamps
  // `resolved_at` through the store's single transition primitive.
  await drafts.refuse(supabase, draft.id, out.reason || out.kind);
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
  RELAY_CONFIRM_SENT_BY,
  ASKING_KINDS,
  relayOutcomeAsks,
  looksLikeThePhone,
  relayReceipt,
  // FORK 4(b) — the auto-send's callable, extracted so the BRIDE'S lane can send
  // an approved draft without running the vendor seat on her turn (R-29.30).
  sendApprovedDraft: sendApproved,
  RELAY_STANDING_LAW,
  doorbellLineV2,
  deliveredLine,
  readLine,
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
