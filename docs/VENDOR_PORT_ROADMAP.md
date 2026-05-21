# Vendor port roadmap — dream-os ↔ dreamai

**Written:** 2026-05-20
**Scope:** Bring dream-os vendor product to feature parity with legacy `dream-wedding` vendor surface, with dreamai PWA frontend keeping pace.
**Not in scope:** Bride product. dreamos-pwa shell. Frontend port from legacy Expo app.
**Standing reference:** This roadmap supersedes the porting discussion in conversation history. Each block has its own spec file (`BLOCK_<id>_SPEC.md`).

---

## North star

After all blocks ship:

- dream-os has every vendor feature the legacy `dream-wedding/server.js` had, except the items explicitly dropped (referral loop, Firebase auth, the 9 deferred Studio tabs, legacy admin v3, vendor boosts/offers/analytics).
- dreamai is the vendor PWA at `thedreamai.in`, fully wired against dream-os, with chat-first UX and form-fallback CRUD.
- Vendors can run their entire business from either WhatsApp or the PWA — same agent, same data, same model.
- dream-wedding Railway service can be retired (per ROADMAP_FINAL Phase 2 Block 5).

---

## Block index

| Block | Repo(s) | Migration | Version bump | Spec file |
|-------|---------|-----------|--------------|-----------|
| **F**  | dream-os | `0034_vendor_foundation.sql` | 0.10.0-α → 0.10.1-α | `BLOCK_F_SPEC.md` |
| **1a** | dream-os | `0035_vendor_writes.sql`     | 0.10.1-α → 0.10.2-α | `BLOCK_1a_SPEC.md` |
| **1b** | dreamai  | — | (tagged dreamai-v1.1) | `BLOCK_1b_SPEC.md` |
| **1c** | dreamai  | — | (tagged dreamai-v1.2) | `BLOCK_1c_SPEC.md` |
| **2**  | both     | `0036_push_tokens.sql`        | 0.10.2-α → 0.10.3-α | `BLOCK_2_SPEC.md` |
| **3**  | both     | `0037_conversations_state.sql`| 0.10.3-α → 0.10.4-α | `BLOCK_3_SPEC.md` |
| **4**  | both     | `0038_monetisation.sql`       | 0.10.4-α → 0.10.5-α | `BLOCK_4_SPEC.md` |
| **5**  | both     | `0039_vendor_discover.sql`    | 0.10.5-α → 0.10.6-α | `BLOCK_5_SPEC.md` |
| **6**  | both     | `0040_studio_partial.sql`     | 0.10.6-α → 0.10.7-α | `BLOCK_6_SPEC.md` |
| **7**  | both     | `0041_schedules_contracts_tds.sql` | 0.10.7-α → 0.10.8-α | `BLOCK_7_SPEC.md` |

After Block 7, dream-os hits **v0.11.0-alpha** (Phase 2 complete) provided the open Phase 2 checkboxes from ROADMAP_FINAL also close. Phase 3 (Discover go-live, v1.0.0) follows.

---

## Block summaries

### Block F — Foundation
**What:** Apply pending vendor migrations (0024/0026/0029 consolidated as 0034). Lock response envelope `{ok, ...}`. Add `asyncHandler` wrapper. Audit auth middleware coverage. **No user-visible change.**

**Why first:** Block 1a's 20 new endpoints need this scaffolding to ship cleanly. Without it, we copy 552 try-catches the way the legacy did.

**Risk:** Lowest possible. Additive only. Existing routes untouched except 5 audited for envelope consistency.

### Block 1a — Vendor REST completion
**What:** POST/PATCH/DELETE for leads, clients, invoices, expenses, events. PATCH /me + routing-handle + invoice-prefix. Full availability resource (block/unblock dates). Public hot-dates GET. 11 new agent tools (`update_lead`, `lose_lead`, `update_client`, `delete_client`, `update_invoice`, `update_expense`, `update_event`, `delete_event`, `block_date`, `unblock_date`, `list_availability`).

