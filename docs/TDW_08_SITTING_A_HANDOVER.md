# TDW_08 · SITTING A — HANDOVER

**Base:** `dream-os @ 0b72597` · `dreamos-pwa @ 3524d8d` (read-only sibling; **zero PWA bytes**)
**Charter:** the eleventh admin route (the invite caller) · `0107` · the phantom cron's deletion · F-08.10's cure
**Rulings:** CE-145 → CE-149. `docs/FINDINGS_LOG.md` and `docs/TDW_00_MASTERPLAN.md` are **untouched** — the chair is in both files this sitting (clobber law).

---

## 1 · WHAT SHIPPED

**`db/migrations/0107_demo_sunset_marker.sql`** — `demo_vendors.sunset_at timestamptz` + the `demo.sunset_days = 90` seed. **APPLIED TO PRODUCTION 2026-08-02** by the founder before any code shipped (CE-126 order). Readback witnessed on his screen, project `nvzkbagqxbysoeszxent` / `main` PRODUCTION / role `postgres`: `true · true · true · 90`.

**`src/api/admin/demoAdmin.js`** — the **ELEVENTH** route, `POST /api/v2/admin/demo/vendors/:id/invite`. Order is load-bearing: **pre-check → sendWa → onInvited**. Pre-check reads `demoLifecycle.INVITE_STATES`, never a literal. Response contract matches the grant/revoke siblings (`{ ok, vendor:{ id, display_name, discover_eligible } }`), `404` absent, `409` illegal_transition / no_phone / opted_out, `502` transport, **`200` with `prospect_linked:false`** on a partial. `claimLinkFor` is imported from `demoLeadAlert` — the founder-given URL shape, not this file's own second shape at `:76`.

**`src/lib/demoLifecycle.js`** — `INVITE_STATES` exported and read by `onInvited`; **F-08.10's create-or-promote**; `runSunsetSweep` stamps `sunset_at`. The paragraph the stamp made stale was amended, not left standing.

**`src/cron.js`** — the phantom job **deleted whole** (nineteen lines: comment header through the closing `});`), the marker rewritten as a **tombstone**. **Five** cron jobs survive, not four. `demo_active` occurrences: **0 in code, 1 in the tombstone.**

**Benches:** `b08_p1_lifecycle_bench` **63 → 89** · `b05_p4_crons_bench` 48, expected table 6 → 5 · `b07_f0784_panel_bench` 59, guard-mount census 11 → 12.

---

## 2 · THE FLOOR AT DELIVERY

`npm ci` rc=0 → `npm run build` rc=0 (BUILD-ENGINE-FIRST) before every line below. PWA sibling present, so counts are PAIRED.

**Sweep: 99 scripts, EIGHT non-zero — the same eight as the charter tip. This sitting added none.**

| rc | script | class |
|---|---|---|
| 1 | b06_meter_bench | known — F-06.41, 28/29 |
| 1 | b05_f0555_media_dedupe | known — F-07.11, 22/23 |
| 2 | b5b_movementb_bench | known — rc=2 @:225 |
| 2 · 3 · 1 | b06_gauntlet (bare) · b5_wa_door_smoke · test-shape | three credential-gated live rigs |
| 1 | b07_f0772_circle_auth | **158/159 — F-08.13, pre-existing, NOT this sitting's** |
| 1 | b07_p4b_body | **75/76 — F-08.14, pre-existing, NOT this sitting's** |

selftest **386/386** · b08_p1_lifecycle **89** · b05_p4_crons **48** · f0784 **59** · p1 **75** · p5 **136** · f0789 **19** · p6 **29** · f0776 64 · f0791 38 · auth_crossover 33 · p2 48 · p3 55 · p4a_ig 110 · probe 22 · slice1 19 · f0774 20/20.

**Both-ways:** six new `§M2` cells mutate **production source** and DRIVE it, asserting RED at the broken tree; every mutated file restored **byte-identical** and asserted so in the helper.

---

