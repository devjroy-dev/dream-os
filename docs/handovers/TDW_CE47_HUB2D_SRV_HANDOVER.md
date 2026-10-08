# TDW · CE-47 · HUB-2d SERVER · the founder's walk (8 Oct 2026) and R-47.1 · handover

Base: dream-os bcdb364 (server train 12). No migration. No Railway value. Seat: CLB.

## What the founder found, and why

1. **Under Mine, his three old calls were all titled "A call".** In the old room they read "Decor needed" and "Photography needed".
   - Why: the old room titles a call by its role (the first role, through dreamos-pwa `lib/vendor/collabFormat.ts` fmtType, then "needed").
   - The Hub's /mine door sent only `details`, the free text she types, and his calls have none. So the app fell back to "A call".
   - Calls she applied to, shoot requests from a call, and "Worked with" lines (on Mine and on the public page) used `details` too, falling back to "A call" or "A TDW call".
   - Cure: a call's title has one home, the new `src/lib/hub/title.js`. It makes "Decor needed" the way the old room does, and "Decor and photography needed" when a call has more than one role. It reads the call's items, falling back to the post's own role.
   - /mine now sends `title` on each of her calls. The applied list's `call` is now the title, and `details` is sent beside it. Shoot requests and "Worked with" lines use the title.
2. **"From Threads" on Work had a capital F.** The server's `not_yet` list now reads `['briefs from brands', 'paid jobs from planners', 'calls posted on Threads']`, all lower case. The app joins the items into one sentence.
3. **The chosen tab had a thin outline.** That is app only; it is cured in HUB2D_APP_1.

## R-47.1: every line, old and new

The founder's two People lines go in word for word (approved 8 October). Every other line below was read by the cover test: read only the sentence, and it must be understood alone.

