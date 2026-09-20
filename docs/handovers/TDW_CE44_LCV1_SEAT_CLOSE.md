# repo: dream-os @ eb68c383da5f376bc0fef8dc93ec6cf4d5e0286a · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# TDW · CE-44 · SEAT LCV-1 · CLOSE · FOR LCV-2

The founder, verbatim, 2026-09-20: *"shpuld we sit a new lc victor"*. The chair recommended yes: P5 is LC-Victor's largest
and most delicate packet and should start on a seat with room. LCV-1 closes at a clean boundary: P4 closed, no slot held,
the W-1 lift lapsed, nothing in flight. This file holds what the tree does not already hold; where the tree holds it, it
points there.

## 1 · Where LC-Victor stands

| Packet | dream-os | dreamos-pwa | What it delivered |
|---|---|---|---|
| Read-first, P1 (the ear table) | `0675964` | | The design read-first, the founder's P1 ear table (`TDW_CE44_LCV_P1_EAR_TABLE.md`), Amendment 4a. |
| P2, the silent listener | `cb84f6f` | | The listener role in the router and admin route; `listenerDoor.js` hearing every working-room turn after the wire, never awaited, writing `meta.listener`; the rig at `scripts/lib/`. |
| P2's panel | | `320ad7e` | The Listener switch on the switchboard; F-44.43 cured in its class (an unknown role renders no row). |
| P2's close | `7049502` | | The walk: 17 heard turns on both lanes, the cost row. |
| P3 | dropped | | R-44.17 withdrew the advice router. |
| P4a | `f3f7398` | | `handResult.js`: the structured, TOTAL result of the three door-born hands (booking, payment, invoice); F-44.30 cured and closed. |
| P4a's close | `85fda3d` | | The walk on Walk45; R-44.20; the twelve-line batch; C-44.7, C-44.8. |
| P4b | `66563f9` | | The engine-born write hands' result (`ToolOutcome.result`), under a W-1 lift on three engine files, now lapsed. |
| P4b's close | `eb68c38` | | The lift's lapse; C-44.9; F-44.49; F-44.50; the acts-heard count. |

**Live in production:** the listener hears every working-room turn on WhatsApp and the TDW chat and records its request in
`meta.listener`, changing nothing a vendor reads; it runs on Haiku on Essential, Signature and Prestige and on DeepSeek on
Basic, both surfaces (R-44.20). The switchboard shows and sets it. Every record-writing hand returns a structured result a
door can read. Victor still speaks in the working rooms; P5 is where that changes.

**The design of record,** after R-44.14 to R-44.20, is in the read-first; read these, in this order:
- `TDW_CE44_LCV_READFIRST.md` §17: R-44.17 (no advice classification anywhere) and R-44.18 (only the door speaks in the
  working rooms; the leftover line and its twelve examples; R-44.20).
- Item 5: R-44.19, the adviser sees the estate, read-only, behind a gate (P8).
- Items 1, 6, 10, 14, 15: the inventory, the confirmation table, W-1, the founder's bytes, the operator's one job (the relay
  draft stays hers, R-44.16).
- The P2, P4a and P4b handovers in `docs/handovers/` for each packet's detail.

## 2 · P5's opening agenda, as the chair ruled it

For LCV-2's read-first, in this order:

1. **The door's path carries no booked set.** V12 (`recordPrimitives.ts:751`, `:773`) and V13 (`:794`) fire only when
   Victor's chain supplies it; `src/lib/executeAndPatch.js` calls `executeRecordTool` with three arguments. So the DOOR
   enforces R-43.5 and R-43.11 itself: by its own check on the fact `bookedFacts.js` already builds, or by passing the set,
   with the cost and failure mode of each; and say which listener acts could reach `donna_client`, `donna_stage` or
   `donna_money_edit` at all, since an act the door never maps to those hands needs no guard.
2. **`checkMoneyProvenance`'s rule** (`donna.ts:651`) applied by the door to her own words: a figure the listener returns
   must be a figure she said.
3. **The confirmation table** (read-first item 6): what is staged, for how long, what "yes" and "no" are heard as, what
   happens to a list of acts when one moves money; the founder's byte for the question is asked of him, not minted.
4. **MINTED against SERVED** (F-44.49) and **one home for the invoice sentence** on both lanes (F-44.48, F-43.34): one
   invoice is served without a question; more than one is asked by number.
5. **The leftover line going live:** two of the twelve examples at random, in one hash-carried home, each example proven to
   route to something the lane can run; and F-44.45's rule, that a lookup naming nothing is nothing to act on.
