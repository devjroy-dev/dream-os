# FILING B4·5 — THE PER-LANE MODEL TABLE

**Derived at origin `2a0d838a4c99cedd5082b49340e5fe80a30da72e`** by command, 2026-09-08.
**Seat:** CE-41 LE-B · gating artefact for R-41.66's 24-hour bell (2026-09-09 ~18:50 IST).

**The question this table answers, and only this one:** for each lane that reaches a model,
**which provider**, and **does the prompt carry WhatsApp Platform Data** — the content of a
message sent or received over Cloud API? That is the trigger for Meta §4.7(b) and §4.1(b).
A lane carrying only TDW's own platform records is outside both clauses.

**A stale-checkout note, recorded because it nearly cost this table.** This seat's working tree
sat at `68d92c0` while origin had moved to `2a0d838`. Caught by command before any derivation.
`git diff --name-only 68d92c0 origin/main | grep -c '^src/'` returns **0** — that push was
docs-only — so `src/` is byte-identical between them, but **every line below is derived with
`git show origin/main:` regardless**, not from the checked-out tree.

---

## 1 · THE ENDPOINTS — the chair's claim, confirmed

`src/lib/llm.js` at origin:

| line | provider key | baseURL |
|---|---|---|
| `:23` | `glm` | `https://api.z.ai/api/anthropic` |
| `:29` | `deepseek` | `https://api.deepseek.com/anthropic` |
| `:17` | `anthropic` | SDK default (no baseURL override) |

**Confirmed: the estate calls `api.z.ai` — the entity Z.ai's DPA for API Services binds — and
`api.deepseek.com`.** All three are Anthropic-compatible endpoints, so only baseURL and key
swap (`llm.js:2-3`).

---

## 2 · THE LANE TABLE

Routes from `src/lib/modelRouter.js` `DEFAULTS`. **⚠ The file's own comment at `:39` warns that
a seed row in `0111_marketing_nudge_route.sql` WINS OVER the code default** — so a lane's live
provider is a database fact, not only a code fact, and the founder should read the
`model.*` rows before acting.

| # | Lane / route key | file:line | Provider (code default) | Carries WhatsApp Platform Data? |
|---|---|---|---|---|
| 1 | `model.harvest.default` | `modelRouter.js:67` | **GLM** (`glm-4.7-flash`) | **NO — derived, see §3** |
| 2 | `model.wa_couple.default` | `modelRouter.js:66` | anthropic (HAIKU) | **YES** — the couple's WhatsApp turn |
| 3 | `model.wa_marketing.default` | `modelRouter.js:55` | anthropic (HAIKU) | **YES** — the closer on the marketing line |
| 4 | `model.wa_marketing.default` *nudge split* | `modelRouter.js:56` | **DEEPSEEK** (`deepseek-v4-flash`) | **NOT DERIVED — the hot cell, see §4** |
| 5 | `model.pwa_vendor.essential` | `modelRouter.js:22` | **DEEPSEEK** | NO — PWA chat, `surface:'pwa'` |
| 6 | `model.pwa_vendor.advisor` | `modelRouter.js:33` | **DEEPSEEK** | NO — PWA chat |
| 7 | `model.pwa_vendor.trial/signature/prestige` | `:21,:23,:28` | anthropic (HAIKU) | NO — PWA chat |
| 8 | bride lane | `brideLlmClient.js:51` | anthropic unless `BRIDE_LLM_PROVIDER` set | **YES** — the couple's WhatsApp turn |
| 9 | `donna_provider` split | `chat.js:2816` | per-route, may be any | NO — PWA chat |
| 10 | **`wa_vendor`** | — | **NO ROUTE ENTRY** | **YES** — and see §5 |

---

## 3 · THE GLM LANE CARRIES NO WHATSAPP CONTENT — derived, not assumed

Harvest is the only lane routed to GLM (`modelRouter.js:67`). Its single call site is:

```
src/api/vendor-engine/chat.js:2758
  runHarvest({ supabase, vendor, agentId, message, toolCalls, replyText: … })
```

**One call site. No other file calls `runHarvest`** (`git grep -n "runHarvest("` returns
`harvest.js`'s own definition and `chat.js:2758`).

And `src/api/vendor-engine/chat.js` is a **PWA door**: mounted at `router.js:55` under
`/vendor-e` and via `vendor/core.js`, and it hardcodes `surface: 'pwa'` at `:504`, `:654`,
`:744`, `:863`, `:903`, `:954`. Its own comment at `:675` distinguishes this lane from the
WhatsApp one explicitly.

**So `message` and `replyText` reaching GLM are the vendor's own typed words in TDW's web app
— TDW's platform data — not message content sent or received over Cloud API.**

**Consequence:** on this derivation **Meta §4.7(b) and §4.1(b) do not reach the GLM lane at
all.** The chair's Z.ai read (F-41.34 — processor-only on customer instruction, content not
stored, Singapore) is a good posture to have, but it is not load-bearing for Meta compliance,
because no Platform Data goes there.

