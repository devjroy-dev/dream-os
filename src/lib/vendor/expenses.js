// src/lib/vendor/expenses.js
// Shared write logic for vendor expenses.
// Called by REST handlers and pwaEngine tool executors.

'use strict';

const ALLOWED_CATEGORIES = [
  'travel', 'equipment', 'editing', 'assistant', 'studio',
  'printing', 'packaging', 'food', 'accommodation', 'marketing',
  'software', 'other',
];

// ── createExpense ─────────────────────────────────────────────────────────

async function createExpense(supabase, vendorId, params) {
  const { amount, category, description, expense_date, client_name, linked_lead_id, notes } = params;

  if (!amount || amount <= 0) return { ok: false, error: 'amount must be greater than zero.' };
  if (!category) return { ok: false, error: 'category is required.' };
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { ok: false, error: 'Invalid category. Must be one of: ' + ALLOWED_CATEGORIES.join(', ') + '.' };
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
    return { ok: false, error: 'Invalid category. Must be one of: ' + ALLOWED_CATEGORIES.join(', ') + '.' };
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

module.exports = { createExpense, updateExpense, deleteExpense, ALLOWED_CATEGORIES };
