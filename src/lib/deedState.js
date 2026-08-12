// deedState.js — THE PER-TURN DEED STATE (B-09H D-4 · F-09.174 · F-09.182)
//
// SOLE AUTHOR of the words a door uses to say what actually happened on THIS
// turn. Before this module the circle agent was told, in a cached sentence on
// every turn, that "the system has already saved it" — and it said so whether
// the save landed, failed, or never happened at all. F-09.174 is that sentence.
//
// LD-5 — the why, attached. A deed and a sentence about a deed are two
// different facts, and the estate had only the sentence. Every state below is
// something the machinery KNOWS by the time the model is called; threading them
// costs one string and removes the model's need to guess. The model is not
// being asked to be careful — it is being handed the answer.
//
// ── APPROVED COPY · FOUNDER-VETOED 2026-08-13 (V6) · FROZEN AT THE BYTE ──────
// APPROVED-COPY-CARRIES-ITS-HASH: these are frozen as BYTES, not intents. An
// edit — a comma, the em-dash, the header's colon — is a FRESH VETO and may not
// ride a refactor. b09_d4_honestmouth_bench pins every one as a literal.
//
// ⚠ F-06.85 MECHANISM: `saved as save #N` interpolates `muse_saves.save_number`,
// which museSave.js mints. If a sitting ever changes what a save is numbered by,
// or lets a save land without a number, this line reports the new fact silently
// and the member is told a number that means something else. Whoever moves
// save_number re-reads this file.

const DEED = {
  SAVED:         'saved',
  SAVE_FAILED:   'save_failed',
  NOTE_RECORDED: 'note_recorded',
  NOTE_FAILED:   'note_failed',
  DECLINED:      'declined',
  NOTHING:       'nothing',
};

const DEED_STATE_HEADER = "THIS TURN'S DEED STATE: ";

// The state's own sentence. Default is NOTHING rather than SAVED: the failure
// mode of an unrecognised state must be silence about a deed, never a claim of
// one. That direction is the whole finding.
function deedStateText(deed) {
  switch (deed && deed.kind) {
    case DEED.SAVED:
      return `saved as save #${deed.saveNumber}`;
    case DEED.SAVE_FAILED:
      return 'save failed — say so plainly and ask them to resend, do not apologise at length';
    case DEED.NOTE_RECORDED:
      return 'note recorded';
    case DEED.NOTE_FAILED:
      return 'note not recorded — say so plainly';
    case DEED.DECLINED:
      return `declined: ${deed.reason}`;
    default:
      return 'nothing to record';
  }
}

function deedStateLine(deed) {
  return DEED_STATE_HEADER + deedStateText(deed);
}

// ── THE AUDIT SHAPE (F-09.183 rider) ────────────────────────────────────────
// Each outcome must be distinguishable in the record, not only in the model's
// context. `saved` and `save_failed` are carried by the inbound row's body
// (brideIndex.js / brideInbound.js:599 — V7's byte). `declined` is carried by
// the OUTBOUND row's `tool_calls`, which until this diff was hardcoded `[]` on
// every circle turn — a bare absence assertion over turns where tools had in
// fact run. This is that column doing its own job, not an overload: a refusal
// IS a tool result.
//
// DECLARED, NOT PAPERED: `note_recorded` and `note_failed` share one audit
// shape. The inbound row's body is her words on both, and the only cure that
// would separate them is a new model-voiced byte appended to that body. No such
// byte was put to the founder in D-4's sheet, so none is invented here. The
// deed LINE distinguishes them for the model today; the ROW does not.
function toolCallRecord(name, result) {
  return {
    name,
    ok:      !!(result && result.ok),
    refused: !!(result && result.refused),
    reason:  (result && (result.refused_reason || result.error)) || null,
  };
}

module.exports = {
  DEED,
  DEED_STATE_HEADER,
  deedStateText,
  deedStateLine,
  toolCallRecord,
};
