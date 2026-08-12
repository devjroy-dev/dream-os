// src/lib/vendor/categoryFraming.js
//
// PHASE 3 — the category-awareness SEAM.
//
// When a vendor tells the agent "quote Ananya 4L", the agent must NOT relay a
// bare number to the couple. A good human assistant frames it: "Swati's base
// charge starts around ₹4L, though it depends on the number of events and how
// much coverage you'll need." The caveat protects the vendor from being held
// to an oversimplified figure and reads as professional, not chatbot-flat.
//
// WHAT THE CAVEAT DEPENDS ON is category-specific. A photographer's price
// depends on events/coverage; a jeweller's on pieces/customisation; a venue's
// on guest count/dates. This file maps category → caveat phrasing.
//
// THIS IS A SEAM, NOT THE WHOLE SYSTEM.
// In Phase 3 this is a light lookup. In Phase 3.5 the category profile system
// (intake questions + vocabulary + framing + trust boundaries per category)
// will subsume this — `framingFor()` becomes a read into that richer profile.
// The call site in send_to_couple does not change; only this file grows.
// Keeping it isolated (own module) means it lifts cleanly into a new repo when
// DreamAi expands to non-wedding solopreneurs (lawyers, designers, etc).
//
// Category keys MUST match src/agent/categories.js (VENDOR_CATEGORIES) — and as
// of ARC OB they no longer "must" by convention: this file IMPORTS that array and
// membership is decided against it, so the two lists cannot drift.

const { VENDOR_CATEGORIES } = require('../../agent/categories');

// What a quoted price "depends on", per category. Used to build the caveat.
// ⚠ MODEL-VOICED. Every string below is spoken to a COUPLE. Founder holds veto.
// ARC OB re-key: `venue` → `venue_catering`, BYTE-UNCHANGED. The words say venue
// only and a caterer now hears them — a widening is PROPOSED on the veto sheet and
// is NOT in this file. The re-key ships because withholding it would strand venue
// vendors on `other`'s generic caveat, which is a regression, not a hold.
// ⚠ `hairstylist`, `performer`, `content_creator` ARE DELIBERATELY ABSENT. Their
//   proposed bytes sit COMMENTED at the foot of this table under R-OB.10 (profile
//   bytes land only after their veto). Until the founder's word lands they fall to
//   DISCHARGED 2026-08-12: the founder's veto landed and all three are keyed
//   below. The fallback-to-`other` posture this comment described is HISTORY,
//   not current behaviour — kept because the next held byte will re-enter here.
// ⚠ THIS TABLE IS NO LONGER THE MEMBERSHIP TEST. normaliseCategory used to decide
//   "is this a canonical token?" by asking `PRICE_DEPENDS_ON[c]`. A copy table
//   was the taxonomy's gatekeeper. That is why `venue_catering` could not exist.
const PRICE_DEPENDS_ON = {
  photography:    'the number of events and how much coverage you need',
  makeup:         'the number of people and functions, and whether trials are included',
  decor:          'the scale of the setup, the venue, and the number of functions',
  // B② VETOED 2026-08-12 — widened from venue's inherited bytes so a CATERER is
  // not asked about spaces. Arm ③ (noun, label, ask-lines, visitPrompt) stays
  // AVAILABLE and UNTAKEN: it lands the day a live caterer makes the intake
  // shape cost something. Nothing else in this merge moved a byte.
  venue_catering: 'the dates, the number of guests, and what you need served or set up',
  planning:       'the scope of work and how many functions you need managed',
  jewellery:      'the pieces you choose, the materials, and any customisation',
  designer:       'the outfits, the fabrics, and how much customisation you want',
  other:          'your specific requirements',
  // ── VETOED AND FROZEN 2026-08-12 (founder: 「 A as written 」) ──────────────
  // Primary drafts, no alternatives taken. `turnaround` STANDS — it is a trade
  // word in a couple-facing sentence and that was argued and ruled, not missed.
  // APPROVED-COPY-CARRIES-ITS-HASH: pinned at the byte by bOB_taxonomy_bench §7.
  // AN EDITED COMMA IS A FRESH VETO.
  hairstylist:     'the number of people and functions, and whether trials are included',
  performer:       'the number of events and the hours of performance',
  content_creator: 'the number of events, the deliverables, and the turnaround you need',
};
// Build a warm, semi-formal caveat clause for a quoted price.
// Returns just the caveat text (no leading punctuation), e.g.
//   "though it depends on the number of events and how much coverage you need"
// The caller stitches it into the full sentence so phrasing stays natural and
// can be tuned per surface.
function framingFor(category) {
  const key = normaliseCategory(category);
  const depends = PRICE_DEPENDS_ON[key] || PRICE_DEPENDS_ON.other;
  return `though it depends on ${depends}`;
}

