# TDW_05 Block 05 — P3 Handoff (Prospect Lane + Live Meta Transport Swap)

**Sitting:** P3, one sitting. **Base commit:** `091c906` (TDW_05 Note V).
**Split:** Movement A (built + benched, this delivery) · Movement B (live Meta smoke, FOUNDER-GATED — declared-not-claimed).

> **Reading order for the founder:** this doc → the founder-run SQL (`0085`, two sections) → the deploy ZIP paste block. The SQL is **not** in the ZIP.

---

## 0. What P3 is

The prospect (marketing) lane: a third small Railway service on `MARKETING_WHATSAPP_NUMBER` that
receives **Meta WhatsApp Cloud API** webhooks, runs a prospect state machine
(`cold → templated → replied → in_session → {expired|converted}`, plus `opted_out`), and answers
in-session with a single free-form holding line (no AI — 06's Closer soul slots in at that seam
later with zero transport change). Plus **the ruled transport swap**: `sendWa`'s template seam,
a throw-stub since P2, now POSTs the approved template to the Meta Cloud API.

---

## 1. WITNESSED vs DECLARED (the honesty line)

**WITNESSED (real, at the desk, this delivery):**
- All 10 touched files `node --check` clean.
- The five sealed benches **byte-stable**: `b5_wa_door_bench` 32/32 · `b5_describe_bench` 18/18 · `b5_webhookcore_bench` 43/43 · `b5b_movementb_bench` 56/56 · `b05_p2_sendwa_bench` 49/0.
- **`b5c_prospect_lane_bench` 47/47 GREEN**, non-vacuous two ways: an in-file MUTATION section (gate/cap/registry-name proven load-bearing) **and** an uncured cross-check — stash the tracked edits and the bench goes RED (`WaOptedOutError` absent, template seam throws `template_transport_unwired`); restore → 47/47.
- W-1 clean: `git status` shows **zero** agent/soul/prompt/voice/engine files. The diff is `sendWa.js`, `brideCron.js`, `router.js` (edits) + 7 new lib/service/admin files + the bench.
- The transport swap POST **shape** is asserted against a fake HTTP layer (global.fetch swap): `POST https://graph.facebook.com/v21.0/<phone-number-id>/messages`, `Bearer` from env, body `{messaging_product:'whatsapp', to:<normalized>, type:'template', template:{name:'tdw_marketing_opener', language:{code:'en'}, components:[…]}}`, error path → typed `MetaSendError`, no-creds → typed `MetaNotConfiguredError`.

**DECLARED, NOT CLAIMED (Movement B, founder-gated — nothing live ran):**
- **No live Meta send has occurred.** With Meta creds unset, every send path **refuses loudly** (typed `meta_not_configured`) rather than faking success. The live send lights only when the founder sets `META_WABA_TOKEN` + `MARKETING_PHONE_NUMBER_ID` and a prospect's phone receives a real message. That is Movement B, and it is his to witness.

---

## 2. What shipped (files)

**New:**
- `src/lib/metaCloud.js` — Meta Cloud API outbound (`sendMetaTemplate`, `sendMetaText`); env creds referenced never printed; injectable fetch; typed errors.
- `src/lib/metaInbound.js` — Meta inbound adapter: `verifyMetaSignature` (X-Hub-Signature-256, timing-safe), `handleVerifyChallenge` (GET hub.challenge), `normalizeMetaInbound`, `extractStatuses`.
- `src/lib/prospectCopy.js` — keyed free-form copy (`holding_line`, `opt_out_confirmation`) — **on the founder veto list**.
- `src/lib/prospects.js` — the state machine + jobs (`handleMarketingInbound`, `runOpenerJob`, `runExpiryJob`, `runConversionMatchJob`, `readDailyCap`).
- `src/marketingCron.js` — opener (10:00 IST) · expiry (hourly) · conversion (nightly), lazy node-cron.
- `src/marketingIndex.js` — the marketing service (Meta webhook GET verify + POST inbound, dedupe, dead-letter, graceful line, crons).
- `src/api/admin/prospects.js` — admin surface, mounted `/api/v2/admin/prospects` (board/intake/bulk/cap/conversation/send-opener/mark-converted).
- `scripts/b5c_prospect_lane_bench.js` — the P3 bench.

**Edited (additive, +67/-7 across three tracked files):**
- `src/lib/sendWa.js` — template seam wired to Meta; `WaOptedOutError` + the cross-line opt-out gate; `phoneNumberIdFor(line)`.
- `src/brideCron.js` — `supabase` threaded into both `routeNudge` sends (opt-out reaches the bride line).
- `src/api/router.js` — mount the prospects admin router.

