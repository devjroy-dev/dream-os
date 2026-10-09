// src/api/vendor/solutions/siteRoom.js · TDW · CE-47 · WEB-4 cut 3 · HER ROOM'S DOORS FOR THE SIX-STYLE SITE.
// Mounted under /api/v2/vendor/solutions/site (site.js), behind her session. Every read and write carries her scope
// (vendor_id = req.vendor.id); no door takes a vendor id from the body.
//
//   GET    /room                          everything WEB-6 draws: her stored choices, what they resolve to, what her
//                                          plan opens, the ids each style offers, and to_fix
//   PATCH  /settings                      style, picks, palette, fonts, motion, finish, cover, monogram, name, copy, credit
//   PUT    /sections                      her home sections (show, hide, order, variant, headings, body)
//   PUT    /pages                         Prestige custom pages
//   GET    /looks                         her looks, each with public_state and every photo's review
//   POST   /looks · PATCH /looks/:id · DELETE /looks/:id · POST /looks/:id/publish · POST /looks/:id/unpublish
//   POST   /looks/:id/photos/sign         signed upload for a fresh photo (Cloudinary, her own folder)
//   POST   /looks/:id/photos              { image_url } a fresh upload (joins the queue) or { portfolio_id } one of hers
//   PATCH  /looks/:id/photos/:pid · DELETE /looks/:id/photos/:pid
//   POST   /collections · PATCH /collections/:id · DELETE /collections/:id · PUT /collections/:id/looks
//   PUT    /faq
//   GET    /testimonials · POST /testimonials/requests · POST /testimonials/requests/:id/revoke
//   POST   /testimonials/:id/approve · POST /testimonials/:id/hide       (no edit door: ruling 2)
//
// The rulings: CE-47's field list and gaps (30 September 2026). A look photo picked from her own portfolio carries that
// picture's safety state (cut 30, R-47.2; it carried its approval before), matched by the portfolio row's id AND its
// exact address, never by resemblance; a fresh upload is checked by Google's safety check (gap 6, as R-47.2 reads it). Refusal lines are plain (R-45.30) and listed in the handover for the
// founder's veto. Her tier is read to decide and never returned as a name.
'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const resolveVendor = require('../../middleware/resolveVendor');
const asyncHandler = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');
const siteModel = require('../../../lib/site/siteModel');
const REG = require('../../../lib/site/styles');
const limits = require('../../../lib/site/limits');
const siteCard = require('../../../lib/site/siteCard');
const { signUpload, uploadUrl, nowTimestamp } = require('../../../lib/cloudinarySign');

const auth = [requireAuth, resolveVendor()];
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);
const now = () => new Date().toISOString();
const rank = (t) => ({ basic: 0, essential: 1, signature: 2, prestige: 3 }[siteModel.tierOf(t)]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLOUD = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

const LINES = Object.freeze({
  notYours: 'That was not found.',
  saveFailed: 'That could not be saved yet. Please try again.',
  styleClosed: 'Your plan does not include that style.',
  tooManyStyles: (n) => `Your plan includes ${n} styles. Remove one before you add another.`,
  paletteClosed: 'That colour set does not belong to this style. Pick one of its own.',
  ownColour: 'Choosing your own colour is available on Signature.',
  gradient: 'Colour blends are available on Prestige.',
  fontClosed: 'This style does not offer that font pairing. Pick one of its own.',
  finishClosed: 'This style does not offer that option.',
  textureClosed: 'Background textures are available on Prestige.',
  creditRemoval: 'Removing the TDW line at the bottom of your site is available on Prestige.',
  pagesClosed: 'Extra pages are available on Prestige.',
  collectionsClosed: 'Collections are available on Signature.',
  sectionClosed: 'Your plan does not include that section.',
  photoAddress: 'That photo could not be found. Upload it again, then add it.',
  photoCap: `A look can hold up to ${limits.COUNTS.photos_per_look} photos.`,
  publishedCap: `You can have up to ${limits.COUNTS.published_looks} looks on your site.`,
  needPhoto: 'Add at least one photo to this look first.',
  videoLink: 'Use a YouTube or Instagram link.',
  videoPlan: 'Video reviews are available on Signature.',
  phone: 'Enter the number with its country code, like +91 98765 43210.',
  nothingToPublish: 'There are no changes to publish.',
  // CE-47 WEB-4 cut 16: Basic's room, each locked field refused by name with the plan that opens it (ruling 3)
  basicOneStyle: 'Basic includes one style. More styles are available on Essential.',
  basicPalette: 'Colour sets are available on Essential.',
  basicFont: 'Font pairings are available on Essential.',
  reviewsClosed: 'Client reviews are available on Essential.',
  visitorsClosed: 'Visitor counts are available on Essential.',
  styleClock: (words) => `You can change your style once every 30 days. You can change it again on ${words}.`,
});

/** CE-47 WEB-4 cut 16: the room is open to Basic (one free style). What her plan does not open is refused field by field,
 * by name, with the plan that opens it; `gateAt` keeps a whole door shut below a plan. */
function gate(_req, _res) { return true; }
function gateAt(req, res, at, line) { if (rank(req.vendor.tier) < at) { errRes(res, 403, line); return false; } return true; }

async function rows(q) { try { const { data, error } = await q; return !error && Array.isArray(data) ? data : []; } catch { return []; } }
async function one(q) { try { const { data, error } = await q; return !error && data ? data : null; } catch { return null; } }

// ── GET /room ─────────────────────────────────────────────────────────────────────────────────────────────────────
async function siteRowOf(sb, vid) {
  return one(sb.from('vendor_sites').select('look, pages, credit_shown, published_at, style_changed_at, style, styles_picked, palette_id, palette_custom, font_pair, motion, corners, texture, button_style, cover_mode, cover, monogram, site_name, copy').eq('vendor_id', vid).maybeSingle());
}

// ── CUT 5 · THE DRAFT (the chair's item 1; WEB-6's W6-k) ──────────────────────────────────────────────────────────
// Settings, her home's sections and (Prestige) pages are written to ONE DRAFT per vendor (vendor_site_drafts, 0189),
// validated exactly as before. POST /publish applies it to the live rows in one transaction (site_publish_draft);
// POST /discard drops it. The public card reads the live rows only. Looks, collections, questions, testimonials and
// prices are not drafted. The change lines below are vendor-facing (R-45.30; in the handover's veto table).
const previewLib = require('../../../lib/site/preview');
async function draftOf(sb, vid) {
  return one(sb.from('vendor_site_drafts').select('settings, sections, pages, updated_at').eq('vendor_id', vid).maybeSingle());
}
async function saveDraft(sb, vid, patch) {
  const { error } = await sb.from('vendor_site_drafts').upsert(Object.assign({ vendor_id: vid, updated_at: new Date().toISOString() }, patch), { onConflict: 'vendor_id' });
  return !error;
}
const SETTING_LINES = Object.freeze({
  // cut 26: R-47.1, each a sentence that says who did what
  style: 'You changed your style.', styles_picked: 'You changed the styles you picked.', palette_id: 'You changed your colours.', palette_custom: 'You changed your colours.',
  font_pair: 'You changed your fonts.', motion: 'You changed how your site moves.', corners: 'You changed the corners.', button_style: 'You changed the buttons.',
  texture: 'You changed the background texture.', cover_mode: 'You changed your cover.', cover: 'You changed your cover.', monogram: 'You changed your monogram.',
  site_name: 'You changed your site name.', copy: 'You changed the words on your site.', credit_shown: 'You changed the TDW line at the bottom of your site.',
});
const SECTION_LABELS = Object.freeze({ cover: 'Cover', looks: 'Looks', collections: 'Collections', band: 'Band', reviews: 'Client reviews',
  pricing: 'Prices', studio: 'Studio', journal: 'Journal', faq: 'Questions', enquire: 'Enquire' });
const same = (a, b) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
/** What her draft would change, in plain words: [{ area, line }], one line per thing, no repeats. */
function changesOf(live, liveSections, livePages, draft) {
  const out = []; const seen = new Set(); const push = (area, line) => { if (!seen.has(line)) { seen.add(line); out.push({ area, line }); } };
  const d = draft || {}; const l = live || {};
  for (const [k, v] of Object.entries(d.settings || {})) if (SETTING_LINES[k] && !same(v, l[k])) push('settings', SETTING_LINES[k]);
  const byKey = new Map((liveSections || []).filter((x) => !x.page_id).map((x) => [x.key, x]));
  for (const x of Array.isArray(d.sections) ? d.sections : []) {
    const was = byKey.get(x.key) || {};
    const differs = ['variant', 'shown', 'position', 'eyebrow', 'heading', 'body'].some((f) => x[f] !== undefined && !same(x[f], was[f]));
    if (differs) push('sections', SECTION_LABELS[x.key] ? `You changed the ${SECTION_LABELS[x.key]} section.` : 'You changed one of your own sections.');
  }
  if (Array.isArray(d.pages)) {
    const a = (livePages || []).map((p) => [p.slug, p.title, p.shown !== false]); const b = d.pages.map((p) => [p.slug, p.title, p.shown !== false]);
    if (!same(a, b)) push('pages', 'You changed your pages.');
  }
  return out;
}
function offeredFinish(tier) {
  const out = {};
  for (const s of REG.STYLE_IDS) {
    const textures = REG.finishIds(s, 'textures');
    out[s] = { corners: REG.finishIds(s, 'corners'), buttons: REG.finishIds(s, 'buttons'),
      textures: rank(tier) >= 3 ? textures : textures.filter((t, i) => i === 0 || t === 'clean') };
  }
  return out;
}
router.get('/room', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const [row, sections, pages, pkgs, draft] = await Promise.all([
    siteRowOf(sb, v.id),
    rows(sb.from('vendor_site_sections').select('key, page_id, variant, shown, position, eyebrow, heading, body, deleted_at').eq('vendor_id', v.id).is('deleted_at', null)),
    rows(sb.from('vendor_site_pages').select('id, slug, title, position, shown, deleted_at').eq('vendor_id', v.id).is('deleted_at', null)),
    rows(sb.from('vendor_packages').select('id, name, total, deleted_at').eq('vendor_id', v.id).is('deleted_at', null)),
    draftOf(sb, v.id),
  ]);
  // `stored` is HER DRAFT laid over the live rows: what she is editing. The public card still reads the live rows.
  const o = previewLib.overlay(row || {}, sections, pages, draft);
  const resolved = siteModel.resolveSite({ tier: v.tier, category: v.category, businessName: v.business_name, site: o.site, sections: o.sections, pages: o.pages });
  const list = draft ? changesOf(row, sections, pages, draft) : [];
  return okRes(res, { room: {
    stored: o.site,
    resolved,                                   // her own room: `can`, styles_open and palette.moved are hers to see
    changes: { count: list.length, list, published_at: (row && row.published_at) || null },
    is_live: Boolean(row && row.published_at),
    // the card door serves her draft to this token only: GET /api/v2/public/vendor-card/<handle>?preview=<token>[&style=<id>]
    preview: previewLib.issue(v.id),   // cut 16: Basic has a styles site to preview too
    style_clock: siteModel.styleClock(v.tier, row || {}, Date.now()),   // cut 16: her last change and the day she next can
    styles: REG.STYLE_IDS.map((s2) => ({ id: s2, label: REG.STYLES[s2].label, pairs: REG.STYLES[s2].pairs, palettes: REG.palettesOf(s2).map((p) => ({ id: p.id, label: p.label, swatch: { ground: p.roles.ground, ink: p.roles.ink, accent: p.roles.accent } })) })),   // swatch: cut 7, WEB-6
    finish: offeredFinish(v.tier),
    to_fix: { packages_below_starting_price: siteCard.packagesBelowStart(pkgs, v.rate_display, v.rate_min) },
  } });
}));