// What this category's offering is generically called, for natural phrasing
// ("Swati's base charge for the photography...") — light, optional.
// ⚠ MODEL-VOICED, same veto, same HELD block. See PRICE_DEPENDS_ON's header.
const OFFERING_NOUN = {
  photography:    'the photography',
  makeup:         'the makeup',
  decor:          'the decor',
  venue_catering: 'the venue',
  planning:       'the planning',
  jewellery:      'the pieces',
  designer:       'the outfits',
  other:          'the work',
  // ── VETOED AND FROZEN 2026-08-12 (founder: 「 A as written 」) ──────────────
  // `the performance` is the only noun that picks no side across the merge —
  // `the music` would strand the anchor. Pinned by bench §7; comma-frozen.
  hairstylist:     'the hair',
  performer:       'the performance',
  content_creator: 'the content',
};
function offeringNoun(category) {
  const key = normaliseCategory(category);
  return OFFERING_NOUN[key] || OFFERING_NOUN.other;
}

// ─────────────────────────────────────────────────────────────────────────────
// THE ALIAS TABLE (ARC OB fork 3, CE-32-ratified). Homed HERE, beside the one
// function that reads it. EXACT-MATCH on the whole trimmed lowercased value —
// `vendors.category` is a stored token or a short phrase, not a sentence; the
// contains-ladder below is what handles the sentences.
//
// EVERY TARGET MUST BE A CANONICAL TOKEN. That is not a comment, it is asserted
// at load (see the invariant below) and pinned by a bench cell — the F-04.36
// forcing function this estate keeps discovering it did not have.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_ALIASES = Object.freeze({
  // ── photography ← videography (founder ③: merged as one) ───────────────────
  'photographer': 'photography', 'candid': 'photography', 'shooter': 'photography',
  'photog': 'photography', 'photo': 'photography',
  'videography': 'photography', 'videographer': 'photography',
  'cinematographer': 'photography', 'cinematography': 'photography',
  'filmmaker': 'photography', 'film maker': 'photography', 'films': 'photography',
  'video': 'photography', 'photo and video': 'photography',
  'photography and videography': 'photography', 'photo & video': 'photography',

  // ── venue_catering ← venue + catering (founder ①: ONE) ─────────────────────
  'venue': 'venue_catering', 'catering': 'venue_catering', 'caterer': 'venue_catering',
  'food': 'venue_catering', 'chef': 'venue_catering', 'f&b': 'venue_catering',
  'hospitality': 'venue_catering', 'banquet': 'venue_catering', 'hall': 'venue_catering',
  'banquet hall': 'venue_catering', 'farmhouse': 'venue_catering',
  'resort': 'venue_catering', 'hotel': 'venue_catering', 'lawn': 'venue_catering',
  'venue and catering': 'venue_catering', 'venue & catering': 'venue_catering',

  // ── performer ← music_dj + music_live + choreography (founder ②: ONE) ───────
  'music_dj': 'performer', 'music_live': 'performer', 'choreography': 'performer',
  'dj': 'performer', 'disc jockey': 'performer', 'sound': 'performer',
  'emcee': 'performer', 'mc': 'performer', 'anchor': 'performer',
  'band': 'performer', 'singer': 'performer', 'musician': 'performer',
  'live music': 'performer', 'classical': 'performer', 'music': 'performer',
  'choreographer': 'performer', 'dance': 'performer', 'dancer': 'performer',

  // ── content_creator (founder ④: new) ───────────────────────────────────────
  'content creator': 'content_creator', 'content-creator': 'content_creator',
  'content': 'content_creator', 'ugc': 'content_creator', 'ugc creator': 'content_creator',
  'reels': 'content_creator', 'reel': 'content_creator',
  'social media manager': 'content_creator', 'influencer': 'content_creator',

  // ── hairstylist (split out of makeup) ──────────────────────────────────────
  'hair': 'hairstylist', 'hairstylist': 'hairstylist', 'hair stylist': 'hairstylist',
  'hairdresser': 'hairstylist', 'hair artist': 'hairstylist',

  // ── makeup (unchanged) ─────────────────────────────────────────────────────
  'mua': 'makeup', 'makeup artist': 'makeup', 'bridal makeup': 'makeup',
  'beauty': 'makeup',
  // NOTE: 'hair and makeup' / 'hair & makeup' stay MAKEUP, not hairstylist. A
  // vendor who does both is a MUA who also does hair; the split exists for the
  // hair-only artist. Losing the makeup occupancy (2/slot) would be the harm.
  'hair and makeup': 'makeup', 'hair & makeup': 'makeup',

  // ── decor (florist merged 2026-05-15; F-04.59's cure survives) ─────────────
  'decorator': 'decor', 'decoration': 'decor', 'event decor': 'decor',
  'floral decor': 'decor', 'florist': 'decor', 'flowers': 'decor', 'floral': 'decor',
  'theme decor': 'decor', 'mandap decor': 'decor', 'flower decorator': 'decor',
  // 'venue & decor' — F-OB.3's shadow token, from the signup door's dead six.
  // TARGET PROPOSED, chair-ruled in-band: see the build note's evidence.
  'venue & decor': 'decor', 'venue and decor': 'decor',

  // ── designer (attire is the collab CHECK's old spelling — F-OB.4) ──────────
  'attire': 'designer', 'bridal wear': 'designer', 'lehenga': 'designer',
  'sherwani': 'designer', 'clothing': 'designer', 'outfit': 'designer',
  'fashion': 'designer', 'couture': 'designer', 'boutique': 'designer',

  // ── planning ───────────────────────────────────────────────────────────────
  'planner': 'planning', 'coordinator': 'planning', 'event manager': 'planning',
  'wedding manager': 'planning', 'wedding planner': 'planning',

  // ── other ← mehendi + transport + invitations (founder ⑤: everything else) ──
  'mehendi': 'other', 'mehndi': 'other', 'henna': 'other', 'mehendi artist': 'other',
  'transport': 'other', 'car rental': 'other', 'vintage car': 'other',
  'horse': 'other', 'buggy': 'other', 'baraat': 'other',
  'invitations': 'other', 'invitation': 'other', 'card': 'other',
  'stationery': 'other', 'printing': 'other', 'digital invite': 'other',
  'wedding card': 'other', 'card printer': 'other', 'card printing': 'other',
  'e-invite': 'other', 'digital card': 'other',
});

