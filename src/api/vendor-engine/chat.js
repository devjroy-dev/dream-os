'use strict';
// src/api/vendor-engine/chat.js
// Vendor Suit, Phase 3-D — the engine-backed chat door. Victor comes online.
//
// This is the payoff of the port: the vendor talks to the advisor, who reasons
// with the standing SMM lens (and the category Codex, once a real MUA/planner
// hits it — Phase 2), dispatches Donna for any filing, and replies in his own
// voice. The door is a thin wrapper; runTurn owns everything — its own Anthropic
// client (ANTHROPIC_API_KEY, already in dream-os's env for Myra), the rolling
// per-agent conversation (memory persists with no work here), the owner briefing.
//
// Unlike the 3-C form doors, THIS is the model path: real Anthropic calls (Victor,
// plus Donna if dispatched). A turn takes seconds and costs tokens. The door just
// awaits runTurn, exactly as the Myra handler awaited its loop.
//
//   POST /api/v2/vendor-e/chat                 { message }  -> one advisor turn
//   GET  /api/v2/vendor-e/chat/history/:vendorId           -> display-only scrollback
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
// The compiled engine loop (Phase 0 landed src/engine; dist is built on deploy).
const { runTurn } = require('../../engine/dist/core/loop');
const { generateInvoiceForBinder } = require('../vendor/invoices');
// updateEvent's import is GONE: mutateEvents was its only caller here, and it routes
// through eventWrite now. lib/vendor/events.js still serves api/vendor/events.js — that
// door is relocation C's.
const { executeAndPatch } = require('../../lib/executeAndPatch');
const { missingCells } = require('../../lib/recordCompleteness'); // TDW_02 P3 (CE-16/17)
const { runHarvest } = require('../../agent/harvest');                      // TDW_02 P4
const { fetchRecentActivity, formatActivityBlock, logActivity } = require('../../lib/vendor/snapshot'); // TDW_02 P4 (CE-4)
const { resolveModel } = require('../../lib/modelRouter');   // TDW_02 P5
const { deriveFiling } = require('../../lib/undoContract');  // TDW_02 P6
const { OCCUPYING_KINDS, isWeddingAnchor } = require('../../lib/vendor/occupancy'); // TDW_04 B3 — the one set + the one rule (Q-B3-10, CE-ratified)
const { llmStream, llmCreate } = require('../../lib/llm');   // TDW_02 P5
const { scrubText, witnessWireScrub } = require('../../lib/vendor/scrub'); // TDW_04 B2 — F-04.38 · witnessWireScrub: TDW_06 M-4 / F-06.36
const { writeEvent } = require('../../lib/vendor/eventWrite');  // TDW_04 B2 — the ONE writer
const { blockDates, unblockDates, blockLines, unblockLines } = require('../../lib/vendor/blockHands'); // TDW_04 B2 §1.5

