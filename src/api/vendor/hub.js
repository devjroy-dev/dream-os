'use strict';
// src/api/vendor/hub.js · CE-47 · HUB-1 · COLLAB HUB FOR A VENDOR: Work, People, Mine, her page, "Worked with".
//   GET  /api/v2/vendor/hub/me                 her page (made on first use)      PATCH /me  roles, city, open_to, website, work
//   GET  /api/v2/vendor/hub/work               calls for her role and city (all_cities=1 widens the city)
//   GET  /api/v2/vendor/hub/people             THE PEOPLE DOOR: role, city, open_to, mine=1 ("My people", with "waiting" apart)
//   POST|DELETE /api/v2/vendor/hub/people/:id/my-people   HUB-2: add or take off a VENDOR (a person or an org: 400)
//   GET  /api/v2/vendor/hub/mine               my calls, I applied, credits waiting for my yes, my credits
//   POST /api/v2/vendor/hub/credits            { call_id, people } or { shoot_name, city, month, people }
//   POST /api/v2/vendor/hub/credits/:id/yes | /no | /take-back
// HUB-2 · RULE 1: every door is gated (hubGate); GET /me answers a closed vendor with hub_open false and makes no page.
// No feed, no likes, no followers, no chat (ruled). Every handle and website leaves as a link (publicCard).
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const profiles = require('../../lib/hub/profiles');
const credits = require('../../lib/hub/credits');
const { people, waitingForYes, addVendor, removeVendor } = require('../../lib/hub/people');
const { isCollabRole } = require('../../lib/collab/roles');
const { sameCity } = require('../../lib/vendor/cityMatch');
const { websiteUrl } = require('../../lib/partners/links');

// ── HUB-2 · RULE 1 (the chair's ruling (a), 7 Oct 2026): BLIND SWITCH-ON ─────────────────────────────────────────
// The question itself lives in src/lib/hub/gate.js (HUB-2b): testers or the clb.hub switch, failing closed. GET /me tells
// a closed vendor so (and makes no page); every other Hub door refuses her with one plain sentence.
const { hubOpen, CLOSED, _reset: resetGate } = require('../../lib/hub/gate');   // HUB-2b: Rule 1's one home
const { callTitle } = require('../../lib/hub/title');   // HUB-2d: "Decor needed", one home
resetGate();   // a fresh router starts from an empty gate cache, as it did when the gate lived here (no change in a running server)
const hubGate = asyncHandler(async (req, res, next) => {
  if (await hubOpen(req.app.locals.supabase, req.vendor.id)) return next();
  return errRes(res, 403, CLOSED);
});

const guard = (fn) => asyncHandler(async (req, res) => {
  try { return await fn(req, res, req.app.locals.supabase); } catch (e) { return errRes(res, 400, String((e && e.message) || 'failed')); }
});
const me = (req, sb) => profiles.ensureVendorProfile(sb, req.vendor.id);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthWords = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})/); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

router.get('/me', requireAuth, resolveVendor(), guard(async (req, res, sb) => {
  // HUB-2 · RULE 1: a closed vendor is told so, and no page is made for her (her page exists only once she opens the Hub).
  if (!(await hubOpen(sb, req.vendor.id))) return okRes(res, { hub_open: false, line: CLOSED });
  const p = await me(req, sb);
  return okRes(res, { hub_open: true, page: { id: p.id, ...profiles.publicCard(p) }, worked_with: await credits.workedWith(sb, p.id) });
}));

