#!/usr/bin/env python3
"""
build_demo_jwt.py
Run in /workspaces/dream-os

Adds GET /api/v2/demo/session endpoint to demo/vendor.js
Returns a real JWT for the demo vendor UUID.

DEMO USER ID:  aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa
DEMO VENDOR ID: bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb

The JWT is minted using the same mintSession() function used for real vendors.
No phone, no PIN — just a direct token for the demo UUID.
Safe because the UUID belongs to a fake phone +20000000000001.
"""

import sys, subprocess
from pathlib import Path

BASE = Path('.')

def patch(p, old, new, label):
    path = BASE / p
    t = path.read_text()
    if old not in t:
        print(f'  MISS [{label}]')
        sys.exit(1)
    path.write_text(t.replace(old, new, 1))
    print(f'  OK   [{label}]')

print('\n── Adding GET /demo/session to demo/vendor.js ──────────────────────────')

patch('src/api/demo/vendor.js',
    "module.exports = router;",
    """
// ── GET /session — mint a real JWT for the demo vendor UUID ──────────────────
// No auth required. Returns a short-lived JWT for the shared demo vendor account.
// Safe: demo UUID is tied to fake phone +20000000000001, not a real vendor.
router.get('/session', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const DEMO_USER_ID   = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa';
  const DEMO_VENDOR_ID = 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';

  try {
    const { mintSession } = require('../vendor/auth');
    const tokens = await mintSession(supabase, DEMO_USER_ID);

    console.log('[demo:session] minted JWT for demo vendor');
    return res.json({
      ok:            true,
      vendor_id:     DEMO_VENDOR_ID,
      user_id:       DEMO_USER_ID,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      name:          'Demo Studio',
      tier:          'signature',
    });
  } catch (err) {
    console.error('[demo:session] mint failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Could not create demo session.' });
  }
}));

module.exports = router;
""",
    'add /demo/session endpoint'
)

print('\n── Validate JS syntax ──────────────────────────────────────────────────')
result = subprocess.run(
    ['node', '--check', 'src/api/demo/vendor.js'],
    capture_output=True, text=True
)
if result.returncode == 0:
    print('  CLEAN ✓')
else:
    print('  ERRORS:')
    print(result.stderr)
    sys.exit(1)

print('\n✅  Done. Commit with:')
print('  git add src/api/demo/vendor.js')
print('  git commit -m "feat(demo): GET /demo/session — mint real JWT for demo vendor UUID"')
print('  git push')
