# Session 1 — Minutes of Meeting
**Date:** 2026-05-30
**Scope:** Completion of Phase 3 (WhatsApp 24-hour window gate) and the full build + live-debugging of Phase 3.5 (category-profile system: Layer 0 wedding-shape at onboarding, Layer 1 category-driven couple enquiry intake). Plus two vendor-agent fixes surfaced by live testing (send-first reconciliation + intent-extractor leak guard).
**Repos:** `dream-os` (backend, Railway) and `dreamos-pwa` (frontend, Vercel). This session was backend-only.
**Style:** Exhaustive session notes — every piece of work, every error, every fix, every decision and its reason, and a complete flagged-items register at the end. This is NOT a handover; it is the working record of the session.

---

## 0. Environment & ground truth (for context)

- **Backend** `dream-os`: Railway, entry `node src/index.js` (vendor world) and `src/brideIndex.js` (bride world). Prod host `dream-os-production.up.railway.app`.
- **Frontend** `dreamos-pwa`: Vercel, `thedreamwedding.in/vendor`.
- **Supabase:** project `nvzkbagqxbysoeszxent` (Mumbai). One DB shared by both WhatsApp numbers.
- **Two WhatsApp numbers:** +91 `8757788550` (vendor world) and +1 `14787788550` (bride world).
- **Models:** Haiku `claude-haiku-4-5-20251001`, Sonnet `claude-sonnet-4-6`.
- **Test vendor:** Swati / handle DEV550, vendor_id `2eb5d3fb-31eb-4b26-859a-cf10ae477d53`, real category "Makeup Artist" (toggled across jewellery/designer/photography during testing — MUST be restored to 'Makeup Artist').
- **Test phone:** `+919888294440` ("4440") — the only test phone available. It is BOTH a registered bride (couple `7abccc1b-0698-43ba-9709-c6a1e52af789`, name **Ananya**, wedding 2026-12-26 Kerala, function_count=4, wedding_days=3, functions="mehendi, sangeet, wedding, reception") AND a lead under Dev550.
- **Vendor test phone:** `8550`.

**Deploy commits this session (in order, all live on dream-os main):**
`0fd32c2` (gate, prior) → `121d27b` + `4203ff5` (Layer 0 + anaphora) → `1398c42` (Layer 1 v1) → `b069d46` (known-name + close fix) → `6c80e67` (persist rules, code-only) → `143b1ec` (FINAL enquiry: drop occasion + fused opening + no-loop/no-bail) → [pending push] send-first + intent guard.

---

## 1. Work done

### 1.1 Phase 3 — WhatsApp 24-hour session-window gate (completed)
- **What:** Before `send_to_couple` actually sends, `replyToCouple.js` checks for an inbound message from the couple within the last 24 hours (messages table, direction='inbound', conversation_id = thread.id). If none, it returns `window_closed` instead of attempting the send.
- **Why:** WhatsApp only allows free-form (non-template) messages within 24h of the user's last inbound. Outside that window Twilio ACCEPTS the request but the message silently bounces. Previously the agent could say "Sent!" when nothing was delivered. The gate makes the system never lie about a send.
- **Behaviour:** On `window_closed` the agent is honest ("window closed, message directly, want me to draft?") and offers draft-and-forward.

### 1.2 Phase 3.5 Layer 0 — multi-day wedding shape at onboarding (done, deployed, confirmed)
- **Migration 0065** (`db/migrations/0065_couple_wedding_shape.sql`, APPLIED + confirmed): adds `function_count` (int), `wedding_days` (int), `functions` (text) to `couples`.
- **New onboarding state `asked_functions`** inserted after `asked_date` in the deterministic state machine (`brideOnboarding.js`). Full flow: `new → asked_date → asked_functions → asked_partner → asked_city → asked_budget → complete`.
- **Locked question text:** "Is it a single day, or spread across a few functions — mehendi, sangeet, the wedding, reception? Roughly which ones, and over how many days?"
- **Haiku extractor `extractWeddingShape`** added and exported.
- **Confirmed live + by SQL:** 4440 onboarding answered "all of them, 3 days" → stored function_count=4, wedding_days=3, functions="mehendi, sangeet, wedding, reception".
- **Reason this exists:** an Indian wedding is a SPAN of functions, not one date. Capturing the shape once at onboarding means every category enquiry can reference the bride's real functions instead of re-asking.