// ── POST /publish · POST /discard (cut 5) ─────────────────────────────────────────────────────────────────────────
router.post('/publish', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  // cut 16 (ruling 2): read the published style first, so the clock can refuse (Basic) and be started (every plan)
  const [live, draft] = await Promise.all([siteRowOf(sb, v.id), draftOf(sb, v.id)]);
  const draftStyle = draft && draft.settings && draft.settings.style !== undefined ? draft.settings.style : (live && live.style) || null;
  const clockLine = styleClockRefusal(v.tier, live, draftStyle);
  if (clockLine) return errRes(res, 400, clockLine);
  const { data, error } = await sb.rpc('site_publish_draft', { p_vendor: v.id });
  if (error) return errRes(res, 503, LINES.saveFailed);
  if (!data) return errRes(res, 400, LINES.nothingToPublish);
  // the clock starts when a PUBLISHED style changes (her first published style is free)
  if (live && live.published_at && live.style && draftStyle && draftStyle !== live.style) {
    try { await sb.from('vendor_sites').update({ style_changed_at: data }).eq('vendor_id', v.id); } catch (_e) { /* the publish stands; the clock is best effort */ }
  }
  return okRes(res, { published_at: data, is_live: true });
}));

/** cut 16 (ruling 2): the refusal line when a Basic vendor would change her published style inside 30 days, else null.
 * Her first published style is free (no published row, or no published style); drafts are free until she publishes. */
function styleClockRefusal(tier, live, wantStyle) {
  if (rank(tier) >= 1 || !live || !live.published_at || !live.style || !wantStyle || wantStyle === live.style) return null;
  const c = siteModel.styleClock(tier, live, Date.now());
  return c.locked ? LINES.styleClock(c.next_change_words) : null;
}
router.post('/discard', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const { error } = await sb.from('vendor_site_drafts').delete().eq('vendor_id', v.id);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { discarded: true });
}));

