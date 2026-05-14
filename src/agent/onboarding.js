// onboarding.js — conversational onboarding flow for new vendors
//
// States: new → asked_category → asked_city → asked_rate → complete
//
// The Swati greeting fires on first message (state = 'new').
// Each subsequent message captures one piece of info and asks the next question.

async function nextOnboardingMessage({ vendor, user, inboundMessage, supabase }) {
  const state = vendor.onboarding_state;
  const name  = user?.name || 'there';

  switch (state) {

    case 'new': {
      await supabase
        .from('vendors')
        .update({ onboarding_state: 'asked_category' })
        .eq('id', vendor.id);

      return {
        reply: `Hi ${name} — Swati mentioned a little bit about you. I'm your chief of staff, and I'll be running the operational side of your business from here. Before we get started, tell me a bit about your work — what do you do?`,
      };
    }

    case 'asked_category': {
      const category = inboundMessage.trim();

      await supabase
        .from('vendors')
        .update({
          category: category.toLowerCase(),
          onboarding_state: 'asked_city',
        })
        .eq('id', vendor.id);

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Category: ${category}`,
        tags: ['onboarding', 'category'],
      });

      return {
        reply: `Got it — ${category}. And where are you based mostly?`,
      };
    }

    case 'asked_city': {
      const city = inboundMessage.trim();

      await supabase
        .from('vendors')
        .update({
          city,
          onboarding_state: 'asked_rate',
        })
        .eq('id', vendor.id);

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Based in ${city}`,
        tags: ['onboarding', 'city'],
      });

      return {
        reply: `${city} — good. One last thing: what's your typical rate for a wedding day? Ballpark is fine.`,
      };
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

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Typical wedding day rate: ${rate}`,
        tags: ['onboarding', 'pricing'],
      });

      await supabase
        .from('vendors')
        .update({ onboarding_state: 'complete' })
        .eq('id', vendor.id);

      return {
        reply: `Perfect — I've got what I need. From here, just talk to me like you'd talk to a trusted assistant. Tell me about enquiries, clients, dates, money — I'll remember everything and help you stay on top of it. What's on your plate right now?`,
      };
    }

    default: {
      return {
        reply: `Something's off on my end. Message Dev at hello@thedreamwedding.in and he'll sort it.`,
      };
    }
  }
}

module.exports = { nextOnboardingMessage };
