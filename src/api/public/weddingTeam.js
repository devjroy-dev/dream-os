// src/api/public/weddingTeam.js
// BLOCK 19 · G1.3 — "BOOK THE SAME TEAM". Public, unauthenticated.
// Mounted at /api/v2/public/wedding-team by src/api/router.js.
//
//   GET  /:code/:slug   — who the team is (the sheet reads it before she ticks)
//   POST /:code/:slug   — one enquiry, N leads, then WhatsApp to the owner
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS IS A SERVER-SIDE DOOR AND NOT A TOKEN IN A WHATSAPP MESSAGE
// ═══════════════════════════════════════════════════════════════════════════
// The charter proposed carrying a team token in the message body — `TDW-TEAM-
// <code>-<slug>` — and resolving it in `vendorInbound.js`'s routing branch. That
// arm is WITHDRAWN (c-40.26) and it is worth recording why, because it looked
// obviously right:
//
//     const firstWord = body.trim().split(/\s+/)[0].toUpperCase();
//     const handle    = firstWord.startsWith('TDW-') ? firstWord.slice(4) : firstWord;
//
// A hyphenated token slices to `TEAM-DEV440-WEDDING`, which fails the branch's
// own `/^[A-Z0-9]+$/` guard, then queries `routing_handle` for a string no
// vendor holds, matches nothing, and falls through. **The token is dead on
// arrival at the very branch that was supposed to read it** — and teaching that
// branch a second grammar is a real lift on a file one lift away from the soul.
//
// So the fan-out happens HERE, before WhatsApp is ever opened: the page POSTs,
// this door writes the leads server-side, and the guest is handed ONE `wa.me`
// carrying the plain `TDW-<code>` the intake has always understood. Zero parser
// bytes. W-1 untouched — `vendorInbound.js` is not in this sitting's radius at
// all.
//
// ── IT IS A FORM POST, AND THE PUBLIC LEAF STILL SHIPS NO JAVASCRIPT ────────
// R-G12.10 and R-G12.16, inherited whole from the download door beside it: the
// sheet is a `<details>`/`<form method="POST">`, this door answers it, and the
// guest's number never touches a client bundle.
//
// ── TWO FEATURES, TWO CONSENTS (R-G12.3, and the chair's ruling on §2(2)) ───
// The download sheet asks one question naming ONE party, so a yes there writes
// ONE lead — the owner's. It cannot lawfully become N. This sheet asks its own
// question about a NAMED SET, lists that set above the checkbox, and only then
// writes to it. The master's §4 G1.2 line ("a lead for every credited vendor")
// is superseded by that ruling; the fan-out lives here and only here.
'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const W = require('../../lib/vendor/weddings');
const { createLead } = require('../../lib/vendor/leads');
const { toE164 } = require('../../lib/phone');
const { WEDDING_TEAM_SOURCE } = require('../../lib/vendor/leadSources');
const { alertWeddingLead } = require('../../lib/vendor/weddingLeadAlert');
const { siteBase } = require('../../lib/vendor/creditInvite');
const { ENQUIRE_BASE } = require('../../lib/discover/shapeVendor');

function notFound(res) { return res.status(404).json({ ok: false, error: 'Not found.' }); }

/**
 * THE PAGE'S THREE GATES, BYTE-FOR-BYTE THE PAGE'S OWN.
 *
 * Absent, unpublished, consent-off and owner-withdrawn are ONE indistinguishable
 * miss here exactly as on `weddingPage.js` and `weddingDownload.js` — and for
 * the sharper reason the download door already states: a door that answered
 * differently from the page would let a stranger probe for weddings the page
 * refuses to show.
 *
 * Returns `{ owner, wedding }` or null. Never partial, never a reason.
 */
async function livePage(supabase, code, slug) {
  const { data: owner, error: oErr } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle, status, discover_paused')
    .eq('routing_handle', code.toUpperCase())
    .maybeSingle();
  if (oErr) throw oErr;
  if (!owner || owner.status !== 'active' || owner.discover_paused === true) return null;

  const { data: wedding, error: wErr } = await supabase
    .from('weddings')
    .select(W.WEDDING_COLS)
    .eq('owner_vendor_id', owner.id)
    .eq('slug', slug)
    .maybeSingle();
  if (wErr) throw wErr;
  if (!wedding) return null;
  if (wedding.visibility !== 'published') return null;
  if (wedding.couple_consent !== true) return null;

  return { owner, wedding };
}

/**
 * `YYYY-MM` → the first of that month, plus the precision that makes it honest.
 * Byte-identical in reasoning to the download door's own `monthToDate`: the two
 * columns move together or neither moves (R-G12.11), and an unparseable value is
 * dropped rather than guessed at.
 */
