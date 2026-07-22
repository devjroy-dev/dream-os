// src/lib/vendor/roster.js
// TDW_04.5 · P4 — the vendor roster's ONE home (spec §P4.2, §P4.4).
//
// TWO JOBS:
//   1. THE EDGE. On an accepted collab connection, both vendors gain each other
//      (spec §P4.2, source 'collab_accepted'); a vendor may also add someone by
//      hand (source 'manual'). Dedup runs on TWO disjoint predicates, matching
//      0096's two partial uniques (CE ruling F9 — the spec named only the first):
//        member_vendor_id IS NOT NULL → unique (owner_vendor_id, member_vendor_id)
//        member_vendor_id IS NULL     → unique (owner_vendor_id, phone)
//      A manual phone-only row that LATER connects is UPDATED in place rather
//      than duplicated — the ruled collision semantics.
//
//   2. THE BRIDGE (spec §P4.4, "the elegant reuse"). Assigning a roster vendor
//      to a function creates-or-links a team_members row (role 'external_vendor',
//      roster_vendor_id set, phone copied). Idempotent — spec §4 item 6. The row
//      is the external's IDENTITY on this vendor's plane: team_members.page_token
//      is NOT NULL with a DB default (witnessed ord 12), so the bridge row gets a
//      working crew page the instant it exists, through the SAME door as Swati's
//      — the capability law holds by construction, not by new code.
//
// ANONYMITY, VERIFIED NOT ASSUMED (§3 guardrail): the edge is born at connect,
// the same breath that sets contact_shared_at and exchanges phones
// (collab.js:390-420). The edge CANNOT exist before anonymity lifts.
//
// UNASSIGN ≠ REMOVAL (CE ruling F8): nothing here deletes. Unassign writes
// events.assigned_member_ids only; the bridge row and the edge persist. Deleting
// the bridge row on unassign would revoke a live crew URL and orphan
// crew_confirmations rows — and CE-48/№2 already left confirmations unpruned, so
// persistence is the estate's existing posture, now symmetric.
'use strict';

// F-04.109 CURED (CE-59 ratified the seam executor's disclosure). The third copy
// that lived here is GONE; toE164 now has ONE home at src/lib/phone.js, with
// three importers — this file plus circle/join.js and circle/verifyPin.js. The
// function moved byte-identically. F9's phone-keyed dedup predicate below now
// provably agrees with the auth plane's normaliser, because it IS that
// normaliser.
const { toE164 } = require('../phone');

/**
 * Add or refresh ONE roster edge. Returns { row, created } — never throws on a
 * duplicate, because a duplicate is the expected steady state.
 *
 * Dedup order matters and mirrors the DB's two predicates:
 *   a) if memberVendorId is given, look for that pair first;
 *   b) otherwise (or if that misses) look for a phone-only row to UPGRADE.
 */
async function upsertRosterEdge(supabase, {
  ownerVendorId,
  memberVendorId = null,
  name,
  phone = null,
  category = null,
  source,
}) {
  if (!ownerVendorId)                                     throw new Error('ownerVendorId required');
  if (!name)                                              throw new Error('name required');
  if (!['collab_accepted', 'manual'].includes(source))    throw new Error('bad roster source');

  const e164 = phone ? toE164(phone) : null;

  // (a) the member-keyed predicate
  if (memberVendorId) {
    const { data: byMember } = await supabase
      .from('vendor_roster')
      .select('id, owner_vendor_id, member_vendor_id, name, phone, category, source')
      .eq('owner_vendor_id', ownerVendorId)
      .eq('member_vendor_id', memberVendorId)
      .maybeSingle();

    if (byMember) return { row: byMember, created: false };
  }

  // (b) the phone-keyed predicate — a manual row awaiting its vendor identity.
  if (e164) {
    const { data: byPhone } = await supabase
      .from('vendor_roster')
      .select('id, owner_vendor_id, member_vendor_id, name, phone, category, source')
      .eq('owner_vendor_id', ownerVendorId)
      .is('member_vendor_id', null)
      .eq('phone', e164)
      .maybeSingle();

    if (byPhone) {
      // UPDATE-if-phone-matches, else INSERT — the CE-ruled collision semantics.
      if (memberVendorId) {
        const { data: upgraded } = await supabase
          .from('vendor_roster')
          .update({ member_vendor_id: memberVendorId, category: category || byPhone.category, source })
          .eq('id', byPhone.id)
          .select('id, owner_vendor_id, member_vendor_id, name, phone, category, source')
          .maybeSingle();
        return { row: upgraded || byPhone, created: false };
      }
      return { row: byPhone, created: false };
    }
  }

  const { data: inserted, error } = await supabase
    .from('vendor_roster')
    .insert({
      owner_vendor_id:  ownerVendorId,
      member_vendor_id: memberVendorId,
      name,
      phone:            e164,
      category,
      source,
    })
    .select('id, owner_vendor_id, member_vendor_id, name, phone, category, source')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { row: inserted, created: true };
}

