'use strict';
// src/api/public/hub.js · CE-47 · HUB-1 · THE PAGE ANYONE CAN OPEN: GET /api/v2/public/hub/:handle
// Public, read only, no session. One answer for "no such page" whatever the reason. Shows the page card (links, never
// plain handles) and "Worked with": only credits both sides have said yes to, each line naming the others with links
// to their pages. Never a phone, an email, a client or a price.
const express = require('express');
const router = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const profiles = require('../../lib/hub/profiles');
const credits = require('../../lib/hub/credits');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthWords = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})/); return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };

router.get('/:handle', asyncHandler(async (req, res) => {
  const sb = req.app.locals.supabase;
  const h = profiles.toHandle(req.params.handle);
  const miss = () => errRes(res, 404, 'No such page');
  if (!h) return miss();
  const { data: p } = await sb.from('hub_profiles').select(profiles.COLS).eq('handle', h).maybeSingle();
  if (!p) return miss();
  if (p.owner_kind === 'org') {   // a blocked partner's page is gone, the same miss (PTN's rule)
    const { data: o } = await sb.from('partner_orgs').select('check_state').eq('id', p.org_id).maybeSingle();
    if (!o || o.check_state === 'blocked') return miss();
  }
  const lines = await credits.workedWith(sb, p.id);
  const ids = [...new Set(lines.flatMap((l) => l.with_ids))];
  const others = ids.length ? ((await sb.from('hub_profiles').select(profiles.COLS).in('id', ids)).data || []) : [];
  const card = new Map(others.map((o) => [o.id, profiles.publicCard(o)]));
  res.set('Cache-Control', 'public, max-age=60');
  return okRes(res, {
    page: profiles.publicCard(p),
    worked_with: lines.map((l) => ({ shoot: l.shoot_name, city: l.city, month: monthWords(l.month), from_call: l.from_call,
      with: l.with_ids.map((id) => card.get(id)).filter(Boolean).map((c) => ({ name: c.name, page_url: c.page_url })) })),
    line: `Each line was confirmed by the person it names. Contact happens when someone picks ${p.display_name} for a call.`,
  });
}));

module.exports = router;
