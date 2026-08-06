// src/lib/admin/auditLog.js — THE ADMIN AUDIT WRAPPER, ONE WRITER.
// TDW_10 ADMIN P3 · R-P3.2 (Fork 2 arm (d), the executor's fourth arm, chair-ruled).
//
// ── WHY THIS TABLE AND NOT 0113 ───────────────────────────────────────────────
// A-5 says every admin mutation is audited. The spec reserves migration 0113 for
// a NEW table `admin_audit (actor, action, entity_type, entity_id, payload)`.
// DERIVED AT TIP BEFORE A BYTE WAS WRITTEN: `public.admin_activity_log` already
// exists, is already written on every Discover grant/deny/revoke
// (src/api/admin/discover.js, symbol `logAction`, since before this block), and is
// near-isomorphic to the reservation:
//
//     admin_activity_log            admin_audit (proposed, 0113)
//     ─────────────────────────     ────────────────────────────
//     admin_email  text NOT NULL    actor        text NOT NULL
//     action       text NOT NULL    action       text NOT NULL
//     target_type  text             entity_type  text
//     target_id    uuid             entity_id    text
//     metadata     jsonb NOT NULL   payload      jsonb
//     created_at   timestamptz      created_at   timestamptz
//
// Minting 0113 at this sitting would have made P3's mutations audited into a
// SECOND log while a live one sat beside it — the same drift the mint's own
// one-path guardrail forbids, wearing a schema's clothes. The chair ruled arm (d):
// zero DDL, this wrapper is the sole writer for every P3 mutation, and 0113's
// meaning AMENDS — P6's audit charter becomes consolidate-or-extend THIS table,
// deciding then whether 0113 is needed at all.
//
// SQL PROVENANCE (protocol §9). Every column below is witnessed at
// `docs/db/PUBLIC_SCHEMA.md` §`public.admin_activity_log · 7 columns`, verbatim:
//     1. id uuid NOT NULL default gen_random_uuid()
//     2. admin_email text NOT NULL
//     3. action text NOT NULL
//     4. target_type text
//     5. target_id uuid
//     6. metadata jsonb NOT NULL default '{}'::jsonb
//     7. created_at timestamp with time zone NOT NULL default now()
// Staleness named: that snapshot is pinned at applied tip 0099 and the ladder is
// at 0112. Derived by command rather than hoped — `grep -l admin_activity_log
// db/migrations/01*.sql` returns nothing in 0100–0112, so no migration in the
// stale window touched this table. The witness holds.
//
// `target_id` IS A UUID, NOT TEXT. That is the one real divergence from the
// reservation, and it BINDS: an entity whose id is not a uuid has no home here.
// Every P3 entity (vendor id, couple id) is a uuid, so P3 is unaffected — and
// `writeAudit` refuses a non-uuid rather than letting Postgres reject the row at
// dispatch time, so the limitation is legible where a reader will meet it instead
// of arriving as a 22P02 in a log. P6 inherits this sentence.
//
// ── FAIL-SAFE, AS RULED ───────────────────────────────────────────────────────
// A log failure NEVER blocks the mutation it records. The mutation is the
// founder's intent; the log is the estate's memory of it, and losing the memory
// is strictly better than refusing the act. Every failure is CONSOLE-LOUD — a
// silent audit gap is indistinguishable from an audit that ran, which is the one
// state this file exists to prevent.
'use strict';

// The estate's admin sessions carry no per-person identity — `requireAdmin`
// verifies an HMAC over a mint-time nonce (src/lib/adminSession.js) and there is
// exactly one admin. `logAction`'s pre-existing literal is preserved BYTE-FOR-BYTE
// rather than improved, so rows written before this file and after it sort, filter
// and group as one series. Changing the actor string would have silently split the
// audit history in two at this commit.
const ADMIN_ACTOR = 'admin@thedreamwedding.in';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Keys whose VALUES never reach the log, at any depth. The spec's P6 clause says
// "sanitized payload — secrets stripped"; that clause is honoured here at birth
// rather than retrofitted, because the first mutation logged is the first chance
// to get it wrong. Matching is case-insensitive and substring-based: `pin_hash`,
// `PIN`, `otp_code` and `authorization` all strike.
const SECRET_KEYS = ['pin', 'hash', 'secret', 'token', 'password', 'otp', 'auth', 'key'];

function isSecretKey(k) {
  const lower = String(k).toLowerCase();
  return SECRET_KEYS.some(s => lower.includes(s));
}

// Depth-bounded so a cyclic or pathological payload cannot spin here. A payload
// deeper than this is truncated with a marker rather than dropped silently.
function sanitize(value, depth = 0) {
  if (depth > 4) return '[depth]';
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.slice(0, 50).map(v => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = isSecretKey(k) ? '[redacted]' : sanitize(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '…';
  return value;
}

/**
 * Write one admin audit row. NEVER throws, NEVER blocks the caller.
 *
 * @param supabase   the app data client
 * @param action     e.g. 'mint_vendor', 'discover_grant'
 * @param targetType e.g. 'vendor' | 'couple'
 * @param targetId   a UUID string, or null
 * @param metadata   any object; secret-shaped keys are redacted before dispatch
 * @returns {Promise<{written: boolean, reason?: string}>} — the RESULT IS RETURNED
 *          so a bench can assert the write happened, rather than inferring it from
 *          the absence of a throw. A function whose only failure mode is a silent
 *          no-op is not a check (protocol §9, the independent-method law).
 */
async function writeAudit(supabase, action, targetType, targetId, metadata = {}) {
  if (!action) {
    console.error('[auditLog] REFUSING a row with no action — the mutation stands, unlogged.');
    return { written: false, reason: 'no_action' };
  }
  if (targetId != null && !UUID_RE.test(String(targetId))) {
    console.error(
      `[auditLog] target_id '${targetId}' is not a uuid; public.admin_activity_log.target_id ` +
      `is uuid NOT text. Logging the row with a null target and the id inside metadata ` +
      `rather than losing the event.`);
    metadata = { ...metadata, non_uuid_target_id: String(targetId) };
    targetId = null;
  }

  try {
    const { error } = await supabase.from('admin_activity_log').insert({
      admin_email: ADMIN_ACTOR,
      action,
      target_type: targetType || null,
      target_id:   targetId || null,
      metadata:    sanitize(metadata) || {},
    });
    if (error) {
      // LOUD. See the fail-safe paragraph in this file's header.
      console.error(`[auditLog] '${action}' NOT recorded: ${error.message} — the mutation stands.`);
      return { written: false, reason: error.message };
    }
    return { written: true };
  } catch (e) {
    console.error(`[auditLog] '${action}' NOT recorded (threw): ${e.message} — the mutation stands.`);
    return { written: false, reason: e.message };
  }
}

module.exports = { writeAudit, ADMIN_ACTOR, sanitize, isSecretKey };
