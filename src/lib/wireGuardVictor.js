'use strict';
// src/lib/wireGuardVictor.js — THE VICTOR SITTING'S GUARD ARMS. ONE HOME.
//
// Ruled at R-VS.7 (F-B = B-i + B-ii + B-iii; B4 REFUSED) and R-VS.6 (F-40.8 = (a)).
// `src/api/vendor-engine/chat.js` calls into here from THREE small sites inside
// `wireGuardClassify`; the vocabulary, the classes and the equality fence live
// together in this file so a bench can drive them purely, and so chat.js — 3,300
// lines and heavily pinned — takes an additive diff rather than a rewrite.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY ANY OF THIS EXISTS: THE GUARD NEVER RAN
// ═══════════════════════════════════════════════════════════════════════════
// Read-first 2, derived by EXECUTING the real classifier rather than reading its
// regexes. On both walked specimens `wireGuardClassify` returns `null` at its
// eligibility gate (chat.js, `if (!claimsAct && !jotClaim && !narrated &&
// !presenceClaim) return null;`). Every conviction limb — LIMB 2's absence arm,
// LIMB 3's Fork A′ — sits BELOW that line, so a turn matching no claim family is
// not acquitted; it is never classified, mints no `evals_runs` row, and is
// invisible to Stage 2 AND to the weekly precision read.
//
//   「Done.」                        -> NULL. `DONE_MARKER_RE` matches "done", but it
//                                     is read only inside markerIn/doneOpener,
//                                     sixty-six lines BELOW the gate. A completion
//                                     marker is not a claim family: "Done." is a
//                                     marker with nothing to mark.
//   「Done. …logged today.」          -> NULL. ACTION_CLAIM_RE's only reachable limb is
//                                     `[^.]{0,30}` — it CANNOT CROSS A PERIOD.
//   「Reaching out to Kunal now」     -> NULL. "reach out" is in NO transmission
//                                     vocabulary: not RELAY_CLAIM_RE, not
//                                     RELAY_VERB_RE. ACK_INTENT_RE's gerund limb is
//                                     a closed list without it.
//   「No one owes you anything」      -> NULL. `existenceOnly` needs narrated ||
//                                     presenceClaim; ABSENCE_ASSERT_RE needs an
//                                     absence word within 25 chars of "on file / in
//                                     the cabinet / record of / in the system".
//                                     Money matches none of it (F-40.6).
//
// Thirty days of the guard's own production log corroborate it: 22 rows, ZERO
// carrying a money class, ZERO carrying an expense. Three walked reds left no
// trace in the instrument built for their family.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DESIGN CHOICE THAT MATTERS: THE ASK IS READ, NOT ONLY THE REPLY
// ═══════════════════════════════════════════════════════════════════════════
// A reply-only vocabulary cannot classify 「Done.」 at all — the sentence carries
// no object, so nothing in it says which capability was claimed. And a
// reply-only expense vocabulary that fired on the word "paid" would convict
// 「Priya paid Rs 50,000」, an ordinary and TRUE money report.
//
// So the expense and lead-send arms read the OWNER'S IMPERATIVE and the reply
// together, which is precisely `imperativeMiss(message, result)`'s own shape,
// already live in this estate since F-06.136. The ask establishes WHICH
// capability is in play; the reply establishes whether an act was claimed. Both
// are required. Neither alone convicts.
//
// ═══════════════════════════════════════════════════════════════════════════
// B-ii · FALSE BY CONSTRUCTION, AND THE EMPTY ACQUITTAL SET
// ═══════════════════════════════════════════════════════════════════════════
// LIMB 4 already rules that an act claim in the advisor room is false without
// looking anywhere, because that room structurally holds no mutation hands. This
// is that logic extended to two more structural impossibilities, both of them
// RULINGS rather than accidents of the tree:
//
//   `expense`   — R-39.18 homes `log_expense` in Block 09; F-40.5 keeps the
//                 island's live-shaped copy (src/agent/tools.js:351,
//                 src/agent/engine.js:1758) DEAD BY LAW, because its insert
//                 bypasses the sole-writer home src/lib/vendor/expenses.js.
//                 There is no expense hand in `src/engine/src/**`. Grep-zero,
//                 and confirmed read-vs-assert-absent against the tool registry.
// ── R-VS.12 · `lead_send` IS RETIRED, AND THE PREMISE UNDER IT WAS FALSE ────
// R-VS.3 ruled "no send to a lead this sitting; no door exists", and this file's
// first cut built a `lead_send` class on it with an empty acquittal set. THE
// CHAIR VACATED THAT RULING AND OWNED THE ERROR (c-40.6): in this estate A LEAD
// IS A COUPLE WHO WROTE IN, and `donna_relay_stage`/`donna_relay_send` ARE
// Victor's line to a lead. The door is live and walked — `relayToCouple.js` asks
// the window first, sends free-form in-window and rings the doorbell out of it,
// sealed at CE-212→CE-215 on two brides' handsets.
//
// So the class is gone and its vocabulary stays. `TRANSMISSION_CLAIM_RE` remains
// B-i vocabulary — it exists because 「reach out」, 「get in touch」 and 「contact」
// were in NO transmission family at c841082 and the gate could not see F-39.71 at
// all — but it now feeds the EXISTING `relay` class with its existing acquittal
// `/^donna_relay_send$/`, rather than minting a rival.
//
// THE "CROSS-LANE HOLE" THIS SEAT CLOSED IS REOPENED DELIBERATELY, because it was
// never a hole: a claimed send to a lead acquitted by a real `donna_relay_send`
// THIS TURN is correct by CE-215's constitution. The guard was working; the seat
// read a lane boundary that does not exist and built a fence across it.
//
// Each remaining class carries an EMPTY ACQUITTAL SET and is NEVER `records`. That last
// word is the point: F-40.7 found `records` is a catch-all (`isDeedOfClass` ends
// `return !isDateDeed`), so any non-date write acquits anything filed under it.
// Routing expenses there would mean a `donna_lead` write acquitting a false
// expense claim the day Block 09 ships the hand — F-06.183's cured shape, live
// again one class over. These two classes cure that for their own arms now; the
// catch-all's remainder is Block 09's by number.

