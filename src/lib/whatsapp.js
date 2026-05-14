// src/lib/whatsapp.js — shared Twilio WhatsApp sender
// Used by webhook handlers (src/index.js) and the morning briefing cron (src/cron.js)

const twilio = require('twilio');

const TWILIO_ACCOUNT_SID     = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN      = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function sendWhatsApp(toPhone, body) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const msg = await twilioClient.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to,
    body,
  });
  console.log(`[whatsapp:out] ${to} <- ${body.slice(0, 60)} (${msg.sid})`);
  return msg;
}

module.exports = { sendWhatsApp };
