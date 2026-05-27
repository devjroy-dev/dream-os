// onboarding.js — conversational onboarding flow for new vendors
//
// States: new -> asked_name -> asked_ig -> asked_category -> asked_city -> asked_travel -> asked_rate -> complete
// Session 8.1: asked_category now uses Haiku smart extraction.
//   - Normalises category against locked taxonomy (categories.js)
//   - Extracts style_notes (qualifiers like "luxury", "celebrity", "budget")
//   - If vendor mentions city in same message, captures it and skips asked_city

const { MODEL_HAIKU }                    = require('./models');
const { VENDOR_CATEGORIES, CATEGORY_ALIASES } = require('./categories');

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '14787788550';

// ── Category extractor ────────────────────────────────────────────────────────
// Calls Haiku with a strict JSON-only prompt to extract:
//   { category, style_notes, city }
// from whatever the vendor typed.
// Falls back to raw input if Haiku fails or returns unexpected output.

async function extractCategoryDetails(inboundMessage, anthropic) {
  const categoryList = VENDOR_CATEGORIES.join(', ');

  const prompt = `You are extracting vendor profile data from a WhatsApp message sent by a wedding vendor in India.

Extract the following fields from the message and return ONLY valid JSON, no other text:

{
  "category": "<one value from the allowed list>",
  "style_notes": "<qualifier words only, or null>",
  "city": "<city name if mentioned, or null>"
}

ALLOWED CATEGORIES: ${categoryList}

RULES:
- category: pick the single best match from the allowed list. If nothing fits, use "other".
- style_notes: capture qualifier words only — things like "luxury", "celebrity", "budget", "boutique", "destination", "traditional", "contemporary". Do NOT include the category word itself. If no qualifier, return null.
- city: extract only if the vendor clearly stated their city. If not mentioned, return null.
- Return ONLY the JSON object. No explanation, no markdown, no backticks.

EXAMPLES:
Message: "I'm a luxury decorator based in Delhi"
{"category":"decor","style_notes":"luxury","city":"Delhi"}

Message: "I do candid photography"
{"category":"photography","style_notes":"candid","city":null}

Message: "Bridal MUA, working out of Mumbai"
{"category":"makeup","style_notes":"bridal","city":"Mumbai"}

Message: "I'm a wedding planner"
{"category":"planning","style_notes":null,"city":null}

Message: "Celebrity makeup artist"
{"category":"makeup","style_notes":"celebrity","city":null}

Message: "I do mehendi and I'm based in Pune"
{"category":"mehendi","style_notes":null,"city":"Pune"}

Now extract from this message:
"${inboundMessage}"`;

  try {
    const response = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 150,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    // Strip accidental markdown fences if model adds them
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    // Validate: category must be in the allowed list
    const category   = VENDOR_CATEGORIES.includes(parsed.category) ? parsed.category : 'other';
    const styleNotes = typeof parsed.style_notes === 'string' && parsed.style_notes.trim()
      ? parsed.style_notes.trim().toLowerCase()
      : null;
    const city = typeof parsed.city === 'string' && parsed.city.trim()
      ? parsed.city.trim()
      : null;

    console.log(`[onboarding:extract] category="${category}" style_notes="${styleNotes}" city="${city}"`);
    return { category, style_notes: styleNotes, city };

  } catch (err) {
    // Fallback: strip common preambles, store raw input as category
    console.warn(`[onboarding:extract] Haiku extraction failed — using raw input:`, err.message);
    const fallback = inboundMessage
      .trim()
      .replace(/^(i'm an?|i am an?|im an?|i do|i am a)\s+/i, '')
      .toLowerCase()
      .trim();
    return { category: fallback, style_notes: null, city: null };
  }
}

// ── Main onboarding handler ───────────────────────────────────────────────────

async function nextOnboardingMessage({ vendor, user, inboundMessage, supabase, anthropic }) {
  const state = vendor.onboarding_state;
  const name  = user?.name || 'there';

  switch (state) {

    case 'new': {
      await supabase.from('vendors').update({ onboarding_state: 'asked_name' }).eq('id', vendor.id);
      const greeting = name && name !== 'there'
        ? `Hi ${name} — Swati mentioned you'd be joining. I'm your chief of staff.`
        : `Hi — Swati said you'd be joining. I'm your chief of staff.`;
      return { reply: `${greeting} Quick question before we begin — what should I call you? Just your first name is fine.` };
    }

    case 'asked_name': {
      const firstName = inboundMessage.trim().split(/\s+/)[0].slice(0, 60);
      const cleanFirst = firstName.replace(/[^\w'-]/g, '').trim() || firstName;
      await supabase.from('users').update({ name: cleanFirst }).eq('id', vendor.user_id);
      await supabase.from('vendors').update({ onboarding_state: 'asked_ig' }).eq('id', vendor.id);
      return { reply: `Got it, ${cleanFirst}. One more thing — what's your Instagram handle? Your clients will use it to reach your PA. If you don't have one, just say skip.` };
    }

    case 'asked_ig': {
      const trimmedIg = inboundMessage.trim();
      const skipped = /^skip$/i.test(trimmedIg) || /^no$/i.test(trimmedIg) || !trimmedIg;
      const igRaw = skipped ? null : trimmedIg.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
      const igUpdates = { onboarding_state: 'asked_category' };
      if (igRaw) igUpdates.instagram_handle = igRaw;
      await supabase.from('vendors').update(igUpdates).eq('id', vendor.id);
      if (igRaw) {
        return { reply: `@${igRaw} — perfect. Now tell me a bit about your work — what do you do?` };
      }
      return { reply: `No worries. Tell me a bit about your work — what do you do?` };
    }

    case 'asked_category': {
      // ── Smart extraction via Haiku ──────────────────────────────
      const extracted = await extractCategoryDetails(inboundMessage, anthropic);
      const { category, style_notes, city } = extracted;

      // If vendor mentioned city, capture it and skip asked_city
      if (city) {
        await supabase.from('vendors').update({
          category,
          style_notes,
          city,
          onboarding_state: 'asked_travel',
        }).eq('id', vendor.id);

        await supabase.from('notes').insert([
          { vendor_id: vendor.id, content: `Category: ${category}${style_notes ? ` (${style_notes})` : ''}`, tags: ['onboarding', 'category'] },
          { vendor_id: vendor.id, content: `Based in ${city}`, tags: ['onboarding', 'city'] },
        ]);

        // Build a natural reply that confirms both category and city
        const categoryDisplay = style_notes ? `${style_notes} ${category}` : category;
        return { reply: `Got it — ${categoryDisplay} based in ${city}. Are you open to travelling for work, or mostly local?` };
      }

      // No city extracted — proceed normally to asked_city
      await supabase.from('vendors').update({
        category,
        style_notes,
        onboarding_state: 'asked_city',
      }).eq('id', vendor.id);

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Category: ${category}${style_notes ? ` (${style_notes})` : ''}`,
        tags: ['onboarding', 'category'],
      });

      const categoryDisplay = style_notes ? `${style_notes} ${category}` : category;
      return { reply: `Got it — ${categoryDisplay}. And where are you based mostly?` };
    }

    case 'asked_city': {
      const city = inboundMessage.trim();
      await supabase.from('vendors').update({ city, onboarding_state: 'asked_travel' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Based in ${city}`, tags: ['onboarding', 'city'] });
      return { reply: `${city} — and are you open to travelling for work, or mostly local?` };
    }

    case 'asked_travel': {
      const open_to_travel = /yes|open|travel|anywhere|pan.?india|outstation|outside/i.test(inboundMessage);
      const travel_notes   = inboundMessage.trim();
      await supabase.from('vendors').update({ open_to_travel, travel_notes, onboarding_state: 'asked_rate' }).eq('id', vendor.id);
      await supabase.from('notes').insert({ vendor_id: vendor.id, content: `Travel: ${inboundMessage.trim()}`, tags: ['onboarding', 'travel'] });
      return { reply: `Got it. And what's your typical rate for a wedding day? Ballpark is fine.` };
    }

    case 'asked_rate': {
      const rate = inboundMessage.trim();

      // Save rate to vendor_state
      await supabase.from('vendor_state').upsert({
        vendor_id: vendor.id,
        summary: `${user?.name || 'Vendor'} — ${vendor.category || ''}${vendor.style_notes ? ` (${vendor.style_notes})` : ''} based in ${vendor.city || ''}. Typical rate: ${rate}. Founding cohort vendor.`,
        pricing_policy: { stated_rate: rate },
        recent_notes: [],
        updated_at: new Date().toISOString(),
      });
      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `Typical wedding day rate: ${rate}`,
        tags: ['onboarding', 'pricing'],
      });

      // Auto-assign TDW handle — priority: IG handle → FIRSTNAME+PHONE3 → fallbacks
      const { data: freshVendor } = await supabase
        .from('vendors').select('instagram_handle, routing_handle').eq('id', vendor.id).maybeSingle();
      if (freshVendor?.routing_handle) {
        // Handle already set (e.g. from web onboarding) — skip generation
        await supabase.from('vendors').update({ onboarding_state: 'complete' }).eq('id', vendor.id);
      } else {
        const igHandle  = (freshVendor?.instagram_handle || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        const firstName = (user?.name || 'VENDOR').split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
        const phone3    = (user?.phone || '').replace(/\D/g, '').slice(-3);
        const phone4    = (user?.phone || '').replace(/\D/g, '').slice(-4);
        const candidates = [
          igHandle,
          `${firstName}${phone3}`,
          `${firstName}${phone4}`,
          `${firstName}${phone3}${phone4}`,
          `${firstName}${Date.now().toString().slice(-6)}`,
        ].filter(Boolean);
        let handle = null;
        for (const candidate of candidates) {
          if (!candidate || candidate.length < 2) continue;
          const { data: existing } = await supabase
            .from('vendors').select('id').eq('routing_handle', candidate).maybeSingle();
          if (!existing) { handle = candidate; break; }
        }
        await supabase
          .from('vendors')
          .update({ routing_handle: handle, onboarding_state: 'complete' })
          .eq('id', vendor.id);
      }

      await supabase.from('notes').insert({
        vendor_id: vendor.id,
        content: `TDW handle: ${handle}`,
        tags: ['onboarding', 'tdw'],
      });

      const tdwLink = `wa.me/${TDW_WA_NUMBER}?text=TDW-${handle}`;
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
