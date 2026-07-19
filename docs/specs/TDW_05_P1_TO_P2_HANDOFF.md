# TDW_05 — P1 → P2 HANDOFF

**Sitting:** TDW_05 Block 05, **P1 — webhookCore, the race fix, the dead letters.** **Closed 2026-07-19.**
**Ships from:** `3c1d5a9` (Sitting-1 seal) → `553f2d2` (Movement A, byte-identical, CE-accepted) → `edf3551` (Movement B) → this record ZIP (migrations + handoff, no code).
**Charter:** `docs/specs/TDW_05_WEBHOOK_FINAL.md` §P1 + the P1 kickoff + the CE Movement-B clearance.

---

## 0. WHAT LANDED

**THE TWO SERVICES SHARE ONE TRANSPORT, AND THE PIPES ARE NOW RELIABLE.** The inbound/callback logic that lived twice is one module; a duplicate MessageSid is processed once; a status callback that races the insert is retried, not dropped; a turn that throws is captured, not lost.

| | |
|---|---|
| `src/lib/webhookCore.js` | Movement A extracted it **byte-identical** (553f2d2); Movement B added dedupe, the race retry, dead-letter capture, the replay predicate |
| Inbound dedupe | **LRU fast path** (bounded 5000) + **durable `messages.message_sid`** + the **partial unique index** backstop → cross-process dup = `23505` = idempotent drop |
| Status-callback race | `(callback ignored)` drop **replaced** with retry **3×2s → `callback_unmatched`**. No schema. |
| Dead letters | thrown turn → `failed_turns` + the graceful line; admin `GET/POST /api/v2/admin/failed-turns` **list / replay / discard** |
| `scripts/b5_webhookcore_bench.js` | **43/43** — the A byte-identical gate, race cell re-asserted to B's contract (not deleted) |
| `scripts/b5b_movementb_bench.js` | **56/56**, non-vacuous (mutation-proven) |

**Migrations:** `0083_failed_turns.sql` · `0084_message_sid_dedupe.sql` — **applied live, and committed with this record** (the repo had stopped at 0082, running behind prod).

---

## 1. THE SEAL STATE — **BENCHED, ACCEPTED, AND WITNESSED LIVE**

**Movement A** — byte-identical extraction, **CE-accepted** at 553f2d2 (independent re-derivation: delta the four files, W-1 clean, bench 39/39 with mutation reproduced).

**Movement B** — code **CE-accepted** at edf3551. Delta exactly 7 code files, +733/−32, **W-1 clean** (no agent/soul/prompt/voice/engine diff).

**Benches** — A **43/43**; B **56/56**. B is non-vacuous by construction: breaking dedupe + the race wording + the replay secret-match drops **8 cells RED**; restore → GREEN. The admin endpoints run against a **real ephemeral express server hit with real fetch** — auth, list/filter, discard, replay, secret header + payload dispatch all exercised in-process.

**Live witness (production, founder-run at close):**

| | Witnessed |
|---|---|
| **W1** | schema — 4/4 objects: `message_sid` nullable=YES · `messages_message_sid_uidx` (unique, partial) · `failed_turns` cols (id, service, phone, payload, error, state, created_at) · state CHECK dead/replayed/discarded |
| **W2** | backstop bites — dup insert → `BACKSTOP OK: duplicate message_sid rejected (23505)`, self-cleaning |
| **W3** | durable mode — `dream-os :3000` and `dream-wedding :8080`, **both post-migration boots, NEITHER emits `DEGRADED`** (the probe found the column) |
| **W4** | route protected — `GET /api/v2/admin/failed-turns` unauth → **401** |
| **W5** | authed + wired — `{"ok":true,"turns":[],"state":"dead","limit":50,"offset":0}` (also proves the **deployed build is P1b** — the endpoint exists nowhere else) |
| **W6** | replay reachable — POST `.../<fake-uuid>/replay` → **404** not-found, before any dispatch |

**Env wired:** `INTERNAL_REPLAY_SECRET` on both services (matching) · `VENDOR_SELF_URL` + `BRIDE_SELF_URL` on the vendor/admin service. Withheld returns `replay_not_configured`; no bypass path exists when unset.

---

## 2. THE OPEN RESIDUAL — **THE ONE THING NOT WITNESSED, DECLARED NOT CLAIMED**

**The cross-service replay HOP has not fired.** Vendor admin re-POSTing a real bride dead-letter to the bride webhook, trusted via the shared secret — **unexercised, because prod `failed_turns` is empty (`turns:[]`).** There is nothing to replay yet.

**Proven around it:** dispatch + secret header + payload re-POST + the dead→replayed/discarded state machine (b5b bench); config-gate + route mount + auth (live W4–W6). **Only a genuine re-drive is unexercised, and it cannot be until a turn actually throws in prod.**