---

## 3. The one schema expansion (0085, founder-run — CE-ruled)

Read-first found a **blocker**: `conversations_owner_xor` (0014) is unconditional —
`check ((vendor_id is null) <> (couple_id is null))` — so a `prospect_marketing` row (neither
vendor nor couple) is rejected. The kind-widen alone is necessary-but-insufficient. **CE ruling:**
`0085` Section A grows by the owner model — `conversations.prospect_id` + a 1-of-3 boolean-sum XOR
(explicit `::int` sum, not `num_nonnulls`) + index, `on delete cascade` required. Order:
**prospects → kind widen → conversations owner statements** (the FK needs `prospects` first).
This is the **only** expansion; the bound holds. Section B is the cap seed. Two independently-safe
commented sections, reverts in-file. **The SQL file is delivered separately and is not in the ZIP.**

---

## 4. Drifts & residuals (named, not smoothed)

1. **Rolling-window `session_opened_at`.** The ruled column set has no `last_inbound_at`. WhatsApp's
   24h window is rolling (each inbound reopens it), so `session_opened_at` is treated as the
   session **activity anchor** — stamped on open **and re-stamped on each subsequent inbound** —
   and expiry = `in_session AND now − anchor > 24h`. A deliberate reading of the spec's "24h past
   last inbound." If you want strict opened-once semantics instead, that's a one-line change + a
   new column; flagged for your call.
2. **Conversion match is a declared partial.** `runConversionMatchJob` best-effort-matches a
   prospect's `demo_vendor_ref` to a claimed vendor (`vendors.claimed_at` or `user_id`). The exact
   claim predicate is **Block 08's** to ratify; the admin **mark-converted** covers the interim.
3. **Opt-out caller census (ruling 2).** Every one of the **7** current `sendWa` callers threads
   `supabase` (admin send-opener, marketing graceful line, the three `prospects.js` sends, both
   `brideCron` sends) — so the gate is live on all of them. The **one deliberate bypass** is the
   opt-out *confirmation* itself (`isOptedOut → false` for that single courtesy send). **The named
   residual:** the legacy `sendWhatsApp` **direct** sends in `src/index.js` (vendor/couple agentic
   replies) never went through `sendWa` and are therefore **ungated** — an opted-out phone that is
   also a vendor/couple would still receive those agentic replies. Routing those through `sendWa`
   is P4/later work; it is **named here, not silently open**. Payment/crew reminder sends are P4 —
   when built, they **must thread `supabase`** or they become a new residual.
4. **Schema docs regen deferred (witnessed discipline).** `PUBLIC_SCHEMA.md` is a witnessed dump
   ("NEVER HAND-EDIT") and `SCHEMA.md`'s body is stale/outranked; P1 likewise did **not** hand-add
   `failed_turns` (0083). **After you apply `0085`, regenerate `docs/db/PUBLIC_SCHEMA.md` by
   re-running `db/queries/public_schema_dump.sql`** — that is the moment `prospects` +
   `conversations.prospect_id` become witnessed. This delivery does not fabricate them into a
   witnessed file.
5. **Per-line template phone-number-id (P4 seam).** `phoneNumberIdFor` resolves `marketing` today;
   `vendor`/`bride` ids are env-gated `null` (no vendor/bride templates send in P3). P4's
   business-initiated sends populate those.

---

## 5. What P4 inherits
- Route the legacy `index.js` `sendWhatsApp` direct sends through `sendWa` (close residual #3).
- Payment/crew reminder templates via `sendWa` (thread `supabase`).
- Populate `VENDOR_PHONE_NUMBER_ID` / `BRIDE_PHONE_NUMBER_ID` if P4 sends vendor/bride templates.
- The mechanical-engine migration + credit alert (the rest of Block 05's tail per the 05 row).

---

## 6. Movement B — the founder's live smoke (when he chooses)
1. Set env on the **marketing** service: `META_WABA_TOKEN`, `MARKETING_PHONE_NUMBER_ID`,
   `META_APP_SECRET`, `META_VERIFY_TOKEN`, `MARKETING_WHATSAPP_NUMBER`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`.
2. Point the Meta webhook at `POST /webhook/meta`; complete the GET verify handshake.
3. Add one prospect (admin **POST /**), **send-opener**, reply from the handset → expect the
   holding line; reply **STOP** → expect the confirmation and a cross-line block.
4. Report reds to the CE. Until then P3 is Movement A: benched, honest, live-declared-not-claimed.
