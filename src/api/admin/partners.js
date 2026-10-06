'use strict';
// src/api/admin/partners.js · CE-47 · PTN-A1 · More > Partners, Contacts and Forward a request (mounted at /api/v2/admin/partners
// via router.js, above the broad '/admin' mount). Every handle and website goes out as a READY link; Stopped contacts
// carry stopped=true and the app hides WhatsApp and Call on them. The forward route here is BY HAND only (A1).
const express = require('express');
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const orgs = require('../../lib/partners/orgs');
const conns = require('../../lib/partners/connections');
const contacts = require('../../lib/partners/contacts');
const fwd = require('../../lib/partners/forward');
const { hiddenByReports } = require('../../lib/partners/reports');

const router = express.Router();
router.use(requireAdmin);
const who = (req) => (req.admin && (req.admin.name || req.admin.id)) || 'admin';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Contacts (declared before /:id so the words are not read as an id) ──────────────────────────────────────────
router.get('/contacts', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase.from('partner_contacts').select('id, name, kind, instagram_handle, website, phone, how_we_know, knows_tdw, created_at').order('created_at', { ascending: false }).limit(500);
  if (error) return errRes(res, 500, 'Could not read contacts.');
  const stopped = await contacts.stoppedPhones(supabase, (data || []).map((c) => c.phone));
  return okRes(res, { contacts: (data || []).map((c) => contacts.contactShape(c, c.phone && stopped.has(c.phone))) });
}));
router.post('/contacts', asyncHandler(async (req, res) => {
  const v = contacts.validateContact(req.body || {});
  if (!v.ok) return errRes(res, 400, v.error);
  const { data, error } = await req.app.locals.supabase.from('partner_contacts').insert({ ...v.row, added_by: who(req) }).select('id, name, kind, instagram_handle, website, phone, how_we_know, knows_tdw').single();
  if (error) return errRes(res, 500, 'Could not save the contact.');
  return okRes(res, { contact: contacts.contactShape(data, false) });
}));
router.patch('/contacts/:id', asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.id)) return errRes(res, 404, 'No such contact.');
  const v = contacts.validateContact(req.body || {}, { partial: true });
  if (!v.ok) return errRes(res, 400, v.error);
  v.row.updated_at = new Date().toISOString();
  const { data, error } = await req.app.locals.supabase.from('partner_contacts').update(v.row).eq('id', req.params.id).select('id, name, kind, instagram_handle, website, phone, how_we_know, knows_tdw').single();
  if (error) return errRes(res, 500, 'Could not save the contact.');
  const stopped = await contacts.stoppedPhones(req.app.locals.supabase, [data.phone]);
  return okRes(res, { contact: contacts.contactShape(data, data.phone && stopped.has(data.phone)) });
}));

// ── Forward a request (by hand) ─────────────────────────────────────────────────────────────────────────────
async function recipientsOf(supabase, requestId) {
  const { data: q } = await supabase.from('forward_requests').select('id, vendor_id, outside_handle, outside_phone, role, city, event_date, budget_from, budget_to, pay_kind, note, created_at').eq('id', requestId).maybeSingle();
  if (!q) return null;
  const { data: v } = q.vendor_id ? await supabase.from('vendors').select('business_name, category, instagram_handle').eq('id', q.vendor_id).maybeSingle() : { data: null };
  const face = fwd.vendorFace(v, q);
  const { data: rs } = await supabase.from('forward_recipients').select('id, contact_id, channel, sent_at, sent_by, replied_at').eq('request_id', q.id);
  const ids = (rs || []).map((r) => r.contact_id);
  const { data: cs } = ids.length ? await supabase.from('partner_contacts').select('id, name, kind, instagram_handle, website, phone, how_we_know, knows_tdw').in('id', ids) : { data: [] };
  const stopped = await contacts.stoppedPhones(supabase, (cs || []).map((c) => c.phone));
  const recipients = (rs || []).map((r) => {
    const c = (cs || []).find((x) => x.id === r.contact_id) || {};
    const token = fwd.tokenFor(r.id);
    return { id: r.id, contact: contacts.contactShape(c, c.phone && stopped.has(c.phone)), sent_at: r.sent_at, sent_by: r.sent_by,
      link: token ? fwd.requestUrl(token) : null, message: token ? fwd.messageFor({ contactName: c.name, face, request: q, token }) : null,
      instagram_url: contacts.contactShape(c, false).instagram_url, threads_url: fwd.threadsUrl(c.instagram_handle) };
  });
  return { request: { id: q.id, vendor: face, role: q.role, city: q.city, event_date: q.event_date, budget_from: q.budget_from, budget_to: q.budget_to, pay_kind: q.pay_kind, note: q.note, created_at: q.created_at }, recipients };
}

