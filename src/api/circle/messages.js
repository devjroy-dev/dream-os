// src/api/circle/messages.js
// POST /api/v2/frost/circle/messages              — send a message to the circle thread
// GET  /api/v2/frost/circle/messages/:coupleId    — read the circle thread (bride side)
//
// Body (POST): { userId, thread_id?, body, sender_role? }
//   userId      = couple_id (bride) OR a circle member's user id — used to scope/resolve.
//   thread_id   = optional. 'circle_group' or 'dm:<uuid>' or omitted → canonical couple thread.
//   sender_role = 'bride' | 'circle_member' (defaults to 'couple' for back-compat).
//
// ── F-07.107 · `sender_name` IS NO LONGER ACCEPTED, AND THAT IS THE CURE ─────
// This door used to take a `sender_name` string from the client, echo it in the
// response, and drop it on the floor — `public.messages` had no column to hold
// it, so a name survived one optimistic render and died on reload. It is now
// HYDRATED FROM THE OWNER ROW at insert (see resolveAuthor below) and persisted
// to 0105's `sender_name` column. The parameter is deleted rather than ignored:
// an accepted-but-unread identity string is a lie in the API contract, and a
// client-supplied identity is a forgeable address (F-07.56). Three senders were
// passing one — the co-planner thread, sanctuary, and journey.ts — and all three
// stop in the same serial delivery as this file.
//
// No JWT — coplanner/bride send no Authorization header. couple_id scopes everything.
//
// CANONICAL THREAD MODEL — RE-AUTHORED AT F-07.112'S CURE (F-06.85)
//   THE DISCRIMINATOR IS `counterparty_user_id`, AND IT IS THE WHOLE MODEL.
//   Two different conversations share kind='circle_thread' and always have:
//     counterparty_user_id IS NULL      → THE GROUP CHAT. One per couple. The
//         bride and every circle member read and write this one row.
//     counterparty_user_id = <users.id> → A MEMBER'S PRIVATE AI THREAD, minted
//         at src/api/circle/dreamai.js:93 and read there by that same column.
//         It is her conversation with Mira and no other human may see it.
//   Every selector in this file AND in threads.js therefore carries the NULL
//   filter. `couple_id + kind` alone does not name a thread — it names a lane
//   holding both, and for a block it resolved to whichever row was born first.
//
//   WHAT THIS REPLACED, RECORDED SO THE NEXT READER SEES THE COST
//   The paragraph here said there was exactly ONE circle_thread row per couple.
//   True by count, false in meaning: F-07.112 found the only such row in
//   production was a member's PRIVATE thread with Mira, adopted as "the group
//   chat" since 2026-07-23 — so the bride's group sends landed in that member's
//   private AI history, and this file's GET served that history to any caller.
//   Invisible from the dreamai side, which had always read by the discriminator.
//   FOUR selectors carried the defect, not one; they cure together. A cure at
//   this resolver alone would have birthed the real group row and left
//   threads.js:117 still LISTING the private one to every member.
//
//   THE DATA HALF WAS THE FOUNDER'S AND HE RULED 「 leave them 」. The messages
//   written into the private thread before this cure STAY there. The group chat
//   opens EMPTY on both surfaces and that is the DESIGNED OUTCOME: moving them
//   is a write against production rows and would re-stage the private history
//   this cure exists to close. Nothing backfilled, nothing migrated.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { resolveCircleIdentityIfPresent } = require('../../lib/resolveCircleIdentityIfPresent');

