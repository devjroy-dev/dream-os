# repo: dream-os @ c2c9c91d0ca7b2f1ee6b39adc48d6bddd0acea75
# TDW · CE-43 · SEAT LC-2r · PACKET 3c · HANDOVER (the dream-os half) · 2026-09-17

Cut on dream-os `c2c9c91d0ca7b2f1ee6b39adc48d6bddd0acea75` (packet 3b), re-derived at origin at the moment of cutting.

- **Scope.** No migration. The rung is unchanged (3c rides b83).
- **Findings.** F-43.87 is cured here. F-43.88 to F-43.92 are recorded below.
- **Status.** Provisional under C-43.17 until the founder's floor on the applied tree is pasted. The pwa half (F-43.88, F-43.89) is its own packet, cut after this one is at origin.

## §1 · The defects the P3 walk found (founder-walked 2026-09-17, chair-ruled)

**F-43.87 · the booking wrote no event for Sarah (the seat's defect).**
- *What happened.* Q-P3-c returned Verma's reception (`4f0fc9fa…`, 31 July 2026). That row is linked to Verma's binder `f039b198`, but carries Sarah's lead id. Promotion took any live event linked to the lead as hers, so it found this row and wrote nothing.
- *Where it came from.* The row predates packet 3: created 2026-07-22, last updated 2026-09-04.
- *The cure (as ruled).* An event linked to the lead is accepted only when its binder is this booking's binder, or it has no binder; otherwise the event is written.

**F-43.88 → the pwa half.** A second Mark paid on a settled package invoice answered 400.
- The first call paid the remainder: `paid_at` is midnight IST, which only the F17 path stamps.
- The founder's console stack puts the refused call on the Mark paid control (`onClick → onTrigger`).

**F-43.89 → the pwa half.** The shared `Sheet` hid itself with `aria-hidden` while its confirm button held focus.

**F-43.90 → LC-3, chair-ruled.** The client card must show the booking the way the lead card does: package, schedule, delivery, wedding date, event, invoice. The brief is the founder's walk screenshots 1, 6, 7 and 9. Packets 4 and 5 stay as chartered.

**F-43.91 · a false link on a live row, chair-ruled: cleared now.**
- Verma's reception event (`4f0fc9fa-fc71-4f39-ad32-d15dc9d0631e`) carries `linked_lead_id` = Sarah's lead.
- The founder clears it with the one statement in the chat relay (§3). It is not part of this ZIP.

**F-43.92 → Block 09, underived.** Which July crew-assignment write attached Sarah's lead id to Verma's event. The row's notes carry the repeated "Swati assigned / unassigned — 22 Jul" trail.

## §2 · What shipped

| File | What |
|---|---|
| `src/lib/vendor/promotion.js` | F-43.87. The lead-linked event read also selects `linked_binder_id`, and keeps only rows whose binder is this booking's or null. |
| `scripts/b83_lc2_p3_promotion_bench.js` | AMENDED BY LABEL: §6.27 (the Verma shape is not hers; her event is written; the other row is byte-untouched), §6.28 (a lead-only link with no binder is still hers), M27. No existing cell changed. |
| `scripts/verify-lc2-p3c.sh` | The founder's one verify command. |
| `scripts/floor-manifest-lc2-p3c.txt` | The declared dirt. |

## §3 · The F-43.91 statement (founder-run, chair-ruled; carried here for the record)

Witnesses (dream-os `docs/db/PUBLIC_SCHEMA.md` at ladder 0168):
- **Columns:** public.events `id`(1), `linked_lead_id`(7), `linked_binder_id`(15).
- **Constraints the write touches:** `events_linked_lead_id_fkey` (FOREIGN KEY `linked_lead_id` REFERENCES leads(id) ON DELETE SET NULL) accepts NULL. None of the CHECKs names `linked_lead_id` (`events_blocked_slot_check`, `events_kind_check`, `events_owner_xor`, `events_slot_check`, `events_state_check`).
- **Row values:** the founder's paste of 2026-09-17.

```sql
update public.events
set linked_lead_id = null
where id = '4f0fc9fa-fc71-4f39-ad32-d15dc9d0631e'
  and linked_lead_id = '88dbb52b-c275-420c-bb12-1c84403bf139'
  and linked_binder_id = 'f039b198-8c28-4508-9302-9c8ef07455b4'
returning id, title, linked_lead_id, linked_binder_id;
```

EXPECT one row: `Verma - reception`, `linked_lead_id` NULL, `linked_binder_id` `f039b198…`.

## §4 · What is proven

- **b83 cured:** 127/127.
- **b83 both ways.** On a clean worktree at `c2c9c91` (its engine built, the amended bench copied in): 125 passed, 2 failed. The two are exactly §6.27 and M27. §6.28 is a true fact at base.
- **Readers of the changed file, base and cured identical by exit code and failing-line count:** 20 benches, derived by grep for `promotion`, `leadPackages`, `clients` and the vendor router. Plus bOB_taxonomy, b36, b79 and tdw09_micro. Non-green on both trees, as declared at packet 3: b46, b56, b59_g34, b59_mutations, and the b06_gauntlet refusal.
- **`node --check`:** clean.
- **Not run in the seat's container, declared before the cut:** the full floor, the real database, and the environment-refused benches (`b06_gauntlet`, `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`). The founder's provisional floor is their witness.

## §5 · The walk, when 3c and its pwa half are live (card P3 resumes, as ruled)

- **Step 5 on Sarah.** Swipe right, then Confirm booking.
  - This writes her `Sarah · wedding` event on 22 December 2026 and nothing else.
  - Q-P3-c then returns her row. Verma's row no longer appears, because of §3.
  - Q-P3-d and Q-P3-e are unchanged.
- **Step 6's next-due line moves to the walk-in in step 7.** Sarah's invoice is settled.

Sequencing beyond this sitting is the founder's.