### 1.3 Phase 3.5 Layer 1 — category-driven couple enquiry intake (built, rebuilt, debugged live)
- **New module `src/lib/vendor/categoryProfiles.js`** (liftable, like categoryFraming). Each profile = `{label, timelineType:'event'|'delivery', ask:[...], vocabulary, freeTextVision?, visitOriented?}`. `profileFor(category)` resolves via `normaliseCategory` + ALIASES (e.g. videography→photography).
- **`attire` → `designer` rename** done across categories.js, aliases, categoryFraming, profiles, brideTools/brideSystemPrompt example text. Confirmed safe via SQL (no vendor rows used 'attire', no CHECK constraint) — no migration needed. Reason: "99% say designer not attire."
- **Architecture:** `runCoupleAgenticTurn` (engine.js ~line 373) + `coupleSystemPrompt.js`. Haiku agent, HARDCODED prompt (no "learning" — see Decision 2.4). engine.js fetches by phone: `isReturningBride`, `knownBrideName` (from users.name), `weddingShape` (from couples via users join), all passed to `buildCoupleSystemPrompt`.
- **Final per-category ask lists (FINAL, after dropping occasion — see 1.4):**
  - **JEWELLER (delivery):** pieces (single/set) → type (gold/polki/kundan/diamond/temple) → custom-made/ready → ready-by → budget → name (if new). No wedding-shape.
  - **DESIGNER (delivery):** outfit kind → custom-made/stitched or ready → timeline/trial → budget → name (if new). No wedding-shape.
  - **MUA (event):** [shape if unregistered] → which functions need makeup → how many people → budget → name.
  - **PHOTOGRAPHER (event):** [shape if unregistered] → which functions to cover → photo/video/both → budget → name.
  - **DECOR (event):** [shape if unregistered] → function(s)+venue → free-text vision (capture as-is) → budget → name.
  - **VENUE (event):** [shape if unregistered] → guests → functions/dates → budget → name; visit-oriented (nudge a visit).