6. **What is deleted when Victor leaves the working rooms,** by file and line: `dear_donna_talk` on those surfaces,
   `TALK_FUSE`, Fork C, the class ladder, `wireGuardVictor`'s working-surface limbs; the exact W-1 list that needs; and what
   stays because the Advisor room or the relay seat still uses it.
7. **The Basic-tier turn** (R-44.20): no fixture is on Basic (9888294440 signature, 8595356978 prestige); propose how one
   Basic turn is driven on the walk, for the chair to rule with the founder.
8. **The acts P5 covers, with EVERY founder byte each needs,** gathered for ONE sitting with him, each with a proposed
   wording in the register of the bytes he has approved.

And **the acts count re-run, split also by tier,** its text to the chair first under "FOR THE CHAIR ONLY: NOT TO BE RUN".

## 3 · The craft a fresh seat would otherwise relearn

**Driving the compiled engine (b89).** `recordPrimitives.ts` and `donnaLead.ts` read the database as `db_js_1.supabase` at
call time, and the built `src/engine/dist/core/db.js` exports it as a plain property, so a bench swaps in a fake by
assigning `require('…/dist/core/db.js').supabase = fake`; no source is touched. b89's fake is a small in-memory table store
behind a Proxy query builder (`eq`, `is`, `in`, `insert`, `update`, `single`, `maybeSingle`, `then`; everything else returns
the builder). The BASE engine is built from git into a cache: `git archive <sha> src/engine | tar -x` into
`os.tmpdir()/b89-engine-<sha>`, `node_modules` symlinked in, then this tree's `tsc -p src/engine/tsconfig.json`. First run
about a minute; cached after. Once a packet's own commit exists, find it as the commit that ADDED the bench
(`git log --diff-filter=A`), and measure against it: fixed history.

**Driving a real room (the pwa).** `scripts/lib/lcv_p2_panel_probe.mjs` and `scripts/lib/b83_room_probe.mjs`: resolve the
browser as `CHROME_BIN` if set, then `@sparticuz/chromium`, never your own Playwright path first (e-44.18); spawn `next dev`
with `NEXT_PUBLIC_API_BASE=http://localhost:<port>/__api`; intercept every `/__api/` request and answer it; for the admin
side set `localStorage` `admin_session_token` and `admin_session_expires`, and the theme cookie `tdw_adm_mode` (`light` or
`dark`); read `aria-label` and `aria-pressed` off the glass. Keep probes under `scripts/lib/`, outside the floors' flat globs.

