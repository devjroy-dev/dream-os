# TDW — CE SUCCESSION NOTE V (Chief Engineer chair handoff)

**Written:** 2026-07-19, by the fifth chair (CE-22) at the P1+P2 seam, for its successor.
**Authority:** the sixth chair inherits ALL standing rulings herein and in the repo — five chairs' worth. The repo is truth; this note carries only what lives nowhere else, or needs saying once more.
**Verify-first law applies to this note itself:** every state claim below is re-verified at HEAD (origin, re-fetched) before the successor relies on it. This chair banked partly for forgetting that once; do not repeat it.

## 1. THE ROLE
The CE authors specs, issues kickoffs, rules on every executor question with evidence, audits deliveries at origin, and NEVER executes. Executor sessions (one sitting = one session) clone, build, and disclose; the founder (Dev) runs migrations/SQL/smokes and holds copy veto on all vendor-facing words. The two-chair split is deliberate — the chairs audit each other; this tenure the executor corrected the chair twice by evidence (the "five verdicts" that were four; the truer read of `whatsapp.js`). NEVER collapse the chairs; the first tell your own hands are doing an executor's job is the bank signal.
**One correction you inherit:** Note IV §1's "executor-has-no-repo" law is SUPERSEDED (founder correction, honoured in the log and every kickoff since). Executors CAN fetch — charter them to clone, build, verify, and disclose their real output. The surviving law is narrower and true: never claim a by-command result you did not run. You re-derive every delta at origin regardless, because the executor's clone can lag the founder's push.

## 2. STATE AT HANDOFF (verify at HEAD)
- origin/main = the bank commit atop `5595641`. Block 05: **F-04.65 sealed** (`a2c593b`/`8c7bcf6`/`ca1e697`) · **P1 webhookCore sealed** (`553f2d2`/`edf3551`/`6524306`) · **P2 template registry sealed** (`a19ca9d`/`1af1bdc`/`5595641`).
- Migrations `0083_failed_turns` + `0084_message_sid_dedupe` committed AND applied live (founder-witnessed); the repo matches prod.
- Benches green, CE-verified non-vacuous: `checker_bench` 101/101 · `b5_wa_door_bench` 32/32 · `b5_webhookcore_bench` 43/43 · `b5b_movementb_bench` 56/56 · `b05_p2_sendwa_bench` 49/49.
- All six Meta templates APPROVED on the WABA; `templates.js` reflects `approved`; the live send transport is NOT wired (`defaultSendTemplate` throws `WaTemplateTransportNotWiredError`, caught by `routeNudge` as a graceful refuse-and-log) — P3 wires it.
- Block 06's advisor arc is PARKED: **F-06.4** OPEN (advisor redirect ~1-in-3 clean on the routed model), cure unruled. The Sitting II/III cures (F-06.13/F6/F-06.14/F-06.15) landed and standing; the production split (L3) passed clean.
- OPEN, carried forward: P1's cross-service replay re-drive hop (unexercised in prod); the `0079_nudge_optout` reservation hole (missing — a P4 nudge migration).

## 3. FOUNDER-RULED SEQUENCE (binding)
P3 (prospect lane + the LIVE Meta Cloud API transport swap — wire `defaultSendTemplate` to `POST /{phone-number-id}/messages`; the approved templates go live here; marketing service + the `[wa:marketing]` prefix webhookCore already defines; migration = the next free number **derived by command**, NOT the drifted spec reservation) → P4 (crons; bride nudge = EXTEND per BRIDE_AUDIT §7) → P5 (mechanical engine migration) → P6 (certification). The couple-agent soul CLOSES Block 05 (CE Charter Addendum §2). AFTER 05: revisit **F-06.4 / Sitting IV** (the parked advisor arc).

## 4. STANDING LAWS & RULINGS INHERITED (do not relitigate without new evidence)
- **W-1:** Block 05 touches engine code only mechanically — ZERO prompt/soul/voice. TDW_06 owns every word. (Template bodies are product copy under founder veto — allowed; agent voice is not.)
- **P-06.T** (settled): Meta Cloud API direct, TDW owns the WABA as Tech Provider; Twilio fallback-only (balance 0); templates file direct with Meta, no BSP; the registry keyed by Meta name+language, never a Twilio SID.
- **RF-1** (ruled): inbound dedupe in `messages.message_sid` (nullable, partial unique index), both services capture the inbound sid; LRU the fast path.
- **The P2/P3 transport boundary:** the approved templates send the moment P3 wires the Meta POST.
- **Delivery discipline:** clobber-safe `deploy/`-prefixed ZIPs (NO FINDINGS_LOG/masterplan inside), D-10 fused verify+git with the STOP sentence, migrations conditional-withheld. Kickoffs are chat paste-blocks (not committed — the founder ruled against repo clutter); handoffs ARE banked as their own docs; the CE holds FINDINGS_LOG + the masterplan.

## 5. THE LESSON THIS TENURE LEAVES, AND WHY I BANK
**GROUND-TRUTH THE MATCH.** A committed value is not a fact until you read what surrounds it. I grepped FINDINGS_LOG for a Supabase URL, took the first hit, and handed the founder a DEAD project URL — the live one sat on the next line of the same finding. A grep hit is a candidate, not an answer. Re-derive anything that can go stale (URLs, hashes, migration numbers, template state) at origin, IN CONTEXT, before you rely on it — the whole 05 arc kept surfacing this (`0078` reused, `twilioTemplateSid` stale, the working tree behind origin), and the chair is not exempt.
I bank not because character or judgment drifted — they held: every delta verified at origin, nothing fabricated, the split intact, errors owned when caught. I bank because verification-CARE frayed over a long context — a pattern of grounding lapses, two of which the founder caught rather than me, and the CE's worth is being the one who catches. The seam law says bank at the seam when care frays; P1+P2 is a clean seam and P3 opens fresh. A chair that recognizes its fraying and hands off is the law working; one that clings to the seat is the failure it exists to prevent.

## 6. WORKING METHOD (unchanged; the successor runs it)
1. Executor sessions get a KICKOFF (chat paste-block): read ladder → seating law → the ruled brief (what is RULED vs the executor's read-first) → acceptance → spelled-out delivery. Ground it in the repo, not memory; spell the delivery out (do not cite section numbers).
2. Every executor packet returns via the founder carrying its commit hash; the CE re-derives the delta at origin and rules on nothing unverified.
3. Deliveries: `deploy/`-prefixed ZIPs, fixed apply, D-10 fused verify+git; migrations conditional-withheld and founder-run.
4. Sittings end with HANDOVER + DISCLOSURE; the next opens on it. Seam law: sessions self-audit freshness and bank early.
5. Founder hands: migrations (guarded, witnessed-columns, repo line 1), smokes (the screen is the witness — F-04.41), copy vetoes. No live credentials in transcripts (env-referenced, never printed).

## 7. IMMEDIATE QUEUE FOR THE SUCCESSOR
(1) Verify §2 at HEAD by command, from a fresh clone. (2) Open **P3** — charter the prospect lane + the live Meta transport swap (the read ladder assembles from `TDW_05_WEBHOOK_FINAL` §P3 + `TDW_05_TRANSPORT_RULING` (P-06.T) + the P1→P2 handoff; derive its migration number by command). (3) P4 → P5 → P6 in order; the couple-agent soul closes 05. (4) After 05, revisit F-06.4 / Sitting IV. (5) Rule the OPEN items (§5 replay hop, `0079` hole) when their phase comes.

*— the fifth chair, at `5595641`*
