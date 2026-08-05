# TDW_09 · UX BLUEPRINT · THE F-09.20 RETIREMENT ARC (ZIP A pwa + ZIP B dream-os) — EXECUTOR HANDOVER

**Bases:** dreamos-pwa `e3210b5` (origin re-fetched at this arc's open; tip unmoved) · dream-os `e0ff7d9` local, founder tip `d5eda29` (stage-1 applied; this ZIP's deltas are disjoint from everything that moved — verified file-by-file).
**Under:** R-X10 (arm (a) founder-ratified 「 i Second that VEHEMENTLY! 」; retirement ZIPs released) · R-X6 (zero-caller re-proof at tip before any byte dies; `/vendor/auth/handoff` rides the class).
**APPLY ORDER: ZIP A (pwa) FIRST, then ZIP B (dream-os).** The two admin APIs' zero-caller case *completes* at A's apply; B before A would 404 the admin screens for the window between deploys.
**W-1 held: zero soul/lens/prompt/engine bytes. Zero copy bytes ship** — every string that dies is inside a deleted surface; no surviving copy was altered, so the veto slot is expected-zero and greppable as such.

## 1 · WHAT DIES, AND EACH DEATH'S ZERO-CALLER PROOF AT TIP

**ZIP A — dreamos-pwa (3 modified, 6 deleted):**
| Target | Proof at `e3210b5` |
|---|---|
| `app/admin/invite-requests/` — `page.tsx` (redirect index) + `dreamers/page.tsx` + `makers/page.tsx` + `_list.tsx` | inbound = NAV rows `:127`/`:128` + dashboard card `admin/page.tsx:87` — all three die in this same ZIP; zero others (`grep -rn "invite-requests"` post-edit: comment refs only) |
| `app/admin/invites/page.tsx` | inbound = NAV row `:104` + dashboard quick-link `:94` — both die here; zero others |
| `app/vendor/auth/handoff/page.tsx` | zero inbound both repos (my grep + the chair's own R-X6 derivation across dream-os `src/` — two independent hands, zero sites) |
| `lib/admin-api/index.ts` — `getInvites`/`getWaLinks`/`generateInvites`/`deleteInvite` + `InviteCode` type | last consumers were `admin/invites/page.tsx` + dashboard `:49` — both die here; landing's `inviteCode` useState is an unrelated symbol, checked |
| `app/admin/page.tsx` edits | the two counter arms (`getInvites()`, `admin/waitlist?status=new`), their two StatCards, the `:87` card, the `:94` quick-link, `useRouter`/`adminHeaders` imports now-unused — removed; Promise.all destructure re-paired; shimmer 5→4 matching 4 cards |
| `app/admin/layout.tsx` edits | Invites row + the whole Invite Requests group removed; `inbox` icon retained (Prospects uses it); `invites`/`userplus` icon defs now unused map keys — left inert, noted |

**ZIP B — dream-os (1 modified, 4 deleted):**
| Target | Proof |
|---|---|
| `src/api/register.js` + mount | zero callers anywhere, both repos — the unwired open twin; the landing's live trio is the open door |
| `src/api/invite.js` + mount | `/validate`'s only textual caller is the landing's dead `invite_code` screen (zero setters — proven at the fork paper; the text itself dies at the Opus landing cure); `/consume` zero pwa callers; the legacy console never calls `/api/v2/invite` (grepped) |
| `src/api/admin/invites.js` + mount | consumers die in ZIP A |
| `src/api/admin/waitlist.js` + mount | consumers (`_list.tsx` + dashboard counter) die in ZIP A |

**DELIBERATELY STANDING, each with its reason:** `src/api/waitlist.js` (public `POST /waitlist/signup`) — **live caller: the current landing's ceremony forms**, until the Opus landing cure deploys; retires in a follow-up ZIP after that cure lands, chair-sequenced · `waitlist_signups` + `invite_codes` **tables** — history rows; any drop is founder SQL under the destructive-DB law after a count SELECT · **the legacy server-rendered admin console** (`src/admin/router.js`, mounted `index.js:159`) — **§0.2 REPORT: it is a second, older admin that still mints `invite_codes`** through its own invite pages (`views/invite`, `views/inviteMint`, `mintUniqueCode` at `:413`); it is outside this ruling's named scope and was not touched, but it is the same ceremony class wearing the old skin, and its own retirement question (possibly the whole console's) is the chair's to charter.

## 2 · CORRECTIONS OWNED, BY NAME
**№1 (both papers, appended in ZIP B):** the invite-requests family was **four files**, not the papers' two-plus-list — a redirect index existed at `/admin/invite-requests`, dashboard-linked; and the stage-1 delivery message's claim that the dashboard card targeted "a route that does not exist" was **false** and is retracted. The dashboard's two counter arms and quick-link were additional coupling the fork paper's footprint missed. All found by R-X6's own re-proof — the discipline caught its author. Rulings unaffected; radii corrected in ink.

## 3 · FLOOR
**pwa:** `rm -rf .next && npx tsc --noEmit` → exit 0, zero output (whole-tree, cleared cache per §6's deletion clause), run twice. **dream-os:** `node --check src/api/router.js` clean · `npm run build` exit 0 · dangling-require sweep across `src` for all four deleted modules: zero hits · a require-load of the router resolves every module and fails only at the container's absent Supabase env (creds-less by design), proving no broken imports.

## 4 · WHAT IS NOT DONE
The landing-side ceremony bytes (4 screens · exploring-end capture · ~20 strings · dead `invite_code` screen · the two unknown-number toasts) — **the Opus sitting's**, riding the single L-B landing cure per R-X10's own sequencing. `src/api/waitlist.js` — deferred as above. The legacy-console question — reported, unchartered. The R-X8 Notes re-home (F-09.18(a) + F-06.6) — chartered, next on this sitting's cure side. Stage 2 (heuristic + states + touch) — proceeding in parallel, unblocked.

Sequencing beyond this sitting is the founder's.
