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
//
// ARC OB (CE-32, 2026-08-12): `venue` re-keyed to `venue_catering`. THE KEY IS
// LOAD-BEARING BEYOND THIS FILE — occupancy.js reads CATEGORY_CAPACITY[profile.key],
// so a capacity keyed on a token with NO PROFILE HERE is never once consulted.
// `venue_catering: 1` in occupancy and this key are one edit in two files or they
// are nothing. The profile's BYTES are unchanged and still say "venue": widening
// them to name a caterer is model-voiced and sits on the veto sheet, not here.
// `hairstylist`, `performer`, `content_creator` ship PROFILE-LESS and fall to the
// generic below — which is what nine of the old sixteen already did, so this is
// the estate's existing posture, not a new gap.

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
      'whether they want it custom-made / stitched, or are looking at ready pieces',
      'roughly when they would need it / could come in for a trial fitting',
    ],
    vocabulary: 'outfit, lehenga, gown, custom-made, trial fitting',
  },

  // ── JEWELLER ──────────────────────────────────────────────────────────
  jewellery: {
    label: 'jeweller',
    timelineType: 'delivery',
    ask: [
      'which pieces they want (a single piece, or a full set)',
      'the type they prefer — gold, polki, kundan, diamond, or temple',
      'whether they want it custom-made or are looking at ready pieces',
      'when they need it ready by',
    ],
    vocabulary: 'pieces, set, polki, kundan, temple, custom-made',
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

  // ── VENUE & CATERING (merged 2026-08-12, founder ①) ───────────────────
  venue_catering: {
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

// ARC OB: the `videography: 'photography'` entry RETIRED WITH ITS READER.
// `videography` is no longer a token normaliseCategory can return — the merge is
// resolved one layer up, in the alias table — so this map had become unreachable
// code pretending to be a rule. Kept as an empty, explained map rather than
// deleted, because profileFor's `if (ALIASES[key])` branch is the seam the next
// profile merge will use.
const ALIASES = {};

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

// ── CE-45 ELZ-1 cut 1 · WHAT A GOOD FRONT DESK ASKS, PER TRADE (R-45.26(2); the founder's tables (a2) and the addendum) ──────
// MATERIAL FOR THE COUPLE PROMPT ONLY, AND KEPT OUT OF PROFILES ON PURPOSE. profileFor() is read by occupancy.js (capacity is keyed
// on profile.key), vendorCard.js, me.js and three benches; giving hairstylist, performer, planning and content_creator a PROFILE
// would move their key off 'other' and change capacity and labels in rooms this sitting does not own. So the couple's questions
// live here, read by coupleSystemPrompt.js alone, and profileFor() is byte-identical.
// UNDERSTANDING, NOT A SCRIPT (R-45.26): Eliza reads the vendor's own trade text and picks what fits; the lines are the register
// a good front desk writes in, asked one at a time, skipping anything the client already said. The occasion is asked first;
// the wedding list is used only when the occasion is a wedding. `notes` name trades folded under one token (the estate folds
// choreographers, bands, singers, DJs and anchors into performer; caterers into venue_catering; mehendi, invitations and
// transport into other), so the agent can tell them apart by the vendor's own words.
// `made`: null for trades that come to the event (the opening asks "when is it"); a noun for trades that make something ahead of
// time (the opening asks "by when do you need the {made}", the founder's cure for "when do you need it").
const COUPLE_ASKS = Object.freeze({
  photography: { made: null,
    wedding: ['is it one day, or spread across functions like mehendi, sangeet and reception', 'photos, video, or both'],
    general: ['photos, video, or both', 'roughly how many hours they need the studio for'] },
  makeup: { made: null,
    wedding: ['which functions need makeup', 'just the bride, or family too'],
    general: ['how many people need makeup', 'what look they are going for'] },
  hairstylist: { made: null,
    wedding: ['which functions need hair done', 'just the bride, or family too'],
    general: ['how many people need hair done', 'what look they are going for'] },
  designer: { made: 'outfit',
    wedding: ['what kind of outfit: a lehenga, gown, sherwani', 'custom-made or ready pieces'],
    general: ['what kind of outfit they have in mind', 'custom-made or ready pieces'] },
  jewellery: { made: 'jewellery',
    wedding: ['a single piece or a full set', 'gold, polki, kundan, diamond or temple'],
    general: ['a single piece or a full set', 'gold, polki, kundan, diamond or temple'] },
  decor: { made: null,
    wedding: ['which functions need decor, and where', 'the mood they are dreaming of, in their own words'],
    general: ['where it is, and roughly how many guests', 'the mood they are dreaming of, in their own words'] },
  venue_catering: { made: null,
    wedding: ['which functions they are considering the venue for', 'roughly how many guests'],
    general: ['roughly how many guests', 'whether they would like to come and see the space'],
    notes: ['A CATERER (the trade text says catering, caterer, food or similar) asks instead: for a wedding, which functions are being catered and roughly how many guests, then veg, non-veg or both; otherwise, roughly how many guests, then veg, non-veg or both. A caterer never offers a visit to "the space".'] },
  planning: { made: null,
    wedding: ['is it one day or spread across functions, and roughly how many guests', 'full planning, or help on the day'],
    general: ['roughly how many guests, and whether they have a venue yet', 'full planning, or help on the day'] },
  performer: { made: null,
    wedding: ['which function it is for', 'how long they would like the performance, and roughly how many guests'],
    general: ['how long they would like the performance, and roughly how many guests', 'where it is'],
    notes: ['A CHOREOGRAPHER (the trade text says choreographer, choreography, dance teacher or similar) asks instead: for a wedding, which function the performance is for, then how many people are dancing and how many songs; otherwise, how many people are dancing and how many songs, then how many weeks they have to practise.'] },
  content_creator: { made: null,
    wedding: ['which functions they want covered', 'reels only, or reels and stories too'],
    general: ['reels only, or reels and stories too', 'roughly how many reels they are thinking of'] },
  other: { made: null,
    wedding: ['what they are looking for from the studio', 'which functions and dates it is for'],
    general: ['what they are looking for from the studio', 'where it is'],
    notes: [
      'A MEHENDI ARTIST asks: for a wedding, which function the mehendi is for, then just the bride or family and guests too; otherwise, how many people need mehendi, then simple designs or detailed.',
      'AN INVITATION MAKER opens with "by when do you need the invitations" and asks: printed, digital, or both, then roughly how many.',
    ] },
});
// TOTAL: never throws; an unknown or missing category reads the 'other' material.
function coupleAsksFor(category) {
  try {
    const { normaliseCategory } = require('./categoryFraming');
    const key = normaliseCategory(category);
    return { key, ...(COUPLE_ASKS[key] || COUPLE_ASKS.other) };
  } catch (_e) { return { key: 'other', ...COUPLE_ASKS.other }; }
}

module.exports = { profileFor, PROFILES, ALIASES, COUPLE_ASKS, coupleAsksFor };
