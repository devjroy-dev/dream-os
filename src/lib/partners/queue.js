'use strict';
// src/lib/partners/queue.js · CE-47 · PTN-A2-1b · WHAT IS WAITING, WHAT WENT, WHAT COULD NOT GO: the admin's view of every
// partner's sends, and the ONE way a row stopped at three refusals is tried again.
// listSends(sb, { show })  : every partner's rows, newest first. show = waiting (the default) | failed | sent | all. Each row:
//   partner, the call (who, what, city, date), the lane in words (Email, WhatsApp: the channel is a column, so a
//   WhatsApp row fits this list as it is), the state in words, the reason in plain words and Resend's own words beside
//   it, tries made, next try. No phone and no email of anyone: not the partner's calls address, not the vendor's.
// revive(sb, sendId, { by, now, env }) : a 'failed' row back to 'queued', tries to 0, next try now. ONE guarded UPDATE
//   (state = 'failed' in the WHERE): two presses at once make one queued row; the second is told plainly. Refused,
//   writing nothing, when the call has closed, the partner is blocked or has stopped calls, or (for email) no key is set.
//   A revived row is an ordinary queued row: the drain still applies 9 am to 8 pm and the partner's daily cap to it.
// THE HISTORY (disclosed, 8 Oct 2026): partner_sends.why holds 300 characters and the drain overwrites it on every
// attempt, so it holds only the latest reason. The revive writes "Tried again by <admin> on <date>. Last refusal: <...>"
// into why; a full history of every try and revive needs its own log table (0219, proposed to the chair).
const calls = require('./calls');
const { W, SEND_WORDS, LANE_WORDS, failureWords, formatDateLong } = require('./words');

const SHOW = Object.freeze({
  waiting: ['queued', 'held_cap', 'held_window', 'held_paused', 'held_no_key'],
  failed: ['failed'],
  sent: ['sent'],
  all: null,
});
const LIMIT = 200;
const REVIVE = Object.freeze({
  none: 'No such send.',
  notFailed: 'Only a row that could not be sent can be tried again.',
  already: 'This row was already tried again.',
  noKey: 'Set up email first: the row would only fail again.',
  closed: 'The call has closed or its date has passed, so it is not tried again.',
  blocked: 'This partner is blocked, so the call is not tried again.',
  stopped: 'This partner has stopped calls, so the call is not tried again.',
  done: 'Tried again. It goes with the next send, between 9 am and 8 pm.',
});

async function listSends(sb, { show = 'waiting', now = new Date() } = {}) {
  if (!Object.prototype.hasOwnProperty.call(SHOW, show)) return { ok: false, status: 400, error: 'Choose waiting, failed, sent or all.' };
  let q = sb.from('partner_sends').select('id, partner_id, post_id, channel, state, why, attempts, not_before, sent_at, created_at');
  if (SHOW[show]) q = q.in('state', SHOW[show]);
  const { data: rows, error } = await q.order('created_at', { ascending: false }).limit(LIMIT);
  if (error) return { ok: false, status: 503, error: 'Could not read the sends just now. Try again in a minute.' };
  const list = rows || [];
  const pids = [...new Set(list.map((r) => r.partner_id))];
  const { data: orgs } = pids.length ? await sb.from('partner_orgs').select('id, name').in('id', pids) : { data: [] };
  const P = new Map((orgs || []).map((o) => [o.id, o.name]));
  const C = new Map();
  for (const pid of [...new Set(list.map((r) => r.post_id))]) {
    const c = await calls.loadCall(sb, pid);
    C.set(pid, c ? { who: c.face.name, ...callFields(c, now) } : null);
  }
  return { ok: true, show, sends: list.map((r) => rowShape(r, P.get(r.partner_id), C.get(r.post_id))) };
}
function callFields(c, now) {
  const s = calls.callShape(c, now);
  return { what: s.needs, city: s.city, date_words: s.date_words };
}
function rowShape(r, partnerName, call) {
  const failed = r.state === 'failed';
  return {
    id: r.id, partner: { id: r.partner_id, name: partnerName || 'A partner' }, call: call || null,
    channel: r.channel, lane_words: LANE_WORDS[r.channel] || r.channel,
    state: r.state, state_words: SEND_WORDS[r.state] || r.state,
    why_words: failed ? failureWords(r.why) : (r.why || null), resend_words: failed ? (r.why || null) : null,
    attempts: r.attempts || 0, next_try: r.state === 'sent' || r.state === 'closed' || failed ? null : r.not_before,
    sent_at: r.sent_at, created_at: r.created_at, can_retry: failed,
  };
}

async function revive(sb, sendId, { by = 'admin', now = new Date(), env = process.env } = {}) {
  const { data: row } = await sb.from('partner_sends').select('id, partner_id, post_id, channel, state, why').eq('id', sendId).maybeSingle();
  if (!row) return { ok: false, status: 404, error: REVIVE.none };
  if (row.state !== 'failed') return { ok: false, status: 409, error: REVIVE.notFailed };
  if (row.channel === 'email' && !env.RESEND_API_KEY) return { ok: false, status: 409, error: REVIVE.noKey };
  const c = await calls.loadCall(sb, row.post_id);
  if (!c || !calls.isOpen(c.post, now)) return { ok: false, status: 409, error: REVIVE.closed };
  const { data: org } = await sb.from('partner_orgs').select('id, check_state, send_state').eq('id', row.partner_id).maybeSingle();
  if (!org || org.check_state === 'blocked') return { ok: false, status: 409, error: REVIVE.blocked };
  if (org.send_state === 'stopped') return { ok: false, status: 409, error: REVIVE.stopped };
  const note = `Tried again by ${String(by).slice(0, 60)} on ${formatDateLong(now.toISOString().slice(0, 10))}. Last refusal: ${row.why || 'none recorded'}`.slice(0, 300);
  // THE ONE GUARDED UPDATE: state = 'failed' is in the WHERE, so of two presses at once exactly one moves the row.
  const { data: moved, error } = await sb.from('partner_sends')
    .update({ state: 'queued', attempts: 0, not_before: now.toISOString(), why: note, updated_at: now.toISOString() })
    .eq('id', row.id).eq('state', 'failed').select('id');
  if (error) return { ok: false, status: 503, error: 'Could not save just now. Try again in a minute.' };
  if (!moved || moved.length !== 1) return { ok: false, status: 409, error: REVIVE.already };
  return { ok: true, line: REVIVE.done, id: row.id };
}

module.exports = { SHOW, LIMIT, REVIVE, listSends, revive, rowShape };
