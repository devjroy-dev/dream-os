// dream-os backend -- entry point
// Session 5: three-mode couple routing
// Session 5.5: couple-facing agent on Mode 1 + Mode 2

const express      = require('express');
const ws           = require('ws');
const twilio       = require('twilio');
const cookieParser = require('cookie-parser');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runAgenticTurn, runCoupleAgenticTurn } = require('./agent/engine');
const { buildBriefing } = require('./agent/briefing');
const { startCronJobs } = require('./cron');
const { sendWhatsApp } = require('./lib/whatsapp');
const { buildDisambiguationQuestion, interpretDisambiguationReply, vendorDisplayName } = require('./agent/disambiguation');
const adminRouter  = require('./admin/router');

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TDW_WA_NUMBER              = process.env.TDW_WA_NUMBER || '14787788550';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.locals.supabase = supabase;

// ── Briefing test endpoint (manual trigger, no WhatsApp send) ──────
// Usage: GET /admin/test-briefing/:vendorId
// Returns the briefing message that would be sent, or the skip reason.
app.get('/admin/test-briefing/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;

    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .maybeSingle();

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', vendor.user_id)
      .maybeSingle();

    const result = await buildBriefing({ vendor, user, supabase });

    res.json({
      vendor_id: vendorId,
      vendor_name: user?.name || 'unknown',
      ...result,
    });
  } catch (err) {
    console.error('[test-briefing] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Twilio status callback ──────────────────────────────────────────
// Twilio POSTs here on every delivery state change for outbound WhatsApp messages.
// We match on MessageSid and update messages.delivery_status.
app.post('/webhook/twilio-status', async (req, res) => {
  try {
    const sid    = req.body.MessageSid    || req.body.SmsSid    || null;
    const status = req.body.MessageStatus || req.body.SmsStatus || null;
    const errCode = req.body.ErrorCode || null;

    console.log(`[twilio-status] sid=${sid} status=${status}${errCode ? ` errCode=${errCode}` : ''}`);

    if (!sid || !status) {
      return res.status(200).send('ok');
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ delivery_status: status })
      .eq('twilio_sid', sid)
      .select('id');

    if (error) {
      console.error('[twilio-status] db update error:', error);
    } else if (!data || data.length === 0) {
      console.log(`[twilio-status] no message row for sid=${sid} (callback ignored)`);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('[twilio-status] handler error:', err);
    res.status(200).send('ok');
  }
});

app.use('/admin', adminRouter);

app.get('/', (req, res) => {
  const { version } = require('../package.json');
  res.json({ status: 'alive', service: 'dream-os', version });
});

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const fromRaw     = req.body.From || '';
    const phone       = fromRaw.replace('whatsapp:', '');
    const body        = req.body.Body || '';
    const profileName = req.body.ProfileName || null;

    console.log(`[whatsapp:in] ${phone} -> ${body}`);

    // ── Twilio signature verification ─────────────────────────────────
    if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK !== 'true') {
      const twilioSignature = req.headers['x-twilio-signature'] || '';
      const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        webhookUrl,
        req.body,
      );
      if (!isValid) {
        console.warn(`[webhook] invalid Twilio signature from ${phone}, url=${webhookUrl}`);
        return res.status(403).send('Forbidden');
      }
    }

    // ── Media-only / empty-body guard ──────────────────────────────
    const trimmedBody = body.trim();
    const numMedia    = parseInt(req.body.NumMedia || '0', 10);
    const hasMedia    = numMedia > 0 || !!req.body.MediaUrl0;

    if (!trimmedBody && hasMedia) {
      console.log(`[webhook] media-only message from ${req.body.From}, replying with text-only notice`);
      await sendWhatsApp(phone, "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help.");
      return res.status(200).send('<Response></Response>');
    }
    if (!trimmedBody && !hasMedia) {
      console.warn('[webhook] empty body, no media, dropping');
      return res.status(200).send('<Response></Response>');
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
            return res.status(200).send('<Response/>');
          }

          // Unclear or low confidence — ask one more time with the same vendors
          await sendWhatsApp(phone,
            `Sorry, didn't catch that — ${buildDisambiguationQuestion(candidateVendors || []).replace(/^Hi! /, '')}`
          );
          console.log(`[routing:disambiguation_unclear] ${phone} reply="${body.slice(0, 40)}"`);
          return res.status(200).send('<Response/>');
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

          return res.status(200).send('<Response/>');
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

        // Create initial lead (deduped on vendor_id + phone)
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('vendor_id', matchedByTdw.id)
          .eq('phone', phone)
          .maybeSingle();

        if (!existingLead) {
          await supabase.from('leads').insert({
            vendor_id:   matchedByTdw.id,
            phone,
            source:      'whatsapp',
            raw_message: body,
            state:       'new',
          });
        }

        const result = await runCoupleAgenticTurn({
          vendor: matchedByTdw,
          vendorUser,
          conversation: coupleThread,
          couplePhone: phone,
          inboundMessage: body,
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
        if (vendorPhone) {
          const notif = result.vendorNotification
            || `New enquiry via your TDW link from ${phone}. I'm collecting their details now.`;
          await sendWhatsApp(vendorPhone, notif);
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

        return res.status(200).send('<Response/>');
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
          return res.status(200).send('<Response/>');
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
        return res.status(200).send('<Response/>');
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

        return res.status(200).send('<Response/>');
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
      return res.status(200).send('<Response/>');
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

    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'inbound',
      channel: 'whatsapp',
      body,
      sent_by: 'vendor',
    });

    const result = await runAgenticTurn({
      vendor,
      user,
      conversation: convo,
      inboundMessage: body,
      supabase,
      anthropic,
    });

    console.log(`[agent] reply: "${result.reply.slice(0, 80)}..."  (${result.iterations} iter, ${result.toolCalls.length} tool calls)`);

    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convo.id);

    const twilioMsg = await sendWhatsApp(phone, result.reply);

    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            result.reply,
      sent_by:         'agent',
      twilio_sid:      twilioMsg.sid,
      tool_calls:      result.toolCalls,
      model:           result.model        ?? null,
      input_tokens:    result.inputTokens  ?? null,
      output_tokens:   result.outputTokens ?? null,
      cost_usd:        result.costUsd      ?? null,
      cost_inr:        result.costInr      ?? null,
    });

    res.status(200).send('<Response/>');
  } catch (err) {
    console.error('[webhook/whatsapp] error:', err);
    res.status(500).send('error');
  }
});

app.listen(PORT, () => {
  console.log(`[dream-os] listening on :${PORT}`);
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK === 'true') {
    console.warn('[dream-os] WARNING: DISABLE_TWILIO_SIGNATURE_CHECK=true — Twilio webhook signature verification is OFF. Do not run in production with this flag set.');
  }
  startCronJobs({ supabase });
});
