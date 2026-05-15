// brideTools.js — bride agent tool schemas
//
// Mirrors src/agent/tools.js shape: this file exports ONLY the schemas
// that get sent to the model. The actual tool executors live as switch-case
// branches inside src/agent/brideEngine.js (mirroring how engine.js handles
// vendor tool execution).
//
// B1 ships three tools. More added in B2 (Muse, Circle), B3 (planner),
// B4 (vendor connections, Surprise Me) — see docs/ROADMAP_BRIDE.md.

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
];

module.exports = { BRIDE_TOOLS };
