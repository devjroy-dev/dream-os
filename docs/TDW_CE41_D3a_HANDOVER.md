# CE-41 · SEAT D · D3a (dream-os) — the consent record · HANDOVER

**Cut at** dream-os `e1dae2b94800029771b05d4b924e8a4c43c03725`. Migration **`0156`**.

## 1 · Why this exists

Meta's Messaging Policy §1 has two limbs — **(a) she gave the number** and **(b) she consented** — and until this packet the estate recorded evidence of neither. The founder asked by hand in an Instagram DM and the DM thread was the whole record. R-41.125 ruled that acceptable as *evidence* while D3 gave it a home. **This is the home, and it makes the record a precondition rather than a habit.**

## 2 · Her words, not a boolean — and that is the whole design

A `consent_given boolean` records **our claim about her answer**. `consent_text` records **her answer**. Only the second is evidence: a tick can be set by anyone, at any time, for any reason, and carries no trace of what was said. **There is deliberately no boolean column**, and a cell asserts there never is one.

| limb | how it is evidenced |
|---|---|
| **(b) consent** | `consent_text` **exists** — she replied, and the reply is stored |
| **(a) she gave the number** | **the number appears in her own words** |

Limb (a) is the one `META_MESSAGING_POLICY_READ.md:31` flagged as uncured: TDW obtaining the number and her merely agreeing to its use satisfies (b) alone. The amended R-41.122 cures it by asking her, in the DM, to **supply** the number.

**The check lives in the writer, not in a CHECK constraint**, for two reasons: it spans two columns that may be written in either order, and its refusal must carry a sentence the founder can act on. **A CHECK can only say no.**

The extraction is deliberately blunt — every digit run in her words, each folded to its last ten, against the row's last ten. `+91 98765 43210`, `9876543210`, `(098765)-43210` all fold the same: **the estate's join law (R-41.29) applied to prose instead of a field.** It does not try to find "the phone number" in her sentence; picking the right number out of free text is a guess, and any run that folds to her row's phone is proof enough that she wrote it.

## 3 · The gate sits above the register gate

Deliberately. **A missing consent record is not a switchboard state.** `dark` means *"the founder has not opened this plane yet"*, so a row that went dark for want of consent would tell him the wrong thing and be flipped on to no effect. The refusal writes **nothing**, names **which limb** failed, and leaves the prospect row standing — she is on file, just not yet askable.

## 4 · The writer records the paste, and never overwrites

Prospects are inserted by `forwardToProspect` itself, so her words arrive on `target` from the queue's form. A row **found** from an earlier forward gains its record on the same call that supplies it — otherwise the founder pastes her reply and is refused anyway, which reads as the form not working. **A second paste on a row that already has a record is ignored: evidence is not editable after the fact.**

## 5 · Two things I got wrong, both caught before the cut

**I built only the read half.** The gate read `consent_text` from a column nothing wrote. §7's own fixtures convicted it — eleven prospect targets refused before the switchboard was read.

**§7c crashed the bench at an uncured tree.** It called `A.consentEvidences` unguarded, so the uncured run reported *"bench threw"*, **zero failures and no verdict** — which briefly read as a clean run. **A cell that cannot see its subject must fail, never throw** (seat A's close note §6). Guarded: the helper's absence is now ten named reds, and the both-ways proof reads as a proof rather than a stack trace.

## 6 · ⚠ THE FOUNDER'S STEPS — read the third one before applying

1. Apply, verify, push.
2. **Run `0156`.**
3. **The outsider plane closes until the pwa paste box ships.** After this applies, **every outsider forward refuses `no_consent_record`**, because there is no surface yet to paste her words into. **That is the point, not a regression** — R-41.125 made the DM the record and D3a makes it a precondition. But the plane is shut between this apply and the D3 pwa frame, and that is a real cost to know in advance.

**If you would rather not close it, the packet can wait for the pwa frame and go in together** — say so and I will hold it. I have not assumed which you prefer, because it is a trade between compliance-in-code and a working queue, and that is the chair's to make.

## 7 · Carried

D3b (the bride arms, `assistance_found_notices`, the eighth router arm, `found_vendor`'s status word) · D3c (F-41.128's public read, F-41.125's `account_update` receiver, the fan-out confirm, F-41.75's three lakh sites) · the pwa paste-box frame, mock-first · `b61`'s re-cut cell awaiting a correction number.

**Range F-41.102–F-41.107 unspent.** No finding filed by this packet.
