// ─────────────────────────────────────────────────────────────────────────────
// src/agent/brideAesthetics.js
// Locked aesthetic taxonomy for bride-side Muse mood boards.
//
// 12 values. Used by:
//   - Image pipeline (src/lib/imagePipeline.js) — tags every Muse save
//   - Surprise Me (B4) — matches bride taste profile against vendor portfolios
//   - Discover (Session 9) — vendor profile aesthetic matching
//   - Bride PWA (Sessions 11-12) — filter chips, taste profile rendering
//
// To add/remove values: update BRIDE_AESTHETIC_TAGS and BRIDE_AESTHETIC_DESCRIPTIONS.
// No DB migration needed — muse_saves.aesthetic_tags is jsonb (free-form array).
// This taxonomy enforces consistency at the application layer via the Haiku
// tagging prompt composed in composeAestheticPrompt().
//
// MIRRORS PATTERN: src/agent/categories.js (vendor side, 16 locked categories).
// ─────────────────────────────────────────────────────────────────────────────

const BRIDE_AESTHETIC_TAGS = [
  'moody',
  'editorial',
  'pastel',
  'OTT',
  'minimal',
  'candid',
  'grand',
  'rustic',
  'modern',
  'ethnic',
  'elegant',
  'old money',
];

// Short descriptions help Haiku understand each tag's meaning when it
// classifies an image. Keep these tight — the prompt is cost-sensitive.
const BRIDE_AESTHETIC_DESCRIPTIONS = {
  'moody':     'dark, dramatic, low-light, rich shadow, cinematic. Think candlelit, twilight, deep jewel tones.',
  'editorial': 'magazine-shoot polish, posed, high-fashion styling, strong composition. Vogue-coded.',
  'pastel':    'soft, light, dreamy palette — blush, mint, ivory, dusty rose, lavender.',
  'OTT':       'maximalist, opulent, loud, layered — heavy decor, lots of color, embellished, "the works".',
  'minimal':   'pared-back, clean lines, restrained palette, lots of negative space. Quiet.',
  'candid':    'unposed, real-moment energy — laughter, movement, in-between shots. Not styled.',
  'grand':     'large-scale, formal, palatial, awe-inducing — pillars, chandeliers, sweeping vistas.',
  'rustic':    'natural, organic, outdoor, raw textures — wood, stone, foliage, earthy tones.',
  'modern':    'contemporary lines, current trends, sleek finishes, fashion-forward.',
  'ethnic':    'traditional Indian craft — kanjivaram, temple jewellery, kalamkari, banarasi, heritage motifs.',
  'elegant':   'refined, understated sophistication — confident restraint, quiet luxury, considered.',
  'old money': 'heritage glamour, generational wealth coding — mid-century, Sabyasachi heritage, Ralph Lauren energy, deeply timeless.',
};

// ── composeAestheticPrompt ───────────────────────────────────────────────────
// Builds the Haiku prompt for tagging a single image given Vision's output.
//
// visionLabels : array of { description: string, score: number }
//                Vision LABEL_DETECTION results, sorted by confidence
// visionColors : array of { color: {red,green,blue}, score: number, pixelFraction: number }
//                Vision IMAGE_PROPERTIES dominant colors
//
// Returns a string prompt. Haiku is expected to reply with a JSON array of
// 1-3 tag strings drawn from BRIDE_AESTHETIC_TAGS.

function composeAestheticPrompt(visionLabels, visionColors) {
  // Top 10 labels by confidence — more than that adds noise without signal
  const topLabels = (visionLabels || [])
    .slice(0, 10)
    .map(l => `${l.description} (${Math.round(l.score * 100)}%)`)
    .join(', ');

  // Top 5 dominant colors as readable RGB triples
  const topColors = (visionColors || [])
    .slice(0, 5)
    .map(c => {
      const r = Math.round(c.color?.red   ?? 0);
      const g = Math.round(c.color?.green ?? 0);
      const b = Math.round(c.color?.blue  ?? 0);
      const pct = Math.round((c.pixelFraction ?? 0) * 100);
      return `rgb(${r},${g},${b}) ${pct}%`;
    })
    .join(', ');

  // Taxonomy block — listed with short descriptions so Haiku grounds correctly
  const taxonomyBlock = BRIDE_AESTHETIC_TAGS
    .map(tag => `- ${tag}: ${BRIDE_AESTHETIC_DESCRIPTIONS[tag]}`)
    .join('\n');

  return `You are tagging a wedding mood-board image for an Indian bride's planning app.

Google Vision detected these labels in the image:
${topLabels || '(no labels)'}

Dominant colors:
${topColors || '(no color data)'}

Choose 1 to 3 aesthetic tags from this fixed taxonomy that best describe the image:

${taxonomyBlock}

Rules:
- Pick only from the 12 tags above. Never invent new tags.
- Use lower case exactly as written, including the space in "old money".
- 1 tag if the image is dominantly one aesthetic; 2-3 if it genuinely blends.
- Do NOT include explanations, reasoning, or any text outside the JSON.

Reply with ONLY a JSON array, like:
["moody","editorial"]
or
["pastel"]
or
["ethnic","grand","OTT"]`;
}

// ── isValidTag ────────────────────────────────────────────────────────────────
// Used by callers to filter Haiku's output against the locked taxonomy.
// Haiku occasionally invents tags or uses wrong casing — this is the guard.

function isValidTag(tag) {
  return typeof tag === 'string' && BRIDE_AESTHETIC_TAGS.includes(tag);
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  BRIDE_AESTHETIC_TAGS,
  BRIDE_AESTHETIC_DESCRIPTIONS,
  composeAestheticPrompt,
  isValidTag,
};
