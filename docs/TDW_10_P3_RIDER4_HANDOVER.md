# TDW_10 · ADMIN P3 · RIDER 4 — F-10.59, THE ONE WRITER AND THE FIVE-STATE SCREEN

**Base:** dream-os `0c08dfe` (CE-201 band verified at origin) · dreamos-pwa `8a1fee1`
**Rulings:** R-P3.4 both halves, with the founder's correction widening (a) to the full state table · R-P3.5 recorded, vocabulary drafts ride here as drafts only
**Role:** LE. Nothing pushed. Two ZIPs, own guards — the pair spans both planes.

---

## 1 · THE WIRING CITE THE CHAIR ASKED FOR

Derived at the pwa tip, three hops, no line numbers in the durable pointer:

> `app/admin/makers/page.tsx` symbol `revoke` → `lib/admin-api/index.ts` symbol `patchVendorRevoke` → **`PATCH /api/v2/admin/vendors/:vendorId/revoke`**

which wrote `{ status: 'paused', discover_eligible: false }` and **never touched the state**. It is **not** `POST /api/v2/admin/discover/revoke/:vendorId`, which writes both and sets `'revoked'`.

**The chair's residue conviction is confirmed and sharpened: TWO DOORS CARRY THE WORD "REVOKE" AND MEAN DIFFERENT THINGS.** The Makers one also **pauses the account** (`status: 'paused'`), which is the larger act its 「 Revoke Access 」 label is naming — and nothing said so anywhere. Named at the site now.

## 2 · §0.2 — THE CENSUS WAS SEVEN DOORS, NOT FIVE. MY TABLE WAS SHORT.

My note gave the chair a five-door table. Re-derived by grepping the **pair** rather than the admin surface:

| door | eligible | state |
|---|---|---|
| `POST /discover/grant` | true | 'approved' |
| `POST /discover/revoke` | false | 'revoked' |
| `POST /discover/deny` | **untouched** | 'denied' |
| `PATCH /vendors/:id/discover-eligible` | flipped | **untouched** |
| `PATCH /vendors/:id/revoke` | false | **untouched** |
| **`requestDiscover`** (vendor side) | **untouched** | 'requested' |
| **`withdrawRequest`** (vendor side) | **untouched** | 'not_requested' |

The last two are mine to own: I counted admin doors and called it a census. Seven writers, three writing both.

## 3 · WHAT SHIPPED

**dream-os**

| File | What |
|---|---|
| `src/lib/vendor/discover.js` | **`setDiscoverState`** — the sole writer · `DISCOVER_STATES` frozen · `live_now` surfaced on the status payload · `requestDiscover` and `withdrawRequest` routed |
| `src/api/admin/discover.js` | grant · deny · revoke routed |
| `src/api/admin/vendors.js` | the Makers toggle and Revoke Access routed, both now audited |
| `scripts/b10_p3_mint_deck_bench.js` | §8 — 141 cells (+21), M13/M14 |

**dreamos-pwa**

| File | What |
|---|---|
| `app/vendor/discover/page.tsx` | the five-state screen, branching on `live_now` |
| `lib/vendor/types/vendor.ts` | `live_now?` and `pitch?` declared, read off the handler |
| `scripts/tdw10_p3_deck.proof.mjs` | 173 cells (+14), M17 |

### The writer refuses three things, and that is the cure

- **Both values are REQUIRED.** No default, no partial. A caller that knows half the fact does not write half the pair — that omission *is* F-10.59.
- **`state === 'approved'` ⟹ `eligible === true`.** The founder's specimen is now unauthorable.
- **One-directional, deliberately.** `eligible: true` + `'requested'` stays legal: a live vendor re-applying is live **and** under review — two true things. A biconditional would have silently dropped her off the feed on re-apply.

`extra` carries a caller's own columns (`status` at revoke-access, rate/tags at request) in the same round trip, and is refused by name if it tries to smuggle the pair.

### BEHAVIOUR CHANGE, DECLARED — deny now clears eligibility

`POST /discover/deny` wrote the state only, so denying an **already-live** vendor left her on the couples' feed while her own screen read NOT APPROVED — the exact mirror of the founder's specimen, reachable today by rejecting a re-application. The pair cannot be written by halves any more, so this door must declare eligibility, and the only honest value is `false`: **a refusal that leaves the vendor visible is not a refusal.**

## 4 · THE COPY TABLE — FOUNDER VETO, EVERY BYTE

Six renderings, because the screen must know which state it is in. Current bytes unchanged where they were already vetoed; **two are new.**

| # | State | Heading | Line | Status |
|---|---|---|---|---|
| 1 | not requested | *(CTA)* `Request Access` | — | unchanged |
| 2 | requested / under_review | `Under Review` | `Your application is being reviewed by Swati. Expected response within five days.` | unchanged |
| 3 | approved **and** live | `Approved` | `You're on Discover. Your work is live on The Dream Wedding.` | unchanged |
| 4 | approved **but not** live | **`Hidden For Now`** | **`You're approved, but your profile is hidden from couples right now. We'll be in touch.`** | **NEW — veto** |
| 5 | revoked | **`Removed`** | **`Your profile has been taken off Discover. We'll be in touch.`** | **NEW — veto** |
| 6 | denied | `Not Approved` | *the admin's reason, verbatim* | unchanged |

**Row 4 is a repair state.** `setDiscoverState` makes it unauthorable going forward — but rows already carry it (Make Up by Swati Roy, 2026-08-06), so the screen must tell those vendors the truth until the door they came through is used again.

**Row 5 was unreachable before.** Nothing set `'revoked'` except `POST /discover/revoke`, which the Makers row does not call — so the screen had no branch for it and rendered **nothing at all**. A revoked vendor saw an empty panel.

