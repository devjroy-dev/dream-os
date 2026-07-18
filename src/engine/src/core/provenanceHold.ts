// provenanceHold.ts — THE PROVENANCE HOLD. M-2 (CE, ruled at the manual paper,
// 2026-07-18), seated in the M-7(ii) mechanical-floors ZIP. F-04.70's ₹50,000 is
// the NAMED bench test (scripts/b6_floors_bench.js §2).
//
// THE LAW, narrow by design: a rupee figure in a WRITE hand's dispatch must be
// present in the vendor's own words this thread, else the hand HOLDS with the
// honest question — the F-04.72/79 hold family's shape (hold the write, speak the
// question, that turn only). Money figures only. Write hands only. Everything else
// passes untouched; sentence 5 of the claim doctrine stays soul-guarded ABOVE this
// floor (harveySoul v8's "the dispatch is testimony" passage — the character ships
// there; the floor lives here).
//
// WHY THIS EXISTS (F-04.70, read at its filing): the vendor said "book a shoot for
// Zoya Persist Test on 18 December, 7 pm." — no figure anywhere — and budget_max
// landed at 50000 through a LAWFUL donna_lead hand, because the dispatch text
// carried "50k" borrowed from the snapshot's neighbouring line (Rhea's ₹50,000).
// The write side was unimpeachable; the disease was upstream. This floor makes the
// figure's provenance a condition of the write itself: a figure enters the record
// because the owner said it, or it does not enter at all.
//
// FAIL-CLOSED on a missing corpus (F15's direction, same as donnaLead's guard
// reads): a caller that cannot supply the thread's vendor words cannot vouch for a
// figure — the hold fires. loop.ts assembles and supplies the corpus every turn;
// the floors bench asserts the seam through the REAL runDonnaTurn.
import { parseMoney } from './tools/recordPrimitives.js';

// The money-bearing WRITE hands and their rupee fields — enumerated from the tool
// schemas at this HEAD (recordPrimitives.ts, donnaLead.ts), never guessed:
//   donna_lead.value_estimate        (number — F-04.70's own path, budget_max)
//   donna_money.amount               (string notation — '2.5L', '90k', plain)
//   donna_money_edit.amount / amount_received / amount_pending (string notation)
//   donna_merge.amount / amount_received / amount_pending      (numbers)
//   donna_split.amount / amount_received / amount_pending      (numbers)
// donna_edit is money-blind by its own contract ("Money cells are not edited
// here"); reads are never held (money figures only, WRITE hands only — M-2).
export const MONEY_WRITE_FIELDS: Record<string, string[]> = {
  donna_lead: ['value_estimate'],
  donna_money: ['amount'],
  donna_money_edit: ['amount', 'amount_received', 'amount_pending'],
  donna_merge: ['amount', 'amount_received', 'amount_pending'],
  donna_split: ['amount', 'amount_received', 'amount_pending'],
};

// Every rupee figure the vendor's own words contain, normalised through the SAME
// parseMoney the hands compute with (one home — the floor and the door must agree
// on what '50k' means, or the floor holds an amount the door would have written).
// Three token classes, deliberately conservative:
//   (a) currency-marked:  ₹50,000 · Rs 50000 · rs. 2.5L
//   (b) notation-suffixed: 50k · 2.5L · 3 lakh · 1.2cr · 90 thousand
//   (c) bare numbers of 3+ digits: 50000 · 50,000  (two-digit bare numbers — dates,
//       counts — are never read as money; a "14 February" can't vouch for Rs 14)
// A figure the extractor misses simply HOLDS the hand and asks — the narrow
// direction: a false hold costs one honest question; a false pass is F-04.70.
const FIGURE_RE =
  /(?:(?:rs\.?|₹)\s*)([\d,]+(?:\.\d+)?)\s*(l|lakh|lakhs|lac|lacs|cr|crore|crores|k|thousand)?\b|\b(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|lac|lacs|cr|crore|crores|k|thousand)\b|\b(\d[\d,]{2,}(?:\.\d+)?)\b/gi;

export function extractVendorFigures(vendorWords: string): Set<number> {
  const out = new Set<number>();
  if (!vendorWords) return out;
  let m: RegExpExecArray | null;
  FIGURE_RE.lastIndex = 0;
  while ((m = FIGURE_RE.exec(vendorWords)) !== null) {
    const num = m[1] ?? m[3] ?? m[5];
    const suf = m[2] ?? m[4] ?? '';
    if (!num) continue;
    const parsed = parseMoney(`${num.replace(/,/g, '')}${suf}`);
    if (parsed != null) out.add(parsed);
  }
  return out;
}

export type ProvenanceHold = { figure: number; field: string; display: string };

// The check. Returns null when the hand may proceed (no money field, no figure
// given, or every figure present in the vendor's words); returns the hold —
// figure, field, and the honest question as the tool result — otherwise.
// The display string is minted utility copy and rides the founder's veto list.
export function checkMoneyProvenance(
  toolName: string,
  input: Record<string, unknown>,
  vendorWords: string | undefined,
): ProvenanceHold | null {
  const fields = MONEY_WRITE_FIELDS[toolName];
  if (!fields) return null;
  let figures: Set<number> | null = null; // extracted lazily — most hands carry no money
  for (const field of fields) {
    const v = input[field];
    if (v == null || v === '') continue;
    const figure = parseMoney(v);
    if (figure == null) continue; // unparseable — the door's own error speaks; not the hold's case
    if (figures === null) figures = extractVendorFigures(vendorWords ?? '');
    if (figures.has(figure)) continue;
    return {
      figure,
      field,
      display:
        `HELD — the figure Rs ${figure} is not in the owner's words this conversation, ` +
        `so nothing was written. A figure enters the record because the owner said it, ` +
        `or it does not enter at all. Ask him to confirm the amount — or hand the ` +
        `instruction back without the figure and the rest files clean.`,
    };
  }
  return null;
}
