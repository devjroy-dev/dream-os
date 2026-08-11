# repo: dream-os @ 31eaa68
# TDW_FROST_AUDIT_14 — Block 14 (CIRCLE) Ground-Truth Inventory
**Authored by:** FC-1, the First Frost Chair (parallel audit line, R-30.17) · **Date:** 2026-08-12
**Derivation tips (re-derived at origin, sibling-full):** dream-os **`31eaa68`** · dreamos-pwa **`c0faa4e`** — both ABOVE Report A's tips, movement accounted: `git diff --name-only b2e1601..31eaa68` = the P3-D prospect-exit delivery (`0119_prospect_discard.sql` + prospect lane files + `sendWa.js` + `tdw10_combined_cap_bench.js` labelled ladder-tip amendment) + Report A's own banking; pwa movement = the prospect-board exit console. **Zero circle/coplanner/frost files in either moved range.** Floor re-run inside the radius at this tip: prospect_intake 13/13 · b5c GREEN · combined_cap 37/37 · the NEW p3d_exit 36/36.
**Witness grades as in Report A:** [PUBLIC-0099] (+[LADDER] where the migration files close the gap to the committed tip 0119) · settling witness remains a founder-run `information_schema` SELECT.
**Method:** every claim derived by FC-1's own command at these tips or marked UNDERIVED. Defects PROPOSED un-numbered; forks are QUESTIONS; nothing herein is a ruling.

---

## §0 — EXECUTIVE SHAPE (one screen)

The spec (`docs/specs/TDW_14_CIRCLE_FINAL.md`, 2026-07-14) was written for a circle lane that has since been **censused, tokened, enforced, de-collided, named, and retired down to shape by the 07 tail arc (CE-119→CE-131 band)** — nine sittings the spec could not have known. The consequences:

1. **P1's headline surgery is largely PRE-DISCHARGED.** The six-link invite chain is LIVE-PROVEN end to end on a real second phone (CE-128's walk: Mehek signed in, sent, was attributed, refused forgeries at the wire). The historic liar — the join URL — was cured at migration `0099` (F-05.23, absolute-URL fix, founder-run 2026-07-23, byte-as-run). C-9's "messages auth" was cured HARDER than the spec asked: a lane-native signed-token guard (`requireCircleMemberAuth`, re-authored at F-07.72 ZIP 2) fronts Class A doors, Class B doors refuse in-handler, and the proven caller replaced every supplied path param. What remains of P1 is the C-6 template (ABSENT) and residuals the tail arc itself filed (§4).
2. **The capacity model has THREE competing truths and the spec's own reserved migration implements the dead one.** Live RPC: hard cap 3 (`0099`, byte-verbatim from `0023`). Spec C-2: tier ladder Basic 3/Gold 5/Platinum ∞ — reserved as `0098`'s RPC replacement. Block 17's E-9 (LOCKED, and the masterplan row for 14 already says "C-2 amended by E-9"): the ladder DIES, cap = `full_table ? unlimited : 3`, couple Gold/Platinum gating RETIRED product-wide. `0098` as reserved would build a rung E-9 retires. Q-1.
3. **The member's private-AI surface was deleted, not fixed — and the spec doesn't know.** `dreamai.js` is GONE (F-07.115 closed by DELETION, founder-ruled: "the lock was right and the feature did not belong there"); circle members reach Mira on **WhatsApp** (`brideIndex.js:677`, the ONE live caller of `runCircleAgenticTurn`). The spec's eight-router census is seven; its P6 "member AI" sitting lands on a WhatsApp-only soul, which is **W-1 ground**.
4. **The circle spend sites are LIVE, UNMETERED, and are CE-30's chartered subject — named here, proposed on not at all** (fence clause 4 / the kickoff's own instruction re F-10.105/.112): `circleEngine.js` runs `MODEL_HAIKU` on a direct anthropic client, computes cost, and **console.logs it** (:89, :183–:184) — zero `engine.usage` writes, zero cap reads, spending from the couple's allowance-that-does-not-exist; `brideEngine.js` is the same shape (:292). Overlap named; FC-1 stops here.

---

## §1 — SPEC §0 "READ FIRST" TABLE, GRADED