function monthToDate(raw) {
  const m = String(raw || '').trim().match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

// ── GET /:code/:slug — THE TEAM, SO THE SHEET CAN NAME IT ───────────────────
// The sheet lists the vendors above the checkbox, and this is where that list
// comes from. It is the SAME `teamTargets` the POST writes to, so the set she
// consented to and the set that receives her enquiry are one computation.
//
// ⚠ IT CARRIES NO PHONE AND NO VENDOR ID IS SECRET, but the shape is still built
// field by field: `teamTargets` returns `{vendor_id, name, handle, is_owner}`
// and only `name` and `is_owner` are needed to draw the sheet. The id stays off
// this wire because nothing on the page needs it and a field nobody reads is a
// field somebody will one day render.
router.get('/:code/:slug', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const code = String(req.params.code || '').trim();
  const slug = String(req.params.slug || '').trim().toLowerCase();
  if (!code || !slug) return notFound(res);

  try {
    const live = await livePage(supabase, code, slug);
    if (!live) return notFound(res);

    const targets = await W.teamTargets(supabase, {
      weddingId: live.wedding.id,
      ownerVendorId: live.owner.id,
    });

    return res.status(200).json({
      ok: true,
      owner: { business_name: live.owner.business_name },
      team: targets.map((t) => ({ name: t.name, is_owner: t.is_owner })),
    });
  } catch (e) {
    req.app.locals.logger?.error?.('weddingTeam:get', e);
    return res.status(500).json({ ok: false, error: 'Something went wrong.' });
  }
}));

