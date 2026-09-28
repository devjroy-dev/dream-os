# TDW · CE-46 · G6-3 · CUT THREE · HER TOKEN KEPT, AND A VENDOR WRITING TO HER NUMBER IS SILENT · HANDOVER · dream-os

**Base `79a3102`** (fetched at the cut; built on `0ac1a01`, carried once over ASK-3's cut 5 and ADS-1's server half, which share only `docs/db/PUBLIC_SCHEMA.md` with this cut: a clean three-way merge, both staleness notes kept). Rulings of 28 September 2026: F-44.224 minted; F-a1 (a) tokenVault; F-a2 (c) no expiry
column, the founder's new configuration with token expiration "Never" (OWN_NUMBER_CONFIG_ID follows its id on Railway, the card's
line); F-a3 (a) re-exchange in place, and F-a3b the door offers the connect again for a tokenless number; F-a4 null on GONE; F-a5 T-c
removed, the token masked; F-b1 the vendor-sender limb. Migration **0180** allocated by the chair. Rung **b141**. Chair's own errors
recorded: c-46.16 (0103 stores the Instagram token in clear, not encrypted), c-46.17 ("does not expire" was false for the old
configuration, 1141937505166584, 60 days).

## Why (the walk of 28 September)

W1 ran end to end on production up to the send and stopped there: `business token fetch: (#33) Insufficient permissions to access
this data` (10:53:02 IST). Meta's pages read that day: the Embedded Signup code exchange returns her business integration system
user token, the one that sends ("Onboarding business customers as a Tech Provider", Step 1); a Tech Provider uses business tokens
exclusively (Embedded Signup overview); `POST /<client business>/system_user_access_tokens` needs an access token with
`business_management` (Facebook Login for Business, "Get tokens"), which TDW's system token does not have. The token connect.js
received at 10:32 had been dropped by design (F3/FK5), and T-c could not fetch another. At 10:46 a registered vendor (a co-founder's
second number) wrote to her number and reached ensureCoupleRow, which 0028's trigger refused ("already registered as vendor").

## What shipped

- `db/migrations/0180_own_number_business_token.sql` · one ALTER in one transaction: `vendor_wabas.business_token text`. No table,
  no grant (A-45.8; RLS on since 0171; 0172's grants cover it), no expiry column. Report SELECT commented beneath (F-44.83).
- `src/lib/ownNumber/connect.js` · refuses `not_configured` BEFORE the exchange when `tokenVault.isConfigured()` is false; seals the
  exchanged token into the row; F-a3 (a): an active or suspended row with no token is updated IN PLACE (same id, never deleted);
  a row with a token is still refused (F6); pending still refused.
- `src/lib/ownNumber/token.js` · T-c removed. `businessTokenFor(row)` opens the seal (the ONE opener); `TokenError` reasons
  `no_token`, `unopenable`; `mask(token)` = `***` + last four.
- `src/lib/ownNumber/send.js` · her stored token; META_WABA_TOKEN is off this path; a Meta refusal is logged with `token=***last4`.
- `src/lib/ownNumber/events.js` · GONE (→ migrated_out) nulls her token in the same update; a quality pause keeps it. No Meta revoke
  call is made or assumed: Meta's page says the client invalidates it by removing the app (Business Settings > Integrations >
  Connected apps), which reaches us as PARTNER_REMOVED / PARTNER_APP_UNINSTALLED.
