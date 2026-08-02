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

## 5 · THE WITNESS CARD — TWO STEPS, THE EASY ONE FIRST (CE-153 §5)

**`restore()` has never executed against production.** The walk's final state was written by the founder's hand because this route did not exist. These steps are its first run.

### STEP A — THE ACTIVATE ROUTE. A press, no handset, no STOP prerequisite.

**A1 · Take the walk row down from the console** (this is the console road the START arm cannot reach):

```bash
curl -s -X DELETE "$API/api/v2/admin/demo/vendors/bafc94f9-e26c-4f81-8c93-0b1fdd353b72" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
Expect `{"ok":true}`. The card leaves Discover.

**A2 · Raise it with the new route:**

```bash
curl -s -X POST "$API/api/v2/admin/demo/vendors/bafc94f9-e26c-4f81-8c93-0b1fdd353b72/activate" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
Expect `{"ok":true,"vendor":{...},"state":"expired","derived_from_stamps":true}`.

**A3 · Fire it twice** — the second must answer `409 illegal_transition`, proving idempotency at the route.

**Railway (`dream-os`) must carry `restore()`'s first line in the estate's history:**
```
[demoLifecycle] legacy_jewellers removed -> expired (restored; derived_from_stamps=true, removed_at kept)
```

### STEP B — THE START LIMB. The handset, and the arm that actually caused F-08.24.

**B1** Send `STOP` from the handset. Row → `removed`, `active:false`, prospect `opted_out`.
**B2** Send `START`. Row → `expired`, `active:true`, prospect lifted.
**B3** Send `START` **again**. The prospect is no longer `opted_out`, so this is the exact second-START that fell through on 2026-08-02. The row is already live, so `restore()` refuses and **nothing moves** — that is the pass, not a failure.

**Watch `dream-os-marketing`, not `dream-os`** — the marketing service owns the inbound webhook.

### THE READBACK, after both steps

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

**F-08.17 stands** — two production demos share one handset, `demo_vendor_ref` is single-valued, and `restoreByPhone` inherits that ambiguity exactly as `removeByPhone` does. A shared-handset START raises whichever demo the linkage last named. Wants a linkage table.

**The console still has no Activate button.** The route exists; the affordance is a PWA byte, with the demo board — same shape as F-08.9's dial.

**F-08.9 · F-08.11 · F-08.12 · F-08.13/14/20 · F-08.19 · F-08.22 · F-08.23** are unchanged by this micro.