// ── PATCH /settings ───────────────────────────────────────────────────────────────────────────────────────────────
function checkSettings(tier, current, body) {
  const b = obj(body); const patch = {}; const r = rank(tier);
  if ('styles_picked' in b || 'style' in b) {
    // cut 16: on Basic her one style IS her pick; choosing a style replaces it (a second is refused only when she asks for two)
    const picks = 'styles_picked' in b ? arr(b.styles_picked).filter((s) => REG.STYLE_IDS.includes(s)) : (r < 1 && 'style' in b ? [] : arr(current.styles_picked));
    const n = siteModel.STYLE_ALLOWANCE[siteModel.tierOf(tier)];
    if (new Set(picks).size !== picks.length || ('styles_picked' in b && picks.length !== arr(b.styles_picked).length)) return { error: LINES.styleClosed };
    const style = 'style' in b ? b.style : current.style;
    const withStyle = style && !picks.includes(style) ? [...picks, style] : picks;
    if (n < 6 && withStyle.length > n) return { error: r < 1 ? LINES.basicOneStyle : LINES.tooManyStyles(n) };
    if (style !== undefined && style !== null && !REG.STYLE_IDS.includes(style)) return { error: LINES.styleClosed };
    patch.styles_picked = withStyle; if ('style' in b) patch.style = style;
  }
  const style = patch.style || current.style || (siteModel.stylesOpen(tier, current)[0]);
  if ('palette_id' in b) { if (b.palette_id !== null && !REG.palettesOf(style).some((p) => p.id === b.palette_id)) return { error: LINES.paletteClosed };
    // cut 16 (ruling b): on Basic the palette is her style's default; choosing another is Essential's
    if (r < 1 && b.palette_id !== null && b.palette_id !== (REG.palettesOf(style)[0] || {}).id) return { error: LINES.basicPalette };
    patch.palette_id = b.palette_id; }
  if ('palette_custom' in b) {
    const c = obj(b.palette_custom); const out = {};
    if (r < 1 && Object.keys(c).some((k) => c[k] !== undefined && c[k] !== null)) return { error: LINES.basicPalette };   // cut 16
    if (c.accent !== undefined && c.accent !== null) { if (r < 2) return { error: LINES.ownColour }; if (!/^#[0-9a-f]{6}$/i.test(String(c.accent))) return { error: LINES.ownColour }; out.accent = String(c.accent).toLowerCase(); }
    if (c.base !== undefined && c.base !== null) { if (!REG.palettesOf(style).some((p) => p.id === c.base)) return { error: LINES.paletteClosed }; out.base = c.base; }
    if (c.gradient !== undefined && c.gradient !== null) { if (r < 3) return { error: LINES.gradient }; const g = arr(c.gradient); if (g.length < 2 || g.length > 3 || !g.every((x) => /^#[0-9a-f]{6}$/i.test(String(x)))) return { error: LINES.gradient }; out.gradient = g.map((x) => String(x).toLowerCase()); }
    patch.palette_custom = out;
  }
  if ('font_pair' in b) { if (b.font_pair !== null && !(REG.STYLES[style] || { pairs: [] }).pairs.includes(b.font_pair)) return { error: LINES.fontClosed };
    // cut 16 (ruling b): on Basic the pairing is her style's default; choosing another is Essential's
    if (r < 1 && b.font_pair !== null && b.font_pair !== ((REG.STYLES[style] || { pairs: [] }).pairs[0] || null)) return { error: LINES.basicFont };
    patch.font_pair = b.font_pair; }
  if ('motion' in b) { if (!siteModel.MOTIONS.includes(b.motion)) return { error: LINES.finishClosed }; patch.motion = b.motion; }
  if ('corners' in b) { if (!REG.finishIds(style, 'corners').includes(b.corners)) return { error: LINES.finishClosed }; patch.corners = b.corners; }
  if ('button_style' in b) { if (!REG.finishIds(style, 'buttons').includes(b.button_style)) return { error: LINES.finishClosed }; patch.button_style = b.button_style; }
  if ('texture' in b) {
    const t = REG.finishIds(style, 'textures');
    if (!t.includes(b.texture)) return { error: LINES.finishClosed };
    if (r < 3 && b.texture !== t[0] && b.texture !== 'clean') return { error: LINES.textureClosed };
    patch.texture = b.texture;
  }
  if ('cover_mode' in b) { if (!siteModel.COVER_MODES.includes(b.cover_mode)) return { error: LINES.finishClosed }; patch.cover_mode = b.cover_mode; }
  if ('monogram' in b) { const m = limits.field('monogram', b.monogram); if (!m.ok) return { error: m.error }; patch.monogram = m.value; }
  if ('site_name' in b) { const m = limits.field('site_name', b.site_name); if (!m.ok) return { error: m.error }; patch.site_name = m.value; }
  if ('credit_shown' in b) { if (b.credit_shown === false && r < 3) return { error: LINES.creditRemoval }; patch.credit_shown = b.credit_shown !== false; }
  if ('cover' in b) {
    const slides = arr(b.cover); if (slides.length > limits.COUNTS.cover_slides) return { error: limits.LINES.tooMany('slides', limits.COUNTS.cover_slides) };
    const out = [];
    for (const c of slides.map(obj)) {
      for (const [k, key] of [['eyebrow', 'cover_eyebrow'], ['headline', 'cover_headline'], ['emphasis', 'cover_headline'], ['button', 'cover_button']]) { const f = limits.field(key, c[k]); if (!f.ok) return { error: f.error }; }
      const p = obj(c.photo);
      out.push({ photo: { url: String(p.url || ''), w: p.w || null, h: p.h || null, focal_portrait: limits.focal(p.focal_portrait), focal_landscape: limits.focal(p.focal_landscape), alt: limits.field('photo_alt', p.alt).value || null },
        eyebrow: limits.field('cover_eyebrow', c.eyebrow).value, headline: limits.field('cover_headline', c.headline).value, emphasis: limits.field('cover_headline', c.emphasis).value,
        button: limits.field('cover_button', c.button).value, target: obj(c.target).kind ? { kind: String(c.target.kind), ref: String(c.target.ref || '') } : null });
    }
    patch.cover = out;   // the card shows a slide only when its picture is one of her approved photographs
  }
  if ('copy' in b) {
    const c = obj(b.copy); const out = {};
    for (const [k, key] of [['intro', 'intro'], ['studio_heading', 'studio_heading'], ['studio_body', 'studio_body'], ['pricing_note', 'pricing_note'], ['enquire_line', 'enquire_line'], ['cities', 'cities']]) { if (k in c) { const f = limits.field(key, c[k]); if (!f.ok) return { error: f.error }; out[k] = f.value; } }
    for (const [k, key] of [['announcements', 'announcement'], ['categories', 'category'], ['destinations', 'destination'], ['rolling_words', 'rolling_word']]) { if (k in c) { const f = limits.list(key, c[k]); if (!f.ok) return { error: f.error }; out[k] = f.value; } }
    if ('trade_override' in c) { const t = obj(c.trade_override); const o = {}; for (const [k, key] of [['items', 'trade_items'], ['item', 'trade_item'], ['request', 'trade_request']]) { if (k in t) { const f = limits.field(key, t[k]); if (!f.ok) return { error: f.error }; o[k] = f.value; } } out.trade_override = o; }
    if ('studio_photo' in c) { const p = obj(c.studio_photo); out.studio_photo = p.url ? { url: String(p.url), focal_portrait: limits.focal(p.focal_portrait), focal_landscape: limits.focal(p.focal_landscape), alt: limits.field('photo_alt', p.alt).value || null } : null; }
    patch.copy = Object.assign({}, obj(current.copy), out);
  }
  return { patch };
}
router.patch('/settings', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  const [live, draft] = await Promise.all([siteRowOf(sb, v.id), draftOf(sb, v.id)]);
  const current = previewLib.overlay(live || {}, [], [], draft).site;
  const r = checkSettings(v.tier, current, req.body);
  if (r.error) return errRes(res, 400, r.error);
  // cut 16 (ruling 2): on Basic, a style other than her PUBLISHED one is refused inside 30 days of her last change
  const clockLine = styleClockRefusal(v.tier, live, r.patch.style !== undefined ? r.patch.style : current.style);
  if (clockLine) return errRes(res, 400, clockLine);
  // cut 5: into her draft, not the live row
  if (!(await saveDraft(sb, v.id, { settings: Object.assign({}, (draft && draft.settings) || {}, r.patch) }))) return errRes(res, 503, LINES.saveFailed);
  const warning = limits.priceWarning([obj(r.patch.copy).intro, obj(r.patch.copy).studio_body, obj(r.patch.copy).pricing_note], v.rate_display);
  return okRes(res, { saved: Object.keys(r.patch), warning });
}));

// ── PUT /sections · PUT /pages ────────────────────────────────────────────────────────────────────────────────────
router.put('/sections', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor; const list = arr(obj(req.body).sections);
  const out = [];
  for (const [i, s] of list.map(obj).entries()) {
    const key = String(s.key || '');
    const def = siteModel.SECTION_DEFAULTS.find((d) => d.key === key);
    const custom = siteModel.CUSTOM_KEY.test(key);
    if (!def && !custom) return errRes(res, 400, LINES.sectionClosed);
    if (custom && rank(v.tier) < 2) return errRes(res, 403, LINES.sectionClosed);
    const eb = limits.field('section_eyebrow', s.eyebrow); const hd = limits.field('section_heading', s.heading);
    if (!eb.ok) return errRes(res, 400, eb.error); if (!hd.ok) return errRes(res, 400, hd.error);
    const body = obj(s.body); const cleanBody = {};
    for (const [k, key2] of [['lines', 'band_line'], ['words', 'rolling_word'], ['destinations', 'destination']]) { if (k in body) { const f = limits.list(key2, body[k]); if (!f.ok) return errRes(res, 400, f.error); cleanBody[k] = f.value; } }
    if ('photos' in body) cleanBody.photos = arr(body.photos).map(obj).slice(0, limits.COUNTS.band_photos).map((p) => ({ url: String(p.url || ''), focal_portrait: limits.focal(p.focal_portrait), focal_landscape: limits.focal(p.focal_landscape) }));
    if ('text' in body) { const f = limits.field('studio_body', body.text); if (!f.ok) return errRes(res, 400, f.error); cleanBody.text = f.value; }
    if ('button' in body) { const f = limits.field('cover_button', body.button); if (!f.ok) return errRes(res, 400, f.error); cleanBody.button = f.value; }   // cut 5: the band's button
    out.push({ vendor_id: v.id, key, variant: /^[a-z0-9-]{1,24}$/.test(String(s.variant || '')) ? s.variant : 'default', shown: s.shown !== false,
      position: Number.isFinite(s.position) ? Math.round(s.position) : i * 10, eyebrow: eb.value, heading: hd.value, body: cleanBody, updated_at: now() });
  }
  // cut 5: into her draft, one entry per key on her home (merged over what the draft already holds); publish writes them
  const draft = await draftOf(sb, v.id);
  const byKey = new Map(((draft && Array.isArray(draft.sections)) ? draft.sections : []).map((x) => [x.key, x]));
  for (const row of out) byKey.set(row.key, { key: row.key, variant: row.variant, shown: row.shown, position: row.position, eyebrow: row.eyebrow, heading: row.heading, body: row.body });
  if (!(await saveDraft(sb, v.id, { sections: [...byKey.values()] }))) return errRes(res, 503, LINES.saveFailed);
  return okRes(res, { saved: out.length });
}));

router.put('/pages', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  if (rank(req.vendor.tier) < 3) return errRes(res, 403, LINES.pagesClosed);
  const sb = req.app.locals.supabase; const v = req.vendor; const list = arr(obj(req.body).pages).map(obj);
  const clean = [];
  for (const [i, p] of list.entries()) {
    const t = limits.field('page_title', p.title); if (!t.ok) return errRes(res, 400, t.error);
    const slug = limits.SLUG.test(String(p.slug || '')) ? p.slug : limits.slugFrom(t.value, clean.map((c) => c.slug));
    clean.push({ vendor_id: v.id, slug, title: t.value, position: i, shown: p.shown !== false, updated_at: now() });
  }
  // cut 5: into her draft; publish replaces her pages in one transaction
  if (!(await saveDraft(sb, v.id, { pages: clean.map((c) => ({ slug: c.slug, title: c.title, shown: c.shown })) }))) return errRes(res, 503, LINES.saveFailed);
  return okRes(res, { pages: clean.map((c) => ({ slug: c.slug, title: c.title })) });
}));

