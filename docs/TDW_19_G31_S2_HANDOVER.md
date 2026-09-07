# TDW · BLOCK 19 · G3.1 sitting 2 — YOUR WEBSITE & SEO · HANDOVER (dream-os packet 1)

**Base** dream-os `eefdd68` (re-pinned: `52f0b2f → 94ed742 → eefdd68`, G3.2 s3 + G2's consent packet; nothing in this radius moved) · dreamos-pwa `bfa3197`. Ladder tip `0146`; this packet lands **`0147`** (R-40.44).
**Rulings** R-40.122 (three surfaces) · R-40.123 (prototype yes; two windows named; W3-report-empty) · FORK 2 as drawn · FORK 3 computed · F-40.253 filed (readerless bytes) · F-40.255 cured (callback is a GET).

## What this packet lands (dream-os)

| file | what | bench |
|---|---|---|
| `db/migrations/0147_google_connections_search_console.sql` | `vendor_google_connections` (0103's shape; `refresh_token_enc` ciphertext) · `search_console_daily` PK(vendor_id, day) · `search_console_queries` PK(vendor_id, window_end, query) · `vendors.seo_title` (≤70) / `seo_description` (≤200), NULL = derive | verify SELECT below names every constraint (R-40.49) |
| `src/lib/vendor/tokenVault.js` | AES-256-GCM under `INTEGRATION_TOKEN_KEY` (spec §8's key, first reader in the tree). `v1.iv.tag.ct`. Seal throws on a bad key — a grant is never written in clear | b59 §1 (11 cells) |
| `src/lib/vendor/googleOAuth.js` | one Google project; scope `openid email siteverification webmasters.readonly`; `offline` + `consent`; `GOOGLE_CALLBACK_PATH` asserted against `GOOGLE_OAUTH_REDIRECT_URI` in `isConfigured()`; state kit REQUIRED from igOAuth (one home; HMAC key is IG_APP_SECRET by igOAuth's own reasoning — shared blast radius, recorded) | b59 §2 |
| `src/lib/vendor/googleConnection.js` | sole writer of the grant row; `SAFE_COLUMNS` never names the ciphertext; `openRefreshToken` is its only reader | b59 §3 |
| `src/lib/vendor/searchConsole.js` | `pull()` → 0147 §2/§3 rows; `report()` → `last_28` / `prior_28` as SUMS, top-5 queries, `has_data` | b59 §4 |
| `src/api/vendor/solutions/google.js` | `GET /connect` · `GET /callback` · `GET /status` · `GET /report` · `POST /sync` · `POST /disconnect` under `/api/v2/vendor/solutions/google`; gate first line; closed → 503 `GOOGLE_NOT_CONFIGURED`; redirect back to `/vendor/storefront?google=…` | b59 §3 |
| `src/api/vendor/solutions/storefront.js` | `GET /storefront/qr.png` — `weddingCardPdf.qrPng` (exported this packet), one call, encodes `${PWA_BASE_URL}/v/<handle>` | b59 §6 |
| `src/api/public/vendorCard.js` | `meta: { title, description }` joins `CARD_KEYS` (14); `metaFor()` is the one derivation; `VENDOR_SELECT` +2 columns; both card() call sites pass it (F-40.169 applied at authoring) | b44 59/59 · b55 50/50 · b58 33/33 · b59 §5 |
| `src/api/vendor/me.js` | `seo_title`, `seo_description` in the PATCH allowlist and the GET projection (B-7's smallest change) | — |
| `scripts/b44…`, `scripts/b55…` | amended BY LABEL (F-40.168): CARD_WANT + SELECT WANT (thirteen) in b44; b55's list appends `meta` | run below |
| `scripts/b59_g31_s2_google_bench.js` | 51 cells; five mutations RED on named cells → reversed → GREEN (run this sitting, table in the bench's foot) | 44/44 |

Nothing in the P1 stub's comment was deleted; the mount note beside `module.exports` says what opened where.

## Keys the infra seat lands on Railway (spec §8, env.js:50–52)
`GOOGLE_OAUTH_CLIENT_ID` · `GOOGLE_OAUTH_CLIENT_SECRET` · `INTEGRATION_TOKEN_KEY` (32 bytes, base64 or hex) · **and** `GOOGLE_OAUTH_REDIRECT_URI` = `https://dream-os-production.up.railway.app/api/v2/vendor/solutions/google/callback` (must end in exactly that path — the door stays closed and warns once otherwise). Google Cloud: same redirect URI on the OAuth client; APIs enabled: Search Console API, Site Verification API. Spec §8 amended at the cut for `GOOGLE_OAUTH_REDIRECT_URI` (chair). Consent screen: `openid` + `…/auth/userinfo.email` + the two Search Console scopes (infra item 13).

## F-40.261 — RULED (a): the house connection
One `vendor_google_connections` row with `vendor_id NULL` (0147 §4's partial unique index makes it one) — the founder's grant of `dev@thedreamwedding.in`, owner of `sc-domain:thedreamwedding.in`. `GET /google/connect?house=1` mints a house state; the callback stores it as the house row **only if Google says the account is that email** (`not_house` otherwise) and sets `sc_property` to the domain property. `pull()`'s default arm reads every vendor's `/v/<handle>` through it (`page contains`); `arm=own` reads her own domain through her grant (P2). `sync` answers `GOOGLE_NO_HOUSE` until the house row exists — never `no_property` on the `/v/` path. `GET /status` carries `house_connected` for the room. b59 §3b (7 cells, mutation 5).

## Owed after this packet
- **pwa packet** (next): the room replaced to the prototype (`app/vendor/(shell)/storefront/screen.tsx`), tile + hub row bytes (R-40.122), `generateMetadata` + JSON-LD read `card.meta`, `app/sitemap.ts` / `app/robots.ts` / canonical, checklist derived from the meter's six visible terms, the three things computed, P2 screens behind `RESELLERCLUB_*` with the honest line (byte for veto), F-40.253's four bytes retired. `next build` at apply (R-40.66).
- Nightly `pull()` runner (no scheduler in radius; the Sync tap works today).
- G2 s2 (10-27) inherits `vendor_google_connections` and appends its scope to `GOOGLE_SCOPE`.
- `PUBLIC_SCHEMA.md` regeneration for 0147 (chair's file).

## Verify (founder runs; one statement per paste, R-40.31)
See the delivery message — SQL, curls and the bench line are separate blocks.

---

# dream-os packet 2 (base `4c8f3ce62510c8eff7a4d3cf8065f1bd17affd04`) — and the sitting's close

## What p2 lands

| file | what | bench |
|---|---|---|
| `src/api/public/sitemap.js` + `router.js` | `GET /api/v2/public/sitemap` → `{ pages: [{ handle, slug\|null, updated_at }] }`. The card door's own predicates restated by column (`status=active ∧ ¬discover_paused`; `visibility=published ∧ couple_consent`), handles lowercased (F-40.276), three columns and no phone/name/city (R-G11.6). `listPages()` exported so the bench drives it. `Cache-Control: public, max-age=3600` — the pwa's `app/sitemap.ts` reads it hourly and now lists every storefront and every published-consented wedding page | b59 §7 (5 cells), mutations 6–7 |
| `src/lib/vendor/searchConsoleNightly.js` + `cron.js` | the nightly pull at **`40 3 * * *` IST** — its own minute, derived against the nine registrations at the tip (02:30, 03:00, :15, :20, :25, :45, 04:15; hourlies :05/:20/:30); after the seal and the reminders. Heartbeat (F-40.107): the house row's `last_synced_at`, written by `pull()` → `markSynced(house)` and by nothing else. No house row → one read, `no_house`, nothing touched. A failing vendor is logged by handle; the sweep continues | b59 §8 (4 cells) |
| `src/api/public/vendorCard.js` | **F-40.277**: `metaFor` derives the trade from `categoryProfiles.profileFor(category).label`, sentence-cased (`photography → Photographer`, `makeup → Makeup artist`); the catch-all (`other → vendor`) is dropped rather than printed. `tradeWord()` exported. The leaf's own eyebrow (`PHOTOGRAPHY · DELHI`) still prints the key — the leaf is the pwa's, filed for the next pass, not changed here | b59 §9 (4), §5.5/§5.7 amended by label, mutation 8 |
| `scripts/b59_g31_s2_google_bench.js` | 64 cells; eight mutations RED→GREEN by hand; neighbours b44 59 · b55 50 · b58 33 · b56 318 · b57 14 | — |

`PUBLIC_SCHEMA.md` for 0147 is the chair's. Verify block and git line: the delivery message.

## Where sitting 2 closes

**Sealed in the tree**
- dream-os `a4fdc92` (p1: 0147, the Google door with GET callback, tokenVault, house row F-40.261 a, Search Console pull + report, storefront QR, `card.meta`, `/me` seo_*), and this p2.
- dreamos-pwa `aad0f0f` → `f050160` → `966eb1c`: the room as the ratified prototype (R-40.123) at `/vendor/your-website` off the registry (R-40.132), Storefront restored byte for byte to 82612b3, three surfaces per R-40.122, `card.meta` in metadata + JSON-LD, robots + sitemap, F-40.253 retired, F-40.274's honest bytes, F-40.276; the mock (12 frames, 32 shots) and the veto list in `docs/mocks/`.

**Rulings this sitting stood on**: R-40.101, .118, .122, .123, .132, .134 (pointed), F-40.261 (a).
**Findings filed**: F-40.253 (closed), .254 (cured), .255 (cured), .261 (ruled, built), .274 (register cured; mechanism → R-40.134), .275 (G1.x), .276 (cured), .277 (cured, dream-os side).

**Open after the close, by owner**
- **Founder**: the house connect (`…/google/connect?house=1` as DEV440, sign in as dev@thedreamwedding.in); the §5 acceptance walk as MAKEUPBYSWATIROY once her row is read; Vercel/Railway deploys of p2.
- **Wedding-pages pass (R-40.134)**: the editor door (venue/city/title on a made page) and the deep link from the fix row; then F-40.274's four bytes revert to the fix register (one edit to `C`).
- **G1.x**: F-40.275 (`WP.reelProbeOff`).
- **Next pwa pass on the leaf**: the eyebrow's trade word (same derivation as F-40.277, `tradeWord`'s twin in TS — or the leaf reads it off `card.meta`-adjacent data; a ruling on which home).
- **P2**: `Your own name` screens as drawn, behind `website.live`, when `RESELLERCLUB_*`/`VERCEL_*` exist; the invoice pass-through line ruled.
- **G2 s2 (10-27)**: inherits `vendor_google_connections`; appends its scope to `GOOGLE_SCOPE`.
- **Block 20 charter question** (from the founder's walk): TDW-side city/trade landing pages — the lever that lifts every vendor at once; not chartered anywhere.
- **Chair**: `PUBLIC_SCHEMA.md` for 0147; spec §8 row for `GOOGLE_OAUTH_REDIRECT_URI`; FINDINGS_LOG entries for .253–.277.

**Declared, never verified by this seat**: MAKEUPBYSWATIROY's row; the glass (this seat could not reach thedreamwedding.in — every glass fact above is the founder's walk, 2026-09-08).
