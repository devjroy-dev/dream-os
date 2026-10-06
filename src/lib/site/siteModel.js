// src/lib/site/siteModel.js — TDW · CE-46 · WEB-1 cut 4, WEB-4 cut 2 · WHAT HER SITE IS, FROM HER TIER AND HER CHOICES.
//
// TWO GENERATIONS IN ONE HOME. The WEB-1 functions below (lookFor, pagesFor, creditFor) still draw today's one-page
// site, which stays Basic's under the new tiers; the WEB-4 half (resolveSite and its helpers, at the end of the file)
// draws the six-style site for Essential and up. creditFor is shared and follows the new ruling (W4-b).
//
// One pure home for the site's rules, read by the public card (the pages couples see) and, from cut 5,
// by the Your website room. The TIER never leaves the server (b44: `tier` is WIRE_FORBIDDEN); what the
// public card carries is only what the page must draw: the look, the pages, the credit, her domain.
//
// R-46.9 as the founder ruled it, 28 September:
//   Basic      the site on her subdomain, ONE look chosen by her trade, the five pages, WhatsApp, the credit.
//   Essential  the same, with all three looks to choose from (looks_open).
//   Signature  adds Reviews and a gallery per wedding, the credit removable.
//   Prestige   adds Stories, FAQ, Book a consultation; the credit removed.
// The trade map (his "ok to the choices"): photography and content_creator → quiet; makeup, hairstylist,
// designer and jewellery → bloom; decor, venue_catering, planning and performer → atelier; other → quiet.
'use strict';

const LOOKS = Object.freeze(['quiet', 'bloom', 'atelier']);
const TRADE_LOOK = Object.freeze({
  photography: 'quiet', content_creator: 'quiet',
  makeup: 'bloom', hairstylist: 'bloom', designer: 'bloom', jewellery: 'bloom',
  decor: 'atelier', venue_catering: 'atelier', planning: 'atelier', performer: 'atelier',
  other: 'quiet',
});
const BASE_PAGES = Object.freeze(['home', 'portfolio', 'weddings', 'packages', 'about', 'contact']);
const SIGNATURE_PAGES = Object.freeze(['reviews']);
const PRESTIGE_PAGES = Object.freeze(['stories', 'faq', 'book']);

/** basic | essential | signature | prestige; anything else reads as basic (never more than she has). */
function tierOf(t) { return ['basic', 'essential', 'signature', 'prestige'].includes(t) ? t : 'basic'; }
function looksOpen(t) { return tierOf(t) !== 'basic'; }
function tradeLook(category) { return TRADE_LOOK[category] || 'quiet'; }

/** The look shown: her pick when her tier opens the choice and she has one; otherwise her trade's. */
function lookFor(tier, category, siteRow) {
  const picked = siteRow && LOOKS.includes(siteRow.look) ? siteRow.look : null;
  return looksOpen(tier) && picked ? picked : tradeLook(category);
}

/** Every page her tier allows, in the default order. */
function allowedPages(tier) {
  const t = tierOf(tier);
  return [...BASE_PAGES, ...(t === 'signature' || t === 'prestige' ? SIGNATURE_PAGES : []), ...(t === 'prestige' ? PRESTIGE_PAGES : [])];
}

/**
 * The pages couples see: her order and her hidden set when she has chosen, filtered to what her tier
 * allows (a downgrade HIDES pages above it, never deletes her choices), with Home and Contact always
 * present (Contact carries the WhatsApp button: no page without it, refusal g).
 */
function pagesFor(tier, siteRow) {
  const allowed = allowedPages(tier);
  const chosen = siteRow && Array.isArray(siteRow.pages) ? siteRow.pages : [];
  const ordered = [];
  for (const p of chosen) {
    const key = p && typeof p.key === 'string' ? p.key : null;
    if (!key || !allowed.includes(key) || ordered.some((o) => o.key === key)) continue;
    ordered.push({ key, shown: p.shown !== false });
  }
  for (const key of allowed) if (!ordered.some((o) => o.key === key)) ordered.push({ key, shown: true });
  return ordered.filter((o) => o.shown || o.key === 'home' || o.key === 'contact').map((o) => o.key);
}

/**
 * The credit "Made with The Dream Wedding". CE-46 WEB-4 cut 2 (W4-b; the WEB-4 brief §1 and design system §7, 30 September):
 * shown on Basic, Essential and Signature; removable on Prestige only, and shown there until she removes it. Her stored
 * choice is never cleared: a downgrade from Prestige shows the credit again, an upgrade honours her choice again.
 */
function creditFor(tier, siteRow) {
  if (tierOf(tier) !== 'prestige') return true;
  return !(siteRow && siteRow.credit_shown === false);
}

