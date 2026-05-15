// ─────────────────────────────────────────────────────────────────────────────
// src/agent/categories.js
// Locked vendor category taxonomy for dream-os.
// Used by smart onboarding to normalise vendor self-descriptions.
//
// To add/remove categories: update VENDOR_CATEGORIES and CATEGORY_ALIASES.
// No migration needed — this is code-only, not a DB constraint.
// The DB column vendors.category is free text; this taxonomy enforces
// consistency at the application layer via the Haiku extractor prompt.
// ─────────────────────────────────────────────────────────────────────────────

const VENDOR_CATEGORIES = [
  'photography',    // photographers, candid shooters
  'videography',    // videographers, cinematographers, film makers
  'makeup',         // makeup artists, MUAs, bridal makeup, hair and makeup
  'mehendi',        // mehendi artists, henna artists
  'decor',          // decorators, event decorators, floral decorators
  'catering',       // caterers, food and beverage, chefs
  'venue',          // venue owners, banquet halls, farmhouses, resorts
  'florist',        // florists, flower arrangers (standalone, not decor)
  'music_dj',       // DJs, sound systems
  'music_live',     // live bands, singers, musicians, classical performers
  'choreography',   // choreographers, dance trainers
  'planning',       // wedding planners, event managers, coordinators
  'transport',      // car rentals, horse/buggy, vintage cars, baraat
  'invitations',    // invitation designers, stationery, printing
  'jewellery',      // jewellery designers, rental jewellery
  'attire',         // bridal wear, lehenga, sherwani, clothing rental
  'other',          // anything that genuinely doesn't fit above
];

// Common aliases vendors use — helps the Haiku prompt map edge cases.
// This is documentation for the prompt, not used in code directly.
const CATEGORY_ALIASES = {
  'photography':  ['photographer', 'candid', 'shooter', 'photog'],
  'videography':  ['videographer', 'cinematographer', 'filmmaker', 'films'],
  'makeup':       ['mua', 'makeup artist', 'bridal makeup', 'hair and makeup', 'hair & makeup', 'beauty'],
  'mehendi':      ['henna', 'mehendi artist', 'mehndi'],
  'decor':        ['decorator', 'decoration', 'event decor', 'floral decor', 'theme decor', 'mandap decor'],
  'catering':     ['caterer', 'food', 'chef', 'hospitality', 'f&b'],
  'venue':        ['banquet', 'hall', 'farmhouse', 'resort', 'hotel', 'lawn'],
  'music_dj':     ['dj', 'disc jockey', 'sound', 'emcee', 'mc'],
  'music_live':   ['band', 'singer', 'musician', 'live music', 'performer', 'classical'],
  'choreography': ['choreographer', 'dance', 'sangeet choreography'],
  'planning':     ['planner', 'coordinator', 'event manager', 'wedding manager'],
  'transport':    ['car rental', 'vintage car', 'horse', 'buggy', 'baraat'],
  'invitations':  ['invitation', 'card', 'stationery', 'printing', 'digital invite'],
  'jewellery':    ['jewellery', 'jewelry', 'jewels', 'rental jewellery'],
  'attire':       ['bridal wear', 'lehenga', 'sherwani', 'clothing', 'outfit', 'fashion'],
};

module.exports = { VENDOR_CATEGORIES, CATEGORY_ALIASES };
