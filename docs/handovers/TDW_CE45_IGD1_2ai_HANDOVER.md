# repo: devjroy-dev/dream-os · TDW CE-45 · IGD-1 · CUT 2a-i HANDOVER (the Instagram door's receiving half)

## What this cut does

An Instagram DM sent to a vendor's professional account now **reaches TDW and is recorded**. It is **never answered yet**: Eliza's
turn is wired in cut 2b, and the reply transport in cut 2a-ii. The lane is dark. Nothing is received until the founder sets the
callback, and nothing is recorded for a vendor unless the lane is open for her.

- **`POST /webhook/instagram`** is on the vendor service (read-first F1, ruled), set as its own callback in the Instagram Login use
  case's "Configure webhooks", and **never** the shared receiver's URL. `GET` answers Meta's challenge with `IG_VERIFY_TOKEN`; unset
  means refused.
- **The signature (E3).** It is checked against `IG_APP_SECRET`, then `META_APP_SECRET`. The NAME of the one that matched is logged
  (never a byte), and a mismatch is 403 before the 200. The dark walk's first DM settles which secret Meta uses, and the next cut
  keeps only that one.
- **`src/lib/instagram/igInbound.js`** (new folder, A-45.3):
  - it reads object "instagram", `entry[].messaging[]` (F-44.161's shape, confirmed on Meta's page 25 September 2026), with echoes
    flagged;
  - the lane opens when `perm.instagram_business_manage_messages` is ON, or for a vendor named in `IG_DM_WALK_VENDOR_IDS` (F7: the
    pre-grant walk, DEV440 only, removed at the grant);
  - it finds the vendor by account id, keeps ONE Instagram `couple_thread` per sender, and writes the row with channel 'instagram',
    sent_by 'couple' (or 'vendor' for an echo) and the mid in `message_sid`, whose UNIQUE index drops Meta's 36-hour retries.
- **F-44.162 cured.** The shared receiver (`src/marketingIndex.js`) drops any non-WhatsApp body after its fast 200 and before it walks
  a change, using `isWhatsAppBody` from `metaInbound.js`. An Instagram field ticked on the shared callback can no longer reach the
  WhatsApp vendor lane.
- **`0173_ig_dm.sql`** alters only:
  - `conversations.channel` and `counterparty_ig_id`, with a partial UNIQUE;
  - `leads.counterparty_ig_id`, with a partial UNIQUE;
  - `vendors.reply_quiet_minutes`, default 120, CHECK 60/120/240/480. This is the one home for the quiet time; G6's 2b reads it.

  It creates no table, so A-45.8 grants nothing. Its rehearsal is `scripts/lib/b119r_0173_rehearse.sh`: 16/16 on a throwaway
  Postgres, service_role reads and writes every new column, and anon and authenticated are still refused.

## For whoever is next

- **Cut 2a-ii (IGD-1).** The room's three doors:
  - `GET /api/v2/vendor/solutions/instagram` and `POST .../instagram/switch {on}` answer
    `{ ok, state: not_connected|off|on|paused|waiting, authorize_url }`;
  - `GET/POST .../quiet` answers `{ ok, minutes }` (the pwa's parser is `lib/vendor/metaRoomDoor.ts` at dreamos-pwa `6bb8e7e6`).

  Also in 2a-ii: the messages flavour on the existing connect (igOAuth FLAVOURS, the insights precedent), `/me/subscribed_apps` on and
  off, and the Send API with the 24-hour window (no human-agent tag on Eliza) and the 1000-byte split at sentence ends.
- **Cut 2b (IGD-1).** `runCoupleAgenticTurn` gains the counterparty parameter; it keys on couplePhone at five sites and throws on null
  at :692. The lead is keyed by `leads.counterparty_ig_id`. The quiet time takes effect.
- **The master.** `docs/specs/TDW_19_V2_BUSINESS_SOLUTIONS_MASTER.md` §5 row I2 is to read **Eliza answers IG DMs** (R-45.26; K4,
  banked). The amendment is made when the master is next touched.
- **G6-1.** `vendors.reply_quiet_minutes` is the quiet time's one home for your own-number lane too.
- **Railway, before the walk.** `IG_VERIFY_TOKEN` (new, any long random string) and `IG_DM_WALK_VENDOR_IDS` (new, DEV440's vendor id).
  `IG_APP_SECRET` exists.
- **Meta's dashboard.** No Instagram field is ticked until the chair says. The callback is the vendor service's `/webhook/instagram`,
  typed in the Instagram Login use case's section 3, never the shared receiver's.

## Disclosed

- e-146: the receiver first called an identifier its destructure never bound. It was caught before any run.
- b119's 5.4 and 5.6 passed vacuously once and were cured with webhookCore's own test hook, so the dedupe path is exercised.