**Why:** Closes the "Studio delete works, chat delete fails" gap from HANDOVER_FINAL. Unblocks dreamai forms. Adds vendor calendar's blocked-date layer.

**Key decisions baked in:**
- Soft delete (deleted_at) on leads/clients/invoices/expenses/events
- Vendor todos = events with kind='task' (no separate vendor_todos table)
- Invoice lock once payments recorded (no PATCH after amount_paid > 0)
- Shared lib layer `src/lib/vendor/*.js` — one write function per resource, called by both REST and agent tools

**Open design choice for review during build:** soft-delete restore on POST conflict (recommend restore; revisit if it produces confused UX).

### Block 1b — dreamai typed client
**What:** Add 18 new functions to `lib/api/vendor.ts`, ~25 new types to `lib/types/vendor.ts`, `deleteJson` helper, mock layer additions. Extend hooks (`useVendorData`, new `useMe`, new `useAvailability`, rewritten `useHotDates`) with mutate methods. **Zero UI change.**

**Why before 1c:** Lets Block 1c build UI against the typed surface immediately. Lets us develop in mock mode without backend availability.

**Risk:** Low. Pure type+wire layer.

### Block 1c — dreamai UI for vendor writes
**What:** AddSheet component (reusable across slices) wired to the FAB on each list page. Settings page (`/wedding/settings`) for profile editing. Calendar overhaul: Hot Dates visual layer + blocked-dates layer + block/unblock interaction. Each slice's bottom sheet gains an Edit→form path alongside the existing Edit→chat path.

**Why:** Chat-and-forms is the locked product direction. This is where it materialises.

**Open design choice:** FAB tap → form by default, or chat by default? Spec recommends form (user already tapped "Add Client" — friction to route through chat) with a "talk to DreamAi instead" link inside the sheet. Pivot if vendor feedback says otherwise.

### Block 2 — Vendor push notifications
**What:** Web Push API + VAPID keys. `push_tokens` table. Subscription endpoint. Push triggers fire from agent tool handlers on: new lead, payment received, lead state change. PWA ServiceWorker. Settings toggle.

**Why:** Vendors who don't keep WhatsApp open get no real-time signal today. This is operationally critical for PWA adoption.

