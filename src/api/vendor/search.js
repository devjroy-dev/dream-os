// src/api/vendor/search.js · DESIGN-1 · THE UNIVERSAL SEARCH, the door (the founder and the chair, stage 3).
// GET /api/v2/vendor/search?q=  →  { ok, q, groups: [{ kind, total, items: [{ id, title, sub, ref }] }] }
//
// HER OWN RECORDS ONLY. Every read below is scoped by her vendor id (and her ledger's agent id for invoices, the scope the
// invoices door uses), and nothing else is read. No new table: the rows the rooms already list, matched in memory by the
// one matcher home (src/lib/vendorSearch.js). The tools themselves ("website", "TDS", "ads") are matched in the pwa,
// which owns the rooms. A failed read of one kind leaves that kind out; it never fails the search.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const { resolveAgentForVendor } = require('../middleware/agentBridge');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { search } = require('../../lib/vendorSearch');

const ROWS = 1000;          // per kind; the newest first
const MAX_Q = 80;

const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// each kind: what is read (scoped to her) and how a row becomes a searchable record
async function loadRecords(supabase, vendorId, agentId) {
  const eng = supabase.schema ? supabase.schema('engine') : null;
  const reads = {
    enquiries: () => supabase.from('leads').select('id, name, phone, wedding_date, wedding_city, state')
      .eq('vendor_id', vendorId).is('deleted_at', null).order('created_at', { ascending: false }).limit(ROWS),
    clients: () => supabase.from('clients').select('id, name, phone, email')
      .eq('vendor_id', vendorId).is('deleted_at', null).order('created_at', { ascending: false }).limit(ROWS),
    events: () => supabase.from('events').select('id, title, kind, event_date')
      .eq('vendor_id', vendorId).neq('kind', 'blocked').is('deleted_at', null).order('event_date', { ascending: false }).limit(ROWS),
    invoices: () => (agentId && eng ? eng.from('records').select('id, client, amount, date, hidden')
      .eq('agent_id', agentId).eq('direction', 'in').order('created_at', { ascending: false }).limit(ROWS) : Promise.resolve({ data: [] })),
    packages: () => supabase.from('vendor_packages').select('id, name, description')
      .eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(ROWS),
    notes: () => supabase.from('owner_notes').select('id, body, created_at')
      .eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(ROWS),
    crew: () => supabase.from('vendor_roster').select('id, name, phone, category')
      .eq('owner_vendor_id', vendorId).order('created_at', { ascending: false }).limit(ROWS),
  };
  const shape = {
    enquiries: (r) => ({ id: r.id, title: r.name || '', sub: [r.wedding_date, r.wedding_city].filter(Boolean).join(' · ') || null, text: [r.name, r.wedding_city], phones: [r.phone] }),
    clients:   (r) => ({ id: r.id, title: r.name || '', sub: r.phone || null, text: [r.name, r.email], phones: [r.phone] }),
    events:    (r) => ({ id: r.id, title: r.title || '', sub: r.event_date || null, ref: r.event_date || null, text: [r.title], phones: [] }),
    invoices:  (r) => (r.hidden ? null : { id: r.id, title: r.client || '', sub: r.amount != null ? String(r.amount) : null, text: [r.client], phones: [] }),
    packages:  (r) => ({ id: r.id, title: r.name || '', sub: null, text: [r.name, r.description], phones: [] }),
    notes:     (r) => ({ id: r.id, title: clip(r.body, 60), sub: null, text: [r.body], phones: [] }),
    crew:      (r) => ({ id: r.id, title: r.name || '', sub: r.category || null, text: [r.name, r.category], phones: [r.phone] }),
  };
  const kinds = Object.keys(reads);
  const settled = await Promise.all(kinds.map((k) => Promise.resolve().then(reads[k]).then((x) => x, () => ({ data: null }))));
  const out = {};
  kinds.forEach((k, i) => {
    const rows = settled[i] && !settled[i].error && Array.isArray(settled[i].data) ? settled[i].data : [];
    out[k] = rows.map(shape[k]).filter(Boolean);
  });
  return out;
}

router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').slice(0, MAX_Q);
  if (!q.trim()) return okRes(res, { q: '', groups: [] });
  const supabase = req.app.locals.supabase;
  let agentId = null;
  try { agentId = (await resolveAgentForVendor(supabase, req.vendor, req.auth && req.auth.user_id)).agentId || null; } catch (_e) { agentId = null; }
  try {
    const records = await loadRecords(supabase, req.vendor.id, agentId);
    return okRes(res, { q, ...search(q, records) });
  } catch (e) {
    return errRes(res, 500, 'Search is unavailable right now.');
  }
}));

module.exports = router;
module.exports.loadRecords = loadRecords;
