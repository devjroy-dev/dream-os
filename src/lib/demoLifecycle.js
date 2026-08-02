// src/lib/demoLifecycle.js — THE DEMO LIFECYCLE ENGINE (TDW_08 · P1 · G-1, G-2)
//
// ══════════════════════════════════════════════════════════════════════════════
// F-06.85 HEADER — the mechanism, named in-comment, because the next sitting that
// touches demo presence must be forced to re-read this before it moves a byte.
// ══════════════════════════════════════════════════════════════════════════════
//
// WHAT THIS MODULE IS. The SOLE WRITER of the four presence fields on
// public.demo_vendors — `active`, `discover_eligible`, `discover_eligible_at`,
// `state` — plus `public.prospects.demo_vendor_ref` at `onInvited()` ONLY
// (CE-135 §4, the sole-writer rider as formally amended; the widening is stated
// here rather than in a handover so the next reader learns it from the module).
//
// WHY SOLE. The estate ran a boolean-plus-stamp presence idiom for two blocks
// with TWO writers and no coordinator, and it drifted: `demoAdmin.js` set
// `discover_eligible_at` on grant and left it standing on revoke, so four
// production rows carry a stamp with eligibility false. The column says so
// itself — `0067_demo_vendor_discover.sql:24-25` reads "Timestamp when
// discover_eligible was last set to true. Audit trail." A precedence rule that
// lives in prose is a rule that drifts; a precedence rule enforced by one writer
// is a mechanism. THAT is why this file exists, and it is why adding a fifth
// presence writer anywhere else re-opens a disease this estate already paid for.
//
// WHAT REPLACED WHAT — and the COST, stated. `state` is ADDITIVE (CE-132, FORK
// A(b)). It did NOT supersede `active` / `discover_eligible`: the couple feed
// still predicates on `discover_eligible AND active`
// (couple/discover.js:212-213, :418-419), backed by the partial index
// `demo_vendors_discover_idx`, and BOTH feed indexes are untouched. The cost
// accepted in the open: the estate now holds FOUR fields answering one question,
// and the only thing keeping them honest is that a single writer owns all four.
// Proven at the data on 2026-08-02 — 8 active / 5 in the couple feed / 0
// eligible-but-inactive, identical before and after 0106.
//
// `legacy` IS NOT A LIFECYCLE STAGE. It is a lifecycle-ABSENCE marker for the
// twelve rows that predate this machine, whose history was never recorded and
// cannot be reconstructed. NO transition leads INTO `legacy`; its only legal
// exit is `legacy -> invited`. Every other entry point REFUSES a `legacy` row
// rather than inventing a past for it.
//
// TWO STAMP IDIOMS RUN IN THIS TABLE AND THEY MUST NOT BE HARMONISED.
//   · HISTORY stamps are KEPT and never cleared. `removed_at` means "when this
//     row was LAST removed" and survives restore() on purpose. It records that a
//     thing happened; the thing having been undone does not un-happen it.
//   · STATE stamps are CLEARED when their state ends. `discover_eligible_at`
//     means "eligible since" and is nulled the moment eligibility goes false —
//     by setDiscoverEligible() on a revoke and by the nightly sunset.
// The next hand reading "removed_at is never cleared" beside
// "discover_eligible_at is cleared" will reach for consistency. DO NOT. C-2 is
// exactly what a state stamp outliving its condition costs: the column's own
// committed comment (0067_demo_vendor_discover.sql:24-25) says "last set to
// true", and four production rows carried a stamp with eligibility false because
// revoke left it standing. `removed_at` is not that column and not that idiom.
//
// THE REFUSAL DOCTRINE. This module returns TYPED REFUSALS; it does not throw
// for business conditions. A refusal is `{ ok:false, reason:'…' }` and is always
// safe for a caller to ignore. That is deliberate: two of this module's three
// live seams (the enquiry relay and the STOP handler) sit inside paths that must
// survive this module being wrong, so the module is built to be ignorable.
// Genuine infrastructure faults (a dead supabase handle) still throw.
//
// THE ONE FIELD THIS MODULE DOES NOT SOLELY OWN, declared not discovered:
// `prospects.demo_vendor_ref` is ALSO written by `src/lib/discover/demoLeadAlert.js`
// at :324 and :344. TWO writers, one field — and that is NOT C-2's disease. The
// distinction is the whole reason it is tolerated: both writers write the
// IDENTICAL value (`demoVendor.id`), so they can differ in TIMING and never in
// CONTENT. C-2's two writers disagreed about whether to write at all. Filed, not
// cured; the live alert path is NOT routed through this module in this sitting.
//
// ══════════════════════════════════════════════════════════════════════════════

