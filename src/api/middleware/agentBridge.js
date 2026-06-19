'use strict';
// src/api/middleware/agentBridge.js
// Vendor Suit, Phase 5-A — the identity bridge core, callable outside Express.
//
// Given a vendor and their Supabase auth uid, get-or-create the engine.users +
// engine.agents rows and return the agentId (+ preset). One source of truth for
// BOTH resolveAgent (web middleware) and the WhatsApp webhook (5-A), so the bridge
// logic can never drift between surfaces. The chain (agents.user_id is NOT NULL):
//
//   authUserId (Supabase uid)
//     -> engine.users   (auth_user_id = uid)   [created if absent]
//     -> engine.agents  (user_id = users.id)   [the vendor's Victor/Donna]
const { resolvePreset } = require('../vendor/categoryPreset');

async function resolveAgentForVendor(supabase, vendor, authUserId) {
  if (!authUserId || !vendor) {
    throw new Error('resolveAgentForVendor: missing authUserId or vendor');
  }
  const eng = supabase.schema('engine');

  // 1 — engine.users by auth_user_id (upsert is safe; auth_user_id is unique).
  let { data: u, error: ue } = await eng
    .from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
  if (ue) throw ue;
  if (!u) {
    const up = await eng.from('users')
      .upsert(
        { auth_user_id: authUserId, phone: vendor.whatsapp_phone || null, name: vendor.business_name || null },
        { onConflict: 'auth_user_id' },
      )
      .select('id').single();
    if (up.error) throw up.error;
    u = up.data;
  }

  // 2 — engine.agents by user_id (one agent per vendor). Create if absent.
  let { data: a, error: ae } = await eng
    .from('agents').select('id, profession_preset').eq('user_id', u.id).maybeSingle();
  if (ae) throw ae;
  if (!a) {
    const preset = resolvePreset(vendor.category);
    const ag = await eng.from('agents')
      .insert({
        user_id:           u.id,
        profession_preset: preset,
        display_name:      vendor.business_name || null,
        kind:              'solo',
        tier:              'entry',
        timezone:          'Asia/Kolkata',
      })
      .select('id, profession_preset').single();
    if (ag.error) throw ag.error;
    a = ag.data;
  }

  return { agentId: a.id, agentPreset: a.profession_preset };
}

module.exports = { resolveAgentForVendor };
