// introduce.ts — R9-J1 · THE INTRODUCTION HANDS. CE-42 seat E2, 4a door rider.
//
// ═══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════
// 4a shipped the writer, the dark gate, E3, `chipState`, `0161` and its router
// arm — and nothing that could REACH any of it (e-5). On the walk of 2026-09-10
// DEV440 asked Victor to send his page to a number he had met, and the ask went
// to `donna_lead`, because `donna_lead` was the only hand in the bag that could
// take a number and a note. The bytes were on the tree; the door was not.
//
// ═══ THIS FILE IS relayCouple.ts's SHAPE, DELIBERATELY ═══════════════════════
// Same two-hand split (stage hands over, send passes on an approval), same
// purity, same `{ display }`-only outcome, same refusal to give the model an
// identifier for the draft. A differently-shaped twin would be a second dialect
// for one motion, and the door would have to learn both.
//
// ═══ PURE. NO DATABASE, NO TRANSPORT, NO SNAPSHOT ════════════════════════════
// These validate shape and return a sentence Donna can read back. `mutated` is
// deliberately NOT set: nothing was mutated. The vendor-facing bytes are the
// DOOR's — founder-vetoed in src/lib/victorLines.js and composed in
// src/lib/vendor/introductions.js — and nothing in this file crosses to a
// vendor, nor may anything here be paraphrased into something that does.
//
// ═══ THE DESCRIPTIONS ARE FOUNDER-VETOED BYTES ═══════════════════════════════
// Model-facing copy, vetoed by the chair 2026-09-10 under W-1, pronoun-free at
// his instruction. They are what decides whether an introduction ask reaches
// this hand or `donna_lead` again, so the disambiguation is written into them
// rather than left to inference — and they are not edited without a fresh veto.

import type Anthropic from '@anthropic-ai/sdk';
import type { ToolOutcome } from '../snapshotTypes.js';

export const DONNA_INTRODUCTION_STAGE_TOOL: Anthropic.Tool = {
  name: 'donna_introduction_stage',
  description:
    "Hand over a message the owner wants sent to someone the owner MET IN PERSON and who has never contacted this business, so it can be put in front of the owner for approval. " +
    "Use this when the owner asks to send their page, their work or their storefront to a number they give you, naming where they met. " +
    "This is NOT a lead: do not log anything. This is NOT a message to a client — those go through the relay hand. " +
    "This does NOT send anything and does NOT reach the person; it hands the request over to be shown to the owner, who must approve it first. " +
    "recipient_phone is the number the owner gave you, with its country code. recipient_name is what the owner calls them. " +
    "where_met is the place the owner named — if none was named, ASK; without it nothing can be sent. " +
    "You do not write the message: its words are fixed and the door supplies them.",
  input_schema: {
    type: 'object',
    properties: {
      recipient_phone: {
        type: 'string',
        description: 'The number the owner gave you, with its country code.',
      },
      recipient_name: {
        type: 'string',
        description: 'What the owner calls them.',
      },
      where_met: {
        type: 'string',
        description: 'The place the owner named. If none was named, ask — without it nothing can be sent.',
      },
    },
    required: ['recipient_phone', 'recipient_name', 'where_met'],
  },
};

export const DONNA_INTRODUCTION_SEND_TOOL: Anthropic.Tool = {
  name: 'donna_introduction_send',
  description:
    "Pass on the owner's approval to send the introduction they were just shown. " +
    "Use this ONLY when the owner has affirmatively answered the question naming who it goes to. " +
    "recipient_name must be who the OWNER named in the approval — if someone else was named, or nobody, pass on exactly what was said and nothing will move. " +
    "You do not choose which introduction this is and you do not send it; the one shown is the one that goes, and only if the answer matches it.",
  input_schema: {
    type: 'object',
    properties: {
      recipient_name: {
        type: 'string',
        description: "Who the owner named in the approval, in the owner's own words. Do not substitute a name that was not said.",
      },
    },
    required: ['recipient_name'],
  },
};

// The two names, exported as a set so the door and the benches read ONE home
// rather than three string literals that can drift apart. Disjoint from
// RELAY_SIGNAL_NAMES and from `donna_lead` by construction, and asserted so by a
// cell — the walk of 2026-09-10 is what a collision between these families
// actually costs.
export const INTRODUCTION_SIGNAL_NAMES: ReadonlySet<string> = new Set([
  DONNA_INTRODUCTION_STAGE_TOOL.name,
  DONNA_INTRODUCTION_SEND_TOOL.name,
]);

export const INTRODUCTION_TOOLS: Anthropic.Tool[] = [
  DONNA_INTRODUCTION_STAGE_TOOL,
  DONNA_INTRODUCTION_SEND_TOOL,
];

type StageInput = { recipient_phone?: unknown; recipient_name?: unknown; where_met?: unknown };
type SendInput = { recipient_name?: unknown };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * SIGNAL. Validates shape and returns a Donna-facing sentence. An ERROR display
 * is the estate's own convention for a malformed hand and lets Donna correct
 * herself in the same segment instead of the door discovering an empty field two
 * layers down.
 *
 * `where_met` is refused here as well as at the column (0161 makes it NOT NULL)
 * because R-41.11 is one law and a hand that can be called without it would make
 * the database the only thing enforcing it.
 */
export function executeIntroductionStage(input: StageInput): ToolOutcome {
  const phone = str(input.recipient_phone);
  const name = str(input.recipient_name);
  const where = str(input.where_met);
  if (!phone) return { display: 'ERROR: donna_introduction_stage needs recipient_phone (the number the owner gave, with its country code).' };
  if (!name) return { display: 'ERROR: donna_introduction_stage needs recipient_name (what the owner calls them).' };
  if (!where) return { display: 'ERROR: donna_introduction_stage needs where_met (the place the owner named). Ask for it — without it nothing can be sent.' };
  // NOT "sent". NOT "introduced". The deed is not done when this sentence is said.
  return {
    display:
      `Introduction handed over for ${name} (${phone}), met at ${where} — it will be put in front of the owner, ` +
      `and nothing goes out until it is approved.`,
  };
}

/**
 * SIGNAL. Carries the owner's named affirmative onward and nothing else. It does
 * not identify the introduction: the door anchors the approval to the one IT
 * showed. A model-supplied identifier is the relay arc's founding disease
 * wearing a parameter's clothes, so this hand is not given one to supply either.
 */
export function executeIntroductionSend(input: SendInput): ToolOutcome {
  const who = str(input.recipient_name);
  if (!who) return { display: 'ERROR: donna_introduction_send needs recipient_name (who the owner named in the approval).' };
  return {
    display:
      `Approval passed on, naming ${who} — the introduction the owner was shown is checked against that name ` +
      `at the door, and it goes only if they match.`,
  };
}
