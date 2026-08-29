// src/api/admin/demoAdmin.js
// Admin endpoints for managing demo vendor profiles.
// Protected by requireAdmin (bearer or cookie) — F-07.86, the private guard died.
//
//   GET    /api/v2/admin/demo/vendors         — list all demo vendors
//   POST   /api/v2/admin/demo/vendors         — create demo vendor
//   DELETE /api/v2/admin/demo/vendors/:id     — deactivate demo vendor
//   GET    /api/v2/admin/demo/leads           — list all demo leads
//   POST   /api/v2/admin/demo/leads           — seed a mock lead
//   POST   /api/v2/admin/demo/cloudinary-sign — sign a Cloudinary upload
//   POST   /api/v2/admin/demo/bulk            — sheet-shaped bulk build (P4)
//   POST   /api/v2/admin/demo/invite-batch    — bulk invite, per-run bounded (P4)
//
// This list is PARTIAL and always has been; it is a reading aid, not a census.
// Said out loud so the next hand does not mistake it for one — the census is the
// router table itself.

'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');

// ── F-07.86 · THE PRIVATE GUARD DIES (CE ruling F-6(b)) ──────────────────────
// THIS FILE CARRIED ITS OWN `requireAdminPassword` — a header-only guard with
// no cookie limb, reading `x-admin-password` and comparing it against
// ADMIN_PASSWORD. Two authorities guarding one panel was the disease's second
// face: a fold that cured `requireAdmin` alone would have left every route in
// this file dark, or worse, still admitting a raw credential over the wire after
// the credential had left every other client.
//
// F-08.38 (P4, corrected ON CONTACT): both sentences said "these ten routes"
// against a file that held twelve, and P4 makes it fourteen. A count that must be
// maintained by hand is the same species as a line number that must be. The
// PATH-OVER-RANGE LAW's cure applies to cardinals too — name the set, not its size.
//
// It now imports the ONE guard. Its routes ride the same bearer and cookie
// limbs as every other /api/v2/admin/* route, and the `x-admin-password` header
// is dead estate-wide.
//
// F-07.77's fail-closed behaviour is NOT lost in the swap — it moved home.
// requireAdmin refuses every session when ADMIN_SESSION_SECRET is absent, and
// says so on a named log line, exactly as this file's own guard did for
// ADMIN_PASSWORD. The refusal STATUS changes from 401 to 401/403 depending on
// which limb was attempted; that is disclosed rather than papered, because a
// caller reading for 401 specifically will now see 403 on a bad token.
const requireAdminPassword = require('./requireAdmin');

// ── TDW_08 P1 · FORK E (ENFORCE) ─────────────────────────────────────────────
// The four presence WRITERS in this file moved behind demoLifecycle. They are
// the create (:61), the deactivate (:76), and the discover grant/revoke
// (:115/:130) as they stood at 3d47041. The five demo_vendors READERS in this
// file are deliberately UNCHANGED — FORK A(b) keeps presence on the booleans and
// this sitting was chartered to move writers, not predicates.
const demoLifecycle = require('../../lib/demoLifecycle');

// ── TDW_08 SITTING A · THE INVITE CALLER'S TWO DEPENDENCIES ─────────────────
// sendWa is the SINGLE outbound gate (spec §3). The route never touches a
// transport directly, so the cross-line STOP gate and the isApproved gate bind
// this send exactly as they bind every other one.
//
// claimLinkFor is IMPORTED, never re-derived. The founder gave that URL shape
// verbatim on 2026-07-31 and demoLeadAlert.js:49-55 is where it lives; this file
// already carries a SECOND, DIFFERENT demo URL shape at the create route
// (`demo.thedreamwedding.in/vendor/...`, :76) which has no such provenance.
// Writing the literal here would have made three shapes in one estate.
const { sendWa } = require('../../lib/sendWa');
const { claimLinkFor } = require('../../lib/discover/demoLeadAlert');
// F-19.49 (CE-39 step 2a): the one cross-table address guard.
const { handleIsFree } = require('../../lib/vendor/routingHandle');

// ── TDW_08 P4 · FORK B(a) — THE PHOTO PLANE COMES TO PARITY, BY IMPORT ───────
// The demo plane held THREE numbers where the spec has two, and none of them
// matched the real plane: this file rejected below THREE, the pwa mirrored that
// in copy, and the pwa hid "+ Add Photo" above TEN. There was NO server-side
// ceiling at all — this route accepted five hundred photos.
//
// THE CURE IS THE IMPORT, NEVER THE DIGIT. Re-typing 6 and 20 here is exactly
// how 3 and 10 got here: a second author writing a number a first author already
// owned. `MIN_PORTFOLIO_IMAGES` lives at src/lib/vendor/discover.js and
// `MAX_PORTFOLIO_IMAGES` at src/lib/vendor/portfolio.js, and those two files
// ENFORCE the numbers for real vendors. One home, now four readers.
//
// [F-06.85: the two founder-approved strings below are conditioned on a
//  MECHANICAL fact — that these constants are the enforcing ones, not copies.
//  Mechanism: `MIN_PORTFOLIO_IMAGES` gates requestDiscover in discover.js and
//  `MAX_PORTFOLIO_IMAGES` gates canAcceptMore in portfolio.js. If either number
//  is ever read from somewhere that does not enforce it, the strings below
//  promise a floor nobody holds and must be re-read.]
const { MIN_PORTFOLIO_IMAGES } = require('../../lib/vendor/discover');
const { MAX_PORTFOLIO_IMAGES } = require('../../lib/vendor/portfolio');

// ── TDW_08 P4 · FORK C(a) — THE DEMO INVITE BATCH MAX, ITS OWN HOME ─────────
// Demo invites do NOT share `marketing.daily_template_cap`. Two populations:
// cold prospects on a scheduled sweep versus warm demo rows fired by hand or in
// bulk, and sharing would let one bulk run silently eat the other's budget.
//
// THE NAMING RIDER IS ABSOLUTE (CE ruling, F-08.37): this is a PER-RUN BATCH
// SIZE and it is not called a daily cap in any identifier, comment or label,
// because it does not count a day. `readDailyCap`'s own number does not either —
// runOpenerJob applies it as `.limit()` with no date predicate, so two runs in
// one day send fifty. A real daily meter is a separate act.
const { DEMO_INVITE_BATCH_MAX, readDemoInviteBatchMax } = require('../../lib/demoInviteBatch');

// ── TDW_08 P4 · FORK D(c) — the phone normalizer, for the shared-handset gate.
// F-07.47: the estate has ONE. A second normalization here would let the gate
// miss a collision the prospect lane can see.
const { normalizeTo } = require('../../lib/metaCloud');

