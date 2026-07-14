# TDW_16_BRIDGE_FINAL — The Marketplace Bridge: Engagements, the Signal, and Two Ledgers That Confess
**Block:** 16 · **Repos:** dream-os + dreamos-pwa · **Depends on:** TDW_04 (occupancy), TDW_07 (feed/enquiry/Spotlight, rate_display), TDW_09 (Razorpay one-time path, notify), TDW_14 (member privacy resolver — signals never leak to circle), TDW_15 (proposals tray slot, milestone mirror groundwork, bride inbox)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| Source | Verifying |
|---|---|
| BRIDE_AUDIT + `src/api/couple/{enquire,enquiries,bookings}.js` | Enquiry write path (⚠ enquire→lead landing resolved 07 P5 — confirm state), bookings + `record_payment()` RPC (SINGLE SOURCE for her ledger — sacred) |
| `src/api/vendor/{leads,invoices,schedules,couture}.js` + binder linkage (0070) | His side of every link the engagement binds |
| `src/api/admin/couture.js` (/eligible, /payouts/pending) + `src/api/couple/concierge.js` | The 80/20 machinery being completed |
| TDW_15's milestone-mirror read + inbox proposals slot | The surfaces this block makes ring |
| `resolveModel`/occupancy/profileScore/Spotlight storage | Matching inputs |
| 09 Razorpay integration (webhook, billing_events) | The one-time couture-fee order path rides it |
| `vendors` tier fields | Quota resolution (10/20/∞) |

## 1. LOCKED FOUNDER DECISIONS (all ruled 2026-07-14)
| # | Ruling |
|---|---|
| B-1 | Signal quotas = leads **delivered to the vendor's view** per month: Essential 10 · Signature 20 · Prestige unlimited |
| B-2 | Bride consent per-category (pre-suggested from her functions), closable anytime |
| B-3 | Sovereignty: vendors never receive her contact; responses are **intro cards through the platform**; she opens contact |
| B-4 | Matching = category + city + budget band + **date availability via the 04 occupancy engine**; delivery priority = Spotlight order |
| B-5 | Signal lifetime: live until she closes or books the category; hard cap 60 days |
| B-6 | Intro card = portfolio cover · one authored line · starting rate if `rate_display` · category/city |
| B-7 | Money mirror = **reconcile-and-confess**, never forced sync: his schedules stay invoice-truth, her ledger stays hers, mismatches confessed to both in plain words |
| B-8 | Thread = **WhatsApp-primary** with full in-app state both sides; in-app messaging deferred |
| B-9 | Couture fee (₹2–5K) via Razorpay one-time in this block; 80/20 payout ledger completed |
| B-10 | Featured = admin-sold v1 |
| B-11 | Honeymoon stream PARKED post-launch |

## 2. PROPOSED — AWAITING FOUNDER RULING
(none)

## 3. MIGRATION RESERVATIONS (ladder after 0089 = next 0090; LD-8)
| # | File | Adds |
|---|---|---|
| 0090 | `0090_engagements.sql` | `engagements (id uuid pk, couple_id uuid fk, vendor_id uuid fk, category text, status text not null check (status in ('enquiry','proposal','thread','booked','completed','closed')), source text check (source in ('discover_enquiry','signal','direct')), enquiry_id uuid null, signal_response_id uuid null, couple_booking_id uuid null, lead_id uuid null, unique(couple_id, vendor_id, category), created_at/updated_at)` + backfill INSERT from existing (couple_enquiries × couple_bookings) pairs, counts asserted in-file |
| 0091 | `0091_signal.sql` | `bride_signals (id uuid pk, couple_id uuid fk, category text not null, city text, budget_band text, wedding_date date, functions jsonb, status text check (status in ('open','closed','booked')) default 'open', hard_cap_at timestamptz not null, created_at)` unique(couple_id, category) where open · `signal_deliveries (id uuid pk, signal_id uuid fk, vendor_id uuid fk, delivered_at timestamptz default now(), unique(signal_id, vendor_id))` — **the quota unit** · `signal_responses (id uuid pk, delivery_id uuid fk unique, line text not null, sent_at, opened_by_bride_at, state text check (state in ('sent','opened','contact_opened','declined')) default 'sent')` |