'use strict';

const prospects = require('./prospects');

// ── The machine ──────────────────────────────────────────────────────────────

const WINDOW_HOURS = 72;   // G-1: the window, and every refresh of it
// G-2, founder-amended 2026-08-02 (CE-138): 90 days, not 30. This is the CODE
// DEFAULT and it is the ruled behaviour — it must hold against an empty
// admin_config, because an unseeded key is the normal state of this estate
// (src/api/admin/config.js:31-32 404s on a key with no row and there is no
// insert route; ranking.js:67 records the same trap).
const DEFAULT_SUNSET_DAYS = 90;
const SUNSET_CONFIG_KEY   = 'demo.sunset_days';

const STATES = Object.freeze([
  'legacy', 'built', 'invited', 'opened', 'engaged', 'claimed', 'expired', 'removed',
]);

// The two states an invite may be fired FROM. POSITIVE ENUMERATION, same family
// as the two lists below. It exists as an EXPORT rather than as a literal inside
// onInvited because the admin invite route must refuse an ineligible row BEFORE
// it spends a real template on it (CE-146 §5: a refused send must not stamp
// `invited`, and a send that will be refused must not happen at all). Two readers,
// ONE frozen authority — the alternative is the route re-implementing the rule and
// the two drifting, which is the disease this whole module was built against.
const INVITE_STATES = Object.freeze(['legacy', 'built']);

// The live clock states — the ones the hourly sweep may expire. POSITIVE
// ENUMERATION, ruled binding at CE-133 §3. A negated predicate here
// (`state != 'claimed'`) would sweep `legacy` rows, which have no clock and no
// history, and is a bench RED rather than a style note.
const CLOCK_STATES = Object.freeze(['invited', 'opened', 'engaged']);

// The states the nightly sunset may rotate out of the feed. Also POSITIVE.
// `legacy` is excluded twice over: it is absent from this list, and its
// `invited_at` is NULL so the age predicate can never admit it.
// WIDENED 2026-08-02 (CE-142 §1, founder 「 whichever is the easiest one 」):
// `legacy` and `built` JOIN the list. Before the widening a demo that was built,
// put in the feed and never invited satisfied no timer at all — nine of twelve
// production rows — and G-2's "unclaimed demos sunset from Discover" plainly
// includes never-invited ones. Still POSITIVE: `claimed` and `removed` are
// absent by name, not by negation.
const SUNSET_STATES = Object.freeze(['legacy', 'built', 'invited', 'opened', 'engaged', 'expired']);

const PRESENCE_COLUMNS = Object.freeze([
  'active', 'discover_eligible', 'discover_eligible_at', 'state',
]);

function _now() { return new Date(); }
function _iso(d) { return d.toISOString(); }
function _windowEnd(from) { return new Date(from.getTime() + WINDOW_HOURS * 3600 * 1000); }
function _refuse(reason, detail) { return { ok: false, reason, detail: detail || null }; }
function _done(state, row, extra) { return Object.assign({ ok: true, state, row: row || null }, extra || {}); }

