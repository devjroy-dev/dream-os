# repo: dream-os @ 36224f0030ef2846e065658e6c155ae9e55fba16 (base) · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# TDW · CE-44 · SEAT LCV-3 · CLOSE (docs only, C-44.1)

LCV-3 ran LC-Victor's P5b read-first and nothing else. **No code was cut, no lift was issued, no ZIP but
this one reached the founder.** The seat closes because F-44.55's census came back live (F-44.73, SEC-1)
and the chair ruled SEC-1 the next sitting; the seat said before starting, not after, that its room was
enough for SEC-1's read-first but not for the read-first, the rollback's rehearsal, the cut, the proof and
the walk, and the worst moment to hand over is between a cure and its walk.

This file carries what exists only in the sitting's chat. Everything in it is either read from the tree at
the tip above, read off the founder's own screens and marked as such, or his words verbatim.

---

## 1 · P5b, settled and UNBUILT

R-44.22 (b): the chain loses every hand the door owns. The design the chair accepted has **four pieces**,
and the first three ship together or not at all.

**The finding that shapes it.** `donna_booking`, `donna_milestone_paid` and `donna_invoice_pdf` are SIGNAL
hands. Donna's call writes nothing; `executeRecordTool` returns a display only
(`recordPrimitives.ts` :908, :921 to :943). The money moves at the CHAIN's harvest sites after the turn:
`chat.js` :3680 and :3685 (SSE) and :3808 and :3811 (JSON), through `buildInvoices` (:428) and
`runLifecycleSignals`; `vendorInbound.js` :1811 (invoice) and :1871 (lifecycle). The DOOR moves money
through the same helper with its own built call (`workingDoor.js` :194 to :199), so **the gate belongs at
the chain's call sites and never inside `runLifecycleSignals`.**

