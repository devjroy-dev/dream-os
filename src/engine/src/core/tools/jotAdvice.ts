// jotAdvice.ts — THE ONE HAND IN THE ADVISORY ROOM (TDW_06 P6a, S-10).
//
// The advisory room has no Donna, no snapshot, no books — no estate, therefore no
// claim surface (A-3). jot_advice is its ONLY hand, and it is deliberately minimal:
// ONE WRITE, ZERO READS. It captures a piece of counsel the owner should not lose
// into HIS OWN notes (public.owner_notes — the scratchpad his business Victor reads
// back later), so good advice survives the room closing.
//
// PLANE: the engine plane owns the turn (agentId); owner_notes is vendor-keyed on the
// PUBLIC plane. This walks the SAME reverse bridge donna_lead uses (vendorIdentity.ts
// -> vendorIdFromAgent), then writes through the public-schema client. An unresolvable
// agent (or a write error) returns an HONEST miss and writes nothing — never a silent
// drop (the vendorIdentity contract; Amendment One / spec P1.1's law).
//
// It reads NOTHING from the estate: it does not fetch the scratchpad, the snapshot, or
// any client row. It writes one line and confirms it. That is the whole hand.
//
// VETO (guardrail 4): the result sentences below are vendor-speakable — on the founder's
// veto list, pre-read through the REAL scrubText (minted + rendered) in the delivery.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import { vendorIdFromAgent } from '../vendorIdentity.js';

export const JOT_ADVICE_TOOL: Anthropic.Tool = {
  name: 'jot_advice',
  description:
    "Jot a piece of your counsel into the owner's own notes so it survives this conversation — the single move he should make, the thing worth acting on that he'd otherwise forget. Use it when advice is worth keeping, not for chatter. This writes to his notes and does nothing else: it files no lead, books nothing, touches no ledger. There is no reading back from here.",
  input_schema: {
    type: 'object',
    properties: {
      note: {
        type: 'string',
        description: "The counsel to keep, in plain words — the thing he should act on. Write it so it still makes sense to him next week.",
      },
    },
    required: ['note'],
  },
};

type JotInput = { note?: string };

// Returns the tool-result string the model reads (and may echo). Row is the witness
// (D-1: only the persisted row convicts); the sentence is the confirmation.
export async function executeJotAdvice(agentId: string, input: JotInput): Promise<string> {
  const body = (input.note ?? '').trim();
  if (!body) {
    return "Nothing to jot — tell me the note and I'll get it down.";
  }

  const vendorId = await vendorIdFromAgent(agentId);
  if (!vendorId) {
    // Honest miss, never a silent drop (the identity-bridge contract).
    return "I couldn't reach your notes just now — say it again and I'll get it down.";
  }

  const { error } = await supabase
    .schema('public')
    .from('owner_notes')
    .insert({ vendor_id: vendorId, body });

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[jot_advice] owner_notes write failed:', error.message);
    return "I couldn't reach your notes just now — say it again and I'll get it down.";
  }

  return "Jotted — it's in your notes.";
}
