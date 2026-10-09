'use strict';
// src/lib/instagram/igCards.js · CE-47 · CLB PART C · HER PACKAGES AS CARDS IN HER INSTAGRAM MESSAGES (the chair's rulings,
// 8 Oct 2026). Meta's pages read 8 Oct 2026 (Instagram API with Instagram Login, messaging-api): a generic template holds at
// most 10 elements, each a title of at most 80 characters with at least one more property, an optional subtitle of at most 80,
// an optional image_url and at most 3 postback or web_url buttons; a conversation starter (ice breaker) is set on
// /me/messenger_profile (platform "instagram", at most 4), and a tap arrives as a messaging postback carrying its payload.
//
//   THE GATE      flag.ig_package_cards (0221; metaGates.js holds its permissions). Her choice is ON unless she turns it off
//                 (featureGate). Until Meta grants the pair, it opens only for a vendor on clb.testers who is also on the
//                 Instagram lane's walk list; after the grant, for every vendor whose choice is on and whose Instagram is
//                 connected. It goes live by itself (the founder's standing rule for Meta-gated features).
//   THE STARTER   "See packages", set while the gate is open for her, her choice is on and she has a package to show;
//                 removed when she turns it off. Starters of her own are never overwritten: hers are kept, and ours is added
//                 beside them, or not at all when she already has four.
//   THE CARDS     one per package, at most 10, in her order (the default first, then oldest first, as her website lists them).
//                 Title: the package name. Subtitle: "From Rs <amount>" in Indian commas, ONLY when her website shows prices
//                 (vendors.rate_display, the switch vendorCard.publicPackages obeys) and the package has a total. One button,
//                 "See details", opening her TDW website. The picture: the cover of a published look tied to the package,
//                 else her portfolio's hero, else none. Every candidate passes profiles.pictureOnPage (R-47.2; WEB-4 adds the
//                 held state there), so a held picture is never sent to Meta. Rows are read whole, so the safety column reaches
//                 that one function with no edit here.
//   THE WINDOW    cards go only as the answer to her client's tap (an inbound postback), so always inside the 24-hour window;
//                 igSend.withinWindow is checked anyway, and nothing is sent outside it.
// No token is ever logged or returned.
const cap = require('../capabilities');
const featureGate = require('../featureGate');
const testersLib = require('../collab/testers');
const { pictureOnPage } = require('../hub/profiles');
const { formatRs } = require('../format');
const { storefrontUrl } = require('../../api/vendor/solutions/storefront');
const igSend = require('./igSend');

const KEY = 'flag.ig_package_cards';
const STARTER = 'See packages';
const PAYLOAD = 'TDW_SEE_PACKAGES';
const MAX_CARDS = 10;
const MAX_STARTERS = 4;
const BUTTON = 'See details';
const cut = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

// R-47.1: what her client reads when there is nothing to show (a whole sentence).
const NOTHING_LINE = 'There are no packages to show here yet. Please send your question, and you will get a reply.';

/** Is the feature open for her now? { open, live, choice, reason }. */
async function gateFor(supabase, vendorId, env = process.env) {
  const row = await cap.get(KEY, { supabase });
  const live = !!(row && row.status === 'on');
  const c = await featureGate.choiceOf(supabase, vendorId, KEY);
  if (c.choice === 'off') {
    // Her off closes it. Whether it would be open without her off decides if her room shows the switch at all (dark if not).
    let available;
    if (live) { const { data } = await supabase.from('vendor_ig_connections').select('ig_user_id').eq('vendor_id', vendorId).maybeSingle(); available = !!(data && data.ig_user_id); }
    else available = featureGate.walkOpen(KEY, row, vendorId, env) && (await testersLib.testers(supabase).catch(() => [])).includes(vendorId);
    return { open: false, live, choice: 'off', available, reason: 'she chose off' };
  }
  const g = await featureGate.openFor({ supabase, vendorId, key: KEY, env, row: row || { status: 'pending' } });
  if (!g.open) return { open: false, live, choice: 'on', reason: g.reason };
  if (live) return { open: true, live, choice: 'on', reason: null };
  const list = await testersLib.testers(supabase).catch(() => []);
  return list.includes(vendorId) ? { open: true, live, choice: 'on', reason: null } : { open: false, live, choice: 'on', reason: 'not on clb.testers before approval' };
}

/** A picture that may be sent to Meta: the one function (profiles.pictureOnPage), never a held one. */
const maySend = (row, url) => !!row && pictureOnPage({ ...row, image_url: url || row.image_url });

