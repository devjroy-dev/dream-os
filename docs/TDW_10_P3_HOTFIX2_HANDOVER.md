# TDW_10 · ADMIN P3 · HOTFIX 2 — FIVE ITEMS FROM THE FOUNDER'S WALK

**Base:** dream-os `94fc6c9` · dreamos-pwa `5cb33b8`
**Origin:** every item below was found by the founder's live walk on 2026-08-06, not by a cell.
**Role:** LE. Nothing pushed. Two ZIPs, own guards, founder-sequenced.

---

## 1 · WHAT SHIPPED

| # | File | What |
|---|---|---|
| 1 | `src/lib/templates.js` | `vendor_welcome` body corrected to the text actually filed with Meta |
| 2 | `src/api/admin/vendors.js` | the existence probe's swallowed error — checked, fails loud |
| 3 | `app/admin/_components/MintSheet.tsx` | `Send welcome`: *refused* and *sent* made distinguishable |
| 4 | `app/admin/vendors/portfolio/page.tsx` | reads `?vendor=` at last — the deck's link works |
| 5 | `app/admin/_components/AdminUI.tsx` | the `Toast` clears the domain bar — **shared component, widening disclosed** |

Benches: `b10_p3_mint_deck_bench` **116/116** (+6, incl. **M12**) · `tdw10_p3_deck` **130/130** (+17, incl. **M11/M12/M13**).

**Withheld:** the `status: 'draft' → 'approved'` flip. `tdw_vendor_welcome` reads *In review* at Meta. Conditional-withheld — it ships on their word, not beside the delivery that anticipates it.

---

## 2 · THE FIVE, EACH WITH ITS ORIGIN

**① The body Meta refused.** The drafted body carried 「 so couples can find you 」 — a **benefit claim**, which reads as Marketing no matter which category is ticked, and Meta's own classifier said so before submission: *「 Category does not match … this message template will be rejected 」*. The founder filed the tightened form. The registry now describes what Meta actually holds. This field is documentation, not the wire — `buildTemplatePayload` sends name, language and the variable — so nothing was broken, but P4 builds this registry's runtime twin and a twin born describing the wrong sentence is born lying. Two cells, one of them asserting the refused clause is gone.

**② The probe that swallowed its error — and the diagnosis that was wrong.** `const { data: v } = …` with no `error`. A failed read yielded null, `outcome` became `'created'`, and the RPC's `ON CONFLICT DO NOTHING` made nothing: a wrong label over correct data.

**Attributed honestly: this caused nothing observed.** I proposed it as the explanation for a second `created` on the walk, and the founder's own evidence killed it — two distinct `target_id`s, a deleted row and a re-created one, exactly as he said. I built a hypothesis on a timestamp pair without first checking whether the two rows were the same row. The swallowed error is real regardless and is cured as **hardening**, not as a cure for something that happened. M12 restores it and watches a failed read get mislabelled again.

**③ 「 Send welcome just clicking. not getting sent. 」** It was working — three clean refusals in the audit log — but the pre-tap notice and the post-tap refusal were the **same bytes**, so the screen never changed. The outcome is now a typed state (`'sent' | 'refused' | null`) with its own eyebrow, its own colour, and a send that names who it reached. **This is not cosmetic:** the same line will report a real send to a real vendor's phone the day Meta approves, and if *refused* and *nothing happened* are indistinguishable today then *sent* and *nothing happened* are indistinguishable tomorrow.

**④ The dead `?vendor=` link — mine, against a law I had quoted.** P3's deck ships `See the portfolio → /admin/vendors/portfolio?vendor=<id>`, and that page contained **zero** occurrences of `useSearchParams`. Protocol §6 — *always read the actual handler before writing the call, never assume* — applied to a route instead of a handler, and I didn't apply it. It is also **P1's D-6 recurring**: `?focus=` was declared as having no reader, and I authored a second parameter into the same admin without checking whether this one did.

**And it made my own handover overstate the delivery.** I wrote that the missing in-card `VendorProfileView` render was only a *partial* gap because 「 one tap away is the portfolio 」. That tap went to an empty picker. The partial was thinner than I described it. Corrected here rather than left standing.

The reader is a **preselect, not a lock** — guarded so choosing another vendor isn't undone, and guarded on the id being real so a stale link leaves the picker usable.

**⑤ The toast under the domain bar.** `bottom: calc(safe-area + 28px)`; the bar is ~60px plus its own inset. **Identical arithmetic to the mint sheet's button** — which the P3 rider had already cured in `MintSheet.tsx`, and I fixed the caller without asking where else the same 28px was standing. Every admin confirmation on mobile has been hiding behind the nav since P1.

