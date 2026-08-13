// src/api/circle/polls.js
// GET  /api/v2/frost/circle/polls/:brideId            — the couple's polls + tallies
// POST /api/v2/frost/circle/polls                     — create (bride or member)
// POST /api/v2/frost/circle/polls/:pollId/vote        — cast or change a vote
//
// TDW_14 · D-3 · C-4.
//
// ═════════════════════════════════════════════════════════════════════════════
// CLASS B — DUAL-LANE, AND THE SPEC'S OWN INSTRUCTION WOULD HAVE BROKEN IT
// ═════════════════════════════════════════════════════════════════════════════
// TDW_14 §P5.1 ends "routes on the threads router with member auth (C-9
// pattern)" and begins "one vote per participant (BRIDE INCLUDED)". Those cannot
// both be built. C-9's pattern is `requireCircleMemberAuth` — CLASS A — and it
// 403s anyone who is not an ACTIVE `circle_members` row. THE BRIDE IS NOT ONE.
// `feed.js` states the consequence in its own words: a circle-member guard
// "would answer her own circle chat with 'Not a circle member.'"
//
// So the C-9 sentence is STRUCK (R-D3.1, and Amendment One §2.14 records the
// strike in the same delivery as this file). This router is Class B: mounted
// BARE beside feed/threads/messages, refusing in-handler on the resolver's three
// answers. The bride reaches it through arm 2, the member through arm 1, and a
// caller who proves neither is refused.
//
// ── `:brideId` IS NOT READ, AND THAT IS THE LAW NOT AN OVERSIGHT ────────────
// `resolveCircleIdentityIfPresent.js:50-51` — THE PROVEN IDENTITY WINS over
// anything the request supplied. The route keeps its shape so it reads like its
// three siblings and no client convention changes; the id in the path decides
// nothing. A caller asking for another couple's polls receives her own.
//
// ── THE VOTER IS A `users.id`, FOR EVERYBODY (R-D3.2) ──────────────────────
// No 'bride' sentinel exists anywhere in this feature. `couples.user_id` is
// `uuid NOT NULL`, so the bride has a `users.id` exactly as every member does,
// and `circle_poll_votes` keys on it with `PRIMARY KEY (poll_id,
// voter_user_id)`. "One vote per participant" is therefore enforced by POSTGRES,
// not by a handler that a later hand could rewrite. A repeat vote is an UPSERT on
// that key — changing your mind is one row, never two.
//
// The identity arrives from the gate on both arms (R-D3.3): arm 1 from the
// circle token's binding, arm 2 from the value `resolveCoupleIfPresent` had
// always computed and discarded. This file performs NO identity resolution of
// its own — a handler-side `couples` hop would be a second implementation of a
// question the gate already answers.
//
// ── THE FOURTH CONSUMER OF `circlePermissions` (R-D3.4) ────────────────────
// `b14_d1_visibility_bench` §5.1 asserted THREE consumers of the one home. This
// file is the fourth, and that cell's count moves in the same delivery — a
// CHARTERED move, declared before it happened, never a defect
// (RETIRE-WITH-THE-READER: the sitting that moves a subject owns the benches
// that read it).
//
// WHAT IS AND IS NOT GATED, per the ruling. A POLL IS SHARED BY CREATION: its
// question, its options, and its tallies render WHOLE to every active member.
// Gating the options would make a poll that half the circle cannot answer, which
// is not a privacy feature, it is a broken ballot.
//
// What IS gated is what a poll JOINS. `linked_event_id` reaches into the
// couple's journey, and an event carries a `vendor_id`. So the linked event is
// served as `{ id, title, event_date }` to everyone, and its `vendor_id` ONLY
// when the resolved block says `can_see_vendors`. THE BRIDE IS NOT A MEMBER and
// has no block — she sees her own journey whole.
//
// NO NEW PERMISSION KEY IS INVENTED HERE. The key set is UNRULED against the 14
// spec's vocabulary and `circlePermissions.js`'s own header declares it so; the
// UNRULED-ARM LAW says an arm the executor can derive is still not an arm the
// executor may build. `can_see_vendors` already exists and already means this.
'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { resolveCircleIdentityIfPresent } = require('../../lib/resolveCircleIdentityIfPresent');
const { circlePermissions }              = require('../../lib/circlePermissions');

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