const { VICTOR_LINES } = require('./victorLines');

// ── B-i · THE ASK VOCABULARIES ──────────────────────────────────────────────
// What the OWNER asked for. Deliberately generous — a miss here is a turn the
// ladder does not see, which is the disease; a false hit here still cannot
// convict on its own, because the reply must ALSO claim an act.

// 「paid the assistant 5000 today」 · 「spent 2k on fuel」 · 「log this expense」
const EXPENSE_ASK_RE = new RegExp([
  "\\b(?:i\\s+)?(?:paid|spent|bought|shelled out)\\b",
  "\\blog\\s+(?:this\\s+|an?\\s+)?(?:expense|spend|cost|bill|payment)\\b",
  "\\b(?:expense|expenses|spends?)\\b[^.]{0,20}\\b(?:log|note|record|add|enter)\\b",
  "\\b(?:add|note|record|enter)\\b[^.]{0,20}\\b(?:expense|spend|cost)\\b",
].join('|'), 'i');

// 「message Kunal that we're available Nov 22」 · 「reach out to Priya」 ·
// 「tell him we can do the 22nd」 · 「get in touch with Rohan」
// R-VS.7's named additions to the transmission family are here: reach out /
// reaching out / get in touch / contact — none of which existed anywhere in
// RELAY_VERB_RE or RELAY_CLAIM_RE at c841082.
const LEAD_SEND_ASK_RE = new RegExp([
  "\\b(?:message|msg|text|whatsapp|write to|reply to|tell|ask|inform|contact)\\s+\\S",
  "\\b(?:reach\\s+out|reaching\\s+out|get\\s+in\\s+touch|follow\\s+up)\\b",
  "\\blet\\s+\\S+\\s+know\\b",
  "\\bsend\\s+(?:\\w+\\s+){0,2}(?:a\\s+)?(?:message|note|text|quote|reply)\\b",
].join('|'), 'i');

// ── B-i · THE REPLY ARMS ────────────────────────────────────────────────────

