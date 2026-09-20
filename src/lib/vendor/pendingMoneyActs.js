'use strict';
// src/lib/vendor/pendingMoneyActs.js  THE CONFIRMATION TABLE'S ONE DOOR. CE-44 LC-Victor P5.
//
// Before any act that moves money (a booking, an advance, a payment) the door STAGES it here and
// asks her (B1 or B2); it applies only on her whole-message yes. Keyed by vendor, so a yes on either
// lane finds it (read-first item 6). Table: public.pending_money_acts (db/migrations/0169).
//
// THE RULES, AS RULED (B item 3; R-44.21 (c); F-44.53):
//   · LIVE = state 'staged' AND expires_at in the future. Only a live row answers a yes or a no.
//   · YES and NO are the WHOLE trimmed message in a closed list (trailing . or ! dropped). The relay
//     seat's AFFIRM_RE is NOT used: it hears "confirmed" and "send" as yes (F-44.53).
//   · The wait is 15 minutes, the founder's number: WAIT_MIN below, its own constant, and 0169's
//     column default says the same as a backstop.
//   · ONE OPEN ROW PER VENDOR (0169's partial unique index). Staging a new act first CLOSES every open
//     row: a staged one becomes 'expired'; a row left at 'confirmed' with resolved_at empty (a yes
//     received and the apply crashed before it stamped) keeps its state, since no sixth word is
//     minted, and gains outcome { code: 'refused:apply_unstamped' } as the honest record.
//
// COLUMN WITNESS: 0169 itself (this packet): id, vendor_id, act, request, lane, state, outcome,
// created_at, resolved_at, expires_at.
//
// TOTAL: every function here never throws. A failed read is "no live row" (the turn goes to the
// chain, byte-identical to today); a failed write returns false and the caller stands aside.

const TABLE = 'pending_money_acts';
const WAIT_MIN = 15;
const ACTS = Object.freeze(['booking_confirmed', 'advance_paid', 'milestone_paid']);
const YES = Object.freeze(['yes', 'yeah', 'yep', 'ok', 'okay', 'haan', 'ha']);
const NO = Object.freeze(['no', 'nahi', 'cancel']);

// 'yes' | 'no' | null for her whole message.
function decide(message) {
  try {
    if (typeof message !== 'string') return null;
    const w = message.trim().toLowerCase().replace(/[.!]+$/, '').trim();
    if (YES.includes(w)) return 'yes';
    if (NO.includes(w)) return 'no';
    return null;
  } catch (_e) { return null; }
}

function isRow(r, vendorId) {
  try {
    return !!r && typeof r === 'object' && typeof r.id === 'string' && r.vendor_id === vendorId
      && ACTS.includes(r.act) && typeof r.state === 'string' && r.request && typeof r.request === 'object';
  } catch (_e) { return false; }
}
function isLive(r, nowMs) {
  try {
    const t = Date.parse(r.expires_at);
    return r.state === 'staged' && !r.resolved_at && Number.isFinite(t) && t > (Number.isFinite(nowMs) ? nowMs : Date.now());
  } catch (_e) { return false; }
}

// Every OPEN row (resolved_at empty) for this vendor, well-formed only. [] on any failure.
async function openRows(supabase, vendorId) {
  try {
    if (!supabase || typeof supabase.from !== 'function' || typeof vendorId !== 'string') return [];
    const { data, error } = await supabase.from(TABLE)
      .select('id, vendor_id, act, request, lane, state, outcome, created_at, resolved_at, expires_at')
      .eq('vendor_id', vendorId).is('resolved_at', null);
    if (error || !Array.isArray(data)) return [];
    return data.filter((r) => isRow(r, vendorId) && !r.resolved_at);
  } catch (_e) { return []; }
}

// The one LIVE row, or null.
async function liveRow(supabase, vendorId, nowMs) {
  const rows = await openRows(supabase, vendorId);
  const live = rows.filter((r) => isLive(r, nowMs));
  return live.length === 1 ? live[0] : null;
}

async function closeRow(supabase, row, state, outcome) {
  try {
    const patch = { resolved_at: new Date().toISOString() };
    if (state) patch.state = state;
    if (outcome !== undefined) patch.outcome = outcome;
    const { error } = await supabase.from(TABLE).update(patch).eq('id', row.id).eq('vendor_id', row.vendor_id).is('resolved_at', null);
    return !error;
  } catch (_e) { return false; }
}

// Close every open row before a new stage (the stuck-row rule), then insert. The staged row or null.
async function stage(supabase, what) {
  try {
    const { vendorId, act, request, lane } = (what && typeof what === 'object') ? what : {};
    if (!ACTS.includes(act) || !request || typeof request !== 'object' || !['pwa', 'whatsapp'].includes(lane)) return null;
    for (const r of await openRows(supabase, vendorId)) {
      if (r.state === 'staged') await closeRow(supabase, r, 'expired');
      else await closeRow(supabase, r, null, { code: 'refused:apply_unstamped', note: 'yes received; apply did not record its result' });
    }
    const expires = new Date(Date.now() + WAIT_MIN * 60 * 1000).toISOString();
    const { data, error } = await supabase.from(TABLE)
      .insert({ vendor_id: vendorId, act, request, lane, state: 'staged', expires_at: expires })
      .select('id, vendor_id, act, request, lane, state, created_at, expires_at').single();
    if (error || !isRow(data, vendorId)) return null;
    return data;
  } catch (_e) { return null; }
}

// The live row answered: 'confirmed' on a yes (before the hand runs), 'declined' on a no.
async function markConfirmed(supabase, row) {
  try {
    const { error } = await supabase.from(TABLE).update({ state: 'confirmed' }).eq('id', row.id).eq('state', 'staged').is('resolved_at', null);
    return !error;
  } catch (_e) { return false; }
}
async function markDeclined(supabase, row) { return closeRow(supabase, row, 'declined'); }
async function markExpired(supabase, row) { return closeRow(supabase, row, 'expired'); }
async function markApplied(supabase, row, outcome) { return closeRow(supabase, row, 'applied', outcome === undefined ? null : outcome); }

module.exports = { TABLE, WAIT_MIN, ACTS, YES, NO, decide, isLive, openRows, liveRow, stage, markConfirmed, markDeclined, markExpired, markApplied };
