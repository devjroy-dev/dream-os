'use strict';
// src/lib/victorLines.js — THE VICTOR SITTING'S FOUNDER-VETOED BYTES. ONE HOME.
//
// ── APPROVED COPY · FOUNDER-VETOED 2026-09-04 (R-40.2) · FROZEN AT THE BYTE ──
// APPROVED-COPY-CARRIES-ITS-HASH (CE-207). These are frozen as BYTES, not
// intents. A comma, the em-dash, a capital — any edit is a FRESH VETO and may
// not ride a refactor. `LINE_HASHES` below is the mechanism, not a decoration:
// `assertLineHashes()` recomputes sha256 over each shipped string and throws on
// drift, and `b40_victor_sitting_bench` pins every hash as a literal. An edit
// that is not also a veto fails the bench AND the module's own self-check.
//
// R-40.2's own closing clause, quoted so a later reader does not have to fetch
// the ruling: 「 the seat ships them as constants in one home, hash-carried per
// the approved-copy law, never re-voiced 」. NEVER RE-VOICED is the load-bearing
// half — the door speaks these; the model is never asked to paraphrase them,
// because a paraphrase of a vetoed byte is an unvetoed byte.
//
// WHY A DOOR CONSTANT AND NOT A SOUL SENTENCE. The Victor sitting's own
// derivation (read-first 2 §3): the soul paragraph at harveySoul:173 states the
// law completely and the walk still produced the lie. B4 (soul re-siting) was
// REFUSED at R-VS.7 on exactly that evidence. So the honest sentence is authored
// by the machinery that KNOWS — deedState.js's shape, and its sentence: the
// model is not being asked to be careful, it is being handed the answer.

const crypto = require('crypto');