router.patch('/me', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => {
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

router.get('/work', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => {
  const p = await me(req, sb); const all = req.query.all_cities === '1';
  const { data: open } = await sb.from('collab_posts').select('id, vendor_id, requirement_type, event_date, city, pay_kind, budget_inr, details, created_at, state')
    .eq('state', 'open').neq('vendor_id', req.vendor.id).gte('event_date', todayIST()).order('created_at', { ascending: false }).limit(200);
  const ids = (open || []).map((c) => c.id);
  const items = ids.length ? ((await sb.from('collab_post_items').select('post_id, requirement_type, needed').in('post_id', ids)).data || []) : [];
  const roles = new Map(); for (const it of items) { if (!roles.has(it.post_id)) roles.set(it.post_id, []); roles.get(it.post_id).push(it); }
  const mine = new Set(p.roles || []);
  // HUB-2: a call she already answered leaves Work (it shows in Mine under "I applied"), as the old feed did.
  const answered = ids.length ? new Set(((await sb.from('collab_responses').select('post_id').eq('responder_vendor_id', req.vendor.id).in('post_id', ids)).data || []).map((r) => r.post_id)) : new Set();
  const calls = (open || []).filter((c) => !answered.has(c.id) && (all || !p.city || sameCity(c.city, p.city))
    && (!mine.size || (roles.get(c.id) || [{ requirement_type: c.requirement_type }]).some((r) => mine.has(r.requirement_type))));
  const posters = [...new Set(calls.map((c) => c.vendor_id))];
  const pages = posters.length ? ((await sb.from('hub_profiles').select(profiles.COLS).in('vendor_id', posters)).data || []) : [];
  const byVendor = new Map(pages.map((x) => [x.vendor_id, x]));
  const names = posters.length ? ((await sb.from('vendors').select('id, business_name').in('id', posters)).data || []) : [];
  const nameOf = new Map(names.map((x) => [x.id, x.business_name]));
  return okRes(res, {
    city: p.city, roles: p.roles || [], all_cities: all,
    items: calls.map((c) => { const pg = byVendor.get(c.vendor_id); const card = pg ? profiles.publicCard(pg) : null;
      return { kind: 'call', id: c.id, from: nameOf.get(c.vendor_id) || 'A TDW vendor',
        roles: (roles.get(c.id) || []).map((r) => ({ role: r.requirement_type, needed: r.needed || 1 })), event_date: c.event_date, city: c.city,
        pay_kind: c.pay_kind || null, budget_inr: c.budget_inr || null, details: c.details || null,
        instagram: card ? card.instagram : null, website: card ? card.website : null, page_url: card ? card.page_url : null }; }),
    // Brands' briefs, planners' paid jobs and calls posted on Threads arrive through PTN's reads when they land; until
    // then the list says so rather than looking empty. HUB-2d: all lower case (the founder's walk: "From Threads" was a slip).
    not_yet: ['briefs from brands', 'paid jobs from planners', 'calls posted on Threads'],
  });
}));

// THE PEOPLE DOOR (named for PTN): GET /api/v2/vendor/hub/people?role=&city=&open_to=&mine=1
router.get('/people', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => {
  const p = await me(req, sb);
  const mine = req.query.mine === '1';
  const list = await people(sb, p, { role: req.query.role || null, city: req.query.city || null, open_to: req.query.open_to || null, mine });
  return okRes(res, { people: list, ...(mine ? { waiting: await waitingForYes(sb, p), mine_line: 'This list has the vendors you added and the people who confirmed a shoot with you. Nobody else is on it.' } : {}),
    line: 'TDW has no chat. When you choose someone for your call, each of you gets the other\u2019s phone number.' });
}));

// HUB-2 · MY PEOPLE: a vendor adds or takes off another VENDOR. A person or an organisation is refused (400): they join
// only through a shoot credit they said yes to (CE-47 ruling, 7 Oct 2026).
router.post('/people/:id/my-people', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => okRes(res, await addVendor(sb, await me(req, sb), req.params.id))));
router.delete('/people/:id/my-people', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => okRes(res, await removeVendor(sb, await me(req, sb), req.params.id))));

