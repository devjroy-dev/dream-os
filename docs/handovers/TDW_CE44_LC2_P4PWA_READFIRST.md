# repo: dream-os @ f3a410536b95cb6ff5ff52fda058a0049f8ea230
# TDW · CE-44 · SEAT LC-2t · PACKET 4, THE PWA HALF · READ-FIRST · 2026-09-18

dreamos-pwa stands at `1db8a88e7b30373e220ae5048bc1f7b4fa0cc68a`, which is the tip this half cuts
on. Rung pwa **b83**.

**Docs-only under C-44.1.** Two paths, this file and its own manifest. Nothing is built here.

**Why this file exists.** This half is sequenced after packet 5, and the derivation for it is
fresh in the seat now. Everything the seat holds goes into the tree so that a re-seat, if one is
ever needed, loses nothing. c-44.12 is the standing lesson: a record held only in chat is a
record the tree does not have.

---

## §1 · THE EIGHT HANDOVERS, AND THEIR BEARING

The seat declared eight pwa LC2 handovers unread at its first message and read them before this
file. What each bears on the half:

**P1.** The `packages` room, `lib/worklist/packages.ts` as the one home for the vetoed bytes, and
`ClientBookingSheet.tsx`. It also carries the standing order this half inherits: the pre-cut note
names every bench the seat's container cannot run, and the founder's floor on the applied tree
comes BEFORE the ZIP is called final.

**P2.** `PackageFields.tsx` and `PackageEditSheet.tsx` are born here, and `PackageEditSheet`'s
labels are the ones F-44.6 reuses: no new word is needed. §3 of that handover lists the eight
failure bytes, `nameGate`, `remainderGate` and `fieldGate` among them, which is the vocabulary
F-44.6's widened sheet refuses in.

**P2b.** `actionButton(tone)` in `PackageFields.tsx` is the shared outlined form. Any control
F-44.6 adds takes that form, not a new one.

**P3C.** `PackageFields.tsx`'s `Sheet` uses `inert` when closed (F-43.89), and the package card
sits at the top of the lead detail through `DetailSheet`'s `detailTop` slot. F-43.94 cured
`ClientBookingSheet` the same way at P3D.

**P3D.** `F-43.97 (a)` fixed the card's control column: `Attach package` / `Change package` full
width, then `Booking confirmed` and `Advance paid` as an exactly equal pair. F-44.6's five fields
go inside the attach sheet, not into that column, so the ruled layout is untouched.

**P3E.** `AttachSheet` is **exported from `LeadPackageCard.tsx` and reused, never copied**
(F-43.102). So F-44.6 widens one sheet and every route into it gains the fields at once: the
card, the Leads swipe, and the booking sheet's own attach. This is the single most important
fact in this section.

**P3H.** `Package attached.` is the vetoed toast on a successful attach or change
(`LEAD_PACKAGE.attached`), and the lead detail sheet opens at full height on leads only.

**P3K.** `SheetLayer.tsx` carries the depth's z-index and the shell skin, so any sheet this half
touches inherits the room's palette and stacks correctly. The seat does not go near that file.

---

## §2 · F-44.6 · THE ATTACH SHEET MIRRORS THE PACKAGE SHEET

The founder, verbatim: *"the change package button does not give an option of altering the
payment schedule. it doesnt mirror the package page. i had to change package from package room,
then change package on the lead."*

**The sheet's five missing fields.** `AttachSheet` in `LeadPackageCard.tsx` renders the package
picker, **Fee**, the handover date when the basis is handover, and then `IdentityFields` (name,
description, items). `PackageEditSheet.tsx` renders those plus `deposit_pct`, `middle_pct`, the
`Take a middle payment` toggle, `delivery_basis` and `delivery_days`. Those five are what the
attach sheet gains, for this couple only, with `PackageEditSheet`'s own labels and **no new
word**.

**IT IS NOT PWA-ONLY.** `src/api/vendor/leadPackages.js:97` overlays only four body keys:

```js
const merged = { ...pkg };
for (const k of ['name', 'description', 'line_items', 'total']) {
  if (Object.prototype.hasOwnProperty.call(body, k)) merged[k] = body[k];
}
```

