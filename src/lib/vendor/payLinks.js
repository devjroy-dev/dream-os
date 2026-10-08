// src/lib/vendor/payLinks.js — TDW · CE-47 · INS · PAY-A · THE PAYMENT LINKS ROOM'S SERVER HALF (Business Solutions › Get paid).
//
// Every answer is { status, body }; routes only send it. Money moves ONLY through 0201's functions (pay_record_milestone,
// pay_record_invoice) and 0202's (pay_take_off_refund): once only by payment id, one step in the database, the invoice
// row first. This cut covers PACKAGE invoices (public.invoices and their lines; the chair's STOP 2 (a)); a binder-only
// invoice gets no "Make link" until (b) lands, and the room says why. No commission is read, stored or worded anywhere.
// No token, secret or state is ever logged or returned: the token is kept only sealed by tokenVault.
// BUILT TO THE DOOR, NOT SWITCHED ON: with any RAZORPAY_PARTNER_* value unset, every door answers "Coming soon" and no
// partner call is made.
'use strict';

const crypto = require('crypto');
const rp = require('./payRazorpay');

const { formatRs } = require('../format');
// THE ROOM'S WORDS FOR A PAYMENT TDW COULD NOT PLACE (the chair's working version, turn 63, with the founder for his yes).
// The server sends the amount already written (whole rupees, Indian comma); the app prints it and never composes it.
const UNCERTAIN = {
  line: (rupees) => `Rs ${formatRs(rupees)} was received online. TDW could not tell if it is already counted on this invoice.`,
  one: 'It is already on the invoice', two: 'Add it to the invoice',
  done: 'This payment has already been settled.', fail: 'Try again.', notFound: 'TDW could not find that payment.',
};
const ok = (body) => ({ status: 200, body: { ok: true, ...body } });
const no = (status, code, error) => ({ status, body: { ok: false, code, error } });
const COMING = () => no(200, 'NOT_CONFIGURED', 'Coming soon');
const env = (deps) => deps.env || process.env;
const on = (deps) => rp.config(env(deps)).configured;
/** Her session, for binding the connect `state`: a one-way digest of her bearer token, never the token itself. */
const sessionOf = (bearer) => crypto.createHash('sha256').update(String(bearer || '')).digest('hex').slice(0, 32);
const nowIso = (deps) => (deps.now ? deps.now() : new Date()).toISOString();
const nowMs = (deps) => (deps.now ? deps.now() : new Date()).getTime();

async function liveAccount(supabase, vendorId) {
  const { data } = await supabase.from('vendor_pay_accounts').select('id, provider, account_id, token_ref, status, connected_at')
    .eq('vendor_id', vendorId).neq('status', 'revoked').maybeSingle();
  return data || null;
}

/** The room. Without the four values it says Coming soon and touches no partner. */
async function room(vendorId, deps) {
  if (!on(deps)) return ok({ configured: false, comingSoon: 'Coming soon' });
  const s = deps.supabase;
  const acct = await liveAccount(s, vendorId);
  const [{ data: links }, { data: events }, { data: settings }] = await Promise.all([
    s.from('vendor_pay_links').select('id, invoice_id, milestone_id, binder_id, amount, state, short_url, sent_at, created_at').eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(50),
    s.from('vendor_pay_events').select('id, kind, amount, method, at, applied, not_applied_reason, invoice_id, milestone_id, provider_payment_id').eq('vendor_id', vendorId).order('at', { ascending: false }).limit(50),
    s.from('vendor_pay_settings').select('auto_link, thank_you').eq('vendor_id', vendorId).maybeSingle(),
  ]);
  const evs = (events || []).map((e) => (e.not_applied_reason === 'BINDER_UNCERTAIN'
    ? { ...e, question: { line: UNCERTAIN.line(e.amount), one: UNCERTAIN.one, two: UNCERTAIN.two } }
    : { ...e, amount_text: `Rs ${formatRs(e.amount)}` }));
  return ok({ configured: true, account: acct ? { provider: acct.provider, accountId: acct.account_id, status: acct.status, connectedAt: acct.connected_at } : null,
    links: links || [], events: evs, settings: settings || { auto_link: false, thank_you: false, accept_partial: false } });
}