// ── LOOKS ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const LOOK_COLS = 'id, slug, title, status, published_at, category, year_label, description, included, from_price_text, from_price_rupees, package_id, credits, videos, related_ids, new_mark, seo_title, seo_description, share_photo_id, source, position, deleted_at';
const PHOTO_COLS = 'id, look_id, image_url, width, height, focal_portrait_x, focal_portrait_y, focal_landscape_x, focal_landscape_y, caption, alt, position, safety_state, deleted_at';

/** What she reads per photo and per look. CE-47 WEB-4 cut 30 (R-47.2): a photo is 'shown' on her site at once, or
 *  'held' by the safety check (pictureRules.js); there is no approval and no rejection reason any more. */
const PR = require('../../../lib/vendor/pictureRules');
const safetyCheck = require('../../../lib/vendor/safetyCheck');
function reviewOf(p) { return PR.onHerPages(p) ? 'shown' : 'held'; }
function publicStateOf(look, photos) {
  if (look.status !== 'published') return 'draft';
  return photos.some((p) => PR.onHerPages(p) && !p.deleted_at) ? 'live' : 'waiting_for_photos';
}
async function lookOf(sb, vid, id) {
  if (!UUID.test(String(id))) return null;
  return one(sb.from('vendor_looks').select(LOOK_COLS).eq('id', id).eq('vendor_id', vid).is('deleted_at', null).maybeSingle());
}

