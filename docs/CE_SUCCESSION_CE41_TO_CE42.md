═══ TDW · CE-41 → CE-42 · SUCCESSION NOTE · 2026-09-09 23:30 IST ═══

*Formerly `docs/TDW_CE_SUCCESSION_NOTE_22.md`; cited by CE-42's chat kickoffs under that name.* (Renamed 2026-09-10, CE-42 seat G2, c-42.25. That filename belongs to the twenty-second chair's own note at `docs/specs/TDW_CE_SUCCESSION_NOTE_22.md`, 2026-08-05, which `docs/specs/TDW_CE_SUCCESSION_NOTE_23.md:6` and `docs/FINDINGS_LOG.md:3991` both point at. This note is CE-41's and belongs in the `CE_SUCCESSION_CE<n>_TO_CE<n+1>` series with CE-37→CE-38 through CE-40→CE-41.)

**Read this whole file before ruling anything. Derive both tips by command before the first relay. The founder relays; the chair rules; seats cut; the founder applies, walks, pushes.**

---

## 0 · THE FOUNDER'S TWO RULES FOR THE NEXT CHAIR

1. **R-41.98 / R-41.147 — plain, short, direct; ship.** No prose, no poetry on any glass. Packet notes are five lines (what shipped · what it does on the glass · what's not proven · what's next · the hash). Findings against a seat's own cut: fix, one line, move on. A walk is *"does it work"*; if it works on the glass it's closed. The founder's words, 2026-09-09: *"does the feature work or not. I haven't asked anyone to be the tech nazi here."* The chair enforces that on itself first.
2. **Derive the tip before every instruction to the founder** (c-41.95 — CE-41 told him to apply a packet he had already applied). `git fetch -q origin && git rev-parse origin/main` on both repos, every time.

---

## 1 · TIPS AT HANDOVER (derived by command 23:25 IST)

- **dream-os** `13fa9332fdd1384d8ffad48aebfc7dc73c3b25d2` — D3c3b (`wa_link` on every queue item). Ladder tail `0159`. Railway deploys main.
- **dreamos-pwa** `cc109bd75aaf2f3413d153cb1403dddbc7d1d3b8` — D3c pwa (link line, fan-out dialog, two refusals in words). Vercel deploys main.
- Floor base: dream-os `scripts/floor-base.txt` = 23 named failures (c-41.58); `bash scripts/run-floor.sh --check` must read `FLOOR = NAMED BASE, no delta (refusals, not in base: 4)`. Open: **F-41.142** — `b06_advisor_bench` exited 1 in the chair's container at `eb712d1` but the founder's `--check` did not list it; seat I re-fixtured the bench; the next `--check` settles it.
- `docs/db/PUBLIC_SCHEMA.md` regenerated at `0154`; **owed: regen at `0159`** (`0155`–`0159` landed since: consent columns, found_notices, `messages.room`). The founder runs the four editor exports + the two generators (block in CE-41's chat; the protocol carries it).

---

## 2 · THREE LIVE ISSUES FROM THE FOUNDER'S LAST WALK — RULED HERE, EXECUTE FIRST

The concierge lane works end to end (request → outsider notice on v2 Utility → bride "we found you" → her reply recorded as consent). Three things around it:

**Issue 1 — the outsider's "Visit website" button lands on the review fallback.** The `enq-` branch is on the tree (`app/r/[code]/route.ts:85–95`); the template sends `enquiry_ref: enq-<full item uuid>` (`assistance.js:1019`). One click separates the causes: open `https://thedreamwedding.in/r/enq-5b8e563f-0e43-4c53-a670-e4b53cbd39b4` in a browser. Lands on `/e/…` → the route works and Meta's stored button base differs from the filed one (long-press the button in WhatsApp → copy link → read it). Shows the fallback → Vercel is stale; redeploy. **Founder's click; chair rules from the answer.** Note: the link builder's `wa.me` token is the id's first eight hex (`enq-5b253fb2`); the button's suffix is the full uuid — both resolve, but **R-42.1: one token form** — the button moves to the eight-hex form in the next dream-os packet so the vocabulary is one.

**Issue 2 — `/e/<id>` shows a static sentence.** `GET /api/v2/public/enquiry/:token` is live and walked (category · city · month · band). The page doesn't call it. **F-41.156, seat D's first pwa cut in CE-42, small.**

**Issue 3 — the couple is told to reply and the bride lane refuses her (F-41.155, THE REAL ONE).** Admin-filed requests carry `couple_id: null` (`admin/assistance.js:56`); the found-notice goes to the raw phone; her reply hits the bride lane's invite-token gate and gets `DEAD_END_REPLY`. **Ruled:** (c) as the cure — `attachCoupleByPhone` (chartered in D2b, never built): every request gets a couple row (create on last-ten if none), so `couple_id` is never null and her reply is a known couple's; **and (a) today as the mitigation** — until (c) deploys, the found-notice must not invite a reply: the founder edits row 12 at the Manager (*"…their work is on Instagram at {{4}}. We will be in touch with the introduction."*) — an edit, Utility, same ID, re-review in minutes; seat B amends `TEMPLATES.md` row 12 and the registry body moves with seat D's cut. **This is CE-42's first dream-os packet.**

Also from the relay: the fan-out dialog was never confirmed on the glass (six `fanout_reached` refusals, no pass — one retry settles it); `account_update` is subscribed and will print its whole payload the first time Meta sends one; the Switchboard *restrictions* row needs a store (migration) — CE-42; F-41.144 (`flag.assist_forward_alert` renders its raw key) and F-41.145 (a stale comment in `switchboardCopy.ts`) are one line each, seat D's next pwa touch; F-41.152 withdrawn (the founder's *Type a request* sheet exists — `TypedIntake`).

