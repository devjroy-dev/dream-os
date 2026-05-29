// src/agent/datePrecision.js
// Patch 8d — model-agnostic guardrail for month-only / year-only wedding dates.
//
// Background: both Haiku (WhatsApp engine) and Sonnet (PWA engine) keep
// converting "July 2026" or "December" to "2026-07-01" / "2026-12-01"
// because the wedding_date field requires YYYY-MM-DD format. The model
// fills the gap. Pre-8c that meant fake-precise data ("July 1"); 8c
// nulled those out; 8d restores partial dates with an explicit precision
// column so the UI can render "July 2026 (month TBD)" properly.
//
// CONTRACT:
//   resolveWeddingDate({ wedding_date, raw_message, name })
//     -> { wedding_date, raw_message, precision }
//
//   - wedding_date: YYYY-MM-DD string OR null. For 'month' precision this
//     is the first of the month (sentinel). For 'year' it's Jan 1.
//   - precision: 'day' | 'month' | 'year' | null
//
// RULES:
//   1. No date → precision: null
//   2. Date that is NOT the 1st of a month → precision: 'day' (trust)
//   3. Date that IS the 1st of a month → inspect text:
//      a. Month-name found AND day adjacent ("July 1", "1st July") → 'day'
//      b. Month-name found AND no day adjacent → 'month' (sentinel kept)
//      c. No month-name (numeric date like "01-07-2026") → 'day' (trust)
//
// We KEEP the 1st-of-month sentinel for month-precision rows so the DB
// still has a date for sorting/filtering. The precision column tells the
// UI not to display the "01" part.

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_ABBR = {
  jan: 'january', feb: 'february', mar: 'march', apr: 'april',
  may: 'may', jun: 'june', jul: 'july', aug: 'august',
  sep: 'september', sept: 'september', oct: 'october',
  nov: 'november', dec: 'december',
};

function findMonthInText(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  for (const m of MONTHS) {
    const re = new RegExp(`\\b${m}\\b`, 'i');
    if (re.test(lower)) return m;
  }
  for (const [abbr, full] of Object.entries(MONTH_ABBR)) {
    const re = new RegExp(`\\b${abbr}\\b`, 'i');
    if (re.test(lower)) return full;
  }
  return null;
}

function hasDayAdjacentToMonth(text, monthName) {
  if (!text || !monthName) return false;
  const lower = text.toLowerCase();
  const dayPart = '(?:[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?';
  const sep = '[\\s,\\-/]+';
  const monthRe = monthName.slice(0, 3);
  const beforeRe = new RegExp(`\\b${dayPart}${sep}${monthRe}`, 'i');
  const afterRe = new RegExp(`\\b${monthRe}\\w*${sep}${dayPart}\\b(?!\\d)`, 'i');
  return beforeRe.test(lower) || afterRe.test(lower);
}

function resolveWeddingDate({ wedding_date, raw_message, name }) {
  // No date → no precision
  if (!wedding_date) {
    return { wedding_date: null, raw_message: raw_message || null, precision: null };
  }

  // Parse + canonicalize
  let ymd;
  try {
    const parsed = new Date(wedding_date);
    if (isNaN(parsed.getTime())) {
      return { wedding_date: null, raw_message: raw_message || null, precision: null };
    }
    ymd = parsed.toISOString().split('T')[0];
  } catch {
    return { wedding_date: null, raw_message: raw_message || null, precision: null };
  }

  // Inspect the source text for an explicit month name. This is the
  // independent signal — we never trust the model's date_precision label.
  const haystack = [raw_message, name].filter(Boolean).join(' ');
  const month = findMonthInText(haystack);

  // ── Case 1: a month NAME is present in the text ─────────────────────
  // This is where the model is most likely to invent a day. Decide purely
  // on whether the vendor actually wrote a day next to that month — NOT on
  // which day the model happened to put in wedding_date.
  if (month) {
    if (hasDayAdjacentToMonth(haystack, month)) {
      // Vendor literally said "Dec 14" / "14th July" → day precision, trust it.
      return { wedding_date: ymd, raw_message: raw_message || null, precision: 'day' };
    }
    // Month named, NO day adjacent (e.g. "a December wedding", "July 2026").
    // Any day in wedding_date is invented. Force month precision AND normalize
    // the stored date to the 1st-of-month sentinel so the DB is honest — the
    // UI renders "Dec 2026", never a fake "14 Dec 2026".
    const sentinel = `${ymd.slice(0, 8)}01`;
    return { wedding_date: sentinel, raw_message: raw_message || null, precision: 'month' };
  }

  // ── Case 2: no month name in the text ───────────────────────────────
  // Could still be a year-only mention ("sometime in 2027", "2027 wedding").
  // If the text names a 4-digit year but NO month and NO standalone day
  // number, any month/day in wedding_date is invented → year precision,
  // normalized to Jan 1 sentinel so the UI renders just "2027".
  const yearOnly = /\b(20\d{2})\b/.test(haystack)
    && !/\b([1-9]|[12]\d|3[01])(?:st|nd|rd|th)\b/i.test(haystack)   // no "14th"-style day
    && !/\b([1-9]|[12]\d|3[01])[\s\-/]/.test(haystack);            // no leading day number
  if (yearOnly) {
    const yyyy = /\b(20\d{2})\b/.exec(haystack)[1];
    return { wedding_date: `${yyyy}-01-01`, raw_message: raw_message || null, precision: 'year' };
  }

  // Date came from a numeric parse ("14-12-2026") or a relative phrase
  // ("next Friday") the model resolved. Trusted as 'day'.
  return { wedding_date: ymd, raw_message: raw_message || null, precision: 'day' };
}

// ── Display formatter for precision-aware date rendering ────────────────────
// Used by both engines (list_leads, pendingEnquiries, client lookups) to
// surface dates honestly to the LLM. The LLM then echoes them back to the
// vendor without inventing days.
//
//   formatDateWithPrecision('2026-07-14', 'day')   → '14 Jul 2026'
//   formatDateWithPrecision('2026-07-01', 'month') → 'Jul 2026'
//   formatDateWithPrecision('2026-01-01', 'year')  → '2026'
//   formatDateWithPrecision(null, anything)         → 'no date'
//   formatDateWithPrecision('2026-07-01', null)    → '1 Jul 2026' (legacy)
//
// The legacy case (date present, precision null) treats it as day-level —
// matches the backfill default for pre-migration rows.

const MONTH_ABBR_LIST = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDateWithPrecision(iso, precision) {
  if (!iso) return 'no date';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const year  = m[1];
  const month = MONTH_ABBR_LIST[parseInt(m[2], 10) - 1];
  const day   = parseInt(m[3], 10);
  if (precision === 'year')  return year;
  if (precision === 'month') return `${month} ${year}`;
  // 'day' or null (legacy): show full date
  return `${day} ${month} ${year}`;
}

module.exports = { resolveWeddingDate, findMonthInText, hasDayAdjacentToMonth, formatDateWithPrecision };
