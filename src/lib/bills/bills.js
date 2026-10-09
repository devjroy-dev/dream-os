'use strict';
// src/lib/bills/bills.js · CE-47 · PRO · P2 · BILLS INTO EXPENSES (Supplies), the doors' work. INS's insuranceRoom.js is
// the shape this follows. Every answer is { status, body }; the route only sends it.
//
// THE FILE (P2-F2 (a), the founder): her bill sits in the PRIVATE bucket 'bills' under her own vendor id, uploaded
// straight there by a one-time signed upload address, and opened only by a ten-minute signed link. No public address
// for a bill ever exists. Every file has its draft row from the moment its upload address is made, so the 7-day
// sweep (purgeStaleDrafts, nightly 03:35 IST) finds every file never confirmed, and deletes it with its draft.
// THE READ (decision D): read.js, Haiku, base64 bytes, one call. Only the cleaned fields are kept in the draft.
// THE GATE: parse.js check(). Her confirmation writes the expense through createExpense, the one write home (F1 (a)).

const crypto = require('crypto');
const P = require('./parse');
const { todayIST } = require('../papers/verifiedWeddings');

const BUCKET = 'bills';
const MIME_EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const KEEP_DAYS = 7;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = (body) => ({ status: 200, body: { ok: true, ...body } });
const no = (status, error) => ({ status, body: { ok: false, error } });
const nowOf = (deps) => (deps.now ? deps.now() : new Date());
/** Her own object path only: `<her vendor id>/<uuid>.<ext>`. */
const ownPath = (vendorId, p) => typeof p === 'string' && new RegExp(`^${vendorId}/[0-9a-f-]{36}\\.(pdf|jpg|png|webp)$`).test(p);
const MIME_OF = Object.fromEntries(Object.entries(MIME_EXT).map(([m, e]) => [e, m]));
const daysLeft = (createdAt, now) => Math.max(0, KEEP_DAYS - Math.floor((now.getTime() - Date.parse(createdAt)) / 86400000));

async function draftOf(supabase, vendorId, id) {
  if (!UUID.test(String(id || ''))) return { error: no(404, 'That bill is not in your account.') };
  const { data, error } = await supabase.from('bill_drafts').select('id, vendor_id, file_path, fields, created_at, confirmed_at').eq('id', id).eq('vendor_id', vendorId).maybeSingle();
  if (error) return { error: no(500, 'TDW could not read the bill just now. Please try again.') };
  if (!data || !ownPath(vendorId, data.file_path)) return { error: no(404, 'That bill is not in your account.') };
  return { draft: data };
}
const view = (d, now, problems) => ({ id: d.id, fields: d.fields || {}, problems: problems || [], confirmed: !!d.confirmed_at, days_left: daysLeft(d.created_at, now),
  keep_line: `You have not added this bill yet. TDW deletes it in ${daysLeft(d.created_at, now)} ${daysLeft(d.created_at, now) === 1 ? 'day' : 'days'} unless you add it.` });

/** Her unconfirmed bills, newest first, each with the days left before the sweep. */
async function drafts(vendorId, deps) {
  const now = nowOf(deps);
  const { data, error } = await deps.supabase.from('bill_drafts').select('id, vendor_id, file_path, fields, created_at, confirmed_at').eq('vendor_id', vendorId).is('confirmed_at', null).order('created_at', { ascending: false }).limit(50);
  if (error) return no(500, 'TDW could not read your bills just now. Please try again.');
  return ok({ drafts: (data || []).map((d) => view(d, now)) });
}

/** Step 1: a one-time address to upload her bill straight into her own folder; its draft row is made now. */
async function uploadUrl(vendorId, body, deps) {
  const ext = MIME_EXT[body && body.mime];
  if (!ext) return no(400, 'Add a photo (JPG, PNG or WEBP) or a PDF of the bill.');
  const path = `${vendorId}/${crypto.randomUUID()}.${ext}`;
  const ins = await deps.supabase.from('bill_drafts').insert({ vendor_id: vendorId, file_path: path }).select('id').single();
  if (ins.error || !ins.data) return no(500, 'TDW could not start the upload. Please try again in a minute.');
  const { data, error } = await deps.supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) { await deps.supabase.from('bill_drafts').delete().eq('id', ins.data.id); return no(503, 'TDW could not start the upload. Please try again in a minute.'); }
  return ok({ draft_id: ins.data.id, path, upload_url: data.signedUrl, token: data.token });
}

/** Step 2: read the uploaded bill and hand back what was read, with what does not hold. Nothing becomes an expense here. */
async function read(vendorId, draftId, vendor, deps) {
  const g = await draftOf(deps.supabase, vendorId, draftId); if (g.error) return g.error;
  if (g.draft.confirmed_at) return no(409, 'This bill is already in Expenses.');
  const now = nowOf(deps);
  const mime = MIME_OF[g.draft.file_path.split('.').pop()];
  const reader = deps.readBill || require('./read').readBill;
  const { data: blob, error } = await deps.supabase.storage.from(BUCKET).download(g.draft.file_path);
  if (error || !blob) return no(404, 'TDW could not find the bill. Add it again.');
  const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
  const fields = await reader({ base64, mime });
  const c = P.check(fields, { ownGstin: vendor && vendor.gstin, today: todayIST(now.getTime()) });
  const up = await deps.supabase.from('bill_drafts').update({ fields }).eq('id', g.draft.id).eq('vendor_id', vendorId);
  if (up.error) return no(500, 'TDW could not save what it read from the bill. Please try again.');
  return ok({ draft: view({ ...g.draft, fields }, now, c.problems) });
}

