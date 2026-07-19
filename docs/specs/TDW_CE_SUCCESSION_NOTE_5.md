# TDW — CE SUCCESSION NOTE V (the fifth chair banks to the sixth)

**CE-22, the fifth chair.** Authored at dream-os `5595641 = origin/main`, re-derived at writing. I seated at `1e67d9a` (Note IV §5), carried Block 06's advisor arc to its parking and Block 05 from its first sitting through P2, and I bank here — at the P1+P2 seam, one turn early rather than one turn late, per the seam law. Read this whole before you seat. Verify §2 at HEAD by command; do not trust this file over the repo.

---

## §1 — THE LAW THIS TENURE LEAVES YOU (one minted, one corrected)

**MINTED — GROUND-TRUTH THE MATCH.** A committed value is not a fact until you read what surrounds it. My hard lesson: I grepped `FINDINGS_LOG` for a Supabase URL, took the first hit, and handed the founder a *dead* project URL — while the very next line of that same finding named the live one. A grep hit is a candidate, not an answer; read its context, and re-derive anything that can go stale (URLs, hashes, migration numbers, template state) at origin before you rely on it. This is the same disease the whole 05 arc kept surfacing — `0078` reused, the spec's `twilioTemplateSid` stale, the working tree behind origin — and the chair is not exempt from it. When a fact is load-bearing, verify it yourself, in context, now.

**CORRECTED — Note IV §1's "executor-has-no-repo" is SUPERSEDED (founder correction, honoured in the log and every kickoff since).** Executors *can* clone and fetch; forbidding it was a capability error the fourth chair over-generalized from one honest refusal. The **surviving** law is narrower and true: *never claim a by-command result you did not run.* The executor clones, verifies, authors, and discloses its real output; the CE re-derives every delta at origin regardless, because the executor's clone can lag the founder's push and the two chairs audit each other. Charter executors to build and disclose — never to "verify by command" on your behalf.

The two-chair split held this tenure and earned its keep: I authored no code, bench, soul, or migration; the executor did — which is exactly why it could correct me by evidence (it caught my "five verdicts" when there are four, and read `whatsapp.js` more truly than my charter did). **Do not collapse the split.** The first tell that your hands are doing an executor's job is the bank signal.

---

## §2 — VERIFY THESE AT HEAD BEFORE YOU RELY (re-fetch from origin; CE-22 fetches or it guesses)

- origin/main = `5595641`. Block 05: **F-04.65 sealed** (`a2c593b`/`8c7bcf6`/`ca1e697`) · **P1 sealed** (`553f2d2`/`edf3551`/`6524306`) · **P2 sealed** (`a19ca9d`/`1af1bdc`/`5595641`).
- Migrations `0083_failed_turns` + `0084_message_sid_dedupe` are committed AND applied live (founder-witnessed). The repo matches prod.
- Benches, all green and CE-verified non-vacuous: `checker_bench` 101/101 · `b5_wa_door_bench` 32/32 · `b5_webhookcore_bench` 43/43 · `b5b_movementb_bench` 56/56 · `b05_p2_sendwa_bench` 49/49.
- All six Meta templates are **approved** on the WABA; `src/lib/templates.js` reflects `approved`; the live send is **not wired** (P3).

## §3 — STANDING RULINGS YOU INHERIT (do not relitigate without new evidence)

- **W-1:** Block 05 touches engine code only mechanically — **zero prompt/soul/voice.** TDW_06 owns every word. A soul/voice diff in 05 is a failed sitting. (Template *bodies* are product copy under founder veto — allowed; agent voice is not.)
- **P-06.T** (settled): Meta Cloud API direct, TDW owns the WABA as Tech Provider; Twilio is fallback-only (balance 0); templates file direct with Meta, no BSP. The registry is keyed by Meta name+language — **never** a Twilio SID.
- **RF-1** (ruled): inbound dedupe lives in `messages.message_sid` (nullable, partial unique index), both services capture the inbound sid; LRU is the fast path.
- **The P2/P3 transport boundary:** `defaultSendTemplate` throws `WaTemplateTransportNotWiredError`, caught as a graceful refuse-and-log. **P3 wires the live Meta POST** — and the moment it does, the approved templates send.
- Delivery discipline stands: clobber-safe deploy ZIPs (no FINDINGS_LOG/masterplan inside), D-10 fused verify+git with the STOP sentence, migrations conditional-withheld. Kickoffs are chat paste-blocks, not committed; handoffs *are* banked as their own docs; **the CE holds FINDINGS_LOG + the masterplan.**

## §4 — YOUR QUEUE

1. **P3 — the prospect lane + the LIVE Meta Cloud API transport swap.** Wire `defaultSendTemplate` to `POST /{phone-number-id}/messages` with the template payload; the approved templates go live here. The prospect lane + the marketing service (`marketingIndex`) + the `[wa:marketing]` prefix webhookCore already defines. Its migration is the next free number — **derive it by command** (`0083`/`0084` are taken; the spec's reservations drifted, and `0079_nudge_optout` is a real hole, missing).
2. **P4 crons** (bride nudge = EXTEND per BRIDE_AUDIT §7) · **P5 mechanical engine migration** · **P6 certification.**
3. **The couple-agent soul CLOSES Block 05** (CE Charter Addendum §2) — courtroom first, doctrine ports by class from the ruled MANUAL PAPER.
4. **After 05: revisit F-06.4 / Sitting IV** — Block 06's advisor arc is PARKED. F-06.4 (advisor redirect ~1-in-3 clean on the routed model) is OPEN, cure unruled. The Sitting II/III cures (F-06.13/F6/F-06.14/F-06.15) are landed and standing; the production split (L3) passed clean.
5. **OPEN, carried forward:** P1's cross-service replay re-drive hop (§5, unexercised in prod); the `0079` reservation hole.

## §5 — WHY I BANK, AND YOUR SEATING

I bank not because character or judgment drifted — they held: every delta verified at origin, nothing fabricated, the split intact, errors owned when caught. I bank because **verification-care frayed over a long context** — a pattern of grounding lapses (the dead URL, a web search for a question the repo had already settled, the working tree repeatedly behind origin, a bench mutation fumbled several times before it bit). Two of those the founder caught, not me — and the CE's worth is being the one who catches. The seam law says bank at the seam when care starts to fray; P1+P2 is a clean seam and P3 opens fresh. A chair that recognizes its fraying and hands off is the law working; one that clings to the seat is the failure it exists to prevent.

**Seat yourself so, sixth chair:** read from a fresh clone, in order — this note, then Notes I–IV whole (they hold the two-chair law, the never-collapse rule, and the working method), the build protocol (every law, §9), the masterplan block 05 + 06 rows, `TDW_05_WEBHOOK_FINAL` (§P3, W-1), `TDW_05_TRANSPORT_RULING` (P-06.T), the CE Charter Addendum, the P1→P2 handoff, and `FINDINGS_LOG` from CE-25 to the end. Confirm your reading, verify §2 by command, then take up §4 in order. You hold the clone and do all by-command derivation; executors clone, author, and disclose but you verify every delta at origin yourself (dream-os here; clone `dreamos-pwa` separately for any PWA delta). You inherit all standing rulings of five chairs. Author specs and kickoffs, rule on executor questions with evidence — every packet carries its commit hash, rule on nothing unverified — and never execute: the founder runs migrations, SQL, and smokes, and holds copy veto on every vendor-facing word. The seam law binds you as it bound me: at the first tell that your own care is fraying or your hands are doing an executor's job, bank on a note like this one.

*— the fifth chair, at `5595641`*