## 3 · THE BENCH CONVICTED ITS AUTHOR ONCE — RECORDED, NOT SMOOTHED

The create-limb mutation cell came back **GREEN over broken code**. Removing the `{ state:'templated' }` seed left the prospect born `cold` — and the promote limb immediately covered for it, so an end-state assertion could not tell the two limbs apart. The seed looked redundant.

It is not. What it buys is not the end state but **the absence of a window**: without it the row is INSERTed `cold` and only then updated, and in that gap `runOpenerJob` can harvest it. Two writes with a gap is the shape this estate has already paid for. The cell was **re-aimed at the INSERT payload** (`recordInserts`), which is the question that actually differs, and the mutation now reds correctly. The vacuous version is not deleted from the record; it is why the recorder exists and its header says so.

---

## 4 · DECLARED OPEN — read this before believing anything works end to end

**F-08.9 · THE DIAL DOES NOT EXIST YET.** `0107` seeds `demo.sunset_days` and **no dial appears.** `app/admin/config/page.tsx:19-47` renders a hardcoded `GROUPS` list and this key is in none of them. The seed is a **precondition** of the flip (`config.js:31-32` 404s a keyless row; there is no insert route), not the flip itself. Nothing this sitting shipped satisfies 「 which can be increased or decreased 」. One PWA byte, with the demo board.

**F-08.12 · HAND-FIRED INVITES ARE UNGOVERNED.** `readDailyCap`'s only consumers are `runOpenerJob` (`prospects.js:213`) and the admin cap route (`api/admin/prospects.js:109`). The 25/day cap governs the cold-prospect **batch sweep** and nothing else. **Pressing this route eleven times sends eleven templates.** Know that before it becomes a button on a board with bulk actions.

**F-08.17 · TWO PRODUCTION ROWS SHARE ONE HANDSET.** `makeupbyswatiroy` and `swati` both carry phone tail `4440`. `prospects` holds one row per phone and `demo_vendor_ref` is single-valued, so inviting the second **overwrites** the first's linkage and STOP from that handset then reaches only the second. **Do not fire this route on both.** The fix is a linkage table.

**F-08.19 · `sunset_at` HAS NO LIVE WITNESS FOR 25 DAYS.** Derived on production data: earliest feed-row `created_at` is `2026-05-29 13:53:02+00`; the 90-day cutoff today is `2026-05-04`; **`sunset_eligible_today = 0`**. The first instant any row can rotate is **`2026-08-27 13:53 UTC`**. `runSunsetSweep` is a guaranteed estate-wide no-op right now. Bench-proven both ways; live witness **DEFERRED-NAMED**.

**F-08.20 · A THIRD CLOSED-WORLD COUNT.** `b07_f0784_panel_bench.js:182` asserted `mounts === 11` and the eleventh route reddened it. Amended with a labelled re-aim. This is the third instance in one sitting of a sealed bench asserting a fact about the estate's **future** rather than about its own delivery — F-08.13 (keyed on the next ladder number), F-08.14 (scanning later migrations for a string), and this. The class is F-08.15's.

**F-08.11 · THE NAME IS THE DEFECT, uncured.** `prospects.last_template_at` is named globally and used module-scoped: four writers, one reader (`demoLeadAlert.js:117-123`) that means something narrower than the name. The invite deliberately does **not** stamp it, and the write site says why in-comment. A rename or a split is not this sitting's.

**F-08.24 · STOP TAKES A DEMO DOWN AND NOTHING PUTS IT BACK. MINTED ON THE WALK, LIVE HARM, NOT CURED.** `src/lib/prospects.js:164-172` — the START branch lifts the opt-out (`opted_out → replied`) and **calls no demo limb at all.** The STOP branch at `:142-150` lazily requires `demoLifecycle` and calls `removeByPhone`; START calls nothing. `restore()` is written, exported and benched **with no production caller** — precisely the disease `onInvited` carried before this sitting, in the same module, found the same way. **A real vendor who replies STOP and reconsiders is permanently down**; the only way back is an admin's hand. Proven on the walk: STOP produced a paired lifecycle line, START produced only the inbound, twice, with nothing behind it. No bench could have caught this — every `restore()` cell passes, because the module is correct and the caller is absent. **The cure needs a ruling the walk already forced:** the founder's second START found the prospect no longer `opted_out` and fell through `:166`'s guard, so a naive limb restores on the FIRST START only. Wants its own charter, not a paragraph.

