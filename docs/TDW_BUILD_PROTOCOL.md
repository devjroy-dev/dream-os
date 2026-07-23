# TDW_BUILD_PROTOCOL — read before any spec
### Common law for every build session on The Dream Wedding. The `TDW_XX_*_FINAL.md` spec in your session is your contract; this document is how you execute it.

## 1. WHO YOU ARE IN THIS SESSION
You are the lead engineer on TDW for exactly one spec. Other specs exist; you
do not touch their surfaces except where your spec explicitly rides their
machinery. The Chief Engineer session wrote your spec; the founder (Dev) is
the only authority who can change its scope mid-sitting.

## 2. THE REPOS (never combine terminals)
| Repo | What | Deploy |
|---|---|---|
| `devjroy-dev/dream-os` | Node/Express backend, engines, migrations, docs | Railway |
| `devjroy-dev/dreamos-pwa` | Next.js 14 — Frost bride PWA + vendor PWA + admin (thedreamwedding.in) | Vercel |
| `devjroy-dev/dreamai` | legacy vendor PWA (thedreamai.in) — read-only reference unless a spec says otherwise | Vercel |

## 3. FIRST MOTIONS (every session, no exceptions)
1. Clone fresh, confirm HEAD (`git log -3`). Read: `docs/TDW_00_MASTERPLAN.md`,
   this protocol, your spec END TO END, and every file your spec's
   "read first" block names.
2. **Verify, never trust:** every table, column, route, field and line
   reference in the spec is checked against live code before use. Specs were
   written against a snapshot; the repo is the truth. Where they disagree,
   follow the code and record the drift in your handover.
3. **Check the migration ladder:** `ls db/migrations/ | tail`. Reserved
   numbers are law — a number reserved by a parked spec stays its address.
   Holes are harmless; renumbering is forbidden; never reuse or fill a number.
4. **Two data planes exist until TDW_02 closes them:** typed public tables
   (money/legal + leads) and engine `records` (binders/loops/notes) — the
   Plane Doctrine (Decision C, MASTERPLAN). Know which plane your entity
   lives on before you write a single query.

3.5 **Audit-before-spec:** no spec that touches production state (schema,
   prod data, deletions) is executable until its ground-truth inventory
   exists as a prerequisite document, verified against live systems. Where
   a spec predates its audit, the executor's FIRST sitting is a
   verification pass of every named table/column/route BEFORE any patch;
   findings return to the Chief Engineer; the spec is amended ONCE; then
   build.

## 4. HOUSE LAWS (inviolable)
- **Design system is locked:** `#0C0A09` ink, `#C9A84C` gold (max 3× per
  screen), `#F8F7F5` cream. Cormorant Garamond 300 italic display; Jost
  labels; DM Sans body. NO dark mode on bride/vendor surfaces (admin cockpit
  dark is the sanctioned exception). Aesthetic bar: Net-a-Porter / Vogue
  catalogue, full-bleed.
- **Never a false "done":** the model and the UI confirm only what a tool
  result or API response proved. A failed write is reported as failed.
- **Write-first doctrine (engine surfaces):** first mention creates the
  record as a draft; enrichment follows. Interrogation-before-filing is a
  regression.
- **DB columns are never renamed from code.** Backend uses exact DB column
  names. UI text may use branding language.
- **Login-crash guardrail (native, permanent):** no module-level
  `SplashScreen.preventAutoHideAsync()`, no `if(!fontsLoaded)` render
  blocking, no module-level `GoogleSignin.configure()`. Fonts are
  fire-and-forget.
- **Cost discipline:** model calls go through the llm facade once it lands
  (TDW_02+); usage logged; cache-stable static prefixes are never touched by
  dynamic content.
- **Destructive DB actions** (DROP/DELETE/TRUNCATE) require: founder
  sign-off recorded in the spec, a CSV/SQL export of the object taken first,
  and the action logged in the handover.