function checkLook(body, isNew) {
  const b = obj(body); const p = {};
  if (isNew || 'title' in b) { const f = limits.field('look_title', b.title); if (!f.ok) return { error: f.error }; p.title = f.value; }
  for (const [k, key] of [['category', 'category'], ['year_label', 'look_year'], ['description', 'look_description'], ['seo_title', 'seo_title'], ['seo_description', 'seo_description']]) {
    if (k in b) { const f = limits.field(key, b[k]); if (!f.ok) return { error: f.error }; p[k] = f.value; }
  }
  if ('included' in b) { const f = limits.list('look_included', b.included); if (!f.ok) return { error: f.error }; p.included = f.value; }
  if ('from_price' in b) { const f = limits.fromPrice(b.from_price); if (!f.ok) return { error: f.error }; p.from_price_text = f.text; p.from_price_rupees = f.rupees; }
  if ('package_id' in b) { if (b.package_id !== null && !UUID.test(String(b.package_id))) return { error: LINES.notYours }; p.package_id = b.package_id; }
  if ('credits' in b) {
    const cs = arr(b.credits); if (cs.length > limits.COUNTS.credits_per_look) return { error: limits.LINES.tooMany('credits', limits.COUNTS.credits_per_look) };
    const out = [];
    for (const c of cs.map(obj)) {
      const role = limits.field('credit_role', c.role); if (!role.ok || !role.value) return { error: role.error || limits.LINES.empty('Credit') };
      const text = limits.field('credit_text', c.text); if (!text.ok) return { error: text.error };
      if (!text.value && !(c.vendor_id && UUID.test(String(c.vendor_id)))) return { error: limits.LINES.empty('Name') };
      out.push({ role: role.value, vendor_id: c.vendor_id && UUID.test(String(c.vendor_id)) ? c.vendor_id : null, text: text.value });
    }
    p.credits = out;
  }
  if ('videos' in b) {
    const vs = arr(b.videos); if (vs.length > limits.COUNTS.videos_per_look) return { error: limits.LINES.tooMany('videos', limits.COUNTS.videos_per_look) };
    const out = [];
    for (const x of vs.map(obj)) {
      const url = String(x.url || '');
      if (!siteCard.videoKind(url)) return { error: LINES.videoLink };
      const t = limits.field('video_title', x.title); if (!t.ok) return { error: t.error };
      const d = Number(x.duration_s); out.push({ url, title: t.value, duration_s: Number.isFinite(d) && d > 0 && d <= 36000 ? Math.round(d) : null });
    }
    p.videos = out;
  }
  if ('related_ids' in b) { const r = arr(b.related_ids).filter((x) => UUID.test(String(x))); if (r.length > limits.COUNTS.related_per_look) return { error: limits.LINES.tooMany('looks', limits.COUNTS.related_per_look) }; p.related_ids = r; }
  if ('new_mark' in b) p.new_mark = b.new_mark !== false;
  if ('position' in b && Number.isFinite(b.position)) p.position = Math.round(b.position);
  return { patch: p };
}

router.get('/looks', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const looks = await rows(sb.from('vendor_looks').select(LOOK_COLS).eq('vendor_id', v.id).is('deleted_at', null).order('position', { ascending: true }));
  const ids = looks.map((l) => l.id);
  const photos = ids.length ? await rows(sb.from('vendor_look_photos').select(PHOTO_COLS).in('look_id', ids).eq('vendor_id', v.id).is('deleted_at', null).order('position', { ascending: true })) : [];
  return okRes(res, { looks: looks.map((l) => {
    const ph = photos.filter((p) => p.look_id === l.id);
    return { id: l.id, slug: l.slug, title: l.title, status: l.status, public_state: publicStateOf(l, ph), category: l.category, year_label: l.year_label,
      description: l.description, included: l.included, from_price: l.from_price_text, package_id: l.package_id, credits: l.credits, videos: l.videos,
      related_ids: l.related_ids, new_mark: l.new_mark, seo_title: l.seo_title, seo_description: l.seo_description, position: l.position,
      photos: ph.map((p) => ({ id: p.id, url: p.image_url, review: reviewOf(p), notice: PR.vendorNotice(p), caption: p.caption, alt: p.alt, position: p.position,
        focal_portrait: { x: Number(p.focal_portrait_x), y: Number(p.focal_portrait_y) }, focal_landscape: { x: Number(p.focal_landscape_x), y: Number(p.focal_landscape_y) } })) };
  }) });
}));

router.post('/looks', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  const r = checkLook(req.body, true); if (r.error) return errRes(res, 400, r.error);
  const taken = (await rows(sb.from('vendor_looks').select('slug').eq('vendor_id', v.id).is('deleted_at', null))).map((x) => x.slug);
  const row = Object.assign({ vendor_id: v.id, slug: limits.slugFrom(r.patch.title, taken), status: 'draft', source: 'manual' }, r.patch);
  const created = await one(sb.from('vendor_looks').insert(row).select('id, slug').single());
  if (!created) return errRes(res, 503, LINES.saveFailed);
  return okRes(res, { look: created });
}));

router.patch('/looks/:id', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  const look = await lookOf(sb, v.id, req.params.id); if (!look) return errRes(res, 404, LINES.notYours);
  const r = checkLook(req.body, false); if (r.error) return errRes(res, 400, r.error);
  const { error } = await sb.from('vendor_looks').update(Object.assign({ updated_at: now() }, r.patch)).eq('id', look.id).eq('vendor_id', v.id);
  if (error) return errRes(res, 503, LINES.saveFailed);
  const warning = limits.priceWarning([r.patch.description], v.rate_display);
  return okRes(res, { saved: Object.keys(r.patch), warning });
}));

router.delete('/looks/:id', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const look = await lookOf(sb, v.id, req.params.id); if (!look) return errRes(res, 404, LINES.notYours);
  const { error } = await sb.from('vendor_looks').update({ deleted_at: now(), status: 'draft' }).eq('id', look.id).eq('vendor_id', v.id);
  if (error) return errRes(res, 503, LINES.saveFailed);
  return okRes(res, { deleted: true });
}));

router.post('/looks/:id/:act(publish|unpublish)', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  const look = await lookOf(sb, v.id, req.params.id); if (!look) return errRes(res, 404, LINES.notYours);
  if (req.params.act === 'unpublish') {
    const { error } = await sb.from('vendor_looks').update({ status: 'draft', updated_at: now() }).eq('id', look.id).eq('vendor_id', v.id);
    return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { public_state: 'draft' });
  }
  const photos = await rows(sb.from('vendor_look_photos').select('id, safety_state, deleted_at').eq('look_id', look.id).eq('vendor_id', v.id).is('deleted_at', null));
  if (!photos.length) return errRes(res, 400, LINES.needPhoto);
  const live = await rows(sb.from('vendor_looks').select('id').eq('vendor_id', v.id).eq('status', 'published').is('deleted_at', null));
  if (live.filter((x) => x.id !== look.id).length >= limits.COUNTS.published_looks) return errRes(res, 400, LINES.publishedCap);
  // published_at is the FIRST publish: it dates the New mark (Q14) and survives an unpublish and republish.
  const patch = { status: 'published', updated_at: now() }; if (!look.published_at) patch.published_at = now();
  const { error } = await sb.from('vendor_looks').update(patch).eq('id', look.id).eq('vendor_id', v.id);
  if (error) return errRes(res, 503, LINES.saveFailed);
  return okRes(res, { public_state: publicStateOf({ status: 'published' }, photos) });
}));

// ── LOOK PHOTOS ───────────────────────────────────────────────────────────────────────────────────────────────────
router.post('/looks/:id/photos/sign', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  const look = await lookOf(sb, v.id, req.params.id); if (!look) return errRes(res, 404, LINES.notYours);
  const folder = `vendor_looks/${v.id}`;
  const publicId = `${look.id}-${crypto.randomBytes(4).toString('hex')}`;
  return okRes(res, { upload_url: uploadUrl(), params: signUpload({ folder, publicId, timestamp: nowTimestamp() }) });
}));

/**
 * Add a photo. Either { portfolio_id }: one of HER portfolio rows, matched by id AND vendor, whose address becomes the
 * photo's and whose safety state it carries; or { image_url } equal, byte for byte, to one of her portfolio rows'
 * stored address, which carries that row's state (the chair's ruling on gap 6: the same stored picture, by id or exact
 * url, never by resemblance). Any other { image_url } is a fresh upload into her own look folder, checked by Google's
 * safety check before the answer (R-47.2).
 */
