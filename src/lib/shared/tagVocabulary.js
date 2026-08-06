// src/lib/shared/tagVocabulary.js — THE ONE VOCABULARY HOME (dream-os MIRROR).
//
// TDW_09 PACKAGE 2 · PHASE B · F-5 = (a) · lists FOUNDER-VETOED WHOLE (relay #5).
//
// ═══ THIS FILE IS A BOUND MIRROR — F-06.98's precedent, BOTH DIRECTIONS ═══
// SOURCE: dreamos-pwa `lib/shared/tagVocabulary.ts` (its header names this
// mirror back). The pwa PARITY CELL (`scripts/tdw09_p2b_vocab.proof.mjs`,
// pwa repo) is THE ARBITER: it reads both repos side-by-side and asserts the
// ten lists equal term-for-term, order included. EDITING THIS FILE WITHOUT THE
// PWA TWIN — or the twin without this — is exactly the red that cell throws.
// The in-repo cell here (`scripts/tdw09_p2b_vocab_os.proof.mjs`) guards these
// lists against local drift when the repos are apart.
//
// CONSUMERS (this side): src/api/vendor/me.js normalises aesthetic_tags at the
// WRITE door; src/api/couple/discover.js normalises the vibes param at the
// FILTER door before `.overlaps`. Tolerate-on-read, NEVER backfill: stored rows
// are not rewritten in bulk — comparisons normalise their own side and a row
// corrects itself on the vendor's next save.

const TAG_VOCABULARY = {
  photography:  ['candid', 'documentary', 'editorial', 'film', 'fine-art', 'moody', 'traditional', 'destination', 'intimate', 'luxury'],
  makeup:       ['dewy', 'matte', 'bridal-classic', 'contemporary', 'minimal', 'glam', 'airbrush', 'HD', 'south-indian', 'north-indian'],
  decor:        ['floral', 'minimal', 'royal', 'rustic', 'contemporary', 'traditional', 'destination', 'boho', 'opulent', 'pastel'],
  catering:     ['north-indian', 'south-indian', 'continental', 'pan-asian', 'live-counters', 'vegetarian', 'jain', 'fusion', 'street-food', 'plated'],
  venue:        ['palace', 'resort', 'farmhouse', 'banquet', 'beach', 'garden', 'heritage', 'rooftop', 'destination', 'intimate'],
  mehndi:       ['bridal', 'arabic', 'rajasthani', 'minimal', 'contemporary', 'portrait', 'glitter', 'traditional'],
  choreography: ['sangeet', 'couple', 'family', 'bollywood', 'classical', 'contemporary', 'flashmob'],
  music:        ['dj', 'live-band', 'classical', 'sufi', 'ghazal', 'folk', 'bollywood', 'qawwali'],
  planning:     ['full-service', 'day-of', 'destination', 'intimate', 'large-format', 'luxury'],
  // `other` — free entry only; no vocabulary, and it should not pretend to.
};

/** trim + Unicode case-fold. The ONE normal form, write-side and filter-side. */
function normalizeTag(tag) {
  return String(tag ?? '').trim().toLowerCase();
}

/** Normalise, drop empties, dedupe first-wins (order preserved). */
function normalizeTags(tags) {
  const out = [];
  for (const t of Array.isArray(tags) ? tags : []) {
    const n = normalizeTag(t);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

function vocabularyFor(category) {
  if (!category) return null;
  return TAG_VOCABULARY[normalizeTag(category)] ?? null;
}

module.exports = { TAG_VOCABULARY, normalizeTag, normalizeTags, vocabularyFor };
