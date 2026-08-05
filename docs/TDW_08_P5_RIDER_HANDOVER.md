# TDW_08 · P5 RIDER — HANDOVER: THE OUT-OF-WINDOW RELAY + THE F-08.88 CURE

**Base:** dream-os `9a1cbcb` (re-derived fetch-first) · dreamos-pwa `e3210b5`, **ZERO pwa bytes**.
**Ruled to:** the rider charter · CE ruling **R-R1–R-R6**.
**ONE ZIP, ONE GIT LINE. Zero SQL, zero migrations, zero env vars.**

---

## 1 · WHAT SHIPPED

| Ruling | File | What |
|---|---|---|
| R-R3 | `src/lib/vendor/enquiryAlert.js` **NEW** | the one door — `sendVendorEnquiryAlert()` |
| R-R3 | `src/lib/vendorInbound.js` | three relay sites (`:591`/`:700`/`:989`) call the door; `VENDOR_LEADS_LINK` const |
| R-R6 | `src/lib/laneFlags.js` | `vendor.enquiry_alert_oow_enabled`, **default OFF** |
| R-R2 / F-08.95 | `src/marketingIndex.js` | the wrong-code comment cured, **comment bytes only** |
| D2 / F-08.88 | `scripts/b06_m4_bench.js` | joins the estate's existing `distGate` |
| R-R1–R-R6 | `scripts/b08_p5_oow_relay_bench.js` **NEW** | 14 cells · 6 mutation arms |

**Module path and symbol, disclosed per R-R3:** `src/lib/vendor/enquiryAlert.js` → `sendVendorEnquiryAlert`. Sole-caller property asserted at `§3.3`.

---

## 2 · F-08.85 — THE FINDING TEXT, AMENDED (R-R4)

**Was:** *an out-of-window vendor silently never learns a lead arrived.*
**Is:** **one closed vendor window corrupted a bride's conversation.**

`sendWhatsApp` never caught. `MetaSendError` propagated past no local guard into `vendorInbound.js:1425`'s function-level catch, which dead-lettered the whole payload. The bride's reply had already gone out; everything downstream of the relay — including `conversations.last_message_at` — was abandoned, and she received the graceful failure line for a turn that worked.

**The door therefore swallows every class.** `131047` → template (flag-gated). Anything else → ledgered with code and context tag, returned, never thrown. Vendor notification is **best-effort by ruling**. `§3.1` drives five error shapes × both flag states and asserts only that each one *returns*.

## 3 · FORK 1 — THE CLASS, AND WHAT IS EXCLUDED

`131047` is the only member. Excluded with reasons, because a branch that can never fire is a dead branch pretending to be caution: **131049** (per-user limits — the documented remedy is to back off; a template would worsen it), **131026** (undeliverable — a template fails identically), **470** (legacy On-Premise; unreachable on Cloud-API-direct).

`isWindowClosed` optional-chains per R-R1. `§2.5` drives three malformed error bodies and asserts none of them throws inside the catch that exists to stop a throw.

### F-08.95 cured in-flight (re-minted from F-08.93 per CE R-M1)

`marketingIndex.js:104` said **131049** was the re-engagement code. It is not; **131047** is. Wrong fact, sitting exactly where the next person reaches, on this rider's own subject. The printing code was always correct — it prints whatever arrives — so **no behaviour changed**. The fact did.

## 4 · WHAT IS DELIBERATELY ABSENT

**`tdw_enquiry_brief_vendor` has no registry entry and no mapper.** It is approved on the WABA (founder screenshot, 2026-08-05), but a mapper may be authored only against the **wire witness** — name, **language code**, and the body's `{{n}}` slots as Meta shows them. `en` and `en_US` are not interchangeable and the dashboard prints only the word "English". Authoring from my own draft would be the name-vs-wire class (F-08.75). The dial refuses an unknown key loudly with zero send, so pointing at it early sends **nothing** rather than guessing. `§4.3` asserts the absence.

## 5 · ⚠ DISCLOSED GAP (R-R5) — THE ASYNC PATH

`131047` is documented on the **synchronous** send response; that is what the door catches. Meta also surfaces failures **asynchronously via webhook status** — `marketingIndex.js:118` already reads that shape. No live witness exists for which path this lane takes, because producing one needs a real out-of-window send. **If the async path is the live one, the door never fires and the walk will show a silent non-delivery rather than a working fallback.** Named in-comment at the catch. **Walk step 3 settles it.**

## 6 · THE FLOOR — PAIRED, TRIPLE-RUN, **AND COLD** (F-08.88's lesson made procedure)

**WARM**, all three runs identical: oow_relay **14** · closer 249 · unblock 15 · **b06_m4 33** · m4c 20 · m4d 16 · couple_soul 21 · arc_m4 19 · arc_m5 11 · haiku_ceiling 9 · eliza 29 · m0 50 · f0550 31 · prospect_intake 13.
**pwa:** 29/29 `.mjs` · 7/7 `.ts` · tsc clean · **zero bytes**.

