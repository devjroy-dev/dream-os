# TDW_19 · BLOCK 19 · G5.1 SITTING 2 — THE PEER IS FOUND, THE PEER IS TOLD

**Sealed at dream-os `9b6321ff3dd10a1862c03d56a3f539597221ca46` · dreamos-pwa
`a2e7fe325d0deba9bd813215316065a3734f5a62`.** Both derived by `git fetch -q
origin` after the founder's pushes and verified file-by-file at origin, not from
this seat's clone — F-40.130's law, and it earned itself again below.

Ladder tip **`0142`**, applied to production and verified by
`information_schema` before the ZIP was applied.

---

## 1 · WHAT THE SITTING WAS FOR

Sitting 1 shipped the whole overflow exchange — the forward, the peer's lead, the
two stamps, the room — and told the peer **nothing**. She learned she had been
handed work by opening the app, or never. It also drew the boundary at her own
roster: she could hand an enquiry only to someone she had already worked with,
which meant the vendor who most needs to pass work on — the one with no peer in
that trade yet — was guaranteed never to find one.

Two rulings closed both. **R-40.104** repealed the roster boundary and made the
picker a search. **R-G51.15** tells the peer. A third, **R-40.107**, arrived
because the first two together put twenty-six vendors in front of each other.

---

## 2 · WHAT LANDED

### 2.1 · The peer is found — R-40.104

`forwardLead` step 3 no longer reads `vendor_roster` at all. The predicate is
three clauses and all three are load-bearing:

```
status = 'active' AND discover_paused = false AND peer_discoverable = true
```

`searchPeers` (same file, deliberately) shapes the choice with the identical
predicate, because **a predicate with two homes is a sheet that offers a peer the
door refuses**. Groups arrive already grouped, already alphabetical, and with
empty groups **omitted** — the founder's suppression rule is decided once, at the
door, so no surface can re-decide it.

Trade is normalised through `categoryFraming.normaliseCategory`, the estate's one
home: `vendors.category` carries no CHECK (censused, not assumed), so a raw
compare would sort `Makeup` away from `makeup` and drop a videographer out of
photography.

**The refusal is one code for four worlds, on purpose.** A vendor who has
withdrawn, a vendor who un-published, a retired account, and an id naming nobody
all return `referral_not_a_peer` byte-identically. Distinguishing them would make
the forward door an oracle for whether a given vendor exists and whether she has
hidden herself. A bench cell asserts all four answers are identical.

`referral_not_a_peer` **kept its name and changed its meaning**, and its
reasoning block was rewritten rather than deleted. Renaming it would have grown
`ForwardRefusalCode`, and `refusalSentence` is exhaustive by type with no
`default` — so the pwa would have stopped compiling until the founder vetoed a
sentence for a state the search already prevents.

**Phone is not a search key — c-40.45.** The kickoff named it. It was struck
because `public.vendors` carries no phone at all, a vendor's number lives on
`public.users`, and a phone match answers *whose number is this* — the reverse of
what a storefront answers and a direction nothing on this estate publishes. The
results carrying no number would not have closed it: **the match is the
disclosure.**

### 2.2 · The peer is told — R-G51.15

`src/lib/vendor/referralAlert.js` is the plane's one home — the insert *and* the
`told` read together, so `.from('referral_alerts')` appears in exactly one file.
Shape transcribed from `weddingLeadAlert.js` property for property.

`0142` creates `referral_alerts` with **both unique indexes PARTIAL** on
`wamid IS NOT NULL`. This is F9(b) and the `WHERE` is the whole ruling: a bare
`UNIQUE (referral_id)` would let one `opted_out` row block the retry forever and
make that peer permanently un-tellable. Failures accumulate as evidence; the
first success closes the forward.

`tdw_referral_alert` — Utility, vendor line, `status: 'pending'`. Utility is
derived rather than preferred: F-40.176 is the specimen, where Meta silently
dropped a MARKETING alert with `131049` to a vendor who had not messaged
recently — and the vendors a marketing template fails are exactly the quiet ones
this feature exists to reach. **The couple is named nowhere**, asserted against
the actual couple fixture rather than against a list of field names.

