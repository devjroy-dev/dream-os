# TDW · CE-45 · G6-1 · CUT 2a (SRV_1) · HANDOVER · dream-os

Base: `46af98d21ed4` (given by the chair under R-45.14 after LCV-15's LSP_1 landed). Built at 89e3a6e, carried and
re-derived at 46af98d. Rulings: read-first G1, G2, G3 and F1 to F6 (2026-09-24), D1 to D6 (2026-09-24).
The pwa half, FE_1, is live at dreamos-pwa `24923aa` and builds to this cut's wire.

## What shipped

The own-number server half, dark. A vendor's own WhatsApp number can be connected through Meta's Embedded Signup v4
and recorded; what arrives on it is received and kept, private to her; Meta's account and quality events set her
number's state. Nothing is ever sent from her number in 2a, and couples writing to it get no reply until 2b.

- `db/migrations/0171_own_number.sql` · vendor_wabas, vendor_wa_events (RLS on both in the transaction), §7c's
  vendors.enquiry_routing and enquiry_phone, and five switch rows seeded 'off': flag.own_number and one per tier.
- `src/lib/ownNumber/meta.js` · every Graph call (exchange, phone numbers, subscribe, register, SMB sync); fetch
  injected; the two-step PIN derived by HMAC(app secret, PNID), never stored.
- `src/lib/ownNumber/door.js` · the GET's answer. **Walk mode is the only opening**: flag.own_number 'armed' AND the
  vendor named in OWN_NUMBER_WALK_VENDOR_ID. 'on' is deliberately not honoured; `openFor` is the one function 2b
  edits. A number on file is shown even when the door is shut.
- `src/lib/ownNumber/connect.js` · the POST: gate, row check, then the code exchanged before any other Meta call
  (it lives 30 seconds); the way from Meta's finish event; moved: subscribe and register; shared: subscribe, no
  register, then contacts and history sync once each within Meta's 24 hours.
- `src/lib/ownNumber/wabaMap.js` · PNID or WABA to vendor; found rows cached 60s, misses never cached.
- `src/lib/ownNumber/events.js` · receipt only; history, contacts and echoes kept; auto-pause as state; Meta's
  2593109 recorded as her choice; status decided on a fresh read of her row.
- `src/api/vendor/solutions/number.js` + one mount line in `src/api/vendor/solutions/index.js` (:498).
- `src/lib/metaInbound.js` · `routeChange`, pure, beside `laneForPnid` (unchanged).
- `src/marketingIndex.js` · the receiver's loop: env lanes first, unchanged; else the map; a vendor's own
  traffic handled in the receiver and never forwarded; PNID-less changes on any other WABA forwarded to the vendor
  lane.
- `src/lib/discover/shapeVendor.js` · `enquireLinkFor`, §7c's one home ('tdw' is today's link byte for byte).
- `scripts/b121_g61_own_number_srv_bench.js` · rung b121.

**Untouched, pinned by b121 1.1:** src/index.js, src/engine, src/lib/sendWa.js, src/lib/whatsapp.js. No money code.

## Findings

