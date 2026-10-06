// src/lib/vendor/insuranceRoom.js — TDW · CE-47 · INS-A · THE INSURANCE ROOM'S DOORS (Business Solutions › Run the business).
//
// Every answer is { status, body }; the route (api/vendor/solutions/insurance.js) only sends it. The rules live in
// insurance.js; the reading in policyRead.js. Her document sits in the PRIVATE bucket 'policies' under her own
// vendor id, read only through a ten-minute signed address. Saving IS her confirmation (charter c): a policy is
// written with confirmed_at only by the save door, after she has seen every field.
'use strict';

const crypto = require('crypto');
const ins = require('./insurance');
const { formatRs, formatDateLong } = require('../format');
const { istTodayStr } = require('../istDay');

const BUCKET = 'policies';
const MIME_EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ok = (body) => ({ status: 200, body: { ok: true, ...body } });
const no = (status, error) => ({ status, body: { ok: false, error } });
const today = (deps) => istTodayStr(deps.now ? deps.now() : new Date());
const isoNow = (deps) => (deps.now ? deps.now() : new Date()).toISOString();

/** The confirm door's checks, one place. Returns { fields } or { error } in plain words. */
function validate(b = {}) {
  const insurer = typeof b.insurer === 'string' ? b.insurer.trim() : '';
  if (!insurer || insurer.length > 120) return { error: 'Type the insurer\'s name.' };
  if (!ins.KIND_KEYS.includes(b.kind)) return { error: 'Choose the kind of cover.' };
  const amt = Number(b.cover_amount);
  if (!Number.isInteger(amt) || amt <= 0 || amt >= 1e10) return { error: 'Type the cover amount in rupees.' };
  if (typeof b.ends_on !== 'string' || !DATE.test(b.ends_on) || Number.isNaN(Date.parse(b.ends_on + 'T00:00:00Z'))) return { error: 'Choose the date the policy ends.' };
  return { fields: { insurer, kind: b.kind, cover_amount: amt, ends_on: b.ends_on } };
}
/** Her own object path only: `<her vendor id>/<uuid>.<ext>`. Anything else is refused, so no one reads another's file. */
const ownPath = (vendorId, p) => typeof p === 'string' && new RegExp(`^${vendorId}/[0-9a-f-]{36}\\.(pdf|jpg|png|webp|heic)$`).test(p);

function shape(p, todayKey) {
  const st = ins.policyState(p.ends_on, todayKey);
  return { id: p.id, kind: p.kind, kind_title: ins.kindTitle(p.kind), insurer: p.insurer, cover_amount: p.cover_amount,
    ends_on: p.ends_on, has_document: !!p.doc_path, state: st.key, state_label: st.label,
    facts: `${p.insurer} · Rs ${formatRs(p.cover_amount)} · ends ${formatDateLong(p.ends_on)}`, checked: ins.NOT_CHECKED };
}

