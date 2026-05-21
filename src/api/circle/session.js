// src/api/circle/session.js
// GET /api/v2/circle/session/:userId
//
// Returns full CircleSession shape the coplanner expects.
// Called after verify-pin and on background hydration refresh.
// users.phone and circle_members.invitee_phone are both E.164 — direct match.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

router.get('/:userId', asyncHandler(async (req, res) => {
  const supabase   = req.app.locals.supabase;
  const { userId } = req.params;

  // 1. Get user row
  const { data: userRow } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('id', userId)
    .maybeSingle();

  if (!userRow) {
    return res.json({ success: false, error: 'User not found.' });
  }

  // 2. Find active circle_member by E.164 phone (same format in both tables)
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, role, status, invitee_name')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return res.json({ success: false, error: 'Not an active circle member.' });
  }

  // 3. Get couple + bride name
  const { data: couple } = await supabase
    .from('couples')
    .select('id, wedding_date, partner_name, pin_hash, users(name)')
    .eq('id', member.couple_id)
    .maybeSingle();

  const permissions = {
    dreamai_access_granted: false,
    can_see_budget:         false,
    can_see_guests:         false,
    can_see_vendors:        false,
    can_contribute_muse:    true,
  };

  return res.json({
    success: true,
    data: {
      user_id:       userRow.id,
      name:          userRow.name || member.invitee_name || null,
      phone:         userRow.phone,
      pin_set:       !!(couple?.pin_hash),
      co_planner_id: member.id,
      couple_id:     member.couple_id,
      role:          member.role,
      permissions,
      bride: {
        name:         couple?.users?.name  || null,
        wedding_date: couple?.wedding_date || null,
        partner_name: couple?.partner_name || null,
      },
    },
  });
}));

module.exports = router;
