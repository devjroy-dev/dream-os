# TDW_10 · ADMIN P3 · RIDER 5 — ONE VERB, THE DOOR BACK, AND THE STANDING CHIP

**Base:** dream-os `0c08dfe` + rider 4 · dreamos-pwa `8a1fee1` + rider 4
**Founder rulings:** 「 (b) Hide from Discover / Hidden 」 · 「 remove from discover should automatically give the vendor re apply 」 · 「 profiles which have been approved and then paused, should show paused 」 · 「 revoke doesnt serve any purpose 」 · 「 why suspend any vendor. i can delete the vendor 」
**Role:** LE. Nothing pushed. Two ZIPs — the pair spans both planes.

---

## 0 · THE DERIVATION THAT CHANGED THE FOUNDER'S OWN WORD

He asked for 「 Pause Discover 」. Derived before a byte was written:

**`vendors.discover_paused` already exists and is THE VENDOR'S OWN SWITCH.** She writes it herself through `PATCH /api/v2/vendor/me` — the route's allow-list and boolean-coercion list both name it — it arrived at migration `0101`, and the couple feed excludes on it directly (`src/api/couple/discover.js`, `.eq('discover_paused', false)`). Her preview already renders *"Paused — hidden from Discover right now."*

Three consequences, and the third decided it:

- **Writing HER column: refused outright.** She can unpause herself from her own profile controls. An admin act the subject can reverse is not an admin act.
- **An admin state named 'paused': one word, two mechanisms** — hers and his — in a product where her screen must tell her which is holding her back. That is F-10.59's disease, one rider after curing it.
- **Her screen would say "Paused" for both** and she could not tell who did it.

Founder-ruled: same behaviour, a word that is still free. **'hidden'** — also literally what it does: she keeps her account, her leads, her portfolio, her AI; couples cannot see her.

**This is the reason I asked before shipping.** Rider 5 was otherwise about to render a chip and a door on top of a word whose collision nobody had checked.

---

## 1 · WHAT SHIPPED

**dream-os**

| File | What |
|---|---|
| `src/lib/vendor/discover.js` | `'hidden'` joins `DISCOVER_STATES`; `'paused'` deliberately absent; `'revoked'` retained for legacy rows |
| `src/api/admin/discover.js` | `POST /discover/revoke/:id` → **`/discover/hide/:id`**, writing `'hidden'`; audit `discover_hide` |
| `src/api/admin/vendors.js` | the toggle writes `'hidden'`; **`PATCH /vendors/:id/revoke` DELETED** with its tombstone |
| `scripts/b10_p3_mint_deck_bench.js` | 145 cells (+4), M13 re-anchored |

**dreamos-pwa**

| File | What |
|---|---|
| `app/admin/makers/page.tsx` | `Revoke Access` deleted · toggle → **Hide from Discover** · **the standing chip** |
| `app/admin/approvals/discover/page.tsx` | the settled chip → **Hide**, same door |
| `app/vendor/discover/page.tsx` | the `hidden` state, **with Re-apply** |
| `lib/admin-api/index.ts` | `hideDiscover` replaces `revokeDiscover`; `patchVendorRevoke` retired |
| `scripts/tdw10_p3_deck.proof.mjs` | 192 cells (+19), M18/M19 |

---

## 2 · THE VERB THAT REVOKED NOTHING

`Revoke Access` wrote `status='paused'` + `discover_eligible=false`. **`vendors.status` has exactly ONE consumer in the estate** — the morning-briefing cron, `src/cron.js`, `.eq('status', 'active')`.

- Login never reads it (`src/api/vendor/auth.js`)
- The app never reads it (`resolveVendor`)
- The WhatsApp lane never reads it (`vendorInbound`)

So the button removed a vendor from Discover **and stopped her good-morning message**, while she kept her account, her leads, her portfolio and her AI — and the founder would have believed he had cut her off. Two buttons side by side, one labelled as the nuclear option, and the difference between them was a cron job.

Founder-ruled deleted rather than made true. **A half-built kill switch on your own admin is the thing most likely to be trusted at the wrong moment.**

**FOUNDER ACTION, ONE LINE.** His own 「 Revoke Access 」 click set Swati's `status='paused'`, so her morning briefing is off and nothing writes that column any more to turn it back on:

```sql
-- TDW_10 P3 rider 5 · repair the one row the retired button paused.
-- Witness: docs/db/PUBLIC_SCHEMA.md public.vendors :9 status text NOT NULL default 'active'
update public.vendors v set status = 'active'
from public.users u
where u.id = v.user_id and u.phone = '+918595356978' and v.status = 'paused';

-- confirm — expect one row, status 'active'
select v.business_name, v.status from public.vendors v
join public.users u on u.id = v.user_id where u.phone = '+918595356978';
```

Worth a look across the board if any other vendor was ever revoked: `select business_name, status from public.vendors where status <> 'active';`

---

## 3 · THE DOOR BACK — a cul-de-sac I built one rider ago