// A completion or intent claim with NO object of its own. This is the shape the
// gate could not see: 「Done.」 「Logged.」 「Sorted.」 「On it.」 — and the
// present-tense promise 「Reaching out to Kunal now」, which is F-39.71 exactly.
// Bounded to a SHORT leading fragment for the bare forms, following
// `doneOpener`'s own reasoning: a long first sentence that merely contains
// "done" is not a completion claim.
const BARE_COMPLETION_RE = /^\s*(?:done|logged|filed|noted|recorded|sorted|handled|added|entered)\b[\s.!,—-]*$/i;
// ── §0.2 · A DEFECT THE SEAT'S OWN PROBE FOUND, CURED BEFORE THE CUT ────────
// The first draft of this file classified 「Done.」 and missed 「Logged Rs 5,000
// for the assistant, today.」 — the SAME shape wearing an object. BARE_COMPLETION_RE
// requires the fragment to be nothing but the word, which is right for the bare
// form and blind to the commonest one. This is the LEADING form: a reply that
// OPENS on a completion participle. Safe to be this broad because it never
// convicts alone — the owner's imperative must ALSO name a capability the lane
// does not hold, and 「Logged your note」 in a lane that HAS the hand still walks.
const LEADING_COMPLETION_RE = /^\s*(?:done|logged|filed|noted|recorded|sorted|handled|added|entered)\b/i;
// ── A REAL DEFECT THE BENCH FOUND, NOT A CELL DEFECT (§0.2) ────────────────
// 「I'll send Kunal a note about Nov 22.」 was convicting — but as `relay`, the
// BRIDE lane's class, because RELAY_CLAIM_RE's first-person limb caught it and
// `victorClaim` did not. That is a CROSS-LANE HOLE with teeth: `isDeedOfClass`
// answers `relay` with `RELAY_DEED_RE = /^donna_relay_send$/`, so a bride-bound
// `donna_relay_send` hand would ACQUIT a claimed send to a LEAD — F-06.183's
// cured shape (a lead write acquitting a bride send) running in the opposite
// direction. CE-215's constitution is that the two lanes' consent does not mix;
// this closes the same door on the guard's side. So the transmission-completion
// vocabulary lives here too, and because `victorClass` is tested FIRST in
// chat.js's deedClass ladder, a send aimed at a lead can no longer be filed
// under the bride lane's class at all.
const TRANSMISSION_CLAIM_RE = new RegExp([
  "\\bi'?(?:ll|ve|m| will| have| am)\\s+(?:just\\s+|already\\s+|now\\s+|going\\s+to\\s+)?(?:send|sent|sending|message|messaged|messaging|text|texted|write|written|whatsapp|whatsapped|drop|dropped|ping|pinged)\\b",
  "\\b(?:message|note|reply|text)\\s+(?:to\\s+\\S+\\s+)?(?:is|has been|was|'s)\\s+(?:sent|out|away|live|gone|delivered)\\b",
  "\\b(?:sent|messaged|texted|forwarded|passed on)\\s+(?:it\\s+)?to\\s+\\S",
].join('|'), 'i');

const BARE_INTENT_RE = new RegExp([
  "\\b(?:reaching|getting|writing|messaging|texting|sending|contacting|following)\\s+(?:out\\s+|in\\s+touch\\s+|up\\s+)?(?:to|with)?\\s*\\S",
  "\\bon\\s+it\\b",
  "\\bwill\\s+(?:do|reach|message|text|write|send|contact)\\b",
  "\\bi'?ll\\s+(?:reach|get\\s+in\\s+touch|follow\\s+up|contact)\\b",
].join('|'), 'i');

// ── B-i · THE MONEY ARM (F-40.6) ────────────────────────────────────────────
// A sentence that states what is or is not owed. Both polarities: the absence
// (「no one owes you anything」 — F-39.73's live symptom) and the presence
// (「Priya Nair owes you Rs 60,000」 — R-40.2 line 4's own shape). BOTH must
// reach the ladder, because R-VS.6 acquits the grounded one and convicts the
// ungrounded one, and a family that only catches absences cannot do that.
const MONEY_STATE_RE = new RegExp([
  "\\b(?:owes?|owed|owing)\\b",
  "\\b(?:unpaid|outstanding|overdue)\\b",
  "\\bnothing\\s+(?:due|outstanding|owed|owing)\\b",
  "\\b(?:invoice|invoices)\\b[^.]{0,40}\\b(?:unpaid|outstanding|paid|due|pending|settled|cancelled)\\b",
  "\\b(?:no|zero)\\s+(?:unpaid|outstanding|open)\\s+invoices?\\b",
].join('|'), 'i');

// ── R-VS.6 FENCE 1 · THE EQUALITY EXTRACTORS ────────────────────────────────
// A gate reads a row, never a display string (CE-215). These pull the figures
// and record addresses OUT of the model's prose so they can be compared against
// what the fact block actually held.
//
// ⚠ §0.2 — A FAITHFUL NARROWING, DISCLOSED. R-VS.6 names three handle kinds:
// "Rs amounts, /NN invoice numbers, client names". AMOUNTS AND INVOICE NUMBERS
// ARE ENFORCED HERE; CLIENT NAMES ARE NOT, and that is a deliberate refusal
// rather than an omission. Extracting a person's name from free prose needs
// NER, and a capitalised-token heuristic would convict ordinary sentences —
// buying a fence against a wrong NAME at the price of false convictions on
// true ones, which is the expensive direction and the one CE-107's arming law
// forbids. The failure mode that matters is a WRONG FIGURE (F-39.73 spoke a
// wrong total; F-40.9 invented a date), and figures are mechanically exact.
// Filed for the chair rather than decided by the seat.
const AMOUNT_TOKEN_RE = /(?:Rs\.?\s*)?(\d{1,3}(?:,\d{2,3})+|\d{4,})/g;
const INVOICE_HANDLE_RE = /(\/\d{1,6})\b/g;