/** Her cards, as they will be sent: [{ package_id, title, subtitle, image_url, url }]. */
async function cardsFor(supabase, vendorId) {
  const { data: v } = await supabase.from('vendors').select('id, routing_handle, rate_display').eq('id', vendorId).maybeSingle();
  if (!v) return [];
  const { data: pk } = await supabase.from('vendor_packages').select('id, name, total, is_default, created_at')
    .eq('vendor_id', vendorId).is('deleted_at', null).order('is_default', { ascending: false }).order('created_at', { ascending: true });
  const packages = (pk || []).filter((p) => p && String(p.name || '').trim()).slice(0, MAX_CARDS);
  if (!packages.length) return [];
  const ids = packages.map((p) => p.id);
  const { data: looks } = await supabase.from('vendor_looks').select('id, package_id, position')
    .eq('vendor_id', vendorId).eq('status', 'published').is('deleted_at', null).in('package_id', ids).order('position', { ascending: true });
  const lookIds = (looks || []).map((l) => l.id);
  const { data: photos } = lookIds.length
    ? await supabase.from('vendor_look_photos').select('*').in('look_id', lookIds).is('deleted_at', null).order('position', { ascending: true })
    : { data: [] };
  const { data: heroes } = await supabase.from('vendor_portfolio').select('*').eq('vendor_id', vendorId).eq('is_hero', true);
  const hero = (heroes || []).find((r) => maySend(r)) || null;
  const site = v.routing_handle ? storefrontUrl(v.routing_handle) : null;
  const showPrice = v.rate_display !== false;
  return packages.map((p) => {
    // the cover of the first published look tied to this package (its first picture by position); if that cover may not be
    // sent, the next candidate is her hero, never another picture of the look
    const look = (looks || []).find((l) => l.package_id === p.id);
    const cover = look ? (photos || []).find((ph) => ph.look_id === look.id) : null;
    const image = cover && maySend(cover) ? cover.image_url : hero ? hero.image_url : null;
    const total = Number(p.total);
    return {
      package_id: p.id,
      title: cut(p.name, 80),
      subtitle: showPrice && Number.isFinite(total) && total > 0 ? `From Rs ${formatRs(Math.round(total))}` : null,
      image_url: image,
      url: site,
    };
  });
}

/** Meta's generic template from her cards. Elements without a button or subtitle are kept valid by the button. */
function templateOf(cards) {
  return {
    attachment: { type: 'template', payload: { template_type: 'generic', elements: cards.slice(0, MAX_CARDS).map((c) => {
      const e = { title: c.title };
      if (c.subtitle) e.subtitle = c.subtitle;
      if (c.image_url) e.image_url = c.image_url;
      if (c.url) e.buttons = [{ type: 'web_url', url: c.url, title: BUTTON }];
      return e;
    }) } },
  };
}

