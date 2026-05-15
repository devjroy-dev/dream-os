// dream-os backend -- entry point
// Session 5: three-mode couple routing
// Session 5.5: couple-facing agent on Mode 1 + Mode 2

const express      = require('express');
const ws           = require('ws');
const cookieParser = require('cookie-parser');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runAgenticTurn, runCoupleAgenticTurn } = require('./agent/engine');
const { buildBriefing } = require('./agent/briefing');
const { startCronJobs } = require('./cron');
const { sendWhatsApp } = require('./lib/whatsapp');
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
  res.json({ status: 'alive', service: 'dream-os', version: '0.6.0' });
});

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const fromRaw     = req.body.From || '';
    const phone       = fromRaw.replace('whatsapp:', '');
    const body        = req.body.Body || '';
    const profileName = req.body.ProfileName || null;

    console.log(`[whatsapp:in] ${phone} -> ${body}`);

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
      // ── Couple routing — three modes ──────────────────────────────

      // MODE 1 -- Returning couple: already has a thread with a vendor
      const { data: existingThread } = await supabase
        .from('conversations')
        .select('*, vendors(*)')
        .eq('counterparty_phone', phone)
        .eq('kind', 'couple_thread')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingThread) {
        console.log(`[routing:mode1] returning couple ${phone} -> vendor ${existingThread.vendor_id}`);

        // Log inbound message
        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        });

        // Load vendor user for notification
        const { data: vendorUser } = await supabase
          .from('users').select('*').eq('id', existingThread.vendors.user_id).maybeSingle();

        // Run couple agent
        const result = await runCoupleAgenticTurn({
          vendor: existingThread.vendors,
          vendorUser,
          conversation: existingThread,
          couplePhone: phone,
          inboundMessage: body,
          supabase,
          anthropic,
        });

        // Send agent reply to couple
        const twilioMsg = await sendWhatsApp(phone, result.reply);

        // Log outbound message
        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        // Send vendor notification if lead was captured
        if (result.vendorNotification && vendorUser?.phone) {
          await sendWhatsApp(vendorUser.phone, result.vendorNotification);
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', existingThread.id);

        return res.status(200).send('<Response/>');
      }

      // MODE 2 -- TDW code: first word matches a vendor routing_handle
      const firstWord = body.trim().split(/\s+/)[0].toUpperCase();
      const handle    = firstWord.startsWith('TDW-') ? firstWord.slice(4) : firstWord;

      const { data: matchedVendor } = await supabase
        .from('vendors')
        .select('*, users(*)')
        .eq('routing_handle', handle)
        .maybeSingle();

      if (matchedVendor) {
        console.log(`[routing:mode2] TDW code ${handle} -> vendor ${matchedVendor.id}`);

        const vendorUser = matchedVendor.users;

        // Create couple thread
        const { data: coupleThread } = await supabase
          .from('conversations')
          .insert({
            vendor_id: matchedVendor.id,
            counterparty_phone: phone,
            kind: 'couple_thread',
            state: 'new',
            mode: 'auto',
          })
          .select()
          .single();

        // Log inbound message
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
          .eq('vendor_id', matchedVendor.id)
          .eq('phone', phone)
          .maybeSingle();

        if (!existingLead) {
          await supabase.from('leads').insert({
            vendor_id:   matchedVendor.id,
            phone,
            source:      'whatsapp',
            raw_message: body,
            state:       'new',
          });
        }

        // Run couple agent -- will reply to couple and collect details
        const result = await runCoupleAgenticTurn({
          vendor: matchedVendor,
          vendorUser,
          conversation: coupleThread,
          couplePhone: phone,
          inboundMessage: body,
          supabase,
          anthropic,
        });

        // Send agent reply to couple
        const twilioMsg = await sendWhatsApp(phone, result.reply);

        // Log outbound message
        await supabase.from('messages').insert({
          conversation_id: coupleThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        // Send vendor notification if lead was captured, else send basic notification
        const vendorPhone = vendorUser?.phone;
        if (vendorPhone) {
          const notif = result.vendorNotification
            || `New enquiry via your TDW link from ${phone}. I'm collecting their details now.`;
          await sendWhatsApp(vendorPhone, notif);
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', coupleThread.id);

        return res.status(200).send('<Response/>');
      }

      // MODE 3 -- Fallback
      console.log(`[routing:mode3] no match for ${phone}, body: "${body.slice(0, 40)}"`);
      await sendWhatsApp(phone,
        `Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared.`
      );
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
  startCronJobs({ supabase });
});