/** The site a demo or a vendor with nothing chosen gets: her trade's look, the Basic pages, the credit. */
function defaultSite(category) { return { look: tradeLook(category), pages: pagesFor('basic', null), credit: true, domain: null }; }


// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CE-46 · WEB-4 cut 2 · THE SIX-STYLE SITE (the WEB-4 brief §1, design system Day 1 §5 and §7, the chair's rulings
// Q6, Q7, Q10, Q11, Q13 and Q14 of 30 September 2026).
//
// resolveSite() is PURE: her tier, her trade, her name and her stored rows in; what her site may draw out. The tier is
// read here and NEVER returned (b44's WIRE_FORBIDDEN): the answer carries resolved choices and a capability map
// (`can`) that the vendor's room reads; the public card (cut 3) takes named fields from it, never the map whole.
// Nothing she stored is ever deleted or rewritten here: what her tier no longer allows RESOLVES as hidden or falls back
// (R-46.9), and the same stored rows resolve back to her choices after an upgrade.
// TOTAL: resolveSite answers for any input, hostile or absent, and never throws (b160 §5 fuzzes every argument).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
const REG = require('./styles');
const contrast = require('./contrast');
const limits = require('./limits');

const TIER_RANK = Object.freeze({ basic: 0, essential: 1, signature: 2, prestige: 3 });
const rank = (t) => TIER_RANK[tierOf(t)];
// How many of the six she may hold (design §7: Essential 2, Signature 4, Prestige all).
// CE-47 WEB-4 cut 16 (the founder): Basic holds ONE style, free (was 0).
const STYLE_ALLOWANCE = Object.freeze({ basic: 1, essential: 2, signature: 4, prestige: 6 });
// cut 16: the plan that opens a locked item, by name (the room shows "Available on <plan>").
const PLAN_NAME = Object.freeze({ basic: 'Basic', essential: 'Essential', signature: 'Signature', prestige: 'Prestige' });
const PLAN_AT = Object.freeze(['basic', 'essential', 'signature', 'prestige']);
// cut 16 (ruling 2): one style change every 30 days on Basic; the clock starts at Publish when the published style changes.
const STYLE_CHANGE_DAYS = 30;

// The sections (design §5) in their default order, and the tier that opens each (design §7; Q6: Collections and the
// Journal on Signature and Prestige). `fixed` sections hold their place below Prestige (Q11): the cover first, the
// footer (enquire) last; both are always shown there, because the footer carries her enquiry and the credit.
// cut 16 (ruling 1): Basic's set is cover, looks, band, pricing, studio, faq, enquire; reviews stays Essential (written
// testimonials are Essential's); collections and the journal stay Signature.
const SECTION_DEFAULTS = Object.freeze([
  { key: 'cover',       min: 'basic', fixed: 'first' },
  { key: 'looks',       min: 'basic' },
  { key: 'collections', min: 'signature' },
  { key: 'band',        min: 'basic' },
  { key: 'reviews',     min: 'essential' },
  { key: 'pricing',     min: 'basic' },
  { key: 'studio',      min: 'basic' },
  { key: 'journal',     min: 'signature' },
  { key: 'faq',         min: 'basic' },
  { key: 'enquire',     min: 'basic', fixed: 'last' },
]);
const SECTION_KEYS = Object.freeze(SECTION_DEFAULTS.map((d) => d.key));
const CUSTOM_KEY = /^custom-[a-z0-9-]{1,40}$/;
const VARIANT = /^[a-z0-9-]{1,24}$/;
const KEYWORD = /^[a-z_]{1,24}$/;
const MOTIONS = Object.freeze(['calm', 'lively', 'cinematic']);
const COVER_MODES = Object.freeze(['slideshow', 'still']);   // film is reserved (design §5: later); a stored 'film' reads as still
// Corners, buttons and textures: WEB-3's ids per style live in styles.js (FINISH); follow-up 1 resolves them here.
// PROPOSED ids stay closed until the chair lifts them after WEB-5's collision cell (LIFTED names the lifted ids per style).
const LIFTED = Object.freeze({});

/**
 * Her finish, per style (WEB-3's rules, 30 September 2026): an id is valid only in the styles that list it; a choice
 * not valid in her current style resolves to that style's default and stays stored for when she switches back.
 * Textures: on every tier she may switch the style's own decorative layer off ('clean'; design §2, "decoration is a
 * section"); any other texture is Prestige. Aurora's washes are the style, not a texture, and ship on every tier.
 */
