// src/api/vendor/expenses.js
// GET /api/v2/vendor/expenses/:vendorId
// Auth: vendor JWT (must own vendorId).
// Purpose: Expenses list for the money screen.
//
// Query params:
//   ?limit=20&offset=0    -> default limit 20, max 100
//
// total_spent: ALWAYS aggregates over the vendor's full expense set,
// independent of pagination. Same steady-state-dashboard pattern as
// invoices.summary (lifetime money view, not a filtered view number).
//
// Sort order: newest first by created_at. Matches the rest of the system —
// vendors checking expenses are usually verifying "did the one I just logged
// appear?" so the most recent entries should be at the top.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const resolveAgent   = require('../middleware/resolveAgent');
// `asyncHandler` and the response helpers left with the three write routes
// (c-2c.4): the surviving GET is a plain async handler that answers through
// `res.json` directly. A dead import is how a retired route grows back — it
// leaves the door's furniture standing and the next hand assumes a door.

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent(), async (req, res) => {
  // 6-B — expenses now read Harvey/Donna's ledger: money-OUT binders in
  // engine.records (donna_money direction 'out'). "Paid Rs X to Y for abc"
  // is a binder; client=payee, note=what-for, amount=spend. category folds
  // away (the engine ledger is category-free). Writes below are untouched.
  const eng     = req.app.locals.supabase.schema('engine');
  const agentId = req.agentId;

  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  // select() must come BEFORE filters in supabase-js — the helper takes the
  // projection so each caller starts from a valid query builder.
  const baseOut = (sel, opts) => eng.from('records')
    .select(sel, opts)
    .eq('agent_id', agentId).eq('direction', 'out').eq('hidden', false);

  const [
    { data: rows,    error: listErr },
    { count,         error: countErr },
    { data: allOut,  error: sumErr },
  ] = await Promise.all([
    baseOut('id, client, amount, date, note, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    baseOut('*', { count: 'exact', head: true }),
    baseOut('amount'),
  ]);

  if (listErr || countErr || sumErr) {
    console.error('[GET /vendor/expenses] engine read error:', (listErr || countErr || sumErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  let totalSpent = 0;
  for (const r of (allOut || [])) totalSpent += (r.amount || 0);

  const expenses = (rows || []).map(r => ({
    id:           r.id,
    description:  r.note   || null,
    amount:       r.amount,
    category:     null,
    expense_date: r.date   || null,
    client_name:  r.client || null,
    created_at:   r.created_at,
  }));

  return res.json({
    ok:          true,
    expenses,
    total_spent: totalSpent,
    total:       count || 0,
  });
});

// ─── POST /api/v2/vendor/expenses ─────────────────────────────────────
//
// ── THE THREE TYPED WRITE ROUTES RETIRED HERE  [c-2c.4, CE-39 2c·2a] ──────
// `POST /`, `PATCH /:expenseId` and `DELETE /:expenseId` stood here and were
// ALREADY on the typed writer home — they called `createExpense`,
// `updateExpense` and `deleteExpense` in `src/lib/vendor/expenses.js` directly.
// They were correct and they were in the wrong file: `src/api/vendor/money.js`
// is the typed money door by charter, and a table's doors live in ONE file.
//
// THE SEAT MINTED THEIR REPLACEMENTS WITHOUT READING THEM FIRST. The pwa was
// calling `binders/:id/hide` and `money-edit` for expenses, so the seat read
// the room's engine plane and concluded the typed routes did not exist. They
// did; the pwa was calling the wrong door, not a missing one. c-2c.4, the same
// failure as c-39.32 one direction over — ruling a shape without reading what
// the tree already had.
//
// RETIRED HERE AND NOT LATER because the caller sweep at `bb4a9ad` found ZERO:
// no reference to `/vendor/expenses` anywhere under the pwa's `app/`,
// `components/` or `lib/` (comments stripped), and no other dream-os router,
// script or tool. The standing rule is that a source retires once no reader
// calls it, and nothing ever called these.
//
// Their addresses now:
//   POST   /api/v2/vendor/money/expenses/:vendorId
//   PATCH  /api/v2/vendor/money/expenses/:vendorId/:expenseId
//   DELETE /api/v2/vendor/money/expenses/:vendorId/:expenseId
//
// WHAT SURVIVES IN THIS FILE is the engine-plane `GET /:vendorId` above, which
// still has a live reader until 2a-pwa re-points it. It retires in 2b's
// companion with the other engine money GET arm, by ruling.

module.exports = router;