router.get('/mine', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => {
  const p = await me(req, sb);
  const { data: calls } = await sb.from('collab_posts').select('id, requirement_type, event_date, city, details, state, source, asked_at, created_at').eq('vendor_id', req.vendor.id).order('created_at', { ascending: false }).limit(50);
  const cids = (calls || []).map((c) => c.id);
  const resp = cids.length ? ((await sb.from('collab_responses').select('post_id, state').in('post_id', cids)).data || []) : [];
  const count = (id, st) => resp.filter((r) => r.post_id === id && (!st || r.state === st)).length;
  const { data: applied } = await sb.from('collab_responses').select('id, post_id, state, created_at').eq('responder_vendor_id', req.vendor.id).order('created_at', { ascending: false }).limit(50);
  const { data: waiting } = await sb.from('hub_credits').select(credits.CREDIT_COLS).eq('person_profile_id', p.id).eq('state', 'offered');
  const lines = await credits.workedWith(sb, p.id);
  // names and links for everyone Mine mentions, read once
  const pids = [...new Set([...(waiting || []).map((c) => c.giver_profile_id), ...lines.flatMap((l) => l.with_ids)])];
  const pages = pids.length ? ((await sb.from('hub_profiles').select(profiles.COLS).in('id', pids)).data || []) : [];
  const byId = new Map(pages.map((x) => [x.id, profiles.publicCard(x)]));
  const cardOf = (id) => { const c = byId.get(id); return c ? { name: c.name, page_url: c.page_url } : null; };
  const callIds = [...new Set([...(applied || []).map((a) => a.post_id), ...(waiting || []).map((c) => c.call_id).filter(Boolean)])];
  const callRows = callIds.length ? ((await sb.from('collab_posts').select('id, vendor_id, requirement_type, details, event_date, city').in('id', callIds)).data || []) : [];
  const callById = new Map(callRows.map((c) => [c.id, c]));
  const itemIds = [...new Set([...cids, ...callIds])];
  const itemRows = itemIds.length ? ((await sb.from('collab_post_items').select('post_id, requirement_type, needed').in('post_id', itemIds)).data || []) : [];
  const titleOf = (post) => callTitle(post, itemRows.filter((r) => r.post_id === post.id));
  const posterIds = [...new Set(callRows.map((c) => c.vendor_id))];
  const posterPages = posterIds.length ? ((await sb.from('hub_profiles').select(profiles.COLS).in('vendor_id', posterIds)).data || []) : [];
  const posterNames = posterIds.length ? ((await sb.from('vendors').select('id, business_name').in('id', posterIds)).data || []) : [];
  const posterOf = (vid) => { const pg = posterPages.find((x) => x.vendor_id === vid); if (pg) { const c = profiles.publicCard(pg); return { name: c.name, page_url: c.page_url }; }
    const v = posterNames.find((x) => x.id === vid); return { name: v ? v.business_name : 'A TDW vendor', page_url: null }; };
  const appliedWords = (postId) => { const c = callById.get(postId); return c ? { call: titleOf(c), details: c.details ? String(c.details).slice(0, 60) : null, event_date: c.event_date, city: c.city, from: posterOf(c.vendor_id) } : { call: 'A call', details: null, from: null }; };
  const shootWords = (c) => { const call = c.call_id ? callById.get(c.call_id) : null;
    const name = call ? titleOf(call) : c.shoot_name;
    return [name, call ? call.city : c.city, monthWords(call ? call.event_date : c.month)].filter(Boolean).join(' \u00b7 '); };
  return okRes(res, {
    my_calls: (calls || []).map((c) => ({ id: c.id, title: titleOf(c), event_date: c.event_date, city: c.city, details: c.details, state: c.state,
      interested: count(c.id), picked: count(c.id, 'accepted'), sent_by_tdw: c.source === 'tdw_forward', line: c.source === 'tdw_forward' ? 'Sent by TDW at your request' : null })),
    applied: (applied || []).map((a) => ({ id: a.id, post_id: a.post_id, state: a.state, words: a.state === 'accepted' ? 'Picked' : a.state === 'declined' || a.state === 'passed' ? 'Not picked' : a.state === 'withdrawn' ? 'Withdrawn' : 'Waiting',
      ...appliedWords(a.post_id) })),
    // HUB-2: each waiting credit and each "Worked with" line carries the names and page links the app shows (never ids alone).
    waiting_for_your_yes: (waiting || []).map((c) => ({ ...c, from: cardOf(c.giver_profile_id), shoot_words: shootWords(c) })),
    worked_with: lines.map((l) => ({ ...l, month_words: monthWords(l.month), with: l.with_ids.map(cardOf).filter(Boolean) })),
    // HUB-2: how many "a shoot we did together" requests she can still send. The same count offerForShoot refuses on:
    // shoot requests (no call) she offered in the last 30 days, against MONTHLY_SHOOT_OFFERS.
    shoot_requests_left: await shootRequestsLeft(sb, p.id),
    // HUB-2 (CE-47 ruling, 7 Oct): Mine carries a count when something waits for her answer: a request to confirm a
    // shoot, or someone interested in one of her open calls whom she has not picked or passed yet.
    waiting_count: (waiting || []).length + resp.filter((r) => r.state === 'interested' && (calls || []).some((c) => c.id === r.post_id && c.state === 'open')).length,
  });
}));

async function shootRequestsLeft(sb, profileId) {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await sb.from('hub_credits').select('id, call_id, offered_at').eq('giver_profile_id', profileId);
  const used = (data || []).filter((r) => r.call_id == null && r.offered_at >= since).length;
  return Math.max(0, credits.MONTHLY_SHOOT_OFFERS - used);
}

router.post('/credits', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => {
  const p = await me(req, sb); const b = req.body || {};
  const made = b.call_id ? await credits.offerForCall(sb, p, b.call_id, b.people) : await credits.offerForShoot(sb, p, b);
  return okRes(res, { offered: made.length, credits: made, line: 'Each person gets a request to confirm. The shoot appears on your page and theirs only after they confirm it.' });
}));
router.post('/credits/:id/yes', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => okRes(res, await credits.answer(sb, await me(req, sb), req.params.id, true))));
router.post('/credits/:id/no', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => okRes(res, await credits.answer(sb, await me(req, sb), req.params.id, false))));
router.post('/credits/:id/take-back', requireAuth, resolveVendor(), hubGate, guard(async (req, res, sb) => okRes(res, await credits.takeBack(sb, await me(req, sb), req.params.id))));

router._callTitle = callTitle;   // benches only: the title's one home, run for real
router._resetGate = () => resetGate();   // benches only: the 60 s cache, cleared between cells (gate.js holds it)
module.exports = router;