function finishFor(tier, style, site) {
  const s = obj(site); const lifted = obj(typeof style === 'string' && Object.prototype.hasOwnProperty.call(LIFTED, style) ? LIFTED[style] : null);
  const valid = (kind) => [...REG.finishIds(style, kind), ...arr(lifted[kind]).filter((id) => REG.finishIds(style, kind, true).includes(id))];
  const pick = (kind, want) => { const v = valid(kind); return v.includes(want) ? want : (v[0] || null); };
  const textures = valid('textures'); const dflt = textures[0] || 'clean';
  const allowedTex = rank(tier) >= TIER_RANK.prestige ? textures : textures.filter((t) => t === dflt || t === 'clean');
  return {
    corners: pick('corners', s.corners),
    buttons: pick('buttons', s.button_style),
    texture: allowedTex.includes(s.texture) ? s.texture : dflt,
  };
}
const NEW_DAYS = 30;   // Q14

const str = (v) => (typeof v === 'string' ? v : '');
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** The monogram from her name (the prototypes' rule): the first letters of the first two words that are not filler. */
const MONO_STOP = new Set(['studio', 'the', 'by', 'and', 'of', 'bridal', 'artistry', 'films', 'events', 'makeup', 'photography']);
function monogramFor(name) {
  const all = str(name).trim().split(/\s+/).filter((w) => /\p{L}/u.test(w));
  let w = all.filter((x) => !MONO_STOP.has(x.toLowerCase()));
  if (w.length < 2) w = all;   // the prototypes' rule: fewer than two non-filler words, take the name as it is
  const m = w.slice(0, 2).map((x) => Array.from(x.replace(/^[^\p{L}]+/u, ''))[0] || '').join('').toUpperCase();
  return m || 'TDW';
}

/** Q10: the styles open to her. The style in use survives a downgrade, then her picks in order, up to her allowance. */
function stylesOpen(tier, site) {
  const n = STYLE_ALLOWANCE[tierOf(tier)];
  if (n >= 6) return [...REG.STYLE_IDS];
  if (n === 0) return [];
  const s = obj(site);
  const picked = arr(s.styles_picked).filter((x) => REG.STYLE_IDS.includes(x));
  const inUse = REG.STYLE_IDS.includes(s.style) ? [s.style] : [];
  const order = [...inUse, ...picked, ...REG.STYLE_IDS];   // with no picks, the registry's order fills her allowance
  return [...new Set(order)].slice(0, n);
}
function styleFor(tier, site) {
  const open = stylesOpen(tier, site);
  const want = obj(site).style;
  return open.includes(want) ? want : (open[0] || null);
}

/** Her palette, resolved and gated. Essential: her style's curated three. Signature: + her own accent. Prestige: + a gradient. */
function paletteFor(tier, style, site) {
  const s = obj(site); const curated = REG.palettesOf(style);
  if (!curated.length) return null;
  // cut 16 (ruling b): on Basic the palette is fixed to her style's default (its first curated palette)
  const chosen = tierOf(tier) === 'basic' ? curated[0] : (curated.find((p) => p.id === s.palette_id) || curated[0]);
  const custom = obj(s.palette_custom);
  let roles = chosen.roles; let extras = chosen.extras; let id = chosen.id; let isCustom = false;
  if (rank(tier) >= TIER_RANK.signature && contrast.parseHex(custom.accent)) {
    const base = curated.find((p) => p.id === custom.base) || chosen;
    roles = Object.assign({}, base.roles, { accent: custom.accent.toLowerCase() });
    extras = Object.assign({}, base.extras);
    // Where the style reads its accent as text through `atx` (on the paper) or `atd` (on the deep band), her colour is that text too.
    if ('atx' in extras) extras.atx = roles.accent;
    if ('atd' in extras) extras.atd = roles.accent;   // and on the deep band; the gate lightens or darkens each for its own ground
    const fill = 'atx' in extras && style === 'riviera' ? extras.atx : roles.accent;
    roles.on_accent = contrast.bestOn(fill, [base.roles.on_accent, base.roles.ink, base.roles.ground]);
    id = base.id; isCustom = true;
  }
  if (rank(tier) >= TIER_RANK.prestige) {
    const stops = arr(custom.gradient).filter((c) => contrast.parseHex(c)).slice(0, 3);
    if (stops.length >= 2) { extras = Object.assign({}, extras, { grad: `linear-gradient(110deg,${stops.join(',')})` }); isCustom = true; }
  }
  const g = contrast.gatePalette(roles, extras, REG.gatePairsFor(style));
  return { id, custom: isCustom, roles: g.roles, extras: g.extras, moved: g.moved };
}

/** Q7 (WEB-3's map in styles.js): every new-site tier gets the pairs its style offers; her pick if it is one of them. */
function fontPairFor(style, site, tier) {
  const offered = (REG.STYLES[style] || { pairs: [] }).pairs;
  const want = obj(site).font_pair;
  // cut 16 (ruling b): on Basic the pairing is fixed to her style's default (its first offered pair)
  const id = tier !== undefined && tierOf(tier) === 'basic' ? (offered[0] || null) : (offered.includes(want) ? want : (offered[0] || null));
  return id ? { id, ...REG.FONT_PAIRS[id], offered: [...offered] } : null;
}

/**
 * The sections, in order, each with `allowed` (her tier opens it) and `shown` (her choice, within what is allowed).
 * Below Prestige (Q11) the middle sections show, hide and reorder; the cover is first and the footer last, both shown.
 * Custom sections (Signature and up) sit where she put them; sections on a custom page (Prestige) are listed apart.
 */
function sectionsFor(tier, rows) {
  const r = rank(tier); const full = r >= TIER_RANK.prestige;
  const stored = arr(rows).filter((x) => x && typeof x === 'object' && !x.deleted_at && !x.page_id);
  const byKey = new Map(stored.map((x) => [str(x.key), x]));
  const defaults = SECTION_DEFAULTS.map((d, i) => ({ d, pos: i * 10 }));
  const all = [];
  for (const { d, pos } of defaults) {
    const row = byKey.get(d.key);
    all.push({ key: d.key, custom: false, fixed: d.fixed || null, allowed: r >= TIER_RANK[d.min], min: d.min,
      position: row && Number.isFinite(row.position) ? row.position : pos, shown: row ? row.shown !== false : true, row });
  }
  for (const row of stored) {
    if (!CUSTOM_KEY.test(str(row.key)) || all.some((a) => a.key === row.key)) continue;
    all.push({ key: row.key, custom: true, fixed: null, allowed: r >= TIER_RANK.signature, min: 'signature',
      position: Number.isFinite(row.position) ? row.position : 1000, shown: row.shown !== false, row });
  }
  all.sort((a, b) => (a.position - b.position) || a.key.localeCompare(b.key));
  let ordered = all;
  if (!full) {
    const first = all.filter((a) => a.fixed === 'first'); const last = all.filter((a) => a.fixed === 'last');
    ordered = [...first, ...all.filter((a) => !a.fixed), ...last];
    for (const a of ordered) if (a.fixed) a.shown = true;
  } else {
    for (const a of ordered) if (a.key === 'enquire') a.shown = true;   // the enquiry is never hidden (WEB-1 refusal g)
  }
  return ordered.map((a) => {
    const row = obj(a.row);
    const eyebrow = limits.field('section_eyebrow', row.eyebrow); const heading = limits.field('section_heading', row.heading);
    return { key: a.key, custom: a.custom, allowed: a.allowed, shown: a.allowed && a.shown, opens: a.allowed ? null : PLAN_NAME[a.min],   // cut 16 (g)
      variant: VARIANT.test(str(row.variant)) ? row.variant : 'default',
      eyebrow: eyebrow.ok ? eyebrow.value : null, heading: heading.ok ? heading.value : null, body: obj(row.body) };
  });
}

/** Prestige custom pages; none below it (their rows are kept). */
function pagesOf(tier, rows) {
  if (rank(tier) < TIER_RANK.prestige) return [];
  return arr(rows).filter((p) => p && !p.deleted_at && limits.SLUG.test(str(p.slug)) && limits.field('page_title', p.title).ok && p.shown !== false)
    .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)).map((p) => ({ slug: p.slug, title: limits.field('page_title', p.title).value }));
}

