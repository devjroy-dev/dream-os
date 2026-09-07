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
