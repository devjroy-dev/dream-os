# TDW · CE-47 · WEB-4 · CUT 20 HANDOVER · the Instagram return for the two-minute start (dream-os)

Cut at dream-os `68b6568`, 6 October 2026, for the next server train. Rung **b265**. No migration. Option (A), ruled.
ig.js and igOAuth.js are the finished IG seat's files, given to WEB-4 for this cut.

## What changes
- **src/lib/vendor/igOAuth.js, mintState and verifyState only.** mintState writes `r: 'start'` into the signed state's
  body ONLY when asked (`opts.ret === 'start'`); a state minted without it is built exactly as before ({ v, n, t[, s] }).
  verifyState reads back `ret: 'start'` or `null` (nothing else is ever read back). sign(), the HMAC, the key, the TTL,
  the redirect URI, the scopes and the callback path are untouched.
- **src/api/vendor/ig.js.** GET /authorize accepts `return=start` (an allow-list of one; any other value, or none, is
  ignored) and mints `{ flavour, ret }` only then. The callback reads where she came from out of the signed state (a
  pure read, no database), and backToPortfolio sends her to `/vendor/onboarding` with the callback's usual `?ig=` result
  (cancelled, failed and the reason, connected) when it is 'start'. Otherwise every existing return is exactly as
  before: portfolio, posts (insights), number (messages). An unsigned or rejected state never returns her to set-up.
- **src/lib/pwaPaths.js.** One new entry, `onboarding: '/vendor/onboarding'`, the one home for navigation literals
  (F-38.p12; b45 E holds it).

## Proven
b265 14/0 against main's own igOAuth.js (git show 68b6568):
- the authorize URL byte-equal for all three kinds (so the redirect URI and the scopes inside it); the scopes and
  callback path unchanged; sign() byte-equal; the TTL unchanged;
- a state minted without the field has main's keys; a state minted BY MAIN still verifies; 'start' rides the state and
  reads back; any other value is never written; a changed state is refused;
- over HTTP: return=start reaches the state, an unlisted value or none does not; the callback returns her to
  /vendor/onboarding?ig=cancelled from set-up and to today's /vendor/portfolio otherwise;
- two mutations run.
No timing cell. Clean tip: 6 passed, 8 failed.
b77 2.3 amended by label (authorize's mintState call now carries the optional return; read line-for-line as on the
clean tip). b45 green (the address lives in pwaPaths.js).
Differential over the readers of ig.js, igOAuth.js and pwaPaths.js and the source walkers: exits identical. Output moved
only in b77's labelled line, and in a clock line and a path line (b230, b4c1).

## Walk card (walked inside FE-9's two-minute card)
VENDOR: a new test vendor on Basic, not yet connected to Instagram. SWITCH ON FIRST: nothing; FE-9's set-up live.
1 From set-up, tap Connect Instagram, sign in to Instagram and allow. SEE: she lands back on set-up
  (/vendor/onboarding?ig=connected), and the first build starts.
2 Repeat on another new vendor, but tap Cancel on Instagram's screen. SEE: back on set-up with ?ig=cancelled (set-up shows
  its own "try again").
3 From her Portfolio, tap Connect Instagram (the old way). SEE: she lands back on Portfolio, exactly as before.
4 Instagram's own consent screen. SEE: the same permissions as before (nothing new is asked).
IT FAILED IF: set-up's connect lands on Portfolio; Portfolio's connect lands on set-up; or Instagram shows a different
permission list or an error about the redirect address.
