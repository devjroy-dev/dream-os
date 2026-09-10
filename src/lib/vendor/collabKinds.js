// src/lib/vendor/collabKinds.js
// CE-42 · SEAT R7 · 4c-1 · G5.2 THE SHOOT BOARD — the kind's ONE home.
//
// ── WHAT A SHOOT IS (ruling A + ruling 2(a)) ──────────────────────────────────
// A shoot is a collab post, not a table: `collab_posts.event_type` in
// {editorial, brand_shoot}. Both values are already admitted by
// `collab_posts_event_type_check` (0048; PUBLIC_SCHEMA constraints §1), so the
// discriminator costs ZERO DDL. pre_wedding and portrait stay collab: they are a
// couple's paid shoot, not a styled shoot vendors cast among themselves.
// Fixture 8 (2026-09-10): zero live posts carry either value, so declaring the
// kind moved no existing post between rooms.
//
// ── ONE GLASS PER ACT (ruling 3(ii)) ──────────────────────────────────────────
// GET /feed and GET /my-posts answer ONE kind per call: `collab` by default
// (the Collab room), `shoot` on `?kind=shoot` (Referrals & partners). A post is
// never offered in both rooms.
//
// ── EXPIRY (ruling 1(a)) ──────────────────────────────────────────────────────
// A shoot expires at the END of its event day (IST) — set at insert — rather than
// 30 days after posting (F-42.181: a shoot posted >30 days out died before its
// date). And the nightly sweep closes ANY open post, every kind, whose event
// date has passed: a post for a day already gone offers nothing. Radius at the
// cure, witnessed by fixture 3/8: ONE row, 5f047847 (DEV440, decor, 2026-09-04),
// closed at the first 03:15 IST run after deploy.
'use strict';

const { istTodayStr, IST_OFFSET_MS } = require('../istDay');

/** The shoot kind's event types. The pwa reads this list off
 *  GET /api/v2/vendor/collab/requirement-types — it never restates it. */
const SHOOT_EVENT_TYPES = Object.freeze(['editorial', 'brand_shoot']);

const KINDS = Object.freeze(['collab', 'shoot']);

function isShootEventType(eventType) {
  return SHOOT_EVENT_TYPES.includes(eventType);
}

/** A post's kind, derived — never stored. */
function kindOfPost(post) {
  return post && isShootEventType(post.event_type) ? 'shoot' : 'collab';
}

/**
 * `?kind=` off a request. Absent → 'collab' (every caller that predates the
 * shoot board keeps its answer). Anything outside KINDS → null, which the door
 * refuses with a 400 rather than guessing a room.
 */
function parseKind(raw) {
  if (raw === undefined || raw === null || raw === '') return 'collab';
  return KINDS.includes(raw) ? raw : null;
}

/**
 * A shoot's expires_at: the end of its event day in IST, as an ISO instant.
 * `event_date` is a DATE ('YYYY-MM-DD'); midnight IST of the NEXT day is
 * 18:30 UTC of the event day itself.
 */
function shootExpiresAt(eventDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(eventDate || ''));
  if (!m) return null;
  const nextIstMidnightUtc = Date.UTC(+m[1], +m[2] - 1, +m[3] + 1) - IST_OFFSET_MS;
  return new Date(nextIstMidnightUtc).toISOString();
}

/**
 * THE NIGHTLY SWEEP (src/cron.js, 03:15 IST). Two closes, both to 'expired':
 *   1. open posts past their expires_at — the 0048 rule, unchanged;
 *   2. open posts whose event_date is before today in IST — every kind (1(a)).
 * Returns the ids each close touched, so the cron's log line and the bench read
 * the same facts.
 */
async function expireCollabPosts(supabase, now = new Date()) {
  const byWindow = await supabase
    .from('collab_posts')
    .update({ state: 'expired' })
    .eq('state', 'open')
    .lt('expires_at', now.toISOString())
    .select('id');

  const byDate = await supabase
    .from('collab_posts')
    .update({ state: 'expired' })
    .eq('state', 'open')
    .lt('event_date', istTodayStr(now))
    .select('id');

  const ids = (r) => (r && Array.isArray(r.data) ? r.data.map(x => x.id) : (r && r.data && r.data.id ? [r.data.id] : []));
  return {
    byWindow: ids(byWindow),
    byDate: ids(byDate),
    error: (byWindow && byWindow.error) || (byDate && byDate.error) || null,
  };
}

module.exports = {
  SHOOT_EVENT_TYPES, KINDS, isShootEventType, kindOfPost, parseKind,
  shootExpiresAt, expireCollabPosts,
};