// ── F-08.44 · THE TYPED-MONEY DOOR ───────────────────────────────────────────
// `rate_display` and `about` are free text with no gate anywhere, and both are
// handed to a model as grounded context (src/api/demo/vendor.js, symbols
// carrying `context_text` and `dynamicContext`). CE-ruled 4-C: REJECTION AT THE
// DOOR, both columns, nothing silently rewritten.
//
// THE DOOR IS THE WHOLE GATE, and that is derived rather than assumed. The two
// inserts in this file are the ONLY writers of either column on `demo_vendors`
// in the estate; every other writer goes through src/lib/demoLifecycle.js,
// symbol _write, which THROWS BY NAME on any column outside PRESENCE_COLUMNS
// that does not end `_at`. Neither column can reach the table by that route.
//
// The gate's own home carries the F-08.47 asymmetry ruling: it is wired HERE
// and nowhere else, by founder word 「 demo plane only 」.
const {
  checkRateDisplay, checkAbout,
  RATE_REGISTER_KEY, RATE_REGISTER_MESSAGE,
  ABOUT_REGISTER_KEY, ABOUT_REGISTER_MESSAGE,
} = require('../../lib/moneyRegisterGate');

// ── THE GATE, ONE HOME, TWO CALLERS (single create and bulk) ─────────────────
// Returns null when both columns are lawful, or `{ error, detail }` naming the
// first offending column. ABSENCE PASSES — the gate refuses malformed money and
// never requires money.
function _registerGate(rate, about) {
  if (checkRateDisplay(rate).ok === false) {
    return { error: RATE_REGISTER_KEY, detail: RATE_REGISTER_MESSAGE };
  }
  if (checkAbout(about).ok === false) {
    return { error: ABOUT_REGISTER_KEY, detail: ABOUT_REGISTER_MESSAGE };
  }
  return null;
}

// ── TDW_08 P4 · THE PHOTO GATE, ONE HOME FOR TWO ROUTES ─────────────────────
// The create route and the bulk route enforce the SAME two numbers with the SAME
// two founder-frozen strings. Writing the gate twice is how the demo plane came
// to hold three numbers in the first place; the bulk route is the second author
// this file has ever had over this rule, and it gets a function, not a copy.
//
// Both strings are FOUNDER-APPROVED VERBATIM (2026-08-03, 「 approve 」) and are
// near-mirrors of the real plane's own, so a demo builder and a real vendor are
// refused in the same words:
//   src/lib/vendor/discover.js  — `Need at least ${MIN} portfolio images. You have ${n}.`
//   src/lib/vendor/portfolio.js — `Your portfolio holds ${MAX} photos, the maximum. ...`
// C4 says "demo" where the real one says "portfolio" — the one deliberate word of
// difference, approved as put, because on that screen the founder is building a
// demo and not editing a portfolio.
function _photoGate(photos) {
  const n = Array.isArray(photos) ? photos.length : 0;
  if (n < MIN_PORTFOLIO_IMAGES) {
    return { ok: false, error: `Need at least ${MIN_PORTFOLIO_IMAGES} portfolio images. You have ${n}.` };
  }
  if (n > MAX_PORTFOLIO_IMAGES) {
    return { ok: false, error: `Your demo holds ${MAX_PORTFOLIO_IMAGES} photos, the maximum. Remove one to add another.` };
  }
  return { ok: true };
}