// ── the Class B door, one home for the refusal ───────────────────────────────
// Returns the resolved identity, or null after ending the response. Every
// handler below opens with it, so the three answers are read in ONE place and a
// new handler cannot forget the third one (a present-but-unresolvable credential
// is refused, never demoted to the logged-out path).
async function classB(req, res, supabase) {
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);
  if (!req.circleIdentity.coupleId) {
    res.status(401).json({ success: false, error: 'Unauthorised.' });
    return null;
  }
  return req.circleIdentity;
}

// Resolve the caller's permission block. The bride has none and needs none — she
// owns the circle. A member's block comes from her row's `visibility` column
// THROUGH THE ONE HOME; this file never reads a flag out of the column itself.
async function permissionsFor(supabase, identity) {
  if (identity.source !== 'circle') return null;      // the bride: ungated
  const { data: member } = await supabase
    .from('circle_members')
    .select('visibility')
    .eq('couple_id', identity.coupleId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return circlePermissions(member && member.visibility);
}

// Shape a poll for the wire. `votes` is the raw vote rows for this poll.
// The tally is COMPUTED, never stored: a stored counter is a second source of
// truth for a number the rows already carry, and it drifts the first time a
// delete or a changed vote misses it.
function shapePoll(poll, votes, linkedEvent, perms, viewerUserId) {
  const counts = {};
  for (const v of votes) counts[v.option_id] = (counts[v.option_id] || 0) + 1;

  const mine = votes.find(v => v.voter_user_id === viewerUserId);
  const closed = !!(poll.closes_at && new Date(poll.closes_at) <= new Date());

  let event = null;
  if (linkedEvent) {
    event = { id: linkedEvent.id, title: linkedEvent.title, event_date: linkedEvent.event_date };
    // The gate, and the only one in this file. `perms === null` is the bride.
    if (!perms || perms.can_see_vendors) event.vendor_id = linkedEvent.vendor_id || null;
  }

  return {
    id:            poll.id,
    question:      poll.question,
    thread_id:     poll.thread_id || null,
    options:       (poll.options || []).map(o => ({
      id:        o.id,
      label:     o.label,
      image_url: o.image_url || null,
      votes:     counts[o.id] || 0,
    })),
    total_votes:   votes.length,
    my_vote:       mine ? mine.option_id : null,
    closes_at:     poll.closes_at || null,
    closed,
    linked_event:  event,
    created_at:    poll.created_at,
  };
}

// ── POST / — create ─────────────────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const me = await classB(req, res, supabase);
  if (!me) return;

  if (!me.userId) {
    // The gate could not name WHO, only WHOSE CIRCLE. Authorship would have to
    // be invented, and this feature has no anonymous author.
    return res.status(403).json({ success: false, error: 'Unauthorised.' });
  }

  const body      = req.body || {};
  const question  = typeof body.question === 'string' ? body.question.trim() : '';
  const rawOpts   = Array.isArray(body.options) ? body.options : null;

  if (!question) {
    return res.status(400).json({ success: false, error: 'A question is required.' });
  }
  if (!rawOpts || rawOpts.length < MIN_OPTIONS || rawOpts.length > MAX_OPTIONS) {
    return res.status(400).json({
      success: false,
      error: `A poll needs between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`,
    });
  }

  // Option ids are MINTED HERE, never accepted from the caller. A client-supplied
  // id could collide with another option's, and a tally keyed on a duplicated id
  // silently merges two choices into one — a wrong result that looks like a
  // right one. Labels are the caller's; identity is ours.
  const options = [];
  for (let i = 0; i < rawOpts.length; i++) {
    const label = typeof rawOpts[i] === 'string' ? rawOpts[i].trim() : String(rawOpts[i]?.label || '').trim();
    if (!label) {
      return res.status(400).json({ success: false, error: 'Every option needs a label.' });
    }
    const image = rawOpts[i] && typeof rawOpts[i].image_url === 'string' ? rawOpts[i].image_url : null;
    options.push({ id: `o${i + 1}`, label, ...(image ? { image_url: image } : {}) });
  }

  // The couple is the PROVEN one on every write, exactly as on every read.
  const row = {
    couple_id:          me.coupleId,
    thread_id:          body.thread_id || null,
    question,
    options,
    linked_event_id:    body.linked_event_id || null,
    closes_at:          body.closes_at || null,
    created_by_user_id: me.userId,
  };

  const { data: created, error } = await supabase
    .from('circle_polls').insert(row).select('*').maybeSingle();

  if (error || !created) {
    console.error('[POST /frost/circle/polls] insert error:', error && error.message);
    return res.status(500).json({ success: false, error: 'Could not create the poll.' });
  }

  console.log(`[POST /frost/circle/polls] poll=${created.id} couple=${me.coupleId} options=${options.length}`);
  const perms = await permissionsFor(supabase, me);
  return res.json({ success: true, data: shapePoll(created, [], null, perms, me.userId) });
}));

