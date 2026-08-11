# repo: dream-os @ 1f7a824
# TDW_FROST_AUDIT_16 — Block 16 (BRIDGE) Ground-Truth Inventory
**Authored by:** FC-1, the First Frost Chair (parallel audit line, R-30.17), on the founder's Report-F commission (2026-08-12).
**Derivation tips:** dream-os **`1f7a824`** · dreamos-pwa **`60b4317`** — re-derived at origin. **Movement report, per the charter's own instruction:** the charter predicted "the cap sitting's deliveries and a possible reconciliation banking" above `1f7a824`; my fetch is the truth and shows NEITHER — the only movement above Report D's base is Report E's own banking. Consequence, named not feared: **the four rulings this charter carries as bytes (R-30.26 · R-30.29 · R-30.30 · R-30.34) and the "0088–0095 all reserved-in-ink (closed tonight)" claim are verifiable NOWHERE at origin** (grep of docs/ + db/ for `R-30.2x/R-30.3x` and for reservation ink: zero hits; 0088–0095 remain bare holes on the ladder). FC-1 audits against them as CHAIR-CARRIED RULINGS relayed on the founder's commission — legitimate transport under the estate's kickoff law — and flags the banking as IN-FLIGHT-OR-OWED for CE-30's reconciliation. Every conclusion below that leans on an R-30.* says so.
**Witness grades as Reports A–E.** [PUBLIC-0099]+[LADDER→0119]. **THE MOVING-GROUND CLAUSE IN FULL FORCE** — 16's whole subject is adjacent to the live relay seam; every claim tip-stamped; collisions travel as questions.

---

## §0 — EXECUTIVE SHAPE (one screen)