// ── F-07.107 · THE AUTHOR IS HYDRATED FROM THE OWNER ROW, NEVER FROM THE BODY ─
// This function replaces `resolveCoupleId`, which returned a bare couple_id string
// and had exactly one caller. It answers the same question and two more, because
// the three answers come off the SAME rows and splitting them would mean walking
// those rows twice:
//
//   { coupleId, senderName, senderUserId }
//
// THE BRIDE'S NAME  couples.user_id -> users.name. `users.name` is NULLABLE at the
//   witness (PUBLIC_SCHEMA public.users col 3), so a null is a real answer and is
//   returned as null — never papered over with a literal. The old code minted the
//   string 'Bride' here; that literal is dead in this delivery, at the source, per
//   the founder's ruling that she shows her ACTUAL name.
// THE MEMBER'S NAME circle_members.invitee_name — `text NOT NULL` at the witness
//   (col 3), and it is the name the bride herself typed into the invite sheet,
//   which is the right identity for her own circle. Preferred over users.name on
//   both grounds, derived rather than chosen by taste.
// COST, DISCLOSED  the member path costs the SAME two round trips it always did
//   (the selects widen, they do not multiply). The bride path costs ONE MORE than
//   before — the users lookup for her name. Named here rather than discovered by a
//   future session reading a query-count graph.
//
// ── WHICH IDENTITY WINS ──────────────────────────────────────────────────────
// The PROVEN caller, when there is one. `resolveCircleIdentityIfPresent` states
// the law in its own header (:38-41): the proven couple wins over anything the
// request supplied in a param or a body. So a credential decides the author, and
// the body's `userId` is the fallback for the mint-and-teach phase ONLY, where
// most requests still arrive with no credential at all. That fallback is the last
// place on this door where a client's word about who it is still counts, and the
// enforcement ZIP deletes it by refusing the credential-less request outright.
//
// A CREDENTIAL-LESS SEND THEREFORE WRITES A NULL AUTHOR, AND THAT IS CORRECT.
// 0105's columns are nullable for exactly this. A null degrades to precisely
// today's behaviour — the bubble takes the stranger branch and carries no name —
// so nothing regresses, nothing is invented, and the gap closes at ZIP 2 rather
// than being filled with a guess now.
async function resolveAuthor(supabase, bodyUserId, identity) {
  const NONE = { coupleId: null, senderName: null, senderUserId: null };

  // ── the proven member: her token binds her users.id ────────────────────────
  if (identity && identity.source === 'circle' && identity.userId) {
    return byMemberUsersId(supabase, identity.userId);
  }

  // ── the proven bride: her credential binds the couple, never a users.id ────
  if (identity && identity.source === 'couple' && identity.coupleId) {
    return byCoupleId(supabase, identity.coupleId);
  }

  // ── mint-and-teach fallback: THE BODY MAY ROUTE, IT MAY NEVER AUTHOR ───────
  // Order preserved from `resolveCoupleId`: couples first (the bride passes her
  // couple_id directly), then users -> circle_members (a member passes users.id).
  // The couple_id is taken so the message still reaches the right thread — that
  // is byte-for-byte today's behaviour and nothing about routing regresses.
  //
  // THE AUTHOR FIELDS ARE STRIPPED. The rows would happily yield a name here, and
  // an earlier cut of this function returned it — the bench caught it (§11.3) and
  // the ruling is literal: sender_user_id is written from the RESOLVED CALLER,
  // never the body. A body-hydrated name is not safer for coming off an owner row;
  // it is an identity chosen by whoever typed the userId, which is exactly the
  // forgeable address F-07.56 named. So a credential-less send writes a NULL
  // author, the bubble renders with no name line, and nothing is invented. The
  // fallback exists for routing alone and dies whole at the enforcement ZIP.
  if (!bodyUserId) return NONE;

  const asCouple = await byCoupleId(supabase, bodyUserId);
  if (asCouple.coupleId) return { ...NONE, coupleId: asCouple.coupleId };

  const asMember = await byMemberUsersId(supabase, bodyUserId);
  return { ...NONE, coupleId: asMember.coupleId };
}

