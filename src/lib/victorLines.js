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

  // 5 · the advisor word on WhatsApp. R-VS.4 = D1, enforcing R-39.22: advisory
  //     lives in the Advisor room alone; the lane is business, always.
  ADVISOR_ON_WHATSAPP:
    "Advisor mode lives in the app — open the Advisor room there. Here on WhatsApp it's business, always.",
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
  ADVISOR_ON_WHATSAPP: 'eedc31106b740fb72b827807031f7f57d9bb532565c642ce0b22518bbdc21851',
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

module.exports = {
  VICTOR_LINES,
  MONEY_SHAPE,
  STATE_WORDS,
  LINE_HASHES,
  sha256,
  assertLineHashes,
};