**F-08.22 · A 503 ON THE DEMO LANDING.** First load of `thedreamwedding.in/demo/vendor/legacy_jewellers` returned one `503` in console; the page rendered and the beacon landed. Second load clean. Deploy `7d6384c6` had gone Active 18 minutes earlier, so a cold start is plausible and **unproven**. Watch item, not diagnosed, not a defect.

**F-08.23 · ELEVEN `401`s ON `/api/v2/couple/*`.** From an incognito Discover session that was never logged in — `me`, `muse`, `pages`, `bookings`, `circle`, `events`, several twice. The refusals are almost certainly correct, but the request URLs carry a `couple_id`, so **something client-side believes it holds an identity the server denies.** Observation only; the couple lane is neither the demo lifecycle nor the invite caller. Belongs with the auth family.

**Also filed:** `_read`/`_write`'s select lists do not include `sunset_at`, so no P1 caller sees it in a returned row. Nothing needs it in P1; named so its absence is not read as an oversight later.

---

## 5 · THE FOUNDER'S SMOKE CARD — **WALKED 2026-08-02, founder-witnessed. See §8 for the result.**

> **TWO CORRECTIONS EARNED ON THE WALK, folded in rather than left for the next reader.**
> **(a) STEPS 7 AND 8 LOG TO `dream-os-marketing`, NOT `dream-os`.** The marketing
> service owns the inbound WhatsApp webhook, so the STOP/START lifecycle lines
> appear there. The card originally sent the founder to the backend service, whose
> log ends at the expiry sweep — it looks like a failed step and is not one. Only
> the founder's own instinct to open the second service caught the lines.
> **(b) STEP 8 ASSERTED A PATH THAT IS NOT WIRED.** It read "state must be
> `expired` or `restore()` guessed". `restore()` never runs — see F-08.24. The
> assertion was written against a caller that does not exist.


**The receiving handset is the founder's mother's** (authorised CE-134) — which is why **STOP is last** and **START restores it**.

### STEP 0 — PRECONDITION. Run this first; it is not optional.

One statement, one result set (F-08.16). Row 3 **emits the STEP 1a command** rather than asking you to build it — the refusal target's id is not witnessed in this repo and a blank in a runnable line is forbidden.

```sql
select * from (
  select 1 as pos, 'batch window clears (UTC) — DO NOT WALK BEFORE THIS'::text as fact,
         (p.last_template_at + interval '48 hours')::text as value
    from public.prospects p
   where p.demo_vendor_ref = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 2, 'batch window clears (IST)',
         to_char((p.last_template_at + interval '48 hours') at time zone 'Asia/Kolkata',
                 'YYYY-MM-DD HH24:MI:SS')
    from public.prospects p
   where p.demo_vendor_ref = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 3, 'STEP 1a — copy this whole line and run it',
         coalesce((select 'curl -s -X POST "$API/api/v2/admin/demo/vendors/' || d.id
                          || '/invite" -H "Authorization: Bearer $ADMIN_TOKEN"'
                     from public.demo_vendors d where d.ig_handle = 'makeupbydevroy'),
                  '~refusal target absent — tell the executor before walking~')
) s order by s.pos;
```

**Do not start the walk before the instant in row 2.** `demoLeadAlert` suppresses a demo-lead alert for 48h after the last template, anchored on `prospects.last_template_at` (`2026-07-31 14:39:44 UTC` at this writing → clears **2026-08-02 14:39:44 UTC = 20:09:44 IST**). Walking before it means the enquiry stores, the lead lands, and **no alert fires** — and that would read as a defect in code that is working correctly.

