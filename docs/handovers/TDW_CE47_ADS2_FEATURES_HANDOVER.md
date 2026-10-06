# TDW · CE-47 · ADS-2 · EVERY META FEATURE PER-VENDOR, LIVE BY ITSELF ON APPROVAL · server half · 4 October 2026

THE RULE (the founder, 4 Oct): every Meta-gated feature has a per-vendor On/Off switch now; before approval her On is
recorded and waits; the moment Meta approves it goes live for every vendor who has not turned it Off, with no step by
the founder. flag.own_number is not in this.

0214: vendor_feature_choices (vendor_id, feature_key, choice on|off, chosen_at, chosen_by; PK both; RLS on). NO ROW
MEANS ON. auto_on true with the ruling as walk_ref on flag.ads, perm.instagram_business_manage_messages and
flag.ig_photo_import.
src/lib/featureGate.js, ONE HOME: openFor = row 'on' AND her choice not 'off' AND (Instagram features) her Instagram
connected; before the row is on, the walk vendors as each gate had them (IG_DM_WALK_VENDOR_IDS; ADS_WALK_VENDOR_ID when
armed); after, the walk lists limit no one. choicesFor and setChoice (only the FEATURES keys). probe(key): the live
probe with FEATURE_PROBE_VENDOR_ID's real tokens: messages GET graph.instagram.com/v26.0/me/conversations?platform=
instagram; the import GET me/media; ads GET graph.facebook.com/{v}/me/adaccounts.
THE TRIGGER (src/capabilitiesSweep.js): HOURLY at :07 IST. A FEATURES row is written approved (and so turns on, with
auto_on) only when Meta's GET /{APP_ID}/permissions, read with the APP token, lists every needed permission "live"
(absent or any other word is not approved, recorded verbatim; the founder's read of 4 Oct: unapproved ones are absent)
AND the live probe passes. A failing probe leaves the row as it was, its evidence naming the failure.
THE DOOR: GET and PUT /api/v2/vendor/features (mounted in core.js beside /ads).
THE GATES: the IG inbound lane (igInbound.recordInbound) and the ads gate (vendor/ads.js) ask featureGate once the row is
on. The IG ROOM keeps laneOpen (row or walk), because the room is where she connects.
SETTING NEEDED IN RAILWAY: FEATURE_PROBE_VENDOR_ID = DEV440's vendor id. Without it no probe passes, so nothing turns on.
PROOF: b255 19/0 (openFor both ways, choices, door refusals, probes; M1-M5). b149 35/0 (section 7: 7.1 approved and
probe passes -> on; 7.2 the probe would pass but the permission is absent -> pending; 7.3 present but in_review ->
pending; 7.4 approved and probe fails -> stays off with evidence; M9; the helper injects the probe, LABELLED). b119 28/0
(M3's anchor moved to the new lane line, LABELLED). b144 99/0 and every other bench in the radius identical clean/cut.
