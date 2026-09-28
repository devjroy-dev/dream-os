'use strict';
// src/lib/ads/targeting.js · CE-46 · ADS-1 · cut 1 · R-46.12 · HER SETTINGS, VALIDATED AGAINST META'S SHAPES. PURE.
//
// R-46.12 (the founder's ruling, 28 September): the ads room is a control panel; she gets every setting Meta provides
// for the ad. So this file DECIDES NOTHING about who sees her ad: it takes her choices, refuses the malformed ones in
// words, and turns the rest into the fields Meta's ad set takes. Every option LIST (places, languages, interests, life
// events) is read from Meta at run time by the search doors; here only the SHAPE is checked. Meta then validates the
// content itself, and its refusal travels to her as a sentence. (e-243: the seat's Delhi-NCR circle, withdrawn.)
//
// The starting values (the three-tap path, R-46.12 cut 1) are startingValues(): her profile city at 25 km, ages 22 to
// 40, Instagram placements, Meta's minimum for 3 days. They are a first draft she can change, never a limit.
const crypto = require('crypto');

const RADII_KM = [10, 25, 50, 80];
const IG_POSITIONS = ['stream', 'story', 'reels', 'explore', 'explore_home', 'profile_feed'];
const FB_POSITIONS = ['feed', 'story', 'facebook_reels', 'marketplace', 'video_feeds', 'search'];
const BIDS = ['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP'];
const PLACE_TYPES = ['city', 'region', 'country', 'zip'];
const MAX = { places: 25, exclude: 25, locales: 10, interests: 50, icebreakers: 3, welcome: 300, icebreaker: 80 };

const isKey = (k) => typeof k === 'string' && /^[A-Za-z0-9_:-]{1,40}$/.test(k);
const isId = (k) => typeof k === 'string' && /^[0-9]{1,25}$/.test(k);
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

function place(p, errs, where) {
  if (!p || !PLACE_TYPES.includes(p.type) || !isKey(String(p.key || ''))) { errs.push(`${where}: a place Meta did not give us`); return null; }
  const out = { type: p.type, key: String(p.key), name: clean(p.name, 80) };
  if (p.type === 'city') {
    const r = p.radius_km === undefined || p.radius_km === null ? 0 : Number(p.radius_km);
    if (r && !RADII_KM.includes(r)) { errs.push(`${where}: radius must be ${RADII_KM.join(', ')} km or none`); return null; }
    out.radius_km = r;
  }
  return out;
}

/** Her settings in, normalised settings and Meta's ad set fields out, or the refusals in words. */
function validate(s, { now = Date.now() } = {}) {
  const e = [];
  const x = s || {};
  const places = (Array.isArray(x.places) ? x.places : []).slice(0, MAX.places + 1).map((p, i) => place(p, e, `place ${i + 1}`)).filter(Boolean);
  if (!places.length) e.push('Choose at least one place.');
  if (places.length > MAX.places) e.push(`At most ${MAX.places} places.`);
  const exclude = (Array.isArray(x.exclude) ? x.exclude : []).slice(0, MAX.exclude).map((p, i) => place(p, e, `left-out place ${i + 1}`)).filter(Boolean);
  const ageMin = Number(x.age_min ?? 22); const ageMax = Number(x.age_max ?? 40);
  if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax) || ageMin < 18 || ageMax > 65 || ageMin > ageMax) e.push('Age must be between 18 and 65, the first no more than the second.');
  const genders = Array.isArray(x.genders) ? x.genders.map(Number) : [];
  if (!genders.every((g) => g === 1 || g === 2) || genders.length > 1) e.push('Gender is everyone, men, or women.');
  const locales = (Array.isArray(x.locales) ? x.locales : []).slice(0, MAX.locales).map(Number);
  if (!locales.every((n) => Number.isInteger(n) && n > 0)) e.push('A language Meta did not give us.');
  const pick = (arr) => (Array.isArray(arr) ? arr : []).slice(0, MAX.interests).filter((i) => i && isId(String(i.id))).map((i) => ({ id: String(i.id), name: clean(i.name, 80) }));
  const interests = pick(x.interests); const lifeEvents = pick(x.life_events);
  const advantage = x.advantage_audience === true;
  let placements = 'auto';
  if (x.placements && x.placements !== 'auto') {
    const ig = (x.placements.instagram || []).filter((p) => IG_POSITIONS.includes(p));
    const fb = (x.placements.facebook || []).filter((p) => FB_POSITIONS.includes(p));
    if (!ig.length && !fb.length) e.push('Choose at least one place for the ad to appear, or let Meta choose.');
    placements = { instagram: ig, facebook: fb };
  }
  const b = x.budget || {};
  const kind = b.kind === 'lifetime' ? 'lifetime' : 'daily';
  const minor = Number(b.minor);
  if (!Number.isInteger(minor) || minor <= 0) e.push('Choose an amount.');
  const start = x.start ? Date.parse(x.start) : now;
  const end = x.end ? Date.parse(x.end) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) e.push('Choose a start and an end.');
  else if (end - start < 24 * 3600 * 1000) e.push('The ad must run at least one day.');
  else if (start < now - 10 * 60 * 1000) e.push('The start cannot be in the past.');
  // Meta: daily_budget "allowed only for ad sets with a duration longer than 24 hours"; exactly one day takes lifetime.
  const hours = (end - start) / 3600000;
  const effKind = kind === 'daily' && hours <= 24 ? 'lifetime' : kind;
  const bid = x.bid || {};
  const strategy = BIDS.includes(bid.strategy) ? bid.strategy : 'LOWEST_COST_WITHOUT_CAP';
  const bidMinor = Number(bid.amount_minor);
  if (strategy !== 'LOWEST_COST_WITHOUT_CAP' && (!Number.isInteger(bidMinor) || bidMinor <= 0)) e.push('A cost limit needs an amount.');
  const mediaId = String(x.media_id || '');
  if (!isId(mediaId)) e.push('Choose a post.');
  const w = x.welcome || {};
  const welcome = { text: clean(w.text, MAX.welcome), icebreakers: (Array.isArray(w.icebreakers) ? w.icebreakers : []).map((t) => clean(t, MAX.icebreaker)).filter(Boolean) };
  if (welcome.icebreakers.length > MAX.icebreakers) e.push(`At most ${MAX.icebreakers} quick questions.`);
  if (e.length) return { ok: false, errors: e };

  const days = Math.max(1, Math.round(hours / 24));
  const total = effKind === 'lifetime' ? minor : minor * days;
  const settings = { places, exclude, age_min: ageMin, age_max: ageMax, genders, locales, interests, life_events: lifeEvents,
    advantage_audience: advantage, placements, budget: { kind: effKind, minor }, start: new Date(start).toISOString(), end: new Date(end).toISOString(),
    bid: { strategy, amount_minor: strategy === 'LOWEST_COST_WITHOUT_CAP' ? null : bidMinor }, media_id: mediaId, welcome };
  return { ok: true, settings, total_minor: total, days, adset: adsetFields(settings), confirm: confirmOf(settings, total) };
}

