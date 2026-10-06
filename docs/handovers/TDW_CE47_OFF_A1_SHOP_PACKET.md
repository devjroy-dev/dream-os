# repo: devjroy-dev/dream-os · base a29a45b52022 · CE-47 OFF-A1 · THE OFF-SEASON SHOP (server)

## 1 · What it is
The server half of the Off-season shop (OFF charter Part A; the chair's Q1 to Q12 and fork (a)). She sells gift vouchers, workshops,
online classes and non-wedding bookings from her website and storefront. Without a payment link (INS) an order arrives as a question
("asked") and she taps Mark paid when the money comes; with INS's link the buyer pays straight into her own account. Dark behind
flag.off_shop ('off'; 'armed' opens it for OFF_WALK_VENDOR_ID only).

## 2 · Paths (21)
ADDED: db/migrations/0204_off_season_shop.sql · src/lib/shop/shop.js · src/lib/shop/gate.js · src/api/vendor/solutions/shop.js ·
src/api/public/shop.js · scripts/b230_ce47_off_a1_shop_bench.js · scripts/lib/b230_fake_sb.js · scripts/floor-manifest-ce47-off-a1.txt ·
docs/handovers/TDW_CE47_OFF_A1_SHOP_PACKET.md (this file).
CHANGED: db/migrations/OUT_OF_ORDER.json (record 204: lands below 0212 and 0214) · src/api/router.js (+ /public/shop) ·
src/api/vendor/solutions/index.js (+ /shop) · src/lib/pwaPaths.js (+ shop '/vendor/off-season-shop') · fork (a), F-44.340:
src/lib/vendor/occupancy.js (OCCUPYING_KINDS + 'shop') · src/lib/vendor/eventWrite.js (CALENDAR_KINDS + 'shop', the 14th) ·
src/api/vendor-engine/cabinet.js and chat.js (BOOKED_KINDS + 'shop') · benches amended by label: b3_rider (counts 13 to 14, 3 to 4,
one cell added), b105, b106, b108 (eventWrite.js's pinned blob only).

## 3 · 0204
Three tables (shop_items, shop_orders, shop_vouchers), RLS on, the four privileges to service_role (A-45.8); vendor_site_sections.key
and events.kind widened by 'shop' (the key CHECK found by its definition, not a guessed name); flag.off_shop 'off'. Proven on
PGlite 17 (real Postgres, from npm) against a base built from the witnessed CHECKs: 15 of 15. Run it in Supabase's SQL editor; it
changes no existing row.

## 4 · F-44.340 (minted from OFF's range)
Q3 put a paid shop booking on her Calendar so her date check stays true, but a new kind occupied nothing: the date check read only
OCCUPYING_KINDS (shoot, family, ceremony). Cured by fork (a): 'shop' occupies the day, counts as booked, and is written only through
eventWrite.writeEvent (forced: her tap is money already taken; a blocked day is still refused, the order stays paid, and the writer's
own sentence comes back to her room). A shop entry has no binder, so it never speaks for a wedding (isWeddingAnchor).

## 5 · Proof (the seat's container)
b230: 49/49 at now and on six shifted clocks (the next IST day, 31 December into 1 January in India, 28 February 2027, 28 and
29 February 2028, June 2027); exit 1 at the base. Five production mutations in memory, each reddening its cell. Differential over
the 112 benches reading any touched file, base against cut: same exits and cell counts except the four amended by label
(b3 21 to 22 cells; b105, b106, b108 the same counts and green after the blob pin moves).

## 6 · Carried
Eliza's facts about the shop: Part B's train (W-1 stays). An order for a booking date is not checked against her Calendar at the
order; the check is at Mark paid, through the writer. The room, the website section in six styles, the storefront row and the item
page are OFF-A2 (dreamos-pwa).
