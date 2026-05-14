// dream-os backend — entry point
// Session 2: WhatsApp inbound → agentic loop → intelligent reply

const express = require('express');
const twilio = require('twilio');
const ws = require('ws');
const Anthropic = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runAgenticTurn } = require('./agent/engine');

// ─── Environment ───────────────────────────────────────────────
const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWILIO_ACCOUNT_SID         = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN          = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER     = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const ANTHROPIC_API_KEY          = process.env.ANTHROPIC_API_KEY;

// ─── Clients ───────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'alive', service: 'dream-os', version: '0.2.0' });
});

// ─── WhatsApp inbound webhook ──────────────────────────────────
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const fromRaw     = req.body.From || '';
    const phone       = fromRaw.replace('whatsapp:', '');
    const body        = req.body.Body || '';
    const profileName = req.body.ProfileName || null;

    console.log(`[whatsapp:in] ${phone} → ${body}`);

    // 1. Identify or create user
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

    // 2. Find vendor profile
    const { data: vendor } = await supabase
      .from('vendors').select('*').eq('user_id', user.id).maybeSingle();

    if (!vendor) {
      await sendWhatsApp(phone, "Hi! Dream OS doesn't recognize this number yet. Vendor onboarding coming soon.");
      return res.status(200).send('<Response/>');
    }

    // 3. Find or create vendor's self-conversation
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

    // 4. Persist inbound message
    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'inbound',
      channel: 'whatsapp',
      body,
      sent_by: 'vendor',
    });

    // 5. Run the agentic turn
    const result = await runAgenticTurn({
      vendor,
      conversation: convo,
      inboundMessage: body,
      supabase,
      anthropic,
    });

    console.log(`[agent] reply: "${result.reply.slice(0, 80)}..."  (${result.iterations} iter, ${result.toolCalls.length} tool calls)`);

    // 6. Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convo.id);

    // 7. Send reply via WhatsApp
    const twilioMsg = await sendWhatsApp(phone, result.reply);

    // 8. Persist outbound message + tool call audit
    await supabase.from('messages').insert({
      conversation_id: convo.id,
      direction: 'outbound',
      channel: 'whatsapp',
      body: result.reply,
      sent_by: 'agent',
      twilio_sid: twilioMsg.sid,
      tool_calls: result.toolCalls,
    });

    res.status(200).send('<Response/>');
  } catch (err) {
    console.error('[webhook/whatsapp] error:', err);
    res.status(500).send('error');
  }
});

async function sendWhatsApp(toPhone, body) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const msg = await twilioClient.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to,
    body,
  });
  console.log(`[whatsapp:out] ${to} ← ${body.slice(0, 60)} (${msg.sid})`);
  return msg;
}

app.listen(PORT, () => {
  console.log(`[dream-os] listening on :${PORT}`);
});
