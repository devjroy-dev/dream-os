# repo: devjroy-dev/dream-os · base d1aeab15bec5 · CE-47 OFF-A1b · THE CLASS LINK (server)

## 1 · What it is
R1, reversed by the founder (CE-47, 7 October 2026; accepted as built). An online class or an online workshop in her
Off-season shop may carry her own class link (her Meet or Zoom), https only. A buyer gets it only once the seat is paid:
Mark paid returns it to her room, which sends it to the buyer in one tap, labelled "Class link from <studio>". The public shop
door never selects it and never returns it. Google Meet is parked (no scope added).

## 2 · Paths (6)
ADDED: db/migrations/0205_shop_class_link.sql · scripts/floor-manifest-ce47-off-a1b.txt · this file.
CHANGED: src/lib/shop/shop.js (checkItem accepts class_link only on an online class or online workshop; ITEM_COLS carries it;
markPaid returns it for online items) · db/migrations/OUT_OF_ORDER.json (record 205) · scripts/b230_ce47_off_a1_shop_bench.js
(cells 2.9, 2.10, 2.11, 5.9, 5.10 and mutation m6).

## 3 · 0205
One column on shop_items, https only; its length (11 to 508) is checked apart from the pattern, because Postgres refuses a
regex repetition count above 255 (found by proving it). No table is created; 0204's grants cover the table. Run it in
Supabase's SQL editor; it changes no existing row.

## 4 · Proof (the seat's container)
0205 on PGlite 17 after 0204: 19 of 19 (https saves; http and a space are refused by the CHECK itself). b230 55 of 55 now and on
four shifted clocks; the new b230 against main's shop.js reds on the four new cells; m6 (the public side selects AND returns the
link) reds 5.10. e-274's walkers b07, b128, bOB, b15, b91 exit 0 (vendorCard.js does not move, so b55 is not owed).
