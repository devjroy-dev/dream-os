// src/lib/vendor/expenses.js
// THE WRITER HOME FOR public.expenses.
//
// Called by `src/api/vendor/money.js` — the typed money door. It used to say
// `src/api/vendor/expenses.js`, which was true until c-2c.4 moved this table's
// three write routes into the one money file; that router now keeps only its
// engine-plane GET. Retire-with-the-reader applies to a comment naming a caller
// exactly as it applies to code.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE AUTHORED HOME FOR THE VENDOR EXPENSE VOCABULARY (CE-39 hygiene, ruling 1).
//
// ⚠ THIS LIST IS A DB CONSTRAINT. It mirrors `expenses_category_check`
//   (docs/db/PUBLIC_SCHEMA.md — CHECK (category = ANY (ARRAY[...]))), TOKEN FOR
//   TOKEN AND IN THE CHECK'S OWN ORDER. THE NEXT PERSON WHO EDITS THIS ARRAY
//   OWES A MIGRATION. Editing it here alone does not widen what the database
//   accepts; it only moves where the refusal happens.
//
//   F-2c.p1 — CURED HERE, and this header is what stops it recurring. The
//   paragraph 2c left at this spot declared the finding OPEN and the array
//   byte-untouched by ruling (arm i); it retires with the defect it described.
//   What stood: `editing`, `packaging` and `accommodation` were in this array
//   and rejected by the CHECK, while `commission`, `shoot` and `inventory` were
//   in the CHECK and refused here — by an error sentence that then recited the
//   wrong twelve. Nine of twelve agreed. Both failure directions were live: a
//   vendor logging an editing cost passed this validator and took a raw 23514 at
//   the database; a vendor logging a commission was refused for a word the
//   database has always accepted. Third instance of F-15.10's class (the same
//   defect on the couple plane, six homes collapsed into src/agent/categories.js)
//   and a direct application of F-15.6's law: a cell can be green, non-vacuous
//   and mutation-proven while pinning a value the database has never accepted.
//
// READERS OF THIS LIST — all of which import it, none of which copy it:
//   · src/api/vendor/money.js               — the typed money door, which since
//                                             c-2c.4 holds ALL THREE of this
//                                             table's write routes
//   · src/api/vendor/studio/payments.js     — mark-paid's expense leg, which
//                                             now routes through createExpense
//                                             rather than opening the table
//   (`src/api/vendor/expenses.js` is NOT a reader — c-2c.4 left it one
//    engine-plane GET and no write.)
//
// THE ONE MIRROR, ACROSS THE WIRE: dreamos-pwa `lib/vendor/types/common.ts`'s
//   `ExpenseCategory` + `EXPENSE_CATEGORIES`. The two repos deploy separately and
//   share no package, so the pwa cannot import this file. The mirror is therefore
//   AUTHORED HERE and COPIED THERE under a header that says so, and the copy is
//   held to this array by a bench cell (dreamos-pwa
//   `scripts/b40_worklist_shell_bench.js` §C84) which reads the dream-os sibling
//   and REFUSES — never passes — when the sibling is absent. A runtime
//   `GET /categories` door was considered and REFUSED at the chair: runtime
//   coupling on a picker, for a list that only ever changes by migration.
//
// LABELS ARE NOT TOKENS. The picker's display labels are title-cased from these
// tokens at the mirror and never stored. These are machine values only.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const ALLOWED_CATEGORIES = [
  'travel', 'equipment', 'assistant', 'studio',
  'marketing', 'software', 'food', 'printing',
  'commission', 'shoot', 'inventory', 'other',
];

// The refusal, minted ONCE. Before CE-39 this sentence was built twice — at the
// create door and again at the update door — so the two could drift the way the
// list itself had. One home for the list, one home for the words about it.
const CATEGORY_REFUSAL =
  'That is not a category we track. Pick one of: ' + ALLOWED_CATEGORIES.join(', ') + '.';

// ── readRecentExpenses ────────────────────────────────────────────────────
// F-42.97's ROOT. Until this function existed, `from('expenses')` resolved to
// four files and NONE OF THEM WAS A READ VICTOR COULD REACH — this file held
// three writes, `src/api/vendor/money.js` the room, `src/admin/router.js` the
// admin plane, `src/agent/engine.js` the dead island (F-40.5). So Victor spoke
// about expenses with zero hands, and on 2026-09-10 00:52:38 he invented a date
// AND a filing time for a row that really exists. He fills silence; the cure is
// to stop the silence, not to instruct him about it (arm C, refused).
//
// It lives HERE, beside the writes, for the reason `readOutstanding` lives in
// invoices.js: one home per table. `expenseFacts.js` renders; this reads.
//
// CONTRACT, copied in substance from readOutstanding: NEVER THROWS, NEVER
// GUESSES. `{ ok: true, rows, truncated }` or `{ ok: false, error }`. A read
// failure is not an empty book, and the caller says so in the vetoed words.
//
// Columns witnessed against docs/db/PUBLIC_SCHEMA.md `public.expenses` (:675,
// 12 columns): amount :680 · category :681 · description :682 · expense_date
// :683 · client_name :684 · created_at :687 · deleted_at :689. None from memory.
//
// THE WINDOW AND THE CAP ARE FOLDED IN JS, NOT IN THE QUERY, and that is
// deliberate. `expense_date` IS NULLABLE — createExpense above writes
// `expense_date || null` — so the window must run on `expense_date` FALLING BACK
// to the filed date, and a SQL-side window on the column alone would silently
// drop every row a vendor logged without one. Same shape as 7a18bf6's pulse
// reader: a bounded fetch, the fold in JS where the fallback can be expressed.
const RECENT_SELECT = 'amount, category, description, expense_date, client_name, created_at';
const RECENT_WINDOW_DAYS = 30;
const RECENT_ROW_CAP = 40;
const RECENT_FETCH = 200; // bound on the fetch itself; the cap below is the block's

