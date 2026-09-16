'use strict';
// src/lib/vendor/packageSeedParse.js
//
// TDW · CE-43 · LC-2 · packet 1 · THE SEED SOURCE, READ ONE WAY.
//
// db/seeds/package_seeds.source.txt is the founder-vetoed block (R-43.10), byte for
// byte. db/seeds/package_seeds.json is DERIVED from it by tools/lc2_seed_json.js,
// which calls parseSeedSource below. The bench b81 re-parses the source and asserts
// the committed JSON equals the parse, so the JSON can never drift from the vetoed
// bytes without a red. Runtime never parses; it reads the JSON (packageSeeds.js).
//
// No byte of copy is rewritten here except the name's case (C-43.15); `source_name`
// carries the vetoed bytes beside it. The vendor renames freely after seeding (R-43.3).
//
// RULINGS CARRIED (CE-43 interim ruling on LC-2 read-first part 1, 2026-09-17):
//   · defaults (F-43.54): the middle option of every three-option section;
//     Venue & Catering → "VENUE AND CATERING, ONE FUNCTION"; Something else →
//     "ONE FUNCTION"; Performer → no default.
//   · delivery basis (F-43.51) comes from the section's own "Delivery date" line,
//     never from contractAnnex.js TRADE_DEFAULTS.

// ── THE TAXONOMY IS IMPORTED, NEVER SPELLED HERE (bOB 6.1, F-OB.3's class) ──
// The vetoed block's eleven sections run in the estate taxonomy's order. The map from
// section title to category token is DERIVED by position from the canonical list
// (src/agent/categories.js, VENDOR_CATEGORIES), so no token is typed in this file and a
// taxonomy that moves without the seed moving throws at load rather than seeding the
// wrong trade. F-43.72: the first cut spelled all eleven and the floor caught it.
const { VENDOR_CATEGORIES } = require('../../agent/categories');

const SECTION_TITLES = Object.freeze([
  'EVENT PLANNER',
  'DESIGNER',
  'PHOTOGRAPHY & VIDEOGRAPHY',
  'MAKE UP ARTIST',
  'HAIRSTYLIST',
  'JEWELLERY',
  'DECOR',
  'VENUE & CATERING',
  'PERFORMER (ANCHOR, DJ, CHOREOGRAPHY)',
  'CONTENT CREATOR',
  'SOMETHING ELSE',
]);
if (SECTION_TITLES.length !== VENDOR_CATEGORIES.length) {
  throw new Error(`seed: ${SECTION_TITLES.length} sections against ${VENDOR_CATEGORIES.length} categories`);
}
const SECTION_TO_CATEGORY = Object.freeze(
  Object.fromEntries(SECTION_TITLES.map((t, i) => [t, VENDOR_CATEGORIES[i]])),
);

// Ruled default per SECTION (F-43.54), by option NAME as it stands in the source.
// null = no default (the performer section). A miss throws.
const DEFAULT_BY_SECTION = Object.freeze({
  'EVENT PLANNER': 'PARTIAL PLANNING',
  'DESIGNER': 'ONE OUTFIT MADE TO ORDER',
  'PHOTOGRAPHY & VIDEOGRAPHY': 'PHOTOGRAPHS AND FILM',
  'MAKE UP ARTIST': 'BRIDE, EVERY FUNCTION WITH A TRIAL',
  'HAIRSTYLIST': 'BRIDE, EVERY FUNCTION WITH A TRIAL',
  'JEWELLERY': 'RENTAL SETS, EVERY FUNCTION',
  'DECOR': 'MAIN FUNCTIONS',
  'VENUE & CATERING': 'VENUE AND CATERING, ONE FUNCTION',
  'PERFORMER (ANCHOR, DJ, CHOREOGRAPHY)': null,
  'CONTENT CREATOR': 'WEDDING DAY WITH SAME-DAY REELS',
  'SOMETHING ELSE': 'ONE FUNCTION',
});

// The seed's schedule is the same for every option: 30 on booking, 30 one month
// before (on), the remainder on delivery. Asserted against the line, not assumed.
// C-43.15 (CE-43, 2026-09-17) · NAMES RENDER IN SENTENCE CASE. The source keeps the
// vetoed capitals byte for byte; only the NAME field is normalised here, at parse.
// The ruling read "first letter capital, rest as written"; on an all-capitals source
// that literal reading changes nothing, so the rest is lower-cased (the ruling's stated
// intent, reported at the packet 1 cut). KEEP_UPPER holds the words that are acronyms
// in the vetoed names, derived by reading all 33: DJ alone.
const KEEP_UPPER = Object.freeze(['DJ']);
function sentenceCase(name) {
  const lower = String(name).toLowerCase();
  const kept = lower.replace(/[a-z]+/g, (w) => (KEEP_UPPER.includes(w.toUpperCase()) ? w.toUpperCase() : w));
  return kept.charAt(0).toUpperCase() + kept.slice(1);
}