---

## PHASE TABLE (one phase per sitting)

### P1 — The Linked Engagement (the spine)
Apply 0090 + backfill. **Linkage writers** at every existing touchpoint (each the smallest addition inside the existing handler): enquire.js upserts engagement `enquiry` · 07's demo/real lead landing stamps `lead_id` · couple_bookings create/confirm upserts→`booked` + `couple_booking_id` · vendor-side binder linkage recorded when his lead converts (soft ref via lead) · concierge/Closer conversions untouched (vendor-acquisition ≠ engagement). One resolver `getEngagement(coupleId, vendorId, category)` becomes the only reader both surfaces use. **Proof:** an enquiry→booking test run shows ONE engagement row walking `enquiry→booked` with all refs stamped.

### P2 — The Signal (B-1…B-6)
1. Apply 0091. **Consent at onboarding** (and a signals card in her settings/vendors bloom): per-category toggles pre-suggested from `functions`; open = signal row (hard_cap_at = now+60d); close/book anytime → status flips; booking a category via any engagement auto-books its signal.
2. **Matching job** (nightly + on-signal-create): candidate vendors = category ∩ city ∩ `rate_min ≤ budget_band ceiling` ∩ `discover_eligible ∩ not paused` ∩ **free on her date** (04 occupancy read; delivery-vendors skip the date test, deadline trades don't slot) → ordered by Spotlight → assigned into vendors' Signal queues up to each vendor's **remaining monthly quota** (count of signal_deliveries this IST month vs tier cap; Prestige uncapped). Delivery = the row exists = it counts (B-1); the job never double-delivers (unique pair).
3. **Vendor Signals surface** (`/vendor/signals`, joins the Ledger family): anonymized brief cards — functions, month, city, budget band, "she's looking for a {category}" — quota meter in the masthead ("7 of 10 this month"); **respond** = the intro composer (B-6: cover auto-pulled, one line ≤200 chars, rate per `rate_display`) → signal_response; pass = quiet dismiss (delivery already counted — quota is visibility, per B-1).
4. **Her proposals tray** (the 15 slot rings): intro cards revealed with the reveal grammar; **Open contact** → engagement `proposal→thread` + the wa.me handoff with her consented context + his notification ("she opened the door"); **decline** = silent to him beyond state. Circle members NEVER see signals or proposals (14 resolver extended — payload-proof).
5. Anti-flood: her tray batches (inbox dedup), and a per-signal soft cap on simultaneous unopened proposals (12) pauses further deliveries until she thins them — protects her from her own popularity.

### P3 — The Money Mirror (B-7)
The reconciliation read on booked engagements: her `record_payment()` ledger vs his payment_schedules for the linked artifacts → matched (amounts align within window) or **confessed** — a quiet card BOTH sides: hers "he's recorded ₹50K received — you've logged ₹45K; add the missing ₹5K or ask him?"; his mirror-worded. One reconciliation function, two renderings; NEITHER ledger ever writes the other (B-7 absolute — `record_payment()` remains her single source, schedules his). 15's milestone mirror re-pointed onto the engagement linkage (its ⚠ join resolved here for good). Confessions ride notify() both audiences, batched daily.

### P4 — Thread state (B-8)
Enquiries/engagements gain reply-state: the concierge/vendor WA reply hooks (06 surfaces) stamp `last_reply_at` + direction on the engagement; her vendors bloom shows truthful state per engagement (awaiting · replied · you replied · booked) with last-message whisper; his lead detail shows the same thread state beside ConversationThread. WhatsApp remains the medium; the app becomes the ledger of the conversation, never a second inbox pretending to be one.

### P5 — Couture closed (B-9)
Her booking surface: concierge flow connected to his couture slots (browse eligible vendors' availability → pick slot → **Razorpay one-time order** via the 09 path, ₹2–5K per admin-set fee) → webhook confirms → appointment row both sides + notifications + calendar entry via eventWrite (appointment kind, non-occupying) → admin `payouts/pending` completed into an 80/20 settlement ledger (vendor share recorded, payout marked by founder, exportable). Cancellation/refund policy: admin-configurable window, refund via Razorpay API, both sides notified — plain words.

### P6 — Featured v1, the loop proof, economics
Featured: admin-sold placements confirmed end-to-end (07's marked interleaving + admin placement UI polish — pricing lives with the founder, no vendor-side purchase). Honeymoon: a `docs/PARKED.md` entry with the stream-6 sketch (B-11). **The full-loop acceptance run** (the block's crown): bride onboards with signal consent → matched vendor receives the signal within quota → intro card → she opens contact → WA thread → booked → both ledgers record → a deliberate ₹5K mismatch confesses both sides → couture appointment booked and paid → every state visible in both apps and the admin Bridge (10's funnels gain the signal funnel widget — contract recorded for its backlog). UNIT_ECONOMICS gains signal + couture lines.

---

## 4. GUARDRAILS
Her contact never serializes to a vendor pre-`contact_opened` (payload-proof, the 08 standard) · `record_payment()` and payment_schedules never write each other — reconciliation reads only (B-7 absolute) · quota counting is delivery-row truth, never view-tracking heuristics · occupancy reads through the 04 engine, never reimplemented · signals/proposals invisible to circle members (14 resolver, payload-proof) · eventWrite remains the only calendar writer (couture appointments included) · sendWa only; templates for any new outbound (signal alert to vendor rides notify/push first — a WA template only if founder orders one later) · Razorpay webhook remains the one money-truth flipper · souls untouched (thread hooks are mechanical stamps) · tokens, both themes, both audiences.

## 5. ACCEPTANCE CRITERIA
1. Engagement backfill counts assert; the enquiry→booked walk shows one row, fully stamped; `getEngagement` is the only reader (grep gate).
2. Quota: Essential vendor receives exactly 10 deliveries in a seeded 15-match month, Signature 20, Prestige all; month rollover resets; no duplicate (signal, vendor) ever.
3. Occupancy: a vendor booked on her date receives nothing for that signal (fixture proof); delivery-category vendors match dateless.
4. Sovereignty: raw payloads to vendors contain zero bride contact pre-open; her open flips state + hands off to WA with his notification; her decline leaks nothing.
5. Soft cap: 13th unopened proposal pauses deliveries; thinning resumes them.
6. Mirror: the ₹5K mismatch confesses both sides in one daily batch; aligned ledgers stay silent; neither table wrote the other (audit).
7. Thread states truthful on both surfaces after a real WA exchange.
8. Couture: slot → payment → webhook → appointment both sides + calendar; refund inside the window round-trips; the 80/20 ledger reconciles to billing_events by hand.
9. Circle member payload contains zero signal/proposal bytes.
10. The P6 full-loop run recorded end-to-end on two phones; `node --check` + tsc clean; 0090/0091 proven; MASTERPLAN gains B-1…B-11.

## 6. FOUNDER SMOKE (two phones)
Onboard a fresh test bride, consent to photographer + decorator signals → watch your test vendor's Signals masthead tick 1/10 → compose the intro line, send → as her: the tray reveals him, open contact, feel the WA thread open with his "she opened the door" landing → book him, pay a milestone on both sides with a ₹5K gap, read both confessions next morning → book a couture slot, pay the fee, watch the payout land in admin pending → close the decorator signal and watch matching stop.

## 7. NATIVE-IMPLICATIONS CLAUSE
Signals surface + proposals tray + mirror cards are contracts-first — TDW_12 renders them; the vendor app (11) gains the Signals screen as a fast-follow phase (recorded in its backlog). Nothing here is web-bound except couture's Razorpay web checkout, which follows the 11 dual-rail law when native arrives.

## 8. SESSION BOUNDARIES
Six sittings P1→P6 strictly (P1 gates all; P2 before P4's proposal states). Handover per protocol; the signal-funnel widget contract handed to Block 10's backlog; MASTERPLAN updated — and with it, blocks 01–16 stand complete. Next on the founder's board: the bride + discover experience block (TDW_17 discussion) and TDW_12_NATIVE_BRIDE.