Deliberately *not* saying why in rows 4 and 5. The estate has no vendor-notification mechanism (F-10.22's class) and no reason column for a revocation; 「 We'll be in touch 」 is the honest end of a sentence we cannot finish. If the chair wants a reason surfaced, that is a column and a door, not a byte.

## 5 · F-10.52 — PER-CATEGORY VOCABULARY DRAFTS (drafts only, build follows the veto)

The mismatch these must kill, re-derived: the vendor picks from **ten lowercase** terms; the couple filters on a **different ten, capitalised**, matched by `.overlaps()` — exact string. `traditional` never matches `Traditional`, and **seven of ten have no counterpart**.

**Home:** one module both planes import; normalisation (case-fold, trim) lives there. Custom tags stored, displayed, normalised, **not filterable in v1**.

| category | drafted vocabulary |
|---|---|
| photography | candid · documentary · editorial · film · fine-art · moody · traditional · destination · intimate · luxury |
| makeup | dewy · matte · bridal-classic · contemporary · minimal · glam · airbrush · HD · south-indian · north-indian |
| decor | floral · minimal · royal · rustic · contemporary · traditional · destination · boho · opulent · pastel |
| catering | north-indian · south-indian · continental · pan-asian · live-counters · vegetarian · jain · fusion · street-food · plated |
| venue | palace · resort · farmhouse · banquet · beach · garden · heritage · rooftop · destination · intimate |
| mehndi | bridal · arabic · rajasthani · minimal · contemporary · portrait · glitter · traditional | 
| choreography | sangeet · couple · family · bollywood · classical · contemporary · flashmob |
| music | dj · live-band · classical · sufi · ghazal · folk · bollywood · qawwali |
| planning | full-service · day-of · destination · intimate · large-format · luxury |
| other | *(free entry only — the category has no vocabulary and should not pretend to)* |

**The vendor-facing byte for custom tags, on the veto list:** `Your own words are shown on your profile, but couples can't filter by them yet.`

**Not built.** The chair ruled the build follows the founder's list-by-list veto as its own post-seal rider. These are drafts and are marked as such.

## 6 · PROOF

- `b10_p3_mint_deck_bench` **141/141** cured · **120/141** at the uncured tree — **21 cure cells RED**, 19 of them in §8
- `tdw10_p3_deck` **173/173** cured · **163/173** uncured — **10 cure cells RED**
- dream-os floor: `b10_p2_bridge 82/82` · `b10_p1_search 45/45` · `tdw09_micro 23/23` · engine build 0
- pwa floor at exact counts: `p1_shell 53/53` · `p2_bridge 44/44` · `p2_retint 76/76` · `roles 130/130` · `home 67/67` · `p4b_probe 35/35` · `f0790 8/8` · tsc 0
- four known-reds exactly as attributed · `tdw_f0774_stripper 33/35` (F-10.49, pre-existing, unmoved)

### §0.2 — THE CENSUS TOOK THREE ATTEMPTS, AND ITS FIRST TWO FAILURES ARE THE POINT

The one-writer proof is a **derived** census: walk `src/api/` plus the pair's home, find every file that writes either column.

1. **Draft one** matched `.update({ … discover_eligible … })` as an inline literal → found **zero**, including the legitimate writer.
2. **Draft two** brace-matched the argument of `.update(` → still **zero**: `setDiscoverState` builds its payload in a **variable**, so the argument text is `patch`.
3. **Draft three** brace-matches, then resolves one level of indirection to the identifier's assignment.

Both misses surfaced **only because the cell asserts `=== 1`**. Had it asserted an absence, it would have passed twice while measuring nothing. That is the independent-method law paying rent, and it is the argument for asserting a positive count in a census rather than an emptiness.

**And §8 threw at the uncured tree on its first run** — a stack trace where the both-ways number should have been. Every writer call now goes through a shim: absent writer ⇒ one red per cell, never an exception. P2's defensive-loading precedent, which I had applied to module loading and not to a function I was about to call.

**Container note:** a `git checkout -- scripts` of mine reverted the new bench mid-run; recovered from a backup and re-verified. Second time this sitting that a checkout in my own tree cost work. No shipped byte affected — every delivered file is byte-derived from the cured tree and re-run after restoration — but it is a habit I should not need a third instance to fix.

## 7 · THE SMOKE — ZERO HAND-SQL, AS RULED

The system repairs its own record through its own door.

1. Admin → **People → Makers** → open **Make Up by Swati Roy**.
2. Tap **Revoke Access**.
3. Re-run the fixture SELECT. Expect `discover_eligible=false` · **`discover_request_state='revoked'`** · `is_live=false` — the pair together for the first time.
4. Vendor app as `+918595356978` → **Discover**. Expect **Removed** — *Your profile has been taken off Discover. We'll be in touch.*
5. To put her back: **Add to Discover** on the same row. The pair returns to `true` / `'approved'`, and her screen reads **Approved** — *You're on Discover.*

**What step 4 proves that no cell can:** before this rider she saw an empty panel there — `'revoked'` had no branch — and before the founder's walk she saw *"your work is live"* while invisible. Both lies, one screen, gone in one click of a door that used to cause them.

## 8 · CARRY-FORWARD

F-10.49 · F-10.48 · F-10.44 → 0113's sitting · the underived DELETE-404 · the in-card `VendorProfileView` rider · acceptance ② parked · **F-10.52's build on the list-by-list veto**.

No new numbers spent — .59 is the chair's mint. Next free **F-10.60**.

*Sequencing beyond this sitting is the founder's.*
