'use strict';
// src/api/vendor/hub.js · CE-47 · HUB-1 · COLLAB HUB FOR A VENDOR: Work, People, Mine, her page, "Worked with".
//   GET  /api/v2/vendor/hub/me                 her page (made on first use)      PATCH /me  roles, city, open_to, website, work
//   GET  /api/v2/vendor/hub/work               calls for her role and city (all_cities=1 widens the city)
//   GET  /api/v2/vendor/hub/people             THE PEOPLE DOOR: role, city, open_to, mine=1 ("My people")
//   GET  /api/v2/vendor/hub/mine               my calls, I applied, credits waiting for my yes, my credits
//   POST /api/v2/vendor/hub/credits            { call_id, people } or { shoot_name, city, month, people }
//   POST /api/v2/vendor/hub/credits/:id/yes | /no | /take-back
// No feed, no likes, no followers, no chat (ruled). Every handle and website leaves as a link (publicCard).
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const profiles = require('../../lib/hub/profiles');
const credits = require('../../lib/hub/credits');
const { people } = require('../../lib/hub/people');
const { isCollabRole } = require('../../lib/collab/roles');
const { sameCity } = require('../../lib/vendor/cityMatch');
const { websiteUrl } = require('../../lib/partners/links');

const guard = (fn) => asyncHandler(async (req, res) => {
  try { return await fn(req, res, req.app.locals.supabase); } catch (e) { return errRes(res, 400, String((e && e.message) || 'failed')); }
});
const me = (req, sb) => profiles.ensureVendorProfile(sb, req.vendor.id);
const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

router.get('/me', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  const p = await me(req, sb);
  return okRes(res, { page: { id: p.id, ...profiles.publicCard(p) }, worked_with: await credits.workedWith(sb, p.id) });
}));

router.patch('/me', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  const p = await me(req, sb); const b = req.body || {}; const patch = {};
  if (b.roles !== undefined) { if (!Array.isArray(b.roles) || !b.roles.every(isCollabRole)) throw new Error('roles must be collab roles'); patch.roles = [...new Set(b.roles)].slice(0, 5); }
  if (b.open_to !== undefined) { if (!Array.isArray(b.open_to) || !b.open_to.every((x) => profiles.OPEN_TO.includes(x))) throw new Error('open_to is paid, barter or credit_only'); patch.open_to = [...new Set(b.open_to)]; }
  if (b.city !== undefined) patch.city = String(b.city || '').trim().slice(0, 60) || null;
  if (b.website !== undefined) { const w = b.website ? websiteUrl(String(b.website)) : null; if (b.website && !w) throw new Error('that website is not a web address'); patch.website = w; }
  if (b.work_urls !== undefined) { if (!Array.isArray(b.work_urls)) throw new Error('work_urls is a list'); patch.work_urls = b.work_urls.filter((u) => typeof u === 'string' && /^https:\/\/res\.cloudinary\.com\/[^\s]+$/.test(u)).slice(0, 12); }
  if (!Object.keys(patch).length) throw new Error('nothing to change');
  patch.updated_at = new Date().toISOString();
  const { data, error } = await sb.from('hub_profiles').update(patch).eq('id', p.id).select(profiles.COLS).maybeSingle();
  if (error) throw new Error(error.message);
  return okRes(res, { page: { id: data.id, ...profiles.publicCard(data) } });
}));