// GET /admin/demo/vendors
router.get('/vendors', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data || [];

    // ── TDW_08 P4 · FORK D(c) — THE SHARED-HANDSET FACTS, DERIVED HERE ───────
    // F-08.17: `prospects` holds one row per phone and `demo_vendor_ref` is
    // single-valued, so a second demo row on the same handset OVERWRITES the
    // first's linkage and STOP then reaches only the survivor. The route refuses
    // that send (see the invite caller below), and the BOARD shows the cause so
    // the founder meets it on the card rather than at the button.
    //
    // TWO DIFFERENT FACTS, deliberately not merged:
    //   shared_handset      — another DEMO ROW carries this phone. Derived from
    //                         the rows already in hand: zero extra queries.
    //   linkage_held_by     — the ig_handle the phone's PROSPECT currently points
    //                         at, when that is some OTHER row. This is the one
    //                         that explains a refusal, and it is the ruling's
    //                         "derived from prospects".
    // A row can be shared-but-unlinked (no prospect yet, nothing to overwrite) or
    // linked-elsewhere; collapsing them into one badge would tell the founder a
    // send will refuse when it will succeed.
    const phoneCount = new Map();
    for (const r of rows) {
      const p = normalizeTo(r.whatsapp_phone || '');
      if (p) phoneCount.set(p, (phoneCount.get(p) || 0) + 1);
    }

    let linkByPhone = new Map();
    try {
      const { data: links } = await supabase
        .from('prospects').select('phone, demo_vendor_ref').not('demo_vendor_ref', 'is', null);
      const byId = new Map(rows.map(r => [r.id, r.ig_handle]));
      for (const l of (links || [])) {
        const p = normalizeTo(l.phone || '');
        if (p) linkByPhone.set(p, byId.get(l.demo_vendor_ref) || null);
      }
    } catch (_e) {
      // A prospects read that fails must not take the board down with it. The
      // badge goes dark and the ROUTE still refuses — the gate is the invite
      // caller's, never the board's. DISCLOSED rather than papered: an operator
      // seeing no badge on a degraded read is seeing less, not seeing a lie.
      linkByPhone = new Map();
    }

    const vendors = rows.map((r) => {
      const p = normalizeTo(r.whatsapp_phone || '');
      const heldBy = p ? (linkByPhone.get(p) || null) : null;
      return {
        ...r,
        shared_handset: p ? (phoneCount.get(p) || 0) > 1 : false,
        linkage_held_by: heldBy && heldBy !== r.ig_handle ? heldBy : null,
        // ── F-08.40 (CE-ruled (a)) — THE HANDSET KEY RIDES THE WIRE ──────────
        // The board's batch label must count DISTINCT HANDSETS, not rows: two
        // rows on one phone send ONE template, because the per-row guard refuses
        // the second. Counting rows made the label promise a number it would not
        // send.
        //
        // THE KEY IS SENT RATHER THAN COMPUTED CLIENT-SIDE, and that is the
        // whole point. Grouping by phone means normalizing by phone, and the
        // estate has ONE normalizer (F-07.47). A second one in a React component
        // would drift from this one the first time either moved, and the drift
        // would be invisible — a label quietly counting a different set from the
        // set the route refuses. Same shape as `min_portfolio_images` and
        // `states` above: the surface renders the server's answer and holds no
        // opinion it could contradict with.
        handset_key: p || null,
      };
    });

    return res.json({
      ok: true,
      vendors,
      // ── THE BOARD'S COLUMNS RIDE THE WIRE, NOT THE COMPONENT ──────────────
      // demoLifecycle.STATES is the FROZEN authority and the pwa lives in a
      // different repository, so a cross-repo import is impossible. The estate
      // already ruled this exact shape for the photo floor (TDW_07 P3, CAP SITE
      // 4): the surface renders the SERVER's list so the eight states never
      // exist twice. Re-enumerating them in the component would make the board a
      // second authority on the state machine — the drift demoLifecycle was
      // built to end.
      states: demoLifecycle.STATES,
      // ── F-08.45 / FORK 3(c) — THE INVITE SUBSET RIDES TOO ─────────────────
      // `states` has ridden since P4 for the reason stated directly above, and
      // `INVITE_STATES` is the one member of that family that did not — so the
      // board hand-wrote `state === 'built' || state === 'legacy'` TWICE, at
      // its bulk filter and at its per-card button, and the two drifted. That
      // is precisely the second-authority drift `_inviteOne`'s own header
      // names ("One authority (demoLifecycle.INVITE_STATES), two readers"),
      // which could not be honoured while the constant stayed in this repo.
      // Now it can: the console renders the SERVER's subset and holds no
      // opinion it could contradict. Same shape as `states`, `handset_key` and
      // `min_portfolio_images` — one authority, two readers.
      invite_states: demoLifecycle.INVITE_STATES,
      // ── THE FLOOR RIDES THE WIRE. THE CEILING DELIBERATELY DOES NOT ───────
      // The client renders the floor (the builder must be told what it needs
      // BEFORE it submits) and holds NO opinion about the ceiling — it is not
      // sent, so the surface cannot render it, cannot gate on it, and cannot
      // drift from it. The ceiling is enforced server-side and announced in the
      // refusal, which is exactly what app/vendor/portfolio/page.tsx does: "this
      // screen holds no opinion about the cap".
      min_portfolio_images: MIN_PORTFOLIO_IMAGES,
    });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors
router.post('/vendors', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { ig_handle, display_name, category, city, whatsapp_phone, about, rate_display, photos } = req.body || {};
  if (!ig_handle || !display_name || !category || !city) {
    return res.status(400).json({ ok: false, error: 'ig_handle, display_name, category, city are required.' });
  }
  // ROW-INTRINSIC CHECKS BEFORE EVERYTHING ELSE (CE-ruled siting). A bad rate is
  // a fact about this row's own bytes; judge the row before doing photo work.
  // NAMED WITNESS GAP: this refusal is unreachable by hand on THIS path. The
  // console pre-checks the photo floor client-side (app/admin/demo/page.tsx,
  // symbol handleCreate) and never POSTs without six images, so the founder
  // cannot meet this line here without staging a portfolio first. It is proven
  // by cell (scripts/b08_console_bench.js §2) and walked on the BULK path,
  // which has no such pre-check. Declared rather than discovered — and NOT
  // cured by putting the predicate in the console, which would make the surface
  // a second authority on a rule this route owns.
  const reg = _registerGate(rate_display, about);
  if (reg) return res.status(400).json({ ok: false, error: reg.error, detail: reg.detail });

  const gate = _photoGate(photos);
  if (gate.ok === false) return res.status(400).json({ ok: false, error: gate.error });
  // F-19.49 · ONE ADDRESS SPACE. A demo may not take a real vendor's address:
  // the one guard (src/lib/vendor/routingHandle.js) refuses a `vendors.routing_handle`
  // match case-folded. The real vendor wins, in both directions.
  if (!(await handleIsFree(supabase, ig_handle))) {
    return res.status(409).json({ ok: false, error: 'handle_taken', detail: ig_handle.toLowerCase().trim() });
  }
  try {
    const { data, error } = await supabase
      .from('demo_vendors')
      // demoLifecycle.buildInsertPatch supplies ALL FOUR presence fields
      // (active, discover_eligible, discover_eligible_at, state:'built') so this
      // route never authors presence itself.
      .insert(demoLifecycle.buildInsertPatch({ ig_handle: ig_handle.toLowerCase().trim(), display_name: display_name.trim(), category, city, whatsapp_phone: whatsapp_phone || null, about: about || null, rate_display: rate_display || null, photos, created_by: 'admin' }))
      .select().single();
    if (error) throw error;
    return res.json({ ok: true, vendor: data, demo_url: `https://demo.thedreamwedding.in/vendor/${data.ig_handle}` });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ ok: false, error: 'A demo vendor with this IG handle already exists.' });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /admin/demo/bulk — THE BULK BUILD (TDW_08 P4 · FORK A(c), CE-ruled)
//
// SHEET-SHAPED, mirroring the prospect lane's own bulk (api/admin/prospects.js):
// { demos: [ {ig_handle, display_name, category, city, whatsapp_phone, about,
//             rate_display, photos}, ... ] }
// → { insertedCount, skippedCount, failedCount, inserted, skipped, failed }
// Duplicates by ig_handle are SKIPPED, not errored, so a re-run is idempotent —
// the founder re-uploads a corrected sheet without hand-pruning the rows that
// already landed.
//
// THE MOUNT IS SINGULAR. The spec names `POST /api/v2/admin/demos/bulk`; the
// router mounts this file at `/admin/demo` (src/api/router.js). The spec was
// written against a namespace that never landed — same miss as its
// `app/admin/demos/page.tsx`. The route lives under the path that exists.
//
// ── ⚠ THE IG PIPELINE FETCH IS NOT BUILT, AND IT IS NOT STRUCK ─────────────
// Spec §P4: "IG handle in → pipeline fetch (the n8n/RapidAPI contract; manual
// photo-URL paste fallback)". `grep -rl "rapidapi\|n8n" src/` returns exactly ONE
// file — api/admin/prospects.js — and its only hit is a comment describing the
// SHEET flow. There is no demo ingestion contract in either repository: no
// provider, no credential, no client, no env.
//
// CE ruling FORK A(c): the fetch is neither built nor struck. It is MINTED with
// its missing contract enumerated, so a struck clause never quietly becomes a
// decision nobody made. WHAT AN IG FETCH WOULD NEED BEFORE ANYONE BUILDS IT:
//   1. PROVIDER      — which API, and whether it is Meta's Graph (requires the
//                      handle's owner to have authorised us) or a scraper
//                      reseller (does not, and that is the problem).
//   2. CREDENTIAL    — a key, its home in the env, its rotation, and which of the
//                      three Railway services holds it.
//   3. RATE LIMIT    — the per-hour ceiling and what the bulk route does when it
//                      is hit mid-batch, which is a partial-completion question
//                      this route currently never has to answer.
//   4. IG ToS POSTURE — pulling a stranger's photos onto a page that markets to
//                      them is a legal and reputational act, not a technical one.
//                      The founder rules that, not an executor.
// UNNUMBERED AT THIS DELIVERY — the CE ruling minted it without assigning a
// finding number, and an executor does not mint numbers. Named in the handover
// for the chair to number.
//
// ── ⚠ §0.2 REPORT — "ALSO CREATE PROSPECTS" IS NOT BUILT, AND HERE IS WHY ──
// Spec §P4: 'one upload can feed both, checkbox "also create prospects"'. There
// is NO TRUTHFUL STATE to create those rows in, and this is a finding rather
// than a gap:
//   · `cold` walks straight into F-08.10, which was MINTED AND CURED three
//     sittings ago: onInvited seeded `cold` and put demo vendors directly into
//     runOpenerJob's harvest, so a vendor with a demo built for him received
//     cold-outreach openers. Building the same seed here re-opens the cured
//     finding through a different door.
//   · `templated` is what onInvited uses (demoLifecycle.js) and it is literally
//     true THERE — a template was sent immediately before. At BUILD time nothing
//     has been sent, so the state would assert a send that did not happen, and
//     `last_template_at`'s module-scoped meaning (F-08.11) would start lying to
//     demoLeadAlert's 48h suppression.
// REPORTED, NOT WORKED AROUND. A prospect state that means "known to us, never
// contacted, not harvestable" does not exist and minting one is a lane decision,
// not a route's.
router.post('/bulk', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const rows = Array.isArray(req.body && req.body.demos) ? req.body.demos : null;
  if (!rows) return res.status(400).json({ ok: false, error: 'body.demos must be an array.' });

  // ── THE INTRA-BATCH PHONE PRE-SCAN (FORK D(c)) ───────────────────────────
  // F-08.17's hazard is two demo rows on one handset. Cross-batch that condition
  // ALREADY EXISTS in production and refusing it here would forbid what the
  // estate already contains — so this scan is deliberately INTRA-BATCH only, and
  // the cross-batch case is surfaced on the board (`shared_handset`) and refused
  // at the invite, never at the build.
  //
  // EVERY MEMBER OF A COLLIDING GROUP IS REFUSED, not all-but-the-first. Picking
  // a winner would be this route deciding which of the founder's two rows is the
  // real one, which nobody ruled and which he cannot see happening.
  const phoneSeen = new Map();
  for (const raw of rows) {
    const p = normalizeTo(String((raw && raw.whatsapp_phone) || '').trim());
    if (p) phoneSeen.set(p, (phoneSeen.get(p) || 0) + 1);
  }

  const inserted = [], skipped = [], failed = [];
  for (const raw of rows) {
    const r = raw || {};
    const ig_handle    = String(r.ig_handle || '').toLowerCase().trim();
    const display_name = String(r.display_name || '').trim();
    const category     = String(r.category || '').trim();
    const city         = String(r.city || '').trim();
    const rawPhone     = String(r.whatsapp_phone || '').trim();

    if (!ig_handle || !display_name || !category || !city) {
      failed.push({ input: raw, error: 'ig_handle, display_name, category, city are required.' });
      continue;
    }

    // ── ROW-INTRINSIC BEFORE CROSS-ROW (CE-ruled siting) ────────────────────
    // A bad rate is a fact about this row's own bytes and is fixable by editing
    // that row. A handset collision is a fact about the BATCH. Judge the row,
    // then the batch — so the operator is told what is wrong with the line he
    // can actually edit before he is told about a neighbour.
    //
    // DISCLOSED BEHAVIOUR DELTA: a row failing BOTH this gate and a later one
    // (the intra-batch handset scan, or the photo floor) now reports the
    // register reason where it previously reported the other. The row is
    // refused either way; only the named reason moves.
    //
    // THIS IS THE WALKABLE PATH FOR BOTH REFUSALS. `handleBulk` performs no
    // photo pre-check, so a four-column paste with a malformed rate and zero
    // photo URLs reaches this line and the refusal renders on screen. Zero
    // rows written, zero templates spent.
    const reg = _registerGate(r.rate_display, r.about);
    if (reg) { failed.push({ ig_handle, error: reg.error, detail: reg.detail }); continue; }

    const norm = rawPhone ? normalizeTo(rawPhone) : '';
    if (norm && (phoneSeen.get(norm) || 0) > 1) {
      failed.push({ ig_handle, error: 'shared_handset_in_batch', detail: norm });
      continue;
    }

    // MANUAL PASTE, the only ingestion path this sitting has. Accepts either the
    // console's object shape or a bare list of URLs, because a sheet column holds
    // strings. The hero defaults to the first when none is flagged — the same
    // rule the single-create console applies client-side.
    const photos = (Array.isArray(r.photos) ? r.photos : [])
      .map((p) => (typeof p === 'string' ? { url: p } : (p || {})))
      .filter((p) => p && typeof p.url === 'string' && p.url.trim())
      .map((p, i, all) => ({
        url: p.url.trim(),
        is_hero: all.some((q) => q.is_hero) ? p.is_hero === true : i === 0,
        cloudinary_id: p.cloudinary_id || null,
      }));

    // THE SAME GATE THE CONSOLE FIRES. One home, two callers.
    const gate = _photoGate(photos);
    if (gate.ok === false) { failed.push({ ig_handle, error: gate.error }); continue; }

    // F-19.49: same guard as the console create — a real vendor's address is
    // refused here too (an existing demo with this handle is the 23505 skip below).
    if (!(await handleIsFree(supabase, ig_handle))) { failed.push({ ig_handle, error: 'handle_taken' }); continue; }

    try {
      const { data, error } = await supabase
        .from('demo_vendors')
        // buildInsertPatch supplies ALL FOUR presence fields, exactly as the
        // single create does. This route never authors presence itself.
        .insert(demoLifecycle.buildInsertPatch({
          ig_handle, display_name, category, city,
          whatsapp_phone: rawPhone || null,
          about: r.about ? String(r.about).trim() : null,
          rate_display: r.rate_display ? String(r.rate_display).trim() : null,
          photos, created_by: 'admin_bulk',
        }))
        .select('id, ig_handle').single();
      if (error) {
        if (error.code === '23505') skipped.push(ig_handle);
        else failed.push({ ig_handle, error: error.message });
      } else {
        inserted.push(data);
      }
    } catch (e) {
      failed.push({ ig_handle, error: (e && e.message) || 'insert threw' });
    }
  }

  return res.json({
    ok: true,
    insertedCount: inserted.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    inserted, skipped, failed,
  });
});

