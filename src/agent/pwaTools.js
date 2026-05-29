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
        client_name: { type: 'string', description: 'If this event is FOR a specific named client (e.g. "Priya\'s shoot"), put just their name here so it can be matched to the right person. Leave empty for person-less events like "edit photos" or "pay rent".' },
        confirmed_client: { type: 'boolean', description: 'Set true only after you showed disambiguation cards for client_name and the vendor confirmed which person. Skips the client match check.' },
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
        confirmed_duplicate: { type: 'boolean', description: 'Set true ONLY when you previously asked the vendor "is this the same [name] or a different person?" (or showed disambiguation options) AND they confirmed it is the same existing client. This skips the duplicate-name check and proceeds. Never set true on the first attempt — only after an explicit confirmation.' },
      },
      required: ['client_name'],
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
    name: 'cancel_invoice',
    description: "Cancel an invoice. Use when vendor says cancel, delete, remove, or void an invoice. Cancelled = deleted from the vendor's perspective. Always call list_invoices first if you need the invoice_id. Never hard-delete — cancelled state is the equivalent of deletion.",
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'UUID of the invoice to cancel. Required.' },
        reason:     { type: 'string', description: 'Optional one-line reason. e.g. "Client cancelled booking"' },
      },
      required: ['invoice_id'],
    },
  },


  // ── Block 1a tools ──────────────────────────────────────────────────────────

  {
    name: 'update_lead',
    description: 'Update editable fields on an existing lead. Use when vendor corrects a lead detail — name, date, budget, city, notes. Do NOT use for state changes; use update_lead_state for that.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id:      { type: 'string', description: 'UUID of the lead to update.' },
        name:         { type: 'string', description: 'Updated couple name.' },
        phone:        { type: 'string', description: 'Updated phone number.' },
        email:        { type: 'string', description: 'Updated email.' },
        wedding_date: { type: 'string', description: 'Updated wedding date in YYYY-MM-DD.' },
        wedding_city: { type: 'string', description: 'Updated wedding city.' },
        budget_min:   { type: 'number', description: 'Updated minimum budget in Rs.' },
        budget_max:   { type: 'number', description: 'Updated maximum budget in Rs.' },
        notes:        { type: 'string', description: 'Updated notes.' },
      },
      required: ['lead_id'],
    },
  },

  {
    name: 'lose_lead',
    description: 'Mark a lead as lost when the vendor signals rejection — "they went with someone else", "no response", "out of budget". Writes an audit note. Use instead of update_lead_state when a reason is available.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'UUID of the lead to mark lost.' },
        reason:  { type: 'string', description: 'Why the lead was lost. e.g. "Went with another vendor" or "Budget mismatch"' },
      },
      required: ['lead_id', 'reason'],
    },
  },

  {
    name: 'update_client',
    description: 'Update editable fields on an existing client — name, phone, email, notes.',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'UUID of the client to update.' },
        name:      { type: 'string', description: 'Updated name.' },
        phone:     { type: 'string', description: 'Updated phone number.' },
        email:     { type: 'string', description: 'Updated email.' },
        notes:     { type: 'string', description: 'Updated notes.' },
      },
      required: ['client_id'],
    },
  },

  {
    name: 'delete_client',
    description: 'Soft-delete a client. Use when vendor says "remove", "delete", or "archive" a client. The client is hidden from lists but linked invoices and leads are preserved.',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'UUID of the client to delete.' },
      },
      required: ['client_id'],
    },
  },

  {
    name: 'update_invoice',
    description: 'Update editable fields on an invoice. Only works when no payment has been recorded yet — locked after any payment. If locked, suggest cancel and re-issue.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id:     { type: 'string', description: 'UUID of the invoice to update.' },
        client_name:    { type: 'string', description: 'Updated client name.' },
        client_phone:   { type: 'string', description: 'Updated client phone.' },
        description:    { type: 'string', description: 'Updated description of services.' },
        amount_total:   { type: 'number', description: 'Updated total amount in Rs.' },
        amount_advance: { type: 'number', description: 'Updated advance amount in Rs.' },
        due_date:       { type: 'string', description: 'Updated due date in YYYY-MM-DD.' },
        notes:          { type: 'string', description: 'Updated notes.' },
      },
      required: ['invoice_id'],
    },
  },

  {
    name: 'update_expense',
    description: 'Update an existing expense record — amount, category, description, date.',
    input_schema: {
      type: 'object',
      properties: {
        expense_id:   { type: 'string', description: 'UUID of the expense to update.' },
        amount:       { type: 'number', description: 'Updated amount in Rs.' },
        category:     { type: 'string', enum: ['travel','equipment','editing','assistant','studio','printing','packaging','food','accommodation','marketing','software','other'], description: 'Updated category.' },
        description:  { type: 'string', description: 'Updated description.' },
        expense_date: { type: 'string', description: 'Updated date in YYYY-MM-DD.' },
        client_name:  { type: 'string', description: 'Updated client name this expense is for.' },
        notes:        { type: 'string', description: 'Updated notes.' },
      },
      required: ['expense_id'],
    },
  },

  {
    name: 'update_event',
    description: 'Update an existing event — title, date, time, kind, notes. Does not change state; use update_event_state for that.',
    input_schema: {
      type: 'object',
      properties: {
        event_id:   { type: 'string', description: 'UUID of the event to update.' },
        title:      { type: 'string', description: 'Updated event title.' },
        event_date: { type: 'string', description: 'Updated date in YYYY-MM-DD.' },
        event_time: { type: 'string', description: 'Updated time in HH:MM (24-hour).' },
        kind:       { type: 'string', enum: ['shoot','call','meeting','task','reminder','recce','fitting','trial','family','ceremony','social','other'], description: 'Updated event kind.' },
        notes:      { type: 'string', description: 'Updated notes.' },
      },
      required: ['event_id'],
    },
  },

  {
    name: 'delete_event',
    description: 'Soft-delete an event created in error. Distinct from cancelling — use update_event_state with cancelled for events that were planned but did not happen.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'UUID of the event to delete.' },
      },
      required: ['event_id'],
    },
  },

  {
    name: 'block_date',
    description: 'Mark a date as unavailable on the vendor calendar. Use when vendor says they are unavailable, out of town, or already booked on a specific date.',
    input_schema: {
      type: 'object',
      properties: {
        date:   { type: 'string', description: 'Date to block in YYYY-MM-DD format.' },
        reason: { type: 'string', description: 'Optional reason. e.g. "Family wedding", "Out of town"' },
      },
      required: ['date'],
    },
  },

  {
    name: 'unblock_date',
    description: 'Remove a blocked date from the vendor calendar.',
    input_schema: {
      type: 'object',
      properties: {
        block_id: { type: 'string', description: 'UUID of the block to remove. Get from list_availability.' },
        date:     { type: 'string', description: 'Date in YYYY-MM-DD. Alternative to block_id.' },
      },
    },
  },

  {
    name: 'list_availability',
    description: 'List the vendor calendar blocked dates. Use when vendor asks what dates they have blocked or wants to check their availability.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date filter in YYYY-MM-DD. Optional.' },
        to:   { type: 'string', description: 'End date filter in YYYY-MM-DD. Optional.' },
      },
    },
  },


  // ── Block 7: Schedules / Contracts / TDS ──────────────────────────────────

  {
    name: 'create_schedule',
    description: 'Create a milestone-based payment schedule on an invoice. Use when vendor says "split this invoice into 30/40/30" or mentions booking/shoot/delivery payment stages. Milestones must sum to 100%.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'UUID of the invoice to attach the schedule to.' },
        milestones: {
          type: 'array',
          description: 'List of payment milestones. Must sum to 100%.',
          items: {
            type: 'object',
            properties: {
              label:    { type: 'string', description: 'Milestone name. e.g. "Booking", "Shoot day", "Delivery"' },
              pct:      { type: 'number', description: 'Percentage of total invoice. e.g. 30 for 30%.' },
              due_date: { type: 'string', description: 'Due date in YYYY-MM-DD. Optional.' },
            },
            required: ['label', 'pct'],
          },
        },
      },
      required: ['invoice_id', 'milestones'],
    },
  },

  {
    name: 'mark_milestone_paid',
    description: 'Mark a payment schedule milestone as paid and update the parent invoice amount. Use when vendor says "Priya paid the booking amount" or "milestone 1 received". Also updates the invoice running total.',
    input_schema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string', description: 'UUID of the milestone to mark paid.' },
        amount_paid:  { type: 'number', description: 'Amount received in Rs. May differ from amount_due (partial/negotiated).' },
      },
      required: ['milestone_id', 'amount_paid'],
    },
  },

  {
    name: 'attach_contract',
    description: 'Save a contract PDF forwarded by the vendor on WhatsApp. Downloads the file from the media URL and stores it. Use when vendor forwards a PDF and says "save this as X\'s contract."',
    input_schema: {
      type: 'object',
      properties: {
        title:     { type: 'string',  description: 'Contract title. e.g. "Booking contract — Priya Kapoor"' },
        client_id: { type: 'string',  description: 'UUID of the client to link. Optional.' },
        file_url:  { type: 'string',  description: 'Twilio media URL for the PDF attachment.' },
      },
      required: ['title', 'file_url'],
    },
  },

  {
    name: 'list_contracts',
    description: 'List the vendor\'s saved contracts. Use when vendor asks "show me contracts" or "do I have a contract for Priya?"',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client UUID. Optional.' },
      },
    },
  },

  {
    name: 'log_tds',
    description: 'Log a Tax Deducted at Source entry. Use when vendor says "ABC Corp deducted 10% TDS on Rs 1 lakh" or "log TDS from Infosys". Computes tds_amount and net_received automatically. Returns running FY totals.',
    input_schema: {
      type: 'object',
      properties: {
        client_name:     { type: 'string', description: 'Name of the company that deducted TDS.' },
        gross_amount:    { type: 'number', description: 'Gross invoice amount before TDS deduction in Rs.' },
        tds_rate:        { type: 'number', description: 'TDS rate as percentage. e.g. 10 for 10%.' },
        deduction_date:  { type: 'string', description: 'Date TDS was deducted, YYYY-MM-DD. Defaults to today.' },
        section:         { type: 'string', description: 'Income tax section. e.g. "194J" for professional services, "194C" for contractors.' },
        financial_year:  { type: 'string', description: 'Financial year string. e.g. "FY2026-27". Defaults to current FY.' },
        invoice_id:      { type: 'string', description: 'UUID of related invoice. Optional.' },
        client_id:       { type: 'string', description: 'UUID of related client. Optional.' },
        client_pan:      { type: 'string', description: 'Deductor PAN. e.g. "AABCS1234X". Optional.' },
        client_tan:      { type: 'string', description: 'Deductor TAN. e.g. "DELS01234C". Optional.' },
        certificate_no:  { type: 'string', description: 'TDS certificate / Form 16A number. Optional.' },
      },
      required: ['client_name', 'gross_amount', 'tds_rate'],
    },
  },

  {
    name: 'query_tds_summary',
    description: 'Get TDS summary for a financial year — total gross, total TDS deducted, net received, breakdown by section. Use when vendor asks "how much TDS this year?" or "what\'s my total deduction for FY2026-27?"',
    input_schema: {
      type: 'object',
      properties: {
        financial_year: { type: 'string', description: 'e.g. "FY2026-27". Defaults to current Indian FY if omitted.' },
      },
    },
  },

  // ── Studio Suite — Prestige only ───────────────────────────────────────────
  // These tools only execute when vendor.tier === 'prestige'.
  // Non-Prestige vendors receive a friendly tier error.

  {
    name: 'assign_task',
    description: 'Create a task assigned to a team member. Use when vendor says things like "Tell Rohit to...", "Assign X to Y", or "Create a task for...". If assigned_to_member_name is provided but no unique match is found in the team roster, call clarify to resolve the ambiguity before creating. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {
        title:                  { type: 'string',  description: 'Task title. Short and action-oriented. e.g. "Edit Priya highlight reel"' },
        description:            { type: 'string',  description: 'Optional detail. e.g. "3-minute reel, gold tones, drone shots first 30s"' },
        assigned_to_member_name: { type: 'string', description: 'Team member name as the vendor said it. The executor will fuzzy-match against the roster.' },
        linked_event_id:        { type: 'string',  description: 'UUID of the related event if mentioned.' },
        due_date:               { type: 'string',  description: 'Due date in YYYY-MM-DD.' },
        priority:               { type: 'string',  enum: ['low','normal','high','urgent'], description: 'Task priority. Default: normal.' },
      },
      required: ['title'],
    },
  },

  {
    name: 'team_pay',
    description: 'Log that the vendor paid (or owes) a team member for a job. Use when vendor says "I paid Rohit X" or "Log Rs 5000 for Rohit for Saturday shoot". Marks an existing owed payment as paid, or creates a new paid record if no prior obligation exists. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {
        team_member_name: { type: 'string',  description: 'Name of the team member as the vendor said it.' },
        amount_inr:       { type: 'number',  description: 'Amount in Rs. e.g. 5000' },
        description:      { type: 'string',  description: 'What the payment is for. e.g. "2-day shoot for Priya wedding"' },
        paid_via:         { type: 'string',  description: 'Payment method: cash, upi, bank, or other.' },
      },
      required: ['team_member_name', 'amount_inr'],
    },
  },

  {
    name: 'pin_team_message',
    description: 'Post a pinned broadcast message to the team. Use for important standing info — shoot logistics, venue address, call time — that needs to stay visible at the top of the team feed. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {
        body:            { type: 'string', description: 'The message to pin. Should be concise and action-relevant.' },
        linked_event_id: { type: 'string', description: 'UUID of the related event, if applicable.' },
      },
      required: ['body'],
    },
  },

  {
    name: 'team_briefing',
    description: 'Fetch the full team briefing — today\'s events with assignments, open/overdue tasks, pinned messages, this week\'s calendar, and owed team payments. Call whenever the vendor asks about their team, what\'s on today, or who owes what. Read-only — does not consume quota. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },


  {
    name: 'list_expenses',
    description: 'List recent vendor expenses. Use when vendor asks "show my expenses", "what did I spend recently", "list expenses". Returns last 20 expenses sorted by date.',
    input_schema: {
      type: 'object',
      properties: {
        client_name: { type: 'string', description: 'Filter by client name. Optional.' },
        category:    { type: 'string', description: 'Filter by category e.g. travel, equipment. Optional.' },
      },
      required: [],
    },
  },
  {
    name: 'list_team',
    description: 'List all team members. Use when vendor asks "show my team", "who is on my team", "list team members". Returns active team members with their roles.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'clarify',
    description: 'Ask the vendor a question by showing tappable cards instead of prose. Use this WHENEVER your question has a small set of discrete answers (2-4) the vendor can pick from — which client they mean, existing-vs-new, yes/no confirmations, which invoice. The vendor taps instead of re-typing. Always prefer this over asking in plain text when the answers are knowable. Only ask in prose when the answer is genuinely open-ended (e.g. a freeform amount or description).',
    input_schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The clarifying question. One sentence. e.g. "Which Priya — Priya Roy (Dec 14 wedding) or Priya Sharma (Feb 8 wedding)?"',
        },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'What the vendor sees on the tappable card. Short, human. e.g. "Priya Roy — Dec 14 wedding"' },
              value: { type: 'string', description: 'The unambiguous reference sent back when tapped, so you never re-ask. Use a "key:id" form that resolves the exact record — e.g. "invoice_id:abc-123", "lead_id:def-456", "client_id:ghi-789". When the options are a yes/no confirmation rather than records, use "confirm:yes" / "confirm:no".' },
            },
            required: ['label', 'value'],
          },
          description: 'The choices the vendor can tap. 2-4 options. Each carries a human label and a machine value. ALWAYS put the resolving id in value so a tap is unambiguous and you do not have to ask again. e.g. [{label:"Priya Roy — Dec 14", value:"lead_id:abc-123"}, {label:"Priya Sharma — Feb 8", value:"lead_id:def-456"}]',
        },
      },
      required: ['question', 'options'],
    },
  },

];

module.exports = { PWA_TOOLS };
