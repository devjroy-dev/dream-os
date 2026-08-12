# TDW_10.C · ARMING MICRO — THE J1 BYTE IS APPROVED AND ARMED

**Repo:** `dream-os` @ `541b945` · **Role:** LE. Relay №5 §1.
**No SQL.** Three files, one behavioural line.

## THE DECISION, CARRIED WITH THE COPY

Founder-vetoed 2026-08-12 against tree `541b945` — 「 YES 」:

> 「 Chat is paused right now. 」

Onboarding surface, **zero dial only**. Frozen at the byte under
APPROVED-COPY-CARRIES-ITS-HASH: an edit — including the full stop — needs a
fresh veto and may not ride a refactor.

## WHAT CHANGED

- `ZERO_ONBOARDING_ARMED` → `true`.
- `CAP_BYTE_ONBOARDING_ZERO_PENDING_VETO` → `CAP_BYTE_ONBOARDING_ZERO`. The
  pending-veto naming is **purged entirely**, asserted by the build itself: the
  arming script fails if any `PENDING_VETO` identifier survives. A name that
  says "unapproved" outliving its approval is a lie the next reader inherits.
- D3's handover **annotated, not rewritten**. The original "ships unarmed"
  section stands with an approval header above it — *a handover that quietly
  becomes true was never a record of what shipped.*

## CELL 8.7 — LABELLED AMENDMENT, RATIFY-OR-REVERT

It asserted the byte stayed **unarmed** and resolved to `null`. True while the
veto was outstanding; no longer the truth to assert.

**Teeth kept and sharpened.** The old form guarded *no unvetoed byte reaches a
bride*; the new form guards *the vetoed byte reaches her, byte-exact* — the same
law (copy carries its decision) aimed at the state that now exists. It also
asserts the byte is still the **trimmed** one: the untrimmed zero sentence
promises a state a bride mid-signup does not hold, which is the whole of §0.2-J.

The `onboardingRefusesAt` predicate is **untouched** and still asserts the zero
dial is the only state that refuses at this surface (fork B).

## PROOF

- **30/30** on the armed tree.
- **Cell 8.7 RED at the unarmed tree** with the amended cell in place
  (`the approved byte was left unarmed`) — both-ways as relay №5 §1 required.
- Mutations: byte loses its full stop → 30→**29**; onboarding served the
  untrimmed zero byte → 30→**29**.
- `node --check` clean; zero `PENDING_VETO` identifiers remain.

## NOTE FOR THE CE-209 CARD

The armed byte is only reachable by a couple whose `onboarding_state` is not
`complete` **and** a zero dial. The walk card's onboarding step therefore needs a
fixture the estate does not currently have — see the card's step 0 SELECT.