/** "Connect Razorpay": a single-use, vendor- and session-bound, expiring state, stored (0202), and Razorpay's address. */
async function connectStart(vendorId, bearer, deps) {
  if (!on(deps)) return COMING();
  const st = rp.makeState({ vendorId, sessionId: sessionOf(bearer), now: nowMs(deps) }, env(deps));
  if (!st.ok) return COMING();
  const { error } = await deps.supabase.from('vendor_pay_oauth_states').insert({ nonce: st.nonce, vendor_id: vendorId, session_id: sessionOf(bearer),
    expires_at: new Date(nowMs(deps) + rp.STATE_TTL_MS).toISOString() });
  if (error) return no(500, 'STATE_NOT_STORED', 'TDW could not start the connection. Please try again.');
  const u = rp.authorizeUrl(st.state, env(deps));
  return ok({ url: u.url });
}

/** Razorpay sends her back with ?code&state. The state is checked, then SPENT in one guarded UPDATE, then exchanged. */
async function connectFinish(vendorId, bearer, { code, state }, deps) {
  if (!on(deps)) return COMING();
  const r = rp.readState(state, { vendorId, sessionId: sessionOf(bearer), now: nowMs(deps) }, env(deps));
  if (!r.ok) return no(400, r.code, 'This Razorpay link has expired or has already been used. Please start again from this room.');
  const { data: spent } = await deps.supabase.from('vendor_pay_oauth_states').update({ spent_at: nowIso(deps) })
    .eq('nonce', r.nonce).eq('vendor_id', vendorId).eq('session_id', sessionOf(bearer)).is('spent_at', null).gt('expires_at', nowIso(deps))
    .select('nonce').maybeSingle();
  if (!spent) return no(400, 'STATE_SPENT', 'This Razorpay link has expired or has already been used. Please start again from this room.');
  const ex = await rp.exchangeCode(code, { env: env(deps), fetch: deps.fetch });
  if (!ex.ok) return no(502, ex.code, 'Razorpay did not confirm the connection. Please try again.');
  const vault = deps.vault || require('./tokenVault');
  const sealed = vault.seal(JSON.stringify({ a: ex.accessToken, r: ex.refreshToken }));
  await deps.supabase.from('vendor_pay_accounts').update({ status: 'revoked', revoked_at: nowIso(deps) }).eq('vendor_id', vendorId).neq('status', 'revoked');
  const { error } = await deps.supabase.from('vendor_pay_accounts').insert({ vendor_id: vendorId, provider: 'razorpay', account_id: ex.accountId, token_ref: sealed, status: 'connected' });
  if (error) return no(500, 'NOT_SAVED', 'TDW could not save the connection. Please try again.');
  return ok({ account: { provider: 'razorpay', accountId: ex.accountId } });
}

async function disconnect(vendorId, deps) {
  if (!on(deps)) return COMING();
  await deps.supabase.from('vendor_pay_accounts').update({ status: 'revoked', revoked_at: nowIso(deps), token_ref: null }).eq('vendor_id', vendorId).neq('status', 'revoked');
  return ok({});
}

