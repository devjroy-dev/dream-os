# TDW · CE-39 STEP 2a · DREAM-OS PRE-CUTOVER SEAT — HANDOVER (ZIP 1 of 2)

**Seat:** LE, one sitting, 2026-08-29 · **base:** dream-os `852d385` (main), re-derived fetch-first at the cut · **twin:** dreamos-pwa `c123926` (worklist), ZIP 2 · **kickoff:** CE-39 v2 · **rulings:** the CE-39 read-first ruling, the veto, and the F-39.p5 ruling, all on the chat record of 2026-08-29.

The founder pushes; nothing here is banked until origin carries it.

## 1 · WHAT MOVED (every path is in `scripts/floor-manifest-ce39-2a.txt`)

**Three new homes.**
- `src/lib/vendor/routingHandle.js` — `ROUTING_HANDLE_RE = /^[A-Z0-9]{1,30}$/`, `mintRoutingHandle` (normalise → shape → validate), `shapeRoutingHandle` (door/tool/fallbacks), `handleIsFree` (vendors any status ∪ demo_vendors `active=true`, case-folded both ways), the two founder-vetoed strings `HANDLE_TOO_LONG` · `HANDLE_TAKEN`. F-19.50 · F-19.49.
- `src/lib/corsOptions.js` — the options object byte-for-byte from `index.js` plus `maxAge: 600`. F-39.2.
- `src/lib/pwaPaths.js` — `billing` / `portfolio` / `leads` / `leadsList` at TODAY's `/vendor` values, `/w/` twin commented beside each, Phase 7 flip step in-file. F-38.p12 (re-ruled).

