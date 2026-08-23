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
const { presetDescriptor } = require('../vendor/presetDescriptor');

async function resolveAgentForVendor(supabase, vendor, authUserId) {
  if (!authUserId || !vendor) {
    throw new Error('resolveAgentForVendor: missing authUserId or vendor');
  }
  // ── REJECT LOUDLY (ARC M6, CE-ruled shape (a) — F-05.47's permanent fence) ──
  // M3 cured the one deviant caller; this is the fence so the next one cannot be
  // born quietly. THE CHECK IS THE ONLY ONE THAT EXISTS: the app role cannot read
  // the auth schema (zero call sites estate-wide; PostgREST does not expose it), so
  // "is this a real auth id?" is unanswerable by lookup. What IS readable is the
  // vendor's own users.auth_user_id — and a passed id that isn't it is, by
  // definition, the wrong plane.
  // WHY THROW RATHER THAN SILENTLY RESOLVE: a resolver that repairs its callers'
  // mistakes makes the next F-05.47 unfindable. That finding was only findable
  // because the wrong value reached a constraint and the constraint said no. This
  // throw is that constraint, moved one layer earlier and given words.
  // ── F-05.52 CURED · THE PHANTOM COLUMN, AND THE JOIN THAT WAS ALREADY HERE ──
  // `ownerPhone` is hoisted out of the guard block below because the guard's own
  // SELECT already keys on exactly the row the phone lives in. See :56.
  let ownerPhone = null;
  {
    const { data: pu } = await supabase
      .from('users').select('auth_user_id, phone').eq('id', vendor.user_id).maybeSingle();
    const expected = pu && pu.auth_user_id;
    ownerPhone = (pu && pu.phone) || null;
    if (expected && authUserId !== expected) {
      throw new Error(
        `resolveAgentForVendor: WRONG IDENTITY PLANE — was handed ${authUserId}, but ` +
        `vendor ${vendor.id}'s auth identity is ${expected}. A public.users.id (or any ` +
        `other id) in an auth.users.id's place is F-05.47: it reaches ` +
        `engine.users.auth_user_id, whose FK to auth.users(id) rejects it and kills the ` +
        `turn. Pass resolveAuthUserId(supabase, vendor.user_id), never vendor.user_id.`);
    }
  }

  const eng = supabase.schema('engine');

  // 1 — engine.users by auth_user_id (upsert is safe; auth_user_id is unique).
  let { data: u, error: ue } = await eng
    .from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
  if (ue) throw ue;
  if (!u) {
    const up = await eng.from('users')
      .upsert(
        // THIS LINE READ: phone: vendor.whatsapp_phone || null.
        // `whatsapp_phone` is a column of public.demo_vendors (PUBLIC_SCHEMA.md:386,
        // its ONLY occurrence in the witnessed schema) and does not exist on
        // public.vendors (38 columns, no phone column of any name). So the read was
        // `undefined` on every REAL vendor and every engine.users row born through
        // this bridge landed phone:NULL structurally — never by data, always by
        // shape. Witnessed source: public.users.phone (text NOT NULL, :2 of 9),
        // reached through the guard's own SELECT above — zero new queries.
        //
        // SCOPE, STATED AT THE SITE: this write is inside `if (!u)`. It cures every
        // engine.users row born from here FORWARD. Rows that already exist keep
        // their NULL; repairing them is a founder-run back-fill, sized by the
        // read-only SELECT that travels with this delivery and NOT authored until
        // he rules on it. Moving this write outside the create branch was refused
        // (E3): it would make the bridge a second authority for a fact public.users
        // owns, and a writer on every WhatsApp turn.
        { auth_user_id: authUserId, phone: ownerPhone, name: vendor.business_name || null },
        { onConflict: 'auth_user_id' },
      )
      .select('id').single();
    if (up.error) throw up.error;
    u = up.data;
  }

  // 2 — engine.agents by user_id (one agent per vendor). Create if absent.
  //
  // ── F-05.83 CURED · THE RACE FENCE (R-36.5, fork F1 arm (a)) ─────────────────
  // THE DISEASE: this was read-then-INSERT with no guard and no arbiter. Eleven
  // live vendors carried duplicate agents rows born 15–172ms apart — not two
  // humans typing at once, but this bridge's own EIGHT call sites racing each
  // other on a virgin vendor's first PWA screen (the middleware plus five
  // in-handler resolves fire in parallel). Every later read then threw
  // PostgREST's one-row error and the whole vendor — API and WhatsApp both —
  // went dark (CE-224).
  //
  // THE CURE IS TWO HALVES AND THE ORDER IS LAW: migration 0129 puts a UNIQUE
  // INDEX on engine.agents(user_id) — the arbiter — and THIS upsert names it.
  // `onConflict: 'user_id', ignoreDuplicates: true` compiles to
  // INSERT … ON CONFLICT (user_id) DO NOTHING: the racing winner gets its row
  // back; the loser gets ZERO rows (never an error), and the re-read below
  // hands the loser the winner's agentId. Two concurrent first-touches yield
  // ONE row and BOTH callers an agentId. 0129 MUST BE APPLIED BEFORE THIS
  // DEPLOYS — ON CONFLICT with no matching arbiter is a Postgres error, which
  // would trade the race for a louder disease (the handover's founder steps are
  // numbered for exactly this).
  //
  // Same shape as step 1's upsert above, whose arbiter
  // (engine.users.auth_user_id UNIQUE) is proven to exist by that upsert
  // succeeding in production — the existence-proof technique, now on record.
  let { data: a, error: ae } = await eng
    .from('agents').select('id, profession_preset').eq('user_id', u.id).maybeSingle();
  if (ae) throw ae;
  if (!a) {
    const preset = resolvePreset(vendor.category);
    const ag = await eng.from('agents')
      .upsert({
        user_id:           u.id,
        profession_preset: preset,
        display_name:      vendor.business_name || null,
        kind:              'solo',
        tier:              'entry',
        timezone:          'Asia/Kolkata',
      }, { onConflict: 'user_id', ignoreDuplicates: true })
      .select('id, profession_preset').maybeSingle();
    if (ag.error) throw ag.error;
    a = ag.data;

    // THE WINNER FLAG, read before the loser path can touch `a`. Only the hand
    // that actually minted the agents row writes the owner anchor below — the
    // loser-safe clause (R-36.5). The CE-224 census already witnessed what an
    // unguarded second hand does here: one racing loser skipped its owner row
    // (`orphan_owner_rows` counted it), and a loser that DID reach this insert
    // would double-mint agent_owner instead, which has no arbiter of its own.
    const wonTheInsert = !!a;

    if (!a) {
      // THE RACING LOSER'S LANE. ignoreDuplicates returned zero rows, which
      // means the row EXISTS and someone else minted it milliseconds ago —
      // re-read and adopt it. `.maybeSingle()` is safe here BECAUSE 0129
      // stands: the index makes a second row impossible, so this read can
      // never throw the one-row error this cure exists to end.
      const rr = await eng
        .from('agents').select('id, profession_preset').eq('user_id', u.id).maybeSingle();
      if (rr.error) throw rr.error;
      if (!rr.data) {
        // Zero rows from the upsert AND zero rows on re-read: the winner's row
        // vanished between the two statements (a concurrent delete). Loudly
        // impossible in normal operation; never resolve to a guess.
        throw new Error('resolveAgentForVendor: agents upsert returned no row and the re-read found none — the winner\'s row vanished mid-resolve');
      }
      a = rr.data;
    }

    // Owner anchor — WHO this agent works for. Without an agent_owner row, loadOwner
    // returns nothing and Victor opens "Donna didn't hand me your name." The person's
    // name lives in public.users.name (set at signup/provision); the descriptor comes
    // from the preset. consult_done=false routes the first opening. Mirrors signup.ts.
    // WINNER-ONLY (the loser-safe clause above): the loser adopted a row whose
    // owner anchor is the winner's to write.
    if (wonTheInsert) {
      const { data: pu } = await supabase
        .from('users').select('name').eq('id', vendor.user_id).maybeSingle();
      const ownerName = (pu && pu.name) || vendor.business_name || null;
      if (ownerName) {
        const { error: ownerErr } = await eng.from('agent_owner').insert({
          agent_id:         a.id,
          owner_name:       ownerName,
          owner_descriptor: presetDescriptor(preset),
          consult_done:     false,
        });
        if (ownerErr) throw ownerErr;
      }
    }
  }

  return { agentId: a.id, agentPreset: a.profession_preset };
}

module.exports = { resolveAgentForVendor };