**Your container is not his Codespace. Never quote its numbers to him as an expectation.** It shows 6 refusals not in base
where his shows 4; its `next build` fails on `fonts.googleapis.com` 403 (prove it environmental by building the base the same
way); run dream-os's floor with no pwa sibling beside it, as his dream-os Codespace has none (move the sibling aside, and put
it back). Start long runs with `setsid nohup … < /dev/null &` and poll in later calls: a background child of a tool call can
die with it. Never `pkill -f` a pattern that appears in your own command line. **Never stop a floor once started**
(run-floor.sh's Lesson 3): a bench killed mid-mutation leaves source mutated (e-7).

**Mutation anchors that sit on lines a later cut may edit.** b63's M24 anchors `modelRoutes.js`' unknown-field regex; b84's
M17 anchors the compiled `return { display: V13 };`. Both were found the same way: the founder's floor, run end to end on
the applied tree BEFORE cutting, reported a delta; the red was run standalone to its cause; the anchor was read. The cure is
to leave the anchored line byte for byte (add a separate filter; add a new first line), never to amend another sitting's
bench without the chair's word.

## 4 · The form every message takes, as law

- **C-44.1** docs-only deliveries verify on guard, unzip and a dirt check; no bench, no floor.
- **C-44.6** the git line names every path and carries its own dirt check.
- **C-44.7** a cell that pins what a PACKET did is measured against what cannot move: a fixed commit range, the packet's own
  committed manifest, or bytes with their own permanent home; never base against working tree (e-11, e-15, c-44.23).
- **C-44.8** every card names the exact client and the exact words to send, and what he should see for each; where the act
  depends on a fixture's state, the first step is a schema-witnessed SELECT with its control (e-13).
- **C-44.9** a re-cut never reuses a file name (`<NAME>.zip`, `_r2`, `_r3`); every apply block checks the ZIP's sha256 BEFORE
  unzip inside the same `&&` chain; the walk's first step clears any older ZIP of that name family, keeping only the confirmed one.
- **Nothing runnable before the chair's confirm** (e-6, e-10, e-14): a message awaiting the chair's read carries only the
  hash, the file table and each block described with its tests, under a first line "FOR THE CHAIR ONLY: NOT TO BE RUN"
  where it carries any runnable text; no card for him in it. The blocks follow the confirm.
- **Totality is proven, not claimed:** a fuzz in EVERY argument position, each guard with a mutation proving it holds
  (e-12, e-16).
- **The founder's instrument end to end before every cut,** and stop at the edge of the path list: a path outside it is
  named and asked for before building on it.

## 5 · Errors, corrections and open findings

**LCV-1's errors, each with its cause.**
- e-1 counted a label as a room (there are three: consult, advisor, business).
- e-2 a function-name grep missed door callers reached through aliases.
- e-3 read V13 as refusing `donna_money` too; it refuses `donna_money_edit` only.
- e-4 offered `composeBody` as the rig's harness; it boards Donna's tools and runs hands.
- e-5 attached a loose reading copy of the rig beside its ZIP; he dragged it in and the guard refused.
- e-6 sent a revised run block to him before the chair confirmed it.
- e-7 stopped a running floor mid-pass, twice; a bench's restore never ran and left a throwaway copy mutated.
- e-8 put the listener role into the server before checking what the live panel does with a role it does not know (F-44.43).
- e-9 the first cost SELECT counted every usage row, mixing turns, harvest's spend and the listener's.
- e-10 P2's close put runnable blocks in the message awaiting the chair's read; he ran them first.
- e-11 b86 pinned P2's promise as base against working tree; the next lawful edit reddened it.
- e-12 "never throws" written in a comment and a handover that no cell exercised.
- e-13 a card said "a booked client" and named none, and assumed the tool would fire.
- e-14 a SELECT for the chair sat beside a card for him; he ran it before the confirm.
- e-15 b88's cell 1.1 pinned `handResult.CODES` to an exact key list.
- e-16 the fuzz put hostile values in the outcome's position only; `minimal()` converted the hand unguarded.

**The chair's corrections, as this seat holds them.** c-44.17 stands in LC-2's close handover (`TDW_CE44_LC2_CLOSE_HANDOVER.md:120`
to `:123`). **c-44.18 is not in the tree and not held by this seat.** c-44.19: told this seat its read-first held R-44.1 to
R-44.9 verbatim when two were absent and three there by number only. c-44.20: ruled the rig's home "under scripts/" without
reading the floor's glob (F-44.41). c-44.21: sequenced dream-os before the pwa and never asked what the live panel does with
an unknown role. c-44.22: stated P4 "cannot be W-1 NONE" without reading the case bodies. c-44.23: did not see b86's §6 and
§7 would redden on the next lawful edit, then required the same proxy of b88. c-44.24: its own summary to him said "ask for
an invoice for a booked client" and named none.

**Open findings that touch LC-Victor, and where each sits.**
- F-44.5: after V12 on a name with no lead, `donna_booking` presumes a lead, reaching F29 with no way forward and leaving a
  stray binder (`TDW_CE44_LC2_P4A_HANDOVER.md:361`). For P5's door path.
- F-44.11: the guard's mechanism, the class ladder at `chat.js:1916` (`TDW_CE44_LC2_P4A_HANDOVER.md` §7). Deleted at P5, not
  repaired (R-44.18).
- F-44.26: the door relays Donna's words onto the vendor's glass (W6, read-first item 1). Closes at P5.
- F-44.27: the chat-served PDF for a package client (`TDW_CE44_LC2_CARD4A_CLOSE.md:166`). With F-44.48 at P5.
- F-44.28: `loop.ts:871` "Got it." and `:1117` fallbacks reaching the vendor (W4). Closes at P5.
- F-44.42: `bf1_bride_tool_fidelity_bench` is RED when it runs; refused on a keyless machine. The bride lane, Block 09.
- F-44.44: the app's "Start a fresh thread" control lost in the P7.2 flip; route and hook live with no caller. LC-3, the shell.
- F-44.45: a lookup naming nothing is nothing to act on. P5.
- F-44.46: a day or month with no year resolves to its next occurrence in IST. P5's date resolver.
- F-44.47: `engine.usage` names no spender. The first packet that touches the usage writer again.
- F-44.48: the invoice made and delivered by two per-surface paths. P5, one home, with F-43.34.
- F-44.49: MINTED is not SERVED; `made` on each return of `generateInvoiceForBinder`. P5.
- F-44.50: the leads cross-chip matched by phone alone; cure ruled (the lead's own `binder_id` first). LC-3.

Next free finding: F-44.51.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
