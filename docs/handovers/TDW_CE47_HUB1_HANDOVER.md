# repo: devjroy-dev/dream-os · base d5ae450 · CE-47 · HUB-1 · COLLAB HUB, THE SERVER HALF

What it is, in plain words: every vendor, organisation and person in Collab Hub gets one page anyone can open
(thedreamwedding.in/c/<handle>): name, what they do, city, Instagram and website as links, what they are open to
(paid, barter, credit only), a strip of work, and "Worked with". "Worked with" is the centre: after a shoot, the
person who posted the call names who worked on it, or anyone names "a shoot we did together" (a name, a city, a
month). Each person named says yes or no; nothing shows until they say yes, and either side can take it back.
Work lists calls for her craft and city. People lists only those who joined, with "Worked with N people" and the
"My people" filter (her roster plus everyone with a yes credit with her). Mine holds her calls, what she applied
for, and credits waiting for her yes. No feed, likes, followers or chat.

Rulings it follows (CE-47, 6 to 7 October 2026): one page for everyone at /c/<handle> (the Instagram handle when
free, else one made from the name); a credit from a call only by the poster and only after the date; shoot
credits at most 20 a month per giver; "Worked with N" counts yes credits only; credits can be taken back; Roster
retired but vendor_roster kept and read by "My people"; every handle and website a link; a partner's talent who
never joined is never credited or contacted.

Files: db/migrations/0198_hub_profiles_credits.sql (hub_profiles, hub_credits; RLS and grants);
src/lib/hub/{profiles,credits,people}.js; src/api/vendor/hub.js; src/api/public/hub.js; one mount line in
src/api/vendor/core.js and one in src/api/router.js; scripts/b283_hub1_server_bench.js.
THE PEOPLE DOOR (for PTN): GET /api/v2/vendor/hub/people?role=&city=&open_to=&mine=1.
Migration order: 0198 runs after 0216, 0217 and 0220 have already run; its record in OUT_OF_ORDER.json is WEB-4's
to write (one writer). The founder's step: run 0198 in Supabase before the push.

OWED, MOVED OUT OF HUB-1 BY RULING (7 October 2026), so nothing is lost:
 1 The individual's join: /collab/join's server side, its own sign-in for a person, and a person's page made at
   join. Moves to HUB-3, with its app half.
 2 The join-link sender: one reply carrying /collab/join to someone who wrote on a call's Instagram or Threads
   post. It must ask src/lib/collab/joinLink.js first (never a partner row). Its own small package after HUB-3.
Also open: Work's briefs from brands, paid jobs from planners and From Threads arrive through PTN's reads when they
land (the door names them in not_yet until then); "Add to my people" is for vendors only (vendor_roster), and
organisations and persons join My people through a yes credit (proposed, awaiting the chair's word).

WALK CARD · HUB-1 (server only)
 Nothing to tap yet: HUB-1 has no screen of its own. Its walk is inside HUB-2's card (the Hub room's three tabs,
 the credit sheet and the public page), which uses these doors. One check for WALK-1, after HUB-2 is live:
 Vendor to use: DEV440. Switched on first: 0198 run.
 1 As DEV440 open Collab Hub once. In Supabase, table hub_profiles now has one row for DEV440 with its handle.
   Failed if: no row.
 2 Open thedreamwedding.in/c/<that handle> in a phone browser. You see DEV440's name, city, Instagram as a link,
   and the line "Each line was confirmed by the person it names." Failed if: "No such page" or a phone number
   appears anywhere.