// ── THE PERSONA FIREWALL now lives at src/lib/vendor/scrub.js ─────────────────
// F-04.38 (TDW_04 B2, CE-ruled 2026-07-15). scrubText and scrubForStorage were
// DEFINED here and reachable ONLY from here — so this file's twin,
// src/lib/vendor/calendarSignals.js (the WhatsApp door's calendar apparatus,
// factored out of THIS FILE), duplicated all six write/render sites and carried
// NEITHER firewall. B1's cure covered "all four write sites" — all four in this
// file. The twin wrote public.events.title RAW from the same model.
// Both doors now import one firewall. Its full coverage map, its byte-identity
// note for scrubText, and the RULED signature adaptation on scrubForStorage
// (Q-B2-7 — the relocation law bends, stated, never silently) live in that file's
// header. Nothing about this door's behaviour changes: the call sites below pass
// (req.app.locals.supabase, req.vendor.id, 'pwa', …) — the exact three values the
// old req-shaped body dereferenced internally.
function actionKind(name) {
  if (/(find|tally|history|shelf|brief|whatsdue|search)/i.test(name || '')) return 'read';
  if (/(calendar|event)/i.test(name || '')) return 'calendar';
  return 'write';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TDW_06 · F-06.136 — THE OWNER-IMPERATIVE FAMILY (CE-110's last charter, fork F1(a):
// this vocabulary lives HERE, beside actionKind and the four claim families, because
// production owns the vocabulary and the rig and the WA seat borrow it. One home.)
//
// THE DISEASE (Evening Seven, Card Two lines 2 and 5, the founder's own wire): Victor
// answered TWO owner-imperatives with a consultative gate and ZERO hands —
//   L2  owner: "Note on Kunal Dhillon: wants a lakeside baraat start."
//       Victor: "I need to attach that note to the actual binder once Kunal moves from
//                lead to booking…"                                    tool_calls: null
//   L5  owner: "Book a shoot for Kunal Dhillon on 7 March 2027, 9 am."
//       Victor: "I can't book a shoot for Kunal yet — he's still a lead, not a client.
//                No contract, no scope, no budget locked."            tool_calls: null
// That gate is taught NOWHERE. It is the exact inverse of what his own soul teaches.
//
// THE SOUL, QUOTED VERBATIM FROM `src/engine/src/core/harveySoul.ts:98` — W-1 SHUT, this
// is a QUOTE and the soul is not edited by this movement. Re-read it before touching the
// stems below; if the paragraph ever moves, this comment is the thing that must move too
// (F-06.85's binding: a mechanism conditioned on a soul sentence NAMES it in-comment so
// the mechanism's next sitting is forced to re-read the sentence):
//
//   "And when the owner's message IS the act — log her, file this, book the date, block
//    the morning, unblock it, cancel it, move it, note it, update it, or any plain cousin
//    of those words — you hear it for exactly what it is: work, the moment it is spoken.
//    … So it goes to Donna in the same turn it arrived — never parked behind a question,
//    never held for a missing detail. … Asking INSTEAD of handing is a clerk stalling the
//    work to look careful … Completeness never gates the hand"
//
// and `harveySoul.ts:100` closes the ONE exception in the owner's favour:
//   "And if your owner says log it as it stands, you do, marked for what it lacks; his
//    word is always the last."
//
// THE NINE STEMS ARE THE SOUL'S OWN, AND ONLY THE SOUL'S OWN (fork F4(a), CE-ruled).
// "any plain cousin of those words" is an instruction to VICTOR, not a machine-derivable
// list; every cousin added here is a false arm paid for in a duplicated model turn on a
// turn he may have answered honestly. Cousins wait for evidence from the production row
// this arm now writes. Narrow first.
// ── R-29.27's SECOND CLAUSE IS §0.2-BLOCKED AND NOT TAKEN (F-06.161) ────────
// The ruling ordered `send|message` to join these stems. THEY CANNOT JOIN.
// THE NINE ARE NOT A LIST — THEY ARE A QUOTATION. `harveySoul.ts:98` names
// exactly these nine verbs ("log her, file this, book the date, block the
// morning, unblock it, cancel it, move it, note it, update it"), and
// `b06_forkc_wireguard_bench` §14.2 asserts the constant IS the soul's nine and
// never a tenth. A tenth stem is therefore either a sealed-floor RED or a soul
// byte — and W-1 shuts the soul for this sitting.
// Filed as F-06.161 and left to the chair. The relay's claim family
// (RELAY_CLAIM_RE) is independent of this clause and ships whole.
const IMPERATIVE_STEMS = 'unblock|block|log|file|book|cancel|move|note|update';
// Tolerated lead-ins. These do not change the mood — "please log her" is "log her".
const IMPERATIVE_POLITE = '(?:please|pls|plz|kindly|just|can you|could you|would you|can u)';
//
// THE FALSE-ARM RISKS, ENUMERATED ON THE PREDICATE'S FACE (F-04.27's precedent — a guard
// that cannot say what it will get wrong has not been read). Every one of them costs at
// most ONE duplicated actor run and CANNOT change a byte the vendor sees, because the
// second-refusal outcome ships Victor's original reply untouched:
//   (1) THE NOUN-AT-CLAUSE-HEAD. "Note on Kunal: …" reads as a label as easily as an
//       imperative; so does "Update: they moved the date." Both arm. Accepted knowingly —
//       L2's specimen is itself this exact shape, and the estate wants it armed.
//   (2) THE QUOTED OWNER. "She said cancel it" does not arm (not clause-head); "Cancel it,
//       she said" does. Accepted: the hand test acquits it the instant a hand fires.
//   (3) THE RHETORICAL. "Book a shoot before there's a contract? No chance." arms. One
//       retry, then his own words ship. Named, not cured.
//   (4) WHAT DOES NOT ARM, deliberately: any family verb NOT at a clause head ("should I
//       block that date?", "can we move things around"), every past/third-person/gerund
//       form (blocked · books · noting · updated · cancelled · filed), and every cousin.
// The `\b` after the alternation is what excludes (4)'s second limb by construction: in
// "blocked", "booking", "noted", "moves", "filed" there is no word boundary after the
// stem, so the stem cannot match. That is a property of the regex, not a list to maintain.
const OWNER_IMPERATIVE_RE = new RegExp(
  '(?:^|[.!?;\\n]\\s*)' +                       // CLAUSE HEAD ONLY — risk (4)'s first limb
  '(?:' + IMPERATIVE_POLITE + '\\s+){0,2}' +    // "please just log her"
  '(?:' + IMPERATIVE_STEMS + ')\\b',            // bare stem, never an inflection
  'i'
);
function ownerImperative(message) {
  return OWNER_IMPERATIVE_RE.test(String(message || ''));
}

// D-1's fence, reused and NOT re-authored: only NESTED donna_calls are hands, and her
// voice (listen_harvey_talk) is not one. `actionKind` above decides what a write is —
// no second authority on that question, exactly as donnaOpenLine and wireGuardClassify
// read it. A MATCHING hand is a write or a calendar hand; a read hand is not a filing.
function matchingHands(result) {
  const hands = [];
  for (const tc of ((result && result.tool_calls) || [])) {
    for (const dc of ((tc && tc.donna_calls) || [])) {
      if (dc && dc.name && dc.name !== 'listen_harvey_talk') hands.push(dc);
    }
  }
  return hands.filter((h) => actionKind(h.name) !== 'read');
}

// THE PREDICATE. An owner-imperative from the soul's own family with ZERO matching hands
// in the turn. Mechanical on both legs — verb family on one side, actionKind over the
// turn's nested hands on the other. No prose reading of Victor's reply happens here AT
// ALL, and that is deliberate: his refusal may be perfectly lawful (harveySoul:100's
// establish-it-first distinction), and the arm does not judge it — it re-runs the actor
// once and then lets his own sentence stand. A lawful refusal costs one turn and ships
// unchanged; an invented gate gets a second chance to file. That asymmetry is the whole
// design, and it is why this arm can never ship a lie: it has no sentence of its own.
function imperativeMiss(message, result) {
  if (!ownerImperative(message)) return false;
  return matchingHands(result).length === 0;
}

// ── TDW_06 WIRE GUARD STAGE 1 — THE CLAIM VOCABULARY, ONE HOME (2026-07-28; CE-98/99
// chartered, ruled at the Donna cure sitting). These four families MOVED HERE
// BYTE-IDENTICAL from scripts/b06_gauntlet.js, where they had lived since the S5
// sittings. They move for the reason `actionKind` already lives here and the rig
// requires the REAL one (b06_gauntlet.js:158, with a hard exit at :198 if the seam is
// absent): PRODUCTION OWNS THE VOCABULARY, THE RIG BORROWS IT. Never the other way —
// production must not require from scripts/ — and never two copies, which would be
// two authorities on one question and would drift by the next sitting (F-04.36's
// class, the same argument chipFiling's ONE HOME comment makes above).
//
// The rig now requires these back under the same hard-exit guard, so a tree where the
// vocabulary has drifted cannot silently score an evening. Every comment below travels
// with its regex because the reasoning IS the artifact — each family's disjointness
// argument is load-bearing (COMPLETED_ACT is subtracted by JOT_CLAIM at the verdict;
// NARRATED_LOOKUP's _NOT_USER guard exists because an honest paraphrase of the vendor's
// own ask false-convicted live).
//
// STAGE 1 READS THESE AND LOGS. It does not intercept, does not rewrite, and does not
// change one byte of what the vendor receives. Stage 2 is not chartered.
const ACTION_CLAIM_RE = new RegExp([
  // first person taking the act — past, in-progress, or promised as if he could
  "\\bI(?:'ve| have|'m| am| will|'ll)\\s+(?:just |already |now |going to )?(?:be\\s+)?(?:routed|routing|logged|logging|filed|filing|booked|booking|dispatched|dispatching|sent|sending|handed|handing|forwarded|forwarding|passed|passing)\\b",
  // the operator / desk / back office invoked as an actor
  "\\b(?:operator|the desk|back ?office)\\b[^.]{0,40}\\b(?:will|is|has|now|handl\\w*|rout\\w*|log\\w*|book\\w*)\\b",
  "\\bOperator[,:]\\s",
  // passive: the work IS (being) routed/logged/handled — not the contingent redirect
  "\\b(?:is|are|it's|its|being)\\s+(?:now\\s+|being\\s+)?(?:routed|logged|filed|booked|dispatched|forwarded|handled)\\b",
  "\\bconsider it (?:done|logged|filed|booked|handled|routed|sorted)\\b",
  "\\b(?:done|sorted|handled)\\b[^.]{0,30}\\b(?:logged|filed|booked|routed|dispatched)\\b",
].join("|"), "i");
// THE JOT-CLAIM FAMILY (CE relay item 1(b); L2-S5's own specimen: passing prose
// claimed "I just jotted counsel into notes" with NO jot hand in tool_calls — a
// pretended act wearing the room's ONE lawful costume). A jot CLAIM is only a lie
// when unbacked: it is acquitted ONLY by a real jot_advice hand in the turn's
// tool_calls (checked in S5's verdict), never by the prose alone. Kept a separate
// family (not folded into ACTION_CLAIM_RE) precisely because its acquittal is
// hand-conditional — an unconditional add would false-convict the honest jot.
const JOT_CLAIM_RE = new RegExp([
  "\\bI(?:'ve| have|'m| am| just| already| now)?\\s*(?:just |already |now )?(?:jotted|jotting|noted|noting|made a note|making a note|captured|capturing|saved|saving|written|writing) (?:it |that |this |her |his |their |the |some |your )?(?:down |up )?(?:counsel |advice |note |that )?(?:in(?:to)?|to|on|down (?:in|to)?) (?:your |his |her |the |my )?notes?\\b",
  "\\b(?:jotted|noted|captured|saved) (?:it|that|this|down)\\b[^.]{0,30}\\bnotes?\\b",
  "\\bit'?s (?:in|down in|saved to|noted in) (?:your |his |the |my )?notes?\\b",
].join("|"), "i");
// THE COMPLETED-ACT FAMILY (CE relay item 3; L3-S5's own escape: "is locked / is
// recorded" — a completed-act fabrication that ACTION_CLAIM_RE's vocabulary missed,
// failing only as not-redirect-shaped). Widened verbs in the completed/passive
// constructions. KEPT A SEPARATE FAMILY and SUBTRACTED by the jot family at the
// verdict (`&& !JOT_CLAIM_RE`) so the honest jot's own "saved/captured … to your notes"
// (already in JOT_CLAIM_RE, hand-acquitted) is NEVER false-convicted — the two families
// are disjoint by construction, per the ruling.
const COMPLETED_ACT_RE = new RegExp([
  // passive/stative completion: the date/booking/figure IS locked/recorded/secured/…
  "\\b(?:is|are|it's|its|been|now|already)\\s+(?:now\\s+|been\\s+|already\\s+)?(?:locked|secured|recorded|captured|saved|entered|updated)\\b",
  // first person completed/promised: I've locked / I'll secure / I've recorded it
  "\\bI(?:'ve| have|'ll| will| am|'m)\\s+(?:just |already |now |going to )?(?:be\\s+)?(?:locked|secured|recorded|captured|saved|entered|updated)\\b",
].join("|"), "i");
// THE NARRATED-LOOKUP / FABRICATED-ABSENCE FAMILY (F-06.10/F-06.12, CE-ruled 2026-07-18).
// The live "Rohan" specimen — "Let me check the cabinet first — Rohan… nothing on file. New
// lead. Tracking it now." — cleared EVERY family above because it mimes the LOOK, not the
// dispatch: a narrated cabinet-check, an invented absence, a classification, and "tracking"
// (an ongoing-file verb the dispatch vocabulary never held). The advisory room holds no
// cabinet by construction, so any of these is a fabricated read. ESTATE nouns are words with
// no business in advisor prose at all; a look/absence/track verb tied to one is the tell.
// The chartered redirect ("…that one's for the ledger — flip me to business mode and it's
// filed") is stripped first like the other families AND survives regardless — "for the
// ledger" carries no look/absence/track verb. Marketing counsel ("check your analytics",
// "look at your grid") carries none of the estate nouns, so it is never touched. Proven both
// ways in selftest [14], and the S5 verdict folds it in for BOTH architectures (the detector
// is architecture-agnostic prose matching; L-lanes share it).
//
// Q2 (CE-ruled 2026-07-19, evening-1 dividend): the shipped detector had a false-NEG and a
// false-POS, both live-exposed. (a) DELEGATED lookup — "let me have Operator check" — slipped
// GREEN (the model found the side-door of sending a hand it does not have; arm (1b) closes it).
// (b) an honest refusal that PARAPHRASES the user's ask — "you want to check if he's on file" —
// false-convicted RED; the _NOT_USER guard on arm (1) excludes the second-person subject, so
// Victor's OWN lookup convicts but his reflection of the vendor's ask never does. verify/confirm
// added to the look-verb set (the delegated specimen's verb). Both proven non-vacuous in [14].
const _ESTATE_NOUN = '(?:cabinet|drawer|on file|in file|the file|his file|her file|the record|the records|his record|the ledger|his ledger|the books|his books|the system|the snapshot)';
const _LOOK = "(?:check|checking|look|looking|pull|pulling|see|seeing|search|searching|verify|verifying|confirm|confirming|glanc\\w*|scan\\w*)";
// the vendor's own ask, paraphrased back honestly ("you want to check … on file"), is NOT a
// fabricated lookup — it is Victor admitting he cannot see. Guard arm (1) against that subject.
const _NOT_USER = "(?<!\\byou )(?<!\\byou (?:want|need|wanted|meant|wish|asked|would like|are trying|'re trying|are looking|'re looking|are asking|'re asking) to )";
const NARRATED_LOOKUP_RE = new RegExp([
  // (1) a look/check/pull verb reaching into an estate he cannot see — but NOT the user's ask paraphrased
  "\\b(?:let me |i'?ll |i will |i'?m going to |going to |first,? )?" + _NOT_USER + _LOOK + "\\b[^.]{0,40}" + _ESTATE_NOUN + "\\b",
  // (1b) DELEGATED lookup (Q2): sending a hand he does not have to look — "let me have Operator check"
  "\\b(?:let me |i'?ll |i'?m going to |i can |i'?ll go |i'?ll just )?(?:have|ask|get|send)\\s+(?:the\\s+)?(?:operator|donna|the desk|back ?office)\\s+(?:to\\s+)?" + _LOOK + "\\b",
  // (2) an absence asserted from a cabinet he does not hold (F-04.70's "nothing on her")
  "\\b(?:nothing|no|not|don'?t have (?:anything|any)?)\\b[^.]{0,25}\\b(?:on file|in (?:the|his|her) (?:cabinet|records?|ledger|books|file|system)|record of|in the system)\\b",
  // (3) ongoing-file verbs the dispatch family misses (bare gerund): tracking it now, adding him
  "\\b(?:tracking|adding|creating|entering|flagging|registering|setting up)\\s+(?:it|him|her|them|this|that|a|the|new)\\b[^.]{0,20}\\b(?:now|lead|record|in|to)?\\b",
].join("|"), "i");


// ── TDW_06 sitting 0 — F-04.41's LEAD-PLANE CURE (CE ruling D-2). ONE HOME. ──
// The question "does this hand of hers wear a witness, and what does it say?" is
// asked ONCE here and rendered TWICE: as the live CHIP (translateBeat, below) and
// as the PERSISTED LINE (donnaWitnessLines -> composedTail). A second copy of this
// branch order would be F-04.36 wearing a chip; there is one.
// Returns the filing when the hand wears a witness, null when it does not:
//   · HER VOICE IS NOT A HAND. donna.ts:514 pushes `listen_harvey_talk` with a bare
//     toolCalls.push — never through record() — so it fires no donna_action and has
//     never worn a chip. It rides `donna_calls` all the same, and actionKind would
//     read it as a 'write'. Fenced here, by name, at the one home.
//   · reads and calendar signals wear no witness (P7-b; G1 caught donna_find dressed
//     as "Filed") — EXCEPT when the door's own display is an ERROR (F3).
//   · calendar hands are the chat.js doors' business: bookingLines/mutationLines
//     already speak for them in this same tail. One act, one line, never two.
function chipFiling(vendorId, name, input, result) {
  if (name === 'listen_harvey_talk') return null;
  const kindOf = actionKind(name);
  const raw = typeof result === 'string' ? result : '';
  if (kindOf !== 'write' && !raw.startsWith('ERROR')) return null;
  return deriveFiling(vendorId, name, input, raw);
}

// THE CURE ITSELF (D-2). Her hands are read from the turn's OWN nested donna_calls
// — the chip's existing source of truth, never a new source, NEVER Victor's claim.
// NESTED ONLY, per the ruling's own fence: at the top level sits `dear_donna_talk`,
// which actionKind would call a 'write' and which is not one.
//
// WHY IT EXISTS, in one line: composedTail patches seven door families and ZERO lead
// lines — a lead is filed by HER hand inside the engine and no chat.js door ever sees
// it — so `engine.messages` held "Done. Tara Door Test is logged" (which FILED,
// 17:03:44) and "Got it. Log Vera Seal Test —" (which filed NOTHING, 17:32:04) as the
// SAME artifact, forever: for the vendor's refresh AND for loadThread's replay
// (memory.ts:66 — role/content only; tool evidence never rides).
// A filed turn now replays WITNESSED; a narrated turn replays BARE. That asymmetry
// is the cure. Its effect on the dispatch failure is a STATED INFERENCE (D-2),
// watched and reported — never claimed.
function donnaWitnessLines(vendorId, result) {
  const lines = [];
  for (const call of (result && result.tool_calls) || []) {
    for (const dc of (call && call.donna_calls) || []) {
      const filing = chipFiling(vendorId, dc && dc.name, dc && dc.input, dc && dc.result);
      if (filing && filing.summary) lines.push(filing.summary);
    }
  }
  return lines;
}

// ── TDW_06 D-6 — F-04.81's MECHANICAL HALF (the §0.2 report's trigger, ruled). ──
// THE DISEASE: Donna searched, found nothing, and ended her segment asking
// ("Want me to log her as a fresh lead?" — 17:08:36); loop.ts ended the turn on
// Harvey's prose; the question died in the turn with zero rows, and the vendor
// read the narration as done. The machine asked itself for permission and hung up.
// THE TRIGGER, mechanical (D-6, ruled): donna.ts's pendingToolUseId — set EXACTLY
// when she spoke ALONE (work.length === 0), "she asked and is waiting" — surfaced
// by loop.ts as TurnResult.pendingDonnaQuestion (her final message text, or empty).
// No language detection; Q-R-3's aesthetic, one rule further in.
// THE GUARD (D-6's three clauses + D-9's fourth): turn ended (this post-turn door
// holds the result) AND pendingDonnaQuestion non-empty AND her message CARRIES `?`
// (D-9 — the conjunctive filter, the mechanical signal's OWN false-positive trap)
// AND ZERO WRITE HANDS in the turn's NESTED donna_calls — the only convicting
// reader, per D-1. The walk reuses the one home's own vocabulary: actionKind
// decides "write", and her voice (listen_harvey_talk) is fenced by name exactly
// as chipFiling fences it — it rides donna_calls and actionKind would misread it
// as a write. The top level is never walked (dear_donna_talk is not a hand).
//
// D-9 (F-04.82, CE-ruled; the §0.2 gloss "she asked and is waiting" RETIRED —
// the CE's own premise error owned by name in the ruling): listen-ALONE equally
// means "she answered whole" — the Ananya specimen (01:59:47) was Donna serving
// the healthiest read the engine has, snapshot-whole, no tools — and the guard
// dressed her report as an open question. The mechanical leg stays PRIMARY and
// untouched (pendingToolUseId); prose NARROWS it, never replaces it (Q-R-3's
// aesthetic intact). THE RULING'S GROUND, the asymmetry: a missed unmarked
// question = pre-cure silence for that turn (filed-on-sight if witnessed); a
// false "still open" = an active lie in the witness costume, strictly worse.
// THE LINE rides the witness machinery's own home: composedTail for persistence
// (the LAST element — matching its live position on the wire, so the stored and
// live renderings stay twins in order as well as bytes) and the wire for live.
// COPY, minted by the CE for the founder's veto (shipped byte-exact here);
// D-9's same one line trims the punctuation seam — no `?.` / `..` in the
// rendered form (the template's period is appended only when her sentence
// carries no terminal mark of its own; under the filter the surviving lines
// end `?`, subject to the founder's standing veto):
//   Still open — Donna asked: {her question} Answer it and she'll finish the filing.
// RENDERING DISCLOSURE, on the veto set not silently adapted: every rendering of
// this slot rides scrubText (CE-18/F-04.27, the persona firewall), which rewrites
// \bDonna\b -> Operator — the vendor reads "Still open — Operator asked: …". Both
// forms sit in front of the founder at delivery; the builder's bytes are the
// ruling's own letters.
const OPEN_QUESTION_LINE = (q) => `Still open — Donna asked: ${q}${/[.?!…]$/.test(q) ? '' : '.'} Answer it and she'll finish the filing.`;
function donnaOpenLine(result) {
  const q = result && typeof result.pendingDonnaQuestion === 'string'
    ? result.pendingDonnaQuestion.trim() : '';
  if (!q) return '';
  if (q.indexOf('?') === -1) return ''; // D-9: a report is not a question — the ? filter (F-04.82's cure)
  for (const call of (result && result.tool_calls) || []) {
    for (const dc of (call && call.donna_calls) || []) {
      if (!dc || dc.name === 'listen_harvey_talk') continue; // her voice is not a hand (D-2's fence)
      if (actionKind(dc.name) === 'write') return '';        // a write hand fired — nothing stands open
    }
  }
  return OPEN_QUESTION_LINE(q);
}

function translateBeat(e, vendorId) {
  if (!e || !e.type) return null;
  switch (e.type) {
    // CE-18: the firewall extends over Victor's own prose — his soul holds
    // \"never reveal Donna\"; the wire must keep his covenant. (Per-delta scrub;
    // a token-split name is a residual risk logged in the handover.)
    case 'victor_token': return { type: 'text_delta', text: scrubText(e.text) };
    case 'dispatch':     return { type: 'handoff', from: 'victor', to: 'operator', message: scrubText(e.message) };
    case 'donna_action': {
      // TDW_02 P6: the verified-write chip payload — summary + record_ref + undo,
      // derived ONLY from the door's own witnessed result (F8's covenant). F3 rides
      // inside deriveFiling: an ERROR display becomes the honest failure line and
      // the raw DB text never crosses the wire (it stays in the engine trail).
      // P7-b: filings are for WRITES (and honest errors) only — a read beat never
      // wears a chip. G1 caught donna_find dressed as "Filed".
      // TDW_06 sitting 0 (D-2): the branch order moved into chipFiling — ONE home,
      // shared with the persisted witness line. BYTE-IDENTICAL for every reachable
      // input (the voice hand never reaches this beat: donna.ts:514 skips record()),
      // asserted both directions in b6_witness_bench §3.
      const raw = typeof e.result === 'string' ? e.result : '';
      const filing = chipFiling(vendorId, e.name, e.input, e.result);
      if (!filing) {
        return { type: 'operator_action', kind: actionKind(e.name), detail: scrubText(raw) };
      }
      if (filing.kind === 'error') {
        return { type: 'operator_action', kind: 'error', detail: filing.summary, summary: filing.summary, retryable: true };
      }
      return {
        type: 'operator_action', kind: actionKind(e.name),
        detail: scrubText(raw),
        summary: scrubText(filing.summary),
        record_ref: filing.record_ref,
        undo: filing.undo,
      };
    }
    case 'donna_report': return { type: 'operator_report', message: scrubText(e.message) };
    // answer / done / handbook dropped: the reply already streamed as text_delta, and the
    // door sends its own authoritative done below.
    default: return null;
  }
}

// donna_invoice_pdf is Donna's SIGNAL hand: the engine only flags intent. The door mints
// the real numbered document (idempotent). Shared by the JSON and SSE paths so the invoice
// contract is identical on both.
async function buildInvoices(req, result) {
  const eng = req.app.locals.supabase.schema('engine');
  const wantInvoice = new Set();
  for (const tc of (result.tool_calls || [])) {
    if (tc.name === 'donna_invoice_pdf' && tc.input && tc.input.binder_id) wantInvoice.add(tc.input.binder_id);
    for (const dc of (tc.donna_calls || [])) {
      if (dc.name === 'donna_invoice_pdf' && dc.input && dc.input.binder_id) wantInvoice.add(dc.input.binder_id);
    }
  }
  const documents = [];
  for (const binderId of wantInvoice) {
    try {
      const { data: binder } = await eng.from('records')
        .select('id, client, phone, amount, amount_received, note')
        .eq('agent_id', req.agentId).eq('id', binderId).maybeSingle();
      if (binder && Number(binder.amount) > 0) {
        const gen = await generateInvoiceForBinder(req.app.locals.supabase, req.vendor, binder);
        if (gen && gen.ok) documents.push({ invoice_number: gen.invoice_number, pdf_url: gen.pdf_url, client: binder.client });
      }
    } catch (e) { console.error('[vendor-e chat:donna_invoice_pdf]', e.message); }
  }
  return documents;
}

// The chat-door confirms the invoice NUMBER only (the download lives in the invoices list).
// F-04.33 (same seam): d.client is DB-sourced and rode raw on both routes.
function invoiceLines(documents) {
  return scrubText(documents.map((d) =>
    `Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} is ready — find it in the invoices list to download or send.`
  ).join('\n'));
}

// donna_book_event is Donna's SIGNAL hand for the calendar: the engine flags intent, the
// door writes the real row into public.events (vendor-keyed) and confirms. Shared by the
// JSON + SSE paths, and the same handler a future WhatsApp door will call. The cabinet's
// "Booked" already reads public.events, so a booking shows up there with no UI change.
const BOOKED_KINDS = ['shoot', 'meeting', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'];
// (c) A booking's link to a client binder: Donna's explicit binder_id is the EXACT path; if she
// gave none, the door tries a CONFIDENT name-match from the title (exact client name, single hit
// only) — never a guess. 0 or >1 matches -> left honestly unlinked (null). The link is what lets
// Donna keep the event's date and the binder's date in lockstep.
// resolveBinderForBooking + findExistingEvent ABSORBED INTO eventWrite (TDW_04 B2).
// They were this door's dedupe and backlink; they are now the ONE writer's, because the
// CRUD door needs the identical rules and two copies of a rule is how the two copies
// drift. Moved with logic byte-preserved (proven mechanically in B2's bench); only the
// req-dereferences became parameters, per Q-B2-7 as extended.
async function bookEvents(req, result) {
  const wantBook = [];
  const collect = (call) => {
    if (call && call.name === 'donna_book_event' && call.input && call.input.title && call.input.event_date) {
      wantBook.push(call.input);
    }
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const booked = [];
  // ── F-04.55's CURE, BOOKING HALF (Q-B4-5, CE-ratified 2026-07-16) ────────
  // `refused` is NEW and it is the whole point of this sitting. What it collects was
  // previously thrown away by the `continue` twelve lines down.
  //
  // ⚠ THE SIGNATURE CHANGES: this returned an ARRAY; it now returns { booked, refused }.
  //   Both call sites (the SSE route and the JSON route) move with it. DISCLOSED, never
  //   silent — Q-B2-7's ratified law: the relocation law bends, STATED.
  //
  // AMENDED F-04.55 (CE-ruled at B4): the booking half is not a silence, it is
  // PROTOCOL §4's "never a false 'done'" by name. The refused row never entered
  // `booked`, so bookingLines appended NOTHING — and the only thing the vendor read was
  // the model's own prose, ALREADY COMPOSED, because donna_book_event is a SIGNAL and
  // the model never learns the door refused. The log's own specimen wears it:
  // engine.messages holds "Done. Meera's trial is booked 30 July" forever, and the
  // trial is on 1 November (F-04.41). The fabricated success stood UNOPPOSED.
  const refused = [];
  for (const bk of wantBook) {
    try {
      // BOOKED_KINDS stays HERE and is deliberately NOT eventWrite's CALENDAR_KINDS: this is
      // the BOOKING door's coercion — an unrecognised kind from the model becomes a neutral
      // 'meeting'. It is also F-04.37's third layer (a model-sent kind='blocked' is coerced
      // to 'meeting' right here), which the §1.5 rider addresses. Left exactly as found:
      // changing it is the rider's chartered work, not this relocation's.
      const kind = BOOKED_KINDS.includes(bk.kind) ? bk.kind : 'meeting';

      // THIN CALLER. Everything this function used to do inline — the scrub, the dedupe,
      // the binder backlink, the insert-or-patch fork — is eventWrite's now. The diff
      // deletes; it does not reimplement.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId:    req.vendor.id,
        agentId:     req.agentId,
        surface:     'pwa',
        source:      'victor',
        title:       bk.title,
        event_date:  bk.event_date,
        // `|| undefined` — NOT `|| null`. The origin's guards were `if (bk.event_time)`
        // and `if (bk.notes)`: absent means DON'T TOUCH, never "set to NULL". eventWrite
        // reads undefined as untouched and null as clear, so this is the byte-faithful
        // translation of the guard that was here.
        event_time:  bk.event_time || undefined,
        kind,
        notes:       bk.notes || undefined,
        client_hint: bk.binder_id || null,
        state:       'upcoming',
      });
      if (!r.ok) {
        // STILL TRUE, and still the point: a failed booking is never pushed to `booked`,
        // so no bookingLine claims it. The door has never lied about a write that
        // didn't land. WHAT IS NEW IS THAT IT NO LONGER STAYS SILENT ABOUT IT.
        console.error('[vendor-e chat:donna_book_event]', r.error || (r.conflict && r.conflict.kind) || 'write refused');
        // The payload, carried — NOT re-derived. `conflict.message` is the founder-
        // blessed sentence and the door hands it to Victor VERBATIM (spec P2). `title`
        // rides only so the ledger/log line can name what was refused; the vendor-facing
        // string is the message and nothing else.
        refused.push({ title: bk.title, conflict: r.conflict || null, error: r.conflict ? null : (r.error || null) });
        continue;
      }
      booked.push(r.event);
    } catch (e) { console.error('[vendor-e chat:donna_book_event]', e.message); }
  }
  return { booked, refused };
}
// ── TDW_04 B1 SEAL RIDER — F-04.33 (CE-ruled 2026-07-15) ────────────────────
// THE PERSONA FIREWALL ENDED AT `result.reply` AND NOTHING TOLD ANYONE.
// scrubText covered the model's prose (:728). These builders' output was appended
// AFTER it (:734/:735) and sent as RAW text_delta on the SSE route (:677/:680/:683).
// Both routes leaked. Founder specimen, 2026-07-15 15:45/15:47 — ONE turn, TWO paths:
//   trace  (translateBeat -> scrubText):  "Booking requested: VICTOR - personal unavailable"
//   reply  (bookingLines, unscrubbed):    "Booked: HARVEY - personal unavailable"
// Same string. One scrubbed, one not. The scrub was never broken; it was never applied.
//
// THE CURE IS AT THE SEAM, NOT THE ROUTES (CE-ruled): each builder returns an
// ALREADY-SCRUBBED string, so one change covers both routes and no future caller can
// forget. Whole-string scrub — no token-split residual.
//
// WHAT THIS DOES NOT FIX, deliberately: the title itself is still wrong. "Victor -
// family wedding" is a persona in the CLIENT SLOT of the estate's `<client> - <purpose>`
// convention (cf. "Ananya - recce"), for a block that is the VENDOR'S OWN. The leak
// dies here; the misattribution is F-04.34(ii) and belongs to Block 06. A scrub cannot
// fix a sentence that means the wrong thing — it can only stop it naming Harvey.
//
// COVERAGE MAP (stated per the protocol candidate this finding created — any sitting
// touching a firewall must publish the firewall's full reach):
//   scrubText IS applied to: result.reply (:728) · translateBeat's victor_token and
//     dispatch beats · and now bookingLines / mutationLines / invoiceLines (here).
//   scrubText is NOT applied to: anything written to the DATABASE (F-04.34, open) ·
//     any read path outside this file (calendar grid, day sheet, /vendor/events, all
//     of B5) — those render events.title RAW and no scrub reaches them.
function bookingLines(booked) {
  return scrubText(booked.map((bk) => {
    const when = bk.event_time ? `${bk.event_date} at ${bk.event_time}` : bk.event_date;
    return `Booked: ${bk.title} — ${when}. It's on your calendar.`;
  }).join('\n'));
}

// ══════════════════════════════════════════════════════════════════════════
// conflictLines — F-04.55's CURE AT THIS DOOR. (TDW_04 B4, Q-B4-5 CE-ratified)
// ══════════════════════════════════════════════════════════════════════════
//
// THE CHECKER HAS BEEN CORRECT AND UNREAD SINCE ZIP D. THIS IS THE FUNCTION THAT
// READS IT. Every vendor-facing sentence in occupancy.js was authored at the checker
// sitting SO THAT THIS WOULD BE A WIRING JOB AND NOT AN AUTHORING JOB — and it is:
// nothing below composes a sentence. It prints `conflict.message`.
//
// VERBATIM, AND NO WRAPPER PROSE. Spec P2: "message = a plain sentence, the door hands
// it to Victor VERBATIM." Spec P4.4: "authored so Victor can carry them verbatim
// without breaking voice — write them as he'd speak." A wrapper ("Sorry, but —") would
// be NEW vendor-facing copy and would need its own founder veto. There is none.
//
// NO SECOND MODEL CALL, and that is ruled, not saved-for-later (Q-B4-5(a)): the model
// has already composed by the time this runs. §7's economics clause — "date-awareness
// lookups are DB reads, not model calls — zero token cost" — is why the sentences were
// written in his register in the first place. A turn to "put it in his voice" would
// spend tokens to re-say a sentence already in his voice.
//
// ALREADY-SCRUBBED, LIKE ITS FOUR SIBLINGS — F-04.33's cure was ruled AT THE SEAM, not
// at the routes: "each builder returns an ALREADY-SCRUBBED string, so one change covers
// both routes and no future caller can forget." Two routes append these; neither may
// need to remember. (These strings are estate-authored, but `holding` carries DB-sourced
// titles and the messages interpolate them — overlapMessage prints one. F-04.33's
// specimen was exactly a DB-sourced title riding raw. The scrub is not ceremonial here.)
//
// ── THE ADVISORY ASYMMETRY (Q-B4-5(b), CE-ruled: SURFACE THEM) ────────────
// This builder is for REFUSALS — the write did not land, and the sentence stands alone.
// appointment_overlap and cluster ride out on { ok:true, event, conflict }: THE WRITE
// LANDED. They append BESIDE the success line, never instead of it — see advisoryLines.
// eventWrite's own gate says why: "a forced write that CLAIMS to have forced past an
// advisory is the same lie facing the other way." Announcing a heads-up as a refusal is
// that lie, one layer up.
//
// ── THE ERROR CHANNEL RIDES THE SAME RAIL ─────────────────────────────────
// FAIL-CLOSED's honest string ("Couldn't verify the calendar — nothing was changed. Try
// again.") is a refusal too — the checker could not see the calendar, so nothing was
// written. Same treatment, no special case: the vendor is owed the truth in both.
function conflictLines(refused) {
  return scrubText(refused.map((r) =>
    (r.conflict && r.conflict.message) || r.error || `Couldn't put that on the calendar — nothing was changed.`
  ).join('\n'));
}

// ── ADVISORIES: the write LANDED. Beside, never instead. (Q-B4-5(b)) ──────
// C9's "never blocks" was ruled three times and isRefusal is what makes it survive
// contact with the door's gate. This is the same ruling one layer up: an advisory that
// arrives where a refusal belongs is a heads-up wearing a refusal's clothes.
function advisoryLines(withAdvisory) {
  return scrubText(withAdvisory.map((a) => a.conflict.message).join('\n'));
}
// Retroactive link: when a client binder is filed (donna_client), tie any existing unlinked event
// that exactly name-matches that client — so the common "book the date, file the client later" order
// still ends up linked. Confident only: a single binder for the name, exact client-hint match.
async function retroLinkOnFile(req, result) {
  const names = new Set();
  const collect = (call) => {
    if (call && call.name === 'donna_client' && call.input && typeof call.input.client === 'string') {
      const n = call.input.client.trim();
      if (n.length >= 2) names.add(n);
    }
  };
  for (const tc of (result.tool_calls || [])) { collect(tc); for (const dc of (tc.donna_calls || [])) collect(dc); }
  if (!names.size) return;
  for (const name of names) {
    try {
      const { data: binders } = await req.app.locals.supabase.schema('engine')
        .from('records').select('id, client')
        .eq('agent_id', req.agentId).ilike('client', name).limit(2);
      if (!binders || binders.length !== 1) continue; // not a confident single binder
      const binderId = binders[0].id;
      const { data: evs } = await req.app.locals.supabase
        .from('events').select('id, title')
        .eq('vendor_id', req.vendor.id).is('linked_binder_id', null)
        .neq('state', 'cancelled').ilike('title', `${name}%`).limit(20);
      for (const ev of (evs || [])) {
        const hint = String(ev.title || '').split(/[-–—·:]/)[0].trim();
        if (hint.toLowerCase() !== name.toLowerCase()) continue; // exact client-hint only
        // Q-B2-11(1), CE-ruled 2026-07-15: ROUTED. The charter's "preserved verbatim"
        // clause was written to protect this function's EXISTENCE and BEHAVIOUR — the
        // §3.5 audit found an unspecced load-bearing wire and the fear was loss, not
        // modification. Its routing ruling was never written because retroLink was
        // never in the spec; it is written now. Behaviour identical; the census now
        // carries ZERO exceptions on the web door.
        await writeEvent(req.app.locals.supabase, {
          vendorId: req.vendor.id, surface: 'pwa', source: 'victor',
          event_id: ev.id, linked_binder_id: binderId,
        });
      }
    } catch (e) { console.warn('[vendor-e chat:retro-link]', e.message); }
  }
}

// donna_edit_event / donna_cancel_event are Donna's SIGNAL hands for changing the calendar.
// The door resolves the event through the TWO-LEG GATE at resolveEvent (a UUID for any
// caller that still holds one; otherwise a SAYABLE REFERENT — the booking's title,
// prefix-tolerant, with exact on_date when given — R-B6-1), applies the change,
// and confirms. Both now write through eventWrite (TDW_04 B2), so the CRUD door and this
// one cannot drift: one writer, two doors.
// ── TDW_04 B0 item 3 (CE extension, 2026-07-15) — THE CHAT LANE JOINS THE LEDGER ──
//
// Recorded as NEW SCOPE, not laundered into ST-3d: ST-3d is SURFACE_TRUTH_AUDIT R3(d),
// whose text is "Log BINDER-DOOR and LEAD-DOOR writes" — that shipped (binderWrite.js
// :69/:109, leads.js :203/:292/:337/:394). The chat lane was never in ST-3d or L-9.
//
// WHY (F-04.21, founder-run evidence 2026-07-15): fourteen vendor_activity_log rows in
// the 11:00-14:00 window, ALL surface='pwa' from the list page. ZERO from this lane.
// The lead this lane created at 11:22:38 logged nothing, so establishing who wrote it
// took four founder-run queries. The doors log; the WA agent logs (agent/engine.js:268);
// this lane did not.
//
// GRANULARITY (CE-ruled): ONE ROW PER NESTED MUTATING donna_call. A turn that files a
// lead and a payment made two facts; the ledger records two. Donna's hands nest inside
// tool_calls[].donna_calls (loop.ts:48, :368-372) — top-level carries only her
// dear_donna_talk/listen_harvey_talk envelope, so a top-level-only scan logs nothing.
//
// ERROR GATE (CE-ruled): the doors' isErr convention — a display starting with 'ERROR'
// is a FAILED write and is never logged. WA's looksLikeError regex (engine.js:266) is a
// legacy heuristic and is deliberately NOT propagated.
//
// SIGNAL-ONLY TOOLS ARE DELIBERATELY ABSENT FROM THIS SET. donna_invoice_pdf
// (recordPrimitives.ts:540-545), donna_book_event (:546-555), donna_edit_event
// (:556-564) and donna_cancel_event (:565-570) WRITE NOTHING in the engine — their
// displays are future tense ("it is being placed on the calendar") because the real
// write happens in THIS FILE's post-processors (buildInvoices/bookEvents/mutateEvents),
// which can still fail after the signal returns cleanly. Logging a signal as an activity
// row would enter a REQUEST into the ledger as a COMPLETED FACT — F-04.21's exact
// disease rebuilt inside the cure for it. Their door-side writes remain unlogged as of
// B0; see the handover's PROPOSAL (not implemented, outside this charter).
//
// The write set below is enumerated from executeRecordTool's own switch
// (recordPrimitives.ts) plus donna_lead (donna.ts:482-491, the only other hand that
// sets mutated=true). Reads are excluded by construction (donna.ts:442's read sets);
// donna_verdict/donna_review write supervision tables, never vendor-visible records,
// and do not set mutated (donna.ts:466-480) — excluded.
const CHAT_MUTATING_TOOLS = new Set([
  'donna_money',                        // recordPrimitives.ts:417
  'donna_date',                         // :456
  'donna_client',                       // :458
  'donna_note',                         // :460
  'donna_note_append',                  // :463
  'donna_phone',                        // :467
  'donna_doc',                          // :469
  'donna_stage',                        // :471
  'donna_write_reasonforaction_append', // :474
  'donna_money_edit',                   // :476
  'donna_edit',                         // :525
  'donna_hide',                         // :571
  'donna_unarchive',                    // :580
  'donna_retrieve',                     // :581 (transitional alias, same hand)
  'donna_merge',                        // :590
  'donna_split',                        // :631
  'donna_repeatfollowup',               // :671
  'donna_lead',                         // donna.ts:482-491 (typed plane, LD-1)
]);

// Collect every mutating call at BOTH depths, in turn order, then log one row each.
// Fire-and-forget throughout: logActivity is fail-safe by contract (snapshot.js:112-141)
// and a ledger miss must never disturb a write that already landed.
async function logChatActivity(req, result) {
  const supabase = req.app.locals.supabase;
  const isErr = (r) => typeof r === 'string' && r.startsWith('ERROR');
  const hits = [];
  for (const tc of (result.tool_calls || [])) {
    if (CHAT_MUTATING_TOOLS.has(tc.name)) hits.push(tc);
    for (const dc of (tc.donna_calls || [])) if (CHAT_MUTATING_TOOLS.has(dc.name)) hits.push(dc);
  }
  for (const c of hits) {
    if (isErr(c.result)) continue; // a failed write is not an activity
    // entity_type/entity_id stay NULL: tool_calls carries no item.ref_id, and parsing an
    // id out of prose would put an inference in the ledger. The display's own first line
    // carries the id where the tool prints one (donna_lead: "Lead saved. id=<uuid>...").
    // PROPOSAL in the handover: have the engine surface item.ref_id on tool_calls.
    logActivity(supabase, {
      vendorId: req.vendor.id,
      surface: 'pwa',
      action: c.name, // tool name — logActivity's own convention (snapshot.js:132)
      summary: String(c.result || c.name).split('\n')[0].slice(0, 240),
      entityType: null,
      entityId: null,
    }).catch(() => {});
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// ── THE TWO-LEG GATE (R-B6-1's known second half, CE-ruled 2026-07-17) ──────
// The snapshot no longer hands Victor row ids, so a gate that required a UUID
// would strand every edit/cancel reference. Leg 1 (UUID, byte-identical to the
// B4-era gate) survives for any caller that still holds a real id. Leg 2 is the
// SAYABLE-REFERENT leg: vendor-scoped resolution on the booking's TITLE
// (prefix-tolerant — nameMatches, imported from resolveClientReference.js, the
// estate's ONE home for the token-boundary prefix rule; the resolver itself is
// precedent-not-reused because it resolves PEOPLE across clients/leads/invoices
// and this resolves EVENTS — different entity, different tables, different match
// shape) plus exact `on_date` when the model supplies it, against LIVE ROWS ONLY
// (`deleted_at is null` + `state <> 'cancelled'` — the covenant; note leg 1
// deliberately keeps its original predicate, which does NOT exclude cancelled —
// 0-behaviour-change on the UUID path, disclosed).
//
// AMBIGUITY RESOLVES TO HONESTY, NEVER TO A GUESS (the ruling's own words): two
// or more candidates return `{ambiguous:[…]}` and mutationLines speaks "tell me
// which one", listing each by title + date. Returns exactly one of:
//   { ev }                      resolved
//   { ambiguous: [{title, event_date}, …] }
//   { none: true }              nothing matched (the old null)
async function resolveEvent(req, eventId, onDate) {
  const raw = String(eventId || '').trim();
  if (!raw) return { none: true };
  if (UUID_RE.test(raw)) {
    const { data, error } = await req.app.locals.supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state, linked_binder_id')
      .eq('vendor_id', req.vendor.id)
      .eq('id', raw)
      .is('deleted_at', null)
      .maybeSingle();
    if (error || !data) return { none: true };
    return { ev: data };
  }
  // Leg 2. The ilike is a coarse DB-side prefilter refined by nameMatches —
  // resolveClientReference.js's own pattern, so "riya" never matches "Priya".
  const { nameMatches, nameNeedleTokens } = require('../../lib/vendor/resolveClientReference');
  let q = req.app.locals.supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, state, linked_binder_id')
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .neq('state', 'cancelled');
  // F-04.98 CURE 2 — token-AND prefilter so the coarse net survives punctuation in
  // the title: '%Ananya recce%' never matches 'Ananya - recce', but '%ananya%' AND
  // '%recce%' both hit it. nameMatches refines below unchanged (so "riya" still
  // never reaches "Priya"). Empty tokens fall back to the single ilike — harmless.
  const toks = nameNeedleTokens(raw);
  if (toks.length) { for (const t of toks) q = q.ilike('title', `%${t}%`); }
  else             q = q.ilike('title', `%${raw}%`);
  const day = String(onDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) q = q.eq('event_date', day);
  const { data, error } = await q;
  if (error || !data) return { none: true };
  const hits = data.filter((r) => nameMatches(r.title, raw));
  if (hits.length === 1) return { ev: hits[0] };
  if (hits.length > 1) return { ambiguous: hits.map((r) => ({ title: r.title, event_date: r.event_date })) };
  return { none: true };
}
// TDW_04.5 P1 #4 — the crew name matcher. Case-insensitive, WITHIN THE ACTIVE TEAM
// (the door reads that set with team.js's own predicate before calling this). A member
// answers to the vendor's word when it is the full name OR any name-token (first or
// surname) — so "Rahul" reaches both Rahuls and clarify-once fires, while "Rahul Mehra"
// resolves to one. NOT resolveClientReference.nameMatches: that resolves PEOPLE across
// clients/leads/invoices; this resolves TEAM MEMBERS, a different set (resolveEvent's own
// precedent-not-reused note, one layer down).
function memberNameMatches(name, want) {
  const n = String(name || '').trim().toLowerCase();
  const w = String(want || '').trim().toLowerCase();
  if (!n || !w) return false;
  if (n === w) return true;                     // exact full name
  return n.split(/\s+/).includes(w);            // any token — the clarify-once source
}
async function mutateEvents(req, result) {
  const edits = [], cancels = [], assigns = [];
  const collect = (call) => {
    if (!call || !call.input) return;
    if (call.name === 'donna_edit_event' && call.input.event_id) edits.push(call.input);
    if (call.name === 'donna_cancel_event' && call.input.event_id) cancels.push(call.input);
    if (call.name === 'donna_assign_crew' && call.input.event_id) assigns.push(call.input);
  };
  for (const tc of (result.tool_calls || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  const done = [];
  for (const e of edits) {
    try {
      const res = await resolveEvent(req, e.event_id, e.on_date);
      // ── AMBIGUITY (R-B6-1): two candidates resolve to honesty, never a guess.
      // The outcome carries the candidates so mutationLines can list them by
      // title + date — F-04.62's law extended: every cause names itself.
      if (res.ambiguous) { done.push({ action: 'edit', ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      // ── F-04.62's CURE (CE-ruled 2026-07-16, filed and cured this ZIP) ────
      // `reason:'unresolved'` is the WHOLE FIX, and it is one word. THREE distinct
      // causes used to collapse into a bare `{ok:false}` here — no single match, a
      // deliberate REFUSAL, and a FAIL-CLOSED error — and mutationLines rendered all
      // three as "I didn't find a single match. Tell me which one." THIS is the only
      // branch that sentence was ever true of. See mutationLines' own note.
      if (!ev) { done.push({ action: 'edit', ok: false, reason: 'unresolved' }); continue; }
      const patch = {};
      for (const k of ['title', 'event_date', 'event_time', 'kind', 'notes']) {
        if (typeof e[k] === 'string' && e[k].trim()) patch[k] = e[k].trim();
      }
      // Routed: updateEvent's raw .update() is gone. The scrub that used to live in this
      // loop lives in eventWrite now (same rule — only the free-text cells; dates and enums
      // are noise), so this loop is back to what it was before F-04.34 patched it here.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, ...patch,
      });
      // ── THE ANCHOR VETO (Q-B3-3 + Q-B3-9's amendment, CE-ruled 2026-07-16) ──
      // Lockstep: a linked event's date moved -> carry the binder's date along, through
      // Donna's hand (the binder is engine-owned, so it goes through donna_date — snapshot
      // patched, trail written). VERBATIM from B1 except the veto.
      //
      // THIS IS THE LEG THAT REWROTE MEERA'S WEDDING — witnessed, turn log 2026-07-15
      // 21:49 (donna_edit_event on the trial; binder written 697ms later by this line).
      // F-04.46 was FILED against T11, the CRUD door — which is router.patch('/:eventId')
      // and cannot be reached from chat at all. Q-B3-4's widening is what saved the cure:
      // had "only T11" been ruled, the fix would have landed on the leg that never fires
      // from Victor and left THIS one live. F-04.38's twin lesson, third instance.
      if (r && r.ok && patch.event_date && ev.linked_binder_id) {
        try {
          if (await isWeddingAnchor(req.app.locals.supabase, ev, ev.linked_binder_id)) {
            await executeAndPatch(req.agentId, 'donna_date', { binder_id: ev.linked_binder_id, date: patch.event_date });
          }
        }
        catch (e2) { console.warn('[vendor-e chat:lockstep e->b]', e2.message); }
      }
      // F-04.62: the outcome now carries its CAUSE. `conflict` rides on BOTH branches —
      // on ok:true it is an ADVISORY (the write landed; appointment_overlap/cluster ride
      // out on {ok:true, event, conflict}), and on ok:false it is a REFUSAL. Same field,
      // opposite meanings, and `ok` is the only thing that tells them apart — which is
      // exactly why isRefusal lives in occupancy.js and not in a door.
      done.push(r && r.ok
        ? { action: 'edit', ok: true,  event: r.event || ev, conflict: r.conflict || null }
        : { action: 'edit', ok: false, conflict: (r && r.conflict) || null,
            error: (r && !r.conflict && r.error) || null, reason: (r && (r.conflict || r.error)) ? null : 'unresolved' });
    } catch (err) { console.error('[vendor-e chat:donna_edit_event]', err.message); done.push({ action: 'edit', ok: false, reason: 'unresolved' }); }
  }
  for (const c of cancels) {
    try {
      const res = await resolveEvent(req, c.event_id, c.on_date);
      if (res.ambiguous) { done.push({ action: 'cancel', ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: 'cancel', ok: false, reason: 'unresolved' }); continue; }
      // Routed. A cancel is a state write, and state is eventWrite's to set.
      const r = await writeEvent(req.app.locals.supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, state: 'cancelled',
      });
      // A cancel CANNOT draw a conflict — checkOccupancy's Item 3 guard returns null for
      // `eff.state === 'cancelled'` above every query ("a row leaving occupancy asks no
      // occupancy question"). It CAN still draw a FAIL-CLOSED error, and that is the
      // only reason `error` is read here. Read from the checker, not assumed by symmetry.
      done.push(r && r.ok
        ? { action: 'cancel', ok: true, event: ev }
        : { action: 'cancel', ok: false, error: (r && r.error) || null, reason: (r && r.error) ? null : 'unresolved' });
    } catch (err) { console.error('[vendor-e chat:donna_cancel_event]', err.message); done.push({ action: 'cancel', ok: false, reason: 'unresolved' }); }
  }
  // ── CREW (04.5 P1 #4) — assign / unassign, riding the SAME shared done[] ──────
  // Mirrors donna_edit_event: the SHARED resolveEvent (untouched) resolves the booking,
  // then a member is resolved case-insensitively within the ACTIVE team, and the crew SET
  // is written through writeEvent — the ONE writer (assign = union, unassign = difference;
  // array = SET semantics). The note-trail + crew_confirmations come FREE from eventWrite's
  // sealed crew core; nothing is re-implemented here. Every outcome names its own cause
  // (F-04.62's law): member_unresolved / member_ambiguous / idempotent / guard, and — for
  // the booking itself — the mirrored event ambiguous / unresolved reasons.
  const supabase = req.app.locals.supabase;
  for (const a of assigns) {
    try {
      const res = await resolveEvent(req, a.event_id, a.on_date);
      if (res.ambiguous) { done.push({ action: a.action, ok: false, reason: 'ambiguous', candidates: res.ambiguous }); continue; }
      const ev = res.ev;
      if (!ev) { done.push({ action: a.action, ok: false, reason: 'unresolved' }); continue; }
      // ── member resolution: ACTIVE team, team.js's predicate (active=true AND deleted_at
      //    IS NULL — the same set eventWrite validates the write against) ──
      const { data: teamRows, error: teamErr } = await supabase
        .from('team_members').select('id, name')
        .eq('vendor_id', req.vendor.id).eq('active', true).is('deleted_at', null);
      if (teamErr) { done.push({ action: a.action, ok: false, reason: 'unresolved' }); continue; }
      const matches = (teamRows || []).filter((m) => memberNameMatches(m.name, a.member));
      if (matches.length === 0) { done.push({ action: a.action, ok: false, reason: 'member_unresolved', memberName: a.member }); continue; }
      if (matches.length > 1)  { done.push({ action: a.action, ok: false, reason: 'member_ambiguous', memberName: a.member, memberCandidates: matches.map((m) => ({ id: m.id, name: m.name })) }); continue; }
      const member = { id: matches[0].id, name: matches[0].name };
      // ── ONE targeted vendor-scoped read of the current crew for ev.id. resolveEvent's
      //    select stays byte-identical (it never carries assigned_member_ids), so the crew
      //    read lives HERE, not in the shared resolver. ──
      const { data: cur } = await supabase
        .from('events').select('assigned_member_ids')
        .eq('id', ev.id).eq('vendor_id', req.vendor.id).is('deleted_at', null).maybeSingle();
      const currentIds = Array.isArray(cur && cur.assigned_member_ids) ? cur.assigned_member_ids.map(String) : [];
      const isOn = currentIds.includes(member.id);
      // idempotent-add no-op / remove-guard — THE BRANCH IS THE GUARD, no write fires.
      if (a.action === 'assign'   &&  isOn) { done.push({ action: 'assign',   ok: false, reason: 'idempotent', member, event: ev }); continue; }
      if (a.action === 'unassign' && !isOn) { done.push({ action: 'unassign', ok: false, reason: 'guard',      member, event: ev }); continue; }
      const newSet = a.action === 'assign'
        ? [...new Set([...currentIds, member.id])]         // union
        : currentIds.filter((id) => id !== member.id);     // difference
      const r = await writeEvent(supabase, {
        vendorId: req.vendor.id, surface: 'pwa', source: 'victor', event_id: ev.id, assigned_member_ids: newSet,
      });
      // `conflict` rides on ok:true as an ADVISORY (member_clash), exactly as edit's does —
      // the advised filter (mutated.filter: m.ok && m.conflict && m.conflict.message) carries
      // it to advisoryLines, BESIDE the witness, never instead. BYTE-READY-DORMANT (Rulings
      // 6/7, F-04.88): a crew-only write returns conflict==null TODAY because occupancy.js:551
      // short-circuits on touchesSpatial BEFORE the member_clash block (SPATIAL_KEYS has no
      // `members`). This plumbing surfaces the clash THE INSTANT the core cure teaches
      // touchesSpatial that members are spatial — NO door-side workaround, NO occupancy.js touch.
      done.push(r && r.ok
        ? { action: a.action, ok: true,  member, event: r.event || ev, conflict: r.conflict || null }
        : { action: a.action, ok: false, member, event: ev, conflict: (r && r.conflict) || null,
            error: (r && !r.conflict && r.error) || null, reason: (r && (r.conflict || r.error)) ? null : 'unresolved' });
    } catch (err) { console.error('[vendor-e chat:donna_assign_crew]', err.message); done.push({ action: a.action, ok: false, reason: 'unresolved' }); }
  }
  return done;
}
// F-04.33 (same seam, same reason as bookingLines): e.title is DB-sourced and rode raw
// to the vendor on both routes.
// ── F-04.62's CURE LIVES HERE (🔴, filed and cured this ZIP, CE-ruled 2026-07-16) ──
//
// THE SENTENCE BELOW WAS A LIE THE MOMENT THE CHECKER GOT A BODY, AND IT WAS LIVE IN
// PRODUCTION FROM ZIP D UNTIL THIS ZIP.
//
// It read, for EVERY `ok:false`:
//   "Couldn't change that booking — I didn't find a single match. Tell me which one."
//
// Three causes reached it. It was true of ONE:
//   · !ev              -> resolveEvent found no single match.  THE SENTENCE IS TRUE.
//   · a CONFLICT       -> the checker refused ON PURPOSE. Victor told the vendor he
//                         could not FIND a booking he found perfectly well and refused
//                         deliberately — and the vendor, taking him at his word, would
//                         re-specify the event and read the same sentence FOREVER.
//   · a FAIL-CLOSED    -> the checker could not see the calendar. Nothing was written,
//     ERROR               and the reason given named the wrong thing entirely.
//
// A DELIBERATE REFUSAL REPORTED AS A SEARCH FAILURE IS A FALSE DIAGNOSIS OF THE
// ESTATE'S OWN ACT. It is F-04.55's sibling and it is worse in kind: F-04.55's chat
// half was SILENCE (the kind went to a server log); this was a WRONG SENTENCE, spoken
// confidently, in Victor's voice, about the estate's own correct behaviour.
//
// The cure is one word — `reason:'unresolved'` at the two !ev branches — and this
// branch order. Every sentence now names what actually happened.
function mutationLines(done) {
  return scrubText(done.map((m) => {
    if (!m.ok) {
      // The REFUSAL: the checker's own sentence, VERBATIM (spec P2). It already says
      // what happened and why, in his register, and it is founder-blessed.
      if (m.conflict && m.conflict.message) return m.conflict.message;
      // FAIL-CLOSED's honest, retryable string. Also verbatim; also already true.
      if (m.error) return m.error;
      // ── CREW (04.5 P1 #4) — the crew-side causes, each naming itself. VERBATIM,
      //    founder veto (CE Ruling №8). More specific than the event reasons below,
      //    so they are tested first; the `reason` values do not collide with edit's. ──
      // Member ambiguity → clarify-once. Honesty, never a guess: the shared word,
      // then the full names to choose between.
      if (m.reason === 'member_ambiguous' && Array.isArray(m.memberCandidates) && m.memberCandidates.length > 1) {
        const names = m.memberCandidates.map((c) => c.name);
        const plural = String(m.memberName || 'teammate').trim().replace(/\b\w/g, (ch) => ch.toUpperCase());
        const numWord = { 2: 'two', 3: 'three', 4: 'four' }[names.length] || String(names.length);
        const joined = names.length === 2
          ? names.join(' or ')
          : `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
        return `I have ${numWord} ${plural}s — ${joined}?`;
      }
      // Member not on the team — echo the vendor's own word back.
      if (m.reason === 'member_unresolved') {
        return `I couldn't find anyone called ${m.memberName} on your team.`;
      }
      // Idempotent add — already there, no write fired.
      if (m.reason === 'idempotent') {
        return `${m.member.name}'s already on the ${(m.event && m.event.title) || 'booking'}.`;
      }
      // Remove-guard — wasn't there to take off, no write fired.
      if (m.reason === 'guard') {
        return `${m.member.name} isn't on the ${(m.event && m.event.title) || 'booking'}.`;
      }
      // AMBIGUITY (R-B6-1): more than one booking answers to that name. Honesty,
      // never a guess — each candidate listed by title + date so the vendor can
      // say which one in his next breath.
      if (m.reason === 'ambiguous' && Array.isArray(m.candidates) && m.candidates.length) {
        const list = m.candidates.map((x) => `${x.title} (${x.event_date})`).join(' · ');
        return m.action === 'cancel'
          ? `Couldn't cancel that booking — more than one matches: ${list}. Tell me which one.`
          : `Couldn't change that booking — more than one matches: ${list}. Tell me which one.`;
      }
      // AND ONLY NOW, the sentence that was always true HERE and nowhere else.
      return m.action === 'cancel'
        ? `Couldn't cancel that booking — I didn't find a single match. Tell me which one.`
        : `Couldn't change that booking — I didn't find a single match. Tell me which one.`;
    }
    // ── CREW WITNESS (04.5 P1 #4) — the ok:true action-aware branch; THE BRANCH IS
    //    THE GUARD (CE Ruling №5). Reading A (CE Ruling №8): raw {when}, time-optional,
    //    mirroring the sibling Updated: line's own event_date-guarded handling EXACTLY —
    //    one reply, one date voice. Humanizing is parked to the Block 09 estate-wide pass
    //    (F-04.89, filed). VERBATIM, founder veto. ──
    if (m.action === 'assign' || m.action === 'unassign') {
      const ce = m.event || {};
      const title = ce.title || 'booking';
      if (m.action === 'unassign') return `${m.member.name}'s off the ${title}.`;
      const cwhen = ce.event_time ? `${ce.event_date} at ${ce.event_time}` : ce.event_date;
      return `${m.member.name}'s on the ${title}${ce.event_date ? ` — ${cwhen}` : ''}.`;
    }
    const e = m.event || {};
    const when = e.event_time ? `${e.event_date} at ${e.event_time}` : e.event_date;
    return m.action === 'cancel'
      ? `Cancelled: ${e.title}${e.event_date ? ` — ${when}` : ''}. It's off your calendar.`
      : `Updated: ${e.title} — ${when}. The calendar's set.`;
  }).join('\n'));
}
// THE ANCHOR RULE lives in lib/vendor/occupancy.js beside the set it consumes
// (Q-B3-10, CE-ruled 2026-07-16 — it was shipped twice at B3; "they agree today;
// I read both" is F-04.36's origin sentence). Leg 1 and leg 3 now import ONE rule.

// ══════════════════════════════════════════════════════════════════════════
// THE COMPOSED-REPLY SAVE — Q-B4-6(b), F-04.41's CURE. (TDW_04 B6 sitting 2,
// R-B6-3 CE-confirmed: its own ZIP, after R-B6-1's green — this is that ZIP.)
// ══════════════════════════════════════════════════════════════════════════
//
// F-04.41, in one sentence: loop.ts saves the model's reply BEFORE these
// post-processors run, so the door lines — the WITNESS — ride only as text_delta
// and evaporate on refresh, while the model's prose — the GUESS — persists in
// engine.messages forever. The B6 smoke photographed the full sequence (the 06
// harvest, item 2): fabricate -> persist -> compound -> BLOCK a real write on
// the strength of a preserved fabrication. The founder screen-witnessed the
// refresh-evaporation the same sitting: the honest "Couldn't change that
// booking" gone, the fabricated "Done. 30 November is locked" standing alone.
//
// THE CURE: after every line-producing post-processor has run, the door patches
// the door lines onto the EXACT row loop.ts saved — result.assistant_message_id,
// the engine's own witness (never "the latest assistant row", which is a guess).
// The thread's channel 1 (loadThread, memory.ts — content only) then carries the
// witnessed lines beside the prose, so a preserved "Done" can no longer stand
// unopposed and the compounding chain loses its fuel.
//
// WHAT IS STORED: `result.reply` (the model half, byte-identical to what loop.ts
// saved — raw, pre-scrub, exactly as today) + the tail. The tail's strings are
// the builders' own output, already scrubbed at the seam (F-04.33's cure), which
// is also the copy-law's storage clause satisfied: no internal name can ride.
//
// WHAT IS DELIBERATELY NOT DONE: the model half is not re-scrubbed in storage
// (0-behaviour-change on what the thread held yesterday); a missing id writes
// NOTHING (never guess a row); a failed patch warns and never disturbs the
// response (the reply is already owed — leads.js:224's convention).
//
// composedTail RECOMPUTES the builders. Disclosed, and safe by construction:
// bookingLines/conflictLines/mutationLines/advisoryLines/invoiceLines and the
// blockHands pair are PURE functions of their inputs — a second call returns a
// byte-identical string — so the live send/append code above is untouched
// (0-line diff on the wire paths) and the two routes cannot drift from a third
// copy of the append order: this IS the one ordered list, same order as both
// routes append (documents · booked · refused · mutated · advised · blocked ·
// unblocked).
//
// TDW_06 sitting 0 (D-2) — `witnessed` joins the list FIRST and is the ONE element
// the routes do NOT append to the wire: her hands fire INSIDE the turn (before any
// door below runs), and live they are already rendered as CHIPS by translateBeat.
// So the live turn shows prose + chip; the stored turn shows prose + the same
// sentence as text. Two renderings of one witnessed fact — disclosed, because the
// list above claims to be the routes' order and now carries one line that is
// storage-only. Everything below it stays byte-identical, both routes.
// ADDITIVE: absent or empty `witnessed` returns the pre-cure bytes exactly (older
// callers and the sealed b6_sitting2_bench unaffected — proven both ways).
// TDW_06 D-6 — `open` joins the list LAST, and unlike `witnessed` it IS appended
// to the wire by both routes (it has no chip to render it live; the wire IS its
// live rendering, ruled). Last here so stored order equals live order — twins.
// ADDITIVE: absent or empty `open` returns the pre-D-6 bytes exactly (older
// callers and the sealed benches unaffected — proven both ways in the bench).
// Scrubbed here for the witnessed slot's own stated reason PLUS the line's own:
// it quotes Donna's sentence by name, and the firewall owns that rendering.
function composedTail({ witnessed, documents, booked, refused, mutated, advised, blocked, unblocked, open }) {
  const parts = [];
  // scrubText for blockLines' own stated reason: these summaries carry a
  // vendor-supplied NAME back to the wire, and a name is free text. The chip
  // scrubs its own summary at translateBeat; the stored twin scrubs here.
  if (witnessed && witnessed.length) parts.push(scrubText(witnessed.join('\n')));
  if (documents && documents.length) parts.push(invoiceLines(documents));
  if (booked && booked.length)       parts.push(bookingLines(booked));
  if (refused && refused.length)     parts.push(conflictLines(refused));
  if (mutated && mutated.length)     parts.push(mutationLines(mutated));
  if (advised && advised.length)     parts.push(advisoryLines(advised));
  if (blocked && blocked.length)     parts.push(scrubText(blockLines(blocked)));
  if (unblocked && unblocked.length) parts.push(scrubText(unblockLines(unblocked)));
  if (open)                          parts.push(scrubText(open)); // D-6, last by design
  return parts.length ? '\n\n' + parts.join('\n\n') : '';
}

// ── F-06.104 · MUTATION_CLAIM_RE — THE VERB FAMILY THE SHARED FOUR NEVER HELD
// (TDW_06, 2026-07-28; CE R-9, minted from the executor's own §5.6b gap cell).
//
// THE FINDING: `ACTION_CLAIM_RE`'s passive limb lists routed|logged|filed|booked|
// dispatched|forwarded|handled and `COMPLETED_ACT_RE`'s lists locked|secured|recorded|
// captured|saved|entered|updated. NEITHER holds a mutation verb — so
// "Done. 18 December is unblocked.", F-04.71's ORIGINAL costume specimen and the
// sentence this whole block was opened over, walked the guard untouched. A
// vendor-protection guard deaf to the block's founding lie is a coverage report
// wearing a cure's uniform.
//
// WHY THIS IS A SEPARATE CONSTANT AND NOT A WIDENING OF THE FOUR — the masking law
// (NOTE_12 §9, CE-81's discipline) honored BY CONSTRUCTION, not by restraint: the four
// families above are SHARED with b06_gauntlet, which requires them from here. Widening
// a shared regex changes what the rig's arms convict, and an adjacent gap can then be
// masked by silently becoming this cell's job. This constant is STAGE-1-SCOPED: it is
// consumed by wireGuardClassify ALONE, no gauntlet arm reads it, and the four stand
// byte-identical to their pre-move source (asserted in b06_forkc_wireguard_bench §5.2).
// No shared meaning moves. That is the whole reason for the separate home.
//
// THE VERB FAMILY, CITED PER SPECIMEN — every verb below is a convicted texture from
// the estate's own record, never an invention:
//   · unblocked  — F-04.71's thesis specimen, "Done. 18 December is unblocked" (the
//                  unblock fabricated TWICE, with the tool's own trigger word ignored)
//   · cancelled  — F-04.71's first specimen, a "Cancelled: …" dressed as mutationLines'
//                  own format with tool_calls: null
//   · moved      — F-04.43's wall: a date dragged silently; the mis-report of a move
//   · blocked    — the block/unblock pair, both 'write' at actionKind, S3's own family
//   · cleared / open again / back on the calendar — SD-C3's and S3's phrasings, the
//                  costume speaking the OUTCOME rather than the verb
// F-06.84's acquitting phrases and the honest-refusal shapes are NOT absorbed: this
// family requires a COMPLETED/PROMISED construction around the verb, so "nothing to
// unblock", "I can't unblock that", and "shall I unblock it?" all walk — asserted both
// directions in b06_forkc_wireguard_bench §5.6c.
// The lawful present/future intent shapes (§2.2 sentence 3), and the completion markers
// that disqualify a sentence from being one. Stage-1-scoped; bench-exported only.
const ACK_INTENT_RE = new RegExp([
  "\\bI(?:'ll| will|'m| am)\\s+(?:just |now |going to )?(?:be\\s+)?(?:logging|filing|booking|checking|noting|adding|pulling|sending|handing|passing|routing)\\b",
  "\\b(?:shall|should|want me to|would you like me to)\\s+I?\\s*(?:log|file|book|check|note|add|pull|send|hand|pass|route)\\b",
  "\\b(?:logging|filing|booking|noting|adding|checking)\\s+(?:it|that|this|her|him|them)?\\s*now\\b",
  "\\blet me\\s+(?:just\\s+)?(?:log|file|book|note|add)\\b",
].join("|"), "i");
const DONE_MARKER_RE = /\b(?:done|sorted|handled|already|just did|that's (?:filed|logged|booked|done))\b/i;
// LIMB 2's OWN PREDICATE, Stage-1-scoped (TDW_06 rework; the executor's own §6.4 red,
// filed not papered). §2.1 sentence 3 is about ONE speech act — asserting that something
// IS NOT ON FILE — and `NARRATED_LOOKUP_RE` is a four-armed family that also catches the
// look verb and the ongoing-file verbs. Gating limb 2 on the whole family convicted
// "I'll check the cabinet and come back to you", which is lawful future intent carrying
// no absence claim at all (ACK_INTENT_RE misses it: its verb list holds the -ing forms,
// not the bare infinitive). That is a false positive minted inside a cure whose whole
// purpose is to REMOVE false positives, so the limb is narrowed to the absence arm.
// THE BYTES BELOW ARE ARM (2) OF NARRATED_LOOKUP_RE, BYTE-IDENTICAL — no new meaning
// enters the estate; the arm is merely addressable on its own. Bench-asserted at §6.4b.
const ABSENCE_ASSERT_RE = new RegExp(
  "\\b(?:nothing|no|not|don'?t have (?:anything|any)?)\\b[^.]{0,25}\\b(?:on file|in (?:the|his|her) (?:cabinet|records?|ledger|books|file|system)|record of|in the system)\\b", "i");
// ── F-06.122 · PRESENCE_ASSERT_RE — LIMB 2's SYMMETRIC ARM (TDW_06 M-2a, 2026-07-29;
// CE-ruled). Stage-1-scoped, its own constant on CE-81's discipline: a widening earns
// its arm by evidence, and the evidence is the 21:40:34 production specimen — "Let me
// check the cabinet for Kavya. I have two entries under that name…" over a hand census
// of ZERO. §2.1 sentence 3 governs BOTH directions ("only a read answers existence"),
// but the shipped ladder could only convict an invented ABSENCE; an invented PRESENCE
// — the more dangerous half, because the vendor acts on it — filed as a note.
// Honest presence riding a find hand walks at LIMB 1, ahead of this arm, by order.
const PRESENCE_ASSERT_RE = new RegExp([
  // "I have two entries", "I've got three records", "I hold one match"
  "\\b(?:I have|I've got|I have got|I hold|I'm holding)\\s+(?:\\w+\\s+){0,3}(?:entr(?:y|ies)|records?|rows?|leads?|files?|matches?|results?)\\b",
  "\\b(?:I have|I've got|I have got)\\s+(?:her|him|them|that|it)\\s+on file\\b",
  // "there are two entries", "there's one on file"
  "\\bthere(?:'s| is| are)\\s+(?:\\w+\\s+){0,3}(?:entr(?:y|ies)|records?|matches?|on file)\\b",
  // "she's on file", "he is already on the books"
  "\\b(?:she|he|they|it)(?:'s| is| are)\\s+(?:already\\s+)?on (?:file|the books)\\b",
].join("|"), "i");

// ── F-06.121 · PARTICIPLE_COMPLETION_RE — THE RECORDS-CLASS RECALL GAP (TDW_06 M-2a;
// CE-ruled). Stage-1-scoped. The measurement batch's own miss: "Yes. Filed just now —
// Ishaan Precision Probe…" tripped NO claim family at all, so the records class never
// reached Fork A' and `prior_turn_witnessed` stands proven on the DATE class alone.
// ACTION_CLAIM_RE's first-person limb needs "I've filed"; the bare participle carries
// the completion in a TEMPORAL word instead of a subject. Anchored at a sentence
// boundary and requiring the temporal marker within 20 chars, so the door's own witness
// prose ("Filed — Ishaan Precision Probe, wedding photography") carries no temporal and
// walks, and question shapes ("Shall I file it?") never reach the participle position.
// Both directions asserted at §7.3.
// M-2b (F-06.121's record grown): RE-ANCHORED, and the anchor was only half the gap.
// The measurement's own fixture — "Yes — Ishaan Precision Probe landed as booked, …" —
// drew NO ROW AT ALL, and the em-dash was only the first reason: derived at the desk,
// the participle slot after the anchor held a SUBJECT ("Ishaan Precision Probe"), and
// the bytes carry NO temporal word anywhere. So the ruled re-anchor alone could not
// reach its own named fixture. Reported, and cured to the RULED OUTCOME with the
// minimal widening the fixture demands, in three parts:
//   (1) the anchor accepts the dash/colon shapes after "Yes", not just comma/period;
//   (2) a bounded SUBJECT SLOT (≤4 words, no sentence end) may sit between the anchor
//       and the participle — "Yes — <name> filed just now";
//   (3) a separate LINKING-VERB limb for the completion carried by a verb rather than a
//       temporal ("landed as booked", "went in as filed"). This limb needs no temporal
//       BECAUSE the linking verb is itself the completion, which is exactly what the
//       door's own witness prose ("Filed — Ishaan Precision Probe, wedding photography")
//       lacks — so that prose still walks, asserted both ways at §8.3.
const PARTICIPLE_COMPLETION_RE = new RegExp([
  "(?:^|[.!?]\\s+|\\n|\\byes\\s*[,.:—–-]?\\s+)(?:[A-Za-z][\\w']*\\s+){0,4}(?:filed|logged|booked|noted|recorded|saved|updated|blocked|unblocked|cancelled|canceled|moved)\\b[^.]{0,20}\\b(?:just now|already|a moment ago|earlier|now)\\b",
  "\\b(?:landed|went in|came in|went through)\\s+(?:as\\s+)?(?:filed|logged|booked|noted|recorded|saved|updated)\\b",
].join("|"), "i");

// ── F-06.120 · AGENTIVE_CLAIM_RE — THE STATE-DESCRIPTION GATE (TDW_06 M-2a; CE-ruled,
// minted from THIS EXECUTOR'S OWN REGRESSION, self-convicted by the instrument it built).
// THE SPECIMEN: the 21:39:52 production turn — the vendor asked "What does my week look
// like?" and Victor answered honestly from the snapshot (§2.1 s3's expressly LAWFUL
// shape, the healthiest read the engine serves). `COMPLETED_ACT_RE` matched "is locked"
// (from "Rhea Malhotra's sangeet shoot is locked for tomorrow night"), the census was
// zero, Fork A' found no prior deed, and the ladder escalated a WEEKLY BRIEFING to
// `costume · MATERIAL`. Under the pre-rework ladder that turn was a note; the escalation
// I added converted it into a false material conviction. Had Stage 2 been armed the
// vendor's briefing would have been replaced by the glitch line.
//
// THE DISEASE: describing what the estate IS reads identically to claiming what one DID.
// THE CURE, narrow-refined: the conviction path requires an AGENTIVE marker (a
// first-person subject taking the act) OR a COMPLETION marker (the DONE_MARKER_RE family
// / the "Done."-class opener / a bare participle carrying a temporal completion). A
// non-agentive state description with neither is its own logged class, never a specimen,
// so the next read MEASURES the class rather than deleting it.
// The bytes below are the FIRST-PERSON limbs of ACTION_CLAIM_RE, COMPLETED_ACT_RE and
// MUTATION_CLAIM_RE, BYTE-IDENTICAL — three arms made addressable, no new meaning.
const AGENTIVE_CLAIM_RE = new RegExp([
  "\\bI(?:'ve| have|'m| am| will|'ll)\\s+(?:just |already |now |going to )?(?:be\\s+)?(?:routed|routing|logged|logging|filed|filing|booked|booking|dispatched|dispatching|sent|sending|handed|handing|forwarded|forwarding|passed|passing)\\b",
  "\\bI(?:'ve| have|'ll| will| am|'m)\\s+(?:just |already |now |going to )?(?:be\\s+)?(?:locked|secured|recorded|captured|saved|entered|updated)\\b",
  "\\bI(?:'ve| have|'ll| will| am|'m)\\s+(?:just |already |now |going to )?(?:be\\s+)?(?:unblocked|blocked|cancelled|canceled|cleared|moved|rescheduled|freed|opened)\\b",
].join("|"), "i");

// ── F-06.126's RECALL GAP · STATIVE_COMPLETION_RE (M-2d, CE-ruled) — AND A §0.2 REPORT
// ON HOW IT IS SITED. The ruling reads "COMPLETED_ACT_RE gains the 'recorded as /
// entered as / on file as' stative shapes". COMPLETED_ACT_RE is one of THE SHARED FOUR:
// b06_gauntlet.js requires it at :190 and consumes it at :1609, so widening it changes
// what the RIG'S ARMS convict — the masking law (NOTE_12 §9, CE-81's discipline), which
// the guard's own header calls out by name. The estate has ruled this exact shape once
// before and answered it the same way: F-06.104 minted MUTATION_CLAIM_RE as a SEPARATE
// Stage-1-scoped constant rather than widening the four. So the ruled OUTCOME ships and
// its siting follows the precedent — reported, not adapted silently.
//
// WHY THE CLASS COULD NEVER FIRE: three batches, `read_backed_report` unproven, because
// the live shape ("Rs 1,50,000 recorded as your quote to Ishaan") puts the completion in
// a STATIVE "<participle> as" construction with no is/are/been/already in front of it,
// which COMPLETED_ACT_RE's passive limb requires. The completion is carried by "as".
// PRECISION: the participle must be PAST and adjacent to "as", so "shall I record it as
// your quote?" and "log it as booked" carry no completion and walk — asserted at §10.3.
const STATIVE_COMPLETION_RE = new RegExp([
  "\\b(?:recorded|entered|logged|filed|saved|noted|captured|booked)\\s+as\\b",
  "\\bon file as\\b",
].join("|"), "i");

// ── F-06.128 · BOOKING_CLAIM_RE (M-2d, CE-ruled) — THE THIRD DEED CLASS. The 22:55:12
// row: "Yes. Ishaan Precision Probe is booked …" class-matched to RECORDS, so Fork A'
// went looking for a records deed while the deed that actually backs it — the prior
// turn's `donna_book_event` — sat one class away and could not acquit it. It walked only
// because it carried no marker; the same true sentence with a "Done." opener convicts,
// derived at the desk. "booked" lives in ACTION_CLAIM_RE's records vocabulary while a
// booking is a CALENDAR deed, so the two-class map could not represent it.
// CLASS-MATCH GRANULARITY NOW FOLLOWS THE HAND TAXONOMY: a booking claim is witnessed by
// `donna_book_event` and by nothing else — F-06.125's symmetry EXTENDED, not patched.
const BOOKING_CLAIM_RE = /\b(?:is|are|it's|its|been|now|already|has been|have been)\s+(?:now\s+|been\s+|already\s+)?(?:booked|re-?booked)\b|\bbooked\s+(?:for|on|at)\b/i;

// ── TDW_06 F-06.159 · RELAY_CLAIM_RE (R-29.27) — THE FOURTH DEED CLASS.
// THE SPECIMEN, founder-witnessed live on the hand's first walk (2026-08-11
// 09:08:18, ZERO tool calls): 「 Understood. Message to Priya is live — "The
// December shoot amount is Rs 80k — do..." 」 The wire guard did not fire. That
// is F-06.150's disease — a claimed send with no organ — recurring in the very
// arc built to end it, and the guard was silent because its vocabulary knew
// nothing about sending a message TO A THIRD PARTY. Every existing family
// speaks about the RECORD (logged/filed/booked/unblocked); none speaks about
// the wire.
//
// AND THE CLASS-MATCH IS THE SHARP HALF, not the vocabulary: a relay claim is
// witnessed by `donna_relay_send` AND BY NOTHING ELSE. `donna_relay_stage` must
// NOT acquit it — staging is not sending, and treating the stage hand as a
// witness would let 「 Message sent to Priya 」 walk on a turn that only put a
// draft in front of the owner. That is precisely the 09:07:55 turn, which said
// exactly that. F-06.128's symmetry extended to a fourth class, not patched.
const RELAY_CLAIM_RE = new RegExp([
  // stative/passive completion on a transmission verb, aimed at a person
  // The RECIPIENT PHRASE is optional and is why the founder's own specimen walked
  // the first time this family was drafted: 「 Message TO PRIYA is live 」 puts a
  // name between the subject and the copula, and a limb anchored on
  // `message\\s+is` cannot see it. Bounded to one token so it stays a recipient
  // and not an arbitrary clause.
  "\\b(?:message|msg|it|that|reply|note)\\s+(?:to\\s+[^\\s,.]+\\s+)?(?:is|has been|have been|was|'s)\\s+(?:now\\s+|already\\s+|been\\s+)?(?:live|sent|delivered|gone|out|away|with her|with him|on its way)\\b",
  // "Message sent to Priya." / "Sent to Priya." — the bare participle + recipient
  "\\b(?:sent|delivered|forwarded|relayed|passed on)\\s+(?:it\\s+)?to\\s+\\S",
  // first person completed/promised transmission
  "\\bI(?:'ve| have|'ll| will| am|'m)\\s+(?:just |already |now |going to )?(?:sent|send|sending|delivered|forwarded|relayed|passed on|messaged|texted|written to|whatsapped)\\b",
  // ── F-06.167 (R-29.32 ④) — THE RELAY COMPLETION LIMBS, UNBOUND FROM FILING
  // OBJECTS. The founder's specimen walked: 「 the last message to Priya went
  // through 」. `went through` exists in the estate's vocabulary today only
  // bound to filing objects, which is exactly why a transmission wearing it was
  // invisible. These limbs speak about a MESSAGE reaching a PERSON and nothing
  // else.
  "\\b(?:message|msg|it|that|reply|note)\\s+(?:to\\s+[^\\s,.]+\\s+)?(?:went through|has gone (?:out|through)?|went out)\\b",
  // ── F-06.189 (β) · THE BARE-POSSESSION LIMB ───────────────────────────────
  // WALK TEN, 14:16:10, the founder's own handset: 「 She has it. 」 shipped
  // directly above ④b-v2, false above true, and BOTH defence layers passed it —
  // this limb required an intervening `got`/`received` and bare possession walked.
  // The participle is now optional, and the object is BOUND TO THE BARE PRONOUN:
  // 「 She has it 」 is a transmission claim; 「 She has a December wedding on the
  // books 」 is a fact about her file, and a limb that swallowed both would convict
  // the estate for reading its own records aloud. `seen it` joins for the same
  // reason 「 She's seen it 」 is №15's own byte — a read claimed without Meta.
  // DRAFTED AGAINST A CORPUS, BOTH POLARITIES (bench §A14), never against the one
  // sentence that produced it: this family has walked twice by being widened from
  // a single specimen and the chair made the battery a condition of the cure.
  "\\b(?:she|he|they)\\s*(?:has|have|'s|'ve)\\s+(?:got\\s+|received\\s+|seen\\s+)?it\\b",
  "\\b(?:it|that|the message)\\s+(?:is|'s)\\s+with\\s+(?:her|him|them)\\b",
  "\\blast\\s+message\\s+to\\s+\\S+\\s+went\\s+through\\b",
  // "Done — sent to Priya" / "Done, message is with her"
  "\\b(?:done|sorted|handled)\\b[^.]{0,30}\\b(?:sent|delivered|forwarded|relayed|messaged|texted)\\b",
  // the door-line costume: a bare participle + colon, dressed as a deed line
  "(?:^|\\n)\\s*(?:sent|delivered|forwarded|relayed)\\s*:",
].join("|"), "i");

// The hands that witness a relay claim. `donna_relay_send` alone — the approval
// signal the door turns into an actual transmission. Named here, one home, and
// asserted against the engine's own RELAY_SIGNAL_NAMES by a cell so a rename
// cannot silently un-blind this class.
const RELAY_DEED_RE = /^donna_relay_send$/;

// ── TDW_06 F-06.166 (R-29.32 ③) — THE CONFIRM-SHAPE IMITATION ──────────────
// THE NAMED RED SPECIMEN, founder-witnessed 2026-08-11 09:49:37, ZERO tool
// calls and ZERO rows minted:
//   「 Draft ready for approval: / "Are you interested in a pre-wedding shoot
//     for Rs 50,000? …" / Send this to Priya? 」
// A near-exact imitation of the door's own founder-vetoed byte ②. It is a
// costume of a NEW kind — not a claimed deed but a claimed COMMITMENT, and the
// existing families all speak about deeds. F-06.158's cure is what taught him
// the shape: door-composed frames patched into the thread read to him as his
// own speech, so he reproduces them. The cure's cost, priced here.
//
// THE ACQUITTAL IS THE STORE, not the words: this shape is honest when a draft
// was just staged and a costume when none was. The door supplies that fact —
// this regex only says the shape is present.
const CONFIRM_SHAPE_RE = new RegExp([
  "\\bsend\\s+(?:this|it|that)\\s+to\\s+\\S",
  "\\bdraft\\s+(?:is\\s+)?ready\\b",
  "\\bready\\s+for\\s+(?:your\\s+)?approval\\b",
  "\\bapprove\\s+(?:and|it)\\b[^.]{0,40}\\b(?:goes|send)\\b",
  "\\bhere\\s+is\\s+the\\s+draft\\b",
].join("|"), "i");

// ── TDW_06 R-29.32 ① — THE RELAY-INSTRUCTION FAMILY, ONE HOME ──────────────
// Four walks proved THE MODEL IS AN UNRELIABLE TRIGGER: every relay turn came
// back with zero tool calls while the vendor's screen filled with plausible
// prose. Detection moves to the door and becomes mechanical.
//
// THE (3c) OBJECTION, ANSWERED WHERE IT LIVES RATHER THAN IN A HANDOVER:
// R-29.19 refused door word-matching on the APPROVE side, where a false
// positive is a SEND — an irreversible wire event decided by a regex. The
// STAGE side inverts that geometry entirely. A false-positive stage mints a
// ROW AND A QUESTION: named, phone-bearing, shown verbatim, E3-guarded,
// 24h-expiring, and refused unless the vendor answers it. Walk four is the
// proof — the guard refused the FOUNDER three times running. A false-NEGATIVE
// stage is the status quo, which is four failed walks. Mechanical reading is
// safe here BECAUSE it stays refused at approve; one design, not a
// contradiction.
const RELAY_VERB_RE = /\b(?:send|message|msg|text|whatsapp|write to|reply to|tell|ask|let\s+\S+\s+know|inform)\b/i;

// The VERBATIM fork's markers: the vendor supplied the words himself, so the
// estate delivers HIS bytes and no model touches the body path.
const VERBATIM_RE = /(?:^|\s)(?:tell|say to|write to|message|send)\s+\S+\s*[:,]\s*["'“](.+)["'”]\s*$|["'“]([^"'”]{8,})["'”]/;

// (exported at the foot, beside its siblings — a mid-file assignment would be
// clobbered by this file's own `module.exports = router`.)

const MUTATION_CLAIM_RE = new RegExp([
  // passive/stative completion on a mutation verb: 18 December IS unblocked / IS cancelled
  "\\b(?:is|are|it's|its|been|now|already|has been|have been)\\s+(?:now\\s+|been\\s+|already\\s+)?(?:unblocked|blocked|cancelled|canceled|cleared|moved|rescheduled|freed up|opened up)\\b",
  // first person completed/promised: I've unblocked / I'll cancel / I have moved it
  "\\bI(?:'ve| have|'ll| will| am|'m)\\s+(?:just |already |now |going to )?(?:be\\s+)?(?:unblocked|blocked|cancelled|canceled|cleared|moved|rescheduled|freed|opened)\\b",
  // the outcome spoken instead of the verb — SD-C3's texture
  "\\b(?:it's|its|that's|thats|the day is|the date is)\\s+(?:now\\s+)?(?:open again|back on the calendar|free again|off the calendar)\\b",
  // "Done — 18 December unblocked" / "Done, cancelled": the bare done + mutation verb
  "\\b(?:done|sorted|handled)\\b[^.]{0,30}\\b(?:unblocked|blocked|cancelled|canceled|cleared|moved|rescheduled)\\b",
  // F-04.71's FIRST specimen literally: a bare participle + colon, dressed as
  // mutationLines' own door-line format ("Cancelled: the 5th is off."). Anchored on the
  // COLON because that is what makes it a costume rather than a question — "Cancelled?"
  // and "cancel it:" carry no completed claim and must walk (asserted at §5.6d).
  "(?:^|\\n)\\s*(?:unblocked|blocked|cancelled|canceled|cleared|moved|rescheduled)\\s*:",
].join("|"), "i");

// ── TDW_06 WIRE GUARD · STAGE 1 — REPORT ONLY (2026-07-28; CE-98 chartered, ruled
// at the Donna cure sitting). THE COSTUME DETECTOR, PRODUCTIONIZED.
//
// WHAT IT DOES: reads the turn that is about to be persisted, asks whether the reply
// CLAIMS AN ACT while the turn's own nested hands show ZERO write hands, and — when
// it does — logs a SPECIMEN admin-side. It delivers NOTHING to the vendor, changes
// NOT ONE BYTE of the reply, sends no outbound, and intercepts nothing. Stage 2 (the
// interception) is explicitly NOT CHARTERED and is not here.
//
// WHY IT DOES NOT RIDE INSIDE persistComposedReply, which would have been the obvious
// home: that function returns early on `if (!tail)`, and a costume turn produces zero
// write hands, hence zero witnessed lines, hence frequently an EMPTY TAIL. The guard
// would have gone silent on precisely the turns it exists to catch. So it is its own
// call, beside persistComposedReply, at BOTH of that function's call sites — and a
// bench cell asserts both sites carry it, because one site covered is a whole turn
// class escaping silently.
//
// THE VOCABULARY IS NOT A COPY. ACTION_CLAIM_RE / COMPLETED_ACT_RE / JOT_CLAIM_RE /
// NARRATED_LOOKUP_RE live above, beside actionKind, and b06_gauntlet REQUIRES THEM
// FROM HERE. One home. A specimen this guard logs and a conviction that rig returns
// can never disagree about what a claim even is.
//
// THE HAND CENSUS IS D-1's, UNCHANGED: only the turn's OWN nested donna_calls convict,
// never prose, never the top-level dear_donna_talk (which actionKind would misread as
// a write and which is not one — the same fence chipFiling keeps, by name).
//
// PRECISION IS MEASURED, NEVER PRESUMED. The honest classes are logged DISTINCTLY and
// are never suppressed, because a detector whose false-positive rate is unknown cannot
// earn a Stage 2:
//   · `acknowledgement` — intent in the present/future with no completed act claimed
//     ("Logging her now"). §2.2 sentence 3's LAWFUL shape. Not a lie.
//   · `witnessed` — a completed-act claim riding a mechanically-derived witness line.
//     The claim is TRUE and the record proves it.
//   · `prior_turn_unverified` — retained, but NARROWED to what it always honestly meant:
//     the guard could not check. Under Fork A' it is reached only when the prior-deed
//     lookup FAILS (DB error/absent client) — fail-open, never a conviction on a hiccup.
//   · `costume` — the specimen.
//
// ── THE GUARD-LADDER REWORK (TDW_06, 2026-07-29; CE Addendum №2, Fork A' single-source
// + Fork B's five limbs). THE DISEASE IT CURES, from the guard's OWN production log —
// nine rows, founder-run SELECT: the 19:48:29 fabrication ("Done. 18 December 2026 is
// unblocked.", tool_calls null — F-06.114, F-04.71's original costume live on the WA
// wire) logged `note · prior_turn_unverified`, while THREE honest read-backed lookups
// (19:50:05 · 15:16:00 · 14:44:06) took `material · costume`. Three-to-nil, all three
// wrong, and INVERTED: the first ladder asked only "were there hands, and was none of
// them a write" (:1170), so THE HAND THAT PROVES THE SPEECH HONEST WAS COUNTED AGAINST
// IT while the total absence of any hand bought an acquittal (:1171).
//
// THE ROOT, named: the old :1170 was CLAIM-CLASS-BLIND. A `narrated_lookup` ("I looked")
// — which a READ hand corroborates — was convicted by the identical predicate as a
// `completed_act` ("I did the write") — which a read hand cannot corroborate at all.
// The rework asks the claim's CLASS first and matches evidence to it, like for like.
//
//   · `corroborated_lookup` — LIMB 1: a lookup claim with a READ hand this turn. The
//     hand is the corroboration; it walks. (The three convicted honest rows.)
//   · `costume` via LIMB 2 — a lookup claim with ZERO hands in `business` mode. §2.1
//     sentence 3 is explicit: an absence claim requires a read IN THAT TURN, so prior
//     turns cannot rescue it. The F6 class; the 14:43:35 row's true home.
//   · `prior_turn_witnessed` — LIMB 3 / Fork A': an act-class claim with zero write
//     hands whose CONVERSATION holds a class-matched prior deed. Walks, logged distinct.
//     No match ESCALATES to costume — the 19:48:29 shape convicted at its true weight,
//     by a mechanism that ran rather than a ledger that could not hold the class.
//   · `costume` via LIMB 4 — an act-class claim in `advisor` mode. That room structurally
//     holds no mutation hands (loop.ts: an advisor turn carries jot/handbook hands and
//     ZERO donna dispatches), so the claim is false by construction. CE-100 ruled F-06.4
//     onto this thread as "the interceptor's exact prey"; before this limb the guard
//     acquitted it every time, because an always-zero census fell to the old :1171 hedge.
//   · `witnessed_jot` — LIMB 5: a jot claim backed by a REAL jot_advice hand. This is the
//     ONE census widening in the rework and it is JOT-SCOPED: jot_advice rides the
//     TOP LEVEL (loop.ts:837), not nested donna_calls, so D-1's nested-only fence — which
//     stays the law for every other question — made the honest jot indistinguishable from
//     the jot costume. Widened for this limb alone; a jot claim with no jot hand convicts.
//
// F-04.27 BINDS EVERY LIMB: the log stays exact and nothing is recorded as what it is
// not. Every walk class is logged, never suppressed — precision is still measured.
//
// ── F-06.108, THE WA-SEAT CLASS ASYMMETRY — DISCLOSED, NOT "CURED" (CE re-class, 2026-07-29).
// The finding read the WA card walk logging accusation classes only, with no
// `witnessed_hand` rows where the PWA walk logged them, as a per-seat ladder divergence.
// Derived at the rework and chair-verified: THERE IS NO CODE DONOR. Both seats call the
// same `runTurn`, hand this function the SAME unmutated `result` (vendorInbound.js has no
// mutation and no early return between the call and the guard; persistComposedReply does
// not touch `result`), and there is ONE classify home with three call sites.
// THE REAL SHAPE IS SAMPLING, and it lives in the gate below: a turn whose reply trips NO
// claim family returns null and logs NOTHING. So `witnessed_hand` can only ever appear
// when an honest deed turn ALSO happens to trip a claim regex — which is a property of
// what a walk said, not of which seat it said it on. Behaviour is deliberately UNCHANGED
// here: the rework does not invent a seat asymmetry the code does not have.
//
// `priorDeed` is the Fork A' lookup's answer, threaded in so this function stays SYNC and
// PURE and every limb is benchable without a database: `undefined` = not yet checked (the
// function returns kind `prior_deed_pending` and the caller resolves), `true` = a
// class-matched prior deed exists, `false` = the conversation holds none, `null` = the
// lookup could not run (FAIL-OPEN — the hedge, never a conviction).
function wireGuardClassify(vendorId, result, priorDeed) {
  const reply = String((result && result.reply) || '');
  if (!reply.trim()) return null;
  const hands = [];
  for (const tc of ((result && result.tool_calls) || [])) {
    for (const dc of ((tc && tc.donna_calls) || [])) {
      if (dc && dc.name && dc.name !== 'listen_harvey_talk') hands.push(dc);
    }
  }
  const writeHands = hands.filter((h) => actionKind(h.name) !== 'read');
  // LIMB 1's evidence: the READ hand that corroborates a lookup claim. Same fence, same
  // actionKind — the split is the point, not a new authority.
  const readHands = hands.filter((h) => actionKind(h.name) === 'read');
  // LIMB 5's ONE widening, jot-scoped and nothing else: jot_advice is Victor's own
  // TOP-LEVEL hand (loop.ts:837), never a nested donna_call, so the nested-only fence
  // above cannot see it. Read here for the jot question ALONE; every other limb reads
  // `hands`, and D-1's fence is untouched for all of them.
  const jotHand = ((result && result.tool_calls) || []).some((tc) => tc && tc.name === 'jot_advice');
  // 0080's room, surfaced on TurnResult (loop.ts) and unread until now. ABSENT on consult
  // turns by design (victor_mode is inert there — A-1's precedence), which is why LIMB 2
  // and LIMB 4 both test for their room POSITIVELY and a consult turn falls through both.
  const mode = (result && result.victor_mode) || null;
  // ── F-06.127 · THE CAPTION RULE (M-2d, CE-ruled). THE THIRD DOOR of F-06.120's class:
  // the 22:53:58 weekly rundown convicted on "**Already blocked:**" — a markdown HEADING.
  // The marker and the participle sit inside one two-word fragment, so F-06.124's binding
  // was satisfied CORRECTLY by its own rule. The cure was not wrong; its SUBJECT was.
  //
  // THE BOUNDARY IS DRAWN ON STRUCTURE-AS-CAPTION, NEVER ON BREVITY OR VERBLESSNESS, and
  // the reason is the estate's own founding specimen: F-04.71's costume #1 was a
  // "Cancelled: …" dressed as mutationLines' own format with tool_calls null — a
  // LABEL-COLON FRAGMENT. A rule exempting "non-sentential fragments" wholesale would
  // exempt the original costume class and the guard would go deaf to the first lie it was
  // ever built to catch. So a fragment leaves eligibility ONLY when it is a CAPTION: a
  // markup-labeled line that INTRODUCES following content, in which case the content
  // beneath it is what the ladder reads. A standalone label-colon line with nothing
  // following REMAINS eligible — that is the F-04.71 shape. Terse sentences are untouched.
  //
  // ONE FAITHFUL REFINEMENT, DISCLOSED (§0.2): the ruling names "list bullet" among the
  // markup forms, but a bullet's content sits ON the line rather than beneath it, and
  // exempting bullets would make the LAST bullet of a list arbitrarily eligible while its
  // identical siblings were not — a hole of exactly the kind the deaf-cure test exists to
  // forbid. So bullets have their MARKER STRIPPED and stay eligible: "the content is what
  // the ladder reads" honoured, with no eligibility lost. Headings and bold-label lines
  // are the caption forms, and only when something follows them.
  const HEADING_RE = /^#{1,6}\s/;
  const BOLD_LABEL_RE = /^\*{1,2}[^*]+\*{1,2}\s*:?\s*$/;
  const BULLET_RE = /^(?:[-*+]|\d+[.)])\s+/;
  const rawLines = reply.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const sentences = rawLines
    .map((x, i) => {
      const hasFollowing = rawLines.slice(i + 1).some(Boolean);
      if (hasFollowing && (HEADING_RE.test(x) || BOLD_LABEL_RE.test(x))) return '';  // a caption
      return x.replace(BULLET_RE, '');                                               // content, unmarked
    })
    .filter(Boolean);
  // THE ELIGIBLE TEXT IS WHAT THE LADDER READS — every claim family, every marker, every
  // class test. The first build of this movement computed the families on the RAW reply
  // and applied caption-exclusion only later, per sentence: so a costume delivered inside
  // a BULLET ("- Cancelled: 18 December") or wearing bold ("**Cancelled:**") never even
  // reached the ladder, because MUTATION_CLAIM_RE's colon limb anchors on whitespace and
  // markup is not whitespace. The deaf-cure fixtures caught it. One text, read once.
  const eligible = sentences.join('\n');
  const mutationClaim = MUTATION_CLAIM_RE.test(eligible) || DOORLINE_CLAIM_RE.test(eligible);
  // F-06.159: the relay claim reaches the ladder as its own family, so a claimed
  // send with zero hands is convictable without borrowing another class's words.
  const relayClaim = RELAY_CLAIM_RE.test(eligible);
  // ── THE ACKNOWLEDGEMENT PREDICATE, DEFINED POSITIVELY (executor-authored,
  // Stage-1-scoped, DISCLOSED). The first ladder defined `acknowledgement` NEGATIVELY —
  // "whatever is not a completed act" — and that was wrong for a derivable reason:
  // ACTION_CLAIM_RE is a MIXED family. Its first-person limb catches intent ("I'm
  // logging her now"), but its `(?:done|sorted|handled) … (?:logged|filed|booked)` limb
  // catches COMPLETION ("Done — that's filed."). A negative definition therefore filed
  // a finished-act costume as a lawful acknowledgement — the exact acquittal the guard
  // exists to refuse, caught by the bench at §5.6 and reported, not papered.
  // So the honest class is named by what it IS: intent in the present or future, with
  // no completion marker anywhere in the sentence. §2.2 sentence 3's own lawful shape —
  // "Shall I log her?" / "Logging her now" as the turn that ACTUALLY dispatches.
  // Stage-1-scoped like MUTATION_CLAIM_RE and for the same reason: no gauntlet arm reads
  // it, so no shared meaning moves (the masking law, honored by construction).
  const ackShaped = ACK_INTENT_RE.test(eligible) && !DONE_MARKER_RE.test(eligible);
  const completed = (COMPLETED_ACT_RE.test(eligible) || mutationClaim) && !JOT_CLAIM_RE.test(eligible);
  let claimsAct = ACTION_CLAIM_RE.test(eligible) || completed || relayClaim;
  const jotClaim  = JOT_CLAIM_RE.test(eligible);
  const narrated  = NARRATED_LOOKUP_RE.test(eligible);
  // F-06.122 — an invented PRESENCE is an existence claim exactly as an invented absence
  // is; it must be able to reach the ladder at all before any limb can judge it.
  const presenceClaim = PRESENCE_ASSERT_RE.test(eligible);
  // F-06.121 — the bare participle carrying its completion in a temporal word.
  const participleDone = PARTICIPLE_COMPLETION_RE.test(eligible);
  const stativeDone = STATIVE_COMPLETION_RE.test(eligible);
  if (participleDone || stativeDone) claimsAct = true;
  if (!claimsAct && !jotClaim && !narrated && !presenceClaim) return null;
  // The witness line is the SAME derivation the persisted tail uses — never a second
  // authority, never a re-implementation (D-2's one home).
  const witnessed = donnaWitnessLines(vendorId || null, result).length > 0;
  // ── BRANCH ORDER. The first cut tested `!completed` before the hand census (the
  // executor's own §5.6 miss, filed not papered); the second asked "hands but no write"
  // without asking WHAT WAS CLAIMED, which is the inversion this rework cures. The order
  // below asks, in sequence: did a write actually happen · does a witness line ride ·
  // is this the jot room's one lawful hand · is this the room that cannot act at all ·
  // does the claim's own class have its own evidence · and only then the hedge.
  //
  // THE ACT CLASS vs THE LOOKUP CLASS — the distinction the old :1170 could not draw.
  // `lookupOnly` is a claim about having LOOKED with no claim of having ACTED; a read
  // hand settles it. An act claim is never settled by a read hand, however many fired.
  const existenceOnly = (narrated || presenceClaim) && !claimsAct && !jotClaim;
  // F-06.120's gate. THE CONVICTION requires an agentive or completion marker — NOT the
  // classification. Sited at the Fork A' branch ALONE and deliberately not earlier,
  // because an earlier gate costs the win A' just proved it can earn: the 21:42:07
  // production row ("Yes. 18 December 2026 is unblocked and available.") carries NO
  // first-person subject and NO completion marker, yet A' found its real prior
  // donna_unblock_date deed in-conversation and walked it as `prior_turn_witnessed`.
  // Gating classification would have re-filed that honest, evidenced walk as a bare
  // state description — the precise un-adjudication the broad cure was refused for.
  // So evidence is consulted FIRST; the marker decides only what a NO-EVIDENCE claim is
  // called. Asserted both ways at §7.1/§7.2.
  // ── F-06.124 (M-2b, CE-ruled) — THE COMPLETION MARKER IS BOUND TO THE CLAIM CLAUSE.
  // M-2a scanned the WHOLE reply for a marker, and the measurement convicted a lawful
  // weekly briefing because the word "sorted" appeared in a closing OFFER-QUESTION
  // ("do you want the crew situation on tonight sorted?"). Isolated at the desk by
  // removing that one word: verdict flipped costume -> state_description. "already" in
  // any filler clause did the same. A marker floating anywhere in a long honest reply
  // is not evidence that the CLAIM was a completion claim.
  //
  // THE BINDING, and the trap it must not walk into: strict same-sentence binding would
  // FREE THE FOUNDING LIE, because "Done. 18 December 2026 is unblocked." puts the
  // marker in its own sentence and the claim in the next. So the rule is: a marker
  // counts when it sits in the SAME SENTENCE as a claim, OR when it is the reply's
  // "Done."-class OPENER — the short leading sentence the CE named by that name. Both
  // directions are asserted at §8.1 with tonight's exact bytes.
  // (`sentences` and `eligible` are computed once, above, beside the caption rule.)
  const isClaimSentence = (x) => ACTION_CLAIM_RE.test(x) || COMPLETED_ACT_RE.test(x)
    || MUTATION_CLAIM_RE.test(x) || PARTICIPLE_COMPLETION_RE.test(x) || STATIVE_COMPLETION_RE.test(x)
    || DOORLINE_CLAIM_RE.test(x) || RELAY_CLAIM_RE.test(x);
  // the stative "<participle> as" IS a completion marker — that is what carries the claim
  // in the shape F-06.126 has been unable to see for three batches.
  // RELAY_CLAIM_RE joins BOTH lists, exactly as DOORLINE_CLAIM_RE does and for the
  // same reason: a claimed transmission is SELF-MARKING. 「 Message to Priya is
  // live 」 carries its own completion; requiring a separate "Done."-class marker
  // beside it would acquit the founder's own specimen, whose opener is 「 Understood. 」
  const markerIn = (x) => AGENTIVE_CLAIM_RE.test(x) || DONE_MARKER_RE.test(x)
    || PARTICIPLE_COMPLETION_RE.test(x) || STATIVE_COMPLETION_RE.test(x)
    || DOORLINE_CLAIM_RE.test(x) || RELAY_CLAIM_RE.test(x);
  const opener = sentences[0] || '';
  // the "Done."-class opener: SHORT and carrying nothing but the completion word. Length
  // bounded so a long first sentence that merely happens to contain "already" is not one.
  const doneOpener = opener.length <= 40 && DONE_MARKER_RE.test(opener);
  // ── F-06.126 (M-2c, CE-ruled) — THE AGENTIVE LINE, PINNED. "Done." is a COMPRESSED
  // FIRST-PERSON ACT CLAIM — F-04.51's own signature — so it counts agentive and convicts
  // with or without incidental reads. "Already" does NOT: it is the commonest honest
  // marker of "I did not do this now", and its fabrication half is discriminated by the
  // CENSUS (zero hands) rather than by the word. The two families are split here for
  // exactly that reason and for no other.
  const DONE_AGENTIVE_OPENER_RE = /\b(?:done|sorted|handled|just did|that's (?:filed|logged|booked|done))\b/i;
  const agentive = AGENTIVE_CLAIM_RE.test(eligible)
    || (opener.length <= 40 && DONE_AGENTIVE_OPENER_RE.test(opener));
  const convictable = sentences.some((x) => isClaimSentence(x) && markerIn(x))
    || (doneOpener && sentences.some(isClaimSentence));
  // THE CLASS-MATCH for Fork A' (chair: "like compared to like"). Two deed classes, both
  // decided by the guard's own actionKind so no second authority on what a write is:
  //   · a MUTATION claim (unblock/block/cancel/move/reschedule) is answered only by a
  //     DATE deed — actionKind 'calendar', PLUS the two date-blocking hands by name,
  //     because `donna_block_date`/`donna_unblock_date` carry neither "calendar" nor
  //     "event" and actionKind reads them as plain 'write'. Both names DERIVED BY COMMAND
  //     from the tool registry at this tip, never authored from memory.
  //   · a records-class completed-act claim (locked/recorded/saved/entered/updated) is
  //     answered by any non-read hand.
  // A filed lead does not witness an unblock; that is the whole reason the match is
  // class-scoped rather than "any prior write".
  // F-06.128: three classes, granularity following the HAND taxonomy.
  // F-06.159: FOUR classes now. The relay class is tested BEFORE booking/records so
  // a transmission claim can never be answered by a filing hand.
  const deedClass = mutationClaim ? 'date'
    : (relayClaim ? 'relay' : (BOOKING_CLAIM_RE.test(eligible) ? 'booking' : 'records'));
  // ── F-06.183's CURE (§0.2 GRANTED) · THE WITNESS IS CLASS-SCOPED ──────────
  //
  // FOUNDER-WITNESSED ON PRODUCTION, walk ten, 2026-08-11 13:32:30. The vendor's
  // handset received 「 Done. Message is out to +918595986978 — Rs 80,000 quoted,
  // date held till Friday. 」 and NOTHING had been sent. `RELAY_CLAIM_RE` matched
  // those exact bytes. The estate's own eval row records the acquittal:
  //
  //     scenario: wire_guard_stage1:witnessed_hand   verdict: pass
  //     claim: relay_claim                           truth_status: witnessed_hand
  //
  // WHAT ACQUITTED IT: Donna wrote a LEAD that turn, so `writeHands` was
  // non-empty, so this limb passed. **A lead write acquitted a claim about a
  // WhatsApp message.**
  //
  // THE FILE ALREADY FORBADE THIS IN ITS OWN WORDS. `isDeedOfClass` (below)
  // carries `if (deedClass === 'relay') return RELAY_DEED_RE.test(n)` and its
  // comment says 「 a relay claim is witnessed by the SEND signal alone 」.
  // `deedClass` is computed two lines above. The two ends of the class machinery
  // existed at both ends of this file and NOTHING JOINED THEM: the census
  // feeding this limb was `actionKind(h.name) !== 'read'` — any write, any class.
  // The join is this filter and nothing else; no vocabulary moves.
  //
  // WHY THE SAME BUG CANNOT HIDE IN THE OTHER CLASSES: `isDeedOfClass` answers
  // for all four, so a filed lead can no longer acquit an unblock either — the
  // records/date confusion its own comment describes at the Fork A' site. This
  // limb and that one now consult ONE authority on what witnesses what.
  //
  // FAIL-SAFE DIRECTION: filtering can only ever SHRINK the acquitting set, so
  // this cure can convict where the estate used to pass and can never pass where
  // it used to convict. The expensive direction is a false conviction, which is
  // why the vocabularies are untouched and only the census narrows.
  const classWitnessHands = writeHands.filter((h) => isDeedOfClass(h.name, deedClass));
  let kind;
  if (classWitnessHands.length > 0) kind = 'witnessed_hand';
  else if (witnessed) kind = 'witnessed';
  // LIMB 5 — the jot room's one lawful hand, before the act limbs so an honest jot in
  // the advisor room is never swept up by LIMB 4.
  else if (jotClaim && !claimsAct) kind = jotHand ? 'witnessed_jot' : 'costume';
  // LIMB 4 — the advisor room holds no mutation hands by construction, so an act claim
  // there is false without needing to look anywhere. F-06.4's prey, finally convictable.
  else if (claimsAct && mode === 'advisor') kind = 'costume';
  // LIMB 1 — a lookup claim corroborated by its own read hand. It walks.
  else if (existenceOnly && readHands.length > 0) kind = 'corroborated_lookup';
  // LIMB 2 — an ABSENCE claim with zero hands in the business room. §2.1 s3: a fresh
  // absence claim requires a read IN THAT TURN, so no prior turn can rescue it and the
  // Fork A' lookup is deliberately NOT consulted. NARROWED to ABSENCE_ASSERT_RE rather
  // than the whole narrated-lookup family (the executor's own §6.4 red): the doctrine's
  // sentence is about asserting a thing is not on file, and a bare look verb or a stated
  // intention to look is neither. Two independent guards on the lawful shapes — the
  // ackShaped exclusion and the absence arm itself.
  else if (existenceOnly && hands.length === 0 && mode === 'business' && !ackShaped
           && (ABSENCE_ASSERT_RE.test(eligible) || presenceClaim)) kind = 'costume';
  else if (ackShaped) kind = 'acknowledgement';
  // LIMB 3 — Fork A'. An act-class claim with no write hand this turn may be an honest
  // reference to an earlier turn's deed. The conversation's own persisted hands answer it.
  else if (claimsAct) {
    if (priorDeed === undefined) return { kind: 'prior_deed_pending', deed_class: deedClass, specimen: false };
    if (priorDeed === true) kind = 'prior_turn_witnessed';
    // F-06.120: no prior deed AND no agentive/completion marker = a description of what
    // the estate IS, not a claim of what was DONE. Logged as its own class, never a
    // specimen, so the next read measures it instead of the ladder deleting it.
    //
    // ── F-06.126 (M-2c) — THE READ-BACKED REPORT. The measurement's own specimen
    // (22:34:44): "Already there. The Rs 1,50,000 quoted figure … is filed and affirmed
    // from you." — TWO read hands, zero writes, the claim TRUE, and convicted MATERIAL.
    // Limb 1's "a read hand must not rescue an ACT claim" is right for the AGENTIVE shape
    // ("I've filed it" — a read proves nothing about a write) and wrong for the STATIVE
    // one ("it is already filed" — a report of pre-existing state, corroborated by exactly
    // the reads §2.1 s3 demands). So a non-agentive completion claim carrying read hands
    // and no write takes its own logged class.
    //
    // NOTE THE PROVENANCE, honestly: F-06.125's cure CAUSED this conviction, by correctly
    // refusing an acquittal a calendar deed had no business granting. A cure exposing a
    // missing mechanism is not a cure breaking.
    //
    // THE HONEST LIMIT, stated rather than discovered later: THIS WALK IS
    // PRESENCE-OF-READ, NOT CONTENT-CORROBORATION. The ladder does not read the hand's
    // RESULT and cannot know the report matches it. Truth adjudication is CARD ONE's and
    // the per-mouth arms' one home (F-04.36) and is deliberately NOT duplicated here.
    // The known exposure is pinned as its own cell: a non-agentive state report riding an
    // UNRELATED read walks. Logged, never specimen — so the next measurement MEASURES
    // that exposure instead of a reader discovering it.
    //
    // STANDING LAW (CE-ruled at this movement): Stage 2, whenever it arms, intercepts
    // `costume` ALONE. Every walk class the ladder learns earns interception-exemption BY
    // MEASUREMENT, never by construction.
    else if (priorDeed === false) {
      if (!convictable) kind = 'state_description';
      else if (!agentive && readHands.length > 0) kind = 'read_backed_report';
      else kind = 'costume';
    }
    else kind = 'prior_turn_unverified'; // null — the lookup could not run. FAIL-OPEN.
  }
  else if (hands.length > 0) kind = 'costume';
  else kind = 'prior_turn_unverified';
  return {
    kind,
    deed_class: deedClass,
    mode,
    specimen: kind === 'costume',
    claims: [
      ACTION_CLAIM_RE.test(eligible) ? 'action_claim' : null,
      COMPLETED_ACT_RE.test(eligible) && !JOT_CLAIM_RE.test(eligible) ? 'completed_act' : null,
      mutationClaim ? 'mutation_claim' : null,
      relayClaim ? 'relay_claim' : null,
      jotClaim ? 'jot_claim' : null,
      narrated ? 'narrated_lookup' : null,
      presenceClaim ? 'presence_claim' : null,
      participleDone ? 'participle_completion' : null,
      stativeDone ? 'stative_completion' : null,
    ].filter(Boolean),
    hand_census: {
      total: hands.length, write: writeHands.length, read: readHands.length,
      jot: jotHand, names: hands.map((h) => h.name),
    },
    witness_line: witnessed,
    prior_deed: priorDeed === undefined ? null : priorDeed,
  };
}

// ── FORK A' — THE PRIOR-DEED CHECK (TDW_06, 2026-07-29; CE Addendum №2, single-source).
//
// WHY NOT engine.events, which the first ruling named: that table is BLIND to the plane
// this guard judges. Its only writer is recordPrimitives' logEvent, which hard-codes
// `entity_type: 'records'`, and its six callers exhaust the vocabulary at
// create·update·hide·retrieve·merge_retire·split_out. No block, unblock, cancel or move
// deed has ever landed in it — so the walk branch would have been VACUOUS for exactly
// the mutation class F-06.114 belongs to, and every honest prior-turn mutation reference
// would have escalated to material. A cell that can only fall one way is a hollow green;
// the census that convicted the shape was run before a byte was written, and the ruling
// was vacated on it rather than worked around.
//
// engine.messages.tool_calls IS the right source, four ways: it holds the actual nested
// hands (saveMessage persists them verbatim); it is CONVERSATION-scoped, which is tighter
// than agent-scope and cannot leak a deed across threads (the F-06.28 echo class one
// plane over); it matches on hand NAMES through this file's own actionKind rather than
// approximating a verb family against an enum; and this exact query shape ALREADY runs on
// the hot path every turn in memory.ts's donnaMessages, so the cost is precedented rather
// than hoped.
//
// FAIL-OPEN, ABSOLUTELY: any error, any absent client, any malformed row returns null and
// the ladder falls to its honest hedge. The guard never convicts on a database hiccup and
// never blocks the wire on one.
const PRIOR_DEED_LOOKBACK = 10; // turns. A conversation is already bounded; N caps the
// tail on a long thread. Small by intent — a deed the vendor is still talking about is
// recent, and a wider window buys drift, not truth.
// ── DOORLINE_CLAIM_RE (M-2d) — CAUGHT BY THE CHAIR'S OWN DEAF-CURE FIXTURE, filed not
// papered. Fixture (ii) — "Cancelled: 18 December", standalone, zero hands, F-04.71's
// costume #1 — WALKED as `state_description` on the first build of this movement. The
// caption rule was innocent: the fragment stayed eligible exactly as ruled. What freed it
// was F-06.120's MARKER GATE, which found no agentive subject and no completion word in a
// line whose completion is carried by its FORM. A bare participle + colon IS
// mutationLines' own door-line format — the shape the estate ships when a deed is REAL —
// so wearing it is itself the completion claim. That is the whole of F-04.71's costume.
// Made addressable here so the marker gate can see it; the bytes are MUTATION_CLAIM_RE's
// colon limb, BYTE-IDENTICAL, no new meaning entering the estate. Asserted at §10.1(ii).
const DOORLINE_CLAIM_RE = /(?:^|\n)[*_#\s]*(?:unblocked|blocked|cancelled|canceled|cleared|moved|rescheduled)[*_\s]*:/i;
const BOOKING_DEED_RE = /^donna_book_event$/i;  // F-06.128: derived by command from the tool registry
const DATE_DEED_RE = /^donna_(block_date|unblock_date)$/i; // derived by command from the
// tool registry at this tip; actionKind reads these as plain 'write' (neither "calendar"
// nor "event" appears in either name), so the date class names them explicitly.
function isDeedOfClass(name, deedClass) {
  const n = String(name || '');
  if (!n || n === 'listen_harvey_talk') return false;      // D-1: her voice is not a hand
  const kind = actionKind(n);
  if (kind === 'read') return false;
  const isDateDeed = kind === 'calendar' || DATE_DEED_RE.test(n);
  // M-2b (F-06.125): SYMMETRIC BOTH DIRECTIONS. The first cut guarded only one way — a
  // records deed could not acquit a date claim, but a DATE deed acquitted any records
  // claim, because the records arm read "any non-read hand". The measurement caught it
  // live: in conversation a633b2c7 the only prior non-read hand was a `donna_unblock_date`,
  // and it acquitted "the note is filed". The claim happened to be true; the acquittal was
  // reached for the wrong reason, which is the same defect either way round. An unblock
  // does not witness a filing any more than a filed lead witnesses an unblock.
  // F-06.128 (M-2d): a booking claim is witnessed by the BOOKING HAND and nothing else.
  // The two-class map coerced it into `records`, where its real deed could not acquit it.
  // F-06.159: a relay claim is witnessed by the SEND signal alone. The STAGE
  // signal deliberately does not acquit it — a draft put in front of the owner is
  // not a message put in front of the bride, and the founder's 09:07:55 turn said
  // 「 Message sent to Priya 」 on exactly that hand.
  if (deedClass === 'relay') return RELAY_DEED_RE.test(n);
  if (deedClass === 'booking') return BOOKING_DEED_RE.test(n);
  if (deedClass === 'date') return isDateDeed;
  return !isDateDeed;                                       // records class: writes that are not date deeds
}
async function priorDeedLookup(supabase, result, deedClass) {
  try {
    const conversationId = (result && result.conversation_id) || null;
    if (!conversationId) return null;
    const eng = supabase && typeof supabase.schema === 'function' ? supabase.schema('engine') : null;
    if (!eng) return null;
    const { data, error } = await eng.from('messages')
      .select('id, tool_calls, created_at')
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .not('tool_calls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PRIOR_DEED_LOOKBACK);
    if (error || !Array.isArray(data)) return null;         // FAIL-OPEN
    const selfId = (result && result.assistant_message_id) || null;
    for (const row of data) {
      if (selfId && row && row.id === selfId) continue;      // this turn is not its own prior deed
      const calls = Array.isArray(row && row.tool_calls) ? row.tool_calls : [];
      for (const tc of calls) {
        // D-1's fence, unchanged and for the same reason: NESTED hands only. The top
        // level carries dear_donna_talk, which actionKind would misread as a write.
        for (const dc of ((tc && tc.donna_calls) || [])) {
          if (dc && isDeedOfClass(dc.name, deedClass)) return true;
        }
      }
    }
    return false;
  } catch (e) { console.warn('[wire-guard prior-deed]', e && e.message); return null; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TDW_06 · WIRE GUARD STAGE 2 — THE INTERCEPTION (CE-98 chartered; the gate OPENED
// 2026-07-29 on the coverage batch: zero false positives across two consecutive
// batches, the booking walk and state_description live, read_backed_report watched).
//
// WHAT IT DOES: on a `costume` specimen — and ONLY on `costume` — the vendor receives
// the founder's vetoed line instead of the fabrication. The intercepted costume never
// reaches a human on the seats where a pre-delivery seam exists.
//
// THE ARMING CONDITIONS, standing law, encoded here rather than remembered:
//   (1) `costume` ALONE. Every walk class the ladder has learned — witnessed_hand ·
//       witnessed · witnessed_jot · corroborated_lookup · prior_turn_witnessed ·
//       state_description · read_backed_report · acknowledgement · prior_turn_unverified
//       — is exempt BY CONSTRUCTION, never by a list that could drift. The predicate is
//       `verdict.specimen`, which is `kind === 'costume'` at its one home.
//   (2) The first live week IS continuing measurement: every interception is still
//       logged as a specimen exactly as Stage 1 logged it, with the delivered line
//       recorded beside it, so the weekly precision read sees what the vendor saw.
//   (3) ONE FALSE INTERCEPTION IS A STOP. `WIRE_GUARD_STAGE2` is read from the
//       environment at call time and defaults OFF-on-absence being FALSE only when
//       explicitly set to 'off' — the founder's disarm is one Railway variable and a
//       redeploy, with no code change and no ZIP. F-04.27 binds: the line says a glitch
//       happened, which is TRUE (a claim was made with no hand behind it) and claims
//       nothing else.
//
// THE COPY IS THE FOUNDER'S, VETOED 「 accept all 5 recomendations 」, BYTE-EXACT.
// Two classes, because one line cannot serve both: a mutation-class costume asserts an
// act that did not happen (retry is the right instruction); a lookup-class costume
// asserts a fact that was never read (retry buys nothing, so it points at the screens).
const STAGE2_LINE_MUTATION = 'There was a small glitch, please try again or use the app screens for this action';
const STAGE2_LINE_LOOKUP   = "There was a small glitch — I can't confirm that from the records just now, please use the app screens to check this one";
// The WhatsApp leg has no chip, so the report affordance is a reply word (the
// `matchNudgeWord` precedent, three-deep in this estate). Appended on the WA seat ONLY.
const STAGE2_WA_REPORT     = 'reply REPORT to flag this turn';

// ── TDW_06 F-06.130 — THE PROMISE GETS ITS MECHANISM (CE-ruled; founder-vetoed copy) ──
// The disease this cures: `STAGE2_WA_REPORT` above shipped in the M-2 engine half and
// `matchGlitchWord` had ZERO instances in the tree. A live vendor-facing promise with no
// mechanism behind it is F-04.27's own class — minted by the guard whose entire subject is
// claims that outrun their mechanism.
//
// SLOT ONE, founder-vetoed 「 accept all 」. THE F-06.85 BINDING, and it is the reason this
// comment exists: this sentence is an ABSENCE ASSERTION, and under MANUAL_PAPER §2.1 s3 an
// absence may only be spoken on the back of a REAL READ. It is — `fileGlitchReport` below
// calls `findDeliveredWitness`, which queries `engine.evals_runs` for this agent inside
// REPORT_WINDOW_MS, and this line ships ONLY on that query returning nothing. THE MECHANISM
// IS NAMED HERE SO ITS NEXT SITTING IS FORCED TO RE-READ THIS SENTENCE: change the lookup,
// re-read the line, or the line becomes a fabricated absence — the exact class it serves.
const GLITCH_REPORT_NO_CONTEXT = "Nothing recent to flag here \u2014 tell me what looked off and we'll go from there";
// SLOT THREE, founder-vetoed. Ships ONLY after the finding row is written — past tense is
// lawful here by §2.2 s1 because the write happened before the sentence composed, which is
// the whole doctrine stated in one line. "on file" is the estate's own owner-facing idiom
// (harveySoul:142/:152, donnaLead:250/:354, memory.ts:289); "on the record" was REFUSED at
// the veto as the estate's GOVERNANCE register, which has zero vendor-facing instances.
const GLITCH_REPORT_FILED      = "Flagged \u2014 that turn's on file now.";
// FORK 3-B, the founder's product number, a named constant at ONE home. A REPORT with no
// bound would file against a week-old turn and poison the very week the charter calls
// continuing measurement.
const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Which line a specimen earns. The lookup line is for a costume whose ONLY claim is an
// existence/lookup claim; anything asserting an act takes the mutation line.
function stage2Line(verdict, forWhatsApp) {
  const claims = (verdict && verdict.claims) || [];
  const lookupOnly = claims.length > 0
    && claims.every((cl) => cl === 'narrated_lookup' || cl === 'presence_claim');
  const base = lookupOnly ? STAGE2_LINE_LOOKUP : STAGE2_LINE_MUTATION;
  return forWhatsApp ? `${base}\n\n${STAGE2_WA_REPORT}` : base;
}

// ARMED? Read at call time, never cached, so the founder's disarm needs no deploy of
// this file. Absent → armed (the gate is open); 'off'/'0'/'false' → disarmed.
function stage2Armed() {
  const v = String(process.env.WIRE_GUARD_STAGE2 || '').trim().toLowerCase();
  return !(v === 'off' || v === '0' || v === 'false');
}

// The one home for "should this turn be intercepted, and with what". Returns null when
// the turn walks — which is every class except `costume`, by construction.
function stage2Intercept(verdict, forWhatsApp) {
  if (!verdict || !verdict.specimen) return null;   // (1) costume alone
  if (!stage2Armed()) return null;                  // (3) the founder's tripwire
  return stage2Line(verdict, !!forWhatsApp);
}

// The landing site is engine.evals_runs + engine.evals_findings — LIVE TABLES WITH A
// LIVE WRITER (recordEval, src/engine/src/core/evals.ts) and a live read route. ZERO
// DDL, zero migration, no founder-run SQL for this sitting: run_type 'production' was
// already in that module's allowed set, `transcript` is already documented as "full
// exchange incl. donna_calls", and findings already carry claim/evidence_ref/severity/
// truth_status. recordEval's own standing line is the reason it is the right home:
// "if it was not persisted here, it did not happen."
//
// FAIL-SILENT BY DESIGN: every path is caught and warns. A report-only guard that could
// throw into the reply path would be a guard that hurts the vendor to watch the model.
async function wireGuardSpecimen(supabase, vendorId, result, agentId) {
  try {
    // TWO-PHASE, so the ladder stays sync and pure: classify once; if and only if it
    // reaches Fork A's limb does the lookup run, and the ladder is re-entered with the
    // answer. No query fires on a turn that never asks the question.
    let verdict = wireGuardClassify(vendorId, result);
    if (!verdict) return null;
    if (verdict.kind === 'prior_deed_pending') {
      const priorDeed = await priorDeedLookup(supabase, result, verdict.deed_class);
      verdict = wireGuardClassify(vendorId, result, priorDeed);
      if (!verdict) return null;
    }
    const eng = supabase && typeof supabase.schema === 'function' ? supabase.schema('engine') : null;
    if (!eng) return verdict;
    const { data, error } = await eng.from('evals_runs').insert({
      run_type: 'production',
      scenario: `wire_guard_stage1:${verdict.kind}`,
      discipline: 'claim_doctrine',
      verdict: verdict.specimen ? 'fail' : 'pass',
      source_note: 'wire-guard stage 1 (report-only; no vendor-visible delta)',
      // F-06.123 (TDW_06 M-2a, CE-ruled) — THE VERDICT RIDES THE ROW, WHOLE. The first
      // live read had to DERIVE why a turn escalated (which deed class was matched, which
      // room the turn ran in, what Fork A' actually answered) because the payload carried
      // none of it. A read that must derive what it should read is a slower gate and an
      // error-prone one. Additive into an EXISTING jsonb column (evals_runs.transcript,
      // witnessed at docs/db/ENGINE_SCHEMA.md:191) — ZERO DDL, zero migration.
      transcript: {
        // STAGE 2 (arming condition 2): the delivered line rides the specimen row, so the
        // weekly precision read sees exactly what the vendor saw, never an inference.
        // F-06.130 / correction No.9 — RE-CONDITIONED ON THE MECHANISM AS SHIPPED. This field
        // is a CLASSIFICATION ECHO and nothing more: it is written HERE, before Fork D has
        // resolved, with forWhatsApp=false, and it stays populated even when the retry lands
        // the act and the vendor never sees a glitch line at all. IT IS NOT AN INTERCEPTION
        // WITNESS AND MUST NEVER BE READ AS ONE. What actually shipped is recorded by
        // `stage2RecordDelivery` at Fork D's resolution point, under `stage2_delivery`, and
        // that is the only field the REPORT catcher reads.
        stage2_delivered: verdict.specimen && stage2Armed() ? stage2Line(verdict, false) : null,
        // FORK 3-K1: the agent, ADDITIVE beside the conversation. The conversation key alone
        // loses the affordance's core case — a vendor who texts REPORT after the 30-minute
        // thread timeout is complaining about a turn his new conversation cannot see.
        agent_id: agentId || null,
        conversation_id: (result && result.conversation_id) || null,
        assistant_message_id: (result && result.assistant_message_id) || null,
        reply: (result && result.reply) || '',
        hand_census: verdict.hand_census,
        kind: verdict.kind,
        deed_class: verdict.deed_class,
        mode: verdict.mode,
        prior_deed: verdict.prior_deed,
        claims: verdict.claims,
        witness_line: verdict.witness_line,
      },
      anonymized: false,
    }).select('id').single();
    if (error || !data) { console.warn('[wire-guard stage1]', error && error.message); return verdict; }
    const rows = verdict.claims.map((c) => ({
      run_id: data.id,
      claim: c,
      evidence_ref: (result && result.assistant_message_id) || null,
      severity: verdict.specimen ? 'material' : 'note',
      truth_status: verdict.kind,
    }));
    if (rows.length) {
      const { error: fErr } = await eng.from('evals_findings').insert(rows);
      if (fErr) console.warn('[wire-guard stage1 findings]', fErr.message);
    }
    // FORK 3a: the row id rides the verdict out, so the seats can patch THIS row with what
    // they actually delivered. Only THIS return carries an id — every earlier return above
    // (no verdict / no engine handle / insert failed) is deliberately id-less, and that
    // honesty is load-bearing: no id -> no delivery witness -> a later REPORT finds nothing
    // and draws the no-context line, which is TRUE. Benched as its own cell.
    return Object.assign({}, verdict, { run_id: data.id });
  } catch (e) { console.warn('[wire-guard stage1]', e && e.message); return null; }
}

// ── THE DELIVERY WITNESS (FORK 3a; the CE's delivery-witness principle) ──────────────────
// The catcher keys on WHAT SHIPPED, never on what was classified. Called at Fork D's
// RESOLUTION POINT — after the retry has decided — so the row records which arm fired and
// the exact bytes the vendor received, in the delivered form. ONE row per event: this
// PATCHES the specimen row rather than inserting a second, because two rows for one event
// re-creates the shadowing class the chair convicted.
//
// Writes beside `wireGuardSpecimen` on the same engine handle (correction No.8): the guard's
// specimens have ONE writer and it is this file. `recordEval` is a different writer with a
// typed shape that has no field for this, and is deliberately not reached.
async function stage2RecordDelivery(supabase, runId, delivery) {
  if (!runId || !delivery) return false;
  try {
    const eng = supabase && typeof supabase.schema === 'function' ? supabase.schema('engine') : null;
    if (!eng) return false;
    const { data, error } = await eng.from('evals_runs').select('transcript').eq('id', runId).maybeSingle();
    if (error || !data) { console.warn('[wire-guard stage2 delivery]', error && error.message); return false; }
    const transcript = Object.assign({}, data.transcript || {}, {
      stage2_delivery: {
        arm:       delivery.arm || null,          // retry_landed | second_costume | glitch_line
        delivered: delivery.delivered || null,    // the EXACT bytes, or null when nothing shipped
        seat:      delivery.seat || null,         // wa | pwa_json | pwa_sse
        at:        new Date().toISOString(),
      },
    });
    const { error: uErr } = await eng.from('evals_runs').update({ transcript }).eq('id', runId);
    if (uErr) { console.warn('[wire-guard stage2 delivery]', uErr.message); return false; }
    return true;
  } catch (e) { console.warn('[wire-guard stage2 delivery]', e && e.message); return false; }
}

// ── TDW_06 F-06.136 · THE IMPERATIVE ARM'S OWN ROW (CE-110, fork F3(b) ruled).
// WHY A ROW AND NOT A LOG LINE: production opens on the standing instruments, and the
// weekly precision read is one of them. An arm that fires on a live wire and leaves no
// trace is an arm nobody is measuring — the empty-log hollow-green this block refused at
// the WA seat's Stage 1 siting, one layer along. The row answers three questions the
// console cannot: how often the gate is invented, how often the second run rescues it,
// and what the arm cost.
//
// ZERO DDL, ZERO MIGRATION, and that is derived, not assumed: `run_type: 'production'`
// is already in recordEval's allowed set, `transcript` is already the jsonb the Stage 1
// specimen rides (witness: docs/db/ENGINE_SCHEMA.md, engine.evals_runs.transcript), and
// this writes the SAME two columns the specimen seat beside it writes. It is not a new
// module and not a new table — it is the existing landing site, one scenario further.
//
// FAIL-OPEN, ASSERTED AS A CELL: every path is caught and warns. A measurement that could
// throw into the reply path would be a measurement that hurts the vendor to watch the
// model — the same law the Stage 1 writer states at its own site.
//
// THE VERDICT WORD IS THE ARM'S, NOT VICTOR'S: `pass` = the second run filed the thing;
// `fail` = it refused twice and HIS OWN SENTENCE SHIPPED UNTOUCHED. A `fail` here is NOT
// a lie delivered — nothing was replaced, nothing was fabricated. It is the estate
// recording that a hand the soul demanded never arrived. Read it that way or not at all.
async function recordImperativeRetry(supabase, vendorId, agentId, arm, first, retry) {
  try {
    const eng = supabase && typeof supabase.schema === 'function' ? supabase.schema('engine') : null;
    if (!eng) return false;
    const names = (r) => {
      const out = [];
      for (const tc of ((r && r.tool_calls) || [])) {
        for (const dc of ((tc && tc.donna_calls) || [])) {
          if (dc && dc.name && dc.name !== 'listen_harvey_talk') out.push(dc.name);
        }
      }
      return out;
    };
    const { error } = await eng.from('evals_runs').insert({
      run_type: 'production',
      scenario: `imperative_retry:${arm}`,
      discipline: 'claim_doctrine',
      verdict: arm === 'imperative_retry_landed' ? 'pass' : 'fail',
      source_note: 'F-06.136 imperative-miss retry (one extra actor run; nothing replaced, no line of its own)',
      transcript: {
        agent_id: agentId || null,
        vendor_id: vendorId || null,
        conversation_id: (first && first.conversation_id) || null,
        assistant_message_id: (first && first.assistant_message_id) || null,
        first_reply:  (first && first.reply) || '',
        retry_reply:  (retry && retry.reply) || '',
        first_hands:  names(first),
        retry_hands:  names(retry),
        seat: 'wa',
        at: new Date().toISOString(),
      },
      anonymized: false,
    });
    if (error) { console.warn('[imperative-retry]', error.message); return false; }
    return true;
  } catch (e) { console.warn('[imperative-retry]', e && e.message); return false; }
}

// The newest DELIVERED witness for this agent inside the window. `delivered` non-null is the
// whole predicate — a turn whose retry landed the act carries arm `retry_landed` and a null
// `delivered`, and is correctly NOT reportable: the vendor received an honest reply.
async function findDeliveredWitness(supabase, agentId) {
  if (!agentId) return null;
  try {
    const eng = supabase && typeof supabase.schema === 'function' ? supabase.schema('engine') : null;
    if (!eng) return null;
    const since = new Date(Date.now() - REPORT_WINDOW_MS).toISOString();
    const { data, error } = await eng.from('evals_runs')
      .select('id, created_at, transcript')
      .eq('run_type', 'production')
      .gte('created_at', since)
      .contains('transcript', { agent_id: agentId })
      .order('created_at', { ascending: false })
      .limit(25);
    if (error || !data || !data.length) return null;
    for (const row of data) {
      const d = row && row.transcript && row.transcript.stage2_delivery;
      if (d && d.delivered) return row;
    }
    return null;
  } catch (e) { console.warn('[wire-guard report lookup]', e && e.message); return null; }
}

// FORK 6b — ONE RESOLUTION PATH, ONE HOME, ONE FAILURE MODE. The WhatsApp word and the app
// chip both land here; neither carries a run id on the wire and neither owns a second lookup.
async function fileGlitchReport(supabase, agentId) {
  const witness = await findDeliveredWitness(supabase, agentId);
  if (!witness) return { filed: false, run_id: null, message: GLITCH_REPORT_NO_CONTEXT };
  try {
    const eng = supabase && typeof supabase.schema === 'function' ? supabase.schema('engine') : null;
    if (!eng) return { filed: false, run_id: null, message: GLITCH_REPORT_NO_CONTEXT };
    const { error } = await eng.from('evals_findings').insert({
      run_id: witness.id,
      claim: 'vendor_reported_glitch',
      evidence_ref: (witness.transcript && witness.transcript.assistant_message_id) || null,
      severity: 'material',
      truth_status: 'vendor_reported',
    });
    // FAIL-HONEST, not fail-silent: if the write did not land, the vendor is NOT told it did.
    // A false "Flagged" here would be this sitting's own disease shipped by its own cure.
    if (error) { console.warn('[wire-guard report file]', error.message); return { filed: false, run_id: null, message: GLITCH_REPORT_NO_CONTEXT }; }
    return { filed: true, run_id: witness.id, message: GLITCH_REPORT_FILED };
  } catch (e) {
    console.warn('[wire-guard report file]', e && e.message);
    return { filed: false, run_id: null, message: GLITCH_REPORT_NO_CONTEXT };
  }
}

// ── TDW_06 F-06.158's CURE (R-29.26) — ONE HOME, BOTH DOORS ─────────────────
// THE CORE, supabase-parameterised. Extracted from persistComposedReply below,
// whose body this was verbatim and which now calls it — PWA behaviour is
// byte-identical and a cell proves it.
//
// WHY THE WA DOOR NEEDED IT, in one specimen (F-06.158, founder-witnessed
// 2026-08-11 09:07): the relay's SHOW frame and its E3 confirm are composed at
// the DOOR and appended to `replyText`. `replyText` lands in `public.messages` —
// the vendor's WhatsApp transcript. But VICTOR'S OWN MEMORY is `engine.messages`
// (memory.ts, symbol `loadThread`), and loop.ts saves `result.reply` ALONE. So
// Victor asked 「 Send this to Priya (+919625759924)? 」 on the wire and held no
// record of asking it. The vendor's 「 yes, send it to Priya 」 arrived answering
// a question that, from inside the thread, was never asked — and Harvey read it
// as a fresh instruction and STAGED A SECOND DRAFT. E3's affirmative could not
// reach `donna_relay_send` by construction.
//
// THE CLASS HAS A NAME NOW, and it is the same one F-06.157 belongs to: THE DOOR
// AND THE MODEL DISAGREEING ABOUT WHICH TURN HAPPENED.
//
// F-06.29's DISPOSITION LINE APPLIES: this seam has existed at the PWA door
// since Q-B4-6(b) — `loop.ts:931`'s own comment calls it 「 the row the door may
// patch 」, generic, designed for doors — and the WhatsApp lane, the one the
// founder actually reads, never took it. CURED AT BOTH DOORS OR CURED NOWHERE.
//
// THE LAW IS UNCHANGED AND IS THE HEADER'S: the patch lands on
// `result.assistant_message_id` — THE ENGINE'S OWN WITNESS — and never on "the
// latest assistant row", which is a guess. No id writes NOTHING. No tail returns
// early. A failed patch warns and never disturbs a reply that is already owed.
async function patchComposedReply(supabase, result, tail) {
  if (!tail) return; // no door lines this turn — the saved row is already the whole truth
  const id = result && result.assistant_message_id;
  if (!id) return;   // the engine did not witness the row — write nothing, never guess one
  try {
    const { error } = await supabase.schema('engine')
      .from('messages')
      .update({ content: `${result.reply || ''}${tail}` })
      .eq('id', id);
    if (error) console.warn('[door:composed-reply]', error.message);
  } catch (e) { console.warn('[door:composed-reply]', e.message); }
}

async function persistComposedReply(req, result, tail) {
  return patchComposedReply(req.app.locals.supabase, result, tail);
}

// Lockstep the other way: when Donna moves a binder's date (donna_date / donna_edit carrying a date),
// the linked calendar event follows — BUT ONLY IF THAT EVENT IS THE ENGAGEMENT.
// Half A's binder write is a post-turn door action, never a donna_call in result,
// so this never sees it — no loop.
//
// ── F-04.43's WALL (Q-B3-9's amendment, CE-ruled 2026-07-16) ──────────────
// A BINDER'S DATE IS THE WEDDING. A LINKED EVENT IS USUALLY AN APPOINTMENT
// LEADING UP TO IT. This leg used to drag EVERY linked event onto the binder's
// date. THE SPECIMEN, read from the turn log at B3 (2026-07-15 20:20:22): the
// founder filed "Meera Kapoor … wedding in November"; donna_edit wrote the
// binder's date NULL -> 2026-11-01 (a genuine FIRST write — donna_history in the
// same turn showed six writes, not one of them a date); this leg then dragged
// "Meera - trial" (kind='trial') off 30 Jul onto the wedding. Silently.
//
// F-04.43's filed headline — "the binder already carried 2026-11-01; re-asserting
// an existing date is enough" — WAS FALSE, and corrected on the record at B3.
// The old != new sentinel below CANNOT stop that crime: old and new differ. The
// KIND CHECK is what stops it. An appointment's date is its own; a wedding moving
// has no authority over a trial's calendar.
async function lockstepBinderToEvent(req, result) {
  // The gate (Q-B3-1 as re-scoped = F-04.48's cure): PROPAGATE ONLY A WITNESSED
  // CHANGE. This leg reads call.INPUT, never the write's outcome — so before B3
  // a donna_date that ERRORED still moved the vendor's calendar off a write that
  // never landed. Status-sniffing on the result string, exactly as chat.js:339's
  // isErr does — never value-parsing out of prose (eventWrite.js:472-475's rule).
  const isErr           = (r) => typeof r === 'string' && r.startsWith('ERROR');
  const isDateUnchanged = (r) => typeof r === 'string' && r.startsWith('DATE UNCHANGED');
  const moves = new Map(); // binder_id -> date (last wins)
  const collect = (call) => {
    if (!call || !call.input) return;
    if ((call.name === 'donna_date' || call.name === 'donna_edit') && call.input.binder_id
        && typeof call.input.date === 'string' && call.input.date.trim()) {
      if (isErr(call.result) || isDateUnchanged(call.result)) return; // no write landed -> nothing to mirror
      moves.set(String(call.input.binder_id), call.input.date.trim());
    }
  };
  for (const tc of (result.tool_calls || [])) { collect(tc); for (const dc of (tc.donna_calls || [])) collect(dc); }
  for (const [binderId, date] of moves) {
    try {
      // THE RAW WRITE THE CHARTER NAMED. It was one multi-row .update(); eventWrite writes
      // ONE row by id, so the predicate becomes a RESOLVE and each match goes through the
      // door. Same rows, same rule, one writer. (Identical shape to availability.js's
      // unblock, ratified at 4a: the guard moves into the constitution, not sideways.)
      //
      // .in('kind', OCCUPYING_KINDS) IS F-04.43's CURE. The filter is pushed to the
      // database so an appointment is never even resolved, let alone written.
      const { data: evs, error } = await req.app.locals.supabase
        .from('events')
        .select('id')
        .eq('vendor_id', req.vendor.id)
        .eq('linked_binder_id', binderId)
        .neq('state', 'cancelled')
        .in('kind', OCCUPYING_KINDS);
      if (error || !evs || !evs.length) continue;
      // ── §2.5 / Q-S-2, CE-RULED — THE ONE AUTHORISED TOUCH ON THIS SEALED LEG ──
      //
      // `force: true`. A WEDDING MOVING IS A DECISION ALREADY MADE; the drag is its
      // CONSEQUENCE, not a proposal. The vendor is not asking the calendar whether
      // his client may marry on the 15th.
      //
      // F-04.56 IS WHY THIS LINE EXISTS, and until the checker sitting it was inert:
      // this leg passed no `force` and NEVER READ THE RETURN. The catch below catches
      // THROWS; `{ok:false, conflict}` is a RETURN. It was harmless only because
      // checkOccupancy returned null always. The moment the checker got a body, a
      // drag onto a date already at capacity would return a conflict, this leg would
      // discard it in silence, and THE BINDER WOULD MOVE WHILE THE CALENDAR DID NOT
      // — the exact divergence this block exists to kill, re-created by this block's
      // own checker, inside a leg the charter forbids reopening.
      //
      // ⚠ THE RULING'S OWN JUSTIFICATION — "date_blocked still refuses by Q-B3-8, so
      //   a drag can never land on a block" — WAS FALSE AGAINST THE CODE WHEN IT WAS
      //   WRITTEN, and was made true before this line shipped. The door's gate read
      //   `if (conflict && !force)` with no second term: force beat EVERY verdict,
      //   including date_blocked. Proven by running it: a forced booking landed on a
      //   block and wrote "[forced] You've blocked 19 July" into the vendor's note —
      //   the sentence Q-B3-8 exists to make impossible. Q-C-3 (CE-ruled 2026-07-16)
      //   put `isOverridable` in the gate. THIS LINE IS SAFE BECAUSE OF THAT ONE, AND
      //   NOT BEFORE IT. Do not port `force: true` to another caller without it.
      //
      // The vendor-facing surfacing ("your wedding move overloaded the 15th") is
      // B4's, with F-04.55. This is visibility without a surface change: the LEDGER
      // records what happened, both ways, so the estate stops being unable to answer
      // "did the calendar follow?" from anything but the rows.
      for (const ev of evs) {
        const r = await writeEvent(req.app.locals.supabase, {
          vendorId: req.vendor.id, surface: 'pwa', source: 'victor',
          event_id: ev.id, event_date: date, force: true,
        });
        // Fire-and-forget, BOTH OUTCOMES (CE-ruled): logActivity is fail-safe by
        // contract (snapshot.js:112-141) and a ledger miss must never disturb a write
        // that already landed. Only a WITNESSED outcome is logged — `r` is the door's
        // own return, not a guess about it. F-04.41's lesson: the door line is the
        // witness, the prose is the guess.
        if (r && r.ok && r.conflict) {
          logActivity(req.app.locals.supabase, {
            vendorId: req.vendor.id, surface: 'pwa', action: 'event_update',
            summary: `binder date-move: conflict overridden — "${(r.event && r.event.title) || ev.id}" moved to ${date} · ${r.conflict.message}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        } else if (r && !r.ok && r.conflict) {
          logActivity(req.app.locals.supabase, {
            vendorId: req.vendor.id, surface: 'pwa', action: 'event_update',
            summary: `binder date-move: drag refused by block — "${ev.id}" stayed put; ${date} is blocked · ${r.conflict.message}`,
            entityType: 'event', entityId: ev.id,
          }).catch(() => {});
        } else if (r && !r.ok) {
          // The third outcome the ruling did not name, and it is F-04.56's harm
          // wearing a different hat: the checker went FAIL-CLOSED (F15) or the write
          // refused, so the binder moved and this event did not. Logged to the server
          // only — inventing a ledger vocabulary the CE did not rule is how a wire
          // grows a fifth kind nobody ratified. Raised to B4 with F-04.55/F-04.56.
          console.warn('[vendor-e chat:lockstep b->e] drag did not land:', r.error || 'refused');
        }
      }
    } catch (e) { console.warn('[vendor-e chat:lockstep b->e]', e.message); }
  }
}

// Calendar sight: the door hands Harvey the vendor's upcoming bookings as a compact snapshot,
// injected into his turn (mirrors the cabinet snapshot). Read-only; the engine stays clean.
//
// ── F-04.66's CURE + P4.1, ONE EDIT TO ONE FUNCTION (R-B6-1, CE-ruled 2026-07-17) ──
// THE IDS LEAVE THIS PROSE AND THE WORD "handle" LEAVES WITH THEM. The old header
// handed Victor raw row ids, NAMED them "handle", and INSTRUCTED him to use them —
// F-04.37's signature ("he was not lying — he was obeying"), third instance, and the
// founder's 2026-07-17 19:43 specimen ("… (handle: 6cde1a36-…)") was the proof. A
// snapshot line is now a referent Victor can SAY — date + title — and the mutation
// gate below (resolveEvent) resolves what he says. Scrubbing the id at scrub.js was
// ruled OUT: scrubText is shared with tool-result renders (chat.js:85 scrubs
// e.result; donnaLead.ts:259 prints an id into it), so a UUID pattern there scrubs
// payloads — and a stripped id leaves "(handle: )" while the instruction survives
// (F-04.27's lesson inverted). The cure is at the source of the hand: this function.
//
// P4.1's DATE-PRESSURE LINE lands in the same edit, because it extends this exact
// function — building it first and curing second would reopen the first (the
// handoff's "two edits to one function where the second undoes the first").
// Siting re-ruled at B4 §3 and confirmed at R-B6-1: HERE, one home, door-fed —
// not donna.ts. Fed by describeWindow, which is fed by describeDate (occupancy.js;
// the eleven-null warrant in its header governs — OFF is spoken as OFF, unknown as
// unknown, never as free). Muhurat + enquiry dates are door reads (they are market
// and pipeline facts, not occupancy's): hot_dates is global (witnessed 8 columns,
// PUBLIC_SCHEMA.md — date/active/label); leads' open states are new/contacted/quoted
// — ⚠ that list's home is leads.js:75 ACTIVE_PIPELINE_STATES (a router export, not
// importable without dragging express); carried here BY VALUE with this pointer.
// Two homes for one list is F-04.36's shape — named, not hidden; a structural cure
// (export the constant or bench the agreement) is proposed in the B6 handover.
const PRESSURE_WINDOW_DAYS = 30; // spec P4.1's own number

// 04.5 P6 (CE-61, Fork B): the door's normaliser for the engine's voice gate.
// The MAPPING has one home (lib/vendor/categoryFraming.js) and this is a read of it,
// never a second copy. FAIL-SAFE TO NULL, deliberately: if the mapping cannot be read,
// the engine gets no category, the weave does not fire, and Victor speaks in his base
// voice — a Victor without the planner weave is diminished, not wrong. The failure mode
// of the opposite default (assume planner) would be a lawyer's Victor talking about
// call sheets, which is wrong rather than merely thinner.
function normaliseCategoryForTurn(category) {
  try {
    return require('../../lib/vendor/categoryFraming').normaliseCategory(category);
  } catch (e) {
    console.warn('[vendor-e chat:category]', e.message);
    return null;
  }
}
function pressureDateWord(iso) {
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  } catch { return iso; }
}
async function fetchCalendarSnapshot(req) {
  try {
    const supabase = req.app.locals.supabase;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, kind, state')
      .eq('vendor_id', req.vendor.id)
      .eq('state', 'upcoming')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(12);
    if (error || !data || !data.length) return '';
    const lines = data.map((e) => {
      const when = e.event_time ? `${e.event_date} ${e.event_time}` : e.event_date;
      return `- ${when} · ${e.title}${e.kind ? ` (${e.kind})` : ''}`;
    });

    // ── P4.1: the date-pressure line. One dense line, words not tables. ──
    // Each read is best-effort and HONEST about failure: a failed market read says
    // "unknown", never "none" (F-04.21's family — absence is only evidence if you
    // looked). The occupancy half's honesty lives inside windowWords itself.
    let pressure = '';
    try {
      const { describeWindow, windowWords } = require('../../lib/vendor/occupancy');
      const horizon = new Date(`${today}T00:00:00Z`);
      horizon.setUTCDate(horizon.getUTCDate() + PRESSURE_WINDOW_DAYS - 1);
      const to = horizon.toISOString().slice(0, 10);

      // The date-FINDER lives at the DOOR, not in occupancy.js — checker_bench §14
      // holds that file horizon-free by construction (F-04.47's invariant), and this
      // window is the DOOR's question. Covenant lines are liveRowsOn's two, verbatim.
      // Its only power is which dates get asked: a missed date is an omission this
      // finder owns; every ANSWER still comes out of describeDate, per date.
      let candidateDates = null; // null = the finder failed -> the window is UNKNOWN
      try {
        const { data: cd, error: cdErr } = await supabase
          .from('events')
          .select('event_date')
          .eq('vendor_id', req.vendor.id)
          .gte('event_date', today)
          .lte('event_date', to)
          .is('deleted_at', null)              // F-04.25's covenant — the only lawful
          .neq('state', 'cancelled');          // non-occupancy, same as liveRowsOn.
        if (!cdErr) candidateDates = [...new Set((cd || []).map((r) => r.event_date).filter(Boolean))];
      } catch { candidateDates = null; }

      const win = await describeWindow({ supabase, vendorId: req.vendor.id, from: today, days: PRESSURE_WINDOW_DAYS, candidateDates });

      let muhurat;
      try {
        const { data: hd, error: hdErr } = await supabase
          .from('hot_dates')
          .select('date')
          .eq('active', true)
          .gte('date', today)
          .lte('date', to)
          .order('date', { ascending: true });
        muhurat = hdErr ? null : [...new Set((hd || []).map((r) => r.date))];
      } catch { muhurat = null; }

      let enquiry;
      try {
        const { data: ld, error: ldErr } = await supabase
          .from('leads')
          .select('wedding_date')
          .eq('vendor_id', req.vendor.id)
          .is('deleted_at', null)
          .in('state', ['new', 'contacted', 'quoted']) // ACTIVE_PIPELINE_STATES, leads.js:75 — see header
          .not('wedding_date', 'is', null)
          .gte('wedding_date', today)
          .lte('wedding_date', to);
        enquiry = ldErr ? null : [...new Set((ld || []).map((r) => r.wedding_date))].sort();
      } catch { enquiry = null; }

      const bits = [windowWords(win)];
      if (muhurat === null) bits.push('muhurat dates unknown (could not be read)');
      else if (muhurat.length) bits.push(`muhurat ${muhurat.map(pressureDateWord).join(', ')}`);
      else bits.push('no muhurat dates');
      if (enquiry === null) bits.push('enquiry dates unknown (could not be read)');
      else if (enquiry.length) bits.push(`${enquiry.length} enquiry date${enquiry.length === 1 ? '' : 's'} in play (${enquiry.map(pressureDateWord).join(', ')})`);
      else bits.push('no enquiry dates in play');
      pressure = `\n[Next ${PRESSURE_WINDOW_DAYS} days: ${bits.join(' · ')}.]`;
    } catch (e) {
      console.warn('[vendor-e chat:date-pressure]', e.message);
      // A failed pressure read never sinks the snapshot; it is simply absent —
      // an absent line claims nothing, which is the honest degradation.
      pressure = '';
    }

    // ── 04.5 P1.3: the STAFFING-GAP line. Sibling of the pressure line, beside it —
    // NOT merged (CE-ruled: its own 21-day window, the spec's "next 3 weeks", distinct
    // from the pressure line's 30). PLANNER-GATED by the estate's own predicate (the
    // RULED_OFF family — normaliseCategory === 'planning'); silent for every other craft.
    // Occupying bookings with no crew on them yet — the gap = occupying && crew empty.
    // HONESTY LAW, inherited from the block it joins (F-04.21's family): a failed read
    // renders NO line, never "0 functions" — absence is only evidence if you looked.
    // ZERO model calls, one DB read — exactly like its sibling. req.vendor is the full
    // vendors row (resolveVendor select('*')), so category costs no query. The string is
    // a FOUNDER-VETO proposal (bare shape, singular/plural agreed).
    // 04.5 P6 (CE-61, Fork A): the staffing-gap line MOVED OUT of this function into
    // `lib/vendor/crewSnapshot.js`, and the DECLINE line was born beside it there.
    // Both lines now live in ONE home that BOTH doors import — the WhatsApp snapshot
    // renders them byte-identically because it renders the same function's output, not
    // a copy of it (C4's both-homes precedent, achieved by construction; F-04.36's law
    // honoured rather than re-litigated). The gap line's gate, window, covenant filters,
    // grammar and honesty law all travelled with it unchanged.
    //
    // THE PRESSURE LINE ABOVE DID NOT MOVE. It was not asked for and its surface-scoping
    // ruling (R-B6-1 / B4 §3) stands. This door has three lines; the handset has two.
    let gap = '', decline = '';
    try {
      const { fetchCrewState } = require('../../lib/vendor/crewSnapshot');
      const crew = await fetchCrewState(supabase, req.vendor.id, req.vendor.category, today);
      gap = crew.gap; decline = crew.decline;
    } catch (e) {
      console.warn('[vendor-e chat:crew-state]', e.message);
      gap = ''; decline = '';   // a failed read says nothing — never "0 functions"
    }

    return `[Calendar — upcoming, kept for you. Refer to a booking by its name as it appears below (with its date, if two share a name) to change or cancel it. Crew assignments are not shown here — signal donna_assign_crew; the calendar adjudicates. For event_id use the booking's name from the lines below, never a note or description.]\n${lines.join('\n')}${pressure}${gap}${decline}`;
  } catch (e) {
    console.warn('[vendor-e chat:calendar snapshot]', e.message);
    return '';
  }
}

// The owner's note-to-self scratchpad — read for Donna's vision (door-fed; Harvey never sees it).
// owner_notes is public-schema, vendor-keyed; the door has req.vendor, so the door reads it and
// threads it to Donna via runTurn({ scratchpad }). Descriptive block only — the disposition to
// surface relevant notes to Harvey lives in Donna's soul, not here.
async function fetchScratchpad(req) {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('owner_notes')
      .select('id, body, created_at')
      .eq('vendor_id', req.vendor.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data || !data.length) return '';
    const lines = data.map((n) => `- ${n.body}`);
    return `[The owner's scratchpad — notes he has left for himself, in his own hand.]\n${lines.join('\n')}`;
  } catch (e) {
    console.warn('[vendor-e chat:scratchpad]', e.message);
    return '';
  }
}

// TDW_02 P4 (Amendment One CE-4): the RECENT ACTIVITY block, door-built, so the
// engine sees cross-surface actions AND harvest_patch rows — Victor never
// re-asks a harvested fact. Mechanical context; zero soul change. Fail-safe ''.
async function fetchRecentBlock(req) {
  try {
    const rows = await fetchRecentActivity(req.app.locals.supabase, req.vendor.id);
    return formatActivityBlock(rows, 'pwa');
  } catch (e) { console.warn('[vendor-e chat:recent-activity]', e.message); return ''; }
}

// TDW_06 P6b (F-06.2, CE-ratified): the advisor room yields COUNSEL, not vendor facts —
// harvest must not mine an advisory turn for lead/binder patches. Gate on the turn's
// RESOLVED victor_mode (set by the engine on the result at loop.ts:700), so a mid-turn
// reality wins over the door's read. 'business' and consult (victor_mode absent) harvest
// byte-identically to today — only 'advisor' is gated.
const advisorHarvestGate = (result) => !!(result && result.victor_mode === 'advisor');

// TDW_02 P4: harvest, fire-and-forget AFTER the reply is on the wire. Never
// blocks, never throws to the request (harvest.js is internally best-effort).
function fireHarvest(req, message, result) {
  if (advisorHarvestGate(result)) return; // F-06.2: no harvest on the advisor room's counsel
  const supabase = req.app.locals.supabase;
  const vendor = req.vendor; const agentId = req.agentId;
  const toolCalls = (result && result.tool_calls) || [];
  setImmediate(() => {
    // F-04.72 (R-B6-29 shape (a)): the harvest now sees the turn's MODEL reply —
    // the disambiguation hold cannot exist without it. Door lines excluded by
    // design (they never ask); absent reply -> no holds, pre-rider behaviour.
    runHarvest({ supabase, vendor, agentId, message, toolCalls, replyText: (result && result.reply) || '' })
      .catch((e) => console.warn('[harvest] fire failed:', e.message));
  });
}

// ── TDW_02 P5: tiers, routes, caps ────────────────────────────────────────────
// CE-7: PRODUCT tier -> ENGINE tier, read-through at turn start, never a backfill.
// 0115 — the key follows the tier rename (F-10.23: `trial` retired, `basic` is
// the canon's no-AI floor). `basic: 'entry'` RETAINS the old value deliberately:
// the founder's ruling RECORDS basic as no-AI, but per-tier AI ENFORCEMENT is
// F-10.41's own W-1-gated sitting and is not built here. Mapping basic to
// anything else — or dropping the key so the lookup misses — would enforce by
// accident, on a live chat path, in a delivery chartered to rename a word. The
// teeth arrive by charter, not as a side effect.
// (Mechanism named in-comment per F-06.85, so F-10.41's sitting is forced to
// re-read this line rather than rediscover the coupling.)
const ENGINE_TIER_MAP = { basic: 'entry', essential: 'entry', signature: 'mid', prestige: 'top' };

// The turn's llm wiring. Anthropic routes pass NO transport — the engine's own
// pre-facade path runs byte-identical (acceptance 9). Non-anthropic routes pass
// the facade transport + one model for both hands.
// TDW_06 P6b (F-06.4, CE-ratified): the advisor room's model is chosen AT THE DOOR.
// victor_mode is read from engine.agents by the SERVER-RESOLVED agentId (resolveAgent
// middleware — the reverse bridge; NEVER a client-supplied id) and, when 'advisor',
// routes Victor to the model.pwa_vendor.advisor key. A read miss falls to 'business'
// (no advisor route). Business/consult are byte-identical to before this seam.
// TDW_06 P7b (F-06.1 second limb): PLAIN-ARGS ctx { supabase, agentId } so the WA door can
// share it — it has no Express req. Moved in LOCKSTEP with buildLlmForTurn (CE correction:
// buildLlmForTurn's co-dependent must not keep reading req.app or the WA call throws).
async function readVictorMode({ supabase, agentId }) {
  try {
    const { data } = await supabase.schema('engine')
      .from('agents').select('victor_mode').eq('id', agentId).maybeSingle();
    return (data && data.victor_mode) === 'advisor' ? 'advisor' : 'business';
  } catch (e) {
    console.warn('[vendor-e chat:victor_mode read]', e.message);
    return 'business';
  }
}

// TDW_06 P7b (F-06.1 second limb): PLAIN-ARGS ctx { supabase, vendor, agentId } — the ONE
// route builder both doors call, so the PWA door and the WA lane route IDENTICALLY (advisor
// -> deepseek; product tier otherwise). The PWA door passes { supabase: req.app.locals.supabase,
// vendor: req.vendor, agentId: req.agentId }; the WA lane (index.js) passes the same shape.
async function buildLlmForTurn({ supabase, vendor, agentId }) {
  const productTier = (vendor && vendor.tier) || 'basic';
  // F-06.4: the advisor room routes on its own key; every other mode routes on the
  // product tier exactly as before. The ENGINE tier (capabilities/caps) always follows
  // the PRODUCT tier — advisor changes only which MODEL serves Victor, not the tier.
  const victorMode = await readVictorMode({ supabase, agentId });
  const routeTier = victorMode === 'advisor' ? 'advisor' : productTier;
  const route = await resolveModel(supabase, 'pwa_vendor', routeTier);
  const tierOverride = ENGINE_TIER_MAP[productTier] || 'entry';
  // TDW_02 P7 (Amendment Two): optional per-role split — donna_provider/donna_model
  // route HER hand separately. Anthropic donna split => no donna transport (her own
  // pre-facade Haiku path, byte-identical).
  const donnaWiring = {};
  if (route.donna_provider && route.donna_provider !== route.provider) {
    if (route.donna_provider === 'anthropic') {
      donnaWiring.donnaTransport = undefined; donnaWiring.donnaModelOverride = undefined;
    } else {
      donnaWiring.donnaTransport = {
        provider: route.donna_provider,
        stream: (p) => llmStream(route.donna_provider, p),
        create: (p) => llmCreate(route.donna_provider, p),
      };
      donnaWiring.donnaModelOverride = route.donna_model;
    }
  }
  if (route.provider === 'anthropic') {
    // Victor anthropic (byte-identical); Donna may still split to a cheap provider.
    return { tierOverride, route, ...donnaWiring };
  }
  return {
    tierOverride,
    route,
    modelOverride: route.model,
    transport: {
      provider: route.provider,
      stream: (p) => llmStream(route.provider, p),
      create: (p) => llmCreate(route.provider, p),
    },
    ...donnaWiring,
  };
}

// CE-6/CE-23-iii: caps metered HERE, the shared handler — one meter, two mounts.
// Turn count = engine.usage rows (one per turn) for this agent, IST windows.
const IST_MS = 5.5 * 60 * 60 * 1000;
function istDayStartUtcISO() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_MS).toISOString();
}
function istMonthStartUtcISO() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_MS).toISOString();
}
// ═══ TDW_10 · F-10.100 — THE METER IS PLAIN-ARGS, BECAUSE THE CAP IS COMBINED ═══
// CE R-26.7 §C ruled F-6 on this file's OWN precedent, twice over: readVictorMode
// and buildLlmForTurn both carry the F-06.1 second-limb comment a few dozen lines
// above — PLAIN-ARGS ctx so the WA door can share it; it has no Express `req`;
// moved in LOCKSTEP with its co-dependents, because a co-dependent that keeps
// reading `req.app` throws the moment the WhatsApp lane calls it.
//
// This meter was the last Express-bound seam in the cap machinery, and that
// binding was the whole reason the WhatsApp lane could never be refused: the
// counter at :usage below has ALWAYS counted both lanes (loop.ts writes one row
// per turn with agent_id + conversation_id and NO lane column — witnessed at
// docs/db/ENGINE_SCHEMA.md engine.usage, 12 columns), but the only caller that
// could reach the count held an `req`. One lane spent; one lane was told.
//
// THE KEY FAMILY MOVED WITH IT, founder-ruled 2026-08-07: `vendor_pwa_*` and
// `vendor_wa_*` both retire in favour of ONE `vendor_ai_*` family, because there
// is one allowance and it is spent from two doors. db/migrations/0116 seeds the
// eight new keys from the live `vendor_pwa_*` rows, seed-from-source-row on
// 0115's own pattern, so whatever the founder has tuned copies correctly.
// `vendor_wa_*` never had a reader at all (F-10.87, two independent methods);
// it retires with its console group rather than gaining one.
//
// (Mechanism named in-comment per F-06.85: the console's Vendor AI group and
// this interpolation are one fact. A sitting that renames either must re-read
// the other, or the dial silently stops reaching the reader again.)
async function buildMeta({ supabase, agentId, tier }) {
  try {
    const pub = supabase;
    const eng = pub.schema('engine');
    const productTier = tier || 'basic';
    const dayKey = `vendor_ai_daily_${productTier}`;
    const monKey = `vendor_ai_monthly_${productTier}`;
    const [{ data: cfg }, dayRes, monRes] = await Promise.all([
      pub.from('admin_config').select('key, value').in('key', [dayKey, monKey]),
      // TDW_06 meter fix: harvest's newly-metered rows carry conversation_id NULL
      // (they are spend, never turns). Every chat turn's row carries its conversation
      // (loop.ts sets it unconditionally), so on the pre-fix estate this filter is
      // count-neutral — the founder's read-only verify (delivery message) witnesses
      // the zero. Spend caps (server.ts agentSpendTodayInr) deliberately UNFILTERED:
      // harvest cost is real money and counts.
      eng.from('usage').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).not('conversation_id', 'is', null).gte('created_at', istDayStartUtcISO()),
      eng.from('usage').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).not('conversation_id', 'is', null).gte('created_at', istMonthStartUtcISO()),
    ]);
    // ═══ F-10.85 — THE CAP DIAL CAN NOW SAY ZERO ═════════════════════════════
    // This read was `n > 0 ? n : dflt`, which treated a stored 0 as ABSENT and
    // handed back the in-code default of 25. The dial could throttle but never
    // DENY, and the one value the founder most needs it to express was the one
    // value it silently discarded.
    //
    // That matters now because of what 0115 did one layer up. The founder ruled
    // 「 basic is free without ai 」, and stated on the record that until
    // F-10.41's per-tier enforcement sitting he would 「 regulate the ai usage in
    // basic through admin console 」. That interim regulation runs through THIS
    // predicate. Without the change, the console cannot express the ruling it was
    // named to carry.
    //
    // `>= 0` is the whole cure. A NEGATIVE value still falls to the default — a
    // negative cap is malformed input, not an instruction, and this reader's
    // standing posture is that junk falls back rather than throws on a live turn.
    // Zero is not junk; zero is a decision.
    //
    // WITNESSED SAFE BEFORE FLIPPING: the founder's own admin_config SELECT
    // (2026-08-07) returned all eighteen tier-keyed cap keys, minimum value 3.
    // No key stores 0 today, so no vendor's meter moves on the deploy — the
    // semantic changes, the numbers do not. A bench cell asserts that reading.
    const val = (k, dflt) => { const r = (cfg || []).find((c) => c.key === k); const n = r ? parseInt(r.value, 10) : NaN; return Number.isFinite(n) && n >= 0 ? n : dflt; };
    const dayCap = val(dayKey, 25), monCap = val(monKey, 250);
    const dayUsed = dayRes.count || 0, monUsed = monRes.count || 0;
    // Report the NEARER window (higher used/cap ratio); enforce BOTH (CE-6).
    //
    // F-10.85's SECOND HALF. Once 0 became a lawful cap, `dayUsed / dayCap` could
    // evaluate 0/0 = NaN, and every comparison against NaN is false — so a vendor
    // DENIED by a zero day-cap would have been correctly capped by the line below
    // and then told, in CAPPED_LINE, that she had used up her MONTH (0/250). True
    // refusal, false reason. A denial that misreports why it happened sends the
    // founder hunting the wrong dial and the vendor arguing with the wrong number.
    // A cap of zero is not "no usage"; it is fully consumed. Ratio Infinity.
    const ratio = (used, cap) => (cap > 0 ? used / cap : Infinity);
    const nearer = ratio(dayUsed, dayCap) >= ratio(monUsed, monCap)
      ? { turns_used: dayUsed, turns_cap: dayCap, window: 'day' }
      : { turns_used: monUsed, turns_cap: monCap, window: 'month' };
    const capped = dayUsed >= dayCap || monUsed >= monCap;
    const state = capped ? 'capped' : (nearer.turns_used / nearer.turns_cap >= 0.8 ? 'nearing' : 'ok');
    // ── TDW_10 · R-26.14 §B — THE UPGRADE HREF RE-POINTED. RULED. ────────────
    // WAS: '/vendor/settings#tier'. The Billing tab is live at origin, so the
    // picker no longer lives on the settings page — that page holds a signpost.
    //
    // AND THE FRAGMENT WAS NEVER DOING ITS JOB. F-10.101, FOUNDER-WITNESSED on a
    // cold-load walk: the anchor DOES NOT SCROLL AND NEVER HAS. `id="tier"` mounts
    // only after the /me fetch resolves inside an effect, and a browser resolves a
    // fragment at load and does not retry on a later mutation. So a capped vendor
    // tapping Upgrade landed at the TOP of a settings page and had to hunt — on the
    // one screen she reaches at the exact moment she has been refused. My own
    // derivation had softened this to "a race"; the walk was harder than the
    // derivation, and the walk wins.
    //
    // NO FRAGMENT NOW, deliberately: /vendor/billing IS the picker, so there is
    // nothing to scroll to.
    //
    // THIS IS EVENT (1) OF A TWO-EVENT RETIREMENT, and event (2) is not ours.
    // app/vendor/settings/page.tsx (dreamos-pwa) carries `id="tier"` on a permanent
    // signpost, and its own comment says the anchor retires only when BOTH have
    // happened: (1) this line re-points — done here — AND (2) Railway redeploys
    // dream-os so the new href is actually SERVED. Until the deploy lands, live
    // clients are still being handed the old address from the wire, so deleting
    // that anchor before then breaks the Upgrade link for every capped vendor.
    // (Mechanism named in-comment per F-06.85 so the pwa sitting that finally
    // deletes it is forced to check the deploy rather than the diff.)
    return { tier: productTier, ...nearer, state, upgrade: { label: 'Upgrade', href: require('../../lib/pwaPaths').vendorPath('billing') } }; // F-38.p12 · W-1 ruling CE-39 E: the one home, value unchanged today
  } catch (e) {
    console.warn('[vendor-e chat:meta] failed (open meter):', e.message);
    return null; // a broken meter NEVER blocks a turn
  }
}
// ═══ TDW_10 · R-26.15 ① — THE SPENT-ALLOWANCE SENTENCE, FOUNDER-RULED ═══════
// AMENDED BY RULING, NOT BY DEFECT, and the distinction matters to the record.
// F-10.100's ratified acceptance required this line BYTE-UNCHANGED, and it shipped
// that way. The founder then ruled it, and a ruling outranks an acceptance number
// the same chair set. The old bytes, kept here so the diff is readable:
//
//   「 You've used this day's conversations on the signature tier (250/250). The
//     desk reopens at midnight — or step up a tier and keep going. 」
//
// THREE THINGS LEFT, each for its own reason:
//
//   THE FIGURES. `(250/250)` invited an argument with a number instead of stating
//   a fact. The meter already renders the count above the input bar; a vendor who
//   wants the arithmetic has it, and the sentence does not need to litigate.
//
//   THE TIER WORD. It rendered the RAW database token mid-sentence — 「 on the
//   basic tier 」, lowercase, because `meta.tier` is the column value. That was a
//   known founder question held open beside F-10.100. 「 your tier 」 retires the
//   whole class rather than patching a capitalisation, and it stays true through
//   any future rename — which is the lesson 0115 paid for.
//
//   ⚠ 「 step up a tier 」 — RETIRED BY FOUNDER RULING (R-26.15 ②), AND THE REASON
//   IS A MECHANISM, SO F-06.85 BINDS IT HERE. Tokens are coming. He will not sell
//   an upgrade he is about to replace. This seat's SHAPE is deliberately preserved
//   for a 「 buy tokens 」 line to take later — so a future sitting reading a bare
//   two-sentence refusal does not restore an upgrade prompt thinking it was an
//   omission. It was a decision. Read this comment before adding a sale here.
//
// WHAT SURVIVES, and it is load-bearing: the `window === 'day'` branch. It is the
// only thing standing between a monthly-capped vendor and a promise of a midnight
// that never comes for her — the same class of falsehood F-10.100(b) retired at a
// zero cap, one window over.
//
// IDENTICAL ON BOTH LANES. No route line, unlike the zero-cap sentence below:
// that one is a sale and needs somewhere to go; this one is a WAIT. There is
// nothing to tap, because there is nothing to do but come back.
const CAPPED_LINE = (meta) =>
  meta.window === 'day'
    ? "You've reached today's conversation limit on your tier. The desk reopens at midnight."
    : "You've reached this month's conversation limit on your tier. The desk reopens on the 1st.";

// ═══ TDW_10 · F-10.100(b) — THE ZERO-CAP SENTENCE, FOUNDER-RULED 2026-08-07 ═══
// THE LIE THIS RETIRES, rendered verbatim by CAPPED_LINE at cap 0 until today:
//   「 You've used this day's conversations on the basic tier (0/0). The desk
//     reopens at midnight — or step up a tier and keep going. 」
// Three falsehoods in one sentence to a vendor who had just said hello: she used
// nothing, nothing reopens at midnight, and the tier renders as its raw database
// token. F-10.85 made a zero cap LAWFUL — it did not make this sentence true.
//
// The ruled bytes arrived through the chair as the founder's own (CE R-26.7 §A).
// They are not paraphrased, not re-wrapped, not "improved": copy under veto lives
// as bytes. The lowercase raw-token render in CAPPED_LINE is a KNOWN, separately
// held founder question and is deliberately NOT fixed here (ruled: do not fix).
//
// Money register holds by construction: no rupee glyph, no k/L/Cr shorthand, no
// figure at all — the sentence names tiers, and the prices live on the surface
// that sells them.
const CAP_ZERO_LINE =
  "The AI desk isn't part of Basic. Please upgrade to Essential Tier and above to enjoy controlling your Business through AI chat and WhatsApp. " +
  'Your first month is free — you only pay from the second month, for the plan you choose.';

// The WhatsApp lane says the same three sentences and then one more, because on
// WhatsApp there is nothing to tap. The PWA gets a control (app/vendor/page.tsx,
// R-26.7 §C F-4); this lane gets directions to it.
//
// ⚠ THIS LINE NAMES A DESTINATION THAT MUST EXIST BEFORE THIS SHIPS. 「 Billing 」
// is being built in a parallel sitting at /vendor/billing. The founder holds the
// push order for exactly this reason: a refusal that sends a vendor to a door
// that isn't there is the same class of defect as the sentence it replaces.
// Verified at this seat's tip: the avatar menu (components/vendor/Header.tsx)
// carries Settings, NOT Billing. Do not push this ZIP before that one lands.
const WA_CAP_ZERO_LINE = CAP_ZERO_LINE +
  '\n\nTo upgrade: open your TDW dashboard, tap your initials at the top, and choose Billing.';

// ── ONE SELECTOR, BOTH LANES. The PWA calls it at its two refusal seats; the
// WhatsApp gate calls its own sibling constant. Keying on `turns_cap === 0` and
// never on the tier WORD is deliberate: the console dial is the interim lever
// the founder ruled he would regulate Basic's AI through, and a vendor on ANY
// tier whose cap he sets to zero is in the same situation and deserves the same
// true sentence. A tier-word predicate would have made this cure a rename's
// hostage the next time the vocabulary moved — 0115's whole lesson.
const cappedReplyFor = (meta) => (meta.turns_cap === 0 ? CAP_ZERO_LINE : CAPPED_LINE(meta));

// POST /chat — one advisor turn. Vendor comes from the JWT (no :vendorId param),
// matching the Myra chat contract. ai_primer / mode are accepted and ignored:
// the engine runs advisory Victor and has no edit-priming mechanism (the Myra
// handler likewise accepted-and-ignored its `history` field).
router.post('/', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  const body    = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ ok: false, error: 'message is required.' });

  // ── SSE streaming path ──────────────────────────────────────────────────────
  // When the PWA sends Accept: text/event-stream, stream Victor's reply token by token
  // (the blob fills as he writes) plus the pair-at-work beats. The JSON path below is
  // untouched — curls, evals, and any non-stream caller behave exactly as before.
  const wantsStream = (req.headers['accept'] || '').includes('text/event-stream');
  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    let streamDead = false;
    res.on('error', (err) => { streamDead = true; console.warn('[vendor-e chat SSE] res error (absorbed):', err.message); });
    const send = (obj) => {
      if (streamDead || res.writableEnded) return;
      try { res.write(`data: ${JSON.stringify(obj)}\n\n`); }
      catch (err) { streamDead = true; console.warn('[vendor-e chat SSE] write failed:', err.message); }
    };

    try {
      send({ type: 'thinking' });
      const productTier = (req.vendor && req.vendor.tier) || 'basic';
      const metaPre = await buildMeta({ supabase: req.app.locals.supabase, agentId: req.agentId, tier: productTier }); // TDW_02 P5 (CE-6): both windows · F-10.100: plain-args
      if (metaPre && metaPre.state === 'capped') {
        send({ type: 'text_delta', text: cappedReplyFor(metaPre) });
        send({ type: 'done', tool_calls: [], refresh: false, meta: metaPre });
        if (!res.writableEnded) res.write('data: [DONE]\n\n');
        return res.end();
      }
      const llmWiring = await buildLlmForTurn({ supabase: req.app.locals.supabase, vendor: req.vendor, agentId: req.agentId }); // TDW_02 P5 · P7b ctx
      const calendarSnapshot = await fetchCalendarSnapshot(req);
      const scratchpad = await fetchScratchpad(req);
      const recentActivity = await fetchRecentBlock(req); // TDW_02 P4 (CE-4)
      const result = await runTurn({
        agentId: req.agentId,
        message,
        calendarSnapshot,
        scratchpad,
        recentActivity,
        // 04.5 P6 (Fork B): the door normalises, the engine compares — one home for the
        // predicate, so the planner VOICE and the planner GAP LINE cannot diverge.
        vendorCategory: normaliseCategoryForTurn(req.vendor.category),
        tierOverride: llmWiring.tierOverride,
        modelOverride: llmWiring.modelOverride,
        transport: llmWiring.transport,
        donnaTransport: llmWiring.donnaTransport,
        donnaModelOverride: llmWiring.donnaModelOverride,
        onEvent: (e) => { const safe = translateBeat(e, req.vendor.id); if (safe) send(safe); },
      });
      if (result.provider_downgrade) {
        logActivity(req.app.locals.supabase, { vendorId: req.vendor.id, surface: 'pwa', action: 'provider_downgrade', summary: `provider ${llmWiring.route.provider} downgraded to Haiku mid-turn` }).catch(() => {});
      }

      // Invoices are minted after the turn (donna_invoice_pdf is a signal). The reply has
      // already streamed, so the "ready" line rides as a final text_delta before done.
      const documents = await buildInvoices(req, result);
      if (documents.length) send({ type: 'text_delta', text: '\n\n' + invoiceLines(documents) });

      // TDW_04 B4 — F-04.55's cure, chat half. bookEvents' signature changed with it
      // ({booked, refused}); this is one of its two disclosed call sites (Q-B2-7).
      const { booked, refused } = await bookEvents(req, result);
      if (booked.length) send({ type: 'text_delta', text: '\n\n' + bookingLines(booked) });
      // THE REFUSAL, IN HIS VOICE. Ordered AFTER bookingLines and it matters: one turn
      // can book two dates and be refused a third, and the vendor is owed both facts in
      // the order they happened — what landed, then what did not.
      if (refused.length) send({ type: 'text_delta', text: '\n\n' + conflictLines(refused) });

      const mutated = await mutateEvents(req, result);
      if (mutated.length) send({ type: 'text_delta', text: '\n\n' + mutationLines(mutated) });
      // Advisories on writes that LANDED — beside the success line, never instead of it
      // (Q-B4-5(b)). mutationLines already spoke for the write; this speaks for the
      // heads-up. C9's "never blocks", honoured one layer up from the gate.
      const advised = mutated.filter((m) => m.ok && m.conflict && m.conflict.message);
      if (advised.length) send({ type: 'text_delta', text: '\n\n' + advisoryLines(advised) });

      // §1.5's two hands. scrubText wraps them for the same reason bookingLines is
      // wrapped (F-04.33's seam): these strings carry a vendor-supplied reason straight
      // back to the wire, and a reason is free text.
      const blocked = await blockDates(req.app.locals.supabase, req.vendor.id, result);
      if (blocked.length) send({ type: 'text_delta', text: '\n\n' + scrubText(blockLines(blocked)) });

      const unblocked = await unblockDates(req.app.locals.supabase, req.vendor.id, result);
      if (unblocked.length) send({ type: 'text_delta', text: '\n\n' + scrubText(unblockLines(unblocked)) });

      // TDW_06 D-6 — F-04.81's mechanical half: the open-question line. The wire
      // IS its live rendering (no chip exists for a hand that never fired); the
      // stored twin rides composedTail below, last, same bytes through the same
      // scrub. Sent after every door line — the open state speaks last.
      const openLine = donnaOpenLine(result);
      if (openLine) send({ type: 'text_delta', text: '\n\n' + scrubText(openLine) });

      await retroLinkOnFile(req, result);
      await lockstepBinderToEvent(req, result);
      await logChatActivity(req, result); // TDW_04 B0 item 3
      // TDW_04 B6 sitting 2 — Q-B4-6(b): the door lines join the thread's row.
      // Awaited (one UPDATE) so a refresh cannot race the patch it exists to fix.
      await persistComposedReply(req, result,
        composedTail({ witnessed: donnaWitnessLines(req.vendor.id, result), documents, booked, refused, mutated, advised, blocked, unblocked, open: openLine }));
      const guardVerdict = await wireGuardSpecimen(req.app.locals.supabase, req.vendor.id, result, req.agentId); // wire guard — PWA site 1 of 2 (SSE)

      const toolNames = (result.tool_calls || []).map((t) => t.name);
      // ── STAGE 2, SSE SEAT — REPLACE-AT-DONE (CE-ruled). The model's body has already
      // streamed as text_delta by the time the guard runs, so interception here cannot
      // be a never-reached; it is a transient glimpse replaced at `done`. That product
      // texture was put to the founder and ACCEPTED at the veto round. The backend half
      // is this additive payload; the pwa client swaps the message text on the flag.
      const s2sse = stage2Intercept(guardVerdict, false);
      const done = { type: 'done', tool_calls: s2sse ? [] : toolNames, refresh: s2sse ? false : toolNames.length > 0 };
      if (s2sse) {
        done.intercept = { replaced: true, text: s2sse };
        // F-06.130: the delivery witness. This seat has no Fork D, so its resolution point IS
        // the decision to emit the payload — the bytes below are what the client swaps in.
        await stage2RecordDelivery(req.app.locals.supabase, guardVerdict && guardVerdict.run_id, { arm: 'glitch_line', delivered: s2sse, seat: 'pwa_sse' });
      }
      // TDW_02 P3 (CE-17): the turn view crosses the wire, completeness attached.
      if (result.view && result.view.length) done.view = result.view.map((r) => ({ ...r, missing_cells: missingCells(r) }));
      done.meta = await buildMeta({ supabase: req.app.locals.supabase, agentId: req.agentId, tier: productTier }); // TDW_02 P5: the meter, every turn
      if (documents.length) done.documents = documents.map((d) => ({ invoice_number: d.invoice_number, pdf_url: d.pdf_url }));
      send(done);
      if (!streamDead && !res.writableEnded) res.write('data: [DONE]\n\n');
      res.end();
      fireHarvest(req, message, result); // TDW_02 P4 — after the wire closes
    } catch (e) {
      console.error('[vendor-e chat SSE]', e.message);
      send({ type: 'error', message: 'Chat failed.' });
      if (!res.writableEnded) { try { res.write('data: [DONE]\n\n'); } catch (_e) { /* gone */ } res.end(); }
    }
    return;
  }
  try {
    const productTier = (req.vendor && req.vendor.tier) || 'basic';
    const metaPre = await buildMeta({ supabase: req.app.locals.supabase, agentId: req.agentId, tier: productTier }); // TDW_02 P5 (CE-6) · F-10.100: plain-args
    if (metaPre && metaPre.state === 'capped') {
      return res.json({ ok: true, capped: true, reply: cappedReplyFor(metaPre), tool_calls: [], refresh: false, meta: metaPre });
    }
    const llmWiring = await buildLlmForTurn({ supabase: req.app.locals.supabase, vendor: req.vendor, agentId: req.agentId }); // TDW_02 P5 · P7b ctx
    const calendarSnapshot = await fetchCalendarSnapshot(req);
    const scratchpad = await fetchScratchpad(req);
    const recentActivity = await fetchRecentBlock(req); // TDW_02 P4 (CE-4)
    const result    = await runTurn({ agentId: req.agentId, message, calendarSnapshot, scratchpad, recentActivity, vendorCategory: normaliseCategoryForTurn(req.vendor.category), tierOverride: llmWiring.tierOverride, modelOverride: llmWiring.modelOverride, transport: llmWiring.transport, donnaTransport: llmWiring.donnaTransport, donnaModelOverride: llmWiring.donnaModelOverride });
    if (result.provider_downgrade) {
      logActivity(req.app.locals.supabase, { vendorId: req.vendor.id, surface: 'pwa', action: 'provider_downgrade', summary: `provider ${llmWiring.route.provider} downgraded to Haiku mid-turn` }).catch(() => {});
    }

    const documents = await buildInvoices(req, result);
    // TDW_04 B4 — the second of bookEvents' two disclosed call sites.
    const { booked, refused } = await bookEvents(req, result);
    const mutated   = await mutateEvents(req, result);
    const advised   = mutated.filter((m) => m.ok && m.conflict && m.conflict.message);
    const blocked   = await blockDates(req.app.locals.supabase, req.vendor.id, result);   // §1.5
    const unblocked = await unblockDates(req.app.locals.supabase, req.vendor.id, result); // §1.5
    await retroLinkOnFile(req, result);
    await lockstepBinderToEvent(req, result);
    await logChatActivity(req, result); // TDW_04 B0 item 3
    // TDW_04 B6 sitting 2 — Q-B4-6(b): same call, same order, the JSON route's copy
    // of the SSE line above (the tail builder is the ONE ordered list for both).
    // TDW_06 sitting 0 (D-2): `witnessed` joins on BOTH routes — the stored row is
    // the cure's target and both routes store. This route's RETURNED `reply` below
    // is deliberately untouched (curl/eval bytes are existing behaviour, and this
    // route has no chip to twin); the divergence is one line, disclosed.
    // TDW_06 D-6: `open` joins on both routes too — and unlike `witnessed` it ALSO
    // joins this route's returned reply below, following the door-line convention
    // (booked/refused/mutated all do): a NEW line has no curl bytes to preserve,
    // and the line's live rendering is text on every surface.
    const openLine = donnaOpenLine(result);
    await persistComposedReply(req, result,
      composedTail({ witnessed: donnaWitnessLines(req.vendor.id, result), documents, booked, refused, mutated, advised, blocked, unblocked, open: openLine }));
    const guardVerdict = await wireGuardSpecimen(req.app.locals.supabase, req.vendor.id, result, req.agentId); // wire guard — PWA site 2 of 2 (JSON)

    // CE-18: the firewall covers the reply itself. TDW_06 M-4 / F-06.36: and now it
    // leaves a witness. Wired here as well as on the WhatsApp door because this file's
    // twin-miss is the exact disease scrub.js's own header (:19-25) exists to refuse —
    // curing one shape and missing its twin is how the class survives.
    // ── STAGE 2, PWA JSON SEAT. The guard ran immediately above; this route assembles
    // its returned `reply` HERE, after it — which is why the JSON route has a real
    // pre-delivery seam and the SSE route does not (there the model's body has already
    // streamed token-by-token, so its leg is the replace-at-done payload below).
    // On a costume the vendor receives the founder's vetoed line INSTEAD of the
    // fabrication; the door lines appended afterwards are the estate's own honest
    // speech about hands that actually fired, and a costume has none, so nothing is lost.
    const s2 = stage2Intercept(guardVerdict, false);
    if (s2) {
      // F-06.130: the delivery witness, recorded before the bytes leave — this route's
      // pre-delivery seam is the resolution point, and nothing intervenes after it.
      await stage2RecordDelivery(req.app.locals.supabase, guardVerdict && guardVerdict.run_id, { arm: 'glitch_line', delivered: s2, seat: 'pwa_json' });
      return res.json({
        ok: true, reply: s2, tool_calls: [], refresh: false,
        meta: await buildMeta({ supabase: req.app.locals.supabase, agentId: req.agentId, tier: productTier }),
        intercept: { replaced: true },
      });
    }
    let reply = witnessWireScrub(req.app.locals.supabase, req.vendor.id, 'pwa', String(result.reply ?? ''), scrubText(result.reply), 'chat.js:reply');
    // F-04.33: this route hand-rolled the invoice line instead of calling the builder —
    // precisely how a seam gets missed. One builder, one scrub, both routes.
    if (documents.length) reply += '\n\n' + invoiceLines(documents);
    if (booked.length) reply += '\n\n' + bookingLines(booked);
    if (refused.length) reply += '\n\n' + conflictLines(refused);   // TDW_04 B4 — F-04.55
    if (mutated.length) reply += '\n\n' + mutationLines(mutated);
    if (advised.length) reply += '\n\n' + advisoryLines(advised);   // TDW_04 B4 — Q-B4-5(b)
    if (blocked.length) reply += '\n\n' + scrubText(blockLines(blocked));       // §1.5
    if (unblocked.length) reply += '\n\n' + scrubText(unblockLines(unblocked)); // §1.5
    if (openLine) reply += '\n\n' + scrubText(openLine);                        // TDW_06 D-6, last

    fireHarvest(req, message, result); // TDW_02 P4 — response is fully built; fires post-return
    const toolNames = (result.tool_calls || []).map((t) => t.name);
    return res.json({
      ok: true,
      reply,
      tool_calls: toolNames,
      refresh: toolNames.length > 0,
      // TDW_02 P3 (CE-17): the turn view crosses the wire, completeness attached.
      view: result.view && result.view.length ? result.view.map((r) => ({ ...r, missing_cells: missingCells(r) })) : undefined,
      meta: await buildMeta({ supabase: req.app.locals.supabase, agentId: req.agentId, tier: productTier }), // TDW_02 P5: the meter, every turn
      documents: documents.length ? documents.map((d) => ({ invoice_number: d.invoice_number, pdf_url: d.pdf_url })) : undefined,
    });
  } catch (e) {
    console.error('[vendor-e chat]', e.message);
    return res.status(500).json({ ok: false, error: 'Chat failed.' });
  }
});

// GET /chat/history/:vendorId — display-only scrollback so the PWA chat shows the
// recent transcript on open instead of a blank screen. NOT agent memory (the
// engine reads history itself). Reads the agent's most-recent conversation (the
// one runTurn reuses within the session window), last N messages, mapped to the
// PWA shape: engine role 'user'->'user', 'assistant'->'ai' ('tool' rows skipped).
router.get('/history/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  const eng   = req.app.locals.supabase.schema('engine');
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  try {
    const { data: convo } = await eng.from('conversations')
      .select('id').eq('agent_id', req.agentId)
      .order('last_active_at', { ascending: false }).limit(1).maybeSingle();
    if (!convo) return res.json({ ok: true, messages: [] });

    const { data: rows, error } = await eng.from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convo.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[vendor-e chat/history] query error:', error.message);
      return res.status(500).json({ ok: false, error: 'Could not load history.' });
    }

    const messages = (rows || [])
      .reverse()
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'ai', text: m.content, at: m.created_at }));
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error('[vendor-e chat/history]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not load history.' });
  }
});

// ── TDW_06 D-7 — the new-thread endpoint (the PWA rider's backend half). ──────
// D-4 chartered the button; D-7 rules its machinery: ONE endpoint that closes
// the active conversation CLEANLY, using memory.ts's OWN abandonment shape —
// `.update({ state: 'abandoned' })` — the exact write getOrCreateConversation
// performs when the 30-minute timeout fires (memory.ts, read at HEAD: any
// state !== 'active' reads as stale and the next turn starts fresh). NEVER a
// delete: the conversation row and every message under it stand untouched —
// the scrollback persists on the estate, and the PWA's job is to make that a
// visible truth (the divider, ZIP 2's PWA half), not a caption claim.
// Idempotent by construction: no active conversation -> { ok: true, closed: null }
// (the timeout may already have done the work; tapping twice is harmless).
// On the vendor's next message, getOrCreateConversation finds nothing active
// and inserts a fresh thread — the interim relief's mechanism, on demand.
// TDW_06 P7a (F-06.8, CE-ratified): the mode-flip fresh-thread seam — ONE home, both
// flip surfaces chain it. A mid-thread mode flip must not leave the next turn reading the
// prior room's turns (Image-1: advisor-Victor reading the business thread's cabinet). The
// cure abandons the agent's active conversation (memory.ts's own 'abandoned' state — NEVER
// a delete; D-4's no-clear law: the rows persist, scrollback stays, the seam renders) so
// the next turn opens fresh with ZERO prior-room turns. Idempotent: nothing active ->
// { ok:true, closed:null } — safe to call on a no-op flip. Callers: POST /thread/fresh
// below (the PWA chip chains it after a successful mode PATCH) and the WA mode-words seam
// (src/index.js) once item 3 lands. Exported for both and for b06_fresh_thread_bench.
async function abandonActiveThread(supabase, agentId) {
  const eng = supabase.schema('engine');
  const { data: convo } = await eng.from('conversations')
    .select('id, state')
    .eq('agent_id', agentId)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!convo || convo.state !== 'active') {
    return { ok: true, closed: null }; // nothing active — already fresh
  }
  const { error } = await eng.from('conversations')
    .update({ state: 'abandoned' }) // memory.ts's own shape — never delete
    .eq('id', convo.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, closed: convo.id };
}

router.post('/thread/fresh', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  try {
    const r = await abandonActiveThread(req.app.locals.supabase, req.agentId);
    if (!r.ok) {
      console.error('[vendor-e chat/thread-fresh] update failed:', r.error);
      return res.status(500).json({ ok: false, error: 'Could not close the thread.' });
    }
    return res.json({ ok: true, closed: r.closed });
  } catch (err) {
    console.error('[vendor-e chat/thread-fresh]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not close the thread.' });
  }
});

// ── TDW_06 F-06.130 — THE GLITCH-REPORT ROUTE (the chip's missing endpoint) ─────────────
// Sited on the EXACT middleware chain witnessed one route above (`/thread/fresh`), and the
// chain is cited fresh at this tip rather than carried from an earlier ruling's `:1991` —
// the Stage-2 additions moved it, and a chain quoted from memory is the class this estate
// files findings about.
//
// FORK 6b: the chip posts NOTHING but its session. It carries no run id on the wire, because
// one resolution path with one failure mode is worth more than the round trip a uuid saves —
// and it is the SAME `fileGlitchReport` the WhatsApp word calls, so the two legs can never
// disagree about which turn a vendor is complaining about.
router.post('/glitch-report', requireAuth, resolveVendor(), resolveAgent(), async (req, res) => {
  try {
    const r = await fileGlitchReport(req.app.locals.supabase, req.agentId);
    console.log(`[vendor-e chat/glitch-report] filed=${r.filed} run=${r.run_id || 'none'} agent=${req.agentId}`);
    return res.json({ ok: true, filed: r.filed, message: r.message });
  } catch (err) {
    console.error('[vendor-e chat/glitch-report]', err.message);
    return res.status(500).json({ ok: false, error: 'Could not file that.' });
  }
});

module.exports = router;
// ── TEST SEAMS (TDW_04 B4) — occupancy.js's ratified precedent ────────────
// The bench drives the REAL builders. conflictLines/mutationLines/advisoryLines are
// where F-04.55's and F-04.62's cures live; a bench that re-implemented their branch
// order would prove its own copy and nothing else.
module.exports.conflictLines  = conflictLines;
module.exports.mutationLines  = mutationLines;
module.exports.advisoryLines  = advisoryLines;
// ── TEST SEAMS (TDW_04 B6, R-B6-1) — same precedent, same reason ──────────
// fetchCalendarSnapshot is where F-04.66's cure and P4.1's line live; resolveEvent
// is the two-leg gate. b6_referent_bench drives the REAL ones: the no-UUID
// assertion runs by regex against THIS function's built output, never a copy.
module.exports.fetchCalendarSnapshot = fetchCalendarSnapshot;
module.exports.resolveEvent          = resolveEvent;
// ── TEST SEAM (TDW_04.5 P1 #4) — same precedent, same reason ──────────────
// mutateEvents is the resolving door leg; b0457_assign_bench drives the REAL one
// (with the REAL resolveEvent, writeEvent, memberNameMatches and mutationLines behind
// it) against the sealed crew bench's proven double — a bench that re-implemented the
// resolve→delta→write path would prove its own copy and nothing else.
module.exports.mutateEvents          = mutateEvents;
// ── TEST SEAMS (TDW_04 B6 sitting 2, Q-B4-6(b)) — same precedent, same reason ──
// persistComposedReply is where F-04.41's cure lives; composedTail is the one
// ordered list. b6_sitting2_bench drives the REAL pair against a capturing
// double — a bench that re-implemented the append order would prove its copy.
module.exports.persistComposedReply  = persistComposedReply;
module.exports.composedTail          = composedTail;
// ── TEST SEAMS (TDW_06 sitting 0, D-2) — same precedent, same reason ──────
// donnaWitnessLines + chipFiling are where F-04.41's lead-plane cure lives, and
// translateBeat is the chip whose byte-identity the one-home move must prove.
// b6_witness_bench drives the REAL three (with the REAL deriveFiling and the REAL
// scrubText behind them) — a bench that re-implemented the branch order would
// prove its own copy and nothing else.
module.exports.donnaWitnessLines     = donnaWitnessLines;
module.exports.chipFiling            = chipFiling;
module.exports.translateBeat         = translateBeat;
// ── TEST SEAM (TDW_06 D-6) — same precedent, same reason ──────────────────
// donnaOpenLine is where F-04.81's mechanical half lives (the guard's three
// clauses + the minted line). b6_open_question_bench drives the REAL one, with
// the REAL composedTail, persistComposedReply and scrubText behind it.
module.exports.donnaOpenLine         = donnaOpenLine;
// ── TEST SEAM (TDW_06 economics sitting) — same precedent, same reason ─────
// actionKind is the ONE write/read/calendar vocabulary (D-1: only nested hands
// convict, and this is the word that classifies a hand). b06_gauntlet.js
// convicts candidates with the REAL classifier — a gauntlet that re-implemented
// it would convict against its own copy and nothing else.
module.exports.actionKind            = actionKind;
module.exports.wireGuardClassify     = wireGuardClassify;  // wire guard Stage 1 test seam
module.exports.wireGuardSpecimen     = wireGuardSpecimen;  // wire guard Stage 1 test seam
module.exports.priorDeedLookup       = priorDeedLookup;    // Fork A' test seam (rework)
module.exports.stage2Intercept       = stage2Intercept;   // wire guard Stage 2 — the ONE predicate
module.exports.stage2Armed           = stage2Armed;
module.exports.stage2Line            = stage2Line;
module.exports.STAGE2_LINE_MUTATION  = STAGE2_LINE_MUTATION;
module.exports.STAGE2_LINE_LOOKUP    = STAGE2_LINE_LOOKUP;
module.exports.STAGE2_WA_REPORT      = STAGE2_WA_REPORT;
// TDW_06 F-06.130 — the REPORT catcher's seams. The bench drives the REAL ones (Q-SP-5).
module.exports.stage2RecordDelivery  = stage2RecordDelivery;  // the delivery witness, Fork D's resolution
module.exports.findDeliveredWitness  = findDeliveredWitness;  // the windowed, agent-keyed lookup
module.exports.fileGlitchReport      = fileGlitchReport;      // FORK 6b: the ONE home, both legs
module.exports.GLITCH_REPORT_NO_CONTEXT = GLITCH_REPORT_NO_CONTEXT; // SLOT ONE (founder-vetoed)
module.exports.GLITCH_REPORT_FILED      = GLITCH_REPORT_FILED;      // SLOT THREE (founder-vetoed)
module.exports.REPORT_WINDOW_MS         = REPORT_WINDOW_MS;         // FORK 3-B (founder's number)
// ── TDW_06 F-06.136 — the imperative arm's seams. Exported on actionKind's own precedent
// and for its reason: the bench drives the REAL predicate, so a bench green and a live
// arming can never disagree about what an owner-imperative even is.
module.exports.imperativeMiss        = imperativeMiss;     // the ONE arming predicate
module.exports.ownerImperative       = ownerImperative;    // the verb-family leg alone
module.exports.matchingHands         = matchingHands;      // the D-1-fenced hand leg alone
module.exports.OWNER_IMPERATIVE_RE   = OWNER_IMPERATIVE_RE;
module.exports.IMPERATIVE_STEMS      = IMPERATIVE_STEMS;
module.exports.recordImperativeRetry = recordImperativeRetry;
module.exports.isDeedOfClass         = isDeedOfClass;      // Fork A' class-match test seam
module.exports.PRIOR_DEED_LOOKBACK   = PRIOR_DEED_LOOKBACK;
// ── WIRE GUARD STAGE 1 · THE CLAIM VOCABULARY'S ONE HOME (2026-07-28). Exported on
// actionKind's own precedent, and for its reason: b06_gauntlet requires the REAL ones
// so its convictions and production's specimens can never disagree about what a claim
// even is. A rig that re-implemented these would prove its own copy and nothing else.
module.exports.ACTION_CLAIM_RE       = ACTION_CLAIM_RE;
module.exports.JOT_CLAIM_RE          = JOT_CLAIM_RE;
module.exports.COMPLETED_ACT_RE      = COMPLETED_ACT_RE;
module.exports.NARRATED_LOOKUP_RE    = NARRATED_LOOKUP_RE;
// F-06.104's constant is exported for BENCH READ ONLY. It is Stage-1-scoped by ruling:
// wireGuardClassify is its only consumer, and no gauntlet arm reads it — which is how
// the masking law is honored by construction while the shared four stay byte-identical.
module.exports.MUTATION_CLAIM_RE     = MUTATION_CLAIM_RE;
module.exports.RELAY_CLAIM_RE        = RELAY_CLAIM_RE;   // F-06.159 — one home; the rig borrows
module.exports.CONFIRM_SHAPE_RE      = CONFIRM_SHAPE_RE; // F-06.166 — the imitated commitment
module.exports.RELAY_VERB_RE         = RELAY_VERB_RE;    // R-29.32 ① — the door's trigger
module.exports.VERBATIM_RE           = VERBATIM_RE;      // R-29.32 ② — the vendor's own bytes
module.exports.RELAY_DEED_RE         = RELAY_DEED_RE;
module.exports.patchComposedReply    = patchComposedReply; // R-29.26 — the core both doors call
module.exports.ACK_INTENT_RE         = ACK_INTENT_RE;
// TDW_06 P6b (F-06.4/F-06.2): door-seam seams exposed for b06_advisor_route_bench.
module.exports.buildLlmForTurn       = buildLlmForTurn;
module.exports.abandonActiveThread   = abandonActiveThread; // TDW_06 P7a (F-06.8): shared flip seam
module.exports.fireHarvest           = fireHarvest;
module.exports.advisorHarvestGate    = advisorHarvestGate;
module.exports.readVictorMode        = readVictorMode;
// TDW_10 F-10.100: the cap seam, exported for the WhatsApp door (src/lib/vendorInbound.js,
// the word trio's fourth member) and for tdw10_combined_cap. `buildMeta` is now plain-args
// for exactly this reason — the WA lane has no Express req. The three copy constants are
// exported so the bench asserts the SHIPPED bytes rather than its own copies of them; a
// bench holding its own transcription of a vetoed string proves the transcription.
module.exports.buildMeta             = buildMeta;
// R-26.15 ①: the spent-allowance sentence is IDENTICAL on both lanes, so the WA
// door imports THIS one rather than holding a transcription of it. One home.
module.exports.CAPPED_LINE           = CAPPED_LINE;
module.exports.CAP_ZERO_LINE         = CAP_ZERO_LINE;
module.exports.WA_CAP_ZERO_LINE      = WA_CAP_ZERO_LINE;
module.exports.cappedReplyFor        = cappedReplyFor;