// LOAD-TIME INVARIANT — the forcing function. An alias pointing at a token the
// canonical list does not carry is a silent taxonomy split, which is the exact
// defect class (F-04.36, F-OB.4) this arc exists to close. Fail loud at require
// time rather than let one vendor land on a token nothing downstream can key.
{
  const strays = Object.entries(CATEGORY_ALIASES)
    .filter(([, target]) => !VENDOR_CATEGORIES.includes(target))
    .map(([alias, target]) => `${alias}->${target}`);
  if (strays.length) {
    throw new Error(`categoryFraming: alias targets outside VENDOR_CATEGORIES: ${strays.join(', ')}`);
  }
}

// Vendor.category is free text; normalise to a canonical token.
//
// ── THE ORDER IS THE WHOLE RULING (CE-32, fork 1) ────────────────────────────
// 1. EXACT MEMBERSHIP against the imported canonical list.
// 2. EXACT ALIAS.
// 3. The contains-ladder, DEMOTED TO FALLBACK, for free-text values only.
//
// ⚠ WHY 1 EXISTS AND WHY IT IS FIRST. Before ARC OB the canonical test was
//   `if (PRICE_DEPENDS_ON[c]) return c` — a COPY TABLE was the gatekeeper — and
//   the ladder ran on anything it missed. That shape ate its own successor:
//   `normaliseCategory('venue_catering')` returned **'catering'**, because the
//   ladder's `includes('cater')` sits one line above its venue test and
//   'venue_catering' contains 'cater'. A brand-new canonical token silently
//   resolved to a RETIRING one, its profile fell to `other`, and
//   CATEGORY_CAPACITY['venue_catering'] was never once consulted — venue's
//   1/slot would have vanished for every venue vendor with no error anywhere.
//   Derived by RUNNING the resolvers, not by reading them.
//   The chair ruled the STRUCTURAL cure over the reorder: a membership pass
//   kills the whole class — any future token containing another's substring —
//   instead of curing this one specimen. Reorder the ladder and the next
//   compound token finds the same trap. PUT THE LADDER FIRST AGAIN AND THE
//   TAXONOMY BENCH REDDENS ON THE CATER TRAP BY NAME.
function normaliseCategory(category) {
  if (!category) return 'other';
  const c = String(category).toLowerCase().trim();

  // 1 — canonical membership. ONE LIST RULES.
  if (VENDOR_CATEGORIES.includes(c)) return c;

  // 2 — exact alias.
  if (CATEGORY_ALIASES[c]) return CATEGORY_ALIASES[c];

  // 3 — FALLBACK ONLY: loose contains-match for free-text values that are
  //     neither a token nor a known trade word ("luxury candid photography,
  //     Delhi"). Reached only after both exact passes miss, so it can no longer
  //     shadow a canonical token. Order within this ladder is now a matter of
  //     taste rather than of correctness — but the specific-before-generic
  //     habit is kept so a future reader is not taught the wrong lesson.
  if (c.includes('photo') || c.includes('video') || c.includes('cinema') || c.includes('film')) return 'photography';
  if (c.includes('hairstyl') || c.includes('hair styl') || c.includes('hairdress')) return 'hairstylist';
  if (c.includes('makeup') || c.includes('make up') || c.includes('mua') || c.includes('beauty')) return 'makeup';
  // F-04.59's cure survives the arc: 'florist' contains neither 'floral' nor
  // 'flower', and its absence was invisible because it fell through to 'other'.
  if (c.includes('decor') || c.includes('floral') || c.includes('flower') || c.includes('florist')) return 'decor';
  if (c.includes('cater') || c.includes('venue') || c.includes('banquet') || c.includes('resort') || c.includes('farmhouse')) return 'venue_catering';
  if (c.includes('choreo') || c.includes('dance') || c.includes('band') || c.includes('singer') || c.includes('music') || c.includes('anchor')) return 'performer';
  if (c.includes('content') || c.includes('ugc') || c.includes('reel')) return 'content_creator';
  if (c.includes('plan') || c.includes('coordinat')) return 'planning';
  if (c.includes('jewel')) return 'jewellery';
  if (c.includes('attire') || c.includes('lehenga') || c.includes('outfit') || c.includes('cloth') || c.includes('designer') || c.includes('couture') || c.includes('sherwani') || c.includes('gown') || c.includes('saree') || c.includes('boutique')) return 'designer';
  // mehendi / transport / invitations FOLD INTO OTHER (founder ⑤). They are not
  // listed above because they have nowhere else to go — the default IS the ruling.
  return 'other';
}

module.exports = { framingFor, offeringNoun, normaliseCategory, PRICE_DEPENDS_ON, CATEGORY_ALIASES };
