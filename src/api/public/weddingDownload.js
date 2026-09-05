// src/api/public/weddingDownload.js
// BLOCK 19 · G1.2 — THE GUEST GALLERY'S DOWNLOAD. Public, unauthenticated.
// Mounted at /api/v2/public/wedding-download by src/api/router.js.
//
//   POST /:code/:slug   — a guest gives her number, gets a link, becomes a lead
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS IS THE BLOCK'S THESIS EXECUTED: "the wedding is the ad"
// ═══════════════════════════════════════════════════════════════════════════
// A vendor works a wedding of four hundred guests, twenty of whom are about to
// marry, and the proof of her work leaves the venue in four hundred phones and
// never comes back. This door is where it comes back.
//
// ── IT IS A FORM POST, AND THE PUBLIC LEAF SHIPS NO JAVASCRIPT — R-G12.10 ───
// `app/v/[code]/w/[slug]/page.tsx:35-38` refuses a client component in terms: a
// gallery needing `useState` would ship a hydration bundle to every stranger who
// opens a wedding link. So the sheet is a `<form method="POST">`, this door
// answers it, and THE GUEST'S NUMBER NEVER TOUCHES JAVASCRIPT. The three arms
// this beat are named in the read-first; (a) minting the public lane's first
// client component was refused on that file's own ruling.
//
// ── THE ONE QUESTION, AND THE TWO FIELDS THAT ARE NOT QUESTIONS — R-G12.3/.15
// Master §7 refuses "a form": the sheet asks the guest exactly ONE thing that is
// a question — may this photographer contact you? Her number and her month are
// FIELDS SHE FILLS TO GET HER PHOTOGRAPHS, not questions the vendor is asking of
// her. Three inputs, one question, and the month is OPTIONAL: a guest who leaves
// it blank downloads all the same and lands with `wedding_date` NULL.
//
// ⚠ AND THE DOWNLOAD IS NEVER THE OPT-IN. She gets her photographs whether she
// ticks the box or not. A download withheld until she consents to marketing is
// consent bought with a hostage, and master §2.4's "silence never means yes" is
// worth nothing if the alternative to yes is losing the pictures.
'use strict';

const express = require('express');
const router  = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const W = require('../../lib/vendor/weddings');
const { createLead } = require('../../lib/vendor/leads');
const { signArchive, archiveUrl, nowTimestamp } = require('../../lib/cloudinarySign');

function notFound(res) { return res.status(404).json({ ok: false, error: 'Not found.' }); }

/** Seven days, and the leaf's own copy says so — "It works for the next seven
 *  days." A link with no expiry is a permanent public URL to a couple's whole
 *  wedding, forwarded to whoever the guest forwards it to. */
const ARCHIVE_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * A guest's month arrives as `YYYY-MM`, and it becomes the estate's OWN
 * imprecise-date idiom rather than a new column — R-G12.11 (FORK 10 arm (b)).
 * `leads.wedding_date` (ordinal 6) plus `leads.wedding_date_precision`
 * (ordinal 24) whose CHECK already permits 'month' (PUBLIC_SCHEMA.md:1669) say
 * exactly this, are read by the whole lead lifecycle, and are already accepted
 * by `createLead`. An `intent_month` column would have had one writer and one
 * reader, forever, beside a pair that already means the same thing.
 *
 * The first of the month is stored because a date column must hold a date; the
 * PRECISION is what stops any reader from believing the day.
 */
function monthToDate(raw) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(raw || '').trim());
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