### STEP 1 — ADMIT BEFORE REFUSE

**Two shell values, set once, in your terminal only.** The token is a live credential: it is typed into your shell and never appears in a file, a paste-block or a transcript.

1. In your terminal, type `export ADMIN_TOKEN=` followed by your admin bearer token, and press enter.
2. Then run, verbatim:

```bash
export API='https://dream-os-production.up.railway.app'
```

**1a · THE REFUSAL** — paste the line STEP 0 row 3 handed you.
**Expect:** `{"ok":false,"error":"no_phone","detail":"makeupbydevroy"}` and **no message on any handset.**

**1b · THE INVITE** — the walk row. This id is witnessed; run it verbatim.

```bash
curl -s -X POST "$API/api/v2/admin/demo/vendors/bafc94f9-e26c-4f81-8c93-0b1fdd353b72/invite" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
**Expect:** `{"ok":true,"vendor":{...},"state":"invited","prospect_linked":true}` and **the template on the handset.**

> **This is `tdw_demo_invite`'s first production send since approval on 2026-07-19.** The body is founder-frozen and unchanged; it reaches a real handset here for the first time.

### STEPS 2–8

2. **OPEN** the link in the message. Row moves `invited → opened`, `opened_at` stamps, **no clock opens** — the 72h starts at the enquiry, not the invite (CE-137 §1).
3. **ENQUIRE** from the test bride on the Legacy Jewellers card in Discover.
4. **WATCH:** state `engaged`, `expires_at` = enquiry + 72h, **and the demo-lead alert lands** (only true after STEP 0's instant).
5. **FORCE THE CLOCK** — one founder UPDATE, delivered separately on the chair's word (conditional-withheld: it ships when this step is reached, not beside the card).
6. **HOURLY SWEEP** at :30 IST → state `expired`. Card **stays in Discover** — expiry kills the clock, not the presence.
7. **STOP** from the handset → `removed`, `active:false`, out of the feed in the same request.
8. **START** from the handset → restores. `restore()` derives the target from the ladder stamps this walk laid down, so it returns to `expired`, not `legacy`.

**Not on this walk:** the sunset. No production row is sunset-eligible for 25 days (F-08.19).

---

## 6 · ROLLBACK, as commands

**Code** — one revert, no migration reversal needed:
```bash
git revert --no-edit <this sitting's commit hash>
```
`0107` is **additive and nullable**; a code revert leaves an unused column and an unread config row. Neither breaks anything: `sunset_at` has no reader in P1, and `demo.sunset_days` holding `90` is identical to the code default at `demoLifecycle.js:83`.

**Data**, only on the founder's word and only if the column must go:
```sql
-- WITHHELD-CONDITIONAL: run ONLY on an explicit ruling. Uncomment both lines.
-- alter table public.demo_vendors drop column if exists sunset_at;
-- delete from public.admin_config where key = 'demo.sunset_days';
```

**The invite is not reversible.** A sent template cannot be unsent. The row's state is reversible (`onRemoved` → `restore`); the message on the handset is not. That is why the pre-check runs before the send.

---

## 8 · THE WALK — FOUNDER-WITNESSED, 2026-08-02

**Seven of eight steps GREEN on production, on a real handset. The eighth is F-08.24.**
Declared, not claimed: every row below is the founder's own pasted grid or his own Railway log.

| # | Step | Result |
|---|---|---|
| 0 | Preconditions | batch window clear · row `legacy` · refusal target derived |
| 1 | Invite (admit) + phoneless (refuse) | `invited`, `prospect_linked:true`, **no clock** · `no_phone`, nothing spent |
| 2 | Open, twice, real device | `opened`, `expires_at` null, `extension_used` false |
| 3 | Enquiry | `engaged`, **72.0 hours exactly**, leads 8→9, alert fired |
| 4 | Force the clock | one row, state untouched by the UPDATE |
| 5 | Hourly sweep 21:30:09 IST | `expired` — `active` AND `discover_eligible` untouched |
| 6 | Feed | the expired card still browsable |
| 7 | STOP | `removed`, `active:false`, **9 leads intact**, prospect `opted_out` |
| 8 | START | **RED — the opt-out lifted, the demo did not (F-08.24)** |

**WHAT THE WALK PROVED THAT NO DOCUMENT COULD.**
· The 72h clock starts at the ENQUIRY, not the invite — `72.0`, not `71.4`. The founder's ruling is in the code, not only in the log.
· `last_template_at` froze through the invite so the alert COULD fire, then moved when the alert stamped it. Same column, opposite expectations two steps apart, both correct — CE-146 §2 executing in the field rather than being argued.
· A takedown left **nine real enquiries** standing behind `demo_leads_demo_vendor_id_fkey`, which is `ON DELETE CASCADE`.
· Expiry and removal stayed two distinguishable exits: expiry killed the clock and left presence alone; removal flipped `active` only and left `discover_eligible` standing, which is what made the row restorable rather than reconstructable.
· `sunset_at` stayed null throughout — the expiry and sunset jobs share a file and a table and touched entirely different columns.

**TWO WITNESSES BANKED BEYOND THE CARD.**
· **F-07.55's deferred witness is BANKED** — the estate's first live `[sendWa:template]` line: `918700521064 <- demo_invite (wamid.…) [line=marketing]`. Number, key, wamid, line, and **no body, no vars, no name**, exactly as the privacy law specifies.
· Meta-confirmed `sent → delivered → read` on BOTH templates (`demo_invite` read 20:58:38, `demo_lead_alert` read 22:03:35) — receipt, not merely acceptance.

**THE WALK'S LOG SPINE**, founder's Railway, two services:
```
dream-os            20:57:01  demo_invite sent      → legacy -> invited (no clock)
                    20:59:22                          invited -> opened (no clock touched)
                    21:06:26  demo_lead_alert sent  → opened -> engaged (clock to 08-05T15:36)
                    21:30:09  [cron:demoLifecycle:expiry] expired 1 demo(s): legacy_jewellers
