// ─────────────────────────────────────────────────────────────────────────────
// src/agent/pwaTools.js
// Tool definitions for the PWA vendor agent only.
//
// Key differences from tools.js (WhatsApp):
//   1. No respond_to_vendor — PWA engine uses model's final text as reply.
//   2. No phantom outbound send — replaced by generate_client_walink.
//   3. No delete_client — clients table has no hidden_at column yet (migration
//      0034). Agent tells vendor to use the app. Honest, not a lie.
//   4. clarify tool — disambiguation as a first-class action, not prose.
//   5. Every tool returns { result, mutated } so the loop knows when to refetch.
// ─────────────────────────────────────────────────────────────────────────────

const PWA_TOOLS = [

  // ── Notes ──────────────────────────────────────────────────────────────────
  {
    name: 'note_to_self',
    description: 'Record a durable fact about this vendor or their business — client names, preferences, referrals, pricing decisions, anything worth remembering long-term. Not for actionable items with dates (use create_event for those).',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'A short factual note. One sentence. e.g. "Prefers candid style over posed shots"',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags. Common: lead, client, pricing, preference, referrer, personal',
        },
      },
      required: ['content'],
    },
  },

  // ── Leads ──────────────────────────────────────────────────────────────────
  {
    name: 'create_lead',
    description: 'Create a structured lead record when the vendor shares or forwards an enquiry from a couple. Extract as much as possible — name, date, budget, event type, source. If a field is unclear leave it null. Always call this when you detect an inbound enquiry, even incomplete ones.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Couple name(s). e.g. "Priya" or "Priya & Rohit"' },
        phone: { type: 'string', description: 'WhatsApp or phone number. Include country code. e.g. +919876543210' },
        email: { type: 'string', description: 'Email if mentioned.' },
        wedding_date: { type: 'string', description: 'Wedding date in YYYY-MM-DD. Convert "Dec 14" to most likely upcoming year.' },
        wedding_city: { type: 'string', description: 'City where the wedding is happening.' },
        event_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Events they need coverage for. e.g. ["wedding","reception","mehndi"]',
        },
        budget_min: { type: 'number', description: 'Minimum budget in Rs. "1.5 lakh" = 150000.' },
        budget_max: { type: 'number', description: 'Maximum budget in Rs. Single number = use for both min and max.' },
        source: {
          type: 'string',
          enum: ['whatsapp', 'instagram', 'referral', 'discover', 'other'],
          description: 'Where the enquiry came from.',
        },
        referrer_name: { type: 'string', description: 'Name of person who referred them, if mentioned.' },
        notes: { type: 'string', description: 'Anything else worth capturing.' },
        raw_message: { type: 'string', description: 'Original enquiry text verbatim.' },
      },
      required: ['raw_message'],
    },
  },

  {
    name: 'list_leads',
    description: 'Fetch leads from the pipeline. Use when vendor asks about their pipeline, how many enquiries they have, who reached out, or any lead-related question. Always call this — never answer lead questions from memory.',
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
    description: 'Move a lead to a new state. e.g. "Priya confirmed" → booked. "Rohit went with someone else" → lost. Always call list_leads first if you need the lead_id.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'UUID of the lead to update.' },
        new_state: {
          type: 'string',
          enum: ['new', 'contacted', 'quoted', 'booked', 'lost'],
          description: 'The new state.',
        },
        reason: { type: 'string', description: 'One-line reason. e.g. "Vendor confirmed booking, advance received"' },
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
        reason: { type: 'string', description: 'One-line reason.' },
      },
      required: ['new_state', 'reason'],
    },
  },

  // ── Events / Calendar ───────────────────────────────────────────────────────
  {
    name: 'create_event',
    description: 'Log an event on the vendor calendar. Use whenever the vendor mentions a shoot, call, meeting, task, reminder, or recce with a date. Always extract a date — convert "tomorrow" or "next Friday" to YYYY-MM-DD.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short event title. e.g. "Shoot for Priya", "Call with editor", "Recce at Leela"' },
        event_date: { type: 'string', description: 'Date in YYYY-MM-DD format. Required.' },
        event_time: { type: 'string', description: 'Time in HH:MM (24-hour). Optional — only if vendor mentioned a time.' },
        kind: {
          type: 'string',
          enum: ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'other'],
          description: 'Event type. photoshoot/wedding/event = shoot. Phone call = call. Site visit = recce.',
        },
        linked_lead_id: { type: 'string', description: 'UUID of an existing lead this event relates to. Optional.' },
        notes: { type: 'string', description: 'Location, contact, prep notes. Optional.' },
      },
      required: ['title', 'event_date', 'kind'],
    },
  },

  {
    name: 'list_events',
    description: 'Fetch events from the vendor calendar. Use when vendor asks what is on their calendar, what shoots they have, any events today or this week.',
    input_schema: {
      type: 'object',
      properties: {
        window: {
          type: 'string',
          enum: ['today', 'this_week', 'next_7_days', 'upcoming_all'],
          description: 'Which range to fetch.',
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
    description: 'Mark an event as done or cancelled. Call list_events first to get the event_id if unsure.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'UUID of the event.' },
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
    name: 'query_day',
    description: 'Return everything the vendor has on a specific date: events, invoices due, and expenses logged. Use for any date-specific question — "what\'s on Dec 14?", "am I free on the 22nd?", "anything Saturday?"',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD format.' },
      },
      required: ['date'],
    },
  },

  {
    name: 'hot_dates_context',
    description: 'Return upcoming Vivah Muhurat (auspicious Hindu wedding) dates. Use when vendor asks about hot dates, muhurat dates, auspicious dates, peak season, or capacity planning around wedding season.',
    input_schema: {
      type: 'object',
      properties: {
        months_ahead: { type: 'number', description: 'How many months ahead to look. Default 3. Max 12.' },
      },
      required: [],
    },
  },

  // ── Invoices ────────────────────────────────────────────────────────────────
  {
    name: 'create_invoice',
    description: 'Create a new invoice for a client. Use when vendor says raise/send/create an invoice. Extract client name, total amount, advance if mentioned, description, due date if mentioned. Do NOT invent a description.',
    input_schema: {
      type: 'object',
      properties: {
        client_name: { type: 'string', description: 'Client name exactly as vendor stated it.' },
        client_phone: { type: 'string', description: 'Client phone in E.164 if mentioned. Optional.' },
        lead_id: { type: 'string', description: 'UUID of existing lead this invoice is for. Only if vendor explicitly named which client. Leave null if unsure.' },
        description: { type: 'string', description: 'What the invoice is for, in vendor\'s own words. Only if mentioned — do NOT invent.' },
        amount_total: { type: 'integer', description: 'Total in whole rupees. "1.2 lakh" = 120000, "80k" = 80000. Required.' },
        amount_advance: { type: 'integer', description: 'Booking/advance amount in whole rupees. "30 percent advance" = calculate from total. Null if not mentioned.' },
        due_date: { type: 'string', description: 'Balance due date in YYYY-MM-DD. Optional.' },
        notes: { type: 'string', description: 'Anything else worth capturing. Optional.' },
      },
      required: ['client_name', 'amount_total'],
    },
  },

  {
    name: 'list_invoices',
    description: 'List invoices. Use when vendor asks who owes money, show unpaid invoices, invoice status, or needs an invoice_id to record a payment.',
    input_schema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['all', 'unpaid', 'advance_paid', 'paid', 'cancelled'],
          description: 'Filter by invoice state. Default: unpaid.',
        },
      },
      required: [],
    },
  },

  {
    name: 'record_payment',
    description: 'Record a payment received against an existing invoice. Use when vendor says: advance received, deposit paid, booking confirmed, balance received, full payment done, paid in full, or similar. Always call list_invoices first if you need the invoice_id.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'UUID of the invoice. Required.' },
        amount_received: { type: 'integer', description: 'Amount received in whole rupees. Required.' },
        payment_type: {
          type: 'string',
          enum: ['advance', 'balance', 'partial'],
          description: 'advance = booking amount (triggers PDF). balance = full balance cleared (closes invoice). partial = partial, invoice stays open.',
        },
        notes: { type: 'string', description: 'Payment method, transaction reference. Optional.' },
      },
      required: ['invoice_id', 'amount_received', 'payment_type'],
    },
  },

  {
    name: 'update_routing_handle',
    description: 'Change the vendor TDW routing handle. Use ONLY when vendor explicitly asks to change their TDW code or handle.',
    input_schema: {
      type: 'object',
      properties: {
        new_handle: { type: 'string', description: 'The new handle. Will be uppercased. e.g. "PRIYA-PHOTO" or "DEV2026".' },
      },
      required: ['new_handle'],
    },
  },

  {
    name: 'update_invoice_prefix',
    description: 'Change the vendor invoice number prefix. Use ONLY when vendor explicitly asks to change their invoice prefix or numbering format. Warn them old invoices keep their numbers and counter does not reset.',
    input_schema: {
      type: 'object',
      properties: {
        new_prefix: { type: 'string', description: 'The new prefix. e.g. "DRP", "DEVROY". Keep it short — appears on every invoice.' },
      },
      required: ['new_prefix'],
    },
  },

  {
    name: 'get_my_tdw_link',
    description: 'Fetch the vendor\'s TDW link. Use whenever the vendor asks for their TDW link, wa.me link, or what to put in their Instagram bio. NEVER construct a TDW link yourself — always call this.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── Expenses ────────────────────────────────────────────────────────────────
  {
    name: 'log_expense',
    description: 'Log a business expense. Use when vendor mentions spending money on travel, equipment, assistant, studio, marketing, software, food, printing, commission, shoot, inventory, or anything business-related.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'integer', description: 'Amount spent in whole rupees. Required.' },
        category: {
          type: 'string',
          enum: ['travel', 'equipment', 'assistant', 'studio', 'marketing', 'software', 'food', 'printing', 'commission', 'shoot', 'inventory', 'other'],
          description: 'Expense category. Required.',
        },
        description: { type: 'string', description: 'Short description in vendor\'s words. e.g. "Ola to venue recce". Optional.' },
        expense_date: { type: 'string', description: 'Date in YYYY-MM-DD. Optional — defaults to today.' },
        client_name: { type: 'string', description: 'Client name if this expense is for a specific client. Optional.' },
        linked_lead_id: { type: 'string', description: 'UUID of linked lead if for a specific booking. Optional.' },
      },
      required: ['amount', 'category'],
    },
  },

  // ── Clients ─────────────────────────────────────────────────────────────────
  {
    name: 'add_client',
    description: 'Add a client to the vendor\'s client list. Use when vendor explicitly says "add client", "save as a client", "add to my clients". Phone is the dedup key — if a client with the same phone exists, the existing record is returned.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name as vendor stated it. Required.' },
        phone: { type: 'string', description: 'Phone in E.164 if given. e.g. +919876543210. Optional but strongly preferred.' },
        email: { type: 'string', description: 'Email if mentioned. Optional.' },
        referrer_name: { type: 'string', description: 'Name of person who referred this client. Optional.' },
        notes: { type: 'string', description: 'Any extra context vendor shared. Optional.' },
      },
      required: ['name'],
    },
  },

  {
    name: 'list_clients',
    description: 'List the vendor\'s clients. Use when vendor asks "show my clients", "who are my clients", "list clients".',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ── PWA-only tools ──────────────────────────────────────────────────────────

  {
    name: 'generate_client_walink',
    description: 'Generate a direct WhatsApp link for a lead or client so the vendor can message them in one tap. Use when vendor asks to send a message to a lead or client — you cannot send it yourself, but you can give them a one-tap link with a pre-drafted message. Always call list_leads or list_clients first to get the phone number if you do not already have it.',
    input_schema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number in E.164 format (e.g. +919876543210) or digits only (e.g. 919876543210). Required.',
        },
        name: {
          type: 'string',
          description: 'Name of the lead or client. Used to personalize the reply.',
        },
        draft_message: {
          type: 'string',
          description: 'The message text the vendor should send. Pre-filled in the WhatsApp link. Write this in the vendor\'s voice — plain, direct, Indian English. No corporate language.',
        },
      },
      required: ['phone', 'name', 'draft_message'],
    },
  },

  {
    name: 'clarify',
    description: 'Ask the vendor a clarifying question when their request is genuinely ambiguous between two equally likely options. Use sparingly — only when acting on the wrong interpretation would cause real harm (e.g. wrong invoice, wrong client). Do NOT use for minor uncertainties you can resolve from context.',
    input_schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The clarifying question. One sentence. e.g. "Which Priya — Priya Roy (Dec 14 wedding) or Priya Sharma (Feb 8 wedding)?"',
        },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: 'The options the vendor can choose from. 2-4 short labels. e.g. ["Priya Roy — Dec 14", "Priya Sharma — Feb 8"]',
        },
      },
      required: ['question', 'options'],
    },
  },

];

module.exports = { PWA_TOOLS };