/** Trade words (design §4), with her own words where she set them and they fit. */
function tradeFor(category, copy) {
  const base = REG.TRADE_WORDS[REG.tradeRowFor(category)];
  const o = obj(obj(copy).trade_override);
  const pick = (k, f) => { const r = limits.field(k, o[f]); return r.ok && r.value ? r.value : base[f]; };
  // row (cut 7, WEB-5's shape): which kind of row her work shows as: 'looks' | 'work' | 'acts' | 'events'
  return { items: pick('trade_items', 'items'), item: pick('trade_item', 'item'), request: pick('trade_request', 'request'), row: REG.tradeRowFor(category) };
}

/** Q14: a published look reads as New for 30 days after it was first published, unless she switched its mark off. */
function isNew(look, now) {
  const l = obj(look); if (l.new_mark === false || !l.published_at) return false;
  const t = Date.parse(l.published_at); const n = now instanceof Date ? now.getTime() : Date.now();
  return Number.isFinite(t) && n >= t && n - t < NEW_DAYS * 86400000;
}

/** The capabilities her tier opens, for her own room (design §7). Never sent whole to a public page. */
// cut 16 (g): each locked capability with the plan that opens it. The thresholds are the ones each flag already used.
const CAPABILITY_AT = Object.freeze({
  palettes: 1, font_pairs: 1, custom_palette: 2, gradients: 3, collections: 2, journal: 2,
  custom_sections: 2, custom_pages: 3, full_order: 3, credit_removable: 3,
  written_testimonials: 1, video_testimonials: 2, live_booking: 2, own_voice: 3,
  visitor_counts: 1, visitor_sources: 2, visitor_saves: 3, own_domain: 2, built_from_instagram: 1,
});
function capabilitiesFor(tier) {
  const r = rank(tier); const t = tierOf(tier);
  const out = { styles: STYLE_ALLOWANCE[t] };
  const opens = {};
  for (const [k, at] of Object.entries(CAPABILITY_AT)) { out[k] = r >= at; if (!out[k]) opens[k] = PLAN_NAME[PLAN_AT[at]]; }
  if (r < TIER_RANK.prestige) opens.more_styles = PLAN_NAME[PLAN_AT[r + 1]];   // the next plan holds more styles
  out.opens = opens;
  return out;
}