The wamid is read at **`out.result.wamid`** with fallbacks, and a cell asserts
`sendWa`'s own return statement so a flattening upstream reds both sides at once.
F-40.210's cure held at the first cut rather than after a walk.

### 2.3 · She may withdraw — R-40.107

`vendors.peer_discoverable boolean NOT NULL DEFAULT true`.

**The default is the opposite of `0140`'s and `0142` says why out loud**, so the
two columns never contradict in silence. `date_check_enabled` defaulted OFF
because it opened a *new* fact about her calendar to anyone. This governs a
directory built from `business_name`, `routing_handle`, `category` and `city` —
every one already on the public storefront card's own select — so it is a
**withdrawal from something she has already published**, not consent to a new
exposure. A bench cell asserts every peer-search column against
`vendorCard.js`'s `VENDOR_SELECT`, so growing the list past the public card reds
the claim `0142` rests on.

Spelled `_discoverable` and not `_hidden`: the safe state is `false`, so no
reader inverts and no stray `coalesce(..., true)` can open a door nobody opened —
`0140`'s own warning, honoured.

**The ruling named two arrays in `me.js` and the switch needed five sites.**
`ALLOWED_FIELDS` and `BOOLEAN_FIELDS` were named; the GET shape, the PATCH echo
and both vendor SELECTs were not, and without them the switch renders frozen —
F-40.209's law, that a control's state is a fact about the database. Reported
rather than silently widened.

The flag reads `!== false`, the **opposite coercion to its neighbour**, because
its default is TRUE: reading it `=== true` would draw the switch OFF for a vendor
the search already lists — she is exposed and her own settings screen tells her
she is not.

### 2.4 · `Told`, and where it does not go

Inside `ReferralStamp`, on the sender's `Forwarded to` row, **sender-side only**.
Not the room (per-peer aggregates cannot carry a fact about one forward), not the
peer's copy (she is the one who was told).

**It reads a wamid and nothing else.** A row with `status: 'sent'` and a null
wamid is FALSE here — that is the case where the message may well have arrived
and the estate cannot prove it, and a surface claiming proof it lacks is worse
than one that stays quiet. Absent until then, never a greyed *Pending*.

It rides **inside the stamp object** rather than as a top-level wire key, so
`LIST_WIRE_CENSUS` and `b36` leg C are untouched and `leadSerializer.js` stayed
walk-only. That was checked by command, not hoped for.

---

## 3 · FINDINGS

### F-40.219 — CURED
`lib/worklist/referrals.ts` carried two blocks reading *"PROPOSED — NOT YET
VETOED … FOUNDER: veto or replace this line"* about `refusalGeneric`, which the
founder had ratified at **R-40.56**. The apostrophe cure at `24d6ed7` moved the
string and left the paragraph. **It misled this seat within the hour** — the
read-first reported the byte as straight and unvetoed on the strength of it,
which is how the finding was found. Both blocks rewritten to record what they
said and what actually happened.

### F-40.220 — OPEN, SHIPPED DECLARED
`docs/TEMPLATES.md` §1 requires that **every variable pair be separated by real
words**. The filed body separates `{{1}}` and `{{2}}` with a comma:

> Hi {{1}}, {{2}} just passed you an enquiry on The Dream Wedding…

`b51` §14 asserts the estate's rule and is **RED**. It was not relaxed to Meta's
weaker whitespace test, which would have bought a green number with a real risk —
the hollow green this estate forbids. **The seat did not reword a byte the
founder vetoed.** Meta accepted the filing, so this is now a house-style
violation rather than a filing risk, and the estate's rule is the stricter of the
two. Curing it costs a re-file; the sheet's alternative (1) already separates the
pair with real words.

### F-40.226 — CURED BY THE RIDER
`relayStatus.js` searched `public.messages` and `public.lead_alerts` and had **no
arm for `referral_alerts`**. On the walk, Meta reported `sent` then `delivered`
for a real referral alert and both landed on the router's orphan sentence —
`home=none matched=0 — NO ROW CARRIES THIS SID`, twice, in the deploy log. So
`status` was frozen at `sent` forever, a `failed` receipt had nowhere to land, and
`Told` could never retract a claim Meta had withdrawn.