- **Wedding-shape gating:** only EVENT categories use shape (`timelineType==='event'`). Registered bride inherits shape (don't re-ask); unregistered event-category bride is asked shape FIRST. Delivery categories (jeweller/designer) NEVER ask or inherit it.
- **Migration 0066** (`db/migrations/0066_lead_wedding_shape.sql`): adds the same three shape columns to `leads`, for unregistered brides (Option A — store on lead, no ghost couples record). STATUS UNCERTAIN whether run in Supabase — flagged.

### 1.4 Phase 3.5 Layer 1 — final enquiry cleanup (deployed `143b1ec`)
- **Dropped the occasion/function question entirely from jeweller AND designer.** Reason: the greeting itself carries the context; a separate "what occasion" question was redundant and caused loops.
- **Fused opening:** the first message combines identity + first question in ONE line, e.g. "Hi Ananya! I'm Dev's assistant — what kind of jewellery are you looking for, a single piece or a full set?"
- **No-loop / no-bail / capture-partial rules** added to BOTH bride branches (returning + new) — see 1.5.

### 1.5 Persist / never-dead-end rules (deployed; the wa.me USP guard)
- **New branch (first-contact) hard rules:** (9) never re-ask a question she already responded to, even if vague ("something else"); treat any reply as her answer and move on. (10) never bail/brush off on hesitation ("never mind"); keep the thread warm and open. (11) if she wants to stop, STILL capture a partial lead so the vendor can follow up.
- **Returning-bride branch:** removed the cold "vendor will be in touch" brush-off catch-all; hesitation is now kept warm and open; never dead-ended.
- **Removed the "something else" trap** from the example phrasing (the prompt had been *teaching* Haiku to offer a menu option it then couldn't handle).

### 1.6 Vendor-agent send-first reconciliation + intent-extractor leak guard (built; pending push)
- **send-first (systemPrompt.js):** reconciled a direct contradiction in the vendor prompt (it claimed both "send_to_couple is the default" AND "you have NO ability to send"). Now: `send_to_couple` is ALWAYS the first action for any tell/send/say instruction; the deterministic 24h window-check inside `replyToCouple` is the decider — window open → send + "Done, sent to [Name]"; window closed → honest "the 24-hour window's closed, you'll need to send this from your own WhatsApp — here's a draft." The false "I can't send messages on your behalf" refusal is now explicitly banned.
- **intent-extractor guard (intentExtractor.js):** rejects Haiku refusal / non-verb-phrase outputs so they cannot leak to the vendor; caller falls back to the clean verbatim notification ("Ananya just messaged: '3'").

### 1.7 Documentation (this session)
- Updated `docs/SCHEMA.md` (header, couples table, leads table, onboarding_state enum, migration history for 0065/0066).
- Wrote this Session 1 MoM.

---

## 2. Decisions and their reasons

1. **Reply-to-couple stays WhatsApp-only (no PWA port).** It is a conversational real-time gesture, not PWA-native. "Not worth it at 50–100 vendors." Out-of-window template reply parked with the template batch.
2. **Wedding budget stays in onboarding (asked_budget), not re-added.** Already captured; soft/ballpark. The per-enquiry budget is SEPARATE (see 4).
3. **Category-profile system is liftable/generic by design.** Each profile is already "the PA for a [jeweller/designer/etc]". The only wedding-specific step is the wedding-shape question (event categories only). This is the foundation of the future solopreneur pivot — strip/conditionalize the shape step → generic solopreneur intake. (Pivot gated on proof; not now.)
4. **No "learning" / discretion in the couple enquiry agent.** User pushed back hard: a learn-list "just opens the door for unwanted agent behaviour." Behaviour is 100% prompt-controlled and hardcoded.
5. **Identity greeting fused with the first question in ONE line.** No separate greeting-then-question. Tighter, more human.
6. **No occasion question for jeweller/designer (delivery categories).** The greeting carries context. The occasion question caused loops and was redundant. "Something else" is a complete answer — treat it as done and move on.
7. **Ask a per-vendor ballpark budget for EVERY category.** Qualifies the lead — the vendor needs to know roughly what she'll spend (a photographer charging 1L/event shouldn't get a 20k lead). NEVER lean on the whole-wedding budget. (This reversed a momentary "no budget" confusion — final: DO ask her budget.)
8. **NEVER quote/invent the vendor's price.** Killed the "Dev's pieces start from 80,000" hallucination (Haiku inventing a number from a prompt template). Asking HER budget ≠ stating HIS price.
9. **Registered bride inherits NAME and SHAPE.** engine.js fetches users.name → knownBrideName; the prompt greets by name and skips the name question; lead saves via `resolvedName = input.name || knownBrideName`. Fixed a "why ask my name if you know me?" issue.
10. **Defer ALL bride questions to the vendor.** Any availability/can-you-X/price question → "Let me check with [vendor] and get back to you." Never answer for the vendor.
11. **Never dead-end a prospect (wa.me is the USP).** No re-asking, no bailing on hesitation; if she stops, capture a partial lead. Fixed via prompt rules first; deterministic `looksLikeDodge` detector held in reserve if Haiku still freelances.
12. **Unregistered bride's shape stored on the LEAD (Option A), not a ghost couple record.** capture_couple_lead always writes a leads row and mirrors to couples ONLY if coupleId exists. Migration 0066 adds the shape columns to leads.
13. **Send decision belongs to the infra, not the agent (Policy A).** Always call `send_to_couple` first; the existing deterministic 24h window-check decides send-vs-draft. On window_closed, be HONEST about why and give a draft to forward from the vendor's own WhatsApp. Reason: the prompt had been letting Haiku pre-decide to draft, contradicting its own "send_to_couple is default" instruction, producing a "you literally just messaged her, why can't you now?" failure.
14. **Keep the intent-extractor verbatim fallback visible, but guard the raw refusal.** User likes that the system honestly shows "AI tried, here's what she said" (the verbatim "Ananya just messaged: '3'"). The raw Haiku refusal ("Ananya I cannot provide a meaningful verb phrase from just '3'") is NOT that — it looks broken. The guard converts the broken refusal into the clean verbatim fallback the user wanted.

---

## 3. Errors encountered and fixes

### 3.1 "Dev's pieces start from 80,000" hallucination
- **Error:** the enquiry agent invented a vendor price.
- **Cause:** a prompt template said `(e.g. "pieces start from X")` and the real base fee was never injected; Haiku filled in a number.
- **Fix:** explicit HARD RULE — NEVER state/guess/quote/imply the vendor's price. Asking HER budget is allowed and required; stating HIS price is a serious error.

### 3.2 "Why ask my name if you know me?"
- **Error:** registered bride asked for her name.
- **Cause:** engine fetched shape but not name.
- **Fix:** fetch users.name → knownBrideName; greet by name; skip name question; save via resolvedName.

### 3.3 Stray "I haven't asked which function" AFTER lead capture
- **Error:** the agent second-guessed itself on iteration 2 after capture.
- **Cause:** Haiku re-considering what was "missing" after the lead was already saved.
- **Fix (engine.js `b069d46`):** after capture_couple_lead, the tool result explicitly tells the agent the enquiry is COMPLETE — send only a warm close, do NOT ask more / reconsider.

### 3.4 Occasion loop ("something else" → re-asked occasion)
- **Error:** bride answered "Something else" to the occasion question; agent re-asked "what's the occasion?".
- **Cause (audited):** TWO compounding issues. (a) Haiku improvised menu options ("wedding, engagement, or something else") that the prompt never specified; when the bride picked "something else" there was nothing to record, so it looped. (b) "which function/occasion" was wrongly placed as the FIRST jeweller question, making it the blocking gate.
- **Fix (`143b1ec`):** dropped the occasion question entirely for jeweller/designer (greeting carries context); added rule 9 (any reply counts as answered, never re-ask); removed the "something else" trap from examples.

### 3.5 "Never mind" bail-out (the agent abandoned the enquiry)
- **Error:** bride said "Never mind"; agent closed with "reach out whenever you're ready" — a dead-end.
- **Cause (audited):** the enquiry prompt had detailed happy-path rules but ZERO rules for non-happy-path inputs. Onboarding has a proven `looksLikeDodge()` detector; the enquiry agent had none. With no rule, Haiku freelanced and chose to give up. (Note: `conversation_done` is only a tool-schema field, not actually read — so the session wasn't technically blocked; the "block" was purely conversational.)
- **Comparison the user raised:** "never mind" works in onboarding because onboarding is a deterministic state machine with `looksLikeDodge` (regex + Haiku classifier) that skips-and-advances. The enquiry agent is an agentic loop with no such mechanism.
- **Fix (`143b1ec`):** prompt rules 10 (never bail on hesitation; keep thread open) + 11 (capture partial if she stops). Deterministic dodge-detector held in RESERVE — to be wired in if testing shows Haiku still freelances. Note: the dodge regex does NOT catch "never mind" or "something else" anyway, and "something else" is a vague *answer*, not a dodge — so prompt rules were judged the correct layer.

### 3.6 Stale Railway logs caused a false "occasion still appears" scare
- **Error:** a pasted log appeared to show the occasion question firing after the fix.
- **Cause (audited):** the log mixed replayed/stale lines from a pre-fix test (identical SIDs `SMf052...`, `SMe436...` to an earlier run) with the new boot. The container that asked "occasion" was the PRE-`143b1ec` deploy.
- **Resolution:** a clean post-`143b1ec` run (container boot 12:01:26) confirmed the fix works — jeweller opened with pieces (no occasion), photographer inherited her real functions, MUA asked which functions; all three captured cleanly.
- **Process lesson:** verify SIDs/timestamps and get a clean single-run log before diagnosing. (User rightly insisted on auditing actual code/logs over assumption — repeatedly.)

### 3.7 Intent-extractor leak (raw Haiku refusal sent to vendor)
- **Error:** vendor (8550) received "Ananya I cannot provide a meaningful verb phrase from just '3'".
- **Cause (audited, `intentExtractor.js`):** when the bride replied "3" (answering the vendor's relayed "how many people" question), `extractIntent` asked Haiku to summarise "3" as a verb phrase. Haiku refused with a meta-sentence. The code did NO validation — it prepended "Ananya " and sent the refusal verbatim to the vendor.
- **Fix (pending push):** a guard in extractIntent rejects refusal markers ("I cannot", "meaningful verb phrase", etc.) and non-verb-phrase output → returns null → caller falls back to the clean verbatim notification ("Ananya just messaged: '3'"), which is the honest "AI tried" behaviour the user wants.
- **Deeper note:** "3" was a perfectly good answer IN CONTEXT (it answered the vendor's question), but the extractor sees only the bare message with no conversation context. Not fixed this session — flagged.

### 3.8 Send-vs-draft contradiction (agent refused to send right after sending)
- **Error:** after successfully using send_to_couple to relay "how many people" to Ananya (window open), the vendor said "tell her I'll be in touch", and the agent replied "I can't send messages on your behalf — copy the draft" and drafted instead.
- **Cause (audited, systemPrompt.js):** the vendor prompt contained a direct contradiction — "send_to_couple is the DEFAULT for short conveyances" AND "You have NO ability to send any message... you can only draft." The DRAFT-AND-FORWARD section predated send_to_couple and was never reconciled. Haiku followed one instruction then the other.
- **Fix (pending push):** Policy A — always send_to_couple first; the deterministic window-check decides; draft-and-forward becomes strictly the window_closed fallback with an honest explanation; the false refusal is banned.

### 3.9 Media-only fallback fired mid-enquiry ("I'll process images and voice notes really soon")
- **Status:** diagnosed, NOT root-caused. A bodyless message with NumMedia>0 reached the webhook (`!trimmedBody && hasMedia` at src/index.js ~335), triggering the generic media fallback. The user believed no media was sent (possibly a reaction/sticker/empty message or a Twilio artifact). A diagnostic log was added to capture the actual Twilio payload (NumMedia/MediaContentType0/ProfileName/Body/ButtonText) next time it fires. The code behaved correctly for its input; the open question is WHY Twilio reported media. Flagged.

---

## 4. Verified-good behaviours this session (live WhatsApp, post-`143b1ec`)
- **Jeweller (delivery):** fused opening, no occasion, no shape; pieces → type → custom → ready-by → budget → captured (Rs 5L). Clean.
- **Photographer (event):** opened referencing her REAL functions ("for your mehendi, sangeet…"); inherited shape, did not re-ask; functions → photo/video/both → budget → captured. Clean.
- **MUA (event):** opened "for your wedding in Kerala…"; which functions → how many people → budget → captured. Clean.
- **Persist behaviour:** "Never mind" → captured a partial lead + warm close (no dead-end). USP protected.
- **Vendor → couple relay:** send_to_couple successfully relayed a vendor question to the bride (window open).

---

## 5. FLAGGED ITEMS (complete register — open at session end)

### 5.1 To verify
- **Migration 0066 status uncertain.** The .sql is committed but it is unclear whether it was actually run in Supabase. Verify: `select column_name from information_schema.columns where table_name='leads' and column_name in ('function_count','wedding_days','functions');` — if 0 rows, run 0066.
- **Confirm `143b1ec` send-first + intent-guard pushed and live**, then re-test the vendor "tell her X" path with an open window.

### 5.2 Pending work (scoped & decided, NOT built)
- **Partial-lead capture (Option B chosen):** drop the early "collecting details now" ping (still fires from src/index.js ~696); capture a partial lead on first contact (state `incomplete`); returning-bride detection must distinguish COMPLETE vs INCOMPLETE (resume incomplete, don't treat as "all on file").
- **Minimal scheduler + 10-min nudge:** after 10 min inactivity on an incomplete enquiry, notify the vendor "someone enquired, didn't finish." Needs a minimal cron (no Twilio template approval needed — unlike the parked morning-cron batch). User agreed to stand this up.
- **Twilio reply-context handling ("we build"):** WhatsApp native "reply to this message" is not currently read. Twilio sends quoted-message info (e.g. OriginalRepliedMessageSid) but the code ignores it. Plan: read the quoted field, map to stored outbound twilio_sid (messages.twilio_sid exists), inject "[replying to: X]" as agent context. High value for disambiguation; medium lift.
- **Full smoke test across all 6 categories.** Only jeweller, designer, photographer, MUA exercised live; decor and venue are code-verified only, untested in practice.
- **Intent-extractor context gap:** the extractor sees only the bare bride message ("3") with no conversation context, so it can't summarise context-dependent replies. The guard prevents the leak but the summary is still "just messaged: '3'". Consider passing the prior vendor question as context.

### 5.3 Known bugs (logged, living with for now)
- **delivery-date vs wedding-date:** for jeweller/designer, "need it ready by November" lands in `wedding_date` → vendor summary shows it as the wedding date and calendar enrichment treats it as such. It is really a DELIVERY deadline. Proper fix = a separate `ready_by` field for delivery categories (migration + handler). PARKED.
- **media-only fallback** (src/index.js ~335): fires the "process images and voice notes soon" message on a bodyless/media inbound. Diagnostic log added; not yet root-caused. See 3.9.

### 5.4 Parked / future (logged)
- WhatsApp interactive buttons + morning-cron templates + proactive out-of-window nudges → ONE Twilio template-approval batch.
- PWA port of send_to_couple — WhatsApp-only by design.
- Ping-carries-phone migration (store phone/thread on pending_lead_pings).
- Backfill 0063 / 0064 migration .sql files (applied as raw SQL; files absent from repo).
- **The Caravan — voice integration.** WhatsApp inbound voice notes (leaning) vs PWA tap-to-talk vs full calls. The "process images and voice notes soon" fallback is the current placeholder.
- **Solopreneur platform pivot.** Gated on proof. Architecture already supports it: category profiles are already "the PA for a [category]"; the only wedding-specific step is the event-category wedding-shape question. Strip/conditionalize that → generic solopreneur intake.

### 5.5 Cleanup owed
- **Restore test vendor category:** `update vendors set category='Makeup Artist' where id='2eb5d3fb-31eb-4b26-859a-cf10ae477d53';` (it was toggled to jewellery/designer/photography during testing).

---

## 6. Process learnings (carry forward)
- Sandbox git HEAD is OLD and does NOT reflect pushes; sandbox FILES represent live-deployed code. Do not git checkout/revert in sandbox; "revert" = rebuild fresh + overwrite via apply.
- str_replace mangles template-literal escapes inside backtick strings — use heredoc/cat for prompt rewrites; always `node -c` after edits.
- Migrations: copy-paste SQL to Supabase BEFORE applying code.
- Most valuable debugging move: run SQL to check actual DB state; audit actual code/logs before concluding. Diagnosing from assumption burned time this session and was rightly called out.
- Railway logs can replay stale lines mixed with fresh — verify SIDs/timestamps; get a clean single-run log before diagnosing.
- "Looks right in code" has burned the build (occasion loop, gushing verbosity, send contradiction) — live-test before trusting, especially untested categories.
- The couple enquiry agent and vendor agent are AGENTIC LOOPS (Haiku improvises in prompt gaps) — UNLIKE onboarding's deterministic state machine. Their failures (loop, bail, hallucinate, contradict) come from missing/contradictory behavioural rules; fix = explicit, non-contradictory prompt rules, with deterministic detectors as fallback.