/** "Make link": for a package invoice (whole) or one of its lines; the amount is what is still owed, whole rupees. */
async function makeLink(vendorId, { invoiceId, milestoneId }, deps) {
  if (!on(deps)) return COMING();
  const s = deps.supabase;
  const acct = await liveAccount(s, vendorId);
  if (!acct || acct.status !== 'connected') return no(400, 'NOT_CONNECTED', 'Your Razorpay account is not connected yet. Please connect it in this room first.');
  // (b) THE HAZARD (turn 71): the room lists her invoices as binders. A binder that a package invoice names
  // (public.invoices.binder_id) IS that package invoice, resolved here before anything else, so its money always goes to
  // its instalments and never to the binder alone.
  const pkg = await packageForBinder(s, vendorId, invoiceId);
  if (pkg) invoiceId = pkg;
  const { data: inv } = await s.from('invoices').select('id, amount_total, amount_paid, state').eq('id', invoiceId).eq('vendor_id', vendorId).maybeSingle();
  if (!inv) return makeBinderLink(vendorId, invoiceId, acct, deps);
  if (inv.state === 'cancelled' || inv.state === 'paid') return no(400, 'NOTHING_OWED', 'Nothing is owed on this invoice.');
  let owed, acceptPartial = false;
  if (milestoneId) {
    const { data: ln } = await s.from('payment_schedules').select('id, amount_due, paid_amount, state').eq('id', milestoneId).eq('vendor_id', vendorId).eq('invoice_id', invoiceId).maybeSingle();
    if (!ln || ln.state !== 'pending') return no(400, 'NOTHING_OWED', 'Nothing is owed on this instalment.');
    owed = Number(ln.amount_due) - (Number(ln.paid_amount) || 0);
  } else {
    owed = Number(inv.amount_total) - (Number(inv.amount_paid) || 0);
    // Ruling 7: part payment on WHOLE-invoice links is HER setting (0202: vendor_pay_settings.accept_partial, default
    // false). A link for one line is always whole.
    const { data: st } = await s.from('vendor_pay_settings').select('accept_partial').eq('vendor_id', vendorId).maybeSingle();
    acceptPartial = !!(st && st.accept_partial === true);
  }
  if (!Number.isInteger(owed) || owed <= 0) return no(400, 'NOTHING_OWED', 'Nothing is owed on this invoice.');
  const vault = deps.vault || require('./tokenVault');
  const o = vault.open(acct.token_ref);
  if (!o.ok) return no(400, 'RECONNECT', 'Razorpay needs your account to be connected again. Please connect it again in this room.');
  const token = JSON.parse(o.value).a;
  const { data: row, error } = await s.from('vendor_pay_links').insert({ vendor_id: vendorId, provider: 'razorpay', invoice_id: invoiceId, milestone_id: milestoneId || null, amount: owed, state: 'created' }).select('id').maybeSingle();
  if (error || !row) return no(500, 'NOT_SAVED', 'TDW could not make the link. Please try again.');
  const made = await rp.createLink(token, { amountRupees: owed, description: 'Payment', referenceId: row.id, acceptPartial, notes: { tdw_link: row.id } }, { env: env(deps), fetch: deps.fetch });
  if (!made.ok) { await s.from('vendor_pay_links').update({ state: 'cancelled' }).eq('id', row.id); return no(502, made.code, 'Razorpay did not make the link. Please try again.'); }
  await s.from('vendor_pay_links').update({ provider_link_id: made.linkId, short_url: made.shortUrl, updated_at: nowIso(deps) }).eq('id', row.id);
  return ok({ link: { id: row.id, amount: owed, shortUrl: made.shortUrl } });
}

async function packageForBinder(s, vendorId, binderId) {
  const { data } = await s.from('invoices').select('id').eq('binder_id', binderId).eq('vendor_id', vendorId).maybeSingle();
  return data ? data.id : null;
}

