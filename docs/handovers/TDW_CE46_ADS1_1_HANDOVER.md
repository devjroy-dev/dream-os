# TDW · CE-46 · ADS-1 · CUT 1 (dream-os) · HANDOVER · 28 September 2026

## WHAT SHIPS
The Posts & ads control panel's server half (R-46.10 to R-46.14): a vendor connects her own Meta ad account, TDW reads
which of three things she still lacks (a Facebook Page, its Instagram link, an active ad account), and she runs and
manages a MESSAGES ad from one of her own Instagram posts or reels into her Instagram Direct, on her card, every Meta
setting hers. Base `0ac1a01`.
- `db/migrations/0177_ads.sql`: `vendor_ad_connections`, `vendor_ads` (settings jsonb), RLS and service_role grants in the
  same transaction, `flag.ads` 'off'. Rehearsal `scripts/lib/b144r_0177_rehearse.sh` (throwaway Postgres 16).
- `src/lib/ads/`: `oauth.js` (Facebook Login for Business address with config_id, signed single-use state of kind 'ads'),
  `connection.js` (the one hand on the connection; the nonce spent in ONE conditional UPDATE), `door.js` (flag.ads:
  'armed' opens for ADS_WALK_VENDOR_ID only, 'on' for all), `meta.js` (every Graph call; `gapsFrom` pure; the messages
  ad's four objects created PAUSED; management; Meta's own lists), `targeting.js` (a pure validator of HER settings and
  the confirm echo; decides nothing), `runs.js` (the one hand on vendor_ads).
- `src/api/vendor/ads.js`, mounted at `/api/v2/vendor/ads` in `core.js` beside '/ig': status, authorize, callback, check,
  disconnect, posts, search, start, prepare (creates nothing), run (echo or refuse; row before Meta), list,
  manage/prepare, manage (echo, re-validate, only the changed field to Meta), results.
- `docs/db/PUBLIC_SCHEMA.md`: the 0177 note.

## PROVEN
- b144 64/0 over the real router (Meta and Supabase stubbed), eight production mutations red and restored by sha.
- 0177 rehearsed: RLS t on both, service_role DELETE/INSERT/SELECT/UPDATE, anon and authenticated refused, every CHECK,
  revert and re-apply. b128 13/0.
- Sealed at the tip with the cut: b119 28/0, b119b 34/0, b136 38/0, b136c 15/0.

## THE FOUNDER'S SETTINGS CARD (the Meta sitting, item 3; settings first)
1. Railway, dream-os service, Variables: `ADS_APP_ID` = 4570863996490339 · `ADS_CONFIG_ID` = 1863002924861430 ·
   `ADS_REDIRECT_URI` = https://api.thedreamwedding.in/api/v2/vendor/ads/callback · `ADS_WALK_VENDOR_ID` = DEV440's vendor id
   from his own witnessed read (never pasted into chat). `ADS_APP_SECRET` is already set by him.
2. Supabase SQL editor: run `db/migrations/0177_ads.sql` whole, then the read-only check:
   `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('vendor_ad_connections','vendor_ads');`
   `SELECT table_name, string_agg(privilege_type, ',' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE grantee='service_role' AND table_name IN ('vendor_ad_connections','vendor_ads') AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE') GROUP BY 1;`
   `SELECT key, kind, status FROM public.capabilities WHERE key='flag.ads';`
   Expect both t; DELETE,INSERT,SELECT,UPDATE on each; flag.ads flag off.
3. Arm for the walk only (F-44.223): `UPDATE public.capabilities SET status='armed', flipped_at=now(), flipped_by='founder' WHERE key='flag.ads';`
   then wait 60 seconds (the capabilities cache).

## THE WALK (connects, then recordings), one step per message on the day
Step 0 the three response headers (Chrome, F12, dated screenshots); the Page The Dream Wedding; its link to
@thedreamwedding_in (the Meta room's Instagram status read before and after); the ad account with his card; the connect
in TDW (the iPhone line in iOS standalone); the gap re-read after each; one messages ad on the brand account's post at
Meta's minimum for one day, the amount read from his account and shown before his tap. Record either way: whether the
creative is made on the user token (the click-to-Instagram page asks for a Page token; the one-line change is ruled
after). Check META_SCREENS' three addresses. Then the App Review recordings, seven permission lines.

## OPEN, NAMED
- Before App Review (the founder's): app icon 1024 x 1024, category, TDW's real privacy policy, terms and data-deletion
  pages in place of the facebook.com placeholders on TDW ADS.
- F-44.236 (igConnection.spendState reads then clears): IGD-3's queue. F-44.233, F-44.234: FE-4's queue.
- The stray empty "TDW ADS" app 1831159781225120 and dream-os-marketing 1073940998303309: the founder's to keep or delete.
- PUBLIC_SCHEMA.md's header carries no notes for 0175 and 0176 (not this cut's).
- Cut 2 (the lead ad, leads_retrieval, the leadgen webhook, vendor_ad_leads); cut 3 (other objectives and destinations,
  custom and lookalike audiences); stories and ads from new media: later, each with its own permission line.
