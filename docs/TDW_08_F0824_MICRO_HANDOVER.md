# TDW_08 · F-08.24 MICRO — HANDOVER

**Base:** `dream-os @ eca59ee` · **Zero PWA bytes** · **Zero migration bytes** · `FINDINGS_LOG.md` and the masterplan untouched.
**Rulings:** CE-151 §1 · CE-152 · CE-153.

---

## 1 · WHAT SHIPPED

**`src/lib/demoLifecycle.js`** — `restoreByPhone(supabase, phone)`, the exact inverse of `removeByPhone`, exported. It delegates to `restore()` and derives nothing itself: **one authority, two callers.**

**`src/lib/prospects.js`** — the START branch gains its demo limb, placed **outside** the `opted_out` guard and **before** the opt-out lift. Lazy require, fail-open, typed refusals treated as normal answers.

**`src/api/admin/demoAdmin.js`** — the **TWELFTH** route, `POST /api/v2/admin/demo/vendors/:id/activate`. The DELETE route's missing inverse. 404 absent · 409 `illegal_transition` when the row is already live · 200 with the sibling `{ id, display_name, discover_eligible }` shape plus `state` and `derived_from_stamps`.

**Benches:** `b08_p1_lifecycle_bench` **89 → 106** · `b07_f0784_panel_bench` 59, guard-mount census **12 → 13**.

---

## 2 · THE TWO DESIGN POINTS THAT ARE NOT OBVIOUS

**THE LIMB IS KEYED ON THE DEMO ROW, NEVER THE PROSPECT — and the walk is why.** On 2026-08-02 the founder sent START twice. The first lifted the prospect out of `opted_out`; the second fell straight through the caller's guard at `prospects.js:167`. An arm keyed on the prospect's state restores on the **first** START only, and the demo it was meant to raise stays down — the defect wearing a cure. `restore()` refuses anything whose state is not `removed`, so keying on the demo row gives idempotency **from the callee** and needs no flag here. Celled at §15.2 and mutation-proven.

**THE ORDER IS THE INVERSE OF STOP's, for STOP's own reason.** There, the opt-out write goes first because blocking sends is the safe failure. Here the safe failure is leaving the opt-out **standing**, so the demo half runs first and the lift follows. If this module is wrong, the human is still protected. Celled at §15.6 — the opt-out lift survives an injected lifecycle throw, the mirror of THE RULED CELL for STOP.

---

## 3 · THE FLOOR

`npm ci` rc=0 → `npm run build` rc=0 before every line. PWA sibling present (PAIRED).

**Sweep: 99 scripts, EIGHT non-zero — the same eight as `eca59ee`. This micro added none.**
meter 28/29 · f0555 22/23 · b5b_movementb rc=2 · three credential-gated rigs · f0772 158/159 (F-08.13, pre-existing) · p4b_body 75/76 (F-08.14, pre-existing).

selftest **386/386** · **b08 106** · crons **48** · **f0784 59**.

**Four new `§M2` behavioural mutations**, each breaking production source and DRIVING it: the limb's existence · the walk's own defect (keyed on the prospect state) · the activate route reaching `restore()` · `removed_at` kept. Every mutated file restored **byte-identical** and asserted so.

---

## 4 · THE CENSUS, AND WHAT IT COST TO GET RIGHT

Re-derived at `eca59ee`, taken on **reachability**, not call-site syntax (CE-153 §3).

| Limb | Verdict |
|---|---|
| `buildInsertPatch` · `onInvited` · `onOpened` · `onEnquiry` · `removeByPhone` · `setDiscoverEligible` · `deactivate` · `runExpirySweep` · `runSunsetSweep` | reached, direct |
| `onRemoved` | **transitive** — `:397` (`removeByPhone`), `:459` (`deactivate`) |
| `readSunsetDays` | **transitive** — `:547` inside `runSunsetSweep` |
| **`restore`** | **NOW REACHED — two callers, wired this micro** |
| **`onClaimed`** | **DECLARED-UNREACHED** — P2 owns its caller, and P2 is unbuilt. Celled at §17.2 so the next sitting is forced to notice it rather than rediscovering it on a walk. |

