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
// THE HISTORY (A2-1c, 0219): partner_sends.why holds only the latest reason; every move is kept in partner_send_log,
// append-only: the drain writes one line each time a row's state or reason changes, and "Try again" writes its line in
// the SAME statement as its guarded UPDATE (the function partner_send_revive). logFor(sb, sendId) reads it.
const calls = require('./calls');
const { W, SEND_WORDS, LANE_WORDS, stateWords, failureWords, providerWords, formatDateLong } = require('./words');

const SHOW = Object.freeze({
  waiting: ['queued', 'held_cap', 'held_window', 'held_paused', 'held_no_key'],
  failed: ['failed'],
  sent: ['sent'],
  all: null,
});
const LIMIT = 200;
const REVIVE = Object.freeze({
  none: 'This call to a partner does not exist.',
  notFailed: 'Only a call that could not be sent can be tried again.',
  already: 'This call has already been tried again.',
  noKey: 'Email is not set up yet, so this call would fail again. Set up email first.',
  closed: 'This call is not tried again, because the vendor closed it or its date has passed.',
  blocked: 'This call is not tried again, because TDW has blocked this partner.',
  stopped: 'This call is not tried again, because this partner has stopped calls.',
  done: 'TDW will send this call again in its next round, between 9 am and 8 pm.',
});

async function listSends(sb, { show = 'waiting', now = new Date() } = {}) {
  if (!Object.prototype.hasOwnProperty.call(SHOW, show)) return { ok: false, status: 400, error: 'Choose one of these lists: waiting, failed, sent or all.' };
  let q = sb.from('partner_sends').select('id, partner_id, post_id, channel, state, why, attempts, not_before, sent_at, created_at');
  if (SHOW[show]) q = q.in('state', SHOW[show]);
  const { data: rows, error } = await q.order('created_at', { ascending: false }).limit(LIMIT);
  if (error) return { ok: false, status: 503, error: 'TDW could not read the list of calls just now. Please try again in a minute.' };
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
    state: r.state, state_words: stateWords(r.state, r.why),
    why_words: failed ? failureWords(r.why) : providerWords(r.why), resend_words: failed ? providerWords(r.why) : null,   // F-44.410
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
  // THE ONE GUARDED UPDATE, with its log line, as ONE statement (0219's partner_send_revive): WHERE id = $1 AND
  // state = 'failed', so of two presses at once exactly one moves the row and writes the one line; the other gets null.
  const { data: moved, error } = await sb.rpc('partner_send_revive', { p_send: row.id, p_by: String(by).slice(0, 120), p_note: note });
  if (error) return { ok: false, status: 503, error: 'TDW could not save this just now. Please try again in a minute.' };
  if (moved !== row.id) return { ok: false, status: 409, error: REVIVE.already };
  return { ok: true, line: REVIVE.done, id: row.id };
}

// One row's history, newest first: when, what happened in words, the state, the reason in plain words, and who tried it
// again. No phone and no email: the lines hold none.
const KIND_WORDS = Object.freeze({ drain: 'TDW tried to send this call.', retried: 'An admin pressed Try again.', lane_changed: 'An admin changed how this call is sent.' });
// A line is Resend's refusal when the row failed, or when the drain put it back in the queue with a reason (a try refused).
const refusal = (l) => l.state === 'failed' || (l.kind === 'drain' && l.state === 'queued' && !!l.why);
async function logFor(sb, sendId) {
  const { data: send } = await sb.from('partner_sends').select('id').eq('id', sendId).maybeSingle();
  if (!send) return { ok: false, status: 404, error: REVIVE.none };
  const { data, error } = await sb.from('partner_send_log').select('at, kind, state, channel, attempts, why, by_whom').eq('send_id', sendId).order('at', { ascending: false }).limit(100);
  if (error) return { ok: false, status: 503, error: 'TDW could not read the history of this call just now. Please try again in a minute.' };
  return { ok: true, lines: (data || []).map((l) => ({ at: l.at, kind: l.kind, kind_words: KIND_WORDS[l.kind] || l.kind, state: l.state,
    state_words: stateWords(l.state, l.why), lane_words: LANE_WORDS[l.channel] || l.channel, attempts: l.attempts,
    why_words: refusal(l) ? failureWords(l.why) : providerWords(l.why), resend_words: refusal(l) ? providerWords(l.why) : null,   // F-44.410
    by: providerWords(l.by_whom) })) };
}

module.exports = { SHOW, LIMIT, REVIVE, KIND_WORDS, listSends, revive, rowShape, logFor };
