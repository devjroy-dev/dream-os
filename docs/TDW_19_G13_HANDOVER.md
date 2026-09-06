# TDW_19 · G1.3 — HANDOVER

**The door on the roll · Book the same team · the printed unit · the reel probe · the no-event create · the lead alert.**

Seals: **dream-os `9988614` + rider 4** · **pwa `3258407`**.

> ⚠ THIS SUPERSEDES THE dream-os-HALF HANDOVER committed at `d422163`. That
> document described one packet; four riders, a pwa half and a micro landed
> after it, and a handover that describes a third of an arc is worse than none.
> Its content is carried forward here in full — nothing was dropped, and the
> disclosure section GREW rather than shrank.

---

## H1 · WHAT SHIPPED, BY COMMIT

| | |
|---|---|
| pwa `3d13d65` | the mock — 10 frames, 23 shots, `G13_VETO_SHEET` answered under R-40.42 |
| dream-os `d422163` | `0137` · `leadSources.js` · `publicRoll.enquire_link` · the team door · the card renderer · the probe · the no-event create |
| dream-os `d79285b` | rider 1 — the team rides the page's own payload |
| pwa `cfe4525` | the four surfaces |
| dream-os `ce32c2e` · pwa `b01f725` | rider 2 — F-40.136, F-40.137 |
| dream-os `d4a33a7` | rider 3 — F-40.150 |
| pwa `3258407` | the reel micro |
| dream-os *(this packet)* | rider 4 — R-40.72, the lead alert |

`b57_g13_team_bench` ends at **112/112 with 17/17 mutations biting**. `b53` amended by label 132 → 134. **`FLOOR = NAMED BASE, no delta` on every cut**, set compared, base re-measured at each moving tip.

## H2 · THE RULINGS, AS BUILT

**R-G13.1** — the team enquiry is a server-side door. The charter's intake-token arm was withdrawn (c-40.26) because `vendorInbound.js` slices `TDW-` and refuses hyphens: a team token was **dead on arrival at the branch meant to read it**. Zero parser bytes; W-1 untouched.

**R-G13.3** — `enquire_link` is built at the door off the imported `ENQUIRE_BASE` with the **uppercase** `routing_handle`. The wire's `handle` beside it is lowercased for `/v/`; a leaf reusing it would have shipped `TDW-makeupbyswatiroy`, which routes today only because the intake upper-cases the first word — a property of the intake, not a promise to that file.

**R-G13.4/.5** — the target set is `unique(vendor_id)` over linkable claimed credits ∪ the owner, one predicate shared by the sheet that **names** the set and the door that **writes** to it. A guest already holding a `wedding_guest` lead gets no second row; the dedupe exists to refuse that duplicate.

**R-G13.11** — `0137` gives a back-catalogue page its own date, and the create door opens on **event XOR date**. Season stays derived. Strings #26/#27 come out of withholding.

**R-40.72** — `lead_alert_basic` for everyone, **untiered**, capped at ten, both doors. Untiered is derived, not shrugged: the paid template's differentiator is the bride's name, and a wedding-page lead writes `name: null`.

## H3 · DISCLOSURE — THE ERRORS THIS SEAT OWNS

Two belong in the register.

**e-1 · A grep that could not tell a use from a declaration.** F-40.150: `siteBase` was called in the card door with no import, and `git log -S` finds the identifier in **no commit** — it never landed. Two edits shared one script; the second's anchor assertion failed; python aborts before writing, so both were discarded and only the second was re-run. The seat then "verified" with `grep -n siteBase`, which printed the **call site**, and read it as the import. **Three gates and that grep passed a door that could not run** — `node --check` sees syntax, not an undefined free variable; the floor never loaded the router; every cell read source. The room rendered it as *The cards couldn't be made.*, which is what a never-a-false-done line is **for**, and exactly why only a walk found it.

**e-2 · A cell that awaited nothing.** The cure for e-1 was `C6b`, which **invokes** the handler. Its first cut was itself hollow: `src/lib/asyncHandler.js` does `Promise.resolve(fn(...)).catch(next)` and **returns `undefined`**, so `await handle(...)` awaits nothing, resolves a tick early, and reads `status === null` on a door about to answer correctly. Nor does try/catch help — rejections go to `next`. It now waits on the **outcome** with a deadline that counts as failure. Caught only by disbelieving a FAIL on code proven working by hand.