**This is F-40.177 repeated by the seat that had read it** and quoted it in
`0142`'s own header. Cured on `lead_alerts`' own arm as the router's THIRD home,
tried only on a miss, with the ruling that **a `failed` receipt clears `Told`** —
a wamid whose receipt retracts it is no longer proof.

**And the census cell found four more.** Written general at the chair's
instruction rather than named at the specimen, it reports that of five
wamid-bearing tables only two have router arms: **`reviews_asked` (0134),
`payment_reminders` (0139) and `contract_sends` (0143)** are orphaned, and the
last of those landed the same day. Two of them also lack the partial UNIQUE on
`wamid` that makes a receipt match unambiguous. **Not this rider's to cure** —
other arcs' tables, out of radius — and left RED and declared rather than scoped
away, because a cell narrowed to its own specimen would have let the next one
through exactly as this one was let through.

### F-40.227 — CURED BY `0144`
`0142`'s `COMMENT ON TABLE` claimed *"status is advanced by the Meta receipt
webhook via relayStatus.js"*. **False the day it was written** — and twenty lines
above it the same file states the true version as the reason the table needed to
exist. A comment that ships to `pg_description`, where no code review greps it.
`0144` corrects it forward, riding the same packet as the arm so the sentence
becomes true in the same breath.

### A DECLARED SECOND HOME — micro owed
`safeTerm` in `referrals.js` is byte-identical to `src/api/admin/search.js:101`,
which is not exported and was not in radius. Named in-comment with its twin, its
reason and its cure — a micro lifting both into `src/lib/shared/`. The
sole-writer law forbids a *silent* second home; it does not forbid a declared one
whose cure is sequenced.

### `tools/base_guard.sh` — micro owed, radius wider than first filed
It refused a correct checkout **twice**. Not a base mismatch either time: it
compares `git rev-parse --short HEAD` against the caller's string, and
`--short` is **adaptive per repository** — `core.abbrev` unset, git lengthens the
abbreviation until it is unambiguous in *that clone's* object database. This
seat's `dreamos-pwa` clone (16,943 packed objects) prints eight characters; the
founder's codespace prints seven. Same commit, same command, different answer.

**So no seat can hand the founder a short SHA that is reliably correct in his
clone.** The cure is one line — resolve both sides with `git rev-parse
"$BASE^{commit}"` and compare full object ids — and both copies must move
together, since the file is byte-identical across the repos with `b40` C81
asserting that. This is the failure the file's own header warns about: *the worst
kind of guard — one that teaches the founder to stop trusting it.*

---

## 4 · THE FLOORS

**dream-os** — `--delivery` + `--check`, foreground, at `85bdac1`. Exit 0.
`[F-14.16] declared files unmoved — set and contents both verified`.
**Delta: one line, `RED: b51_referrals_bench`, which is F-40.220 and nothing
else.** Every other bench matches the base by name, not by count.

**b51: 200 PASS · 1 FAIL**, 90 → 201 cells. **Sixteen production mutations,
sixteen RED, zero vacuous**, every one restored byte-exact and sha256-verified.

**dreamos-pwa** — `b40` **FLOOR GREEN**, C110–C114 added. **Thirteen mutations,
thirteen RED, zero vacuous.** `tsc --noEmit` clean; `next build` is the founder's
gate (R-40.66) and passed at apply, through a fifteen-retry TLS storm that is
precisely why that gate is his.

**The pwa floor delta is inherited, and it was proven rather than asserted.**
Four names appeared against the stored base. `git stash -u` → dirt 0 at the clean
tip → full floor → `stash pop`: **all four are red at `5a99eab7` with this
delivery removed.** The stored base predates the carry. **This delivery adds zero
reds.** Re-baselining that file was deliberately NOT done here — it would absorb
four inherited reds into a new normal, which is how a floor stops being a floor.

---

## 5 · WHAT THIS SEAT GOT WRONG, AND HOW EACH WAS CAUGHT

Recorded because the corrections are the reusable part.