**A qualified-call regex (`\.fn\(`) under-reports.** The executor's own first pass mis-filed `onRemoved` and `readSunsetDays` as orphans; both are reached by unqualified internal calls. An under-reporting census produces a cure that wires a limb already reached — second-writer birth from the opposite direction. Disclosed because the ORPHAN-LIMB LAW's amendment was earned by that error.

**`dream-os-marketing` carries no code this repo does not** — same tree, different entrypoint (`src/marketingIndex.js:29` requires and `:86` calls `handleMarketingInbound`). That is why STOP reached `removeByPhone` on the walk while `dream-os`'s own log stayed silent.

---

## 5 · THE WITNESS — STEP A WALKED, STEP B DEFERRED-NAMED (CE-153 §5, CE-154 §1-2)

### STEP A — WALKED AND SEALED, 2026-08-02, founder-witnessed on production

**`restore()` executed against production for the first time in this estate's history at `23:43:27 IST`**, deploy `51230039`. It had been written, exported and celled since P1 and had never once run outside a bench, because until this micro it had no caller.

| | Result |
|---|---|
| **A1** console removal (`DELETE /vendors/:id`) | `{"ok":true}` · log `expired -> removed (reason=admin)` at 23:42:17 |
| **A2** activate (`POST /vendors/:id/activate`) | `{"ok":true,"vendor":{id,display_name,discover_eligible},"state":"expired","derived_from_stamps":true}` · log `removed -> expired (restored; derived_from_stamps=true, removed_at kept)` at 23:43:27 |
| **A3** second press | `{"ok":false,"error":"illegal_transition","detail":"expired -> restore"}` — refused, nothing written |
| readback | `expired · active true · discover_eligible true` · `removed_at` 2026-08-02 18:12:16.417+00 (= 23:42:16 IST) · `expires_at` unmoved 14:38:14.750086+00 · ladder intact · **leads 9** |

**WHAT THE ROUND TRIP PROVED, and it is the answer to CE-152.** `derived_from_stamps: true` is the flag: `restore()` read `engaged_at`, targeted `engaged`, saw `expires_at` was past, demoted to `expired`. At 16:34 the executor performed that same derivation BY HAND and wrote its output; at 23:43 the function performed it and produced the identical state. **A hand copying a function and the function itself are indistinguishable by their output** — which is exactly why the chair could not settle the question by reading the row, and exactly why running it settled it. Live witness over inference, demonstrated on a chair's own error.

**`removed_at` MOVED TO A1's STAMP AND WAS NOT CLEARED** by the restore — the HISTORY-stamp idiom (CE-136 §3 clause 5) witnessed live rather than only celled. **`reason=admin`, not `reason=stop`** — the console road and the handset road stayed distinguishable through a full down-and-up cycle. **Leads held at 9** across a removal and a restore; `demo_leads_demo_vendor_id_fkey` cascades on delete and no P1 path issues one.

**One process note, disclosed:** A0.5 — the pre-flight that was meant to prove the route existed BEFORE the card came down — was skipped, so the route's existence was discovered with the row already removed. No harm resulted (worst case was a second hand-restore) but the ordering existed for a reason and it was not honoured.

### STEP B — DEFERRED WITNESS. NOT DROPPED, NOT WALKED, NOT PAPERED.

**THE START LIMB INSIDE `handleMarketingInbound` HAS NOT BEEN WALKED.** Step A does not touch it: A2 calls `restore()` directly from the route and never goes near a prospect. **Step A's green must not be read as covering the arm that actually caused F-08.24.**

**Ruled a DEFERRED WITNESS at CE-154 §2**, on the estate's own precedent — F-07.55's, banked one day earlier. The cure ships; the witness follows; the deferral is INKED with its return condition rather than held in chat, because a parked step that lives only in a transcript evaporates at the next seating.

