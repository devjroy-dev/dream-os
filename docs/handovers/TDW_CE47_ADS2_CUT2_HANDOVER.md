# TDW · CE-47 · ADS-2 · CUT 2 (ITEMS 1 AND 3) · dream-os · 1 October 2026

Base 31257f6 (WEB-4 cut 7). One package, per the founder's few-large-landings rule. Item 1 was confirmed by CE-46 as
r2 (7eaa50d6) and never landed; its bytes are carried unchanged.

## ITEM 1 · NO LONG DASH IN WHAT TDW WRITES FOR HER

The founder's rule through the chair (CE-46, 30 Sept 2026): no long dash in the text TDW writes.

- The card caption (src/lib/vendor/postCards.js, captionFor): "{title} in {city}." replaces "{title} — {city}."
  With no city the clause drops whole ("Wedding."), as before. Everything after it is unchanged.
- The contract title (src/lib/vendor/contracts.js): a contract she fills is named "{name} wedding services" by one
  exported helper, generatedTitle, which the draft insert calls. A title she types is kept as typed.
- Kept, as ruled: BRIEF_COPY.DASH, the Sunday brief's "no figure yet" mark on an image.
- Comments quoting the old title updated (src/api/vendor/contracts.js, b56).

Cells: b73 2.1, 2.2 ("Wedding in Udaipur. …"), 2.2b (no caption carries a long or short dash, across venue and
city); b56 "the generated title reads …" and "the draft insert takes its title from that one helper".
Reds, by mutation of production source, each restored by sha: M-A the caption's dash back (b73 2.2 and 2.2b red,
23/2); M-B the contract literal back at the insert (b56 one-helper cell red, 319/320); M-C the helper returns the
dash (b56 words cell red, 319/320). Cured: b73 25/0, b56 320/320.

## The success line at connect (the chair's yes, 30 Sept 2026, after e-242 closed as not answerable from what was kept)
The 28 Sept connection row was deleted by the Disconnect button and a successful connect left no log line, so why
that token found the Page could not be read. From now on /api/v2/vendor/ads/callback prints, after the token is saved:
  [ads:callback] connected: scopes=<granted, sorted>; page=<page id> "<page name>" via <me/accounts | owned_pages | client_pages>; chooser=no
or chooser=pages (n: <id> via <edge>; ...), chooser=accounts (n), page=none, missing=<scopes>, or pages=unread if
Meta refused the read. It carries no token and no id but the Page's own: never her Facebook user id, an ad account
or a vendor. The read is pure (meta.pages with a trace, meta.adAccounts, meta.gapsFrom), writes nothing, and a
refusal there never undoes the connect. meta.pages returns exactly what it did; trace is an optional argument.
Cells: b144 5.6b (the scopes and "page=PAGE1 \"The Dream Wedding\" via me/accounts; chooser=no"), 5.6c (no token,
no FB user id, no ad account, no vendor in the line), 5.6d (a chooser names each Page and its edge).
Mutations in b144's own list: M14 the line never printed (5.6b red), M15 the token printed with it (5.6c red), each
restored by sha. b144 88 pass, 0 fail.

## ITEM 3 · R-46.15, THE APPROVAL SWEEP (the chair's rulings of 28 Sept, answered 30 Sept and 1 Oct 2026)
A feature Meta gates turns on for every vendor by itself the moment Meta approves every permission it needs.
- src/lib/metaGates.js, THE ONE HOME: APPS (TDW ADS: ADS_APP_ID/ADS_APP_SECRET; App-LIVE: META_APP_ID/META_APP_SECRET),
  FEATURES (flag.ads needs ads_management, ads_read, pages_read_engagement, pages_show_list, pages_manage_ads,
  instagram_basic, instagram_manage_insights; perm.instagram_business_manage_messages, the Instagram messages gate,
  and flag.ig_photo_import each need instagram_business_basic and instagram_business_manage_messages), PERM_ROWS.
- THE MAPPING (the founder's Graph Explorer reads of 30 Sept, ruled): listed and "live" is approved; absent or any
  other word is not approved; another word is recorded verbatim in the evidence and named in the log.
- src/lib/capabilities.js recordSweep, branch (w): a not-approved reading on a row that is 'on' with flipped_by
  'sweep:auto_on' goes back to 'armed', flipped_by 'sweep:withdrawn'. A hand's on/off is never moved (rule (a)).
- src/capabilitiesSweep.js: probeAppPermissions reads GET /{app-id}/permissions once per app per sweep with the app
  token, built in metaGates and never logged; sweepMetaGates runs inside runSweep. An approved feature turns on only
  with auto_on and walk_ref; an armed gate without them stays armed (the walk vendor keeps the room). flag.ads is on by
  the founder's hand and stays on. An app id or secret missing from the environment is said plainly in the log.
- THE FOUNDER'S LINES (to him only, never to vendors): "Instagram ads are now live for every vendor." · "Instagram
  messages are now live for every vendor." · "The Instagram photo import is now live for every vendor." · withdrawn:
  "Meta has withdrawn {permission}. Instagram ads are back to Coming soon for vendors." (ads and messages plural; the
  photo import "is back"). They need template tdw_capability_line (Utility, body {{1}} = the line), to be filed in
  IGD-3's sitting; until Meta approves it, today's tdw_capability_armed is sent and the line is logged verbatim.
  The "switch {app} to Live" clause is ruled but not built: no read yet tells the sweep an app is in Development.
- db/migrations/0192_meta_gate_rows.sql: perm.ads_management, perm.pages_read_engagement, perm.pages_show_list,
  perm.pages_manage_ads, perm.instagram_basic, perm.instagram_manage_insights, flag.ig_photo_import; all 'pending',
  auto_on false, ON CONFLICT DO NOTHING; no CHECK. Applied in Supabase before the push.
- OWED ELSEWHERE: the seven rows' names and specs in dreamos-pwa lib/admin-api/switchboardCopy.ts (ADS-2's app-side
  ZIP, after FE-8); flag.ig_photo_import's reader (G6-4 / G6-6).
Rung b149 27/0 (fake Graph; every branch both ways; M1 to M6 in fresh children, each red on its cell, restored by
sha). b61: one LABELLED AMENDMENT, "a permission row with no app credentials in the env: its status does not move
(R-46.15, was R-41.39)". The differential over 26 benches reading these files, clean tip against the cut: identical
but for b61's amended cell.
