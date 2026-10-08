'use strict';
// src/lib/vendor/firstBuild.js · TDW · CE-47 · WEB-4 cut 19 · THE TWO-MINUTE START'S FIRST BUILD (the chair's contract).
// After she connects Instagram, ONE build, five steps in order, each reported as it finishes (vendor_first_builds, 0220):
//   photos     up to min(20, her remaining portfolio room) of her recent Instagram photographs (source 'instagram')
//   website    her site DRAFT: name, ONE neutral style (gallery, its default palette and pairing), cover slides
//              and looks (status 'draft') from her photographs; never published; never over anything she made
//   packages   her craft's starter packages, only if she has none (ensureSeeded)
//   storefront fills only her EMPTY About, from her Instagram bio; no bio, nothing filled ("skipped: no bio")
//   eliza      writes NOTHING: Eliza reads her trade, city and packages live (coupleSystemPrompt.js, price_state); this
//              step checks those exist and names any gap
// The door sends her no message when it finishes; the screen says "TDW keeps building. It will be here when you come
// back." and Home reads GET /latest. Every step, skipped ones too, carries a plain line from the server (amendment 2).
// NEVER: publishes; overwrites a field she filled; invents a fact. A failed step is reported in plain words and the
// steps that do not need it still run. A restart resumes from the last finished step. On Basic, what her plan does
// not open is reported 'skipped' with the plan that opens it.
// CE-47 WEB-4 cut 26 (b271) · THE FIRST BUILD FROM HER OWN PHOTOS (the chair's rulings of 8 October, (a) to (e)):
//   (a) TDW'S UNTOUCHED DRAFT, no column: the website step records the updated_at it wrote (counts.draft_written_at).
//       The draft is TDW's and untouched only while ALL FOUR hold: its updated_at still equals that stamp; that step
//       wrote it with no photos (no looks, no cover slides); she has no looks; her site was never published or styled.
//       Every write of hers goes through the room's saveDraft, which stamps updated_at, so any edit of hers makes the
//       draft hers for good; Discard deletes it, and no draft is never TDW's.
//   (b) POST /first-build { step: 'website' } runs ONLY the website step again, inside her latest build, and fills
//       only under (a); GET /latest carries website_can_fill. No hook on upload.
//   (c) a look made from her photo takes its source from the photo: 'instagram' from Instagram, 'manual' otherwise
//       (vendor_looks.source allows manual, phone, instagram; 'manual' now includes looks TDW made from her uploads).
//       The look PHOTO's own source ('instagram' or 'upload') is what her site's rule reads (siteCard showsOnHerSite).
//   (d) no Instagram but photos in her portfolio: the photos step says so, and says they were used only when the
//       website step used them. No Instagram and no photos: the not-connected line, as before.
const siteModel = require('../site/siteModel');
const REG = require('../site/styles');
const limits = require('../site/limits');