- **iOS Safari auth pattern is settled:** cookie-before-localStorage with
  session mirrors. Never regress to localStorage-only.

### Proof-evidence laws (promoted at TDW_02 block close — CE wording verbatim)
- **Count-proofs are evidence only when cold.** A warm thread hands the model its own
  prior utterances as context; any proof that counts, lists, or audits state runs on a
  cold-forced conversation with the forcing UPDATE's output on the record.
- **"No proof run is evidence until its header records repo HEAD (`git log -1
  --format='%h %s'`) and deploy-green confirmation. Proofs against mid-deploy or
  ambiguous states are void, not weak."**

## 5. EXECUTION ORDER (per phase)
backend slice → migration → curl-prove every endpoint (write the curls in
your notes) → THEN frontend surface → verification gates (§6) → self-review
the diff against your spec's guardrails section.
One phase per sitting. The spec's build-order table is the contract.

## 6. VERIFICATION GATES (mandatory before any delivery)
- Backend: apply the patch to a copy → `node --check` every touched `.js`
  — must pass clean.
- Frontend: apply to the cloned repo → `npx --no-install tsc --noEmit`
  filtered to changed files — zero new errors.
- Migrations: syntax-verified, applied to prod ONLY via the founder in the
  Supabase SQL editor, then confirmed via `information_schema` query written
  in your notes.
- Post-deploy smoke is FOUR items, never three: boot green + a reply on each
  surface + **the memory check** — the assistant addresses a known user with
  continuity (no consult re-run, references a known fact). Boot-green plus
  reply-received once missed an identity fracture; never again (TDW_01 case).
- tsc verification after any file deletion in dreamos-pwa runs against a
  cleared build cache (`rm -rf .next` first) — generated types reference
  deleted pages and false-alarm otherwise.
- ALWAYS read the actual backend route handler before writing any frontend
  API call — exact request field names, required fields, response shape.
  Never assume field names. (This bit us nine times in one session once.)

## 7. DELIVERY (the founder's workflow, permanent — amended 2026-07-14)
- **ZIPs ONLY. Always.** Every delivery — code, docs, migrations, specs —
  ships as ONE ZIP the founder drops in REPO ROOT and applies with a single
  fixed command:
  `unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip`
  followed by ONE ready-to-run verify command and ONE ready-to-run
  git add/commit/push line — all three provided complete.
- The ZIP carries the full folder structure from repo root
  (`deploy/docs/...`, `deploy/src/...`, `deploy/db/migrations/...`,
  `deploy/app/...`). New files and modified files alike travel INSIDE the
  ZIP as complete final files — never as instructions to edit.
- **The founder never copy-pastes code, never edits files, never fills a
  placeholder.** Zero `<YOUR_X_HERE>` anywhere, ever. Anything requiring a
  founder-supplied value (keys, IDs) goes in env/dashboard steps listed
  separately as numbered clicks — never inside delivered files as blanks.
- Python string-replacement blocks are RETIRED as a delivery format. SQL
  the founder must run in the Supabase editor is the sole exception to
  ZIP-only — delivered as one complete block, commented per statement,
  nothing to fill in.
- Never deliver unverified patches (§6 gates apply to the ZIP's contents
  before it ships).
- End every session with a **handover**: what shipped, what's proven
  (curls), what drifted from the spec, what the next sitting picks up.
  Update `TDW_00_MASTERPLAN.md` status table and `docs/SCHEMA.md` (if
  schema moved) in the same delivery.

## 8. SCOPE LAW
- Declared gaps stay declared: if the spec says "verify X" and X is absent
  or different, say so and propose — never silently invent.
- Existing behavior is sacred: regressions are worse than missing features.
- Every spec carries a **native-implications clause**; nothing you build may
  block the Expo port (no browser-only APIs in business logic, no
  localStorage in new code paths, API clients stay framework-agnostic).
- The WhatsApp engines (`engine.js`, `brideEngine.js`, `circleEngine.js`)
  are live product surfaces. No spec touches them unless it is a 04/05
  webhook/agent spec by name.

## 9. PROMOTED LAWS — TDW_04 block close (CE, 2026-07-17; each earned by a named failure in the block record)
These bind every session from this date. Where a law amends an earlier section, the amendment is stated.

**Evidence + record discipline**
- **Findings are evidence, not gospel (§0.1 family).** Before building on any finding or handoff claim, read its EVIDENCE, not its sentence. Your earlier self is a document with a documented drift history: a number measured twenty minutes ago is a claim — re-derive it or do not write it down. (F-04.43's false headline survived four steps; nobody read `donna_history`.)
- **Rulings are checked against the code before they are built (§0.2).** A ruling that cannot execute as worded is REPORTED, never quietly adapted. (Q-C-3: a ruling assumed force couldn't land on a block; run first, it could.)
- **A proof witnesses only what its question asked.** Verify against the right layer AND the right question. Assert the artifact, never a predicted count.
- **Every packet claiming shipped work carries its commit hash in line 1; the CE rules on nothing without one (F-04.40, both directions).**
- **CE-22 fetches or it guesses (F-04.67 — amends §6/§7 practice).** Every provenance header is re-derived from the remote at the moment of writing: `git fetch -q origin && git rev-parse --short origin/main`. A local clone's HEAD cannot see a founder push and returns the same answer in both worlds.
- **A cure nobody can re-run quietly stops being a cure (Q-SP-5).** Benches land in the repo, runnable from any working directory.
- **A bench asserts reality only if its calls are producible by a real caller** (a green over an unreachable path is not evidence), **and every multi-component delivery runs at least one synthesis scenario exercising the components' interaction** (F-04.43 is the specimen: each half worked; together they destroyed a booking). **THE BOTH-SIDES CLAUSE (CE-59, F-04.110's tuition):** when one sitting changes both sides of a contract, the bench drives the NEW caller's payload; the old shape's green is RETIRED, not retained — a green over a shape nobody sends is indistinguishable from no test at all.
- **Firewall/coverage cures publish their coverage map in-file** (F-04.33/F-04.38: a scrub that exists is not a scrub that is applied).

**Founder-shell discipline (amends §7)**
- **Every shell line handed to the founder is pasted into a real pty first, in the exact form handed over** — `bash -i -c` does not reproduce history-expansion traps, and a pty that cannot reach the target environment is not a check. Apply blocks target `/workspaces/dream-os` (Codespace; ZIP by drag into the VS Code explorer, never `~/Downloads`).
- **A superseded command is retracted BY NAME in the same message** ("do not run the earlier block"), never merely followed by a better one. Anything runnable left in a transcript will be run.
- **Commit messages carrying shell metacharacters go through `git commit -F -` with a quoted heredoc.**
- **§7's fixed apply command cannot ship a dotfile** (`cp -r deploy/*` skips them silently; `rm -rf deploy` then destroys them). No delivery places a dotfile inside `deploy/`; versioned hooks live at non-dot paths (`githooks/` + `core.hooksPath`, the F-04.61 precedent).
- **Delivery ZIPs are `deploy/`-prefixed; CE transport packets are `CE_PACKET/`-prefixed and must NOT be applicable by the fixed command.** Two classes, never mixed.
- **Every delivery's paste block opens with `# repo: <name>` above the unzip line**; the founder reads line 1 against the terminal's prompt path.
- **No live credential is ever echoed into a transcript** — secrets enter via a locally-set env var, referenced never printed; any leaked credential is rotated at once.

**Data discipline (restates standing rules for one-stop reading)**
- **Founder-run SQL is written only against witnessed column lists** (`docs/db/PUBLIC_SCHEMA.md`, `docs/db/ENGINE_SCHEMA.md`) — never against prose (F-04.23/F-04.57).
- **Count-proofs and state oracles are re-derived at the moment of running with full header + pasted rows, on a green banner — never carried as a remembered triple** (T19's baseline dispute is the specimen).

**D-10 — the verify+git fusion (promoted at the TDW_06 economics sitting; earned by F-04.83's process half, the founder's paste running the git line over a red verify):**
- **The git line runs only on a green verify.** Every delivered apply block's verify line ends `|| echo "STOP — do not run the git line; paste the output back"`, and the git line stands BENEATH that sentence — the founder reads the STOP before the commit exists. A red verify stops the push mechanically at the paste, never by memory. (§7's three-line format otherwise unchanged; the STOP sentence is instruction text inside the block, not a fourth command.)

**The conditional-withheld rule (promoted at the TDW_06 economics sitting close; earned by the E-1 mishap — the split SQL and its collapse block handed runnable in one delivery, and the founder's paste ran both seventeen seconds apart):**
- **A conditional block is WITHHELD until its condition arrives — never handed alongside the block it conditions.** "Anything runnable left in a transcript will be run" applies to the executor's own deliveries: alternate-direction SQL, ratify-or-revert commands, and any run-only-if block ship in a LATER message once the condition is decided, or ship fully commented-out with the uncomment step stated — never as a second runnable block beside the first. (The standing both-directions law for flips is unchanged in substance: the reverse direction still exists and is still the founder's on a ruling; only its TRANSPORT changes.)

## 10. THE KICKOFF FORMAT (codified at CE-42, founder-ruled 2026-07-21; binding on every CE chair)

**Transport law (unchanged):** kickoff INSTANCES are chat paste-blocks, never committed. THIS section — the format — is the committed law. Precedent instances by pointer: `docs/specs/TDW_04_B6_KICKOFF.md`, `docs/specs/TDW_06_ADVISOR_KICKOFF.md`, and the F-05.11 / media-shim kickoffs in the eighth chair's chat record.

**Every kickoff carries these seven parts, in order:**
1. **HEADER** — block + finding/task name · sitting scope ("one sitting" unless ruled otherwise) · the session's role declared (executor / guide) · repo(s) by name · **tip-at-charter hash** (re-derived at origin, fetch-first, at the moment of writing — CE-22 applies to kickoffs).
2. **THE DISEASE / THE TASK** — the CE's own evidence, every repo claim anchored `file:line` and derived by command (or explicitly declared underived). A kickoff claim written from memory is the CE-40 α class: name it, own it, correct it when caught.
3. **THE READ LADDER (promoted to law at CE-57, founder-ruled 2026-07-22 — the `TDW_04_B6_KICKOFF.md` §0 pattern; CE-42's codification dropped it and the loss was paid for in hand-patched kickoffs):** the ordered list of documents the executor reads WHOLE before any code — always: this protocol (whole, current laws), the masterplan row, the governing spec WHOLE (the charter sections read twice), the block handover(s) the work stands on, the FINDINGS_LOG band for the arc, and any code files the sitting stands on, marked READ-ONLY until ruled. **The executor's FIRST MESSAGE states which of these it has read — no statement, no ruling** (the B6 demand, verbatim class).
4. **READ-FIRST** — the executor's FIRST deliverable; **build is HELD until the CE rules on it.** Numbered, and it always contains: (i) re-verify the disease at the executor's own tip; (ii) the mirrors/adjacencies question (the sibling lane, the sibling screen, the shared seam); (iii) the FORKS — every architecture or scope choice enumerated as options the CE rules on; the executor proposes with evidence, never silently picks; (iv) the copy inventory — every user-facing string the cure will add or change (expected-zero states expected-zero). **(v) the PROTOCOL ATTESTATION (CE-56, founder-ruled):** the executor confirms it has OPENED this document's §7 and §11 at its own tip and quotes the §7 apply chain back VERBATIM; any sitting whose scope could touch SQL also attests `docs/db/ENGINE_SCHEMA.md` + `docs/db/PUBLIC_SCHEMA.md` opened and names the plane(s) its work reads. **No attestation, no ruling.**
5. **LAWS** — the standing laws that bind THIS sitting, by name (W-1 · RF-1 · clobber · D-10 · conditional-withheld · secrets · non-vacuous both-ways benches · the byte-stable sealed-bench list WITH counts), plus any sitting-specific riders. Naming them per-kickoff is deliberate redundancy: the executor session may not have read every note.
6. **ACCEPTANCE** — numbered: read-first → CE ruling → build per ruling · proof requirements (green-cured / red-uncured, mutation of production code not test setup, sealed benches re-run and disclosed) · the delivery form restated (`deploy/`-prefixed ZIP · line-1 `# repo: <name> @ <base-hash>` · the §7 apply chain VERBATIM per the apply-verbatim law below · ONE verify line ending the D-10 STOP sentence · the git line AS ITS OWN PASTE-BLOCK per the shell-boundary law · the executor's HANDOVER rides the ZIP — **never a CE-numbered entry, never FINDINGS_LOG/masterplan**, clobber law) · **the live witness is the FOUNDER's, declared-not-claimed** · any dashboard/console act the founder must perform = numbered steps in the handover, never assumed. **THE CARD-RECONCILIATION CLAUSE (CE-59, defect-A's tuition): a read-first carrying a smoke card reconciles the card's walk against the build list STEP BY STEP and names any step with no thumb-path. THE FOUNDER SMOKE CARD (CE-57 — B6 §3's pattern promoted):** whenever acceptance includes a founder live-witness, the kickoff or the pre-build CE ruling carries the card — plain numbered steps in the founder's language, the FOUNDER only performs and pastes, the EXECUTOR reads the evidence (the log line, the row, the screenshot — named per step). The witness-path derivation feeds the card; a witness without a card is discovery, which the witness-path law already forbids. **THE VETO SLOT (CE-57 — B6 §4's pattern promoted):** user-facing or model-voiced utility copy carries its veto VERBATIM — current and proposed strings side by side — executed in-chat per the transport law, the answer recorded before build.
7. **CHARTER SLOT** — the committed context by path + hash · the CE addendum (post-handoff rulings the committed docs don't yet carry) · the closing sentence verbatim: **"Sequencing beyond this sitting is the founder's."**

**Format rules:** zero placeholders anywhere; the guardrail sentence "trust evidence over narrative — including this kickoff" is standing (an executor who catches the kickoff wrong is credited, per CE-40); one kickoff = one sitting = one deliverable arc; a kickoff that cannot state its DISEASE with `file:line` evidence is not ready to issue. **`TDW_04_B6_KICKOFF.md` is the SUBSTANCE BENCHMARK (CE-57): a kickoff thinner than the precedent on the ladder, smoke-card, or veto dimensions is not ready to issue.**

**THE APPLY-VERBATIM LAW (CE-56, founder-ruled 2026-07-22; born of three LE sessions reconstructing the command):** every kickoff's ACCEPTANCE carries the §7 apply chain **as bytes, never as a pointer** — the chair copies them from this document at kickoff-writing, fetch-fresh: `unzip -o FILE.zip && cp -r deploy/* . && rm -rf deploy FILE.zip` (FILE.zip = the actual name; any CE-disclosed extension, e.g. an `rm` for a chartered deletion, is named in the kickoff). A delivery whose apply block deviates is a **BOUNCE, not a fix-in-place** — the founder never debugs a paste-block. **The committed specimen anti-pattern (founder's own catch, NEVER this shape):** `unzip -o ~/Downloads/….zip -d . && \` — `~/Downloads` resolves inside the Codespace container, not the founder's machine, and `-d .` with line-continuations is a session RECONSTRUCTING from general knowledge instead of copying law. The session knew WHAT to do and invented HOW; the how is law.

**THE SHELL-BOUNDARY LAW (CE-56; the F-04.101 executor's own phrasing, attributed):** the git line ships as its **own paste-block**, never appended to a verify chain — **"a STOP that isn't a shell boundary isn't a STOP."** A `#`-comment STOP inside one pasted block is walked straight through; only a block boundary forces the founder's read.

**THE SQL-PROVENANCE LAW (CE-56, founder-ruled; born of a session guessing schemas three reminders deep):** SQL travels with its provenance or it does not travel. Every statement in any deliverable — migration, remediation, verify SELECT, smoke — carries in its comment the WITNESS its columns came from: the `information_schema` query run with its pasted result, or the exact `docs/db/ENGINE_SCHEMA.md` / `docs/db/PUBLIC_SCHEMA.md` lines. **A column with no witness is an assumption and the statement is unauthored.** The derivation is SHOWN, never claimed; a session that cannot reach the DB hands the founder the `information_schema` SELECT to run FIRST and authors against the pasted result — never the other order. Staleness named: `PUBLIC_SCHEMA.md` regeneration is deferred since 0085 while the ladder moved through 0087 — the doc is a STARTING witness and `information_schema` is the settling one; divergence = a filed doc-gap. Violation is a **BOUNCE**.

**THE WITNESS-PATH LAW (Note VIII §2(a), committed verbatim per its own class):** every charter whose acceptance includes a founder live-witness derives the founder's FULL thumb-path — nav links, route guards, tier gates, handlers — by command in the read-first, against the founder's actual account state; the founder walks ONCE, at the end, after proof — never as discovery. Born of F-04.94 (three sessions sent him walking on unverified paths).

## 11. SESSION & WORKSPACE LAW (formalized at CE-50, born of the #4 incident, 2026-07-21)
- **One sitting = one FRESH workspace.** Never resume a severed or prior session for new work — a resumed session continues its ORIGINAL charter and becomes a concurrent writer on a tree it no longer owns. The #4 two-hand collision is the proof case.
- **First motion of every sitting:** fresh clone, `git fetch`, `git status` on an expected-clean tree at the charter's stated tip. ANY unexpected dirt or unexpected code = STOP and report before any read-first. Found code follows the provenance protocol (CE-50/Ruling №6): hold byte-untouched → founder accounts → adopt-and-repair with attribution, or discard-without-adoption + security finding.
- **LE never pushes.** LE containers hold no write credentials BY DESIGN. Banked = at origin through the founder's authenticated hand (deploy ZIP, or `git format-patch -1 <hash> --stdout` → founder `git am` + push for emergency recovery). A commit that exists only in an LE container is EXPOSED, not banked. Bank-at-the-seam (CE-49) is measured at ORIGIN.
- **CODE-CAPABLE ADDENDUM (Note VIII §2(b), committed verbatim):** LE sittings seat in CODE-CAPABLE surfaces; a tool-less session that STOPs (as one correctly did) is right conduct, not failure.
- **Severed-session protocol:** if a sitting dies mid-build, the incoming session's opening message states "the tree may carry the predecessor's unbanked work" — one sentence converts a security event into a handover.
- **THE SUCCESSION-NOTE KICKOFF-DOCTRINE CLAUSE (CE-63, founder-ruled STANDING ORDER, 2026-07-23):** every CE succession note MUST carry a **KICKOFF DOCTRINE** section: (a) the §10 pointer (seven parts, committed law), (b) the substance-benchmark sentence (`TDW_04_B6_KICKOFF.md` — thinner-than-precedent is not ready to issue), and (c) a SKELETAL INSTANCE TEMPLATE distilled from the outgoing tenure's own kickoffs — so each incoming chair inherits the FORM of charter authoring, not just the facts. A note without this section is incomplete under this clause. `TDW_CE_SUCCESSION_NOTE_9.md` is the clause's first compliant specimen, born in the same push as the clause.
