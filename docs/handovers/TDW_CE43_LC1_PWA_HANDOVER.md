# repo: dream-os @ d4d3f92f93c5d2e7429318e017fdbd80fb4954bb
# COPY of dreamos-pwa `docs/handovers/TDW_CE43_LC1_PWA_HANDOVER.md` as committed at dreamos-pwa `409a130e` (its own line 1 read `# repo: dreamos-pwa @ 89f18af742b59662fa32085f203e471a05058082`), carried here with its §8 walk record because the pwa tree carries no protocol (F-42.139; CE-43 ruling on the LC-1 close). The pwa tree is not amended.
# TDW · CE-43 · SEAT LC-1 · HANDOVER (the dreamos-pwa packet) · 2026-09-16

Cut on dreamos-pwa `89f18af742b59662fa32085f203e471a05058082`. The dream-os packet is at origin as `d4d3f92f93c5d2e7429318e017fdbd80fb4954bb`, re-derived with `git ls-remote` before this cut (R-38.16). The dream-os half and the full walk card are in dream-os `docs/handovers/TDW_CE43_LC1_HANDOVER.md`.

## §1 · What shipped (F-43.4, ruled F4(d))

`lib/vendor/api/vendor.ts` gains `fetchLeadsWhole(vendorId, state)`. It reads the leads list route in pages of 100 (the server's clamp, dream-os `src/api/vendor/leads.js`, GET `/:vendorId`) until it reaches `total`, and de-duplicates rows by id because a lead filed between two pages shifts the newest-first order by one. A failed page returns that failure whole, never a short list.

`fetchLeads` gains an optional page argument; with none it sends the same URL as before.

`hooks/vendor/useLeadsData` now reads through `fetchLeadsWhole`. Its three readers (Leads, and the Invoices and Clients cross-chips) all see the whole list. Leads' search, filters and sort therefore run over every live lead.

No control was added and no string changed. Every Leads control from AUDIT-1 §12 is KEPT.

**Disclosure 2 (ratified).** The pager lives in the API client and the hook calls it, because the native law keeps API clients framework-agnostic.

## §2 · What is proven

**`b78_lc1_leads_whole_bench`: 14/14 on the cured tree.**
- It drives the real `vendor.ts`, transpiled in memory, over a double of the route's contract, with 26 leads (DEV440's live count, founder SELECT Q-LC1-B).
- Four mutations of production source turn their named cells RED.

**At base `89f18af7`: 2 pass, 12 fail.** Accepted as disclosed: §1.6 (the old URL is unchanged) is red at base by construction, because the cells short-circuit when `fetchLeadsWhole` is absent. It is not red by behaviour.

**`tsc --noEmit`:** exit 0 on the cured tree.

**`b40_worklist_shell_bench`** reads the leads route path. Its reds are C50 and C102 on both the cured tree and the base, the same cells (F-42.94's standing reds), so there is no change from this packet.

**`next build`** is the founder's gate at apply (R-40.66) and rides the verify line.

## §3 · The walk (card e)

This step starts only when the Vercel deployment for dreamos-pwa shows the commit you pushed.

On the deployed pwa, signed in as DEV440 (9888294440), open Leads and scroll to the end. All 26 live leads should be reachable.

Evidence:
- a screenshot of the last row;
- the founder SELECT count (Q-LC1-B, already pasted: live 26).

Only your handset can witness that scrolling to the last row is comfortable by thumb. There is no paging control to reach.

## §4 · What LC-2 picks up

Nothing from this packet. The list stays a whole read until a volume ruling says otherwise.

## §8 · The walk record (2026-09-17, founder-run; CE-43 ruled LC-1 CLOSED) · the whole LC-1 walk, identical to the dream-os handover's §8; card e is this packet's

**Tips walked.** dream-os `d4d3f92f93c5d2e7429318e017fdbd80fb4954bb`, dreamos-pwa `409a130e`. Vercel production was founder-confirmed on `409a130e`. Railway's card shows a deployment id, not a commit, so its deploy is witnessed by the row only `d4d3f92` can write (card d's `Tandon · wedding`).

**Apply evidence (founder terminal).**

| | dream-os | dreamos-pwa |
|---|---|---|
| Guard | `SAFE TO APPLY` | `SAFE TO APPLY` |
| Bench | b79 31/31 | b78 14/14 |
| Other gates | build clean | tsc clean, `next build` green |
| Delivery mode | 8 declared files unmoved | 5 declared files unmoved |
| Floor | `FLOOR = NAMED BASE, no delta` | `FLOOR = NAMED BASE, no delta (refusals, not in base: 0)` |

The dream-os base floor before apply also read `FLOOR = NAMED BASE, no delta`.

**Backfill (F7(b)).** The dry run planned exactly one event (Dholakia) and one due date (`TDW/DEV440/09`). The live run wrote exactly those two, with no refusal or error:

