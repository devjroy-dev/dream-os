// relayCouple.ts — TDW_06 · THE HAND · SITTING TWO — THE RELAY'S TWO SIGNALS.
//
// TWO TOOLS, NOT ONE WITH A MODE (R-29.17, arm 1b). Donna's surface is
// verb-per-tool — donna_lead, donna_verdict, donna_review, donna_note,
// listen_harvey_talk — and `recordPrimitives` is the family exception, not the
// rule. Under the founder's E3 confirmation model the two acts are separated by
// a HUMAN TURN BOUNDARY and by a state transition; a mode enum would let one
// model turn perform both, which is A5's hazard living in the grammar itself.
//
// ── SIGNAL-ONLY. THESE HANDS WRITE NOTHING AND SEND NOTHING. ────────────────
// The estate's own law for this class, stated at `src/lib/vendor/blockHands.js`
// under its "SIGNAL-ONLY" header and practised by six siblings
// (donna_invoice_pdf, donna_book_event, donna_edit_event, donna_cancel_event and
// blockHands' two): the tool returns a sentence and writes nothing; the row is
// written at the DOOR, which holds the organs.
//
// HERE THAT IS NOT AN ECONOMY, IT IS THE CURE (R-29.25). On 2026-08-08 Donna
// reported a send she had no organ to perform, and the anti-fabrication trait in
// her own soul was live, cached and founder-vetoed at the time — and did not
// hold. The answer is not a better sentence. It is that THE MODEL CANNOT REACH
// THE STORE AND CANNOT REACH THE TRANSPORT: no draft row, no state flip, no
// wire. A5 stops being a property of this file's logic and becomes a property of
// what the model is able to touch at all.
//
// ── WHAT THESE HANDS MAY SAY, AND WHY IT IS CAREFULLY SHORT ─────────────────
// Every `display` below is DONNA-FACING (it becomes her tool_result, which
// reaches Harvey's context and no further). NOT ONE of them claims a completed
// deed. "Handed for staging" is true at the moment it is said; "staged", "shown"
// or "sent" would not be, and a sentence that is true only if a later step
// succeeds is the exact shape of 「 Sent to Priya… 」.
//
// The vendor-facing bytes — the SHOW frame, the E3 confirm, and every deed line
// — are DOOR-COMPOSED from these hands' structured inputs (R-29.18, R-29.23) and
// are founder-vetoed. Nothing in this file crosses to a vendor, and nothing in
// this file may be paraphrased into something that does.

import type Anthropic from '@anthropic-ai/sdk';
import type { ToolOutcome } from '../snapshotTypes.js';

export const DONNA_RELAY_STAGE_TOOL: Anthropic.Tool = {
  name: 'donna_relay_stage',
  description:
    "Hand over a message the owner wants sent to one of his clients (the bride/couple) so it can be put in front of him for approval. " +
    "The owner instructs; YOU pass on the finished message exactly as it should reach her. " +
    "This does NOT send anything and does NOT reach her — it hands the draft over to be shown to the owner word for word, and he must approve it first. " +
    "Use `recipient` for who it is for: her name as the owner refers to her, or her phone number if that is what he gave you. " +
    "Never invent a figure, a date or a promise she has not been given — pass on what the owner said.",
  input_schema: {
    type: 'object',
    properties: {
      recipient: {
        type: 'string',
        description: "Who the message is for — the client's name as the owner refers to her, or her phone number.",
      },
      message: {
        type: 'string',
        description: 'The finished message, exactly as it should reach her. This is what the owner will be shown, word for word.',
      },
    },
    required: ['recipient', 'message'],
  },
};

export const DONNA_RELAY_SEND_TOOL: Anthropic.Tool = {
  name: 'donna_relay_send',
  description:
    "Pass on the owner's approval to send the message he was just shown. Use this ONLY when he has affirmatively answered the question naming who it goes to. " +
    "`recipient_name` must be who HE named in his approval — if he named someone else, or named nobody, pass on exactly what he said and nothing will move. " +
    "You do not choose which message this is and you do not send it; the message he was shown is the one that goes, and only if his answer matches it.",
  input_schema: {
    type: 'object',
    properties: {
      recipient_name: {
        type: 'string',
        description: "Who the owner named in his approval, in his own words. Do not substitute a name he did not say.",
      },
    },
    required: ['recipient_name'],
  },
};

// The two names, exported as a set so the door and the benches read ONE home
// rather than three string literals that can drift apart.
export const RELAY_SIGNAL_NAMES: ReadonlySet<string> = new Set([
  DONNA_RELAY_STAGE_TOOL.name,
  DONNA_RELAY_SEND_TOOL.name,
]);

export const RELAY_TOOLS: Anthropic.Tool[] = [DONNA_RELAY_STAGE_TOOL, DONNA_RELAY_SEND_TOOL];

type StageInput = { recipient?: unknown; message?: unknown };
type SendInput = { recipient_name?: unknown };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * SIGNAL. Validates shape and returns a Donna-facing sentence. No database, no
 * transport, no snapshot patch, and `mutated` is deliberately NOT set by the
 * caller for this hand — nothing was mutated.
 *
 * An ERROR display is the estate's own convention for a malformed hand
 * (recordPrimitives' `ERROR: donna_invoice_pdf needs binder_id …`) and it lets
 * Donna correct herself in the same segment instead of the door discovering an
 * empty field two layers down.
 */
export function executeRelayStage(input: StageInput): ToolOutcome {
  const recipient = str(input.recipient);
  const message = str(input.message);
  if (!recipient) return { display: 'ERROR: donna_relay_stage needs recipient (who the message is for).' };
  if (!message) return { display: 'ERROR: donna_relay_stage needs message (the finished words that should reach her).' };
  // NOT "staged". NOT "shown". The deed is not done when this sentence is said.
  return {
    display:
      `Draft handed over for ${recipient} — it will be put in front of the owner word for word, ` +
      `and nothing goes to her until he approves it.`,
  };
}

/**
 * SIGNAL. Carries the owner's named affirmative onward and nothing else. It does
 * not identify the draft: the door anchors the approval to the draft IT showed,
 * through the store's own open index. A model-supplied identifier is this arc's
 * founding disease wearing a parameter's clothes, so this hand is not given one
 * to supply.
 */
export function executeRelaySend(input: SendInput): ToolOutcome {
  const who = str(input.recipient_name);
  if (!who) return { display: 'ERROR: donna_relay_send needs recipient_name (who the owner named in his approval).' };
  return {
    display:
      `Approval passed on, naming ${who} — the message the owner was shown is checked against that name ` +
      `at the door, and it goes only if they match.`,
  };
}