/** Step 3: her confirmation. Her fields (as read, or as she corrected them) pass check(), then createExpense writes. */
async function confirm(vendorId, draftId, body, vendor, deps) {
  const g = await draftOf(deps.supabase, vendorId, draftId); if (g.error) return g.error;
  if (g.draft.confirmed_at) return no(409, 'This bill is already in Expenses.');
  const b = body || {};
  const c = P.check(b, { ownGstin: vendor && vendor.gstin, today: todayIST(nowOf(deps).getTime()) });
  if (!c.ok) return no(400, c.problems[0] || 'The figures on the bill do not add up. Check them and try again.');
  const create = deps.createExpense || require('../vendor/expenses').createExpense;
  const f = c.fields;
  const r = await create(deps.supabase, vendorId, {
    amount: f.amount, category: b.category, expense_date: f.expense_date || null,
    description: f.supplier_name ? `Bill from ${f.supplier_name}` : 'Bill', notes: null,
    taxable_value: f.taxable_value ?? null, gst_rate: f.gst_rate ?? null, gst_amount: f.gst_amount ?? null,
    supplier_name: f.supplier_name || null, supplier_gstin: f.supplier_gstin || null, bill_number: f.bill_number || null,
    bill_file_url: g.draft.file_path, source: 'bill',
  });
  if (!r.ok) return no(400, r.error);
  const up = await deps.supabase.from('bill_drafts').update({ confirmed_at: nowOf(deps).toISOString(), expense_id: r.expense.id, fields: f }).eq('id', g.draft.id).eq('vendor_id', vendorId);
  if (up.error) console.error('[bills] confirmed, but the draft row was not stamped:', g.draft.id);   // the expense stands; the sweep skips rows with an expense below
  return ok({ expense: r.expense });
}

/** She throws a bill away before adding it: the file and its draft go now. */
async function discard(vendorId, draftId, deps) {
  const g = await draftOf(deps.supabase, vendorId, draftId); if (g.error) return g.error;
  if (g.draft.confirmed_at) return no(409, 'This bill is already in Expenses.');
  const rm = await deps.supabase.storage.from(BUCKET).remove([g.draft.file_path]);
  if (rm.error) return no(503, 'TDW could not delete the bill just now. Please try again.');
  await deps.supabase.from('bill_drafts').delete().eq('id', g.draft.id).eq('vendor_id', vendorId);
  return ok({});
}

/** "Open bill" on an expense: a ten-minute address to her own file, made only on her ask. */
async function fileUrl(vendorId, expenseId, deps) {
  if (!UUID.test(String(expenseId || ''))) return no(404, 'No bill is kept for this expense.');
  const { data: e } = await deps.supabase.from('expenses').select('bill_file_url').eq('id', expenseId).eq('vendor_id', vendorId).is('deleted_at', null).maybeSingle();
  if (!e || !ownPath(vendorId, e.bill_file_url)) return no(404, 'No bill is kept for this expense.');
  const { data, error } = await deps.supabase.storage.from(BUCKET).createSignedUrl(e.bill_file_url, 600);
  if (error || !data) return no(503, 'TDW could not open the bill. Please try again.');
  return ok({ url: data.signedUrl });
}

/** Nightly: every bill never confirmed for 7 days goes, file first, then its draft (P2-F2). A file that will not
 *  delete keeps every draft of that night, so the next night tries again; nothing is forgotten half-way. */
async function purgeStaleDrafts(supabase, deps = {}) {
  const cutoff = new Date(nowOf(deps).getTime() - KEEP_DAYS * 86400000).toISOString();
  const { data, error } = await supabase.from('bill_drafts').select('id, file_path').is('confirmed_at', null).is('expense_id', null).lt('created_at', cutoff).limit(500);
  if (error) { console.error('[bills:sweep] read failed:', error.message); return { removed: 0, kept: 0 }; }
  const rows = data || []; if (!rows.length) { console.log('[bills:sweep] removed=0'); return { removed: 0, kept: 0 }; }
  const rm = await supabase.storage.from(BUCKET).remove(rows.map((r) => r.file_path));
  if (rm.error) { console.error('[bills:sweep] storage remove failed:', rm.error.message); return { removed: 0, kept: rows.length }; }
  // storage's remove is all-or-error: with no error every path is gone, including a file whose upload never happened
  // (its draft was made with the upload address). An error keeps every draft for the next night.
  const done = rows;
  const del = await supabase.from('bill_drafts').delete().in('id', done.map((r) => r.id));
  if (del.error) { console.error('[bills:sweep] draft delete failed:', del.error.message); return { removed: 0, kept: rows.length }; }
  console.log(`[bills:sweep] removed=${done.length} kept=${rows.length - done.length}`);
  return { removed: done.length, kept: rows.length - done.length };
}

module.exports = { drafts, uploadUrl, read, confirm, discard, fileUrl, purgeStaleDrafts, ownPath, BUCKET, KEEP_DAYS };
