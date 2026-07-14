// recordCompleteness.js — TDW_02 P3, records-plane read-time completeness.
// Amendment One follow-on rulings CE-15 (computed HERE, applied at the LIVE
// serving surfaces: ledger.js + cabinet.js slices + the turn view) and CE-16
// (the expected-set semantics below; the spec's match-rule mechanism was
// circular — a matched record has its rule's cells by construction).
//
// >>> CONSUMER + AMENDER: TDW_03 (binder cards). Evolve the expected-set HERE
// >>> — one exported constant, per-column evolution welcome — never a second
// >>> computation elsewhere. (CE-16's amendment, verbatim intent.)
//
// Semantics (CE-16, ruled): every binder expects `client`; all expect `phone`
// and `date`; `amount` is expected only when `direction` is set (a money
// story). Null/undefined/'' count as absent.
'use strict';

const RECORD_EXPECTED = {
  always: ['client', 'phone', 'date'],
  money_story: ['amount'], // applies when direction is set
};

function absent(v) { return v === null || v === undefined || String(v).trim() === ''; }

function missingCells(rec) {
  const missing = RECORD_EXPECTED.always.filter((c) => absent(rec[c]));
  if (!absent(rec.direction)) {
    for (const c of RECORD_EXPECTED.money_story) if (absent(rec[c])) missing.push(c);
  }
  return missing;
}

// The wishbone draft block for a binder row (spec P3 wire; consumed by TDW_03).
// complete_inline is the binder edit door (POST — the door's real verb; the
// spec's type literal said PATCH, corrected to code truth, logged in handover).
function binderDraft(rec, vendorId, missing) {
  if (!missing.length) return undefined;
  const label = rec.client || 'this binder';
  return {
    missing,
    complete_inline: { method: 'POST', path: `/api/v2/vendor/binders/${vendorId}/${rec.id}/edit` },
    tell_victor: { path: '/vendor', primer: `About ${label}: the ${missing[0]} is ` },
  };
}

// Augment an array of binder rows with missing_cells (+ draft when incomplete).
function withRecordCompleteness(rows, vendorId) {
  return (rows || []).map((r) => {
    const missing = missingCells(r);
    const draft = binderDraft(r, vendorId, missing);
    return draft ? { ...r, missing_cells: missing, draft } : { ...r, missing_cells: missing };
  });
}

module.exports = { RECORD_EXPECTED, missingCells, withRecordCompleteness };
