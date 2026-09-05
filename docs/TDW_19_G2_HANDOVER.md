# TDW_19 · G2 SITTING 1 — HANDOVER

**Seat:** LE, code-capable, mock-first. **Chair:** CE-40. **Date:** 2026-09-05.

**Tips at close:** `dream-os` `main` **`95c8f4f`** · `dreamos-pwa` `main` **`a48fa9b`**.
Both derived at origin by command at the close of the sitting, not carried from a
delivery header.

**Built to:** R-G2.1–.11 · R-40.41 · R-40.42 · R-40.44 · c-40.21 · c-40.23.
**Findings filed:** F-40.89 · F-40.90 · F-40.91 · F-40.92 · F-40.98 · F-40.101.

---

## 1 · WHAT SHIPPED

Five deliveries, in the chair's apply order.

| | ZIP | Tip | Landed |
|---|---|---|---|
| mock | `G2_S1_MOCK_v2_pwa` | `2bcd2bf` | `af295a7` |
| 1 | `G2_S1_BUILD_v2_dreamos` | `5e5c230` | `4d7a341` |
| 1b | `G2_S1B_ROOM_DOOR_v2_dreamos` | `06c9c7e` | `6402e78` |
| 1c | `G2_S1C_MIRROR_dreamos` | `6402e78` | `d53b262` |
| 2 | `G2_S1_PWA` | `0e1afed` | `a48fa9b` |

**`0134_reviews_and_seal.sql` is APPLIED IN PRODUCTION** (`nvzkbagqxbysoeszxent` /
`main`), before its code existed in the tree. That ordering was safe and is worth
stating: every object it creates is additive, the widened CHECKs accept every row
the old ones did, and nothing wrote `'couple'` in the window.

**The planes.** `reviews_asked` — once per couple, ever, and the guarantee is
`UNIQUE (couple_id)` rather than a check-then-insert, because the gap between two
statements is where the second message to the same couple comes from.
`vendor_seal` — a table and not a view (R-G2.4), because both schema witnesses are
base-tables-only and a view would be a column cited from prose forever.

