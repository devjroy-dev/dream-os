# TDW_19 · G1.1c — THE COUPLE'S SWITCH · THE BUILD SITTING · HANDOVER (dream-os half)

**Banked at:** `dream-os edb3362` (the delivery's own commit; cut against `3a35567`).
**Sibling:** `dreamos-pwa 74e875e` — the mock and its rider, landed. The switch's surface is not built.
**Seat:** LE, code-capable. **Built to:** R-40.9 · R-40.27 · R-40.30 · R-G11c.1–.9 · R-G11.10 (held) · R-G11.21.

Every number below was **re-derived by command at `edb3362`**, not carried from the
build seat's narrative. **Live witness is declared, never claimed:** no line here
asserts a behaviour observed against the production database.

---

## H1 · WHAT SHIPPED — six files, 617 insertions, 4 deletions

| File | What |
|---|---|
| `db/migrations/0132_couple_switch.sql` | **new, 150 lines.** `couples.publish_weddings`, `weddings.couple_id`, the partial index, `couple_set_publish()` |
| `src/api/couple/me.js` | the picked field, the atomic RPC call, the row-sourced default on GET |
| `src/lib/vendor/weddings.js` | `WEDDING_COLS` gains `couple_id`; `resolveCoupleForEvent`, `consentSeedFor`, the seed in `createWedding` |
| `scripts/b54_g11c_couple_switch_bench.js` | **new, 239 lines.** 38 cells + 6 production-code mutations |
| `scripts/b53_g11_wedding_pages_bench.js` | cell `:261` narrowed under R-G11c.9, labelled, ratify-or-revert |
| `scripts/floor-manifest-g11c-dreamos.txt` | **new.** the declared dirt |

**Zero pwa bytes.**

---

## H2 · THE ARCHITECTURE, AND THE ONE THAT DIED

The charter's link — `weddings.event_id → events.couple_id` — **cannot exist**.
`events_owner_xor` (`0013:55`, witnessed `PUBLIC_SCHEMA.md:1533`) enforces that an
event has a vendor **or** a couple, never both; the studio create door only ever
offers the vendor's own events (`studio/weddings.js:84`). That column is NULL on
every wedding that can exist, permanently — **F-40.45**.

It was found by the database refusing the founder's fixture UPDATE, not by
reading. The constraint was written down in **six places in this repo** and the
read ladder walked past all of them.

The live route is the **engagements spine** (Block 16):

```
events.linked_lead_id → engagements.lead_id  (vendor_id = THIS owner) → couple_id
```

**The `vendor_id` scope is load-bearing, not defensive.** The fixture couple holds
three engagements, two of them `photography` (DEV440 and DROY550). A match on
lead alone, or on couple-and-category, is ambiguous on real data today.

---

## H3 · THREE FACTS, ONE HOME EACH

| Fact | Home | Writer |
|---|---|---|
| Her standing answer | `couples.publish_weddings` | `couple_set_publish()` only |
| This page's consent | `weddings.couple_consent` (`0131:58`) | `couple_set_publish()`, plus the seed at create |
| Which couple a page belongs to | `weddings.couple_id` | `createWedding`'s derivation only |

**Both writes are one transaction.** Two `supabase.update()` calls would be two
statements and two chances to half-apply, leaving her answer and her pages
disagreeing. `couple_set_publish` does both in one plpgsql body. House shape
adopted, not invented — `0016:276`'s `claim_circle_invite` is the pattern, and the
estate holds eleven such functions and ten `rpc` call sites.

`publish_weddings` is **deliberately not** in `couplesPatch`: routing it there
would make the route a second writer of the column.

**The public door is untouched.** `weddingPage.js:84` still reads the page's own
`couple_consent`; `idx_weddings_live` is neither dropped nor redefined.

---

## H4 · PROOF — re-derived at `edb3362`

| Instrument | Result |
|---|---|
| `npm run build` | **exit 0** |
| `b54` bare | **GREEN — 38 pass, 0 fail** |
| `b54 --mutate` | **GREEN — 50 pass, 0 fail**; **6** mutations, each RED and restored byte-for-byte |
| `b53` bare | **exit 0 — 62 cells** |
| `b53 --mutate` | **exit 0**; `publish starts implying consent (R-G11.10 broken)` still RED after the narrowing |
| tree after all four runs | `git status --porcelain` **empty** |

**CORRECTION ON THE RECORD.** `edb3362`'s own commit message says *"b54: 36 cells"*.
**The bench has 38.** Two cells were added when the mutation pass caught them
weak (H6), after the count went into the message and before the cut. The commit
message is wrong by two and cannot be rewritten without a force-push; **38 is the
derived number** and this line is the correction.

**THE FULL FLOOR IS NOT CLAIMED BY THIS SEAT.** It was started three times in the
LE container and killed three times by container restarts, each inside the
runner's own discarded warm-up pass — 203 benches × 2 passes exceeds that
container's lifetime (**F-40.63**). The founder ran it at apply with
`--delivery scripts/floor-manifest-g11c-dreamos.txt`; his run printed
`[F-14.16] declared files unmoved — set and contents both verified` and named
three refusals — `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`,
`test-shape`. **Those three are expected and are not deltas:** `run-floor.sh`'s own
header records them as environment refusals and c-39.57 keeps refusals out of any
base. The verdict line itself was not read by this seat, so **`FLOOR = NAMED BASE`
is not asserted here.** Named base: `scripts/floor-base.txt`, 1 ERROR
(`b5b_movementb_bench`) + 15 RED.

---

## H5 · DISCLOSURE — what this seat got wrong

**e-1 · I read to the citer's boundary and the database caught me.** My
SQL-provenance header claimed *"every column witnessed by ordinal."* True and
insufficient: a column list says what exists, not what values are legal.
`PUBLIC_SCHEMA.md` carries a constraints section at `:1526–1540` where
`events_owner_xor` is written out in full; I read only the column block at `:535`
because the kickoff's ladder named that line. Protocol §9's INDEPENDENT-METHOD
LAW clause 2 — *"READ PAST THE CITE"* — is the exact law, and I quoted it in my own
attestation in the same message I broke it. **F-40.46**, cured in law by **R-40.27**.

**e-2 · I shipped multi-statement SQL to a founder shell twice.** The Supabase
editor renders only the last statement's result set, so two SELECTs vanished. On
the first occurrence I misdiagnosed it as a paste omission and shipped a probe
rather than questioning my own delivery form. One founder round trip spent on my
mistake. **F-40.59**, adopted as **R-40.31**.

**e-3 · I drew the mock's inert state dimmed, then misread my own capture.** My
eye reported the whole C3 frame as globally dimmed; a luminance measurement showed
the budget row identical at 182.0 in both frames and only the switch row moved.
The reading was the defect, not the render.

**e-4 · The commit message's cell count is two low.** See H4. Small, and left
standing rather than force-pushed over.

**A FOREIGN MUTATION WAS FOUND ORPHANED AND RESTORED.** When the third floor run
was killed, `src/lib/vendorInbound.js:140` was left mutated — `const token = '"' + q + '"'`
reduced to `const token = q` — by a bench's mutation pass that never reached its
restore line. **Not this delivery's file, not in the manifest.** Found by the
post-kill tree check, restored with `git checkout --`, proven byte-identical to
HEAD by `diff`. **F-40.62**, and the first witnessed firing of that hazard;
**R-40.32** makes the check law rather than habit.

---

## H6 · THE SEALED BENCH AMENDMENT — b53 `:261` (R-G11c.9, closes F-40.43)

**It was RIGHT to red.** It asserted by bare absence that nothing in
`src/lib/vendor/weddings.js` writes `couple_consent`; G1.1c's seed writes it in
that file. Narrowed to its two true subjects — the studio door whole, and
`publishWedding`'s own slice — with its sentence rewritten to say what it
asserts. `:260` untouched.

**Why it is not a loosened detector.** R-G11.10 forbids a vendor door writing
consent **as a vendor's choice**. The seed is not a choice: it copies the couple's
own standing answer off her row, never from a request body. Proven three ways —
b53's own `publish starts implying consent` mutation still turns it RED; b54
asserts the seed positively; and b54's mutations red both when the seed is removed
and when it is sourced from the caller.

**Ratify or revert.** It landed in the same delivery as the code that moved it, per
R-G11c.9 — a bench amendment landing first would be a green about a tree that does
not exist yet.

**Two b54 cells were themselves too weak on their first cut and the mutation pass
caught both:** a spread check that missed `...(req.body || {})` in brackets, and a
seed cell matching the variable's name rather than its source. Both strengthened,
re-run, green — and that is the two-cell delta behind H4's correction. Named
because a mutation pass that never fails is one nobody should trust.

---

## H7 · THE FOUNDER'S CARD — R-G11c.7's order (he performs, the seat reads)

1. **`0132` run.** ✅ Done at apply — `Success. No rows returned`.
2. **DEV440 creates `verma-reception`'s wedding page in the studio.** This is when
   `createWedding` resolves her `couple_id` through the engagement. It must happen
   **before** the couple's steps — the card's original order had her arriving at a
   room with nothing to govern.
3. **Sign in as the test couple** (`+919625759924`, couple `9f1f84d5…`) → Settings →
   **the switch reads OFF from her row.**
4. **Turn it ON** → `weddings.couple_consent` true on her page by SELECT.
5. **The vendor's page loses "Waiting on the couple's permission"** (#25).
6. **Turn it OFF** → the public page misses, **indistinguishable from absent.**

Steps 3–6 need the pwa half, **which is not built.** The fixture link
(`events.linked_lead_id → lead 88dbb52b…`) is made and witnessed.

---

## H8 · OPEN, HANDED FORWARD

- **The pwa half** — the switch's surface, reading its default from her row, with
  `next build` in the verify. Not started. The ratified mock is at
  `dreamos-pwa docs/mocks/couple-switch-mock.html` (4 frames, 16 captures).
- **F-40.60** — the derivation is lead-mediated, so an engagement with a NULL
  `lead_id` is invisible to it. Live specimen: MAKEUPBYSWATIROY ↔ the fixture
  couple (`e7755f06…`). Bites the first non-photographer page owner.
- **F-40.61** — `engagements.couple_booking_id` is a second wedding→couple path,
  unruled. G1.2's charter rules it beside F-40.60.
- **F-40.49** — a page whose couple is not on TDW **cannot be published under this
  ruling.** That is most of a photographer's back catalogue. Until the off-platform
  consent path lands in G1.2, #25 is the true state of every such page — the honest
  state, not a bug.
- **F-40.58** — `PUBLIC_SCHEMA.md:13`'s register still denies `engagements` exists
  while `:510` describes it. The body outranks the header on that table, ruled;
  cured by the pair regen.
- **F-40.41** — protocol §4's *"no dark mode on bride/vendor surfaces"* is doubly
  stale; amended at the next docs cut.
- **The pair regen** — `0132` adds two columns and a function that no snapshot
  describes. `0131` and `0132` are the sole witnesses for `weddings`, `couples`'s
  new column and `couple_set_publish` until it runs.

---

## H9 · PROTOCOL ATTESTATION

§7 and §11 opened and read in full. Apply chain verbatim:
`unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip`. No dotfiles in
`deploy/`. Guard first and alone, STOP, `0132` its own block, the chain, the D-10
verify, the git line as its own paste-block with named files. `git add -A` refused
throughout.

**Planes:** `public` only, zero `engine` bytes; both schema docs opened.
**R-40.27 honoured on every writing statement**, including `0132`'s own header,
which cites `couples`'s constraints section (`PUBLIC_SCHEMA.md:1430–1438`) and
`0131:49–70` as the sole witness for `weddings`.

**LE holds no write credentials.** This handover is docs-only and banks nothing
but itself.
