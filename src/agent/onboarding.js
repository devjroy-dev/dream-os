// onboarding.js — conversational onboarding flow for new vendors
//
// States: new -> asked_category -> asked_city -> asked_travel -> asked_rate -> asked_handle -> complete
//
// Session 5: added asked_instagram step + TDW handle generation + completion TDW link.

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '14787788550';

function normaliseHandle(raw) {
  return raw
    .replace(/^@/, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

async function generateHandle({ vendor, user, instagramHandle, supabase }) {
  const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  const city      = (vendor.city     || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const category  = (vendor.category || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const phone     = (user?.phone     || '').replace(/\D/g, '').slice(-4);

  const candidates = instagramHandle
    ? [normaliseHandle(instagramHandle), `${firstName}-${city}`, `${firstName}-${category}`, `${firstName}-${phone}`]
    : [`${firstName}-${city}`, `${firstName}-${category}`, `${firstName}-${phone}`];

  for (const handle of candidates) {
    if (!handle || handle.replace(/-/g, '').length < 2) continue;
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('routing_handle', handle)
      .maybeSingle();
    if (!existing) return handle;
  }

  return `${firstName}-${Date.now().toString().slice(-6)}`;
}

async function nextOnboardingMessage({ vendor, user, inboundMessage, supabase }) {
  const state = vendor.onboarding_state;
  const name  = user?.name || 'there';

  switch (state) {

    case 'new': {
      await supabase.from('vendors').update({ onboarding_state: 'asked_category' }).eq('id', vendor.id);
      return { reply: `Hi ${name} — Swati mentioned a little bit about you. I'm your chief of staff, and I'll be running the operational side of your business from here. Before we get started, tell me a bit about your work — what do you do?` };
    }

    case 'asked_category': {
      const category = inboundMessage.trim();
      await supabase.from('vendors').update({ category: category.toLowerCase(), onboarding_state: 'asked_city' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Category: ${category}`, tags: ['onboarding', 'category'] });
      return { reply: `Got it — ${category}. And where are you based mostly?` };
    }

    case 'asked_city': {
      const city = inboundMessage.trim();
      await supabase.from('vendors').update({ city, onboarding_state: 'asked_travel' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Based in ${city}`, tags: ['onboarding', 'city'] });
      return { reply: `${city} — and are you open to travelling for shoots, or mostly local?` };
    }

    case 'asked_travel': {
      const open_to_travel = /yes|open|travel|anywhere|pan.?india|outstation|outside/i.test(inboundMessage);
      const travel_notes = inboundMessage.trim();
      await supabase.from('vendors').update({ open_to_travel, travel_notes, onboarding_state: 'asked_rate' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Travel: ${inboundMessage.trim()}`, tags: ['onboarding', 'travel'] });
      return { reply: `Got it. And what's your typical rate for a wedding day? Ballpark is fine.` };
    }

    case 'asked_rate': {
      const rate = inboundMessage.trim();
      await supabase.from('vendor_state').upsert({
        vendor_id: vendor.id,
        summary: `${user?.name || 'Vendor'} — ${vendor.category || ''} based in ${vendor.city || ''}. Typical rate: ${rate}. Founding cohort vendor.`,
        pricing_policy: { stated_rate: rate },
        recent_notes: [],
        updated_at: new Date().toISOString(),
      });
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Typical wedding day rate: ${rate}`, tags: ['onboarding', 'pricing'] });
      await supabase.from('vendors').update({ onboarding_state: 'asked_handle' }).eq('id', vendor.id);
      return { reply: `Got it. Last thing — pick a short name for your TDW link. Your Instagram handle works great, or just make one up. Example: RAHULCLICKS or RAHUL-DELHI.` };
    }

    case 'asked_handle': {
      const msg = inboundMessage.trim();

      // Check if vendor wants us to pick for them
      const wantsSuggestion = /^(suggest|you pick|anything|whatever|auto|generate|you choose)/i.test(msg);

      let chosenHandle = null;

      if (!wantsSuggestion) {
        // Normalise what vendor typed
        const normalised = msg.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9-]/g, '');

        if (normalised.length >= 2) {
          // Check uniqueness
          const { data: existing } = await supabase
            .from('vendors')
            .select('id')
            .eq('routing_handle', normalised)
            .maybeSingle();

          if (!existing) {
            chosenHandle = normalised;
          } else {
            // Taken — suggest fallback and loop back
            const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
            const city = (vendor.city || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const suggestion = `${firstName}-${city}`;

            // Stay in asked_handle — do not advance state
            return {
              reply: `That one's taken — try another? Or I can suggest one: ${suggestion}`,
            };
          }
        }
      }

      // Auto-generate if vendor wants suggestion or typed something too short
      if (!chosenHandle) {
        const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
        const city = (vendor.city || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const category = (vendor.category || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const phone = (user?.phone || '').replace(/\D/g, '').slice(-4);

        const candidates = [
          `${firstName}-${city}`,
          `${firstName}-${category}`,
          `${firstName}-${phone}`,
          `${firstName}-${Date.now().toString().slice(-6)}`,
        ];

        for (const candidate of candidates) {
          if (!candidate || candidate.replace(/-/g, '').length < 2) continue;
          const { data: existing } = await supabase
            .from('vendors')
            .select('id')
            .eq('routing_handle', candidate)
            .maybeSingle();
          if (!existing) {
            chosenHandle = candidate;
            break;
          }
        }
      }

      // Extract Instagram handle if message looks like one
      const instagramHandle = !wantsSuggestion && msg.includes('@')
        ? msg.replace(/^@/, '').split(/\s+/)[0].toLowerCase()
        : null;

      // Save and complete
      await supabase
        .from('vendors')
        .update({
          routing_handle: chosenHandle,
          instagram_handle: instagramHandle || null,
          onboarding_state: 'complete',
        })
        .eq('id', vendor.id);

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `TDW handle: ${chosenHandle}${instagramHandle ? `. Instagram: @${instagramHandle}` : ''}`,
        tags: ['onboarding', 'tdw', 'instagram'],
      });

      const tdwLink = `wa.me/${TDW_WA_NUMBER}?text=TDW-${chosenHandle}`;
      return {
        reply: `Perfect — you're all set. Here's your TDW link: ${tdwLink} — put this in your Instagram bio so couples can reach you directly. Or you just send me the messages you receive. From here just talk to me like you'd talk to a trusted assistant.`,
      };
    }

    default: {
      return { reply: `Something's off on my end. Message Dev at hello@thedreamwedding.in and he'll sort it.` };
    }
  }
}

module.exports = { nextOnboardingMessage };