Rider 4's `revoked` branch had **no button**. `denied` has Re-apply; that had nothing — so a vendor read 「 We'll be in touch 」 and could not act. Before rider 4 she saw an empty panel, so it was not a regression, but **replacing silence with a sentence and still leaving her stuck is arguably worse**: now she believes the screen is complete.

Founder-ruled. `hidden` and legacy `revoked` share one branch, one line, one **Re-apply**.

**Vendor-facing byte, on the veto list:**
> **Hidden** — *Your profile is hidden from couples right now. You can apply again whenever you're ready.*

Chosen over rider 4's *"taken off Discover. We'll be in touch"* because that sentence ended somewhere the vendor could not go.

---

## 4 · THE STANDING CHIP — 「 the screen tells the truth but is speaking the half truth 」

The row rendered `{v.discover_eligible && '● DISCOVER'}`. One boolean, so **three standings collapsed into one blank**: waiting on the founder, denied, and never-applied all looked identical.

The data was already in hand — the list endpoint returns `discover_request_state`. **No backend change**; the row simply stopped ignoring a field it was already being sent.

| standing | chip |
|---|---|
| approved + eligible | `● DISCOVER` |
| approved, not eligible *(legacy split pair)* | `● HIDDEN` |
| hidden / revoked | `● HIDDEN` |
| requested / under_review | `● PENDING` |
| denied | `● NOT APPROVED` |
| not_requested | *(nothing — never applied is an honest blank)* |

Admin chrome only; no vendor sees it. The optimistic local update moves the **pair**, never half of it — a list that flipped eligibility while the chip stood still would be F-10.59 reproduced in React state.

---

## 5 · PROOF

- `b10_p3_mint_deck_bench` **145/145** cured · **121/145** uncured — 24 cure cells RED
- `tdw10_p3_deck` **192/192** cured · **164/192** uncured — 28 cure cells RED
- dream-os floor: `b10_p2_bridge 82/82` · `b10_p1_search 45/45` · `tdw09_micro 23/23` · engine build 0 · `node --check` clean
- pwa floor at exact counts: `p1_shell 53/53` · `p2_bridge 44/44` · `p2_retint 76/76` · `roles 130/130` · `home 67/67` · `prospects_console 54/54` · `f0790 8/8` · tsc 0
- four known-reds exactly as attributed · `tdw_f0774_stripper 33/35` (F-10.49, pre-existing, unmoved)

### §0.2 — A MUTATION THAT SILENTLY STOPPED MUTATING

**M13 read `applied=false`.** Its anchor quoted the whole multi-line `setDiscoverState({...})` call, and F-10.60 changed one word inside it — so the mutation matched nothing, applied nothing, and would have gone green as a vacuous cell if the assertion had been weaker. Re-anchored on **one short line**.

**And it caught a real miss while it was at it.** The `'revoked'` → `'hidden'` edit in the toggle had never been written: the python that made it also raised a `ValueError` on an unrelated anchor further down and aborted *before* writing the file. The next script re-read from disk and only applied the tombstone. **A silent no-op edit, surfaced by a mutation whose anchor had just been fixed.** Both are recorded because together they are one lesson: an edit is not applied because a script ran.

### A CELL RE-AIMED, DISCLOSED

`Revoke survives on the settled list` → `the take-off-Discover verb survives (now named Hide)`. CE-115 clause 1's promise is that the **capability** survives a rewrite, not that its label is frozen. The cell now asserts the capability.

---

## 6 · THE SMOKE — zero hand-SQL except §2's one-line repair

1. Admin → **Makers**. Every row now carries its standing: Swati `● HIDDEN`, an applicant `● PENDING`, a never-applied vendor blank.
2. Open Swati → the row shows **Add to Discover** (no `Revoke Access` anywhere).
3. Tap **Add to Discover** → toast *Added to Discover.* → chip flips to `● DISCOVER`.
4. Vendor app as `+918595356978` → **Discover** → **Approved**, *You're on Discover.*
5. Back in admin → tap **Hide from Discover** → toast *Hidden from Discover.* → chip `● HIDDEN`.
6. Vendor app → **Hidden**, *Your profile is hidden from couples right now. You can apply again whenever you're ready.* — **and a Re-apply button.**
7. Tap **Re-apply** → the submit flow opens. Leave it or complete it; either way the door exists.
8. Run §2's repair so her morning briefing comes back.

---

## 7 · CARRY-FORWARD

F-10.49 · F-10.48 · F-10.44 → 0113's sitting · the underived DELETE-404 · the in-card `VendorProfileView` rider · acceptance ② parked · **F-10.52's per-category vocabulary build** on the list-by-list veto (drafts ride rider 4's handover).

**F-10.60 proposed** — the label that outran its act: `Revoke Access` revoked no access; `vendors.status` had one consumer. Deleted by founder ruling. Next free **F-10.61**.

*Sequencing beyond this sitting is the founder's.*
