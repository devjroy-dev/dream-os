// src/lib/vendorInbound.js — TDW_05 TRANSPORT MIGRATION M2 (vendor lane, INBOUND).
// The vendor inbound turn-core, VERBATIM-extracted from src/index.js's Twilio handler
// (lines 181-970 at base 3afc4ba) so the Twilio path AND the dormant Meta /webhook/meta
// path (vendor service) funnel into ONE shared function — they cannot diverge, which is
// how W-1 (byte-identical reply content across transports) is guaranteed. Same pattern as
// src/lib/brideInbound.js (M1b, sealed).
//
// EXTRACTION DISCIPLINE (verbatim-then-diff): the body is byte-for-byte the original EXCEPT
// the mechanical transport-decoupling:
//   - `return res.status(200).send('<Response></Response>')`  -> `return;`
//   - `return res.status(200).send('<Response/>')`            -> `return;`  (2nd TwiML variant)
//   - the final bare `res.status(200).send('<Response/>')`    -> `return;`
//   - `req.body.MediaUrl0`                                    -> `mediaUrl`   (normalized input)
//   - outer-catch: `req.body.MessageSid`->`messageSid`, `(req.body.From||'')...`->`phone`,
//                  `payload: req.body`->`payload: rawPayload`
//   - the two inline require()s (imageThrottle, vendorCalendarImage) -> injected via deps
// Every external reference is supplied via `deps` (destructured below); the 24-dep list was
// proven COMPLETE by a bare-call scan (every call site resolves to a dep or the in-core
// `levenshtein`). scripts/b05_m2_vendor_inbound_bench.js diffs this core against the original
// and REDs on any drift.
//
// INPUTS (normalized by each transport handler; content-bearing fields IDENTICAL across
// Twilio and Meta for the same logical message — the bench asserts this):
//   { phone, body, profileName, messageSid, internalReplay, trimmedBody, numMedia, hasMedia,
//     mediaUrl, rawPayload }
//
// MEDIA NOTE (M1 text-only, consistent with M1a/M1b): Meta media inbound arrives as a media-ID
// needing a Meta media fetch (a named follow-up); metaInputsFrom passes mediaUrl=null, so the
// vendor calendar-OCR / media branches are a declared Meta gap. TEXT turns funnel fully through.
'use strict';

const { matchNudgeWord, setNudgeOptout, matchGlitchWord } = require('./nudgeOptout');   // TDW_05 P4 / F-05.22 · TDW_06 F-06.130
const { matchFullStopWord, recordFullStop, recordFullStart, ACK_BYPASS } = require('./fullStop'); // F-05.25 / F-05.27
const { getNudgeCopy } = require('./nudgeCopy');
const { turnKey, withTurnLock } = require('./turnLock');               // ARC M1 / F-05.41
const { scrubText, witnessWireScrub } = require('./vendor/scrub');    // BLOCK 06 M-3 / F-06.29 — the firewall reaches this lane · M-4 / F-06.36 — and now it leaves a witness

// ── BLOCK 06 M-0 · F-05.60 CURED (A1, founder-ruled 「 a1 」) ──────────────────
// THE LINE THIS REPLACES: `inboundMessage: firstWord.startsWith('TDW-') ? 'hi' : body`.
// A TDW-prefixed message was SUBSTITUTED with the literal 'hi' before the couple
// agent, both ping writers, the vendor notification and the intent extractor saw
// it — so a bride asking a substantive question was recorded, notified and
// summarised as having said hello. Seven consumers, one falsified input.
//
// A1 IS NOT "STOP SUBSTITUTING". The substitution was answering a real question:
// a first contact is often the bare routing token alone, and handing the agent
// `TDW-DROY550` asks it to answer a code. A1 separates the two cases the old
// line could not tell apart — strip the ROUTING TOKEN, keep the SENTENCE, and
// fall back to a greeting only when stripping leaves nothing at all.
//
// THE CASE TRAP, AND WHY THIS SLICES BY LENGTH (A-case, chair-binding).
// `firstWord` at the call site is UPPERCASED (`body.trim().split(/\s+/)[0]
// .toUpperCase()`), which is why the disease fires on `tdw-droy550` as readily
// as on `TDW-DROY550`. Any cure that removed the token by matching `firstWord`
// against the raw body would therefore MISS every lowercase and mixed-case
// send — curing the loud half and leaving the quiet half alive. This function
// never looks at the uppercased value: it re-splits the RAW text and removes
// the first token BY ITS OWN LENGTH, so case is irrelevant by construction.
//
// SITED FOR THE BRANCH THAT KNOWS. Called only where the first token has already
// matched a `routing_handle` — prefixed or bare — so "the first token is a
// routing token" is a fact at the call site, never a guess here.
//
// PRECEDENT, NOT INVENTION: the bride lane has run this discipline since M1b —
// `brideInbound.js:567`, `trimmedBody.length > 0 ? trimmedBody : bodyForLog`,
// a fallback that fires only on emptiness. This puts both lanes on one law.
function stripRoutingToken(rawBody) {
  const trimmed = String(rawBody == null ? '' : rawBody).trim();
  if (!trimmed) return '';
  const firstToken = trimmed.split(/\s+/)[0];
  return trimmed.slice(firstToken.length).trim();
}

// ── BLOCK 06 M-3 · F-06.17 + F-06.29 · THE SPLIT SCRUB (CE-ruled 2026-07-25, R3) ──
// 「 internal only 」 is the founder's standing word: Donna is INTERNAL-ONLY on the
// vendor surface, EVERY mode. F-06.29 is its mechanical half — `scrub.js` declares
// "one home, every caller" and this lane was NOT a caller, so three name bleeds rode
// one evening's wire while the firewall sat one require away.
//
// THE FOUR NOTIFICATION SITES ARE THE HARD ONES, and this function exists for them.
// `result.vendorNotification` reaches a VENDOR's phone (:524 · :632 · :770 · :900) but
// is authored on the COUPLE lane, and it comes in two shapes (engine.js):
//   :403  firstContactNotif    — the model's own `vendor_notification` message, whole
//   :418  returningBrideNotif  — `${summary}\n\nHer message: "${inboundMessage}"`
//   :407  its fallback         — `${name} just messaged: "${inboundMessage}"`
// The second and third carry THE BRIDE'S OWN SENTENCE, quoted. Scrubbing those whole
// would rewrite HER words — and that is not a hypothetical: it is the vocative family's
// exact disease (scrub.js:136-161, where a blind replacement turned "…here, Donna."
// into a sentence aimed at the wrong person and nobody noticed, because it still read
// fine). A firewall that edits the witness to clean the pipe has stopped being a
// firewall. Her words are hers, on the same law that refuses to rewrite the audit row:
// if SHE writes "Donna", the quote carries it honestly.
//
// SO: THE FRAME SCRUBS, THE QUOTE PASSES BYTE-EXACT.
//
// WHY THE VERBATIM IS A PARAMETER AND NOT A PATTERN. The caller knows exactly what was
// handed to the model as `inboundMessage` — and it is NOT the same value at every site
// (:770's turn receives `stripRoutingToken(body) || 'hi'`, the others `body` or
// `originalMessage`). Deriving the quote here by regex would be guessing at a boundary
// the door already holds as a fact; each call site passes the value it actually sent.
//
// WHY THE SPLIT ANCHORS ON `"<quote>"` AND NOT ON THE BARE QUOTE. Splitting on the bare
// text is unsafe for SHORT messages: a verbatim of `on` occurs inside `Donna`, and
// splitting there would hand scrubText the fragments `D` and `na`, neither of which
// matches `\bDonna\b` — the firewall would open precisely because the bride was terse.
// The quoted token is the frame's own rendering (both shapes above), and only the LAST
// occurrence is preserved, so exactly one region passes and everything around it is
// judged. No quoted token found (firstContactNotif's shape, or any drift in the frame)
// ⇒ the whole string scrubs: the fail-safe direction is the firewall CLOSED.
//
// EXPORTED so the bench drives the shipped function, never a copy (Q-SP-5) — the
// stripRoutingToken precedent above, same file, same reason.
// TDW_06 M-4 / F-06.36: `witness` is OPTIONAL and additive — { supabase, vendorId,
// surface, ctx }. The SPLITTER'S LOGIC BELOW IS BYTE-UNCHANGED; the witness only reads
// the whole-in/whole-out pair and files a row when the firewall actually caught
// something. Omit it and this function behaves exactly as M-3 shipped it.
// ── TDW_08 P5 RIDER (F-08.85, CE R-R3) — THE ONE DOOR ────────────────────────
// The three enquiry-alert relays below (:591 disambiguated, :700 sticky, :989
// returning) call `sendVendorEnquiryAlert` and NOTHING ELSE calls it. Direct
// `sendWhatsApp` for a vendor notification is the defect this rider cured: it
// threw on a shut 24h window, reached the function-level dead-letter, and cost
// the BRIDE the rest of her turn. The bench asserts the sole-caller property.
const { sendVendorEnquiryAlert } = require('./vendor/enquiryAlert');

// FOUNDER-WITNESSED, 2026-08-05: this is the exact link the founder submitted as
// {{3}}'s review sample on the approved template, read off his own screenshot.
// Named as a const beside the door's callers for the same reason `CLAIM_BASE`
// (demoLeadAlert.js:55) is — a URL pasted at three call sites drifts at two.
const VENDOR_LEADS_LINK = 'https://thedreamwedding.in/vendor/leads';

function scrubModelFrame(text, verbatim, witness = null) {
  if (text == null) return text;
  const s = String(text);
  const out = (() => {
    const q = verbatim == null ? '' : String(verbatim);
    if (!q) return scrubText(s);
    const token = '"' + q + '"';
    const at = s.lastIndexOf(token);
    if (at === -1) return scrubText(s);
    return scrubText(s.slice(0, at)) + token + scrubText(s.slice(at + token.length));
  })();
  if (witness) {
    witnessWireScrub(witness.supabase, witness.vendorId, witness.surface || 'whatsapp', s, out, witness.ctx || 'scrubModelFrame');
  }
  return out;
}

// ── C5 · THE TURN LOCK, THE ONE THING THIS BRIDE ARC TOUCHES ON THIS FILE ───
// The fence was widened deliberately and narrowly at CE-67: this file may be
// touched for LOCK WIRING ALONE — the import above and the wrapper below, zero
// other vendor bytes. F-05.41 was witnessed on the bride lane, but the anatomy is
// SHARED: index.js:166 and brideIndex.js:158 are the same handler shape, each
// answering 200 before its turn finishes, so two POSTs one second apart race here
// exactly as they raced there. Curing one lane and leaving its twin racy would be
// a knowing half-cure. Nothing below this wrapper changed.
// `_noRetry` — FORK D'S STRUCTURAL BOUND (M-2, CE-ratified). Not a depth counter: the
// retry calls `runTurn` directly and never re-enters this function, so the retried turn
// has NO SECOND EDGE by construction. The parameter exists so a future caller that DOES
// re-enter cannot accidentally create one, and so the bench can assert the property.
// F-06.182's predicate, imported from its one home so the door and the bench
// read the SAME list of kinds. A relay outcome that put no bytes on her screen
// (a refusal, a failed send) must NOT silence the model — she asked a question
// and still deserves an answer.
const { relayFiredOnArrival } = require('./vendor/coupleArrival');

async function processVendorInbound(inputs, deps, _noRetry) {
  return withTurnLock(turnKey('vendor', inputs && inputs.phone), () => _processVendorInbound(inputs, deps, _noRetry));
}