router.post('/looks/:id/photos', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor; const b = obj(req.body);
  const look = await lookOf(sb, v.id, req.params.id); if (!look) return errRes(res, 404, LINES.notYours);
  const have = await rows(sb.from('vendor_look_photos').select('id').eq('look_id', look.id).eq('vendor_id', v.id).is('deleted_at', null));
  if (have.length >= limits.COUNTS.photos_per_look) return errRes(res, 400, LINES.photoCap);
  // cut 17: a look photo carries its portfolio photo's source. cut 30 (R-47.2): and its safety state; a fresh upload is
  // checked here, before the answer.
  let image_url = null; let safety = null; let source = 'upload';
  if (b.portfolio_id !== undefined) {
    if (!UUID.test(String(b.portfolio_id))) return errRes(res, 404, LINES.notYours);
    const pf = await one(sb.from('vendor_portfolio').select('id, image_url, safety_state, safety_scores, safety_checked_at, source').eq('id', b.portfolio_id).eq('vendor_id', v.id).maybeSingle());
    if (!pf || !/^https:\/\//.test(String(pf.image_url || ''))) return errRes(res, 404, LINES.notYours);
    image_url = pf.image_url; safety = { safety_state: pf.safety_state, safety_scores: pf.safety_scores || null, safety_checked_at: pf.safety_checked_at || null }; source = pf.source === 'instagram' ? 'instagram' : 'upload';
  } else {
    const url = String(b.image_url || '');
    // The ruling's second match: the EXACT stored address of one of her own portfolio photos carries its state.
    const same = /^https:\/\//.test(url) ? await one(sb.from('vendor_portfolio').select('id, image_url, safety_state, safety_scores, safety_checked_at, source').eq('vendor_id', v.id).eq('image_url', url).maybeSingle()) : null;
    if (same) { image_url = same.image_url; safety = { safety_state: same.safety_state, safety_scores: same.safety_scores || null, safety_checked_at: same.safety_checked_at || null }; source = same.source === 'instagram' ? 'instagram' : 'upload'; }
    else {
      // a fresh upload: only into her own look folder; Google's safety check runs on it before the answer
      if (!CLOUD.test(url) || !url.includes(`/vendor_looks/${v.id}/`)) return errRes(res, 400, LINES.photoAddress);
      image_url = url;
      safety = safetyCheck.fieldsOf((await safetyCheck.check([url], req.app.locals.safetyDeps))[0]) || { safety_state: PR.SAFETY.UNCHECKED };
    }
  }
  const fp = limits.focal(b.focal_portrait); const fl = limits.focal(b.focal_landscape);
  const cap = limits.field('photo_caption', b.caption); const alt = limits.field('photo_alt', b.alt);
  if (!cap.ok) return errRes(res, 400, cap.error); if (!alt.ok) return errRes(res, 400, alt.error);
  const w = Number(b.width); const h = Number(b.height);
  const created = await one(sb.from('vendor_look_photos').insert({ look_id: look.id, vendor_id: v.id, image_url,
    width: Number.isInteger(w) && w > 0 ? w : null, height: Number.isInteger(h) && h > 0 ? h : null,
    focal_portrait_x: fp.x, focal_portrait_y: fp.y, focal_landscape_x: fl.x, focal_landscape_y: fl.y,
    caption: cap.value, alt: alt.value, position: have.length, ...safety, source }).select('id, safety_state').single());
  if (!created) return errRes(res, 503, LINES.saveFailed);
  return okRes(res, { photo: { id: created.id, review: reviewOf(created), notice: PR.vendorNotice(created) } });
}));

router.patch('/looks/:id/photos/:pid', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor; const b = obj(req.body);
  const look = await lookOf(sb, v.id, req.params.id); if (!look || !UUID.test(String(req.params.pid))) return errRes(res, 404, LINES.notYours);
  const p = {};
  if ('focal_portrait' in b) { const f = limits.focal(b.focal_portrait); p.focal_portrait_x = f.x; p.focal_portrait_y = f.y; }
  if ('focal_landscape' in b) { const f = limits.focal(b.focal_landscape); p.focal_landscape_x = f.x; p.focal_landscape_y = f.y; }
  if ('caption' in b) { const f = limits.field('photo_caption', b.caption); if (!f.ok) return errRes(res, 400, f.error); p.caption = f.value; }
  if ('alt' in b) { const f = limits.field('photo_alt', b.alt); if (!f.ok) return errRes(res, 400, f.error); p.alt = f.value; }
  if ('position' in b && Number.isFinite(b.position)) p.position = Math.round(b.position);
  p.updated_at = now();   // a photo's state is never written here: only the safety check and the admin's release move it
  const { error } = await sb.from('vendor_look_photos').update(p).eq('id', req.params.pid).eq('look_id', look.id).eq('vendor_id', v.id);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { saved: Object.keys(p) });
}));

router.delete('/looks/:id/photos/:pid', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const look = await lookOf(sb, v.id, req.params.id); if (!look || !UUID.test(String(req.params.pid))) return errRes(res, 404, LINES.notYours);
  const { error } = await sb.from('vendor_look_photos').update({ deleted_at: now() }).eq('id', req.params.pid).eq('look_id', look.id).eq('vendor_id', v.id);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { deleted: true });
}));

// ── COLLECTIONS (Signature and up) ────────────────────────────────────────────────────────────────────────────────
function collectionsOpen(req, res) { if (rank(req.vendor.tier) < 2) { errRes(res, 403, LINES.collectionsClosed); return false; } return true; }
router.post('/collections', ...auth, asyncHandler(async (req, res) => {
  if (!collectionsOpen(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor; const b = obj(req.body);
  const n = limits.field('collection_name', b.name); if (!n.ok) return errRes(res, 400, n.error);
  const d = limits.field('collection_text', b.description); if (!d.ok) return errRes(res, 400, d.error);
  const taken = (await rows(sb.from('vendor_collections').select('slug').eq('vendor_id', v.id).is('deleted_at', null))).map((x) => x.slug);
  const created = await one(sb.from('vendor_collections').insert({ vendor_id: v.id, name: n.value, slug: limits.slugFrom(n.value, taken), description: d.value }).select('id, slug').single());
  return created ? okRes(res, { collection: created }) : errRes(res, 503, LINES.saveFailed);
}));
router.patch('/collections/:id', ...auth, asyncHandler(async (req, res) => {
  if (!collectionsOpen(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor; const b = obj(req.body); const p = { updated_at: now() };
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, LINES.notYours);
  if ('name' in b) { const f = limits.field('collection_name', b.name); if (!f.ok) return errRes(res, 400, f.error); p.name = f.value; }
  if ('description' in b) { const f = limits.field('collection_text', b.description); if (!f.ok) return errRes(res, 400, f.error); p.description = f.value; }
  if ('cover_photo_id' in b) {
    if (b.cover_photo_id !== null && !(await one(sb.from('vendor_look_photos').select('id').eq('id', b.cover_photo_id).eq('vendor_id', v.id).maybeSingle()))) return errRes(res, 404, LINES.notYours);
    p.cover_photo_id = b.cover_photo_id;
  }
  if ('position' in b && Number.isFinite(b.position)) p.position = Math.round(b.position);
  const { error } = await sb.from('vendor_collections').update(p).eq('id', req.params.id).eq('vendor_id', v.id).is('deleted_at', null);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { saved: Object.keys(p) });
}));
router.delete('/collections/:id', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, LINES.notYours);
  const { error } = await sb.from('vendor_collections').update({ deleted_at: now() }).eq('id', req.params.id).eq('vendor_id', v.id);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { deleted: true });
}));
router.put('/collections/:id/looks', ...auth, asyncHandler(async (req, res) => {
  if (!collectionsOpen(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor;
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, LINES.notYours);
  const col = await one(sb.from('vendor_collections').select('id').eq('id', req.params.id).eq('vendor_id', v.id).is('deleted_at', null).maybeSingle());
  if (!col) return errRes(res, 404, LINES.notYours);
  const ids = arr(obj(req.body).look_ids).filter((x) => UUID.test(String(x)));
  const mine = new Set((ids.length ? await rows(sb.from('vendor_looks').select('id').in('id', ids).eq('vendor_id', v.id).is('deleted_at', null)) : []).map((x) => x.id));
  if (ids.some((x) => !mine.has(x))) return errRes(res, 404, LINES.notYours);
  const { error: dErr } = await sb.from('vendor_collection_looks').delete().eq('collection_id', col.id);
  if (dErr) return errRes(res, 503, LINES.saveFailed);
  if (ids.length) { const { error } = await sb.from('vendor_collection_looks').insert(ids.map((look_id, position) => ({ collection_id: col.id, look_id, position }))); if (error) return errRes(res, 503, LINES.saveFailed); }
  return okRes(res, { looks: ids.length });
}));

// ── cut 7 (WEB-6) · GET /collections, and the credit handle lookup ─────────────────────────────────────────────────
router.get('/collections', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const cols = await rows(sb.from('vendor_collections').select('id, slug, name, description, cover_photo_id, position, deleted_at').eq('vendor_id', v.id).is('deleted_at', null).order('position', { ascending: true }));
  const ids = cols.map((c) => c.id);
  const members = ids.length ? await rows(sb.from('vendor_collection_looks').select('collection_id, look_id, position').in('collection_id', ids)) : [];
  return okRes(res, { collections_open: rank(v.tier) >= 2, collections: cols.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description,
    cover_photo_id: c.cover_photo_id, position: c.position,
    look_ids: members.filter((m) => m.collection_id === c.id).sort((a, b) => (a.position || 0) - (b.position || 0)).map((m) => m.look_id) })) });
}));