1. **The spine's floor is real and the spec's ⚠ resolved in its favor.** `couple_enquiries` exists (9 cols incl. `vendor_lead_id` [PUBLIC-0099:226–:238]); `enquire.js` lands `public.leads` via `createLead` source `'discover'` plus the demo triple (its own header :9–:17), and even carries a cured-path finding in-file (the `/vendor/discover/leads` URL correction, :58–:78). P1's backfill has both parents. The `engagements`/`bride_signals`/`signal_*` tables are cleanly ABSENT — 16's own DDL, unpre-empted.
2. **The proposals-tray fork RESIZES on the evidence — and mostly dissolves.** Report C/E carried "two live staging candidates" for any tray. Derived whole here: **`pending_event_proposals` (8 cols) is NOT a bride-proposal store at all** — it is the vendor calendar-image OCR staging table (`proposals jsonb`, `source_image_url`, `resolution`; writers = engine/vendorInbound/vendorCalendarImage/cron/loop.ts). It is a SHAPE PRECEDENT (0117's own comment cites it as the estate's only register-constraining staging table), never a carrier. **`pending_couple_drafts` (0117/0118) is the relay's vendor→bride MESSAGE store** — right lane, wrong species (free-composed replies, not intro cards, keyed couple_phone with a 24h expiry vs B-5's 60-day signal life). **The spec's own `signal_responses` (0091) is the tray's true store**; the REAL residual fork is narrower and sharper: whether a signal response's WA-side delivery to the bride rides the relay seam's send machinery (window-first, `coupleWaWindow`, templates) or mints a parallel outbound path — a collision squarely in G-RELAY. §3, Q-2.
3. **Three of the spec's seven read-first dependencies are absent or re-homed:** "09's notify" — does not exist (re-verified at this tip; C §4 stands); "09's Razorpay one-time path + billing_events" — `billing_events` EXISTS but was born at Block 10's billing sitting (`0114`, "the FIRST AND ONLY row representing money" per its own :19), the rail is SUBSCRIPTIONS-ONLY and paused (D 17.B), and **no one-time/Orders path exists for B-9's couture fee**; "vendors tier fields" for B-1's quota — `vendors.tier` is free-text with NO CHECK (F-10.23 standing) against a live canon of four values, so quota resolution has no constrained vocabulary to key on yet. §2.
4. **The couture 80/20 is half-machinery, half-charter-already-owned-elsewhere:** `couture_appointments` (13 cols) + `couture_availability` (8 cols) live on witness; `vendor/couture.js` 58 ln + `admin/couture.js` 81 ln (eligibility toggle + payouts LIST — the read cured at F-07.91; **payout ACTIONS chartered as F-07.92, founder-sequenced**, stated at `admin/couture.js:22`). B-9's "80/20 payout ledger completed" is largely F-07.92 wearing 16's clothes — one work item, two charters, name-or-merge. §2, PROPOSED-16.C.
5. **The carried rulings, where they bite 16:** R-30.29 (two-plan couple money; Full Table DEAD) doesn't touch 16's vendor-side money directly but re-grades Report D/E's E-9 nodes (the graph's amend-once pass, chartered on this banking, will carry it); R-30.34 (the RPC's one future, 6/3 on `couples.tier`) + R-30.26/.30 (couple vocabulary basic|platinum, four dial values) settle Report B's Q-1 and D §2.4's three-futures collision — **the RPC's one winner now exists as a ruling**, pending its ink. B-1's VENDOR quotas (Essential 10 · Signature 20 · Prestige ∞) are untouched by the couple-tier rulings but inherit the F-10.23 vocabulary gap above.

---

## §1 — SPEC §0 "READ FIRST", GRADED

| Spec row | Grade | Evidence |
|---|---|---|
| enquire/enquiries/bookings + the ⚠ | **VERIFIED, ⚠ RESOLVED** | §0.1; `bookings.js` payment door + `record_payment()` single-source per C §2 |
| vendor leads/invoices/schedules/couture + binder linkage | **PRESENT** (441/421/97/58 ln) | invoice→schedules is his plane (13-col schedules keyed invoice_id+vendor_id, C §2's mirror evidence carries whole into P3's re-point) |
| `admin/couture.js` /eligible + /payouts/pending | **PRESENT; ACTIONS = F-07.92's open charter** | :2, :11, :22, :51 |
| TDW_15 milestone-mirror + inbox proposals slot | **BOTH UPSTREAM-ABSENT** | C §2 (no join, no rule — and P3's "resolved here for good" via the engagement linkage is, at last, a committed matching RULE: the engagement row itself becomes the key; graded as the spec CURING C's PROPOSED-15.B if P1 lands first — an ordering edge for the graph's amendment) · C §4 (inbox from-zero) |
| resolveModel/occupancy/profileScore/Spotlight | **PRESENT** | occupancy at `src/lib/vendor/occupancy.js` (04-sealed family, D §1); Spotlight order live; profileScore one-home (07) |
| 09 Razorpay (webhook, billing_events) | **RE-HOMED + PARTIAL** | §0.3; `0114` webhook on the estate's own rawBody verifier is REAL and is the one money-truth flipper the guardrail names — the missing half is one-time |
| vendors tier fields (quota 10/20/∞) | **UNCONSTRAINED** | F-10.23; quota math needs the vocabulary word before it can be delivery-row truth |

## §2 — RULINGS B-1…B-11, GRADED

| # | Grade | One line |
|---|---|---|
| B-1 quotas | **BUILDABLE-AFTER-VOCAB** | delivery-row unit (`signal_deliveries` unique pair) is clean design on a clean floor; keying tier caps on free-text `vendors.tier` inherits F-10.23 — the CHECK/rename sitting (its own founder-gated charter per CE-201) is an upstream word |
| B-2/B-5 consent+lifetime | **CLEAN FLOOR** | consent writes exist at onboarding (functions/signals per 0100-era work, C §3-adjacent); signal rows are 0091's own |
| B-3 sovereignty | **CLEAN + one live precedent** | payload-proof standard established (08); the relay seam already practices contact-sovereignty vendor→bride; the bride→vendor direction is 16's to build |
| B-4 matching | **INPUTS ALL PRESENT** | category/city/budget on vendors rows; occupancy via the sealed engine; Spotlight order live; the "delivery-vendors skip the date test" clause needs the category-classing word (no `is_delivery_category` exists anywhere — UNDERIVED beyond absence-by-grep, named for the charter) |
| B-6 intro card | **INPUTS PRESENT** | portfolio covers (07 variants), `rate_display` with its F-08.44 door-gate cured |
| B-7 mirror | **DESIGN SOUND; delivery organ absent** | both ledgers live and disjoint (C §2); "confessions ride notify() both audiences" rides a writer that does not exist — same re-founding as C 15.A; WA-template arm is the live alternative (guardrail's own fallback line half-anticipates this) |
| B-8 thread state | **MOVING-GROUND ADJACENT, whole** | the "WA reply hooks (06 surfaces)" ARE the relay seam's `couple_thread` writers in `vendorInbound.js` + the hand arc's machinery — every stamp P4 adds sits inside G-RELAY's laws (F-06.151/.152); tip-stamped, collision to Q-2 |
| B-9 couture | **HALF-BUILT + RAIL-ABSENT + CHARTER-OVERLAP** | tables+routes live; payouts-read cured; ACTIONS = F-07.92; the ₹2–5K one-time order path does not exist (D 17.B's same rail); eventWrite appointment-kind path exists (04's non-occupying kinds) |
| B-10 featured v1 | **FLOOR SHIPPED at 07** | marked interleaving + FEATURED eyebrow live; CE-123 keeps FEATURED separate from spotlight — v1 here is admin-UI polish + confirmation, honestly small |
| B-11 honeymoon | PARKED as written | docs entry only |

## §3 — THE TRAY FORK, SIZED (the charter's named question)

Derived shapes, side by side:
- **`pending_event_proposals`** [PUBLIC-0099:710–:718]: vendor_id · `proposals jsonb` · source_image_url · caption · resolved_at · `resolution` (CHECKed register — the precedent 0117 cites). Writers are the vendor OCR pipeline. **Not a candidate. A precedent.**
- **`pending_couple_drafts`** [LADDER 0117/0118]: vendor_id · conversation_id · `couple_phone NOT NULL` · body · five-state CHECK (staged/approved/sent/refused/expired) · refusal_reason · 24h expiry. **The relay's message store: right direction, wrong species and wrong clock** for 60-day signal proposals.
- **`signal_responses`** [0091, unbuilt]: delivery-keyed, state (sent/opened/contact_opened/declined), her-side reveal semantics. **The spec already contains the tray's store.**
**The residual fork, precisely:** when a vendor's intro must REACH her (tray badge, and any WA touch), does 16 (a) stay in-app only until she opens (tray = pure PWA read of signal_responses; zero WA; the anti-flood cap trivially enforceable), (b) ride the relay seam's window-first send machinery for a WA nudge (inherits `coupleWaWindow`, a template, and the seam's laws — a G-RELAY collision by construction), or (c) a founder-ordered template later, as the guardrail's own sendWa line sketches? **Q-2 for CE-30/the founder.** FC-1's evidence note without proposal: arm (a) has zero moving-ground contact and the spec's §4 guardrail already leans it ("signal alert to vendor rides notify/push first — a WA template only if founder orders one") — but that sentence aims at the VENDOR side and rides absent notify; both directions need the same word.

## §4 — PROPOSED DEFECTS (un-numbered; CE-30 banks)

**PROPOSED-16.A — B-7/P3's confession transport and the vendor signal alert both ride notify(), which does not exist** (re-verified this tip). Same re-founding class as C 15.A; the amend-once pass should re-transport both (in-app cards + optional WA template) or charter notify first — one decision, three consumers (15-P5, 16-P3, 16-P2.3).

**PROPOSED-16.B — B-9's fee path cites a rail that does not exist and a rail-family that is paused** (evidence D 17.B re-verified: `src/lib/billing/` subscriptions-only). The couture fee and 17's unlock-successor (post-R-30.29's two-plan shape) are TWO customers of ONE unbuilt one-time rail — charter it once, home per D Q-3.

**PROPOSED-16.C — B-9's "80/20 ledger completed" double-charters F-07.92** (`admin/couture.js:22`'s own ink: payout ACTIONS chartered, founder-sequenced). Merge-or-name before either sitting opens, or two seats will build one ledger.

**PROPOSED-16.D — B-1's quota key stands on unconstrained vocabulary** (F-10.23: `vendors.tier` free-text, no CHECK; the semantic ruling gating the rename homed outside P2/P3 at CE-201). The quota job cannot be delivery-row TRUTH while its tier read is convention. Ordering edge: the vocabulary sitting before 16-P2.

**PROPOSED-16.E — The charter-vs-origin ruling gap, filed as process not defect-of-code:** four R-30.* rulings and the 0088–0095 reservation ink are carried in this charter and absent at origin. If the banking is in flight, this dissolves on its push; if not, the estate's next seat inherits rulings with no leanable ink — exactly the F-08.51/CE-88 class the register laws exist to prevent. CE-30's reconciliation is the cure either way.

*(Not proposed: the tables' absence — 16's own DDL; the relay adjacency — ruled live product; the milestone-mirror re-point — it is the spec CURING C's 15.B, an ordering fact for the graph.)*

## §5 — QUESTIONS FOR CE-30 / THE FOUNDER

**Q-1 — 0090/0091's numbers under the carried reservation ruling:** the charter says 0088–0095 reserved-in-ink; origin shows holes and a ladder tip at 0119. On the ink's banking, do 16's migrations keep 0090/0091 (LD-8 reservations are law once inked) or take next-free? Pure register; settles C Q-1/D Q-2 for good.

**Q-2 — The reach fork (§3):** arms (a)/(b)/(c) for BOTH directions (her tray-reach; his "she opened the door" and signal alerts). Every WA arm is a G-RELAY and template-veto item.

**Q-3 — F-07.92 × B-9 (16.C):** one owner for the payout ledger.

**Q-4 — The one-time rail's charter** (16.B; shared customer with 17's money moment under R-30.29's new shape): before 16-P5, homed where?

**Q-5 — Does P4's thread-state stamping charter as a relay-seam rider** (inside G-RELAY's own sitting family, inheriting its laws natively) rather than a 16-native build reaching into `vendorInbound.js` from outside? FC-1 maps the radius (B-8 row, §2) and proposes nothing.

## §6 — WHAT A 16 EXECUTOR MUST NOT DISCOVER MID-SITTING
1. The ⚠ is resolved; `couple_enquiries.vendor_lead_id` is the backfill's second parent.
2. `pending_event_proposals` is OCR staging — a shape precedent, never the tray; the tray's store is 0091's own `signal_responses`.
3. notify() does not exist; billing one-time does not exist; billing_events DOES (0114) and the webhook is the money-truth flipper.
4. The couture payout ACTIONS are already F-07.92's; the read is cured; the tables are live.
5. Every P4 stamp and every WA reach lands beside the relay seam's laws — tip-stamp, ask, never assume.
6. `vendors.tier` is unconstrained; quota truth waits on the vocabulary word.
7. The RPC's future is ruled (R-30.34, carried) — no 16 or 14 hand touches `invite_circle_member` until that ink banks.

**On this report's banking, per the charter: TDW_FROST_DEPENDENCY_GRAPH takes its own amend-once pass** (the 16 node graded; the E-9/Full-Table nodes re-graded under R-30.29; the RPC collision closed under R-30.34; the tray fork resized per §3) — that pass is a separate small sitting, founder-sequenced.

— END TDW_FROST_AUDIT_16 · FC-1 @ dream-os `1f7a824` / dreamos-pwa `60b4317` —