async function studioName(supabase, vendorId) {
  const { data } = await supabase.from('vendors').select('business_name').eq('id', vendorId).maybeSingle();
  return (data && data.business_name) || null;
}
async function livePolicies(supabase, vendorId) {
  const { data, error } = await supabase.from('vendor_policies').select('*').eq('vendor_id', vendorId).is('deleted_at', null).order('ends_on', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
async function showMark(supabase, vendorId) {
  const { data } = await supabase.from('vendor_insurance_settings').select('show_mark').eq('vendor_id', vendorId).maybeSingle();
  return !!(data && data.show_mark);
}

/** I1: the room. The mark is computed exactly as the public door computes it, so the room never promises what the site will not show. */
async function room(vendorId, deps) {
  const { supabase } = deps; const t = today(deps);
  const [policies, mark, name] = await Promise.all([livePolicies(supabase, vendorId), showMark(supabase, vendorId), studioName(supabase, vendorId)]);
  const shown = ins.insuredMark({ showMark: mark, policies, studioName: name, todayKey: t });
  return ok({ policies: policies.filter((p) => p.confirmed_at).map((p) => shape(p, t)), show_mark: mark, mark_showing: !!shown,
    destinations: ins.destinations() });
}

/** I2 → I3: the kinds of cover that fit her answers. A fixed table; no model. */
function kinds(body = {}) { return ok({ kinds: ins.kindsFor(body) }); }

/**
 * r2 · "GET A QUOTE" (ruling a): her own cover brief for the insurer she picked, and that insurer's page and fee line.
 * The two figures only TDW holds are read here, each from its one home: weddings from vendor_seal (counted nightly
 * from her delivered weddings, seal.js), booked days from her calendar (events: kind 'ceremony', the kind a booking
 * makes, promotion.js; upcoming, not deleted, in the next 365 days, one per date). Nothing is sent to an insurer.
 */
async function quoteBrief(vendorId, body = {}, deps) {
  const dest = ins.destinationByName(body.insurer);
  if (!dest) return no(400, 'Choose an insurer or a comparison site.');
  const t = today(deps);
  const until = new Date(Date.parse(t + 'T00:00:00Z') + 365 * 86400000).toISOString().slice(0, 10);
  const [{ data: v }, { data: seal }, { data: days }] = await Promise.all([
    deps.supabase.from('vendors').select('business_name, category, city').eq('id', vendorId).maybeSingle(),
    deps.supabase.from('vendor_seal').select('weddings').eq('vendor_id', vendorId).maybeSingle(),
    deps.supabase.from('events').select('event_date').eq('vendor_id', vendorId).eq('kind', 'ceremony').eq('state', 'upcoming')
      .is('deleted_at', null).gte('event_date', t).lte('event_date', until),
  ]);
  const trade = v && v.category ? String(v.category).charAt(0).toUpperCase() + String(v.category).slice(1) : null;
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const text = ins.coverBrief({ studioName: v && v.business_name, trade, city: v && v.city,
    weddingsCounted: seal ? seal.weddings : 0, bookedDays: new Set((days || []).map((d) => d.event_date)).size,
    answers, kindKeys: Array.isArray(body.kinds) ? body.kinds : [] });
  return ok({ insurer: dest.name, url: dest.url, fee_line: ins.feeLine(dest.name), text });
}

/** I6 step 1: a one-time address to upload her document straight into her own folder of the private bucket. */
async function uploadUrl(vendorId, body, deps) {
  const ext = MIME_EXT[body && body.mime];
  if (!ext) return no(400, 'Upload a PDF or a photo.');
  const path = `${vendorId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await deps.supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return no(503, 'The upload could not start. Try again in a minute.');
  return ok({ path, upload_url: data.signedUrl, token: data.token });
}

/** I6 step 2: read the uploaded document and hand back what was read cleanly. Nothing is saved here. */
async function read(vendorId, body, deps) {
  const path = body && body.path; const mime = body && body.mime;
  if (!ownPath(vendorId, path) || !MIME_EXT[mime]) return no(400, 'Upload the document again.');
  const reader = deps.readPolicy || require('./policyRead').readPolicy;
  const { data: blob, error } = await deps.supabase.storage.from(BUCKET).download(path);
  if (error || !blob) return ok({ prefill: { insurer: null, kind: null, cover_amount: null, ends_on: null } });
  const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
  return ok({ prefill: await reader({ base64, mime }) });
}

/** I6 save / I7 edit: her confirmation. The same checks for a new policy and a changed one. */
async function save(vendorId, body, deps, id = null) {
  const v = validate(body); if (v.error) return no(400, v.error);
  const doc = body.doc_path == null ? null : body.doc_path;
  if (doc !== null && (!ownPath(vendorId, doc) || !MIME_EXT[body.doc_mime])) return no(400, 'Upload the document again.');
  const nowIso = isoNow(deps);
  const row = { ...v.fields, confirmed_at: nowIso, updated_at: nowIso, ...(doc !== null ? { doc_path: doc, doc_mime: body.doc_mime } : {}) };
  const q = id
    ? deps.supabase.from('vendor_policies').update({ ...row, reminded_30_on: null, reminded_7_on: null }).eq('id', id).eq('vendor_id', vendorId).is('deleted_at', null)
    : deps.supabase.from('vendor_policies').insert({ ...row, vendor_id: vendorId });
  const { data, error } = await q.select('*').maybeSingle();
  if (error) return no(500, 'The policy could not be saved. Try again.');
  if (!data) return no(404, 'That policy is not here any more.');
  return ok({ policy: shape(data, today(deps)) });
}

async function remove(vendorId, id, deps) {
  const { data, error } = await deps.supabase.from('vendor_policies').update({ deleted_at: isoNow(deps) })
    .eq('id', id).eq('vendor_id', vendorId).is('deleted_at', null).select('id').maybeSingle();
  if (error) return no(500, 'The policy could not be deleted. Try again.');
  if (!data) return no(404, 'That policy is not here any more.');
  return ok({});
}

/** I7 "Open document": a ten-minute address to her own file. */
async function documentUrl(vendorId, id, deps) {
  const { data: p } = await deps.supabase.from('vendor_policies').select('doc_path').eq('id', id).eq('vendor_id', vendorId).is('deleted_at', null).maybeSingle();
  if (!p || !p.doc_path) return no(404, 'No document is kept for this policy.');
  const { data, error } = await deps.supabase.storage.from(BUCKET).createSignedUrl(p.doc_path, 600);
  if (error || !data) return no(503, 'The document could not be opened. Try again.');
  return ok({ url: data.signedUrl });
}

async function settings(vendorId, body, deps) {
  if (!body || typeof body.show_mark !== 'boolean') return no(400, 'Choose On or Off.');
  const { error } = await deps.supabase.from('vendor_insurance_settings')
    .upsert({ vendor_id: vendorId, show_mark: body.show_mark, updated_at: isoNow(deps) }, { onConflict: 'vendor_id' });
  if (error) return no(500, 'The switch could not be saved. Try again.');
  return room(vendorId, deps);
}

/** THE PUBLIC DOOR'S FIELD (vendorCard.js): `insured` is the mark object or null. */
async function publicMark(supabase, vendorId, studio, now = new Date()) {
  const [mark, policies] = await Promise.all([showMark(supabase, vendorId), confirmedPolicies(supabase, vendorId)]);
  return ins.insuredMark({ showMark: mark, policies, studioName: studio, todayKey: istTodayStr(now) });
}
async function confirmedPolicies(supabase, vendorId) {
  const { data } = await supabase.from('vendor_policies').select('ends_on, confirmed_at, deleted_at').eq('vendor_id', vendorId).is('deleted_at', null).not('confirmed_at', 'is', null);
  return data || [];
}

/**
 * THE RENEWAL SWEEP (cron, 10:00 am IST). For each policy due a 30- or 7-day reminder: when her WhatsApp window is
 * open, the reminder goes as plain text and is stamped; when it is shut, nothing is sent and nothing is stamped (no
 * approved template yet: the room's "Renew soon" carries it), so the next morning tries again. Never twice.
 */
async function runRenewalSweep(supabase, deps = {}) {
  const t = istTodayStr(deps.now ? deps.now() : new Date());
  const horizon = new Date(Date.parse(t + 'T00:00:00Z') + 30 * 86400000).toISOString().slice(0, 10);
  const send = deps.sendWhatsApp || require('../whatsapp').sendWhatsApp;
  const windowOpen = deps.vendorWindowOpen || require('./waWindow').vendorWindowOpen;
  const { data: due, error } = await supabase.from('vendor_policies').select('*').is('deleted_at', null).not('confirmed_at', 'is', null)
    .gte('ends_on', t).lte('ends_on', horizon);
  if (error) { console.error('[insurance:sweep]', error.message); return { sent: 0, held: 0 }; }
  let sent = 0, held = 0;
  for (const p of due || []) {
    const which = ins.reminderDue(p, t); if (!which) continue;
    const w = await windowOpen(supabase, p.vendor_id);
    if (!(w && w.open === true)) { held += 1; continue; }
    const { data: v } = await supabase.from('vendors').select('user_id').eq('id', p.vendor_id).maybeSingle();
    const { data: u } = v ? await supabase.from('users').select('phone').eq('id', v.user_id).maybeSingle() : { data: null };
    if (!u || !u.phone) { held += 1; continue; }
    const res = await send(u.phone, ins.reminderText(p, t));
    if (res && res.blocked) { held += 1; continue; }
    const stamp = which === 7 ? { reminded_7_on: t, reminded_30_on: p.reminded_30_on || t } : { reminded_30_on: t };
    await supabase.from('vendor_policies').update(stamp).eq('id', p.id);
    sent += 1;
  }
  console.log(`[insurance:sweep] ${t} sent=${sent} held=${held}`);
  return { sent, held };
}

module.exports = { BUCKET, validate, ownPath, room, kinds, quoteBrief, uploadUrl, read, save, remove, documentUrl, settings, publicMark, runRenewalSweep };
