// src/api/circle/threads.js
// GET /api/v2/frost/circle/threads/:brideId                         — thread list
// GET /api/v2/frost/circle/threads/:brideId/:threadId/messages      — messages
//
// CLASS B — dual-lane (co-planner + bride). Enforced in-handler on the
// resolver's three answers, NOT by `requireCircleMemberAuth`. `:brideId` is no
// longer read on either handler: the couple is the one the credential proved.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { resolveCircleIdentityIfPresent } = require('../../lib/resolveCircleIdentityIfPresent');

// ── GET /:brideId/:threadId/messages — more specific, before /:brideId ────────
router.get('/:brideId/:threadId/messages', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { threadId } = req.params;

  // ── F-07.72 ZIP 2 · CLASS B · REFUSE-ON-NEITHER ────────────────────────────
  // The line ZIP 1 wrote as a comment is now code. NOT guarded by
  // `requireCircleMemberAuth` and it must not be: this door is SHARED with the
  // bride, who is not a `circle_members` row. The resolver admits her JWT
  // (arm 2) and the member's lane token (arm 1) alike and refuses only a caller
  // who proves NEITHER — including the third answer, a present-but-unusable
  // credential, which by `resolveCoupleIfPresent.js:54-57`'s ruling never
  // demotes to the logged-out path. `coupleId` is the whole gate.
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);
  if (!req.circleIdentity.coupleId) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // `:brideId` IS NO LONGER READ — the thread is scoped to the couple the
  // credential PROVED, never to the one the path claimed. Combined with
  // F-07.112's discriminator on the line below, a caller can name neither
  // another couple's thread nor a member's private one.
  const brideId = req.circleIdentity.coupleId;


  const convoId = threadId.replace(/^dm:/, '');
  const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  // ── F-07.112 · SITE C-3 · "BELONGS TO THIS COUPLE" WAS NEVER ENOUGH ────────
  // A member's PRIVATE thread with Mira also belongs to this couple and also
  // carries kind='circle_thread' (minted on the WhatsApp lane at
  // brideIndex.js:369 and brideInbound.js:278/:371 — this line named
  // `dreamai.js:93` until F-07.115 retired that file with the co-planner's Dream
  // AI surface; the discriminator itself is untouched). This lookup checked both and
  // therefore served that private history — every question she asked the agent —
  // to any caller of this door who knew its uuid, which until C-4 below the
  // thread list published. The discriminator is the whole fix: see the
  // CANONICAL THREAD MODEL note at src/api/circle/messages.js:23. A private id
  // now finds nothing and this handler answers with an empty list, exactly as
  // it does for any conversation that is not the couple's.
  const { data: convo } = await supabase
    .from('conversations').select('id')
    .eq('id', convoId).eq('couple_id', brideId).eq('kind', 'circle_thread')
    .is('counterparty_user_id', null)   // F-07.112 — the discriminator
    .maybeSingle();

  if (!convo) return res.json({ success: true, data: [] });

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, body, sent_by, sender_name, sender_user_id, direction, created_at')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GET /frost/circle/threads/.../messages] error:', error.message);
    return res.json({ success: false, error: 'Could not fetch messages.' });
  }

  // ── F-07.107 / F-07.109 — THE READ SHAPE STOPS LYING ABOUT ITS AUTHOR ──────
  // `sender_name` was `m.sent_by` — the ROLE, rendered by the co-planner as the
  // speaker's name, which is how a bubble came to read "COUPLE". It now carries
  // 0105's column, and NULL where no author was recorded (every row written
  // before this delivery, and any send that carried no credential). The client
  // renders a null-name bubble with no name line at all: falling back to the role
  // would reprint the exact string this cure exists to remove, and on live data
  // that string is `couple` over a member's own words (F-07.112's record).
  //
  // `sender_user_id` is NEW here and is not a rename: no response on this lane
  // has ever emitted it, while the co-planner has compared against it since it
  // was written (page.tsx:139), so `mine` was permanently false and every bubble
  // — including the reader's own — took the stranger branch. The field is now
  // real rather than the client being bent around its absence.
  //
  // `sender_role` and `actor_role` keep carrying `sent_by` deliberately: they are
  // roles, they are labelled as roles, and no surface renders them as a name. The
  // co-planner's ROLE_LABEL map dies in the pwa half of this delivery (F-07.110)
  // because its keys never once matched this value space.
  const shaped = (messages || []).map(m => ({
    id:             m.id,
    body:           m.body     || null,
    content:        m.body     || null,
    sender_name:    m.sender_name    || null,
    sender_user_id: m.sender_user_id || null,
    sender_role:    m.sent_by  || null,
    actor_role:     m.sent_by  || null,
    created_at:     m.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

// ── GET /:brideId — thread list ───────────────────────────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // ── F-07.72 ZIP 2 · CLASS B · REFUSE-ON-NEITHER ────────────────────────────
  // The line ZIP 1 wrote as a comment is now code. NOT guarded by
  // `requireCircleMemberAuth` and it must not be: this door is SHARED with the
  // bride, who is not a `circle_members` row. The resolver admits her JWT
  // (arm 2) and the member's lane token (arm 1) alike and refuses only a caller
  // who proves NEITHER — including the third answer, a present-but-unusable
  // credential, which by `resolveCoupleIfPresent.js:54-57`'s ruling never
  // demotes to the logged-out path. `coupleId` is the whole gate.
  req.circleIdentity = await resolveCircleIdentityIfPresent(req, supabase);
  if (!req.circleIdentity.coupleId) {
    return res.status(401).json({ success: false, error: 'Unauthorised.' });
  }

  // `:brideId` IS NO LONGER READ — see the sibling handler above.
  const brideId = req.circleIdentity.coupleId;


  // ── F-07.112 · SITE C-4 · THE ENUMERATION SURFACE, AND THE WORST OF THE FOUR ─
  // This list returned EVERY circle_thread row for the couple — which means
  // every member's private AI thread with Mira, handed to every other member
  // and to the bride, each one rendered identically ("Chat with {bride}",
  // :137's hardcoded kind:'dm' + threads/page.tsx:35) and each one TAPPABLE
  // into C-3 above. It is why a cure at the messages.js resolver alone would
  // have made the estate worse: born the real group row, then listed the
  // private one beside it as a second, indistinguishable, openable entry.
  //
  // `counterparty_user_id` LEAVES THE PROJECTION as it enters the predicate.
  // It was selected here and never read by a single line below — the defect
  // standing next to its own cure. Now that the filter guarantees it is NULL on
  // every returned row, selecting it would be asking the database for a
  // constant no reader consumes. Zero behavioural change: no shaped field ever
  // carried it.
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, kind, last_message_at, updated_at')
    .eq('couple_id', brideId)
    .eq('kind', 'circle_thread')
    .is('counterparty_user_id', null)   // F-07.112 — the discriminator
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[GET /frost/circle/threads] error:', error.message);
    return res.json({ success: false, error: 'Could not fetch threads.' });
  }

  const threads = await Promise.all((convos || []).map(async (c) => {
    const { data: lastMsg } = await supabase
      .from('messages').select('body, sent_by, sender_name, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    return {
      thread_id:   `dm:${c.id}`,
      kind:        'dm',
      label:       null,
      // F-07.107 SITE 4 — CURED THOUGH INERT. This preview's only consumer,
      // app/coplanner/threads/page.tsx, declares `sender_name` at :14 and renders
      // only `last_message.content` at :119, so the role-as-name never reached a
      // screen from here. Cured anyway, by ruling: a shape that lies to a type
      // nobody reads is one screen change away from lying to a reader.
      last_message: lastMsg ? {
        content:     lastMsg.body        || null,
        sender_name: lastMsg.sender_name || null,
        sender_role: lastMsg.sent_by     || null,
        created_at:  lastMsg.created_at  || null,
      } : null,
      last_active: c.last_message_at || c.updated_at || null,
    };
  }));

  return res.json({ success: true, data: threads });
}));

module.exports = router;
