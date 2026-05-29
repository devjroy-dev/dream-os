// src/lib/vendor/replyToCouple.js
//
// PHASE 3 — the vendor→couple reply mechanism.
//
// Until now, the couple-agent (runCoupleAgenticTurn) could reply TO a couple
// on its own initiative during a live bride conversation, but there was no way
// for the VENDOR's explicit instruction ("quote Ananya 4L") to reach the
// couple. The vendor-agent could draft, but not deliver.
//
// replyToCouple closes that gap. Given a vendor, a lead reference (or phone),
// and a composed message, it:
//   1. resolves the couple's phone (from the lead, or uses a passed phone)
//   2. finds (or creates) the couple_thread for (vendor_id, phone)
//   3. sends the message to the couple via WhatsApp (+91 — the same number the
//      couple already knows, so the thread stays continuous)
//   4. logs the outbound message to the thread for the audit trail
//
// IMPORTANT — voice: the `message` passed in is ALREADY composed by the agent
// in the warm, semi-formal couple-assistant voice (with the category caveat).
// This lib does NOT compose or reframe — it only delivers and logs. Keeping
// delivery and composition separate means the same delivery path serves any
// surface and any category.
//
// Returns { ok, error?, threadId?, twilioSid? }.

const { sendWhatsApp } = require('../whatsapp');

async function replyToCouple(supabase, { vendor, leadId = null, couplePhone = null, message }) {
  if (!vendor?.id)            return { ok: false, error: 'vendor required' };
  if (!message || !message.trim()) return { ok: false, error: 'empty message' };

  // ── 1. Resolve the couple's phone ─────────────────────────────────────
  let phone = couplePhone;
  let lead  = null;
  if (!phone && leadId) {
    const { data: l } = await supabase
      .from('leads')
      .select('id, name, phone')
      .eq('id', leadId)
      .eq('vendor_id', vendor.id)
      .maybeSingle();
    lead = l || null;
    phone = lead?.phone || null;
  }

  if (!phone) {
    // No way to reach the couple — the lead has no phone on file.
    return { ok: false, error: 'no_phone', lead };
  }

  // ── 2. Find or create the couple_thread for (vendor, phone) ───────────
  let { data: thread } = await supabase
    .from('conversations')
    .select('id')
    .eq('vendor_id', vendor.id)
    .eq('counterparty_phone', phone)
    .eq('kind', 'couple_thread')
    .maybeSingle();

  if (!thread) {
    const { data: newThread, error: createErr } = await supabase
      .from('conversations')
      .insert({
        vendor_id:          vendor.id,
        counterparty_phone: phone,
        kind:               'couple_thread',
        state:              'new',
        mode:               'auto',
        last_message_at:    new Date().toISOString(),
      })
      .select('id')
      .single();
    if (createErr || !newThread) {
      return { ok: false, error: `thread_create_failed: ${createErr?.message || 'unknown'}` };
    }
    thread = newThread;
  }

  // ── 3. Send to the couple via WhatsApp (+91, per-service number) ──────
  let twilioSid = null;
  try {
    const sent = await sendWhatsApp(phone, message.trim());
    twilioSid = sent?.sid || null;
  } catch (sendErr) {
    return { ok: false, error: `send_failed: ${sendErr.message}`, threadId: thread.id };
  }

  // ── 4. Log the outbound message to the thread ─────────────────────────
  try {
    await supabase.from('messages').insert({
      conversation_id: thread.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            message.trim(),
      sent_by:         'agent',         // delivered by the assistant on the vendor's behalf
      twilio_sid:      twilioSid,
    });
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', thread.id);
  } catch (logErr) {
    // Message already sent — logging failure is non-fatal but worth noting.
    console.warn('[replyToCouple] message sent but logging failed:', logErr.message);
  }

  return { ok: true, threadId: thread.id, twilioSid, phone, lead };
}

module.exports = { replyToCouple };
