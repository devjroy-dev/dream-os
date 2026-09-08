# CE-41 · A6 — THE CONCIERGE WALK'S DREAM-OS RIDER · HANDOVER

**Cut by** LE-A **at** dream-os `2a0d838a4c99cedd5082b49340e5fe80a30da72e`. **Findings:** F-41.26 (R-41.63), F-41.29 (server half). Nine files.

## 1 · F-41.26 — the founder notify, on the template
- `src/lib/templates.js` — entry `admin_assist_request` → `tdw_admin_assist_request`, Utility, vendor line, five variables, body byte-for-byte as the Manager preview, `status: 'approved'` (Meta: Active – Quality pending, ID `1106894635324625`). Founder-filed directly, not seat B — named. Static URL button; no `button:` arm (Meta holds the URL).
- `src/lib/couple/assistance.js` `notifyFounder` — now `sendWa({ line:'vendor', to: ADMIN_PHONE, templateKey:'admin_assist_request', vars })` through the estate's one template-send home. Vars: name or "a couple" · `22 December 2026` in words · city · categories in words ("photography and makeup") · summed budget `1,90,000` (no glyph; `Rs` is in the body). The result is bound; `sent === true` strictly; `result.wamid` the only handle. Every refusal is sendWa's named throw, caught and written to the row. F-06.85 paragraph rewritten to sendWa's five exits with line witnesses.
- `db/migrations/0150_assistance_notify_wamid.sql` — `assistance_requests` gains `notify_wamid · notify_status · notify_error_code · notify_error_title · notify_sent_at`, partial INDEX + partial UNIQUE on `notify_wamid` (R-40.110 in full). Named `notify_*` because the same row will carry seat D's couple-facing send under its own name.
- `src/lib/vendor/relayStatus.js` — the fifth receipt home, keyed on `notify_wamid`.
- `notify_status` vocabulary: `sent` · `sent_no_wamid` · `skipped` (ADMIN_PHONE unset) · `failed` (+ error code) · then Meta's `delivered`/`read`/`failed` via the arm.

## 2 · F-41.29 — her own read
- `GET /api/v2/couple/assistance` (bride door, `requireCoupleAuth`) → `getLatestAssistanceForCouple` in the one home: `request | null`, items with `found: [{business_name, routing_handle}]` (TDW vendors only) and `outsiders_asked` (a count, unnamed). No queue, no wamid, no lead id in the shape — a cell asserts it. The pwa half (the sheet mounting into S2) is A7.

## 3 · Benches
`b20_a2` 101/101 (§5 carried to the template mechanism; new cells for 0150, the fifth arm incl. a 131047 receipt, the read door and its shape). `b07_f0776` §2.1/.2/.4/§8.1 re-aimed to sendWa (c-41.6 class). Floor = the chair's 21 + four env refusals; no bench moved.

## 4 · The founder's SQL, one statement per block
**4.1** Paste the whole of `db/migrations/0150_assistance_notify_wamid.sql`. EXPECT `Success. No rows returned`.
**4.2**
```sql
select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='assistance_requests' and column_name like 'notify_%' order by ordinal_position;
```
EXPECT five rows: `notify_wamid text YES` · `notify_status` · `notify_error_code` · `notify_error_title` · `notify_sent_at timestamp with time zone`.
**4.3**
```sql
select indexname, indexdef from pg_indexes where schemaname='public' and tablename='assistance_requests' and indexname like '%notify%' order by indexname;
```
EXPECT two rows, both `WHERE (notify_wamid IS NOT NULL)`, the `uq_` one `CREATE UNIQUE INDEX`.
**4.4** Regen: `0150` is above the `0148` snapshot; run the committed generators before this packet seals (R-41.9).

## 5 · The founder's witness (after Railway deploys the pushed tip)
Send one request from the sheet as the test couple (or the A2 handover §6 curl). EXPECT: on your admin WhatsApp the template message *New assistance request from Sarah for a wedding on 22 December 2026 in Jaipur, asking for … with a total budget around Rs …* with the button **Open the queue**; Railway `[sendWa:template] 919888294440 <- admin_assist_request (wamid.…) [line=vendor]`; then a receipt line `home=assistance_request_notify`. Then:
```sql
select id, name, notify_status, notify_wamid, notify_error_code, notify_sent_at from public.assistance_requests where phone = '9625759924' order by created_at desc limit 2;
```
EXPECT the newest row: `notify_status = delivered` (or `read`), a `notify_wamid`, `notify_error_code` null. The earlier row (18:00) keeps nulls — it predates 0150.

## 6 · Named, not folded
- `couple/me` is not read by this door; the sheet's pre-fill stays client-side (A3). The template's `{{2}}` falls back to "a date to be decided" when the request has none.
- `Open: N` on the admin nav is the pwa rider's (A7), reading the queue's `counts`.

Sequencing beyond this sitting is the founder's.
