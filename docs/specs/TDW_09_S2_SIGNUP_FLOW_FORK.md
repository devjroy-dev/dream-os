# TDW_09 · UX BLUEPRINT · THE SIGNUP-FLOW FORK PAPER — F-09.20, THE REQUEST-INVITE CEREMONY
### The invite machinery derived whole · the replacement as ruled forks · one recommendation with its evidence

**Bases:** dream-os `e0ff7d9` · dreamos-pwa `e3210b5`. **Authority:** AD-X3 (F-09.20 chair-minted, founder's-walk filing) · AD-X4 (fast-track charter) · AD-X5 (the Opus L-B hold rides this paper's ruling). **Bound honored: this paper derives; zero bytes are deleted; every arm's effect on the admin surfaces and the L-B door copy is stated.**

**THE ONE QUESTION THIS ARTIFACT EXISTS TO ANSWER:** what does the invite ceremony actually gate today, and what should stand where it stood?
**THE OBSERVATION THAT WOULD PROVE IT FAILED:** the founder rules an arm and its cure then discovers a live caller, a load-bearing row, or a curation function this census did not name.

---

## 1 · THE MACHINERY, DERIVED WHOLE — AND THE FINDING AT ITS CENTER

**The ceremony gates nothing.** That is not rhetoric; it is four independent witnesses, three of them the estate's own comments:

