# repo: dream-os @ ff25992eaf33752ed998469a307fc39ae8c19a78
# TDW · CE-43 · SEAT LC-2r · PACKET 3b · HANDOVER (the dream-os packet) · 2026-09-17

Cut on dream-os `ff25992eaf33752ed998469a307fc39ae8c19a78` (packet 3), re-derived at origin at the moment of cutting.

- **Scope.** No migration. Rungs unchanged: 3b rides b83. Findings used: none new; this packet is F-43.86's cure.
- **Status.** Provisional under C-43.17 until the founder's floor on the applied tree is pasted.
- **Next.** The dreamos-pwa packet (b82) cuts on this packet's tip.

## §1 · The defect this cures (F-43.86, the seat's own, chair-ruled)

Packet 3 shipped F16 and F17 on the door but gave the Invoices room no way to tell a package invoice from any other. The invoice wire (`readOutstanding`) carried no `lead_package_id`. That left three holes:

- the sheet half of F16 had nothing to key on;
- F17's toast could not be told apart from "marked fully paid";
- the F16 refusal's unvetted sentence could reach the Remove toast through `res.error`, because the DELETE door passed no code.

## §2 · What shipped

| File | What |
|---|---|
| `src/lib/vendor/invoices.js` | **(a1)** `OUTSTANDING_SELECT` names `lead_package_id` (public.invoices ordinal 23, `docs/db/PUBLIC_SCHEMA.md` at ladder 0168). Every `readOutstanding` row exposes it, as the value or null. |
| `src/lib/vendor/schedules.js` | **(b1)** The F16 refusal returns the token `package_schedule` with code `PACKAGE_SCHEDULE`. The reason is a server log line only (`[schedules:delete] refused …`). The unvetted sentence is gone from the wire. |
| `src/api/vendor/invoiceSchedule.js` | **(b1)** The DELETE door passes the code (`errRes(res, 409, result.error, result.code)`). |
| `scripts/b83_lc2_p3_promotion_bench.js` | AMENDED BY LABEL. Adds §4.19, §4b.4, §4b.5, §5.6 and §5.7, plus mutations M24 to M26. No existing cell changed. |
| `scripts/verify-lc2-p3b.sh` | The founder's one verify command. It runs the build, `node --check`, b83, and the three readers of the changed homes (b47, b51, b40), then the floor with declared dirt. |
| `scripts/floor-manifest-lc2-p3b.txt` | The declared dirt. |

**Drift, disclosed.** The ruling said "two dream-os files". This packet touches three production files. Ruling (b1) requires the unvetted sentence to leave the wire, and that sentence lives in `schedules.js`, beside the two files the ruling named.

## §3 · The contract, as it now stands (additions to the packet 3 handover §2)

- **Invoice list.**
  - `GET /api/v2/vendor/money/invoices/:vendorId`: every row carries `lead_package_id: string | null`.
- **Schedule DELETE on a package invoice.**
  - `DELETE /api/v2/vendor/invoices/:invoiceId/schedule` answers `409 { ok:false, error:'package_schedule', code:'PACKAGE_SCHEDULE' }`.
  - The PWA maps the code to `COPY.studioScheduleRemoveFailed` and never renders `error`.
- **F17 toast (c2, ruled; built in the pwa packet).** On a package invoice the mark-paid toast is D3, built from the answer's `milestone` and `invoice`. After the last milestone it is D4. "marked fully paid" stays for invoices that are not a booking's.

## §4 · What is proven

- **b83 cured.** 124/124 on the cured tree, run from `/tmp`.
- **b83 both ways.** On a clean worktree at `ff25992`, with its engine built and the amended bench copied in: 117 passed, 7 failed. The 7 are exactly §4.19, §4b.4, §5.6, §5.7 and M24 to M26. Everything packet 3 proved still holds, and §4b.5 is a true fact at base.
- **Readers, base and cured identical.** 47 benches, compared by exit code and failing-line count. The set is the readers of `invoices.js`, `schedules.js`, `invoiceSchedule.js`, `money.js`, `moneyFacts.js`, `wireGuardVictor.js` and the vendor router, plus the whole-`src` scanners (bOB_taxonomy, b36, b38).
- **Non-green readers.** None is new. b46 and b56 are container-side, as declared in packet 3. The rest are in `floor-base.txt` or are environment refusals.
- **Syntax.** `node --check` is clean on the three files.
- **Not run in the seat's container, declared before the cut:**
  - the full floor;
  - the real database;
  - the environment-refused benches (`b06_gauntlet`, `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`).

  The founder's provisional floor on the applied tree is their witness.

## §5 · Founder acts

None on Railway or Supabase. `PACKAGE_MONEY_MIRROR` stays unset.

Sequencing beyond this sitting is the founder's.
