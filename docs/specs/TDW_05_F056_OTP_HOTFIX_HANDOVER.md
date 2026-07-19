# base: dream-os @ 9f4ac36 (origin/main; re-derived via `git fetch -q origin && git rev-parse --short origin/main`) — F-05.6 fix (b) applies onto this.

# TDW_05 — F-05.6 fix (b) — OTP/auth decoupled from the migrating lane numbers (build sitting)

**What this is.** The ruled cure for **F-05.6 / CE-34**: the five business-initiated OTP sends went DIRECT via Twilio from the lane numbers (`couple/auth.js` ×2, `circle/join.js`, `vendor/auth.js` ×2), so a Twilio→Meta lane cutover — which deregisters the number from Twilio — would break signup / login / PIN-reset / circle-join. This sitting builds **fix (b)**: route every OTP send's `from` through a dedicated `OTP_WA_NUMBER` that never migrates.

## What changed (from-resolution ONLY)
One new module-load constant per file, mirroring the existing `+`-prefix convention, plus five `from` swaps:

```
const OTP_WA = process.env.OTP_WA_NUMBER
  ? `+${process.env.OTP_WA_NUMBER}`
  : BRIDE_WA;      // VENDOR_WA in vendor/auth.js
```

- `src/api/couple/auth.js` — `OTP_WA` (falls back to `BRIDE_WA`); `/send-otp` + `/forgot-pin` `from` → `whatsapp:${OTP_WA}`.
- `src/api/circle/join.js` — `OTP_WA` (falls back to `BRIDE_WA`); `/send-otp` `from` → `whatsapp:${OTP_WA}`.
- `src/api/vendor/auth.js` — `OTP_WA` (falls back to `VENDOR_WA`); `/send-otp` + `/forgot-pin` `from` → `whatsapp:${OTP_WA}`.

**Dormancy.** While `OTP_WA_NUMBER` is UNSET, `OTP_WA` resolves to the file's existing lane var — the produced `from` string is **byte-identical** to the pre-fix send. The instant the founder sets `OTP_WA_NUMBER` (bare digits, a Twilio number kept on Twilio), all five OTP sends leave from that dedicated number and survive any lane cutover.

**NOT touched (security invariants preserved exactly):** the OTP body strings (transactional copy — founder veto; W-1 clean), the bcrypt-hash-before-send, the phone-only logging (never the OTP), the `otp_sessions` delete-on-failure, the 500 error shape. No migration, no schema. Env var only.

## Proof (this sitting)
- `node --check` clean on all three files.
- **New bench** `scripts/b05_f056_otp_hotfix_bench.js` — 21/21, non-vacuous. Drives the REAL route handlers (twilio stubbed at the module boundary to capture `messages.create` params; supabase faked to the happy-path role rows; handler pulled off the live `router.stack`) and asserts:
  - **(i)** `OTP_WA_NUMBER` SET → all five sends leave from the dedicated number.
  - **(ii)** UNSET → each falls back to its current per-file number, byte-identical (default `+14787788550` / `+917982159047`, and tracks `BRIDE_WA_NUMBER`/`TDW_WA_NUMBER` when those are set).
  - **(iii)** body strings byte-stable (reference oracle per site); OTP stored as a `$2` bcrypt hash (≠ the code); no code path logs the OTP, while phone-only logging still fires.
  - Vacuity guards: every run asserts the send path executed (captured `from` non-null); a wrong-`from` expectation is asserted to throw; the log scanner is self-tested against a planted leak.
- **Byte-stable:** the four migration benches unmodified and green (`b05_m1_transport` 16, `b05_m1b_inbound` 6, `b05_m2_vendor_inbound` 4, `b05_p2_sendwa` 49). **W-1 grep clean:** the diff touches no `body:` line; the only added lines beyond the `OTP_WA` const are the three `from: whatsapp:${OTP_WA}` swaps.

## Founder provisioning step (at deploy — separate from the code apply)
Set ONE Railway variable on the couple, bride, and vendor services (whichever run these routes):
1. **`OTP_WA_NUMBER`** = the dedicated Twilio WhatsApp number's E.164 digits **without `+`** (e.g. `14155550000`) — a Twilio number that is **kept on Twilio and never migrated to Meta**. This number stays on Twilio past M2b (the sunset removes the conversational Twilio transport, not the dedicated OTP number — charter §6).

Until this variable is set the fix is dormant and behavior is byte-identical to today. No secret is printed anywhere; it is a Railway variable.

## Gate status (charter §6 / CE-34)
- **Before the BRIDE cutover (MUST):** this fix landed + verified for sites 1–3 (couple ×2, circle) — satisfied by this build once sealed and `OTP_WA_NUMBER` provisioned.
- **Before the VENDOR cutover (MUST):** sites 4–5 (vendor ×2) — same change, same variable; satisfied by this build.
- **Trails:** fix (a) Meta AUTHENTICATION-category OTP template (durable, file early) and (c) SMS fallback (DLT-gated) — neither blocks a cutover.

## Next sitting
The CE re-derives this census + bench at origin and seals; only then does the bride cutover un-hold. The cutover sequence then runs: **F-05.6 (b) sealed → bride cutover → vendor cutover → M2b (Twilio sunset; F-05.2 fully closes) → P4.**
