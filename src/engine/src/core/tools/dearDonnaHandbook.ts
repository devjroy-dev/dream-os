// dearDonnaHandbook.ts — Harvey's handbook lookup (was `consult_handbook`). Named
// THROUGH Donna (keeper of the room) so Harvey believes the access is hers to grant;
// plumbed direct — no extra model call. The name carries the gatekeeper framing for free.
// (Description framing left as-is for now; the gatekeeper voice lands with the soul pass.)
// NOT delegation to a Donna sub-agent and
// NOT back-office work: consulting his accumulated knowledge of the trade is an
// advisory act, his alone (a lawyer pulling the case himself). He names the section
// from the index he can see; this returns that section's text for him to advise from.
import type Anthropic from '@anthropic-ai/sdk';

export const DEAR_DONNA_HANDBOOK_TOOL: Anthropic.Tool = {
  name: 'dear_donna_handbook',
  description:
    "Pull a specific section of your own reference (the Codex) when grounding a business task — a pricing call, a platform or growth decision, a negotiation. Name the section by its number from the index in front of you: a section like '§7.1', a whole chapter like 'Chapter 7', or an appendix like 'Appendix C'. Returns that section's text for you to advise from in your own voice. Use it to perform a task well, never to lecture; consult quietly, then speak as if you simply knew it. Do not consult on routine clerical instructions.",
  input_schema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: "The section to pull, e.g. '§7.1', '§9.3', 'Chapter 21', 'Appendix C'.",
      },
    },
    required: ['ref'],
  },
};

// TDW_06 0081 · F-06.5 CURE (a): the ADVISOR-ROOM variant. Same hand, scope-legible
// description. Live, an advisor-Victor pulled his TRADE codex expecting SMM sections —
// the pull is field-bound (his trade), while the whole social-media Codex already rides
// his prefix open. ~4 wasted iterations, wrong-section noise, process narration leaking
// to the vendor. This description names the scope so the reach is right the first time.
export const ADVISOR_HANDBOOK_TOOL: Anthropic.Tool = {
  name: 'dear_donna_handbook',
  description:
    "Pull a specific section of your TRADE reference — the field-specific Codex for his craft (the photographer's, the planner's, and so on) — when a precise mechanic of that trade wants grounding. Name the section by its number from the trade index in front of you: '§7.1', 'Chapter 7', 'Appendix C'. This reaches ONLY the trade reference. Your social-media Codex is already open in full in your context — never reach here for it; you already have it whole. Returns the section's text to advise from in your own voice; consult quietly, then speak as if you simply knew it.",
  input_schema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: "The trade-reference section to pull, e.g. '§7.1', 'Chapter 21', 'Appendix C'. (Not for social-media topics — that Codex is already open.)",
      },
    },
    required: ['ref'],
  },
};
