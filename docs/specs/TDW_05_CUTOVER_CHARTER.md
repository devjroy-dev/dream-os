# TDW_05 — Lane Cutover Charter (Twilio → Meta)

**Author:** CE (sixth chair), 2026-07-19. **Base:** transport migration BUILD-COMPLETE at `a855fa6` (CE-33 — both lanes dormant, W-1-proven). **Applies to:** the bride lane (first) and the vendor lane (second), one at a time.

> A cutover is **the founder's atomic provisioning act** that flips one already-built, dormant lane from Twilio to Meta. It is not a build. Nothing in the repo changes at a cutover; only Railway env + the Meta webhook change. The CE seals a cutover on the founder's **witnessed** evidence.

## 1. Why this is safe (the design behind it)
Both halves of each lane are already built and dormant (M1a outbound + M1b/M2 inbound). `metaLaneFor` returns the lane only when its `*_PHONE_NUMBER_ID` env is present in that process, so today every send falls to the byte-identical Twilio path and `/webhook/meta` receives nothing. The Twilio code is **retained until M2b** — so a cutover is fully reversible: unset the id + re-point the webhook and the byte-identical Twilio path resumes instantly. This reversibility is exactly why the Twilio delete is gated to M2b.

## 2. Atomicity (the one rule)
A WhatsApp number lives on **one platform at a time**. The instant the bride number is registered on Meta and its webhook points at `/webhook/meta` with `BRIDE_PHONE_NUMBER_ID` set, **inbound and outbound both flip to Meta together** — there is no half-state. One lane at a time; the other lane, lacking its `*_PHONE_NUMBER_ID`, stays on Twilio automatically.

## 3. The provisioning sequence (bride; vendor is identical with VENDOR_* vars)
1. **Provision** a Meta phone-number-id for the bride line — a fresh Meta number, or the existing test number migrated onto the Cloud API (migration deregisters it from Twilio; fine for test accounts). Note the **phone-number-id** and the **display number**.
2. **Set env on the bride service** (Railway): `BRIDE_PHONE_NUMBER_ID`, `BRIDE_WHATSAPP_NUMBER` (the display number, `whatsapp:+E164`), `META_WABA_TOKEN` (a permanent System User token, not a 24h sandbox token), `META_APP_SECRET`, `META_VERIFY_TOKEN`. (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` already present; `META_GRAPH_VERSION` optional, defaults v21.0.) Secrets are Railway variables, never recorded in repo.
3. **Point the Meta webhook** at the bride service's `POST /webhook/meta`; complete the `GET` verify handshake (verify-token = `META_VERIFY_TOKEN`); **subscribe the `messages` field**.
4. **Redeploy** the bride service (env change). Confirm a green boot.

## 4. The witness bar (what proves the cutover — the CE's acceptance)
Witnessed live on the test accounts, watched in the Railway logs:
1. **Inbound:** a test handset texts the bride number → arrives on `/webhook/meta`, X-Hub-Signature-256 verifies (no sig error), the turn runs, no dead-letter.
2. **Reply, content-identical:** the handset receives the bride reply via Meta (`status=sent`), and the reply **reads exactly as it did on Twilio** — this is the W-1 guarantee the whole migration exists to preserve. Run 2–3 ordinary bride turns and confirm the wording is unchanged.
3. **Opt-out gate live (F-05.2):** on the bride lane, an opted-out phone is now blocked — verify a send to an opted-out number refuses (no `status=sent`).
4. **Deferred, not required here:** the window-closed morning nudge (`morning_nudge_bride`, a **template** send) rides the same still-open **P3 opener-template proof** — the core cutover is witnessed by 1–3 above; the nudge-template send is confirmed whenever the template proof lands.

## 5. Rollback (if any step reds)
Reverse the provisioning act: unset `BRIDE_PHONE_NUMBER_ID` (and/or move the number back to Twilio) and re-point the webhook to `/webhook/whatsapp`. The retained Twilio path resumes byte-identical immediately. Report the red to the CE with the row id / log tell; it files as a finding and the CE charters the fix before re-attempting. **Do not run M2b (the Twilio delete) while any lane can still need rollback.**

## 6. Gates
- **Before ANY cutover (MUST — F-05.6, CE-35):** OTP moves onto the Meta transport. PRIMARY (a): the lane's Meta AUTHENTICATION template(s) approved + the OTP sites wired to `metaCloud.sendMetaTemplate` (minutes to approve — off the critical path). FALLBACK (b, sealed): `OTP_WA_NUMBER` (dedicated Twilio number) — set it as an emergency backstop; it survives M2b. Sites 1–3 (couple/circle) before the BRIDE cutover; sites 4–5 (vendor) before the VENDOR cutover. Post-cutover OTP rides the lane's Meta number as an auth template (opt-out-exempt, un-gated by F-05.2).
- **Before:** M1a + M1b (bride) sealed — DONE (CE-31/CE-32). Vendor: M2 sealed (CE-33).
- **After both lanes are cut over and witnessed:** M2b (Twilio sunset) deletes the retained Twilio code and re-baselines `b5_webhookcore`. Not before — rollback safety depends on the Twilio path staying present until both lanes are confirmed live on Meta. (Note: `OTP_WA_NUMBER` stays on Twilio past M2b — the sunset removes the conversational Twilio transport, not the dedicated OTP number.)

## 7. Seal
The CE seals each cutover on the founder's witnessed evidence (log tells + handset delivery + content-identity), records it (CE-NN + masterplan 05-row), and activates F-05.2 for that lane in the record. F-05.2 fully closes at M2b (all lanes Meta).