**A deliberate witness would require** inserting a synthetic `failed_turns` row and replaying it — **which re-drives a real turn through the bride engine and could send a real WhatsApp.** A controlled, watched exercise with a chosen payload; not run casually against prod. *A green bench is not a witnessed hop, and this handoff does not pretend otherwise.* **Carried forward as OPEN.**

---

## 3. KNOWN DRIFTS — **NAMED, NOT SWEPT**

1. **`DISABLE_TWILIO_SIGNATURE_CHECK` kept over the spec's `TWILIO_VALIDATE`.** The P1 kickoff explicitly overrode the spec here; the existing flag and its startup warning are preserved exactly. No new env, no rename.
2. **Bride inbound rows moved off the overloaded `twilio_sid` onto `message_sid`.** The 5 inbound sites now carry the inbound sid in the durable column; the 8 remaining `twilio_sid` writes are all **outbound** send-sids (`*Msg.sid`), which the status callback still matches on. **This also removes a latent inbound/outbound sid overloading** on that column.
3. **The `0079` hole persists — and it is NOT P1's.** `0079_nudge_optout.sql` is reserved (spec §2) and nothing tracks or archives it. It is a **P4 nudge migration** (`users.nudge_optout`), not this sitting. Recorded so P2/P4 does not rediscover it as a surprise. The P1 ladder is `0083` (failed_turns, charter-reserved name) + `0084` (message_sid); both additive/independent, order-immaterial.

---

## 4. EXECUTOR DISCLOSURE — **WHAT HELD BY COMMAND vs WHAT I CORRECTED**

**The tool-verified work held. The two things I got wrong, I got wrong in prose, and both were caught by running rather than reading.**

| # | The miss | Caught by | The shape |
|---|---|---|---|
| 1 | **The first backstop probe used `RAISE NOTICE`** — invisible in Supabase's Results panel. The founder ran it and got `Success. No rows returned`, which **proves nothing either way.** | **the founder's screen** — the verdict never showed | I built a fixture whose signal channel the target UI doesn't surface. Replaced with a `RAISE EXCEPTION` form whose message *is* the visible verdict; that one produced the W2 `BACKSTOP OK`. |
| 2 | **The charter's phrasing "a `[wa:marketing]` prefix is defined"** — it is **not** defined anywhere in the tree. | **`grep` at edf3551** | webhookCore **parametrizes** the prefix (the whole extraction design); nothing named `[wa:marketing]` is hardcoded. Stated truthfully in §5 rather than copied forward as fact. |

**And the tool-verified half, which held without exception:** the byte-identity A bench (mutation reproduced RED→restore→GREEN) · the B bench's 8-cell mutation proof · the W1–W6 live reads (each *read*, not assumed) · the migration files diffed byte-for-byte against what was applied · the deployment witnessed by the `turns:[]` shape (which only P1b's endpoint returns) · the `DEGRADED` absence confirmed on **post-migration** boots (the stale 15:47 pre-migration `DEGRADED` was named as stale, not counted).

***A green bench is not a witnessed door. The dedupe backstop is now both. The replay hop is only the first.***

---

## 5. WHAT P2 PICKS UP

1. **webhookCore is the shared transport both services import** — signature verify, media normalize, inbound log, the status handler, dedupe, dead-letter capture. **The log prefix is a parameter**, so **P3's marketing service constructs on webhookCore and passes its own prefix** (e.g. `[wa:marketing]`); nothing marketing-named is hardcoded today — the seam is prefix-agnostic and ready.
2. **The schema is live:** `messages.message_sid` + `failed_turns` (both `0083`/`0084`, applied and now committed). P2/P3 build on a durable dedupe home and a real dead-letter table.
3. **The admin-router pattern is established** — `/api/v2/admin/failed-turns` follows the `requireAdmin` + `asyncHandler` + `req.app.locals.supabase` + `ok/err` shape every admin sub-router uses. **P3's `/api/v2/admin/prospects*` inherits it directly.**
4. **P2 is the template registry** (`src/lib/templates.js`) + `sendWa({line,to,text?,templateKey?,vars?})` + the sitting-one `docs/TEMPLATES.md` with the **six template bodies for same-day Twilio submission** (approval latency is why P2 files day one, regardless of code progress). **P3 may not precede P2** — it needs the registry.
5. **The OPEN replay hop (§2)** rides forward: the first real thrown turn in prod, or a deliberate watched synthetic, closes it. Not a blocker to P2.

---

**The pipes are one module, and they hold under a duplicate, a race, and a throw — benched, accepted, and witnessed live. One hop waits on a real failure to fire; it is named, not hidden.**
