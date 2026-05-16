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
//
// B2: media auto-save to Muse.
//   - Inbound image (Twilio MediaUrl0) → saveToMuse pipeline runs BEFORE the agent
//   - Inbound text containing Pinterest/Instagram URL → URL extracted, treated as link save
//   - Saves happen in brideIndex.js, not via a tool, so the agent always
//     receives a synthesized text + mediaContext. The agent composes a natural
//     reply. The agent NEVER calls save_to_muse — that tool does not exist.

const express      = require('express');
const ws           = require('ws');
const twilio       = require('twilio');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runBrideAgenticTurn } = require('./agent/brideEngine');
const { sendWhatsApp } = require('./lib/whatsapp');
const { saveToMuse }   = require('./lib/museSave');

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEAD_END_REPLY = "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.locals.supabase = supabase;

// ── URL detection for Pinterest / Instagram in message body ──────────
// Matches:
//   https://pinterest.com/pin/...
//   https://www.pinterest.com/pin/...
//   https://pin.it/...
//   https://www.instagram.com/p/...
//   https://www.instagram.com/reel/...
//   https://instagr.am/p/...
// First match wins (we save the first detected link, agent handles the rest
// in conversation).
//
// Tail character class excludes trailing punctuation/quotes that users often
// append in messages ("Love this https://pin.it/abc!"). [^\s.,!?;:'"<>] keeps
// matching until whitespace or one of those punctuation chars — preventing
// the dot/comma/bang from being pulled into the URL itself.
const LINK_REGEX = /\bhttps?:\/\/(?:www\.|m\.)?(?:pinterest\.[a-z]{2,6}(?:\.[a-z]{2})?\/(?:pin\/|search\/)|pin\.it\/|instagram\.com\/(?:p|reel|tv)\/|instagr\.am\/(?:p|reel)\/)[^\s.,!?;:'"<>]+/i;

function extractMuseUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(LINK_REGEX);
  if (!match) return null;
  // Belt and braces: strip any trailing punctuation the regex somehow let through.
  // Handles edge cases like Pinterest URLs that legitimately end with a slash
  // followed by punctuation — keeps the slash, drops the punctuation.
  return match[0].replace(/[.,!?;:'")\]}>]+$/, '');
}

// ── Synthesize a mediaContext note for the agent ─────────────────────
// Called after a successful Muse save. The note is injected into the agent's
// dynamic context so it knows what just happened and can reply naturally.
//
// The agent NEVER sees raw URLs or pipeline internals — just the human
// summary: what kind of save, what tags, what caption.
function buildMediaContextNote(save, saved_by_label) {
  const tagsString = save.aesthetic_tags && save.aesthetic_tags.length > 0
    ? save.aesthetic_tags.join(', ')
    : 'no aesthetic tags';
  const captionString = save.caption ? ` Caption: "${save.caption}".` : '';
  const sourceKind = save.source_type === 'link' ? 'link' : 'image';
  return [
    `[SYSTEM NOTE] ${saved_by_label} just forwarded a ${sourceKind} and it was automatically saved to the bride's Muse as save ${save.save_number}.`,
    `Aesthetic tags: ${tagsString}.${captionString}`,
    `Compose a natural reply acknowledging the save — do NOT call any save tool. The save already happened. Stay in BFF voice. Don't list the tags robotically; reference them lightly if relevant. If the caption is rich enough, you can engage with it.`,
  ].join(' ');
}

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
        console.warn(`[bride-webhook] invalid Twilio signature from ${phone}, url=${webhookUrl}`);
        return res.status(403).send('Forbidden');
      }
    }

    const trimmedBody = body.trim();
    const numMedia    = parseInt(req.body.NumMedia || '0', 10);
    const hasMedia    = numMedia > 0 || !!req.body.MediaUrl0;

    // Empty payload — drop silently.
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

    // ── Detect Muse trigger BEFORE running the engine ───────────────
    // Two sources:
    //   (1) Inbound image attachment (Twilio MediaUrl0, media-type image/*)
    //   (2) Pinterest or Instagram URL inside the text body
    //
    // If detected, run the saveToMuse pipeline. On success, synthesize a
    // mediaContext note for the agent so it can compose a natural reply.
    // On pipeline failure, the agent still runs but gets a soft-failure note
    // so it can reply gracefully (Option (a) per Step 4 planning).
    let mediaContextNote = null;
    let mediaSaveAttempted = false;
    let mediaSaveSucceeded = false;

    // Determine the source URL: image media wins over URL in body text.
    let sourceUrlForMuse = null;
    let sourceCaption    = trimmedBody || null;

    if (hasMedia && (req.body.MediaContentType0 || '').toLowerCase().startsWith('image/')) {
      sourceUrlForMuse = req.body.MediaUrl0;
      // The bride's caption is whatever text she sent alongside the image (may be empty).
    } else {
      const linkInBody = extractMuseUrl(trimmedBody);
      if (linkInBody) {
        sourceUrlForMuse = linkInBody;
        // The caption is the rest of the message minus the URL.
        // Strip the URL out of the body and collapse any double-spaces it leaves behind
        const captionWithoutUrl = trimmedBody.replace(linkInBody, '').replace(/\s+/g, ' ').trim();
        sourceCaption = captionWithoutUrl.length > 0 ? captionWithoutUrl : null;
      }
    }

    if (sourceUrlForMuse) {
      mediaSaveAttempted = true;
      const saveResult = await saveToMuse({
        sourceUrl:         sourceUrlForMuse,
        couple_id:         couple.id,
        saved_by_user_id:  user.id,
        saved_by_role:     'bride',   // Step 5 will extend to circle_member
        caption:           sourceCaption,
        supabase,
        anthropic,
      });

      if (saveResult.ok) {
        mediaSaveSucceeded = true;
        mediaContextNote = buildMediaContextNote(saveResult.save, 'The bride');
        console.log(`[bride-webhook] muse save succeeded: #${saveResult.save.save_number}`);
      } else {
        // Soft failure: agent gets a note about the failed save and replies with a
        // friendly retry message. The save itself is not retried automatically.
        mediaContextNote = `[SYSTEM NOTE] The bride forwarded an image or link, but the Muse save pipeline failed (${saveResult.error}). Apologise briefly in BFF voice and suggest she resend in a minute. Do NOT pretend the save happened.`;
        console.warn(`[bride-webhook] muse save failed: ${saveResult.error}`);
      }
    }

    // ── Log inbound message ─────────────────────────────────────────
    // Body text is logged as-is. If the inbound was image-only or media-only,
    // synthesize a clear body string so conversation history stays coherent
    // and the agent reading the audit trail later isn't confused.
    let bodyForLog;
    if (trimmedBody.length > 0) {
      bodyForLog = trimmedBody;
    } else if (mediaSaveSucceeded) {
      bodyForLog = '[forwarded an image]';
    } else if (mediaSaveAttempted) {
      bodyForLog = '[forwarded an image — save failed]';
    } else if (hasMedia) {
      // Media was present but not an image (video, audio, document, etc).
      // Identify the rough kind for the audit trail.
      const ct = (req.body.MediaContentType0 || '').toLowerCase();
      const kind = ct.startsWith('video/') ? 'video'
                 : ct.startsWith('audio/') ? 'voice note'
                 : ct.startsWith('application/pdf') ? 'PDF'
                 : 'media';
      bodyForLog = `[forwarded a ${kind} — not yet supported]`;
    } else {
      bodyForLog = '[empty]';
    }

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'whatsapp',
      body:            bodyForLog,
      sent_by:         'couple',
      twilio_sid:      twilioSid,
    });

    // Bump last_message_at on the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // ── Run the engine ──────────────────────────────────────────────
    // Pass the body (which may include the URL — agent reads naturally).
    // For media-only inbounds, pass the same synthesized string we wrote to
    // the audit log so the agent's context matches its history.
    const inboundForEngine = trimmedBody.length > 0 ? trimmedBody : bodyForLog;

    const result = await runBrideAgenticTurn({
      couple,
      user,
      conversation,
      inboundMessage: inboundForEngine,
      mediaContext:   mediaContextNote,
      supabase,
      anthropic,
    });

    // ── Send the reply via Twilio ───────────────────────────────────
    // result.mediaUrls is populated when list_muse was called with playback.
    let twilioMsg = null;
    try {
      twilioMsg = await sendWhatsApp(phone, result.reply, result.mediaUrls || []);
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
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK === 'true') {
    console.warn('[dream-wedding] WARNING: DISABLE_TWILIO_SIGNATURE_CHECK=true — Twilio webhook signature verification is OFF. Do not run in production with this flag set.');
  }
});
