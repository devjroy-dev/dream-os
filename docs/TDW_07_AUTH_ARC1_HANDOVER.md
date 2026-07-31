# TDW_07 · THE AUTH SITTING · ARC 1 — dream-os handover

**Base:** `d9cb4b9` · **Paired pwa ZIP:** `tdw_auth_arc1_pwa` on `082117a`
**Ruled at:** the auth sitting's read-first ruling (forks 1(b)+1(c) as one motion · 2(a) · founder veto 「 b 」).
This document rides the ZIP. It is **not** a CE entry and touches neither `FINDINGS_LOG.md` nor the masterplan.

---

## 1 · WHAT SHIPPED

| File | Change |
|---|---|
| `src/api/middleware/requireCoupleAuth.js` | **F-07.65 edge 1** — the couple lane stops accepting `tdw_vendor_token`. |
| `src/api/middleware/requireAuth.js` | **F-07.65 edge 2** — the vendor lane stops accepting `tdw_couple_token` (the mirror crossing, found by census, not in the charter). |
| `src/lib/resolveCoupleIfPresent.js` | **NEW** — F-07.62's cure, fork 2(a). A three-answer contract, never a guard. |
| `src/api/couple/enquire.js` | Identity resolved **once at the POST entry**; both legs receive the resolved value. The **F-06.85 block rewritten** as required. |
| `scripts/b07_auth_crossover_bench.js` | **NEW** — the server half of `tdw_auth_crossover.proof`. **24/24.** |

Edges 3 and 4 (the `Authorization` header on both lanes) are **untouched by design** and pinned by `§1.6`.

## 2 · WHY THE ENTRY, NOT THE HYDRATION SITES

The posted `couple_id` fed **two** things: hydration (`:205` real, `:521` demo) **and** storage (the binder at `:252`, the `couple_enquiries` upsert at `:438-450`). F-07.62's own disease sentence names both — "a real bride's name and phone into a vendor's ping **and cabinet**." A hydration-only cure would have left the storage sites believing the body while the hydration sites believed the token: one request, two identities, which is the shape of the next finding rather than the end of this one. One identity per request ⇒ one place to decide it.

## 3 · THE LOGGED-OUT DOOR IS UNTOUCHED

Per the CE addendum, the unauthenticated enquiry is a **product feature**. `router.js:59` still mounts `/discover/enquire` **bare** — pinned by `§3.5`, which fails if any future sitting mounts a guard there without ruling it. `resolveCoupleIfPresent` returns `{ present:false }` when no credential exists, and the handler then uses the posted id **byte-for-byte as before**. F-07.56's seven-consumer seal is intact.

## 4 · THE THREE ANSWERS, AND THE ONE THAT MATTERS

```
{ present:false, coupleId:null }  → logged-out bride  → posted id serves her (unchanged)
{ present:true,  coupleId:'…'  }  → authenticated     → her token WINS; forgery discarded unread
{ present:true,  coupleId:null }  → THE SPECIMEN      → hydrates NOTHING, stores NOTHING
```

The third answer deliberately does **not** fall back to the posted id. Falling back would mean anyone holding any valid JWT could still forge — the disease wearing a token. `§2.3` and mutation INVERSE 3 exist for exactly this line.

## 5 · FLOOR AT DELIVERY — re-run whole, sequential, tree clean before and after

`selftest 386/386` · `meter 28/29` **known-red** · `f0555 22/23` **known-red** · `b07_p5 139/139` · **`b07_auth_crossover 24/24` (NEW)**
CE-114 sealed list, all 28 exact: forkc_wireguard 113 · f0613_relay 40 · m0 50 · m1 45 · m2 43 · m3 37 · m4 33 · m4b 24 · m4c 20 · m4d 16 · f0658 20 · f0667 16 · f0681 17 · f0692 23 · advisor 16 · advisor_route 16 · 0081 12 · sonnet 13 · donna_cache 16 · b0461_p6 25 · b6_floors 47 · b6_s1 24 · b6_sitting2 22 · door_rider 15 · f0550 31 · arc_m2 27 · arc_m4 18 · arc_m5 11.
**Known-reds exactly TWO. Zero benches skipped. Zero unexplained reds.**

Six mutations, all RED at the uncured tree, all restored byte-identical (bench `§4`).

## 6 · WHAT THIS SITTING DID NOT DO

- **F-07.70** — sanctuary's 12 direct `access_token` reads bypass the read authority and keep the disease. P6 owns that file; chartered as its own one-file micro after both sittings land.
- **F-07.71 remainder** — the non-auth raw-string toast (500s, 400s) at the frost onboarding. Filed at its own site.
- **F-07.66 / Arc 2** — the co-planner join rebuild. Its own read-first follows.
- **Cookie-attribute drift, filed:** `tdw_vendor_token` is written `SameSite=Lax` by the client (`lib/vendor/session.ts:74`) and `sameSite:'none'` by this server (`vendor/auth.js:60`). Same name, two attribute sets, last writer wins. Not the crossover; not cured here.

## 7 · NEXT

Founder pushes this ZIP and its pwa pair. That push discharges the serial-delivery law and unblocks P6's ZIPs the same minute. Arc 2 then opens inside this sitting with its own read-first.