**RETURN CONDITION:** the founder's handset, which was unavailable at delivery. The walk is:
- **B1** send `STOP` → row `removed`, `active:false`, prospect `opted_out`
- **B2** send `START` → row `expired`, `active:true`, prospect lifted
- **B3** send `START` **again** → **nothing moves.** The prospect is no longer `opted_out`, so this is the exact second-START that fell through on 2026-08-02. The row is already live, `restore()` refuses, and **that refusal is the pass.**

**B3 is the step and it is not negotiable (CE-154 §2)** — it is the one case a bench can prove and a walk can disprove. Watch **`dream-os-marketing`**, which owns the inbound webhook, not `dream-os`.

**WHAT STANDS IN THE MEANTIME:** six behavioural cells driving `handleMarketingInbound` with a real START (§15.1-15.6), including the fail-open mirror of THE RULED CELL, plus a `§M2` mutation that **reproduces the walk's own defect** — the arm keyed on the prospect's state, restoring once and never again — and reds correctly. Both-ways, over production source. **Proven, not witnessed.**

### THE READBACK FOR STEP B, when it walks

```sql
select * from (
  select 1 as pos, 'state (expect expired)'::text as fact, d.state::text as value
    from public.demo_vendors d where d.id = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 2, 'active (expect true)', d.active::text
    from public.demo_vendors d where d.id = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 3, 'discover_eligible (expect true)', d.discover_eligible::text
    from public.demo_vendors d where d.id = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 4, 'removed_at (KEPT — a history stamp is never cleared)',
         coalesce(d.removed_at::text, '~null~')
    from public.demo_vendors d where d.id = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 5, 'ladder stamps intact (restore derived from these)',
         coalesce(d.invited_at::text,'~null~') || ' | ' || coalesce(d.opened_at::text,'~null~')
         || ' | ' || coalesce(d.engaged_at::text,'~null~')
    from public.demo_vendors d where d.id = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'
  union all
  select 6, 'prospect state (MUST NOT be opted_out)',
         coalesce((select p.state from public.prospects p
                    where p.demo_vendor_ref = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72'), '~absent~')
  union all
  select 7, 'demo_leads STILL 9',
         (select count(*)::text from public.demo_leads dl
           where dl.demo_vendor_id = 'bafc94f9-e26c-4f81-8c93-0b1fdd353b72')
) s order by s.pos;
```

---

## 6 · ROLLBACK

```bash
git revert --no-edit <this micro's commit hash>
```
Additive only — a new module function, a new route, one limb inside an existing branch. No schema, no data, no deletions. A revert restores `eca59ee`'s behaviour exactly, including F-08.24.

---

## 7 · WHAT THIS DOES NOT FIX

**⚠ THE CONSOLE CARRIES A DESTRUCTIVE CONTROL WHOSE RECOVERY IS CURL-ONLY (CE-154 §4).** `app/admin/demo/page.tsx` has a **Deactivate** button wired to `DELETE /vendors/:id`. The activate route now exists, but **no Activate button does** — Step A was walked by curl. A screen with a destructive control and no undo is worse than a screen with neither, and the asymmetry is on a LIVE admin surface today. Same shape as F-08.9's missing dial: the backend is complete and the affordance is one PWA byte this micro is chartered not to touch. **Founder's fork, open:** one PWA byte now (it pairs an existing control rather than adding a capability), or curl until P4 builds the board.

**F-08.17 stands** — two production demos share one handset, `demo_vendor_ref` is single-valued, and `restoreByPhone` inherits that ambiguity exactly as `removeByPhone` does. A shared-handset START raises whichever demo the linkage last named. Wants a linkage table.

**F-08.9 · F-08.11 · F-08.12 · F-08.13/14/20 · F-08.19 · F-08.22 · F-08.23** are unchanged by this micro.
