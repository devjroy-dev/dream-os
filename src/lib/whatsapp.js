// src/lib/whatsapp.js — shared Twilio WhatsApp sender
// Used by webhook handlers (src/index.js, src/brideIndex.js) and the morning
// briefing cron (src/cron.js).
//
// B2: added optional mediaUrls parameter for outbound media (e.g. agent
// sends an image back to the bride when she asks "show me save 47").
// Existing callers continue to work — mediaUrls defaults to empty array,
// no media is attached when not specified.
//
// Block 05 P2: added optional `from` parameter so sendWa can resolve the FROM
// number per line (bride/vendor/marketing). It defaults to TWILIO_WHATSAPP_NUMBER —
// existing callers pass three args or fewer and are therefore byte-identical: same
// FROM, same params, same log line. The value is normalized to Twilio's
// `whatsapp:+E164` form exactly as `to` already is.

const twilio = require('twilio');

const TWILIO_ACCOUNT_SID     = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN      = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14787788550';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// sendWhatsApp(toPhone, body, mediaUrls?, from?)
//
// toPhone   : string  — recipient phone in E.164 or whatsapp:E.164 form
// body      : string  — message text (can be empty if mediaUrls provided)
// mediaUrls : string[] — optional. Public URLs of images to attach. Max 10
//                        per Twilio. For Muse playback we typically send 1.
// from      : string  — optional. Sender in E.164 or whatsapp:E.164 form.
//                        Defaults to TWILIO_WHATSAPP_NUMBER (unchanged behavior).

async function sendWhatsApp(toPhone, body, mediaUrls = [], from = TWILIO_WHATSAPP_NUMBER) {
  const to        = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const fromAddr  = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  const params = {
    from: fromAddr,
    to,
    body,
  };

  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
    // Twilio's mediaUrl param accepts a single string or an array. Pass array
    // for forward compatibility (multi-image future use). Truncate to 10 —
    // Twilio's hard limit per message.
    params.mediaUrl = mediaUrls.slice(0, 10);
  }

  const msg = await twilioClient.messages.create(params);
  const mediaCount = params.mediaUrl ? params.mediaUrl.length : 0;
  console.log(`[whatsapp:out] ${to} <- ${body.slice(0, 60)}${mediaCount ? ` [+${mediaCount} media]` : ''} (${msg.sid})`);
  return msg;
}

module.exports = { sendWhatsApp };
