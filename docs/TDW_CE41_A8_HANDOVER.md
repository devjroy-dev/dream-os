# CE-41 · A8 — CONCIERGE s1 SEAL RIDERS (dream-os) · HANDOVER

**Cut by** LE-A **at** dream-os `fad5e68cbd4fd5e3dedbfb7d980b256b66b714fb`. Five files. Findings F-41.37 (R-41.68), F-41.42, F-41.43 (R-41.69).

**A correction the seat owns:** the seat reported to the chair that "seat C already seeded `flag.assist_forward_alert`". It had not. `0151` was the seat's own untracked draft in its working tree; it ships here as A8's migration. The number derives from the tip (`0150` → `0151`).

## 1 · F-41.37 — the vendor is told (R-41.68)
- `db/migrations/0151_assist_forward_alert_flag.sql` — one seed row on `public.capabilities`: `flag.assist_forward_alert`, kind `flag`, status **`off`**, `on conflict do nothing`. A new send to real vendors walks before it is on; the founder flips it on the Switchboard card.
- `src/lib/couple/assistance.js` `alertVendorOfForward` — after a successful on-platform forward: `cap.on('flag.assist_forward_alert')` → off: row `dark`, log quotes `cap.reason`; on: `sendWa({ line:'vendor', to: users.phone, templateKey:'lead_alert_utility', vars:[business name, monthPhrase(wedding_date), VENDOR_LEADS_URL] })` — the enquiry door's exact message (`enquire.js:555–572`), `monthPhrase` from its one home (`discover/demoLeadAlert.js`), the URL from `pwaPaths`. `sent === true` strictly; wamid → `assistance_forwards.wamid` (+`status`, `sent_at`); named throws → `failed` + `error_code`; no `users.phone` → `failed/no_vendor_phone`. Receipts ride the existing fourth arm. `vendors.user_id` (:1359 +5) is now read for the phone.
- The forward's response carries `alert: { sent, status, wamid, refusal }` and the forward row's live status; the queue (A7) already renders `dark`/`sent`/`failed` per row.

## 2 · F-41.43 — hers at write (R-41.69)
`findCoupleIdByLastTen` in the writer: when a request arrives with no `couple_id` (admin-typed, later public), `users.phone like '%<ten>'` → exactly one user → her `couples.id` is attached at insert. Two users on one last-ten → attach nothing. An explicit `couple_id` (the bride door's session) always wins. Her own read (F-41.29) therefore sees admin-typed requests immediately; seat D's backfill remains for couples who join later.

## 3 · F-41.42 — counts
`listAssistanceRequests` tallies `counts` from one read of `(id, status)` over every row, never the filtered page. The admin cards and `Open: N` read the same number.

## 4 · Bench
`b20_a2` 118/118: §6b (flag off → dark + reason; flag on → one sendWa with the three vars, wamid on the row; named throw → failed; no phone → failed; bound/strict; M5 mutation inverts the gate and is observed), §6c (match one → attached; unknown → null; twin → null; explicit wins; her read sees it), §6d (filtered page, whole-table counts). RED 104/118 at `fad5e68`. Floor = the chair's 21 + four env refusals.

## 5 · The founder's SQL, one statement per block
**5.1** Paste the whole of `db/migrations/0151_assist_forward_alert_flag.sql`. EXPECT `Success. No rows returned`.
**5.2**
```sql
select key, kind, status, flipped_by from public.capabilities where key = 'flag.assist_forward_alert';
```
EXPECT one row, `flag · off · seed`.
**5.3 Regen** — `0149`, `0150`, `0151` are above the snapshot (R-41.9).

## 6 · The founder's witness (Railway at this tip)
1. `/admin/assistance` → any request → forward an item to a TDW vendor Sarah hasn't touched. **Sight:** the toast as before; the row line reads `… · dark`; Railway `[assistance:forward-alert] forward=… status=dark — NOT SENT: flag.assist_forward_alert is off on the switchboard`. The vendor gets nothing (correct while off).
2. Switchboard card → flip `flag.assist_forward_alert` **on**. Forward another item to **DROY550** (a test vendor's number). **Sight:** DROY550's phone receives *Hi Dev Roy Photography 1, a couple just enquired about your work for their December 2026 wedding through your page on The Dream Wedding. Open your Leads to see it: …* ; Railway `[sendWa:template] … <- lead_alert_utility (wamid.…)` then `[wa:receipt] … home=assistance_forward matched=1`; the row line reads `sent` → `delivered`.
3. Admin → **+ Type a request** for `9625759924`. Then as Sarah, Settings → Wedding assistant. **Sight:** the sheet shows that typed request (hers at write, F-41.43).
```sql
select id, origin, couple_id, phone, created_at from public.assistance_requests where phone = '9625759924' order by created_at desc limit 3;
```
EXPECT the newest row `origin = admin` with `couple_id = 9f1f84d5-e688-4d4f-9e44-9f5da6315e52`.
4. The Open/Forwarded/Closed cards read the same under every pill (F-41.42).

Sequencing beyond this sitting is the founder's.
