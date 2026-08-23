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
  let { data: a, error: ae } = await eng
    .from('agents').select('id, profession_preset').eq('user_id', u.id).maybeSingle();
  if (ae) throw ae;
  if (!a) {
    const preset = resolvePreset(vendor.category);
    // ── R-36.5 F1, ARM (a) · INSERT-ON-CONFLICT-RE-READ ────────────────────────
    // THIS WAS A BARE `.insert(...).single()`, AND IT WAS THE DISEASE. The read at
    // :84 and this write are two round trips with no lock between them, so two
    // first-touches for the same vendor both read absent and both insert. Eleven
    // duplicate pairs on 2026-08-23 (CE-224) are the proof it fires in production.
    //
    // AND IT IS NOT A RARE RACE. It needs no two humans: the PWA's own first screen
    // fans out several authenticated calls at once, and every one of them lands
    // here. The window is the width of one round trip, on the one turn every vendor
    // takes exactly once — signup. That is why the census found a whole day's wave.
    //
    // WHY THE DUPLICATE WAS FATAL RATHER THAN UNTIDY: the step-2 read above is
    // `.maybeSingle()`, which THROWS when it matches more than one row. So the
    // second time a duplicated vendor spoke, the resolve threw, and at
    // vendorInbound.js:1399 that throw is upstream of EVERY word gate and the cap
    // gate — the turn dead-lettered and she got the hiccup line. The vendors who
    // most needed the honest refusal were the ones this silenced.
    //
    // `ignoreDuplicates: true` IS THE WHOLE POINT AND IS NOT A DEFAULT. It compiles
    // to ON CONFLICT DO NOTHING. The supabase-js default (false) compiles to DO
    // UPDATE, which would make the race LOSER overwrite the winner's row — a second
    // authority for display_name and preset, born on a race, writing whatever the
    // losing caller happened to hold. DO NOTHING makes the loser a reader, which is
    // what it should have been all along.
    //
    // THE ARBITER IS 0129 AND IT MUST EXIST FIRST. `onConflict: 'user_id'` becomes
    // an ON CONFLICT inference clause, and Postgres ERRORS if no unique index
    // matches it. Deploying this file against an un-migrated database fails every
    // first touch loudly. The founder's ordered steps in the handover exist for
    // exactly this reason.
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

    // `bornHere` IS THE RACE VERDICT, and it is derived from the wire rather than
    // guessed: under DO NOTHING, PostgREST returns the inserted row to the WINNER
    // and an EMPTY set to the loser. So a row here means this call minted the
    // agent; no row means someone else did, milliseconds ago.
    const bornHere = !!ag.data;
    a = ag.data;
    if (!a) {
      // THE LOSER'S RE-READ. `.single()` and not `.maybeSingle()` deliberately: we
      // are here BECAUSE a unique index rejected our insert, so the winner's row is
      // a proven fact. If it cannot be read now, something is wrong that must not be
      // swallowed — an empty result would otherwise fall through to `a.id` and throw
      // a bare TypeError with none of this context attached.
      const re = await eng
        .from('agents').select('id, profession_preset').eq('user_id', u.id).single();
      if (re.error) throw re.error;
      a = re.data;
    }

    // Owner anchor — WHO this agent works for. Without an agent_owner row, loadOwner
    // returns nothing and Victor opens "Donna didn't hand me your name." The person's
    // name lives in public.users.name (set at signup/provision); the descriptor comes
    // from the preset. consult_done=false routes the first opening. Mirrors signup.ts.
    //
    // ── LOSER-SAFE, RULED (R-36.5 F1) ─────────────────────────────────────────
    // GATED ON `bornHere`, NOT ON `!a`. agent_owner has no unique index of its own,
    // so a loser reaching this block would insert a SECOND owner row for an agent
    // that already has one — this cure creating the very shape of defect it was
    // written to end, one table over. The winner mints the anchor; the loser reads
    // the agent and writes nothing.
    if (bornHere) {
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