The five are never read from the body; they come from `pkg`, the vendor's own package row. A
sheet that sent them today would have them **silently ignored**, which is a worse shape than not
offering them. `SNAPSHOT_KEYS` at `:45` does carry all eight, so the record is per-couple-capable
and only the door is short. `EDITABLE` at `:47` is short in the same way for the PATCH route.

c-44.13, the chair's: the chair ruled F-44.6 as "only the sheet is short" from `SNAPSHOT_KEYS`
alone and never read the overlay. **F-44.6 is amended: it needs a dream-os byte**, and that byte
is packet 5's, ahead of this half.

**Downstream is already right.** `validatePackage` in `src/api/vendor/packages.js` is the one
home and already validates all five: `deposit_pct` 1 to 99, `middle_enabled` a boolean,
`middle_pct` 1 to 98, the remainder gate where the shares reach 100, and `BASES` for
`delivery_basis`. `computeSchedule` rebuilds `lp.schedule` from `v.row`'s shares, so a widened
overlay rebuilds the schedule with no second code path. No new validation, no new formatter, no
new byte.

---

## §3 · F-44.3 · ONE SITE, SWEPT

`SliceShell.tsx:1224` builds the missing-detail chip label as `cap(c.replace(/_/g, ' '))`, and
`cap()` at `SliceRow.tsx:217` capitalises every word, so the raw column name reaches the glass as
`+ Wedding Date` while the sheet it opens says `+ Wedding date`.

**The sweep found no second site.** `cap()` on a **cell key** appears at `:1224` and nowhere else.
The other uses are on values and are correct by `SliceRow.tsx:74` to `:82`'s own ruling:
`DetailSheet.tsx:98` title-cases a detail value, `BinderCard.tsx:302` and `:311` a state and a
stage.

The cure is the call at `:1224` reading `chipLabel(cell)` from `WishboneSheet.tsx:44`, which
already falls back to the same `cap(...)` for a cell with no `FIELD_META` entry, so the two agree
on everything else. One line. Cells read the label off the rendered DOM inside the room, never
off source.

---

## §4 · R-44.10 · THE KEYBOARD RULE, AND THE UNLAWFUL ADVANCE

The chair put the rule to the founder in these words: *"the keyboard comes up only when she
tapped something that names the field, and never just because a sheet opened."* The founder,
verbatim, 2026-09-18: *"yes."* F-43.121 is amended to that rule.

**The sweep.** Lawful, because focus follows a tap or a refusal that names the field:
`PackageEditSheet.tsx:68` (`feeRef` on `focusFee`), `LeadPackageCard.tsx:193` and
`BookingSheet.tsx:102` (on a refusal code), `ClientBookingSheet.tsx:193` (on `NeedFirst`), and
`WishboneSheet.tsx:165` **on opening**, because every route names its cell. Cured:
`ForwardSheet.tsx:153` loses its `autoFocus`. Out of scope: `NotesBody.tsx:266`, not a sheet.

**The opening tap is lawful on every route**, derived: `wishboneStart` is set by `MissingChips`'
`onPick` at `SliceShell.tsx:1225` and read at `WishboneSheet.tsx:67`, so the sheet opens on the
cell the vendor named; the `dateFix` mount at `SliceShell.tsx:2096` opens on `wedding_date`
alone.

**THE ADVANCE IS NOT.** `WishboneSheet.tsx:111` to `:115`, inside `save()`:

```js
const rest = remaining.filter(c => c !== active);
setRemaining(rest);
setValue('');
if (rest.length === 0) { onDone(); return; }
setActive(rest[0]);
```

After a cell is filed the sheet advances to the next missing cell by itself, and the input
re-renders with `autoFocus` at `:165`. **The keyboard returns for a field the vendor never
tapped.** No reading of the mounts could have found this; it is in the save path.

**Two options, as put to the founder, neither built:**

1. The sheet advances and shows the next cell with **no focus**; she taps the field to type. The
   chair's lean.
2. The sheet **closes** after each save and the chips remain on the lead.

**His word is pending. No cell is written for the advance until he answers.**

**The cell is drawn from the RULE, not from a list of sites** (chair): driven in the real room
under C-43.18, a sheet opened without a naming tap leaves `document.activeElement` outside every
input, and each naming tap lands focus in the field it named. **A cell that greps for the
`autoFocus` attribute proves nothing about the programmatic sites and is not accepted.**

---

## §5 · F-43.122, AND WHAT F-43.76 STILL OWNS