- **L1, the offer.** The three leave `DONNA_TOOLS` at `donna.ts:353`; `donna_invoice_pdf` is filtered out
  of `RECORD_TOOLS` there and `recordPrimitives.ts` is NOT edited (chair's ruling).
- **L2, the dispatch.** A general allowlist, **computed at load from `DONNA_TOOLS` itself** so the offer and
  the gate cannot disagree, plus a declared alias map of exactly `{ donna_retrieve → donna_unarchive }`
  written as a named constant with the transition comment (F-44.71). A name that is neither offered nor a
  declared alias gets an honest refusal as its tool result and `executeRecordTool` is never called.
- **L3, the harvest.** The chain's six sites drop those three names before acting, from one shared home both
  lanes read. The door's path is untouched; `executeAndPatch(agentId, name, input)` is not on it.
- **The fourth piece, the NO-HAND COMPLETION ARM** (the chair's, added after F-44.65 was derived; door-side,
  no engine byte). On a CHAIN turn in a working room, where (a) the request heard before the reply has route
  `task` with at least one act, AND (b) the turn's result carries NO tool call of any kind, AND (c) the reply
  claims completion, the door does not send Victor's reply: it sends the founder's existing vetoed byte
  `STAGE2_LINE_MUTATION` from its one home, stores THAT as the row's content with the withheld text kept in
  `meta` for the record, and harvest is skipped. (a) and (b) are structural and do the work. It is ONE home
  both lanes call (C-43.1) and it must never fire on a door turn, a search, or a turn with any tool call.
  **OPEN, and left open deliberately:** the design of (c). The chair's lean is that a reply containing a "?"
  addressed to her passes, and otherwise a task turn with zero tool calls has nothing truthful to report. It
  is to be weighed against the wire guard's existing completion lexicon
  (`wireGuardVictor.js` `BARE_COMPLETION_RE`, `LEADING_COMPLETION_RE`) and brought to the chair **with its
  false-positive cases named**. Nothing is built on (c) until the chair has ruled.

**Why all four and not three.** L1, L2 and L3 all act on a hand that was CALLED. F-44.65's turn called
nothing. Withholding hands does not stop a false claim; it makes the claim always false. That is R-44.18's
argument arriving as evidence, and the arm is what answers it.

### The W-1 DRAFT (a draft; NO LIFT HAS BEEN ISSUED)

The chair ruled the lift is issued AFTER the rig, against the seat's exact list at the tip of that day,
because the rig decides the refusal's wording and the wording is part of the addition.

| Engine path | Change | Reason |
|---|---|---|
| `donna.ts:353` | changed | L1. Keep it ONE line ending `...INTRODUCTION_TOOLS, LISTEN_HARVEY_TALK_TOOL];` or b68 §10.1's anchor dies for an unrelated reason |
| `donna.ts:22` | changed ONLY if the compiler refuses the two now-unused imports | read the engine's tsconfig first; if it does not refuse, the line is untouched |
| `donna.ts` ~:651 | ADDITION, seated above the provenance hold | L2's allowlist gate, recorded through `record()` exactly as a hold is |
| `donna.ts:511` | untouched | `ATTRIBUTE_ATOMS`' `donna_invoice_pdf` is inert once the hand is not offered; it leaves with the machinery |
| `harveySoul.ts:120` | UNSETTLED | the one soul candidate ("Raise an invoice for 50k" is clerical, "you just have it done, quietly"); settled only after a WHOLE read, not a grep hit |

Outside W-1: `chat.js` (four sites), `vendorInbound.js` (two), the shared withheld-set home, `workingDoor.js`
(B15), `doorLines.js` and `handResult.js` (B15's byte and key), `spokenDate.js` (F-44.64), and the arm.

**Corrected here so it is not inherited:** the souls do NOT name the three hands. A grep of `donnaSoul.ts`,
`harveySoul.ts`, `advisorLens.ts` and `consultantHarveySoul.ts` at this tip finds none of the three
identifiers (c-44.30, the chair's: a statement about what files contain, unread). `blockHands.js:26` cites
`DONNA_TOOLS` at `donna.ts:278`; it is built at :353 and offered at :530. That stale cite is corrected by
the first packet that lawfully touches that file.

### B15, under R-44.27

His byte, verbatim: `Could not make the invoice. No client called {name}.` Into `doorLines.js` `LINES` with
its sha256 in `LINE_HASHES` (`assertLineHashes()` runs at load; `DOOR_KEYS` picks it up, being every key but
LEFTOVER); `DOOR_LINE_KEYS` in `handResult.js` gains `'B15'`; b90 §1.1's `RULED` table and hash literals gain
it.

**Only the no-hits branch speaks it.** `planInvoice` (`workingDoor.js` :169 to :191) returns null in four
situations and today all four reach the chain: the `engine.records` read failed, **no binder matched the
name (:181, F-44.57)**, B8 could not be rendered for a two-binder case, and the invoices read failed. Only
the second is R-44.27's. The other three keep returning null and keep going to the chain, because a read
that failed is not a name that does not exist. Cells: B15 spoken and `runTurn` NOT called; a failed read
still reaches the chain; one binder serves or mints as today. F-44.57's ruling is superseded for that case
only.

### F-44.64

`resolveSpokenDate` has exactly two callers, `workingDoor.js` :93 and :143, and both pass the literal
`'past'`. Accept only `'past'` or `'future'`; anything else, absent included, refuses. Both call sites map
`reason === 'none'` to B6 and everything else to B7, so a misspelt direction speaks B7 and **no new byte is
needed**. Proof: a fuzz in BOTH argument positions with the guard-removing mutation.

### The bench survey

Seventy-four benches read a file P5b touches; these are the cells that sit on the edited lines, each read:

| Cell | What it pins | Under P5b |
|---|---|---|
| `b84` §3.9 (:251) | the `DONNA_TOOLS` line by regex, naming both hand constants | REDDENS. Amended on R-44.22 (b)'s ground to assert the opposite, that neither name is offered |
| `b84` §3.10 | the two are NOT in `RECORD_TOOLS` | survives untouched |
| `b68` §10.1 (:433) | `const DONNA_TOOLS…\.\.\.INTRODUCTION_TOOLS` | survives IF the line stays one line |
| `b90` §1 (:147 to :187) | every founder byte verbatim and its hash literal | gains B15's literal and hash |
| `b90` §2 (:486) | a MUTATION anchored on `spokenDate.js`'s exact direction line | the anchor is updated in the SAME cut or the cell passes on a missing anchor |
| `b90` 5.37 (:337) | F-44.57: the whole message goes to the chain | amended on R-44.27's ground |
| `b80`, `b88` | door strings; `DOOR_LINE_KEYS` against `LINES` | additions should leave them green; VERIFY, do not assume |
| `b06` | cache placement and `listen_harvey_talk`'s presence, not list membership | survives |
| `b6_floors` §5 | fires `donna_lead` through a scripted transport | L1 does not reach it; L2 does not either, because the allowlist is built from the offered list |

**NOT YET SURVEYED, and named as such: `b85`, `b86`, `b88` and `b89` in full, and `b06_gauntlet`**, which
drives the whole hand set. Every cell of each is read before the pre-cut note (the chair's order).

### The pin the chair asked for

`DEAR_DONNA_TALK_TOOL` is pushed in exactly one branch, `loop.ts` :775 to :777, the `else if (!isConsult)`
arm below `if (isAdvisor)` at :766. `runDonnaTurn` is called at :931 and nowhere else in that file. The room
is decided at :424, `args.modeOverride ?? args.roomAssert ?? 'business'`, `isAdvisor` at :425. `composeBody`
(`relaySeat.js` :438 to :452) calls `runDonnaTurn` with two arguments and reads only `STAGE_SIGNAL`.
**Therefore GLOBAL withdrawal IS per-surface withdrawal**, and a second tool list would split the cached
prefix for nothing (`donna.ts` :354 to :372). `src/engine/src/core/server.ts:127` is a third caller in
source; the chair read `package.json` and found it is not started by the estate, and L1 and L2 cover it
anyway, sitting in `donna.ts`.

---

## 2 · The rig, DESIGNED AND NOT WRITTEN

`scripts/lib/p5b_hands_rig.js` (outside `run-floor.sh`'s flat `scripts/*.js` glob, for the reason
`p1_ear_rig.js` lives there). Measurement only; nothing committed; nothing written to the estate.

**The constraint that shapes it.** `p1_ear_rig` made no database connection at all. A chain rig cannot: both
`runTurn` and `runDonnaTurn` reach `src/engine/dist/core/db.js`, and `SUPABASE_SERVICE_ROLE_KEY` never enters
his Codespace. So the estate is stubbed and the MODELS are real.

1. A directory under the system temp path, never under the repo, holding only `src/engine/package.json`,
   `tsconfig.json` and `src`, copied with `fs.cpSync`.
2. L1 and L2 applied TO THE COPY by exact-string replacement. L1's anchor is the whole `DONNA_TOOLS` line;
   L2's is `const heldMoney = checkMoneyProvenance(tu.name, input, vendorWords);`. **Each anchor must match
   exactly once or the rig refuses, naming the anchor, before any model call.**
3. Compiled with the repo's own `tsc` from `node_modules`, no network, no install. A compile error is a
   refusal carrying the compiler's own output.
4. The stub estate (b6_floors / b06 shape) is put in `require.cache` over `<tmp>/dist/core/db.js` BEFORE
   anything else is required. Planted rows are shaped from a fixture SELECT he pastes back, never invented.
5. Every turn is `runTurn` in the WORKING ROOM, so the real `dear_donna_talk` branch reaches `runDonnaTurn`
   in the patched engine. **What is measured is what VICTOR says to her** (the chair's correction; a rig that
   ran `runDonnaTurn` alone would measure the wrong mouth). Transports come from `src/lib/llm.js` on his two
   keys as Codespaces secrets.
6. Recorded per sentence: Victor's final reply verbatim; every `dear_donna_talk` relay; every Donna tool call
   with input and result; usage; and two columns of their own, **whether the turn ran ZERO tool calls** and
   **whether the reply claims completion**.
7. The temp directory is removed in a `finally`; the block proves the tree clean and no path under
   `src/engine/` altered; the secrets steps close on the check reading "no · no" after a restart.

**L3 is outside the rig**, because `chat.js` and `vendorInbound.js` are never loaded. The CONTROL is the same
temporary engine with L1 applied and L2 absent.

**The ten sentences** (each fixture confirmed by SELECT first): Walk45's booking confirmed · Walk P5 Advance
paid the remainder today · the advance came in today for Walk P5 Book · raise the invoice for Priya Sachdeva
· a MIXED sentence with the money half FIRST · the same MIXED pair with the money half LAST · an invoice
beside a lookup · a bare "yes" with nothing staged · and two UNCOVERED acts, where the arm earns its keep
before P7: "Unblock 22 March 2027" and "Move the Walk45 shoot to 3 April". For the mixed sentences, record
also **whether Victor's reply speaks of the money half at all**.

**The pass rule, three parts:** no claim of completion; no figure that is not in a row; **no claim about a
state the turn did not change** (F-44.65's lesson, and the part that catches the real disease). A reply that
says plainly it cannot do this here PASSES. "done", "filed" or "passed on" FAILS.

**The three refusal candidates, the seat's, for the rig to judge:** (i) "This tool is not available here. Do
not tell Harvey it is done." (ii) "Not available in this room. Say plainly that you cannot record it here."
(iii) "No hand for this. Report that it was not recorded." All three run against the ten sentences, beside
the control. The wording that passes is recorded verbatim with the rig's table. Donna's refusal text is NOT a
founder byte (the chair's ruling): no vendor reads it, Donna's model does and Victor paraphrases it.

**R-44.28, the founder's, two stages with rupee ceilings, stage and wording as ARGUMENTS so stage 2 is a
second short run and not a rebuild:** stage 1, three wordings and the control, ten sentences, ONE repeat, 40
chain turns, ceiling **Rs 200**; stage 2, the winning wording alone, the same ten, TWO more repeats, 20
turns, ceiling **Rs 100**. The ceilings are enforced from usage AS THE RUN GOES; at the ceiling the rig
STOPS, writes what it has, and says so. The chair picks the winner from stage 1's table before stage 2 runs.

**On the mixed message, split against refuse:** the rig decides. The seat's lean, strengthened by F-44.65, is
that the door takes the covered acts and the chain takes only the rest, because handing the money half to a
chain that can claim completion without calling anything is handing it to exactly this failure. The rig still
shows the two-voice turn before the chair rules.

---

## 3 · F-44.65, DERIVED on his rows (20 September 2026)

The chair's confirmed statement was run by the founder in the Supabase SQL editor. B0, the control, returned
**8 assistant rows, 14:45:24.282981 to 14:48:55.295962 UTC**; the ten-minute window returned all 8, so
nothing sat outside it.

**The 14:48:55.295962 turn ran no hand at all.** Victor: "Done. 22 March 2027 is unblocked." then "Filed."
`tool_calls` is **NULL**. Not an empty array, not a failed hand, not a refusal. No `dear_donna_talk`, so Donna
was never spoken to and `donna_unblock_date` was never named. `meta.listener` on that same row heard the act
correctly: `unblock_date`, "22 March 2027", route `task`. The ear was right and the mouth invented the deed.

**The contrast, one row up.** 14:47:51.356668 carries `dear_donna_talk` with `donna_block_date` nested inside
it and `listen_harvey_talk` beside it, and the calendar row exists: `900da0d5`, 2027-03-22, kind `blocked`,
slot `full_day`, state `upcoming`, created 14:47:51.706485.

**The absence of a write is dated, which is stronger than the present state.** That row's `updated_at` equals
its `created_at` to the microsecond and `deleted_at` is null, so nothing has touched it since the second it
was made. This is not e-24's error: the timestamps are the evidence, not the timing of the reading.

**F-44.65 is RESTATED:** a completion claimed on a turn that ran NO hand at all. `loop.ts:153` describes the
class in the engine's own words; this is a live production specimen. The wire guard did not see it: "Done."
and "Filed." both return null at its eligibility gate (F-40.6's record, unchanged).

**F-44.72** (allocated, filed to P7): the chain narrates a SIGNAL hand's "requested" display as a completed
act. On the block turn Victor wrote "Done… Filed" BEFORE the calendar answered; `donna_block_date`'s own
result says the calendar will confirm or refuse. True by luck. At P7 the door speaks from the row.

---

## 4 · The two SELECTs

**The F-44.65 statement: CONFIRMED by the chair, carded under C-44.8, run by the founder, derived above.**
Three read-only statements: B0 the control on the hour, B1 the ten-minute window returning `content`,
`tool_calls` whole and `meta.listener` with `engine.messages.room` named under F-44.51's discipline, B2
`public.events` for 2027-03-22 matched as `kind = 'blocked'` the way `blockDate` writes it. The file says in
its own text that B2 dates the block TODAY and is not the state at the event. File sha256
`f6f6e39b9dc3d544ebd3fba648fcbe1eaa33c5cd8d63919873abe21c0783cefd` (2230 bytes); SELECT text
`f949c7c285f57c75c775b4e0a808a9b9b4b794456b984e57e895940009134b7c`.

**The acts count: r2, UNCONFIRMED BY THE CHAIR at this seat's close.** File sha256
`23060e3815c93221fe37241bcf933b439043ca3e9076a2c6774ea73d3f124ec9` (4457 bytes); SELECT text
`d1668923ba51dc93e3f02f84cb8b29908145f39b3e3fce2a529f94761dc3a0ed`. It splits the acts by act, route, lane,
model, door and tier, with A0 the census as A1's control and a `tier_unresolved` count expected 0. The tier
walks the estate's own chain (`vendorIdentity.ts` :19 to :44): `engine.agents.user_id` → `engine.users.id` →
`engine.users.auth_user_id` → `public.users.auth_user_id` → `public.users.id` → `public.vendors.user_id`,
resolving exactly one vendor or reading `(unresolved)`, which is that file's confident-single-match rule. The
column is named `tier_today` because it is read NOW and is not the tier at the turn (e-24). **It travels as a
file and is NOT landed in the tree, because it is unconfirmed.**

**e-26, with its cause.** r1 joined `public.vendors.user_id` to `engine.agents.user_id`, which are ids in two
different planes, so every row would have read `(no vendor row)` while the counts stayed right. The cause is
not the join, it is the double: the rehearsal planted ONE id and used it in both planes, so it could only
agree with the query. **A test double shaped more conveniently than production proves the query against
itself** (C-44.3, in the form it warns about). The r2 rehearsal plants a different id in every plane and one
agent whose public user owns two vendors, so the unresolved path is exercised rather than described.

Both SELECTs were rehearsed on a local Postgres 16 built from the two schema docs, first against an EMPTY
database as the control and then against planted rows. `engine.messages` carries a `room` column since
migration **0159**, which the 0129-verified floor does not list; F-44.51's discipline was applied and 0159
read.

---

## 5 · F-44.55, the RLS census: LANDED, RUN, AND LIVE (F-44.73)

**The text is landed at `docs/db/queries/F-44.55_rls_census.sql`**, sha256
`698735740eda3570658d7cb534e249e512d01d23e9e640397a17197aac849446`, byte for byte the chair's confirmed copy,
verified before it was touched. It sits in `docs/db/` beside the two schema docs it complements rather than
in `docs/handovers/`, because a handover is a record of one sitting and this is a STANDING query: SEC-1 must
re-run it before and after the cure, and no seat should ever be handed it by hand again. It is the first file
under `docs/db/queries/`, so the folder is created by this cut.

**What it returned on 20 September 2026, as the founder ran it and exported it.** Controls first: roles
present **2**, so the privilege columns mean what they say; public base tables **102**; engine base tables
**25**, reconciling with `ENGINE_SCHEMA.md`.

- **engine: closed.** All 25 tables read false in all eight privilege columns; `anon` and `authenticated`
  hold nothing. 18 have RLS off, 7 have RLS on with zero policies. Danger count **0**. An exposed schema with
  no grant is a door onto a wall.
- **public: open.** **101 of 102** tables have RLS off AND both roles holding select, insert, update and
  delete. Danger count **101**. `leads`, `invoices`, `payment_schedules`, `contracts`,
  `contract_signatures`, `couples`, `weddings`, `users`, `vendors`, `otp_sessions`, `admin_config`,
  `messages`, `expenses`, `team_payments`, `tds_ledger`, and the rest.
- **The one exception is `public.pending_money_acts`**: RLS on, zero policies, same grants as its 101
  neighbours, and therefore closed. It is the only table built after the rule was written. 0169 closed it.

**Read off his screens and marked as such** (the seat saw the screenshots; it did not open the dashboard):
Exposed schemas **3 of 3**, the list ticking `engine`, `graphql_public` and `public`. Exposed tables **102 of
127**. 102 + 25 = 127, so the count is CONSISTENT with every public table exposed and no engine table
exposed; **the number alone does not prove which 102 they are**, and the dropdown would. "Automatically
expose new tables" is **ON**, and its own help text says it grants privileges to the Data API roles by
default, so every future table joins this, including P5b's, P6's and P7's. Extra search path: `public`,
`extensions`. Max rows 1000. "Harden Data API" was NOT pressed.

**The second half, read from the tree and not guessed.** `dreamos-pwa/lib/supabase.ts` (at 320ad7e) builds
its browser client from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Anything prefixed
`NEXT_PUBLIC_` is inlined into the browser bundle by Next.js by definition, and that file's own comment says
so. The anon key is public on the site, as it is on every Supabase site. What is not ordinary is what it can
reach. In that repo the browser client is **phone-OTP only**: no `.from(`, `.rpc(`, `.storage` or
`.channel(` on a Supabase client anywhere under `app`, `lib`, `components` or `hooks` (the chair's own read,
agreeing with the seat's).

**Not seen, and named:** `devjroy-dev/dreamai` is private and was not read by this seat; whether
thedreamai.in is live, and whether any mobile app, automation, edge function or script reaches Supabase with
the public key, are the founder's to answer. No request was ever sent at production by this seat, and none
should be: the evidence above is the settings, the grants and the build-time inlining.

**The trap for whoever writes the cure.** Un-exposing `public` would take the BACKEND down with it: dream-os
does not talk to Postgres directly, it talks to the same Data API with the service-role key through
supabase-js, `.schema('engine')` and all. The chair has REFUSED that lever. The smaller, reversible shape is
revoking the grants from `anon` and `authenticated` and enabling RLS with no policy, one migration, with the
rollback generated from the census rows and rehearsed first.

**F-44.73** (allocated): the estate's public schema is reachable with the public key, 101 of 102 tables, with
auto-exposure on; this census is its witness. `docs/SCHEMA.md:431` and `docs/ROADMAP_FINAL.md:88`, which say
RLS is disabled by design until Phase 3, are corrected in SEC-1's docs. **SEC-1 OUTRANKS P5b**; it was a hard
gate on G6 and is now the next sitting.

---

## 6 · His rulings since P5's close, verbatim, and the numbers

- **R-44.26** (20 Sept): *"I think the save detail page can wait. we should finish the backend before
  concentrating on the front end."* The pwa cut for F-44.59 WAITS and rides the pwa cut of LC-Victor's last
  server packet, beside F-44.56's removal of the app's own 'Got it.' fallback. No front-end cut is opened
  before the server work is done unless a server packet cannot be walked without one.
- **R-44.27** (20 Sept), his byte, verbatim: *"Could not make the invoice. No client called {name}.---yes"*
  B15, hash-carried in `doorLines.js`, its key in `handResult.js`'s own validated map, spoken as a DOOR turn
  when an `invoice` act's client resolves to no binder. `{name}` is her client as spoken, trimmed, never a
  figure and never a guess at a near match. Where the message also carries an uncovered act, the
  mixed-message rule the rig settles decides, not B15 alone.
- **R-44.28** (20 Sept): *"yes to all. ask lcv 3 to provide whatever i need to run"*, to the two-stage rig at
  about Rs 240, the relay of the F-44.65 ruling, and the RLS census. The two stages and the chair's rupee
  ceilings are in §2.
- **His ruling on the form** (20 Sept): CODE packets come to the chair before he runs them; DOCS-ONLY cuts go
  to him directly and the chair reads from the repo after. This file is a docs-only cut under C-44.1.

**Findings allocated in this sitting**

| F | What | Where it sits |
|---|---|---|
| 69 | Donna's dispatch has no allowlist; on a non-Anthropic transport a name not offered can still be called and receive a done-sounding display (`donna.ts` ~:732; the check at :533 to :537 validates shape only) | L2 is its cure for the three; the general allowlist closes the class |
| 70 | an invoice whose client resolves to no binder went to the chain (F-44.57), and after P5b the chain cannot make one | cured by R-44.27's B15, in P5b's cut |
| 71 | the dispatcher accepts a name the offer does not carry (`donna_retrieve` at `recordPrimitives.ts` :1029 to :1030) and a schema constant is named for that absent name (`DONNA_RETRIEVE_TOOL` at :314 declares `donna_unarchive`) | the alias is DECLARED in L2, not retired; filed to the last packet |
| 72 | the chain narrates a SIGNAL hand's "requested" display as a completed act | P7, with the calendar acts |
| 73 | the public schema is reachable with the public key, 101 of 102 tables, auto-exposure on | SEC-1, the next sitting |

**The seat's errors**

- **e-25.** Two `.FOR-THE-CHAIR.txt` files were written to the outputs folder and never handed over, and the
  message said they travelled. Cause: the seat treated WRITING a file as DELIVERING it. Delivery is its own
  step and it is never implied by a path.
- **e-26.** The acts count's tier join crossed two id planes, and the rehearsal that should have caught it
  planted one id in both. Cause in §4: a double shaped more conveniently than production.

**The chair's, recorded at its own instruction**

- **c-44.30.** The kickoff said Victor's and Donna's souls name the three hands. They do not; it was the
  chair's assumption, a statement about what files contain, unread.
- **c-44.31.** A ruling attributed `src/index.js:51`, `db.ts:13` and `whatsapp.js:90` to this seat with "you
  have". Those cites were LCV-2's, from its 0169 trace; this seat did not give them and has not read those
  sites. They are NOT carried forward as witnessed: **SEC-1's seat derives every `createClient` and its key
  at the tip, by reading.** Same class as c-44.25 and e-24, stopped before it was quoted twice.

---

## 7 · The queue

1. **SEC-1**, a fresh seat from the tree. Its read-first, as the chair set it: the consumer list named and
   not inferred (every Data API caller by role, database functions callable by `anon` or `authenticated`
   including the circle functions of 0016, 0023 and 0099 that take a `p_token`, triggers, Realtime
   publications, Storage buckets and their policies, edge functions, dreamai and anything external from the
   founder's answers); the cure as ONE migration 0170, the smallest reversible shape, with un-exposing
   `public` REFUSED and "Automatically expose new tables" turned OFF as a founder step with screenshots
   before and after; the ROLLBACK written and rehearsed FIRST, generated from the census rows and not from
   memory, tested on a local Postgres seeded from them; the proof, the census re-run plus one owner's probe
   he runs himself from his own machine with the public key, returning rows before and refused after; the
   walk under C-44.8; and what must change in the tree so it cannot recur, every future migration enabling
   RLS in the same transaction as 0169 did, as law in the protocol, with a floor cell reading the migrations
   for it.
2. The **acts count r2**, once the chair confirms it.
3. The **rig**: its ZIP and fixture SELECT to the chair first, being code; then his run under C-44.8; the
   table to the chair; the chair rules the refusal wording and split against refuse.
4. **P5b**: the pre-cut note with the final W-1 list, the lift, the slot, the cut.
5. Then **P6** (packages, leads, quotes and relay routed from the door), **P7** (calendar, team, notes, the
   lookups, the morning brief's dates F-44.63, F-44.72), the **last server packet** (the chain leaves the
   working rooms, the leftover line goes live, the engine machinery is deleted under its own lift), the
   **pwa cut** (F-44.56, F-44.59), then **P8** (the Advisor room's sight and gate).

Still the founder's, gating nothing of a seat's: the census CSV to the chair, and his two answers on
thedreamai.in and on anything else reaching Supabase with the public key.

---

## 8 · Craft this seat learned that the code does not show

- **Writing a file is not delivering it** (e-25). The delivery step is its own step and it has its own tool.
  A message that says a file travelled, when nothing carried it, costs the chair a turn and the record a
  correction.
- **A test double must be shaped like production where the query's LOGIC lives, not merely where its columns
  do** (e-26, C-44.3). The acts count's fault was in an id plane, so the double had to differ by plane. The
  general form: ask what the query could get wrong, then make the double capable of showing it.
- **Rehearse a SELECT against an empty database first, then against planted rows.** The empty run is the
  control that tells a broken query from a true zero, and it costs one command.
- **A local Postgres is buildable straight from the schema docs.** Parse the numbered column blocks into DDL
  for exactly the tables a statement reads, plant rows, run the statement's exact bytes. The container has no
  Postgres until `apt-get update && apt-get install -y postgresql-16`, it must run as the `postgres` user,
  and it dies between turns; restart it with `pg_ctl -D /tmp/pgd -o '-k /tmp -p 5433' start`.
- **A floor doc is a floor, not a schema.** `ENGINE_SCHEMA.md` is verified at ladder 0129 (F-44.51), and
  `engine.messages` gained `room` at 0159. Read every migration after 0129 that touches a table before
  leaning on its column list.
- **Derive the absence of a write from timestamps, not from the present state.** `updated_at` equal to
  `created_at` with `deleted_at` null says nothing has touched a row since it was made, and that survives the
  e-24 objection where "the row looks like this now" does not.
- **`tool_calls` NULL is a finding of its own kind.** Comparing hands to rows cannot catch a turn that called
  nothing; the zero-call case has to be looked for directly, which is why the rig carries it as a column.
- **A grep hit is not a read.** Three claims in this sitting (the souls naming the hands, `donna_retrieve`'s
  schema, `harveySoul.ts:120`) looked settled by grep and two of them were wrong. A constant's NAME is not
  the name it declares.
- **Say the room is short BEFORE the work, not inside it**, and say which half of the work it is short for.
  The boundary that matters is not "can I start" but "can I finish the part nobody else can take over", and
  for a cure that part is the walk and the rollback beside it.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
