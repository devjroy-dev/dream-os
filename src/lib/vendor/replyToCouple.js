// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  F-06.144 — THIS WHOLE FILE HAS ZERO REACHABLE CALLERS. DEFUSED ISLAND.    ║
// ║  Label only. Zero behaviour changes with this header.                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝
//
// FILED at CE-212, LABELED at the TDW_06 relay-seam sitting (R-29.4). `replyToCouple`
// is complete, window-honest, and DEAD: its only caller is `executeTool` in
// `src/agent/engine.js`, which sits below that file's own F-05.56 island line and has
// had zero callers since arc M5. The M5 census walked the orphan and its classifier,
// and F-05.56 walked one ring out to `handleOnboarding` and `executeTool` — but
// nobody walked the ring beyond that, to the LIBRARIES those two were the last
// callers of. **This file is that unlabelled fourth ring, and it is why a working
// vendor→bride instrument was invisible to three consecutive sittings.**
//
// WHY THE LABEL MATTERS TO A READER WHO IS NOT LOOKING FOR IT: everything below is
// correct. The 24h pre-send window check, the refusal to guess among multiple
// threads, the honest `window_closed` return — all of it is the estate's own best
// thinking about this seam and none of it runs. A reader who greps for a window
// check and lands here will find the right answer in a dead file.
//
// **DO NOT REVIVE THE JS WIRE TO GET THIS BACK (R-29.3).** Reviving `executeTool`
// resurrects `src/agent/systemPrompt.js` — itself a labelled defused island —
// including its dead money copy, which is off-register under the house money law,
// and its capability claim that the agent CAN send. **THE LOGIC RE-SITES; THE
// MACHINERY DOES NOT REVIVE.**
//
// WHERE IT RE-SITES, BY PATH AND SYMBOL (the path-over-range law — no line ranges
// across files; a range drifts silently and a path fails loudly):
//   · the window question   → `src/lib/vendor/coupleWaWindow.js`, symbol
//                             `coupleWindowOpen`. NOTE THE KEYING DEPARTURE: the
//                             check below keys on ONE `conversation_id`; F-06.147
//                             rules the window a property of the (business PNID,
//                             user MSISDN) pair. The new module keys on the pair.
//   · the transport seam    → door-injected, `src/lib/vendorInbound.js`'s deps bag
//                             (symbol `sendWhatsApp`) and `src/engine/src/core/
//                             loop.ts` (symbol `transport`). Never engine-required.
//   · the staged draft      → `db/migrations/0117_pending_couple_drafts.sql`,
//                             table `public.pending_couple_drafts`. Shown bytes
//                             equal sent bytes by EQUALITY, not by hope.
//   · the hand itself       → the NEXT sitting. It is not built here.
//
// ── the original header, kept whole below ────────────────────────────────────
//
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

  // Recovery 1: the dupe-split case. Earlier testing/enquiry paths can leave
  // TWO leads for the same couple — one with the phone, one without — and the
  // vendor-agent may resolve to the phone-less one. If this lead has a name,
  // look for a same-name sibling (same vendor) that DOES carry a phone.
  if (!phone && lead?.name) {
    const { data: sibling } = await supabase
      .from('leads')
      .select('phone')
      .eq('vendor_id', vendor.id)
      .ilike('name', lead.name)
      .not('phone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sibling?.phone) phone = sibling.phone;
  }

  // Recovery 2: if still nothing, recover from this vendor's couple_threads —
  // but ONLY when unambiguous (exactly one thread), so we never send to the
  // wrong couple. With multiple threads we do not guess.
  if (!phone && lead) {
    const { data: threads } = await supabase
      .from('conversations')
      .select('counterparty_phone')
      .eq('vendor_id', vendor.id)
      .eq('kind', 'couple_thread')
      .not('counterparty_phone', 'is', null);
    if (threads && threads.length === 1 && threads[0].counterparty_phone) {
      phone = threads[0].counterparty_phone;
    }
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

  // ── 2.5 WhatsApp 24-hour session window gate ──────────────────────────
  // WhatsApp only allows free-form (non-template) messages within 24h of the
  // user's last inbound message. Outside that window, Twilio ACCEPTS the
  // message (returns a SID) but Meta later marks it undelivered — so a naive
  // send would let us falsely tell the vendor "Sent!" when the bride got
  // nothing. To never lie about a send, we check the window BEFORE sending:
  // is there an inbound from this couple in the last 24h? If not, we do not
  // attempt the send — we return window_closed so the agent can be honest and
  // offer to draft-and-forward instead.
  const windowCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentInbound } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', thread.id)
    .eq('direction', 'inbound')
    .gte('created_at', windowCutoff)
    .limit(1)
    .maybeSingle();

  if (!recentInbound) {
    return { ok: false, error: 'window_closed', threadId: thread.id, lead, phone };
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