| Where | Old line | New line |
|---|---|---|
| People, under the list (hub.js `line`) | No messages inside TDW. When you pick someone for a call, you both get each other's number. | TDW has no chat. When you choose someone for your call, each of you gets the other's phone number. *(the founder's words)* |
| My people (hub.js `mine_line`) | Vendors you added, and people who said yes to a shoot you did together. Nobody else is on this list. | This list has the vendors you added and the people who confirmed a shoot with you. Nobody else is on it. |
| After she sends shoot requests (hub.js) | Each person sees it and decides. Nothing shows until they say yes. | Each person gets a request to confirm. The shoot appears on your page and theirs only after they confirm it. |
| Work, what is not in yet (hub.js) | From Threads | calls posted on Threads |
| A call's title, everywhere | A call · A TDW call | Decor needed *(by its role; "A call" only if a call has no role at all)* |
| Add to my people, a person or an organisation (people.js) | Only vendors can be added. People and organisations join when they say yes to a shoot. | You can add only vendors. People and organisations join your list when they confirm a shoot you did together. |
| Added (people.js) | Added to your people. | They are now on your list. |
| Already added (people.js) | Already in your people. | They are already on your list. |
| Taken off (people.js) | Taken off your people. Shoots they said yes to stay on both pages. | They are no longer on your list. Shoots they confirmed still appear on both pages. |
| Add, her own page (people.js) | that is your own page | This is your own page. |
| Add, a page that is gone (people.js) | no such page | This page no longer exists. |
| Take off, not added by her (people.js) | they are not on your list as a vendor you added | You did not add them, so you cannot take them off. |
| Take off, from a call (people.js) | you worked together on a TDW call, so they stay | You worked together on a call on TDW, so they stay on your list. |
| Take off, on a team (people.js) | they are on one of your wedding teams. Take them off the team first. | They are on one of your wedding teams. Take them off that team first. |
| Shoot request, not the poster (credits.js) | only the call's poster may give credits for it | Only the vendor who posted the call can send these requests. |
| Shoot request, not her call (credits.js) | not your call | This call is not yours. |
| Shoot request, too early (credits.js) | credits open after the shoot date | You can send these requests after the shoot date. |
| Shoot request, nobody chosen (credits.js) | pick at least one person with a TDW page | Add at least one person who has a Collab Hub page. |
| Shoot request, no name (credits.js) | give the shoot a name | Add a name for the shoot. |
| Shoot request, no city (credits.js) | say the city | Add the city. |
| Shoot request, bad month (credits.js) | the month is YYYY-MM and not in the future | Choose a month that is not in the future. |
| Shoot request, over the limit (credits.js) | you can offer up to 20 shoot credits a month; N left | You can send up to 20 of these requests in any 30 days. You have N left. *(the server counts 30 days, so the words now say so)* |
| Answer, not hers (credits.js) | not your credit | This request is not for you. |
| Answer, already answered (credits.js) | this credit is already on your page / declined / taken back | You already said yes to this request. · You already said no to this request. · This request was taken back. |
| Public page, closing line (public/hub.js) | Each line was confirmed by the person it names. Contact happens when someone picks X for a call. | Every person named on this page confirmed the shoot they are listed with. TDW gives X's contact details only to a vendor who chooses them for a call. *("contact details", because b283 7.7 keeps the word "phone" off the public page)* |
| A partner, a closed vendor's call (interest.js NOT_OPEN; PTN shows this constant) | The vendor who posted this call does not have Collab Hub open yet, so nobody can be put forward on it. | The vendor who posted this call does not have Collab Hub open yet. You cannot suggest anyone for this call until they do. |

Kept, already plain: "Collab Hub is not open for your account yet." (gate.js).

**Labels, not lines** (the chair's ruling, 8 Oct: labels are names, held to SIMPLE and EASY only). Each of these is a short tag in a row of facts or a pill, never read as a sentence. Listed here so the chair can rule:
- the pills "Worked with N people", "New on Collab Hub", and "Waiting for them to confirm" (was "Waiting for their yes")
- the fact tags "Sent by TDW at your request" (a forwarded call) and "Not on your list until they say yes" (a waiting request). Each is kept as it was: an earlier cut of this package had turned them into sentences, and the chair's ruling put them back.
- the status words Picked, Not picked, Withdrawn, Waiting
- the why words "you added them", "you worked together on a TDW call", and "confirmed <shoot>, <month>" (was "said yes to <shoot>, <month>")

**Not read by anyone in the app.** These refusals come only from a malformed request to the API, and no screen sends one. They are left as they are:
- 'roles must be collab roles', 'open_to is paid, barter or credit_only', 'nothing to change', 'work_urls is a list', 'that website is not a web address' (PATCH /hub/me, which no app screen calls yet)
- 'role is not a collab role'
- the input checks in interest.js
- 'no such vendor'

## Files
- ADDED `src/lib/hub/title.js`: a call's title, one home.
- CHANGED `src/api/vendor/hub.js`:
  - /mine reads the roles of her calls, of the calls she applied to and of the calls behind shoot requests, and sends `title` (her calls), `call` as the title plus `details` (applied), and the title in `shoot_words`.
  - The `not_yet` words; the People, My people, shoot-request and forwarded-call lines.
  - `router._callTitle`, for benches only.
- CHANGED `src/lib/hub/credits.js`: "Worked with" names a call by its title. The refusals are rewritten as sentences.
- CHANGED `src/lib/hub/people.js`: the lines and refusals above.
- CHANGED `src/api/public/hub.js`: the closing line.
- CHANGED `src/lib/collab/interest.js`: NOT_OPEN as two sentences. PTN's answers.js reads the constant, so PTN's words follow with no edit on their side. b286 2.1's phrase, "does not have Collab Hub open yet", stands.
- ADDED `scripts/b287_hub2d_server_bench.js`:
  - §1, the title: 1.1 run for real; 1.2 one home; 1.3 the founder's case; 1.4 applied; 1.5 a shoot request; 1.6 the public page.
  - §2, the words: 2.1 `not_yet`; 2.2 the founder's People line; 2.3 refusals; 2.4 the sent line; 2.5 the public line; 2.6 no em dash or sample word; 2.7 old words gone; 2.8 every `line` is a whole sentence, fact tags excepted.
  - §3: M1 to M5 through scripts/lib/mutation_guard.js, with free space checked first (3.0), each restore in a finally, and nothing pending after (3.9).
- CHANGED, **amended by label**:
  - `scripts/b283_hub1_server_bench.js`: the word cells 3.1, 4.4, 5.2, 5.4, 5.6, 7.1, 7.2, 7.5, 7.6 and 7.9, and the anchors of mutations M3 and M6.
  - `scripts/b284_hub2_server_bench.js`: cells 2.1, 3.4, 4.3 and 5b.2. In 5b.2 the fixture call gets its role; the applied call is now "Photography needed", with its details kept.
- ADDED `scripts/floor-manifest-ce47-hub2d-srv.txt`, this handover, and the b287 ledger.

## Proof (on bcdb364; each run its own log, one at a time, under env -u ANTHROPIC_API_KEY -u DEEPSEEK_API_KEY)
- b287 21/0: 15 cells, 3.0, M1 to M5 each reddening the cell it names, and 3.9. It ran 20 times under load (b290 and b292 looping, both green the whole time), 20 of 20 green; the ledger is docs/handovers/b287_ledger_HUB2D.txt.
- Amended by label: b283 42/0 and b284 48/0.
- Unchanged, still green: b282 37/0, b286 35/0 (2.1's phrase stands), b280 53/0.
- PTN's benches, which read interest.js and gate.js: b290 93/0, b292 95/0 (13.1 to 13.3 compare against the NOT_OPEN constant, so the new words pass), b293 33/0, b294 23/0, b295 41/0.
- e-274 walkers green on this tree and on a clean bcdb364: b07_f0789 19/0, b128 13/0, bOB d2, m, micro and taxonomy, b15, b91 53/0.
- Lesson 1: a grep of scripts/ for every path touched found b283, b284 and b286 (hub files), and PTN's b290 to b295 (interest.js through answers.js). All of them were run.
- No mutation was left pending after any run.
