'use strict';
// src/lib/ownNumber/events.js · CE-45 · G6-1 · 2a · WHAT HAPPENS TO A CHANGE ON A VENDOR'S OWN NUMBER.
// RECEIPT ONLY IN 2a (read-first F4, ruled): a couple's message is RECORDED and not answered; 2b answers.
// Everything lands in vendor_wa_events, private to her (FQ5; Tech Provider terms §3.2: nothing derived
// from her WhatsApp is read for anyone else). No reader across vendors exists for this table.
//
// AUTO-PAUSE AS STATE ONLY (F5, §7b constraint 3). nextStatus() maps Meta's account and quality events
// onto her row. Stopping sends from her number is 2b's; in 2a nothing is ever sent from it.
const KIND_BY_FIELD = {
  messages: 'inbound',
  history: 'history',
  smb_app_state_sync: 'contacts',
  smb_message_echoes: 'echo',
  account_update: 'account_update',
  phone_number_quality_update: 'quality_update',
};
const SUSPEND_ACCOUNT = ['ACCOUNT_RESTRICTION', 'ACCOUNT_VIOLATION', 'DISABLED_UPDATE'];
const GONE = ['PARTNER_REMOVED', 'PARTNER_APP_UNINSTALLED', 'ACCOUNT_DELETED', 'ACCOUNT_OFFBOARDED'];
const QUALITY_DOWN = ['FLAGGED', 'DOWNGRADE'];
const QUALITY_UP = ['UNFLAGGED', 'UPGRADE'];

/**
 * Pure: her row's next status and pause reason for one event, or null for "no change".
 * A quality recovery lifts only a QUALITY pause; an account restriction is lifted only by Meta's
 * reinstatement (DISABLED_UPDATE with REINSTATE) or a reconnect. Never throws.
 */
function nextStatus(row, field, value) {
  const cur = row && row.status;
  const ev = value && typeof value.event === 'string' ? value.event : null;
  if (!cur || !ev) return null;
  if (field === 'account_update') {
    if (GONE.includes(ev)) return { status: 'migrated_out', paused_reason: `account:${ev}` };
    if (ev === 'ACCOUNT_RECONNECTED') return { status: 'active', paused_reason: null };
    if (ev === 'DISABLED_UPDATE' && value.ban_info && value.ban_info.waba_ban_state === 'REINSTATE') return { status: 'active', paused_reason: null };
    if (SUSPEND_ACCOUNT.includes(ev)) return { status: 'suspended', paused_reason: `account:${ev}` };
    return null;
  }
  if (field === 'phone_number_quality_update') {
    if (QUALITY_DOWN.includes(ev) && cur !== 'migrated_out') return { status: 'suspended', paused_reason: `quality:${ev}` };
    if (QUALITY_UP.includes(ev) && cur === 'suspended' && String(row.paused_reason || '').startsWith('quality:')) return { status: 'active', paused_reason: null };
    return null;
  }
  return null;
}

/** Pure: Meta's "history not shared" (2593109) is her choice, recorded as such (walk plan (c)). */
function historyDeclined(value) {
  const h = value && Array.isArray(value.history) ? value.history : [];
  return h.some((x) => x && Array.isArray(x.errors) && x.errors.some((e) => e && Number(e.code) === 2593109));
}

async function handle(supabase, own, change, now = () => new Date()) {
  const field = change && change.field;
  const value = (change && change.value) || {};
  const kind = KIND_BY_FIELD[field];
  if (!kind) { console.log(`[own-number] ${own.vendor_id} ${field || '(no field)'} not kept in 2a`); return { kept: false }; }
  if (kind === 'inbound' && !(Array.isArray(value.messages) && value.messages.length)) {
    return { kept: false }; // delivery statuses for her number: 2a sends nothing, so there are none to keep
  }
  const ins = await supabase.from('vendor_wa_events').insert({ vendor_id: own.vendor_id, kind, payload: value }).select('id');
  if (ins.error || !ins.data || ins.data.length !== 1) throw new Error(`vendor_wa_events insert: ${ins.error ? ins.error.message : 'no row'}`);
  if (kind === 'history' && historyDeclined(value)) console.log(`[own-number] ${own.vendor_id} declined history sharing (2593109): recorded, not a failure`);
  // Status is decided on her row as it is NOW, not on the map's cached copy (up to 60s old).
  let fresh = own;
  if (field === 'account_update' || field === 'phone_number_quality_update') {
    const r = await supabase.from('vendor_wabas').select('vendor_id, status, paused_reason').eq('vendor_id', own.vendor_id).maybeSingle();
    if (r.error) throw new Error(`vendor_wabas read: ${r.error.message}`);
    if (!r.data) return { kept: true, kind, next: null };
    fresh = r.data;
  }
  const next = nextStatus(fresh, field, value);
  if (next && (next.status !== fresh.status || next.paused_reason !== (fresh.paused_reason || null))) {
    const up = await supabase.from('vendor_wabas')
      .update({ status: next.status, paused_reason: next.paused_reason, updated_at: now().toISOString() })
      .eq('vendor_id', own.vendor_id).select('status');
    if (up.error || !up.data || up.data.length !== 1) throw new Error(`vendor_wabas status: ${up.error ? up.error.message : 'no row'}`);
    console.warn(`[own-number] ${own.vendor_id} ${fresh.status} -> ${next.status} (${next.paused_reason || 'cleared'})`);
  }
  return { kept: true, kind, next };
}

module.exports = { handle, nextStatus, historyDeclined, KIND_BY_FIELD };
