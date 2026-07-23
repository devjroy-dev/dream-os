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

const { matchNudgeWord, setNudgeOptout } = require('./nudgeOptout');   // TDW_05 P4 / F-05.22
const { getNudgeCopy } = require('./nudgeCopy');

async function processVendorInbound(inputs, deps) {
  const {
    phone, body, profileName, messageSid, internalReplay,
    trimmedBody, numMedia, hasMedia, mediaUrl, rawPayload,
  } = inputs;
  const {
    runCoupleAgenticTurn, sendWhatsApp, generateInvoiceForBinder, enquiryToBinder,
    ensureCoupleRow, captureField, buildDisambiguationQuestion, interpretDisambiguationReply,
    vendorDisplayName, resolveAgentForVendor, runTurn, fetchCalendarSnapshot, fetchScratchpad,
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
          await sendWhatsApp(phone, getNudgeCopy('opt_out_confirmation'));
          console.log(`[webhook] nudge-class OPT-OUT recorded for ${phone} (lane=${lane})`);
        } else {
          await setNudgeOptout({ supabase, phone, lane, state: 'resumed', source: 'inbound_stop_mornings' });
          await sendWhatsApp(phone, getNudgeCopy('resume_confirmation'));
          console.log(`[webhook] nudge-class RESUME recorded for ${phone} (lane=${lane})`);
        }
      } catch (nudgeErr) {
        // Never let this branch swallow the turn silently. The write is attempted first,
        // so a failure here is most often the confirmation send — logged, not hidden.
        console.error('[webhook] nudge-class branch error:', nudgeErr && nudgeErr.message);
      }
      return;
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

        // IST today for date inference inside the Vision prompt
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istToday = new Date(Date.now() + istOffsetMs).toISOString().split('T')[0];

        const caption = trimmedBody.length > 0 ? trimmedBody : null;
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

        // Log inbound + outbound to vendor_self for audit + agent history
        const { data: vendorSelfConvo } = await supabase
          .from('conversations')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('kind', 'vendor_self')
          .maybeSingle();
        if (vendorSelfConvo) {
          await supabase.from('messages').insert([
            {
              conversation_id: vendorSelfConvo.id,
              direction: 'inbound',
              channel:   'whatsapp',
              body:      caption || '[calendar image]',
              sent_by:   'vendor',
              media_url: mediaUrl,
            },
            {
              conversation_id: vendorSelfConvo.id,
              direction: 'outbound',
              channel:   'whatsapp',
              body:      previewMsg,
              sent_by:   'agent',
              twilio_sid: sent && sent.sid ? sent.sid : null,
            },
          ]);
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

            // Log the original message as the actual inbound (we deferred it earlier)
            await supabase.from('messages').insert({
              conversation_id: thread.id,
              direction: 'inbound',
              channel: 'whatsapp',
              body: originalMessage,
              sent_by: 'couple',
            });

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
              await sendWhatsApp(vendorUser.phone, result.vendorNotification);
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

          await supabase.from('messages').insert({
            conversation_id: stickyThread.id,
            direction: 'inbound',
            channel: 'whatsapp',
            body,
            sent_by: 'couple',
          });

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
            await sendWhatsApp(vendorUser.phone, result.vendorNotification);
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

        await supabase.from('messages').insert({
          conversation_id: coupleThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        });

        // 5-B-2 — land the enquiry in the engine cabinet (was a public.leads insert).
        // enquiryToBinder dedups by phone and opens the binder as a lead; the
        // post-agent call below enriches its note with the vendor summary. The
        // marketplace is just another caller.
        await enquiryToBinder(supabase, matchedByTdw.id, {
          phone,
          note: `Enquiry via your TDW link. First message: ${body}`,
        });

        const result = await runCoupleAgenticTurn({
          vendor: matchedByTdw,
          vendorUser,
          conversation: coupleThread,
          couplePhone: phone,
          coupleId: brideCoupleId,
          inboundMessage: firstWord.startsWith('TDW-') ? 'hi' : body,
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
        const notif = result.vendorNotification
          || `New enquiry via your TDW link from ${phone}. I'm collecting their details now.`;

        if (vendorPhone) {
          await sendWhatsApp(vendorPhone, notif);
        }

        // Enrich the engine binder's note with the vendor summary (dedup -> note_append).
        if (result.vendorNotification) {
          await enquiryToBinder(supabase, matchedByTdw.id, {
            phone,
            note: result.vendorNotification,
          });
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

      // ── Step C: Count existing couple_threads ─────────────────────
      const { data: existingThreads } = await supabase
        .from('conversations')
        .select('*, vendors(id, business_name, category, users(name))')
        .eq('counterparty_phone', phone)
        .eq('kind', 'couple_thread')
        .order('last_message_at', { ascending: false, nullsFirst: false });

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

        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        });

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
          await sendWhatsApp(vendorUser.phone, result.vendorNotification);
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
    // Same turn inputs the web door feeds: upcoming calendar (so Victor can reference
    // bookings to edit/cancel) + the owner's scratchpad. Without these he is blind to both.
    const calendarSnapshot = await fetchCalendarSnapshot(supabase, vendor.id, vendor.category);
    const scratchpad = await fetchScratchpad(supabase, vendor.id);
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
    const result = await runTurn({
      agentId, message: body, calendarSnapshot, scratchpad,
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
    let replyText = result.reply;
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
    const twilioMsg = await sendWhatsApp(phone, replyText, []);
    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            replyText,
      sent_by:         'agent',
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
  processVendorInbound, metaInputsFrom,
  resolveVendorMedia, WA_MEDIA_BUCKET, VENDOR_MEDIA_ALLOW_MIMES, VENDOR_MEDIA_MAX_BYTES,
};
