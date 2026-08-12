// ─────────────────────────────────────────────────────────────────────────────
// src/agent/categories.js
// Locked vendor category taxonomy for dream-os.
//
// ARC OB · THE TAXONOMY CHARTER (CE-32, 2026-08-12). The 16 became ELEVEN on
// the founder's five words: venue+catering = one · performer = one · photo+video
// = one · content creator is new (and hairstylist splits out of makeup) ·
// everything else folds into `other`.
//
// ⚠ THIS LIST IS A DB CONSTRAINT. The old header here said "No migration needed
//   — this is code-only, not a DB constraint." THAT WAS FALSE FROM 0048 ONWARD
//   and it is the sentence that mispriced this sitting's kickoff as no-DDL.
//   `collab_posts.requirement_type` (0048:17) and `collab_post_items.
//   requirement_type` (0096:11) carry a CHECK over these tokens, and
//   `collabItems.postMatchesCategory` compares them to `vendors.category` by RAW
//   EQUALITY. Retire a token here without moving the CHECK and a whole craft's
//   collab feed goes silently empty. Migration 0123 moved both CHECKs to this
//   list. THE NEXT PERSON WHO EDITS THIS ARRAY OWES A MIGRATION.
//   Readers of this list, all of which now import rather than copy:
//     · src/lib/vendor/categoryFraming.js   — normaliseCategory's membership pass
//     · src/lib/vendor/collabItems.js       — REQUIREMENT_TYPES
//     · src/api/vendor/onboarding.js        — the 400's allowed[]
//     · src/api/vendor/auth.js              — the signup door (was a shadow six)
//     · src/api/vendor/categoryPreset.js    — Codex routing (was a shadow six)
//     · src/agent/onboarding.js             — the Haiku extractor's allowed list
//   `vendors.category` itself is still free text; the door and the extractor are
//   what hold it to this list.
//
// LABELS ARE NOT TOKENS. The founder's display labels (Event Planner ·
// Photography & Videography · venue and catering · performer (Anchor, DJ,
// Choreography) · Content Creator · …) never enter the DB — 0122's SET-A
// doctrine. The picker builds its labels from this list, never from a hardcoded
// copy (F-04.36's class). These are machine values only.
// ─────────────────────────────────────────────────────────────────────────────

const VENDOR_CATEGORIES = [
  'planning',         // wedding planners, event managers, coordinators [Event Planner]
  'designer',         // bridal wear, lehenga, sherwani, clothing rental, couture
  'photography',      // photographers AND videographers — merged 2026-08-12 (founder ③)
  'makeup',           // makeup artists, MUAs, bridal makeup
  'hairstylist',      // hair stylists — split out of makeup 2026-08-12 (founder's eleven)
  'jewellery',        // jewellery designers, rental jewellery
  'decor',            // decorators, florists, floral decor, mandap decor (florist merged 2026-05-15)
  'venue_catering',   // venues, banquet halls, farmhouses, resorts AND caterers — merged (founder ①)
  'performer',        // anchors, DJs, live music, choreography — merged (founder ②)
  'content_creator',  // reels, UGC, wedding content creators — new (founder ④)
  'other',            // mehendi, transport, invitations, and anything else (founder ⑤)
];

// The alias table is NOT here. It is homed beside `normaliseCategory` in
// src/lib/vendor/categoryFraming.js (CE-32, fork 3) and imports this array so
// ONE list rules membership. `CATEGORY_ALIASES` no longer exists in this module;
// its only importer (src/agent/onboarding.js) never read it.

module.exports = { VENDOR_CATEGORIES };