/**
 * BOTH DIRECTIONS on an accepted connection (spec §P4.2). Poster gains the
 * responder; responder gains the poster. Never fatal to the connect itself —
 * the connection is the product, the edge is the convenience.
 */
async function addEdgesOnAccept(supabase, { poster, responder }) {
  const results = { poster_edge: null, responder_edge: null, error: null };
  try {
    const a = await upsertRosterEdge(supabase, {
      ownerVendorId:  poster.vendor_id,
      memberVendorId: responder.vendor_id,
      name:           responder.name || 'A vendor',
      phone:          responder.phone || null,
      category:       responder.category || null,
      source:         'collab_accepted',
    });
    results.poster_edge = a.row;

    const b = await upsertRosterEdge(supabase, {
      ownerVendorId:  responder.vendor_id,
      memberVendorId: poster.vendor_id,
      name:           poster.name || 'A vendor',
      phone:          poster.phone || null,
      category:       poster.category || null,
      source:         'collab_accepted',
    });
    results.responder_edge = b.row;
  } catch (err) {
    results.error = err.message;
  }
  return results;
}

/**
 * THE BRIDGE (spec §P4.4). Create-or-link the team_members row for a roster
 * entry so an external is assignable exactly like crew. IDEMPOTENT — spec §4
 * item 6. Returns { member, created }.
 *
 * A previously soft-deleted / deactivated bridge row is REACTIVATED rather than
 * duplicated: one external, one identity, one page_token, forever.
 */
async function ensureBridgeMember(supabase, { vendorId, rosterRow }) {
  if (!vendorId)  throw new Error('vendorId required');
  if (!rosterRow) throw new Error('rosterRow required');

  const { data: existing } = await supabase
    .from('team_members')
    .select('id, vendor_id, name, role, phone, active, deleted_at, page_token, roster_vendor_id')
    .eq('vendor_id', vendorId)
    .eq('roster_vendor_id', rosterRow.id)
    .maybeSingle();

  if (existing) {
    if (existing.active === false || existing.deleted_at) {
      const { data: revived } = await supabase
        .from('team_members')
        .update({ active: true, deleted_at: null })
        .eq('id', existing.id)
        .select('id, vendor_id, name, role, phone, active, deleted_at, page_token, roster_vendor_id')
        .maybeSingle();
      return { member: revived || existing, created: false };
    }
    return { member: existing, created: false };
  }

  const { data: inserted, error } = await supabase
    .from('team_members')
    .insert({
      vendor_id:        vendorId,
      name:             rosterRow.name,
      role:             'external_vendor',
      phone:            rosterRow.phone || null,
      roster_vendor_id: rosterRow.id,
      active:           true,
    })
    .select('id, vendor_id, name, role, phone, active, deleted_at, page_token, roster_vendor_id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return { member: inserted, created: true };
}

module.exports = {
  toE164,
  upsertRosterEdge,
  addEdgesOnAccept,
  ensureBridgeMember,
};
