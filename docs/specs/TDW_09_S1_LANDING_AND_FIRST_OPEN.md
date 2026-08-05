# TDW_09 · SITTING 1 · PAPER 2 — THE LANDING SIMPLIFICATION + THE FIRST-OPEN DESTINATION

**Base:** dreamos-pwa `e3210b5`. **HARD BOUND: zero backend bytes.** Any fork needing an API or schema change is reported out-of-bound below and never built.
**Mockup mechanism:** per CE ruling R-U9, **F1 arm (c)** — static mocks for choosing; route-and-flag bytes spent once, on the ruled arm only. The landing path stays untouched until it is ruled.

---

## 1 · THE CENSUS — WHAT THE LANDING PRESENTS TODAY

`app/(landing)/page.tsx` — **1,253 lines, 130 inline style blocks, zero className usage, 25 buttons, 13 inputs, 41 `onClick` handlers.** It is a single-file state machine over **eleven screens**:

```
entry · exploring · request_who · request_dreamer · request_maker
request_done · invite_code · invite_phone · invite_otp
signin_phone · signin_otp
```

### 1.1 · THE DECISION COUNT

The entry screen (`:632`–`:745`) opens **collapsed**. A first-time visitor faces, before anything happens:

| # | Decision | Site | Lands on |
|---|---|---|---|
| 0 | tap to expand the panel at all | `:635` `setEntryExpanded(true)` | the four below |
| 1 | **I'm a vendor** | `:679` | `invite_phone` |
| 2 | **Plan my wedding** | `:689` | `invite_phone` |
| 3 | **Sign in** | `:701` | `signin_phone` |
| 4 | **Just exploring** | `:712` | `exploring` |

**Five decisions to reach the first screen that does anything.** And the structural fact that matters most:

> **Decisions 1 and 2 lead to the identical next screen.** Both set a role and both call `setScreen('invite_phone')`. The visitor is asked to self-classify before the product has given them a reason to, and the classification changes nothing they can see. It is a fork in the copy and a straight line in the machine.

Decision 3 ("Sign in") is a returning-member path shown with equal weight to the three acquisition paths. Decision 4 ("Just exploring") is the only path that shows product before asking for anything.

### 1.2 · THE COPY ON THE ENTRY SCREEN

`The Dream Wedding` · `THE CURATED WEDDING OS` · `I'm a vendor` · `Plan my wedding` · `Sign in` · `Just exploring`. Elsewhere in the file: `India's First Wedding OS` · `Request an invite.` · `Request invite` — **two different positioning lines for the same product in one file** (`THE CURATED WEDDING OS` and `India's First Wedding OS`).

### 1.3 · THE DEMO TEASE LANDING, BESIDE IT (same class)

`app/demo/vendor/[handle]/page.tsx` and `app/demo/bride/page.tsx`. The vendor tease carries 4 measured contrast failures and 44 sub-16px declarations. It shares the entry problem in a milder form: a tour-chip row rather than a role fork.

---

## 2 · THE THREE FORKS

Each states what it prioritises and **what it hides where**. All three are UX-only; none moves a backend byte.

### FORK L-A — **ONE DOOR** (defer the fork until it is load-bearing)

The panel opens expanded to a **single primary CTA** and one quiet secondary.

- Primary: **Continue** → phone entry. Role is inferred nowhere and asked once, *after* the OTP, on the screen that already needs a name.
- Secondary, small, beneath: **Just looking** → the exploring feed.
- **Sign in** moves to a text link in the top-right corner — where returning users look, and where it stops competing with acquisition.

**Prioritises:** time-to-first-action. Decision count **1**.
**Hides:** the role fork moves *after* auth into the existing details step. `Sign in` moves to chrome. `Request an invite` is unchanged, reached from the phone screen when a number is unrecognised.
**Cost, stated honestly:** the two role branches diverge at `invite_phone` only in what `role` is set to. Moving the question later means the phone screen must carry a role-unset state. That is a pwa-side state change — **in bound** — but it is the largest of the three.

### FORK L-B — **TWO DOORS** (keep the audience split, drop everything else)

Panel opens expanded. **Two** equal CTAs, nothing else in the panel.

- **I'm getting married** → couple path
- **I'm a wedding vendor** → vendor path
- `Sign in` to the top-right corner as a text link. `Just exploring` folded into the couple path as its first screen — a couple who taps through sees the feed before the phone field.