/** (c) One invoice, as the room shows it when she taps it: a package invoice with its pending instalments, or a binder. */
async function invoiceInfo(vendorId, binderId, deps) {
  if (!on(deps)) return COMING();
  const s = deps.supabase;
  const pkgId = await packageForBinder(s, vendorId, binderId);
  if (pkgId) {
    const { data: inv } = await s.from('invoices').select('id, amount_total, amount_paid, state').eq('id', pkgId).eq('vendor_id', vendorId).maybeSingle();
    if (!inv) return no(404, 'NOT_FOUND', 'TDW could not find that invoice.');
    const { data: ls } = await s.from('payment_schedules').select('id, milestone_label, amount_due, paid_amount, due_date, state, ordinal').eq('invoice_id', pkgId).eq('vendor_id', vendorId).order('ordinal');
    const lines = (ls || []).filter((l) => l.state === 'pending').map((l) => ({ id: l.id, label: l.milestone_label, due_date: l.due_date,
      owed: Number(l.amount_due) - (Number(l.paid_amount) || 0), owed_text: `Rs ${formatRs(Number(l.amount_due) - (Number(l.paid_amount) || 0))}` }));
    const owed = Number(inv.amount_total) - (Number(inv.amount_paid) || 0);
    return ok({ kind: 'package', invoice_id: inv.id, state: inv.state, owed, owed_text: `Rs ${formatRs(owed)}`, lines });
  }
  const bd = deps.binder || await (async () => { try { return await defaultBinderDeps(s, vendorId); } catch { return null; } })();
  const rec = bd ? await bd.read(binderId).catch(() => null) : null;
  if (!rec) return no(404, 'NOT_FOUND', 'TDW could not find that invoice.');
  const binderOwed = (Number(rec.amount) || 0) - (Number(rec.amount_received) || 0);
  return ok({ kind: 'binder', owed: binderOwed, owed_text: `Rs ${formatRs(binderOwed)}` });
}

/** Her one switch (ruling 7): part payment on a link for the WHOLE invoice. Only accept_partial is written; the other two
 *  settings columns do nothing yet and are neither written nor drawn (turn 72). */
async function setSettings(vendorId, body, deps) {
  if (!on(deps)) return COMING();
  if (!body || typeof body.accept_partial !== 'boolean') return no(400, 'BAD_SETTING', 'TDW did not receive a setting it can save.');
  const s = deps.supabase;
  const { data: have } = await s.from('vendor_pay_settings').select('vendor_id').eq('vendor_id', vendorId).maybeSingle();
  const row = { accept_partial: body.accept_partial, updated_at: nowIso(deps) };
  const w = have ? await s.from('vendor_pay_settings').update(row).eq('vendor_id', vendorId) : await s.from('vendor_pay_settings').insert({ vendor_id: vendorId, ...row });
  if (w && w.error) return no(500, 'NOT_SAVED', 'TDW could not save the setting. Please try again.');
  return ok({ settings: { accept_partial: body.accept_partial } });
}

/** (b) A link for a BINDER-ONLY invoice: the amount still owed on the binder, read exactly as the payments door reads it. */
async function makeBinderLink(vendorId, binderId, acct, deps) {
  const s = deps.supabase;
  const bd = deps.binder || await (async () => { try { return await defaultBinderDeps(s, vendorId); } catch { return null; } })();
  const rec = bd ? await bd.read(binderId).catch(() => null) : null;
  if (!rec) return no(404, 'NOT_FOUND', 'TDW could not find that invoice.');
  const owed = (Number(rec.amount) || 0) - (Number(rec.amount_received) || 0);
  if (!Number.isInteger(owed) || owed <= 0) return no(400, 'NOTHING_OWED', 'Nothing is owed on this invoice.');
  const { data: st } = await s.from('vendor_pay_settings').select('accept_partial').eq('vendor_id', vendorId).maybeSingle();
  const vault = deps.vault || require('./tokenVault');
  const o = vault.open(acct.token_ref);
  if (!o.ok) return no(400, 'RECONNECT', 'Razorpay needs your account to be connected again. Please connect it again in this room.');
  const { data: row, error } = await s.from('vendor_pay_links').insert({ vendor_id: vendorId, provider: 'razorpay', binder_id: binderId, amount: owed, state: 'created' }).select('id').maybeSingle();
  if (error || !row) return no(500, 'NOT_SAVED', 'TDW could not make the link. Please try again.');
  const made = await rp.createLink(JSON.parse(o.value).a, { amountRupees: owed, description: 'Payment', referenceId: row.id, acceptPartial: !!(st && st.accept_partial === true), notes: { tdw_link: row.id } }, { env: env(deps), fetch: deps.fetch });
  if (!made.ok) { await s.from('vendor_pay_links').update({ state: 'cancelled' }).eq('id', row.id); return no(502, made.code, 'Razorpay did not make the link. Please try again.'); }
  await s.from('vendor_pay_links').update({ provider_link_id: made.linkId, short_url: made.shortUrl, updated_at: nowIso(deps) }).eq('id', row.id);
  return ok({ link: { id: row.id, amount: owed, shortUrl: made.shortUrl } });
}

