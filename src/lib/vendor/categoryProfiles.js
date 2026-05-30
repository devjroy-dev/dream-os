// src/lib/vendor/categoryProfiles.js
//
// PHASE 3.5 — THE CATEGORY PROFILE SYSTEM.
//
// A category profile is a bundle of {intake + vocabulary + timeline type +
// framing}. It tells the COUPLE-AGENT (the bride-facing assistant collecting an
// enquiry) what to learn from a bride who is enquiring with a vendor of this
// category — because what a bride must tell a jeweller (pieces, metal) is
// nothing like what she tells a photographer (events, coverage).
//
// SCOPE: this drives ONLY the couple-agent's enquiry intake (info collection
// FROM the client). It does NOT touch the vendor-facing agent, the PWA, or
// vendor onboarding. The bride's wedding SHAPE (dates / number of functions /
// days) is captured once at bride onboarding (Layer 0) and is INHERITED here —
// profiles never re-ask "when's the wedding".
//
// GUIDED, NOT SCRIPTED: the agent is told what it needs to LEARN, and gathers
// it conversationally — in any order, skipping anything the bride already
// volunteered. It is not a form. (Design decision, Phase 3.5.)
//
// LIFTABLE: own module, like categoryFraming.js. When DreamAi expands beyond
// weddings (the solopreneur vision), new verticals add their own profiles here
// (or in a sibling file) without touching the couple-agent loop.
//
// timelineType:
//   'event'    — the work happens ON the wedding/function days (photographer,
//                MUA, decor, venue). "Which functions?" matters.
//   'delivery' — the work is MADE and delivered BEFORE the wedding (jeweller,
//                designer). "Ready by / delivery date" matters, not "which day
//                do you need me there".
//
// Keys MUST match src/agent/categories.js canonical values. normaliseCategory()
// (from categoryFraming) maps free-text → these keys.

const PROFILES = {
  // ── MAKEUP ARTIST ─────────────────────────────────────────────────────
  makeup: {
    label: 'makeup artist',
    timelineType: 'event',
    // What the agent should learn (guided, conversational — not a script):
    learn: [
      'which functions need makeup (e.g. just the wedding, or also sangeet/reception)',
      'how many people need makeup (just the bride, or family/bridesmaids too)',
      'whether they want a trial beforehand',
    ],
    vocabulary: 'functions, looks, trial',
    note: 'Makeup is per-function. A bride may want makeup for only some of her functions.',
  },

  // ── PHOTOGRAPHY / VIDEOGRAPHY / CONTENT (grouped — same intake shape) ──
  photography: {
    label: 'photographer',
    timelineType: 'event',
    learn: [
      'which functions they want covered (which of their wedding days/events)',
      'whether they want photography, video, or both / content',
      'roughly what deliverables they have in mind (album, full-day coverage, reels, etc.)',
    ],
    vocabulary: 'coverage, functions, deliverables, album, reels',
    note: 'Coverage is per-function across the wedding span. Confirm which days/events they want shot.',
  },

  // ── DESIGNER (couture / outfits) — canonical key: designer ────────────
  designer: {
    label: 'designer',
    timelineType: 'delivery',
    learn: [
      'their style preference / the kind of outfit they have in mind',
      'which occasion / function the outfit is for',
      'whether they are open to trial fittings (they will likely need to come in)',
      'when they need it delivered by',
    ],
    vocabulary: 'outfit, silhouette, fabric, trial fittings, delivery',
    note: 'Couture is made-to-deliver. The PIECE drives the price — surface budget as a starting minimum, not a demand. Delivery date matters more than a single event date.',
  },

  // ── JEWELLER ──────────────────────────────────────────────────────────
  jewellery: {
    label: 'jeweller',
    timelineType: 'delivery',
    learn: [
      'the occasion / which looks the jewellery is for',
      'which pieces they want (full set, necklace, earrings, maang tikka, bangles)',
      'the type they prefer — gold, polki, kundan, diamond, or temple',
      'when they need it ready by',
    ],
    vocabulary: 'pieces, set, polki, kundan, temple, customisation',
    note: 'Jewellery is made-to-deliver. Ask budget directly here (unlike designers). Ready-by date matters, not a single event date.',
  },

  // ── DECOR ─────────────────────────────────────────────────────────────
  decor: {
    label: 'decorator',
    timelineType: 'event',
    learn: [
      'the occasion / which function(s) need decor',
      'the venue (where it\'s happening)',
      'any theme or colour direction in mind',
      'the scale they\'re imagining',
      'flowers — whether and what kind',
      'the date(s)',
    ],
    // Decor is the one category where structured fields undersell the enquiry —
    // it's an aesthetic vision. So in addition to the structured points above,
    // the agent should invite the bride to DESCRIBE, in her own words, the kind
    // of decor she'd love. Capture that free-text vision verbatim for the vendor.
    freeTextVision: true,
    freeTextPrompt: 'Decor is an idea that turns into reality — invite her to describe, in her own words, the kind of decor or mood she\'s dreaming of. Capture that description as-is for the decorator; do not flatten it into keywords.',
    vocabulary: 'theme, palette, florals, mandap, stage, scale',
    note: 'Decor cannot be reduced to dropdowns. The free-text vision is the most important thing to capture well.',
  },

  // ── VENUE ─────────────────────────────────────────────────────────────
  venue: {
    label: 'venue',
    timelineType: 'event',
    // Venue is deliberately LIGHT. People want to visit and feel the space, not
    // describe requirements over chat. So intake is minimal and the goal is to
    // move them toward a visit, not extract a full brief.
    learn: [
      'roughly how many guests they expect',
      'which function(s) / dates they\'re considering the venue for',
    ],
    visitOriented: true,
    visitPrompt: 'A venue is experiential — people prefer to visit and decide in person. Keep intake light (guest count + dates), then steer warmly toward arranging a visit rather than gathering a long brief.',
    vocabulary: 'guests, dates, spaces, site visit',
    note: 'Do NOT over-question. Light touch, then nudge toward a visit.',
  },
};

// Categories that share another category's profile (grouping).
const ALIASES = {
  videography: 'photography',   // photo/video/content share one intake shape
};

// Resolve a vendor category (canonical or free-text) to its profile.
// Falls back to a sensible generic profile for unknown categories.
function profileFor(category) {
  // Lazy require to avoid any load-order coupling.
  const { normaliseCategory } = require('./categoryFraming');
  let key = normaliseCategory(category);
  if (ALIASES[key]) key = ALIASES[key];
  if (PROFILES[key]) return { key, ...PROFILES[key] };

  // Generic fallback — the old behaviour, for categories without a profile yet.
  return {
    key: 'other',
    label: 'vendor',
    timelineType: 'event',
    learn: [
      'what the occasion is',
      'when and where it\'s happening',
      'their approximate budget',
    ],
    vocabulary: 'occasion, date, budget',
    note: 'Generic intake — no category-specific profile for this vendor type yet.',
  };
}

module.exports = { profileFor, PROFILES, ALIASES };