// DELETE /admin/demo/vendors/:id
router.delete('/vendors/:id', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    // Was `.update({ active: false })` — presence written in the route. The
    // module now owns it. The EFFECT is unchanged: removal flips `active` only
    // (CE-136 §3), because `active=false` already hides the row from both the
    // couple feed (`discover_eligible AND active`) and the demo lane (`active`
    // alone), and leaving `discover_eligible` untouched is what lets restore()
    // return the row to its prior presence without guessing.
    const r = await demoLifecycle.deactivate(supabase, req.params.id);
    if (r.ok === false && r.reason === 'not_found') return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors/:id/activate — THE DEACTIVATE BUTTON'S INVERSE
//
// WHY IT EXISTS (CE-153 §4). The DELETE route above calls deactivate -> onRemoved
// and had NO inverse, so a demo taken down from the console was dead by a SECOND
// road that the STOP/START arm does not reach: START restores through the
// prospect linkage, and a console removal never touched a prospect. The founder's
// own button had a dead end.
//
// TWO CALLERS, ONE AUTHORITY. This route and restoreByPhone both call restore()
// and neither re-derives its target. restore() reads the ladder stamps the
// lifecycle already kept — engaged_at -> engaged, opened_at -> opened, invited_at
// -> invited, past its window -> expired, and `legacy` only where no stamp exists
// — so the row returns to exactly its prior presence rather than to a guess. That
// derivation living in one place is the whole reason this lane has a module.
//
// THIS ROUTE CARRIES restore()'s FIRST LIVE EXECUTION (CE-153 §5). The function
// has been written, exported and benched since P1 and has never run against
// production: the walk's final state was written by the founder's hand because
// this route did not exist. It is the easier of the two callers to witness — a
// press, no handset, no STOP prerequisite — so it walks first.
router.post('/vendors/:id/activate', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const r = await demoLifecycle.restore(supabase, req.params.id);
    if (r.ok === false && r.reason === 'not_found') {
      return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    }
    // `illegal_transition` here means the row is not `removed` — already live.
    // 409 matches the grant/revoke siblings' refusal status, and the detail names
    // the state so the console can say which, rather than only that.
    if (r.ok === false) {
      return res.status(409).json({ ok: false, error: r.reason, detail: r.detail });
    }
    return res.json({
      ok: true,
      vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible },
      state: r.state,
      derived_from_stamps: r.derived_from_stamps === true,
    });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// GET /admin/demo/leads
router.get('/leads', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_leads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, leads: data || [] });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/leads — seed a mock lead
router.post('/leads', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { demo_vendor_id, demo_vendor_handle, bride_name, bride_phone, bride_wedding_city, bride_wedding_date, state, raw_message, otp_verified } = req.body || {};
  if (!demo_vendor_id || !demo_vendor_handle || !bride_name || !bride_phone) {
    return res.status(400).json({ ok: false, error: 'demo_vendor_id, demo_vendor_handle, bride_name, bride_phone required.' });
  }
  try {
    const { data, error } = await supabase
      .from('demo_leads')
      .insert({ demo_vendor_id, demo_vendor_handle, bride_name, bride_phone, bride_wedding_city: bride_wedding_city || null, bride_wedding_date: bride_wedding_date || null, state: state || 'new', raw_message: raw_message || null, otp_verified: otp_verified || false, notified_vendor: false, admin_notified: false })
      .select().single();
    if (error) throw error;
    return res.json({ ok: true, lead: data });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors/:id/discover-grant
router.post('/vendors/:id/discover-grant', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('id').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    const r = await demoLifecycle.setDiscoverEligible(supabase, req.params.id, true);
    if (r.ok === false) return res.status(409).json({ ok: false, error: r.reason });
    return res.json({ ok: true, vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible } });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/vendors/:id/discover-revoke
router.post('/vendors/:id/discover-revoke', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_vendors').select('id').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Demo vendor not found.' });
    // THE C-2 CURE lands here: the module CLEARS discover_eligible_at on revoke.
    const r = await demoLifecycle.setDiscoverEligible(supabase, req.params.id, false);
    if (r.ok === false) return res.status(409).json({ ok: false, error: r.reason });
    return res.json({ ok: true, vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible } });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /admin/demo/vendors/:id/invite — THE INVITE CALLER (TDW_08 Sitting A)