router.get('/forward', asyncHandler(async (req, res) => {
  const { data, error } = await req.app.locals.supabase.from('forward_requests').select('id, vendor_id, outside_handle, role, city, event_date, created_at').order('created_at', { ascending: false }).limit(100);
  if (error) return errRes(res, 500, 'Could not read requests.');
  return okRes(res, { requests: data || [] });
}));
router.post('/forward', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!process.env.PARTNER_SESSION_SECRET) return errRes(res, 503, 'Forwarding is not open yet: PARTNER_SESSION_SECRET is not set.');
  const v = fwd.validateRequest(req.body || {});
  if (!v.ok) return errRes(res, 400, v.error);
  const ids = Array.isArray(req.body.contact_ids) ? [...new Set(req.body.contact_ids.filter((x) => UUID.test(String(x))))] : [];
  if (!ids.length) return errRes(res, 400, 'Choose at least one person to send it to.');
  if (v.row.vendor_id) {
    const { data: ven } = await supabase.from('vendors').select('id').eq('id', v.row.vendor_id).maybeSingle();
    if (!ven) return errRes(res, 400, 'Choose the vendor again.');
  }
  const { data: q, error } = await supabase.from('forward_requests').insert({ ...v.row, created_by: who(req) }).select('id').single();
  if (error) return errRes(res, 500, 'Could not save the request.');
  for (const cid of ids) {
    const { data: r, error: rErr } = await supabase.from('forward_recipients').insert({ request_id: q.id, contact_id: cid, token_hash: require('crypto').randomBytes(32).toString('hex') }).select('id').single();
    if (rErr) continue;
    await supabase.from('forward_recipients').update({ token_hash: fwd.tokenHash(fwd.tokenFor(r.id)) }).eq('id', r.id);
  }
  return okRes(res, await recipientsOf(supabase, q.id));
}));
router.get('/forward/:id', asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.id)) return errRes(res, 404, 'No such request.');
  const out = await recipientsOf(req.app.locals.supabase, req.params.id);
  if (!out) return errRes(res, 404, 'No such request.');
  return okRes(res, out);
}));
router.post('/forward/recipients/:rid/sent', asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.rid)) return errRes(res, 404, 'No such recipient.');
  const sent = req.body && req.body.sent === false ? null : new Date().toISOString();
  const { error } = await req.app.locals.supabase.from('forward_recipients').update({ sent_at: sent, sent_by: sent ? who(req) : null }).eq('id', req.params.rid);
  if (error) return errRes(res, 500, 'Could not save.');
  return okRes(res, { sent_at: sent });
}));

// ── Partners ────────────────────────────────────────────────────────────────────────────────────────────────
async function reportsFor(supabase, partnerIds) {
  if (!partnerIds.length) return [];
  const { data } = await supabase.from('partner_reports').select('id, partner_id, item_kind, vendor_id, reason, note, created_at, handled_at').in('partner_id', partnerIds);
  return data || [];
}
function adminRow(o, reports, used) {
  return { ...orgs.ownShape(o), hidden_by_reports: hiddenByReports(o, reports), reports_open: reports.filter((r) => r.partner_id === o.id && !r.handled_at).length,
    connections_line: conns.adminLine(used, o.plan_state), blocked_reason: o.blocked_reason, created_at: o.created_at, fee_line: orgs.FEE_LINE };
}