**The send.** `reviewAsk.js`, dark behind two gates that fail for different
reasons. It routes through `sendWa` rather than `metaCloud` precisely so the
MARKETING opt-out condition is mechanically paid — which `creditInvite.js` does
not do (F-40.90, G1.2's to cure).

**The builder grew an arm.** `buildTemplatePayload` emits a URL-button component
when an entry declares one. Off by construction for the twenty-one entries that
do not, and that is asserted by a snapshot cell over every entry rather than by a
sentence in a comment.

**The seal.** Computed nightly at `20 3` IST from `weddings` only. Never editable.
Absent under three. `delivery_days` is `event_date → delivered_at` (R-G2.3), with
back-catalogue pages counted in N and excluded from D — two different questions,
two different populations, said out loud because one `WHERE` would have quietly
answered both the same way.

**The room.** No control anywhere. An ask follows a published page and is not
something she presses, so a button would be a second door onto an act she does not
drive — and it would be disabled most of the time, which is the lying-control class.

---

## 2 · THE SIX FINDINGS THIS SEAT FOUND BY OPENING HANDLERS

**F-40.89** — no key path joins a signed contract to a wedding. `public.contracts`
carries neither `event_id` nor `wedding_id`. This is what killed FORK 3's arm (a).

**F-40.90** — `creditInvite.js` requires `../metaCloud` directly, bypassing the
opt-out gate, the nudge gate and `phoneNumberIdFor`. `resolveConfig` defaults to
`MARKETING_PHONE_NUMBER_ID`, so a `line: 'vendor'` entry leaves from the marketing
number.

**F-40.91** — `app/r/[code]/route.ts:14` named a template that does not exist.

**F-40.92** — master §4 G2:98 computes the seal from `events`; R-40.11 moved
delivery to `weddings`.

**F-40.98** — **the one that mattered most.** `matchFullStopWord` reads the FIRST
TOKEN ONLY, so the `Stop messages` quick reply was `STOP` to it — and the full stop
is terminal and CROSS-LINE. A couple who asked to stop one kind of message was
being silenced on every line, including her own vendor's replies to her. **Forward
cure shipped**: the branch runs before the full stop, and a cell asserts that
ordering because the ordering is the whole fix.

**Backward half: CLOSED AS UNATTRIBUTABLE.** The census returned four opted-out
prospects with zero on both evidence counters — and those zeros are zero **by
construction**, because all three stop branches `return` before the bride lane's
first `messages` insert. `waSendLog` cannot help either: it writes console lines
not rows, it is wired on the vendor lane only, and both stop acks call
`sendWhatsApp` directly and so never reach it. Exposure is bounded:
`tdw_referral_invite` has **no caller in the tree**.

**F-40.101** — the wider gap that fell out of it: **no opt-out inbound on any lane
has ever been recorded.** The estate cannot audit any opt-out, on any lane, ever.

---

## 3 · THREE STRUCTURAL LESSONS WORTH MORE THAN THE FEATURE

**① A census pinned to a number reddens on lawful growth.** Four instances this
sitting: `b05_arc_m1`'s four ack sites, `b42`'s href ternary, `b16`'s §1.11 ladder
arithmetic, and `tdw_f3957`'s six paper frames. Each was amended **by label with
the count moved and the property preserved**, never loosened. `b42`'s ended up
*stricter* than before: it now asserts every open room addresses a declared
`*_HREF`, so a hardcoded literal still reds.

**② A green that cannot see the thing it appears to guarantee is worse than a
red.** `b55` §8's digest cell asserts *this side is self-consistent*. It cannot
assert *the two sides agree*, because the repos cannot read each other. When ZIP
1b shipped `seal` as an unnamed inline field, both repos would have gone green
against **permanently different literals** with nothing reddening anywhere. Only
running the other half's tool caught it.

**③ The count of frames shot is not a picture of a frame.** `S3-seal` shot blank
and the arm printed `SHOT 7 frames`. R-39.15 did the work; the instrument did not.

---

## 4 · EIGHT EXECUTOR ERRORS, ALL NAMED

| | What | Caught by |
|---|---|---|
| **e-1** | Checked a ruling about the pwa's `b50` against dream-os's `scripts/` — in the message that attested to R-40.27 | the chair |
| **e-2** | Nested `S3-seal` inside `S2-addr`'s framewrap | a blank capture |
| **e-3** | Hardcoded `~/dreamos-pwa` into a delivery block | the founder's shell |
| **e-4** | Reported the registry as sixteen entries; it was twenty. **The number propagated into a ruling** | the snapshot cell |
| **e-5** | Piped bench verdicts through `tail`, so **neither bench's red could stop the chain** | reading the transcript |
| **e-6** | Authored a census against columns the writer never reaches on the path in question | deriving the persist site |
| **e-7** | Chose a shape without deriving the other half's parse contract | the other repo's tool |
| **e-8** | Shipped a red in the mock ZIP because I never ran `tdw_f3957` | the pwa floor, two deliveries later |

**Six of the eight are one family: a claim checked against the wrong location.**
The general cure is the estate's own — derive the location by command rather than
assuming it. The specific cures now in the tree: redirect and read the exit, never
pipe a verdict; assert executable bytes, never a file's prose about itself (two
cells reddened on their own comments); run the *other* half's instrument before
choosing a shape that crosses the boundary.

---

## 5 · WHAT IS OWED — NOTHING HERE IS CLAIMED

**The PAIR regen.** `docs/db/PUBLIC_SCHEMA.md` describes neither `reviews_asked`
nor `vendor_seal` and still carries the pre-`0134` two-value lane CHECK. The
ladder has moved to `0136`. Until it runs, `0134` is the sole witness for all
three.

**The founder card.** `docs/sql/G2_FOUNDER_CARD.sql`, five statements, five
separate pastes. **Run after one night at 03:20 IST.** Card 2 returning zero rows
is the dark ask working, not the walk failing.

**The seal-present case is UNWITNESSABLE and is declared, not claimed.** No vendor
on this estate has three delivered pages. Card 4 proves the *absence* is by rule
rather than by failure — which is the fact that actually matters, since a missing
row and a below-floor row render identically. Proving the *present* seal needs a
seeded fixture by provenance-shown SQL, and that has not been ruled.

**`REVIEW_ASK_SEND_ENABLED` stays unset.** Unlike G1.1's credit invite, whose
registry status did half the holding, `tdw_review_request` has been APPROVED at
Meta since 2026-08-28. **That flag is the only thing between this code and a real
couple's handset.**

**Carried reds, declared:** `bs_audit` **C36** (`app/vendor/layout.tsx not found`),
inherited, A/B'd red on a clean tree at `0e1afed`. Both floors otherwise read
**NAMED BASE, no delta**; `b16`/F-40.64 closed at `a2a5180` by the G1.2 seat.

**Sitting 2 — the GBP claim and sync — opens 2026-10-27**, and `landedCount` is a
hard zero until it does. That is the product working. The room says so.

**Live witness declared, never claimed:** this seat has run no SELECT against
production. Every production statement in this handover is a structural claim
about the tree, or a founder observation quoted back.