async function graph(fetchImpl, token, method, path, body) {
  const url = `${igSend.SEND_BASE}/${path}`;
  const res = await fetchImpl(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  return { ok: !!(res.ok && json && !json.error), json };
}

/** Her starters as Meta holds them: [{ locale?, call_to_actions: [{ question, payload }] }]. */
async function readStarters(fetchImpl, token) {
  const r = await graph(fetchImpl, token, 'GET', 'me/messenger_profile?fields=ice_breakers');
  if (!r.ok) return { ok: false };
  const d = r.json && Array.isArray(r.json.data) && r.json.data[0] ? r.json.data[0].ice_breakers : null;
  return { ok: true, sets: Array.isArray(d) ? d : [] };
}
const ours = (a) => a && a.payload === PAYLOAD;

/** Add ours beside hers, never over them. { ok, state: 'set' | 'full' | 'failed' }. */
async function setStarter(fetchImpl, token) {
  const r = await readStarters(fetchImpl, token);
  if (!r.ok) return { ok: false, state: 'failed' };
  const sets = r.sets.map((s) => ({ ...s, call_to_actions: Array.isArray(s.call_to_actions) ? s.call_to_actions.slice() : [] }));
  let def = sets.find((s) => !s.locale || s.locale === 'default');
  if (!def) { def = { call_to_actions: [] }; sets.unshift(def); }
  if (def.call_to_actions.some(ours)) return { ok: true, state: 'set' };
  if (def.call_to_actions.length >= MAX_STARTERS) return { ok: true, state: 'full' };
  def.call_to_actions.push({ question: STARTER, payload: PAYLOAD });
  const w = await graph(fetchImpl, token, 'POST', 'me/messenger_profile', { platform: 'instagram', ice_breakers: sets });
  return w.ok ? { ok: true, state: 'set' } : { ok: false, state: 'failed' };
}

/** Take ours away; hers stay. { ok, state: 'removed' | 'failed' }. */
async function removeStarter(fetchImpl, token) {
  const r = await readStarters(fetchImpl, token);
  if (!r.ok) return { ok: false, state: 'failed' };
  if (!r.sets.some((s) => (s.call_to_actions || []).some(ours))) return { ok: true, state: 'removed' };
  const sets = r.sets.map((s) => ({ ...s, call_to_actions: (s.call_to_actions || []).filter((a) => !ours(a)) })).filter((s) => s.call_to_actions.length);
  const w = sets.length
    ? await graph(fetchImpl, token, 'POST', 'me/messenger_profile', { platform: 'instagram', ice_breakers: sets })
    : await graph(fetchImpl, token, 'DELETE', 'me/messenger_profile', { fields: ['ice_breakers'] });
  return w.ok ? { ok: true, state: 'removed' } : { ok: false, state: 'failed' };
}

// ── HER ROOM (GET/POST /api/v2/vendor/solutions/instagram/package-cards) ──────────────────────────────────────────────────
// R-47.1: every line is a whole sentence.
const LINES = Object.freeze({
  on: 'When someone taps "See packages" in your Instagram messages, they get these cards.',
  off: 'Your packages are not shown in your Instagram messages.',
  none: 'You have no packages yet. Add a package, and it will be shown here.',
  full: 'Your Instagram account already has 4 conversation starters. Remove one in Instagram, and TDW will add "See packages".',
  failed: 'Instagram did not accept the change. Please try again.',
  connect: 'Connect your Instagram first, and your packages can be shown in your messages.',
});

/** The room's answer. deps: { supabase, env, fetchImpl, token(vendorId) -> accessToken|null }. A closed gate is 404 (dark). */
async function room(vendorId, deps, change) {
  if (change !== undefined && typeof change !== 'boolean') return { status: 400 };
  let g = await gateFor(deps.supabase, vendorId, deps.env);
  if (!g.open && !(g.choice === 'off' && g.available)) {
    if (g.reason === 'Instagram not connected' && g.choice !== 'off') return { status: 200, body: { ok: true, state: 'not_connected', line: LINES.connect, cards: [] } };
    return { status: 404 };
  }
  if (change !== undefined) {
    const w = await featureGate.setChoice({ supabase: deps.supabase, vendorId, key: KEY, choice: change ? 'on' : 'off' });
    if (!w.ok) return { status: 503 };
    g = await gateFor(deps.supabase, vendorId, deps.env);
  }
  const cards = await cardsFor(deps.supabase, vendorId);
  const preview = cards.map((c) => ({ title: c.title, subtitle: c.subtitle, image_url: c.image_url, button: c.url ? BUTTON : null }));
  const token = await deps.token(vendorId);
  if (g.choice === 'off') {
    if (change === false && token) await removeStarter(deps.fetchImpl, token).catch(() => null);
    return { status: 200, body: { ok: true, state: 'off', line: LINES.off, cards: preview } };
  }
  if (!cards.length) return { status: 200, body: { ok: true, state: 'no_packages', line: LINES.none, cards: [] } };
  const st = token ? await setStarter(deps.fetchImpl, token).catch(() => ({ ok: false, state: 'failed' })) : { ok: false, state: 'failed' };
  const state = st.state === 'set' ? 'on' : st.state === 'full' ? 'full' : 'failed';
  return { status: 200, body: { ok: true, state, line: LINES[state], cards: preview } };
}

// Live by itself (the founder's standing rule): once the gate is open for her, the starter is put in place the first time
// one of her clients writes, at most once in six hours per vendor in this process, without her opening the room.
const ensured = new Map();
async function ensureStarter(deps, vendorId) {
  const at = ensured.get(vendorId) || 0; const now = deps.nowMs();
  if (now - at < 6 * 60 * 60 * 1000) return { state: 'recent' };
  ensured.set(vendorId, now);
  const g = await gateFor(deps.supabase, vendorId, deps.env || process.env);
  if (!g.open) return { state: 'closed' };
  if (!(await cardsFor(deps.supabase, vendorId)).length) return { state: 'no_packages' };
  const t = await deps.tokenForCall(deps.supabase, vendorId);
  if (!t || !t.ok) return { state: 'no_token' };
  return setStarter(deps.fetchImpl, t.accessToken);
}
const _resetEnsured = () => ensured.clear();

/** Her client tapped "See packages": send her cards (or the one line), inside the window only.
 *  deps: { supabase, fetchImpl, tokenForCall, nowMs, env }. args: { vendorId, igsid, receivedAtMs }. */
async function answer(deps, { vendorId, igsid, receivedAtMs }) {
  const g = await gateFor(deps.supabase, vendorId, deps.env || process.env);
  if (!g.open) return { sent: false, why: `closed: ${g.reason}` };
  if (!igSend.withinWindow(receivedAtMs, deps.nowMs())) return { sent: false, why: 'outside the 24-hour window' };
  const t = await deps.tokenForCall(deps.supabase, vendorId);
  if (!t || !t.ok) return { sent: false, why: 'no usable token' };
  const cards = await cardsFor(deps.supabase, vendorId);
  const message = cards.length ? templateOf(cards) : { text: NOTHING_LINE };
  const w = await graph(deps.fetchImpl, t.accessToken, 'POST', 'me/messages', { recipient: { id: igsid }, message });
  return w.ok ? { sent: true, why: cards.length ? `cards: ${cards.length}` : 'no packages line' } : { sent: false, why: 'Meta refused' };
}

module.exports = { KEY, STARTER, PAYLOAD, MAX_CARDS, BUTTON, NOTHING_LINE, LINES, gateFor, cardsFor, templateOf, readStarters, setStarter, removeStarter, answer, room, ensureStarter, _resetEnsured, maySend };