router.post('/:code/:slug', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const body  = req.body || {};
  const code  = String(req.params.code || '').trim();
  const slug  = String(req.params.slug || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  if (!code || !slug) return notFound(res);
  if (!phone) return res.status(400).json({ ok: false, error: 'A number is required.' });

  // ── THE PAGE MUST BE LIVE, BY THE SAME THREE GATES AS THE PAGE ITSELF ──────
  // Absent, unpublished, consent-off and owner-withdrawn are ONE
  // indistinguishable miss here exactly as they are on `weddingPage.js` — and
  // for a sharper reason: a download door that answered differently from the
  // page would let a stranger probe for weddings the page refuses to show.
  const { data: owner, error: oErr } = await supabase
    .from('vendors')
    .select('id, business_name, status, discover_paused')
    .eq('routing_handle', code.toUpperCase())
    .maybeSingle();
  if (oErr) throw oErr;
  if (!owner || owner.status !== 'active' || owner.discover_paused === true) return notFound(res);

  const { data: wedding, error: wErr } = await supabase
    .from('weddings')
    .select(W.WEDDING_COLS)
    .eq('owner_vendor_id', owner.id)
    .eq('slug', slug)
    .maybeSingle();
  if (wErr) throw wErr;
  if (!wedding) return notFound(res);
  if (wedding.visibility !== 'published') return notFound(res);
  if (wedding.couple_consent !== true) return notFound(res);

  const photos = await W.photosFor(supabase, wedding.id);
  if (!photos.length) return res.status(409).json({ ok: false, error: 'There is nothing to download yet.' });

  // ── THE LEAD, WRITTEN THROUGH THE ONE HOME ────────────────────────────────
  // `createLead` (src/lib/vendor/leads.js:108) and never a second INSERT. The
  // table has four writers today and this door does not become a fifth; the
  // census SELECT for F-40.18 is still owed before any CHECK is added to
  // `source`, which is why R-40.13 keeps it free text and 'wedding_guest' is
  // spelled here once.
  //
  // ⚠ THE OPT-IN DECIDES WHETHER HER NUMBER IS STORED AT ALL — R-G12.3.
  // YES → the lead carries her phone and the vendor can reach her.
  // NO  → the lead is written with phone NULL and THE NUMBER IS HELD NOWHERE:
  //       not on the lead, not on the wedding, not in a log. It is used once, in
  //       this request, to address the link, and then it is gone. The vendor
  //       still learns that a guest with a November wedding downloaded — which is
  //       a real signal — and learns nothing she may not act on.
  const mayContact = body.may_contact === true || body.may_contact === 'true' || body.may_contact === 'on';
  const weddingDate = monthToDate(body.wedding_month);

  let leadWritten = false;
  try {
    const r = await createLead(supabase, owner.id, {
      name:  null,
      phone: mayContact ? phone : null,
      wedding_date: weddingDate,
      // R-G12.11: the precision is what makes a first-of-month honest. It is set
      // ONLY when a month was actually given — a NULL date with a precision would
      // be a claim about a date that does not exist.
      wedding_date_precision: weddingDate ? 'month' : null,
      source: 'wedding_guest',
      wedding_id: wedding.id,
      raw_message: null,
    });
    leadWritten = Boolean(r && r.ok !== false);
  } catch (e) {
    // ⚠ THE DOWNLOAD IS NOT HELD HOSTAGE TO OUR BOOKKEEPING. If the lead write
    // fails she still gets her photographs; the failure is logged for an operator
    // and never surfaced to her, because it is not her problem and there is
    // nothing she could do about it. Reported, not swallowed: `lead` is on the
    // response so the walk can read it.
    req.app.locals.logger?.error?.('weddingDownload:createLead', e);
  }

  // ── THE ARCHIVE ───────────────────────────────────────────────────────────
  // Signed in the ONE home (R-G12.2 / R-G11.22). Cloudinary builds the zip
  // server-side from the stored `public_id`s, so Railway never buffers a
  // wedding's originals and the estate never hands out a folder URL it does not
  // shape.
  let download = null;
  try {
    const params = signArchive({
      publicIds: photos.map((p) => p.public_id),
      timestamp: nowTimestamp(),
      expiresAt: nowTimestamp() + ARCHIVE_TTL_SECONDS,
    });
    download = { url: archiveUrl(), params };
  } catch (e) {
    // Never a false done: if the archive cannot be signed she is told the
    // download failed, rather than handed a link that will not open.
    req.app.locals.logger?.error?.('weddingDownload:signArchive', e);
    return res.status(503).json({ ok: false, error: 'That didn\u2019t go through. Try again in a moment.' });
  }

  // ⚠ NOTHING ABOUT THE GUEST IS ON THIS RESPONSE. Not her number, not the lead
  // id, not whether she opted in. The leaf renders one sentence and the vendor
  // learns about her in her Leads room, through the door that already exists.
  return res.status(200).json({ ok: true, download, lead: leadWritten });
}));

module.exports = router;