Also on the record: `GET /reel-probe` declared below `GET /:id`, making the literal route unreachable (`node --check` passed it) · five turns of "RUNNING" on a dead floor, `pgrep -f` self-matching (F-40.128) · a killed floor leaving W-1 code mutated (F-40.127) · two false *COUNT PRESERVED* labels, corrected rather than the count · the mint accent nearly patched out of the tree before deriving that `#68C9B4` is the Graphite shell's own ratified token · a dedupe warning that contradicted the seat's own instruction and would have made a correct result look like a defect.

**Found work, attributed:** the `b56 → b57` renumbering and several manifest paragraphs are **not in this seat's record of authoring them**. Verified correct by command and adopted under the chair's ruling; the chair's reading is e-9's class — an interrupted seat cannot tell its own unbanked work from found code. Named that way; certainty not claimed.

**F-40.165** — this arc's new comments carry typographic apostrophes while R-40.57 deliberately left ~1300 comment apostrophes alone. Harmless, but a later sweep audit will read them as already-swept.

## H4 · THE WALK — every line on the founder's glass

Three roll rows from four stored credits, **one** door · WhatsApp on `TDW-MAKEUPBYSWATIROY`, uppercase · **`MAKEUPBYSWATIROY · wedding_team`**, the first lead this estate has written to a vendor who does not own the page · the confirmation carrying **Message Dev Roy Photography**, and the hand-off sending · the tent card downloaded and **its QR scanned to the gallery** · **`Video tools on this server: not detected`** read from inside the running service.

**F-40.16 closed by the surface, not by a shell.**

## H5 · WHAT THE FOUNDER MUST DO

1. Apply rider 4, run the verify, push. **No flag** — R-40.72 ships live, not dark, by ruling.
2. **Walk it**: Book the same team with a fresh number, then confirm both vendors receive `tdw_lead_alert_basic` on WhatsApp. That is the only line of R-40.72 a bench cannot witness.
3. Nothing else. The `wedding-cards` bucket is made; `0137` is run; the templates are approved.

## H6 · OPEN, HANDED FORWARD

**R-40.73 → G3.2** · the accommodation clause — *same hotel, two rooms, by default* — into `TDW_19_CONTRACT_GENERIC_v4`. v3's register is 166 tokens with 132 schema-backed, so a per-booking variable wants a schema-backed source rather than free text; and **v3 is still waiting on the lawyer's yes, so a clause added now rides into that review rather than reopening a closed one.**

**F-40.149 → infra/runner** · `ffmpeg` is not on Railway's image and the image is uncommitted. A Dockerfile/nixpacks change, with the founder's Railway apply as its walk. Until then the reel control is **absent**, not disabled.

**F-40.146 → G5.1** · `b36_leadgate_a_bench` RED, inherited: `leads.wedding_id` unclassified in R-37.4's census since the PAIR regen. Proven not the seat's by stashing and re-running.

**F-40.147 → runner charter (G2)** · `base_guard.sh` compares abbreviated hashes as strings, and `--short` is not fixed-width.

**F-40.148 → Block 09** · R-G13.1 hands the WhatsApp thread to the page's owner and the seat built exactly that, but the alternative was never weighed. A guest whose real interest is the makeup artist gets a lead written for Swati and a thread opened with Dev.

**F-40.113 → Wedding-pages pass** · the blank `STYLED BY · INVITED` row, now visible on glass. Ruled (a): the record lists what is stored, the roll shows what has a name.

**Filed, not taken:** `PEER_REFERRAL_SOURCE` folds into `leadSources.js` in a one-line micro **after G5.1 seals** — that file was a live parallel cut throughout this arc.

## H7 · PROTOCOL ATTESTATION

`docs/TDW_BUILD_PROTOCOL.md` §7 and §11 opened and read in full at the cut. The §7 apply chain, verbatim:

```
unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip
```

No dotfile inside `deploy/`. Both schema documents opened; **this arc reads and writes the `public` plane only and touches no `engine` byte.** W-1 held: `vendorInbound.js` was read and never opened for edit. Every column cited by ordinal with its constraints section (R-40.27). The floor was derived **batched** rather than by one `run-floor.sh` invocation (R-40.63, F-40.128); **the founder's single-invocation run at apply time is the floor of record**, and every cut carried it in its verify. LE holds no write credentials; nothing is banked until the founder pushes.

**Sequencing beyond this sitting is the founder's.**


---

## APPENDIX · THE dream-os-HALF HANDOVER AS COMMITTED AT `d422163`

Kept verbatim so the record of what was true at that seal is not rewritten by
hindsight — including its floor numbers and its own disclosure, which the
sections above extend rather than replace.

# TDW_19 · G1.3 — THE dream-os HALF · HANDOVER

