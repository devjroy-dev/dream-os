# TDW_05 · F-05.9 — Signup OTP off dead Twilio · EXECUTOR SESSION HANDOVER

**Sealed at:** `dream-os abbcfe4` · `dreamos-pwa 165e17a`
**Charter:** audit-before-spec; resolve signup OTP fully off dead Twilio before the W2 cutover witness resumes. Both phases (audit + fix) complete and CE-sealed. This session **CLOSES**.
**Scope of this doc:** executor's own handover only — it carries **no** `FINDINGS_LOG` / masterplan edits (the CE record rides its own docs ZIP).

---

## SHIPPED

**dream-os `abbcfe4`** (base `907814b`) — landed delta `+463 / −0`, **additive-only**:

- `src/lib/ensureAuthIdentity.js` (new, 101 lines) — the create-or-heal helper. One phone → exactly one auth identity: created if absent (`admin.createUser({ phone, phone_confirm:true })`, identity-only, no SMS), re-linked if the phone already owns one, never a second. Binds the id onto `public.users.auth_user_id`. Uses the **service-role** `authClient`, not the app data client.
- `src/api/couple/auth.js` (`+12 / −0`) and `src/api/vendor/auth.js` (`+12 / −0`) — `ensureAuthIdentity` called in `/verify-otp` **after the code is proven, before `mintSession`**. `mintSession` **untouched** (0-line diff, byte-identical).
- `scripts/b05_f059_signup_bench.js` (new, 338 lines) — the F-05.9 acceptance bench.

**dreamos-pwa `165e17a`** (base `b5c148d`) — landed delta `+26 / −13` (a **swap**, not additive):

- `app/(landing)/page.tsx` — `sendOtp` and `verifyOtp` moved off the dead client-side Supabase Phone-OTP (`signInWithOtp` / `verifyOtp`, Twilio) onto the backend Meta path: `/{couple|vendor}/auth/send-otp` → `/verify-otp` (purpose `login`) → `/provision` on the minted session. The now-unused `supabase` import was removed. Signup **and** the returning-but-no-PIN lane both ride the new path.

---

## PROVEN

- **signup bench 10/10**, non-vacuous by production mutation:
  - MUT-A (drop the `auth_user_id` link) → A1 / B1 / B2 **RED**.
  - MUT-B (heal fabricates a second identity) → A2 **RED**.
  - restored → 10/10. Covers create / heal / already-bound / create-fail-throws / client-separation, plus the **§9 synthesis** (couple + vendor: `/send-otp` → `/verify-otp`[create+mint] → `/provision` against one shared in-memory DB, proving exactly one identity and `public.users.auth_user_id` resolving to it — no divergent identity, no second users row).
- **Sealed benches byte-stable:** `b05_f056_otp_meta_bench` **33/33**, `b05_f056_otp_hotfix_bench` **21/21** — with the F-05.9 changes applied.
- **`mintSession` 0-line diff** — byte-identical in both `auth.js` files, re-derived at origin `abbcfe4`.
- **Security invariants:** service-role `authClient` for `createUser` (not the data client); no OTP value and no identity id in any verify-path log line; bcrypt-before-send carried by the sealed benches; 500 + `otp_sessions`-delete-on-failure shape inherited.
- Landed under §7/D-10: both packets rehearsed clean-apply from pristine base; the D-10 gate was **witnessed live** — the mis-dropped backend ZIP produced a red verify (`MODULE_NOT_FOUND`) and STOP fired before any dream-os commit; nothing half-pushed.

---

## SCOPE / SWEEP

- **F-05.9 was an auth-identity-creation gap, not a delivery gap.** Backend `/send-otp` (couple + vendor) already self-mints `public.users` + the role row and already delivers the code over **Meta**. `mintSession` is find-only by contract; the **only** thing that ever created the Supabase `auth.users` identity was the client-side `signInWithOtp({ shouldCreateUser:true })` (Twilio, dead). The whole gap was the missing `admin.createUser`, plus swapping the client off the dead call.
- **Other-dead sweep clean.** Grep of both repos for `signInWithOtp` / `resetPasswordForEmail` / `signInWithPassword` / `type:'sms'` / `magiclink` / `inviteUserByEmail`: the only dead Twilio-dependent path was the landing `signInWithOtp` (now swapped). `generateLink` is `type:'magiclink'` over an internal email — `mintSession`'s own mechanism, no Twilio, sound. **No remaining Twilio / Supabase-phone OTP path.**

---

## DRIFT vs the kickoff

The kickoff framed the fix as a **"new backend send/verify."** The audit showed that scaffolding already existed and was Meta-backed; the true gap was **identity creation**. The CE ruling adopted Option 2 in its minimal confirmed form and **superseded the kickoff's framing accordingly** — no new send/verify was authored; the fix is one shared helper on the proven path plus the client swap.

---

## NAMED RESIDUAL (not a blocker)

`findAuthUserByPhone` (heal path only) is a **bounded `admin.listUsers` scan** — ≤ 50 pages × 200 = ~10k-user ceiling. It fires only when `createUser` reports the phone already owns an identity (a prior half-failed attempt or a legacy phone-OTP identity), never on the common create path. **Revisit** if a phone-indexed admin lookup becomes available, or if the user base approaches ~10k.

---

## NEXT SITTING

- **Nothing for OTP — this session is closed.**
- The **W2 cutover** executor session resumes separately, carrying the two banked corrections:
  1. `BRIDE_PHONE_NUMBER_ID` is also required/set on **dream-os** (not the bride service alone).
  2. The corrected **fork-tells** (the witnessed signals of a divergent identity / lane fork).
- Post-seal roadmap unchanged: W2 cutover witness → bride cutover → vendor cutover → M2b Twilio sunset → P4 (crons and reminders).