// ── The one write door ───────────────────────────────────────────────────────
// EVERY presence byte this module writes goes through here. Not a convenience —
// it is what makes the sole-writer rider STRUCTURAL rather than a promise. A
// patch that writes a presence column without passing through `_write` is
// visible as a diff that skips this function, which is exactly what the bench
// looks for.
async function _write(supabase, id, patch) {
  const illegal = Object.keys(patch).filter(
    k => PRESENCE_COLUMNS.includes(k) === false && k.endsWith('_at') === false
      && k !== 'claimed_vendor_id',
  );
  if (illegal.length) {
    throw new Error(`demoLifecycle._write refused a non-lifecycle column: ${illegal.join(', ')}`);
  }
  const { data, error } = await supabase
    .from('demo_vendors')
    .update(patch)
    .eq('id', id)
    .select('id, ig_handle, display_name, whatsapp_phone, state, active, discover_eligible, discover_eligible_at, '
          + 'invited_at, opened_at, engaged_at, claimed_at, removed_at, expires_at, claim_token')
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function _read(supabase, id) {
  const { data, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, whatsapp_phone, state, active, discover_eligible, discover_eligible_at, '
          + 'invited_at, opened_at, engaged_at, claimed_at, removed_at, expires_at, claim_token')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function _readByHandle(supabase, handle) {
  const { data, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, whatsapp_phone, state, active, discover_eligible, discover_eligible_at, '
          + 'invited_at, opened_at, engaged_at, claimed_at, removed_at, expires_at, claim_token')
    .eq('ig_handle', String(handle || '').toLowerCase().trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── built ────────────────────────────────────────────────────────────────────
// The admin factory's insert. `state:'built'` is written EXPLICITLY here rather
// than left to the column default, so the birth of a demo row reads as a
// decision in this module and not as a property of the schema.
function buildInsertPatch(fields) {
  return Object.assign({}, fields, {
    active: true,
    discover_eligible: false,
    discover_eligible_at: null,
    state: 'built',
  });
}

// ── legacy | built -> invited ────────────────────────────────────────────────
// G-1: the window opens at first outbound contact and runs WINDOW_HOURS.
//
// REFUSES A PHONELESS ROW (CE-135 §4(2)). `invited` asserts that a template was
// SENT. A row with `whatsapp_phone` NULL cannot receive one, so stamping it
// `invited` would write a false fact into the analytics spine — the same
// argument that produced `legacy`. The machine is made structurally incapable of
// entering a state that is not true of the row, rather than commented about it.
// Nine of twelve production rows make this refusal reachable today.
//
// WRITES prospects.demo_vendor_ref IN THE SAME ACT (CE-132's synthesis,
// module-side per CE-135 §4(1)). Caller-side would mean every future caller must
// remember; module-side makes it structural, and it is what gives G-1's STOP arm
// a reach beyond the rows that happen to have received a lead alert.
async function onInvited(supabase, demoVendorId, opts) {
  const row = await _read(supabase, demoVendorId);
  if (!row) return _refuse('not_found', demoVendorId);
  if (INVITE_STATES.includes(row.state) === false) {
    return _refuse('illegal_transition', `${row.state} -> invited`);
  }
  if (!row.whatsapp_phone) {
    console.log(`[demoLifecycle:onInvited] REFUSED ${row.ig_handle} — whatsapp_phone is NULL; `
      + 'invited asserts a template was sent and this row cannot receive one');
    return _refuse('no_phone', row.ig_handle);
  }

  const now = _now();
  // NO CLOCK IS OPENED HERE (founder, CE-137 §1: "the 72 hour starts from a
  // vendor getting a query"). `invited` and `opened` rows carry NULL expires_at
  // and can never expire — a demo nobody has enquired on does not die on a
  // timer. The hourly sweep needs no branch for this: a NULL expires_at never
  // satisfies `expires_at < now()`.
  const updated = await _write(supabase, row.id, {
    state: 'invited',
    invited_at: _iso(now),
  });

  // The linkage. Fail-open: a demo IS invited even if the prospect row could not
  // be reached, and the refusal is loud rather than silent.
  //
  // ── F-08.10 · CREATE-OR-PROMOTE (CE-147 §3) ────────────────────────────────
  // THE DEFECT THIS CURES, and it was live in this module's first hour:
  // findOrCreateProspectByPhone defaults `state:'cold'` (prospects.js:74) and
  // runOpenerJob harvests exactly `.eq('state','cold')` (prospects.js:218-220).
  // So inviting a vendor made his handset eligible for an UNRELATED
  // marketing_opener on the next opener tick. The estate already knew the shape:
  // demoLeadAlert.js:67 says in its own words that `templated` "keeps the row out
  // of runOpenerJob's harvest" — the alert path was protected and the invite path
  // was not.
  //
  // TWO LIMBS, because the fixture proved a seed-only cure never fires: the walk
  // row's handset ALREADY carries a prospect (founder SELECT, 2026-08-02), and
  // findOrCreateProspectByPhone returns an existing row untouched. So the create
  // limb seeds `templated`, and the find limb PROMOTES `cold -> templated` and
  // nothing else. `replied`, `in_session` and `converted` are further along and
  // are not walked backwards; `opted_out` is TERMINAL and its only reversal is the
  // founder's START, never ours.
  //
  // `templated` is literally true here: FORK A arm (b) means a template was sent
  // before this function was reached.
  //
  // ⚠ THE DECLARED ASYMMETRY (CE-146 §2, F-08.11). Every other site in the estate
  // writes `{ state:'templated', last_template_at: stamp }` as ONE act
  // (prospects.js:233, api/admin/prospects.js:172, demoLeadAlert.js:325 and :345).
  // THIS SITE WRITES THE STATE AND NOT THE STAMP, on purpose. demoLeadAlert.js:100-105
  // states the column's invariant in its own words — "stamped only after a send
  // THIS MODULE actually made" — and reads it at :117-123 to suppress a demo-lead
  // alert for 48h. The column's meaning is MODULE-SCOPED; only its name is global.
  // A second stamper would silently convert "have we alerted this phone" into "has
  // anyone templated this phone", and the cost is not a bench inconvenience: invite
  // a vendor, a couple enquires three hours later, and the vendor never hears about
  // the lead — the exact conversion moment demo_lead_alert exists for, failing
  // silently in the field. The next hand that reaches for consistency reads this
  // first. F-08.11 is the finding on the NAME; it is not cured here.
  let linked = false;
  try {
    const p = await prospects.findOrCreateProspectByPhone(
      supabase, row.whatsapp_phone, { state: 'templated' },
    );
    const patch = { demo_vendor_ref: row.id };
    if (p.state === 'cold') patch.state = 'templated';
    await prospects.updateProspect(supabase, p.id, patch);
    linked = true;
  } catch (e) {
    console.error(`[demoLifecycle:onInvited] LINKAGE FAILED for ${row.ig_handle}: ${e.message} — `
      + 'the demo is invited but STOP from this handset will not reach it');
  }

  console.log(`[demoLifecycle] ${row.ig_handle} ${row.state} -> invited `
    + `(no clock — set at engaged only; prospect_linked=${linked})`
    + (opts && opts.via ? ` via=${opts.via}` : ''));
  return _done('invited', updated, { prospect_linked: linked });
}

// ── invited -> opened · A PURE ANALYTICS BEACON ──────────────────────────────
// THE FIRST-OPEN EXTENSION IS RETIRED (founder, CE-137 §1: "it retires. can be
// just extended manually"). This transition MUTATES NO CLOCK. It stamps
// `opened_at` and moves `invited -> opened`, and that is all it does.
//
// IDEMPOTENCY BINDS TO `opened_at IS NULL` (CE-137 §2, re-ruled). First open
// stamps; every subsequent open changes no byte. FORK D's original binding —
// `extension_used` plus `now < expires_at` — was keyed to a rule that no longer
// exists and retired with it.
//
// `extension_used` IS THEREFORE A DEAD COLUMN, on production, as of 2026-08-02.
// It is DEAD, not PHANTOM, and the distinction is why it is left standing: a
// phantom is a reference to a thing that does not exist; this is a thing that
// exists and nothing references. Nothing reads it, nothing writes it, and
// `_write` REFUSES it structurally so a later hand cannot resurrect it by
// accident believing it load-bearing. Dropping it is a one-line micro at the
// founder's word, not a reason to mint 0107.
async function onOpened(supabase, handle) {
  const row = await _readByHandle(supabase, handle);
  if (!row) return _refuse('not_found', handle);
  if (row.state !== 'invited' && row.state !== 'opened') {
    return _refuse('illegal_transition', `${row.state} -> opened`);
  }
  if (row.opened_at) {
    // The second and every later hit. Not a refusal — the beacon succeeded; it
    // simply had nothing left to record.
    return _done(row.state, row, { stamped: false, noop: true });
  }

  const updated = await _write(supabase, row.id, {
    state: 'opened',
    opened_at: _iso(_now()),
  });
  console.log(`[demoLifecycle] ${row.ig_handle} invited -> opened (opened_at stamped; no clock touched)`);
  return _done('opened', updated, { stamped: true });
}

// ── invited | opened | engaged -> engaged, clock refreshed ───────────────────
// G-1: an enquiry mid-window refreshes the clock.
//
// REFUSES A `legacy` ROW, and that refusal is REACHABLE TODAY on every one of the
// five rows in the couple feed, because all twelve production rows are `legacy`
// until FORK F's ruled caller first fires. That is not a defect — engaging a row
// that was never invited would stamp `engaged_at` and open a 72h window over a
// contact that never happened. The enquiry itself is unaffected: this seam is
// wired fail-open and the lead still stores and the alert still fires.
async function onEnquiry(supabase, demoVendorId) {
  const row = await _read(supabase, demoVendorId);
  if (!row) return _refuse('not_found', demoVendorId);
  if (CLOCK_STATES.includes(row.state) === false) {
    return _refuse('illegal_transition', `${row.state} -> engaged`);
  }

  const now   = _now();
  const patch = { state: 'engaged', expires_at: _iso(_windowEnd(now)) };
  if (!row.engaged_at) patch.engaged_at = _iso(now);

  const updated = await _write(supabase, row.id, patch);
  console.log(`[demoLifecycle] ${row.ig_handle} ${row.state} -> engaged (clock refreshed to ${updated.expires_at})`);
  return _done('engaged', updated, { refreshed: true });
}

// ── -> claimed ───────────────────────────────────────────────────────────────
// Present and callable; P2 owns the caller. `claimed_vendor_id` is a SOFT
// reference with no FK (the 0056 doctrine) and is set here so that P2 cannot
// become a fifth presence writer.
async function onClaimed(supabase, demoVendorId, claimedVendorId) {
  const row = await _read(supabase, demoVendorId);
  if (!row) return _refuse('not_found', demoVendorId);
  if (CLOCK_STATES.includes(row.state) === false && row.state !== 'expired') {
    return _refuse('illegal_transition', `${row.state} -> claimed`);
  }
  const updated = await _write(supabase, row.id, {
    state: 'claimed',
    claimed_at: _iso(_now()),
    claimed_vendor_id: claimedVendorId || null,
  });
  console.log(`[demoLifecycle] ${row.ig_handle} ${row.state} -> claimed`);
  return _done('claimed', updated);
}

// ── -> removed (takedown; G-2 "honored instantly, always") ───────────────────
// Presence dies in the SAME REQUEST: `active` false AND `discover_eligible`
// false, so the row leaves the couple feed and the demo lane together. Reachable
// from ANY state including `legacy` and including `removed` (a second takedown is
// a no-op, never a refusal — refusing a takedown is the one refusal G-2 forbids).
//
// THIS PATH DELETES NOTHING (CE-134 §3). `demo_leads_demo_vendor_id_fkey` is ON
// DELETE CASCADE and Legacy carries eight leads; removal is a state and two
// flags. Deletion is P6's, under a resurrect window, and no P1 path issues one.
async function onRemoved(supabase, demoVendorId, reason) {
  const row = await _read(supabase, demoVendorId);
  if (!row) return _refuse('not_found', demoVendorId);
  // FLIPS `active` ONLY (CE-136 §3, derived): both feed predicates require
  // `discover_eligible AND active`, and the demo lane's own two selectors read
  // `active` alone — so `active=false` removes the row from BOTH surfaces
  // regardless of eligibility. Leaving `discover_eligible` untouched is what
  // makes removal reversible BY CONSTRUCTION rather than by reconstruction:
  // restore() flips one flag back and the row returns to exactly its prior
  // presence. Touching both would force restore() to guess the second one.
  const updated = await _write(supabase, row.id, {
    state: 'removed',
    removed_at: _iso(_now()),
    active: false,
  });
  console.log(`[demoLifecycle] ${row.ig_handle} ${row.state} -> removed (reason=${reason || 'unstated'})`);
  return _done('removed', updated, { was: row.state });
}

// ── The STOP arm (G-1) ───────────────────────────────────────────────────────
// Phone -> prospect -> demo_vendor_ref -> removed. Its reach is exactly the set
// of demos that have been invited (this module's own linkage) or that have
// already received a lead alert (demoLeadAlert.js:324/:344). A phoneless demo is
// unreachable here and that is correct: it can never be invited either.
async function removeByPhone(supabase, phone) {
  const p = await prospects.findProspectByPhone(supabase, phone);
  if (!p || !p.demo_vendor_ref) return _refuse('no_linked_demo', phone);
  return onRemoved(supabase, p.demo_vendor_ref, 'stop');
}

// ── restore (CE-134 §3 — the walk must not be one-way) ───────────────────────
// Target DERIVED from the ladder stamps this module already kept, never guessed:
// engaged_at -> engaged, opened_at -> opened, invited_at -> invited, and past
// its window -> expired. Where NO ladder stamp exists the row falls to `legacy`,
// which is honest: `legacy` asserts one thing only — that the row never entered
// the invite -> open -> engage ladder — and says nothing about deactivation,
// which is orthogonal and lawful from any state (CE-136 §3, amending CE-133).
//
// LEGACY'S TWO LEGAL EXITS: -> invited (the machine begins) and -> removed
// (deactivation). LEGACY'S ONE ENTRANCE: this function, on a row carrying no
// ladder stamp. It remains unreachable as a default and unreachable for any new
// row. The founder's own smoke card is what decided this: spec §5 ends by
// STOPping a second demo, every candidate for which is stampless today, so a
// refusal here would make his acceptance walk irreversibly destroy a live row.
//
// `removed_at` IS KEPT, NEVER CLEARED — it means "when this row was LAST
// removed". Same idiom as `discover_eligible_at`, with the difference that this
// time the semantics are stated at birth rather than confessed by a migration
// comment three months later (0067_demo_vendor_discover.sql:24-25). It sits in
// no predicate, so keeping it breaks nothing.
async function restore(supabase, demoVendorId) {
  const row = await _read(supabase, demoVendorId);
  if (!row) return _refuse('not_found', demoVendorId);
  if (row.state !== 'removed') return _refuse('illegal_transition', `${row.state} -> restore`);

  let target;
  if (row.engaged_at)      target = 'engaged';
  else if (row.opened_at)  target = 'opened';
  else if (row.invited_at) target = 'invited';
  else                     target = 'legacy';
  if (target !== 'legacy' && row.expires_at && _now() >= new Date(row.expires_at)) target = 'expired';

  // Flips `active` back and NOTHING ELSE — the exact inverse of onRemoved.
  const updated = await _write(supabase, row.id, { state: target, active: true });
  console.log(`[demoLifecycle] ${row.ig_handle} removed -> ${target} `
    + `(restored; derived_from_stamps=${target !== 'legacy'}, removed_at kept)`);
  return _done(target, updated, { derived_from_stamps: target !== 'legacy' });
}

// ── Discover grant / revoke, moved off demoAdmin ─────────────────────────────
// THE C-2 CURE, and it is the by-product FORK E was ruled for: `revoke` now
// CLEARS `discover_eligible_at` instead of leaving it standing. The column's own
// committed comment says the stamp means "last set to true"; leaving it after a
// revoke is what put a stamp on four rows whose eligibility is false.
async function setDiscoverEligible(supabase, demoVendorId, eligible) {
  const row = await _read(supabase, demoVendorId);
  if (!row) return _refuse('not_found', demoVendorId);
  if (row.state === 'removed') return _refuse('illegal_transition', 'removed -> discover_eligible');

  const updated = await _write(supabase, row.id, {
    discover_eligible: Boolean(eligible),
    discover_eligible_at: eligible ? _iso(_now()) : null,
  });
  console.log(`[demoLifecycle] ${row.ig_handle} discover_eligible=${Boolean(eligible)} (stamp ${eligible ? 'set' : 'CLEARED'})`);
  return _done(updated.state, updated);
}

// ── Admin deactivate (the DELETE route's meaning, unchanged in effect) ───────
async function deactivate(supabase, demoVendorId) {
  return onRemoved(supabase, demoVendorId, 'admin');
}

// ── Job 1 · hourly expiry sweep (G-1) ────────────────────────────────────────
// POSITIVE ENUMERATION, ruled binding. Expired rows STAY IN DISCOVER — the feed
// is `discover_eligible AND active` and neither moves here. Only the clock dies.
async function runExpirySweep(supabase, now) {
  const at = now || _now();
  const { data, error } = await supabase
    .from('demo_vendors')
    .update({ state: 'expired' })
    .in('state', CLOCK_STATES)
    .lt('expires_at', _iso(at))
    .select('id, ig_handle');
  if (error) throw error;
  const rows = data || [];
  if (rows.length) {
    console.log(`[cron:demoLifecycle:expiry] expired ${rows.length} demo(s): ${rows.map(r => r.ig_handle).join(', ')}`);
  }
  return { expired: rows.length, handles: rows.map(r => r.ig_handle) };
}

// ── The sunset dial (CE-139) ────────────────────────────────────────────────
// admin_config.demo.sunset_days, JSON-in-text, mirroring prospects.js:44-56 and
// modelRouter's defensive parse. READ PER RUN, NOT CACHED — a nightly job runs
// once a night, so a TTL would buy nothing and would mean a founder turning the
// dial at 9pm watched it not take effect. Stated rather than inherited from
// ranking.js's 60s TTL.
//
// ONE DELIBERATE DEVIATION FROM THE HOUSE IDIOM, and it is the poison arm:
// prospects.js accepts `n >= 0`, which is right for a send cap (0 = send
// nothing, a safe refusal). Here 0 is the opposite of safe — a row reading '0'
// would make every demo instantly older than its horizon and drain the lane on
// the next tick. So this guard demands `n >= 1`. Junk, absent, zero, negative
// and non-finite all fall to the default; nothing here throws.
async function readSunsetDays(supabase) {
  if (!supabase) return DEFAULT_SUNSET_DAYS;
  try {
    const { data } = await supabase
      .from('admin_config').select('value').eq('key', SUNSET_CONFIG_KEY).maybeSingle();
    if (!data || data.value == null) return DEFAULT_SUNSET_DAYS;
    const n = Number(JSON.parse(String(data.value)));   // '90' -> 90
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_SUNSET_DAYS;
  } catch (_e) {
    return DEFAULT_SUNSET_DAYS;
  }
}

// ── Job 2 · nightly sunset (G-2, founder-amended to 90 days at CE-138) ──────
// Quiet rotation OUT OF THE FEED, resurrectable. `discover_eligible` false is
// the feed flag under the additive model; `active` STAYS TRUE and the content is
// retained. The row's state is NOT changed to `removed` — a sunset is not a
// takedown, and conflating them would make the two indistinguishable to P6's
// deletion queue. Only rows still in the feed are touched, so the job is
// idempotent and its count means something.
//
// THE STATE LIST IS THE CLAUSE THAT BITES, NOT THE DATE KEY — and both moved
// together on purpose. This predicate is a CONJUNCTION: `state IN (...)` is
// evaluated before the date clause ever sees a row, so while `legacy` and
// `built` were absent from SUNSET_STATES the COALESCE below was a strict NO-OP.
// Widening the states without the COALESCE would have been equally useless: a
// legacy row's `invited_at` is NULL and would have failed the old date clause.
// Neither half works alone; that is why they shipped in one act (CE-142 §1).
//
// THE SUNSET MARKER (F-08.7, 0107). This job also stamps `sunset_at`, and it is
// the ONLY writer of that column. A swept row used to be byte-identical to a row
// an admin revoked by hand, and to one revoked eight weeks ago — no marker, no
// WHEN — so spec P6's "purged after the 7-day resurrect window" had nothing to
// compute the window FROM. The stamp is a HISTORY stamp in `removed_at`'s family:
// set on a rotation, NEVER cleared when setDiscoverEligible grants the row back,
// because the rotation having been undone does not un-happen it. It is
// deliberately NOT `discover_eligible_at`'s family — see the two-idiom warning at
// the head of this file, which is the whole argument and is not repeated here.
// Idempotent by the same clause that makes the counts mean something: only rows
// still carrying `discover_eligible = true` are touched, so a row cannot be
// re-stamped on the next tick, and a re-granted row's next sunset legitimately
// overwrites the stamp with the later date.
//
// SUNSET FLIPS `discover_eligible` ONLY AND WRITES NO STATE. Two exits, two
// flags, no overlap: removal flips `active` (out of everything), sunset flips
// `discover_eligible` (out of Discover, content retained). The row keeps
// whatever state it held, so `expired` stays `expired` and `legacy` stays
// `legacy`, and P6's deletion queue can still tell a sunset from a takedown.
// The inverse of a sunset is therefore NOT restore() — it is an admin grant
// through setDiscoverEligible(), which returns both the flag and the stamp.
//
async function runSunsetSweep(supabase, now) {
  const at     = now || _now();
  const days   = await readSunsetDays(supabase);
  const cutoff = _iso(new Date(at.getTime() - days * 24 * 3600 * 1000));

  // COALESCE(invited_at, created_at) < cutoff, PARTITIONED ON NULLNESS rather
  // than expressed through PostgREST's `.or()` grammar. Two passes, provably
  // equivalent: every row has invited_at either NULL or not, the two predicates
  // are mutually exclusive and jointly exhaustive, so their union is exactly the
  // COALESCE. `created_at` is demo_vendors col 11, NOT NULL, so pass B's key can
  // never itself be null.
  //
  // WHY NOT `.or()`: the ruling settled the SEMANTICS, not the query string. An
  // `.or('invited_at.lt.X,and(invited_at.is.null,created_at.lt.X)')` would make
  // this job's correctness depend on a filter grammar no bench in this container
  // can execute — the cell would be proving a test double's parser, not the
  // predicate. Two ordinary passes are provable with operators the estate
  // already uses everywhere. Cost: one extra read per night.
  // ONE BENIGN RACE, NAMED SO NOBODY FILES IT LATER AS A DEFECT: two reads mean
  // a row whose `invited_at` is set by onInvited() BETWEEN the passes matches
  // neither — pass A read it as NULL, pass B reads it as set — and is missed for
  // one night. It can never be swept TWICE (the nullness partition forbids it),
  // and it is caught on the next tick. Self-correcting, once a night, harmless.
  const base = () => supabase
    .from('demo_vendors')
    .update({ discover_eligible: false, discover_eligible_at: null, sunset_at: _iso(at) })
    .in('state', SUNSET_STATES)
    .is('claimed_at', null)
    .eq('discover_eligible', true);

  const invited = await base().not('invited_at', 'is', null).lt('invited_at', cutoff)
    .select('id, ig_handle');
  if (invited.error) throw invited.error;

  const neverInvited = await base().is('invited_at', null).lt('created_at', cutoff)
    .select('id, ig_handle');
  if (neverInvited.error) throw neverInvited.error;

  const rows = [].concat(invited.data || [], neverInvited.data || []);
  if (rows.length) {
    console.log(`[cron:demoLifecycle:sunset] horizon ${days}d — rotated ${rows.length} unclaimed demo(s) `
      + `out of Discover (content retained, active untouched, resurrectable by an admin grant): `
      + rows.map(r => r.ig_handle).join(', '));
  }
  return {
    sunset: rows.length,
    handles: rows.map(r => r.ig_handle),
    days,
    by_key: { invited_at: (invited.data || []).length, created_at: (neverInvited.data || []).length },
  };
}

module.exports = {
  WINDOW_HOURS, DEFAULT_SUNSET_DAYS, SUNSET_CONFIG_KEY, readSunsetDays,
  STATES, INVITE_STATES, CLOCK_STATES, SUNSET_STATES, PRESENCE_COLUMNS,
  buildInsertPatch,
  onInvited, onOpened, onEnquiry, onClaimed, onRemoved,
  removeByPhone, restore, setDiscoverEligible, deactivate,
  runExpirySweep, runSunsetSweep,
};
