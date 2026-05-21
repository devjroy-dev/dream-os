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

module.exports = router;