- `src/lib/ownNumber/door.js` · F-a3b: an active or suspended number with no token is answered as `number: null`, so the room offers
  the connect again (her re-exchange). The column is read for presence only and is in neither the answer nor numberView. A row
  connected after this cure holds a token and is shown as before (§7b constraint 3); pre-cure tokenless rows (DEV440's only) read as
  not connected until she reconnects.
- `src/lib/ownNumber/turn.js` · selects the token to hand her row to send; F-b1: a sender whose phone (three forms: +91…, 91…, the bare
  ten digits) is on a users row named by a vendors row is silent, outcome `vendor`, before any thread or ensureCoupleRow. Not "any
  user": couples are users too. F-44.196 narrowed; supplier and family limbs stay open (no source).
- `src/lib/ownNumber/route.js` · one boot line: `[own-number] token vault configured` or `NOT configured: …` (a boolean, never a value).
- `docs/db/PUBLIC_SCHEMA.md` · the staleness note names 0180.
- `scripts/b141_g63_business_token_bench.js` · rung b141. `scripts/lib/b137_pgdouble.js` gains `.in()` (PostgREST's in.(…)).
- `scripts/b137_g62_own_number_turn_bench.js` · §3 re-pinned by label from T-c to the stored token (the old shape RETIRED under the
  both-sides clause); 5.6 and 5e.3 re-labelled; M5's anchor re-pinned. Count unchanged, 67.
- `scripts/b121_g61_own_number_srv_bench.js` · 3.4, 3.10 and 4.2 re-pinned by label (a connected row holds a token). Count 41.

**Untouched:** src/index.js, vendorInbound.js, marketingIndex.js, engine.js, metaCloud.js, sendWa.js, ownNumber/meta.js, wabaMap.js,
forward.js, tokenVault.js. No pwa byte. No money code.

## Proof

- **b141 31/0**: the census (business_token named only by connect, door, events, turn, token; token.js the only opener; the door's
  answer and numberView never carry it; the receiver's map never selects it; no T-c); 0180's shape; the sealed token opens to the
  exact bytes and the clear token is in no table; no vault key → refused before the code is spent; re-exchange same row id, nothing
  deleted; F6 holds with a token; pending refused; the door's null for tokenless active/suspended and its unchanged answer otherwise;
  Bearer is her token with no token fetch; a refused send logged as `***0986`; a tokenless row refused before Meta; GONE nulls, a pause
  keeps; Swati's specimen silent before ensureCoupleRow; the bare ten-digit form; THE CONTROL, a returning bride keeps her turn; nine
  production mutations, each red and restored by sha (M1 clear token, M2 vault guard removed, M3 F6 restored for tokenless rows, M4
  TDW's system token back on the send, M5 unmasked log, M6 GONE keeps the token, M7 vendor limb removed, M8 any user silenced, M9
  F-a3b removed).
- **b137 67/0, b121 41/0** as re-pinned; **b124 35/0, b128 13/0, b131 12/0, b135 38/0, b136 38/0, b138 11/0**.
- **After the carry to 79a3102:** b141 31/0, b137 67/0, b121 41/0, b124 35/0, b128 13/0, and ADS-1's b144 64/0 beside it; engine built.
- **The differential, in series (at 0ac1a01, before the carry):** radius by command, 101 benches reading an edited file, PUBLIC_SCHEMA.md or db/migrations; base
  0ac1a01 worktree with engine built against the cut. Exit codes identical on all 101; PASS 3246 = 3246. Red both sides, untouched:
  b07_f0772, b07_p4b, b10_p1, b10_p2, b10_p3, b51, b59_g34, b59_mutations.
- **e-221 (this seat):** a differential call overran the 300-second limit and was killed; then a `pkill -f "node scripts/"` ended the
  seat's own shell (the e-110 class). §11 at once: both trees read, the base clean, the cut dirty in exactly the manifest's paths;
  every mutation anchor read in its production form by grep; b137, b121, b141 re-run green; the differential re-run whole in chunks
  and its line is the re-run's.
- **The floor is the founder's** (R-46.6), keys unset (A-46.4). No seat floor is claimed.

## For the walk (the card, after landing)

Anjali's D first. Railway: OWN_NUMBER_CONFIG_ID set to the new configuration's id (token expiration Never); the deploy log's boot
line reads `token vault configured`. 0180 in Supabase with its report SELECT. C'. The room shows Your own number NOT connected for
DEV440; the connect again (the in-place re-exchange), log `re-exchanged in place (F-a3)`; a SELECT reading
`business_token IS NOT NULL AS has_token`, never the value. W1, W2, W2e, W2f, W3; W5 from 8595356978 ("hi"): no reply, route log
`vendor`; W4; 15'.

## Named, not built

- F-44.225 (FE-4's): Meta's final screen ticks three data-sharing boxes by default; the room's line, the founder's words.
- The number as a box in the connected state (the founder's ask, 28 September): FE-4's.
- The room's "Turn a missed call into a WhatsApp reply." is not honoured on the shared way (cut four's Q-a, moved-way only): FE-4's
  copy line, the founder's words.
- Cut four: the missed-call bridge (moved way, Call Terminate) and the pricing line.
- F-44.196's supplier and family limbs; F-44.197; F-44.144 (v25.0 against v21.0); relays and delivery statuses from her number.
