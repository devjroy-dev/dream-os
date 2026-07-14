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
