#!/usr/bin/env python3
"""
Backend fixes for Block 6:
1. payments.js — add PATCH /:id/cancel endpoint
2. payments.js — auto-create expense on mark-paid
"""
import sys

def patch(path, old, new, label):
    with open(path, 'r') as f:
        src = f.read()
    if old not in src:
        print(f"  ERROR  {path}: anchor not found for [{label}]")
        sys.exit(1)
    with open(path, 'w') as f:
        f.write(src.replace(old, new, 1))
    print(f"  PATCHED {path} [{label}]")

print("\n=== Block 6 backend fixes ===\n")

# ─────────────────────────────────────────────────────────────────────────────
# payments.js — add /cancel endpoint + auto-expense on mark-paid
# ─────────────────────────────────────────────────────────────────────────────
patch(
    'src/api/vendor/studio/payments.js',
    "// PATCH /:id/mark-paid",
    """// PATCH /:id/cancel — cancel an owed obligation
router.patch('/:paymentId/cancel', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_payments')
    .update({ state: 'cancelled' })
    .eq('id', req.params.paymentId)
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'owed')
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { payment: data });
}));

// PATCH /:id/mark-paid""",
    "add cancel endpoint"
)

# Auto-create expense on mark-paid
patch(
    'src/api/vendor/studio/payments.js',
    "// PATCH /:id/mark-paid\nrouter.patch('/:paymentId/mark-paid', ...mw, asyncHandler(async (req, res) => {\n  const supabase = req.app.locals.supabase;\n  const { paid_via, notes } = req.body || {};\n  const { data, error } = await supabase\n    .from('team_payments')\n    .update({\n      state:   'paid',\n      paid_at: new Date().toISOString(),\n      paid_via: paid_via || null,\n      notes:    notes    || null,\n    })\n    .eq('id', req.params.paymentId)\n    .eq('vendor_id', req.vendor.id)\n    .eq('state', 'owed')\n    .select()\n    .single();\n  if (error) {\n    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');\n    return errRes(res, 500, error.message);\n  }\n  return okRes(res, { payment: data });\n}));",
    """// PATCH /:id/mark-paid
router.patch('/:paymentId/mark-paid', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { paid_via, notes } = req.body || {};

  const { data, error } = await supabase
    .from('team_payments')
    .update({
      state:    'paid',
      paid_at:  new Date().toISOString(),
      paid_via: paid_via || null,
      notes:    notes    || null,
    })
    .eq('id', req.params.paymentId)
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'owed')
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');
    return errRes(res, 500, error.message);
  }

  // Auto-create a business expense so team payments show up in the vendor's expense ledger.
  // Fire-and-forget — don't fail the mark-paid if expense creation fails.
  try {
    const expenseDate = new Date().toISOString().slice(0, 10);
    const memberRes   = await supabase
      .from('team_members')
      .select('name')
      .eq('id', data.team_member_id)
      .single();
    const memberName = memberRes.data?.name || 'Team member';
    const desc = data.description
      ? `${memberName} — ${data.description}`
      : `Payment to ${memberName}`;
    await supabase.from('expenses').insert({
      vendor_id:    req.vendor.id,
      amount:       data.amount_inr,
      category:     'assistant',
      description:  desc,
      expense_date: expenseDate,
      notes:        paid_via ? `Paid via ${paid_via}` : null,
    });
  } catch (expErr) {
    console.warn('[studio:mark-paid] expense auto-create failed:', expErr.message);
  }

  return okRes(res, { payment: data });
}));""",
    "auto-create expense on mark-paid"
)

print("\n=== Backend patches done ===")
print("""
node --check src/api/vendor/studio/payments.js
git add -A && git commit -m "fix(studio): cancel endpoint, auto-expense on mark-paid, role select, settled rows, delete buttons"
git push
""")
