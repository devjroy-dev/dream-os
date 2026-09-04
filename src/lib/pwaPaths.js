// src/lib/pwaPaths.js
//
// THE ONE HOME FOR EVERY VENDOR-FACING PWA NAVIGATION PATH THAT dream-os SERVES
// — F-38.p12 (CE-39 step 2a, RE-RULED on the seat's read-first).
//
// WHAT WAS WRONG. Four sites in src/ carried a `/vendor/…` address as their own
// literal: the capped-meter upgrade href (src/api/vendor-engine/chat.js), the
// Instagram-import return path (src/api/vendor/ig.js `RETURN_PATH`), and the two
// absolute leads links that ride inside WhatsApp message bodies
// (src/api/couple/enquire.js `VENDOR_LEADS_URL`, src/lib/vendorInbound.js
// `VENDOR_LEADS_LINK`). Four literals in four files is four chances to miss one.
//
// ── THE FLIP HAPPENED (P7.2, CE-39 2026-09-04) ───────────────────────────────
// This file used to carry every path twice — the live `/vendor/` value and a commented
// `/w/` twin — because the shell lived at `/w/*` on the `worklist` branch while production
// served the old tree, and a `/w/` href sent to a live vendor would have 404'd.
//
// Arm (a) of the flip removed that problem rather than switching between its horns: the
// shell MOVED onto `/vendor/*` and the old tree was deleted in the same commit (R-39.24).
// The `/vendor/` values below are therefore correct BY THE FLIP, not by waiting — they
// address the shell now. The `/w/` twins are DELETED, not uncommented: `/w/*` does not
// exist on either branch any more, so a commented twin would be a route nobody can serve,
// kept alive in a comment for a reader to trust by mistake.
//
// ONE VALUE DID CHANGE. `leadsList` spelled `/vendor/list/leads`, and the flip deleted
// `/vendor/list/*`. See its note below — that address rides inside a WhatsApp message to a
// vendor, so a stale spelling there is a 404 in a vendor's hand, not a broken link on a page.
//
// The rule this file exists for is unchanged: every `/vendor/` navigation literal in src/
// lives HERE and nowhere else, and the floor reddens on a reader that grows its own copy.
//
// NOT IN SCOPE HERE, BY CONSTRUCTION: Express route registrations and API
// mounts (`/api/v2/vendor/…`), `req.path` comparisons, and the demo studio host
// (`demo.thedreamwedding.in/vendor/<handle>`, a different site with its own
// Phase 7 ruling). Those are not navigation the vendor's browser follows off a
// dream-os response.
'use strict';

// The production PWA origin, for the two sites that build ABSOLUTE links into
// message bodies. `ig.js` keeps its own `PWA_BASE_URL` env fallback (a redirect
// must follow the deployment it is testing against); this constant is the one
// the outbound messages have always carried.
const PWA_ORIGIN = 'https://thedreamwedding.in';

const VENDOR_PATHS = Object.freeze({
  // The Billing room — the capped-meter upgrade href (chat.js).
  billing:   '/vendor/billing',

  // The Portfolio room — the Instagram-import return path (ig.js).
  portfolio: '/vendor/portfolio',

  // The Leads room, as vendorInbound.js's template link has always spelled it.
  leads:     '/vendor/leads',

  // ── COLLAPSED AT PHASE 7 (P7.2 Arm E, CE-39 2026-09-04) ───────────────────────
  // This key spelled `/vendor/list/leads` because enquire.js's enquiry body sent that
  // address while vendorInbound.js sent `/vendor/leads`; the note above said collapsing
  // them was Phase 7's work, and this is Phase 7. The flip DELETED `/vendor/list/*`
  // (R-39.24), so the old spelling now 404s — and this one is not cosmetic: enquire.js
  // sends it to a vendor over WhatsApp when a couple enquires (FORK 5, derived at P7.2's
  // read-first). Both keys now name the one live room. They stay two keys because two
  // call sites still ask by two names; the NAMES are a caller's business, the ADDRESS is
  // this file's, and there is now one address.
  leadsList: '/vendor/leads',
});

function vendorPath(key) {
  const p = VENDOR_PATHS[key];
  if (!p) throw new Error(`[pwaPaths] unknown vendor path key: ${key}`);
  return p;
}

function vendorUrl(key) {
  return PWA_ORIGIN + vendorPath(key);
}

module.exports = { PWA_ORIGIN, VENDOR_PATHS, vendorPath, vendorUrl };
