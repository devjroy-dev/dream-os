# TDW_10 · ADMIN P3 — THE MINT + THE DECK · EXECUTOR HANDOVER (dream-os)

**Base:** dream-os `43c7ebf` (CE-200 band verified at origin tip) · paired with dreamos-pwa `33f7c1d`
**Rulings:** CE relay #1–#4 — R-P3.1 · R-P3.2 · R-P3.3 · Forks 5, 6(a), 7(b) · F-10.42–.47
**Founder verbatims:** 「 1-ok 」 「 2-all ok 」 (copy veto, whole inventory) · 「 swati or 87577 can alsobe used as its our test account 」
**Role:** LE. Nothing pushed. **This is ZIP 1 of 2** — the pwa ZIP (the deck surface, the mint sheet, F-10.46's token cure, the f0790 retirement) follows. Push order is stated in §9.

---

## 1 · WHAT SHIPPED

| File | State | What |
|---|---|---|
| `src/lib/admin/auditLog.js` | NEW | The audit wrapper — sole writer, `admin_activity_log`, fail-safe (R-P3.2) |
| `src/api/admin/mint.js` | NEW | `/mint/vendor` · `/mint/couple` · `/mint/welcome/:vendorId` · `/mint/welcome-status` |
| `src/api/admin/vendors.js` | MODIFIED | F-10.47 cured; the one vendor path; handler exported |
| `src/api/admin/couples.js` | MODIFIED | The hand-rolled create RETIRED onto `ensureCoupleRow` (R-P3.1) |
| `src/api/admin/discover.js` | MODIFIED | F-10.43 · F-10.44 · F-10.45 · the Fork 6(a) preview door · audit wrapper |
| `src/lib/vendor/discover.js` | MODIFIED | F-10.44's vendor-side split (2 fields) |
| `src/lib/templates.js` | MODIFIED | F-10.42's five-flip + `vendor_welcome` at `draft` |
| `src/api/router.js` | +6 lines | The `/admin/mint` mount, above the broad `/admin` |
| `scripts/b10_p3_mint_deck_bench.js` | NEW | 101 cells incl. a 10-mutation section |
| `scripts/b10_p2_bridge_bench.js` | LABELLED AMENDMENT | One cell re-aimed, count preserved 82 — §7 |

**Zero migrations. Zero SQL. Zero DDL.** The ladder is asserted UNMOVED at `0112` by a cell that reads the directory. `0113` remains unwritten. `requireAdmin.js` byte-untouched, hash-pinned to its P1 witness `dd9705685bba3875`.

**W-1: trivially clean.** No soul, lens, prompt or engine file is touched. Arm (a)'s handle-ladder extraction — the one thing that would have entered `src/agent/onboarding.js` — was chartered out by R-P3.1 and is not here.

---

## 2 · THE PROOF

- `b10_p3_mint_deck_bench` **101/101** cured · **33/101** at the TRUE uncured tree — **68 cure cells RED**.
- **"True uncured" is stated precisely because the first attempt was not.** `git stash` moves tracked files only; the two NEW modules stayed on disk and the bench read 50/101. The honest measurement moves `mint.js` and `auditLog.js` aside as well — origin/main plus the bench alone — and that is the 33 above. A both-ways number taken against a tree that still holds half the cure is not a both-ways number.
- **Floor, dream-os, at the cured tree:** `tdw09_micro 23/23` · `b10_p1_search 45/45` · `b10_p2_bridge 82/82` (after §7). The four known-reds reproduce **exactly** as attributed and no fifth appeared — meter `28/29` (F-06.41) · f0555 `22/23` (F-07.11) · f0772 `158/159` (§12.14) · p4b_body `75/76` (§5.26).
- `npm run build` (engine tsc) exit 0 · `node --check` clean across all of `src/` and `scripts/`.

**The 33 greens at the uncured tree, classified — because a vacuous green is worse than a declared gap.**

*Genuine guards* (true at both trees, would redden if broken): the single `invite_vendor` caller under `src/api/` · `admin/couples.js` never calling `invite_couple` · every discover door's real `requireAdmin` by identity · the `requireAdmin` hash · the mint's 200 / 400 / RPC-called behaviours that predate the cure · the floor constant at 6 · grant-above-floor succeeding · the `in`-filter on request decisions · `GET /requests` answering 200 with its default filter · deny answering 200 and writing its reason · deny being audited (the retired `logAction` also wrote that table) · the ladder at 0112 and 0113 unwritten · `buildAuthTemplatePayload` reading no status (this one is F-10.42's own evidence, and it is *supposed* to be true at both) · the restoration cell. **Twenty-one.**

*Vacuously green at pristine* (they pass because the file they read does not exist, and they are negative assertions): the mint router declaring no inserter · no `admin_audit` reference · the welcome route not re-implementing the gate · the unauthed refusal writing nothing · `isApproved('vendor_welcome')` returning false because the template is absent rather than because it is draft · the never-writes-`routing_handle` pair · the no-`name`-key and no-users-write pair, which are true at pristine but for a reason that does not catch the clobber (the clobber lives inside the RPC; the cell that catches it is "a taken phone does NOT call invite_vendor"). **Twelve.** Real guards at the cured tree, where they will run from now on; they prove nothing at pristine and are not counted as if they did.

**The guard is driven, not grepped.** §2 walks each router's own stack, asserts the handler in the chain **is the estate's real `requireAdmin` by object identity**, and drives a bare request to a 401 with no payload behind it. The bench's bearer is minted by `src/lib/adminSession.js`'s real mint.

---

## 3 · THE ONE-PATH GUARDRAIL, PROVEN BY IDENTITY

The spec's §3 says a second mint implementation anywhere is a failed session. `src/api/admin/mint.js` **imports** `mintVendor` and `mintCouple` and mounts them; it declares no inserter and calls no RPC. §1 asserts this three ways whose failure modes differ: the import lines exist (source), the file contains no birth call (source, comment-stripped), and **exactly one file under `src/api/` calls `invite_vendor`** (filesystem walk). M8 adds a second caller and watches the count cell redden.

**The engine half is not minted, and the reason is in the code.** The quartet's other two rows (`engine.users`, `engine.agents`, plus `agent_owner.consult_done`) are born by `resolveAgentForVendor`, which requires a Supabase `auth.users` id that `ensureAuthIdentity` creates only after an OTP is proven. Minting one for an unverified phone would break the one-phone-one-identity law that module exists to hold. `consult_done=false` is the column default, so the spec's clause is satisfied wherever the row is born. Written into `vendors.js`'s header so the next reader meets the reasoning before the gap.

---

## 4 · THE CURES, EACH WITH ITS MUTATION

| Finding | Cure | Mutation that reddens it |
|---|---|---|
| **F-10.43** | The photo floor enforced at `POST /grant/:vendorId`, server-side, against `summary.total` — the same reading the request gate uses. 422 + typed code `below_photo_floor`; the refusal writes no `discover_eligible` and is itself audited. | **M1** — `if (false)`, and a below-floor grant succeeds again |
| **F-10.44** | Partial, and declared partial. The pitch is read and carried into the audit row before the decision overwrites it; both read doors split the column on **state**, so a pitch can never be shown to a vendor as the reason he was refused. | **M6** — un-split the column; an open request hands back the pitch as a decision reason |
| **F-10.45** | Both halves. The payload now carries `vendor_name`/`category`/`city`/`photos_*`, and `state` is echoed under `discover_request_state` so a client either side of the push renders rather than throws on `st.replace(…)`. | **M4** — drop the echoed key |
| **F-10.47** | The existing account is read first; on a collision the RPC is **never called**, so its `on conflict … set name = excluded.name` clause is unreachable. `outcome` is `created` or `existing`; `created` is preserved as a boolean for old callers. | **M2** (hard-code the outcome), **M3** (call the RPC on a collision) |
| **F-10.42** | The five AUTHENTICATION statuses flipped to `approved`, with the call-graph proof written into the file and a cell per template. | asserted directly; `buildAuthTemplatePayload` proven to read no status |

**F-10.44 is bounded and says so.** The column is still one column with two authors, and the pitch is still gone from `vendor_discover_requests` once a decision lands. The full cure is a dedicated column, which is DDL, which is 0113's sitting. Named in the file so the next reader finds a bounded partial rather than believing the species is dead.

---

## 5 · §0.2 — TWO REPORTS, ONE OF THEM A CORRECTION OF MY OWN CENSUS

**F-10.48 PROPOSED — the couple birth has FOUR implementations, not three.** My Part 1 census named three (`invite_couple`, `ensureCoupleRow`, `admin/couples.js`). The bench's first draft swept all of `src/api/` and caught a fourth: **`src/api/couple/auth.js:147` and `:163`**, the self-serve OTP signup, inserting its own `couples` row with `onboarding_state: 'new'` — and at `:166` deleting the `users` row it just made if that insert fails. It is a live signup path, outside this charter, and it is **not swept**: retiring it onto `ensureCoupleRow` is its own sitting with its own ruling. The bench cell is scoped to `src/api/admin/` and the scope carries the reason in-file. My census was wrong by one and the correction is mine.

**The bench convicted itself four times before it convicted the code, and each is recorded in-file rather than quietly repaired:**

- **Three cells were measuring documentation** — they read the tombstone comments that quote the retired implementations verbatim. P2's defect (c), same species. A `code()` stripper now feeds every source-shape cell.
- **M7 was aimed at a clause another clause already covered.** The mutation replaced the `if (error)` branch body with a throw — inside the `try`, which the wrapper's own `catch` swallowed, so the route stayed fail-safe and the mutation proved nothing. Re-aimed at the catch.
- **The mutation harness could not reach the code it mutated.** M7 edits `auditLog.js` and then re-requires `discover.js`, which resolves its dependency from `require.cache` — so the mutated file was never loaded. `mutate()` now busts the cache. **A mutation that cannot reach the running code is a green wearing a red's clothes**, and it would have made every dependency-level mutation in this bench meaningless.
- **One cell's regex measured a different thing than its label.** `!/routing_handle:\s*[^n]/` was meant to catch a computed handle and instead matched the honest report line, because `v` is not `n`. P1's D-4, same species. Re-aimed at the rig's record of writes, plus a generation-code check — two methods that fail differently.

**And the rig was inventing a failure.** Its `rpc` double recorded `invite_vendor` and created nothing, so every post-RPC read missed and the mint answered 500 for a reason production does not have. The double now reproduces `0003`'s witnessed semantics — **including the clobber clause**, deliberately: a double that quietly declined to clobber would green the cure by removing the hazard instead of proving the route avoids it.

---

## 6 · FORK 7(b) — FEASIBILITY DERIVED, AND IT DERIVES CLEAN

The chair asked especially whether **Re-apply truly re-inserts a fresh request row**. It does: `requestDiscover` (`src/lib/vendor/discover.js`) carries **no duplicate guard** — after its rate, tag and floor checks it inserts unconditionally, and `getDiscoverStatus` reads the newest row by `created_at desc`. So reject → Re-apply → second request → approve is producible entirely through real doors, on real state. `grant`'s `in('state', ['requested','under_review'])` scoping means an older denied row is untouched by the later approval.

The floor arm derives clean too, and needs no seeded row: `DELETE /api/v2/vendor/portfolio/:imageId` carries **no floor guard**, so a vendor can request at six and stand below it by the time the founder swipes. That is F-10.43's disease reproduced by a real caller.

**One derived caution the chair's sketch could not know, and it changes which account carries which cell.** The floor arm requires deleting real portfolio rows, and deletion is Cloudinary-backed and irreversible. Swati Roy holds the estate's only complete portfolio (10 photos, 9 approved) and is **live to couples**. Proposed split, stated so the card can be authored against it:

- **Swati** carries deck-two and the reason-visibility clause — revoke → re-request → reject with a chip → the reason walks on her `/vendor/discover` → Re-apply → approve. **Zero destructive steps**, and she ends where she started. She leaves the Discover feed for the duration; naming that rather than discovering it mid-walk.
- **Dev Test Studio (`9888294440`)** carries the floor arm — six throwaway uploads, request, delete one, watch the grant refuse — and the F-10.47 `existing` card variant, since it is the collision the finding was found on.
- A **virgin phone the founder supplies at walk time** carries the `created` variant. The card's step reads 「 a phone with no existing TDW account 」, his to choose.

The full card ships with the pwa ZIP, where the surfaces it walks will exist.

---

## 7 · §0.2 — MY DELIVERY REDDENED A SEALED BENCH. LABELLED AMENDMENT, RATIFY-OR-REVERT.

`b10_p2_bridge_bench` asserted `templates_awaiting_verdict.count === 5` — a pinned **literal**. F-10.42's ruled flip took five templates out of that count and `vendor_welcome` put one back, so the true count is 1. The **endpoint is correct**; only the literal was stale.

Re-aimed, not relaxed: the cell now asserts the endpoint's count **equals the registry's own non-approved count**, derived from the same module the endpoint reads. That is strictly stronger — it reddens if the endpoint miscounts, which the literal could only do while the registry happened to hold five — and it cannot be invalidated again by a lawful flip. **Count preserved, 82 → 82.** The retired assertion is recorded verbatim in the bench file. This is CE-199's ratified shape; disclosed here rather than absorbed.

---

## 8 · THE `vendor_welcome` TEMPLATE — FOR THE FOUNDER'S MANUAL META FILING

Ships in the registry at `status: 'draft'`. `sendWa`'s `isApproved` gate refuses the send until you flip it; the mint's card renders **`Welcome template is not approved by Meta yet.`** in the meantime. No code push is needed when Meta approves — one field.

| Field | Value |
|---|---|
| Meta template name | `tdw_vendor_welcome` |
| Category | `UTILITY` |
| Language | `English` (`en`) |
| Line / phone number | vendor — PNID `1197664646766743` |
| Variables | 1 · `{{1}}` = the vendor's name |
| Body | `Hi {{1}}, your Dream Wedding account is ready. Reply here and I'll set up your profile so couples can find you.` |
| Sample for `{{1}}` | `Swati` |

Shape checked against `docs/TEMPLATES.md` §1: single line, no variable adjacent to another, none begins or ends the body. **One variable, and the reason is copy law**: a second reading 「 Your account manager is {{2}} 」 would name either a persona — never permitted in a vendor-facing byte — or a human who does not exist.

**After Meta approves:** flip `status: 'draft'` → `'approved'` on the `vendor_welcome` entry in `src/lib/templates.js`. That is the whole change. Withheld as a runnable block per the conditional-withheld rule — it ships when Meta has spoken, not beside the delivery that anticipates it.

---

## 9 · DEPLOY NOTE

No new environment variable. No migration. No dashboard step beyond §8's Meta filing, which is independent of this push.

**Push order: dream-os FIRST, then the pwa ZIP.** This delivery is backward-compatible by construction — `GET /requests` echoes `state` under both names, so the *current* pwa approvals screen behaves exactly as it does today (which, per F-10.45, is: it renders "No requests" against an empty table). The pwa ZIP's deck depends on this payload, so the reverse order would leave the deck reading fields that are not there.

---

## 10 · WHAT THE NEXT SITTING PICKS UP

- **F-10.44's full cure** — one column per author, DDL, 0113's sitting.
- **F-10.48** — the fourth couple-birth writer at `src/api/couple/auth.js`, its own ruling.
- **F-10.23 / F-10.24** — cited as *entered at CE-201* per the chair's own correction; nothing in this repo carries them yet.
- **The pwa ZIP** — the deck, the mint sheet, F-10.46's token cure with the pair set derived from the file, the f0790 retirement with anchors verbatim, and the founder smoke card authored against §6's derived walk.

Findings spent by this delivery: **F-10.43 · .44 · .45 · .47**, plus **.42** settled and **.46** cured in the pwa ZIP. **F-10.48 proposed.** Next free after that: **F-10.49**.

*Sequencing beyond this sitting is the founder's.*
