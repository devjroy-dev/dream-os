# CE-41 · SEAT C · PACKET C1 — THE SWITCHBOARD (dream-os) — HANDOVER

**Cut by** LE-C under CE-41 **at** dream-os `2159cd3bb2a6a16769c7612645eddac2f58d3370` (sibling dreamos-pwa `08a31d7e314a5ac467cd244774fc6312e39191cd`), both derived fetch-first at the moment of cutting. **Built at** `57d12d49…`; carried through `38a70b0` (B1) → `1feb1cc` (A2) → `e62ba2a` (regen) → `2159cd3` (B docs). The carry collided with two paths, both chartered: `src/api/router.js` (A2's mount beside this packet's) and `src/lib/capabilities.js` (the stub, replaced file-for-file, R-41.20).

Rulings executed: R-41.8 · R-41.35 · R-41.36 · R-41.37 · R-41.38 · R-41.39 · R-41.40 · R-41.41 · R-41.42 · R-41.43 · R-41.46. Chair corrections recorded: c-41.9 (the async/sync contradiction; the stub at origin wins) · c-41.10 (the cross-seat amendment of `b20`).

## 1 · What shipped (28 paths; the manifest is `scripts/floor-manifest-ce41-c1.txt`)

| file | what |
|---|---|
| `db/migrations/0149_capabilities.sql` | ONE new table `public.capabilities` (PK `key`; CHECKs on kind, status incl. `paused`, the key grammar, `auto_on = false OR walk_ref IS NOT NULL`) + four idempotent seed blocks: 8 flags `on` (the founder's Railway read 2026-09-08; `flag.review_ask_send` per R-41.46) · 13 templates (8 Block-19 + the concierge four with their B1 IDs, `approved`; `tdw_capability_armed` `pending`) · 8 permissions `pending` · 3 scopes. **32 rows.** Number derived at `2159cd3`: `ls db/migrations \| grep -E "^[0-9]{4}" \| sort \| tail -1` → `0148`. No FK; reads no 0139–0148 table. |
| `src/lib/capabilities.js` | **the one home.** `on(key)`/`reason(key)` SYNCHRONOUS from a boot-warmed table (seat A's contract kept: `assistance.js:384` reads `capFn(KEY) === true`); `bind(supabase)` warms with one `list()` and re-warms every 60s (unref'd); every writer re-warms. Writer 1 `recordSweep` (status ≤ armed; rules a–d); writer 2 `flip` (on only from armed/approved/on/off), `setAutoOn` (refuses without `walk_ref`), `touch`. Fails closed before the first warm and on any DB error. `CAPABILITY_KEYS` kept byte-for-byte and grown; `IS_STUB: false`. |
| `src/capabilitiesSweep.js` | `probeTemplate` (Graph `GET /{META_WABA_ID}/message_templates?fields=name,status,category,id&name_or_content=`, exact-name match, Meta's word verbatim as evidence; R-41.36 mapping) · `probeScope` (house grant → refresh → `oauth2.googleapis.com/tokeninfo`; reads `vendor_google_connections`, regen already paid by `e62ba2a`) · `TEMPLATE_GUARDS` (8 template→flag pairs) · the disarm (R-41.35) and the arming of a `pending` guard · `applyTemplateStatusEvent` (webhook fast path) · nightly `50 3 * * *` Asia/Kolkata (its own minute) · **withheld, fully commented, uncomment step in-file:** the IG permission probes (R-41.39) and the founder notice on `ADMIN_PHONE` via the vendor PNID (R-41.41). |
| `src/api/admin/capabilities.js` | `GET /api/v2/admin/capabilities` · `POST …/sweep` · `POST …/:key/flip {to}` · `POST …/:key/auto_on {auto_on, walk_ref}` · `POST …/:key/check`; all `requireAdmin`; no SQL in the file. `flipped_by = admin:<8 hex of sha256(session token)>` — the admin session carries no user identity (one HMAC nonce), so sessions are tellable apart without a token ever touching a row. |
| `src/api/router.js` | mount at `/admin/capabilities`. |
| `src/index.js` | boot: `startCapabilitiesSweep({ supabase })` (binds + warms); the webhook seam beside the status seam: `extractTemplateStatusUpdates` → `applyTemplateStatusEvent`. |
| `src/lib/metaInbound.js` | `extractTemplateStatusUpdates(body)` — the `message_template_status_update` field only. |
| the nine doors | `reviewAsk.js` · `paymentReminders.js` · `referralAlert.js` · `creditInvite.js` (×2) · `contractSend.js` (`signSendGate` + `copySendGate`, ONE home for the two sign doors) · `api/sign.js` · `api/vendor/contracts.js` · `api/vendor/studio/weddings.js` (`flag.wedding_reel` ∧ ffmpeg probe). **Zero `process.env.*_ENABLED` reads remain in `src/`** (comment-stripped). `api/vendor/reminders.js` and `solutions/index.js` await the (now async) gates. |
| `scripts/b61_switchboard_bench.js` · `scripts/b61_mutations.js` | the bench and its both-ways half. |
| six neighbours + `b20` | labeled amendments, below. |

**Out of radius and byte-untouched (bench cell asserts it):** `src/lib/laneFlags.js`, `src/lib/otpSend.js`, every PNID, every concierge table.

## 2 · Proof

- **b61** 59/59 at the cured tree · **RED at origin's tree** (29 of 31 cells, exit 1) · **10/10 production mutations RED on their named cell** (env read re-introduced · `armed` answering true · disarm dropped · auto_on without walk_ref · flip-on from pending · DISABLED→approved · substring name match · notice going live · a second table reader · a door going synchronous). No live Meta call: `fetch` is a double.
- **The floor (batched per `floor-batch.sh`, R-40.63):** the RED/ERROR/REFUSED set at `2159cd3` cured = the set at origin's tree, **25 = 25, set-identical.** The committed `floor-base.txt` (16) is stale — the runner reclassified `test-shape`/`b06_gauntlet` to REFUSED and four reds predate this seat (`b07_f0774`, `b45_precutover`, `b51`'s declared five, `b59_g34`'s `nine registrations` — `cron.js` registers eleven; that cell was written at nine by another seat and is not cured here). **The founder's single-invocation `run-floor.sh --delivery scripts/floor-manifest-ce41-c1.txt --check` is the floor of record.**
- **Migration:** parses as 5 statements under libpg_query; every seed key passes `isValidKey`; no dupes; every `TEMPLATE_GUARDS` pair seeded both sides; every door key seeded.

## 3 · Labeled amendments (ratify-or-revert)

Each keeps its cell names and questions; only the LEVER moved from `process.env.X='1'` to the register's bind/prime seam. Counts at origin → cured: **b51** 224/5 → 224/5 (the same five declared reds: F-40.220, F-40.228/.229 ×2) · **b53** 134/134 (wrapped in one async IIFE so C7's two gate cells may await; every other line byte-identical, same order) · **b55** 50/0 · **b56** 318/318 · **b57** 138/138 · **b59_g34** 104/105 (its one red is the tree's) · **b59_mutations** one target string re-aimed to the async gate (its baseline red is the tree's).
**c-41.10 — `b20_a2_assistance_bench` (seat A's), four cells not three:** `IS_STUB === true` → `=== false`; `reads no env and no table` → `reads no env, and the one table is public.capabilities`; the dark-reason cell drops `/stub/`; and **`0148 is the ladder tail + 1`** — pinned to the tail, it reds on the next seat's migration by construction — becomes the tail-independent `0148 sits immediately above 0147`. 90/90 at origin → **90/90 cured.** Seat A ratifies or reverts at its next cut.

## 4 · Disclosures

1. **c-41.9.** Kickoff C1(b) said `on()` async; the stub at origin said synchronous with a caller. Built async first, caught at the carry, rebuilt synchronous. The gate functions in the four libs stay `async` (cosmetic: their callers already await).
2. **F-j resolved by A2's own shape.** A `template.*` row can be a gate in its own right (`template.tdw_assist_lead_outside`): `approved` = "Meta yes, the founder not yet"; his tap moves `approved → on`; R-41.35's disarm applies as to a flag.
3. **The first sweep moves nothing** on today's seeds: rule (a) — a founder-set `on`/`off` outranks an `approved` re-read. `flag.wedding_reel` is `on` and stays dark on the ffmpeg probe (F-40.149).
4. **`tdw_assist_lead_outside` is MARKETING** (R-41.30 course a); the 131049 exposure is in its evidence line.
5. **The founder notice and the IG probes are withheld** (conditional-withheld rule); uncomment steps stated in `capabilitiesSweep.js` beside each block.
6. **`docs/TEMPLATES.md` §2/§3 still lists nine templates against 28 on the tree** — F-41.6, seat B's; this packet touches no docs but this file.

## 5 · The walk (kickoff §8) — after deploy, on the founder's phone via C2's card; until C2, via the doors with an admin bearer

The `flag.payment_reminder_send` off → a due reminder in the fixture (`9888294440`) refuses with `flag.payment_reminder_send is off on the switchboard` in the Railway log → on → it sends to MAKEUPBYSWATIROY's handset · `Check now` on `template.tdw_assist_found_vendor` returns `approved` with `Meta: APPROVED · UTILITY · id 3160852754105015 · <ts>Z` and `checked_at` moves. Nothing else changes on any vendor's glass. **The walk outranks the bench.**

## 6 · C1b — the raw WABA listing (cut at `c854978b428b81a52881a8cc32cfa78f0b7108eb`; manifest `scripts/floor-manifest-ce41-c1b.txt`)

`GET /api/v2/admin/capabilities/waba_templates` (admin-auth, read-only, JSON): `listWabaTemplates()` in `src/capabilitiesSweep.js` walks `GET /{META_WABA_ID}/message_templates?fields=name,status,category,id,language&limit=100` following `paging.next` **to completion** (a `maxPages` fence of 20 marks `truncated` rather than pretending), returns every template sorted by name with its Meta status, category and id, and names the page on any Graph refusal. Its purpose is F-41.6: seat B's 38 names with IDs come from this door, never from memory. Nothing written; no seed, no migration. b61 **64/64** (five new cells incl. a two-page double and a mid-listing refusal) · **12/12** mutations (M11: read one page and stop; M12: the door gains a writer). No neighbour moved.

**First read (the founder's, after deploy):** `curl -s -H "Authorization: Bearer <admin token>" https://dream-os-production.up.railway.app/api/v2/admin/capabilities/waba_templates | jq '.count, .pages, .truncated'` — expect `count` ≥ 32 (the registry's 28 + the concierge four; the exact number is Meta's word), `truncated: false`.
