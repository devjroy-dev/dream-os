// src/api/couple/me.js
// GET /api/v2/couple/me/:coupleId
// Returns couple profile. Requires couple auth (applied in core.js).
//
// Column truth (from SCHEMA.md + brideSystemPrompt.js):
//   couples: id, user_id, partner_name, wedding_date, wedding_city,
//            budget_total, events_planned, planning_state, onboarding_state
//   bride name comes from users.name (joined via user_id)
//   No bride_name or groom_name columns exist on couples.

'use strict';

const { coerceBudget } = require('../../lib/coerceBudget');
const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const { data: couple, error } = await supabase
    .from('couples')
    .select(`
      id, partner_name, wedding_date, wedding_city,
      budget_total, events_planned, planning_state, onboarding_state,
      users(name)
    `)
    .eq('id', couple_id)
    .maybeSingle();

  if (error) {
    console.error('[GET /couple/me] query error:', error.message);
    return errRes(res, 500, 'Could not fetch profile.');
  }

  if (!couple) return errRes(res, 404, 'Couple not found.');

  return okRes(res, {
    couple: {
      id:               couple.id,
      bride_name:       couple.users?.name      || null,
      partner_name:     couple.partner_name     || null,
      wedding_date:     couple.wedding_date     || null,
      wedding_city:     couple.wedding_city     || null,
      budget_total:     couple.budget_total     || null,
      events_planned:   couple.events_planned   || [],
      planning_state:   couple.planning_state   || null,
      onboarding_state: couple.onboarding_state || null,
    },
  });
}));

// -- PATCH /:coupleId ---------------------------------------------------------
router.patch('/:coupleId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id, user_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const { name, partner_name, wedding_date, wedding_city, budget_total, budget_confirmed } = req.body || {};

  const couplesPatch = {};
  if (partner_name !== undefined) couplesPatch.partner_name = partner_name;
  if (wedding_date  !== undefined) couplesPatch.wedding_date  = wedding_date || null;
  if (wedding_city  !== undefined) couplesPatch.wedding_city  = wedding_city || null;

  // ── budget_total · TDW_09 ATELIER RIDER 2 (founder-ruled 2026-08-07) ────────
  // The app becomes a SECOND writer of couples.budget_total. The first is the
  // bride agent's save_wedding_detail tool, reached from BOTH WhatsApp and the
  // in-app Dream room (src/api/couple/chat.js runs the same runBrideAgenticTurn,
  // one couple_self conversation across both surfaces).
  //
  // The founder's ruling was conditional — 「 both can write if theres no clash
  // and if the write is successful 」 — so both conditions are mechanised here,
  // not assumed:
  //
  //   NO CLASH. This guard is byte-for-byte the semantics of the first writer at
  //   src/agent/brideEngine.js (its budget_total arm, function
  //   execSaveWeddingDetail): coerce with parseInt, then require a positive
  //   integer in rupees. A value one writer would refuse cannot be written by the
  //   other, so the two can never disagree about what a valid budget is.
  //   Column witnessed: docs/db/PUBLIC_SCHEMA.md line 288, `budget_total integer`.
  //
  //   THE WRITE IS SUCCESSFUL. Invalid input is REFUSED with 400 and a named
  //   reason — never coerced to null and never silently dropped, which is what
  //   the `|| null` pattern above would have done to a 0 or a bad string. The
  //   persisted value is echoed in the response so the caller can compare rather
  //   than assume, and the client re-reads the profile independently.
  //
  //   DECLARED GAP, reported not built: the first writer also inserts a `notes`
  //   audit row on every change (brideEngine, after its couples update). This
  //   route does not, so a budget changed in Settings leaves no note while the
  //   same change through Dream Ai does. That asymmetry is not a clash — the
  //   column agrees either way — but it is a history gap and it is unruled.
  //
  //   NOT SUPPORTED, deliberately: clearing the budget back to null. The first
  //   writer has no clear path, so offering one here would be a capability that
  //   exists on one surface only. Raise it or lower it; blanking needs a ruling.
  // ── F-09.165 + F-09.167 · THE COERCION MOVED OUT (CE R-26.5) ──────────────
  // This arm mirrored brideEngine's parseInt BY HAND. Mirroring by hand is how
  // two doors drift apart; the definition now lives in ONE place and both
  // writers call it. Change the rule at src/lib/coerceBudget.js, never here.
  let budgetCoerced;
  if (budget_total !== undefined) {
    const verdict = coerceBudget(budget_total);
    if (!verdict.ok) {
      return errRes(res, 400, `budget_total ${verdict.reason}`);
    }
    if (verdict.confirm && !budget_confirmed) {
      // F-09.167 AT A DOOR THAT CANNOT HOLD A CONVERSATION — and the answer path
      // it was missing. The first save below the floor returns the question and
      // writes nothing. THE NEXT SAVE OF THE SAME FIGURE IS THE YES: the client
      // sets budget_confirmed and this arm is skipped.
      //
      // Owned: the first cut of this route shipped the question with NO way to
      // answer it, so Rs 50,000 was permanently unsettable from Settings — the
      // founder walked into the loop within a minute. A question with no reply is
      // not a declared deviation, it is a dead end, and calling it declared did
      // not make it work.
      //
      // The flag is scoped to ONE write. It is not stored, so it cannot make the
      // floor permanently deaf for this couple; the next ambiguous figure asks
      // again. And it only ever SKIPS the plausibility question — an unreadable
      // figure is still refused above, because confirming a typo is not consent.
      return res.status(409).json({
        ok: false,
        error: verdict.say,
        needs_confirmation: true,
        heard: verdict.value,
        suggestion: verdict.suggestion,
      });
    }
    budgetCoerced = verdict.value;
    couplesPatch.budget_total = budgetCoerced;
  }

  if (Object.keys(couplesPatch).length > 0) {
    const { error: cErr } = await supabase
      .from('couples')
      .update(couplesPatch)
      .eq('id', couple_id);
    if (cErr) {
      console.error('[PATCH /couple/me] couples error:', cErr.message);
      return errRes(res, 500, 'Could not update profile.');
    }
  }

  if (name !== undefined && user_id) {
    const { error: uErr } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user_id);
    if (uErr) {
      console.error('[PATCH /couple/me] users error:', uErr.message);
    }
  }

  return okRes(res, {
    updated: true,
    // Echoed so the caller can COMPARE rather than trust a bare boolean — the
    // founder's 「 if the write is successful 」 condition, mechanised.
    ...(budgetCoerced !== undefined ? { budget_total: budgetCoerced } : {}),
  });
}));

// ── GET / (bare — used by sanctuary onboarding guard) ────────────────────────
// Same as /:coupleId but coupleId comes from the JWT via req.coupleUser.
router.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { data: couple, error } = await supabase
    .from('couples')
    .select('id, onboarding_state, planning_state, wedding_date, wedding_city, partner_name, budget_total')
    .eq('id', couple_id)
    .maybeSingle();

  if (error || !couple) return errRes(res, 404, 'Couple not found.');
  return okRes(res, { couple });
}));

module.exports = router;