// ── LINES 1, 2, 3, 5 — SPOKEN BY THE DOOR ───────────────────────────────────
// Line 4 is deliberately NOT here: it is a SHAPE Victor speaks, not a sentence
// the door speaks, and its figures come from the fact block (R-40.2: 「 line 4's
// figures are the fact block's, never the model's arithmetic 」). Its exemplars
// live below under MONEY_SHAPE, used as the renderer's format contract and as
// the bench's fixture assertion — never injected into another vendor's turn.
const VICTOR_LINES = {
  // 1 · an expense claim with no hand. R-39.18 keeps log_expense in Block 09;
  //     F-40.5 keeps the island's copy dead. Until then Victor refuses honestly.
  EXPENSE_NO_HAND:
    "That one I can't file. Nothing was written, so treat it as unrecorded until you put it in yourself.",

  // 2 · VACATED (R-VS.13, 2026-09-04). R-40.2 line 2 was ratified on R-VS.3's
  //     premise that no door existed to a lead. THE PREMISE WAS FALSE — the chair
  //     vacated it and owned the error (c-40.6): a lead in this estate is a couple
  //     who wrote in, and `donna_relay_stage`/`donna_relay_send` are Victor's line
  //     to one, live and walked since CE-215. The line said "I have no line to him
  //     from here", which was a FALSEHOOD in a founder-vetoed byte.
  //
  //     NO REPLACEMENT IS MINTED. `relaySeat.js`'s `second_costume:relay_lane`
  //     already owns this sentence — honest denial, draft re-shown verbatim, a
  //     yes/no naming the recipient — founder-vetoed, hashed and walked on
  //     production. A second home for it would be the disease wearing a veto.
  //
  //     The number is deliberately NOT reused: a later reader finding lines 1, 3
  //     and 5 must see that 2 existed and was withdrawn, not guess at a gap.

  // 3 · the ledger could not be read. R-VS.2's fail-closed clause: this line, and
  //     NOTHING ELSE ON MONEY IS SAID THAT TURN. "Could not read it" is never
  //     "nothing is owed" — the estate's standing sentence, kept.
  LEDGER_UNREADABLE:
    "I can't read your ledger this minute, so I won't guess at what's outstanding. Ask again in a moment.",

  // ── EXPENSE_UNREADABLE · NAMED, NOT NUMBERED (chair, CE-42 V-2, veto V-7) ──
  // The expense plane's half of the same fail-closed clause, founder-vetoed
  // 2026-09-10. IT IS DELIBERATELY NOT AN R-40.2 LINE NUMBER: line 2 stays
  // VACATED (R-VS.13) and no new number is minted, so a later reader still sees
  // the gap at 2 rather than a renumbering that papers over it.
  //
  // LEDGER_UNREADABLE COULD NOT BE REUSED and that is the whole reason this byte
  // exists: it says "what's outstanding", which is the INVOICE plane. Speaking it
  // when the expense book failed to read would answer the wrong question with a
  // confident sentence — the exact shape F-42.97 was filed for.
  EXPENSE_UNREADABLE:
    "I can't read your expense book this minute, so I won't guess at what you have spent. Ask again in a moment.",

  // 5 · the advisor word on WhatsApp. R-VS.4 = D1, enforcing R-39.22: advisory
  //     lives in the Advisor room alone; the lane is business, always.
  ADVISOR_ON_WHATSAPP:
    "Advisor mode lives in the app — open the Advisor room there. Here on WhatsApp it's business, always.",

  // ── 6, 7, 8 · THE INTRODUCTION SLOTS · FOUNDER-VETOED 2026-09-10 (W-1, 4a) ──
  // R-41.11's three facts, and the whole soul radius of packet 4a beside byte 9.
  // The chair's W-1 ruling: "those four strings and the four reused bytes are the
  // whole soul radius of 4a. Nothing else." No persona name, no new voice.
  //
  // WHY ONLY THREE SLOTS ARE ASKED FOR. docs/TEMPLATES.md §2 entry 13 declares
  // {{1}} recipient's name, {{2}} the vendor or business name, {{3}} where they
  // met — and the url button's suffix. {{2}} is `vendors.business_name` and the
  // suffix is `vendors.routing_handle`; both are read off her own row and are
  // NEVER asked. Asking a vendor her own business name is friction she did not
  // ask for (relaySeat.js:296's rule, applied one lane over).
  //
  // THE DOOR SPEAKS THESE AND THE MODEL NEVER PARAPHRASES THEM — R-40.2's
  // "never re-voiced" clause, which is the load-bearing half of the approved-copy
  // law: a paraphrase of a vetoed byte is an unvetoed byte.
  //
  // `them / their`, where the relay lane says `her`. The recipient of an
  // introduction is a stranger of unknown gender; guessing would put a wrong word
  // in the vendor's mouth to a person she met once. Chair-ruled: "a stranger's
  // gender is not ours to guess."

  // 6 · the number. The country code is asked for as a FACT, not a courtesy:
  //     users.phone is stored E.164 (+919888294440, the founder's own row read
  //     2026-09-10) and D4 put a country-code twin refusal on the tree.
  INTRO_ASK_NUMBER:
    "What's their number? Include the country code.",

  // 7 · the name. Literally true — the body opens `Hi {{1}}, this is {{2}}`.
  //     On the walk this is the ONE question the vendor sees, because her ask
  //     ("send my page to <number>, met at <place>") gives the other two.
  INTRO_ASK_NAME:
    "What's their name? It goes at the top of the message.",

  // 8 · where they met. R-41.11 stated as a fact rather than a request: names the
  //     place they met or it does not send. `where_met` is NOT NULL in 0161, so
  //     this sentence and the column are one law in two places on purpose.
  INTRO_ASK_WHERE:
    "Where did you meet them? I can't send this without it.",

  // ── 9 · NOT DELIVERED · FOUNDER-VETOED (chair's B3 ruling, carried verbatim) ─
  // docs/filings/B1_CONCIERGE_TEMPLATES.md:88-92 is the reason this byte exists:
  // every recipient of an introduction has, by construction, never messaged this
  // WABA, so a share of sends are silently withheld under Meta's per-user
  // MARKETING cap — and R-41.11 forbids any follow-up. A THROTTLED introduction
  // and an IGNORED introduction are indistinguishable to the vendor unless the
  // send arm says otherwise, and without this line she reads Meta's silence as
  // the person's answer. "I will not retry" is not a limitation being confessed;
  // it is R-41.11's no-follow-up law spoken out loud.
  //
  // NOT relaySeat.js's `sendFailedLine`: that byte says "Nothing reached her" and
  // "The draft is saved", both wrong here — the recipient's gender is unknown and
  // there is no draft to save on a plane where the body is fixed at Meta.
  INTRO_NOT_DELIVERED:
    'Not delivered. WhatsApp did not accept it, and I will not retry.',

  // ── 10 · ALREADY INTRODUCED · FOUNDER-VETOED (chair's ruling, 4a re-cut) ────
  // The gap 4a's first cut declared and did not fill. R-41.11 is two halves of
  // one law — no cold numbers, and no follow-up to an unanswered introduction —
  // and `uq_introductions_vendor_recipient` (0161) makes it structural. The arm
  // refuses BEFORE the database does (R-41.146: the double refuses what the
  // database refuses), but until this byte existed that refusal was SILENT on her
  // glass: a typed code, a log line, and nothing said. A structural law the
  // vendor cannot hear is a dead end wearing a rule's clothes.
  //
  // "go once" is the law stated, not a limitation apologised for. There is
  // deliberately no "would you like to…" — every alternative this estate could
  // offer her here is the follow-up R-41.11 forbids.
  INTRO_ALREADY_SENT:
    'Already sent to this number. Introductions go once.',
};

// ── LINE 4 · THE MONEY SHAPE ────────────────────────────────────────────────
// The two ratified exemplars, verbatim. They are the FORMAT CONTRACT for
// lib/vendor/moneyFacts.js's renderer and the fixture assertion for the bench
// (acceptance: 「 the five ratified bytes acquit on DEV440's fixture rows by
// SELECT, never recalled 」). They are NOT injected into a turn: they name Priya
// Nair and Rohan Mehta, and putting one vendor's fixture into another vendor's
// context is the neighbouring-line donor pool ruling A-3 closed (F-04.70).
const MONEY_SHAPE = {
  SINGLE: 'Priya Nair owes you Rs 60,000 — invoice /05, unpaid.',
  PLURAL:
    'Two invoices outstanding, Rs 1,10,000 in all: Priya Nair Rs 60,000 (/05, unpaid), Rohan Mehta Rs 50,000 (/07, advance paid).',
};