**Base:** `de6be90`, re-derived at origin at the moment of the cut. **Delivery:** `TDW_19_G13_DREAMOS.zip`, `deploy/`-prefixed. **Mock and veto banked at pwa `3d13d65`.**

---

## H1 · WHAT SHIPPED

| File | |
|---|---|
| `db/migrations/0137_wedding_dates.sql` | **NEW · FOUNDER-RUN, before the ZIP.** `weddings.wedding_date` + `wedding_date_precision`; the precision vocabulary copied verbatim from `leads_wedding_date_precision_check`; a PAIR check enforcing `(date IS NULL) = (precision IS NULL)` in the database. |
| `db/migrations/OUT_OF_ORDER.json` | `0137`'s record — the register's **first entry ever**. |
| `src/lib/vendor/leadSources.js` | **NEW.** `WEDDING_GUEST_SOURCE` · `WEDDING_TEAM_SOURCE`, one home (R-G13.2, F-40.111). |
| `src/lib/weddingCardPdf.js` | **NEW.** Pure renderer → `{tent, insert}`. A6 297.64×420.94pt · 4×6 288×432pt. |
| `src/api/public/weddingTeam.js` | **NEW.** `GET` names the team · `POST` writes N leads and 303s to `?team=1`. |
| `src/lib/vendor/weddings.js` | `publicRoll.enquire_link` · `isLinkable` extracted · `teamTargets` · the date columns · the season fallback. |
| `src/api/vendor/studio/weddings.js` | The cards door · the reel probe · the no-event create. |
| `src/api/public/weddingDownload.js` | F-40.111 cured — **the comment moved with the literal**. |
| `src/api/router.js` | `/public/wedding-team` mounted beside the other two public wedding doors. |
| `scripts/b57_g13_team_bench.js` | **NEW.** 76/76 · 10 production mutations, all biting. |
| `scripts/b53_g11_wedding_pages_bench.js` | Three labelled amendments; **132 → 134**. |
| `scripts/b15_schema_register_bench.js` | The floor's one delta, cured: the fixture tip is derived, not pinned. |
| `scripts/floor-batch.sh` · `scripts/floor-manifest-g13-dreamos.txt` | The batched pass and its declared dirt. |

## H2 · THE FLOOR — AND HOW IT WAS DERIVED, IN TERMS

**`FLOOR = NAMED BASE`, no delta. 20 non-green, SET-identical, set compared and not counted.**

**The floor was derived BATCHED, not by one `run-floor.sh` invocation.** A seat's tool call cannot outlive roughly eight minutes; the floor takes about an hour; and backgrounding it reports neither its death nor its result (F-40.128 — five turns of "RUNNING" from a `pgrep -f` that was matching the shell asking the question). Under R-40.63 this seat ran a floor that fits its call: `scripts/floor-batch.sh`, whose classification is **copied** from `run-floor.sh` — `0` green · `1` RED · `2` ERROR · `3` REFUSED · `124` TIMEOUT, by exit code and never by grepping output — over the same glob with the same one exclusion, round-robin so the slow benches cannot all land in one batch. A first whole pass was run and **discarded** (LESSON 1).

**THE FOUNDER'S SINGLE-INVOCATION RUN AT APPLY TIME IS THE FLOOR OF RECORD.** The verify block carries it. The git line waits on his set.

One honest note on method: the clean-base set was measured at `390c144` and the cut set at `de6be90`, because G3.2 pushed twice mid-cut. The two intervening commits touched `contracts`/`templates` files disjoint from this delivery (`comm -12` over both file lists = 0), and their own bench `b56_contract_bench` does not appear in the cut set — so they introduced no non-green. All 14 delivery files were proven **byte-identical across the carry** by sha256 before and after.

## H3 · THE FLOOR'S ONE DELTA, AND WHY THE BENCH WAS WRONG

`ERROR: b15_schema_register_bench` appeared at the cut and not at the base, and it was mine. `b15` feeds the **real** `OUT_OF_ORDER.json` through a **fixture** ladder whose asserted snapshot tip was the literal `'0123'` — correct for exactly as long as the register stayed empty, which per R-34.47 is its goal state and was its state from the day the file was created. **`0137` is the first record it has ever carried**, so the formatter aborted on a lawful entry.

**The bench was wrong about the world, not the record about the law.** Not cured by bumping the constant — that breaks again on the next record and teaches the next seat to bump it too. The fixture tip is now **derived** to sit one above the highest real record; with an empty register it is still `'0123'`. Proven not defanged: a record naming a migration that does not exist still aborts.

## H4 · WHAT THE FOUNDER MUST DO — NUMBERED

