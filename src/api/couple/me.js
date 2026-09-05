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
// ARC OB · micro item ③. THE ONE PREDICATE HOME — required, never re-derived.
// Both GETs below report its verdict so OB-P's guard has a server-computed
// answer and no client ever holds a second copy of the completeness rule.
const { brideComplete } = require('../../lib/onboardingPredicate');

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
      publish_weddings,
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
      // ── G1.1c · THE SWITCH'S DEFAULT COMES FROM THE ROW, NEVER FROM STATE ──
      // `=== true` and not `|| false`: the column is NOT NULL DEFAULT false
      // (0132), so the only way this is not a boolean is a row that does not
      // exist — and a missing row must read OFF, not undefined. The room draws
      // the switch from THIS byte; it never holds its own idea of her answer.
      publish_weddings: couple.publish_weddings === true,
      planning_state:   couple.planning_state   || null,
      // ── ARC OB · THE VERDICT (micro item ③) ──────────────────────────────
      // BOTH couple profile GETs carry it, and that is a declared executor
      // decision rather than a widening for its own sake: two profile GETs on
      // one lane returning different answers about completeness is F-04.36's
      // class waiting to happen. The surface that reads THIS one and finds no
      // verdict is the surface that computes its own. One lane, one answer.
      // This handler already selects users(name) — no new query, no new join.
      onboarding:       brideComplete({ name: couple.users?.name }, couple),
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

  const { name, partner_name, wedding_date, wedding_city, budget_total, budget_confirmed, publish_weddings } = req.body || {};

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

  // ── G1.1c · THE COUPLE'S SWITCH (R-40.9, R-G11c.8) ─────────────────────────
  // DELIBERATELY NOT IN `couplesPatch` ABOVE. `couples.publish_weddings` has ONE
  // writer — the function — and routing it through the patch object would make
  // this route a second one, with the two able to drift about what a valid
  // answer is. One home for the fact, one writer for the column.
  //
  // WHY AN RPC AND NOT TWO UPDATES. Her standing answer and every page of hers
  // must move together (R-G11c.8). Two supabase.update() calls are two
  // statements and two chances to half-apply, leaving her answer and her pages
  // disagreeing with each other. `couple_set_publish` (0132) does both in one
  // plpgsql body, which is one transaction. This is the ruling executed, not
  // approximated. The estate's own pattern: ten rpc call sites, eleven functions.
  //
  // STRICTLY BOOLEAN. Not truthy — a stray 'false' string or a 0 must be
  // REFUSED with a named reason rather than coerced into an answer she did not
  // give. Consent is the one field where a guess is never better than a 400.
  //
  // SCOPED BY HER OWN couple_id, taken from the JWT (`req.coupleUser`) and
  // already checked against the URL at the top of this handler. No wedding id is
  // accepted from anywhere: consent is not grantable on someone else's page.
  let publishResult;
  if (publish_weddings !== undefined) {
    if (typeof publish_weddings !== 'boolean') {
      return errRes(res, 400, 'publish_weddings must be true or false.');
    }
    const { data: pubRows, error: pErr } = await supabase.rpc('couple_set_publish', {
      p_couple_id: couple_id,
      p_publish:   publish_weddings,
    });
    if (pErr) {
      console.error('[PATCH /couple/me] publish error:', pErr.message);
      return errRes(res, 500, 'Could not update publishing.');
    }
    // ZERO TOUCHED WEDDINGS IS NOT A FAILURE. A couple with no page yet
    // legitimately moves no rows — that is exactly the state the room's own
    // no-page line describes, and her answer is still recorded on her row.
    const row = Array.isArray(pubRows) ? pubRows[0] : pubRows;
    publishResult = {
      publish_weddings: (row && row.publish_weddings) === true,
      weddings_touched: (row && Number(row.weddings_touched)) || 0,
    };
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
    // Echoed for the same reason the budget is: the caller COMPARES rather than
    // trusts a bare boolean. `weddings_touched` rides along so a walk can see
    // whether any page actually moved without opening the database.
    ...(publishResult !== undefined ? publishResult : {}),
  });
}));

// ── GET / (bare — used by sanctuary onboarding guard) ────────────────────────
// Same as /:coupleId but coupleId comes from the JWT via req.coupleUser.
router.get('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  // ── ARC OB · THE VERDICT ON THE WIRE (micro item ③) ────────────────────────
  // `users(name)` JOINS the select because `brideComplete` reads users.name and
  // this handler could not see it — the join is the minimum needed to answer,
  // not a widening. It is the SAME join shape GET /:coupleId above already uses,
  // adopted rather than invented.
  const { data: couple, error } = await supabase
    .from('couples')
    .select('id, onboarding_state, planning_state, wedding_date, wedding_city, partner_name, budget_total, users(name)')
    .eq('id', couple_id)
    .maybeSingle();

  if (error || !couple) return errRes(res, 404, 'Couple not found.');

  // `users` is STRIPPED from the response. The join exists to compute the
  // verdict, and leaking a nested relation into a shape that never carried one
  // would hand clients a second route to the bride's name — which is how a
  // client ends up deriving completeness itself. The response gains exactly one
  // key. (bride_name is already served, under that name, by GET /:coupleId.)
  const { users, ...row } = couple;
  return okRes(res, {
    couple: {
      ...row,
      onboarding: brideComplete({ name: users?.name }, couple),
    },
  });
}));

module.exports = router;
