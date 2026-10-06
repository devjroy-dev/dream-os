// src/api/public/siteKind.js · TDW · CE-47 · WEB-4 cut 5 · WHICH RENDERER A VENDOR'S PAGE GETS (the chair's item 3).
//   GET /api/v2/public/site-kind/:code  ->  { v: 'classic' | 'styles' }
// WEB-5's middleware reads only this, so it is small and cacheable: a short shared cache (60 seconds). 'styles' is an
// active, unpaused vendor on Essential and up whose site has been PUBLISHED at least once (vendor_sites.published_at),
// the same rule the card applies; everyone else is 'classic'. Every miss is the card's one 404 body. The tier is read,
// never sent. A draft preview never goes through here (the card door serves it, uncached, to the room's token).
'use strict';

const express = require('express');
const router = express.Router();
const siteModel = require('../../lib/site/siteModel');
const { notFound } = require('./vendorCard');

const CODE = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/;

router.get('/:code', async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!CODE.test(code)) return notFound(res);
  try {
    const sb = req.app.locals.supabase;
    const { data: v, error } = await sb.from('vendors').select('id, status, discover_paused, tier').eq('routing_handle', code.toUpperCase()).maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: 'Lookup failed.' });
    if (!v || v.status !== 'active' || v.discover_paused === true) return notFound(res);
    let kind = 'classic';
    {   // cut 16: every plan, Basic included, is a styles site once published
      const { data: s } = await sb.from('vendor_sites').select('published_at').eq('vendor_id', v.id).maybeSingle();
      if (s && s.published_at) kind = 'styles';
    }
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    // CE-47 WEB-4 cut 14: `ok: true` beside v. The app's lib/site/kind.ts takes 'styles' only when j.ok && j.v === 'styles';
    // without ok every vendor fell to the classic page, even after Publish.
    return res.status(200).json({ ok: true, v: kind });
  } catch (_e) {
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }
});

module.exports = router;
