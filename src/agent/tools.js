// tools.js — the agent's three starter tools
//
// Session 2 tools (no real-world mutations yet):
//   1. note_to_self           — record a fact to vendor's notes
//   2. update_conversation_state — move a conversation through its lifecycle
//   3. respond_to_vendor      — the actual WhatsApp reply text

const TOOLS = [
  {
    name: 'note_to_self',
    description: 'Record a durable fact about this vendor or their business. Use this whenever the vendor shares something worth remembering long-term (client names, dates, preferences, referrals, pricing decisions, life events). Notes are private — they shape your future responses but are never sent to the vendor.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'A short, factual note. One sentence. Example: "Priya wants Dec 14, photography, 1.5L budget"',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags for retrieval. Common: lead, client, pricing, preference, referrer, date, personal',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_conversation_state',
    description: 'Move this conversation to a new lifecycle state when the vendor signals a change. Only use when the state genuinely changed in this message.',
    input_schema: {
      type: 'object',
      properties: {
        new_state: {
          type: 'string',
          enum: ['new', 'qualifying', 'negotiating', 'booked', 'planning', 'event_done', 'closed'],
          description: 'The new state. Examples: new → qualifying when the vendor starts gathering info; qualifying → negotiating when prices are being discussed; negotiating → booked when confirmed.',
        },
        reason: {
          type: 'string',
          description: 'One-line reason for the state change. Example: "Vendor confirmed Priya booked Dec 14"',
        },
      },
      required: ['new_state', 'reason'],
    },
  },
  {
    name: 'respond_to_vendor',
    description: 'Send the actual reply to the vendor on WhatsApp. This MUST be the last tool call in your turn. The vendor only sees what you put here — your text response outside this tool is invisible. Keep it WhatsApp-short.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The WhatsApp message text. 1-3 sentences. Plain text. No markdown.',
        },
      },
      required: ['message'],
    },
  },
];

module.exports = { TOOLS };