/**
 * GET /credit-lookup?handle=<TDW handle> → { vendor: { id, business_name, handle } } for an ACTIVE, unpaused vendor, else
 * 404 "That was not found." Her look's credits name another vendor by this id (the card shows the name and link only
 * while that vendor stays active). Nothing else of the other vendor is returned. Rate-limited per vendor in memory.
 */
const lookupLimiter = require('../../../lib/site/limiter').makeLimiter({ cap: 5000 });
router.get('/credit-lookup', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  if (!lookupLimiter.hit('v:' + v.id, 120, 3600000)) return errRes(res, 429, 'You have tried too many times. Please try again in an hour.');
  const h = String(req.query.handle || '').trim().replace(/^@/, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(h)) return errRes(res, 404, LINES.notYours);
  const o = await one(sb.from('vendors').select('id, business_name, routing_handle, status, discover_paused').eq('routing_handle', h.toUpperCase()).maybeSingle());
  if (!o || o.status !== 'active' || o.discover_paused === true) return errRes(res, 404, LINES.notYours);
  return okRes(res, { vendor: { id: o.id, business_name: o.business_name, handle: String(o.routing_handle).toLowerCase() } });
}));

// ── PUT /faq ──────────────────────────────────────────────────────────────────────────────────────────────────────
router.put('/faq', ...auth, asyncHandler(async (req, res) => {
  if (!gate(req, res)) return;
  const sb = req.app.locals.supabase; const v = req.vendor; const list = arr(obj(req.body).faq).map(obj);
  if (list.length > limits.COUNTS.faq) return errRes(res, 400, limits.LINES.tooMany('questions', limits.COUNTS.faq));
  const clean = [];
  for (const [i, q] of list.entries()) {
    const a = limits.field('faq_question', q.question); if (!a.ok) return errRes(res, 400, a.error);
    const b = limits.field('faq_answer', q.answer); if (!b.ok) return errRes(res, 400, b.error);
    clean.push({ vendor_id: v.id, question: a.value, answer: b.value, position: i });
  }
  const { error: dErr } = await sb.from('vendor_site_faq').update({ deleted_at: now() }).eq('vendor_id', v.id).is('deleted_at', null);
  if (dErr) return errRes(res, 503, LINES.saveFailed);
  if (clean.length) { const { error } = await sb.from('vendor_site_faq').insert(clean); if (error) return errRes(res, 503, LINES.saveFailed); }
  return okRes(res, { faq: clean.length, warning: limits.priceWarning(clean.map((c) => c.answer), v.rate_display) });
}));

// ── TESTIMONIALS (ruling 2: she approves or hides; she never edits a client's words) ────────────────────────────────
const TESTIMONIAL_PAGE = `${siteCard.SITE_BASE}/kind-words/`;   // the client's page on the pwa (its path is WEB-7's)
const E164 = /^\+[0-9]{8,15}$/;
const fromClient = (t) => Boolean(t.request_id || t.submitted_at);
/** The message she sends herself, as its own text with nothing else in it (R-46.17); wording to the founder's veto. */
const copyTextFor = (person, studio, link) => `Hi ${person}, would you write a few words about working with ${studio}? It takes a minute: ${link}`;

router.get('/testimonials', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  const [list, reqs] = await Promise.all([
    rows(sb.from('vendor_testimonials').select('id, author, body, occasion, event_month, place, video_url, video_title, state, request_id, submitted_at, approved_at, hidden_at, deleted_at').eq('vendor_id', v.id).is('deleted_at', null)),
    rows(sb.from('vendor_testimonial_requests').select('id, person_name, phone, sent_via, created_at, expires_at, used_at, revoked_at').eq('vendor_id', v.id).order('created_at', { ascending: false })),
  ]);
  return okRes(res, {
    testimonials: list.map((t) => ({ id: t.id, name: t.author, occasion: t.occasion, month: t.event_month ? String(t.event_month).slice(0, 7) : null, place: t.place,
      words: t.body, video_url: t.video_url, state: t.state, from_client: fromClient(t),
      // a row that is not the client's own (typed before 0187) is never shown, and is listed for her to delete
      to_delete: !fromClient(t) })),
    requests: reqs.map((r) => ({ id: r.id, person_name: r.person_name, phone_last4: r.phone ? String(r.phone).slice(-4) : null, sent_via: r.sent_via,
      created_at: r.created_at, expires_at: r.expires_at,
      state: r.used_at ? 'answered' : r.revoked_at ? 'cancelled' : Date.parse(r.expires_at) > Date.now() ? 'waiting' : 'expired' })),
  });
}));