dream-os-marketing  22:04:25  918700521064 -> Stop  → expired -> removed (reason=stop)
                    22:09:00  918700521064 -> Start → (nothing — F-08.24)
                    22:09:20  918700521064 -> START → (nothing — fell through the guard)
```

**THE ROW WAS RESTORED BY HAND** at the founder's paste, reproducing `restore()`'s derivation (engaged_at set, expires_at past ⇒ `expired`), `removed_at` kept: `legacy_jewellers · expired · true · true · 2026-08-02 16:34:23.816+00`.

**NAMED SKIPS.** G-6's device matrix — iOS Safari, Android Chrome, the Instagram in-app browser — is NOT witnessed. Steps 2, 3 and 6 were walked in a 555×900 responsive viewport under Fast-4G throttling; step 2 was additionally confirmed on the founder's own phone by his declaration, without a capture. The beacon's double-load idempotency IS witnessed (founder-confirmed, `opened_at` unmoved across two loads on a real device).

**TWO EXECUTOR MISSES ON THE RECORD.** The card sent the founder to the wrong Railway service for STOP/START; only his own instinct to open the marketing service surfaced the lines. And step 8's grid asserted `restore()`'s derivation over a caller that does not exist — the assertion was written from the module, not from the wiring.

---

## 9 · NEXT

`sunset_at`'s live witness banks itself on/after **2026-08-27**. **F-08.24 wants its own charter** — it is live harm on a vendor-facing path and the START-guard question is already forced by the walk. The dial needs its PWA byte with the demo board. F-08.13 / F-08.14 / F-08.20 are one class and want one sitting. F-08.17 wants a linkage table before any second shared-handset row is invited. F-08.22 and F-08.23 are watch items, not work. Sequencing is the founder's.
