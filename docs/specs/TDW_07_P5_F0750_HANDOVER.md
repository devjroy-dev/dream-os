# TDW_07 P5 — F-07.50: THE APPROVED TEMPLATE POINTED AT A 404 · EXECUTOR HANDOVER
**Base:** `dream-os @ d24e62b` · **Executor:** Opus-LE · **Date:** 2026-07-31
**Class:** MY OWN DEFECT, found while authoring the walk that would have exercised it.

---

## 1 · THE DISEASE

`enquire.js` passed `'https://thedreamwedding.in/vendor/leads'` as `{{3}}` to
`enquiry_alert_vendor`. **That route does not exist.** Derived by command against
`dreamos-pwa @ 5c16261`:

- `find app/vendor -name page.tsx` lists `/vendor/discover/leads`; there is **no**
  `/vendor/leads`.
- No rewrite or redirect in `next.config.ts` or `middleware.ts`.
- The app's own `components/vendor/BottomNav.tsx:104` links Leads to
  `/vendor/discover/leads`.

**Severity.** Meta APPROVED `tdw_enquiry_alert_vendor` on 2026-07-31 and sendWa now
dispatches it. Every out-of-window vendor would have received a real message
containing a dead link. That is the costume class **delivered by an approved
template** — strictly worse than the silence F-07.40 was minted to end, because the
vendor acts on it and lands nowhere.

## 2 · HOW IT HAPPENED, OWNED

The retired seat drafted the BODY with `{{3}}` as a variable — correct. I filled that
variable when wiring the fallback and **authored the path from the shape of the
sentence rather than from the route table.** Every other identifier in this sitting
was derived by command; this one I typed. It then travelled through my own veto block,
the founder's Meta filing, and an approval, unchallenged at every step, because a
plausible URL looks like a derived one.

It surfaced only because writing the walk forced me to ask what the vendor would tap.

## 3 · THE FIX IS CODE, NOT META

`{{3}}` is a template VARIABLE. The approved body is untouched and **no refiling is
needed** — only the value passed. One named home (`VENDOR_LEADS_URL`), and it is
pinned by a bench rather than trusted.

## 4 · PROOF

```
CURED    b07_p5_bench  83 passed, 0 failed  (83)
UNCURED  b07_p5_bench  82 passed,  1 failed (83)   ← §12.1 at d24e62b
```

§12.2 resolves the URL against the pwa's real route table; §12.3 is a tripwire that
reddens if `/vendor/leads` is ever created too, so nobody ships two Leads pages
drifting apart. Both are cross-repo and skip with a named reason where the sibling
tree is absent (the `b07_p1_bench.js:349` convention).

## 5 · THE LESSON, NAMED

**A URL is an identifier and the SQL-provenance law's reasoning applies to it whole:**
a path with no witness is an assumption, and a plausible one is more dangerous than an
obviously wrong one because it survives review. Any string this estate hands to a
customer as a destination — route, deep link, claim link — is derived from the route
table or the schema, never composed.

Worth noting `claimLinkFor` (demoLeadAlert) builds `{{3}}` for the demo template the
same way. It was NOT audited in this sitting; it is named here as the obvious next
place to look.

---

# ADDENDUM — F-07.51: TWO GUARDS, ONE FACT (found by the founder's red)

## THE SPECIMEN
The founder's paste: `79 passed, 1 failed (total 80)`, failing `§12.2 that URL
resolves to a REAL Next route`. **His tree was correct; the bench was wrong.**

`total 80` means §9's three cells SKIPPED while §12's two RAN — in the same process,
about the same sibling repo. Because:

- §9 probed a **FILE** (`app/(frost)/frost/canvas/discover/page.tsx`)
- §12 probed a **DIRECTORY** (`../dreamos-pwa`)

A `/workspaces/dreamos-pwa` that exists but is empty, partial, or is some other
checkout satisfies the second and not the first. **Two guards asking two questions
about one fact is how a bench reports a defect the tree does not have** — and it is
the same family as the vacuity this file has already paid for twice.

## THE CURE
ONE guard, asked once, keyed on the **witnessed package name** (`"name": "web"`) —
the identical string the repo head-guard law (§10) puts in every apply block. A
directory that cannot produce that byte is not the pwa tree, whatever it is called.
Both sections now read `PWA_VISIBLE`.

## PROVEN IN THREE TREE SHAPES
```
A. no sibling at all      → both sections skip → 78 passed, 0 failed
B. EMPTY sibling dir      → both sections skip → 78 passed, 0 failed   ← the founder's shape
C. real sibling tree      → all cells run      → 83 passed, 0 failed
```
Shape B is the one that produced his red and now produces a clean skip.

## THE LESSON
A SKIP GUARD IS PART OF THE BENCH AND GETS THE SAME DISCIPLINE AS A CELL. Two
existence checks for one precondition drift the moment either is edited, and the
failure mode is the worst kind: a red that sends the founder looking at correct code.
Any future cross-repo section uses `PWA_VISIBLE` and adds no second probe.

**Credited: the founder's STOP.** D-10 held, the paste came back, and the bench was
corrected instead of the tree.
