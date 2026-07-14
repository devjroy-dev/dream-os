# TDW_10_ADMIN_FINAL — Mission Control: The Bridge, Six Domains, and Founder Superpowers
**Block:** 10 · **Repos:** dreamos-pwa (primary), dream-os (aggregation endpoints, mint, view-as, audit) · **Depends on:** 05 (prospects/failed_turns/templates), 07 (approval floor, VendorProfileView, ranking weights), 08 (demo funnel, provisioning path), 09 (tokens — dark variant derives from the canon)
**Runs in parallel with:** TDW_11_NATIVE_VENDOR (no shared surfaces; admin is web forever)
**User:** exactly one — the founder. Built like a bespoke jacket, mobile-first.
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| File | Verifying |
|---|---|
| `app/admin/layout.tsx` (316 ln) + `page.tsx` + `_components` | Sidebar cockpit, section registry, auth gate (`requireAdmin.js`) — the shell being rebuilt |
| All 30+ `app/admin/*` sections | What each does; which survive regrouping; `invites` + `invite-requests` = DELETE (W-8) |
| `src/api/admin/*.js` (18 routers) | Existing endpoints the domains re-mount; `requireAdmin` middleware |
| 05: `prospects`, `failed_turns`, templates registry · 08: demo lifecycle + funnel contract · 07: ranking weight keys, approval request route, `profileScore.js` · 09: `billing_events`, cost-meter log kinds, tokens.ts | The Bridge's and Engine room's data sources — all pre-built, this block AGGREGATES |
| 08 P2's provisioning path map | The mint rides the SAME path (one path, no drift) |
| `lib/design/tokens.ts` (09) | Dark variant derives from semantic tokens — cockpit navy as a third token set, admin-only |

## 1. LOCKED FOUNDER DECISIONS (this block)
| # | Ruling |
|---|---|
| A-1 | The Bridge home + six domains (Growth · Marketplace · People · Money · Engine · Content) + command palette. Invite rooms deleted |
| A-2 | View-as = **read-only**, short-lived, audit-logged |
| A-3 | Bridge daily numbers as proposed (enquiries, leads, claims, new vendors, revenue, trials, WA turns + INR, downgrade rate, credit state) + two funnels + the action queue |
| A-4 | Mobile-first — the cockpit must run from a phone as a first-class citizen |
| A-5 | Audit log on every admin mutation |

## 2. MIGRATION RESERVATIONS (ladder after 09 = next 0085; LD-8)
| # | File | Adds |
|---|---|---|
| 0085 | `0085_admin_control.sql` | `admin_audit (id uuid pk, actor text not null, action text not null, entity_type text, entity_id text, payload jsonb, created_at timestamptz default now())` + (created_at) index · `view_as_tokens (id uuid pk, vendor_id uuid fk, token_hash text unique, expires_at timestamptz not null, used_at timestamptz, created_by text)` |

---

## PHASE TABLE (one phase per sitting)

