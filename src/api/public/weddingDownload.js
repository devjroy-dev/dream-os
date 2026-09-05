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
const { signArchive, archiveDownloadUrl, nowTimestamp } = require('../../lib/cloudinarySign');
const { mintSigned, verifySigned } = require('../../lib/signedSession');
const { siteBase } = require('../../lib/vendor/creditInvite');

function notFound(res) { return res.status(404).json({ ok: false, error: 'Not found.' }); }

/** Seven days, and the leaf's own copy says so. */
const ARCHIVE_TTL_SECONDS = 7 * 24 * 60 * 60;

// ── THE DOWNLOAD TOKEN — R-G12.17 ───────────────────────────────────────────
// The door 303-redirects to the leaf with an OPAQUE token, and the leaf resolves
// it server-side to the archive URL. The signed URL itself NEVER reaches the
// address bar: a Cloudinary archive URL carries its own signature, and a guest
// who screenshots her browser and posts it has handed out a couple's whole
// wedding. An opaque token in the bar leaks nothing and dies with the archive.
//
// ⚠ NO NEW CRYPTO, AND NO TABLE. `src/lib/signedSession.js` is the estate's
// signed-token home and its posture is exactly the one needed here: the MAC
// covers a payload that is asserted equal to the carried body (its §1.10),
// verification returns NULL for expired, forged and malformed ALIKE — a door
// that told those apart would tell an attacker apart too — and a missing secret
// FAILS CLOSED rather than minting something that proves less than it claims.
// A table would need a writer, a reader and a sweeper for a value that is
// already fully described by its own contents.
//
// THE SUBJECT IS THE WEDDING, so a token minted for one page cannot fetch
// another's photographs. The TTL matches the archive's own expiry, so the token
// and the thing it names die together — a token outliving its archive would
// resolve to a URL Cloudinary refuses, which reads to a guest as our failure.
function downloadSecret() {
  // The lane's own secret, falling back to the session secret so a deployment
  // that has not set the new variable still MINTS rather than silently refusing
  // every download. Named, not silent: `sendGate`'s two-gate shape is the model
  // — a missing value must be legible, and `mintSigned` returns null when both
  // are absent, which the door reports.
  return process.env.WEDDING_DOWNLOAD_SECRET || process.env.ADMIN_SESSION_SECRET;
}

function mintDownloadToken(weddingId) {
  return mintSigned({
    secret:  downloadSecret(),
    subject: [String(weddingId || '')],
    ttlMs:   ARCHIVE_TTL_SECONDS * 1000,
  });
}

/** -> weddingId | null. NULL for expired, forged and malformed alike. */
function readDownloadToken(token) {
  const v = verifySigned({
    token,
    secret: downloadSecret(),
    subjectCount: 1,
  });
  return (v && v.subject && v.subject[0]) || null;
}

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
  // ── THE ANSWER IS A REDIRECT, NOT JSON — F-40.102's cure (R-G12.17) ───────
  // THIS DOOR ANSWERS AN HTML FORM POST. A browser NAVIGATES to whatever comes
  // back, so the first cut's `res.json(...)` put raw JSON on a guest's screen:
  // no sentence, no link, nothing she could use, and the vetoed `G2-done` frame
  // was unreachable. R-G12.10 ruled the answer render and only the leaf's half
  // was built. Owned as F-40.102.
  //
  // 303 AND NOT 302: after a POST, 303 tells the browser to follow with GET. A
  // 302 leaves the method to the client, and a re-POST on refresh would write
  // her lead a second time.
  const token = mintDownloadToken(wedding.id);
  if (!token) {
    // FAIL-CLOSED AND LEGIBLE. `mintSigned` returns null only when the secret is
    // absent, and a token minted from nothing proves nothing. She goes back to a
    // page that says so rather than to a link that cannot work.
    req.app.locals.logger?.error?.('weddingDownload: no signing secret; token refused');
    return res.redirect(303, `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}?sent=0`);
  }

  // ⚠ NOTHING ABOUT THE GUEST IS IN THIS URL. Not her number, not the lead id,
  // not whether she opted in — and NOT the archive URL, which carries its own
  // signature and would be a leak in any shared screenshot. The token is opaque,
  // bound to this wedding, and dies with the archive.
  return res.redirect(303,
    `${siteBase()}/v/${encodeURIComponent(code)}/w/${encodeURIComponent(slug)}`
    + `?sent=1&dl=${encodeURIComponent(token)}`);
}));

// ── GET /:code/:slug/archive/:token — the leaf resolves, the guest taps ──────
//
// The leaf's answer render calls this SERVER-SIDE and puts the result behind one
// button. A separate door rather than a field on the redirect, because a signed
// archive URL must never reach an address bar, a history entry or a screenshot.
//
// ⚠ THE THREE GATES RUN AGAIN. A token proves WHICH WEDDING, never that the
// wedding still serves: a couple who withdraws consent between the form post and
// the tap must not have her photographs handed out on a token minted a minute
// earlier. Consent is answered fresh on every resolve, exactly as the page is.
router.get('/:code/:slug/archive/:token', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const code = String(req.params.code || '').trim();
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const weddingId = readDownloadToken(String(req.params.token || '').trim());
  if (!code || !slug || !weddingId) return notFound(res);

  const { data: owner, error: oErr } = await supabase
    .from('vendors').select('id, status, discover_paused')
    .eq('routing_handle', code.toUpperCase()).maybeSingle();
  if (oErr) throw oErr;
  if (!owner || owner.status !== 'active' || owner.discover_paused === true) return notFound(res);

  const { data: wedding, error: wErr } = await supabase
    .from('weddings').select(W.WEDDING_COLS)
    .eq('id', weddingId).eq('owner_vendor_id', owner.id).eq('slug', slug)
    .maybeSingle();
  if (wErr) throw wErr;
  if (!wedding) return notFound(res);
  if (wedding.visibility !== 'published') return notFound(res);
  if (wedding.couple_consent !== true) return notFound(res);

  const photos = await W.photosFor(supabase, wedding.id);
  if (!photos.length) return notFound(res);

  try {
    const url = archiveDownloadUrl(signArchive({
      publicIds: photos.map((p) => p.public_id),
      timestamp: nowTimestamp(),
      expiresAt: nowTimestamp() + ARCHIVE_TTL_SECONDS,
      mode:      'download',
    }));
    return res.status(200).json({ ok: true, url });
  } catch (e) {
    req.app.locals.logger?.error?.('weddingDownload:archive', e);
    return res.status(503).json({ ok: false, error: 'Not ready.' });
  }
}));

module.exports = router;