router.post('/testimonials/requests', ...auth, asyncHandler(async (req, res) => {
  if (!gateAt(req, res, 1, LINES.reviewsClosed)) return;   // cut 16: still Essential's
  const sb = req.app.locals.supabase; const v = req.vendor; const b = obj(req.body);
  let person = null; let phone = null; let clientId = null;
  if (b.client_id !== undefined) {
    if (!UUID.test(String(b.client_id))) return errRes(res, 404, LINES.notYours);
    const c = await one(sb.from('clients').select('id, name, phone').eq('id', b.client_id).eq('vendor_id', v.id).is('deleted_at', null).maybeSingle());
    if (!c) return errRes(res, 404, LINES.notYours);
    clientId = c.id; person = c.name; phone = c.phone || null;
  } else {
    // a past client not in TDW, added by name and phone just for this request (the phone is nulled at use or expiry)
    const n = limits.field('client_name', b.person_name); if (!n.ok || !n.value) return errRes(res, 400, n.error || limits.LINES.empty('Name'));
    person = n.value;
    if (b.phone !== undefined && b.phone !== null && String(b.phone).trim() !== '') {
      const p = String(b.phone).replace(/[\s-]/g, ''); if (!E164.test(p)) return errRes(res, 400, LINES.phone); phone = p;
    }
  }
  const nameCheck = limits.field('client_name', person); if (!nameCheck.ok || !nameCheck.value) person = String(person || '').slice(0, 40) || 'there';
  if (phone && !E164.test(String(phone).replace(/[\s-]/g, ''))) phone = null;
  const token = crypto.randomBytes(24).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const wantsWhatsApp = b.send === 'whatsapp';
  const created = await one(sb.from('vendor_testimonial_requests').insert({ vendor_id: v.id, client_id: clientId, person_name: String(person).slice(0, 80),
    phone: phone ? String(phone).replace(/[\s-]/g, '') : null, token_hash: tokenHash, origin: 'vendor', sent_via: wantsWhatsApp ? null : 'copied',
    // Q12: 30 days, written here as well as by 0187's default, so the rule is read in one place in the code
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }).select('id, expires_at').single());
  if (!created) return errRes(res, 503, LINES.saveFailed);
  const link = TESTIMONIAL_PAGE + token;
  // The WhatsApp send answers "Coming soon" until Meta approves the template (R-46.14); the copy text always works.
  return okRes(res, { request: { id: created.id, expires_at: created.expires_at }, link, copy_text: copyTextFor(String(person).split(' ')[0], v.business_name || 'us', link),
    send: wantsWhatsApp ? 'coming_soon' : 'copied' });
}));

router.post('/testimonials/requests/:id/revoke', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, LINES.notYours);
  const { error } = await sb.from('vendor_testimonial_requests').update({ revoked_at: now(), phone: null }).eq('id', req.params.id).eq('vendor_id', v.id).is('used_at', null);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { state: 'cancelled' });
}));

router.post('/testimonials/:id/:act(approve|hide)', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, LINES.notYours);
  const t = await one(sb.from('vendor_testimonials').select('id, request_id, submitted_at').eq('id', req.params.id).eq('vendor_id', v.id).is('deleted_at', null).maybeSingle());
  if (!t) return errRes(res, 404, LINES.notYours);
  if (req.params.act === 'approve' && !fromClient(t)) return errRes(res, 400, 'Only words your client sent through their link can be shown.');
  const patch = req.params.act === 'approve' ? { state: 'approved', approved_at: now(), hidden_at: null } : { state: 'hidden', hidden_at: now() };
  const { error } = await sb.from('vendor_testimonials').update(Object.assign({ updated_at: now() }, patch)).eq('id', t.id).eq('vendor_id', v.id);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { state: patch.state });
}));

router.delete('/testimonials/:id', ...auth, asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase; const v = req.vendor;
  if (!UUID.test(String(req.params.id))) return errRes(res, 404, LINES.notYours);
  const { error } = await sb.from('vendor_testimonials').update({ deleted_at: now() }).eq('id', req.params.id).eq('vendor_id', v.id);
  return error ? errRes(res, 503, LINES.saveFailed) : okRes(res, { deleted: true });
}));

// ── VISITORS (cut 4, gap 7): GET /visitors?days=7|28 ──────────────────────────────────────────────────────────────
// Essential: visitors, views, daily, top_look. Signature adds by_source; Prestige adds saved_looks. What her plan does not
// open arrives as null (WEB-6 draws the plan's line, never a zero). Days are India's calendar days.
const SOURCES = ['google', 'instagram', 'facebook', 'whatsapp', 'direct', 'other'];
const istDay = (t) => new Date(t + 330 * 60000).toISOString().slice(0, 10);
router.get('/visitors', ...auth, asyncHandler(async (req, res) => {
  if (!gateAt(req, res, 1, LINES.visitorsClosed)) return;   // cut 16: still Essential's
  const sb = req.app.locals.supabase; const v = req.vendor; const r = rank(v.tier);
  const days = String(req.query.days) === '28' ? 28 : 7;
  const now0 = Date.now(); const to = istDay(now0); const from = istDay(now0 - (days - 1) * 86400000);
  const rowsV = await rows(sb.from('site_visits_daily').select('day, page, look_id, source, views, uniques').eq('vendor_id', v.id).gte('day', from).lte('day', to));
  const daily = []; for (let i = days - 1; i >= 0; i -= 1) daily.push({ day: istDay(now0 - i * 86400000), visitors: 0, views: 0 });
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const bySource = Object.fromEntries(SOURCES.map((s) => [s, 0])); const byLook = new Map();
  let visitors = 0; let views = 0;
  for (const x of rowsV) {
    const u = Number(x.uniques) || 0; const w = Number(x.views) || 0;
    visitors += u; views += w;
    const d = byDay.get(String(x.day).slice(0, 10)); if (d) { d.visitors += u; d.views += w; }
    if (SOURCES.includes(x.source)) bySource[x.source] += u;
    if (x.page === 'look' && x.look_id) byLook.set(x.look_id, (byLook.get(x.look_id) || 0) + w);
  }
  let top_look = null;
  if (byLook.size) {
    const [id, n] = [...byLook.entries()].sort((a, b) => b[1] - a[1])[0];
    const l = await one(sb.from('vendor_looks').select('slug, title').eq('id', id).eq('vendor_id', v.id).maybeSingle());
    if (l) top_look = { slug: l.slug, title: l.title, views: n };
  }
  let saved_looks = null;
  if (r >= 3) {
    const hearts = await rows(sb.from('look_hearts_daily').select('look_id, hearts').eq('vendor_id', v.id).gte('day', from).lte('day', to));
    const per = new Map(); for (const h of hearts) per.set(h.look_id, (per.get(h.look_id) || 0) + (Number(h.hearts) || 0));
    const ids = [...per.keys()];
    const looks = ids.length ? await rows(sb.from('vendor_looks').select('id, slug, title').in('id', ids).eq('vendor_id', v.id)) : [];
    saved_looks = looks.map((l) => ({ slug: l.slug, title: l.title, hearts: per.get(l.id) })).filter((x) => x.hearts > 0).sort((a, b) => b.hearts - a.hearts).slice(0, 10);
  }
  return okRes(res, { visitors: { days, from, to, visitors, views, daily, top_look, by_source: r >= 2 ? bySource : null, saved_looks } });
}));

module.exports = router;
module.exports.checkSettings = checkSettings;
module.exports.checkLook = checkLook;
module.exports.publicStateOf = publicStateOf;
module.exports.reviewOf = reviewOf;
module.exports.LINES = LINES;
module.exports.changesOf = changesOf;
module.exports.SETTING_LINES = SETTING_LINES;
module.exports.copyTextFor = copyTextFor;
module.exports.TESTIMONIAL_PAGE = TESTIMONIAL_PAGE;
