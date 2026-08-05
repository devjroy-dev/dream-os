# TDW_09 · SITTING 1 · PAPER 5 — THE POLISH DEBTS, CENSUSED AND STAGED · THE LCP WALK CARD

**Bases:** dream-os `b0d7822` · dreamos-pwa `e3210b5`. Every site derived by command.

---

## 1 · THE MAKER / DREAMER RENAME (CE-42, unopened)

**94 occurrences across 20+ files — and it is not only copy. It is routes.**

```
app/admin/makers/page.tsx
app/admin/dreamers/page.tsx
app/admin/invite-requests/makers/page.tsx
app/admin/invite-requests/dreamers/page.tsx
app/admin/invite-requests/_list.tsx
```

plus `app/(landing)/page.tsx:105` — `type Role = 'Dreamer' | 'Maker'` — and the two entry handlers at `:679` / `:689` that set it. Also present in `admin/collab`, `admin/revenue`, `admin/vendors`, `admin/page`, `admin/control-room`, `admin/approvals`, `admin/couples`, `admin/data`, `admin/invites`, `admin/layout`, `admin/dashboard`, `admin/subscriptions`, `admin/photos`, `admin/featured`, `demo/bride`.

**COPY FORK TO THE FOUNDER'S VETO — current vs proposed, his word on both columns:**

| Surface class | Current | Proposed |
|---|---|---|
| the audience noun, vendor side | `Maker` | ? |
| the audience noun, couple side | `Dreamer` | ? |
| the landing CTAs | `I'm a vendor` / `Plan my wedding` | already plain — **these do not use the internal nouns** |

**Derived and worth his eye before he rules:** the landing already speaks plainly (`I'm a vendor`, `Plan my wedding`). `Maker` and `Dreamer` survive almost entirely in **admin chrome and route paths**, not in vendor- or couple-facing copy. If the rename is about what customers read, most of the 94 are not it. If it is about what the founder reads in his own cockpit every day, all 94 are. **Which of those two the rename is for is his ruling, and it changes the scope by an order of magnitude.** Route renames also break any bookmarked admin URL — named, not assumed away.

---

## 2 · TEAM HUB CHROME (CE-58) — THE PIN QUESTION, WITH ITS ANSWER SET DERIVED

The charter says: ask the founder to pin which surface he meant before building anything. **He has three to choose from**, which is very likely why the question was raised:

| # | Entry point | Site | Note |
|---|---|---|---|
| 1 | `/vendor/team-hub` | `app/vendor/team-hub/page.tsx` | its own comment reads *"The SECOND entry point to the Team Hub"* |
| 2 | `/vendor/studio` | `app/vendor/studio/page.tsx:40` | a `Team Hub` section inside Studio Suite |
| 3 | `More → Team Hub` | `app/vendor/more/page.tsx:66` | the row that points at #1 |
| — | demo mirror | `app/demo/vendor/[handle]/business/page.tsx:65`, `.../page.tsx:107`, `.../more/page.tsx:55` | labelled `Team Hub`, **no prestige gate** by design |

Four gated leaves beneath: `studio/team`, `studio/tasks`, `studio/team-payments`, plus the hub pages themselves.

**Question for the founder, one sentence:** *when you said the Team Hub chrome was wrong, were you looking at `/vendor/team-hub`, at the Team Hub section inside `/vendor/studio`, or at the demo mirror?* Nothing is built until he answers, per the charter.

---

## 3 · DATE HUMANISATION (CE-53)

**56 `toLocaleDateString` sites** across at least 12 surfaces, plus **8+ local date helpers** with no shared home (`admin/invite-requests/_list`, `admin/approvals`, `admin/messages`, `admin/subscriptions`, `admin/hot-dates`, `(frost)/frost/canvas/sanctuary`, `(frost)/frost/canvas/journey/events`, `demo/vendor/[handle]/collab`).

The spec's P6 names one date voice — `"Thu, 14 Dec"`, IST. It does not exist. **Proposed home: `lib/design/date.ts`**, beside the money home, same shape, same reasoning. Timezone is the trap: several sites format without an explicit zone, so a server-rendered date and a client-rendered one can disagree by a day for an IST user near midnight. Named as the reason this is a cure and not a find-and-replace.

---

## 4 · THE F-04.123 FILE — ALL SEVEN ITEMS, INCLUDING THE ONE THE KICKOFF DROPPED (R-U7)

`FINDINGS_LOG:2772` carries seven. The kickoff transported six.