// ── THE STATE WORDS · R-40.2: 「 State words from the invoice document's list only 」
// The invoice document's positive list, sealed at CE-39 band 6 §4: Unpaid ·
// Advance paid · Paid · Cancelled. Rendered lower-case inside a sentence, which
// is where the fact block uses them. A POSITIVE LIST AND NEVER A NEGATION —
// R-39.12's rule on this exact table, kept here so a future state cannot arrive
// unlabelled and be spoken as something it is not.
const STATE_WORDS = {
  unpaid: 'unpaid',
  advance_paid: 'advance paid',
  paid: 'paid',
  cancelled: 'cancelled',
};

// ── THE HASHES · sha256 of the shipped bytes, hex ────────────────────────────
// Recomputed at load by assertLineHashes(); pinned as literals by the bench. The
// two mechanisms are deliberately different in kind (a runtime self-check and a
// committed literal), because a self-check alone would re-derive the hash of
// whatever the file now says and agree with itself.
const LINE_HASHES = {
  EXPENSE_NO_HAND: 'c400bc688434a6bfa9fc2414bd3590f2f1fcb4739975b096eab0a380d2e42291',
  LEDGER_UNREADABLE: '70af765dfab2ef49bf14b41c717fd3e00c437893083689b288000db2e635570f',
  // CE-42 seat V-2, F-42.97 — the expense plane's fail-closed line, vetoed 2026-09-10.
  EXPENSE_UNREADABLE: 'c53465a418384fc878b6b440e39c9e146671fb20e7c16f67fcafb4a99e508b93',
  ADVISOR_ON_WHATSAPP: 'eedc31106b740fb72b827807031f7f57d9bb532565c642ce0b22518bbdc21851',
  // CE-42 seat E2, packet 4a — the four introduction bytes, vetoed 2026-09-10.
  INTRO_ASK_NUMBER:    '66995d580664ba33182811f99c0ac42cabcd69a2ce4d6c0c49d57379b49f42a7',
  INTRO_ASK_NAME:      '8bd926211ca8f0c1da754d34c9f258dc9052fc0c1afa0829bd9e145a1ccad516',
  INTRO_ASK_WHERE:     'cade222061fa8919361dcddf6a846fdfbf2a1b8e13f80494190bbe03f50345e7',
  INTRO_NOT_DELIVERED: 'cae4e06a365bb2ba619aab4fc819a181509203856c2899ecaa08d48b4d4dee57',
  INTRO_ALREADY_SENT:  '73e72a65f4c850fe64b132023d86214598bb76eaadd6f834c98a781909482092',
};

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

// Throws on drift. Called at module load so an edited byte cannot ship quietly:
// the process that requires this module dies at boot rather than speaking an
// unvetoed sentence to a vendor. That direction is deliberate — a copy law that
// fails open is a copy law that is not enforced.
function assertLineHashes() {
  const drift = [];
  for (const key of Object.keys(VICTOR_LINES)) {
    const got = sha256(VICTOR_LINES[key]);
    if (LINE_HASHES[key] !== got) drift.push(`${key}: expected ${LINE_HASHES[key]}, got ${got}`);
  }
  if (drift.length) {
    throw new Error(
      'victorLines.js — APPROVED COPY DRIFT (R-40.2, hash-carried). An edit to a ' +
      'founder-vetoed byte is a FRESH VETO and may not ride a refactor. ' + drift.join(' | '));
  }
  return true;
}

// ── F-42.46 · THE LOAD-TIME GUARD THIS FILE CLAIMED AND DID NOT HAVE ────────
// CE-42 seat E2, packet 4a. The comment above `assertLineHashes` has said since
// CE-40 that it is "called at module load so an edited byte cannot ship quietly:
// the process that requires this module dies at boot rather than speaking an
// unvetoed sentence to a vendor", and the header at :8 says the same. NO SUCH
// CALL EXISTED at fd9d0da4 — derived by command: the only occurrences of the
// symbol in this file were its definition (:111) and its export (:131), and the
// only caller anywhere in the tree was scripts/b40_victor_sitting_bench.js:234.
//
// So the enforcement was a BENCH, not a boot: an edited byte shipped fine and
// spoke to a vendor, and only a floor run said otherwise. This file's own
// closing sentence names why that is not good enough — "a copy law that fails
// open is a copy law that is not enforced" — and it was describing itself.
//
// One line, and now the two mechanisms are what the comment always promised: a
// runtime self-check AND a committed literal, different in kind, because a
// self-check alone re-derives the hash of whatever the file now says and agrees
// with itself.
assertLineHashes();

module.exports = {
  VICTOR_LINES,
  MONEY_SHAPE,
  STATE_WORDS,
  LINE_HASHES,
  sha256,
  assertLineHashes,
};
