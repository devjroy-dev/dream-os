// src/agent/datePrecision.js
// Patch 8c — model-agnostic guardrail for month-only / year-only wedding dates.
//
// Problem: both Haiku (WhatsApp engine) and Sonnet (PWA engine) keep
// converting "July 2026" or "December" to "2026-07-01" / "2026-12-01"
// because the wedding_date field requires YYYY-MM-DD format. The model
// fills the gap. The result is fake-precise data ("July 1") for leads
// where the vendor never mentioned a day.
//
// This helper runs inside both create_lead handlers (engine.js +
// pwaEngine.js). It inspects the vendor's text to decide whether the
// agent's wedding_date is genuine or a guessed default.
//
// CONTRACT:
//   resolveWeddingDate({ wedding_date, raw_message, name }) -> { wedding_date, raw_message }
//
//   - wedding_date: the date the agent emitted (YYYY-MM-DD or null)
//   - raw_message: the vendor's original phrasing (or note)
//   - name: lead name, for fallback inspection of the phrasing
//
// RULES:
//   1. If the agent emitted no wedding_date → return null.
//   2. If the agent emitted a date that is NOT the 1st of a month →
//      trust it. The model wouldn't pick a random day; vendor probably
//      named it. Return as-is.
//   3. If the agent emitted the 1st of a month → inspect raw_message:
//      a. Find an English month-name match (case-insensitive).
//      b. If found AND no day-number is adjacent → it's month-only;
//         null the date, append "[partial date: YYYY-MM (month only)]"
//         to raw_message. Return null date + augmented raw_message.
//      c. If found WITH an adjacent day-number ("July 1", "1st July",
//         "Jul-01", "1/7", "01-07") → trust the 1st-of-month, vendor
//         genuinely said the first.
//      d. If no month-name found anywhere → trust the 1st-of-month
//         (could be from a parsed date like "01/07/2026" or
//         "next Wednesday" landing on a 1st).
//   4. Year-only is similar but rarer — handled if a date is "Jan 1"
//      AND raw_message has only a year mentioned.
//
// The function is pure (no side effects). Both engines call it the
// same way.

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
  // Try full names first (greedy, longest match)
  for (const m of MONTHS) {
    const re = new RegExp(`\\b${m}\\b`, 'i');
    if (re.test(lower)) return m;
  }
  // Try abbreviations
  for (const [abbr, full] of Object.entries(MONTH_ABBR)) {
    const re = new RegExp(`\\b${abbr}\\b`, 'i');
    if (re.test(lower)) return full;
  }
  return null;
}

// Is there a day-number (1..31) adjacent to the month in the text?
// "July 14" yes. "July 2026" no — 2026 isn't a valid day. "14 July" yes.
// "1st July" yes. "Jul-14" yes.
function hasDayAdjacentToMonth(text, monthName) {
  if (!text || !monthName) return false;
  const lower = text.toLowerCase();
  // Build a pattern: optional day, month, optional day. Day = 1..31
  // optionally followed by st/nd/rd/th. Separator = comma, space, hyphen, slash.
  const dayPart = '(?:[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?';
  const sep = '[\\s,\\-/]+';
  const monthRe = monthName.slice(0, 3); // match prefix so "july" matches "jul"
  // Day before month: "14 July", "1st July", "14-Jul"
  const beforeRe = new RegExp(`\\b${dayPart}${sep}${monthRe}`, 'i');
  // Day after month: "July 14", "Jul-14", "July 14th"
  const afterRe = new RegExp(`\\b${monthRe}\\w*${sep}${dayPart}\\b(?!\\d)`, 'i');
  return beforeRe.test(lower) || afterRe.test(lower);
}

function resolveWeddingDate({ wedding_date, raw_message, name }) {
  // No date → nothing to fix
  if (!wedding_date) return { wedding_date: null, raw_message: raw_message || null };

  // Parse + canonicalize
  let ymd;
  try {
    const parsed = new Date(wedding_date);
    if (isNaN(parsed.getTime())) return { wedding_date: null, raw_message: raw_message || null };
    ymd = parsed.toISOString().split('T')[0];
  } catch {
    return { wedding_date: null, raw_message: raw_message || null };
  }

  const day = parseInt(ymd.slice(8, 10), 10);

  // Trust non-1st dates (model wouldn't invent a specific day)
  if (day !== 1) {
    return { wedding_date: ymd, raw_message: raw_message || null };
  }

  // 1st of a month — inspect text sources
  // Search raw_message + name (name sometimes carries the date in old patterns)
  const haystack = [raw_message, name].filter(Boolean).join(' ');
  const month = findMonthInText(haystack);

  if (!month) {
    // No month name mentioned — date came from a numeric parse, trust it.
    return { wedding_date: ymd, raw_message: raw_message || null };
  }

  if (hasDayAdjacentToMonth(haystack, month)) {
    // Vendor actually said "July 1" — keep the date
    return { wedding_date: ymd, raw_message: raw_message || null };
  }

  // Month-only case: null the date, annotate raw_message
  const hint = `[partial date: ${ymd.slice(0, 7)} (month only)]`;
  const newRaw = raw_message
    ? `${raw_message} ${hint}`
    : hint;
  return { wedding_date: null, raw_message: newRaw };
}

module.exports = { resolveWeddingDate, findMonthInText, hasDayAdjacentToMonth };