function extractAmounts(text) {
  const out = [];
  let m;
  AMOUNT_TOKEN_RE.lastIndex = 0;
  while ((m = AMOUNT_TOKEN_RE.exec(String(text || '')))) out.push(m[1]);
  return out;
}

function extractInvoiceHandles(text) {
  const out = [];
  let m;
  INVOICE_HANDLE_RE.lastIndex = 0;
  while ((m = INVOICE_HANDLE_RE.exec(String(text || '')))) out.push(m[1]);
  return out;
}

/**
 * moneyGrounded(text, facts) — R-VS.6 fence 1.
 *
 * TRUE iff a money block was built this turn, it was readable, and EVERY figure
 * and invoice handle the model spoke appears in that block's own handle set by
 * equality. A money sentence carrying a figure the block does not hold is NOT
 * grounded and the caller convicts it.
 *
 * A money sentence with no figure at all (「nothing outstanding」) is grounded on
 * the block's presence alone — there is nothing to compare, and the block is the
 * only place that answer could have come from once the fact seam exists.
 */
function moneyGrounded(text, facts) {
  if (!facts || !facts.ok || facts.unreadable) return false;
  const handles = facts.handles || { amounts: [], numbers: [] };
  const amounts = extractAmounts(text);
  const numbers = extractInvoiceHandles(text);
  const amountSet = new Set((handles.amounts || []).map(String));
  const numberSet = new Set((handles.numbers || []).map(String));
  for (const a of amounts) if (!amountSet.has(a)) return false;
  for (const n of numbers) if (!numberSet.has(n)) return false;
  return true;
}

/**
 * victorClaim(eligible, message) — the two structural classes (B-ii).
 *
 * Returns 'expense' | 'lead_send' | null. BOTH halves are required: the owner's
 * imperative names the capability, the reply claims the act. A reply that only
 * asks a question, or only refuses, claims nothing and returns null — which is
 * how the founder-vetoed refusal lines themselves stay out of the ladder.
 */
function victorClaim(eligible, message) {
  const reply = String(eligible || '');
  const ask = String(message || '');
  if (!reply.trim()) return null;

  // The reply's first fragment, for the bare forms. Split on the same sentence
  // boundary the ladder uses so the two readings cannot disagree.
  const first = (reply.split(/(?<=[.!?])\s+|\n+/)[0] || '').trim();
  // ── THE VETOED LINES ARE NEVER A CLAIM ────────────────────────────────────
  // FIRST, above every other test. A reply containing a founder-vetoed refusal
  // VERBATIM is the door's own honest sentence coming back, not an act claim —
  // and convicting it would mean the cure's own words tripping the cure. Matched
  // by IDENTITY against the hash-carried constants, never by a refusal-shaped
  // heuristic: identity cannot drift and cannot hole.
  if (containsVetoedLine(reply)) return null;

  const claimedDone = BARE_COMPLETION_RE.test(first) || LEADING_COMPLETION_RE.test(first)
    || (/\bdone\b/i.test(first) && first.length <= 40);
  // R-VS.12: the `|| TRANSMISSION_CLAIM_RE.test(reply)` term added by this seat's
  // "cross-lane hole" fix is REMOVED HERE, by reversing that edit — the term now
  // lives in `leadSendClaim` above, feeding `relay`. This line is byte-identical to
  // what it was before the fix.
  const claimedIntent = BARE_INTENT_RE.test(reply);

  if (EXPENSE_ASK_RE.test(ask) && (claimedDone || claimedIntent)) return 'expense';
  return null;
}

/**
 * leadSendClaim(eligible, message) — B-i's transmission arm, R-VS.12.
 *
 * TRUE when the owner asked for a message to a lead AND the reply claims or
 * promises that it went. It returns a BOOLEAN, not a class, and chat.js ORs it
 * into `relayClaim` — so the turn reaches the ladder (which is all B-i was ever
 * for) and is then judged by the `relay` class it has always belonged to,
 * acquitted by a real `donna_relay_send` and by nothing else.
 *
 * THE SAME TWO-HALF RULE AS `victorClaim`: the ask names the capability, the
 * reply claims the act. Neither alone convicts, so 「I'll ask her when she
 * writes back」 and a bare draft shown for approval both walk.
 */