**F-43.122's cure.** Three pwa date-write routes. `SliceShell.tsx:2102`, the `dateFix` route,
already sends `wedding_date_precision: 'day'`. The TDW_04 wishbone at `:2119` builds
`{ [cell]: value }` from the cell key alone and **cannot carry a precision at all** — driven in a
browser during F-43.117's probe, where it PATCHed `{"wedding_date":"2027-03-14"}` with no
precision. Ruled: when the cell is `wedding_date` and a full date is filed, that body carries
`wedding_date_precision: 'day'`, so all three routes store day and one cell asserts it on all
three.

**F-43.76 IS NOT LANDED BY THAT, and the record says so here.** c-44.15, the chair's: the chair
ruled that curing the wishbone route "lands the rest of F-43.76" from the seat's one-line summary
of that finding and not from its text.

`src/lib/draftContracts.js:17` counts a cell absent only when it is `null`, `undefined` or `''`:

```js
return LEAD_EXPECTED.filter((f) => row[f] == null || row[f] === '');
```

A month-precision wedding date is a **present** value. It is never in `draft.missing`, so no chip
offers it and the wishbone sheet never shows that cell. **F-43.122's cure there lands nothing of
F-43.76.**

**What remains for LC-3, exactly:** a route to the exact-date cell for a lead carrying a month-
or year-precision date **outside the attach and booking flow**. The pre-fill exists
(`openDateFix` reads the lead and pre-fills through `initialValues`; P3F's F-43.76 pre-fill,
benched at b82 §13.5 and §13.8) and the `day` stamp exists. The way in does not: `dateFix` is
reachable only from the booking sheet's `+ Wedding date` chip and the attach sheet's `Add the
wedding date first.` line, both of which appear because `attachNeeds` wants day precision. The
likely shape is a dream-os byte on a door LC-3 owns, since `leadMissing` or its caller would have
to treat an inexact date as incomplete. **Named, not proposed.** This paragraph is repeated in the
pwa half's handover.

---

## §6 · F-44.4 · THE VERSION PINS

`dreamos-pwa/package.json` at `1db8a88e` carries `@sparticuz/chromium` **149.0.0** and
`puppeteer-core` **25.9.0** as devDependencies. `docs/handovers/TDW_CE43_LC2_P3L_HANDOVER.md`
records the C-43.18 method as **131** and **23**. A docs correction on the P3L handover, riding
this half.

Recorded beside the method: seat LC-2t drove C-43.18 through the container's **Playwright
Chromium 1194** binary via `puppeteer-core` rather than `chromium.executablePath()`. The same
instrument by a different door, accepted by the chair at CE-44.

---

## §7 · THE iOS CARD'S ADDED SELECT · F-43.117

Cards 3j and 3l stay open until the founder's iOS handset witnesses them. F-43.117 closed as not
reproducible at `1db8a88e`, with the two remaining routes driven in the real room and both
writing correctly with precision `day`. The seat's container proved the PATCH goes out with the
right body; it never proved the estate stored it.

So the iOS card gains **one SELECT**, after the booking sheet's `+ Wedding date` step, on the
lead's `wedding_date` and `wedding_date_precision`, resolved by a test number, with a control row
per C-44.4 so an empty answer cannot be mistaken for a broken join.

---

## §8 · WHAT THIS HALF WILL OWE AT ITS CUT

The pre-cut note naming every bench the seat's container cannot run, and the founder's floor on
the applied tree before the ZIP is called final (P1's standing order). The mock, where glass
changes, goes to the founder through the chair before any byte. The F-44.6 sheet cannot be
benched honestly until packet 5's route byte is at origin, since a sheet that sends five fields
to a four-key overlay proves nothing.

**No collision with LC-Victor.** LCV-1's P3 will touch `app/vendor/(shell)/WorklistBoot.tsx`, the
pin-login page and the advisor page. None is in this half, whose files are `SliceShell.tsx`,
`WishboneSheet.tsx`, `LeadPackageCard.tsx`, `PackageFields.tsx`, `PackageEditSheet.tsx`,
`ForwardSheet.tsx` and `lib/worklist/packages.ts`.

**The slot rule holds** (c-44.14): one outstanding delivery per repo, the slot asked of the chair
before any ZIP, the tip re-derived at the moment of cutting and named in the guard.

Sequencing beyond this sitting is the founder's.