- **F-44.138, WIDENED (G2, ruled).** The shared receiver dropped every change without a
  `metadata.phone_number_id` (`src/marketingIndex.js` loop, then `laneForPnid(null)`), and Meta sends two such
  fields: `account_update` (whose reference shows the WABA as `entry.id` and no metadata) and
  `message_template_status_update` (`extractTemplateStatusUpdates`, `src/lib/metaInbound.js` :256). So the vendor
  service's template-status seam (`src/index.js` :199 at 46af98d) and its account-update seam (:222) never ran in
  production. **Cured here:** a PNID-less change is routed by `entry.id`: a vendor's WABA to the own-number handler,
  any other WABA (TDW's own) to `forwardChange('vendor', ...)`, where both seams now receive it.
- **F-44.140** (recorded by the chair): no ads permission on App-LIVE and no second Meta app (the founder's
  screenshots, 2026-09-24 00:39 to 00:43 IST); the road line is in the survey's rows A1 to A3 and L1.
- **F-44.144** (recorded by the chair, D5): the Graph version defaults to v25.0 in `ownNumber/meta.js` and to
  v21.0 in `src/lib/metaCloud.js`. Named, not unified; a later docs-and-config cut.
- e-93 (the container reaps any process a tool call started), e-94 (b120's mutation probes write into its shot
  folder; cured at b120's next edit, with FE_2).

## Rulings as built

- **F6, amended (D2):** a re-connect is refused while her row is pending, active **or suspended**; after
  migrated_out the row is replaced, never stacked.
- **D1:** the §7c resolver is built and not wired into the four link builders (shapeVendor :169, weddingTeam :294,
  weddingPage :142, vendorCard :572 at 46af98d). Each reads vendors through an explicit column list; until a vendor
  can set the switch every row is 'tdw', whose link is byte-identical. The wiring rides FE_2's dream-os half with
  the switch's write door.
- **D3:** connect needs `waba_id` and `business_id` from Meta's session; if the message lost the race to the code
  it refuses `session_incomplete`, which FE_1 shows through its error line. Meta's shared-WABA read was not read on
  the day and is not written; it is 2b's, or a later cut's, if the race is ever seen live.
- **D4:** no new vendor byte; refusals and the GET's reason_text carry existing approved words.
- **D6:** the vendor service gains four Railway variables, the founder's by clicks: META_APP_ID,
  OWN_NUMBER_CONFIG_ID, OWN_NUMBER_WALK_VENDOR_ID, and optionally OWN_NUMBER_EXTRAS_SHARED / _MOVED (JSON). The
  receiver gains none. No system token is needed in 2a.

## Proof

- **b121 at 46af98d: 41 pass, 0 fail.** Boundary and wiring; the pure decisions (routeChange, the walk-mode
  matrix, launch from env, hostile bodies, the way, the PIN, nextStatus, 2593109, the resolver); the connect against
  a Postgres-shaped double (only selected columns, 0171's UNIQUE and CHECKs with Postgres's codes, read counts) and
  a recording Meta, in Meta's order, token and PIN written nowhere, three shifted clocks (C-44.13); the door; the
  receiver's events and map; six production mutations, each red and restored by sha. At the base without the cut
  the bench cannot load its subjects (the files are absent), so its both-ways proof rests on the six mutations.
- **0171 rehearsed** on a Postgres 16 plant as a NOSUPERUSER BYPASSRLS editor (the SEC-1 way): applied; RLS true
  on both tables; the columns and defaults; five 'off' rows; every CHECK refusing its bad value; a second run
  refused whole. Limits: the plant's vendors table carries 2 of 56 columns, and production's engine is not 16.
- **The differential, in series on 46af98d** (66 benches that read an edited file or db/migrations; the work
  stashed for the base side and restored by sha): no exit code moves. Output deltas, each attributed: b10_p1, p2,
  p3 are red on both sides on the same cell (a pin of the migration ladder at 0112); their message names 0171
  instead of 0170. b14_d1 walks 418 files instead of 412, the six new ones. b91 (the RLS ladder cell) is green on
  both and now counts 0171's two tables as created with RLS. b61 and b08_p5 differ only in wall-clock timestamps.
  Red on both sides, untouched by this cut: b07_f0772, b07_p4b, b10_p1, b10_p2, b10_p3, b51, b59_g34, b59_mutations.
- **The floor:** its own turn. The seat's sliced floor listed dirt file by file (`-uall`), so it passed a manifest
  that named the new folder's files but not the folder; the founder's whole floor, whose `dirt_paths`
  (run-floor.sh :137) prints a new folder as one line, refused SRV_1 before its loop. **SRV_1b** adds the
  `src/lib/ownNumber/` line (the ce42-4b1 precedent) and block 3's check skips folder lines; no code changed.

## The walk (card in the attach)

Step 0, the founder's own: 8757788550 runs ordinary WhatsApp, so he moves it to the WhatsApp Business app on the
same phone (WhatsApp's own migration, chats kept) and checks the version is 2.24.17 or later. Then the Meta
dashboard steps, the Railway variables, 0171 in Supabase with its SELECT, the switch armed for DEV440 only, the
shared way on 8757788550 with history-sharing declined, and one message from 9888294440 to it, read back by a
SELECT derived from the schema doc. The moved way is walked only ever on a spare SIM.

## Next

FE_2 (dreamos-pwa, with a small dream-os half): the founder's five renamed bytes, the consent-gap fix, §7c's
Settings row and its write door, the four link builders wired to `enquireLinkFor`, b120's five pins and e-94's
cure. Then cut three (the missed-call bridge), and 2b as the chair sequences it (the conversation on her number,
`openFor` opened to 'on' with the tier rows, her token re-fetched by fetch_only).