/** cut 16 (ruling 2): her style clock. Basic only enforces it; the dates are given on every plan (WEB-8's room shows them). */
function styleClock(tier, site, nowMs) {
  const at = obj(site).style_changed_at; const t = at ? Date.parse(at) : NaN; const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const next = Number.isFinite(t) ? t + STYLE_CHANGE_DAYS * 86400000 : null;
  const day = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);   // India's date
  const words = (ms) => new Date(ms + 330 * 60000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return { last_changed_on: Number.isFinite(t) ? day(t) : null, next_change_on: next ? day(next) : null,
    next_change_words: next ? words(next) : null, locked: tierOf(tier) === 'basic' && next !== null && now < next };
}

/**
 * THE ONE RESOLUTION. Input: { tier, category, businessName, site (vendor_sites row), sections (rows), pages (rows) }.
 * Basic keeps today's one-page site (v 'classic', drawn by the WEB-1 half). Essential and up get the six-style site.
 */
function resolveSite(input) {
  try {
    const i = obj(input); const tier = tierOf(i.tier); const site = obj(i.site); const copy = obj(site.copy);
    const name = limits.field('site_name', site.site_name);
    const siteName = (name.ok && name.value) || str(i.businessName).trim() || null;
    const mono = limits.field('monogram', site.monogram);
    const base = { credit: creditFor(tier, site), can: capabilitiesFor(tier), site_name: siteName,
      monogram: (mono.ok && mono.value) ? mono.value.toUpperCase() : monogramFor(siteName || i.businessName) };
    // cut 16: Basic is drawn by the styles site too (one style, its default palette and pairing, Basic's sections)
    const style = styleFor(tier, site);
    return {
      v: 'styles', ...base, style, styles_open: stylesOpen(tier, site),
      palette: paletteFor(tier, style, site), font_pair: fontPairFor(style, site, tier),
      motion: MOTIONS.includes(site.motion) ? site.motion : 'lively',
      ...finishFor(tier, style, site),
      cover_mode: COVER_MODES.includes(site.cover_mode) ? site.cover_mode : 'slideshow',
      sections: sectionsFor(tier, i.sections), pages: pagesOf(tier, i.pages), trade: tradeFor(i.category, copy),
    };
  } catch (_e) {
    return { v: 'classic', credit: true, can: capabilitiesFor('basic'), site_name: null, monogram: 'TDW', look: 'quiet', pages: pagesFor('basic', null) };
  }
}

module.exports = {
  // WEB-1 (today's one-page site; Basic's under the new tiers)
  defaultSite, LOOKS, TRADE_LOOK, BASE_PAGES, SIGNATURE_PAGES, PRESTIGE_PAGES, tierOf, looksOpen, tradeLook, lookFor, allowedPages, pagesFor, creditFor,
  // WEB-4 (the six-style site)
  resolveSite, stylesOpen, styleFor, paletteFor, fontPairFor, sectionsFor, pagesOf, tradeFor, isNew, capabilitiesFor, monogramFor,
  SECTION_DEFAULTS, SECTION_KEYS, STYLE_ALLOWANCE, rank, PLAN_NAME, CAPABILITY_AT, STYLE_CHANGE_DAYS, styleClock, MOTIONS, COVER_MODES, NEW_DAYS, CUSTOM_KEY, finishFor, LIFTED,
};