// couple_id -> { the couple, the bride's users.id, the bride's name }
async function byCoupleId(supabase, coupleId) {
  const { data: couple } = await supabase
    .from('couples').select('id, user_id').eq('id', coupleId).maybeSingle();
  if (!couple) return { coupleId: null, senderName: null, senderUserId: null };

  let senderName = null;
  if (couple.user_id) {
    const { data: brideUser } = await supabase
      .from('users').select('name').eq('id', couple.user_id).maybeSingle();
    senderName = brideUser?.name || null;   // nullable at the witness — honoured
  }

  return { coupleId: couple.id, senderName, senderUserId: couple.user_id || null };
}

// users.id -> { her couple, that same users.id, circle_members.invitee_name }
async function byMemberUsersId(supabase, usersId) {
  const NONE = { coupleId: null, senderName: null, senderUserId: null };

  const { data: user } = await supabase
    .from('users').select('phone').eq('id', usersId).maybeSingle();
  if (!user) return NONE;

  const { data: member } = await supabase
    .from('circle_members')
    .select('couple_id, invitee_name')
    .eq('invitee_phone', user.phone)
    .eq('status', 'active')
    .maybeSingle();
  if (!member?.couple_id) return NONE;

  return {
    coupleId:     member.couple_id,
    senderName:   member.invitee_name || null,
    senderUserId: usersId,
  };
}

// ── F-07.112 · SITE C-1 · THE GROUP THREAD, AND ONLY THE GROUP THREAD ────────
// Get (or create once) the single canonical GROUP circle_thread conversation
// for a couple. The `.is('counterparty_user_id', null)` below is the cure: see
// the CANONICAL THREAD MODEL note at the head of this file for what it fixes
// and what it cost. Without it this select returned whichever circle_thread row
// was born first, which in production was a member's private thread with Mira.
//
// A NOTE ON WHO CALLS THIS: both the POST and the GET do (:244 / :330), so the
// READ PATH CREATES. sanctuary polls the GET every ten seconds, which makes the
// bride's poll — not a second send — the likeliest party to a create race.
async function getOrCreateCircleThread(supabase, coupleId) {
  const selectGroupThread = () => supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('kind', 'circle_thread')
    .is('counterparty_user_id', null)   // F-07.112 — the discriminator
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: existing } = await selectGroupThread();
  if (existing) return existing.id;

  const { error } = await supabase
    .from('conversations')
    .insert({
      couple_id:            coupleId,
      // F-07.112 — WRITTEN EXPLICITLY, and not because the database needs it:
      // the column is nullable and omitting it produced NULL before this cure
      // and would still. It is written because the selector three lines above
      // now READS this column, and a reader must see the two halves agree
      // without walking the schema to learn what an omission means.
      counterparty_user_id: null,
      kind:                 'circle_thread',
      state:                'new',
      mode:                 'auto',
      last_message_at:      new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[circle/messages] create thread error:', error.message);
    return null;
  }

  // ── F-07.112 · FORK R-a · SELECT-AFTER-INSERT ──────────────────────────────
  // Derived at the read-first: public.conversations carries NO unique
  // constraint that would stop two concurrent first-callers from both
  // inserting (PUBLIC_SCHEMA.md index block — pkey plus five single-column
  // indexes; the ladder agrees at 0001:60-62, 0014:33, 0085:77). So this does
  // NOT return the row it just wrote. It re-runs the discriminated oldest-first
  // select, and every racer converges on the same winner; a loser's row is left
  // orphaned and empty rather than silently swallowing a message.
  //
  // COST, DISCLOSED: one extra round trip, on the create path only — once per
  // couple for the life of the couple.
  //
  // THE DURABLE COMPLEMENT IS NOT HERE, AND THAT IS A RULING: a partial unique
  // index on (couple_id) WHERE kind='circle_thread' AND counterparty_user_id IS
  // NULL is DDL, this sitting is chartered no-DDL, and it belongs beside the
  // partial unique index already conditional-withheld at CE-125. Sequenced with
  // that one by the founder, or not at all — never smuggled in here.
  const { data: settled } = await selectGroupThread();
  if (!settled) {
    console.error('[circle/messages] thread created but not re-readable for couple', coupleId);
    return null;
  }
  return settled.id;
}

