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
  // ── Session 6 tools: events, routing handle, TDW link ─────────
  {
    name: 'create_event',
    description: 'Log an event on the vendor calendar. Use whenever the vendor mentions a shoot, call, meeting, task, reminder, or recce that has a date. Always extract a date — if the vendor says "tomorrow" or "next Friday", convert to YYYY-MM-DD. Do not invent events the vendor did not mention.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short event title. e.g. "Shoot for Priya", "Call with editor", "Recce at Leela"',
        },
        event_date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Required.',
        },
        event_time: {
          type: 'string',
          description: 'Time in HH:MM (24-hour) format. Optional — only if vendor mentioned a time.',
        },
        kind: {
          type: 'string',
          enum: ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'other'],
          description: 'Event type. Map naturally: photoshoot/wedding/event = shoot. Phone call = call. Site visit = recce. Anything that does not clearly fit goes to "other" with the specific type in notes.',
        },
        linked_lead_id: {
          type: 'string',
          description: 'UUID of an existing lead this event relates to. Optional. Only set if vendor refers to an enquiry by name and you can identify the lead from list_leads.',
        },
        notes: {
          type: 'string',
          description: 'Anything else worth capturing — location, contact, prep notes.',
        },
      },
      required: ['title', 'event_date', 'kind'],
    },
  },
  {
    name: 'list_events',
    description: 'Fetch upcoming or recent events from the vendor calendar. Use when the vendor asks "what is on my calendar", "what shoots do I have this week", "any events today".',
    input_schema: {
      type: 'object',
      properties: {
        window: {
          type: 'string',
          enum: ['today', 'this_week', 'next_7_days', 'upcoming_all'],
          description: 'Which range to fetch. "today" = today only. "this_week" = today through Sunday. "next_7_days" = next 7 days from today. "upcoming_all" = all future events.',
        },
        kind: {
          type: 'string',
          enum: ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'other', 'all'],
          description: 'Filter by kind. Use "all" for everything.',
        },
      },
      required: ['window', 'kind'],
    },
  },
  {
    name: 'update_event_state',
    description: 'Mark an event as done or cancelled. Use when the vendor confirms an event is complete or has been cancelled.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'UUID of the event. Get this from list_events first if unsure.',
        },
        new_state: {
          type: 'string',
          enum: ['done', 'cancelled'],
          description: 'New state for the event.',
        },
      },
      required: ['event_id', 'new_state'],
    },
  },
  {
    name: 'create_invoice',
    description: 'Create a new invoice for a client and compose a WhatsApp message the vendor can forward. Use when the vendor says raise invoice, send invoice, create invoice, or similar. Extract client name, total amount, advance/booking amount if mentioned, description of work, and due date if mentioned. Do NOT invent a description — only use what the vendor said.',
    input_schema: {
      type: 'object',
      properties: {
        client_name: {
          type: 'string',
          description: 'Client name exactly as vendor stated it.',
        },
        client_phone: {
          type: 'string',
          description: 'Client phone in E.164 format if mentioned. Optional.',
        },
        lead_id: {
          type: 'string',
          description: 'UUID of an existing lead this invoice is for. Only set this if the vendor explicitly disambiguated which client (e.g. said "the Priya from Bandra"). If unsure, leave null — the tool will handle duplicates.',
        },
        description: {
          type: 'string',
          description: 'What the invoice is for, in the vendor\'s own words. e.g. "bridal makeup", "floral decoration", "pre-wedding shoot in Goa". Only include if vendor mentioned it. Do NOT invent or default this field.',
        },
        amount_total: {
          type: 'integer',
          description: 'Total invoice amount in whole rupees. Convert "1.2 lakh" to 120000, "80k" to 80000. Required.',
        },
        amount_advance: {
          type: 'integer',
          description: 'Booking/advance amount in whole rupees. If vendor says "30 percent advance" calculate it from total. If vendor says "30k advance" use 30000. Leave null if no advance mentioned.',
        },
        due_date: {
          type: 'string',
          description: 'Balance due date in YYYY-MM-DD. Convert "Nov 15" to most likely upcoming year. Optional.',
        },
        notes: {
          type: 'string',
          description: 'Anything else worth capturing. Optional.',
        },
      },
      required: ['client_name', 'amount_total'],
    },
  },
  {
    name: 'update_routing_handle',
    description: 'Change the vendor TDW routing handle. Use only when the vendor explicitly asks to change their TDW code or handle. Handle will be uppercased and stripped of non-alphanumeric characters automatically. If the requested handle is already taken by another vendor, the tool will return an error and you should ask the vendor to try a different one.',
    input_schema: {
      type: 'object',
      properties: {
        new_handle: {
          type: 'string',
          description: 'The new handle. Will be uppercased and cleaned (alphanumeric and hyphen only). e.g. "PRIYA-PHOTO" or "DEV2026".',
        },
      },
      required: ['new_handle'],
    },
  },
  {
    name: 'get_my_tdw_link',
    description: 'Fetch the vendor current TDW link. Use whenever the vendor asks for their TDW link, their wa.me link, or what to put in their Instagram bio. Never construct a TDW link manually — always call this tool and use the value it returns verbatim.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
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
