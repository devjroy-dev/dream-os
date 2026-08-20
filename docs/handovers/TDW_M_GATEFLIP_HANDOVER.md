# TDW · M-GATEFLIP — HANDOVER

Charter: CE-35, 2026-08-20. Built at **dream-os `0704c6a`**, sibling
`dreamos-pwa a2233c1`, both re-derived by `git fetch -q origin` at the
executor's own clone before any byte (CE-22).

Rulings: **R-35.17** (arming moved off the code default) · **arm (a)** on the
schema witness · the founder's **BOTH DOORS** word, 2026-08-20.

---

## 1 · THE HALT — why this ZIP arms nothing

**The charter's §1 named `src/lib/laneFlags.js`'s in-code default as the edit
site. Read-first halted there and the chair owned it as c-35.9.**

`readLaneFlag` (`laneFlags.js:117-125`) consults `admin_config` **first** and
falls back to the in-code literal only when the key is absent or unreadable. So
editing that literal would have armed **both** WhatsApp doors the moment Railway
finished a build. That is **F-08.56 — the deploy-gate inversion — restated in
the file whose opening law exists to prevent it** (`laneFlags.js:3-9`):

> the founder pushes and the code speaks in the same act… so that PUSH is not
> SPEAK and the last act belongs to the founder's hand rather than to Railway's
> build queue.

D-10's shape was preserved around it in the charter, which is what made the
inversion easy to miss: the verify and git lines were correctly separated, but
the **arming rode the git line itself**.

**It was also unnecessary.** The same file, `:32-34`, says a flip lands within
the 60-second cache window and **no deploy**. The estate has the doctrine in ink
at three committed sites: `src/agent/engine.js:280`,
`src/lib/billing/tierFlip.js:22`, `src/api/vendor-engine/chat.js:2757`.

**So: the default stays `false`, and the gate is armed by one `admin_config` row
run by the founder's hand, after the push, with both population counts already
on his glass.**

---

## 2 · WHAT SHIPPED — five files, zero behaviour change

| file | what moved |
|---|---|
| `src/lib/laneFlags.js` | **F-OB.17 cured.** The stale "two locks" paragraph replaced. The flag's **value is unchanged** — still `false`. Comments only. |
| `scripts/bOB_d2_onboarding_gate_bench.js` | 6.1/6.2 retitled; **6.2a added**; 6.3/6.3b labelled as standing unamended. No cell deleted. |
| `docs/handovers/TDW_M_GATEFLIP_SQL.sql` | The three founder blocks: population · arm · disarm. |
| `scripts/floor-manifest-m-gateflip.txt` | Declared dirt. |
| `docs/handovers/TDW_M_GATEFLIP_HANDOVER.md` | This file. |

**Zero migrations. Zero SQL executed by the ZIP. Zero copy** — both redirect
bytes were vetoed 2026-08-12 and remain pinned character-for-character by §3.3
and §3.3b. Plane: `public`.

### F-OB.17, and why the correction is recorded rather than just made

The superseded paragraph claimed a second lock — the redirect copy, *"null until
vetoed."* **That condition discharged on 2026-08-12.** An executor seat read that
comment instead of `onboardingGate.js` at its own site and reported a two-lock
gate to the chair **four times** across an audit and two handovers, mispricing
fork (b) as twice as far away as it was. **A comment in one file describing the
contents of another is a claim, not a witness.** The new text says so at the site.

---

## 3 · THE BENCH — what changed and what was cut

**`76 passed, 0 failed — VERDICT: GREEN`** at the cured tree. (The count is 76, not 78: two of the three cells the read-first proposed were cut at build for duplicating existing coverage — see below.)

- **6.1 / 6.2** keep their assertions and gain accurate titles (`SHIPPED
  DEFAULT`, not "ship state"). Nothing inverted: the default is still `false`, so
  both remain true statements about it.
- **6.2a NEW** — *armed + COMPLETE bride is still not gated.* Both-ways proven:
  mutating `onboardingGate.js:120` (`if (verdict.complete)` → `if (false)`) turns
  it **RED** with `an armed gate detoured a COMPLETE bride — that is a lockout,
  not a gate`. The gate file was restored byte-identically (`0 diffs`).
