# TDW · BLOCK 19 G3.2 · SITTING 3 — JOURNEY AUDIT AND READ-FIRST

**Seat:** designer-LE · Fable · 2026-09-07
**Tips, re-derived at open (not the kickoff's):** `dreamos-pwa 82612b38` · `dream-os 3b6ded3`
**Fixture:** MAKEUPBYSWATIROY (DROY550), category `makeup`, empty `contract_profiles` row.
**Honesty line:** this seat has no phone and no session. "From the glass" below is derived from `app/vendor/(shell)/contracts/screen.tsx` at `82612b38`, screen by screen, with every state the code can draw. Where a claim needs a live tap to confirm it is marked **[unwalked]**.

---

## 1 · THE JOURNEY TODAY — every tap she must make, numbered

Swati opens Contracts to send her first agreement to a couple she spoke to on WhatsApp this morning. She has their name and number, nothing else.

1. **Room opens on an empty list.** The empty state reads *No contracts yet. Tap the + to upload your first.* — the word is **upload**; nothing tells her she can fill one. Her policies are not mentioned anywhere on this screen. `screen.tsx:1136`.
2. **She taps `+ New contract`.** A sheet forks: *Fill the standard agreement* / *Upload my own PDF*, with the note *You fill your prices and policies once.* She has not seen what "the standard agreement" says and there is no door to read it. `:1215`.
3. **She taps *Fill the standard agreement*** → the client picker. Title *Your client*. For her the list is `No one to choose from yet. Add a client, or book someone in your Cabinet.` **She is stranded.** There is no name-and-number door; the only exits are the Clients room or the Cabinet, both outside this room. `:1247`. (`composeContract` already accepts `{name, phone}` and promotes through `resolveOrCreateClient` — the mechanism exists; the door does not. R-G32.17.)
4. **Assume she has a client.** She taps the row → `POST /compose` → the record sheet opens with title *The agreement* and the state word `DRAFT` above it. No progress line: she cannot see how many steps stand between here and a signed contract.
5. **Group *Who this is between*.** Three rows: *Your client* (read-only), *Her number* with the tag `NEEDED TO SEND`, *Second partner's name*. Two notes under them say the same thing twice (*Filled from your client's record…* / *We send the agreement here…*). `:1329–1339`.
6. **Group *The dates*.** Two fields: *Venue*, *City*. **Both are dead.** They write `terms.venue` / `terms.city`; the renderer reads `T.functions[event.id].venue/.city` and never the flat keys (census: zero reads). What she types here prints nowhere. `:1346–1349`, `contractPdf.js:572–589`.
7. **There is no way to enter a function or a date at all.** The paper's clause 3 table comes from `public.events` reached through a lead (`contractSource.js:192`). A client made without a lead reaches no events; the paper prints *The functions and their venues are set out in the annexes* and the record's own checklist row *Functions and dates* reads `Not filled` forever. **Send is absent for every such contract, with nothing on screen saying why** (the "absence is the refusal" posture at `:1442` was ruled for a blank she can fill; this blank she cannot). The source cites **F-40.117** for this; the number is not in `FINDINGS_LOG.md` — chair to confirm or allocate.
8. **Group *Money*.** *Fee* and *Deposit* with two notes: *30% holds the dates. Change it if you want.* / *Add your GSTIN to print the tax block.* The GSTIN line is about tax and sits under money; it is repeated a third time inside the policies sheet.
9. **Group *Annexes*.** A three-line explanation that mentions *clause 2.2* — a clause number she has never read. For makeup the offered list is one row (*Makeup and hair* · `NOT ATTACHED`) then a heading *Add another* over six more, then a further note mentioning *Annex G*. She must tap the one row to attach her own trade's annex; **nothing is attached by default**, so a makeup artist who does not tap prints an agreement whose clause 2.1 lists no services. `:1367–1397`.
10. **Group *Set your policies once*** — a card sitting **below** the annexes, on the record, i.e. after she has already been asked for fee and deposit. The brief wants it first and persistent. The button repeats the heading verbatim. `:1399`.
11. **She taps it → the policies sheet.** Title *Your policies*, twenty-two rows for makeup (six delivery rows omitted). Labels: *What you do · Who signs · Credited as · Never included · Meals on a long day · Travel and stay · Extra hours (Rs) · Charged per · Late after (days) · Late charge (% per month) · Postpone notice (days) · Move within (months) · More than 90 days before (% you keep) · 60–90 · 30–60 · Under 30 · Refund within (days) · Is the deposit refundable? · Take down within (days) · Move dates within (months) · GST · Rate (%)*. **Not one row carries a meaning line.** She cannot tell *Move within (months)* from *Move dates within (months)* — they are clause 6.1 and clause 11.3 — and *Credited as* seeds `makeup` with no hint that it is her credit on the couple's wedding page. Each row carries a small-caps mark `YOURS / DEFAULT / NEEDED` that names provenance, not meaning.
12. **The on-the-day hint** reads *Your trade hands over on the day, so the gallery, revision and archive rows are not asked — and clause 7 prints without them.* Register voice, clause number, three nouns from photography. `:1541`.
13. **Travel and stay is a text row** seeded *at actual cost, agreed first* — but the paper's clause 5.2 reads two further tokens, `same_venue` and `rooms`, that **this sheet never asks**. So 5.2 is omitted whole on every agreement (R-40.88) and 5.3 prints alone: *Travel is provided or reimbursed on the following terms: at actual cost, agreed first.* Accommodation — the thing R-40.73 ruled two rooms for — never reaches the paper. `contractPdf.js:411`, register v2 :162–164.
14. **She saves → back on the record.** Nothing on the record shows her policies; to see them she must reopen the sheet. There is no *these apply to this couple* view and no per-couple override of a policy value — only the six clause switches at *What she receives*.
15. **Group *The agreement*.** Two rows and two buttons: *What she receives* · *What Priya will receive* (her client's first name) · *Preview the PDF* (ghost) · then either *Send to the couple* or the line *Add her number to send this.* or **nothing at all** (four of six missing fields draw no sentence, `:1447`). The two rows' titles do not say what they open: one is clause switches, one is a checklist.
16. **Preview the PDF** opens a new tab with a rendered PDF — the only reading of the agreement available, and it needs a contract to exist first. There is no *see the standard agreement* before she starts (brief §2, "the door that was never built").
17. ***What she receives*** (clause switches). Rows *Accommodation and travel* (only when a function is outside her city — which, per item 7, can never be true for a phone-number client), *Late payment charge*, *Extra hours*, *Tax block* (*Absent — add your GSTIN in Settings*), *A named professional*, *Portfolio use*. Each row is a control reading `PRINTED / NOT PRINTED`. The head says *Always printed* over *Parties, dates, fee, deposit · Required*. Register voice throughout.
18. ***What Priya will receive*** (checklist). Six rows under *Needed before you can send*: *Her number · Functions and dates · Fee · Deposit · Who signs for you* (+ *Delivered within* for a days trade). Row 2 is unfillable (item 7).
19. **Save and finish later** — the only way to close the record with her typing kept. Tapping the scrim also closes it, **discarding unsaved fee/deposit/partner edits** (annexes and switches save on tap; text fields save only on the button). `:1310` `onClick={() => setRecord(null)}`.
20. **Sent.** After Send the list row shows `SENT`; tapping it goes back to the **record** (item 4 route: composed + not signed → `openRecord`), not to a status. There is no *the couple has it / she signed / deposit received / date held* line anywhere on the record; those live on the **old detail sheet**, which a composed draft/sent contract can no longer reach from the list. `:1147`.
21. **Signed.** Tapping a signed row opens the old detail sheet: *Awaiting Rs N* · *She pays you directly — UPI or bank…* · *Mark the deposit received* · *Preview the PDF* · *Download* · *Cancel*. This is the only screen where *The date is held.* can appear.
22. **Words she meets that are not hers:** clause 2.2, Annex G, tax block, GSTIN (three times), register, `NEEDED TO SEND`, `PRINTED`, `YOURS/DEFAULT/NEEDED`, *hands over on the day*, *Move within* vs *Move dates within*, `on_the_day`-derived phrasing, "Cabinet", the § glyph on every list row.

**Count:** to send one agreement to a new number today she needs a detour out of the room (Clients or Cabinet) to create the person, then at minimum: `+` → fork → picker → row → policies card → 22 rows → Save → fee → deposit → annex tap → number → Save and finish later → reopen → *What Priya will receive* → and then **Send never appears** because *Functions and dates* cannot be filled. **The five-minute card is not passable at `82612b38` for a new number.** [unwalked on glass; derived from the gate at `:1440` and the empty writer census]

---

## 2 · THE MECHANISM THAT EXISTS (real shapes the prototype uses)

| Door / home | Shape | Used by the prototype as |
|---|---|---|
| `POST /compose` `{client_id}` or `{name, phone}` → `{contract, promoted}` | promotes through `resolveOrCreateClient`, dedups on phone | *Someone new* door — mechanism already there, R-G32.17 |
| `PATCH /:id/fill` `{terms, annexes, deposit_pct}` | `terms` jsonb, `terms.clauses` booleans, `terms.functions` keyed by event id | the record's writes; **needs a manual functions arm** (see §3) |
| `GET/POST /profile/fields` | one jsonb, no key whitelist at the door | policies sheet |
| `GET /annex-map` → `{mapped, offered, others, seeded, delivery_basis, defaults, placeholders, omitted}` | `contractAnnex.js` | seeds, omitted rows, on-the-day |
| `POST /:id/preview` → `{pdf_url}` | renders through `renderContract` | Preview |
| `POST /:id/send-to-couple` → `{sign_url, sent:false}` while `CONTRACT_SIGN_SEND_ENABLED` unset | link to clipboard | Send (honest "link copied" state kept) |
| `POST /:id/deposit` | sets `deposit_received_at` | Deposit received → date held |
| `contractAnnex.js TRADE_DEFAULTS.makeup` | `on_the_day`, credit `makeup`, exclusions `false lashes, hair extensions`, overtime 4000 | fixture seeds |
| Renderer tokens for clause 5 | `same_venue`, `rooms`, `travel_terms` (P) | collapse to `travel_and_stay_terms` (brief §2) |
| `clients.phone` | one home; `updateClientPhone` | number on the record writes to the client |
| Graphite tokens | `docs/mocks/contract-document-mock.html:30` (`.wl[data-wl-mode]`) | copied verbatim into the prototype |

---

## 3 · WHERE THE JOURNEY CONTRADICTS A RULING — named, for the chair to re-rule

| # | The brief needs | The standing thing | Proposed |
|---|---|---|---|
| C1 | Functions and dates entered on the record for a client with no lead | Clause 3 reads only `public.events` via lead; `terms.functions` has no writer; source file names `functions_manual` as "the composer's answer" but the renderer does not read it | A **manual functions arm**: `terms.functions_manual: [{title, date, time, venue, city}]`, read by `dateTable()` when `fns` is empty and by the clause 5 gate. Events-linked contracts keep the events path. New door bytes only where the brief's journey needs them — this is that place. |
| C2 | Travel and accommodation as one free-text field | Register v2 §5: `same_venue`, `rooms` (R-40.73 defaults), `travel_terms` — three tokens; clause 5.2 and 5.3 two sentences | Register v3 delta: retire `same_venue`, `rooms`; rename `travel_terms` → `travel_and_stay_terms`; clause 5.2+5.3 become one sentence *Travel and accommodation are provided on the following terms: {travel_and_stay_terms}.* The **substance** is the lawyer's (R-40.106) — merging two sub-clauses into one is a wording change the chair must clear with the lawyer's yes or rule it within it. R-40.73's *two rooms at the same hotel* survives as the **seed sentence**, not as a token. |
| C3 | Policies card first and persistent, on the room | R-G32.20 draws it on every record, below annexes | Card moves to the top of the room's list; stays on the record as the *These are your policies* section (C4). Not a contradiction of R-G32.20's reason, a relocation. |
| C4 | Her policies on the contract, editable for this couple only | `contract_profiles.fields` is read at render (`P.*`); no per-contract override exists | `terms.policy_overrides` (same keys as the profile); the renderer reads `{...profile, ...terms.policy_overrides}` as `P`. One sheet, two homes by design: the profile is hers once, the override is this couple's. |
| C5 | *See the standard agreement* before any record exists | Preview needs a contract id; renderer needs a row | A vendor-scoped read `GET /contracts/standard` that renders v4 with **labelled placeholders** (`[your fee]`, `[the couple's names]`, …) — same renderer, a placeholder source. No contract row is created. |
| C6 | Plain register on every surface | 43 vetoed rows (G32V4_VETO_SHEET) and Q1–Q10 are ratified bytes | Everything ratified before is input (kickoff §3); every byte in the prototype is offered for re-veto **on the prototype**. |
| C7 | Her own trade's annex attached by default | Annex chooser starts all-off | Offered annexes start **attached** for a mapped trade; she can detach. A makeup artist's clause 2.1 should never list nothing by default. |
| C8 | Progress line | State machine is `draft · sent · signed · cancelled` (`contracts_state_check`) + `deposit_received_at` | No schema change: the line is derived — Policies (profile non-empty) → This agreement (draft) → Sent → Signed → Deposit received → Date held. |
| C9 | Scrim tap discards typing | `:1310` | Record autosaves text fields on blur (debounced `fill`), so there is no unsaved state to lose. Save-and-finish-later retires. |

---

## 4 · FINDINGS FOR THE CHAIR TO ALLOCATE (never self-minted)

- **f-A** `terms.venue` / `terms.city` on the record are written and never read (`screen.tsx:1346–1349` vs `contractPdf.js` census 0). Two dead fields on the vendor's first screen.
- **f-B** For any composed contract whose client has no lead-linked events, `requiredRows` row 2 is unfillable from any surface, so Send is unreachable and nothing says so. Source cites F-40.117; not in the log.
- **f-C** Profile sheet never asks `same_venue` / `rooms`; clause 5.2 omitted on every agreement; R-40.73's ruling has never reached paper.
- **f-D** Composed `sent` contracts route to the record, not the detail sheet, so the post-send states (signed / deposit / date held) are unreachable for them from the list until `signed`.
- **f-E** Record sheet's scrim tap discards unsaved fee/deposit/partner edits.

---

## 5 · WHAT THE PROTOTYPE ANSWERS

`G32_S3_PROTOTYPE.html` — one file, Graphite tokens copied from the ratified mock, 374 × 844, state in JS, no backend, fixture MAKEUPBYSWATIROY with empty policies and makeup seeds. Screens: Room (empty / with contracts) · Your policies (with meaning lines) · The standard agreement (placeholders) · Start (client / someone new / upload) · Someone new · Pick a client · The agreement (progress line, who, functions, fee & deposit, what's included, policies for this couple, what's printed) · Before you send · Sent → Signed → Deposit → Date held. Every surface byte is offered for veto on the screen.
