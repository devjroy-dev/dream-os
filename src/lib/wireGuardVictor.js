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
// ARM B renders candidate sums FORWARD through the house formatter rather than
// parsing the model's prose backward — F-42.114, and the reason is in the ARM B
// header below. This is the same function moneyFacts.js built its handles with,
// so a sum and a stored figure cannot disagree about grouping.
const { rupees } = require('./witnessLine');

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

// ── F-42.21(b) · THE BARE-GERUND DEFECT. MINE, AND IT ATE AN HONEST TURN. ──
// The first cut made the particle OPTIONAL — `(?:out|in touch|up)?` — so the limb
// fired on a BARE "reaching". On the founder's live line, 2026-09-09 18:28:36,
// Victor wrote 「 …to confirm I'm REACHING THE RIGHT PERSON and the right event 」
// and this limb matched the ten bytes "reaching t". That phrase is about
// IDENTIFYING the right person, not about reaching out TO them, and the turn was
// replaced with 「 That didn't land — nothing was changed 」 — a false interception
// on a reply carrying two invoice numbers and two figures the vendor then lost.
//
// THE PARTICLE IS WHAT MAKES THESE VERBS TRANSMISSION VERBS. "reaching",
// "getting" and "following" are among the commonest verbs in English and mean
// nothing about a message on their own; "reach out", "get in touch" and "follow
// up" are the idioms R-VS.12 was asked to add, and the idiom is the whole of the
// signal. So each particle is now REQUIRED with its own verb rather than shared
// optionally across all of them — the shared optional group was the shape that
// let a bare gerund through.
//
// The plainly-transmissive verbs keep their own limb, and they require a
// RECIPIENT (`to`/`with` + a token), because "writing the draft" and "sending the
// invoice" are not sends to a lead either.
const BARE_INTENT_RE = new RegExp([
  "\\breach(?:ing|ed)?\\s+out\\b",
  "\\bget(?:ting)?\\s+in\\s+touch\\b",
  "\\bfollow(?:ing)?\\s+up\\b",
  // These four are transmissive only WITH A RECIPIENT. "writing the draft for you"
  // and "getting the file" are ordinary work; "writing to Priya" is a send. The
  // preposition is required and the object may sit between (up to three tokens,
  // lazily, so the span cannot run past a clause boundary into a later "to").
  "\\b(?:writing|messaging|texting|contacting|sending)\\s+(?:[^\\s,.]+\\s+){0,3}?(?:to|with)\\s+[^\\s,.]+",
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
  // ── F-42.131 · THE EXPENSE VOCABULARY (chair, CE-42 V-2; W-1 lift by arm) ──
  // The family above is entirely INVOICE vocabulary. So the expense fact block
  // shipped with a fence that could never fire: 「 You spent Rs 700 on printing 」
  // matched nothing here, `moneyOnly` stayed false, and `moneyGrounded` was never
  // called on the one class of sentence F-42.97 was filed for. The block still
  // cured the disease directly — Victor is handed the answer — but the backstop
  // was unreachable, which is a fence that reports itself as present.
  //
  // BOUNDED THE SAME WAY THE INVOICE CLAUSE IS, and the bound is the whole of its
  // safety. `spent`, `cost` and `spend` are ordinary English — 「 it spent a week
  // in edit 」, 「 that will cost you the slot 」 — and an unbounded verb list would
  // drag non-money turns into the money limb, which is the false-conviction
  // direction this file's arming doctrine calls the expensive one. So an expense
  // term counts ONLY within 40 characters of an `Rs`, in either order, exactly as
  // `invoice` counts only near a state word.
  //
  // NO BARE `paid`. The invoice plane owns that word (the clause above reads it
  // beside `invoice`), and lifting it here would make every settled-invoice
  // sentence an expense sentence too.
  "\\b(?:spent|spends?|expenses?|went\\s+out|paid\\s+out|costs?)\\b[^.]{0,40}\\bRs\\b",
  "\\bRs\\b[^.]{0,40}\\b(?:spent|spends?|expenses?|went\\s+out|paid\\s+out|costs?)\\b",
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
// ── F-42.118 · THE FENCE COULD NOT SEE A FIGURE UNDER Rs 1,000 ──────────────
// Derived at 7a18bf6: `extractAmounts("Rs 500 on printing")` returned []. The
// old pattern needed FOUR consecutive digits or a comma group, so every
// three-digit figure passed unfenced. On the invoice plane that never mattered —
// invoices are four figures. On the EXPENSE plane it is the common case: the
// founder's own book opens with a Rs 500 row, and Victor could have invented
// "Rs 700 on printing" and nothing would have convicted him.
//
// THE CURE IS SCOPED, and the scope is the whole of its safety. A bare `\d{3}`
// would convict ordinary prose: `2026` is a year, `04:58` is a clock, and
// `TDW/DEV440/07` is an invoice address the OTHER extractor owns. So a
// three-digit figure is read ONLY where `Rs` precedes it, which is the one
// context in which three digits are unambiguously money. Four-plus digits and
// comma-grouped figures are read exactly as before, prefix or not — the money
// arm's existing cells assert that and they are re-run and disclosed.
//
// The alternation is ORDERED LONGEST-FIRST. `Rs 5,000` must match the grouped
// branch and yield `5,000`; if the bare three-digit branch came first the engine
// would take `5` and then trip over the comma, turning a true figure into an
// unheld one — a false conviction, the expensive direction.
const AMOUNT_TOKEN_RE = /(?:Rs\.?\s*(\d{1,3}(?:,\d{2,3})+|\d{4,}|\d{3})|(\d{1,3}(?:,\d{2,3})+|\d{4,}))/g;

// ── F-42.134 · THE EXTRACTOR WAS BLIND TO SHORTHAND ─────────────────────────
// 2026-09-10 03:31:12, SHIPPED to the founder's handset and PASSED by the fence:
// 「 Chase the 10k first; it's clean. The 42k invoice carries context 」.
// `extractAmounts` returned only the three grouped figures — `10k` and `42k` are
// two digits and a letter, so neither branch above can see them. A WRONG
// shorthand would have passed the same way, and under the figure-trigger arm a
// reply carrying ONLY shorthand would skip the money limb entirely.
//
// THIS ARM GROUNDS THE NUMBER; IT DOES NOT POLICE THE STYLE. The register law
// (R-41.114 — `Rs X,XX,XXX`, never k/L/Cr) is F-42.133's and belongs to the soul
// sitting under W-1. A fence that convicted on spelling would be doing the soul's
// job badly and would destroy true answers to do it.
//
// Normalised to plain rupees and compared against the SAME handle set: the block
// already pushes raw digits beside the grouped form (`moneyFacts.pushAmount`
// writes both `10,000` and `10000`), so `10k -> 10000` grounds by equality with
// no new handle form anywhere. Decimals are read because `1.5L` is how a lakh is
// written; the multiplication is exact in integers after rounding.
const SHORTHAND_RE = /(?:Rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k|L|lakhs?|cr|crores?)\b/gi;
const SHORTHAND_SCALE = { k: 1000, l: 100000, lakh: 100000, lakhs: 100000, cr: 10000000, crore: 10000000, crores: 10000000 };

function shorthandToRupees(numText, unitText) {
  const n = Number(numText);
  const scale = SHORTHAND_SCALE[String(unitText).toLowerCase()];
  if (!Number.isFinite(n) || !scale) return null;
  const v = Math.round(n * scale);
  return v > 0 ? String(v) : null;
}

function extractShorthandAmounts(text) {
  const out = [];
  let m;
  SHORTHAND_RE.lastIndex = 0;
  while ((m = SHORTHAND_RE.exec(String(text || '')))) {
    const v = shorthandToRupees(m[1], m[2]);
    if (v) out.push(v);
  }
  return out;
}
// ── F-42.21 CURE 1 · THE FENCE WAS BUILT AGAINST THE RULING'S EXAMPLE, NOT THE
// COLUMN. R-40.2's exemplar wrote 「 invoice /05 」 and this seat pinned `/NN`. The
// COLUMN holds `TDW/DEV440/05`. So the extractor pulled `/05` out of Victor's
// prose, looked for `/05` in a handle set holding `TDW/DEV440/05`, missed, and
// called a TRUE figure ungrounded — every money answer citing an invoice number
// convicted, live, on 2026-09-09 at 23:27 and 23:28. Reproduced first try.
//
// Both forms are read now: the full `PREFIX/NNN/NN` the column stores AND the
// bare `/NN` tail R-40.2's own shape uses, so neither spelling is the one the
// fence happens to know.
const INVOICE_HANDLE_RE = /((?:[A-Za-z][A-Za-z0-9]*\/)+\d{1,6}|\/\d{1,6})\b/g;

function extractAmounts(text) {
  const out = [];
  let m;
  AMOUNT_TOKEN_RE.lastIndex = 0;
  // Two groups because the pattern has two branches (F-42.118): group 1 is the
  // Rs-prefixed figure, group 2 the bare one. Exactly one is ever defined.
  //
  // THE YEAR EXCLUSION, AND IT IS A BARE-BRANCH RULE ONLY (chair ruling 7's cell).
  // `2026` matched the old `\d{4,}` branch, so a true money sentence that
  // mentioned the year — 「 due in 2026 」 — convicted unless the ledger happened
  // to hold 2026 as a figure. That is a FALSE CONVICTION ON A TRUE SENTENCE,
  // which this file's own arming doctrine calls the expensive direction.
  // `Rs 2026` is still read: the prefix is what makes four digits money.
  //
  // DISCLOSED RESIDUAL, so a later reader does not discover it as a surprise: a
  // genuine figure between 1900 and 2099 spoken BARE and WITHOUT the prefix —
  // `2000` rather than `Rs 2,000` — is no longer fenced. The block renders every
  // figure grouped and prefixed, so a Victor copying his own block cannot land
  // there; an inventor could. Narrower than convicting every year, wider than
  // convicting none. Filed rather than hidden.
  const YEAR_SHAPED = /^(?:19|20)\d{2}$/;
  // ── F-42.151 · A PHONE NUMBER IS NOT A RUPEE FIGURE ─────────────────────────
  // Seen on the record 2026-09-10 04:44:48, in `spoken_figures`:
  //   ["918595986978","80,000","42,000"]
  // Twelve digits, so the bare `\d{4,}` branch took the vendor's own lead phone
  // as money. In the `unfenced` door that is only noise. IN THE MONEY-STATE DOOR
  // IT IS A FALSE CONVICTION WAITING ON A PHRASING: 「 Priya Nair owes Rs 42,000 —
  // reach her on +918595986978 」 is TRUE, and no phone is a held amount, so the
  // fence would destroy it.
  //
  // TWO DISCRIMINATORS, BOTH ALREADY IN THE TEXT and neither guessed:
  //   · a `+` immediately before the run — an E.164 number, never a price
  //   · TEN OR MORE digits with NO grouping — the estate renders every figure
  //     through `rupees()`, which groups above three digits, so an ungrouped
  //     ten-digit run cannot be a figure this estate wrote
  // A GROUPED long figure is untouched: `10,00,00,000` keeps its commas and stays
  // money. The Rs-prefixed branch is untouched entirely — `Rs 918595986978` would
  // still read, because the prefix is the author saying it is money.
  const PHONE_SHAPED = /^\d{10,}$/;
  const src = String(text || '');
  while ((m = AMOUNT_TOKEN_RE.exec(src))) {
    if (m[1]) { out.push(m[1]); continue; }
    if (!m[2]) continue;
    if (YEAR_SHAPED.test(m[2])) continue;
    if (PHONE_SHAPED.test(m[2])) continue;
    // The character immediately before the match — a `+` makes it a dialled
    // number whatever its length.
    const at = m.index + m[0].indexOf(m[2]);
    if (at > 0 && src[at - 1] === '+') continue;
    out.push(m[2]);
  }
  // F-42.134: shorthand joins the SAME list, already normalised to rupees, so
  // every consumer — the equality set, ARM B's admission, the figure trigger —
  // reads one list and none of them learns a second spelling.
  for (const v of extractShorthandAmounts(text)) out.push(v);
  return out;
}

// ── F-42.97 · THE DATE EXTRACTOR ────────────────────────────────────────────
// Both orders, because Victor writes both: 「 10 September 」 and 「 Sep 1 」. An
// ordinal suffix is tolerated and dropped. Output is NORMALISED to the store's
// own order, `D Month`, with no leading zero — the shape `shortDate` and
// `longDate` render — so the comparison stays string equality against handles
// the block built forward, and no date is ever parsed into a Date().
//
// The month table is the union of both spellings and it is NOT a third home for
// month vocabulary: it exists only to RECOGNISE a month word in prose. The
// rendering side has one home, witnessLine.js, and this file renders nothing.
const MONTH_WORD =
  '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const DATE_DM_RE = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_WORD}\\b`, 'gi');
const DATE_MD_RE = new RegExp(`\\b${MONTH_WORD}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'gi');

// "Sept" is a spelling neither formatter produces. Folded to "Sep" so a true
// sentence is not convicted over an abbreviation — the F-42.21 direction.
function normaliseMonth(word) {
  const w = String(word);
  return /^sept$/i.test(w) ? 'Sep' : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function extractSpokenDates(text) {
  const s = String(text || '');
  const out = [];
  let m;
  DATE_DM_RE.lastIndex = 0;
  while ((m = DATE_DM_RE.exec(s))) out.push(`${Number(m[1])} ${normaliseMonth(m[2])}`);
  DATE_MD_RE.lastIndex = 0;
  while ((m = DATE_MD_RE.exec(s))) out.push(`${Number(m[2])} ${normaliseMonth(m[1])}`);
  return out;
}

function extractInvoiceHandles(text) {
  const out = [];
  let m;
  INVOICE_HANDLE_RE.lastIndex = 0;
  while ((m = INVOICE_HANDLE_RE.exec(String(text || '')))) out.push(m[1]);
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// ARM B · THE SUBTOTAL A TRUE ANSWER IS ALLOWED TO SPEAK  (F-42.98, ruled B)
// ═══════════════════════════════════════════════════════════════════════════
// 2026-09-10 00:52:18, the founder's handset. Victor's answer was RIGHT — three
// invoices, every row correct, the total correct — and it convicted, twice, on
// its own last sentence: 「 Two of those are Priya Nair — Rs 52,000 across two
// invoices. 」 10,000 + 42,000. Both addends held; the sum was not, because
// moneyFacts' handles carry per-row figures and the grand total and NEVER a
// subtotal. The retry was byte-identical: Fork D cannot cure this, there is no
// hand to grow.
//
// RULED B: a spoken figure is admitted when it is an EXACT SUM of two or more
// figures THE BLOCK HOLDS. Never a difference, never a product, never a sum that
// uses a figure the block does not hold. R-40.2's 「 never the model's
// arithmetic 」 is read as: arithmetic THE BLOCK CANNOT REPRODUCE. Arms A
// (pre-computed subtotals in the block — pre-decides his cuts, loses to the next
// phrasing) and C (a soul instruction — a law where a mechanism belongs, B4's
// lesson) were both refused at the chair.
//
// ── THE PROSE IS NEVER PARSED, AND THAT IS THE DESIGN ──────────────────────
// F-42.114: the kickoff named `witnessLine.js:rupees` as an "Indian grouping
// parser". IT IS A FORMATTER — number to string — and no string-to-number rupee
// parser exists anywhere in this tree. So none is written. Candidate sums are
// built FORWARD from the rows and rendered through `rupees()`, the same house
// formatter moneyFacts.js used to build the handles, and the spoken token is
// compared BY STRING EQUALITY against both spellings. That keeps R-VS.6's
// direction exactly as it was: THE STORE COMPUTES, THE PROSE IS CHECKED AGAINST
// IT, never the reverse. A forged longer name cannot become a match, and no
// grouping edge case can be introduced by a second implementation.
//
// ── THE POOL IS PER-BLOCK  (c-42.23, F-42.123) ─────────────────────────────
// The chair first ruled one merged handle set. Driven against the founder's real
// rows before a byte moved, a merged ADDEND pool admitted Rs 55,000 (the
// invented-figure acceptance cell), Rs 45,000 (a CANCELLED invoice), Rs 18,000
// and Rs 12,000 (PAID invoices) — four expense rows of 500/1000/2000/5000 are a
// fine-grained adjustment kit that reaches almost any nearby number, and 76 of
// 91 admitted sums existed on neither plane. The chair amended: EQUALITY merges
// across blocks, ARITHMETIC does not. Equality reads figures that EXIST; ARM B
// MANUFACTURES them, and manufacturing across two planes yields a number no row
// anywhere supports.
//
// ── THE BOUND  (chair, ruled) ──────────────────────────────────────────────
// Subset search is not free and `readOutstanding` carries no row cap. Sizes 2–4
// up to 20 rows; sizes 2–3 above 20; NO ADMISSION above 40, which convicts
// exactly as the fence did before ARM B — the fail-safe direction. Cost at the
// ceilings: 20 rows sizes 2–4 = 6,175 subsets; 40 rows sizes 2–3 = 10,660.
const ARM_B_ROWS_FULL = 20;
const ARM_B_ROWS_NARROW = 40;

/**
 * admittedAsSubtotal(token, rowAmounts, rupeesFmt) — ARM B's whole mechanism.
 *
 * TRUE iff `token` is the rendered form of an exact sum of 2..k distinct row
 * figures. Enumerates by size with the sum carried down, so a subset is never
 * re-added; returns at the first match.
 */
function admittedAsSubtotal(token, rowAmounts, rupeesFmt) {
  const rows = (rowAmounts || [])
    .map((n) => Math.round(Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (rows.length < 2) return false;
  if (rows.length > ARM_B_ROWS_NARROW) return false;
  const maxSize = rows.length > ARM_B_ROWS_FULL ? 3 : 4;

  const want = String(token);
  const matches = (sum) => {
    const grouped = rupeesFmt(sum);
    return (grouped && grouped.replace(/^Rs\s*/, '') === want) || String(sum) === want;
  };

  let found = false;
  const walk = (start, size, sum) => {
    if (found) return;
    if (size >= 2 && matches(sum)) { found = true; return; }
    if (size === maxSize) return;
    for (let i = start; i < rows.length && !found; i++) walk(i + 1, size + 1, sum + rows[i]);
  };
  walk(0, 0, 0);
  return found;
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
function moneyGrounded(text, facts, expenseFacts) {
  if (!facts || !facts.ok || facts.unreadable) return false;
  const handles = facts.handles || { amounts: [], numbers: [] };
  // THE EXPENSE BLOCK CONTRIBUTES ONLY WHEN IT READ (F-42.97). Absent or
  // unreadable, this function behaves EXACTLY as it did before this sitting —
  // the regression law, and the reason the parameter is optional and last.
  const exp = (expenseFacts && expenseFacts.ok && !expenseFacts.unreadable)
    ? (expenseFacts.handles || {})
    : null;

  const amounts = extractAmounts(text);
  const numbers = extractInvoiceHandles(text);
  // EQUALITY MERGES ACROSS BLOCKS (chair ruling 5, as amended by c-42.23): a
  // figure held on either plane is a figure of HIS, and the fence asks
  // "invented?", not "which plane". The block text is what keeps the planes
  // apart on the wire.
  const amountSet = new Set([
    ...(handles.amounts || []),
    ...((exp && exp.amounts) || []),
  ].map(String));
  const numberSet = new Set((handles.numbers || []).map(String));

  for (const a of amounts) {
    if (amountSet.has(a)) continue;
    // ARM B — ARITHMETIC DOES NOT MERGE (F-42.123). Each block's rows are tried
    // as their own pool, so a sum can only be one the block that holds those
    // rows could itself reproduce.
    if (admittedAsSubtotal(a, handles.rowAmounts, rupees)) continue;
    if (exp && admittedAsSubtotal(a, exp.rowAmounts, rupees)) continue;
    return false;
  }

  // F-42.97 · THE DATE FENCE. The 00:52:38 specimen spoke ONE figure, Rs 5,000,
  // and that figure was TRUE — a real row of his. The whole lie was "10
  // September" against a row dated 1 September, plus a filing time he invented.
  // An amount-only handle set ADMITS that sentence; this is what catches it.
  // Only runs where an expense block was built: with no block there is nothing
  // to check a date against, and convicting every date on a turn without one
  // would break every calendar answer Victor gives.
  if (exp && (exp.dates || []).length) {
    const dateSet = new Set(exp.dates.map(String));
    for (const d of extractSpokenDates(text)) if (!dateSet.has(d)) return false;
  }
  // A stored number GROUNDS an extracted handle when it equals it OR ENDS WITH it:
  // `/05` is the tail of `TDW/DEV440/05` and naming an invoice by its tail is the
  // register the founder's own ratified line uses. The direction is deliberate —
  // the STORE is the authority and the prose is checked against it, never the
  // reverse, so a suffix cannot be forged into a match by inventing a longer name.
  const numberList = [...numberSet];
  for (const n of numbers) {
    if (numberSet.has(n)) continue;
    if (numberList.some((stored) => stored.endsWith(n) || n.endsWith(stored))) continue;
    return false;
  }
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
  extractSpokenDates,
  extractShorthandAmounts,
  shorthandToRupees,
  admittedAsSubtotal,
  ARM_B_ROWS_FULL,
  ARM_B_ROWS_NARROW,
  moneyGrounded,
  victorClaim,
  leadSendClaim,
  victorCostumeLine,
  structurallyImpossible,
  STRUCTURAL_CLASSES,
};
