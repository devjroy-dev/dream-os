// src/api/circle/messages.js
// POST /api/v2/frost/circle/messages              — send a message to the circle thread
// GET  /api/v2/frost/circle/messages/:coupleId    — read the circle thread (bride side)
//
// Body (POST): { thread_id?, body, sender_role? }
//   thread_id   = optional. 'dm:<uuid>' or omitted → the canonical group thread.
//   sender_role = 'bride' | 'circle_member' (defaults to 'couple' for back-compat).
//   userId      = ACCEPTED AND UNREAD as of F-07.72 ZIP 2. It used to scope and
//                 resolve; the credential does both now.
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
// CLASS B — dual-lane. Enforced in-handler on the resolver's three answers, NOT
// by `requireCircleMemberAuth`: the bride is not a `circle_members` row and a
// member guard would lock her out of her own conversation. `:coupleId` on the
// GET is no longer read; the POST's `userId` fallback is DEAD (see resolveAuthor).
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
// THE PROVEN CALLER, AND THERE IS ALWAYS ONE NOW. `resolveCircleIdentityIfPresent`
// states the law in its own header (:38-41): the proven couple wins over anything
// the request supplied in a param or a body. At ZIP 1 the body was still a
// fallback for routing, because most requests carried no credential; at ZIP 2 the
// door refuses those requests outright, so the fallback is gone and this function
// answers from the credential alone.
//
// 0105's columns stay NULLABLE and that is not vestigial: every row written
// before this arc has NULL/NULL by the history-stays-NULL ruling, the bride's own
// `users.name` is nullable at the witness, and F-07.113's third answer still
// exists upstream — it is now refused rather than written, and logged either way.
async function resolveAuthor(supabase, identity) {
  const NONE = { coupleId: null, senderName: null, senderUserId: null };

  // ── the proven member: her token binds her users.id ────────────────────────
  if (identity && identity.source === 'circle' && identity.userId) {
    return byMemberUsersId(supabase, identity.userId);
  }

  // ── the proven bride: her credential binds the couple, never a users.id ────
  if (identity && identity.source === 'couple' && identity.coupleId) {
    return byCoupleId(supabase, identity.coupleId);
  }

  // ── THE MINT-AND-TEACH FALLBACK IS DEAD, AS ITS OWN COMMENT PROMISED ───────
  // What stood here read the body's `userId` — couples first, then users ->
  // circle_members — and took a couple_id off it so a credential-less send still
  // reached the right thread. It carried the author fields STRIPPED (the bench
  // caught an earlier cut returning a body-hydrated name at §11.3) and it ended
  // with the sentence: "the fallback exists for routing alone and dies whole at
  // the enforcement ZIP."
  //
  // THIS IS THAT ZIP, AND IT IS DELETED RATHER THAN LEFT UNREACHABLE. Both
  // callers refuse before this function runs unless `coupleId` is non-null, and
  // a non-null `coupleId` arrives only as `source:'circle'` with a bound userId
  // or `source:'couple'` with a bound couple — the two branches above. A branch
  // that cannot execute is not a safety margin; it is a reader's false comfort
  // and the next sitting's unexplained line. `resolveCircleIdentityIfPresent`
  // deleted its own dead arm on exactly this reasoning at ZIP 1 and said so in
  // the same words.
  //
  // THE BODY'S `userId` IS THEREFORE READ NOWHERE ON THIS DOOR. It was the last
  // place where a client's word about who it is still counted.
  return NONE;
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
  // F-07.72 ZIP 2 — `userId` is deliberately NOT destructured. See `resolveAuthor`
  // below: the body's identity claim is dead, and an accepted-but-unread field is
  // the same lie in the API contract that `sender_name` was at F-07.107. Clients
  // still send it; the server no longer reads it, and zero pwa bytes move for it.
  const { thread_id, body, sender_role } = req.body || {};

  // ── F-07.72 ZIP 2 · CLASS B · REFUSE-ON-NEITHER, AND F-07.113'S LOG LINE ───
  // The line ZIP 1 wrote as a comment is now code. NOT guarded by
  // `requireCircleMemberAuth` and it must not be: this door is SHARED with the
  // bride, who is not a `circle_members` row. The resolver admits her JWT
  // (arm 2) and the member's lane token (arm 1) alike, and refuses only a caller
  // who proves NEITHER.
  //
  // THE REFUSAL ENVELOPE IS `{ ok: false }` AND NOT `{ success: false }` — this
  // door speaks `ok` and `feed`/`threads` speak `success`. Two families, and
  // F-07.117 (minted at this ZIP's read-first, accepted open) is the finding
  // that they should be one. Uniforming them would touch every reader in the
  // estate and is NOT this sitting's; matching each door's own family is.
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);

  // ── F-07.113 CURED · THE THIRD ANSWER STOPS BEING SILENT ───────────────────
  // [F-06.85] THIS LINE IS CONDITIONED ON A MECHANISM AND NAMES IT: a request
  // carrying a credential that resolves to no couple returns
  // `{present:true, coupleId:null}` — the THIRD ANSWER, and by the resolver's own
  // ruling it never demotes to `present:false`. Live-witnessed at CE-126 on the
  // founder's own walk: a stale JWT reached `auth.getUser`, failed, and the write
  // landed with NULL/NULL — byte-indistinguishable at the row from a pre-0105
  // row, with no log and no warn. Every layer behaved exactly as specified over a
  // broken input; THE GAP WAS OBSERVABILITY, and it is the one case enforcement
  // cannot see, because the third answer is precisely a request that HAS a
  // credential.
  //
  // It fires BEFORE the refusal below, deliberately: after the refusal this
  // request produces no row, no reply and no other trace, so if the line does not
  // speak here it never speaks at all.
  //
  // NO CREDENTIAL BYTES. No token, no prefix, no LENGTH — a length is a value,
  // and F-07.108's rotation exists because one value reached a screenshot. No
  // message body, no phone, no name: this line reports a mechanism, never a
  // conversation.
  if (req.circleIdentity.present && !req.circleIdentity.coupleId) {
    console.warn('[circle/messages] POST refused — credential present, resolved to no couple:',
      `source=${req.circleIdentity.source} coupleId=null`);
  }

  if (!req.circleIdentity.coupleId) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }

  if (!body || !body.trim()) {
    return res.status(400).json({ ok: false, error: 'body is required.' });
  }

  const { coupleId, senderName, senderUserId } =
    await resolveAuthor(supabase, req.circleIdentity);
  if (!coupleId) {
    // Reachable only when a PROVEN identity's owner row has since vanished —
    // the signature outlives the row it names. Kept, and shaped as it always was.
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
  const supabase = req.app.locals.supabase;

  // ── F-07.72 ZIP 2 · CLASS B · REFUSE-ON-NEITHER ────────────────────────────
  // The line ZIP 1 wrote as a comment is now code. This is THE BRIDE'S OWN DOOR
  // — `sanctuary:2585` polls it every ten seconds — and it is the reason the CE
  // ruled Fork A(c): under enforcement a bride whose JWT has gone stale, or who
  // is signed out entirely, is refused here, and her client would show her the
  // last known messages forever while her sends vanished. The pwa half of this
  // delivery gives that refusal a landing. Enforcement without a landing is a
  // security fix that breaks a real person's screen.
  //
  // Envelope `{ ok: false }`, matching this door's family — see the POST above
  // and F-07.117.
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);

  if (!req.circleIdentity.coupleId) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }
  // `:coupleId` IS NO LONGER READ. It selected which couple's circle thread was
  // returned, on the caller's own word, with no credential — the disease this
  // ZIP exists to end, on the door F-07.112 found serving a member's private
  // conversation with Mira. The thread served is the thread of the couple the
  // credential PROVED.
  const coupleId = req.circleIdentity.coupleId;
  const limit    = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

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
