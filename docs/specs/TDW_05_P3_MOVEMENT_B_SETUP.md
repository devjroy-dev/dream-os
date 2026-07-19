# TDW_05 P3 — Movement B Setup + Sandbox Smoke Log (runbook session, 2026-07-19)

Companion to `TDW_05_P3_HANDOFF.md`. Operational trail of the live-smoke standup and the sandbox
exercise — config references, not secrets. No code, no schema. Movement A stays sealed at CE-29
(`708991c`).

> **Session outcome:** the marketing lane was **smoked live on Meta's sandbox test number** and
> **PASSED** for the inbound path, the holding-line free-form send, and the STOP/START opt-out
> cycle — real WhatsApp delivery to a real handset, not benched. **The ONE piece the sandbox could
> not prove** is the production **opener template** send (`tdw_marketing_opener` lives on the real
> WABA, not the sandbox's), which is carried to tomorrow's dedicated WABA number. So P3 is now
> **live-witnessed except the opener-template send**; that final send + an optional cross-line
> refusal proof are all that remain. This is a partial-close for the CE to weigh for a Movement-B
> seal.

---

## 1. What got stood up (DONE, persists)

- **New Railway service `dream-os-marketing`** in the `dream-os` project, same repo, branch `main`.
  - **Builder: Railpack** (matched to the vendor service; it had defaulted to Nixpacks).
  - **Start command:** `node src/marketingIndex.js`
  - **`RAILPACK_NODE_VERSION = 22`** (load-bearing — see the finding below).
  - **Public domain:** `dream-os-marketing-production.up.railway.app` → Port 8080.
  - **Boot GREEN:** deploy `cd3966db` Active — `[wa:marketing] marketing service listening on :8080`.
- **Meta developer app:** `dream-os-marketing`, **App ID `1425513376067685`**, portfolio **The Dream Wedding**.
  - WhatsApp product added; **webhook wired** to `…/webhook/meta`, verify handshake passed,
    **`messages` field subscribed** (v25.0).
- **Sandbox test number** (Meta free test number, max 5 verified recipients):
  - **From:** `+1 555 177 5792`  → `MARKETING_WHATSAPP_NUMBER = whatsapp:+15551775792`
  - **`MARKETING_PHONE_NUMBER_ID` = `1168273029712949`**
  - **Sandbox WABA ID:** `1023382280673745`
  - **Verified recipient:** `+91 87577 88550` (test handset)
  - 24h token, scoped to both the sandbox WABA and the real **The Dream Wedding** WABA (`1299109268220358`).
- **All 7 env vars set on the marketing service.**

## 2. LIVE-WITNESSED on the sandbox — 2026-07-19 ~22:09–22:10 IST (real WhatsApp delivery)

From handset `+918757788550` → sandbox `+1 555 177 5792`, watched in the Railway deploy logs:

| Behaviour | Evidence | Result |
|---|---|---|
| Meta inbound: X-Hub-Signature-256 verify + handshake + normalize | `22:09:07 [wa:marketing] 918757788550 -> Hi` (no sig error) | 🟢 |
| Prospect state machine + `prospect_marketing` conversation + window stamp | inbound processed, no dead-letter | 🟢 |
| Transport swap — **free-form** Meta send (holding line) | `22:09:12 status=sent` → `22:09:13 status=read`; handset received *"Good to hear from you…"* | 🟢 |
| STOP → `opted_out` + confirmation via the deliberate bypass | `22:10:23 -> Stop` → single `22:10:26 status=sent` (no holding line) | 🟢 |
| START → resume (`opted_out → replied`) | `22:10:31 -> Start` | 🟢 |
| Case-insensitive stop/start matching | "Stop"/"Start" caught | 🟢 |

The tell that the opt-out logic is real: STOP produced **exactly one** `status=sent` (the
confirmation) — the machine did not send a holding line to a stopping user.

**NOT exercised on the sandbox (carried to the real number):**
- The **opener template** send (`tdw_marketing_opener`) — the sandbox number's WABA only has
  `hello_world`; the real template lives on **The Dream Wedding** WABA. Moot once on the real number.
- The explicit **cross-line refusal** (a normal send to an opted-out phone returning `opted_out`,
  no `status=sent`) — skipped because START was sent immediately after STOP. Optional belt-and-suspenders.

## 3. Access references (config, not secrets — banked at founder's request)

- **WhatsApp / WABA / Facebook account ACCESS:** the account is logged into **by phone number
  `9888294440` — NOT by any email address.** Recovery/login is via that phone; there is no email
  login for this account. (Recorded explicitly so the next sitting does not hunt for an email that
  doesn't exist.)
- **Meta-for-Developers CONTACT email:** `dev+meta@thedreamwedding.in` (plus-alias of
  `dev@thedreamwedding.in`) — this is the developer-account *contact* address only, **not** the
  account login. Login = the phone above.
- **Real WABA (The Dream Wedding) ID:** `1299109268220358` — where the six approved templates
  (incl. `tdw_marketing_opener`) live.
- Secrets (token, app secret, Supabase keys) live only in Railway variables — never recorded here.

## 4. FINDING — marketing service needs Node 22 via Railpack (fresh-install trap)

A fresh Railway service off this repo **crash-loops on Node 20**:
`Error: Node.js 20 detected without native WebSocket support` — from `@supabase/realtime-js`
constructing `RealtimeClient` at `marketingIndex.js`'s `createClient`. Root cause: repo pins only
`"engines": { "node": ">=20.0.0" }`, and a **fresh `npm install`** pulls the newest
`@supabase/realtime-js`, which hard-requires native WebSocket (Node 22+). The older vendor/bride
services predate that SDK bump, so they don't show it. **Fix (per-service, no repo change):** builder
= **Railpack** + **`RAILPACK_NODE_VERSION = 22`** (`NIXPACKS_NODE_VERSION` was ignored — wrong builder).
> Optional durable cure for the CE: bump the repo's `engines.node` to `>=22`. Not done here (touches
> all three services; out of runbook scope).

## 5. CLEANUP — duplicate empty Meta app

The dashboard shows **two** apps named `dream-os-marketing`:
- **KEEP:** App ID **`1425513376067685`** (portfolio The Dream Wedding, has WhatsApp + test number).
- **ARCHIVE/DELETE later:** App ID **`1073940998303309`** (Type: None, empty — a stray from the
  wizard). Harmless, but archive it so the next session doesn't pick the wrong one.

## 6. OPEN — resume tomorrow on the real WABA number

1. **Provision a dedicated marketing number** in the **The Dream Wedding** WABA; generate a
   **permanent System User token** (the sandbox token is 24h).
2. **Update marketing-service vars** to the real number's `MARKETING_PHONE_NUMBER_ID`,
   `MARKETING_WHATSAPP_NUMBER`, and the permanent `META_WABA_TOKEN`. Redeploy. Re-point the Meta
   webhook if the app/number changes; keep the `messages` subscription.
3. **Add the two Meta send creds to the vendor/admin service** (`META_WABA_TOKEN`,
   `MARKETING_PHONE_NUMBER_ID`) so admin **send-opener** can dispatch (that route runs on the vendor
   service; the Meta POST fires wherever `sendWa` runs).
4. **Run the remaining smoke:** add a prospect (admin `POST /api/v2/admin/prospects`) →
   **send-opener** → confirm the **`tdw_marketing_opener` template** arrives (the piece the sandbox
   couldn't prove) → optionally prove the cross-line refusal (STOP, then a normal send returns
   `opted_out` with no `status=sent`). Report to the CE for the Movement-B seal.

Everything else in the marketing lane is now **live-witnessed** (§2), not just benched. The masterplan
05-row Movement-B seal clause is the CE's to author.