**The fixture SELECT returned zero rows.** It matched `users.phone` exactly
against bare ten-digit numbers; the column holds `+919888294440`. The one thing
in the read-first not derived by command was a phone predicate written without
first deriving how a phone is written. Cured with the estate's own last-ten law.

**Band 7 §6 was reported absent from a `grep` for "band 7".** The heading is
`## §6 · THE BAND CONTINUES`. A negative asserted from one phrasing is not a
census.

**`refusalGeneric`'s apostrophe was reported straight.** It had been curly since
`24d6ed7`. The claim came from the file's own comment and sitting 1's handover —
prose read instead of the byte. This produced F-40.219.

**The mutation harness corrupted a shipped file.** It reverted by replacing the
mutated string back; `];` is not unique, so the reversal appended a group filter
onto `getReferralRoom`'s `|| []`. **b51 stayed green over it** — `[].filter(...)`
is `[]`, behaviourally inert, invisible to every cell. Caught by `git diff` per
R-40.32. The harness now restores whole files by sha256. **Standing lesson:
reverting by string is only safe when the string is unique, and a mutation
harness is a writer like any other.**

**`b40` C114 went red on its own cure**, substring-matching a phrase the cure
quotes in order to record it. The cell was fixed, not the file: the phrase may
survive only inside quotation marks, because a live claim is unquoted. **A regex
reading prose and calling it code is this arc's most repeated defect and it
caught this seat twice in one sitting.**

**The pwa manifest hand-waved twelve binaries** — "not listed individually."
`run-floor.sh` stopped with *dirt OUTSIDE the declared manifest*. F-14.16
declares paths, not intentions.

**`npm install` for the shot arm loosened two exact pins to carets** —
`@sparticuz/chromium` and `puppeteer-core`, pinned exactly because the binary and
its driver must match. Restored to committed bytes and kept out of the packet.

**Two short-SHA refusals**, §3 above. Mine both times: I handed over an
abbreviation derived in a clone that is not the founder's.

---

## 6 · WHAT SITTING 3 INHERITS

**⚠ THE WALK RAN, AND §6 BELOW IS AMENDED FROM WHAT IT FIRST SAID.** Kept as an
amendment rather than a rewrite, because the corrections are the record.

**The fixture: three accounts, and the kickoff conflated two.** DEV440 (`Dev Roy
Photography`, photography, essential), **DROY550 (`Dev Roy Photography 1`,
photography, BASIC, +918757788550)**, and MAKEUPBYSWATIROY (`Make Up by Swati
Roy`, makeup, prestige, +918595356978). The kickoff named DROY550 as
`makeupbyswatiroy` with Swati's number. This seat matched the fixture SELECT on
the PHONE and wrote the kickoff's label onto the row it got back — so it reported
the pair as cross-trade, "corrected" the acceptance card twice, and was wrong
both times. Found by the founder's walk, not by any instrument.

**The walk, run 2026-09-07.** All three heads witnessed on real vendors:
`Worked with` (DROY550, by roster), `Same trade` (**Nagpal photographer**,
Dehradun — a real fourth vendor), `Everyone` (Swati, by trade). The honest line on
a phone number. The forward, the alert on a live handset, the wamid, `Told`.

**The declared gap is CLOSED.** §6 first said `Same trade` was not witnessable by
any query this estate could run. The census had the answer in it — four active
photographers, two of them off DEV440's roster. The refusal to invent names was
right; the conclusion drawn from it was not, and one SELECT settled it.

**R-G51.11 is witnessed live, not by bench alone.** DROY550 is `basic`. She
received the alert, the lead, the referrer's name and the note — and not the
couple's phone until the founder upgraded her tier. That is the ruling entire:
the vendor who cannot ring the couple is the one who most needs telling.

**F-40.220** — the re-file decision.
**Two micros** — `safeTerm`'s promotion, `base_guard.sh`'s comparison.
**The stored pwa floor base**, stale by four inherited names.

**Both gates remain shut.** `REFERRAL_ALERT_SEND_ENABLED` is unset in every
environment and the registry ships `pending`, so `isApproved` refuses the key
regardless. Two independent gates, named separately, because they fail for
different reasons and a walk must be able to say which one refused.

---

*Sequencing beyond this sitting is the founder's.*