**Readers moved onto them.**
- `src/index.js` — the inline `cors({...})` block becomes `app.use(cors(corsOptions))`; `ALLOWED_ORIGINS` lives in the home now.
- `src/api/vendor/onboarding.js` — `generateHandle`: `mintRoutingHandle(igSource)` first, every candidate (incl. the former last-resort `VENDOR…`) through `shapeRoutingHandle`, each asked of `handleIsFree`; returns **null** when nothing is free. `cleanIg` = `normalizeIgHandle(instagram_handle)` (stored normalised). `vendorUpdate` writes `routing_handle` + `status: 'active'` only when the mint returned a handle. `tdw_link` null-safe.
- `src/agent/onboarding.js` — `completeOnboarding`: same mint shape; `{ routing_handle, onboarding_state: 'complete', status: 'active' }` iff handle, else `{ onboarding_state: 'complete' }`; the web-minted branch adds `status: 'active'`. `asked_ig` stores `normalizeIgHandle(...)`. New null-handle arm returns the closing sentence's existing second paragraph verbatim (no new byte — see §5 copy note).
- `src/api/vendor/auth.js` — both `vendors` inserts: `status: 'pending'`. F-19.51.
- `src/api/vendor/me.js` — `couture_eligible: vendor.couture_eligible === true || COUTURE_TIERS.includes(vendor.tier)`, `COUTURE_TIERS` asserted against `tierFlip.CANON_TIERS` at load. Routing-handle door: `shapeRoutingHandle`, one 400 (`HANDLE_TOO_LONG`), 409 via `handleIsFree` (`HANDLE_TAKEN`, code `HANDLE_TAKEN` unchanged). The `<3` floor and its sentence retired (B-3).
- `src/agent/engine.js` — **UNTOUCHED, and the M-1 ruling is REPORTED (§0.2), not built.** The `case 'update_routing_handle'` sits inside F-05.56's DEFUSED ISLAND (`engine.js`, from the banner `F-05.56 — EVERYTHING BELOW THIS LINE HAS ZERO CALLERS SINCE ARC M5` to `module.exports`), whose executable bytes are frozen by `b05_f0550_ping_drain_bench` §4.3 (base-pinned to `5335bb2`, "a defusal that moves an executable byte is not a defusal"). I built the ruled one-line swap, the floor reddened that sealed cell, and I REVERTED the line rather than amend a defusal guard. The read-first's M-1 was mis-derived: it is not a live fourth writer — it has zero callers. The hyphen rule dies when the island is deleted under its own ruling. Correction s8.
- `src/api/admin/demoAdmin.js` — both `demo_vendors` inserts (console create → 409 `handle_taken`; batch → `failed[]` `handle_taken`) ask `handleIsFree` first. F-19.49.
- `src/api/vendor-engine/chat.js` — **W-1, one line**: the `upgrade.href` literal becomes `require('../../lib/pwaPaths').vendorPath('billing')`; the comment above it stays true (ruled E-2).
- `src/api/vendor/ig.js` `RETURN_PATH`, `src/api/couple/enquire.js` `VENDOR_LEADS_URL`, `src/lib/vendorInbound.js` `VENDOR_LEADS_LINK` — read the home; values byte-identical today.
- `src/api/middleware/requirePrestige.js` — **DELETED** (its 403 string carried a person's name). `studio/{team,tasks,payments,messages}.js` `mw = [requireAuth, resolveVendor()]`; `briefing.js` inline; `index.js` header comment. R-39.7.
- `scripts/b0451_crew_page_bench.js`, `b0454_owner_assignments_bench.js`, `b0455_money_loop_bench.js` — their `requirePrestige` stub lines retired with the reader (M-7). All three green after.
- **THE bOB_d2 DOUBLE IS A TEST-SETUP CHANGE, STATED EXACTLY (CUT ruling):** its `fakeDb.from(table).select()` used to return `{ eq(col) → { maybeSingle } }` — one `.eq` deep. It now returns `{ eq(col) → probe(col) }` where `probe(col) = { eq: () → probe(col), maybeSingle }`, i.e. `.select().eq(...).eq(...).…maybeSingle()` at ANY depth, keyed on the FIRST column named. That is the chain `handleIsFree` sends (`vendors: routing_handle` once; `demo_vendors: ig_handle` then `active`). Its answers are unchanged: `vendors`/`routing_handle` → nobody, `vendors` → the row, anything else (incl. `demo_vendors`) → null. **Cell C's red mutation (bypass the demo direction in `handleIsFree`) was RE-WITNESSED AFTER this double changed — RED — so the double is not what made C green;** C drives its own recorder in `b45`, not bOB_d2's double.
- **Three more benches moved with their readers** (found by the cured floor, each green after): `scripts/bOB_d2_onboarding_gate_bench.js` — its supabase double now answers the guard's second `.eq` (demo_vendors `ig_handle AND active`); before, the chained call threw and the endpoint 500'd inside the double. `scripts/b07_f0784_panel_bench.js` §2.5/§2.6 — read the `allowedHeaders` array off `corsOptions` instead of spelling in `index.js`. `scripts/tdw10_combined_cap_bench.js` §5.1 — asserts the upgrade path's seat through `pwaPaths` and its value today (`/vendor/billing`); the wire cell §3.x is unchanged.

**New bench** `scripts/b45_precutover_seat_bench.js` — 9 cells (§0 stripper canary + A–G, D′), 9 PASS at the cured tree.

## 2 · THE CELLS AND THEIR REDS (both-ways, production mutations, each run at the cut and restored)

| cell | mutation → RED (witnessed) |
|---|---|
| A · OPTIONS carries `Access-Control-Max-Age: 600` on the wire | delete `maxAge` in `corsOptions.js` → `7 PASS · 1 FAIL` |
| B · mint normalises before shape; URL → `MAKEUPBYVIARAA`; 22-char whole; 31 → null; hyphen dies | restore `.slice(0, 20)` on the mint → RED |
| C · guard refuses real (queried lower) AND live demo (queried UPPER); inactive demo is free | bypass the demo direction → RED |
| D · agent completion with no free address leaves `pending`; a mint flips `active` with a valid handle | write `status:'active'` unconditionally → RED |
| D′ · both `auth.js` inserts write `status:'pending'` | drop it from the first insert → RED |
| E · every `/vendor/` or `/w/` navigation literal in `src/` is in `pwaPaths.js` only (route registrations / `/api/` mounts / `req.path` excluded by line shape; demo host excluded) | inline `'/vendor/portfolio'` at `ig.js` → RED · cured tree GREEN |
| F · `GET /me` couture_eligible: Signature-no-invite true · Basic false · Basic-with-invite true | restore `=== true` only → RED |
| G · `requirePrestige` absent from `src/`; a Basic vendor's `GET /studio/team` is not 403 | a tier gate back on `team.js` `mw` → RED |

Cells A, D, F, G drive real express routers with `requireAuth`/`resolveVendor` stubbed through `require.cache` (b0451's declared-double shape) and a chainable supabase recorder. D′ and E are comment-stripped textual cells over surfaces (an insert's payload; a literal's home), never line numbers.

## 3 · FLOOR — SET at the cut (`bash scripts/run-floor.sh --delivery scripts/floor-manifest-ce39-2a.txt --check`)

Run with the pwa sibling present at `c123926`, `node_modules` present in both, and **no other node process on the box** (`ps` = 0 before launch — the s6 condition). Result pasted in the delivery message beneath the ZIP; the verify line re-derives it on the founder's tree (R-38.19).

## 4 · CORRECTIONS OWNED — s1–s7

- **s1** dream-os `node_modules` absent at §0; installed before any floor.
- **s2** two path resolutions (`app/vendor/team-hub/screen.tsx`; `src/lib/demoLifecycle.js`).
- **s3** symbol-only navigation stated.
- **s4** floor SET not quoted before it was measured.
- **s5** `plans.ts` sweep declared partial, closed in ZIP 2.
- **s6** the first floor read 47 RED at the tip; standalone re-runs were green; an uncontended re-run matched base by name. The 47 was contention with my own earlier turn's pwa work (F-39.p5) and is quoted nowhere as a floor.
- **s7** the M-1 mirror named `engine.js` `update_routing_handle` a live "fourth writer"; it is dead code inside F-05.56's defused island. Mis-derived at read-first; caught by the floor at the cut.
- **s8** the M-1 ruling was built, reddened a sealed base-pinned cell (`b05_f0550` §4.3), and was reverted; reported above rather than worked around. `engine.js` is byte-identical to `852d385`.

## 5 · COPY — every vendor-facing byte that changed (register rows for the founder's veto record)

| site | was | is |
|---|---|---|
| `me.js` routing-handle door 400 | `Handle must be 12 characters or fewer.` | **`Handle must be 30 characters or fewer.`** (vetoed) |
| `me.js` routing-handle door 400 | `Handle must be at least 3 characters.` | RETIRED (B-3) — an empty strip now gets the one sentence above |
| `me.js` routing-handle door 409 | `Handle already taken.` | **`That address is taken. Try another.`** (vetoed) |
| `requirePrestige.js` 403 | `Studio Suite is for Prestige vendors only. Contact Swati for an invite.` | RETIRED with the file |
| `agent/onboarding.js` null-handle arm | — | the existing closing reply's second paragraph, verbatim, alone: `Also head over to thedreamwedding.in and sign in as a Maker — your dashboard is ready and waiting for you.` — **no new byte; an existing sentence sent without the link clause. Named for the founder's word; reachable only when every candidate is taken.** |

`demoAdmin.js` 409 `handle_taken` is admin-console JSON, not vendor-facing.

## 6 · SEAT PLACEHOLDERS (finals at the seal)

- **F-39.p1** `admin/vendors.js` active↔paused toggle is blind to `pending` (a pending row toggles to `paused`). Reported, not cured.
- **F-39.p2** `vendorInbound.js` `looksLikeBareHandle` caps the bare-typed fuzzy match at 12; the `TDW-` path has no cap. Post-2a.
- **F-39.p3** `engine.js` derives `invoice_prefix = TDW/${handle}` (no cap) while the prefix door caps at 20. Post-2a.
- **F-39.p4** pwa `STUDIO_ITEMS` hrefs are `/vendor/studio/*`; now every tier follows them out of `/w/team` into the old layout (F-38.1 shape) until Phase 7 gives the three studio screens `/w/` homes.
- **F-39.p5** a seat that loses context finds its own tree strange: preflight cannot tell own-hand dirt from other-hand dirt; the manifest can. `scripts/floor-manifest-ce39-2a.txt` is the instrument and travels with every delivery.
- **F-19.49 "retired on claim"** — OPEN by ruling; belongs to the Phase 7 demo-in-shell charter.
- **F-19.51 rows** `e87f3c90…` / `2275c8bc…` — untouched; the founder's.

## 7 · FOUNDER CARD (after Railway deploys this commit; account 9888294440 = DEV440)

Witness SELECT first (columns witnessed at `docs/db/PUBLIC_SCHEMA.md` `public.vendors` cols 9 `status`, 10 `tier`, 15 `routing_handle`, 16 `instagram_handle`, 32 `couture_eligible`; `public.users` col `phone`):

```sql
-- witness: PUBLIC_SCHEMA.md public.vendors (status, tier, routing_handle, instagram_handle, couture_eligible), public.users (phone)
select v.status, v.tier, v.routing_handle, v.instagram_handle, v.couture_eligible
from public.vendors v join public.users u on u.id = v.user_id
where u.phone like '%9888294440';
```

① `curl -sI -X OPTIONS https://<railway-api-root>/api/v2/vendor/me -H 'Origin: https://thedreamwedding.in' -H 'Access-Control-Request-Method: GET'` → a line `access-control-max-age: 600`.
② Open `https://thedreamwedding.in/v/makeupbyviaraa` → renders as before (the address is untouched by the cure).
③ As DEV440: `/w/couture` — if the SELECT's `tier` is `signature` or `prestige`, the room opens; otherwise the card reads the Billing door (ZIP 2 bytes) and `Billing` lands on `/w/billing`.
④ As DEV440, whatever its tier: `/w/team` rows open; one studio call (`GET /api/v2/vendor/studio/team` with the session cookie) returns 200, not 403.
⑤ Push DEV440 past its daily meter in chat → the capped-meter message's Upgrade link is `/vendor/billing` **today** (pwaPaths is pinned to `/vendor` until Phase 7 — the chair re-ruled E on this seat's read-first). The kickoff card's `/w/billing` reading is superseded by that ruling.
⑥ Discover application screen unchanged from S2/8.

Green on ①–⑥ = seat SEALED.
