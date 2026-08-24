# M-LEADGATE-A — EXECUTOR HANDOVER
**Seat:** LE · **Repo:** dream-os ONLY · **Base:** `ec828c8` (fetch-first at the seat's own clone; charter named `747bd19`, the CE-225 docs push sat one above as expected) · **Rulings:** R-36.8 · R-36.10 · F1–F6 (chair, this sitting)

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `src/lib/vendor/leadSerializer.js` | **NEW** | The tier gate's one home. Allowlist. Read-time. |
| `src/api/vendor/leads.js` | modified | Both doors read through the gate |
| `src/api/couple/enquire.js` | modified | Alert tier-switched on **both** legs; `tier` joins the SELECT |
| `src/lib/templates.js` | modified | `lead_alert_basic` registry entry, from the wire paste |
| `scripts/b36_leadgate_a_bench.js` | **NEW** | 57 cells, payload-proof |
| `scripts/floor-manifest-m-leadgate-a.txt` | **NEW** | This delivery's declared-dirt table |

**No migration. No SQL runs in this delivery.** `0130` remains next-free.

---

## 2 · THE THREE THINGS THAT ARE NOT WHAT THE CHARTER EXPECTED

**① THE SERIALIZER IS AN ALLOWLIST, AND IT HAD TO BE.** The charter named two fields (name, phone). The doors carry **six identity vectors**:

1. `lead.name / .phone / .email` — direct
2. `lead.raw_message` — **her name in prose** (`enquire.js:504`)
3. `lead.referrer_name`
4. `client` — an entire second identity object (`lib/vendor/leads.js:205-213`)
5. `conversation` — up to 20 raw couple-thread message bodies (`:215-239`)
6. **`draft.tell_victor.primer`** — her name nested two levels down, **on the LIST door** (`leads.js:68`)

№6 is the one that matters most: nothing about the key `draft` says "name". A denylist would have passed its bench and shipped her name. **Mutation M1 proves this by execution** — the denylist variant leaks `Priya Sharma` through `raw_message` and `draft`, measured, not argued.

**② THE OOW LEG WAS LEAKING TOO, AND ITS "SAFETY" WAS AN ACCIDENT.** `enquiry_alert_vendor`'s `{{2}}` is her name. Its old fallback `brideNameFinal || 'a couple'` made the template *degrade to anonymity when hydration failed* — the policy's shape arriving as a bug's side-effect, on a path nobody chose it for, and the first successful hydration would have silently ended it. Replaced by the deliberate template. (Chair-owned as **c-36.8**; the charter omitted this leg.)

**③ F-08.104 — THE APPROVED TEMPLATE CARRIES A STRAY `"`, AND THE OBVIOUS FIX IS A TRAP.**
Verified three ways: Meta's counter reads 127 · my transcription measures 127 · the rendered output is byte-identical to the founder's preview.
`docs/TEMPLATES.md:19` forbids a body **ending with a variable**. Delete the quote and the body ends `{{3}}`. **The stray character is accidentally load-bearing.** The cure is a real trailing clause, not a deletion — and it re-submits the template to review, dropping it out of `Active`, which `isApproved` gates on. **It rides its own micro AFTER the walk.** Bench cells pin the 127 and the quote so a future tidy-up reds instead of shipping a rejection.

---

## 3 · PROOF

- **`b36_leadgate_a_bench` 57/57** at the cured tree.
- **Non-vacuity by FIVE mutations of production code** (never test setup), each biting only its own cure:

| Mutation | Cells bitten |
|---|---|
| M1 allowlist → denylist on {name,phone} | 6 — incl. the payload-proof leak of `Priya Sharma` |
| M2 R-36.10 inverted (unknown → essential) | 5 |
| M3 the trailing quote "tidied away" | 4 |
| M4 gate redacts every tier | 8 — the essential+ regression |
| M5 serializer mutates its input | 3 — history destroyed at read time |

- **Essential+ proven UNMOVED**: list row and detail envelope both `JSON.stringify`-identical to the ungated shape, for all three paying tiers. The full-access body expression is textually the same line as before this sitting.
- **The tier flip both ways**: one stored row, two tiers, two answers — only possible because redaction is read-time. Plus a cell asserting the serializer mutates nothing.
- **FLOOR: 20 REDs vs `scripts/floor-base.txt`'s 20. ZERO DELTA, NAMED BASE exactly.** Run in `--delivery` mode; declared files verified unmoved by hash before and after.

**EXECUTOR DEFECT, OWNED — THE MANIFEST SHIPPED ONE PATH SHORT (ZIP 1 → ZIP 2).**
The first cut of `floor-manifest-m-leadgate-a.txt` declared six paths while the delivery carried seven: **the handover itself was omitted.** The founder's verify refused with `STOP — dirt OUTSIDE the declared manifest`, D-10 held, and nothing was pushed.

The cause is an ORDERING fault, not a typo, and it is the part worth keeping: **the floor was measured BEFORE this handover was authored.** The measuring tree held six files; the shipped tree held seven. The zero-delta number in the first delivery was therefore true of a tree that never shipped — a green measured over the wrong tree, which is the hollow-green class in miniature. The manifest guard caught what the seat's sequencing should have.

**The standing correction: the manifest is cut from the DELIVERY's file list, and the floor is measured LAST, on the tree that actually goes into the ZIP.** A handover is a delivered file and dirties the tree like any other. Floor re-run on the true seven-file tree: **20 REDs, zero delta**, quoted above and now honestly earned.
- Engine built first (`npm run build`, RC=0). The `SUPABASE_URL` throw on a bare `require` is **pre-existing** — reproduced identically at the untouched tip `ec828c8` on a control clone.

---

## 4 · DECLARED GAPS AND UNRULED ARMS

- **`wedding_date` / `wedding_city` / `budget_total` SURVIVE on the basic list wire.** The ruled subject is identity; F5 struck enrichment from the *alert* specifically. These carry no identity, already ship today, and give Seat B a locked card with something true to say. **Stripping them would be new policy this seat has no ruling for — reported, not decided** (UNRULED-ARM LAW). One array edit if the chair wants bare existence.
- **The A→B window**, chair-accepted: until Seat B's locked wall lands, a basic vendor's page renders the redacted wire's absences plainly. Degraded, honest, strictly less leaky than today.
- **F-10.122 stands open** — the agent lane is closed by a *mutable dial*, not by construction. The sequencing law is written **in-comment at the serializer's head** as well as in the band, so the next sitting that touches this file is forced past the condition.
- `snapshot.js:95` selects `budget_total` from `public.leads`; the witnessed 27 columns do not carry it. Recorded at read-first, **not chased** — out of radius.

---

## 5 · OWED BEFORE THE WALK

**The founder-run fixture SELECT (three blocks, already in chat) has NOT been pasted back.** Per the FIXTURE-STATE LAW the smoke card is authored **from those rows and not before** — so **no card ships in this ZIP**, deliberately. The tier hand-flip SQL travels with the card, not beside it (conditional-withheld).

Walk shape, once the rows land: flip `9888294440` → basic · enquire from a couple account via Discover · **his WhatsApp shows the redacted alert, no name, no phone** (screenshot) · his Business Leads shows the redacted wire · flip back to his witnessed prior tier, reload, identity returns (screenshot).

**This seat proves the WIRE only.** The page renders whatever the serializer sends; the locked card is Seat B's. Named as the declared gap it is.