// The effective date of a row: what the vendor said, else the day it was filed.
// String-sliced, never Date()-parsed — witnessLine.js's own reason, kept here.
function effectiveDate(row) {
  const d = String(row.expense_date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return String(row.created_at || '').slice(0, 10) || null;
}

async function readRecentExpenses(supabase, vendorId, today) {
  const { data, error } = await supabase
    .from('expenses')
    .select(RECENT_SELECT)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(RECENT_FETCH);

  if (error) return { ok: false, error: error.message };

  // The window's floor, by string. `today` is injectable so a cell can pin a day
  // without pinning the clock — the bench's own requirement, not a convenience.
  const end = /^\d{4}-\d{2}-\d{2}$/.test(String(today || ''))
    ? new Date(`${today}T00:00:00Z`)
    : new Date();
  const floor = new Date(end.getTime() - RECENT_WINDOW_DAYS * 86400000)
    .toISOString().slice(0, 10);

  const inWindow = (data || [])
    .map((r) => ({ ...r, effective_date: effectiveDate(r) }))
    .filter((r) => r.effective_date && r.effective_date >= floor)
    .sort((a, b) => (a.effective_date < b.effective_date ? 1 : a.effective_date > b.effective_date ? -1 : 0));

  return {
    ok: true,
    // V-8's trigger. The cap must not lie silently: a Victor who cannot see that
    // rows were dropped will say "that's everything" and be wrong.
    truncated: inWindow.length > RECENT_ROW_CAP,
    rows: inWindow.slice(0, RECENT_ROW_CAP),
  };
}

// ── createExpense ─────────────────────────────────────────────────────────

async function createExpense(supabase, vendorId, params) {
  const { amount, category, description, expense_date, client_name, linked_lead_id, notes } = params;

  if (!amount || amount <= 0) return { ok: false, error: 'amount must be greater than zero.' };
  if (!category) return { ok: false, error: 'category is required.' };
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { ok: false, error: CATEGORY_REFUSAL };
  }

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      vendor_id:      vendorId,
      amount,
      category,
      description:    description  || null,
      expense_date:   expense_date || null,
      client_name:    client_name  || null,
      linked_lead_id: linked_lead_id || null,
      notes:          notes        || null,
    })
    .select('id, amount, category, description, expense_date, client_name, created_at')
    .single();

  if (error) return { ok: false, error: 'Could not log expense: ' + error.message };
  return { ok: true, expense };
}

// ── updateExpense ─────────────────────────────────────────────────────────

async function updateExpense(supabase, vendorId, expenseId, patch) {
  const EDITABLE = ['amount', 'category', 'description', 'expense_date', 'client_name', 'notes'];
  const update = {};
  for (const key of EDITABLE) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }

  if (update.amount !== undefined && update.amount <= 0) {
    return { ok: false, error: 'amount must be greater than zero.' };
  }
  if (update.category && !ALLOWED_CATEGORIES.includes(update.category)) {
    return { ok: false, error: CATEGORY_REFUSAL };
  }
  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields provided.' };

  const { data: expense, error } = await supabase
    .from('expenses')
    .update(update)
    .eq('id', expenseId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .select('id, amount, category, description, expense_date, client_name, created_at')
    .maybeSingle();

  if (!expense && !error) return { ok: false, error: 'Expense not found.' };
  if (error) return { ok: false, error: error.message };
  return { ok: true, expense };
}

// ── deleteExpense ─────────────────────────────────────────────────────────
// Soft delete.

async function deleteExpense(supabase, vendorId, expenseId) {
  const { data: existing } = await supabase
    .from('expenses')
    .select('id, amount, category')
    .eq('id', expenseId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Expense not found.' };

  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', expenseId)
    .eq('vendor_id', vendorId);

  if (error) return { ok: false, error: error.message };
  console.log('[expenses:delete] soft-deleted ' + expenseId);
  return { ok: true, deleted: true };
}

module.exports = {
  createExpense, updateExpense, deleteExpense,
  ALLOWED_CATEGORIES, CATEGORY_REFUSAL,
  readRecentExpenses, effectiveDate,
  RECENT_WINDOW_DAYS, RECENT_ROW_CAP,
};
