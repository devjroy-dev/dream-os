# repo: devjroy-dev/dream-os · TDW CE-45 · IGD-1 · CUT 2a-ii HANDOVER (the room's doors, the connect, the reply transport)

## What this cut does

The room "WhatsApp and Instagram" in dreamos-pwa (landed at `6bb8e7e6`) now has a server behind it, for **DEV440 only** until Meta
grants. Every new door answers 404 to a vendor the Instagram lane is not open for, and the pwa draws nothing on a 404.

- **`GET /api/v2/vendor/solutions/instagram`** and **`POST .../instagram/switch {on}`** answer
  `{ ok, state, authorize_url }` (`src/lib/instagram/igRoom.js`). The state is derived, never stored beyond her switch:
  - not_connected: no connection, or the messages permission not proved on her token;
  - off;
  - paused: switched on, but her token is unusable;
  - waiting: switched on, the lane not open for her;
  - on.

  The authorize address is minted only when she must authorise. Turn on records her consent, and it subscribes her account to
  messages only once the permission is proved on a usable token. Turn off unsubscribes her account.
- **`GET/POST .../quiet {minutes}`** reads and writes `vendors.reply_quiet_minutes` (0173): 60, 120, 240 or 480. It is dark by the same
  lane until cut 2b gives it an effect.
- **The connect's "messages" flavour** (`igOAuth.js`) asks for `instagram_business_basic,instagram_business_manage_messages`, signed
  into the state like the insights flavour. The callback (`ig.js`) proves the grant with one read of her conversations
  (`GET /me/conversations?platform=instagram`, Meta's Conversations API page, read 26 September 2026) before storing
  `messages_granted_at`, and returns her to `/vendor/number` (`pwaPaths`: `number`). A refusal answers `ig=no_scope`, and the room
  keeps saying connect.
- **The reply transport** (`igSend.js`): Graph **v26.0**, read on Meta's Send API page 26 September 2026, in ONE constant. It sends one
  POST per part to `/<IG_ID>/messages` with her token, only within 24 hours of the couple's last message and never with a human-agent
  tag. A reply over 1000 bytes is split at sentence ends and never reworded. No token is logged. **Nothing calls it yet**: Eliza's turn
  is wired in cut 2b.
- **`0174_ig_dm_switch.sql`** alters only `vendor_ig_connections`: `messages_granted_at`, `dm_state` ('off' | 'on', default 'off'),
  `dm_consented_at` and `dm_subscribed_at`. Its rehearsal is `scripts/lib/b119br_0174_rehearse.sh` (9/9).
- **Rung `b119b`**, 34 cells. Its §1 requires every module this cut touches, so a boot-time throw is RED on the floor.

## The dark walk: NOT to be started until the chair says

1. **Railway (vendor service).** Set `IG_VERIFY_TOKEN` (a new long random string) and `IG_DM_WALK_VENDOR_IDS` (DEV440's vendor id).
   `IG_APP_SECRET` already exists.
2. **Supabase.** Run `0174_ig_dm_switch.sql`, with its read-only checks from the card.
3. **Meta dashboard.** In the Instagram use case, "Generate access tokens", add DEV440's Instagram professional account. Then, in
   section 3 "Configure webhooks", type the Callback URL (the vendor service's `/webhook/instagram`) and the verify token (the same
   string as `IG_VERIFY_TOKEN`), press Verify and save, and tick **messages** only. It is never the shared receiver's URL, and no other
   field is ticked.
4. **As DEV440**, in the room: Connect Instagram, the consent, Turn on. The room reads On.
5. **From the founder's second Instagram account**, message DEV440's account. The DM is recorded on an Instagram thread (read from the
   store). **No reply is sent until cut 2b.**

## For whoever is next

- **Cut 2b (IGD-1).** `runCoupleAgenticTurn` gains the counterparty parameter; `igSend.sendText` is called with the window checked; the
  lead is keyed by `leads.counterparty_ig_id`; the quiet time takes effect for both channels.
- **E3.** The walk's first DM names which secret signed it (`[webhook:instagram] signature matched ...`). The next cut keeps only that
  one.
- **G6-1.** `vendors.reply_quiet_minutes` is the one home for your quiet time too.