- `CREATED binder e6aacb34-2e05-4729-9be9-7921e09e6f62 "Dholakia · wedding" 2026-09-21 event 4c1be27f-7f7f-40c2-b450-bcfcb5101fa7`
- `SET TDW/DEV440/09 due_date 2026-09-19 (binder e6aacb34-2e05-4729-9be9-7921e09e6f62)`

**Card a · pass.** Events shows `Dholakia · wedding`, Ceremony, 21 Sep 2026, Upcoming, with the cross-chip "In your books · Dholakia". The founder confirmed nothing is off-palette. Q-LC1-D:

```
id,title,event_date,kind,state,linked_binder_id,deleted_at,created_at,updated_at
4c1be27f-7f7f-40c2-b450-bcfcb5101fa7,Dholakia · wedding,2026-09-21,ceremony,upcoming,e6aacb34-2e05-4729-9be9-7921e09e6f62,null,2026-09-16 18:51:54.87818+00,2026-09-16 18:51:54.87818+00
```

**Card b · pass.** On the web thread the founder sent "Move Dholakia to 22 September 2026". Events and the detail sheet now read 22 Sep 2026. Q-LC1-D still returns the same id and one row:

```
id,title,event_date,kind,state,linked_binder_id,deleted_at,created_at,updated_at
4c1be27f-7f7f-40c2-b450-bcfcb5101fa7,Dholakia · wedding,2026-09-22,ceremony,upcoming,e6aacb34-2e05-4729-9be9-7921e09e6f62,null,2026-09-16 18:51:54.87818+00,2026-09-16 18:55:26.499472+00
```

**Card c · pass.** The Invoices sheet for `TDW/DEV440/09` reads Due 19 Sep 2026. Q-LC1-E (founder screenshot):

```
invoice_number,due_date,binder_id,amount_total,amount_paid,state,updated_at
TDW/DEV440/09,2026-09-19,e6aacb34-2e05-4729-9be9-7921e09e6f62,50000,0,unpaid,2026-09-16 18:51:55.105609+00
```

**Card d · pass.** The founder sent this on the vendor WhatsApp lane from 9888294440:

> Tandon wedding is confirmed for 14 November 2026. Fee 40000, follow up on 1 November. Raise the invoice

Victor asked "new or already on file"; the founder answered "New." The reply was "Tandon's logged and the invoice is raised … Invoice TDW/DEV440/10 for Tandon — sending the PDF now."

Railway, 2026-09-17 00:28:58 IST:

```
[agent:engine] reply: "Tandon's logged and the invoice is raised. You're set for the 1 November follow-..."  (2 tool calls)
```

Q-LC1-H (founder screenshot):

```
id,client,date,stage,amount,followup_on,created_at
774d6dbd-2151-42b0-97ce-9e6c6160b4fc,Tandon,2026-11-14,confirmed booking,40000,2026-11-01,2026-09-16 18:58:50.17956+00
```

Q-LC1-F (founder screenshot):

```
invoice_number,client_name,due_date,binder_id,amount_total,state,created_at
TDW/DEV440/10,Tandon,2026-11-01,774d6dbd-2151-42b0-97ce-9e6c6160b4fc,40000,unpaid,2026-09-16 18:58:59.12548+00
```

Q-LC1-G:

```
id,title,event_date,kind,state,linked_binder_id,created_at
f1a2c5ec-ba7c-4671-bf6b-48ad875f8bee,Tandon · wedding,2026-11-14,ceremony,upcoming,774d6dbd-2151-42b0-97ce-9e6c6160b4fc,2026-09-16 18:59:00.826059+00
```

Invoices shows Tandon due 1 Nov 2026, and Clients shows Tandon at "confirmed booking".

**Card e · pass.** Leads' masthead reads "enquiries · across 26 open", and the chips add up to 26 (New 25, Quoted 1). The last row is Kunal Dhillon (29 Jul), which sat beyond the old 20-row cut. The founder found the last row comfortable to reach by thumb. Founder Q-LC1-B: live 26, total 45.

**Findings filed at the walk (CE-43 dispositions).**

- **F-43.27 → Victor guard sitting (F-43.6's class).** Victor named `TDW/DEV440/09` for Tandon before any mint. That number was Dholakia's, and the real mint was `/10`.
- **F-43.28.** `vendorInbound.js:1808` says "sending the PDF now", but Railway 00:29:01 logged `media send unsupported on Meta lane 'vendor' (M1 text-only); refusing`.
  - The PDF went out through Twilio `mediaUrls` until the Twilio sunset (M2b, `6724395`, 2026-07-23), which is founder-witnessed history. The Meta document capability exists only for templates (`templates.js` `buildTemplatePayload`, where `tdw_contract_copy` is approved).
  - Arms: (a) a free-form Meta document send, held for LC-4; (c) the line tells the truth, proposed as micro LC-1b pending the founder's word.
- **F-43.29 → LC-1b if opened.** The web calendar line reads "Updated: Dholakia · wedding — 2026-09-22. The calendar's set.", a raw ISO date against R-42.13. It is existing `mutationLines` copy, so any change goes to the veto slot.
- **F-43.26 → LC-2**, as in §4.

Sequencing beyond this sitting is the founder's.
