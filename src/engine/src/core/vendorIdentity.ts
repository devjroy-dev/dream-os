// vendorIdentity.ts — TDW_02 P1: the reverse identity bridge.
// resolveAgent.js / agentBridge.js walk vendor -> agent (vendors.user_id ->
// public.users.auth_user_id -> engine.users -> engine.agents). This walks the
// SAME chain in reverse so an engine-side hand (donna_lead) can file into a
// vendor-keyed public table without the door's req.vendor in scope.
//
// Cache: per-process Map, 10-minute TTL (the mapping is stable within a
// process; a vendor never changes agents mid-flight). An unresolvable agent
// returns null — CALLERS MUST surface an honest ERROR display and write
// nothing. Never a silent drop (Amendment One / spec P1.1).
//
// Confident-single-match discipline (house style): a public user with zero or
// multiple vendors resolves to null rather than a guess.
import { supabase } from './db.js';

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { vendorId: string; at: number }>();

export async function vendorIdFromAgent(agentId: string): Promise<string | null> {
  const hit = cache.get(agentId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.vendorId;

  // engine.agents -> engine.users (the engine client is pinned to schema 'engine')
  const { data: agent } = await supabase
    .from('agents').select('user_id').eq('id', agentId).maybeSingle();
  if (!agent || !agent.user_id) return null;

  const { data: eu } = await supabase
    .from('users').select('auth_user_id').eq('id', agent.user_id).maybeSingle();
  if (!eu || !eu.auth_user_id) return null;

  // public.users (by auth_user_id, 0063) -> public.vendors (user_id)
  const pub = supabase.schema('public');
  const { data: pu } = await pub
    .from('users').select('id').eq('auth_user_id', eu.auth_user_id).maybeSingle();
  if (!pu || !pu.id) return null;

  const { data: vs } = await pub
    .from('vendors').select('id').eq('user_id', pu.id).limit(2);
  if (!vs || vs.length !== 1) return null; // 0 or ambiguous -> honest null, never a guess

  cache.set(agentId, { vendorId: vs[0].id, at: Date.now() });
  return vs[0].id;
}