**WIDENING DISCLOSED, RATIFY-OR-REVERT:** `Toast` is shared across the admin, so this one property moves every admin confirmation on mobile. It is a strict gain everywhere and that is why it was cured at the source rather than localised a second time. Desktop is unaffected (`#m-domains` is `display:none` above 768px).

---

## 3 · §0.2 — THE SAME INSTRUMENT DEFECT, THREE TIMES IN ONE SITTING

Two cells in this hotfix convicted their own **tombstone comments** — the paragraphs that quote the retired code so a reader can see what was replaced. The `+ 28px` cell read the comment describing `+ 28px`.

That is the third instance in this phase: three cells in the dream-os P3 bench, one in the retired `f0790`, and now this. Each time the cure was the same — strip before measuring — and each time it was applied to the cells in front of me rather than to the bench's habits. **A source-shape cell in these benches reads `strip()` or it is not a cell**, and it is now written into the file rather than remembered.

One more re-aim disclosed: the *never claims "sent"* cell matched a string literal that this hotfix turned into a template literal. The property is unchanged; the cell now asserts the property rather than the spelling.

**Container note, no shipped byte affected:** a stray `git checkout -- .` in my working tree reverted the P3 pwa work mid-hotfix. Recovered by fresh clone at origin `5cb33b8`, and every delivered file is byte-derived from that tree. Recorded because a session that hides its own accidents is one that will hide a consequential one.

---

## 4 · ACCEPTANCE NUMBER 2 — RECONFIRMED FROM THE CODE, AND WHAT THAT IS WORTH

The founder parked step 13. Re-derived at origin `94fc6c9`, `src/api/admin/discover.js`:

```js
const summary = await portfolioSummary(supabase, vendorId);
if (summary.total < MIN_PORTFOLIO_IMAGES) {
  await writeAudit(supabase, 'discover_grant_refused', 'vendor', vendorId, {
    reason: 'below_photo_floor', photos_total: summary.total, floor: MIN_PORTFOLIO_IMAGES });
  return errRes(res, 422,
    `Below the ${MIN_PORTFOLIO_IMAGES}-photo floor — cannot approve. This vendor has ${summary.total}.`,
    'below_photo_floor');
}
```

`MIN_PORTFOLIO_IMAGES = 6` at `src/lib/vendor/discover.js:25`, **one home**, imported by the grant route, the request gate, `profileScore` and `demoAdmin` — no second copy anywhere, derived by grep.

`b10_p3_mint_deck_bench §4`, run at origin, **twelve cells green**, including: the refusal is 422 with code `below_photo_floor` · **no `discover_eligible` is written** · the request row is not decided · the refusal is itself audited · and **M1** removes the check and watches a below-floor grant succeed.

**This is a pure server predicate, and the bench drives the real route through the real `requireAdmin` — so the mechanism is proven end to end, not merely wired.** What is NOT proven is the founder's own witness of the 422 on his handset, which is what acceptance number 2 as ratified asks for.

**Recommendation: seal P3 with acceptance number 2 recorded as BENCH-PROVEN AND FOUNDER-PARKED, never as met.** One fragment of it is already live-witnessed — the deck rendered `9 · photos · floor 6` from the server's own `photo_floor`/`meets_floor` on his screen, so the floor demonstrably travels the wire. The refusal itself waits for the profile he said he'd use later. A number recorded as met on a walk that did not happen is the class this estate spends its evenings killing.

---

## 5 · WHAT REMAINS OPEN

- **Acceptance number 2's live witness** — parked by founder word.
- **The reject-undo** — one tap writes a decision the vendor sees, no confirm, no undo. Still unruled; not touched here.
- **F-10.52** the frozen ten aesthetic tags · **F-10.53** the samples step, founder-ruled 「 legacy era, no bearing whatsoever 」 → **delete the step**, its own sitting with a copy pass.
- **F-10.49** the two pre-existing stripper-rot cells in P1's and P2's own benches (`tdw_f0774_stripper 33/35`, unmoved by this delivery).
- **F-10.48** the fourth couple-birth writer at `src/api/couple/auth.js`.
- **F-10.44's full cure** — one column per author, DDL, 0113's sitting.
- **The `status` flip** — on Meta's word.
- **Observation, underived:** a DELETE returning 404 alongside a *Photo removed* toast on the vendor portfolio, count moving correctly. Looks like a double-fire, not a failure — but a success toast beside a 404 is one keystroke from the class F-07.37 cured, and it wants deriving rather than assuming.

Findings this hotfix spends: **F-10.54** (the dead `?vendor=`), **F-10.55** (the Toast inset), **F-10.56** (the indistinguishable welcome result). Next free: **F-10.57**.

*Sequencing beyond this sitting is the founder's.*
