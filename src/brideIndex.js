// brideIndex.js — bride webhook server, Railway service "dream-wedding"
//
// Entry point for inbound WhatsApp messages from brides on +14787788550.
// Twilio POSTs to /webhook/whatsapp; this file routes through the gate,
// logs the message, runs the engine, and sends the reply.
//
// Mirrors src/index.js (vendor service) in shape but stripped down:
//   - No TDW codes
//   - No disambiguation
//   - No draft / manual modes
//   - No couple_thread vs vendor_self distinction
//   - No cron jobs (morning nudge arrives at B3)
//   - No admin router on this service — admin lives on vendor service for now
//
// Phone-as-gate: phone in users + couples row exists → engine runs.
// No couples row → dead-end reply.

const express      = require('express');
const ws           = require('ws');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runBrideAgenticTurn } = require('./agent/brideEngine');
const { sendWhatsApp } = require('./lib/whatsapp');

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEAD_END_REPLY = "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.locals.supabase = supabase;

// ── Health check ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const { version } = require('../package.json');
  res.json({ status: 'alive', service: 'dream-wedding', version });
});

// ── Twilio status callback ───────────────────────────────────────────
// Twilio POSTs here on every delivery state change for outbound WhatsApp messages.
// We match on MessageSid and update messages.delivery_status.
// Mirrors vendor src/index.js handler line-for-line.
app.post('/webhook/twilio-status', async (req, res) => {
  try {
    const sid     = req.body.MessageSid    || req.body.SmsSid    || null;
    const status  = req.body.MessageStatus || req.body.SmsStatus || null;
    const errCode = req.body.ErrorCode || null;

    console.log(`[bride-twilio-status] sid=${sid} status=${status}${errCode ? ` errCode=${errCode}` : ''}`);

    if (!sid || !status) {
      return res.status(200).send('ok');
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ delivery_status: status })
      .eq('twilio_sid', sid)
      .select('id');

    if (error) {
      console.error('[bride-twilio-status] db update error:', error);
    } else if (!data || data.length === 0) {
      console.log(`[bride-twilio-status] no message row for sid=${sid} (callback ignored)`);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('[bride-twilio-status] handler error:', err);
    res.status(200).send('ok');
  }
});

// ── Inbound WhatsApp webhook ─────────────────────────────────────────
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const fromRaw     = req.body.From || '';
    const phone       = fromRaw.replace('whatsapp:', '');
    const body        = req.body.Body || '';
    const profileName = req.body.ProfileName || null;
    const twilioSid   = req.body.MessageSid || null;

    console.log(`[bride-whatsapp:in] ${phone} -> ${body}`);

    // ── Media-only / empty-body guard (mirrors vendor Bug #1 fix) ───
    const trimmedBody = body.trim();
    const numMedia    = parseInt(req.body.NumMedia || '0', 10);
    const hasMedia    = numMedia > 0 || !!req.body.MediaUrl0;

    if (!trimmedBody && hasMedia) {
      console.log(`[bride-webhook] media-only message from ${phone}, replying with text-only notice`);
      await sendWhatsApp(phone, "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help.");
      return res.status(200).send('<Response></Response>');
    }
    if (!trimmedBody && !hasMedia) {
      console.warn('[bride-webhook] empty body, no media, dropping');
      return res.status(200).send('<Response></Response>');
    }

    // ── Phone-as-gate: must already exist in users + couples ────────
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!user) {
      console.log(`[bride-webhook] no user for ${phone} — dead-end reply`);
      await sendWhatsApp(phone, DEAD_END_REPLY);
      return res.status(200).send('<Response></Response>');
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!couple) {
      console.log(`[bride-webhook] user ${user.id} has no couples row — dead-end reply`);
      await sendWhatsApp(phone, DEAD_END_REPLY);
      return res.status(200).send('<Response></Response>');
    }

    // Backfill the user's profile name if Twilio sent one and we don't have it yet
    if (profileName && !user.name) {
      await supabase.from('users').update({ name: profileName }).eq('id', user.id);
      user.name = profileName;
    }

    // ── Ensure conversation row exists (kind = couple_self) ─────────
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('couple_id', couple.id)
      .eq('kind', 'couple_self')
      .maybeSingle();

    if (!conversation) {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          couple_id:            couple.id,
          counterparty_phone:   phone,
          counterparty_user_id: user.id,
          kind:                 'couple_self',
          state:                'new',
          mode:                 'auto',
          last_message_at:      new Date().toISOString(),
        })
        .select()
        .single();
      if (convoError) throw convoError;
      conversation = newConvo;
    }

    // ── Log inbound message ─────────────────────────────────────────
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'whatsapp',
      body:            trimmedBody,
      sent_by:         'couple',
      twilio_sid:      twilioSid,
    });

    // Bump last_message_at on the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // ── Run the engine ──────────────────────────────────────────────
    const result = await runBrideAgenticTurn({
      couple,
      user,
      conversation,
      inboundMessage: trimmedBody,
      supabase,
      anthropic,
    });

    // ── Send the reply via Twilio ───────────────────────────────────
    let twilioMsg = null;
    try {
      twilioMsg = await sendWhatsApp(phone, result.reply);
    } catch (sendErr) {
      console.error('[bride-webhook] sendWhatsApp error:', sendErr);
      // Continue to log the outbound message even if Twilio errored —
      // we want the audit trail. delivery_status will get 'failed' on callback.
    }

    // ── Log outbound message with full cost tracking ────────────────
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            result.reply,
      sent_by:         'agent',
      twilio_sid:      twilioMsg?.sid ?? null,
      tool_calls:      result.toolCalls,
      model:           result.model        ?? null,
      input_tokens:    result.inputTokens  ?? null,
      output_tokens:   result.outputTokens ?? null,
      cost_usd:        result.costUsd      ?? null,
      cost_inr:        result.costInr      ?? null,
    });

    return res.status(200).send('<Response></Response>');
  } catch (err) {
    console.error('[bride-webhook] error:', err);
    return res.status(500).send('error');
  }
});

app.listen(PORT, () => {
  console.log(`[dream-wedding] listening on :${PORT}`);
});