// ── POST / — send a message into the canonical circle thread ─────────────────
router.post('/', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  // F-07.107 — `sender_name` is deliberately NOT destructured. See the contract
  // note at the head of this file: the parameter is deleted, not ignored.
  const { userId, thread_id, body, sender_role } = req.body || {};

  // ── F-07.72 · CLASS B · THE RESOLVER IS MOUNTED AND ACCEPTS, NEVER REQUIRES ─
  // This delivery is the MINT-AND-TEACH phase: the lane learns to issue and
  // carry a session and ENFORCES NOTHING. Every answer below — proven, forged,
  // absent — leaves this handler's behaviour byte-identical to the tree before
  // it, and `req.circleIdentity` is written and not yet read.
  //
  // IT IS CALLED ANYWAY, AND THAT IS THE POINT. F-07.72 is itself the finding
  // that a fully-written guard sat unmounted for a block because nothing called
  // it; F-07.99 is the same lesson one plane over. A resolver shipped without a
  // call site would be this sitting reproducing its own disease inside its own
  // cure. Mounting it here makes the enforcement ZIP a REFUSAL LINE beneath this
  // one, on a path already proven to execute, instead of a first mount on a live
  // door.
  //
  // THE ENFORCEMENT LINE GOES HERE, and it is deliberately not written yet:
  //   if (!req.circleIdentity.coupleId) return res.status(401)...
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);

  if (!body || !body.trim()) {
    return res.status(400).json({ ok: false, error: 'body is required.' });
  }

  const { coupleId, senderName, senderUserId } =
    await resolveAuthor(supabase, userId, req.circleIdentity);
  if (!coupleId) {
    return res.status(400).json({ ok: false, error: 'Could not resolve circle for this user.' });
  }

  // ── F-07.112 · SITE C-2 · A CLIENT-NAMED THREAD IS A WRITE TARGET ──────────
  // This lookup validated `couple_id + kind` and nothing else, so a send
  // carrying `thread_id='dm:<a member's private conversation uuid>'` was
  // ACCEPTED and the message was written into that member's private AI history.
  // The co-planner supplies this value straight from the thread list
  // (app/coplanner/threads/[threadId]/page.tsx), and until C-4 below the list
  // handed out private uuids — so this was reachable by a real caller, not a
  // theoretical forge. The discriminator makes the private rows unnameable
  // here; a `dm:` pointing at one now finds nothing and falls through to the
  // group thread on the line below, which is the honest destination.
  let targetConvoId = null;
  if (thread_id && /^dm:[0-9a-f-]{36}$/i.test(thread_id)) {
    const convoId = thread_id.replace(/^dm:/, '');
    const { data: convo } = await supabase
      .from('conversations').select('id')
      .eq('id', convoId).eq('couple_id', coupleId).eq('kind', 'circle_thread')
      .is('counterparty_user_id', null)   // F-07.112 — the discriminator
      .maybeSingle();
    targetConvoId = convo?.id || null;
  }
  if (!targetConvoId) {
    targetConvoId = await getOrCreateCircleThread(supabase, coupleId);
  }
  if (!targetConvoId) {
    return res.status(500).json({ ok: false, error: 'Could not open the circle thread.' });
  }

  const role = sender_role === 'circle_member' ? 'circle_member'
             : sender_role === 'bride'         ? 'bride'
             : 'couple';

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: targetConvoId,
      direction:       'inbound',
      channel:         'web',
      body:            body.trim(),
      sent_by:         role,
      // F-07.107 / F-07.109 — 0105's two columns. Both nullable, both written
      // from the owner row via resolveAuthor, neither from the request body.
      sender_name:     senderName,
      sender_user_id:  senderUserId,
    })
    // Selected back so the echo below returns what was PERSISTED, not what was
    // hoped for. The old response echoed a client string the insert could not
    // store, which is how a name survived one render and died on reload.
    .select('id, body, sent_by, sender_name, sender_user_id, created_at')
    .single();

  if (msgErr) {
    console.error('[POST /frost/circle/messages] insert error:', msgErr.message);
    return res.status(500).json({ ok: false, error: 'Could not send message.' });
  }

  await supabase.from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', targetConvoId);

  return res.json({
    ok:         true,
    message_id: msg.id,
    thread_id:  `dm:${targetConvoId}`,
    message: {
      id:          msg.id,
      body:        msg.body,
      content:     msg.body,
      // F-07.107 — was: `sender_name || (role === 'bride' ? 'Bride' : null)`,
      // a client echo over a literal. Both are dead. This is the stored row.
      sender_name:    msg.sender_name    || null,
      // F-07.109 — the field coplanner/threads/[threadId]/page.tsx:139 has
      // always compared against and no response has ever carried.
      sender_user_id: msg.sender_user_id || null,
      sender_role:    role,
      created_at:     msg.created_at,
    },
  });
}));

