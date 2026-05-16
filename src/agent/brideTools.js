// brideTools.js — bride agent tool schemas
//
// Mirrors src/agent/tools.js shape: this file exports ONLY the schemas
// that get sent to the model. The actual tool executors live as switch-case
// branches inside src/agent/brideEngine.js (mirroring how engine.js handles
// vendor tool execution).
//
// B1 shipped three tools. B2 adds list_muse, delete_muse_save, invite_to_circle,
// list_circle. More added in B3 (planner) and B4 (vendor connections, Surprise Me).
// See docs/ROADMAP_BRIDE.md.
//
// NOTE ON MUSE SAVES: there is intentionally NO save_to_muse tool.
// Muse saves happen automatically when the bride or a circle member forwards
// an image or a Pinterest/Instagram link via WhatsApp — handled in brideIndex.js
// before the agent runs. The agent receives a synthesized context message
// ("we just saved this to Muse as save X") and composes a natural reply.

const BRIDE_TOOLS = [
  {
    name: 'note_to_self',
    description: 'Record a durable fact about this bride or her wedding. Use whenever she shares something worth remembering long-term — family preferences, observations about people, taste signals, vendors she has already booked, things people said about her ideas. Notes are private and never sent to her. Tag with relevant labels (e.g. booked, family, preferences, taste). Call only ONCE per turn for a given insight — do not record the same fact in multiple variations within one turn.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'A short factual note. One sentence. Examples: "Mom prefers gold over pastels", "Sabyasachi for attire", "Fiancé allergic to roses", "Wants to incorporate Bengali traditions".',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags. Common: booked, family, preferences, taste, vendor, decision, personal.',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'save_wedding_detail',
    description: 'Update a single structured field on the bride\'s couple profile. Call this whenever she mentions a change or fresh value for one of the five structured fields. Always call once per field — if she mentions two fields in one message (e.g. "we moved the date to March 15 and the venue is now Jaipur"), make two separate tool calls.',
    input_schema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['partner_name', 'wedding_date', 'wedding_city', 'budget_total', 'events_planned'],
          description: 'Which structured field to update.',
        },
        value: {
          description: 'The new value. For wedding_date: YYYY-MM-DD if exact, or month/season string like "February 2027" or "winter 2027". For budget_total: integer rupees (35 lakhs = 3500000, 1 crore = 10000000). For events_planned: array of strings like ["mehndi", "sangeet", "wedding", "reception"]. For partner_name and wedding_city: plain string.',
        },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'add_event',
    description: 'Add an event to the bride\'s calendar. Use for shoots (pre-wedding, engagement, bridal portfolio), fittings, trials, vendor meetings, calls with vendors or planners, family events, ceremony events, social plans she mentions in passing. Always needs a date and a kind. If she mentions a time too, include it. Location, contact, or prep notes go in notes.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short event title. Examples: "Pre-wedding shoot with Stories By Joseph Radhik", "Fitting at Studio Anvaya", "Brunch with mom", "Decor recce at Leela", "Sangeet rehearsal", "Call with planner".',
        },
        event_date: {
          type: 'string',
          description: 'YYYY-MM-DD format. Convert relative dates ("Saturday", "next Monday", "the 15th") to the most likely upcoming actual date using context.',
        },
        event_time: {
          type: 'string',
          description: 'HH:MM in 24-hour format if mentioned (e.g. "15:30" for 3:30pm). Optional — omit if she did not mention a time.',
        },
        kind: {
          type: 'string',
          enum: ['shoot', 'call', 'fitting', 'trial', 'meeting', 'task', 'reminder', 'recce', 'family', 'ceremony', 'social', 'other'],
          description: 'Event category. Use shoot for any photo or video shoot (pre-wedding, engagement, bridal, portfolio shoots with photographer/MUA/designer). Use call for scheduled phone consultations with vendors or planners. Use fitting for outfit fittings. Use trial for hair/makeup/menu trials. Use meeting for in-person vendor or planner meetings. Use recce for venue visits. Use family for family events (mehndi, haldi, sangeet). Use ceremony for the wedding day and reception. Use social for brunches/lunches/dinners/coffee/shopping. Use task for to-dos with a date. Use reminder for things she wants flagged. Use other if nothing else fits.',
        },
        notes: {
          type: 'string',
          description: 'Optional. Location, contact, prep notes, anything else worth remembering about this event.',
        },
      },
      required: ['title', 'event_date', 'kind'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a to-do for the bride. Use when she asks you to remember something to do — "remind me to call the venue Monday", "I need to follow up with the designer", "add: book a hotel for Mom". Tasks are different from events: events have a fixed time slot ("trial Saturday 11am"), tasks are things to do that may or may not have a deadline. If she mentions a date, capture it as due_date — the date IS the urgency signal (closer = more urgent). If she does not mention a date, leave due_date empty; the task will sort to the bottom of her list.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short to-do text. Examples: "Call the venue about parking", "Follow up with Anvaya on contract", "Book hotel for Mom and Dad", "Confirm sangeet playlist with DJ".',
        },
        due_date: {
          type: 'string',
          description: 'Optional. YYYY-MM-DD format. Convert relative dates ("Monday", "next week", "by the 20th") to the most likely actual date using context. Omit entirely if she did not mention a deadline. The date IS the urgency — sooner sorts higher in her list.',
        },
        event_name: {
          type: 'string',
          description: 'Optional. Free-text tag for which wedding event this task relates to — "mehndi", "wedding", "reception", "engagement", "honeymoon". Use only if she mentions it.',
        },
        notes: {
          type: 'string',
          description: 'Optional. Anything extra worth remembering — context, contact, why it matters.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    description: 'Look up the bride\'s tasks. Use when she asks "what\'s on my list", "what do I need to do this week", "what\'s pending", "show me my done tasks", "anything overdue". Returns task rows with id, title, status, due_date, event_name, notes — sorted by due_date ascending (overdue and soonest first), tasks without a due_date at the bottom. Use the returned data to compose a natural reply. To act on a specific task (complete/update/delete) you MUST first resolve its id via this tool; do not invent ids.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'done', 'all'],
          description: 'Optional. Default "pending" — only open tasks. Use "all" if she asks for everything including done. Use "done" if she asks what she has finished.',
        },
        due_before: {
          type: 'string',
          description: 'Optional. YYYY-MM-DD. Filter to tasks due on or before this date. Use when she asks "what is due this week" or "overdue stuff".',
        },
        event_name: {
          type: 'string',
          description: 'Optional. Filter to tasks tagged with a specific wedding event ("mehndi", "wedding").',
        },
        limit: {
          type: 'integer',
          description: 'Optional. Max rows to return. Default 20. Max 50.',
        },
      },
      required: [],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done. Use when she says "done with X", "finished the venue call", "tick off the hotel booking". The task_id must be resolved first via list_tasks if she referenced the task by name — do not invent ids. If multiple tasks match her reference and you are unsure which one, ask her before calling this tool.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'UUID of the task to complete. Get this from list_tasks.',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'update_task',
    description: 'Change something about an existing task — its title, due date, event_name, or notes. Use when she says "move that venue call to Tuesday", "actually rename that one to...", "remove the deadline on the florist task". Pass only the fields she wants changed. The task_id must be resolved first via list_tasks if she referenced the task by name.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'UUID of the task to update. Required.',
        },
        title: {
          type: 'string',
          description: 'Optional. New title.',
        },
        due_date: {
          type: 'string',
          description: 'Optional. New due_date in YYYY-MM-DD format. Pass the literal string "null" (four characters) to CLEAR an existing due_date.',
        },
        event_name: {
          type: 'string',
          description: 'Optional. New event_name tag, or "null" to clear.',
        },
        notes: {
          type: 'string',
          description: 'Optional. New notes, or "null" to clear.',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently remove a task. Use when she clearly asks to delete one — "drop that venue task", "remove the hotel booking from my list". Destructive and not recoverable. The task_id must be resolved first via list_tasks. If she referenced the task by name and there is any ambiguity (multiple matches, vague reference), confirm with her before calling this tool.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'UUID of the task to delete. Required.',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'list_events',
    description: 'Look up the bride\'s calendar — trials, fittings, shoots, family events, ceremonies, meetings. Use when she asks "what\'s on my calendar this week", "anything Saturday", "show me everything for sangeet", "what\'s coming up". Returns event rows with id, title, event_date, event_time, kind, state, notes — sorted by event_date ascending (soonest first), then event_time ascending. To act on a specific event (update/delete) you MUST first resolve its id via this tool; do not invent ids.',
    input_schema: {
      type: 'object',
      properties: {
        date_from: {
          type: 'string',
          description: 'Optional. YYYY-MM-DD. Filter to events on or after this date. Use for "anything next week", "events this month".',
        },
        date_to: {
          type: 'string',
          description: 'Optional. YYYY-MM-DD. Filter to events on or before this date. Use with date_from for a range, or alone for "anything before the wedding".',
        },
        kind: {
          type: 'string',
          enum: ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'],
          description: 'Optional. Filter to one kind. Use when she asks about a specific category — "all my trials", "any shoots this week".',
        },
        state: {
          type: 'string',
          enum: ['upcoming', 'done', 'cancelled', 'all'],
          description: 'Optional. Default "upcoming" — only future/active events. Use "all" if she asks for everything including done/cancelled. Use "done" if she asks what already happened.',
        },
        limit: {
          type: 'integer',
          description: 'Optional. Max rows to return. Default 20. Max 50.',
        },
      },
      required: [],
    },
  },
  {
    name: 'update_event',
    description: 'Change something about an existing event — its title, date, time, kind, notes, or state. Use when she says "move the trial to Sunday", "rename that to Anvaya trial", "actually it\'s a fitting not a trial", "cancel the venue recce". Pass only the fields she wants changed. The event_id must be resolved first via list_events if she referenced the event by name. event_date cannot be cleared (events must have a date) — only changed.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'UUID of the event to update. Required. Get from list_events.',
        },
        title: {
          type: 'string',
          description: 'Optional. New title.',
        },
        event_date: {
          type: 'string',
          description: 'Optional. New event_date in YYYY-MM-DD format. Cannot be cleared (events must have a date).',
        },
        event_time: {
          type: 'string',
          description: 'Optional. New event_time in HH:MM format (24-hour, e.g. "15:30" for 3:30pm). Pass the literal string "null" (four characters) to CLEAR an existing event_time.',
        },
        kind: {
          type: 'string',
          enum: ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'fitting', 'trial', 'family', 'ceremony', 'social', 'other'],
          description: 'Optional. Change the event kind — e.g. trial → fitting, meeting → call.',
        },
        notes: {
          type: 'string',
          description: 'Optional. New notes, or "null" to clear.',
        },
        state: {
          type: 'string',
          enum: ['upcoming', 'done', 'cancelled'],
          description: 'Optional. Move the event to a different state. Use "done" when she finished an event ("I had the trial yesterday, mark it done"), "cancelled" when she\'s scrapping it, "upcoming" to revive a cancelled or done event.',
        },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_event',
    description: 'Permanently remove an event from the bride\'s calendar. Use when she clearly asks to delete one — "drop that trial entirely", "remove the venue recce, never going". Destructive and not recoverable. If she just wants to cancel (not delete), use update_event with state="cancelled" instead — that preserves the record. The event_id must be resolved first via list_events. If she referenced the event by name and there is any ambiguity, confirm with her before calling this tool.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'UUID of the event to delete. Required.',
        },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'add_booking',
    description: 'Record a vendor commitment — the bride has hired/locked in a vendor. Use when she says "I booked Anvaya for 2 lakhs", "locked in the photographer for 1.5L", "we\'re going with the caterer at 3L total, 50k advance paid". CATEGORY IS REQUIRED — if she did not specify which kind of vendor (photographer, venue, etc), ask her before calling this tool. Amounts are in rupees as integers (2 lakh = 200000, not 2). Do not call this tool to "add a booking" if she has not actually committed (use list_muse / list_events for exploration; bookings are commitments, not options).',
    input_schema: {
      type: 'object',
      properties: {
        vendor_name: {
          type: 'string',
          description: 'Vendor name as she refers to them. Examples: "Anvaya Photography", "Anjali Sharma", "The Lalit, Goa". Required.',
        },
        category: {
          type: 'string',
          enum: ['photographer', 'videographer', 'mua', 'designer', 'venue', 'caterer', 'decor', 'florist', 'music', 'planner', 'other'],
          description: 'Required. Vendor category. If she did not specify, ASK her before calling this tool — do not guess.',
        },
        amount_total: {
          type: 'integer',
          description: 'Optional. Total contract value in rupees (integer, no decimals). 2 lakh = 200000. Leave empty if she did not state a final figure yet.',
        },
        amount_advance: {
          type: 'integer',
          description: 'Optional. Advance amount agreed, in rupees. Use only if she specified an advance distinct from the total.',
        },
        balance_due_date: {
          type: 'string',
          description: 'Optional. YYYY-MM-DD. When the remaining balance is due. Use only if she mentioned a deadline.',
        },
        notes: {
          type: 'string',
          description: 'Optional. Anything extra worth remembering — terms, what is included, contact info.',
        },
      },
      required: ['vendor_name', 'category'],
    },
  },
  {
    name: 'list_bookings',
    description: 'Look up the bride\'s vendor commitments. Use when she asks "who have I booked", "show me my bookings", "what have I paid for the photographer", "anything due this month". Returns booking rows with id, vendor_name, category, amount_total, amount_paid, balance_due_date, state, notes — sorted by balance_due_date ascending (overdue and soonest-due first), bookings with no deadline at the bottom sorted by most recently added. To act on a specific booking (update/delete/record_payment) you MUST first resolve its id via this tool; do not invent ids.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['photographer', 'videographer', 'mua', 'designer', 'venue', 'caterer', 'decor', 'florist', 'music', 'planner', 'other'],
          description: 'Optional. Filter to one category.',
        },
        state: {
          type: 'string',
          enum: ['booked', 'advance_paid', 'paid', 'all'],
          description: 'Optional. Default "all" — show every active booking. Use "paid" to see fully-paid ones, "booked" or "advance_paid" for things she still owes money on.',
        },
        vendor_name: {
          type: 'string',
          description: 'Optional. Partial-match filter on vendor name (case-insensitive). Use when she asks about a specific vendor by name.',
        },
        limit: {
          type: 'integer',
          description: 'Optional. Max rows to return. Default 20. Max 50.',
        },
      },
      required: [],
    },
  },
  {
    name: 'update_booking',
    description: 'Change something about an existing booking — vendor_name, category, amount_total, amount_advance, balance_due_date, or notes. Use when she says "update the photographer total to 2.2 lakhs", "change the venue category to caterer, I had it wrong", "move the florist deadline to Dec 15". DO NOT use this tool to record a payment — use record_payment for that (it updates amount_paid AND state atomically). The booking_id must be resolved first via list_bookings.',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: {
          type: 'string',
          description: 'UUID of the booking to update. Required.',
        },
        vendor_name: {
          type: 'string',
          description: 'Optional. New vendor name.',
        },
        category: {
          type: 'string',
          enum: ['photographer', 'videographer', 'mua', 'designer', 'venue', 'caterer', 'decor', 'florist', 'music', 'planner', 'other'],
          description: 'Optional. New category.',
        },
        amount_total: {
          type: 'integer',
          description: 'Optional. New total in rupees. Pass -1 to CLEAR an existing amount_total (set to null).',
        },
        amount_advance: {
          type: 'integer',
          description: 'Optional. New advance in rupees. Pass -1 to CLEAR.',
        },
        balance_due_date: {
          type: 'string',
          description: 'Optional. New balance_due_date in YYYY-MM-DD. Pass the literal string "null" to CLEAR.',
        },
        notes: {
          type: 'string',
          description: 'Optional. New notes, or "null" to clear.',
        },
      },
      required: ['booking_id'],
    },
  },
  {
    name: 'delete_booking',
    description: 'Permanently remove a booking. Use when the bride has DROPPED a vendor entirely — "we\'re not going with Anvaya, remove them", "scrap the caterer booking". Destructive and not recoverable. Any receipts linked to this booking are NOT deleted — they become standalone records. The booking_id must be resolved first via list_bookings.',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: {
          type: 'string',
          description: 'UUID of the booking to delete. Required.',
        },
      },
      required: ['booking_id'],
    },
  },
  {
    name: 'record_payment',
    description: 'Record a payment against an existing booking. Use when she says "I paid the photographer 50k", "transferred 1.5L to the venue", "advance of 25k to the MUA today". This tool updates the booking\'s amount_paid AND state in one atomic transaction — the bride\'s state moves from booked → advance_paid → paid automatically based on amounts. The booking_id must be resolved first via list_bookings. Amounts are in rupees as integers (50k = 50000). DO NOT use update_booking to change amount_paid — use this tool, always.',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: {
          type: 'string',
          description: 'UUID of the booking the payment is for. Required.',
        },
        amount: {
          type: 'integer',
          description: 'Payment amount in rupees, integer. 50k = 50000. Required. Negative amounts are allowed (to reverse a recorded payment), but use sparingly — only when she explicitly asks to reverse one.',
        },
        payment_date: {
          type: 'string',
          description: 'Optional. YYYY-MM-DD. When the payment was made. Defaults to today if not specified.',
        },
      },
      required: ['booking_id', 'amount'],
    },
  },
  {
    name: 'list_muse',
    description: 'Look up saved images on the bride\'s Muse mood board. Use this whenever she asks about her saves — "what have I saved this week", "show me save 47", "what are my recent pastel saves", "what did mom add". Returns a structured list with save numbers, aesthetic tags, captions, contributor info, and image URLs. After getting the result, you can compose a natural reply describing the saves. If she wants to actually SEE one or more images, set the request_image_playback flag — the engine will forward those images back to her via WhatsApp.',
    input_schema: {
      type: 'object',
      properties: {
        save_number: {
          type: 'integer',
          description: 'Optional. Look up one specific save by its number. Used when she references a save by number ("show me save 47").',
        },
        limit: {
          type: 'integer',
          description: 'Optional. Number of saves to return when listing recent. Default 10. Max 30.',
        },
        aesthetic_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional. Filter to saves containing ANY of these tags. Locked taxonomy: moody, editorial, pastel, OTT, minimal, candid, grand, rustic, modern, ethnic, elegant, old money. Pass lower case, exact strings (including the space in "old money").',
        },
        saved_by: {
          type: 'string',
          enum: ['bride', 'circle_member'],
          description: 'Optional. Filter to saves added by the bride only ("my saves"), or by any circle member ("what mom added", "what did the circle add").',
        },
        session_id: {
          type: 'string',
          description: 'Optional. Filter to saves added during a specific circle session. Use when the bride confirms she wants to see images from a session you just surfaced in a summary preamble — pass the session_id from that summary. Format: UUID.',
        },
        request_image_playback: {
          type: 'boolean',
          description: 'Optional. If true, the engine will send the actual images back to the bride via WhatsApp after replying with the text description. Use when she asks to see an image ("show me save 47", "yeah send them here", "what did mom save yesterday"). Do not use for broad list queries ("show me everything") — only specific lookups or short result sets.',
        },
      },
      required: [],
    },
  },
  {
    name: 'delete_muse_save',
    description: 'Permanently remove a Muse save from the bride\'s mood board. Use when she clearly asks to delete a save by number or by reference ("delete save 47", "remove that last one"). Bride can delete any save on her board, including ones added by circle members. Circle members can ONLY delete their own contributions — the executor enforces this, but you should not call this tool from a circle member\'s conversation unless they explicitly ask to delete one of their own saves. This is destructive and not recoverable in B2 — confirm intent if ambiguous, but do NOT confirm if she clearly named the save.',
    input_schema: {
      type: 'object',
      properties: {
        save_number: {
          type: 'integer',
          description: 'The save_number of the muse save to delete. Required.',
        },
      },
      required: ['save_number'],
    },
  },
  {
    name: 'invite_to_circle',
    description: 'Generate an invite link for someone the bride wants to add to her wedding circle. Use when she says things like "add my mom", "invite my sister", "send the link to my fiancé". The circle is the group of people who can contribute to her Muse mood board (images, Pinterest pins, thoughts). At B2 the cap is 3 active circle members per bride — if she already has 3 active or pending, this tool returns a limit-reached error and you should let her know to remove someone first. Returns the invite link as a wa.me URL the bride can forward via WhatsApp.',
    input_schema: {
      type: 'object',
      properties: {
        invitee_name: {
          type: 'string',
          description: 'How the bride refers to this person. Examples: "Mom", "Priya", "my sister Nisha", "Anjali\'s mom". Used in the welcome greeting and in summaries surfaced to the bride.',
        },
        role: {
          type: 'string',
          enum: ['partner', 'family', 'inner_circle'],
          description: 'Relationship category. Use "partner" for fiancé/spouse only. Use "family" for parents, siblings, in-laws, cousins, extended family. Use "inner_circle" for close friends, best friends, maid of honor — the chosen-family tier. If genuinely ambiguous, default to "family" — it\'s the most common.',
        },
      },
      required: ['invitee_name', 'role'],
    },
  },
  {
    name: 'list_circle',
    description: 'Look up the bride\'s circle — who has been invited, who has joined, who is pending. Use when she asks "who\'s in my circle", "did mom join yet", "who have I invited", "did anyone claim my invite". Returns a list of circle members with their names, roles, status (active/pending/removed), and timestamps. After getting the result, compose a natural reply describing who is on her circle and their state.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'pending', 'all'],
          description: 'Optional. Filter by status. Default "all" — show every circle member regardless of state.',
        },
      },
      required: [],
    },
  },
];

module.exports = { BRIDE_TOOLS };
