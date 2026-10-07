# TDW · CE-47 · HUB-2 SERVER (HUB2_SRV_2) · My people doors and the Rule 1 gate · handover

Seat: CLB. Repo: dream-os. Base: 813679e (server train 8 landed; this is train 9's base). It replaces HUB2_SRV_1, which is retired. No migration. None of this package's paths moved under it: core.js, expenses.js, cron.js, papers/figures.js and render.js, OUT_OF_ORDER.json and b266 moved, and none is touched here. The /hub mount line in core.js is still in place. Lands before the HUB-2 app package.

## What it does, in plain words
- A vendor can add another **vendor** to My people, and take off a vendor she added herself.
- A person or an organisation can never be added. They join My people only when they say yes to a shoot credit. The door refuses them with: "Only vendors can be added. People and organisations join when they say yes to a shoot."
- Every row on the People list now says whether that person is in My people, and why: "you added them", "you worked together on a TDW call", or "said yes to <shoot>, <month>".
- Credits she sent that are still waiting for a yes come back in their own block, "Waiting for their yes". They are never on the list.
- No check label anywhere. No check mark of any kind is on any Hub card, the Work list or the public page (the founder's words for a mark, 7 Oct 2026, are "Verified" and "Unverified"; none is shown). Nothing sets hub_profiles.check_state and no rule says what would be checked, so no label shows until a written rule and a setter exist (CE-47, 7 Oct 2026). The partner_orgs check is PTN's to define and is not carried to the Hub.

## Rule 1: the gate (the chair's ruling (a), 7 Oct 2026)
The Hub is open to a vendor on `clb.testers`, or to every vendor once `admin_config` `clb.hub` is `on`.
- `GET /api/v2/vendor/hub/me` says `hub_open`. For a closed vendor it answers `{ hub_open: false, line: "Collab Hub is not open for your account yet." }` and **makes no page for her**.
- Every other Hub door refuses a closed vendor with 403 and that one sentence.
- Both reads fail closed. The tester list goes through testers.js's own reader. The switch counts as on only when the value is exactly `on` (as text or JSON, any case, spaces trimmed). Junk, a missing row or an unreachable database means closed.
- **The public page for a closed vendor:** no page exists until that vendor has opened the Hub, so `thedreamwedding.in/c/<handle>` gives the one neutral miss, exactly as for an address nobody holds (cell 8.5). If the switch is later turned off, pages already made stay up; the gate does not delete anything.

### The founder's switch lines (Supabase SQL editor; each tested on Postgres 16)
Open the Hub to every vendor:
```sql
insert into public.admin_config (key, value, description) values ('clb.hub', 'on', 'Collab Hub open to every vendor (HUB-2, Rule 1)') on conflict (key) do update set value = 'on';
```
Undo (close it again; testers keep it):
```sql
update public.admin_config set value = 'off' where key = 'clb.hub';
```
Add one vendor to the testers (put her vendor id in place of PUT-VENDOR-ID-HERE; running it twice adds her once; it makes the row if it is missing):
```sql
insert into public.admin_config (key, value, description) values ('clb.testers', '[]', 'Collab v2 testers (Rule 1)') on conflict (key) do nothing; update public.admin_config set value = (select jsonb_agg(distinct t)::text from jsonb_array_elements_text(coalesce(nullif(value, ''), '[]')::jsonb || jsonb_build_array('PUT-VENDOR-ID-HERE')) as t) where key = 'clb.testers';
```
The server reads both rows at most a minute late (60-second cache).

## The ruling it holds (CE-47, 7 Oct 2026)
A vendor adds another vendor directly (vendor_roster). An organisation or a person joins My people only through a credit they answered yes to. Nobody outside the vendor pool appears on a list without having agreed.

## Doors
- `GET /api/v2/vendor/hub/people`: each row gains `in_my_people`, `why` ('added' | 'said_yes' | null), `why_words`, `can_add` (true only for a vendor not yet in), and `can_take_off` (true only for an edge she added by hand with no yes credit between them). With `mine=1` the reply also holds `waiting` (credits she gave that wait for a yes, each with "Waiting for their yes") and `mine_line`.
- `POST /api/v2/vendor/hub/people/:id/my-people`: vendors only, otherwise 400. Writes one vendor_roster edge through the existing upsertRosterEdge (source manual, member-keyed, no phone). Adding again writes nothing.
- `GET /api/v2/vendor/hub/mine` gains `shoot_requests_left`. This is how many "a shoot we did together" requests she can still send. The count is the one offerForShoot refuses on: 20, less the shoot requests she sent in the last 30 days. Call credits do not count. The app's sheet shows it. The limit runs over any 30 days, not a calendar month, so the words say "in any 30 days".
- `GET /api/v2/vendor/hub/mine` also names everyone it mentions. Each credit waiting for her yes carries `from` (name and page link) and `shoot_words` ("<shoot> · <city> · <Month YYYY>"). Each "Worked with" line carries `with` (names and page links) and `month_words`. Each call she applied to carries `call`, its date, its city and `from` (the poster's name and page link). The raw fields stay as they were, and no phone or email is added.
- `GET /api/v2/vendor/hub/mine` gains `waiting_count` (CE-47 ruling, 7 Oct). It counts what waits for her answer: credits asking her to confirm a shoot, plus people interested in one of her **open** calls whom she has not picked yet. The app shows it on the Mine tab.
- `GET /api/v2/vendor/hub/work`: a call she already answered (interested or passed) leaves Work, as the old Opportunities feed did. It shows in Mine under "I applied". No call carries a check label.
- `DELETE /api/v2/vendor/hub/people/:id/my-people`: removes only her own manual, member-keyed edge. It refuses an edge from a TDW call ("you worked together on a TDW call, so they stay"), and an edge used on one of her wedding teams ("Take them off the team first"), because team_members.roster_vendor_id points at it. It never touches a credit: a yes ends only by take-back.

## Old roster rows
Old roster rows are **kept in the table, not shown, never deleted by this package.** Rows added by name and phone with no vendor behind them (member_vendor_id empty) never show in My people. The Roster tab and its "+ Add someone" leave the app in the HUB-2 app package. The table and its rows stay as they are; crew pages and the overflow exchange keep reading them.

## Files
- CHANGED `src/api/vendor/hub.js`: the Rule 1 gate (hubGate on every door, hub_open on GET /me); the two doors; `waiting` and `mine_line` on mine=1; `shoot_requests_left`, names and page links on Mine; answered calls leave Work; the Work list no longer carries a check label.
- CHANGED `src/lib/hub/people.js`: myPeopleWhy, waitingForYes, addVendor, removeVendor; the four new fields on each row.
- CHANGED `src/lib/hub/profiles.js`: publicCard no longer returns `checked` or `label`.
- CHANGED `scripts/b283_hub1_server_bench.js`: **amended by label (CE-47).** Cell 2.6 now pins *no* label (it pinned the old unchecked words, retired by the founder on 7 Oct 2026). **Cell 7.2 also changes**: it pinned that a Work item carries a label, and now pins that it carries none. And one **fixture row**: the vendor its cells serve as is on clb.testers, because the doors are gated now. No other cell moves; the 6 mutations are unchanged.
- ADDED `scripts/b284_hub2_server_bench.js`: 33 cells + 15 mutations. §0 is Rule 1, run first: 8.1 a tester opens; 8.2 a non-tester is refused at all ten doors; 8.2b no page is made for her; 8.3 the switch opens for everyone; 8.4 junk, missing rows and no database stay shut, never a 500; 8.5 her public address is the miss. Mutations G1 to G5. The rest: Adding a person or an org fails (cell 2.1, 2.2). One edge, never two. Waiting credits are shown apart. A "no" and phone-only rows stay off the list. Delete refuses a team edge and a call edge. Credits are untouched. No label anywhere.
- ADDED `scripts/floor-manifest-ce47-hub2-srv.txt`, this handover, and `docs/handovers/b284_ledger_HUB2SRV.txt` (the 20-run ledger).

## Proof
b284 48/0; b283 42/0. Both ran 20 times under load on the cut tree (813679e plus this package; b91 and bOB looping; 0 not green): the ledger is in the ZIP as docs/handovers/b284_ledger_HUB2SRV.txt. e-274 walkers green: b07_f0789 19/0, b128 13/0, bOB 78/0, b15 green, b91 53/0. b55 is not needed (vendorCard.js does not move).

## Walk card
This package has no screen of its own. The HUB-2 app walk card (DEV440 only, never 8595356978) walks these doors through the app.