// ── POST /:pollId/vote — cast or change ─────────────────────────────────────
router.post('/:pollId/vote', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const me = await classB(req, res, supabase);
  if (!me) return;
  if (!me.userId) {
    return res.status(403).json({ success: false, error: 'Unauthorised.' });
  }

  const { pollId } = req.params;
  const optionId   = (req.body && req.body.option_id) || null;

  // The poll is fetched SCOPED TO THE PROVEN COUPLE. This is the whole
  // authorisation: a caller cannot vote in another circle's poll even with a
  // correct uuid, and the 404 is deliberately the same answer an unknown id
  // gets — a door that told them apart would report other circles' polls to
  // anyone willing to guess.
  const { data: poll } = await supabase
    .from('circle_polls')
    .select('id, options, closes_at, couple_id')
    .eq('id', pollId)
    .eq('couple_id', me.coupleId)
    .maybeSingle();

  if (!poll) return res.status(404).json({ success: false, error: 'Poll not found.' });

  if (poll.closes_at && new Date(poll.closes_at) <= new Date()) {
    return res.status(409).json({ success: false, error: 'This poll has closed.' });
  }

  // Membership of the option set, checked against the poll's OWN options rather
  // than a shape the caller described. A vote for an option that does not exist
  // would otherwise sit in the table forever, counted by nothing and explaining
  // a total that does not add up.
  const known = new Set((poll.options || []).map(o => o.id));
  if (!optionId || !known.has(optionId)) {
    return res.status(400).json({ success: false, error: 'That option is not on this poll.' });
  }

  // UPSERT on the primary key. Changing your mind replaces the row; it never
  // adds a second one, because (poll_id, voter_user_id) is the PK and the
  // one-vote-per-participant rule lives at the plane, not here.
  const { error } = await supabase
    .from('circle_poll_votes')
    .upsert({ poll_id: poll.id, voter_user_id: me.userId, option_id: optionId },
            { onConflict: 'poll_id,voter_user_id' });

  if (error) {
    console.error('[POST /frost/circle/polls/vote] upsert error:', error.message);
    return res.status(500).json({ success: false, error: 'Could not record your vote.' });
  }

  // No voter name, no option label in the log line — a record that a vote moved,
  // never a copy of who chose what.
  console.log(`[POST /frost/circle/polls/vote] poll=${poll.id} couple=${me.coupleId}`);
  return res.json({ success: true, data: { poll_id: poll.id, my_vote: optionId } });
}));

// ── GET /:brideId — the couple's polls, newest first ────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const me = await classB(req, res, supabase);
  if (!me) return;

  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const { data: polls, error } = await supabase
    .from('circle_polls')
    .select('id, question, options, thread_id, linked_event_id, closes_at, created_at')
    .eq('couple_id', me.coupleId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[GET /frost/circle/polls] query error:', error.message);
    return res.status(500).json({ success: false, error: 'Could not fetch polls.' });
  }

  const list = polls || [];
  if (!list.length) return res.json({ success: true, data: [] });

  // Two batch queries for the whole page, never N+1: one for every vote on
  // these polls, one for every linked event.
  const pollIds = list.map(p => p.id);
  const { data: votes } = await supabase
    .from('circle_poll_votes')
    .select('poll_id, voter_user_id, option_id')
    .in('poll_id', pollIds);

  const eventIds = [...new Set(list.map(p => p.linked_event_id).filter(Boolean))];
  let eventsById = {};
  if (eventIds.length) {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_date, vendor_id')
      .in('id', eventIds);
    for (const e of (events || [])) eventsById[e.id] = e;
  }

  const votesByPoll = {};
  for (const v of (votes || [])) (votesByPoll[v.poll_id] ||= []).push(v);

  const perms = await permissionsFor(supabase, me);
  const shaped = list.map(p =>
    shapePoll(p, votesByPoll[p.id] || [], eventsById[p.linked_event_id] || null, perms, me.userId));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
