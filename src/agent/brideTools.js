// brideTools.js — bride agent tool schemas
//
// Mirrors src/agent/tools.js shape: this file exports ONLY the schemas
// that get sent to the model. The actual tool executors live as switch-case
// branches inside src/agent/brideEngine.js (mirroring how engine.js handles
// vendor tool execution).
//
// B1 shipped three tools. B2 adds list_muse and delete_muse_save.
// More added in B3 (planner) and B4 (vendor connections, Surprise Me).
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
    description: 'Record a durable fact about this bride or her wedding. Use whenever she shares something worth remembering long-term — family preferences, observations about people, taste signals, vendors she has already booked, things people said about her ideas. Notes are private and never sent to her. Tag with relevant labels (e.g. booked, family, preferences, taste).',
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
    name: 'list_muse',
    description: 'Look up saved images on the bride\'s Muse mood board. Use this whenever she asks about her saves — "what have I saved this week", "show me save 47", "what are my recent pastel saves", "what did mom add". Returns a structured list with save numbers, aesthetic tags, captions, contributor info, and image URLs. After getting the result, you can compose a natural reply describing the saves. If she wants to actually SEE one or more images, set the request_image_playback flag on the saves you want delivered — the engine will forward those images back to her via WhatsApp.',
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
        request_image_playback: {
          type: 'boolean',
          description: 'Optional. If true, the engine will send the actual images back to the bride via WhatsApp after replying with the text description. Use when she asks to see an image ("show me save 47", "what did mom save yesterday"). Do not use for broad list queries ("show me everything") — only specific lookups or short result sets.',
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
];

module.exports = { BRIDE_TOOLS };