function geo(list) {
  const g = {};
  for (const p of list) {
    if (p.type === 'city') (g.cities = g.cities || []).push(p.radius_km ? { key: p.key, radius: p.radius_km, distance_unit: 'kilometer' } : { key: p.key });
    else if (p.type === 'region') (g.regions = g.regions || []).push({ key: p.key });
    else if (p.type === 'zip') (g.zips = g.zips || []).push({ key: p.key });
    else (g.countries = g.countries || []).push(p.key);
  }
  return g;
}

/** Meta's ad set fields from her normalised settings (field names as in the ad set reference and click-to-Instagram). */
function adsetFields(s) {
  const targeting = { geo_locations: geo(s.places), age_min: s.age_min, age_max: s.age_max };
  if (s.exclude.length) targeting.excluded_geo_locations = geo(s.exclude);
  if (s.genders.length) targeting.genders = s.genders;
  if (s.locales.length) targeting.locales = s.locales;
  const flex = {};
  if (s.interests.length) flex.interests = s.interests.map((i) => ({ id: i.id, name: i.name }));
  if (s.life_events.length) flex.life_events = s.life_events.map((i) => ({ id: i.id, name: i.name }));
  if (Object.keys(flex).length) targeting.flexible_spec = [flex];
  targeting.targeting_automation = { advantage_audience: s.advantage_audience ? 1 : 0 };
  if (s.placements !== 'auto') {
    const pp = [];
    if (s.placements.instagram.length) { pp.push('instagram'); targeting.instagram_positions = s.placements.instagram; }
    if (s.placements.facebook.length) { pp.push('facebook'); targeting.facebook_positions = s.placements.facebook; }
    targeting.publisher_platforms = pp;
  }
  const f = { targeting, bid_strategy: s.bid.strategy, start_time: s.start, end_time: s.end };
  f[s.budget.kind === 'lifetime' ? 'lifetime_budget' : 'daily_budget'] = String(s.budget.minor);
  if (s.bid.amount_minor) f.bid_amount = String(s.bid.amount_minor);
  return f;
}

/** The echo: every setting and the total, canonical and hashed. The room sends it back; /run refuses on any mismatch. */
function canon(v) {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  return JSON.stringify(v === undefined ? null : v);
}
function confirmOf(settings, total) { return crypto.createHash('sha256').update(canon({ settings, total })).digest('hex').slice(0, 32); }

/** The three-tap path's first draft. Her city comes from Meta's search on her profile city; nothing is assumed. */
function startingValues({ cityPlace, minDailyMinor, mediaId, now = Date.now() }) {
  const start = new Date(now + 10 * 60 * 1000); const end = new Date(start.getTime() + 3 * 86400 * 1000);
  return { places: cityPlace ? [{ ...cityPlace, type: 'city', radius_km: 25 }] : [], exclude: [], age_min: 22, age_max: 40, genders: [],
    locales: [], interests: [], life_events: [], advantage_audience: false, placements: { instagram: ['stream', 'story', 'reels'], facebook: [] },
    budget: { kind: 'daily', minor: minDailyMinor || null }, start: start.toISOString(), end: end.toISOString(),
    bid: { strategy: 'LOWEST_COST_WITHOUT_CAP' }, media_id: mediaId || null, welcome: { text: '', icebreakers: [] } };
}

module.exports = { validate, adsetFields, confirmOf, canon, startingValues, RADII_KM, IG_POSITIONS, FB_POSITIONS, BIDS, MAX };