**COLD CLONE** (dist absent): oow_relay 14/0 · **b06_m4 28/0 with stated skip** · f0550 29/0 · unblock 15/0 · closer 249/0.

**D2's both-ways, proven COLD:** uncured **28 passed / 5 FAILED** → cured **28 passed / 0 failed, skip stated**.

### F-08.88 — the characterization, and R-A1's framing corrected

Not a mutation-restore race. The four `§2` cells `require` the **compiled** engine at `src/engine/dist/…`, absent on a fresh clone; run one rebuilt it and reddened while it did, every later run found it present. **An order dependency with a stated cause: a cold tree.** The `writeFileSync` at `:405` is innocent. **I argued for the race framing in my own packet and was wrong.** The cure was not a new mechanism — `scripts/lib/dist_gate.js` has existed since Block 06 and **nine benches already used it**; this one never joined.

### ⚠ F-08.96 MINTED — A THIRD MEMBER, WORSE SYMPTOM (re-minted from F-08.94 per CE R-M1)

The cold floor caught **`b06_m0` at 35 passed / 2 failed**: `§3.2` and `§4.2` report **"MUTATION stayed GREEN"**. Cold, 13 of its 50 cells do not run — but **its mutation arms are not gated alongside the cells that witness them**, so arms whose only witnesses were skipped report a **vacuous green** instead of a stated skip.

That is the exact defect D2 just cured in `b06_m4` (where the `§2.2 RED` arm is now gated with `...(gate.runDist ? [...] : [])`), and it is the more dangerous symptom: `b06_m4` cold **errored loudly**; `b06_m0` cold **claims a proof it did not perform**. Vacuous greens are worse than declared gaps. **Not widened into — outside this charter's W-1, which names `b06_m4` only.**

---

## 7 · THE WALK CARD — zero placeholders, test vendor `9888294440`

**Flag is OFF at push. Do not flip until step 2 is witnessed.**

**Step 1 — push, then confirm the door is live and silent.**
Railway logs after deploy. Send a normal enquiry to the vendor line from any couple number while the vendor's window is OPEN. Expect the alert to arrive exactly as today, and **no** `[enquiryAlert]` warning line. Nothing has changed on the happy path.

**Step 2 — make the window shut, with the flag still OFF.**
Do not message the vendor line from `9888294440` for 24 hours. Then have a couple send a fresh enquiry. Expect on the vendor handset: **nothing**. Expect in Railway logs, both lines:
```
[enquiryAlert] window CLOSED (131047) ctx=vendorInbound:notification(...)
[enquiryAlert] out-of-window fallback is OFF (vendor.enquiry_alert_oow_enabled) — vendor NOT notified
```
**And check the bride's side: her reply arrived and she got NO error line.** That is F-08.85's real cure, visible.

**Step 3 — ⚠ THE GAP, SETTLED HERE.** If step 2 shows **no** `window CLOSED` line but the vendor still got nothing, the failure is arriving **asynchronously via webhook status**, not synchronously — the door never saw it. Paste the logs back; the async limb becomes its own rider. **This is the walk's first question.**

**Step 4 — flip the flag.** In Supabase:
```sql
insert into admin_config (key, value) values ('vendor.enquiry_alert_oow_enabled', 'true')
on conflict (key) do update set value = 'true';
```
Wait 60 seconds (the flag cache window), then repeat step 2's enquiry. Expect on the vendor handset the approved template: *Hi Swati, a new enquiry just came in from Priya on The Dream Wedding…* and in logs:
```
[enquiryAlert] out-of-window TEMPLATE sent key=enquiry_alert_vendor
```

**Step 5 — the language check.** If step 4 logs a Meta **132001**, the language code is the suspect (`en` vs `en_US`) and `WA_TEMPLATE_LANGUAGE` is the one-env-var cure. Nothing else changes.

**To turn it off again:** set that same key to `'false'`. The door keeps catching and ledgering; it just stops sending.

---

## 7b · ⚠ WALK STATE — 2026-08-05, PARTIAL. STEP 2 IS **OPEN**.

Founder walked steps 0 through 1c on the live estate at deploy `9cf9804f`, test vendor
`9888294440`, handle **`DEV440`**, couple `919625759924`. Recorded here because a walk
that is not written down is a walk nobody can inherit.

### GREEN, witnessed on the wire

**Step 0** — flag absent from `admin_config` (zero rows = OFF, which is correct: the
default lives in code, not in a row). Service booted clean.

**Step 1** — the door is **live and correctly silent**. Open window, free-form send,
`status=sent` → `status=delivered`, and **no `[enquiryAlert]` line anywhere**. The
happy path is byte-unchanged. Silence is this step's pass condition.

