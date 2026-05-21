// src/api/middleware/requireCircleMemberAuth.js
//
// Verifies circle member JWT and confirms active circle membership.
// users.phone and circle_members.invitee_phone are both E.164 — direct match.

'use strict';

module.exports = async function requireCircleMemberAuth(req, res, next) {
  const supabase = req.app.locals.supabase;

  const header = (req.headers['authorization'] || '').trim();
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }
  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('phone, name')
    .eq('id', user.id)
    .maybeSingle();

  if (!userRow) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // E.164 direct match — same format in both tables
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, role, invitee_name, status')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return res.status(403).json({ success: false, error: 'Not a circle member.' });
  }

  req.circleMember = {
    user_id:       user.id,
    co_planner_id: member.id,
    couple_id:     member.couple_id,
    role:          member.role,
    name:          userRow.name || member.invitee_name || null,
    permissions: {
      dreamai_access_granted: false,
      can_see_budget:         false,
      can_see_guests:         false,
      can_see_vendors:        false,
      can_contribute_muse:    true,
    },
  };

  next();
};
