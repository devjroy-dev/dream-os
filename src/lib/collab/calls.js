'use strict';
// src/lib/collab/calls.js · CE-47 · CLB-2a · A CALL TDW SENDS FOR A VENDOR, AT HER REQUEST (the admin's "Forward a
// request", PTN's screen). createCallFor({ vendor_id, role, city, event_date, budget_from, budget_to, pay_kind, source,
// asked_at }) -> { post_id }. The call is hers like any other: she sees it with the line "Sent by TDW at your request".
// Ruled (CE-47, 6 October 2026): it goes to TDW's own Instagram and Threads only if she ticks it on the call herself,
// so no share row is made here. It reaches the open board at once (no roster-first window: she did not choose one).
const { isCollabRole } = require('./roles');
const { PAY_KINDS } = require('./social');
const { postCreated } = require('./events');

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const int = (v) => (v == null || v === '' ? null : (Number.isInteger(Number(v)) && Number(v) >= 0 ? Number(v) : NaN));

async function createCallFor(supabase, input, deps = {}) {
  const b = input || {}; const now = deps.now ? deps.now() : new Date();
  if (b.source !== 'tdw_forward') throw new Error("source must be 'tdw_forward'");
  if (!b.vendor_id) throw new Error('vendor_id is needed');
  if (!isCollabRole(b.role)) throw new Error(`${b.role} is not a collab role`);
  if (!String(b.city || '').trim()) throw new Error('city is needed');
  if (!YMD.test(String(b.event_date || ''))) throw new Error('event_date must be YYYY-MM-DD');
  if (new Date(`${b.event_date}T23:59:59+05:30`) < now) throw new Error('the date has passed');
  const from = int(b.budget_from); const to = int(b.budget_to);
  if (Number.isNaN(from) || Number.isNaN(to)) throw new Error('budget_from and budget_to are whole rupees');
  if (from != null && to != null && from > to) throw new Error('budget_from is more than budget_to');
  if (b.pay_kind != null && !PAY_KINDS.includes(b.pay_kind)) throw new Error('pay_kind must be paid, unpaid or credit_only');
  const { data: v } = await supabase.from('vendors').select('id').eq('id', b.vendor_id).maybeSingle();
  if (!v) throw new Error('no such vendor');
  const asked = b.asked_at ? new Date(b.asked_at) : now;
  const row = { vendor_id: b.vendor_id, requirement_type: b.role, event_date: b.event_date, city: String(b.city).trim(),
    open_to_other_cities: false, budget_from: from, budget_to: to, pay_kind: b.pay_kind || null, state: 'open',
    source: 'tdw_forward', asked_at: Number.isNaN(asked.getTime()) ? now.toISOString() : asked.toISOString(), reference_urls: [] };
  const { data: post, error } = await supabase.from('collab_posts').insert(row).select('id, vendor_id, city, event_date').single();
  if (error) throw new Error(error.message);
  const { error: e2 } = await supabase.from('collab_post_items').insert({ post_id: post.id, position: 0, requirement_type: b.role, note: null, needed: 1 });
  if (e2) { await supabase.from('collab_posts').delete().eq('id', post.id); throw new Error(e2.message); }
  await postCreated({ post_id: post.id, vendor_id: b.vendor_id, city: row.city, event_date: row.event_date, pay_kind: row.pay_kind,
    source: 'tdw_forward', roles: [{ role: b.role, needed: 1 }], first_look_until: null });
  return { post_id: post.id };
}

module.exports = { createCallFor };