/** Her tap: take a recorded refund off the invoice (0202), then the binder through the same mirror the payments door uses. */
async function takeOffRefund(vendorId, refundId, deps) {
  if (!on(deps)) return COMING();
  const { data, error } = await deps.supabase.rpc('pay_take_off_refund', { p_vendor: vendorId, p_provider: 'razorpay', p_refund_id: refundId });
  if (error || !data) return no(503, 'RPC_ERROR', 'TDW could not take the refund off the invoice. Please try again.');
  if (!data.ok) return no(400, data.code, { ALREADY_TAKEN_OFF: 'This refund has already been taken off the invoice.', INVOICE_CANCELLED: 'This invoice is cancelled.' }[data.code] || 'TDW could not take the refund off the invoice.');
  if (deps.mirror) await deps.mirror(vendorId, data.invoice);
  return ok({ invoice: data.invoice });
}

// ── THE WEBHOOK'S RECORDER (src/api/webhooks/razorpayPartner.js calls this after the signature check). Store and apply
// in ONE call to 0201 (once only by payment id); a failed or refunded event is a row of its own, once.
async function recordEvent(evt, deps) {
  const s = deps.supabase; const type = evt && evt.event;
  const acctId = evt && evt.account_id;
  const { data: acct } = acctId ? await s.from('vendor_pay_accounts').select('vendor_id').eq('account_id', acctId).eq('provider', 'razorpay').neq('status', 'revoked').maybeSingle() : { data: null };
  if (!acct) return { handled: false, reason: 'UNKNOWN_ACCOUNT' };
  const vendorId = acct.vendor_id; const pl = (evt.payload || {});
  const pay = pl.payment && pl.payment.entity; const lk = pl.payment_link && pl.payment_link.entity; const rf = pl.refund && pl.refund.entity;
  if ((type === 'payment_link.paid' || type === 'payment_link.partially_paid') && pay && lk) {
    // The link must be HERS (her account's vendor) AND the very link Razorpay names: its reference id is our row and its
    // own id must be the one we stored. Anything else moves nobody's invoice (the chair, turn 53).
    const { data: link } = await s.from('vendor_pay_links').select('id, invoice_id, milestone_id, binder_id, provider_link_id').eq('id', lk.reference_id).eq('vendor_id', vendorId).maybeSingle();
    if (!link || !link.provider_link_id || link.provider_link_id !== lk.id) return { handled: false, reason: 'UNKNOWN_LINK' };
    const rupees = Math.floor(Number(pay.amount) / 100);
    if (link.binder_id) {   // (b): hold first (once only), apply after the 200 (the door schedules it)
      const h = await s.rpc('pay_hold_binder_payment', { p_vendor: vendorId, p_binder: link.binder_id, p_amount: rupees, p_provider: 'razorpay', p_payment_id: pay.id, p_link: link.id, p_method: pay.method || null });
      if (h.error) return { handled: false, reason: 'RPC_ERROR', retry: true };
      return { handled: true, answer: h.data, applyAfter: h.data && h.data.event_id ? { vendorId, eventId: h.data.event_id } : null };
    }
    const args = { p_vendor: vendorId, p_amount: rupees, p_received: null, p_provider: 'razorpay', p_payment_id: pay.id, p_link: link.id, p_method: pay.method || null };
    const r = link.milestone_id
      ? await s.rpc('pay_record_milestone', { ...args, p_milestone: link.milestone_id })
      : await s.rpc('pay_record_invoice', { ...args, p_invoice: link.invoice_id });
    if (r.error) return { handled: false, reason: 'RPC_ERROR', retry: true };
    await s.from('vendor_pay_links').update({ state: type === 'payment_link.paid' ? 'paid' : 'part_paid', updated_at: nowIso(deps) }).eq('id', link.id);
    return { handled: true, answer: r.data };
  }
  if (type === 'payment.failed' && pay) {
    await s.from('vendor_pay_events').upsert({ vendor_id: vendorId, provider: 'razorpay', provider_payment_id: pay.id, kind: 'failed', amount: Math.floor(Number(pay.amount) / 100), method: pay.method || null, applied: false },
      { onConflict: 'provider,provider_payment_id,kind', ignoreDuplicates: true });
    return { handled: true };
  }
  if (type === 'refund.processed' && rf) {
    const { data: orig } = await s.from('vendor_pay_events').select('invoice_id, milestone_id').eq('provider', 'razorpay').eq('provider_payment_id', rf.payment_id).eq('kind', 'paid').maybeSingle();
    await s.from('vendor_pay_events').upsert({ vendor_id: vendorId, provider: 'razorpay', provider_payment_id: rf.id, kind: 'refunded', amount: Math.floor(Number(rf.amount) / 100),
      invoice_id: orig ? orig.invoice_id : null, milestone_id: orig ? orig.milestone_id : null, applied: false }, { onConflict: 'provider,provider_payment_id,kind', ignoreDuplicates: true });
    return { handled: true };
  }
  return { handled: false, reason: 'IGNORED' };
}