1. **Run `0137` in the Supabase SQL editor** — its own paste block, before the ZIP.
2. **Apply the ZIP** per the chain, guard first.
3. **Run the verify block.** It runs `run-floor.sh --delivery scripts/floor-manifest-g13-dreamos.txt --check`. **About an hour. Start it and leave it.** The git line comes only after `FLOOR = NAMED BASE`.
4. **The `wedding-cards` bucket** — already made, private, 2026-09-06. **Done; nothing to do.**
5. `WEDDING_REEL_ENABLED` stays unset. The reel is dark and the probe reports the truth regardless.

## H5 · DISCLOSURE — THE ERRORS THIS SEAT OWNS

- **e-1 · `siteBase` used and never imported.** A `ReferenceError` on the first card tap. `node --check` passed it.
- **e-2 · `GET /reel-probe` declared below `GET /:id`.** Express matches in declaration order, so the literal route was **unreachable** — `/:id` would swallow `reel-probe` and the door would answer a truthful-looking 404 forever, leaving F-40.16 open with a probe that existed and could not be called. `node --check` passed it. **All three of e-1/e-2 and the bench's double `P()` are invisible to a syntax gate; only running and reading route order caught them.**
- **e-3 · Five turns of "RUNNING" on a dead floor.** `pgrep -f run-floor` matched its own command line. A check that confirms itself — the independent-method law's exact violation, in my own polling loop. F-40.128.
- **e-4 · Killing a floor run left production code mutated on the W-1 plane.** `recordPrimitives.ts` carried a harness mutation for 26 minutes; the harness restores only on its happy path. F-40.127, and R-40.32's tree check is what found it.
- **e-5 · "COUNT PRESERVED" written on two labels that moved the count.** Corrected the labels, not the count.
- **e-6 · I called the record's mint button a defect against LD-9's gold.** It is the Graphite shell's own `--atelier-accent-text` (`globals.css:1317`); gold survives as `--role-metal`. I nearly patched a ratified byte out of the tree.
- **e-7 · `0137`'s first header claimed it sat at the tip.** True when written; `0138` landed and ran while this seat built. Caught only by re-deriving the ladder at the cut.

**FOUND WORK, ATTRIBUTED (adopted under the chair's ruling):** the `b56 → b57` renumbering and several paragraphs of `floor-manifest-g13-dreamos.txt` are **not in this seat's record of authoring them**. They were verified correct by command — `b56` really is taken by G3.2, the `router.js` collision was real and both mounts survive, the `recordPrimitives.ts` account checks out. The chair's reading is e-9's class: an interrupted seat cannot tell its own unbanked work from found code, and the edits are exactly what a competent later turn of this seat would have made. Named that way; certainty not claimed.

## H6 · OPEN, HANDED FORWARD

- **The pwa half is untouched** and is the larger half: the door on the roll, the team `<details>`/form and confirmation, the record's two controls, `next build`.
- **`PEER_REFERRAL_SOURCE` folds into `leadSources.js`** in a one-line micro **after G5.1 seals**. Filed, not taken — that file is a live parallel cut.
- **The nameless-credit divergence** (a credit stored and counted but rendered nowhere) is filed for the next Wedding-pages pass, specimen `wedding / styled_by / 2026-09-05 16:50:56.933878+00`.
- **The doubled `styled_by`** — no uniqueness on `(wedding_id, role)`; unnumbered, the chair's to mint.
- **Not one of five guest leads carries a date** — G1.2's "leads with a date" half is unwitnessed in production; unnumbered.
- **The gold rule drifts on paper**: the mock's CSS gradient is a flat 0.5pt hairline at 0.55 opacity in the PDF. Accepted as named.
- **F-40.108 is re-homed to Block 09** — uncloseable under R-G12.10.

## H7 · PROTOCOL ATTESTATION

`docs/TDW_BUILD_PROTOCOL.md` §7 and §11 opened and read in full at `de6be90`. The §7 apply chain, verbatim:

```
unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip
```

No dotfile is placed inside `deploy/`. `docs/db/PUBLIC_SCHEMA.md` and `docs/db/ENGINE_SCHEMA.md` both opened; **this sitting reads and writes the `public` plane only and touches no `engine` byte.** W-1 held: `vendorInbound.js` was read and never opened for edit; no soul, prompt or engine byte moves. Every column in `0137` and in every SELECT is witnessed by ordinal with its constraints section cited (R-40.27), and the snapshot's staleness at ladder `0132` is named. LE holds no write credentials; nothing here is banked until the founder pushes.

**Sequencing beyond this sitting is the founder's.**