// ── POST /:code/:slug — ONE ENQUIRY, N LEADS ────────────────────────────────
router.post('/:code/:slug', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body  = req.body || {};
  const code  = String(req.params.code || '').trim();
  const slug  = String(req.params.slug || '').trim().toLowerCase();
  // ── E.164 AT THE DOOR — F-40.179 ──────────────────────────────────────────
  // The walk stored `8595363978` bare, and the room's WhatsApp control then said
  // 「missing country code」 — a lead a vendor could see and could not answer.
  // `toE164` is the estate's ONE HOME for this (`src/lib/phone.js`, hoisted at
  // F-04.109 after three byte-identical copies had already diverged once).
  //
  // ⚠ THE FINDING NAMED THE TEAM DOOR; THE DEFECT IS BOTH DOORS. The download
  // door stores the same bare digits by the same line, and `createLead`
  // normalises nothing. The specimen is never the extent (R-40.64) — curing only
  // the named one would have left the identical bug on the door that has been
  // writing rows since G1.2.
  //
  // Normalising HERE and not inside `createLead` is deliberate: `createLead`
  // dedupes on `(vendor_id, phone)`, and a writer that silently rewrote the key
  // it dedupes on would make two callers passing the same human disagree about
  // whether she is one row. The doors agree on the shape before they knock.
  const phone = toE164(String(body.phone || '').trim());
  if (!code || !slug) return notFound(res);
  if (!phone) return res.status(400).json({ ok: false, error: 'A number is required.' });

  const live = await livePage(supabase, code, slug);
  if (!live) return notFound(res);
  const { owner, wedding } = live;

  const targets = await W.teamTargets(supabase, {
    weddingId: wedding.id, ownerVendorId: owner.id,
  });
  // A page whose team resolves to nobody cannot take a team enquiry. This is
  // reachable — a paused owner is already excluded by `livePage`, but a page
  // whose owner went inactive between the render and the POST lands here — and
  // it answers as the miss rather than writing nothing and reporting success.
  if (!targets.length) return notFound(res);

  // ── THE ONE QUESTION, AND IT IS NOT OPTIONAL HERE ─────────────────────────
  // ⚠ THE ASYMMETRY WITH THE DOWNLOAD IS DELIBERATE. There, the tickbox governs
  // whether her number is STORED and she gets her photographs either way — the
  // download is never held hostage to consent. Here the enquiry IS the act: an
  // untickled box means she has asked N businesses to contact her and given none
  // of them a way to do it, which is not a lead, it is a row that wastes a
  // vendor's attention. So the box is the gate on the whole write, and the sheet
  // says so before she submits.
  const mayContact = body.may_contact === true || body.may_contact === 'true' || body.may_contact === 'on';
  if (!mayContact) {
    return res.redirect(303,
      `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}?team=0`);
  }

  const weddingDate = monthToDate(body.wedding_month);

  // ── N LEADS THROUGH THE ONE WRITER (R-G13.1) ──────────────────────────────
  // `createLead` per target and never a second INSERT — the table's writer set
  // does not grow for this door any more than it grew for the download.
  //
  // ⚠ WHAT A DEDUPE HIT MEANS HERE, RULED AS A PRODUCT FACT (R-G13.4).
  // `createLead` dedupes on `(vendor_id, phone)` and `source` sits in
  // ENRICH_REFUSED_KEYS, so a guest who ALREADY downloaded from this page with
  // the contact box ticked holds a `wedding_guest` lead on the owner — and her
  // team ask writes the owner NOTHING. That is the dedupe doing its job; a
  // second row for one guest is the duplicate it exists to refuse. Her ask still
  // reaches the owner, as her own WhatsApp message a moment later. The fixture
  // holds a live specimen of exactly this state, which is why it is a named
  // behaviour here and a bench cell rather than a sentence.
  //
  // SEQUENTIAL, NOT `Promise.all`. Two writes for one phone racing each other is
  // how a dedupe keyed on a read-then-write loses — `createLead` reads before it
  // inserts, and the whole point of this loop is that several of its iterations
  // may be for a number the estate has already seen.
  const written = [];
  const leadIdByVendor = {};
  for (const t of targets) {
    try {
      const r = await createLead(supabase, t.vendor_id, {
        name:  null,
        phone,
        wedding_date: weddingDate,
        wedding_date_precision: weddingDate ? 'month' : null,
        source: WEDDING_TEAM_SOURCE,
        wedding_id: wedding.id,
        raw_message: null,
      });
      written.push({
        vendor_id: t.vendor_id,
        ok: Boolean(r && r.ok !== false),
        deduped: Boolean(r && r.deduped),
      });
      // F-40.177: the alert row points at the lead it is about. A dedupe hit
      // returns the EXISTING row, which is the right one to point at — the
      // vendor is being told about a guest she already holds.
      if (r && r.lead && r.lead.id) leadIdByVendor[t.vendor_id] = r.lead.id;
      else if (r && r.id) leadIdByVendor[t.vendor_id] = r.id;
    } catch (e) {
      // ⚠ ONE VENDOR'S FAILED WRITE DOES NOT COST HER THE OTHERS, and it does
      // not cost her the WhatsApp hand-off either. It is logged for an operator
      // because it is our problem, and it is never surfaced to her, because
      // there is nothing she could do about it. Reported, not swallowed:
      // `written` carries the outcome so the walk can read it.
      req.app.locals.logger?.error?.('weddingTeam:createLead', e);
      written.push({ vendor_id: t.vendor_id, ok: false, deduped: false });
    }
  }

  // ── THE ALERT (R-40.72) ───────────────────────────────────────────────────
  // AFTER the leads, BEFORE the redirect, and awaited — but never allowed to
  // cost her the hand-off. The rows are the durable half and are already
  // written; this is the courtesy, and `alertWeddingLead` is built never to
  // throw. The try/catch is belt on braces: a notification module that somehow
  // did throw must not turn a successful enquiry into a 500 for the guest.
  //
  // N sends, capped at ten inside the module. The LEADS are uncapped — a vendor
  // silently missing a lead would be a worse failure than one missing a message.
  try {
    const alerts = await alertWeddingLead(supabase, {
      targets, weddingDate, logger: req.app.locals.logger,
      leadIdByVendor, source: WEDDING_TEAM_SOURCE,
    });
    if (alerts.sent < alerts.attempted) {
      req.app.locals.logger?.error?.('weddingTeam:alerts', alerts);
    }
  } catch (e) {
    req.app.locals.logger?.error?.('weddingTeam:alerts:threw', e);
  }

  // ── THE HAND-OFF (R-G13.1) ────────────────────────────────────────────────
  // 303, not 302: after a POST, 303 tells the browser to follow with GET. A 302
  // leaves the method to the client and a re-POST on refresh would run the whole
  // fan-out a second time.
  //
  // The confirmation renders on the SAME LEAF on `?team=1` — the download's own
  // mechanism (R-G13.6), so the guest stays where she was and the page she
  // already trusts answers her. The `wa.me` is the leaf's control, built there
  // from what this door hands back; NOTHING about the guest is in this URL.
  return res.redirect(303,
    `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}?team=1`);
}));

/**
 * THE OWNER'S OWN ENQUIRE LINK, exported for the leaf's confirmation control.
 *
 * ⚠ UPPERCASE, AND THAT IS THE WHOLE REASON THIS IS NOT COMPOSED ON THE LEAF.
 * `vendorCard.js` states the rule: the token is built from `routing_handle`
 * UPPERCASE, never from the lowercased address form. The page's own `owner.handle`
 * is lowercased for `/v/<handle>`, so a leaf reusing it would emit
 * `TDW-dev440` — which routes today only because `vendorInbound.js` upper-cases
 * the first word before matching, a property of the intake rather than a promise
 * to this file.
 */
function ownerEnquireLink(routingHandle) {
  return ENQUIRE_BASE + String(routingHandle || '').toUpperCase();
}

module.exports = router;
module.exports.ownerEnquireLink = ownerEnquireLink;