// ── (b) A PAYMENT ON A BINDER-ONLY INVOICE: claim → base (kept once) → compare → write → flip (0202's functions).
// The binder is read and written exactly as the payments door does (invoices.js :364-383): records.amount and
// amount_received read; donna_money_edit with amount_received, amount_pending = max(0, total − received) and
// payment_status 'paid' or 'partial'. Nothing goes into the binder but money (F-44.17). One apply per binder at a time.
async function defaultBinderDeps(supabase, vendorId) {
  const { data: v } = await supabase.from('vendors').select('id, user_id').eq('id', vendorId).maybeSingle();
  if (!v) return null;
  const { resolveAgentForVendor } = require('../../api/middleware/agentBridge');
  const { agentId } = await resolveAgentForVendor(supabase, v, v.user_id);
  const eng = supabase.schema('engine');
  return {
    read: async (binderId) => { const { data } = await eng.from('records').select('id, amount, amount_received').eq('agent_id', agentId).eq('id', binderId).maybeSingle(); return data || null; },
    write: async (binderId, received, total) => require('../executeAndPatch').executeAndPatch(agentId, 'donna_money_edit', {
      binder_id: binderId, amount_received: received, amount_pending: Math.max(0, total - received),
      payment_status: (total > 0 && received >= total) ? 'paid' : 'partial' }),
  };
}
const engineFailed = (r) => !r || r.ok === false || r.error || r.isError === true;