router.get('/work', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  const p = await me(req, sb); const all = req.query.all_cities === '1';
  const { data: open } = await sb.from('collab_posts').select('id, vendor_id, requirement_type, event_date, city, pay_kind, budget_inr, details, created_at, state')
    .eq('state', 'open').neq('vendor_id', req.vendor.id).gte('event_date', todayIST()).order('created_at', { ascending: false }).limit(200);
  const ids = (open || []).map((c) => c.id);
  const items = ids.length ? ((await sb.from('collab_post_items').select('post_id, requirement_type, needed').in('post_id', ids)).data || []) : [];
  const roles = new Map(); for (const it of items) { if (!roles.has(it.post_id)) roles.set(it.post_id, []); roles.get(it.post_id).push(it); }
  const mine = new Set(p.roles || []);
  const calls = (open || []).filter((c) => (all || !p.city || sameCity(c.city, p.city))
    && (!mine.size || (roles.get(c.id) || [{ requirement_type: c.requirement_type }]).some((r) => mine.has(r.requirement_type))));
  const posters = [...new Set(calls.map((c) => c.vendor_id))];
  const pages = posters.length ? ((await sb.from('hub_profiles').select(profiles.COLS).in('vendor_id', posters)).data || []) : [];
  const byVendor = new Map(pages.map((x) => [x.vendor_id, x]));
  const names = posters.length ? ((await sb.from('vendors').select('id, business_name').in('id', posters)).data || []) : [];
  const nameOf = new Map(names.map((x) => [x.id, x.business_name]));
  return okRes(res, {
    city: p.city, roles: p.roles || [], all_cities: all,
    items: calls.map((c) => { const pg = byVendor.get(c.vendor_id); const card = pg ? profiles.publicCard(pg) : null;
      return { kind: 'call', id: c.id, from: nameOf.get(c.vendor_id) || 'A TDW vendor', label: card ? card.label : 'Not yet checked by TDW',
        roles: (roles.get(c.id) || []).map((r) => ({ role: r.requirement_type, needed: r.needed || 1 })), event_date: c.event_date, city: c.city,
        pay_kind: c.pay_kind || null, budget_inr: c.budget_inr || null, details: c.details || null,
        instagram: card ? card.instagram : null, website: card ? card.website : null, page_url: card ? card.page_url : null }; }),
    // Brands' briefs, planners' paid jobs and From Threads arrive through PTN's reads when they land; until then the
    // list says so rather than looking empty.
    not_yet: ['briefs from brands', 'paid jobs from planners', 'From Threads'],
  });
}));

// THE PEOPLE DOOR (named for PTN): GET /api/v2/vendor/hub/people?role=&city=&open_to=&mine=1
router.get('/people', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  const p = await me(req, sb);
  const list = await people(sb, p, { role: req.query.role || null, city: req.query.city || null, open_to: req.query.open_to || null, mine: req.query.mine === '1' });
  return okRes(res, { people: list, line: 'No messages inside TDW. When you pick someone for a call, you both get each other\u2019s number.' });
}));

router.get('/mine', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  const p = await me(req, sb);
  const { data: calls } = await sb.from('collab_posts').select('id, event_date, city, details, state, source, asked_at, created_at').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false }).limit(50);
  const cids = (calls || []).map((c) => c.id);
  const resp = cids.length ? ((await sb.from('collab_responses').select('post_id, state').in('post_id', cids)).data || []) : [];
  const count = (id, st) => resp.filter((r) => r.post_id === id && (!st || r.state === st)).length;
  const { data: applied } = await sb.from('collab_responses').select('id, post_id, state, created_at').eq('responder_vendor_id', req.vendor.id).order('created_at', { ascending: false }).limit(50);
  const { data: waiting } = await sb.from('hub_credits').select(credits.CREDIT_COLS).eq('person_profile_id', p.id).eq('state', 'offered');
  return okRes(res, {
    my_calls: (calls || []).map((c) => ({ id: c.id, event_date: c.event_date, city: c.city, details: c.details, state: c.state,
      interested: count(c.id), picked: count(c.id, 'accepted'), sent_by_tdw: c.source === 'tdw_forward', line: c.source === 'tdw_forward' ? 'Sent by TDW at your request' : null })),
    applied: (applied || []).map((a) => ({ id: a.id, post_id: a.post_id, state: a.state, words: a.state === 'accepted' ? 'Picked' : a.state === 'declined' || a.state === 'passed' ? 'Not picked' : a.state === 'withdrawn' ? 'Withdrawn' : 'Waiting' })),
    waiting_for_your_yes: waiting || [],
    worked_with: await credits.workedWith(sb, p.id),
  });
}));

router.post('/credits', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  const p = await me(req, sb); const b = req.body || {};
  const made = b.call_id ? await credits.offerForCall(sb, p, b.call_id, b.people) : await credits.offerForShoot(sb, p, b);
  return okRes(res, { offered: made.length, credits: made, line: 'Each person sees it and decides. Nothing shows until they say yes.' });
}));
router.post('/credits/:id/yes', requireAuth, resolveVendor(), guard(async (req, res, sb) => okRes(res, await credits.answer(sb, await me(req, sb), req.params.id, true))));
router.post('/credits/:id/no', requireAuth, resolveVendor(), guard(async (req, res, sb) => okRes(res, await credits.answer(sb, await me(req, sb), req.params.id, false))));
router.post('/credits/:id/take-back', requireAuth, resolveVendor(), guard(async (req, res, sb) => okRes(res, await credits.takeBack(sb, await me(req, sb), req.params.id))));

module.exports = router;