async function _processVendorInbound(inputs, deps, _noRetry) {
  const {
    phone, body, profileName, messageSid, internalReplay,
    trimmedBody, numMedia, hasMedia, mediaUrl, rawPayload,
  } = inputs;
  const {
    runCoupleAgenticTurn, sendWhatsApp, generateInvoiceForBinder, enquiryToBinder,
    ensureCoupleRow, captureField, buildDisambiguationQuestion, interpretDisambiguationReply,
    vendorDisplayName, resolveAgentForVendor, runTurn, fetchCalendarSnapshot, fetchScratchpad,
    fetchLeadPings, // TDW_05 F-05.50(b) — the enquiry-ping drain, a door-built turn input
    applyCalendarSignals, buildLlmForTurn, matchModeWord, applyModeFlip, MODE_FLIP_LINES,
    matchFreshWord, FRESH_THREAD_LINE, abandonActiveThread, // TDW_04.5 F-04.98 C3
    checkImageThrottle, markRejectionSent, extractCalendarFromImage, webhookCore, supabase, anthropic,
  } = deps;
  try {
    // ── TDW_05 P4 / F-05.22 — THE NUDGE-CLASS BRANCH (vendor lane) ────
    // FIRST, and pre-engine: no model call, no user row created, no cost. The twin of the
    // bride branch in brideInbound.js — identical in shape so the two lanes cannot drift;
    // only the lane string differs. tdw_morning_nudge_vendor has carried "Reply STOP
    // MORNINGS to pause these updates" since approval with nothing reading it.
    //
    // NARROW BY CONSTRUCTION. matchNudgeWord returns null for bare "STOP"; that word is the
    // full stop's and its machinery is untouched here. It also runs BEFORE the users upsert,
    // so a pause from a number with no vendor row still lands rather than creating one.
    const nudgeWord = matchNudgeWord(trimmedBody);
    if (nudgeWord) {
      const lane = 'vendor';
      try {
        if (nudgeWord === 'stop') {
          await setNudgeOptout({ supabase, phone, lane, state: 'opted_out' });
          await sendWhatsApp(phone, getNudgeCopy('opt_out_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[webhook] nudge-class OPT-OUT recorded for ${phone} (lane=${lane})`);
        } else {
          await setNudgeOptout({ supabase, phone, lane, state: 'resumed', source: 'inbound_stop_mornings' });
          await sendWhatsApp(phone, getNudgeCopy('resume_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[webhook] nudge-class RESUME recorded for ${phone} (lane=${lane})`);
        }
      } catch (nudgeErr) {
        // Never let this branch swallow the turn silently. The write is attempted first,
        // so a failure here is most often the confirmation send — logged, not hidden.
        console.error('[webhook] nudge-class branch error:', nudgeErr && nudgeErr.message);
      }
      return;
    }

    // ── TDW_05 P4 closing micro / F-05.25 — THE FULL STOP (vendor lane) ────
    // SECOND, and the ordering is LOAD-BEARING: isStopWord matches the FIRST
    // TOKEN ONLY, so isStopWord('STOP MORNINGS') is TRUE. Running this before
    // the nudge branch would swallow every pause and convert it into a terminal
    // opt-out — F-05.22's cure destroyed by its own sibling. Nudge first, always.
    //
    // Writes through prospects.js's EXISTING writer pair (findOrCreate + update),
    // which already upserts; this path introduces no second writer. The
    // confirmation then goes out through the gate it just closed, using the same
    // single documented bypass the marketing lane uses for the same reason
    // (prospects.js:132-134) — an acknowledgement the recipient never receives
    // reads as an opt-out that did not register.
    const fullStopWord = matchFullStopWord(trimmedBody);
    if (fullStopWord) {
      try {
        if (fullStopWord === 'stop') {
          await recordFullStop({ supabase, phone });
          await sendWhatsApp(phone, getNudgeCopy('full_stop_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[webhook] FULL STOP recorded for ${phone} (lane=vendor)`);
        } else {
          const r = await recordFullStart({ supabase, phone });
          if (r.changed) {
            await sendWhatsApp(phone, getNudgeCopy('full_start_confirmation'), [], undefined, ACK_BYPASS);
            console.log(`[webhook] FULL START recorded for ${phone} (lane=vendor)`);
            return;
          }
          // Never opted out — fall through to the normal turn, exactly as the
          // marketing lane does (prospects.js:151-152). START is not a keyword
          // for someone who never stopped.
        }
      } catch (stopErr) {
        console.error('[webhook] full-stop branch error:', stopErr && stopErr.message);
      }
      if (fullStopWord === 'stop') return;
    }

    let user;
    const { data: existingUser } = await supabase
      .from('users').select('*').eq('phone', phone).maybeSingle();

    if (existingUser) {
      user = existingUser;
    } else {
      const { data: newUser, error } = await supabase
        .from('users').insert({ phone, name: profileName }).select().single();
      if (error) throw error;
      user = newUser;
    }

    const { data: vendor } = await supabase
      .from('vendors').select('*').eq('user_id', user.id).maybeSingle();

    // ── Image throttle (Patch 9) ────────────────────────────────────
    // Before any image-pipeline work, throttle to 2 images per 30s per phone.
    // Prevents burst-forward spam (5 calendar screenshots → 5 Vision calls
    // → 5 separate replies). Fires for any onboarded vendor with media,
    // regardless of whether a caption is attached.
    if (vendor && vendor.onboarding_state === 'complete' && hasMedia && mediaUrl) {
      const throttle = await checkImageThrottle({ supabase, phone, engine: 'vendor' });
      if (!throttle.allowed) {
        console.log(`[webhook] vendor image throttle: ${phone} count=${throttle.count} notify=${throttle.shouldNotify}`);
        if (throttle.shouldNotify) {
          await sendWhatsApp(
            phone,
            "I'll be able to process two at a time right now. Send the rest after I respond to these two. Good news though, I'll be able to process multiple images together, very soon!"
          );
          await markRejectionSent({ supabase, rowId: throttle.rowId });
        }
        return;
      }
    }

    // ── Vendor calendar bulk-import via image OCR (Patch 8) ────────
    // If an onboarded vendor sends an image (with or without caption),
    // run it through Haiku Vision to extract events, stage them as
    // pending_event_proposals, and reply with the list for confirmation.
    // The vendor's next text message goes through the normal agent loop
    // and calls commit_event_proposals to bulk-insert.
    if (vendor && vendor.onboarding_state === 'complete' && hasMedia && mediaUrl) {
      try {

        // ══ F-05.55 CURED · THE GUARD ROW, WRITTEN BEFORE THE SPEND ═══════════════
        // THE DISEASE (CE-67 §B, finder the LE, chair-verified): this branch wrote its
        // audit pair as BARE objects and RETURNED before the file's only vendor-lane
        // inboundRow call. RF-1's durable half — messages.message_sid plus the partial
        // unique index messages_message_sid_uidx — never saw a media turn, so the only
        // dedupe was webhookCore's per-process LRU, which a restart empties. A
        // redelivered calendar image was a DOUBLE OCR TURN: double Vision spend,
        // double proposal staging, double audit rows.
        //
        // WHY THE ROW MOVED AND DID NOT MERELY GAIN A SID (CE ruling R2). The pair was
        // written AFTER extractCalendarFromImage and AFTER the preview send. Handing
        // that row a wamid would have cured the duplicate AUDIT rows and nothing the
        // finding is about — the Vision call and the vendor's second message have
        // already happened by then. That shape buys a bench green, a byte-clean diff,
        // a sealed micro, and a redelivered image that still OCRs twice. So the
        // INBOUND half moves to branch entry and becomes a GUARD: the first thing this
        // branch does is claim the wamid. The OUTBOUND half stays where it lives,
        // byte-untouched and taking NO message_sid (R3) — 0084's contract is
        // inbound-only, and an outbound wamid in that keyspace invites a
        // cross-direction collision on a column whose whole meaning is inbound
        // identity. The two-insert split is the disclosed structural consequence.
        //
        // WHY THE {error} IS READ HERE, AND ONLY HERE (F-05.61, CE ruling R1).
        // supabase-js does not throw on a PostgREST error; it RETURNS {data, error}.
        // Every inboundRow call site in this estate awaits bare and discards it, so the
        // outer catch's isDuplicateSidError has never once been reached FROM an insert:
        // the durable half has been a column, an index, and a catch that nothing could
        // reach. Proven by command at the lockfile-pinned @supabase/supabase-js 2.105.4
        // against a real 409/23505. The ten-site sweep is CHARTERED SEPARATELY (the
        // RF-1 coherence sitting, with F-05.62's bride reorder); this micro reads the
        // error at ITS OWN NEW SITE ONLY, per R1's scope ruling. Do not widen this by
        // analogy — that sweep is a kickoff, not a convenience.
        //
        // THE MECHANISM IS WITNESSED, NOT ASSUMED: the founder's pg_indexes paste
        // (2026-07-24, banked in the CE addendum) shows messages_message_sid_uidx live
        // on public.messages as CREATE UNIQUE INDEX ... USING btree (message_sid) WHERE
        // (message_sid IS NOT NULL) — byte-matching 0084:24-25. Committed AND applied.
        //
        // A REDELIVERY AFTER A FAILED VISION CALL IS ALSO DROPPED, and that is correct:
        // a redelivery is Meta re-sending one message, never a retry channel for our
        // failures. The vendor was already answered on the first pass.
        const caption = trimmedBody.length > 0 ? trimmedBody : null;

        // ── F-05.55 GUARD ROW · BEGIN ──
        const { data: vendorSelfConvo } = await supabase
          .from('conversations')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('kind', 'vendor_self')
          .maybeSingle();

        if (vendorSelfConvo) {
          const { error: guardErr } = await supabase.from('messages').insert(webhookCore.inboundRow({
            conversation_id: vendorSelfConvo.id,
            direction: 'inbound',
            channel:   'whatsapp',
            body:      caption || '[calendar image]',
            sent_by:   'vendor',
            media_url: mediaUrl,
          }, internalReplay ? null : messageSid));

          if (webhookCore.isDuplicateSidError(guardErr)) {
            console.log(`[webhook:vendor-image] duplicate wamid ${messageSid} hit messages_message_sid_uidx — already processed, dropping BEFORE the Vision call`);
            return;
          }
          if (guardErr) {
            // Any other error stays best-effort, exactly as this write has always been:
            // an audit row must never kill the vendor's turn. Logged, never hidden.
            console.error('[webhook:vendor-image] guard row insert failed (audit best-effort, turn continues):', guardErr.message || guardErr);
          }
        } else {
          // DECLARED GAP, named rather than widened: a vendor whose FIRST-EVER message
          // is an image has no vendor_self conversation yet — it is created on the text
          // path in the vendor-path block below. No conversation means no row to claim
          // the wamid with, so that one turn is UNDEDUPED. Creating the conversation
          // here would make this branch a second writer on that plane, which is unruled
          // and outside this micro's charter. Pre-existing shape preserved exactly.
          console.warn(`[webhook:vendor-image] no vendor_self conversation for vendor=${vendor.id} — guard row skipped, this turn is UNDEDUPED (declared)`);
        }
        // ── F-05.55 GUARD ROW · END ──

        // IST today for date inference inside the Vision prompt
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istToday = new Date(Date.now() + istOffsetMs).toISOString().split('T')[0];

        const { proposals } = await extractCalendarFromImage({
          image_url: mediaUrl,
          caption,
          anthropic,
          istToday,
        });

        if (!proposals || proposals.length === 0) {
          await sendWhatsApp(phone, "I couldn't make out any events from this image. Try cropping closer or sending a clearer screenshot of the calendar view.");
          return;
        }

        // Stage proposals — agent reads these from dynamic context next turn
        const { data: proposalRow, error: propErr } = await supabase
          .from('pending_event_proposals')
          .insert({
            vendor_id: vendor.id,
            proposals: proposals,
            source_image_url: mediaUrl,
            caption,
          })
          .select('id')
          .single();

        if (propErr) {
          console.error('[webhook:vendor-image] proposal insert failed:', propErr);
          await sendWhatsApp(phone, "I read the calendar but had trouble saving the draft. Please try sending the image again.");
          return;
        }

        // Format the human-readable preview
        const lines = proposals.map((p, i) => {
          const timeBit = p.event_time ? ` ${p.event_time}` : '';
          const noteBit = p.notes ? ` — ${p.notes}` : '';
          return `${i + 1}. ${p.event_date}${timeBit} · ${p.kind} · ${p.title}${noteBit}`;
        });
        const previewMsg =
          `I found ${proposals.length} event${proposals.length === 1 ? '' : 's'} in this image:\n\n` +
          lines.join('\n') +
          `\n\nReply "save all" to add them all, or tell me which to skip (e.g. "skip 2 and 4") or edit.`;

        const sent = await sendWhatsApp(phone, previewMsg);

        // Log the OUTBOUND half to vendor_self for audit + agent history. The INBOUND
        // half is the F-05.55 guard row above — written before the spend, not after it,
        // which is the whole cure. This half is byte-untouched from the pair it left
        // (same five fields, same values, same order) and takes NO message_sid: R3.
        // The vendor_self lookup now lives at branch entry with the guard.
        if (vendorSelfConvo) {
          await supabase.from('messages').insert({
            conversation_id: vendorSelfConvo.id,
            direction: 'outbound',
            channel:   'whatsapp',
            body:      previewMsg,
            sent_by:   'agent',
            twilio_sid: sent && sent.sid ? sent.sid : null,
          });
        }

        console.log(`[webhook:vendor-image] proposal ${proposalRow.id} staged with ${proposals.length} events`);
        return;
      } catch (err) {
        console.error('[webhook:vendor-image] error:', err.message);
        // Fall through to existing media handling on Vision failure
      }
    }

    // ── Late media-only refusal ────────────────────────────────────
    // Reached when:
    //   (a) media arrived from a NON-vendor (bride, unknown sender)
    //   (b) media arrived from a vendor whose onboarding is incomplete
    //   (c) vendor calendar branch threw and fell through
    // In all cases, no body text means no agent turn we can run.
    if (!trimmedBody && hasMedia) {
      console.log(`[webhook] media-only fallback from ${phone} (vendor=${!!vendor}, onboarded=${vendor?.onboarding_state === 'complete'})`);
      await sendWhatsApp(phone, "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help.");
      return;
    }

    if (!vendor) {
      // ── Couple routing — disambiguation-aware (Session 8.5 Step 10) ──
      //
      // Order:
      //   Step A: Pending routing clarification (user was previously asked which vendor)
      //   Step B: TDW code in first word -> Mode 2 (wins over thread history)
      //   Step C: Count existing couple_threads:
      //             0 -> Mode 3 fallback
      //             1 -> Mode 1 (route to that thread)
      //             2+ -> Set pending_routing_context, ask disambiguation question

      const DISAMBIGUATION_TTL_MS = 10 * 60 * 1000;  // 10 minutes
      const STICKY_TTL_MS         = 30 * 60 * 1000;  // 30 minutes — vendor stickiness after resolution

      // ── Ensure bride has persistent couple_id ─────────────────────
      // Idempotent — creates users + couples + couple_state rows silently
      // on first contact with any vendor on +91. From this point forward
      // the bride has a stable identity reachable via
      //   conversations.counterparty_user_id → users.id → couples.user_id
      // We do NOT stamp couple_id on the conversations row — XOR holds
      // because vendor_id is set on couple_thread rows.
      const { user_id: _ensuredUserId, couple_id: brideCoupleId } =
        await ensureCoupleRow(supabase, phone, profileName);

      if (_ensuredUserId !== user.id) {
        console.warn(`[coupleIdentity] user_id mismatch: ensured=${_ensuredUserId} loaded=${user.id}`);
      }

      function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
              ? dp[i - 1][j - 1]
              : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
        return dp[m][n];
      }

      // ── Step A: Pending disambiguation reply ──────────────────────
      const pendingCtx = user.pending_routing_context;
      const pendingFresh = pendingCtx?.asked_at
        && (Date.now() - new Date(pendingCtx.asked_at).getTime()) < DISAMBIGUATION_TTL_MS;

      // Detect TDW code in this message — needed for Step A and Step B
      const firstWord = body.trim().split(/\s+/)[0].toUpperCase();
      const handle    = firstWord.startsWith('TDW-') ? firstWord.slice(4) : firstWord;

      if (pendingFresh && pendingCtx.candidate_vendor_ids?.length > 0) {
        // A TDW code in the reply short-circuits disambiguation
        if (firstWord && handle && handle !== firstWord && /^[A-Z0-9]+$/.test(handle)) {
          // Starts with TDW- prefix — handled in Step B below, fall through after clearing pending
          await supabase.from('users').update({ pending_routing_context: null }).eq('id', user.id);
        } else {
          // Load candidate vendors (we stored ids; need names + categories for interpretation)
          const { data: candidateVendors } = await supabase
            .from('vendors')
            .select('id, business_name, category, users(name)')
            .in('id', pendingCtx.candidate_vendor_ids);

          const interp = await interpretDisambiguationReply({
            replyText: body,
            candidateVendors: candidateVendors || [],
            anthropic,
          });

          if (interp.matched_vendor_id && interp.confidence === 'high') {
            // Set sticky state — bride sticks to this vendor for 30 min
            await supabase.from('users').update({
              pending_routing_context: {
                sticky_vendor_id: interp.matched_vendor_id,
                sticky_until:    new Date(Date.now() + STICKY_TTL_MS).toISOString(),
              },
            }).eq('id', user.id);

            // Route the ORIGINAL message (not this clarification reply) to matched vendor
            const matchedVendor = (candidateVendors || []).find(v => v.id === interp.matched_vendor_id);
            const originalMessage = pendingCtx.original_message || body;

            // Find or create the couple_thread with this vendor
            let { data: thread } = await supabase
              .from('conversations')
              .select('*, vendors(*)')
              .eq('vendor_id', interp.matched_vendor_id)
              .eq('counterparty_phone', phone)
              .eq('kind', 'couple_thread')
              .maybeSingle();

            if (!thread) {
              const { data: newThread } = await supabase.from('conversations').insert({
                vendor_id: interp.matched_vendor_id,
                counterparty_phone: phone,
                counterparty_user_id: user.id,
                kind: 'couple_thread',
                state: 'new',
                mode: 'auto',
              }).select('*, vendors(*)').single();
              thread = newThread;
            }

        // ── F-05.51 CURED (ARC M6) · RF-1's DURABLE HALF REACHES THIS LANE ──
        // All FOUR couple-thread inbound inserts were bare objects: no message_sid,
        // so the unique index RF-1 relies on never saw the wamid and only the
        // per-process LRU stood between a Meta redelivery and a doubled turn — a
        // restart is all it took. The vendor-self path had done this right since P1b
        // (its one inboundRow call); the couple doors never inherited it.
        // THE CHARTER NAMED ONE SITE. THE WORLD WAS A SET OF FOUR — the executor's
        // own banked class at CE-63, caught here by the census that the trio
        // discipline demands. Curing the filed site alone would have shipped a green
        // over three live holes.

            // Log the original message as the actual inbound (we deferred it earlier)
            await supabase.from('messages').insert(webhookCore.inboundRow({
              conversation_id: thread.id,
              direction: 'inbound',
              channel: 'whatsapp',
              body: originalMessage,
              sent_by: 'couple',
            }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', thread.id);
          return;
        }

            const { data: vendorUser } = await supabase
              .from('users').select('*').eq('id', thread.vendors.user_id).maybeSingle();

            const result = await runCoupleAgenticTurn({
              vendor: thread.vendors,
              vendorUser,
              conversation: thread,
              couplePhone: phone,
              coupleId: brideCoupleId,
              inboundMessage: originalMessage,
              supabase,
              anthropic,
            });

            const twilioMsg = await sendWhatsApp(phone, result.reply);

            await supabase.from('messages').insert({
              conversation_id: thread.id,
              direction: 'outbound',
              channel: 'whatsapp',
              body: result.reply,
              sent_by: 'agent',
              twilio_sid: twilioMsg.sid,
              tool_calls: result.toolCalls,
            });

            if (result.vendorNotification && vendorUser?.phone) {
              // M-3 R3: the model's frame scrubs, her quoted sentence passes byte-exact.
              // This turn was handed `originalMessage` (:557) — the quote is that value.
              await sendVendorEnquiryAlert({
                toPhone: vendorUser.phone,
                text: scrubModelFrame(result.vendorNotification, originalMessage, { supabase, vendorId: interp.matched_vendor_id, surface: 'whatsapp', ctx: 'vendorInbound:notification(disambiguated)' }),
                vendorName: vendorUser.name, brideName: result.leadName, link: VENDOR_LEADS_LINK,
                // TDW_06/07 M1 — {{3}}'s raw material, passed rather than derived.
                // The SAME value handed to `scrubModelFrame` one line up, for the
                // same reason its header gives: the call site knows the boundary
                // as a fact and a regex at the door would be guessing at it.
                brideMessage: originalMessage,
                supabase, vendorId: interp.matched_vendor_id, ctx: 'vendorInbound:notification(disambiguated)',
              });
            }

            await supabase.from('conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', thread.id);

            console.log(`[routing:disambiguated] ${phone} -> vendor ${interp.matched_vendor_id} (${vendorDisplayName(matchedVendor)})`);
            return;
          }

          // Unclear or low confidence — ask one more time with the same vendors
          await sendWhatsApp(phone,
            `Sorry, didn't catch that — ${buildDisambiguationQuestion(candidateVendors || []).replace(/^Hi! /, '')}`
          );
          console.log(`[routing:disambiguation_unclear] ${phone} reply="${body.slice(0, 40)}"`);
          return;
        }
      }

      // ── Step A.5: Sticky vendor (recently resolved disambiguation) ──
      // If pending_routing_context has sticky_vendor_id and not expired,
      // route directly to that vendor. A TDW code in the message overrides
      // and is handled by Step B below.
      const stickyVendorId = pendingCtx?.sticky_vendor_id;
      const stickyUntil    = pendingCtx?.sticky_until;
      const stickyFresh    = stickyVendorId && stickyUntil
        && new Date(stickyUntil).getTime() > Date.now();

      // Does this message start with a TDW code? If yes, skip sticky.
      const startsWithTdw = firstWord.startsWith('TDW-');

      // Bug #4 fix: if message looks like a bare handle attempt, fuzzy-match against
      // ALL vendor handles globally before sticky can claim it. Prevents "Swati978"
      // routing to the sticky vendor instead of prompting "Did you mean TDW-SWATI978?"
      const looksLikeBareHandle = firstWord.length >= 3
        && firstWord.length <= 12
        && /^[A-Z0-9]+$/.test(firstWord)
        && !firstWord.startsWith('TDW-')
        && trimmedBody.toUpperCase() === firstWord;

      if (stickyFresh && looksLikeBareHandle) {
        const { data: allVendors } = await supabase
          .from('vendors')
          .select('routing_handle')
          .not('routing_handle', 'is', null);

        const allHandles = (allVendors || []).map(v => v.routing_handle).filter(Boolean);
        const allCloseMatches = allHandles
          .map(h => ({ h, dist: levenshtein(firstWord, h) }))
          .filter(x => x.dist <= 2);

        if (allCloseMatches.length === 1) {
          const { h: closeMatch } = allCloseMatches[0];
          console.log(`[routing:bare_handle] "${firstWord}" matches "${closeMatch}" globally — prompting before sticky`);
          await sendWhatsApp(phone, `Did you mean TDW-${closeMatch}? Send that and I'll connect you right away.`);
          return;
        }
        // 0 or 2+ matches → fall through to sticky as before
      }

      if (stickyFresh && !startsWithTdw) {
        const { data: stickyThread } = await supabase
          .from('conversations')
          .select('*, vendors(*)')
          .eq('vendor_id', stickyVendorId)
          .eq('counterparty_phone', phone)
          .eq('kind', 'couple_thread')
          .maybeSingle();

        if (stickyThread) {
          console.log(`[routing:sticky] ${phone} -> vendor ${stickyVendorId} (until ${stickyUntil})`);

          await supabase.from('messages').insert(webhookCore.inboundRow({
            conversation_id: stickyThread.id,
            direction: 'inbound',
            channel: 'whatsapp',
            body,
            sent_by: 'couple',
          }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', stickyThread.id);
          return;
        }

          const { data: vendorUser } = await supabase
            .from('users').select('*').eq('id', stickyThread.vendors.user_id).maybeSingle();

          const result = await runCoupleAgenticTurn({
            vendor: stickyThread.vendors,
            vendorUser,
            conversation: stickyThread,
            couplePhone: phone,
            coupleId: brideCoupleId,
            inboundMessage: body,
            supabase,
            anthropic,
          });

          const twilioMsg = await sendWhatsApp(phone, result.reply);

          await supabase.from('messages').insert({
            conversation_id: stickyThread.id,
            direction: 'outbound',
            channel: 'whatsapp',
            body: result.reply,
            sent_by: 'agent',
            twilio_sid: twilioMsg.sid,
            tool_calls: result.toolCalls,
          });

          if (result.vendorNotification && vendorUser?.phone) {
            // M-3 R3: frame scrubs, quote passes. This turn was handed `body` (:665).
            await sendVendorEnquiryAlert({
              toPhone: vendorUser.phone,
              text: scrubModelFrame(result.vendorNotification, body, { supabase, vendorId: stickyThread.vendors?.id, surface: 'whatsapp', ctx: 'vendorInbound:notification(sticky)' }),
              vendorName: vendorUser.name, brideName: result.leadName, link: VENDOR_LEADS_LINK,
              // TDW_06/07 M1 — {{3}}'s raw material. This turn was handed `body`.
              brideMessage: body,
              supabase, vendorId: stickyThread.vendors?.id, ctx: 'vendorInbound:notification(sticky)',
            });
          }

          // Refresh sticky window — each interaction extends stickiness
          await supabase.from('users').update({
            pending_routing_context: {
              sticky_vendor_id: stickyVendorId,
              sticky_until:    new Date(Date.now() + STICKY_TTL_MS).toISOString(),
            },
          }).eq('id', user.id);

          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', stickyThread.id);

          return;
        }
        // If sticky thread doesn't exist (deleted?), fall through to normal routing
        console.warn(`[routing:sticky_orphan] sticky vendor ${stickyVendorId} has no thread for ${phone}, falling through`);
      }

      // ── Step B: TDW code wins over history ────────────────────────
      const { data: matchedByTdw } = await supabase
        .from('vendors')
        .select('*, users(*)')
        .eq('routing_handle', handle)
        .maybeSingle();

      if (matchedByTdw) {
        console.log(`[routing:tdw] code ${handle} -> vendor ${matchedByTdw.id}`);

        const vendorUser = matchedByTdw.users;

        // Find or create couple_thread for this vendor
        let { data: coupleThread } = await supabase
          .from('conversations')
          .select('*')
          .eq('vendor_id', matchedByTdw.id)
          .eq('counterparty_phone', phone)
          .eq('kind', 'couple_thread')
          .maybeSingle();

        if (!coupleThread) {
          const { data: newThread } = await supabase
            .from('conversations')
            .insert({
              vendor_id: matchedByTdw.id,
              counterparty_phone: phone,
              counterparty_user_id: user.id,
              kind: 'couple_thread',
              state: 'new',
              mode: 'auto',
            })
            .select()
            .single();
          coupleThread = newThread;
        }

        await supabase.from('messages').insert(webhookCore.inboundRow({
          conversation_id: coupleThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', coupleThread.id);
          return;
        }

        // 5-B-2 — land the enquiry in the engine cabinet (was a public.leads insert).
        // enquiryToBinder dedups by phone and opens the binder as a lead; the
        // post-agent call below enriches its note with the vendor summary. The
        // marketplace is just another caller.
        //
        // ── B0 (BLOCK 06 M-0, CE-ruled NAME-ONLY) · THE ONE-BRANCH ASYMMETRY ──
        // THIS is the only one of four couple paths that leaves an engine-plane
        // trace. The disambiguation-resume (:500), sticky (:608) and existing-
        // thread (:876) branches all run a couple turn and write NO binder, so a
        // vendor's cabinet holds his TDW-link enquiries and not his others.
        // NAMED, NOT CURED: adding binder writes to three uncharted branches is a
        // live change to the vendor's cabinet, and this sitting's purpose is
        // making EXISTING data true. Recorded here so it is not rediscovered.
        //
        // ── F-05.59 / F-05.54 CURED (C1) · THE CLAIM AND THE VERDICT ─────────
        // `noteIfNew`, not `note`: this sentence asserts PRIMACY, and primacy is
        // true only of a binder this enquiry opened. Passed as an always-note it
        // was appended on every dedupe hit, so a repeat enquiry stored a
        // first-message claim about a message that was not the first (specimen:
        // binder 1e774015, the sentence stored twice). The bytes are unchanged;
        // only the key changed, and with it the path it is written on.
        const preTurnBinder = await enquiryToBinder(supabase, matchedByTdw.id, {
          phone,
          noteIfNew: `Enquiry via your TDW link. First message: ${body}`,
        });
        // The verdict is READ. It used to be spoken to nobody — a bare await on a
        // function whose whole contract is { ok, binder, deduped } (F-05.54, and
        // F-05.61's family: a return value discarded is a failure that never
        // happened). A cabinet write can fail while the bride's turn continues
        // correctly, which is exactly why it must be loud rather than fatal.
        if (!preTurnBinder || preTurnBinder.ok !== true) {
          console.error(
            `[enquiry-binder:pre-turn] FAILED for vendor ${matchedByTdw.id} / ${phone} — ` +
            `${(preTurnBinder && preTurnBinder.error) || 'no result returned'}. ` +
            `The bride's turn continues; her enquiry has NO binder in this vendor's cabinet.`);
        }

        const result = await runCoupleAgenticTurn({
          vendor: matchedByTdw,
          vendorUser,
          conversation: coupleThread,
          couplePhone: phone,
          coupleId: brideCoupleId,
          // A1 — the sentence survives the routing token; the greeting fires only
          // when the token was the whole message. See stripRoutingToken above.
          inboundMessage: stripRoutingToken(body) || 'hi',
          // A-dedupe(α) — the engine's history filter compares against what the
          // audit row at :690 actually stored, not against this derived value.
          // Without it the stripped remainder and the stored body disagree and her
          // sentence reaches the model TWICE (once as history, once in hand).
          rawInboundBody: body,
          supabase,
          anthropic,
        });

        const twilioMsg = await sendWhatsApp(phone, result.reply);

        await supabase.from('messages').insert({
          conversation_id: coupleThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        const vendorPhone = vendorUser?.phone;
        // M-3 R3: the model half scrubs (frame only — this turn was handed
        // `stripRoutingToken(body) || 'hi'` at :794, so THAT is the quote); the fallback
        // is founder-vetoed fixed copy and is left byte-unchanged, never scrubbed.
        const notif = result.vendorNotification
          ? scrubModelFrame(result.vendorNotification, stripRoutingToken(body) || 'hi', { supabase, vendorId: matchedByTdw.id, surface: 'whatsapp', ctx: 'vendorInbound:notification(tdw-link)' })
          : `New enquiry via your TDW link from ${phone}. I'm collecting their details now.`;

        if (vendorPhone) {
          await sendWhatsApp(vendorPhone, notif);
        }

        // Enrich the engine binder's note with the vendor summary (dedup -> note_append).
        if (result.vendorNotification) {
          // D1-lite — the name, now that one exists. The pre-turn call above had
          // none to give (she had not spoken yet), so it opened the binder under
          // enquiryBinder's nameless default AND SAID SO. By here the turn has
          // resolved a name if the bride offered one, and enquiryToBinder fills it
          // in — but ONLY over that untouched default, never over a name the
          // vendor set himself (the never-clobber guard, enquiryBinder.js).
          const postTurnBinder = await enquiryToBinder(supabase, matchedByTdw.id, {
            phone,
            name: result.leadName || null,
            note: result.vendorNotification,
          });
          if (!postTurnBinder || postTurnBinder.ok !== true) {
            console.error(
              `[enquiry-binder:post-turn] FAILED for vendor ${matchedByTdw.id} / ${phone} — ` +
              `${(postTurnBinder && postTurnBinder.error) || 'no result returned'}. ` +
              `The vendor summary did NOT reach his cabinet; his handset still got the message.`);
          }
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', coupleThread.id);

        // Set sticky state — bride sticks to this vendor for 30 min
        await supabase.from('users').update({
          pending_routing_context: {
            sticky_vendor_id: matchedByTdw.id,
            sticky_until:    new Date(Date.now() + STICKY_TTL_MS).toISOString(),
          },
        }).eq('id', user.id);

        return;
      }

      // ── Step B.5: Typo'd TDW code fuzzy-match ──────────────────────
      const looksLikeHandle = firstWord.length >= 3
        && firstWord.length <= 12
        && /^[A-Z0-9]+$/.test(firstWord)
        && !firstWord.startsWith('TDW-')
        && trimmedBody.toUpperCase() === firstWord;

      if (looksLikeHandle) {
        const { data: brideThreads } = await supabase
          .from('conversations')
          .select('vendor_id, vendors(routing_handle)')
          .eq('counterparty_phone', phone)
          .eq('kind', 'couple_thread');

        const handles = (brideThreads || [])
          .map(t => t.vendors?.routing_handle)
          .filter(Boolean);

        const closeMatches = handles.map(h => ({ h, dist: levenshtein(firstWord, h) })).filter(x => x.dist <= 2);

        if (closeMatches.length === 1) {
          const { h: closeMatch, dist } = closeMatches[0];
          console.log(`[routing:typo] "${firstWord}" close to "${closeMatch}" (distance ${dist}), prompting bride`);
          await sendWhatsApp(phone, `Did you mean TDW-${closeMatch}? Send that and I'll connect you right away.`);
          return;
        }
      }

      // ── Step B.9: THE DOORBELL ANSWER (F-06.177) ──────────────────
      //
      // THE FAILURE THIS CURES, founder-witnessed at walk eight: the estate sent
      // her a template naming her vendor, with a button. She pressed it. The
      // router asked her which of THREE vendors she meant. She was made to solve
      // a problem the estate had already solved and had told her the answer to,
      // one message earlier.
      //
      // WHY THE ORDER IS THIS ORDER (chair-ruled, fork 1(b) and fork 2). This
      // sits AFTER Step A (her answer to a question we asked), AFTER Step A.5
      // (sticky — her own recent engagement) and AFTER Step B/B.5 (an explicit
      // TDW code, her stated intent), and BEFORE Step C. Every one of those
      // outranks a doorbell because every one of them is HER signal, while the
      // doorbell is the ESTATE'S inference about why she is writing.
      // Misdelivering her live conversation with vendor X into vendor Y's thread
      // is the worse failure by every measure this arc owns.
      //
      // IT COVERS THE COUNT-0 BRIDE TOO, and that is why it sits here rather than
      // inside the `>= 2` arm. A doorbell rung to a phone with no thread yet
      // would otherwise be refused with 「 send their TDW code 」 — the same
      // disease with a different victim.
      //
      // IT DOES NOT ROUTE — IT PINS. The pinned row is handed to the SAME Step C
      // terminal that has always handled a single thread: her inbound is
      // persisted there, the couple turn runs there, the vendor notification
      // fires there. Nothing about that proven terminal is reimplemented, which
      // is also what makes F-06.179's persistence hold on this new path by
      // construction rather than by a second copy of the insert.
      let doorbellPin = null;
      {
        const { doorbellRouteFor } = require('./vendor/coupleArrival');
        const dr = await doorbellRouteFor(supabase, phone);
        if (dr.vendorId) {
          const { data: pinned } = await supabase
            .from('conversations')
            .select('*, vendors(id, business_name, category, users(name))')
            .eq('counterparty_phone', phone)
            .eq('kind', 'couple_thread')
            .eq('vendor_id', dr.vendorId)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();
          if (pinned) {
            doorbellPin = pinned;
            console.log(`[routing:doorbell] ${phone} -> vendor ${dr.vendorId} (draft ${dr.draftId}) — no question asked`);
          } else {
            // The doorbell named a vendor whose thread we cannot find. DECLARED,
            // never silently ignored: `ringDoorbell` writes its own row onto her
            // thread, so this should be unreachable, and if it is ever reached
            // the register says so instead of quietly falling back.
            console.warn(`[routing:doorbell] ${phone} doorbell vendor ${dr.vendorId} has no couple_thread — falling through to Step C`);
          }
        } else {
          console.log(`[routing:doorbell] ${phone} none (${dr.reason})`);
        }
      }

      // ── Step C: Count existing couple_threads ─────────────────────
      const { data: allThreads } = await supabase
        .from('conversations')
        .select('*, vendors(id, business_name, category, users(name))')
        .eq('counterparty_phone', phone)
        .eq('kind', 'couple_thread')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // THE PIN COLLAPSES THE SET TO ONE. When a doorbell stands, the question
      // "how many vendors could she mean?" has already been answered by the
      // estate's own outgoing template, so the count is 1 and the `>= 2` ask
      // never fires. With no doorbell the set is untouched and every existing
      // branch behaves exactly as it did.
      const existingThreads = doorbellPin ? [doorbellPin] : allThreads;
      const threadCount = existingThreads?.length || 0;

      if (threadCount === 0) {
        // Mode 3 -- no history, no TDW code
        console.log(`[routing:fallback] no match for ${phone}, body: "${body.slice(0, 40)}"`);
        await sendWhatsApp(phone,
          `Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared.`
        );
        return;
      }

      if (threadCount === 1) {
        // Mode 1 -- single existing thread, route there
        const existingThread = existingThreads[0];
        console.log(`[routing:single_thread] ${phone} -> vendor ${existingThread.vendor_id}`);

        await supabase.from('messages').insert(webhookCore.inboundRow({
          conversation_id: existingThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', existingThread.id);
          return;
        }

        // Fetch full vendor row first so we have user_id for the user lookup
        const { data: fullVendor } = await supabase
          .from('vendors').select('*').eq('id', existingThread.vendor_id).maybeSingle();

        const { data: vendorUser } = await supabase
          .from('users').select('*').eq('id', fullVendor?.user_id).maybeSingle();

        const result = await runCoupleAgenticTurn({
          vendor: fullVendor,
          vendorUser,
          conversation: existingThread,
          couplePhone: phone,
          coupleId: brideCoupleId,
          inboundMessage: body,
          supabase,
          anthropic,
        });

        const twilioMsg = await sendWhatsApp(phone, result.reply);

        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        if (result.vendorNotification && vendorUser?.phone) {
          // M-3 R3: frame scrubs, quote passes. This turn was handed `body` (:933).
          //
          // ── F-07.57 CURED (CE rider) · THIS LINE READ A NULL ─────────────────
          // It passed `matchedByTdw.id`. Every other use of that variable sits
          // INSIDE `if (matchedByTdw)` at :728; this was the sole use outside it,
          // and this branch is reachable ONLY when Step B found nothing — so the
          // variable is null here BY CONSTRUCTION and the read threw. No catch
          // encloses it, so the throw killed the vendor's notification AND the
          // `last_message_at` update below — the very column Step C orders by
          // (:915). Her reply had already sent (:959) and stored (:961), so the
          // failure was invisible from her side: F-07.55's family, one layer down.
          //
          // THE IDENTITY IS THE BRANCH'S OWN. `existingThread.vendor_id` is what
          // `fullVendor` was fetched BY (:943) — the same vendor, but it cannot be
          // null, whereas `fullVendor` can (the code already guards it at :946
          // with `fullVendor?.user_id`). Deviation from the ruling's wording named:
          // "the branch's own fetched vendor" and this value are the same id.
          await sendVendorEnquiryAlert({
            toPhone: vendorUser.phone,
            text: scrubModelFrame(result.vendorNotification, body, { supabase, vendorId: existingThread.vendor_id, surface: 'whatsapp', ctx: 'vendorInbound:notification(returning)' }),
            vendorName: vendorUser.name, brideName: result.leadName, link: VENDOR_LEADS_LINK,
            // TDW_06/07 M1 — {{3}}'s raw material. This turn was handed `body`.
            brideMessage: body,
            supabase, vendorId: existingThread.vendor_id, ctx: 'vendorInbound:notification(returning)',
          });
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', existingThread.id);

        return;
      }

      // threadCount >= 2 -- DISAMBIGUATION
      const candidateVendors = existingThreads.map(t => t.vendors);
      const question = buildDisambiguationQuestion(candidateVendors);

      await supabase.from('users').update({
        pending_routing_context: {
          candidate_vendor_ids: candidateVendors.map(v => v.id),
          original_message: body,
          asked_at: new Date().toISOString(),
        },
      }).eq('id', user.id);

      await sendWhatsApp(phone, question);

      console.log(`[routing:disambiguation_asked] ${phone} candidates=${candidateVendors.length}`);
      // ── F-06.179 · THE BOUND, DECLARED RATHER THAN SILENT ──────────────────
      // Her words are NOT persisted on this branch and cannot honestly be.
      // `public.messages.conversation_id` is NOT NULL (`docs/db/PUBLIC_SCHEMA.md`,
      // `public.messages`, column 2) and this branch is reached precisely when no
      // vendor — and therefore no thread — has been resolved. Filing her sentence
      // under a thread the estate picked for her would be the routing guess this
      // whole branch exists to refuse, written into the record.
      //
      // THE CONSEQUENCE, NAMED SO IT IS NEVER REDISCOVERED: `coupleWindowOpen`
      // scans `public.messages` for her newest inbound, so on THIS turn only the
      // estate's window predicate cannot see the window Meta just opened, and an
      // approved draft waiting for her will not auto-send. It fails CLOSED — a
      // refusal or a doorbell, never an unearned byte. Her disambiguating reply
      // resolves a vendor and IS persisted (Step A), and the auto-send fires
      // there. The gap is exactly one turn wide and this line is its witness.
      console.log(`[routing:unfiled_inbound] ${phone} — no vendor resolved, her message is not on file this turn (F-06.179 bound)`);
      return;
    }

    // ── Vendor path ────────────────────────────────────────────────
    let convo;
    const { data: existingConvo } = await supabase
      .from('conversations').select('*')
      .eq('vendor_id', vendor.id).eq('kind', 'vendor_self').maybeSingle();

    if (existingConvo) {
      convo = existingConvo;
    } else {
      const { data: newConvo, error } = await supabase
        .from('conversations').insert({
          vendor_id: vendor.id,
          counterparty_user_id: user.id,
          counterparty_phone: phone,
          kind: 'vendor_self',
          state: 'new',
          mode: 'draft',
        }).select().single();
      if (error) throw error;
      convo = newConvo;
    }

    // TDW_05 P1b: carry the inbound MessageSid on the primary inbound row (feeds the
    // durable messages.message_sid unique-index backstop). inboundRow omits it when the
    // column isn't migrated yet (graceful degrade) or on an internal replay (avoids a
    // self-collision on the original turn's sid).
    await supabase.from('messages').insert(webhookCore.inboundRow({
      conversation_id: convo.id,
      direction: 'inbound',
      channel: 'whatsapp',
      body,
      sent_by: 'vendor',
    }, internalReplay ? null : messageSid));

    // 5-A — engine dispatch. The same agent the web app talks to, so memory
    // unifies across web + WhatsApp (one mind, two surfaces). PDF attachments and
    // the ---DRAFT--- split were Myra delivery features the 78807dd engine cut
    // lacks; deferred (see WHATSAPP_ENGINE_DEFERRED_FEATURES.md). The public.messages
    // audit log is kept (3b) for delivery telemetry; engine.messages carries memory.
    const { agentId } = await resolveAgentForVendor(supabase, vendor, user.auth_user_id);

    // TDW_06 P7b (S-10 WA words + F-06.8): the mode words, intercepted PRE-ENGINE like the
    // nudge words — exact whole-message "advisor mode" / "business mode" on the vendor_self
    // lane. Writes victor_mode via the SAME server-resolved path, chains the fresh thread on
    // an ACTUAL change (P7a's seam), and short-circuits with a scrubbed confirmation NAMING
    // the flip. A message that merely mentions the words is a real turn — it falls through.
    const modeTarget = matchModeWord(body);
    if (modeTarget) {
      const flip = await applyModeFlip(supabase, agentId, modeTarget);
      const confirmation = MODE_FLIP_LINES[modeTarget][flip.changed ? 'changed' : 'noop'];
      const twilioMsg = await sendWhatsApp(phone, confirmation, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: confirmation, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:mode-word] ${modeTarget} (${flip.changed ? 'flipped' : 'noop'}) agent=${agentId}`);
      return;
    }

    // F-04.98 C3 BEGIN (CE-ruled, ninth chair — fresh word)
    // TDW_04.5 F-04.98 C3: the FRESH-THREAD word — the new-thread button WhatsApp never had.
    // Sited immediately AFTER the mode block (CE ruling F1): the two word-sets are disjoint,
    // so order is semantically immaterial, and the after-placement keeps the flip path's bytes
    // literally first — a purely additive diff. This path calls abandonActiveThread DIRECTLY,
    // never applyModeFlip (F2b): victor_mode is neither READ nor WRITTEN here — a fresh thread
    // is not a room change, it is the same room, empty. Short-circuits exactly as the flip does
    // (scrubbed send -> outbound row -> last_message_at -> log -> return): the engine does NOT
    // run this turn, so the abandoned thread cannot be re-populated by the very turn that
    // emptied it. A message that merely CONTAINS "fresh" is a real turn — it falls through.
    if (matchFreshWord(body)) {
      const closed = await abandonActiveThread(supabase, agentId);
      const twilioMsg = await sendWhatsApp(phone, FRESH_THREAD_LINE, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: FRESH_THREAD_LINE, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:fresh-word] thread=${closed && closed.closed ? closed.closed : 'none-active'} agent=${agentId}`);
      return;
    }
    // F-04.98 C3 END

    // ── TDW_06 F-06.130 — THE GLITCH-REPORT WORD (the promise V-W has been making) ──────
    // Sited THIRD in the pre-engine word trio and for the trio's own reason: no model call,
    // no cost, and a vendor complaining about a fabrication must not have his complaint
    // routed through the fabricator. The escape hatch cannot depend on the thing it exists
    // to escape (FORK 2 -> 2a, the CE's wording).
    //
    // It sits AFTER mode and fresh because the three word-sets are disjoint (derived: the
    // matchers return false on each other's words), so order is semantically immaterial and
    // after-placement keeps the earlier paths' bytes literally first — a purely additive diff,
    // the same reason the fresh word was sited after the mode block.
    //
    // Short-circuits in the trio's exact shape: send -> outbound row -> last_message_at ->
    // log -> return. `fileGlitchReport` is the ONE home both legs call (FORK 6b) and it owns
    // the choice of sentence: the filed line ONLY when a finding row actually landed, the
    // no-context line otherwise. This branch never composes a claim of its own.
    if (matchGlitchWord(body)) {
      const { fileGlitchReport } = require('../api/vendor-engine/chat');
      const r = await fileGlitchReport(supabase, agentId);
      const twilioMsg = await sendWhatsApp(phone, r.message, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: r.message, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:glitch-word] filed=${r.filed} run=${r.run_id || 'none'} agent=${agentId}`);
      return;
    }

    // ── TDW_10 · F-10.100 — THE COMBINED AI CAP. THE WORD TRIO'S FOURTH MEMBER. ──────
    // THE DISEASE, in one sentence: the counter was already combined and only the refusal
    // was missing. Both lanes resolve one agent through resolveAgentForVendor above, both
    // run the same engine turn, and the engine loop writes ONE usage row per turn with agent_id
    // and conversation_id and no lane column at all (witnessed: docs/db/ENGINE_SCHEMA.md,
    // engine.usage, 12 columns). The meter in src/api/vendor-engine/chat.js has therefore
    // ALWAYS counted this lane's turns. It simply never refused them. A paying vendor's
    // WhatsApp use silently exhausted the allowance her web app then denied her.
    //
    // WHY IT SITS EXACTLY HERE, and not one line either side — CE R-26.7 §C, F-1 RULED:
    //
    //   AFTER the three words. Mode, fresh and glitch each short-circuit above with no
    //   model call and no cost, and the glitch block's own comment says why that matters:
    //   the escape hatch cannot depend on the thing it exists to escape. A capped vendor
    //   keeps every one of them. Sealing her escape hatches behind the cap would have been
    //   the exact failure that comment was written against, committed by the sitting that
    //   quotes it.
    //
    //   BEFORE the prep. fetchCalendarSnapshot, fetchScratchpad, fetchLeadPings (which
    //   also STAMPS the pings drained — a read with a write inside it) and the model-route
    //   builder all sit below. A refused turn must pay for none of them, and the ping drain
    //   in particular must not consume state for a turn that will never be answered.
    //
    //   BEFORE the engine call, which is the only thing on this path that writes a usage
    //   row. That is what makes the refusal free: a meter that ate its own tail would count
    //   the refusal it just issued and refuse her again tomorrow for a conversation she
    //   never had. Two `from('usage').insert` homes exist in the estate — the engine loop
    //   (the turn ledger) and src/agent/harvest.js (spend rows, conversation_id NULL, and
    //   excluded by the meter's own filter) — and this early return reaches neither.
    //
    //   ⚠ WHY THIS PARAGRAPH TALKS AROUND TWO SYMBOL NAMES. `b06_forkc_wireguard_bench`
    //   §12.8 slices vendorInbound from the glitch word to `const calendarSnapshot` and
    //   forbids the tokens `runTurn`, `buildLlmForTurn` and `anthropic` anywhere in that
    //   window — a grep-shaped guard written when nothing else lived in it. Naming them
    //   here in PROSE would redden a sealed 113/113 bench over a comment. The precise
    //   symbols are asserted instead where they belong, by execution rather than by grep:
    //   scripts/tdw10_combined_cap_bench.js §1.6 and §1.7. The over-wide window is filed
    //   as F-10.104 for the bench's own next sitting; it is not amended from here.
    //
    // THE INBOUND ROW DOES NOT MOVE (ratified). It was written above, before the whole
    // trio. Her message stays on the record unanswered, exactly as it does when she sends
    // a mode word — an audit log that only keeps the messages we felt like answering is
    // not an audit log.
    //
    // REQUIRED LAZILY, and the choice is mechanical rather than stylistic. The two elder
    // trio members receive their seams through `deps`; adding a required key to that
    // object BROKE FIVE SEALED BENCHES the last time it was tried, because every bench
    // that drives the real processVendorInbound builds its own deps object and none of
    // them carry a key that did not exist when they were written (the correction is
    // recorded at src/lib/nudgeOptout.js, the glitch word's siting note). The glitch
    // member's inline require is the precedent that survived that lesson; this follows it,
    // and the deps contract stays byte-identical to origin.
    //
    // FAIL-OPEN — RATIFIED BY RULING (R-26.14 §C), not merely chosen. It was the
    // executor's call at build time, surfaced rather than allowed to seal silent, and
    // the chair ruled it standing. F-06.85 binds the reason here so no future sitting
    // "fixes" it into fail-closed on the assumption that a cap ought to fail shut:
    //
    //   A PAYING VENDOR SILENCED BY OUR OWN OUTAGE IS WORSE THAN A BASIC VENDOR
    //   GETTING TURNS DURING ONE.
    //
    // The cost is real and is stated so nobody rediscovers it: a failed config read
    // means unmetered AI for the duration, and only the error line below says so.
    // It is the estate's standing posture for this machinery either way — buildMeta's
    // own catch reads 「 a broken meter NEVER blocks a turn 」 and returns null rather
    // than throwing. The require can fail too (it pulls the engine's db module, which
    // throws at load without its environment), and an unguarded require on the MAIN
    // path of every vendor turn would convert a cap-machinery fault into total
    // WhatsApp silence.
    let capMeta = null, WA_CAP_ZERO_LINE = null, capSpentLineFor = null;
    try {
      const capSeam = require('../api/vendor-engine/chat');
      WA_CAP_ZERO_LINE = capSeam.WA_CAP_ZERO_LINE;
      // Hoisted for the SAME reason as the line above: `capSeam` is scoped to this
      // try block, and the spent-allowance seat below sits outside it. Taking the
      // function out here keeps both refusals reading ONE home for their bytes
      // without either of them reaching into a scope it cannot see.
      capSpentLineFor = capSeam.CAPPED_LINE;
      capMeta = await capSeam.buildMeta({
        supabase, agentId, tier: (vendor && vendor.tier) || 'basic',
      });
    } catch (e) {
      console.error('[agent:cap-gate] METER UNREACHABLE — turn allowed through unmetered:', e.message);
    }
    if (capMeta && capMeta.state === 'capped' && capMeta.turns_cap === 0) {
      const twilioMsg = await sendWhatsApp(phone, WA_CAP_ZERO_LINE, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: WA_CAP_ZERO_LINE, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:cap-gate] refused tier=${capMeta.tier} cap=0 agent=${agentId}`);
      return;
    }
    // ── THE SPENT-ALLOWANCE SEAT ON THIS LANE — FILLED. R-26.15 ①. ───────────────────
    // THIS SEAT SHIPPED EMPTY AND WARNING, and the warn was right to exist: at the
    // founder's new ladder an Essential vendor reaches 15 turns in a day, and until this
    // block she then met SILENCE on WhatsApp. She is paying, she is inside her rights,
    // and Victor said nothing back. That is exactly the failure F-3 was ruled to prevent
    // — 「 silence is the one failure mode this whole sitting exists to end 」 —
    // reintroduced by a held byte rather than by a design. The gap was declared, visible
    // in the logs, and closed by a ruling rather than discovered by a vendor.
    //
    // IDENTICAL BYTES TO THE PWA, IMPORTED NOT RETYPED. `CAPPED_LINE` is the shared home;
    // a second transcription of a vetoed string is F-04.36's family and would drift the
    // first time one lane was edited.
    //
    // NO ROUTE LINE HERE, and the asymmetry with the zero-cap block above is deliberate:
    // that one is a SALE and needs somewhere to send her, so it carries directions to
    // Billing. This one is a WAIT. There is nothing to tap, because there is nothing to
    // do but come back — and pointing a vendor at a payment page when her own allowance
    // simply resets at midnight would be selling her something she does not need.
    if (capMeta && capMeta.state === 'capped' && capMeta.turns_cap > 0) {
      const spentLine = capSpentLineFor(capMeta);
      const twilioMsg = await sendWhatsApp(phone, spentLine, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: spentLine, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:cap-gate] refused tier=${capMeta.tier} window=${capMeta.window} ${capMeta.turns_used}/${capMeta.turns_cap} agent=${agentId}`);
      return;
    }

    // Same turn inputs the web door feeds: upcoming calendar (so Victor can reference
    // bookings to edit/cancel) + the owner's scratchpad. Without these he is blind to both.
    const calendarSnapshot = await fetchCalendarSnapshot(supabase, vendor.id, vendor.category);
    const scratchpad = await fetchScratchpad(supabase, vendor.id);
    // TDW_05 F-05.50(b) BEGIN — THE ENQUIRY-PING DRAIN, door-built like its two
    // siblings above. This is the READER pending_lead_pings has never had: three
    // writers, zero readers since M5 (arc_m5 §3.1). The drain is DOOR-side because
    // it must be — the engine's client is bound to schema 'engine' (db.ts:16) and
    // cannot see public.pending_lead_pings; here both planes are in scope. The call
    // also STAMPS the pings drained (R2/L1) — surfacing is draining — so it fires
    // exactly once per turn, on the turn that consumes it. Fail-safe to '' inside
    // the module; a failed drain never costs the vendor his answer.
    const leadPings = await fetchLeadPings(supabase, vendor.id);
    // TDW_05 F-05.50(b) END
    // TDW_06 P7b (F-06.1 second limb): the WA door resolves the SAME route the PWA door does —
    // model.pwa_vendor.<tier> via resolveModel AND victor_mode read at the door — so both
    // surfaces route identically (advisor -> deepseek; product tier otherwise). Before this
    // seam the WA lane passed NO overrides and ran the engine's native-anthropic hard path.
    const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId });
    // P6 FORK-B BEGIN (CE-ruled, ninth chair — the vendorCategory thread)
    // 04.5 P6: the SAME predicate that gated the gap line two statements above now gates
    // the VOICE — one home (lib/vendor/categoryFraming), read twice, never forked. That is
    // the whole of Fork B's principle: facts and voice cannot diverge if they ask the same
    // question. FAIL-SAFE TO NULL — a Victor without the planner weave is diminished, not
    // wrong; a Victor wearing it for a lawyer would be wrong.
    let vendorCategory = null;
    try {
      vendorCategory = require('./vendor/categoryFraming').normaliseCategory(vendor.category);
    } catch (e) { console.warn('[agent:category]', e.message); }
    // P6 FORK-B END
    // ── TDW_06 F-06.162/.163 (R-29.29) — THE PENDING-RELAY BLOCK ─────────────
    // Built BEFORE the turn, from the open staged row, and handed to Victor as a
    // FACT on the CE-4 seam. Without it he can read the confirm in his own thread
    // and has no idea a commitment is open or what is expected of him — which is
    // the 09:29 turn that came back with zero tool calls and a fabrication.
    // Fail-safe to '' exactly as leadPings does: a Victor without the block is
    // diminished, never wrong.
    let pendingRelay = '';
    try {
      const { buildPendingRelay } = require('./vendor/relaySeat');
      pendingRelay = await buildPendingRelay(supabase, vendor.id);
    } catch (e) { console.warn('[relay:wa pending-block]', e && e.message); }

    const result = await runTurn({
      agentId, message: body, calendarSnapshot, scratchpad,
      leadPings, // TDW_05 F-05.50(b) — an opaque string, the recentActivity contract
      pendingRelay, // TDW_06 F-06.162 (R-29.29) — the open commitment, door-known
      // P6 FORK-B BEGIN (CE-ruled, ninth chair — the vendorCategory thread)
      vendorCategory,
      // P6 FORK-B END
      tierOverride: llmWiring.tierOverride,
      modelOverride: llmWiring.modelOverride,
      transport: llmWiring.transport,
      donnaTransport: llmWiring.donnaTransport,
      donnaModelOverride: llmWiring.donnaModelOverride,
    });
    const toolNames = (result.tool_calls || []).map((t) => t.name);

    console.log(`[agent:engine] reply: "${result.reply.slice(0, 80)}..."  (${toolNames.length} tool calls)`);

    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convo.id);

    // donna_invoice_pdf over WhatsApp (owner path): detect the signal, generate the
    // numbered PDF (same routine as pwa + pwa-chat), confirm the NUMBER in text (NO
    // URL), and send the PDF as a SEPARATE media-only message so the owner can forward
    // it to the client clean — no advisor chatter, no link, just the document.
    const wantInvoice = new Set();
    for (const tc of (result.tool_calls || [])) {
      if (tc.name === 'donna_invoice_pdf' && tc.input && tc.input.binder_id) wantInvoice.add(tc.input.binder_id);
      for (const dc of (tc.donna_calls || [])) {
        if (dc.name === 'donna_invoice_pdf' && dc.input && dc.input.binder_id) wantInvoice.add(dc.input.binder_id);
      }
    }
    const invoiceDocs = [];
    for (const binderId of wantInvoice) {
      try {
        const { data: bnd } = await supabase.schema('engine').from('records')
          .select('id, client, phone, amount, amount_received, note')
          .eq('agent_id', agentId).eq('id', binderId).maybeSingle();
        if (bnd && Number(bnd.amount) > 0) {
          const gen = await generateInvoiceForBinder(supabase, vendor, bnd);
          if (gen && gen.ok) invoiceDocs.push({ invoice_number: gen.invoice_number, pdf_url: gen.pdf_url, client: bnd.client });
        }
      } catch (e) { console.error('[whatsapp:donna_invoice_pdf]', e.message); }
    }

    // Message 1 — Victor's reply + a NUMBER-ONLY confirmation line per invoice (no URL).
    // BLOCK 06 M-3 · F-06.29 CURED (CE-ruled 2026-07-25, R2) — THE FIREWALL REACHES
    // THE VENDOR LANE. The web door has scrubbed the model's prose since CE-18
    // (`chat.js:1580`, "the firewall covers the reply itself"); this door — the LIVE
    // WhatsApp wire, the one the founder actually reads — never did, and three persona
    // names crossed it in a single evening. Sited on `result.reply` ALONE, mirroring the
    // precedent byte-for-shape: the invoice confirmation lines appended below carry
    // founder-vetoed copy and a stored client name, and `cal.suffix` arrives already
    // floored (calendarSignals scrubs its own lines at :117/:129/:360/:425/:578/:579).
    // Widening this to the composed `replyText` would put a rewriter over strings the
    // founder's veto owns, to catch a leak that cannot originate there.
    // TDW_06 M-4 / F-06.36: the same scrub, now with a witness. The string is
    // unchanged; the ledger stops being blind to the surface that actually bleeds.
    let replyText = witnessWireScrub(supabase, vendor.id, 'whatsapp', String(result.reply ?? ''), scrubText(result.reply), 'vendorInbound:reply');
    if (invoiceDocs.length) {
      replyText += '\n\n' + invoiceDocs.map((d) =>
        `Invoice ${d.invoice_number}${d.client ? ' for ' + d.client : ''} — sending the PDF now.`
      ).join('\n');
    }
    // Calendar signals (book / edit / cancel / retro-link / lockstep) — same handler the
    // web door uses, so a booking made over WhatsApp lands on the same calendar with the
    // same binder lockstep. The confirmation suffix rides on Victor's reply.
    try {
      const cal = await applyCalendarSignals(supabase, vendor, agentId, result);
      if (cal.suffix) replyText += cal.suffix;
    } catch (e) { console.error('[whatsapp:calendar-signals]', e.message); }
    // ── TDW_06 WIRE GUARD · STAGE 1 — THE WHATSAPP SEAT (2026-07-28; CE R-10).
    // DERIVED, NOT ASSUMED: this lane calls the SAME `runTurn` (:1113) and holds the
    // SAME `result` — `result.reply` and `result.tool_calls[].donna_calls` — that the
    // PWA door hands the guard. The guard is one function of (supabase, vendorId,
    // result); this lane holds all three. NO NEW MACHINERY AND NO NEW READERS: the
    // classifier, the vocabulary, the hand census and the landing site are literally
    // the same code, required from its one home. R-10's rule is therefore met and the
    // WA seat SHIPS IN THIS SITTING rather than deferring as Stage 1b.
    //
    // WHY THAT MATTERS AND IS NOT A NICETY: the vendors this guard exists for live on
    // WhatsApp. A Stage 1 seated only at the PWA door would have produced an EMPTY
    // specimen log through Evening Three's card walks — and an empty log read as a
    // clean bill is the hollow-green shape this block exists to refuse.
    //
    // THE ONE DISCLOSED ADAPTATION (Q-B2-7's relocation precedent — the signature bends,
    // stated, never silently): the guard was first written as (req, result) against the
    // PWA door's shape. This lane has no `req`. It now takes (supabase, vendorId, result)
    // and the PWA sites pass `req.app.locals.supabase, req.vendor.id` — the exact two
    // values the req-shaped body used to dereference internally. Same readers, same
    // behaviour, one home.
    //
    // ── STAGE 2 IS ARMED ON THIS SEAT (the gate opened 2026-07-29). This is the ONLY
    // seat with a true pre-delivery seam: the guard runs here, `sendWhatsApp` is the very
    // next statement, and `replyText` has not left the process. The PWA JSON route has
    // the same property; the SSE route does not (its body has already streamed) and takes
    // replace-at-done instead.
    //
    // FORK D — THE RETRY-THE-ACTOR LEG, as ratified. On a costume the act did not happen,
    // and the intercept's OWN PREDICATE is the retry's safety proof: `costume` entails
    // zero write hands, so there is nothing to duplicate. The turn re-runs ONCE so the
    // deed can actually land, and the bound is STRUCTURAL, not a counter — `_noRetry`
    // is threaded into the retried call, so the retry path has no second edge.
    // THREE OUTCOMES, all explicit:
    //   · the retry produces write hands → the act happened; its reply ships, the vendor
    //     never sees a glitch line, and the FIRST turn's specimen still stands logged
    //     (the costume is evidence whether or not the rescue worked);
    //   · the retry is a costume again → NO SECOND COSTUME EVER SHIPS. F3's sentence goes
    //     out instead, byte-derived from undoContract.js:31;
    //   · the retry throws → fail-open to the glitch line, exactly as the un-retried path
    //     behaves. A retry that breaks must never be worse than no retry.
    //
    // ── TDW_06 F-06.136 — THE ARMING PREDICATE WIDENS: `specimen` → `specimen OR
    // imperative-miss` (CE-110's last charter, the closed list's item 1).
    //
    // THE SECOND ARM AND HOW IT DIFFERS FROM THE FIRST, because the difference is the
    // whole safety argument: a COSTUME is a lie already composed, so Fork D above must
    // REPLACE it. An IMPERATIVE-MISS is not a lie at all — Victor answered honestly, he
    // simply invented a gate his own soul forbids (harveySoul.ts:98, quoted verbatim at
    // the predicate's home in chat.js). There is nothing to intercept and nothing to
    // replace. So this arm re-runs the actor ONCE and then, if the second run refuses
    // too, DELIVERS VICTOR'S ORIGINAL REPLY UNTOUCHED. It owns no sentence of its own;
    // F3's line and the glitch lines are unreachable from here, by construction.
    //
    // INSIDE THE TRIPWIRE (fork F2(a), CE-ruled): `stage2Armed()` gates this arm too, so
    // `WIRE_GUARD_STAGE2=off` + a redeploy stops EVERYTHING Stage-2-shaped in one act.
    // The founder should never have to remember, mid-incident, which arm survives the
    // switch. The counter-argument was heard and recorded at ruling: this arm replaces
    // nothing, so the tripwire's stated subject (one false INTERCEPTION is a STOP) does
    // not literally reach it. Ruled the other way deliberately.
    //
    // THE SPEND BOUND IS THE SAME STRUCTURAL ONE, not a second mechanism: `_noRetry`
    // threads through, the retried call goes to `runTurn` directly and never re-enters
    // this body, so the worst case for any turn is EXACTLY ONE duplicated actor run.
    let s2line = null;
    // ── TDW_06 F-06.157's CURE — THE EFFECTIVE RESULT ────────────────────────
    // WHICH TURN'S HANDS BELONG TO THE REPLY THAT ACTUALLY SHIPS.
    //
    // Fork D can re-run the actor, and when it does, `replyText` is rebuilt from
    // `retry.reply` while `result` still holds the FIRST turn's `tool_calls`.
    // Every signal collector that runs BEFORE this block (invoices at :1346,
    // calendar at :1388) reads the first turn by construction and is consistent.
    // A collector seated AFTER it is not: it would read one turn's hands and ship
    // another turn's words. F-06.157 is that mismatch, founder-witnessed on the
    // relay's first live walk — Victor's retry told the vendor a draft was ready
    // and the door, reading a turn with zero tool calls, composed nothing.
    //
    // THIS VARIABLE IS THE ANSWER AND ITS RULE IS ONE SENTENCE: it is reassigned
    // in EXACTLY the arms where `replyText` is rebuilt from the retry, so hands
    // and words always come from the same turn. Outcome B ships Victor's ORIGINAL
    // reply, so it keeps the original result; outcome 2 ships F3's sentence
    // saying nothing landed, and a collector must never compose beside that.
    // A bench cell pairs the two assignment counts, so a future third retry arm
    // that rebuilds `replyText` and forgets this goes red instead of silent.
    let effectiveResult = result;
    let s2run = null;   // F-06.130: the specimen row this seat will patch with what SHIPPED
    let s2arm = null;   // which of Fork D's three outcomes actually resolved
    let impMiss = false; // F-06.136: the second arm, live only when the first did not fire
    try {
      const { wireGuardSpecimen, stage2Intercept, stage2RecordDelivery, STAGE2_WA_REPORT,
              stage2Armed, imperativeMiss, recordImperativeRetry } = require('../api/vendor-engine/chat');
      const verdict = await wireGuardSpecimen(supabase, vendor.id, result, agentId);
      s2line = stage2Intercept(verdict, true);
      if (s2line) { s2run = (verdict && verdict.run_id) || null; s2arm = 'glitch_line'; }
      // ORDER IS LOAD-BEARING: a turn that is BOTH a costume and an imperative-miss is
      // governed by the costume path, byte-for-byte as it was before this movement. The
      // second arm is live ONLY where the first did not fire — existing behaviour sacred.
      impMiss = !s2line && stage2Armed() && imperativeMiss(body, result);
      if ((s2line || impMiss) && !_noRetry) {
        try {
          const retry = await runTurn({
            agentId, message: body, calendarSnapshot, scratchpad, leadPings, pendingRelay, vendorCategory,
            tierOverride: llmWiring.tierOverride, modelOverride: llmWiring.modelOverride,
            transport: llmWiring.transport, donnaTransport: llmWiring.donnaTransport,
            donnaModelOverride: llmWiring.donnaModelOverride,
          });
          const retryVerdict = await wireGuardSpecimen(supabase, vendor.id, retry);
          const retryHands = [];
          for (const tc of (retry.tool_calls || [])) {
            for (const dc of ((tc && tc.donna_calls) || [])) {
              if (dc && dc.name && dc.name !== 'listen_harvey_talk') retryHands.push(dc);
            }
          }
          if (impMiss) {
            // ── F-06.136 · THE IMPERATIVE ARM'S TWO OUTCOMES. This whole limb is
            // UNREACHABLE when the costume path armed (`impMiss` requires `!s2line`), so
            // every byte of Fork D's three outcomes below is preserved exactly as sealed.
            //
            // The landing test is THE PREDICATE ITSELF, re-asked of the retry — not a new
            // authority and not `retryHands`, which counts read hands too. A retry whose
            // hands are all reads has still not filed the thing the owner asked for, and
            // calling that a landing is how a hollow green is born. Plus the costume gate:
            // a retry that FILED-in-prose-only must never ship in place of an honest refusal.
            if (!imperativeMiss(body, retry) && !(retryVerdict && retryVerdict.specimen)) {
              // outcome A — the second run filed it. Ship the retry's own reply through the
              // same firewall the first reply went through. s2line was already null; nothing
              // is replaced and no line of this arm's own exists to replace it with.
              replyText = witnessWireScrub(supabase, vendor.id, 'whatsapp', String(retry.reply ?? ''), scrubText(retry.reply), 'vendorInbound:reply(imperative-retry)');
              effectiveResult = retry;   // F-06.157: the retry's words ship, so the retry's hands govern
              s2arm = 'imperative_retry_landed';
              console.log('[wire-guard stage2 wa] imperative-miss retry landed the hand; the honest first reply was never sent');
            } else {
              // outcome B — A SECOND REFUSAL SHIPS VICTOR'S OWN WORDS, UNTOUCHED. `replyText`
              // is not reassigned, `s2line` stays null, and the F3 sentence is not reachable
              // from this limb. He may have been RIGHT to refuse (harveySoul:100's
              // establish-it-first distinction is real and this arm cannot tell the two
              // apart) — so the estate records the miss and delivers his sentence whole.
              s2arm = 'imperative_second_refusal';
              console.warn('[wire-guard stage2 wa] imperative-miss survived the retry; Victor\'s own reply ships untouched');
            }
            await recordImperativeRetry(supabase, vendor.id, agentId, s2arm, result, retry);
          } else if (retryHands.length > 0 && !(retryVerdict && retryVerdict.specimen)) {
            // outcome 1 — the act landed. Ship the retry's own reply, through the same
            // firewall the first reply went through. No glitch line, no chip word.
            replyText = witnessWireScrub(supabase, vendor.id, 'whatsapp', String(retry.reply ?? ''), scrubText(retry.reply), 'vendorInbound:reply(retry)');
            effectiveResult = retry;   // F-06.157: the retry's words ship, so the retry's hands govern
            s2line = null;
            s2arm = 'retry_landed';
            console.log('[wire-guard stage2 wa] retry landed the act; original specimen stands logged');
          } else {
            // outcome 2 — a second costume must never ship.
            // TDW_06 F-06.130, SLOT TWO, founder-vetoed 「 accept all 」 — THE AFFORDANCE TRAVELS
            // HERE. This vendor experienced the failure most worth flagging and, until this
            // movement, was the one arm handed no way to flag it: the report word rode only the
            // rarest outcome (a retry that THREW), which is F-04.27 inverted.
            // V-W's bytes are VERBATIM and unchanged — the travel is the act, not a re-wording,
            // and the constant is read, never retyped.
            // THE SHARED HOME (undoContract.js:31) STAYS 0-LINE, and that is derived, not
            // stylistic: deriveFiling feeds donnaWitnessLines (the stored twin, BOTH doors) and
            // translateBeat (chat.js:256, live on the SSE wire), so appending a WhatsApp
            // reply-word there would print "reply REPORT" onto a screen that has no reply wire —
            // the cure for F-04.27's class minting F-04.27's class.
            s2line = `That didn't land — nothing was changed.\n\n${STAGE2_WA_REPORT}`;
            s2arm = 'second_costume';
            console.warn('[wire-guard stage2 wa] retry produced no write hand; F3 sentence shipped');
          }
        } catch (retryErr) {
          // outcome 3 — never worse than no retry.
          console.warn('[wire-guard stage2 wa retry]', retryErr.message);
        }
      }
    } catch (e) { console.warn('[wire-guard stage2 wa]', e.message); }
    // ── ORDER, AND WHY IT IS THIS ORDER (F-06.169's cure) ────────────────────
    // THE RELAY SEAT RUNS BEFORE THE INTERCEPTION BLOCK. It was seated after it,
    // and F-06.166's guard — which must acquit on THIS TURN'S OWN staging outcome
    // — read `relayOut` from above its own `let`. A TEMPORAL DEAD ZONE throw on
    // EVERY vendor turn, relay or not: the founder received the dead-letter
    // hiccup line twice and the whole WA door was down. `node --check` cannot see
    // a TDZ and neither could a bench that only grepped the source.
    //
    // The order below is the honest one and each step needs the one before it:
    //   1. the seat stages/approves/sends and APPENDS its line to replyText
    //   2. the lane selection and the confirm-shape guard read `relayOut`
    //   3. the interception statement below REPLACES — an interception wins over
    //      an appended line, which is correct: a costume must not ship beside a
    //      true one. That statement stays BYTE-IDENTICAL (forkc §11.5) and is
    //      NOT QUOTED HERE ON PURPOSE: forkc §5.8d counts the seat's writers by
    //      pattern, and quoting it in prose minted a phantom fourth writer. A
    //      comment that breaks the cell guarding the thing it describes is the
    //      fifth instance of that class this sitting; named so it stops.

    // ── TDW_06 · THE HAND · SITTING TWO — THE RELAY SEAT ─────────────────────
    // THE VENDOR→BRIDE SEND, WHOLE: the vendor instructs, Harvey composes, the
    // draft is STAGED, the exact bytes are SHOWN as a quoted artefact, his named
    // affirmative APPROVES, and the estate DELIVERS window-first.
    //
    // SEATED HERE AND NOWHERE ELSE, for the reason the wire guard is seated here:
    // this is the ONLY point with a true pre-delivery seam — `replyText` is final
    // (Fork D has resolved, `s2line` has been applied) and `sendWhatsApp` is the
    // very next statement. The relay's lines are the DOOR's speech appended to
    // Victor's, exactly as the invoice confirmations above are, and they cross to
    // the vendor without passing through any model's mouth.
    //
    // R-29.2 — TRANSPORT IS DOOR-INJECTED. `sendWhatsApp` comes from this door's
    // own deps bag; the engine never requires a transport at import and holds no
    // store writer. That is what makes 2026-08-08 impossible at the level of what
    // the model can touch, rather than at the level of what it can be told.
    //
    // NEVER THROWS INTO THE TURN. A relay fault must not cost the vendor his
    // reply — F-06.141's class at a neighbouring site, and not one to re-instance
    // in the same block that filed it.
    let relayOut = null;
    // F-06.176: set only when a costume turn's prose was REPLACED by the seat's
    // outcome, so the thread patch below can be made to agree with the wire.
    let relayReplacedCostume = false;
    try {
      const { runRelaySeat } = require('./vendor/relaySeat');
      relayOut = await runRelaySeat(supabase, vendor, effectiveResult, {
        sendWhatsApp,
        conversationId: convo.id,
        hasTransport: true,
        agentId, // R-29.32 ② — the COMPOSE fork's handle on Donna's machinery
        // R-29.29's trigger. The OWNER'S OWN INBOUND, never the model's prose:
        // the door asks whether HE affirmed and whether HE named the stored
        // subject. It chooses nothing — the recipient is already on the row.
        ownerWords: body,
      });
      if (relayOut && relayOut.line) {
        // ── THE APPEND IS RETIRED BY F-06.189 (α) ─────────────────────────────
        // This wrote `replyText += "\n\n" + line` for ten walks. Under (α) every
        // acted turn now REPLACES below, so an append here would be a write no
        // reader ever sees — and a line that looks like it ships and never does is
        // how a guard rots. Retired with its reader, not left as decoration.
        // The seat's thread patch below is UNCHANGED and still needed: it is
        // F-06.158's cure (the door's words must exist in Victor's own record),
        // and the final patch re-writes that row to the replaced bytes so wire and
        // thread agree.
        console.log(`[relay:wa] ${relayOut.kind}${relayOut.draftId ? ` draft=${relayOut.draftId}` : ''}`);
        // ── F-06.158's CURE (R-29.26) — THE LINE JOINS VICTOR'S OWN THREAD ────
        // Without this the SHOW frame and the E3 confirm exist only on the wire:
        // `loop.ts` saves `result.reply` alone, so Victor asks 「 Send this to
        // Priya (+91…)? 」 and holds no record of asking. The vendor's affirmative
        // then answers a question the thread never contains, and Harvey re-stages.
        //
        // THE SAME CORE THE PWA DOOR CALLS — one home, extracted at this sitting,
        // never a second copy. Patched on `effectiveResult`, not `result`:
        // F-06.157's lesson holds here too, and the witnessed row must belong to
        // the turn whose reply actually shipped. AWAITED, so a fast follow-up
        // cannot race the patch it exists to make.
        try {
          const { patchComposedReply } = require('../api/vendor-engine/chat');
          await patchComposedReply(supabase, effectiveResult, `\n\n${relayOut.line}`);
        } catch (e) { console.warn('[relay:wa composed-reply]', e && e.message); }
      }
    } catch (e) { console.error('[relay:wa]', e && e.message); }

    // ── TDW_06 F-06.164's CURE (R-29.30) — LANE SELECTION, NOT A REWORD ──────
    // F3's sentence 「 That didn't land — nothing was changed. 」 is founder-vetoed
    // for the FILING lane and knows nothing about a wire. Shipped after a RELAY
    // costume it is false twice over: on 2026-08-11 09:29 a draft WAS staged and
    // waiting, so "nothing was changed" was untrue, and the honest sentence for
    // that moment already existed and was already vetoed.
    //
    // NO NEW COPY IS MINTED HERE. This routes bytes the founder approved on
    // 2026-08-11 to the moment they were written for: a relay-claim interception
    // with a draft waiting speaks the re-show (⑨'s frame, the safe direction
    // R-29.19 already ruled). Everything else leaves F3 to its own lane, untouched.
    //
    // IT SELECTS s2line AND NEVER WRITES replyText. The interception statement
    // below is left BYTE-IDENTICAL deliberately: `b06_forkc_wireguard_bench`
    // §11.5 asserts that exact statement, and its own comment records why — the
    // mutation floor once caught a cell passing over `if (false) replyText =
    // s2line;`. Reshaping the one line that ships an interception to add a
    // feature beside it is how that guard dies quietly. So the selection sits
    // ABOVE it and the seat keeps its single, unmodified writer.
    if (s2line) {
      try {
        const { relayLaneLine } = require('./vendor/relaySeat');
        // ── F-06.173 (walk seven's ⑤) — F3 NEVER ON A RELAY MOMENT ──────────
        // On 2026-08-11 10:56 「 That didn't land — nothing was changed 」 shipped
        // TWICE on relay turns: false about the draft (staged and standing) and
        // false about the wire (her handset HAD the doorbell). 08-08 has fully
        // inverted — then a claimed send that never happened, now a real send
        // denied by its own reporter — and it is the same class: THE DOOR
        // DISAGREEING WITH ITS OWN DEED.
        //
        // THIS TURN'S OWN RELAY OUTCOME OUTRANKS THE INTERCEPTION. If the seat
        // produced a line — the doorbell rang, the window refused, a draft was
        // shown — that line is what the vendor reads, because it is derived from
        // the store and F3 is derived from a model's prose.
        if (relayOut && relayOut.line) {
          s2line = null;
          s2arm = `${s2arm || 'glitch_line'}:relay_outcome_stands`;
          console.log(`[relay:wa] F3 suppressed — this turn's own outcome (${relayOut.kind}) stands`);
          // ── F-06.176's CURE · REPLACE, NEVER APPEND ────────────────────────
          //
          // THE SPECIMEN, founder-witnessed at walk eight 11:21:25. Suppressing
          // F3 was right. Leaving Victor's prose standing was not. The vendor's
          // screen read 「 Message sent to Priya. 」 (FALSE — the window was shut)
          // then the quote, then ④b-v2 saying she had been notified (TRUE). Three
          // sentences, two of them contradicting each other, on the screen of the
          // man whose approval the estate had just acted on.
          //
          // THE LAW, ONCE: WHEN THE SEAT HAS AN OUTCOME AND THE TURN IS A
          // COSTUME, THE RELAY LINE REPLACES THE MODEL'S PROSE. We are inside the
          // exact branch that establishes both halves — `s2line` was armed, so
          // the wire guard judged this turn a costume, and `relayOut.line` exists,
          // so the seat has a store-derived outcome. There is no reading of this
          // moment in which the model's sentence and the door's sentence are both
          // worth showing him: one is derived from a row, the other from prose
          // about a row.
          //
          // BOTH MEMORIES AGREE, and that is the arc's founding class (F-06.158).
          // The wire gets the line alone; the thread row is patched to the same
          // bytes through `patchComposedReply`, the one home both doors call.
          // The `{ ...result, reply: '' }` idiom is NOT invented here — it is the
          // estate's own established replace-mode, already shipped at the costume
          // patch a few statements below, so no byte of `chat.js` moves.
          //
          // THE APPEND ABOVE IS UNTOUCHED FOR EVERY OTHER TURN. A relay outcome
          // on an honest turn still joins Victor's reply, exactly as it has for
          // eight walks. Only the costume loses its sentence.
          replyText = relayOut.line;
          relayReplacedCostume = true;
        } else {
          const laneLine = await relayLaneLine(supabase, vendor, effectiveResult);
          if (laneLine) { s2line = laneLine; s2arm = `${s2arm || 'glitch_line'}:relay_lane`; }
        }
      } catch (e) { console.warn('[relay:wa lane-line]', e && e.message); }
    }
    // ── F-06.166's GUARD (R-29.32 ③) — THE IMITATED COMMITMENT ───────────────
    // A 「 Draft ready … Send this to Priya? 」 shape in MODEL PROSE with no
    // just-staged row is a costume of a new kind: not a claimed deed but a
    // claimed COMMITMENT. The 09:49:37 fabricated 50k frame is its specimen, and
    // F-06.158's cure is what taught him the shape. THE ACQUITTAL IS THE STORE —
    // this turn's own `[relay:wa]` outcome — never the words.
    if (!s2line && !(relayOut && relayOut.draftId)) {
      try {
        const { CONFIRM_SHAPE_RE } = require('../api/vendor-engine/chat');
        const { relayLaneLine } = require('./vendor/relaySeat');
        if (CONFIRM_SHAPE_RE.test(String((effectiveResult && effectiveResult.reply) || ''))) {
          const laneLine = await relayLaneLine(supabase, vendor, effectiveResult, { anyClaim: true });
          if (laneLine) { s2line = laneLine; s2arm = 'confirm_shape_costume'; }
        }
      } catch (e) { console.warn('[relay:wa confirm-shape]', e && e.message); }
    }
    if (s2line) replyText = s2line;
    // ── F-06.165's RULED ARM (α), NOW MECHANICAL (R-29.32 ⑤) ────────────────
    // Every relay interception patches the costume assistant row IN THE SAME
    // BREATH it ships the honest wire line, through the same one-home core. The
    // founder ran this by hand twice; the habit retires here. Without it Victor
    // reads his own fabrication as history and the chain compounds — four rows
    // deep on 2026-08-11 09:50, each one the premise of the next.
    if (s2line && /relay_lane|confirm_shape_costume/.test(String(s2arm || ''))) {
      try {
        const { patchComposedReply } = require('../api/vendor-engine/chat');
        await patchComposedReply(supabase, { ...effectiveResult, reply: '' }, s2line);
      } catch (e) { console.warn('[relay:wa costume-patch]', e && e.message); }
    }
    // ── F-06.184's CURE · THE DOOR TESTS THE CLAIM ITSELF ────────────────────
    //
    // WHY A SECOND LAYER EXISTS AT ALL. A5 shipped with its replacement gated on
    // `s2line` — on the WIRE GUARD having armed. Walk ten proved that gate is not
    // the same thing as the chair's ruling: the guard PASSED a fabricated send
    // (F-06.183, cured this delivery), so nothing armed, so the replacement never
    // ran, and the founder's screen read 「 Done. Message is out to
    // +918595986978 」 directly above the door's own 「 I haven't sent anything. 」
    //
    // THIS LAYER DEPENDS ON NO LADDER VERDICT. The door already holds the turn's
    // relay outcome — a fact derived from the store — and `RELAY_CLAIM_RE` is a
    // pure predicate it can run on the model's prose itself. Tested against walk
    // ten's exact bytes at the desk: it matches on 「 Message is out 」. So this
    // line alone would have prevented that screen with F-06.183 unfixed, which is
    // the whole argument for it: defence in depth, each layer proven to fire with
    // the other mutated dead.
    //
    // IT CANNOT SILENCE AN HONEST TURN. It requires BOTH a store-derived relay
    // outcome for THIS turn AND a transmission claim in the prose. A vendor turn
    // with no relay outcome is untouched; a relay turn whose prose claims nothing
    // keeps its append, exactly as eight walks have shipped it.
    // ── F-06.189 (α) · THE STRUCTURAL PRIMARY · ON AN ACTED TURN THE DOOR SPEAKS
    //
    // WALK TEN, 14:16:10, on the founder's own handset — one message, two
    // sentences: 「 She has it. 」 (FALSE — a doorbell notification is not the
    // message) directly above ④b-v2 (true). F-06.176's screen a THIRD time, and
    // NEITHER guard malfunctioned: the ladder is class-scoped now, the door tests
    // the claim itself, and both consult the SAME vocabulary — whose limb requires
    // `got` or `received`, so bare possession walked. Probed at the shipped regex:
    //     "She has it."          -> false
    //     "She has got it."      -> true
    //     "She has received it." -> true
    // DEPTH OVER A SHARED PREDICATE IS DEPTH IN IMPLEMENTATION AND NOT IN
    // EVIDENCE. The two layers must differ in KIND, so this one is structural and
    // reads no vocabulary at all.
    //
    // THE RULE: WHEN THE SEAT ACTED, THE DOOR'S LINE STANDS ALONE — full stop. Not
    // 「 acted AND a costume was detected 」, which was A5's gate and is exactly
    // what let tonight through. This is F-06.182's bride-lane law arriving on the
    // vendor lane: when the machinery acted, the model does not narrate the act.
    // The same ruling in a third coat, and the coats are running out.
    //
    // AN ACTED TURN IS ONE WITH A STORE-DERIVED OUTCOME — a staged row, a rung
    // doorbell, a send, a refusal the register holds. The model's prose about that
    // act is never better evidence than the act, so it is never shown beside it.
    // A turn with NO relay outcome is untouched: `relayOut` is null and Victor's
    // reply ships exactly as it has for ten walks.
    if (!relayReplacedCostume && relayOut && relayOut.line) {
      replyText = relayOut.line;
      relayReplacedCostume = true;
      console.log(`[relay:wa] door_line_stands_alone — the seat acted (${relayOut.kind}); the model does not narrate it`);
    }

    // ── F-06.176's SECOND HALF — THE THREAD FOLLOWS THE WIRE ─────────────────
    // The append at the seat already patched the row with Victor's prose plus the
    // relay line. This turn replaced that on the wire, so the row is now the only
    // place the contradiction still lives — and a row Victor reads back next turn
    // is a row that teaches him the costume (F-06.166's whole mechanism). Same
    // one-home core, same replace idiom, awaited so a fast follow-up cannot race
    // the patch it exists to make.
    if (relayReplacedCostume && relayOut && relayOut.line) {
      try {
        const { patchComposedReply } = require('../api/vendor-engine/chat');
        await patchComposedReply(supabase, { ...effectiveResult, reply: '' }, relayOut.line);
        console.log('[relay:wa] costume replaced — wire and thread agree (F-06.176)');
      } catch (e) { console.warn('[relay:wa replace-patch]', e && e.message); }
    }
    // ── THE DELIVERY WITNESS (FORK 3a) — recorded at FORK D'S RESOLUTION POINT, which is
    // exactly here: the retry has decided, `replyText` is final, and `sendWhatsApp` is the
    // next statement. `delivered` is the EXACT bytes in the DELIVERED form (V-W included on
    // this seat), or null when the retry landed the act and nothing was replaced — so a turn
    // the vendor never saw a glitch line for is correctly not reportable. This is the field
    // the REPORT catcher reads; `stage2_delivered` above it is a classification echo and is
    // documented at its own site as never to be read as a witness.
    if (s2run) {
      try {
        const { stage2RecordDelivery } = require('../api/vendor-engine/chat');
        await stage2RecordDelivery(supabase, s2run, { arm: s2arm, delivered: s2line, seat: 'wa' });
      } catch (e) { console.warn('[wire-guard stage2 wa delivery]', e.message); }
    }
    const twilioMsg = await sendWhatsApp(phone, replyText, []);
    // ── F-06.188's STAMP · THE DOOR MARKS ITS OWN CONFIRM ────────────────────
    // `doorAsked` used to decide adjacency by regexing THIS row's body. It now
    // reads this stamp, so a copy change can never move the gate again. The value
    // is reserved and has exactly one writer — this statement — mirroring
    // `vendor_relay`'s precedent, and `messages.sent_by` is free text, so no
    // migration. Only the outcomes that genuinely ASK carry it (① the SHOW frame,
    // ⑨ the re-show), derived by rendering each byte rather than assumed.
    const relayAsked = (() => {
      try { return require('./vendor/relaySeat').relayOutcomeAsks(relayOut); }
      catch (_e) { return false; }
    })();
    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            replyText,
      sent_by:         relayAsked ? require('./vendor/relaySeat').RELAY_CONFIRM_SENT_BY : 'agent',
      twilio_sid:      twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      tool_calls:      toolNames,
    });

    // Message 2+ — each PDF as a SEPARATE media-only message (forwardable; no caption,
    // no URL text — the signed url is only Twilio's mediaUrl, never shown).
    for (const d of invoiceDocs) {
      try {
        const mediaMsg = await sendWhatsApp(phone, '', [d.pdf_url]);
        await supabase.from('messages').insert({
          conversation_id: convo.id,
          direction:       'outbound',
          channel:         'whatsapp',
          body:            `[invoice PDF ${d.invoice_number}]`,
          sent_by:         'agent',
          twilio_sid:      mediaMsg && mediaMsg.sid ? mediaMsg.sid : null,
          media_url:       d.pdf_url,
        });
      } catch (e) { console.error('[whatsapp:invoice-pdf-send]', e.message); }
    }
    return;
  } catch (err) {
    console.error('[webhook/whatsapp] error:', err);
    // TDW_05 P1b: a unique-violation on message_sid means a duplicate slipped past the LRU
    // (cross-process/restart) — that's an idempotent no-op, not a failure. Drop it quietly.
    if (webhookCore.isDuplicateSidError(err)) {
      console.log(`[webhook] duplicate MessageSid ${messageSid} hit the durable index — already processed, dropping`);
      return;
    }
    // Otherwise the turn genuinely threw → dead-letter the full payload and give the user a
    // graceful line (best-effort; never let the dead-letter path mask the original error).
    try {
      await webhookCore.captureDeadLetter({
        supabase, service: 'vendor',
        phone: phone,
        payload: rawPayload, error: err,
      });
      await sendWhatsApp(phone, webhookCore.GRACEFUL_TURN_LINE);
    } catch (dlErr) {
      console.error('[webhook/whatsapp] dead-letter path error:', dlErr && dlErr.message);
    }
    return;
  }
}

// ── Input normalizer (M2b: Meta is the only transport; twilioInputsFrom deleted) ──────
// Meta media (TDW_05 MEDIA-SHIM, Shape A): media arrives as a media-ID; the caller resolves it
// via resolveVendorMedia (below) into a STABLE public url and passes it in as `resolvedMedia`.
// When resolvedMedia is absent (no media, or resolve failed -> text-only failure shape), mediaUrl
// stays null and the turn proceeds exactly as the text-only path. `from` is normalized to +E164
// (the DB canonical, inherited from the Twilio era) so vendor/user lookups + reply target match.
function metaInputsFrom(msg, rawBody, resolvedMedia) {
  const trimmedBody = (msg.text || '').trim();
  const media       = Array.isArray(msg.media) ? msg.media : [];
  const phone = msg.from ? (String(msg.from).startsWith('+') ? String(msg.from) : '+' + String(msg.from)) : null;
  return {
    phone,
    body:           msg.text || '',
    profileName:    null,
    messageSid:     msg.messageId,   // wamid -> durable message_sid dedupe home
    internalReplay: false,
    trimmedBody, numMedia: media.length, hasMedia: media.length > 0,
    mediaUrl:       (resolvedMedia && resolvedMedia.stableUrl) || null,
    rawPayload:     rawBody,
  };
}

// ── Vendor media adapter (TDW_05 MEDIA-SHIM) ──────────────────────────────────────────
// Lane policy for the vendor OCR/media path. The resolver (src/lib/metaMedia.js) is
// lane-agnostic; THIS is where the vendor lane's allowlist + cap live. Returns
// { stableUrl, mime } on success, or null on ANY failure (-> text-only path, typed log,
// never a dead turn). The token is env-read here and NEVER logged.
const VENDOR_MEDIA_ALLOW_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // sticker -> image/webp passes
const VENDOR_MEDIA_MAX_BYTES   = 5 * 1024 * 1024; // 5 MB — WhatsApp image ceiling AND Anthropic Vision per-image limit
const WA_MEDIA_BUCKET          = 'wa-media';       // PUBLIC bucket; unguessable object paths (see metaMedia.js)

async function resolveVendorMedia(mediaItem, deps) {
  const { resolveMetaMedia, supabase } = deps;
  if (!mediaItem || !mediaItem.id) return null;
  try {
    const { stableUrl, mime } = await resolveMetaMedia({
      mediaId:    mediaItem.id,
      mime:       mediaItem.mime,
      token:      process.env.META_WABA_TOKEN,
      supabase,
      bucket:     WA_MEDIA_BUCKET,
      allowMimes: VENDOR_MEDIA_ALLOW_MIMES,
      maxBytes:   VENDOR_MEDIA_MAX_BYTES,
    });
    return { stableUrl, mime };
  } catch (e) {
    console.log(`[meta-media] resolve failed reason=${e.message} mediaId=${mediaItem.id}`);
    return null;
  }
}

module.exports = {
  processVendorInbound, metaInputsFrom, stripRoutingToken, // stripRoutingToken: BLOCK 06 M-0 / F-05.60 — exported so the bench drives the shipped function, never a copy (Q-SP-5)
  scrubModelFrame,                                         // BLOCK 06 M-3 / F-06.17+F-06.29 — same reason, same law
  resolveVendorMedia, WA_MEDIA_BUCKET, VENDOR_MEDIA_ALLOW_MIMES, VENDOR_MEDIA_MAX_BYTES,
};