const SCHEDULE_PREFIX =
  'Deposit, 30% of the fee, on booking · 30% one month before the first function (optional) · The remainder, on delivery, before the work is handed over';

function deliveryFromLine(text) {
  if (text === 'the event date') return { delivery_basis: 'on_the_day', delivery_days: null };
  if (text === 'the handover date, before the wedding') return { delivery_basis: 'handover', delivery_days: null };
  const m = /^(\d+) days after the last function$/.exec(text);
  if (m) return { delivery_basis: 'days', delivery_days: Number(m[1]) };
  throw new Error(`seed: unrecognised delivery line: ${JSON.stringify(text)}`);
}

function parseSeedSource(src) {
  const lines = String(src).split('\n');
  const categories = [];
  let cur = null;
  let opt = null;
  let pendingName = null; // an ALL-CAPS line waiting to see whether a description follows

  const headRe = /^═══ (\d+) · (.+?) · founder's answer: YES \(chair, R-43\.10\) 2026-09-17 ═══$/;
  for (const line of lines) {
    const h = headRe.exec(line);
    if (h) {
      const title = h[2];
      const category = SECTION_TO_CATEGORY[title];
      if (!category) throw new Error(`seed: unknown section title ${JSON.stringify(title)}`);
      cur = { category, section: Number(h[1]), title, schedule_line: null, delivery_line: null, options: [] };
      categories.push(cur);
      opt = null; pendingName = null;
      continue;
    }
    if (!cur) continue;
    if (line.startsWith('Schedule (every option): ')) {
      cur.schedule_line = line.slice('Schedule (every option): '.length);
      opt = null;
      continue;
    }
    if (line.startsWith('Delivery date: ')) {
      cur.delivery_line = line.slice('Delivery date: '.length);
      continue;
    }
    if (line.startsWith('  ')) {
      if (!opt) throw new Error(`seed: line item outside an option: ${JSON.stringify(line)}`);
      const body = line.slice(2);
      const i = body.indexOf(': ');
      if (i <= 0) throw new Error(`seed: line item without "label: detail": ${JSON.stringify(line)}`);
      opt.line_items.push({ label: body.slice(0, i), detail: body.slice(i + 2) });
      continue;
    }
    if (line === '') { pendingName = null; continue; }
    if (pendingName !== null) {
      opt = { name: pendingName, description: line, line_items: [] };
      cur.options.push(opt);
      pendingName = null;
      continue;
    }
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) { pendingName = line; opt = null; continue; }
    throw new Error(`seed: unexpected line: ${JSON.stringify(line)}`);
  }

  return categories.map((c) => {
    if (!c.schedule_line || !c.schedule_line.startsWith(SCHEDULE_PREFIX)) {
      throw new Error(`seed: ${c.category} schedule line does not carry the ruled wording`);
    }
    if (!c.delivery_line) throw new Error(`seed: ${c.category} has no delivery line`);
    const delivery = deliveryFromLine(c.delivery_line);
    const def = DEFAULT_BY_SECTION[c.title];
    if (def !== null && !c.options.some((o) => o.name === def)) {
      throw new Error(`seed: ${c.category} ruled default ${JSON.stringify(def)} is not an option`);
    }
    return {
      category: c.category,
      section: c.section,
      title: c.title,
      schedule_line: c.schedule_line,
      delivery_line: c.delivery_line,
      delivery_basis: delivery.delivery_basis,
      delivery_days: delivery.delivery_days,
      deposit_pct: 30,
      middle_pct: 30,
      middle_enabled: true,
      options: c.options.map((o, idx) => ({
        seed_key: `${c.category}:${idx + 1}`,
        name: sentenceCase(o.name),
        source_name: o.name,
        description: o.description,
        line_items: o.line_items,
        is_default: def !== null && o.name === def,
      })),
    };
  });
}

module.exports = { parseSeedSource, sentenceCase, KEEP_UPPER, SECTION_TITLES, SECTION_TO_CATEGORY, DEFAULT_BY_SECTION, SCHEDULE_PREFIX };
