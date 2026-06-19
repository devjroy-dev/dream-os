// donnaLead.ts — Donna's lead tool (was `capture_lead`), READ-BEFORE-WRITE.
// Also exports ESCALATE_TOOL (plumbing, name unchanged — no character).
// Before creating, it checks for an existing lead with the same name for this
// agent. If one exists, it ENRICHES that lead (fills blanks, updates value)
// instead of creating a duplicate — "recognize before create". A genuinely new
// name creates a new lead. This is the fix for the double-Priya bug.
import type Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db.js';
import type { ToolOutcome, SnapshotItem } from '../snapshotTypes.js';

// Build the snapshot item for a lead row (open pipeline item, sourced from truth).
function leadItem(row: { id: string; name?: string | null; stage?: string | null; value_estimate?: number | null }): SnapshotItem {
  const val = row.value_estimate != null ? ` (Rs ${row.value_estimate})` : '';
  const stage = row.stage ?? 'new';
  const closed = stage === 'won' || stage === 'lost';
  return {
    id: `lead:${row.id}`,
    kind: 'lead',
    text: `${row.name ?? 'unknown'} — lead, stage ${stage}${val}`,
    status: closed ? 'confirmed' : 'open',
    horizon: null,
    ref_type: 'leads',
    ref_id: row.id,
  };
}

export const DONNA_LEAD_TOOL: Anthropic.Tool = {
  name: 'donna_lead',
  description:
    'Log a lead/enquiry the moment the owner mentions a potential customer — even with just a name. If a lead with that name already exists, this updates it rather than duplicating. Call it immediately; never wait for full details.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: "The lead's name." },
      contact: { type: 'string', description: 'Phone or email, if mentioned.' },
      source: { type: 'string', description: 'Where they came from: whatsapp, instagram, referral, etc.' },
      referrer: { type: 'string', description: 'Who referred them, if mentioned. A referrer is NOT the lead.' },
      value_estimate: { type: 'number', description: 'Rough deal value in Rs, if mentioned.' },
      stage: { type: 'string', enum: ['new', 'contacted', 'quoted', 'won', 'lost'], description: 'Pipeline stage, if it has moved.' },
    },
    required: [],
  },
};

export const ESCALATE_TOOL: Anthropic.Tool = {
  name: 'escalate',
  description:
    'Call this when the request needs more reasoning than you can give well — a tricky negotiation, multi-step planning, an ambiguous high-stakes call. It re-runs this turn on a more capable model. Use it for genuine difficulty, not routine logging.',
  input_schema: { type: 'object', properties: {}, required: [] },
};

type DonnaLeadInput = {
  name?: string;
  contact?: string;
  source?: string;
  referrer?: string;
  value_estimate?: number;
  stage?: string;
};

export async function executeDonnaLead(agentId: string, input: DonnaLeadInput): Promise<ToolOutcome> {
  // Read before write: does a lead with this name already exist for this agent?
  if (input.name) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id, name, contact, source, referrer, value_estimate, stage')
      .eq('agent_id', agentId)
      .ilike('name', input.name)
      .order('created_at', { ascending: false });

    if (existing && existing.length === 1) {
      // Single match → enrich it (fill blanks, update value/stage if provided).
      const cur = existing[0];
      const patch: Record<string, unknown> = {};
      if (input.contact && !cur.contact) patch.contact = input.contact;
      if (input.source && !cur.source) patch.source = input.source;
      if (input.referrer && !cur.referrer) patch.referrer = input.referrer;
      if (input.value_estimate != null) patch.value_estimate = input.value_estimate;
      if (input.stage) patch.stage = input.stage;

      if (Object.keys(patch).length === 0) {
        return { display: `Lead "${cur.name}" already on file (id=${cur.id}) — nothing new to add.`, item: leadItem(cur) };
      }
      const { error } = await supabase.from('leads').update(patch).eq('id', cur.id);
      if (error) return { display: `ERROR updating lead: ${error.message}` };
      const merged = { ...cur, ...patch };
      return { display: `Updated existing lead "${cur.name}" (id=${cur.id}) — ${Object.keys(patch).join(', ')}.`, item: leadItem(merged) };
    }

    if (existing && existing.length > 1) {
      // Genuine ambiguity → enrich the most recent, flag it (don't block).
      const cur = existing[0];
      const patch: Record<string, unknown> = {};
      if (input.value_estimate != null) patch.value_estimate = input.value_estimate;
      if (input.stage) patch.stage = input.stage;
      if (Object.keys(patch).length > 0) await supabase.from('leads').update(patch).eq('id', cur.id);
      const merged = { ...cur, ...patch };
      return { display: `Note: ${existing.length} leads named "${input.name}" exist. Updated the most recent (id=${cur.id}). If you meant a different one, tell me which.`, item: leadItem(merged) };
    }
  }

  // No match → create new.
  const { data, error } = await supabase
    .from('leads')
    .insert({
      agent_id: agentId,
      name: input.name ?? null,
      contact: input.contact ?? null,
      source: input.source ?? null,
      referrer: input.referrer ?? null,
      value_estimate: input.value_estimate ?? null,
      stage: input.stage ?? 'new',
    })
    .select('id, name, stage, value_estimate')
    .single();
  if (error) return { display: `ERROR saving lead: ${error.message}` };
  return { display: `Lead saved. id=${data.id}, name=${data.name ?? 'unknown'}, stage=${input.stage ?? 'new'}.`, item: leadItem(data) };
}