| Spec row | Grade | Evidence |
|---|---|---|
| `docs/BRIDE_AUDIT.md` §2 §6 | **EXISTS, moved** | `dream-os docs/specs/BRIDE_AUDIT.md` (Report A §1's same pointer note) |
| `src/api/couple/circle.js` (309 ln) | **VERIFIED at 309 ln** | invite RPC call :42–:46, cap error mapping :50–:52 ("Circle is full. Maximum 3 members allowed."), phone E.164 normalise :34–:40, best-effort phone persist :66–:73, join-URL + wa.me builder :78–:82 (absolute, `FROST_WEB_ORIGIN` fallback `https://thedreamwedding.in` — the F-05.23 cure in place) |
| "The eight routers" `src/api/circle/{join,session,feed,threads,messages,muse,dreamai,verifyPin}.js` | **SEVEN — dreamai DELETED** | filesystem: join 355 · session 108 · feed 88 · threads 186 · messages 465 · muse 207 · verifyPin 124; `dreamai.js` absent (F-07.115/CE-129 class, deletion recorded at `circlePermissions.js` header + `router.js:107`'s tombstoned mount comment) |
| "messages.js's missing member scoping" | **SUPERSEDED — cured beyond spec** | §3 below; F-07.72 whole |
| "muse.js's existing member `/save`" (the pattern to mirror) | **HALF-STALE** | `/save` exists (:53) and `/:saveId/comment` (:109) — but the spec's "same pattern muse.js already uses" points at `getCircleMember`, which was **deleted as dead code** (F-07.116: defined, never called); muse is now Class A behind the guard (`router.js:143`). The mirroring instruction would resurrect a corpse |
| `invite_circle_member` RPC source | **ON THE LADDER** | `0099_circle_invite_link_fix.sql` — byte-verbatim from `0023_circle_cleanup.sql:104-170` +1 line (the URL), 3-cap + 7-day expiry + `circle_member_limit_reached` hint preserved (:26, :69). [LADDER, applied-witnessed per its own header] |
| `app/circle/join/[token]/page.tsx` + `app/coplanner/*` | **VERIFIED, grown** | join page 454 ln; coplanner = layout 383 · page 306 · TabBar 96 (**FOUR tabs** — HOME/MUSE/THREADS/SETTINGS at :40–:44; the fifth DREAM AI tab deleted, its header :7–:18 records why) · CircleSessionContext 232 · muse 140+192 · settings 143 · threads 163+249 |
| `circle_members` in SCHEMA | **13 columns** [PUBLIC-0099] | PUBLIC_SCHEMA.md:74–:89 — id, couple_id, invitee_name, invitee_phone, role, invite_token, status, sticky_couple_until, invited_at, joined_at, created_at, updated_at, expires_at. **None of 0098's adds exist** (no `visibility` jsonb); no post-0099 migration touches the table [LADDER] |
| `circle_activity`, `circle_sessions`, `couple_tasks`, `muse_saves` columns | **UNDERIVED this audit** beyond: no `circle_polls`/`circle_poll_votes` tables anywhere on the witness (grep: zero) · no `contributed_by_member_id`/`circle_status` on `muse_saves` (grep: zero) · adjacent fact worth P5's attention: **`public.events` col 18 is `assigned_member_ids uuid[] NOT NULL default '{}'`** with a GIN index (PUBLIC_SCHEMA.md:438, :2414–:2415) — an 04.5-era assignee array on EVENTS, not the spec's `couple_tasks.assigned_member_id` single-ref; P5's delegation design should collide with this deliberately, not discover it |
| `src/agent/{circleEngine,circleSystemPrompt}.js` | **VERIFIED** 199 + 124 ln | §5 |
| `middleware.ts` — "coplanner host/scope rewrites (break candidate #4)" | **STALE — ZERO coplanner handling** | `grep -n coplanner middleware.ts` = empty. Session scope is carried by the lane-native Bearer token, not by middleware. Break candidate #4 as framed no longer exists |
| `lib/templates.js` + TEMPLATES.md | **MOVED + half-built** | registry is `src/lib/templates.js`; doc at `docs/TEMPLATES.md`. `circle_activity` template: **ABSENT** (grep both: zero). What EXISTS: `circle_join_otp` → `tdw_circle_join_otp`, FOUNDER-FINAL on the WABA, Meta-witnessed 2026-08-04 (`templates.js:436–:438`) — the join chain's OTP leg is template-real on Meta. The spec's "submitted to Twilio" is dead language: Twilio sunset at CE-62; C-6 files at Meta |

---

## §2 — THE SIX-LINK INVITE CHAIN AS IT EXISTS (what "invite surgery" would actually cut into)

All dream-os cites @ `31eaa68`.

| Link (spec's i–vi) | Live implementation | State |
|---|---|---|
| (i) invite RPC row+token | `circle.js:42–:63` → `invite_circle_member` (0099); returns `{invite_token, join_url, wa_me_link, member_id, has_phone}` :84–:90 | LIVE; cap-3 refusal mapped :50–:52 |
| (ii) link construction | `circle.js:78–:82` — absolute join URL + recipient-addressed wa.me (or generic share when phone absent) | **CURED at 0099** (the historic liar); F-05.23 closed in production per the migration's own header |
| (iii) join/validate | `join.js` token lookup + **F-07.72's second gate at :227** ("the second gate, on the far side of the OTP") | LIVE |
| (iv) send-otp `circle_join` | `join.js:132–:191` — invite-scoped (new phone allowed, unlike couple/auth), purpose `circle_join` :171, purpose-mismatch refusal :216, rides `otpSend` (Meta auth template `tdw_circle_join_otp`) | LIVE, Meta-real |
| (v) set-pin / activate | `join.js:306+`; **members share the BRIDE's PIN** (`couples.pin_hash`) — set-pin writes only if she hasn't (:13–:14). `set-pin` UNGUARDED **by ruling** (`router.js:100–:102`: the invite token's own leg) | LIVE; the shared-PIN model is a spec-unknown P2/P3 must respect |
| (vi) session establishment | NOT cookie/middleware: `verifyPin.js:112` mints a **lane-native five-part signed token** from `userRow.id` (public plane); `join.js:289` mints from the just-provisioned userId; guard verifies against `CIRCLE_SESSION_SECRET` (**rotation DONE**, founder-confirmed pre-walk, CE-128) | LIVE-PROVEN |

**The chain has already been walked clean on a real second phone** (CE-128, nine steps green; CE-131's settings walk added `ROLE: Family` live). C-1's instrument-fix-prove loop, as chartered, would re-prove a proven chain; what it would newly buy is (a) instrumented logs as durable fixtures and (b) the C-6 template. Whether P1 re-runs the full loop or narrows to its unbuilt remainder is Q-2.

**Surgery's true cut-lines if any link is reopened:** `circle.js:18–:91` (links i–ii, one file) · `join.js` whole (iii–v; carries the F-07.72 second gate and the shared-PIN doctrine) · `verifyPin.js:112` + `circleSession.js` (the mint pair; fork F1-a to Supabase identities is named at `circleSession.js:36–:40` and `requireCircleMemberAuth` §13.3's cell reddens if a bound field stops being a public users id).

---

## §3 — THE MEMBER AUTH SURFACE (C-9's ground, as the 07 tail left it)

- **Mount geometry** (`router.js:139–:146`): `/auth/verify-pin` public (THE MINT) · `/circle/join` public (THE SECOND MINT) · `/circle/session` + `/circle/muse` behind `requireCircleMemberAuth` (**Class A**) · `/frost/circle/{feed,threads,messages}` **Class B** — dual-lane (bride cookie-session OR member token), refusing in-handler on neither. The retired confession comment ("No requireCircleMemberAuth — coplanner sends no JWT") survives only as quoted history at :78–:83.
- **The guard's four-step proof** (`requireCircleMemberAuth.js`, header + body): (1) Bearer verifies against `CIRCLE_SESSION_SECRET`; (2) bound `user_id` is a live `public.users` row; (3) that row's phone is an **ACTIVE `circle_members` row — revocation live on every request**, which is what licenses the 90-day TTL; (4) the membership's couple = the token's bound couple (:128–:130, the WHO-vs-WHOSE-CIRCLE distinction). `resolveUsersId` deliberately NOT called — the §0.2 report in-file (:31–:53): the credential's provenance is already public-plane, so there is no hop to make; the guard against drift is bench §13.3.
- **Fork E one home:** `circlePermissions.js` — `Object.freeze`d block, fresh copy per call; both readers (guard :142's attach, `session.js:98`'s render) reach it by CALL. Current flags: `can_see_budget:false · can_see_guests:false · can_see_vendors:false · can_contribute_muse:true`. **This is a lane-static constant, NOT the spec C-3 per-member visibility matrix** — but it is exactly where C-3's resolver would seat, and the F-07.115 declaration in its header binds HOW anything new arrives (as a COLUMN with a migration, reddening the inverted cell §13.13 on its way in).
- **Identity residue on the founder's shelf, inherited by this block:** **F-07.125** — the guard's name preference `userRow.name || member.invitee_name` (:133) contradicts F-07.107's messages-side ruling (invitee_name, "the name the bride herself typed"); a member's messages say Mehek while settings says Droy. The founder's product word is the open item; any P2 "welcome" copy or P6 soul that speaks the member's name inherits it.
- **F-07.113's third answer** (present-but-unresolvable credential → NULL/NULL author) is OBSERVABLE now — the log line at the write seam (`messages.js:279–:285` names the class; zero credential bytes by construction) — but remains a lawful production state; one message ("walk two") is permanently anonymous by ruling.

---

## §4 — THE THREAD PLANE (what P3/P5's threads-and-polls work stands on)

- **The discriminator IS the model** (`messages.js:28–:32`): `counterparty_user_id IS NULL` → THE group chat, one per couple; `= <users.id>` → a member's private AI thread. All four cured selectors carry `.is('counterparty_user_id', null)` — resolver `messages.js:195` (+ explicit `null` on insert :212, written for the human), `dm:` write target :333, per-thread read `threads.js:59`, list `threads.js:150` (:139's projection note: the column leaves the SELECT as it enters the predicate).
- **The WhatsApp lane KEEPS MINTING private threads by ruling 「 A 」** (CE-129's board note): `brideIndex.js:358/:369` reads/mints per-member `counterparty_user_id` rows. Any 14 sitting that touches thread kinds or the discriminator collides with a live WA behavior that is ruled, not accidental.
- **The identity pair is live** (0105 + F-07.107/.109): inserts write `sender_name` + `sender_user_id` from the RESOLVED caller (`messages.js:358–:359`); the client `sender_name` parameter is DELETED from the contract (:11–:16, :254–:258); the `'Bride'` literal fallback is dead (:384's tombstone comment).
- **The parked pair of partial unique indexes** (CE-125's + F-07.112's R-b) remains parked "together or not at all" — the group-thread race is defended in code, not schema. P3's polls/threads DDL sitting is the natural carrier IF the CE re-opens them; named, not proposed.
- **Moving-ground adjacency (fence clause 4, stamped):** the relay arc's `couple_thread` machinery (`vendorInbound.js` writers, `VENDOR_LANE_KINDS` at `coupleWaWindow.js` — F-06.153's kind→lane map, first home) shares the `conversations` table with the circle lane's `circle_thread`/`dm:` kinds. At `31eaa68` the two vocabularies are disjoint by kind-string; any block-14 sitting minting a NEW kind or altering thread resolution must check that map first. Collision radius named for CE-30; FC-1 asserts only the disjointness-at-this-tip, derived by grep of both files' kind literals.

---

## §5 — THE MEMBER'S AI (C-7's ground) AND THE SPEND SITES (named only)

- **`circleSystemPrompt.js` (124 ln) is pre-doctrine.** Its header is a rules-list constitution ("We never: … The agent's job is narrow: 1. 2. 3.") — the exact shape LD-5/the 06 law re-authors. Voice: deferential-warm, loyalty-to-the-bride, **TOOL SURFACE: NONE in B2** (:20–:22 — members' images/links flow through auto-save, text→activity rows; the agent only acknowledges). It carries one modern graft: the CE-65 name+register reconciliation (:29+). C-7's affirmative pass: **NOT DONE**, and it is a **W-1 surface** — under FC-1's fence and the standing W-1 law this file is read-only ground; the doctrine sitting needs its own charter with veto ledger.
- **`circleEngine.js` (199 ln):** direct `anthropic` client, `MODEL_HAIKU` hardcoded (:23, :103) — **no facade adoption** (P6.2's "facade if 05 P5 hasn't reached it": it hasn't); cost computed via `calculateCost` and **console.logged** (:183–:184); usage accumulates in-memory only (:134–:135). **ONE live caller in the estate:** `brideIndex.js:30/:677` — the WhatsApp lane's warm-acknowledgment turn. The PWA doors died with `dreamai.js`.
- **The spend overlap, named and left (kickoff clause: F-10.105/.112's three are CE-30's subject):** at this tip the circle member's turn (a) reaches a paid model, (b) writes **zero** `engine.usage` rows, (c) consults **zero** cap machinery — and the bride's own `brideEngine.js` is byte-similar in shape (cost console.logged at :292, no usage write, no cap read; derivation: grep for `engine.usage`/cap reads across both engines = empty). The combined-cap arc that closed the VENDOR lanes (F-10.100, `vendor_ai_*`) has no couple twin. **FC-1 proposes nothing here.** The facts above are handed as the census CE-30's charter can consume.
- **STOP armor for members** (spec P1.3's rider): `brideIndex.js` shows no opt-out gate at the circle turn (grep `opted_out|WaOptedOut` in brideIndex = zero hits). Whether the bride-lane inbound path carries its own upstream block is UNDERIVED (the F-05.2 gate lives in `whatsapp.js`/`sendWa` on the OUTBOUND side; the P3-D exit arc just re-proved the opt-out register's reach on the prospect lane). Flagged as a derivation the P1 charter should order, not a defect FC-1 can convict at this depth.

---

## §6 — LOCKED RULINGS C-1…C-9, GRADED AGAINST THE TREE

| # | Grade | One line |
|---|---|---|
| C-1 surgery | **PRE-DISCHARGED in substance** | liar cured (0099); chain live-proven (CE-128); remainder = C-6 + optional re-instrumentation (Q-2) |
| C-2 tier caps | **SUPERSEDED by E-9** (masterplan's own note) | live = hard 3; 0098-as-reserved builds the dead ladder (Q-1) |
| C-3 visibility matrix | **ABSENT; seat exists** | `circlePermissions.js` is the one-home a resolver would replace-in-place; no jsonb column, no per-member state |
| C-4 polls | **ABSENT** | no tables on any witness; parked-index interaction named §4 |
| C-5 delegation | **ABSENT; adjacent machinery exists** | `events.assigned_member_ids uuid[]` + GIN (04.5) vs spec's `couple_tasks.assigned_member_id` — design collision to resolve at charter |
| C-6 template | **ABSENT; transport language dead** | files at Meta now; `tdw_circle_join_otp` proves the WABA path |
| C-7 doctrine pass | **NOT DONE; W-1 ground** | rules-list era + CE-65 graft; needs its own soul charter |
| C-8 member key | **ABSENT** | one manifest, name "The Dream Wedding", start_url "/", no `/coplanner` scope, no bride-name templating, no splash (Report A §4's absence compounds) |
| C-9 messages auth | **CURED BEYOND SPEC** | F-07.72 whole (§3); the spec's mirror-muse instruction points at deleted code |

---

## §7 — PROPOSED DEFECTS (no numbers; CE-30 banks)

**PROPOSED-14.A — Migration reservation 0098's contents are stale against LOCKED law.** The reserved file implements the Basic/Gold/Platinum RPC ladder that E-9 (block 17, LOCKED) retires and the 14 masterplan row already flags as amended. Authoring 0098 as reserved would ship a capacity model with a committed death sentence. Evidence: spec §3 vs TDW_17 §1 E-9 vs live `0099` RPC (hard 3) vs `couples_tier_check ('basic','gold','platinum')` [PUBLIC-0099:1223–:1224]. Cure shape is a re-scope of 0098's contents at charter (interacts with 17's 0093 which re-replaces the same RPC) — CE-30's, with the founder's sequencing word on whether Full Table's flag arrives early.

**PROPOSED-14.B — The spec's §0 map would misdirect its executor at five points** (eight routers→seven; mirror-muse→deleted `getCircleMember`; middleware break-candidate #4→zero coplanner middleware; Twilio submission→Meta; the dreamai member-AI surface→WhatsApp-only Mira). Same class as PROPOSED-13.C; the §3.5 amend-once leg is this document.

**PROPOSED-14.C — C-8 as specced collides with the single-manifest reality plus the Report-A splash absence.** "manifest.circle.json scoped to /coplanner, templated name, bride splash collection, both themes" presumes: per-scope manifests (none exist — one `public/manifest.json`), the bride slide collection (0097 unspent, Report A §4), and two themes (single-theme ruling, Report A §3). The C-8 sitting inherits three upstream absences; charter should order them or waive by name.

**PROPOSED-14.D — The spec's acceptance 3 ("Platinum seats 8 without complaint") and its tier-whisper copy are unbuildable under E-9** — same disease as 14.A surfacing in the acceptance table and a copy byte ("Gold opens two more chairs") that would need a veto for a rung that won't exist.

*(Deliberately NOT proposed: the private-thread WA minting — ruled 「 A 」; the parked indexes — sequenced-together law; F-07.125 — already on the founder's shelf; the spend sites — CE-30's charter by the kickoff's own fence.)*

---

## §8 — QUESTIONS FOR CE-30 (relayed as bytes; FC-1 rules nothing)

**Q-1 — The capacity fork.** 0098's re-scope: (a) author the E-9 shape now (`full_table ? NULL : 3`) with the flag column arriving early; (b) author nothing at 14 and let 17's 0093 own the RPC change whole; (c) other. Interacts with 14.A/14.D and the whisper copy's veto.

**Q-2 — P1's remainder.** Given the chain is live-proven and C-9 cured, does P1 re-charter as (a) the full instrument-and-walk as specced (a re-proof), or (b) a narrowed sitting: C-6's Meta template + the STOP-armor derivation (§5) + fixture-grade chain logs? Sequencing the founder's.

**Q-3 — The member-AI surface question that precedes C-7.** Mira-for-members is WhatsApp-only by deletion ruling. Does the doctrine pass (i) target `circleSystemPrompt.js` as the WA member voice alone, (ii) re-open a PWA member-AI surface (which would reverse a founder ruling — named, not recommended, not opposed), or (iii) fold into Block 8/9's soul-arc queue where the estate's other soul sittings live? W-1 charter required in any arm.

**Q-4 — C-3's resolver seat.** The spec demands ONE choke point; the tree already has one (`circlePermissions.js`) with an inverted bench cell guarding additions. Is the C-3 build a replace-in-place at that home (FC-1's read of least-surface), with the jsonb column entering exactly the way the F-07.115 declaration prescribes? Confirmation is the CE's; the seat's geometry is derived above.

**Q-5 — The F-07.125 name word.** P2's welcome copy and P6's soul both speak the member's name; the two-answers state is on the founder's shelf. Does the word land BEFORE the 14 charter opens? (Pure sequencing; evidence at §3.)

---

## §9 — WHAT A 14 EXECUTOR MUST NOT DISCOVER MID-SITTING

1. Seven routers, not eight; Mira-for-members is WhatsApp-only; the guard is real and mounted (`router.js:139–:146`).
2. The chain is proven; the liar is dead; the mint is lane-native five-part, not a JWT; members share the bride's PIN.
3. `circlePermissions.js` is the one-home with a re-read declaration that binds how anything new enters.
4. The discriminator is the whole thread model; the WA lane lawfully mints private rows; two parked indexes travel together or not at all.
5. 0098-as-reserved is a dead ladder; E-9 owns the cap's future.
6. The spend sites are unmetered and are CE-30's subject — do not "fix" them from a 14 charter.
7. `events.assigned_member_ids` already exists; polls/delegation DDL must be designed against it.
8. F-07.113's anonymous row and F-07.125's two names are ruled/shelved states, not bugs to sweep.

— END TDW_FROST_AUDIT_14 · FC-1 @ dream-os `31eaa68` / dreamos-pwa `c0faa4e` —
