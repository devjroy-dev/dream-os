#!/usr/bin/env python3
"""
Patch 04 — Add POST /api/v2/vendor/auth/refresh endpoint
File: src/api/vendor/auth.js

Adds a token refresh endpoint that:
1. Accepts { refresh_token }
2. Calls Supabase auth.refreshSession() using the service role client
3. Returns { access_token, refresh_token } on success
4. Returns 401 on failure (expired or invalid refresh token)

The frontend (_base.ts) calls this on any 401 response before retrying.
Zero changes to existing auth endpoints or WhatsApp flow.
"""

TARGET = 'src/api/vendor/auth.js'

with open(TARGET, 'r') as f:
    src = f.read()

# Insert the refresh endpoint before module.exports
OLD = 'module.exports = router;'

NEW = '''// ---------------------------------------------------------------------------
// POST /refresh
// Body:    { refresh_token }
// Returns: { ok, access_token, refresh_token }
// No requireAuth — this is called precisely when the access_token has expired.
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { refresh_token } = req.body;

  if (!refresh_token || typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'refresh_token is required.', reason: 'missing_token' });
  }

  try {
    // Exchange refresh_token for a new session via Supabase
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      console.warn('[vendor:refresh] refresh failed:', error?.message || 'no session');
      return res.status(401).json({
        error:  'Session expired. Please log in again.',
        reason: 'refresh_failed',
      });
    }

    console.log('[vendor:refresh] session refreshed successfully');
    return res.json({
      ok:            true,
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

  } catch (err) {
    console.error('[vendor:refresh] unexpected error:', err.message);
    return res.status(500).json({ error: 'Could not refresh session. Please log in again.' });
  }
});

module.exports = router;'''

count = src.count(OLD)
assert count == 1, f'Anchor not unique — found {count} matches. Aborting.'
src = src.replace(OLD, NEW)

with open(TARGET, 'w') as f:
    f.write(src)

print(f'✓ /refresh endpoint added to {TARGET}')
print('Run: node --check src/api/vendor/auth.js')
