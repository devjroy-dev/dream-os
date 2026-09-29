# TDW · CE-46 · G6-4 · cut A · F-44.245 · DEV_OTP removed · handover

Base: G6-5's dream-os cut (f7598713...) on G6-4's (0e5fd1d9...) on c252d67. Rung b156. No migration. Lands after G6-5.

- `src/api/vendor/auth.js` and `src/api/couple/auth.js`, POST /verify-otp: the `_devOk` line and its log are removed. A code is valid
  only against the hash stored by that phone's own send: a random code sent on WhatsApp, or, on the vendor door only, REVIEWER_OTP
  for REVIEWER_PHONE (src/lib/vendor/reviewerLogin.js, IGD-2 G7), which is now the only fixed code.
- b152 7.2 re-pinned by label (DEV_OTP's line gone; auth.js still never reads REVIEWER_*).
- b156: DEV_OTP set in the env signs no one in on either door; each phone's own code passes; REVIEWER_OTP passes on REVIEWER_PHONE
  only and never on the couple door; no file under src reads DEV_OTP. Three in-memory mutations redden their cells.
- Railway: DEV_OTP was deleted from dream-os's variables on 29 September 2026 (the chair); the walk reads it back as still unset.