//
// WHY THIS ROUTE EXISTS. demoLifecycle.onInvited has been complete, correct and
// UNREACHABLE since it shipped: nothing in the estate called it, so every
// production row stayed `legacy`, onEnquiry refused every real enquiry, and the
// lifecycle logged a no-op on a machine that could not be entered. This is the
// door. Founder ruling: 「 I fire invites through admin console 」.
//
// THE ORDER IS LOAD-BEARING — PRE-CHECK, then SEND, then STATE (CE-146 §5).
//   · pre-check BEFORE the send, because a template is a real message to a real
//     handset and spending one on a row the module will then refuse is not a
//     recoverable mistake.
//   · state AFTER the send, because `invited` ASSERTS that a template was sent.
//     That is CE-135 §4(2)'s principle — the same argument that makes onInvited
//     refuse a phoneless row — applied one layer out. A refused or failed send
//     must leave the row exactly as it was.
//
// THE PRE-CHECK READS THE MODULE'S OWN FROZEN LIST, never a literal. Duplicating
// `['legacy','built']` here would make this file a second authority on a
// transition rule, which is precisely the drift demoLifecycle was built to end.
// One authority (demoLifecycle.INVITE_STATES), two readers.
//
// THIS SEND IS tdw_demo_invite's FIRST EVER. Approved 2026-07-19 and never
// called by any code path until this route — the template was approved, paid
// for and unreachable, exactly as tdw_morning_nudge_vendor was before F4.
//
// ⚠ TWO THINGS THIS ROUTE DOES NOT DO, declared rather than discovered:
//   · IT DOES NOT CONSULT THE MARKETING CAP (F-08.12). readDailyCap's only
//     consumers are `runOpenerJob` (src/lib/prospects.js) and the admin cap route
//     (src/api/admin/prospects.js) — that number governs the cold-prospect BATCH
//     SWEEP and nothing else. Spec §3's "25/day governance owns invite volume"
//     describes a volume control that did not exist for hand-fired sends.
//     [F-08.38, corrected ON CONTACT: this block cited `prospects.js:213` for
//      runOpenerJob's cap read. The function is declared at :247 and reads the cap
//      at :250; the cite was stale by a P1 line shift and pointed at nothing. Now
//      PATH PLUS SYMBOL, no line number — the form that cannot rot.]
//
//     P4 ANSWERS THIS, and it answers it in the shape the CE ruled (FORK C(a)):
//     demo invites hold their OWN key in their OWN home
//     (src/lib/demoInviteBatch.js) and never share the marketing lane's number.
//     THE HAND-FIRED ROUTE REMAINS UNBOUNDED BY DESIGN — pressing it eleven times
//     still sends eleven templates, because a per-run bound over a batch of one is
//     not a governance, it is a speed bump on a button the founder is looking at.
//     Volume arises in the BULK route and that is where the bound lives.
//
//     [F-06.85: the sentence above is conditioned on a MECHANICAL fact — that
//      `demoInviteBatch`'s number bounds ONE request and counts no day. Mechanism:
//      `POST /invite-batch` compares `ids.length` against `readDemoInviteBatchMax`
//      and refuses; nothing anywhere reads a send ledger. If a daily meter is ever
//      built, this paragraph is false and must be re-read. F-08.37.]
//   · IT DOES NOT DECLARE nudgeClass, so WaNudgeOptedOutError can never fire here
//     (sendWa.js:209 gates that limb on the caller's own declaration). An invite
//     is not a nudge. The FULL cross-line opt-out still binds and is handled.
//
// ⚠ F-08.17 — TWO PRODUCTION DEMO ROWS SHARE ONE HANDSET (founder SELECT,
// 2026-08-02). `prospects` holds one row per phone and `demo_vendor_ref` is
// single-valued, so inviting the second of a shared-phone pair OVERWRITES the
// first's linkage and STOP from that handset then reaches only the second. Filed,
// not cured — the fix is a linkage table and it is not this sitting's. Until it
// is, this route must not be fired on both rows of a shared-phone pair.
// ── TDW_08 P4 · THE INVITE BODY MOVES INTO ONE HOME ─────────────────────────
// P4 adds a BULK invite. The single route and the bulk route must fire the SAME
// pre-check, the SAME send, and the SAME state write in the SAME order, because
// the order is the correctness (CE-146 §5) — a second implementation would be a
// second opinion about when a template may be spent. So the body moves here and
// both routes call it. It returns `{ status, body }` rather than touching `res`,
// which is what lets the bulk caller collect outcomes instead of answering.
async function _inviteOne(supabase, id) {
  // ── 1 · PRE-CHECK. Mirrors the grant/revoke sibling shape, widened from an
  //        existence probe to the facts that decide whether a template may be spent.
  const { data: row, error } = await supabase
    .from('demo_vendors')
    .select('id, ig_handle, display_name, whatsapp_phone, state, active, invite_sent_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { status: 404, body: { ok: false, error: 'Demo vendor not found.' } };
  // ── 1-0 · THE SPENT REFUSAL (TDW_08 P5 · Phase 1 · FORK C(i)) ─────────────
  // FIRST, and ahead of the state check, because it is the only pre-check that
  // can be TRUE OF A ROW THE STATE MACHINE STILL CALLS ELIGIBLE. That is the
  // whole defect: send succeeds, the transition fails, the row stays `built`,
  // `INVITE_STATES` admits it, and nothing records the spend — so the founder
  // sends the same vendor a second real template. The state check cannot catch
  // that row; only this one can.
  //
  // THE ORDER IS THE CORRECTNESS (CE-146 §5's sentence, extended one rung).
  // ROW-INTRINSIC BEFORE CROSS-ROW (CE-183's siting principle): this reads a
  // column already in hand from the pre-check SELECT — zero queries, no network,
  // no second opinion — so it is the cheapest true fact available and it sits
  // above the reads that need the wire.
  //
  // A ROW REFUSED HERE IS A RECOVERY CASE, NOT A BUG REPORT. `invite_sent_at`
  // set beside `state = 'built'` says precisely: the vendor holds the message,
  // the board does not know it. Recovery is founder-SQL by ruling (FORK D(ii),
  // 2026-08-04); no route clears this column and none stamps the state for it.
  // The board carries the tell so the founder meets it on the card.
  if (row.invite_sent_at) {
    console.log(`[admin/demo/invite] REFUSED ${row.ig_handle} — a demo_invite template was already `
      + `despatched to this handset at ${row.invite_sent_at}; no second template spent`);
    return { status: 409, body: { ok: false, error: 'invite_already_sent', detail: row.invite_sent_at } };
  }

  if (demoLifecycle.INVITE_STATES.includes(row.state) === false) {
    return { status: 409, body: { ok: false, error: 'illegal_transition', detail: `${row.state} -> invited` } };
  }

  // ── 1a · F-08.39 · THE INACTIVE REFUSAL (CE-ruled (c), MECHANISM LIMB) ─────
  // src/api/demo/vendor.js gates the public landing on `active = true`. Without
  // this check the route spends a REAL template on a REAL handset carrying a
  // claim link to a page that returns nothing — the vendor is invited to a door
  // that is already locked.
  //
  // THE HOLE IS BOUNDED, AND THE BOUND IS WHY THIS IS A GUARD AND NOT A PANIC.
  // DELETE -> `deactivate` -> `onRemoved` lands a row in `removed`, which
  // `INVITE_STATES` already refuses. So only rows whose inactivity PREDATES the
  // TDW_08 P1 lifecycle fold can be simultaneously `active=false` and
  // invite-eligible. Production holds at least one (`@swati`: legacy, inactive).
  //
  // THE HOLE IS SITTING A'S; P4 IS WHAT PUT A DOOR ON IT. A defect that becomes
  // reachable is not a defect the sitting created — recorded so the ledger reads
  // the provenance correctly.
  //
  // ── THE TWO-LAYER SHAPE, NAMED (F-06.85) ──────────────────────────────────
  // This guard is the MECHANISM limb; the board's `invitable` filter is the
  // PRESENTATION limb, and NEITHER STANDS ALONE. It is the same pattern the
  // photo floor was ruled into in this very sitting: the enforcing constant
  // lives server-side and the surface renders what the server sends, so the
  // client cannot contradict a rule it does not own.
  //   · presentation alone → the card button stays armed and the founder meets
  //     a refusal at a control that looked ready.
  //   · mechanism alone → the founder presses a button that was always going
  //     to fail, and learns the rule from an error.
  // [F-06.85: this paragraph is conditioned on a MECHANICAL fact — that the
  //  public landing REQUIRES `active`. Mechanism: `getDemoVendor` in
  //  src/api/demo/vendor.js filters `.eq('active', true)`. If that filter is
  //  ever relaxed, an inactive demo renders, this refusal becomes wrong, and
  //  both limbs must be re-read together rather than one of them patched.]
  if (row.active === false) {
    return { status: 409, body: { ok: false, error: 'inactive_demo', detail: row.ig_handle } };
  }

  if (!row.whatsapp_phone) {
    return { status: 409, body: { ok: false, error: 'no_phone', detail: row.ig_handle } };
  }

  // ── 1b · THE SHARED-HANDSET REFUSAL (TDW_08 P4 · FORK D(c), F-08.17) ───────
  // BEFORE the send, and for the same reason every other pre-check is: a
  // template is a real message to a real handset. `prospects` holds one row per
  // phone and `demo_vendor_ref` is single-valued, so inviting the second of a
  // shared-phone pair OVERWRITES the first's linkage and STOP from that handset
  // then reaches only the second — the first becomes un-removable by the one
  // word the vendor is most likely to send.
  //
  // THIS IS A GUARD, NOT THE CURE. The cure is a linkage table and it is ruled
  // OUT of this sitting; until it lands, the route refuses rather than silently
  // relinking, and the board shows the cause (see GET /vendors above).
  //
  // DISCLOSED, NOT PAPERED: this guard sees the linkage that EXISTS at read
  // time. `demoLeadAlert.js` also writes `demo_vendor_ref` on an enquiry, with
  // no admin action at all, so a collision can still be created between this
  // read and any later moment. F-08.17 is amended to name all three writers;
  // one door cannot close a hazard that has three.
  //
  // THE GUARD'S REACH IS THE NORMALIZER'S REACH, and that is a DECLARED limit
  // rather than one to be met in the field. `normalizeTo` strips a `whatsapp:`
  // prefix and a leading `+` and does nothing else — it does NOT infer a country
  // code. A demo row held as `9888294440` and one held as `919888294440` are
  // different handsets to this estate, HERE and in the prospect lane alike, so
  // this guard will not see those two collide. Widening it would mean a second
  // opinion about phone identity, which F-07.47 exists to prevent and which is
  // not a route's to hold. Benched as a NAMED LIMIT, not as a pass:
  // scripts/b08_p4_factory_bench.js §2.8.
  {
    const phone = normalizeTo(row.whatsapp_phone);
    const { data: held } = await supabase
      .from('prospects').select('demo_vendor_ref').eq('phone', phone)
      .not('demo_vendor_ref', 'is', null).maybeSingle();
    if (held && held.demo_vendor_ref && held.demo_vendor_ref !== row.id) {
      const { data: other } = await supabase
        .from('demo_vendors').select('ig_handle').eq('id', held.demo_vendor_ref).maybeSingle();
      console.log(`[admin/demo/invite] REFUSED ${row.ig_handle} — handset already linked to `
        + `${(other && other.ig_handle) || held.demo_vendor_ref} (F-08.17); no template spent`);
      return {
        status: 409,
        body: { ok: false, error: 'shared_handset', detail: (other && other.ig_handle) || held.demo_vendor_ref },
      };
    }
  }

  // ── 2 · THE SEND. Through the one gate, on the marketing line
  //        (templates.js:112), which routes via MARKETING_PHONE_NUMBER_ID and
  //        carries the cross-line STOP gate. The body is founder-frozen; this
  //        caller supplies only the two declared variables.
  const claimLink = claimLinkFor(row.ig_handle);
  if (!claimLink) {
    return { status: 409, body: { ok: false, error: 'no_handle', detail: row.id } };
  }
  try {
    await sendWa({
      line: 'marketing',
      to: row.whatsapp_phone,
      templateKey: 'demo_invite',
      vars: { name: row.display_name, claim_link: claimLink },
      supabase,
    });
  } catch (e) {
    const code = (e && e.code) || 'send_failed';
    if (code === 'opted_out') {
      console.log(`[admin/demo/invite] REFUSED ${row.ig_handle} — recipient has opted out; no state written`);
      return { status: 409, body: { ok: false, error: 'opted_out', detail: row.ig_handle } };
    }
    console.error(`[admin/demo/invite] SEND FAILED for ${row.ig_handle}: ${code} — ${e && e.message} `
      + '(no state written; the row is exactly as it was)');
    return { status: 502, body: { ok: false, error: code, detail: e && e.message } };
  }

  // ── 3 · THE SPEND, THEN THE STATE — one guarded stretch (TDW_08 P5 · Phase 1)
  //
  // EVERYTHING BELOW THIS LINE RUNS WITH A REAL TEMPLATE ALREADY ON A REAL
  // HANDSET. That is the whole reason for the shape: from here on there is no
  // failure that means "nothing happened", so there is no failure that may be
  // reported as if nothing happened.
  //
  // ── FORK B(ii) (CE-ruled 2026-08-04) · THE THROW IS CAUGHT HERE ───────────
  // WHAT THIS CURES, in the executor's own words at the read-first and adopted
  // by the chair as the finding's true texture: a throw out of these calls did
  // NOT crash the estate — the single door's own catch (the `router.post`
  // handler for '/vendors/:id/invite' below) answered a generic 500, and the
  // bulk door filed `{error:'threw'}` per id. IT ERASED THE TRUTH. Both catches
  // answered byte-indistinguishably from a
  // PRE-SEND failure, and the loud SENT BUT NOT STAMPED line never printed. The
  // operator could not tell a template that was spent from one that was not.
  //
  // So the two post-send acts are wrapped HERE, beneath the send, and any throw
  // converts to the SAME loud path a not-ok return takes. The bulk door's
  // 'threw' bucket now carries only PRE-send throws, which is what it always
  // claimed to mean.
  //
  // onInvited's own module contract is UNCHANGED (B(i) refused: a per-function
  // throw asymmetry inside demoLifecycle would be a second contract wearing one
  // module's name). DISCLOSED RESIDUAL: a future caller reaching
  // markInviteSent/onInvited directly inherits neither this guard nor the
  // ordering — see the F-06.85 note below.
  //
  // ── F-06.85 · THIS BODY IS THE ONLY PATH, AND THE MECHANISM IS NAMED ──────
  // FORK A was ruled A(ii): `_inviteOne` stays the one fused body and both
  // routes funnel it. "One path" is a convention a future caller could bypass —
  // so the guarantee is made STRUCTURAL by the pre-check at 1-0 above:
  // `invite_sent_at` refuses a second send whether it arrives through this body
  // or any other. MECHANISM: `demoLifecycle.markInviteSent` in
  // src/lib/demoLifecycle.js is the sole writer of that column, and the refusal
  // that reads it is `if (row.invite_sent_at)` in this function. IF EITHER MOVES
  // — the stamp made clearable, the pre-check relaxed, the column defaulted —
  // this paragraph is FALSE and both must be re-read together rather than one
  // of them patched.
  // WITNESSED, NEVER PREDICTED. The recovery line below states whether the spend
  // was RECORDED, and it reads this flag — set only after markInviteSent returned
  // ok — rather than a timestamp minted before the call. A log that guesses which
  // of two states the database is in is the same class of lie as a false done.
  let spendRecorded = false;
  let stampedAt = null;
  let r;
  try {
    // ── 3a · THE SPEND IS RECORDED BEFORE THE TRANSITION (FORK C(i)) ────────
    // Order matters and is deliberate. The stamp is the fact that survives a
    // failed transition; writing it second would leave the exact window this
    // cure exists to close. Through the module, per §3 GUARDRAILS — transport
    // stays here, writes stay there.
    const m = await demoLifecycle.markInviteSent(supabase, row.id, { via: 'admin_console' });
    if (m.ok === false) {
      throw new Error(`markInviteSent refused: ${m.reason} (${m.detail})`);
    }
    spendRecorded = true;
    stampedAt = m.invite_sent_at || null;

    // ── 3b · THE STATE. Only now, and only through the module.
    r = await demoLifecycle.onInvited(supabase, row.id, { via: 'admin_console' });
    if (r.ok === false) {
      // Reachable if the row moved between the two reads. LOUD, never papered:
      // a template has already reached a handset and the row does not say so,
      // which is the one inconsistency this caller's whole ordering exists to
      // prevent.
      throw new Error(`onInvited refused: ${r.reason} (${r.detail})`);
    }
  } catch (e) {
    const detail = (e && e.message) || 'unknown';
    console.error(`[admin/demo/invite] SENT BUT NOT STAMPED for ${row.ig_handle}: ${detail} `
      + '— THE TEMPLATE WAS SPENT and reached the handset; the row does not record the transition. '
      + (spendRecorded
        ? `invite_sent_at IS recorded (${stampedAt}), so the route will refuse a re-send: `
          + 'the board shows a stamped row still reading its old state.'
        : 'THE SPEND IS NOT RECORDED — markInviteSent did not land, so this log line is the ONLY '
          + 'record that a template reached this handset, and the route WILL allow a re-send.')
      + ' Recovery is founder-SQL (FORK D(ii)); nothing here retries.');
    return { status: 500, body: { ok: false, error: 'sent_not_stamped', detail } };
  }
  // THE RESIDUAL, NAMED AND NOT PAPERED (CE ruling §3, FORK C): the window
  // between send-success and stamp-success is ONE DB WRITE WIDE and cannot be
  // closed from this side of the network — no transaction spans WhatsApp and
  // Postgres. What the cure guarantees is that every failure inside it is LOUD
  // and that its log line states the template WAS spent. It is smaller than the
  // window it replaces (which spanned the send, the stamp and the transition,
  // and was silent on two of the three paths), and it is not zero.

  // A FAILED LINKAGE IS A 200 WITH A FLAG, NOT AN ERROR (CE-147 §4). The send
  // happened and the state is true; answering 409 while the vendor's handset is
  // buzzing would be the house's "never a false done" inverted into a false
  // failure. The flag is what the founder reads, and onInvited has already
  // logged the reason loudly.
  return {
    status: 200,
    body: {
      ok: true,
      vendor: { id: r.row.id, display_name: r.row.display_name, discover_eligible: r.row.discover_eligible },
      state: r.state,
      prospect_linked: r.prospect_linked === true,
      ig_handle: row.ig_handle,
    },
  };
}

// POST /admin/demo/vendors/:id/invite — THE SINGLE DOOR (F-08.36's cure rides
// the pwa; this route has existed and been callable since Sitting A, with no
// control on the console that reached it).
router.post('/vendors/:id/invite', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const out = await _inviteOne(supabase, req.params.id);
    return res.status(out.status).json(out.body);
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /admin/demo/invite-batch — THE BULK INVITE (TDW_08 P4 · FORK C(a))
//
// { ids: [uuid, ...] } → fires _inviteOne over each, IN ORDER, and reports every
// outcome. It does NOT stop at the first refusal: a batch that halts on one
// ineligible row would leave the founder guessing which of the rest were sent.
//
// THE BATCH MAX IS A PER-RUN BOUND AND IS NAMED AS ONE. Over-length is REFUSED
// rather than truncated — silently sending the first N of a longer list and
// answering 200 is a false done, and the founder cannot tell a truncation from a
// completion by looking at the screen.
//
// SEQUENTIAL BY CONSTRUCTION, never Promise.all: each iteration spends a real
// template on a real handset, and the shared-handset guard inside _inviteOne
// reads `prospects` — two sends racing on one phone would both read "unlinked"
// and both write, which is the exact overwrite F-08.17 names.
router.post('/invite-batch', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : null;
  if (!ids) return res.status(400).json({ ok: false, error: 'body.ids must be an array.' });
  try {
    const batchMax = await readDemoInviteBatchMax(supabase);
    if (ids.length > batchMax) {
      return res.status(400).json({
        ok: false,
        error: 'batch_too_large',
        detail: `This run holds ${ids.length} invites; the per-run maximum is ${batchMax}.`,
        batch_max: batchMax,
      });
    }

    const sent = [], refused = [];
    for (const id of ids) {
      let out;
      try {
        out = await _inviteOne(supabase, id);
      } catch (e) {
        // A THROW IS AN OUTCOME, NOT AN ABORT. One row's database error must not
        // hide the verdicts of the rows already sent above it.
        refused.push({ id, error: 'threw', detail: (e && e.message) || 'unknown' });
        continue;
      }
      if (out.status === 200) sent.push({ id, ig_handle: out.body.ig_handle, prospect_linked: out.body.prospect_linked });
      else refused.push({ id, error: out.body.error, detail: out.body.detail || null });
    }
    return res.json({ ok: true, batch_max: batchMax, sentCount: sent.length, refusedCount: refused.length, sent, refused });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

// POST /admin/demo/cloudinary-sign
router.post('/cloudinary-sign', requireAdminPassword, async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const preset    = process.env.CLOUDINARY_UPLOAD_PRESET || 'dream_wedding_uploads';
  if (!cloudName || !apiKey || !apiSecret) return res.status(500).json({ ok: false, error: 'Cloudinary not configured.' });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = 'demo_vendors';
  const toSign    = `folder=${folder}&timestamp=${timestamp}&upload_preset=${preset}${apiSecret}`;
  const signature = crypto.createHash('sha256').update(toSign).digest('hex');
  return res.json({
    ok: true,
    params: { timestamp, folder, upload_preset: preset, api_key: apiKey, signature },
    upload_url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
});

module.exports = router;

// GET /admin/demo/claims — list all claim requests newest first
// ── F-07.36 CURED · THE MIDDLEWARE EVERY SIBLING ALREADY HAD ────────────────
// These two routes carried NO `requireAdminPassword` while every other route in
// this file does (:27 · :38 · :61 · :99 · :114). `demo_claim_requests` holds
// vendor NAMES and PHONE NUMBERS (PUBLIC_SCHEMA.md:348-356) — an unauthenticated
// GET listed the estate's entire claim pipeline to anyone who knew the path, and
// an unauthenticated PATCH let them mark claims contacted.
//
// It mattered before this sitting and it matters more after it: TDW_07 P5 points
// `demo_lead_alert`'s {{3}} at the claim landing, so every demo alert we send
// drives a real vendor's phone number into this table.
//
// (These two handlers are declared BELOW `module.exports = router` at :146. That
// is ugly but not a defect — the export holds the router by reference and later
// `router.get`/`router.patch` calls mutate the same object, so both routes do
// register. Verified, and left where it stands: moving them is a diff that looks
// like a fix and changes nothing. The missing middleware was the defect.)
router.get('/claims', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  try {
    const { data, error } = await supabase
      .from('demo_claim_requests')
      .select('*')
      .order('claimed_at', { ascending: false });
    if (error) throw error;
    return res.json({ ok: true, claims: data || [] });
  } catch (err) {
    console.error('[admin/demo/claims]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});

// PATCH /admin/demo/claims/:id/contacted — toggle contacted flag
router.patch('/claims/:id/contacted', requireAdminPassword, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id } = req.params;
  const { contacted } = req.body || {};
  try {
    const { data, error } = await supabase
      .from('demo_claim_requests')
      .update({ contacted: !!contacted })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ ok: true, claim: data });
  } catch (err) {
    console.error('[admin/demo/claims/:id/contacted]', err.message);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
});
