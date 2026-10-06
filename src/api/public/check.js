// src/api/public/check.js · CE-47 · PRO · P1 · THE CHECK DOOR (mounted at /api/v2/public/check).
//   GET /:code   what an issued paper states, its issue date, and "valid" or "withdrawn" (F7, ruled).
// Shows only the frozen figures the paper itself printed; the statement's totals appear only on its own code.
// A withdrawn paper shows its title, name and dates, never its figures. Unknown or malformed codes get one answer.
// TRY LIMIT (F-44.361, ruled): 60 GETs an hour per address, in memory per server process, keyed by the address's
// sha256 (never the address), through the estate's limiter (src/lib/site/limiter.js), as testimonial.js does.
'use strict';
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const limiter = require('../../lib/site/limiter').makeLimiter({ cap: 5000 });
const HOUR = 3600 * 1000; const PER_ADDR_GET = 60;
const TOO_MANY = { ok: false, error: 'Too many tries. Please try again in an hour.' };
const addrKey = (req) => `addr:check:${crypto.createHash('sha256').update(String(req.ip || '')).digest('hex')}`;
const { readCode } = require('../../lib/papers/code');
const { lines, note } = require('../../lib/papers/render');
const W = require('../../lib/papers/words');

const NOT_FOUND = { ok: false, error: 'TDW has no paper with this check code.' };
router.get('/:code', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!limiter.hit(addrKey(req), PER_ADDR_GET, HOUR)) return res.status(429).json(TOO_MANY);
  const code = readCode(req.params.code); if (!code) return res.status(404).json(NOT_FOUND);
  try {
    const r = await req.app.locals.supabase.from('issued_papers').select('kind, period_from, period_to, purpose, figures, check_code, issued_at, withdrawn_at').eq('check_code', code).maybeSingle();
    if (r.error) return res.status(503).json({ ok: false, error: 'TDW could not check this code just now. Please try again.' });
    if (!r.data) return res.status(404).json(NOT_FOUND);
    const p = r.data; const name = (p.figures || {}).name || '';
    if (p.withdrawn_at) return res.json({ ok: true, paper: { check_code: p.check_code, title: W.KIND_TITLE[p.kind], state: 'withdrawn', name, issued_on: W.fullDate(p.issued_at), withdrawn_on: W.fullDate(p.withdrawn_at), lines: [], note: `${name} withdrew this paper. It no longer stands.` } });
    return res.json({ ok: true, paper: { check_code: p.check_code, title: W.KIND_TITLE[p.kind], state: 'valid', name, issued_on: W.fullDate(p.issued_at),
      purpose: p.kind === 'statement' && p.purpose ? W.PURPOSE[p.purpose] : null, lines: [...lines(p), ['Issued', W.fullDate(p.issued_at)]], note: note(p),
      photo_url: p.kind === 'id_card' && /^https:\/\//.test(String((p.figures || {}).photo_url || '')) ? p.figures.photo_url : null } });
  } catch (_e) { return res.status(503).json({ ok: false, error: 'TDW could not check this code just now. Please try again.' }); }
});
module.exports = router;
module.exports._limiter = limiter;
module.exports.LIMITS = { PER_ADDR_GET };
