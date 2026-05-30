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
// Category keys MUST match src/agent/categories.js (VENDOR_CATEGORIES).

// What a quoted price "depends on", per category. Used to build the caveat.
const PRICE_DEPENDS_ON = {
  photography:  'the number of events and how much coverage you need',
  videography:  'the number of events, coverage, and the kind of film you want',
  makeup:       'the number of people and functions, and whether trials are included',
  mehendi:      'the number of people and the intricacy of the designs',
  decor:        'the scale of the setup, the venue, and the number of functions',
  catering:     'the final guest count and the menu you choose',
  venue:        'the dates, the number of guests, and which spaces you need',
  music_dj:     'the number of events and the hours of performance',
  music_live:   'the number of events, the line-up, and performance hours',
  choreography: 'the number of performances and rehearsal sessions',
  planning:     'the scope of work and how many functions you need managed',
  transport:    'the vehicles, distance, and number of days',
  invitations:  'the quantity, the design, and the finish you choose',
  jewellery:    'the pieces you choose, the materials, and any customisation',
  designer:     'the outfits, the fabrics, and how much customisation you want',
  other:        'your specific requirements',
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
const OFFERING_NOUN = {
  photography:  'the photography',
  videography:  'the films',
  makeup:       'the makeup',
  mehendi:      'the mehendi',
  decor:        'the decor',
  catering:     'the catering',
  venue:        'the venue',
  music_dj:     'the music',
  music_live:   'the performance',
  choreography: 'the choreography',
  planning:     'the planning',
  transport:    'the transport',
  invitations:  'the invitations',
  jewellery:    'the pieces',
  designer:     'the outfits',
  other:        'the work',
};

function offeringNoun(category) {
  const key = normaliseCategory(category);
  return OFFERING_NOUN[key] || OFFERING_NOUN.other;
}

// Vendor.category is free text; normalise loosely to a known key.
function normaliseCategory(category) {
  if (!category) return 'other';
  const c = String(category).toLowerCase().trim();
  if (PRICE_DEPENDS_ON[c]) return c;               // exact canonical key
  // loose contains-match for free-text values
  if (c.includes('photo')) return 'photography';
  if (c.includes('video') || c.includes('cinema') || c.includes('film')) return 'videography';
  if (c.includes('makeup') || c.includes('mua') || c.includes('beauty')) return 'makeup';
  if (c.includes('mehendi') || c.includes('mehndi') || c.includes('henna')) return 'mehendi';
  if (c.includes('decor') || c.includes('floral') || c.includes('flower')) return 'decor';
  if (c.includes('cater') || c.includes('food')) return 'catering';
  if (c.includes('venue') || c.includes('banquet') || c.includes('resort') || c.includes('hall')) return 'venue';
  if (c.includes('dj')) return 'music_dj';
  if (c.includes('band') || c.includes('singer') || c.includes('music')) return 'music_live';
  if (c.includes('choreo') || c.includes('dance')) return 'choreography';
  if (c.includes('plan') || c.includes('coordinat')) return 'planning';
  if (c.includes('transport') || c.includes('car')) return 'transport';
  if (c.includes('invit') || c.includes('card') || c.includes('stationery')) return 'invitations';
  if (c.includes('jewel')) return 'jewellery';
  if (c.includes('attire') || c.includes('lehenga') || c.includes('outfit') || c.includes('cloth') || c.includes('designer') || c.includes('couture') || c.includes('sherwani') || c.includes('gown') || c.includes('saree') || c.includes('boutique')) return 'designer';
  return 'other';
}

module.exports = { framingFor, offeringNoun, normaliseCategory, PRICE_DEPENDS_ON };
