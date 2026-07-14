# TDW_18_TROUSSEAU_FINAL — The Trousseau, and The Stylist (a callmeZ Guest)
**Block:** 18 · **Ships AT LAUNCH** (founder ruling — hook feature, pattern proven in dreamai) · **Repos:** dream-os + dreamos-pwa; PLUS one contract consumed from the callmeZ world (z-side partner API, specced and built in a z session — the contract is P1's deliverable)
**Depends on:** TDW_15 (envelopes, functions), TDW_17 (After chapter mount point, boards, language law), TDW_09 (facade/web-search discipline), the z stylist pattern (`z/src/stylist.ts` — reference)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST
| Source | Verifying |
|---|---|
| `z/src/stylist.ts` + wardrobe routes in `z/src/index.ts` ~1406–1470 | THE PATTERN: Vision cataloguing JSON contract, gap-report discipline (already-closed gaps NEVER re-listed nor near-equivalents), real-finds-only with regional stores, wear tracking |
| TDW: `functions` on couples, budget_envelopes (0088), muse_boards (0092), taste tags | The integrations that make the Trousseau STRONGER than the original |
| 17's After chapter (P2) mount point | Where the reunion stands |
| 09 web-search cost discipline + facade surfaces | The gap-report engine's home (`surface: bride_trousseau`) |
| Cloudinary paths (07) | Trousseau piece imagery (TDW-side storage) |

## 1. LOCKED FOUNDER DECISIONS
| # | Ruling |
|---|---|
| T-1 | **The layered model:** The Trousseau (TDW-native, wedding-specialized) + inside it, **The Stylist — a callmeZ guest** (everyday styling) + the After-chapter reunion funnel |
| T-2 | **Account-first runtime coupling** for the Stylist wing: her first use is an EXPLICIT, callmeZ-voiced signup/link (phone OTP against z) — no shadow accounts, ever. Her everyday closet lives in HER z account from photo one, via a scoped partner API. The handover is thereby eliminated: the After says "your closet already lives at callmeZ" — a reunion, not a migration |
| T-3 | The Trousseau half stays TDW-native (dream-os engine, TDW storage) — its power IS the integrations z can never have: functions, the Attire envelope, muse boards, taste tags |
| T-4 | Brides always KNOW the Stylist is a callmeZ product — branding loud, the guest framing explicit; her register (the Diva's voice) survives AS the guest's voice; the Trousseau speaks the house register (E-1 law) |
| T-5 | Graceful degradation: z unreachable → "the stylist has stepped out" — TDW core never blocks on z |
| T-6 | At the reunion, an opt-in **gift export**: her trousseau pieces pushed into her z closet ("take your trousseau with you") |
| T-7 | The whole room is FREE (E-9 doctrine); web-search + Vision costs logged per surface |

## 2. MIGRATION RESERVATIONS (ladder after 0093 = next 0094; LD-8)
| # | File | Adds |
|---|---|---|
| 0094 | `0094_trousseau.sql` | `trousseau_pieces (id uuid pk, couple_id uuid fk on delete cascade, kind text, colors text, tags text, her_read text, image_path text not null, function_ids uuid[] default '{}', worn_at date null, created_at)` · `trousseau_gaps (id uuid pk, couple_id uuid fk, function_id uuid null, what text not null, why text, priority int, status text check (status in ('open','bought','dismissed')) default 'open', shop_cards jsonb, created_at)` · `couples.z_account_ref text null` (z app_user reference ONLY — no tokens in this table; the per-user z token lives server-side encrypted, mechanism per P4) |

---

## PHASE TABLE (one phase per sitting)

### P1 — The partner-API contract (the z-side block's brief)
Deliverable: `docs/Z_PARTNER_API_CONTRACT.md` — authored here, implemented in a callmeZ session against z's own BUILD_PROTOCOL:
- **Auth:** `X-Partner-Key` (TDW's server key) + per-user bearer minted at link time; keys scoped to the stylist family ONLY — rooms, chips, sessions, journal unreachable by construction (route-level scoping, not filtering).
- **Endpoints:** `POST /partner/tdw/link/send-otp` + `/verify` (creates-or-links her z account, returns app_user ref + user token) · `POST/GET/DELETE /partner/tdw/wardrobe` (the existing wardrobe semantics, partner-authed) · `POST /partner/tdw/gap-report` (runs her stored audit) · `GET /partner/tdw/outfits` · `POST /partner/tdw/wardrobe/import` (T-6's gift — batch pieces in the cataloguing JSON shape).
- **Laws written into the contract:** rate limits per user + per partner · her data residency is z, TDW holds `z_account_ref` at most · z may revoke the partner key unilaterally (kill switch) · versioned (`/v1/`), additive-only changes · request/response shapes typed in full.
TDW-side stub client `src/lib/zPartner.js` built against the contract with a fixture server for all later phases — the z build lands in parallel, integration flips by env.

### P2 — The Trousseau: her pieces (T-3)
`Trousseau` joins the frost rooms (bloom registry addition — post-13, additive, choreography untouched): photograph a piece → dream-os Vision cataloguing (the z JSON contract ported, wedding-tuned kinds: lehenga/saree/sherwani-side later/jewellery/footwear/accessory/other; `her_read` in the HOUSE register — this half is not the guest) → `trousseau_pieces` with Cloudinary storage → assign pieces to functions (her `functions` list as the rail; a piece can serve two). **Per-function looks:** each function's card shows its assigned pieces + a completeness read (outfit anatomy per function type, gentle: "the sangeet has its lehenga and jewellery — footwear still open").

### P3 — The gap reports (the ported discipline)
Per function (or whole-trousseau): a facade turn (`bride_trousseau`, haiku + web search) audits pieces against the function's anatomy + her taste tags + the board linked to that vibe → gaps with **real, currently-buyable shop cards** (Indian stores, local currency, attributed links — the Surprise card grammar) **filtered to the Attire envelope's remaining balance** ("within your envelope's ₹18K"). The z laws port verbatim: bought/dismissed gaps NEVER re-listed nor near-equivalents (status discipline); reports stored, not spoken; never invent a product or URL. Mark-bought files the spend to the Attire envelope in one tap (a receipt stub, her confirmation required — never silent money writes).

### P4 — The Stylist wing (T-2, T-4, T-5)
Inside the Trousseau room, the guest's door: a callmeZ-voiced panel (z's visual register within a framed card — the maison hosting the visiting designer; "The Stylist — by callmeZ" explicit). First entry = the account moment: one screen, her phone, OTP via the partner link endpoints, plain words ("you're opening a callmeZ account — your everyday closet will live there"). Linked → the everyday wardrobe experience through the partner API (catalogue everyday pieces, her gap reports, outfits) — every byte of it in HER z account; TDW renders, never stores. Token custody: per-user z bearer encrypted server-side (dream-os), never client-persisted. Degradation (T-5): timeouts → the stepped-out card, retry quietly, core rooms unaffected. Unlink control in settings (revokes locally; z-side revocation per contract).

### P5 — The reunion (T-6) + the funnel
The 17 After mount point becomes the Stylist's doorway: linked brides — "your closet already lives at callmeZ" → the gift-export opt-in (trousseau pieces pushed via `/wardrobe/import`, her selection, one tap) → deep link + store link to callmeZ. Unlinked brides get the guest's single graceful invitation (once, never nagged). Funnel instrumentation: link-rate, export-rate, tap-through — the genus story's first measured bridge (admin Growth domain widget contract recorded for Block 10's backlog).

### P6 — Sweep + economics
Vision + web-search INR per surface logged (UNIT_ECONOMICS gains the trousseau line); the z-usage ledger reconciled against z's partner logs (one manual cross-check documented); language audit (house voice in the Trousseau, the guest's voice inside her frame only); both themes; full acceptance.

---

## 3. GUARDRAILS
No shadow accounts — the wing without an explicit link shows only the guest's door (T-2 absolute) · route-scoped partner surface; a z endpoint outside the stylist family in any TDW call is a failed session · her everyday closet bytes never persist TDW-side (render-only; cache ≤ session memory) · TDW core never awaits z on any non-wing path · money writes only via her confirmed tap (P3) · shop cards always attributed, never invented (the z law) · E-1 language law with the framed-guest exception · bride-free throughout · tokens, both themes.

## 4. ACCEPTANCE CRITERIA
1. Contract doc complete + fixture-tested; the z-side session can build from it cold.
2. A photographed lehenga catalogues correctly, assigns to two functions, and the sangeet card reads its completeness honestly.
3. Gap report: real products within the envelope's remaining balance, attributed; a dismissed gap never returns in any wording; mark-bought files the envelope spend only after her tap.
4. The Stylist link flow creates/links her z account explicitly; her everyday piece lands in z (verified z-side); TDW database contains zero everyday-closet bytes (audit); unlink works.
5. z fixture killed mid-session → the stepped-out card; every other room unaffected.
6. After reunion: gift-export pushes selected pieces into z; the doorway deep-links; the once-only invitation honored for unlinked brides.
7. Costs logged per surface; the cross-ledger check reconciles.
8. `node --check` + tsc clean; 0094 proven; MASTERPLAN gains T-1…T-7 + the z-session dependency line.

## 5. FOUNDER SMOKE (phone + a z test account)
Photograph three trousseau pieces → assign across two functions → run the sangeet gap report, buy one find, watch the Attire hairline move → open the Stylist's door, create the z link with your test number, catalogue an everyday shirt, confirm it in z → kill the z fixture and watch the guest step out gracefully → time-travel to After, gift the trousseau across, follow the doorway into callmeZ.

## 6. NATIVE-IMPLICATIONS CLAUSE
The room is contracts + presentation — TDW_12 renders it (camera via the same picker path; the guest frame identical). The z link flow is pure API. Nothing web-bound except the callmeZ store handoff itself.

## 7. SESSION BOUNDARIES
Six sittings P1→P6; P1's contract precedes ALL (and gates the parallel z-side session); P2/P3 run on TDW alone; P4+ integrate on the fixture until z ships. Handover per protocol; MASTERPLAN updated; the z-side block enters the callmeZ world's own board.