**Scope discipline:** No notification inbox table. Push only. Inbox is a separate decision (don't ship it speculatively).

**Risk:** Medium. Web Push has browser-permission UX gotchas. Test across iOS Safari (notoriously fiddly), Chrome, Firefox.

### Block 3 — Vendor enquiries inbox
**What:** Conversations get `state`, `last_read_at_vendor`, `last_read_at_couple`, `subject_summary` columns. Enquiry list/detail/messages/reply/read endpoints. dreamai gets `/wedding/enquiries` tab in the BottomNav (or under Studio — design call during build).

**Why:** Today vendor sees enquiries only via WhatsApp. The PWA has no inbox. Vendors want a typed-history view of conversations.

**Design call:** use existing `conversations`/`messages` tables (not a parallel `vendor_enquiries` table). Migration adds 4 columns, no new tables. Subject summary backfilled via SQL one-time.

**Risk:** Medium. Subject summary backfill needs care; messages reply path needs to fire Twilio correctly when the bride isn't connected to dreamai.

### Block 4 — Monetisation
**What:** Razorpay integration. Subscriptions (Essential/Signature/Prestige). DreamAi token packs (50/Rs.100, 200/Rs.350, 500/Rs.800). Trial-end cron (pre-Aug-1 free Signature, post-Aug-1 30-day trial then auto-downgrade). Quota enforcement. Webhook handler.

**Why:** dream-os generates Rs 0 today. This is the revenue layer.

**Key decisions baked in:**
- Past Client Discount Loop: **dropped** (user decision — gameable)
- Couple subs deferred (bride product is dreamos-pwa, not in scope)
- Couture and featured promos pulled into Block 5 (they share Discover-adjacent tables)
- Honeymoon commission deferred (no implementation in legacy worth porting)

**Risk:** High. Razorpay KYC is a standing open item. Webhook signatures, idempotency, refund handling all require care. Test mode → live mode requires re-validation.

### Block 5 — Vendor Discover submission + Couture + Featured
**What:** Vendor request-access flow, submission state machine, photo approval queue, admin grant/deny/revoke endpoints. Portfolio CRUD (uses 0034's `vendor_portfolio` table). Couture admin gating + appointment endpoints. Featured promos (paid via Razorpay from Block 4).

**Why:** Pre-Phase-3 prep. Discover launches in Phase 3 / v1.0.0; this builds the submission pipeline now so launch isn't blocked on backend work.

**Scope discipline:** Public Discover read endpoints (the bride-facing feed) are NOT in Block 5. They land with Phase 3.

**Risk:** Medium-high. The photo approval pipeline alone is ~5 endpoints + admin UI work. Tempted to over-engineer Couture pricing logic — keep flat fee + 80/20 split as per standing rules.

### Block 6 — Studio Suite partial
**What:** Briefing computed endpoint. Team members CRUD. Team tasks CRUD. Team messages (broadcast log). Team payments CRUD. `requirePrestige` middleware. Tier gate returns 403 to Essential/Signature.

**Why:** Prestige tier (Rs 3,999/month) has no differentiated value prop without Studio. Block 6 builds the floor — without it, Prestige is just a quota number.

**Scope discipline:** 4 tabs of the 12. Deferred: procurement, deliveries, trials, photo approvals (some lands in Block 5), check-ins, sentiment, templates, assistants. Re-evaluate when Prestige has paying customers.

**Risk:** Medium. Tier gating is a new pattern — must work consistently. dreamai needs a "Studio" section in nav that only appears for Prestige.

### Block 7 — Payment schedules, contracts, TDS
**What:** Milestone-based payment plans on top of invoices. Contract file storage with two-phase upload. TDS ledger + CSV export. 6 new agent tools. 16 new endpoints.

**Why:** Indian vendor business-management features the legacy had that vendors will miss. TDS is real tax compliance. Schedules unlock larger ticket sales (vendors quote 6-figure shoots, brides want to pay over time). Contracts unlock legal evidence chain.

**Risk:** Medium. Two-phase upload + milestone↔invoice payment sync are the two careful bits. Detailed in spec.

---

## Block ordering — what depends on what

```
F  ─→  1a  ─→  1b  ─→  1c
            ↓
            2  ─→  3  ─→  4  ─→  5  ─→  6  ─→  7
```

- **F must ship first.** Everything else uses `asyncHandler`, response envelope, auth audit baseline.
- **1a unblocks 1b, 1b unblocks 1c.** Frontend can't typecheck until backend types are in. 1b and 1c can share a session.
- **2 onwards can ship in numerical order** but each depends only on its predecessor migration-wise. If a block stalls, you can skip it temporarily without breaking later ones. Example: if Razorpay KYC drags, skip Block 4 and ship 5+6+7. Wire them when KYC clears.
- **Block 4 must ship before Block 6.** Block 6's `requirePrestige` middleware reads subscription tier from `vendors.tier` and `subscriptions.active`. Without Block 4 enforcing real subscriptions, the gate is meaningless.

If runway forces a cut, drop blocks from the back:
- Drop 7 first (TDS + schedules + contracts are nice-to-haves until vendors complain).
- Then 6 (Studio Suite — needs Prestige customers to justify).
- Then 5 (Discover submission can ship as part of Phase 3).
- 1+2+3+4 is the minimum viable vendor port.

---

## Cross-block standing rules

These apply to every block:

1. **Migration discipline.** Every schema change is a numbered file in `db/migrations/`. Numbering continues from 0033. Never edit an applied migration — changes go in the next file.
2. **Idempotent migrations.** `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`. Safe to re-run.
3. **Auth on every protected route.** `requireAuth` + `resolveVendor` or equivalent. Block F's audit script runs at end of every block.
4. **One source of truth per resource.** Shared lib functions in `src/lib/vendor/*` called by both REST and agent tools. Never duplicate write logic.
5. **Standard envelope.** `{ ok, ...payload }` on success, `{ ok: false, error, code? }` on failure. Through `src/lib/response.js`.
6. **asyncHandler everywhere.** No raw `try/catch` in route handlers from Block F onwards.
7. **Update four docs at session close.** HANDOVER_FINAL.md, ROADMAP_FINAL.md, SCHEMA.md, API_CONTRACTS.md. Standing rule — non-negotiable.
8. **Smoke test before merge.** Per-block curl pass + cross-vendor isolation test + WhatsApp parity check.
9. **dreamai paired changes.** If a block adds endpoints, dreamai gets a `lib/api/vendor.ts` extension in the same block (or following block, never deferred).
10. **Version bump on close.** dream-os `package.json` and `src/index.js` startup log line. Tag in git.

---

## How to use these specs

For each block:

1. Read the spec end-to-end before starting code.
2. Apply the migration first. Verify in Supabase.
3. Build backend per the spec's File Layout section. One commit per resource where possible.
4. Add agent tools. System prompt addendum.
5. Run the per-block smoke tests. Fix anything that fails.
6. Pair the dreamai work (if applicable) in the same session or the next.
7. Update the four docs. Push, deploy, tag.

Each spec ends with a checklist. The block isn't complete until every checkbox ticks.

---

## What's NOT in this roadmap

- **Past Client Discount Loop** — dropped (gameable).
- **Bride-side work.** Everything bride lives in dreamos-pwa wiring, separately planned.
- **Native app retirement.** The legacy Expo app at `dream-wedding` repo will be retired when `dream-wedding` Railway service retires (Phase 2 done criteria). No port; rebuild as dreamai or dreamos-pwa.
- **Public discover read endpoints.** Phase 3 work. Block 5 builds vendor submission; bride feed comes later.
- **Honeymoon commission.** No legacy implementation. Greenfield when needed.
- **Instagram DM integration.** Deferred per HANDOVER_FINAL. Meta App Review is the gate; start that early when ready.
- **Google Calendar OAuth.** Deferred per HANDOVER_FINAL.
- **TDS Form 16A reconciliation against 26AS.** Block 7 stores certificate numbers but doesn't auto-match to government 26AS API. Manual for now.

---

## Spec revision policy

The early blocks (F, 1a, 1b, 1c) are detailed and stable — they're built on what's already in dream-os and dreamai.

The later blocks (2 through 7) make more assumptions:

- They assume Block F's `asyncHandler` and envelope conventions stick.
- They assume Block 1a's shared-lib pattern (`src/lib/vendor/*`) is the right one.
- They assume the soft-delete pattern from 1a generalises.

After Block 1a deploys and you've used it in anger for a session or two, **do a 15-minute review of Blocks 2-7** before starting each. Things that often need revision:

- Endpoint naming conventions (singular vs plural, kebab vs camel)
- Response shape conventions (whether to include `total` counts, pagination)
- Agent tool signatures (which fields are required, what the agent expects in return)
- Migration column types (text vs varchar, integer vs numeric)

These are not the kind of decisions where I'd defend the spec against your judgment — adapt freely.

---

## Documents to maintain

The four standing docs per session, plus this roadmap and the per-block specs. After each block:

- **HANDOVER_FINAL.md** — rewritten end-to-end. Records what shipped, what's next.
- **ROADMAP_FINAL.md** — block marked complete. Phase 2 progress updated.
- **SCHEMA.md** — new tables, columns, functions added under existing sections.
- **API_CONTRACTS.md** — every new endpoint listed with method, path, auth, request/response shapes.
- **This file (`VENDOR_PORT_ROADMAP.md`)** — block table marked complete. No deletions; history matters.
- **The block spec** — appended with "Build notes" section recording surprises, deviations, and what differed from the spec. Future Claude reads this.