**Step 1c — F-08.86 WITNESSED AT THE CURED SITE.** The vendor's structured brief read
`Budget: Rs 4,50,000`. Not `4.5L`. That is `engine.js:366` executing — the only message
that could prove it, since the couple lane's own replies get the register right from
HARD RULE 11 (`coupleSystemPrompt.js:249`) independently of the code cure.

**Step 1c — F-08.87 WITNESSED IN THE ROW.** `Priya | 2026-12-01 | month | 450000`.
The pre-cure specimen sits in the same afternoon's chat record for comparison:
`Dev Test 23 | 2026-12-01 | null`. Same shape, same account, the column now populated.

### ⚠ OPEN — STEP 2 HAS NOT RUN, AND F-08.85'S CURE IS **UNWITNESSED**

Everything above exercises the *open-window* path. **Not one byte of the out-of-window
cure has run on a live wire.** The template fallback, the `131047` catch, the
best-effort return that protects the bride's turn — all bench-green, all unwitnessed.

The window is Meta's fact and cannot be closed from our side: it is computed server-side
from the last inbound to our phone-number-id, so no SQL of ours moves it. (This is the
same reasoning that produced R-R1 — a local clock would be a second writer of Meta's
fact.) The vendor's last inbound was **2026-08-05 12:33 IST**; the window shuts
**2026-08-06 12:33 IST**.

A same-day alternative was derived and **declined by the founder for want of a spare
number**: swapping `users.phone` to a WhatsApp number that has never messaged the line
puts the pair out of window immediately. Recorded because the next walker may have a
spare number and should not have to re-derive it. Its one side effect: `users.phone` is
also how `vendorInbound.js:247` recognises an inbound sender as that vendor, so the real
handset stops being recognised until the value is restored.

**Step 2's pass condition, unchanged and still owed:** two log lines
(`window CLOSED (131047)` and `fallback is OFF`), plus a couple whose reply arrives with
**no error line**. And step 3's question stands: **if no `window CLOSED` line appears
and the vendor still gets nothing, Meta is reporting asynchronously via webhook status
and this door never sees it** (§5's disclosed gap). Until step 2 runs, the async gap is
neither closed nor ruled out.

### ⚠ F-08.98 MINTED — THE WALK CAUGHT WHAT THE BENCHES DID NOT

The vendor's brief read **`Date: 2026-12-01`**, not `Dec 2026`.

`engine.js:366` builds it as `parts.push(\`Date: ${event_date}\`)` — **the raw sentinel,
never touching the precision the same function just wrote three lines earlier.** The
enrichment line beneath it repeats the fault: *"Your 2026-12-01 is open."*

So F-08.87's cure is **half-delivered**: the estate now records that the day was never
spoken, and then shows the vendor a hard 1 December anyway. `formatDateWithPrecision`
exists, is exported from `datePrecision.js`, and is already called elsewhere in this
same file — the alert simply does not call it.

**How it was found, and this is the entry that matters most in this document:** four
benches and two chairs passed over it. `b08_p5_unblock §1.1` asserts the *row's*
precision; **nothing asserted what the vendor's eyes see.** The founder read one live
message and the gap was obvious. Evidence hierarchy holding exactly as written — the
founder's live walk outranks every automated instrument in this repo.

Not cured here: one line, but it moves a vendor-facing byte, which is the founder's veto
and outside this rider's W-1.

### ⚠ F-08.97 MINTED — A RETURNING BRIDE CAN NEVER CHANGE HER DATE

`engine.js:258-262` skips `capture_couple_lead` whole when a named lead already exists.
So if she returns and says *"we've moved it to March"*, the vendor hears it in the
intent summary and `leads.wedding_date` still reads December **forever** — the calendar,
the filters and every date-driven surface keep the stale value.

Pre-existing, outside W-1, surfaced by the walk when three leads on one phone kept the
first-contact branch from ever firing.

---

## 8 · NEXT SITTING

0. **STEP 2 OF THE WALK — the highest-priority open item.** F-08.85's cure is unwitnessed on a live wire. Nothing else in this delivery should be treated as walked until it runs.
1. **F-08.98** — the vendor's alert reads the raw sentinel and ignores the precision it wrote. One line; founder's copy veto.
2. **F-08.97** — a returning bride's date can never be updated.
3. **F-08.96** — `b06_m0`'s ungated mutation arms.
2. **The brief-template rider** — waits on Dev's wire paste (name, language code, `{{n}}` body, variable count).
3. **The async limb** — chartered only if step 3 shows it.
4. **F-08.89** — the live second L-carrier at `briefing.js:169`, and the still-unwritten deletion ruling for the F-05.56 island.
5. **The loud floor runner** — sixth sitting of wanting it; this delivery is the second saved by a cold run nobody had procedure for until now.
