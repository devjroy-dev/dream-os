// signup.ts — minting an owner, and the returning-user PIN unlock.
//
// The Supabase phone-OTP session is the real auth boundary (established in the
// browser before either of these is called). createOwner writes the three bonded
// rows the soul needs: users (the human), agents (their bounded brain), agent_owner
// (WHO Harvey works for — without owner_name, loadOwner returns nothing and Harvey
// has no one to serve). The PIN is hashed here and stored on users.pin_hash; it is a
// fast on-device unlock over the session, never the boundary itself.
//
// NOTE (security pass, bundled with RLS-on before real customers): these trust the
// auth_user_id the caller passes. In the live web flow that id comes from a verified
// Supabase session; the hardening step verifies the session token here directly.
import bcrypt from 'bcryptjs';
import { supabase } from './db.js';
import { findProfession } from './professions.js';

const PIN_ROUNDS = 10;

export interface SignupInput {
  authUserId: string;
  phone: string;
  name: string;
  professionKey: string;
  pin: string;
  tier?: 'entry' | 'mid' | 'top';
}

export interface SignupResult {
  agent_id: string;
  existed: boolean;
}

// Create (or return, if already present) the owner triple. Idempotent on
// auth_user_id: a repeat call for the same Supabase identity returns the existing
// agent rather than minting a duplicate — so a re-submit or a returning sign-in
// never forks a second business.
export async function createOwner(input: SignupInput): Promise<SignupResult> {
  const { authUserId, phone, name, professionKey, pin, tier } = input;

  const prof = findProfession(professionKey);
  if (!prof) throw new Error(`unknown profession: ${professionKey}`);
  if (!pin || pin.length < 4) throw new Error('pin must be at least 4 digits');

  // Already minted for this identity? Return the existing agent.
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existingUser) {
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', existingUser.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingAgent) return { agent_id: existingAgent.id, existed: true };
  }

  const pinHash = bcrypt.hashSync(pin, PIN_ROUNDS);

  // 1) the human
  const userId =
    existingUser?.id ??
    (await (async () => {
      const { data, error } = await supabase
        .from('users')
        .insert({ auth_user_id: authUserId, phone, name, pin_hash: pinHash })
        .select('id')
        .single();
      if (error) throw new Error(`users insert failed: ${error.message}`);
      return data.id as string;
    })());

  // 2) the bounded brain
  const { data: agentRow, error: agentErr } = await supabase
    .from('agents')
    .insert({
      user_id: userId,
      display_name: name,
      kind: 'solo',
      profession_preset: prof.key,
      tier: tier ?? 'entry',
    })
    .select('id')
    .single();
  if (agentErr) throw new Error(`agents insert failed: ${agentErr.message}`);
  const agentId = agentRow.id as string;

  // 3) the owner anchor — WHO Harvey works for. consult_done=false routes the fresh
  // agent into the first consultation (gate wired into the loop next).
  const { error: ownerErr } = await supabase.from('agent_owner').insert({
    agent_id: agentId,
    owner_name: name,
    owner_descriptor: prof.descriptor,
    consult_done: false,
  });
  if (ownerErr) throw new Error(`agent_owner insert failed: ${ownerErr.message}`);

  return { agent_id: agentId, existed: false };
}

// /de demo mint — a real agent with no Supabase account behind it (auth_user_id null,
// so demos are trivially findable/clearable: real owners always have one, demos never
// do). Fresh every call — each demo person who mints "a VC" gets their own, no overlap.
const DEMO_PIN_HASH = bcrypt.hashSync('0000', PIN_ROUNDS);
export async function mintDemoOwner(name: string, professionKey: string): Promise<SignupResult> {
  const prof = findProfession(professionKey);
  if (!prof) throw new Error(`unknown profession: ${professionKey}`);
  const cleanName = (name ?? '').trim() || 'Demo Owner';

  const { data: u, error: uErr } = await supabase
    .from('users')
    .insert({ auth_user_id: null, phone: null, name: cleanName, pin_hash: DEMO_PIN_HASH })
    .select('id')
    .single();
  if (uErr) throw new Error(`demo users insert failed: ${uErr.message}`);

  const { data: a, error: aErr } = await supabase
    .from('agents')
    .insert({ user_id: u.id, display_name: cleanName, kind: 'solo', profession_preset: prof.key, tier: 'top' })
    .select('id')
    .single();
  if (aErr) throw new Error(`demo agents insert failed: ${aErr.message}`);

  const { error: oErr } = await supabase.from('agent_owner').insert({
    agent_id: a.id, owner_name: cleanName, owner_descriptor: prof.descriptor, consult_done: false,
  });
  if (oErr) throw new Error(`demo agent_owner insert failed: ${oErr.message}`);

  return { agent_id: a.id as string, existed: false };
}

