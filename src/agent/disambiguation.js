// src/agent/disambiguation.js — multi-vendor routing disambiguation
// Session 8.5 Step 10 — when a couple has threads with multiple vendors and
// sends a message without a TDW code, this helper asks which vendor they
// mean, then interprets their reply.

const MODEL = 'claude-haiku-4-5-20251001';

function vendorDisplayName(vendor) {
  return vendor.business_name || vendor.users?.name || `Vendor ${vendor.id.slice(0, 6)}`;
}

function buildDisambiguationQuestion(vendors) {
  if (!vendors || vendors.length < 2) {
    return 'Hi! Which vendor is this message about?';
  }
  const names = vendors.map(vendorDisplayName);
  if (names.length === 2) {
    return `Hi! Should I send this to ${names[0]} or ${names[1]}?`;
  }
  // 3+ vendors: comma-separated, "or" before last
  const last = names.pop();
  return `Hi! Should I send this to ${names.join(', ')}, or ${last}?`;
}

async function interpretDisambiguationReply({ replyText, candidateVendors, anthropic }) {
  if (!replyText || !candidateVendors || candidateVendors.length === 0) {
    return { matched_vendor_id: null, confidence: 'none' };
  }

  const vendorList = candidateVendors
    .map(v => `- id: ${v.id}, name: ${vendorDisplayName(v)}, category: ${v.category || 'unknown'}`)
    .join('\n');

  const systemPrompt = `You are a router. The user has been asked which of several vendors a message is for. They have just replied. Your only job is to identify which vendor they mean.

Candidate vendors:
${vendorList}

Output rules:
- Respond with ONLY a JSON object, no other text, no markdown.
- Format: {"matched_vendor_id": "<uuid>", "confidence": "high" | "low"} OR {"matched_vendor_id": null, "confidence": "none"}
- "high" = the user clearly named a vendor by name, partial name, or unambiguous category match
- "low" = some signal but uncertain (e.g. ambiguous category when multiple vendors share it)
- null = no clear signal

Examples:
- "Dev" or "Dev Roy" with a candidate "Dev Roy Photography" → matched_vendor_id = that uuid, high
- "the photographer" with one photographer in candidates → matched_vendor_id = that uuid, high
- "the photographer" with two photographers in candidates → low
- "thanks" or "what's up" → null, none`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: replyText }],
    });

    const text = response.content[0]?.text?.trim() || '';
    // Strip any markdown fences if present
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate matched_vendor_id is among candidates
    if (parsed.matched_vendor_id && !candidateVendors.some(v => v.id === parsed.matched_vendor_id)) {
      console.warn('[disambiguation] model returned unknown vendor id, ignoring');
      return { matched_vendor_id: null, confidence: 'none' };
    }

    console.log(`[disambiguation] reply="${replyText.slice(0, 40)}" -> matched=${parsed.matched_vendor_id} conf=${parsed.confidence}`);
    return parsed;
  } catch (err) {
    console.error('[disambiguation] failed:', err.message);
    return { matched_vendor_id: null, confidence: 'none' };
  }
}

module.exports = {
  buildDisambiguationQuestion,
  interpretDisambiguationReply,
  vendorDisplayName,
};
