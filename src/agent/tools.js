// tools.js — agent tool definitions
// Session 4: adds create_lead and list_leads

const TOOLS = [
  {
    name: 'note_to_self',
    description: 'Record a durable fact about this vendor or their business. Use whenever the vendor shares something worth remembering long-term — client names, dates, preferences, referrals, pricing decisions. Notes are private and never sent to the vendor.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'A short factual note. One sentence. Example: "Prefers candid style over posed shots"',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags. Common: lead, client, pricing, preference, referrer, date, personal',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'create_lead',
    description: 'Create a structured lead record when the vendor shares or forwards an enquiry from a couple. Extract as much as you can from the message — name, date, budget, event type, where they heard about the vendor. If a field is unclear, leave it null. Always call this when you detect an inbound enquiry, even if the information is incomplete.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Couple name(s). e.g. "Priya" or "Priya & Rohit"',
        },
        phone: {
          type: 'string',
          description: 'Their WhatsApp or phone number if mentioned. Include country code.',
        },
        email: {
          type: 'string',
          description: 'Their email if mentioned.',
        },
        wedding_date: {
          type: 'string',
          description: 'Wedding date in YYYY-MM-DD format. Convert "Dec 14" to the most likely upcoming year.',
        },
        wedding_city: {
          type: 'string',
          description: 'City where the wedding is happening.',
        },
        event_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which events they need coverage for. e.g. ["wedding", "reception", "mehndi"]',
        },
        budget_min: {
          type: 'number',
          description: 'Minimum budget in Rs. If they say "1.5 lakh", use 150000.',
        },
        budget_max: {
          type: 'number',
          description: 'Maximum budget in Rs. If they give a single number, use it for both min and max.',
        },
        source: {
          type: 'string',
          enum: ['whatsapp', 'instagram', 'referral', 'discover', 'other'],
          description: 'Where the enquiry came from.',
        },
        referrer_name: {
          type: 'string',
          description: 'Name of the person who referred them, if mentioned.',
        },
        notes: {
          type: 'string',
          description: 'Anything else worth capturing that does not fit the other fields.',
        },
        raw_message: {
          type: 'string',
          description: 'The original enquiry text verbatim — copy it exactly as the vendor sent it.',
        },
      },
      required: ['raw_message'],
    },
  },
  {
    name: 'list_leads',
    description: 'Fetch a summary of this vendor leads to answer questions like "how many open leads do I have?" or "who enquired recently?". Use when the vendor asks about their pipeline.',
    input_schema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['new', 'contacted', 'quoted', 'booked', 'lost', 'all'],
          description: 'Filter by lead state. Use "all" for everything.',
        },
      },
      required: ['state'],
    },
  },
  {
    name: 'update_lead_state',
    description: 'Move a lead to a new state when the vendor signals a change. e.g. "Priya confirmed" → booked. "Rohit went with someone else" → lost.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: {
          type: 'string',
          description: 'UUID of the lead to update.',
        },
        new_state: {
          type: 'string',
          enum: ['new', 'contacted', 'quoted', 'booked', 'lost'],
          description: 'The new state.',
        },
        reason: {
          type: 'string',
          description: 'One-line reason. e.g. "Vendor confirmed booking with advance received"',
        },
      },
      required: ['lead_id', 'new_state', 'reason'],
    },
  },
  {
    name: 'update_conversation_state',
    description: 'Move this conversation to a new lifecycle state when the vendor signals a change.',
    input_schema: {
      type: 'object',
      properties: {
        new_state: {
          type: 'string',
          enum: ['new', 'qualifying', 'negotiating', 'booked', 'planning', 'event_done', 'closed'],
          description: 'The new state.',
        },
        reason: {
          type: 'string',
          description: 'One-line reason.',
        },
      },
      required: ['new_state', 'reason'],
    },
  },
  {
    name: 'respond_to_vendor',
    description: 'Send the reply to the vendor. FORMAT RULES — non-negotiable: (1) For lead confirmations: "Got it — [name or details], [date], [city], [budget], [source]. [Single question about next step]?" — nothing else. (2) For all other replies: maximum 2 sentences. (3) No opinions, no commentary, no observations about the lead quality or business. The vendor gets exactly what they need to act, nothing more.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The WhatsApp message. Plain text. No markdown. 1-3 sentences.',
        },
      },
      required: ['message'],
    },
  },
];

module.exports = { TOOLS };