| # | Item | Derived state |
|---|---|---|
| 1 | **band-board pip titles** | pips carry date + slot, never title; a loose lane beneath a band on the same date defeats position-as-answer. Couple-lane surface. |
| 2 | **no custom domain** | **FOUNDER ACT, ZERO CODE.** A DNS record on the crew-link host. Crew links currently read as phishing. Restated per the charter; nothing to build, nothing to ZIP. |
| 3 | **DREAMAI chrome** | `admin/conversations/brides:77` (*"Bride conversations with DreamAi"*) · `admin/control-room:173/183/193` (tier feature strings `DreamAi — 5 / 30 / unlimited queries/month`) · `admin/control-room:221` · `admin/vendors:47–49,160,182` (`dreamai_access` toggle, a **DB column** — not renameable from code per §4's house law) · `app/components/couple/MuseRow.tsx:126`. **The WABA display name itself is a Meta-side founder act, like item 2.** |
| 4 | **`business_name` null ×3** *(the dropped item, R-U7)* | CE-58's eyebrow gap. **A fixture gap cured by one founder UPDATE, zero code** — restated here so it is not lost a second time. |
| 5 | **hardcoded "Contact Swati to upgrade"** | **EIGHT SITES ACROSS TWO REPOS**, not one — see §5. |
| 6 | **initials divergence** | staged with the canon; the avatar/initial derivation differs between surfaces. |
| 7 | **BY WEDDING chip affordance** | the label lives at `lib/vendor/settleWords.ts:29` (`BY_WEDDING_LABEL = 'By wedding'`), rendered at `app/vendor/studio/team-payments/page.tsx:234`. The chip exists; the finding is that it does not *read* as tappable. Token-canon work (a chip role with a pressed state), not a copy change. |

---

## 5 · **F-09.9 — "CONTACT SWATI" IS EIGHT SITES ACROSS TWO REPOS, AND TWO OF THEM ARE API ERROR BODIES**

| Site | String |
|---|---|
| `app/vendor/couture/page.tsx:88` | *Couture access is reserved for invited makers. Contact Swati to be considered.* |
| `app/vendor/team-hub/page.tsx:48` | *Team Hub is reserved for Prestige. Contact Swati to upgrade.* |
| `app/vendor/studio/page.tsx:49` | *Team Hub is reserved for Prestige. Contact Swati to upgrade.* |
| `app/vendor/studio/team/page.tsx:50` | same class |
| `app/vendor/studio/tasks/page.tsx:54` | same class |
| `app/vendor/studio/team-payments/page.tsx:56` | same class |
| **`dream-os` `src/api/middleware/requirePrestige.js:15`** | *Studio Suite is for Prestige vendors only. Contact Swati for an invite.* |
| **`dream-os` `src/api/vendor/couture.js:26`** | *Couture access is invite-only. Contact Swati.* |

The last two are **backend error bodies that reach the vendor's screen**. They are vendor-facing copy under the founder's veto living outside the pwa, where a copy census scoped to the frontend cannot see them — the F-05.21 census-blind class wearing a different coat. Also: the string names a person, so it does not survive the first day someone other than Swati handles upgrades.

**All eight go to the founder current-vs-proposed as one copy fork**, and the cure is one keyed home per repo, not eight literals.

---

## 6 · F-08.100 — THE PASTE-DOOR GATE (the one backend micro homed here)

Now filed at `docs/FINDINGS_LOG.md`, entered by this ZIP under R-U2/R-U3.

**Site:** `src/api/admin/demoAdmin.js`, symbol `_photoGate` — called on both create paths (`:297`, `:446`). **Cure shape:** F-08.44's — reject at the door with a **named reason** when `src/lib/admin/cloudinary.js`'s `publicIdFromUrl` cannot resolve a public id.

**Two constraints derived, both binding:**
1. **The parser stays frozen.** `publicIdFromUrl` is under F-08.91's declared-duplicate note — it is a declared duplicate of `portfolio.js:78`'s regex, and unifying them means editing a function R-B3 froze. The gate *calls* it; it does not touch it.
2. **Row-intrinsic before cross-row**, per F-08.44's own cured shape. The URL check is intrinsic to the row and runs before any cross-row work.

**No current instance** — the chair's entry records the estate-wide version-less-URL SELECT returning zero rows after the founder's deletion. This is a recurrence guard, so the bench must prove the RED at the uncured tree by feeding a version-less URL through both create paths, not by finding one in production.

---

## 7 · THE LCP DEBT — THE FOUNDER'S WALK CARD

**The executor does not claim this measurement and will not.** `docs/TDW_08_P6_HANDOVER.md:219` states it: device-bound, founder-run. Zero pwa bytes moved at P6, so no regression is introduced — but the number is his.

**Card — plain steps, the founder performs and pastes, the executor reads the evidence.**

| # | Step | What to paste back |
|---|---|---|
| 1 | On the mid-range Android, throttle to 4G. Open Chrome → `thedreamwedding.in` **from a cold start** (swipe the app away first; do not reload a warm tab). | the LCP number from Chrome DevTools remote debugging, or the Lighthouse mobile run's LCP |
| 2 | Same device, same cold start, **installed PWA** rather than the browser tab. | LCP |
| 3 | iPhone, **Safari**, cold start, same URL. | the visible delay in seconds — a stopwatch reading is acceptable evidence here and is named as such |
| 4 | iPhone, **Chrome**, cold start. | same |
| 5 | **Instagram in-app browser** — open the link from a DM or a bio tap, cold. | same |
| 6 | For any run above 2.5s, note **what is on screen at 2.5s**: blank, the wordmark, or a photograph. | one word per run |

**Why step 6 matters more than the number:** the landing's first paint is a photograph carousel with three Cloudinary fallback slides hardcoded at `app/(landing)/page.tsx:34–38`. If the LCP element is a hero image, the cure is image delivery. If it is the wordmark or a blank, the cure is bundle. The number alone does not distinguish them, and the wrong cure is a wasted block.

**Bearing on Paper 2:** landing fork **L-C** ("show first, ask second") makes the discover feed the first paint and therefore carries the largest LCP exposure of the three arms. This card should be walked **before** the founder rules the landing fork, not after.

---

## 8 · FINDINGS MINTED IN THIS PAPER

**F-09.9** — "Contact Swati" at eight sites across two repos, two of them backend error bodies invisible to a frontend copy census.
**F-09.10** — Team Hub has three vendor-facing entry points plus a demo mirror; CE-58's chrome complaint cannot be actioned until the founder pins which one he was looking at.
**F-09.11** — no date voice: 56 `toLocaleDateString` sites, 8+ ad-hoc local helpers, several with no explicit timezone, so server and client can disagree by a day near IST midnight.

**Range used: F-09.1 – F-09.14. F-09.15 remains free.**