export interface PinVerifyResult {
  ok: boolean;
  agent_id?: string;
}

// Returning-user unlock: confirm the PIN against the stored hash, hand back the
// agent to resume. (Same trust note as above — the live caller holds a verified
// session.) A wrong PIN returns ok:false with no agent; we never reveal whether the
// user exists separately from whether the PIN matched.
export async function verifyPin(authUserId: string, pin: string): Promise<PinVerifyResult> {
  const { data: user } = await supabase
    .from('users')
    .select('id, pin_hash')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (!user || !user.pin_hash || !bcrypt.compareSync(pin, user.pin_hash)) {
    return { ok: false };
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!agent) return { ok: false };
  return { ok: true, agent_id: agent.id };
}


// Consult mint — an ephemeral standalone consultant agent (mode='consult'): no owner
// anchor, no PIN, no account. Haiku tier (consultant runs on Haiku — soul + whole Codex).
// The phone is verified client-side via Supabase OTP for accessibility/metering; the
// agent itself carries no identity. Returns the agent to drop straight into consult chat.
export async function mintConsultAgent(professionKey: string): Promise<SignupResult> {
  const prof = findProfession(professionKey);
  if (!prof) throw new Error(`unknown profession: ${professionKey}`);

  const { data: u, error: uErr } = await supabase
    .from('users')
    .insert({ auth_user_id: null, phone: null, name: 'Consult', pin_hash: DEMO_PIN_HASH })
    .select('id')
    .single();
  if (uErr) throw new Error(`consult users insert failed: ${uErr.message}`);

  const { data: a, error: aErr } = await supabase
    .from('agents')
    .insert({ user_id: u.id, display_name: 'Consult', kind: 'solo', profession_preset: prof.key, tier: 'entry', mode: 'consult' })
    .select('id')
    .single();
  if (aErr) throw new Error(`consult agents insert failed: ${aErr.message}`);

  // No agent_owner row — consult Harvey has no owner to anchor. The loop reads mode and
  // skips the owner block entirely.
  return { agent_id: a.id as string, existed: false };
}


// ── ATELIER: persistent demo agents, one per sector (the seeing-room stable) ──────
// find-or-create a reusable demo agent named "__atelier__ <key>". Touring a sector
// reuses its agent instead of minting a fresh orphan each time. Mirrors
// mintDemoOwner exactly (user -> agent -> agent_owner), only the lookup-first and
// the name differ. Marked by the "__atelier__ " display_name prefix so /admin-orphans
// can tag it (visible, deletable on purpose, never swept by accident).
export async function findOrCreateAtelierAgent(professionKey: string): Promise<SignupResult> {
  const prof = findProfession(professionKey);
  if (!prof) throw new Error(`unknown profession: ${professionKey}`);
  const atelierName = `__atelier__ ${prof.key}`;

  // reuse: an agent with this exact name under a demo user (auth_user_id null)
  const { data: demoUsers } = await supabase
    .from('users').select('id').is('auth_user_id', null);
  const demoIds = (demoUsers ?? []).map((u) => u.id);
  if (demoIds.length > 0) {
    const { data: existing } = await supabase
      .from('agents').select('id')
      .eq('display_name', atelierName)
      .in('user_id', demoIds)
      .limit(1);
    if (existing && existing.length > 0) {
      return { agent_id: existing[0].id as string, existed: true };
    }
  }

  // create once (same shape as mintDemoOwner)
  const { data: u, error: uErr } = await supabase
    .from('users')
    .insert({ auth_user_id: null, phone: null, name: atelierName, pin_hash: DEMO_PIN_HASH })
    .select('id')
    .single();
  if (uErr) throw new Error(`atelier users insert failed: ${uErr.message}`);

  const { data: a, error: aErr } = await supabase
    .from('agents')
    .insert({ user_id: u.id, display_name: atelierName, kind: 'solo', profession_preset: prof.key, tier: 'top' })
    .select('id')
    .single();
  if (aErr) throw new Error(`atelier agents insert failed: ${aErr.message}`);

  const { error: oErr } = await supabase.from('agent_owner').insert({
    agent_id: a.id, owner_name: prof.label ?? atelierName, owner_descriptor: prof.descriptor, consult_done: false,
  });
  if (oErr) throw new Error(`atelier agent_owner insert failed: ${oErr.message}`);

  return { agent_id: a.id as string, existed: false };
}
