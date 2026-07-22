// src/lib/vendor/collabItems.js
// TDW_04.5 · P4 — the collab post's ITEM layer. ONE home for two things the
// estate must never grow a second copy of:
//
//   1. THE WRAP (CE ruling F3, wrap-on-read). A legacy post has no
//      collab_post_items rows. Its `requirement_type` column is NOT NULL
//      (0048_collab.sql:15-22, witnessed at PUBLIC_SCHEMA collab_posts ord 3),
//      so every legacy post already carries exactly one requirement. We
//      SYNTHESIZE that one item on read. Nothing is backfilled; legacy rows stay
//      byte-untouched. The enumerated reader set is three files, so the wrap
//      having one home is provable, not hoped.
//
//   2. THE APPENDIX A MAP (spec §P4.5 / Appendix A:107) — function kind →
//      requirement_type for the gap-pip prefill. Spec: "map lives in one
//      exported const."
//
// STORAGE vs DISCOVERY (CE ruling F4, as AMENDED at read-first Part 2):
//   storage   — collab_posts.requirement_type = items[0].requirement_type.
//               NOT NULL is satisfied; legacy semantics preserved.
//   discovery — the feed matches a viewer's category against ANY item, falling
//               through to the post column when the post has no items rows.
//               The original F4 would have made items 2..8 invisible to their
//               own categories: `collab.js:66`'s `.eq('requirement_type',
//               me.category)` filters the POST column. Caught by the census.
'use strict';

// The 16 categories, verbatim from 0048_collab.sql:15-22 — the same CHECK list
// carried by collab_posts.requirement_type and collab_post_items.requirement_type.
const REQUIREMENT_TYPES = Object.freeze([
  'photography', 'videography', 'makeup', 'mehendi',
  'decor', 'catering', 'venue', 'music_dj', 'music_live',
  'choreography', 'planning', 'transport', 'invitations',
  'jewellery', 'attire', 'other',
]);

const MAX_ITEMS = 8;
const MIN_ITEMS = 1;

// ── Appendix A (spec :107) ───────────────────────────────────────────────────
// A string  = one prefilled chip.
// An array  = the two-chip ASK (spec: "makeup or attire (ask, two-chip choice)").
// null      = no prefill, deliberately (other / blocked).
const KIND_TO_REQUIREMENT = Object.freeze({
  shoot:    'photography',
  ceremony: 'planning',
  fitting:  ['makeup', 'attire'],
  trial:    ['makeup', 'attire'],
  recce:    'venue',
  social:   'music_dj',
  other:    null,
  blocked:  null,
});

/** The gap pip's prefill. Unknown kinds prefill nothing rather than guessing. */
function requirementForKind(kind) {
  if (!kind) return null;
  const hit = KIND_TO_REQUIREMENT[String(kind).toLowerCase()];
  return hit === undefined ? null : hit;
}

/**
 * THE WRAP. Given a post row and whatever collab_post_items rows exist for it,
 * return the item list a reader should see — ALWAYS at least one.
 *
 * Legacy post (no rows) → one synthesized item carrying the post's own
 * requirement_type, a null id, and `wrapped: true` so a caller can tell a
 * synthesized item from a stored one without guessing.
 */
function itemsForPost(post, itemRows) {
  const rows = Array.isArray(itemRows) ? itemRows : [];
  if (rows.length === 0) {
    if (!post || !post.requirement_type) return [];
    return [{
      id:                    null,
      post_id:               post.id ?? null,
      position:              0,
      requirement_type:      post.requirement_type,
      note:                  null,
      filled_by_response_id: null,
      wrapped:               true,
    }];
  }
  return rows
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(r => ({
      id:                    r.id,
      post_id:               r.post_id,
      position:              r.position ?? 0,
      requirement_type:      r.requirement_type,
      note:                  r.note ?? null,
      filled_by_response_id: r.filled_by_response_id ?? null,
      wrapped:               false,
    }));
}

/** Group a flat collab_post_items result by post_id. */
function groupItemsByPost(itemRows) {
  const byPost = new Map();
  for (const r of (itemRows || [])) {
    if (!byPost.has(r.post_id)) byPost.set(r.post_id, []);
    byPost.get(r.post_id).push(r);
  }
  return byPost;
}

/**
 * DISCOVERY (F4 amended). Does this post reach a vendor of `category`?
 * Reads the item list — which is the wrap, so legacy posts answer on their own
 * column and behave exactly as they did before this sitting.
 */
function postMatchesCategory(post, itemRows, category) {
  if (!category) return false;
  return itemsForPost(post, itemRows).some(i => i.requirement_type === category);
}

/** Every item filled ⇒ the post is done. Drives the auto-close (spec §P4.1). */
function allItemsFilled(post, itemRows) {
  const items = itemsForPost(post, itemRows);
  if (items.length === 0) return false;
  return items.every(i => !!i.filled_by_response_id);
}

/**
 * Validate and normalise a create payload's items.
 * Returns { ok:true, items:[{requirement_type, note, position}] } or
 * { ok:false, error }. Position is assigned here and ONLY here, so items[0] —
 * which the post's own requirement_type column mirrors — is deterministic.
 * (CE-ratified widening: collab_post_items.position + unique(post_id, position).)
 */
function normaliseItemsInput(body) {
  const raw = Array.isArray(body?.items) ? body.items : null;

  // Legacy single-type create keeps working, unchanged, forever.
  if (!raw) {
    if (!body?.requirement_type) return { ok: false, error: 'requirement_type or items required' };
    if (!REQUIREMENT_TYPES.includes(body.requirement_type)) {
      return { ok: false, error: 'Unknown requirement_type' };
    }
    return { ok: true, items: [{ requirement_type: body.requirement_type, note: null, position: 0 }] };
  }

  if (raw.length < MIN_ITEMS || raw.length > MAX_ITEMS) {
    return { ok: false, error: `items must hold between ${MIN_ITEMS} and ${MAX_ITEMS} entries` };
  }

  const items = [];
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i]?.requirement_type;
    if (!t || !REQUIREMENT_TYPES.includes(t)) {
      return { ok: false, error: `items[${i}].requirement_type is missing or unknown` };
    }
    const note = raw[i]?.note ?? null;
    if (note && String(note).length > 200) {
      return { ok: false, error: `items[${i}].note must be 200 characters or less` };
    }
    items.push({ requirement_type: t, note: note || null, position: i });
  }
  return { ok: true, items };
}

module.exports = {
  REQUIREMENT_TYPES,
  KIND_TO_REQUIREMENT,
  MAX_ITEMS,
  MIN_ITEMS,
  requirementForKind,
  itemsForPost,
  groupItemsByPost,
  postMatchesCategory,
  allItemsFilled,
  normaliseItemsInput,
};
