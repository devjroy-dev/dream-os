# repo: devjroy-dev/dream-os · base d1aeab15bec5 · CE-47 · CLB-2a · THE SEAMS PTN NEEDS (server only)

What it is, in plain words: a call can now ask for a model, a stylist or a studio as well as the eleven vendor
crafts, and say how many it needs ("2 models"). A partner (PTN) can put a person forward on a call; that person
lands on the call's Interested list, never gets TDW's join link, and is never stored with a phone or an email.
Anyone who needs to know that a call was made can listen for it. The admin can make a call for a vendor at her
request ("Forward a request"); she sees it marked as sent by TDW. TDW's own Instagram and Threads tokens refresh
themselves before they run out.

Files: db/migrations/0197_collab_roles_partner_interest.sql (the role CHECKs, needed, source/asked_at/budget range on
collab_posts, the partner columns on collab_interest, collab_house_tokens with RLS and its grant);
src/lib/collab/roles.js (the collab role list, one home); src/lib/collab/interest.js (addPartnerInterest, idempotent
on send and name); src/lib/collab/joinLink.js (the one place that decides who gets /collab/join; never a partner row);
src/lib/collab/events.js (onPostCreated); src/lib/collab/calls.js (createCallFor, source 'tdw_forward'); the house
token refresh in src/lib/collab/publish.js (houseFor, refreshHouseTokens); src/lib/vendor/collabItems.js (calls take
collab roles and "needed"; REQUIREMENT_TYPES stays the vendor eleven); src/api/vendor/collab.js (collab_roles served,
needed written, the event fired, source on my-posts); src/api/admin/collab.js (publishes through houseFor);
scripts/b282 (new) and scripts/b280 (one seed line).

For PTN: call addPartnerInterest, onPostCreated, createCallFor and houseFor in the same server; read the house token
only through houseFor. Not here: /collab/join (the Hub design), the pwa twin of the role list (the Hub app package),
and a schedule for refreshHouseTokens (the token refreshes on use). OUT_OF_ORDER.json is not touched.
The founder's one step: run 0197 in Supabase before the push.
