// src/api/couple/onboarding.js
// POST /api/v2/couple/onboarding
//
// Web onboarding for couples who joined via invite code (not WhatsApp).
// All fields optional — mirrors WA dodge behaviour.
// Sets onboarding_state = 'complete'.

'use strict';

const express           = require('express');
const router            = express.Router();
const requireCoupleAuth = require('../middleware/requireCoupleAuth');
const asyncHandler      = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

router.post('/', requireCoupleAuth, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const coupleId = req.coupleUser.couple_id;

  const { wedding_date, partner_name, wedding_city, budget_total } = req.body || {};

  const updates = { onboarding_state: 'complete' };
  const notes   = [];

  if (wedding_date && typeof wedding_date === 'string' && wedding_date.trim()) {
    updates.wedding_date = wedding_date.trim();
    notes.push({ couple_id: coupleId, content: `Wedding date: ${wedding_date.trim()}`, tags: ['onboarding', 'date'] });
  }
  if (partner_name && typeof partner_name === 'string' && partner_name.trim()) {
    updates.partner_name = partner_name.trim().slice(0, 80);
    notes.push({ couple_id: coupleId, content: `Partner: ${partner_name.trim()}`, tags: ['onboarding', 'partner'] });
  }
  if (wedding_city && typeof wedding_city === 'string' && wedding_city.trim()) {
    updates.wedding_city = wedding_city.trim().slice(0, 80);
    notes.push({ couple_id: coupleId, content: `Wedding city: ${wedding_city.trim()}`, tags: ['onboarding', 'city'] });
  }
  if (budget_total) {
    const asInt = Number.isInteger(budget_total) ? budget_total : parseInt(budget_total, 10);
    if (Number.isInteger(asInt) && asInt > 0) {
      updates.budget_total = asInt;
      notes.push({ couple_id: coupleId, content: `Budget: Rs ${asInt.toLocaleString('en-IN')}`, tags: ['onboarding', 'budget'] });
    }
  }

  const { error } = await supabase.from('couples').update(updates).eq('id', coupleId);
  if (error) return errRes(res, 500, 'Could not save details. Please try again.');
  if (notes.length > 0) await supabase.from('notes').insert(notes);

  console.log(`[couple:onboarding] complete couple=${coupleId}`);
  return okRes(res, { message: 'Profile complete.' });
}));

module.exports = router;