- **6.3 / 6.3b stand UNAMENDED**, with a labelled note recording why. The chair
  ruled a re-point on the ground that this delivery would render them vacuous —
  **that premise was discharged by the ruling itself.** They would have gone
  hollow only if the default had been mutated to `true`; with it `false`, their
  stubs are the only thing that can arm the flag, so the arming stays
  load-bearing. A cell edited without a live cause is a cell whose next reader
  cannot tell what the edit was for.

### ⚠ The executor's read-first was wrong about this section

It claimed the armed path was *"reachable in this bench only through 6.3"* and
tabled armed twins for both lanes on that basis. **It is not.** Cells **6.5, 6.6
and 6.7 already drive the armed stub** — 6.5 armed+complete (vendor), 6.6
armed+incomplete with the vetoed byte and the missing field named (vendor), 6.7
armed+incomplete with the bride byte. The seat had read 3.1/6.1/6.2/6.3 and
tabled an amendment over a roster it had not finished reading.

**Two of the three proposed cells were cut at build for duplicating 6.7 and
6.5/6.6.** 6.2a survived because it is the one genuinely absent combination:
armed + complete on the **bride** lane. 6.5 proves it for the vendor only, and
the predicates differ (bride: two fields; vendor: six), so vendor coverage is not
bride coverage.

---

## 4 · WHAT ARMING DOES — both doors, asymmetric cost

Derived, not assumed: `onboardingGate()` has exactly **two** callers —
`brideInbound.js:418` and `vendorInbound.js:292` — reading **one** flag key.

- **Bride:** `brideComplete` gates on **two** fields (`users.name`,
  `couples.budget_total > 0`).
- **Vendor:** `vendorComplete` gates on **six** (`users.name`, `business_name`,
  `category`, `city`, `rate_min > 0`, `service_area`).

A vendor missing **any one** of the six meets the redirect on **every** message —
R-OB.2 gives no grace turns and no counter. Eliza is exempt by charter and by
control flow (`vendorInbound.js:289-291`); circle members return above the bride
gate (`brideInbound.js:416`), so R-OB.5 holds by flow, not by check.

**The gate returns before any model call** (`brideInbound.js:419-423` sits above
the meter mint), so it costs zero spend — and it cannot be masked by
conversation history.

---

## 5 · SEQUENCE — the founder's, in order

1. Apply the ZIP, run the verify block, **STOP**.
2. Push. **Nothing is armed by this push.**
3. Run **Block 1** (population). Read both counts.
4. Run **Block 2** (arming row). Live within 60 seconds, no deploy.
5. Walk (§6).
6. **Block 3** (disarm) is in hand throughout.

---

## 6 · THE WALK

**Complete bride — writes nothing.** Sarah (`+919625759924`, restored) messages
the bride lane → **ordinary Mira, undetoured.**

**Incomplete bride** — a thin fixture bride, name nulled → **the frozen
`BRIDE_REDIRECT_BYTE`, verbatim on glass.**

**A thin fixture suffices here, and the mechanism is the reason:** the gate
returns at `brideInbound.js:419` **before any model call**, so conversation
history, summaries and taste notes cannot mask it — unlike F-OB.15, where the
same rich context is exactly what would hide the finding.

**⚠ WAIT SIXTY SECONDS after the arming row before the first message.** The flag
cache is 60s (`laneFlags.js:37`). A message sent inside that window will be
served by Mira and **that is not a failed gate** — it is a cache that has not
turned over yet.

---

## 7 · WHAT THIS DOES **NOT** TOUCH

- **F-OB.15** (Mira handed `unknown`) — still parked on its fixture; minting a
  virgin nameless bride now needs a second WhatsApp-capable number, because
  WhatsApp signup dead-ends and the web gate forbids a nameless signup. **Arming
  this gate may moot it on the WhatsApp lane entirely** — a redirected bride
  never reaches Mira.
- **F-OB.16** (`pin-login` omits `name`) — open, zero bytes.
- **F-SW.9** (8 of 70 schema headers disagree with their bodies; `vendors` 45/53)
  — minted at the chair, generator investigation queued, **not this sitting's**.
  Named in-comment at every vendor-column reference per arm (a).
- **The frost guard**, the PWA, the signup door — unchanged.
- **The existing stock of nameless brides** is not repaired by arming; it is
  *redirected*. Each bride repairs her own row by completing the form.
