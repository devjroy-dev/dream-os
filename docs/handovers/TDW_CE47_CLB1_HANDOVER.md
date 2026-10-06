# repo: devjroy-dev/dream-os · base a29a45b52022 · CE-47 · CLB-1 · COLLAB HUB v2 (server half)

What it is: a vendor's collab call carries its pay (Paid, Unpaid, Credit only) and up to four reference pictures, and
may go to TDW's own Instagram and Threads after the admin approves it. The admin gets a queue, a "share this call" text
and a prospects list (never used to tag anyone). Cures F-44.300 (the admin collab page called a door nothing served).

Rulings it follows (CE-47, 4 October 2026): Rule 1, until a switch row is on only admin_config clb.testers see the TDW
tick; Rule 2, no '@' ever reaches a post (stripped from her words, refused before any call to Meta); hashtags craft,
then city, then occasion, five on Instagram and one on Threads. The chair's ruling of 4 October: house posting is not a
Meta-gated vendor feature (TDW's house account, thedreamwedding_in, holds a role on App-LIVE and needs no App Review
for its own posting), so the two rows are plain readiness switches the founder turns on by hand, not in metaGates.

Files: db/migrations/0196_collab_v2.sql; src/lib/collab/{social,testers,gate,publish}.js; src/api/vendor/collab.js
(v2 fields, /share-gate, /reference/sign, /:post_id/shares); src/api/admin/collab.js and its mount in
src/api/router.js; scripts/b280_clb1_collab_v2_bench.js.

The founder's one-time steps, in order: 0196 in Supabase before the push; on Railway TDW_HOUSE_IG_USER_ID,
TDW_HOUSE_IG_TOKEN, TDW_HOUSE_THREADS_USER_ID, TDW_HOUSE_THREADS_TOKEN; admin_config clb.testers = a JSON array with
DEV440's vendor id. After one call is walked, he turns flag.collab_house_instagram (and flag.collab_threads) on.
