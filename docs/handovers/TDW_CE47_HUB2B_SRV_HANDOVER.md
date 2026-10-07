# TDW · CE-47 · HUB-2b SERVER · Rule 1's one home, one guard on partner rows, and `outside` · handover

Seat: CLB. Repo: dream-os. Base: a1c44e9 (train 9 landed; its tree is identical to the one this was rehearsed on) with PTN's A2-0 r2 (50b58de0) under it. Server train 10 is A2-0 r2, then this package, then PTN's F-44.416. No migration.

## What it does, in plain words
- **One question, one home.** "Is the Collab Hub open to this vendor?" now lives in `src/lib/hub/gate.js` (hubOpen, CLOSED, _reset), moved word for word out of `src/api/vendor/hub.js`. The Hub's own doors ask it, and so will PTN's sending, so a closed vendor's call is never sent to partners. The answer is unchanged: open for a vendor on clb.testers, or for everyone once clb.hub is on, and closed on junk, missing rows or no database.
- **One guard where partner rows are written.** `addPartnerInterest` (CLB-2a, `src/lib/collab/interest.js`) now asks gate.js about the call's poster. If the Hub is not open to her, it writes nothing and throws `NOT_OPEN`: "The vendor who posted this call does not have Collab Hub open yet, so nobody can be put forward on it." PTN's A2-1 asks the same question before sending; this is the second guard.
- **One added line in hub.js:** it clears the gate's cache when it loads. In a running server that happens once, at start, with the cache already empty, so no answer changes (b286 3.1).
- **`outside` on the responses door.** `GET /api/v2/vendor/collab/:post_id/responses` keeps `responses` exactly as it was (the TDW vendors who tapped Interested) and adds `outside`, her call's collab_interest rows, newest first:
  - **partner rows** come only through PTN's `partnerRowsFor`. They are in its shape, and a blocked or missing partner's row is dropped there.
  - **Instagram and Threads rows** carry `{ id, source, name, platform_word, how, when }`. Nothing writes these rows yet; the reply reader is its own package later.
  - The body, external ids and vendor ids are never read out. A name that carries an email or a ten-digit run is cut to its words.
  - Only the call's poster sees any of it (403 otherwise, as before). A closed vendor's page shows `outside` too (the chair's ruling); her call can hold no partner row, because the guard refused it (cell 4.8).
  - If partner_orgs cannot be read, partnerRowsFor throws. The door does not answer 500: `responses` and the other outside rows still show, and `outside_note` says "Partner suggestions could not be shown just now. Try again in a minute." If her outside rows cannot be read, `outside` is empty with its own plain note.
- **The partner mark on one switch.** `check_words` (PTN's field) leaves the response unless admin_config `partners.check_label` (PTN's key, one key for both seats) is exactly `on`, read the way the gate reads clb.hub. Junk, a missing row, no database, or the retired `clb.partner_check_label` key all mean no field at all. The founder's lines, **written, not to be run until he approves the rule**:
  ```sql
  insert into public.admin_config (key, value, description) values ('partners.check_label', 'on', 'Partner mark (Verified / Unverified) shown on partner suggestions') on conflict (key) do update set value = 'on';
  ```
  ```sql
  update public.admin_config set value = 'off' where key = 'partners.check_label';
  ```
- **F-44.417 cured.** `social.rolesLine` now has a word for all fourteen collab roles: the eleven crafts plus model, stylist and studio (ROLE_WORD, checked against EXTRA_ROLES the same way CRAFT_WORD is checked against the categories). No landed screen printed an empty role, because the landed call form offers only the eleven and nothing calls createCallFor. But a call for a model sent straight to the server would have read "Looking for: " with nothing after it in three places: the house post caption, the call card picture, and the admin's share text. PTN's interestRows.js keeps its own three words, which now match.

## For PTN: NOT_OPEN is thrown, so a caller must catch it and show it
- **On main today, nothing calls addPartnerInterest.** PTN's `src/lib/partners/seams.js` declares it as a stub that throws "addPartnerInterest is not wired yet" (PTN-A1), and PTN's b290 §7 proves no caller exists. The partner's "Suggest someone" door is not on main; it arrives with PTN's A2-1. So no door on main can answer a 500 from this guard today, and none can be proved against it until A2-1 wires the seam.
- **The contract A2-1's door must keep:**
  - `addPartnerInterest` throws an `Error` whose message is exactly `NOT_OPEN` (exported beside the function) when the poster is closed. It throws other plain errors for bad input ("a name is needed", "no such call", ...).
  - Every one of these is a refusal, never a server fault. The door catches them and answers 4xx with the sentence (403 for NOT_OPEN, 400 for the rest), the way the Hub's own doors do (`guard` in hub.js turns a thrown message into a 400 with that message).
  - It must never let one become a 500.
- **The proof belongs in A2-1's bench.** A suggestion on a closed vendor's call gets 403 and the NOT_OPEN sentence, writes no row, and the server stays up. A bad name gets 400. b286 §2 already proves the function's side: refused, nothing written, says why, and the gate unreadable means refused.

## The partner mark's words (the founder, 7 Oct 2026)
The mark is "Verified" or "Unverified". The old words are retired everywhere. HUB-2b never prints the mark: it passes PTN's `check_words` through and strips it from the response until admin_config 'partners.check_label' (PTN's key, one key for both seats; my 'clb.partner_check_label' is retired) is on, which waits for the founder's approval of the written rule. A tap on the mark (HUB-2c's screen, later) shows what it means and does not mean, from the rule's lines 1 and 2.
HUB2_PICS_2's design note (approved earlier) still explains its change 1 with the retired words; no picture shows them, and this line stands in for a corrected note (the chair: no HUB2_PICS_3).
This package also clears the old words from HUB-2's own text: one comment in src/lib/hub/profiles.js, b284's planted mutation string, and two lines of TDW_CE47_HUB2_SRV_HANDOVER.md. Nothing that prints changes.

