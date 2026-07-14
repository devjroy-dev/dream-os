// src/lib/undoContract.js — TDW_02 P6: filings + undo, derived from Donna's own
// witnessed results. THE LAW (spec P6 + F8's thesis): a chip renders only what a
// door actually confirmed, and an undo points only at an EXISTING witnessed door
// that honestly reverses the act. No honest reverse -> no undo (never a fake one).
//
// Undo targets (verified handlers, protocol §6):
//   lead create        -> DELETE /api/v2/vendor/leads/:id            (CE-2 door)
//   binder open        -> POST   /api/v2/vendor/binders/:v/:id/hide  (donna_hide)
//   money CORRECTION   -> POST   .../:id/money-edit  body = the PRIOR figure,
//                         parsed from donna_money_edit's own before->after display;
//                         parse failure -> no undo (honest).
//   invoice mint       -> PATCH  /api/v2/vendor/invoices/:id/cancel  (only when the
//                         result exposes the invoice UUID; number-only -> no undo).
// Deliberately WITHOUT undo (logged scope): donna_lead enrich + donna_edit/note on
// existing rows (prior values unwitnessed), initial donna_money (zeroing through the
// correction door would FABRICATE a correction event — the honest reverse of a fresh
// money+binder is the binder chip's hide).
'use strict';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function ref(plane, id) { return id ? { plane, id } : undefined; }

function deriveFiling(vendorId, name, input, result) {
  const r = typeof result === 'string' ? result : '';

  // F3: an ERROR display never crosses raw — the honest failure line + retry flag.
  if (r.startsWith('ERROR')) {
    return {
      kind: 'error',
      summary: "That didn't land — nothing was changed.",
      retryable: true,
    };
  }

  if (name === 'donna_lead') {
    const created = r.match(/Lead saved\. id=([0-9a-f-]{36})/i);
    if (created) {
      const nm = (r.match(/name=([^,]+),/) || [])[1];
      return {
        kind: 'write',
        summary: `Lead filed${nm && nm !== 'unknown' ? `: ${nm}` : ''}`,
        record_ref: ref('typed', created[1]),
        undo: { method: 'DELETE', path: `/api/v2/vendor/leads/${created[1]}` },
      };
    }
    const updated = r.match(/Updated existing lead "([^"]*)" \(id=([0-9a-f-]{36})\)/i);
    if (updated) {
      return { kind: 'write', summary: `Lead updated: ${updated[1]}`, record_ref: ref('typed', updated[2]) };
    }
    return { kind: 'write', summary: 'Lead filed' };
  }

  if (name === 'donna_client') {
    const m = r.match(/Record ([0-9a-f-]{36}) created/i);
    if (m) {
      const client = (r.match(/client[= ]"?([^".\n]+)/i) || [])[1];
      return {
        kind: 'write',
        summary: `Binder opened${client ? `: ${client.trim()}` : ''}`,
        record_ref: ref('records', m[1]),
        undo: { method: 'POST', path: `/api/v2/vendor/binders/${vendorId}/${m[1]}/hide` },
      };
    }
    return { kind: 'write', summary: 'Binder updated' };
  }

  if (name === 'donna_money_edit') {
    const id = (input && input.binder_id) || (r.match(UUID) || [])[0];
    // Prior figures from the door's own confession: "received: (empty) → Rs 15,000" etc.
    const prior = {};
    for (const [field, key] of [['received', 'amount_received'], ['pending', 'amount_pending'], ['amount', 'amount']]) {
      const m = r.match(new RegExp(`${field}: \\(?([^)→]+?)\\)? →`, 'i'));
      if (m) prior[key] = /empty/i.test(m[1]) ? '0' : (m[1].match(/[\d,]+/) || [''])[0].replace(/,/g, '');
    }
    const hasPrior = Object.values(prior).some((v) => v !== undefined && v !== '');
    return {
      kind: 'write',
      summary: 'Money corrected',
      record_ref: ref('records', id),
      ...(id && hasPrior ? { undo: { method: 'POST', path: `/api/v2/vendor/binders/${vendorId}/${id}/money-edit`, body: prior } } : {}),
    };
  }

  if (name === 'donna_money') {
    const id = (input && input.binder_id) || (r.match(UUID) || [])[0];
    const amt = (r.match(/Rs [\d,]+/) || [])[0];
    return { kind: 'write', summary: `Money filed${amt ? `: ${amt}` : ''}`, record_ref: ref('records', id) };
  }

  if (name && name.startsWith('donna_invoice')) {
    const id = (r.match(UUID) || [])[0];
    const num = (r.match(/INV[-\w]+/i) || [])[0];
    return {
      kind: 'write',
      summary: `Invoice minted${num ? `: ${num}` : ''}`,
      ...(id ? { record_ref: ref('typed', id), undo: { method: 'PATCH', path: `/api/v2/vendor/invoices/${id}/cancel` } } : {}),
    };
  }

  // Everything else: a witnessed write worth a chip, no undo claimed.
  const id = (input && input.binder_id) || (r.match(UUID) || [])[0];
  const VERB = { donna_note: 'Note filed', donna_note_append: 'Note added', donna_date: 'Date set', donna_phone: 'Phone filed', donna_stage: 'Stage moved', donna_edit: 'Binder edited', donna_hide: 'Binder archived', donna_doc: 'Document linked' };
  return { kind: 'write', summary: VERB[name] || 'Filed', record_ref: ref('records', id) };
}

module.exports = { deriveFiling };