router.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const tab = ['unchecked', 'checked', 'blocked', 'reports'].includes(req.query.tab) ? req.query.tab : 'unchecked';
  let q = supabase.from('partner_orgs').select(orgs.ORG_COLS).order('created_at', { ascending: false }).limit(300);
  if (tab !== 'reports') q = q.eq('check_state', tab);
  const { data, error } = await q;
  if (error) return errRes(res, 500, 'Could not read partners.');
  const reps = await reportsFor(supabase, (data || []).map((o) => o.id));
  let rows = data || [];
  if (tab === 'reports') rows = rows.filter((o) => reps.some((r) => r.partner_id === o.id && !r.handled_at));
  const counts = {};
  for (const s of ['unchecked', 'checked', 'blocked']) { const { count } = await supabase.from('partner_orgs').select('id', { count: 'exact', head: true }).eq('check_state', s); counts[s] = count || 0; }
  const out = [];
  for (const o of rows) out.push(adminRow(o, reps, await conns.countFor(supabase, o.id)));
  return okRes(res, { tab, counts, partners: out });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!UUID.test(req.params.id)) return errRes(res, 404, 'No such partner.');
  const { data: o } = await supabase.from('partner_orgs').select(orgs.ORG_COLS).eq('id', req.params.id).maybeSingle();
  if (!o) return errRes(res, 404, 'No such partner.');
  const reps = await reportsFor(supabase, [o.id]);
  const { data: ms } = await supabase.from('partner_members').select('user_id, role').eq('partner_id', o.id);
  const uids = (ms || []).map((m) => m.user_id);
  const { data: us } = uids.length ? await supabase.from('users').select('id, name, phone').in('id', uids) : { data: [] };
  const people = (ms || []).map((m) => { const u = (us || []).find((x) => x.id === m.user_id) || {}; return { name: u.name || null, phone: u.phone || null, role: m.role }; });
  return okRes(res, { partner: adminRow(o, reps, await conns.countFor(supabase, o.id)), people, reports: reps });
}));

async function setState(req, res, patch) {
  if (!UUID.test(req.params.id)) return errRes(res, 404, 'No such partner.');
  const { data, error } = await req.app.locals.supabase.from('partner_orgs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', req.params.id).select(orgs.ORG_COLS).single();
  if (error || !data) return errRes(res, 500, 'Could not save.');
  return okRes(res, { partner: orgs.ownShape(data) });
}
router.post('/:id/check', asyncHandler(async (req, res) => setState(req, res, { check_state: 'checked', checked_how: 'admin', checked_at: new Date().toISOString(), checked_by: who(req), blocked_at: null, blocked_reason: null })));
router.post('/:id/block', asyncHandler(async (req, res) => {
  const reason = typeof (req.body || {}).reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
  if (!reason) return errRes(res, 400, 'Write why this partner is blocked.');
  return setState(req, res, { check_state: 'blocked', blocked_at: new Date().toISOString(), blocked_reason: reason });
}));
router.post('/:id/unblock', asyncHandler(async (req, res) => setState(req, res, { check_state: 'unchecked', blocked_at: null, blocked_reason: null })));
router.post('/:id/exempt', asyncHandler(async (req, res) => {
  const on = (req.body || {}).on !== false;
  return setState(req, res, on ? { plan_state: 'exempt', exempt_by: who(req) } : { plan_state: 'free', exempt_by: null });
}));
router.post('/reports/:rid/handled', asyncHandler(async (req, res) => {
  if (!UUID.test(req.params.rid)) return errRes(res, 404, 'No such report.');
  const { error } = await req.app.locals.supabase.from('partner_reports').update({ handled_at: new Date().toISOString(), handled_by: who(req) }).eq('id', req.params.rid);
  if (error) return errRes(res, 500, 'Could not save.');
  return okRes(res, {});
}));

module.exports = router;