const STEP_KEYS = Object.freeze(['photos', 'website', 'packages', 'storefront', 'eliza']);
const N_PHOTOS = 20;                         // her portfolio's own cap (portfolio.js MAX_PORTFOLIO_IMAGES)
const COVER_SLIDES = 3; const LOOKS_MAX = 12;
// ONE NEUTRAL STYLE for every new vendor (the founder's ruling of 4 October: a style is NEVER tied to a profession; the
// chair's correction, 6 October). Gallery, with its default palette and pairing, the same for every trade, until the
// photo rule exists (after WEB-8's 30-feed test). Written EXPLICITLY into her draft (styleFor may return nothing for a
// new Basic vendor).
const NEUTRAL_STYLE = 'gallery';
const LINES = Object.freeze({
  photos: (n, more) => (n ? `We added ${n} of your photos.${more ? ` ${more} more did not fit.` : ''}` : 'Your portfolio is already full, so we added no photos.'),
  photosNone: 'We found no photos on your Instagram to add.',
  noInstagram: 'Instagram is not connected, so we added no photos.',   // cut 21: skipped, not failed; cut 26: R-47.1
  // cut 26 (d): no Instagram, but her own photos are in her portfolio; the second sentence only when the website used them
  photosOwn: (n, used) => (n === 1 ? `Your portfolio has 1 photo.${used ? ' We used it for your website.' : ''}`
    : `Your portfolio has ${n} photos.${used ? ' We used them for your website.' : ''}`),
  noInstagramBio: 'Instagram is not connected, so we left your About empty.',   // cut 21; cut 26: R-47.1
  websiteNoPhotos: 'Your website draft is ready to check. It has no photos yet.',   // cut 21: plain, never a promise
  website: 'Your website draft is ready to check.',
  websiteKept: 'Your website already has your own work, so we left it as it is.',
  packages: (n) => `We added ${n} starter packages.`,
  packagesKept: 'You already have packages, so we left them as they are.',
  storefront: 'We filled in your About from your Instagram bio.',
  storefrontKept: 'Your About is already filled in, so we left it as it is.',
  noBio: 'Your Instagram has no bio, so we left your About empty.',   // cut 26: R-47.1
  eliza: 'Eliza knows your packages and prices.',
  // cut 26: R-47.1; `gaps` is a list, joined "a, b and c"
  elizaGap: (gaps) => `Add ${andList(gaps)} so Eliza can answer clients' questions.`,
  failed: 'TDW could not finish this step. You can fill in this part yourself.',   // cut 26: R-47.1
  // cut 26 (b): POST { step: 'website' } refused, by its code
  websiteHers: 'Your website already has your own work, so we left it as it is.',
  websiteNoPhotosYet: 'Your portfolio has no photos yet, so we did not change your website.',
  noBuild: 'TDW has not made a website draft for you yet.',
});
function andList(xs) { const a = [].concat(xs).filter(Boolean); return a.length < 2 ? (a[0] || '') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`; }
// Amendment 1 (FE-9 via the chair): on Basic no whole step is skipped; PARTS of the website step are, carried on the
// step itself as opens: [{ line, plan }]. cut 26 (the chair, 8 October, R-47.1): each line is one whole sentence with
// its plan in it, and the app shows it as it is; `plan` stays for the app's logic.
const BASIC_OPENS = Object.freeze([
  Object.freeze({ line: 'More styles, colour sets and font pairings are available on Essential.', plan: 'Essential' }),
  Object.freeze({ line: 'The client reviews section is available on Essential.', plan: 'Essential' }),
  Object.freeze({ line: 'Collections and the journal are available on Signature.', plan: 'Signature' }),
  Object.freeze({ line: 'Your own domain is available on Signature.', plan: 'Signature' }),
]);

const nowIso = () => new Date().toISOString();
const blank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
async function rows(q) { try { const { data, error } = await q; return !error && Array.isArray(data) ? data : []; } catch { return []; } }
async function one(q) { try { const { data, error } = await q; return !error && data ? data : null; } catch { return null; } }

function freshSteps() { return STEP_KEYS.map((key) => ({ key, state: 'waiting', line: null, counts: null, opens: null })); }
const opensFor = (tier) => (siteModel.tierOf(tier) === 'basic' ? BASIC_OPENS.map((o) => Object.assign({}, o)) : null);

/** POST: start her build, or return the one already running (one at a time). */
async function start(sb, vendor, deps) {
  const running = await one(sb.from('vendor_first_builds').select('id').eq('vendor_id', vendor.id).eq('state', 'running').maybeSingle());
  if (running) return { build_id: running.id, already: true };
  const created = await one(sb.from('vendor_first_builds').insert({ vendor_id: vendor.id, state: 'running', steps: freshSteps() }).select('id').single());
  if (!created) {   // a second POST racing the first: the unique index refused it; answer the one that won
    const again = await one(sb.from('vendor_first_builds').select('id').eq('vendor_id', vendor.id).eq('state', 'running').maybeSingle());
    return again ? { build_id: again.id, already: true } : { error: 'start_failed' };
  }
  const job = run(sb, vendor, created.id, deps);   // not awaited: the app polls
  if (deps && deps.onRun) deps.onRun(job);
  return { build_id: created.id, already: false };
}

/** GET latest: her most recent build and its state (Home: "Your business is ready to check"), or null.
 *  cut 26 (b): website_can_fill, true only when POST { step: 'website' } would fill her draft. */
async function latest(sb, vendorId) {
  const r = await rows(sb.from('vendor_first_builds').select('id').eq('vendor_id', vendorId).order('started_at', { ascending: false }).limit(1));
  if (!r.length) return null;
  const b = await read(sb, vendorId, r[0].id); if (!b) return null;
  const can = b.state === 'running' ? { ok: false } : await canFillWebsite(sb, vendorId, b.steps);
  return Object.assign({ build_id: r[0].id }, b, { website_can_fill: can.ok === true });
}

/** cut 26 (a)+(b): may the website step fill her draft from her photos now? { ok } or { ok: false, code }. */
async function canFillWebsite(sb, vendorId, steps) {
  const w = (Array.isArray(steps) ? steps : []).find((s) => s.key === 'website');
  if (!w || !w.counts || (w.state !== 'done' && w.state !== 'skipped')) return { ok: false, code: 'NO_BUILD' };
  const st = await websiteState(sb, vendorId, w.counts);
  if (st.hers || !st.untouched) return { ok: false, code: 'WEBSITE_HERS' };
  if (!st.pics.length) return { ok: false, code: 'NO_PHOTOS' };
  return { ok: true };
}
const REFUSAL_LINES = Object.freeze({ WEBSITE_HERS: LINES.websiteHers, NO_PHOTOS: LINES.websiteNoPhotosYet, NO_BUILD: LINES.noBuild });

/** POST { step: 'website' }: the website step alone, again, inside her latest build; only under (a). Not a hook on upload. */
async function rerunWebsite(sb, vendor, deps) {
  const running = await one(sb.from('vendor_first_builds').select('id').eq('vendor_id', vendor.id).eq('state', 'running').maybeSingle());
  if (running) return { build_id: running.id, already: true };
  const r = await rows(sb.from('vendor_first_builds').select('id, state, steps').eq('vendor_id', vendor.id).order('started_at', { ascending: false }).limit(1));
  if (!r.length) return { refused: 'NO_BUILD', line: REFUSAL_LINES.NO_BUILD };
  const row = r[0]; const steps = Array.isArray(row.steps) ? row.steps.map((s) => Object.assign({}, s)) : [];
  const can = await canFillWebsite(sb, vendor.id, steps);
  if (!can.ok) return { refused: can.code, line: REFUSAL_LINES[can.code] };
  const w = steps.find((s) => s.key === 'website'); w.state = 'waiting'; w.line = null;   // its counts stay: the stamp
  // one guarded flip: only a build that is not running becomes running (the unique index refuses a second runner)
  const flipped = await rows(sb.from('vendor_first_builds').update({ state: 'running', steps, finished_at: null, updated_at: nowIso() })
    .eq('id', row.id).eq('vendor_id', vendor.id).neq('state', 'running').select('id'));
  if (!flipped.length) {
    const again = await one(sb.from('vendor_first_builds').select('id').eq('vendor_id', vendor.id).eq('state', 'running').maybeSingle());
    return again ? { build_id: again.id, already: true } : { error: 'start_failed' };
  }
  const job = run(sb, vendor, row.id, deps);   // only the website step is waiting, so only it runs
  if (deps && deps.onRun) deps.onRun(job);
  return { build_id: row.id, already: false };
}

/** GET: her build, as the app reads it. */
async function read(sb, vendorId, buildId) {
  const row = await one(sb.from('vendor_first_builds').select('id, vendor_id, state, steps').eq('id', buildId).eq('vendor_id', vendorId).maybeSingle());
  if (!row) return null;
  const steps = Array.isArray(row.steps) ? row.steps : [];
  const site = steps.find((s) => s.key === 'website');
  return { state: row.state, steps, site_ready: Boolean(site && site.state === 'done' && site.counts && site.counts.draft) };
}

async function save(sb, buildId, steps, state) {
  const patch = { steps, updated_at: nowIso() }; if (state) { patch.state = state; if (state !== 'running') patch.finished_at = nowIso(); }
  try { await sb.from('vendor_first_builds').update(patch).eq('id', buildId); } catch (_e) { /* the next save carries it */ }
}

/** The five steps in order; a restart resumes (a step already done, skipped or failed is not run again). */
async function run(sb, vendor, buildId, deps) {
  const row = await one(sb.from('vendor_first_builds').select('steps').eq('id', buildId).maybeSingle());
  const steps = (row && Array.isArray(row.steps) && row.steps.length) ? row.steps.map((s) => Object.assign({}, s)) : freshSteps();
  for (const key of STEP_KEYS) {
    const s = steps.find((x) => x.key === key);
    if (!s || ['done', 'skipped', 'failed'].includes(s.state)) continue;
    const prev = s.counts ? Object.assign({}, s.counts) : null;   // cut 26 (a): the stamp a rerun compares against
    s.state = 'running'; await save(sb, buildId, steps);
    try { Object.assign(s, await STEPS[key](sb, vendor, deps || {}, prev)); }
    catch (_e) { Object.assign(s, { state: 'failed', line: LINES.failed, counts: null }); }
    if (key === 'website') photosLineAfterWebsite(steps);
    await save(sb, buildId, steps);
  }
  const anyFailed = steps.some((s) => STEP_KEYS.includes(s.key) && s.state === 'failed');
  await save(sb, buildId, steps, anyFailed ? 'failed' : 'done');
  return steps;
}

/** cut 26 (d): the photos step is skipped only when no Instagram is connected. When her portfolio has her own photos,
 *  its line names them, and says they were used only when the website step put them on her draft. */
function photosLineAfterWebsite(steps) {
  const p = steps.find((x) => x.key === 'photos'); const w = steps.find((x) => x.key === 'website');
  if (!p || p.state !== 'skipped' || !w || !w.counts) return;
  const n = Number(w.counts.photos) || 0; if (!n) return;
  const used = w.state === 'done' && ((w.counts.looks || 0) > 0 || (w.counts.cover_slides || 0) > 0);
  p.line = LINES.photosOwn(n, used); p.counts = Object.assign({}, p.counts, { own: n });
}

/** cut 26 (a): what the website step reads, and whether her draft is TDW's untouched one (all four conditions). */
async function websiteState(sb, vendorId, prev) {
  const [live, draft, looks, photos] = await Promise.all([
    one(sb.from('vendor_sites').select('published_at, style').eq('vendor_id', vendorId).maybeSingle()),
    one(sb.from('vendor_site_drafts').select('settings, sections, pages, updated_at').eq('vendor_id', vendorId).maybeSingle()),
    rows(sb.from('vendor_looks').select('id').eq('vendor_id', vendorId).is('deleted_at', null)),
    rows(sb.from('vendor_portfolio').select('id, image_url, caption, approval_state, source').eq('vendor_id', vendorId).order('position', { ascending: true })),
  ]);
  const pics = photos.filter((p) => /^https:\/\//.test(String(p.image_url || '')));
  const untouched = untouchedDraft(draft, prev);
  const hers = Boolean((live && (live.published_at || live.style)) || looks.length
    || (draft && draft.settings && Object.keys(draft.settings).length && !untouched));
  return { pics, untouched, hers };
}
function untouchedDraft(draft, prev) {
  if (!draft || !prev || prev.draft !== true || !prev.draft_written_at) return false;
  if ((prev.looks || 0) !== 0 || (prev.cover_slides || 0) !== 0) return false;     // that step wrote no photos
  const a = Date.parse(draft.updated_at); const b = Date.parse(prev.draft_written_at);
  return Number.isFinite(a) && a === b;                                            // no write of hers since
}

const STEPS = {
  async photos(sb, vendor, deps) {
    const token = await deps.tokenFor(sb, vendor.id);
    // cut 21: no Instagram connected is not a failure; the step is skipped and says why
    if (!token) return { state: 'skipped', line: LINES.noInstagram, counts: { imported: 0, no_room: 0 } };
    const media = await deps.listMedia(token);
    if (!media || media.ok === false) throw new Error('media read failed');
    const urls = (media.items || media.media || []).map((m) => (m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || m.thumbnail_url || null))).filter(Boolean);
    if (!urls.length) return { state: 'done', line: LINES.photosNone, counts: { imported: 0, no_room: 0 } };
    const room = await deps.canAcceptMore(sb, vendor.id, 1);
    const free = room && Number.isFinite(room.remaining) ? room.remaining : (room && room.ok ? N_PHOTOS : 0);
    const take = Math.min(N_PHOTOS, Math.max(0, free), urls.length);
    if (!take) return { state: 'done', line: LINES.photos(0, 0), counts: { imported: 0, no_room: urls.length } };
    const r = await deps.importSelected(sb, vendor.id, urls.slice(0, take));
    const n = (r && r.imported_count) || 0; const more = Math.max(0, urls.length - take);
    return { state: 'done', line: LINES.photos(n, more), counts: { imported: n, no_room: more } };   // amendment 3
  },

  async website(sb, vendor, _deps, prev) {
    const { pics, hers } = await websiteState(sb, vendor.id, prev);
    if (hers) return { state: 'skipped', line: LINES.websiteKept, counts: { draft: false, looks: 0, cover_slides: 0, photos: pics.length }, opens: opensFor(vendor.tier) };
    const style = NEUTRAL_STYLE;   // never from her trade
    const name = limits.field('site_name', vendor.business_name || '');
    const settings = { style, styles_picked: [style], palette_id: null, font_pair: null,   // her style's defaults (b)
      site_name: name.ok && name.value ? name.value : null,
      cover: pics.slice(0, COVER_SLIDES).map((p) => ({ photo: { url: p.image_url }, headline: null, eyebrow: null, emphasis: null, button: null, target: null })) };
    const stamp = nowIso();   // cut 26 (a): recorded, so a later rerun can tell her draft is still TDW's untouched one
    const wrote = await one(sb.from('vendor_site_drafts').upsert({ vendor_id: vendor.id, settings, sections: [], pages: [], updated_at: stamp }, { onConflict: 'vendor_id' }).select('updated_at').single());
    let made = 0; const taken = [];
    for (const p of pics.slice(0, LOOKS_MAX)) {
      const words = String(p.caption || '').split('\n').map((x) => x.trim()).find(Boolean) || '';
      const t = limits.field('look_title', words.slice(0, 60)); const title = (t.ok && t.value) || `Look ${made + 1}`;
      const slug = limits.slugFrom(title, taken); taken.push(slug);
      // cut 26 (c): the look's source follows its photo's; 'manual' includes looks TDW made from her uploaded photos
      const look = await one(sb.from('vendor_looks').insert({ vendor_id: vendor.id, slug, title, status: 'draft', source: p.source === 'instagram' ? 'instagram' : 'manual' }).select('id').single());
      if (!look) continue;
      await sb.from('vendor_look_photos').insert({ look_id: look.id, vendor_id: vendor.id, image_url: p.image_url, position: 0,
        approval_state: p.approval_state === 'approved' ? 'approved' : 'pending', source: p.source === 'instagram' ? 'instagram' : 'upload' });
      made += 1;
    }
    return { state: 'done', line: pics.length ? LINES.website : LINES.websiteNoPhotos, opens: opensFor(vendor.tier),
      counts: { draft: true, looks: made, cover_slides: settings.cover.length, photos: pics.length, draft_written_at: (wrote && wrote.updated_at) || stamp } };
  },

  async packages(sb, vendor, deps) {
    const r = await deps.ensureSeeded(sb, vendor);
    if (r && r.seeded) return { state: 'done', line: LINES.packages(r.count), counts: { packages: r.count } };
    if (r && r.reason === 'already_seeded') return { state: 'skipped', line: LINES.packagesKept, counts: { packages: 0 } };
    const has = await rows(sb.from('vendor_packages').select('id').eq('vendor_id', vendor.id).is('deleted_at', null));
    if (has.length) return { state: 'skipped', line: LINES.packagesKept, counts: { packages: 0 } };
    throw new Error((r && r.reason) || 'seed failed');
  },

  async storefront(sb, vendor, deps) {
    const v = await one(sb.from('vendors').select('about').eq('id', vendor.id).maybeSingle());
    if (v && !blank(v.about)) return { state: 'skipped', line: LINES.storefrontKept, counts: { filled: 0 } };
    const token = await deps.tokenFor(sb, vendor.id);
    if (!token) return { state: 'skipped', line: LINES.noInstagramBio, counts: { filled: 0 } };   // cut 21
    const bio = await deps.fetchBio(token);
    const words = typeof bio === 'string' ? bio.trim().slice(0, 600) : '';
    if (!words) return { state: 'skipped', line: LINES.noBio, counts: { filled: 0 } };   // never a guess (ruling 3)
    await sb.from('vendors').update({ about: words }).eq('id', vendor.id);   // only reached when her About was read empty just above
    return { state: 'done', line: LINES.storefront, counts: { filled: 1 } };
  },

  async eliza(sb, vendor) {   // WRITES NOTHING (ruling 2): checks her inputs exist
    const [v, pk] = await Promise.all([
      one(sb.from('vendors').select('category, city').eq('id', vendor.id).maybeSingle()),
      rows(sb.from('vendor_packages').select('id, total').eq('vendor_id', vendor.id).is('deleted_at', null)),
    ]);
    const gaps = [];
    if (!v || blank(v.category)) gaps.push('your trade'); if (!v || blank(v.city)) gaps.push('your city');
    if (!pk.some((p) => Number(p.total) > 0)) gaps.push('a package with a price');
    const facts = 3 - gaps.length;
    return { state: 'done', line: gaps.length ? LINES.elizaGap(gaps) : LINES.eliza, counts: { facts } };
  },
};

/** Her bio, read in this module (igOAuth untouched; the same permission, instagram_business_basic). null if not given. */
async function fetchBio(accessToken, fetchImpl) {
  try {
    const q = new URLSearchParams({ fields: 'user_id,username,biography', access_token: accessToken });
    const res = await (fetchImpl || fetch)(`https://graph.instagram.com/me?${q.toString()}`);
    if (!res.ok) return null; const body = await res.json();
    return body && typeof body.biography === 'string' ? body.biography : null;
  } catch { return null; }
}

/** The real helpers, wired once (the doors use these; the bench stands them in). */
function liveDeps() {
  const igConn = require('./igConnection'); const igImport = require('./igImport'); const portfolio = require('./portfolio');
  const seeds = require('./packageSeeds');
  return {
    tokenFor: async (sb, vendorId) => { const t = await igConn.tokenForCall(sb, vendorId); return t && t.ok ? t.accessToken : null; },
    listMedia: (token) => igImport.listInstagramMedia(token),
    canAcceptMore: (sb, vendorId, n) => portfolio.canAcceptMore(sb, vendorId, n),
    importSelected: (sb, vendorId, urls) => igImport.importSelected(sb, vendorId, urls),
    ensureSeeded: (sb, vendor) => seeds.ensureSeeded(sb, vendor),
    fetchBio: (token) => fetchBio(token),
  };
}

module.exports = { start, read, latest, run, STEPS, STEP_KEYS, N_PHOTOS, NEUTRAL_STYLE, LINES, BASIC_OPENS, fetchBio, liveDeps, freshSteps,
  rerunWebsite, canFillWebsite, untouchedDraft, REFUSAL_LINES };