**The limit of this derivation, stated:** it holds only while harvest has exactly one call
site. **A second call site from a WhatsApp path would silently move the GLM lane inside
§4.7(b).** That is worth a standing assertion in the bench, not a one-time reading.

---

## 4 · THE HOT CELL — the marketing nudge on DeepSeek

`modelRouter.js:55-56`:

```
'model.wa_marketing.default': { provider: 'anthropic', model: HAIKU,
                                nudge_provider: 'deepseek', nudge_model: 'deepseek-v4-flash' },
```

**This is a WhatsApp lane with a DeepSeek split.** The main closer turn goes to Anthropic; the
**nudge** goes to DeepSeek. `closerEngine.js:1148` describes `nudge_provider` as doing for the
wake what the surface split does elsewhere.

**WHETHER THE NUDGE PROMPT CARRIES WHATSAPP MESSAGE CONTENT — OR ONLY THE PROSPECT RECORD AND
A TIMER — THIS SEAT HAS NOT DERIVED.** `runNudgeJob` is reached from `marketingCron.js:62`, a
cron, which is consistent with a record-driven wake carrying no message content; but
*consistent with* is not *derived*, and this is the one cell where the answer changes the
founder's decision at the bell.

**This is the single most decision-relevant unknown in this file.** It is a half-hour of
reading `runNudgeJob`'s prompt construction, and it should be done before 18:50 IST tomorrow
rather than after.

---

## 5 · THE LANE WITH NO ROUTE — `wa_vendor`

There is **no `model.wa_vendor.*` entry in `DEFAULTS`.** `modelRouter.js:92` states the
consequence in its own words: *"A surface with NO entry here is UNCONSTRAINED, deliberately."*

The WhatsApp vendor line — Victor, the estate's busiest model surface and the one that
unambiguously carries Platform Data — **has no routed provider and therefore no per-surface
allow-set.** Whatever `LLM_PROVIDER` is set to at the environment level governs it.

**So the answer to "which provider sees the vendor's WhatsApp messages?" is not in the code.
It is in Railway's environment.** The founder should read `LLM_PROVIDER` and
`BRIDE_LLM_PROVIDER` before deciding anything, and the answer belongs in this table.

---

## 6 · WHAT THE FOUNDER NEEDS BEFORE THE BELL

1. **Read `LLM_PROVIDER` and `BRIDE_LLM_PROVIDER` in Railway.** §5 — the unconstrained lane.
2. **Read the `model.*` seed rows in the database.** `modelRouter.js:39` warns the seed wins
   over the code default; this table is code-derived and may be overridden in production.
3. **Derive the nudge prompt** (§4) — the one cell that could move a WhatsApp lane onto
   DeepSeek.

**Against R-41.66 as it stands:** if the nudge carries no message content and `LLM_PROVIDER` is
unset or `anthropic`, then **no WhatsApp Platform Data reaches DeepSeek or GLM today**, and the
bell at 18:50 tomorrow moves nothing. If either fact goes the other way, R-41.66 bites on lane
4 and lane 10 respectively.

**This seat has not concluded which.** Two readings decide it, both founder-held, both quick.

---

## 7 · RECORD LINE

```
B4·5 · per-lane model table · derived at origin 2a0d838, 2026-09-08
endpoints CONFIRMED: api.z.ai (llm.js:23) · api.deepseek.com (llm.js:29)
GLM lane  = harvest only, ONE call site (chat.js:2758), PWA surface → NO Platform Data
DEEPSEEK  = pwa_vendor essential/advisor (PWA, no Platform Data)
            + wa_marketing NUDGE SPLIT (modelRouter.js:56) → NOT DERIVED, the hot cell
ANTHROPIC = wa_couple, wa_marketing main, pwa_vendor trial/signature/prestige, bride default
wa_vendor = NO ROUTE ENTRY — unconstrained, governed by env (modelRouter.js:92)
OWED BEFORE THE BELL: Railway LLM_PROVIDER/BRIDE_LLM_PROVIDER · the model.* seed rows ·
                      runNudgeJob's prompt construction
STANDING ASSERTION OWED: harvest must keep exactly one call site, or the GLM finding lapses
```
