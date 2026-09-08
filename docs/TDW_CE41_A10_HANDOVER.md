# CE-41 · A10 — THE OUTSIDER JOIN ALERT WAKES · HANDOVER

**Cut by** LE-A **at** dream-os `a6dfc23a411a00f582ddfd6cde82d358a54c5b2e`. Five files. R-41.83 as amended: **the arm is live in code and the gate is shut for the apply.**

## ⚠ 0 · THE FIRST FOUNDER STEP, BEFORE ANYTHING ELSE
**On the Switchboard, flip `Outsider join alert` (`template.tdw_assist_lead_outside`) to OFF, and confirm it reads Off, before applying this packet.** The key is On tonight. The moment Railway serves this tip with the key On, the next outsider forward — by anyone, to any number typed in that box — sends a **Marketing** message for real. There is no second gate by design (R-41.83); the gate is that key.

## 1 · What shipped
- `src/lib/templates.js` — registry entry `assist_lead_outside` → `tdw_assist_lead_outside`, **MARKETING**, line `marketing` (rides `MARKETING_PHONE_NUMBER_ID`, sendWa.js:129), five variables, body byte-for-byte as filed, `status: 'approved'`. Without this entry `sendWa` refuses; R-41.55's class.
- `src/lib/couple/assistance.js` `forwardToProspect` — the block A2 shipped commented is now the arm:
  - gate `cap.on('template.tdw_assist_lead_outside')`; **off** → row `dark`, log quotes `cap.reason`, nothing sent (unchanged behaviour);
  - **on** → `sendWa({ line:'marketing', to: prospect.phone, templateKey:'assist_lead_outside', vars })` where vars are name (or "there") · city · the trade in the body's words (`a photographer`, `a makeup artist` — `categoryWords`, one home) · month and year (`monthYearOnly`, off `monthDayYear`) · budget in Indian grouping (`Rs` is in the body). **No phone of the couple's rides the body** — the standing refusal, asserted by a cell.
  - `out.sent === true` strictly; wamid → `assistance_forwards.wamid` + `status`/`sent_at`;
  - **R-41.30:** a synchronous refusal (131049 and kin) is read off `err.body.error.code` and written to the row as `failed` + `error_code` + `error_title` — it never reaches a webhook, so the row is its only home;
  - every send and refusal logged through **`logWaSend('marketing', …)`** — R-41.90's grammar, masked recipient (`[wa:marketing] SENT site=assistance:outsider mode=template key=assist_lead_outside to=…9924 wamid=… ctx=item=…`). No hand-rolled line.
- Bench 126/126 (was 118): key off → dark + reason; key on → one marketing send, five vars in filed order, no couple phone, wamid on the row; 131049 → failed/131049; a named throw → failed/its name; the log grammar; three gated `sendWa` sites and no raw transport; six A2 cells carried (the "commented block" cells retired by ruling and re-aimed at the gate). RED 112/126 at `a6dfc23`.

## 2 · ~~Named, not cured~~ — **CURED. The marketing lane's receipts route.**
> **AMENDED 2026-09-09 by seat D (CE-41 D0 rider).** This section was true when seat A wrote it and false from **`1a37bbc`** onward: **F-41.60 / R-41.92** gave `src/marketingIndex.js`'s status loop its `applyStatusEvent` call, exactly as `src/index.js:225` (vendor) and `src/brideIndex.js:245` (bride) have it. All three receivers now reach the router.

**What this means for an outsider alert's row:** it no longer stops at `sent`. It reaches **`delivered`** and **`read`**, and an *asynchronous* failure now lands on the row too. The synchronous path (R-41.30) was never affected and still lands in the writer's catch arm — that remains the only place a `131049` can be written, because no webhook ever reports one.

*The original claim is struck rather than deleted so the history reads in order.* Three code sites carried the same stale sentence and were cured in the same rider: `src/lib/templates.js` (the registry entry's header), `src/lib/couple/assistance.js` (the writer's comment), and `scripts/b20_a2_assistance_bench.js:405` — a cell that asserted the stale sentence's **spelling** and so held it in place (R-40.94's class, c-41.39).

## 3 · The founder's steps
1. **Switchboard → `Outsider join alert` → Off.** Confirm it reads Off.
2. Apply · verify · push (the packet note). Railway deploys.
3. **The walk (§4).** After it, leave the key On for real outsiders.

## 4 · The walk card — READ THE FIRST LINE
**Step 1. Flip `Outsider join alert` to On.** From this moment every outsider forward sends for real.
**Step 2.** `/admin/assistance` → any Sarah request → an item's **Not on TDW**: handle `@tdwtest`, number **`9625759924`** (the founder-held handset — **nothing else, this walk**), name `Dev` → **Forward**.
**Step 3 · Sights.** ⚠ **AMENDED — F-41.63.** The body quoted here was the REGISTRY's, and the registry was wrong. Meta holds (`docs/TEMPLATES.md` §2 row 10, the founder's Manager screenshot 2026-09-09): *Hi Dev, a couple planning a December 2026 wedding in Jaipur asked The Dream Wedding to find them a photographer, and their request has been matched to you with a budget of about Rs 1,50,000. The request is held on the page below. Reply STOP REQUESTS if you would rather not receive these.* with **View the request**. *A10's live send arrived garbled — Meta substitutes by position, and the registry's slot order put the city where the month belongs. Cured in the D0 rider on both sides: the registry body and its `variables`, and `forwardToProspect`'s `vars` array.* Railway: `[wa:marketing] SENT site=assistance:outsider mode=template key=assist_lead_outside to=…9924 wamid=… ctx=item=…`. The row reads **`sent`** and then moves on to **`delivered`** (§2 as amended — F-41.60 landed at `1a37bbc`). *The original text here said `delivered` will NOT appear and called it a named gap; that is no longer true, and the walk should expect the receipt.*
**Step 4 · the 131049 witness (a pass, not a defect).** If Meta refuses synchronously, the row reads `failed` with `error_code 131049` and the log line is `[wa:marketing] REFUSED … err=131049`. Either outcome closes the walk.
**Step 5.** `/admin/prospects` → discard the `9625759924` prospect row.
**Step 6.**
```sql
select f.target_kind, f.prospect_id, f.wamid, f.status, f.error_code, f.sent_at from public.assistance_forwards f join public.assistance_request_items i on i.id = f.item_id join public.assistance_requests r on r.id = i.request_id where r.phone = '9625759924' order by f.created_at desc limit 3;
```
EXPECT the newest `prospect` row: a `wamid`, `status = sent`, `error_code` null (or `failed` + `131049`).

## 5 · Refusals kept
No couple phone in the body · no spend ranking · no third lead writer · the couple never sees a queue · `laneFlags.js` untouched.

Sequencing beyond this sitting is the founder's.