/** Apply one held binder payment. Answers { outcome: 'applied' | 'flipped_only' | 'uncertain' | 'not_claimed' | 'failed' }. */
async function applyBinderEvent(vendorId, eventId, deps) {
  const s = deps.supabase;
  const c = await s.rpc('pay_claim_binder_event', { p_vendor: vendorId, p_event: eventId });
  if (c.error || !c.data || !c.data.ok) return { outcome: 'not_claimed' };
  const ev = c.data;
  const bd = deps.binder || await defaultBinderDeps(s, vendorId);
  const release = async () => { await s.rpc('pay_finish_binder_event', { p_vendor: vendorId, p_event: eventId, p_outcome: 'release' }); };
  if (!bd) { await release(); return { outcome: 'failed' }; }
  let rec;
  try { rec = await bd.read(ev.binder_id); } catch { rec = null; }
  if (!rec) { await release(); return { outcome: 'failed' }; }
  const now = Number(rec.amount_received) || 0; const total = Number(rec.amount) || 0;
  let base = ev.base;
  if (base === null || base === undefined) {          // a first apply: keep the base once, under the claim
    const kept = await s.rpc('pay_keep_binder_base', { p_vendor: vendorId, p_event: eventId, p_base: now });
    if (kept.error || kept.data !== true) { await release(); return { outcome: 'failed' }; }
    base = now;
  } else if (now === base + ev.amount) {              // a retry: the write landed before the crash; flip only
    await s.rpc('pay_finish_binder_event', { p_vendor: vendorId, p_event: eventId, p_outcome: 'applied' });
    return { outcome: 'flipped_only' };
  } else if (now !== base) {                          // someone else moved this binder's money: show it, never guess
    await s.rpc('pay_finish_binder_event', { p_vendor: vendorId, p_event: eventId, p_outcome: 'uncertain' });
    return { outcome: 'uncertain' };
  }
  let w;
  try { w = await bd.write(ev.binder_id, base + ev.amount, total); } catch { w = null; }
  if (engineFailed(w)) { await release(); return { outcome: 'failed' }; }   // not on the invoice yet: the sweep retries
  await s.rpc('pay_finish_binder_event', { p_vendor: vendorId, p_event: eventId, p_outcome: 'applied' });
  return { outcome: 'applied' };
}

/** The sweep ('9,24,39,54 * * * *'): at most 50 held binder payments older than 2 minutes, each through the same apply. */
async function sweepBinderEvents(deps, limit = 50) {
  const s = deps.supabase; const cutoff = new Date((deps.now ? deps.now() : new Date()).getTime() - 2 * 60000).toISOString();
  const { data } = await s.from('vendor_pay_events').select('id, vendor_id').eq('applied', false).eq('not_applied_reason', 'BINDER_PENDING').lt('at', cutoff).limit(limit);
  const out = [];
  for (const e of data || []) out.push({ id: e.id, ...(await applyBinderEvent(e.vendor_id, e.id, deps)) });
  return out;
}

/** Her two actions on "Received, check this invoice's paid amount", each once only, with who and when. */
async function resolveUncertain(vendorId, userId, eventId, action, deps) {
  if (!on(deps)) return COMING();
  const a = action === 'already_on' ? 'already_on' : action === 'add' ? 'added' : null;
  if (!a) return no(400, 'BAD_ACTION', 'Please choose one of the two answers.');
  const { data: mine } = await deps.supabase.from('vendor_pay_events').select('id').eq('id', eventId).eq('vendor_id', vendorId).maybeSingle();
  if (!mine) return no(404, 'NOT_FOUND', UNCERTAIN.notFound);
  const r = await deps.supabase.rpc('pay_resolve_binder_event', { p_vendor: vendorId, p_event: eventId, p_action: a, p_user: userId });
  if (r.error || !r.data) return no(503, 'RPC_ERROR', UNCERTAIN.fail);
  if (!r.data.ok) return no(400, r.data.code, UNCERTAIN.done);
  if (a === 'added') await applyBinderEvent(vendorId, eventId, deps);
  return ok({ action: a });
}

module.exports = { sessionOf, room, connectStart, connectFinish, disconnect, makeLink, takeOffRefund, recordEvent,
  applyBinderEvent, sweepBinderEvents, resolveUncertain, UNCERTAIN, invoiceInfo, setSettings };