---

## 3 · SEATS — WHO IS OPEN, WHO IS CLOSED

| seat | model | state | holds |
|---|---|---|---|
| **B** (filings/docs) | Opus 5 | open, resting | F-41.120 retention table (fresh clone, `git status` first, 91 tables, hard stop at `PUBLIC_SCHEMA.md:1529`, periods blank for the founder); row 12's amendment; row 10's Edit-screen witness (founder's capture owed); the transfer paragraph holding on R-41.130's date |
| **D** (concierge) | Opus 5 | open, cutting | F-41.155 (c) · F-41.156 · R-42.1 · F-41.144/.145 · then CE-42's concierge s2 (public intake `/plan` R-41.94, amend-after-Send, `attachCoupleByPhone`, the 48h lapse if not yet in — check `assist_lapse_hours` exists at the tip) · range F-41.155–.156 spent; **issue a fresh range at origin** |
| **H** (OBA) | Opus 5 | open | the Meta Support ticket for the marketing line's blue tick (all five criteria met; button disabled); `docs/filings/META_OBA_FILING.md` |
| **M** (product manual) | Opus 5 | open, reading | chapter-0/1 drafts for the founder's opening-paragraph veto, then the PDF; c-41.89 (retire `docs/TDW_MANUAL.md` to a pointer); needs from the founder: the two chair PDFs and the *Templates on Meta* paste |
| A, C, E, F, G, I | — | **closed** | close notes on the tree (`TDW_20_S1_CLOSE.md`, `TDW_CE41_F_CLOSE.md`, `TDW_CE41_G_CLOSE.md`; seat E's (iv-b) note and seat I's last note are their closes) |

Seat D's images are near their limit; if it fills, open D2 (Opus 5) with this file's §2–§4 and `docs/TDW_CE41_D3c_PWA_HANDOVER.md` as its kickoff.

---

## 4 · CE-42 ROADMAP — THE FOUNDER'S ORDER: 1 → 3 → 2 → 4

*Corrected 2026-09-10 (CE-42 seat G2, F-42.44's sitting). The row letters below were wrong as written: R8 read "row G", and R6/R7/R9 read "rows F, H, J". Derived at `docs/specs/TDW_CE41_ROADMAP.md` §2 (`:34`): row **F** = R8 Open dates & rates (`:45`) · row **G** = G2 s2, Google, ~10-27 (`:46`) · row **H** = R6 Posts & ads (`:47`) · row **I** = R7 s3 (`:48`) · row **J** = R9 Your own number (`:49`). The cause is visible in this section: item 3 below IS G2 s2, the true row G, so item 2 was given item 3's row and the rest shifted down one.*

Do the Google *waits* in parallel with (1) — they are the founder's taps, not a seat's.

**1 · Concierge s2 (seat D).** F-41.155 (c) first. Then: the public intake link `/plan` (R-41.94: the sheet pre-filled, phone → bride-line OTP = signup, request writes with `couple_id`, `origin='public'`); amend-after-Send (R-41.95's shape; per-item status, request status derived); **no decline control** — R-41.143: a forward not acted on in 48h (`admin_config.assist_lapse_hours`, seeded 48) lapses, frees the slot, reads *No reply in 48h*, stops counting as found; F-41.156; R-42.1; the Switchboard restrictions row + its store; the outsider inbound door's reply arm (R-41.131 — `enq-<8 hex>` in her first message answers with the enquiry; the link builder exists, the branch answers today, confirm the reply half is wired). Mock-first stands for every new surface; frames under **R-41.140** (tokens emitted from `lib/worklist/theme.ts` — `tools/advisor_frame_emit.mjs` — never hand-typed; both arms; 374); the chair holds every copy veto (R-41.98 delegated), founder's rule: plain, short, direct.

**3 · G2 s2 — Google.** Founder taps first (B3·1/B3·2 in `docs/filings/`): domain + redirect URI, Search Console, brand verification + **publish in one sitting**, then the day-8 refresh-token check (F-19.13 discharged by A4; the seven-day death ends on publish). Then the code turn: the second scope set, `business.manage` at the gate (R-41.47). Dated ~10-27 in the roadmap; the taps can start now.

**2 · R8 — Open dates & rates** (roadmap §2 row **F**): the vendor's availability and price bands on her `/v/` page; shares seat C's reminder plane; mock-first; R-41.114's wallet law (`Rs X,XX,XXX` whole figures; paise only where paise exist; no `L`/`k`).

**4 · R6 / R7 / R9 s3** (rows **H, I, J**): Instagram insights + publishing behind the `perm.*` gates; ads read; the Tech Provider click (R9) only after the counsel item F-41.121 is answered by the standard-form paragraph and R-41.130's date resolves. R-41.80: every granted permission exercised on the test account within 7 days, monthly after.

**Then, when there is a seat free:** Block 09's floor (F-41.13 middleware→proxy, F-41.44/.45, F-41.113 draining the retired `victor_mode` column, F-41.143 the raw-text-instrument sweep); the soul sitting under W-1 (F-41.112 the guard's self-configuration family, F-41.127's escalation line in Victor's repertoire, the "50k" prompt leak, F-41.129 Mira's two-door greeting — couples reach the marketing line from Instagram now).

---

## 5 · STANDING DATES

- **2026-09-16** — R-41.130: DeepSeek's written reply or the rows move (Donna, Mira's nudge, harvest → Anthropic from the panel, three taps) and the privacy page's provider paragraph ships true (seat B holds it drafted, unsoftened).
- **2026-09-25** — F-41.9 pricing re-check + R-41.124 Messaging Policy re-read, same sitting, quarterly.
- **10-01** RBI e-mandate — done (Mastercard 0986). **10-20** MFA — done (portfolio 2FA set). **10-27** G2 s2.
- Every Meta permission: exercised within 7 days of grant, monthly after (R-41.80). Incident: `vendor-incident@meta.com`, **48 hours** (APAC §3.6, R-41.120).

---

## 6 · WHAT IS LIVE (so nobody re-derives it)

- **Concierge s1 + s2's core:** couple request → admin queue → forward to a TDW vendor (lead alert) or an outsider (`tdw_assist_lead_outside_v2`, **Utility**, marketing line, dynamic URL button) → the couple told (`tdw_assist_found_vendor` / `_found_outside`, couple line) → receipts routed on all three lanes (F-41.59/.60) → consent from her own reply (R-41.131) or the founder's tick (`founder_attested`, R-41.135) — **evidence, not a gate (R-41.132)**. Fan-out cap warn-and-confirm live. Outsider already a vendor → refused with a redirect.
- **Switchboard** re-shaped (R-41.82): eleven rooms, verb rows, the key one tap deep, Model routes group; every gated feature flippable from the founder's phone; nightly sweep reads Meta live; `tdw_capability_armed` notifies the founder.
- **Model routes:** every lane × role switchable (F0/F1/F1b/F2/F2b); Basic tier on DeepSeek both surfaces by the founder's ruling (R-41.108); `transport=` on every model line; per-role stamps.
- **Advisor:** reachable only through the Advisor room (R-41.136); the room is its own full-screen conversation (R-41.139); one thread across rooms with the chip, the edge and the teal seam where the room changes (R-41.142); WhatsApp always business (R-41.104); Victor names the room he is in (the room line); `victor_mode` decides nothing.
- **Cockpit** on the vendor palette, one token home, its own light/dark switch at the Bridge's foot (R-41.112), mastheads in type, the brand family at `public/brand/` (seal, icons, favicon D, lockups) used on icons/profiles/PDF only (R-41.134).
- **Filings:** 39 templates Active incl. the five filed 09-08/09; Messaging Policy, APAC annex, Anthropic DPA read at source (F-41.33, F-41.48-Anthropic closed); `account_update` subscribed; three WhatsApp profiles complete; Instagram ↔ marketing line (R-41.127); portfolio verified since 4 May.
- **Two PDFs** (vendor solutions, marketing playbook) re-cut with the lockup and the price anchor struck (c-41.16).

---

## 7 · LAWS EARNED THIS BLOCK — INTO THE PROTOCOL AT CE-42's FIRST DOCS CUT

R-41.106 `??` is a finding · R-41.109 every paste block parsed (`bash -n`) before hand-over · R-41.113 pin the smallest expression · R-41.121 a cell asserts the meaning the law names, never a spelling · R-41.137 a `wamid` ships with its router arm · R-41.138 a cell counts only when the count is the guarantee · R-41.140 frames emit their tokens from `theme.ts` · R-41.144 anchor on the arm's own slice · R-41.145 a comment naming an env var states what it holds · R-41.146 a database double refuses what the database refuses · F-41.150 every bench guards its own entry · c-41.30's pairing: name the authority and the source to read it from — the source wins · F-41.84/.97: numbers (findings and corrections) derived at both origins immediately before issue · R-41.116 a Manager preview witnesses text and slots, only the Edit screen witnesses components · seat D's: a component is its context too · seat B's: three failures, one shape — a second place holding a fact the filing already held.

---

## 8 · FIXTURES, CREDENTIALS, ADDRESSES

- DEV440 `9888294440` (Signature, by the founder's tap) · MAKEUPBYSWATIROY `8595356978` (Prestige) · test couple `9625759924` · outsider fixture rows discarded via `/admin/prospects` after each walk.
- WABA `1739793260373677` · portfolio `995204059832918` · app `1425513376067685` · vendor `+917982159047` (PNID 1197664646766743) · bride `+917011788380` (1193630900506451) · marketing `+918810531764` (1171408606064102, env `MARKETING_WHATSAPP_NUMBER=whatsapp:+918810531764`).
- **F-41.141: the Meta bearer token appeared in a screenshot today — rotate it first thing if not already done** (system-user token → Railway `WHATSAPP_ACCESS_TOKEN` on both services → revoke the old).
- Supabase `nvzkbagqxbysoeszxent` · Railway two services (dream-os, dream-os-marketing) · Vercel dreamos-pwa.

---

## 9 · THE CHAIR'S OWN ERRORS THIS BLOCK, SO THE NEXT CHAIR DOESN'T REPEAT THEM

Issued numbers from memory (F-41.84/.97) · ruled "registry wins" without the Manager (c-41.30) · a frame "vetoed" that never existed (c-41.28) · the brand mark on mastheads twice (c-41.69/.74) · a hot rider landed unverified (c-41.79) · a mechanism asserted and overturned by a seat's read (c-41.50) · told the founder to run what he had run (c-41.95). The cure for all of them is the same and is §0's rule 2.

═══ END · CE-41 seals here. CE-42 begins with §2, Issue 3. ═══
