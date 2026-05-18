// src/api/_test/whoami.js
// Smoke-test endpoint — DELETE before Block 2 goes live.
//
// GET /api/v2/_test/whoami
// Requires: Authorization: Bearer <access_token>
// Returns:  { ok, user_id, phone }
//
// Test sequence:
//   1. POST /api/v2/vendor/auth/send-otp { phone }
//   2. POST /api/v2/vendor/auth/verify-otp { phone, otp, purpose:'login' } → save access_token
//   3. GET  /api/v2/_test/whoami  Authorization: Bearer <token>  → 200 + user_id
//   4. GET  /api/v2/_test/whoami  (no header)                    → 401
//   5. GET  /api/v2/_test/whoami  Authorization: Bearer garbage  → 401
//   6. POST /api/v2/vendor/auth/pin-login { phone, pin } → access_token → repeat step 3

'use strict';

const express     = require('express');
const router      = express.Router();
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, (req, res) => {
  return res.json({
    ok:      true,
    user_id: req.auth.user_id,
    phone:   req.auth.phone,
  });
});

module.exports = router;
