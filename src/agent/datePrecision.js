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

  const day = parseInt(ymd.slice(8, 10), 10);

  // Non-1st dates: trust the model, it didn't invent a random day
  if (day !== 1) {
    return { wedding_date: ymd, raw_message: raw_message || null, precision: 'day' };
  }

  // 1st of a month — inspect text sources
  const haystack = [raw_message, name].filter(Boolean).join(' ');
  const month = findMonthInText(haystack);

  // No month name in the text → date came from a numeric parse, trust it
  if (!month) {
    return { wedding_date: ymd, raw_message: raw_message || null, precision: 'day' };
  }

  // Month name AND adjacent day → vendor literally said "July 1"
  if (hasDayAdjacentToMonth(haystack, month)) {
    return { wedding_date: ymd, raw_message: raw_message || null, precision: 'day' };
  }

  // Month-only — KEEP the 1st sentinel, mark precision=month
  return { wedding_date: ymd, raw_message: raw_message || null, precision: 'month' };
}

module.exports = { resolveWeddingDate, findMonthInText, hasDayAdjacentToMonth };