1. **The acquisition path is already open.** The landing's two acquisition CTAs (`I'm a vendor` `:679`, `Plan my wedding` `:689`) land on `invite_phone` — which despite its name requires **no code**: phone → OTP → in. The landing's own comment at `:436` states the architecture: *"the backend delivers the OTP over Meta and self-mints `public.users` + the role row — **open signup, any number** … the auth identity is created at verify time"* (F-05.9's cure). Any visitor who taps either gold button walks straight past the gate the copy describes.
2. **The invite-code screen is unreachable.** `invite_code` appears at its type declaration (`:99`) and its render block (`:911`) and **nowhere else** — zero `setScreen('invite_code')` calls exist in the machine. Its backend caller `/api/v2/invite/validate` therefore has **zero reachable frontend callers**. The screen has been dead scenery for as long as the current machine has existed.
3. **The backend already retired the gate in its own words.** `src/api/register.js:4`: *"**Replaces the invite-gated `/invite/consume` as the front door.**"* Mounted at `router.js:21` as *"public — open phone-OTP signup"* — and, completing the picture, it has **zero pwa callers**: the estate built the open front door twice (register.js and the auth trio the landing actually uses) and wired one.
4. **The curation the copy promises lives elsewhere, and is real.** The exploring-end pitch (`:1218`, *"Every Maker on TDW is personally curated"*) is true — but the curation is `src/api/admin/discover.js:52`: `vendors.discover_eligible` + `discover_request_state: 'approved'`, the admin Discover queue. **Supply is gated at the feed, where couples actually see vendors — not at the door.** A signup gate would duplicate a control that already exists at the only surface where it matters.

So the ceremony's true function today: it catches **only** (a) a returning-member tap on `Sign in` with an unrecognized number (`:537` → `request_who`, toast *"No account found — request an invite to join."*), (b) the theoretical provision-miss (`:487`), and (c) the exploring-end nudge (`:1222`) — and in every case it routes a person the open path would have admitted into a form that admits nobody. **This is AD-X3's conviction with the mechanism named: friction dressed as exclusivity, gating a door that stands open two buttons to the left.**

### 1.1 · The full footprint (the cure's radius, whichever arm rules)

**Frontend — `app/(landing)/page.tsx`:** the four `request_*` screens (`request_who` · `request_dreamer` · `request_maker` · `request_done` with its 60-second edit window) · the dead `invite_code` screen · the exploring-end capture (`:1178–:1243`, incl. the curated-invite pitch copy) · the two unknown-number toasts (`:488`, `:538`) · the `Request Invite →` buttons (`:825`, `:872`) and `Request an Invite →` (`:1222`) · the `invite_*` state names (`invite_phone`/`invite_otp` — open in behavior, gated in name). String census: **~20 request/invite strings** (chair's figure confirmed; the state-name identifiers are additional non-rendered sites).
**Backend — dream-os:** `src/api/waitlist.js` (`POST /waitlist/signup` → `waitlist_signups`, public insert) · `src/api/invite.js` (`/validate` — no reachable caller; `/consume` — superseded per register.js's own header; touches `invite_codes` + `users`) · `src/api/admin/waitlist.js` (list/PATCH/DELETE over `waitlist_signups`) · `src/api/admin/invites.js` (`invite_codes` CRUD + WA links) · `src/api/register.js` (the unwired open twin).
**Admin — dreamos-pwa:** `/admin/invite-requests/{dreamers,makers}` + `_list.tsx` (read `/admin/waitlist`) · `/admin/invites` (codes CRUD) · three NAV rows (`layout.tsx:104`, `:127`, `:128`).
**Independence proven:** `circle_members` tokens and crew tokens are their own machinery — `src/api/circle/join.js` never touches `invite_codes`. Retiring the dreamer/maker gate cannot reach the circle or crew doors.
**Load-bearing check (AD-X4's bound):** the three test accounts were minted through the auth trio, not through `invite/consume` (the consume path predates F-05.9's rewire and register.js has no callers) — but **rows in `waitlist_signups` and `invite_codes` may exist and are history**; every arm below leaves both tables standing, and any eventual drop is founder SQL under the destructive-DB law, after a count SELECT, never this paper's.

---

## 2 · THE FORKS — what stands where the ceremony stood

The founder's direction is ruled: the ceremony dies. The fork is the replacement. All three arms share the same first act — the four `request_*` screens, the dead `invite_code` screen, the exploring-end capture form, and the ~20 strings leave the landing; the exploring-end keeps its full-bleed closing moment but its CTA becomes the L-B two-door entry (per AD-X5, the landing is cured once, carrying everything together).

### ARM (a) — OPEN ONBOARDING, both audiences
An unrecognized number — on the acquisition path, on `Sign in`, anywhere — flows into phone → OTP → details. No gate exists anywhere, visible or hidden.

**Mechanics:** the unknown-number branches (`:487`, `:537`) stop diverting to `request_who` and instead continue into the open path with the role already known from L-B's door (recognition-over-recall — the same principle R-X7 applied to the discover CTA). The `invite_phone`/`invite_otp` states are renamed (`join_phone`/`join_otp`) so the machine stops carrying the gate's vocabulary. Zero backend bytes required to admit anyone — the open trio already does.
**Admin effects:** `/admin/invite-requests/{dreamers,makers}` + `_list` retire (two screens + shared list, three... two NAV rows `:127`/`:128`); `/admin/invites` + NAV row `:104` retire with them; `admin/waitlist.js` + `admin/invites.js` routes retire; `waitlist_signups` + `invite_codes` **tables stand untouched** as history. `invite.js` and the now-redundant-either-way `register.js` become retirement candidates in the same cure (register.js's open logic is the landing trio's; two unwired doors serve nobody).
**L-B copy effect:** L-B's original "Request an invite reached from the phone screen when a number is unrecognised" clause — already founder-overridden per AD-X5 — is replaced by nothing: an unrecognized number simply proceeds. The two doors ask the only question the product needs.

### ARM (b) — OPEN UI, SERVER-SIDE ADMIT GATE
The visitor experiences arm (a) exactly; vendors (or all) land in a `pending` state the founder admits from admin. No "request" ceremony is ever shown; the gate is invisible.

**Mechanics, honestly costed:** this is the only arm that **builds new machinery** — a pending state on the role row (schema act: a column or state widening, founder SQL), gating on every vendor surface until admitted, an admissions queue screen (the invite-requests screens reborn with a different read), and a notify moment when admitted. It converts the fake gate into a real one.
**Admin effects:** invite-requests screens **morph** rather than retire (new backing read); `/admin/invites` still retires (codes serve nothing in this arm either).
**L-B copy effect:** identical to (a) at the door — the honesty cost arrives later, as an unexplained wait for the pending vendor, which needs its own truthful copy ("your storefront is being prepared" that is *actually true* because the founder is reviewing) or it becomes the ceremony again, one screen deeper.

### ARM (c) — SPLIT: couples open, vendors gated (or the reverse)
Couples flow as arm (a); vendors as arm (b). (The reverse — vendors open, couples gated — has no marketplace logic behind it and is enumerated only for completeness: demand is never the curated side.)

**Mechanics:** arm (b)'s build, scoped to one lane. **Admin effects:** makers queue survives-morphed, dreamers queue retires, invites retires. **L-B copy effect:** the vendor door's copy must carry the review truthfully; the couple door carries nothing.

---

## 3 · THE RECOMMENDATION — ARM (a), and the evidence is the estate's own

**(1) The open door is already the shipped architecture, twice.** F-05.9's self-mint trio is the live front door; register.js is its unwired twin whose header declares the gate replaced. Arms (b)/(c) would *re-build a gate the estate has already torn out in code*, against a founder ruling that just tore out its costume.
**(2) The curation the gate pretends to do is already done downstream, for real.** `admin/discover.js`'s approval queue gates the only thing a couple ever sees. A vendor who signs up uncurated appears to nobody until the founder approves — arm (a) does not weaken curation by one byte. This is the decisive datum: (b) and (c) buy a *second* gate in front of a working one.
**(3) Scale and history.** Three test accounts, no rationing policy ever exercised (AD-X3's own framing). Arm (b)'s pending-state machinery, gating sweep, and admissions queue are real build cost for a control with no demonstrated user — and its silent wait re-creates the honesty problem unless its copy is perfect.
**(4) The honesty bound, applied symmetrically.** Arm (a) is the only arm where the door's copy, the door's machinery, and the founder's actual practice say the same thing. The exploring-end's *"personally curated"* line survives truthfully in arm (a) — re-aimed at what is true (the *feed* is curated) rather than deleted.

**Sequencing note (AD-X5):** the landing's cure bytes are the Opus sitting's L-B tree; this paper's ruled arm travels to that sitting as the ruled replacement. The admin retirements and backend-route retirements are separable ZIPs on this sitting's side of the seam, each verifying its derivation (zero callers, zero setters) at its own tip before deleting — R-X6's discipline, applied here by the chair's own instruction.

## 4 · FOR THE FOUNDER'S RULING, in one screen

The ceremony dies (ruled). What stands: **(a)** open door, no gate — curation stays at Discover approval where it already works · **(b)** open door, silent founder-admit gate — new machinery, invisible wait · **(c)** couples open, vendors silently gated. **Recommendation: (a).** One word rules it.
