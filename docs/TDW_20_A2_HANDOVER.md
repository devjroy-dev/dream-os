# TDW_20 · CONCIERGE s1 · PACKET A2 — HANDOVER (dream-os)

**Cut by** LE-A under CE-41 **at** dream-os `38a70b010180ab0f05128b8bf6b02e83c609b7cb` (sibling dreamos-pwa `08a31d7e314a5ac467cd244774fc6312e39191cd`), both derived fetch-first by command at the moment of cutting. **Rulings executed:** R-41.14–.23, R-41.29, R-41.30, R-41.34; c-41.1–.6; F-41.4 rider. **Status:** proven in the seat; the live witness is the founder's, declared not claimed (§7).

## 1 · What shipped (16 files; the manifest is `scripts/floor-manifest-ce41-a2.txt`)

| file | what |
|---|---|
| `db/migrations/0148_assistance_requests.sql` | three NEW tables: `assistance_requests` (couple_id NULL FK couples · phone ten-digit NOT NULL · name · status CHECK open/forwarded/closed · city · area · wedding_date · brief · origin CHECK bride/admin/public), `assistance_request_items` (request_id FK · category · budget_rs · forwarded_count), `assistance_forwards` (item_id FK · target_kind CHECK · vendor_id/prospect_id/lead_id FKs · **wamid · status · error_code · error_title · sent_at · updated_at** · partial INDEX + partial UNIQUE on wamid · a target-agreement CHECK). Every FK witnessed at ≤0138 by line in the header. No existing table touched. |
| `src/lib/couple/assistance.js` | **the one home**: `createAssistanceRequest` · `forwardAssistanceItem` (→ vendor via `createLead` `source='tdw_assist'`, referrer *The Dream Wedding*, `raw_message` = the brief, `notes` = the request id; → outsider via `prospects` `source='manual'` R-41.14, last-ten find-before-insert, status `dark`) · `recordForwardOutcome` (R-41.30 path; its only caller is inside the commented SEND block) · `closeAssistanceRequest` · `listAssistanceRequests` · `getAssistanceRequest` · `searchForwardTargets` (trade-first, alphabetical, city-partitioned, never ranked) · `normalizePhone` (the one home, R-41.29) · `TEMPLATE_REFS` (seat B's three names + Meta ids) · `DEFAULT_COUNTRY='91'` (India-only by ruling, R-41.34). The founder's notify is CARRIED from the folded door with its F-07.76 / F-05.48 / F-06.85 paragraphs. |
| `src/lib/capabilities.js` | the switchboard read as a STUB: `on(key)` → `false`, `IS_STUB`, one key. Seat C replaces file-for-file (R-41.20). |
| `src/api/couple/assistance.js` | `POST /api/v2/couple/assistance` under `requireCoupleAuth`; her phone from `users` by session, never the body; pre-fills date/city from `couples` when the sheet left them blank, writes nothing back (R-41.25). The s2 public door is fully commented with its uncomment step. |
| `src/api/admin/assistance.js` | behind `requireAdmin`: `GET /` queue · `GET /vendors` targets · `GET /:id` · `POST /` typed intake · `POST /items/:itemId/forward` · `POST /:id/close`. Names no table. |
| `src/api/couple/concierge.js` | **folded** (R-41.19): `POST /request` → 308 to the new door; `GET /requests` deleted (zero callers in either repo — `grep -rn "concierge/requests"` over `src/`, pwa `app/ components/ lib/` returns only comments). Seat D deletes the 308. |
| `src/api/couple/core.js` · `src/api/router.js` | the two mounts. |
| `src/lib/vendor/relayStatus.js` | the FOURTH receipt home: `assistance_forwards` by wamid, status/updated_at/error_* — R-40.110 by its wording, wired dark (R-41.15). |
| `src/lib/adminSession.js` | F-41.4: the stale `concierge.js` call-site name deleted from one comment line. Nothing else. |
| `scripts/b20_a2_assistance_bench.js` | 90 cells, §1–§10 + §M. GREEN cured (rc 0); RED 6/88 uncured at 38a70b0 (rc 1). Four mutations of production code, each observed. |
| `scripts/b07_f0776_doors_bench.js` · `b07_f0772_circle_auth_bench.js` · `b07_f0784_panel_bench.js` | **c-41.6 carries** — see §3. |

## 2 · Laws, measured

- **One home:** `.from('assistance_` in exactly two files (the writer, relayStatus) — bench §1 by directory walk, comment-stripped. No third lead writer: the writer `require`s `createLead` and never `.from('leads')`.
- **SQL provenance:** every column the writer reads names its witness line in its header; `peer_discoverable` cites `0142` (post-0138) — **the regen `0139–0147` is OWED at this packet (R-41.9)**; the founder runs the committed generators before A2's seal, not before its apply.
- **R-40.110:** the wamid table gained arm + partial UNIQUE in the same delivery (bench §2, §9 behavioural with a stub DB: matched, ambiguous-refused, none).
- **Conditional-withheld:** the outsider SEND is a comment with its uncomment step; the s2 public door is a comment with its uncomment step; the stripped writer contains no `sendMetaTemplate(` (bench §7).
- **Wallet law:** `Rs 2,50,000` in the notify (bench §5); no glyph in the plane.
- **Copy law:** no persona name in the writer or doors (bench §10). The API's one couple-facing sentence is #22 (`Sent. We're on it.`), KEPT at the veto.
- **R-40.94:** windows bound by statement; absence cells read stripped code; mutations M1–M4 target production code (`loadMutated` compiles the real file with one anchor replaced).

## 3 · c-41.6 — the three sealed benches, cell by cell

The folded door was the SUBJECT of cells sealed at F-07.76/.77/.85. Under the both-sides clause the cells follow the mechanism; each carry is labelled in-file.

| bench | cell | disposition |
|---|---|---|
| `b07_f0776_doors_bench` | §0 canary `concierge.js` waist anchor | RE-ANCHORED to `const NEW_DOOR = …` (the old anchor `const waBody = [` no longer exists) |
| | §2.1–.5 (send result bound; no bare await; `sent === true`; REFUSED/THREW loud) | CARRIED to `notifyFounder` in the writer |
| | §2.6 `admin_notified` in the response | CARRIED to the bride door |
| | §2.7 `admin_activity_log` insert read | RETIRED-BY-RULING → asserts the request store did NOT creep back |
| | §2.8 frozen sentence byte-identical | RETIRED-BY-RULING → asserts the STRUCK sentence is gone from the plane |
| | §2.9 zero new couple strings | RE-AIMED at the 308 door: exactly one response body, no prose |
| | §2.10 (new) | the fold itself: 308, Location, no GET, no adminSession/ADMIN_PHONE/sendWhatsApp |
| | §5.concierge ADMIN_PHONE env-only | CARRIED to the writer + asserts the door reads none |
| | §8.1 F-06.85 mechanism paragraph | CARRIED to the writer (paragraph moved with the mechanism) |
| `b07_f0772_circle_auth_bench` | §2.5 five call sites | four; + asserts concierge.js imports no adminSession. (§12.14 is RED at the base for its own reason; unchanged.) |
| `b07_f0784_panel_bench` | §2.8 the couple route verifies session material | RE-AIMED: the folded door has no admin read; the successor door sits behind `requireAdmin` |

## 4 · Named, not folded

- `src/api/vendor/leads.js:64` `leadPhoneKey` — an annotation-only last-ten twin on the vendor lane; left alone (R-41.29 ruling: the writer's `normalizePhone` is the home).
- `scripts/floor-base.txt` reads 16; the tip reads 25 (manifest names each). The chair re-bases.
- `docs/TEMPLATES.md` does not yet register the four templates seat B filed; the writer's `TEMPLATE_REFS` carries names + ids. Seat B's registry entry is owed there, not here.
- The 308 door refuses the pwa's current `body:'{}'` with `no_items` (400) for the A2→A3 interval — honest, not silent; the Meridian button shows its error state until A3 folds it.

## 5 · The founder's SQL — one statement per paste block (R-40.31), zero placeholders

**5.1 Apply the migration.** Paste the WHOLE of `db/migrations/0148_assistance_requests.sql` into the Supabase SQL editor as one block (DDL; the file is self-contained). EXPECT: `Success. No rows returned`.

**5.2 Witness the columns** (provenance: `information_schema.columns`, the settling witness):
```sql
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name in ('assistance_requests','assistance_request_items','assistance_forwards') order by table_name, ordinal_position;
```
EXPECT: 12 rows for `assistance_requests` (ending `updated_at`), 6 for `assistance_request_items`, 13 for `assistance_forwards` — with `wamid`, `status`, `error_code`, `error_title`, `updated_at` present on forwards; `couple_id` `is_nullable = YES`; `phone` `NO`.

**5.3 Witness the constraints** (provenance: `pg_indexes` / `pg_constraint`):
```sql
select indexname, indexdef from pg_indexes where schemaname='public' and tablename='assistance_forwards' order by indexname;
```
EXPECT four rows: the pkey, `idx_assistance_forwards_item`, `idx_assistance_forwards_wamid` (`WHERE (wamid IS NOT NULL)`), `uq_assistance_forwards_wamid` (`CREATE UNIQUE INDEX … WHERE (wamid IS NOT NULL)`).
```sql
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.assistance_requests'::regclass order by conname;
```
EXPECT: `assistance_requests_status_check` reads `CHECK ((status = ANY (ARRAY['open'::text, 'forwarded'::text, 'closed'::text])))`; `assistance_requests_phone_check` reads `CHECK ((phone ~ '^[0-9]{10}$'::text))`.

**5.4 Fixture state for the walk** (fixture-state law; provenance `users` :1070 phone, `couples` :396 block, `vendors` :1209/:1240 + `0142`):
```sql
select c.id as couple_id, c.wedding_date, c.wedding_city, u.phone, u.name from public.couples c join public.users u on u.id = c.user_id where u.phone = '+919625759924';
```
EXPECT: exactly one row (the test couple). If zero rows, STOP — the walk's precondition is absent; paste the output back.
```sql
select id, business_name, routing_handle, category, city, status, discover_paused, peer_discoverable from public.vendors where routing_handle = 'MAKEUPBYSWATIROY';
```
EXPECT: one row with `status = active`, `discover_paused = false`, `peer_discoverable = true`, `category = makeup`. Any other reading and the makeup forward will refuse `vendor_unavailable` — that refusal would be CORRECT, not a defect.

**5.5 After the walk** (the request the test couple sends from the PWA in A3, or the curl in §6):
```sql
select id, couple_id, phone, name, status, city, area, wedding_date, left(brief,60) as brief, origin, created_at from public.assistance_requests where phone = '9625759924' order by created_at desc limit 3;
```
```sql
select i.id, i.category, i.budget_rs, i.forwarded_count from public.assistance_request_items i join public.assistance_requests r on r.id = i.request_id where r.phone = '9625759924' order by r.created_at desc, i.created_at;
```
```sql
select f.id, f.target_kind, f.vendor_id, f.prospect_id, f.lead_id, f.wamid, f.status, f.error_code, f.created_at from public.assistance_forwards f join public.assistance_request_items i on i.id = f.item_id join public.assistance_requests r on r.id = i.request_id where r.phone = '9625759924' order by f.created_at;
```
EXPECT after the two forwards: one `vendor` row with `lead_id` set, `wamid` NULL, `status = recorded`; one `prospect` row with `prospect_id` set, `wamid` NULL, `status = dark`.
```sql
select l.id, l.source, l.referrer_name, l.phone, l.wedding_city, l.budget_max, left(l.notes,50) as notes, l.state from public.leads l join public.vendors v on v.id = l.vendor_id where v.routing_handle = 'MAKEUPBYSWATIROY' and l.source = 'tdw_assist' order by l.created_at desc limit 3;
```
EXPECT: one row, `phone = +919625759924`, `referrer_name = The Dream Wedding`, `notes` starting `assistance_request `.

## 6 · Curls (after Railway deploys the pushed tip — a push is not a deploy, R-40.87)

Tokens enter via a locally-set env var, never a literal (secrets law). Numbered clicks: (1) sign in as the test couple on thedreamwedding.in, open DevTools → Application → Local Storage → copy the couple access token → in your shell `export COUPLE_TOKEN=…`; (2) sign in to `/admin`, copy the admin cookie value → `export ADMIN_TOKEN=…`.

```bash
curl -s -X POST https://dream-os-production.up.railway.app/api/v2/couple/assistance -H "Authorization: Bearer $COUPLE_TOKEN" -H "Content-Type: application/json" -d '{"area":"Hauz Khas","brief":"Pastel florals, a lot of candlelight, nothing too loud.","items":[{"category":"makeup","budget_rs":40000},{"category":"photography","budget_rs":250000}]}'
```
EXPECT: `{"ok":true,"request_id":"…","items":[…2…],"message":"Sent. We’re on it.","admin_notified":true|false,…}` and one WhatsApp line on ADMIN_PHONE.
```bash
curl -s https://dream-os-production.up.railway.app/api/v2/admin/assistance?status=open -H "Authorization: Bearer $ADMIN_TOKEN"
```
EXPECT: the request in `requests[]` with two `items`. Take the makeup item's `id` as `$MAKEUP_ITEM` and the photography item's as `$PHOTO_ITEM`, and MAKEUPBYSWATIROY's vendor id from §5.4 as `$SWATI_ID`.
```bash
curl -s -X POST "https://dream-os-production.up.railway.app/api/v2/admin/assistance/items/$MAKEUP_ITEM/forward" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"kind\":\"vendor\",\"vendor_id\":\"$SWATI_ID\"}"
```
EXPECT 201: `lead.source = "tdw_assist"`, `forward.status = "recorded"`; Railway log `[assistance:forward] item=… → vendor=MAKEUPBYSWATIROY lead=… source=tdw_assist`.
```bash
curl -s -X POST "https://dream-os-production.up.railway.app/api/v2/admin/assistance/items/$PHOTO_ITEM/forward" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"kind":"prospect","phone":"9888294440","ig_handle":"@dev440","name":"Dev"}'
```
EXPECT 201: `dark.reason = "template.tdw_assist_lead_outside is off in the capabilities register (stub; seat C ships the register)"`, `forward.status = "dark"`; Railway log `[assistance:forward] item=… → prospect=… status=dark — NOT SENT: …`. No message reaches 9888294440. (DEV440 stands in as the outsider ONLY because the arm is dark and nothing can reach the number; it is a registered vendor's number, so the `prospects` row it creates is fixture dirt — discard it afterwards with the existing `POST /api/v2/admin/prospects/<id>/discard` (prospects.js:473), or the chair names a virgin number. If a `prospects` row for that number already exists it is FOUND, not inserted — also correct.)
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -X POST https://dream-os-production.up.railway.app/api/v2/couple/concierge/request -H "Authorization: Bearer $COUPLE_TOKEN" -H "Content-Type: application/json" -d '{}'
```
EXPECT: `308 https://dream-os-production.up.railway.app/api/v2/couple/assistance`.

## 7 · The walk (the founder's, after A3 deploys — §7 of the kickoff, unchanged)

The seat's proofs end at §5–§6. The walk outranks them; a disagreement is a finding against the instrument.

Sequencing beyond this sitting is the founder's.