// ── GET /:coupleId — read the canonical circle thread (bride side) ───────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { coupleId } = req.params;

  // ── F-07.72 · CLASS B · THE RESOLVER IS MOUNTED AND ACCEPTS, NEVER REQUIRES ─
  // This delivery is the MINT-AND-TEACH phase: the lane learns to issue and
  // carry a session and ENFORCES NOTHING. Every answer below — proven, forged,
  // absent — leaves this handler's behaviour byte-identical to the tree before
  // it, and `req.circleIdentity` is written and not yet read.
  //
  // IT IS CALLED ANYWAY, AND THAT IS THE POINT. F-07.72 is itself the finding
  // that a fully-written guard sat unmounted for a block because nothing called
  // it; F-07.99 is the same lesson one plane over. A resolver shipped without a
  // call site would be this sitting reproducing its own disease inside its own
  // cure. Mounting it here makes the enforcement ZIP a REFUSAL LINE beneath this
  // one, on a path already proven to execute, instead of a first mount on a live
  // door.
  //
  // THE ENFORCEMENT LINE GOES HERE, and it is deliberately not written yet:
  //   if (!req.circleIdentity.coupleId) return res.status(401)...
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);
  const limit        = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

  const { data: couple } = await supabase
    .from('couples').select('id').eq('id', coupleId).maybeSingle();
  if (!couple) return res.json({ ok: true, thread_id: null, messages: [] });

  const convoId = await getOrCreateCircleThread(supabase, coupleId);
  if (!convoId) return res.json({ ok: true, thread_id: null, messages: [] });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, body, sent_by, sender_name, sender_user_id, created_at')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GET /frost/circle/messages] error:', error.message);
    return res.json({ ok: false, error: 'Could not fetch messages.' });
  }

  const shaped = (messages || []).map(m => ({
    id:          m.id,
    body:        m.body || null,
    content:     m.body || null,
    // F-07.107 — was: `m.sent_by === 'bride' ? 'Bride' : (m.sent_by || null)`,
    // which printed the ROLE where a name belongs and minted a literal for the
    // bride. The column answers now, and a pre-0105 row answers NULL, which is
    // the truth about it: no author was ever recorded. The client renders such
    // a bubble with no name line at all rather than falling back to the role —
    // the role IS the thing this cure exists to stop showing.
    sender_name:    m.sender_name    || null,
    // F-07.109 — the phantom made real. NULL on pre-0105 rows and on sends that
    // carried no credential; the client's `mine` comparison is false for both,
    // which is exactly today's rendering and therefore not a regression.
    sender_user_id: m.sender_user_id || null,
    sender_role:    m.sent_by || null,
    created_at:     m.created_at,
  }));

  return res.json({ ok: true, thread_id: `dm:${convoId}`, messages: shaped });
}));

module.exports = router;
