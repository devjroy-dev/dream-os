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
  // Each profile: `ask` = the SHORT, fixed set of category-specific things the
  // agent should find out (2-3 max). The agent asks these conversationally, one
  // per turn, then RELAYS to the vendor. It does NOT explore beyond this list,
  // does NOT quote prices, does NOT interrogate. Keep enquiries short.

  // ── MAKEUP ARTIST ─────────────────────────────────────────────────────
  makeup: {
    label: 'makeup artist',
    timelineType: 'event',
    ask: [
      'which functions need makeup (e.g. just the wedding, or also sangeet/reception)',
      'how many people need makeup (just the bride, or family too)',
    ],
    vocabulary: 'functions, looks, trial',
  },

  // ── PHOTOGRAPHY / VIDEOGRAPHY / CONTENT (grouped) ─────────────────────
  photography: {
    label: 'photographer',
    timelineType: 'event',
    ask: [
      'which functions they want covered',
      'whether they want photography, video, or both',
    ],
    vocabulary: 'coverage, functions, deliverables',
  },

  // ── DESIGNER (couture / outfits) ──────────────────────────────────────
  designer: {
    label: 'designer',
    timelineType: 'delivery',
    ask: [
      'what kind of outfit they have in mind (lehenga, gown, sherwani, saree, etc.)',
      'which function it is for',
      'roughly when they would need it / could come in for a trial fitting',
    ],
    vocabulary: 'outfit, lehenga, gown, trial fitting',
  },

  // ── JEWELLER ──────────────────────────────────────────────────────────
  jewellery: {
    label: 'jeweller',
    timelineType: 'delivery',
    ask: [
      'which pieces they want (a single piece, or a full set)',
      'the type they prefer — gold, polki, kundan, diamond, or temple',
      'when they need it ready by',
    ],
    vocabulary: 'pieces, set, polki, kundan, temple',
  },

  // ── DECOR ─────────────────────────────────────────────────────────────
  decor: {
    label: 'decorator',
    timelineType: 'event',
    ask: [
      'which function(s) need decor and the venue',
      'in her own words, the kind of decor or mood she is dreaming of',
    ],
    freeTextVision: true,
    freeTextPrompt: 'Decor is a vision, not a checklist — let her describe the mood/look she wants in her own words, and capture it as-is for the decorator. Do not flatten it into keywords.',
    vocabulary: 'theme, palette, florals, mandap, stage',
  },

  // ── VENUE ─────────────────────────────────────────────────────────────
  venue: {
    label: 'venue',
    timelineType: 'event',
    ask: [
      'roughly how many guests they expect',
      'which function(s) / dates they are considering the venue for',
    ],
    visitOriented: true,
    visitPrompt: 'A venue is chosen by visiting. Keep it light, then warmly suggest arranging a visit rather than gathering a long brief.',
    vocabulary: 'guests, dates, spaces, visit',
  },
};

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

  // Generic fallback — for categories without a profile yet. Kept short.
  return {
    key: 'other',
    label: 'vendor',
    timelineType: 'event',
    ask: [
      'what they are looking for',
      'which function(s) / dates it is for',
    ],
    vocabulary: 'occasion, date',
  };
}

module.exports = { profileFor, PROFILES, ALIASES };