**Prioritises:** telling two audiences apart at the door, which is genuinely useful for a marketplace with two sides.
**Hides:** `Sign in` to chrome; `Just exploring` becomes a step inside the couple path rather than a fourth peer choice.
**Decision count 2.** Smallest change of the three — the role fork already exists at `:679`/`:689` and simply loses its two neighbours.

### FORK L-C — **SHOW FIRST, ASK SECOND**

The panel does not open on a choice at all. **The discover feed is the landing.** A visitor lands inside product — vendor cards, real photographs — with a single persistent bottom bar reading **Continue** and a corner **Sign in**.

- Role is never asked at the door; it is inferred from behaviour and confirmed once at the phone step.
- `Request an invite` surfaces only when a number is unrecognised.

**Prioritises:** the product doing the selling. The strongest fit for a marketplace whose whole asset is photographs, and the only fork that answers *"what is this?"* before asking *"who are you?"*.
**Hides:** every choice. Nothing is presented until the visitor has seen something.
**Cost:** the exploring feed currently loads behind `startExploring()` at `:712`. Making it the first paint changes what the landing fetches on open — **this is the fork with the largest LCP exposure**, and the LCP debt is unmeasured. Named as a risk the founder's walk must settle, not a reason to refuse the arm.

---

## 3 · OUT-OF-BOUND — REPORTED, NOT BUILT

- Any fork that would **remember** a returning visitor's role across devices needs a server read — out of bound.
- Any fork that would **gate the feed by geography or category** at first paint needs an API parameter that does not exist — out of bound.
- The `Request an invite` flow's 60-second edit window (`request_done`) touches an existing backend route; **untouched by all three forks** and stated so.

---

## 4 · THE FIRST-OPEN DESTINATION (row 09's chartered question)

What a **logged-in vendor** sees on open today: `app/vendor/page.tsx` — the Hub.

### FORK O-A — **AI CHAT AS THE FIRST SCREEN**

Open lands in the Victor conversation. The Hub becomes a tab.

**For:** the product's actual value is an assistant that files leads from WhatsApp; putting the conversation first makes the promise the first thing seen. It is also the surface the capability manual and the north-star sentence are being written for — the soul sitting's work lands where the vendor already is.
**Against:** a chat with no unread state is an empty room. A vendor opening to a blank prompt must invent a question, and the estate has already convicted itself on this class — F-07.94 is the soul speaking outward about its own architecture because it had nothing else to say. **This arm is only as good as the north-star sentence, which is still owed.**

### FORK O-B — **A ONE-PAGE HOME**

Open lands on a single scrolling page: today's leads, this week's dates, the one thing needing attention — with the assistant as a persistent input bar at the foot rather than a destination.

**For:** answers *"what happened while I was away?"* without requiring the vendor to ask. Degrades honestly when empty (an empty day is a legible state; an empty chat is not). Preserves the assistant at arm's length on every screen.
**Against:** it is a dashboard, and dashboards are what every competitor already ships. The differentiator gets demoted to a text field.

### FORK O-C — **STATE-DEPENDENT FIRST OPEN**

Something waiting → the home. Nothing waiting → the chat, opened with a grounded first line from the capability manual.

**For:** neither surface is asked to carry a state it handles badly.
**Against:** a first screen that changes shape is a first screen a vendor cannot learn. It also makes the chat the *low-information* destination, which inverts the intended hierarchy.

**No recommendation is offered on this fork.** It is row 09's chartered founder question, it depends on a north-star sentence that does not yet exist, and the LE does not pick.

---

## 5 · WHAT THIS PAPER OWES THE SOUL SITTING

The soul sitting consumes this census. Three inputs it should carry forward:

1. **The role fork is currently decorative** (§1.1). Whatever the soul says about who Victor serves, the product does not currently branch on it at the door.
2. **Two positioning lines exist** (§1.2). One of them is wrong and the founder's veto owns which.
3. **Fork O's answer determines whether the capability manual is a first-screen artifact or a second-screen one.** If O-A, the manual is load-bearing on open and must exist before the arm ships.

---

## 6 · FINDINGS MINTED IN THIS PAPER

**F-09.13** — the landing's role fork sets a role and lands both arms on the identical screen (`:679`/`:689` → `invite_phone`); the visitor is asked to classify themselves before the classification does anything.
**F-09.14** — two positioning lines for one product in one file: `THE CURATED WEDDING OS` (`:655` region) and `India's First Wedding OS`.

Filed. Copy bytes for both go to the founder current-vs-proposed before any cure ships.
