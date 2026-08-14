// src/api/couple/circle.js
// GET  /api/v2/couple/circle/:coupleId        — enriched unified feed + members
// GET  /api/v2/couple/circle/member/:memberId — individual member feed
// POST /api/v2/couple/circle/invite           — invite a circle member
// PATCH /api/v2/couple/circle/member/:memberId/visibility — per-member switches
// Requires couple auth (applied in core.js).
//
// Enrichment: save_added activity rows are joined with muse_saves to inline
// image_url, caption, aesthetic_tags — one batch query, not N+1.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
// FORK E's write-side citation stood here and is retired with its subject
// (M-TRUST, 2026-08-14). This file imported the visibility allowlist and the
// resolver; both retired with the flags themselves. See the dated note at the
// old door's site below for the ruling.

// ── POST /invite — must come before /:coupleId ────────────────────────────────
router.post('/invite', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { invitee_name, role, invitee_phone } = req.body || {};

  if (!invitee_name || !role) {
    return errRes(res, 400, 'invitee_name and role are required.');
  }

  const VALID_ROLES = ['partner', 'family', 'inner_circle'];
  if (!VALID_ROLES.includes(role)) {
    return errRes(res, 400, `role must be one of: ${VALID_ROLES.join(', ')}.`);
  }

  // Normalise optional phone to E.164 (bare 10-digit → +91). Empty = no phone.
  let phoneE164 = null;
  if (invitee_phone && String(invitee_phone).trim()) {
    const digits = String(invitee_phone).replace(/\D/g, '');
    if (digits.length === 10)      phoneE164 = `+91${digits}`;
    else if (digits.length > 10)   phoneE164 = `+${digits}`;
    if (phoneE164 && !/^\+[0-9]{8,15}$/.test(phoneE164)) phoneE164 = null;
  }

  const { data, error } = await supabase.rpc('invite_circle_member', {
    p_couple_id:    couple_id,
    p_invitee_name: invitee_name,
    p_role:         role,
  });

  if (error) {
    const hint = error.hint || '';
    if (hint === 'circle_member_limit_reached') {
      return errRes(res, 422, 'Circle is full. Maximum 3 members allowed.');
    }
    if (hint === 'invalid_circle_role') return errRes(res, 400, 'Invalid role.');
    if (hint === 'couple_not_found')    return errRes(res, 404, 'Couple not found.');
    console.error('[POST /couple/circle/invite] rpc error:', error.message);
    return errRes(res, 500, 'Could not create invite.');
  }

  const row = (data || [])[0];
  if (!row) {
    console.error('[POST /couple/circle/invite] rpc returned no row');
    return errRes(res, 500, 'Could not create invite.');
  }

  // Persist phone on the pending row (best-effort; non-fatal).
  if (phoneE164) {
    const { error: phoneErr } = await supabase
      .from('circle_members')
      .update({ invitee_phone: phoneE164 })
      .eq('id', row.id);
    if (phoneErr) console.warn('[POST /couple/circle/invite] phone save warn:', phoneErr.message);
  }

  // Build a recipient-addressed WhatsApp link carrying the WEB join URL, so the
  // bride opens a chat with the invitee and the message is the tappable link.
  // Falls back to a generic share link (no recipient) when no phone is given.
  const APP_ORIGIN = process.env.FROST_WEB_ORIGIN || 'https://thedreamwedding.in';
  const joinUrl    = `${APP_ORIGIN}/circle/join/${row.invite_token}`;
  const inviteText = `You're invited to join my wedding circle on The Dream Wedding ✦ Tap to join: ${joinUrl}`;
  const waMeLink   = phoneE164
    ? `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(inviteText)}`
    : `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  return okRes(res, {
    invite_token: row.invite_token,
    join_url:     joinUrl,
    wa_me_link:   waMeLink,
    member_id:    row.id,
    has_phone:    !!phoneE164,
  });
}));

// ── Shared: enrich activity rows with muse_save image data ───────────────────
// Collects all subject_ids from save_added rows, fetches muse_saves in one
// query, returns a lookup map. Never throws — enrichment failure is non-fatal.
async function enrichSaveActivity(supabase, activityRows) {
  const saveIds = activityRows
    .filter(a => a.activity_type === 'save_added' && a.subject_id)
    .map(a => a.subject_id);

  if (saveIds.length === 0) return {};

  const { data: saves, error } = await supabase
    .from('muse_saves')
    .select('id, image_url, caption, aesthetic_tags, save_number, source_type')
    .in('id', saveIds);

  if (error) {
    console.error('[circle] muse_saves enrichment error (non-fatal):', error.message);
    return {};
  }

  const lookup = {};
  (saves || []).forEach(s => { lookup[s.id] = s; });
  return lookup;
}

// ── Shape one activity row (with optional muse enrichment) ───────────────────
function shapeActivity(a, saveLookup) {
  const base = {
    id:            a.id,
    activity_type: a.activity_type,
    member_name:   a.actor_name,
    actor_role:    a.actor_role,
    subject_type:  a.subject_type  || null,
    subject_id:    a.subject_id    || null,
    content:       a.payload?.content || null,
    created_at:    a.created_at,
    // enrichment fields — null unless save_added
    image_url:       null,
    caption:         null,
    aesthetic_tags:  null,
    save_number:     null,
    source_type:     null,
  };

  if (a.activity_type === 'save_added' && a.subject_id && saveLookup[a.subject_id]) {
    const save = saveLookup[a.subject_id];
    base.image_url      = save.image_url      || null;
    base.caption        = save.caption        || null;
    base.aesthetic_tags = save.aesthetic_tags || null;
    base.save_number    = save.save_number    || null;
    base.source_type    = save.source_type    || null;
  }

  return base;
}

// ── DELETE /member/:memberId — remove a circle member ────────────────────────
//
// SOFT DELETE, AND THE ROW STAYS ON PURPOSE. `joined_at`, the invite token and
// the attribution behind every `circle_activity` line on the bride's feed all
// live on this row. Deleting it outright would orphan her history to buy a
// cascade, so the status flip is right and is not what F-14.12 was about.
//
// ── F-14.12 · WHAT THIS HANDLER WAS MISSING, AND HOW IT WAS FOUND ───────────
// 0125 gave `events.assigned_circle_member_id` an `ON DELETE SET NULL` and
// stated the ruling in its own header: removing a member returns her task to
// the bride VISIBLY, never a ghost pointing at somebody no longer in the room.
// THAT CONSTRAINT HAS NEVER FIRED IN PRODUCTION AND COULD NOT, because nothing
// in this estate ever DELETEs a `circle_members` row — this door, the only
// removal path there is, has always updated a status.
//
// D-4a's bench read the delete rule out of `pg_constraint` and passed. The rule
// was really there; no live path reached it. R-33.6 was minted on this:
// a rule read from the catalogue proves the rule EXISTS, never that any live
// path TAKES it. A behavioural ruling's cell asserts the PATH; the constraint is
// belt-and-braces.
//
// It surfaced on a walk. The bride removed her only member, the name vanished
// from the events bloom, and the screen looked exactly like the ruling working.
// It was the PWA's `holderName` fallback — which resolves a seat against ACTIVE
// members only — doing the schema's job. One SELECT behind the glass showed the
// column still holding the removed seat's uuid. A GREEN SCREEN OVER AN
// UNENFORCED RULING IS THE SAME DISEASE AS A GREEN CELL OVER AN UNTAKEN PATH.
//
// ── THE INVARIANT THIS HANDLER NOW HOLDS ───────────────────────────────────
//   THIS HANDLER NEVER EXITS WITH status='removed' WHILE ANY events ROW STILL
//   HOLDS THAT MEMBER'S id.
//
// Three things follow from stating it that way rather than as "clear the column
// too", and each is load-bearing:
//
//   1. CLEAR FIRST, FLIP SECOND. Between the two writes there is a moment with
//      no transaction around it. Clearing first means the worst reachable
//      interleaving is a task in the pool while its holder is briefly still a
//      member — visible, harmless, self-correcting. Flipping first would leave
//      the opposite: a live pointer at a member already gone, which is the
//      exact ghost the ruling forbids.
//   2. A FAILED CLEAR REFUSES THE REMOVAL WHOLE. 500, and the member stays
//      active. Half-done is worse than not-done here: the caller sees a failure
//      and retries, and a retry is safe because both writes are idempotent.
//   3. THE CLEAR RUNS BEFORE THE ALREADY-REMOVED SHORT-CIRCUIT, not after.
//      That early return is an exit with status='removed', so under the
//      invariant it owes the clear like any other. This also makes the handler
//      SELF-HEALING for rows stranded before this delivery: a second removal of
//      an already-removed member now cleans up after the version of this file
//      that could not. Production's one stale row was repaired by founder SQL on
//      2026-08-14; this is what keeps the count at zero without a cron.
//
// 0125 IS NOT EDITED. LD-8 is append-only, and a migration rewritten after it
// has been applied is a lie about what the database was told. The FK stays
// exactly as it is — belt-and-braces for a genuine hard delete, which no code
// path performs today and which this comment is the record of.
router.delete('/member/:memberId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { memberId } = req.params;

  // Verify member belongs to this couple
  const { data: member, error: fErr } = await supabase
    .from('circle_members')
    .select('id, status, invitee_name')
    .eq('id', memberId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (fErr) {
    console.error('[DELETE /couple/circle/member] fetch error:', fErr.message);
    return errRes(res, 500, 'Could not remove member.');
  }
  if (!member) return errRes(res, 404, 'Member not found.');

  // ── F-14.12 · THE PLANE IS CLEARED FIRST. Scoped by BOTH keys: the couple
  // predicate is not redundant with the seat, because a seat id is a uuid a
  // caller could hold from anywhere, and ownership was proven for THIS couple
  // three lines up. Belt-and-braces here costs one indexed predicate and is the
  // same shape the member's own door uses.
  const { error: cErr } = await supabase
    .from('events')
    .update({ assigned_circle_member_id: null })
    .eq('couple_id', couple_id)
    .eq('assigned_circle_member_id', memberId);

  if (cErr) {
    console.error('[DELETE /couple/circle/member] delegation clear error:', cErr.message);
    return errRes(res, 500, 'Could not remove member.');
  }

  // The idempotent exit — AFTER the clear, deliberately. See the invariant.
  if (member.status === 'removed') return okRes(res, { member_id: memberId, status: 'removed' });

  const { error: uErr } = await supabase
    .from('circle_members')
    .update({ status: 'removed' })
    .eq('id', memberId)
    .eq('couple_id', couple_id);

  if (uErr) {
    console.error('[DELETE /couple/circle/member] update error:', uErr.message);
    return errRes(res, 500, 'Could not remove member.');
  }

  console.log(`[DELETE /couple/circle/member] removed member=${memberId} couple=${couple_id} name=${member.invitee_name}`);
  return okRes(res, { member_id: memberId, status: 'removed' });
}));
// Must come before /:coupleId to avoid Express matching 'member' as a coupleId.
router.get('/member/:memberId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { memberId } = req.params;

  // Verify member belongs to this couple
  const { data: member, error: mErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, invitee_phone, role, status, joined_at')
    .eq('id', memberId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (mErr) {
    console.error('[GET /couple/circle/member] member error:', mErr.message);
    return errRes(res, 500, 'Could not fetch member.');
  }
  if (!member) return errRes(res, 404, 'Member not found.');

  // Their activity — all types, chronological ascending for a story feel
  const { data: activity, error: aErr } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', couple_id)
    .eq('actor_name', member.invitee_name)  // scoped to this member by name
    .order('created_at', { ascending: true })
    .limit(100);

  if (aErr) {
    console.error('[GET /couple/circle/member] activity error:', aErr.message);
    return errRes(res, 500, 'Could not fetch member activity.');
  }

  const saveLookup = await enrichSaveActivity(supabase, activity || []);
  const shaped = (activity || []).map(a => shapeActivity(a, saveLookup));

  return okRes(res, {
    member: {
      id:             member.id,
      invitee_name:   member.invitee_name,
      invitee_phone:  member.invitee_phone || null,
      role:           member.role,
      status:         member.status,
      joined_at:      member.joined_at,
    },
    activity: shaped,
  });
}));

// ── THE VISIBILITY DOOR STOOD HERE, AND IS RETIRED (M-TRUST, 2026-08-14) ────
// `PATCH /member/:memberId/visibility` — the bride's per-member switches, built
// at TDW_14 D-1 (C-3) as the write side of the one home. It normalised a partial
// patch against an allowlist, merged it over the stored fragment, wrote
// `circle_members.visibility`, and returned the resolved block. It had ZERO
// client callers — derived across both repos before it was cut.
//
// The founder's trust ruling of 2026-08-14 retired the flags it wrote:
// 「 the bride is consciously adding people. 1- mehek always sees the vendor
// info. 2- mehek always gets to add to muse. 3- budget never visible 」.
// INVITING SOMEONE IS THE PERMISSION. There is no switch left to move, so there
// is no door — and no `if (false)` husk either. A door that answers nothing is
// worse than an absent one, because a future hand will try to fix it.
//
// 0098's `circle_members.visibility` column SURVIVES at the plane, append-only
// and inert (LD-8). Nothing writes it; nothing reads it. It is not litter to be
// swept by a later hand — it is a migration that already ran, and the spec's
// dated strike at `docs/specs/TDW_14_CIRCLE_FINAL.md` §P3.2 carries the reason.


// ── GET /:coupleId — unified enriched feed ────────────────────────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  // Active members (include invitee_phone for WhatsApp/call buttons)
  const { data: members, error: mErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, invitee_phone, role, status, joined_at, created_at')
    .eq('couple_id', couple_id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  if (mErr) {
    console.error('[GET /couple/circle] members error:', mErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  // Pending invites
  const { data: pending, error: pErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, role, expires_at, created_at')
    .eq('couple_id', couple_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (pErr) {
    console.error('[GET /couple/circle] pending error:', pErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  // Activity feed — ascending for timeline/scrapbook feel, newest at bottom
  const { data: activity, error: aErr } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: true })
    .limit(100);

  if (aErr) {
    console.error('[GET /couple/circle] activity error:', aErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  // Enrich save_added rows with muse_save image data (one batch query)
  const saveLookup = await enrichSaveActivity(supabase, activity || []);
  const shapedActivity = (activity || []).map(a => shapeActivity(a, saveLookup));

  const shapedMembers = (members || []).map(m => ({
    id:             m.id,
    invitee_name:   m.invitee_name,
    invitee_phone:  m.invitee_phone || null,
    role:           m.role,
    status:         m.status,
    joined_at:      m.joined_at,
    last_active:    m.joined_at || null,
  }));

  return okRes(res, {
    members:         shapedMembers,
    activity:        shapedActivity,
    pending_invites: (pending || []).map(p => ({
      id:           p.id,
      invitee_name: p.invitee_name,
      role:         p.role,
      expires_at:   p.expires_at || null,
      created_at:   p.created_at,
    })),
  });
}));

module.exports = router;