### P1 — The shell: domains, palette, dark tokens
1. **Dark token set** (admin-only third set off the 09 semantic tokens): cockpit navy surfaces (`#0F1622` family, preserving today's atmosphere), ivory text, slate hairlines, gold reserved for the wordmark + genuine alerts. All rebuilt admin surfaces consume tokens; hex literals fail review (the 09 grep gate extends here).
2. **Six-domain IA:** sidebar (desktop) / bottom-domain-bar + pull-down palette (mobile) — Growth, Marketplace, People, Money, Engine, Content. Every existing section re-homed (mapping table written in the PR; deep links preserved via redirects). `invites` + `invite-requests` pages and their routers DELETED (grep for consumers first; log the corpses in the handover).
3. **Command palette:** `⌘K` / mobile pull-down → typeahead over a new `GET /api/v2/admin/search?q=` (vendors by name/handle/phone, couples, prospects, demo handles, leads by client name — one UNION query, limit 20, grouped results) + static section names. Enter = jump. Recent-jumps list (server-side, per admin user).
4. Auth untouched (`requireAdmin` as-is).

### P2 — The Bridge (A-3)
**Backend:** `GET /api/v2/admin/bridge` — ONE aggregation endpoint, assembled server-side (target <800ms):
- `today` (IST day): enquiries, new leads, demo claims, new vendors, revenue (billing_events sum), active trials + expiring-in-3d, WA turns + INR cost by surface (cost-meter kinds), provider-downgrade count, credit/system state (05's flag).
- `funnels`: prospect machine states (05) + demo lifecycle counts + 7-day claim rate (08's contract).
- `queue`: discover approvals pending (count + oldest age), failed_turns unreplayed, takedown/remove events last 24h, subscriptions halted, templates awaiting Twilio verdict.
**Frontend:** the numbers as a masthead grid (Cormorant figures, Jost eyebrows), funnels as horizontal stage bars, the queue as tappable rows deep-linking into the owning domain. Credit banner (05) renders here AND persists app-wide as built. Pull-to-refresh; auto-refresh 60s; every figure tap-drills to its source list — no dead numbers.

### P3 — Minting + the approval deck (the two explicit asks)
1. **Mint:** People → `+ New` → one sheet: phone, name, category/city (vendor) or names + wedding date (couple) → `POST /api/v2/admin/mint/vendor|couple` riding the EXACT provisioning path from 08 P2 (quartet, consult_done=false, tier per current trial law) → success card with the routing handle + optional `Send welcome` (template via sendWa, governance-respecting). One screen, one tap, audit-logged.
2. **The deck:** Marketplace → Approvals rebuilt: pending requests as full-screen cards rendering `VendorProfileView` (mode preview — you approve what couples will see), completeness score + photo count pre-checked (the 6-floor already server-enforced; the deck shows margin above it), swipe right = approve / left = reject with reason chips ("photos too similar", "watermarks", "category mismatch", "quality", custom) → reason lands in the vendor's notification (09 notify) so rejection teaches. Desktop: A/R keys. Bulk-approve checkbox mode for clean batches. Approval writes `discover_eligible` through the existing route; audit-logged.

### P4 — Superpowers: view-as, the Engine room, kill switches
1. **View-as (A-2):** on any vendor card → `View as` → mints a `view_as_tokens` row (random token hashed, 15-min expiry, single-use) → opens the vendor PWA with `?viewas=<token>`: the PWA exchanges it for a READ-ONLY session variant — every mutating client call disabled at the API layer (backend rejects writes on view-as sessions; UI renders a persistent ink ribbon "VIEWING AS {vendor} — read-only"). Chat input disabled (no Victor turns on the vendor's dime). Creation + use both audit-logged. Token never reusable.
2. **Engine room (Engine domain):**
   - **Model matrix editor:** the surface × tier × role grid over the admin_config keys (02/06) — dropdown cells, save-per-cell, the `LLM_PROVIDER` force banner when env-set; caps editable beside; ranking weights (07) beside that. Every save audit-logged with old→new.
   - **Health board:** cron last-run stamps (nudges, reminders, harvest, lifecycle sweeps, discount job), webhook delivery rates (twilio-status aggregates), Razorpay webhook recency, downgrade + cache-hit rates by provider, failed_turns list with replay/discard (05's routes, surfaced properly).
   - **Templates:** registry live view with Twilio statuses (TEMPLATES.md's runtime twin).
   - **Kill switches:** pause marketing sends · pause demo cards in feed · pause morning nudges — each an admin_config flag the owning job already checks (verify; wire the check where absent), each with a visible ON/OFF state and audit trail.
3. **Global conversation view (People):** any vendor/couple/prospect → unified message ledger with delivery chips (05 P6) + soul version stamps (06).

### P5 — The Money domain
Revenue rollups from `billing_events` (MRR, by tier, churn events, halted list with re-try state) · subscription table with per-vendor drill (events timeline) · **cost side:** per-surface INR/day trend from the cost meter, cost-per-vendor-turn by tier (the matrix's report card), harvest + Closer spend lines · the discount-loop ledger (who earned what rung, applied where — the 09 job's rows) · unit-economics snapshot view (revenue vs model cost, gross margin per tier) with CSV export everywhere. Every figure reconciles to ledger rows — the truth law extends to money display.

### P6 — Audit, mobile pass, sweep (A-4, A-5)
1. **Audit middleware:** one wrapper on every mutating admin route → `admin_audit` row (actor from the admin session, action, entity, sanitized payload — secrets stripped). Viewer in Engine: filterable, newest-first. Mint/view-as/matrix/kill-switch/approval events verified present.
2. **Mobile-first pass:** every table gains a card-collapse mode <768px; the deck, mint, Bridge, palette, and kill switches thumb-tested on a real phone; 48px targets; the domain bar reachable one-handed.
3. Full acceptance sweep; section-mapping redirects verified; dead invite code confirmed gone.

---

## 3. GUARDRAILS
Admin is web forever — nothing here enters the native track · view-as writes are rejected SERVER-SIDE, not just hidden (a UI-only guard is a failed session) · mint uses the one provisioning path — a second mint implementation anywhere is a failed session · every mutation audited; the audit table itself is append-only (no delete route) · kill switches fail SAFE (flag unreadable → feature runs normally, alert logged) · tokens only; no hex literals · Bridge numbers reconcile to source rows (spot-check protocol in acceptance) · WhatsApp engines, souls, and vendor/bride surfaces untouched.

## 4. ACCEPTANCE CRITERIA
1. Six domains + palette live; every legacy deep link redirects; invite rooms return 404 and zero grep hits.
2. Bridge loads <800ms warm; three spot-checked figures reconcile by hand to their tables; every number drills to its list; queue rows deep-link correctly.
3. Mint: vendor born in one tap with the full quartet; welcome template respects governance; couple mint works; both audited.
4. Deck: approve + reject-with-reason both land (vendor receives the reason notification); A/R keys work; bulk approves a batch; floor violations cannot be approved (server rejects).
5. View-as: opens read-only with ribbon; a forced PATCH from the view-as session is rejected server-side; token single-use + 15-min expiry proven; both events in audit.
6. Matrix edit flips a live tier's provider (activity-log proof, per 02); kill switch pauses marketing sends (cron skips, logged) and fails safe when the flag row is deleted.
7. Money figures reconcile to billing_events + cost-meter rows; CSV exports open clean.
8. Audit viewer shows every P3–P5 action from this sweep; audit table has no delete path.
9. Full flow driven from a phone: palette-jump → approve two vendors on the deck → mint one → check the Bridge — all one-handed.
10. `node --check` + tsc clean; 0085 proven; MASTERPLAN gains A-1…A-5.

## 5. FOUNDER SMOKE (phone)
Wake up → the Bridge tells you the day → queue shows 3 approvals → deck them in ninety seconds → palette-jump to a vendor who texted you → view-as, see what they see, ribbon on → back; mint a vendor for the decorator you met at dinner and send the welcome → Engine: flip entry-tier Victor to deepseek, watch the audit line appear.

## 6. NATIVE-IMPLICATIONS CLAUSE
None — admin is constitutionally web (A-4 makes it excellent on the phone's browser instead). The parallel native track shares zero files with this block.

## 7. SESSION BOUNDARIES
Six sittings P1→P6. P2 depends on P1's shell; P3–P5 may reorder if a dependency lags (recorded). Handover per protocol; MASTERPLAN updated; the Bridge's widget contracts documented for future additions (bride-side numbers join after the bride blocks).
