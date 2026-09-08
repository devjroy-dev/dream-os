// src/api/couple/concierge.js — FOLDED (Block 20 Concierge s1, R-41.19, CE-41 seat A).
//
// WHAT THIS FILE WAS: `POST /request` wrote a `concierge_request` row into
// `admin_activity_log` and sent the founder one WhatsApp line; `GET /requests`
// read those rows back for an admin. `admin_activity_log` is an audit log, not a
// request store; the request is now a `public.assistance_requests` row written by
// the one home (src/lib/couple/assistance.js), read by /api/v2/admin/assistance.
//
// WHAT THIS FILE IS NOW, and for how long:
//   POST /request  → 308 to /api/v2/couple/assistance. Same mount, same auth
//                    (requireCoupleAuth at core.js:13); 308 preserves method and
//                    body, so the one caller (dreamos-pwa components/frost/blooms/
//                    meridian.tsx:33, `body:'{}'`) reaches the new door and is
//                    refused there with `no_items` — honest, not silent — until A3
//                    folds the caller. Seat D deletes this file (the 308's life is
//                    the A2→A3 deploy interval and nothing longer).
//   GET  /requests → DELETED. Zero callers in either repo at 57d12d4, proven by
//                    `grep -rn "concierge/requests"` over src/ and the pwa's
//                    app/ components/ lib/ (packet note). Its admin-inside-couple-auth
//                    posture (F-07.77/.85) does not survive because nothing reads it.
//
// The founder's notify (F-07.76 recipient law, F-05.48 read-your-own-result) is
// CARRIED into the writer, not dropped — see notifyFounder in the one home.
// ADMIN_PHONE is no longer read here.

'use strict';

const express = require('express');
const router  = express.Router();

const NEW_DOOR = '/api/v2/couple/assistance';

router.post('/request', (req, res) => {
  res.set('Location', NEW_DOOR);
  return res.status(308).json({ ok: false, code: 'moved', location: NEW_DOOR, error: `Moved to ${NEW_DOOR}.` });
});

module.exports = router;
