'use strict';
// src/api/middleware/resolveAgent.js
// Vendor Suit, Phase 3-A — the identity bridge.
//
// Resolves the authenticated vendor to their engine agent, provisioning the
// engine.users + engine.agents rows on first touch (lazy get-or-create). The
// chain (settled by the engine schema, where agents.user_id is NOT NULL):
//
//   req.auth.user_id (Supabase uid)
//     -> engine.users   (auth_user_id = uid)      [the bridge; created if absent]
//     -> engine.agents  (user_id = users.id)      [the vendor's Victor/Donna]
//
// Must run AFTER requireAuth + resolveVendor (needs req.auth.user_id + req.vendor).
// Attaches req.agentId and req.agentPreset. Engine tables are reached through the
// service-role client with an explicit .schema('engine') override (granted in
// Phase 1); the door never touches another vendor's rows — resolveVendor has
// already asserted JWT ownership.
const { resolvePreset } = require('../vendor/categoryPreset');

function resolveAgent() {
  return async function resolveAgentMiddleware(req, res, next) {
    try {
      const eng = req.app.locals.supabase.schema('engine');
      const uid = req.auth && req.auth.user_id;
      const v   = req.vendor;
      if (!uid || !v) {
        return res.status(401).json({ ok: false, error: 'Unauthorized.' });
      }

      // 1 — engine.users by auth_user_id. Upsert is safe (auth_user_id is unique),
      //     so concurrent first-touches converge on one row.
      let { data: u, error: ue } = await eng
        .from('users').select('id').eq('auth_user_id', uid).maybeSingle();
      if (ue) throw ue;
      if (!u) {
        const up = await eng.from('users')
          .upsert(
            { auth_user_id: uid, phone: v.whatsapp_phone || null, name: v.business_name || null },
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
        const preset = resolvePreset(v.category);
        const ag = await eng.from('agents')
          .insert({
            user_id:           u.id,
            profession_preset: preset,
            display_name:      v.business_name || null,
            kind:              'solo',
            tier:              'entry',
            timezone:          'Asia/Kolkata',
          })
          .select('id, profession_preset').single();
        if (ag.error) throw ag.error;
        a = ag.data;
      }

      req.agentId     = a.id;
      req.agentPreset = a.profession_preset;
      return next();
    } catch (e) {
      console.error('[resolveAgent]', (e && e.message) || e);
      return res.status(500).json({ ok: false, error: 'Agent resolution failed.' });
    }
  };
}

module.exports = resolveAgent;