function leadSendClaim(eligible, message) {
  const reply = String(eligible || '');
  const ask = String(message || '');
  if (!reply.trim() || !LEAD_SEND_ASK_RE.test(ask)) return false;
  if (containsVetoedLine(reply)) return false;
  const first = (reply.split(/(?<=[.!?])\s+|\n+/)[0] || '').trim();
  const claimedDone = BARE_COMPLETION_RE.test(first) || LEADING_COMPLETION_RE.test(first)
    || (/\bdone\b/i.test(first) && first.length <= 40);
  return claimedDone || BARE_INTENT_RE.test(reply) || TRANSMISSION_CLAIM_RE.test(reply);
}

// ── §0.2 · THE SECOND DEFECT THE PROBE FOUND ────────────────────────────────
// `MONEY_STATE_RE` matched the word "outstanding" inside the founder-vetoed
// LEDGER_UNREADABLE line — 「 …so I won't guess at what's outstanding 」 — and the
// unreadable block made `moneyGrounded` false, so THE CURE'S OWN REFUSAL
// CONVICTED AS A MONEY COSTUME and would have been replaced by a glitch line.
// That is a false interception on a vetoed byte, which is the expensive
// direction and the one CE-107's arming law forbids. Cured by identity, at the
// source, before the cut.
//
// ⚠ AND THE FIRST CURE FOR IT WAS WRONG, WHICH THE PROBE ALSO CAUGHT. The check
// ran against `eligible`, and `eligible` is `sentences.join('\n')` — the ladder's
// own caption-rule output. A two-sentence constant is therefore split on the
// sentence boundary and rejoined with a NEWLINE, so an exact `indexOf` against
// the constant could never match it. Both sides are whitespace-collapsed here, so
// the identity survives the ladder's re-assembly. A cure that is not driven is a
// cure that is asserted; this one was driven, failed, and was fixed.
function containsVetoedLine(text) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (!flat) return false;
  for (const key of Object.keys(VICTOR_LINES)) {
    const line = VICTOR_LINES[key].replace(/\s+/g, ' ').trim();
    if (flat.indexOf(line) !== -1) return true;
  }
  return false;
}

// B-iii · THE DOOR IS THE SOLE AUTHOR OF WHAT THE VENDOR READS ON A COSTUME OF
// EITHER CLASS. deedState.js's shape: the model is handed nothing to paraphrase.
// The lines are R-40.2's, frozen and hash-carried in src/lib/victorLines.js —
// read here, never retyped (the constant-is-read-never-retyped discipline
// F-06.130 earned).
//
// On `lead_send` the DRAFT IS RE-SHOWN VERBATIM BENEATH THE LINE, never inside
// it, and the recipient is named in the ask — the reasoning of the couple lane's
// own `second_costume:relay_lane` arm, reused; its BYTES are not copied, because
// they are the bride lane's veto and not this one's.
// ── R-VS.13 · THE RELAY LANE AUTHORS ITS OWN BYTES, AND ALWAYS DID ─────────
// The lead-send arm is GONE from here. `relaySeat.js`'s `second_costume:relay_lane`
// already delivers the founder-vetoed honest denial, re-shows the draft verbatim
// and asks a yes/no naming the recipient — one home, already hashed, already
// walked on production. R-40.2 line 2 is VACATED and no replacement is minted:
// it stated a falsehood ("I have no line to him from here") built on a vacated
// premise, and a second set of bytes for a sentence the estate already owns
// would be the two-homes disease with a veto stamped on it.
function victorCostumeLine(victorClass, draft) {
  if (victorClass === 'expense') return VICTOR_LINES.EXPENSE_NO_HAND;
  return null;
}

// The classes' acquittal sets are EMPTY. Exported as a named predicate rather
// than as an `if` inside chat.js so the emptiness is a thing a bench can assert
// directly, and so a future hand cannot be added to either class by accident.
const STRUCTURAL_CLASSES = ['expense'];
function structurallyImpossible(deedClass) {
  return STRUCTURAL_CLASSES.includes(deedClass);
}

module.exports = {
  containsVetoedLine,
  TRANSMISSION_CLAIM_RE,
  LEADING_COMPLETION_RE,
  EXPENSE_ASK_RE,
  LEAD_SEND_ASK_RE,
  BARE_COMPLETION_RE,
  BARE_INTENT_RE,
  MONEY_STATE_RE,
  extractAmounts,
  extractInvoiceHandles,
  moneyGrounded,
  victorClaim,
  leadSendClaim,
  victorCostumeLine,
  structurallyImpossible,
  STRUCTURAL_CLASSES,
};
