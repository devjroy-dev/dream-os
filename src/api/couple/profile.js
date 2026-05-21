// src/api/couple/profile.js
// GET /api/v2/couple/profile/:brideId
//
// Public — no auth required. Returns non-sensitive couple profile for
// the coplanner home page. brideId = couple.id.
// Response: { success, data } (coplanner checks pr?.success && pr.data)

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const { brideId } = req.params;

  const { data: couple, error } = await supabase
    .from('couples')
    .select('id, wedding_date, partner_name, users(name)')
    .eq('id', brideId)
    .maybeSingle();

  if (error) {
    console.error('[GET /couple/profile] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch profile.' });
  }
  if (!couple) {
    return res.json({ success: false, error: 'Couple not found.' });
  }

  let days_until_wedding = null;
  if (couple.wedding_date) {
    const wDate = new Date(couple.wedding_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((wDate.getTime() - today.getTime()) / 86400000);
    days_until_wedding = diff > 0 ? diff : 0;
  }

  return res.json({
    success: true,
    data: {
      id:                 couple.id,
      bride_name:         couple.users?.name  || null,
      groom_name:         couple.partner_name || null,
      wedding_date:       couple.wedding_date || null,
      days_until_wedding,
    },
  });
}));

module.exports = router;