## Files (so far)
- ADDED `src/lib/hub/gate.js`
- CHANGED `src/api/vendor/hub.js`: requires gate.js; the moved lines leave; router._resetGate calls gate._reset; the one load-time reset.
- CHANGED `src/lib/collab/interest.js`: the one guard; NOT_OPEN exported.
- CHANGED `scripts/b284_hub2_server_bench.js`: **amended by label, mutations only.** G1, G4 and G5 now aim at gate.js; G2 and G3 stay on hub.js. Cells 8.1 to 8.5 unmoved.
- CHANGED `scripts/b282_clb2a_partner_seams_bench.js`: **amended by label, one fixture row.** Its poster, DEV440, is on clb.testers, because the guard would refuse her call. The 35 checks are unchanged.
- ADDED `scripts/b286_hub2b_server_bench.js`: 21 cells + 14 mutations. §1 the gate's home (1.1 to 1.5, M1 to M5; 1.3 pins the sha256 of the moved block, 13d4937c…); §2 the guard (2.1 to 2.4, M6, M7); §3 the load-time reset (3.1, M8); §4 `outside`; §5 the role words.
- CHANGED `src/api/vendor/collab.js`: `outside` and `outside_note` on the responses door (one require of PTN's interestRows.js). `responses` is unchanged.
- CHANGED `src/lib/collab/social.js`: ROLE_WORD for model, stylist and studio (F-44.417).
- CHANGED `src/lib/hub/profiles.js`: one comment only (the retired mark words).
- CHANGED `docs/handovers/TDW_CE47_HUB2_SRV_HANDOVER.md`: two lines (the retired mark words).
- b286 §4: 4.1 to 4.9 (M9 to M13); §5: 5.1 and 5.2 (M14).
- ADDED `scripts/floor-manifest-ce47-hub2b-srv.txt` and `docs/handovers/b286_ledger_HUB2B.txt` (the 20-run ledger).

## Proof (on a1c44e9 + A2-0 r2, the cut tree)
- b286 35/0 (21 cells, 14 mutations). b284 48/0, b283 42/0, b282 37/0, b280 53/0. PTN's b293 33/0 and b290 93/0.
- e-274 walkers: b07_f0789 19/0, b128 13/0, bOB green, b15 green, b91 53/0. b55 is not needed (vendorCard.js does not move).
- 20 of 20 under load (b286, b284 and b282 each round; b91 and bOB looping), 0 not green: docs/handovers/b286_ledger_HUB2B.txt.

## Walk card
This package has no screen of its own. Its doors are walked by the HUB-2 app card (DEV440 only, never 8595356978) and, for `outside`, by HUB-2c's card when that lands. One server-only step for the founder, after train 10: in Supabase, run the add-a-tester line for DEV440 if it is not on clb.testers, then open DEV440's call replies (any call he posted). **Failed if** the page errors, or shows a phone number or an email anywhere.
