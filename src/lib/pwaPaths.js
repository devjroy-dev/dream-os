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
// `VENDOR_LEADS_LINK`). Phase 7 retires the `/vendor` layout for the `/w/`
// shell, and four literals in four files is four chances to miss one.
//
// WHY THE VALUES BELOW ARE STILL `/vendor/…` TODAY. The `/w/` rooms exist on the
// pwa `worklist` branch, not on production `main`. A `/w/billing` href served
// by Railway before the pwa cutover lands a live vendor on a 404, and there ARE
// live vendors. So this file ships with today's paths LIVE and the `/w/` twin
// beside each one, commented — behaviour is byte-identical to the tree before
// it — and Phase 7's cutover flips ONE file.
//
// ⚠ THE FLIP STEP (Phase 7, the cutover seat, AFTER `worklist` is production):
//   for each key in VENDOR_PATHS, comment the `/vendor/…` line and uncomment the
//   `/w/…` line beneath it. Nothing else in this file or its four readers
//   changes. The seat's bench asserts that every `/vendor/` or `/w/` navigation
//   literal in src/ lives in THIS file and nowhere else, so a reader that grows
//   its own copy goes red at the floor.
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
  // billing:   '/w/billing',            // Phase 7: uncomment, comment the line above

  // The Portfolio room — the Instagram-import return path (ig.js).
  portfolio: '/vendor/portfolio',
  // portfolio: '/w/portfolio',          // Phase 7: uncomment, comment the line above

  // The Leads room, as vendorInbound.js's template link has always spelled it.
  leads:     '/vendor/leads',
  // leads:     '/w/leads',              // Phase 7: uncomment, comment the line above

  // The Leads room, as enquire.js's enquiry body has always spelled it (the
  // list route, D-8's redirect-stub family). Two keys because the two sites
  // sent two addresses; collapsing them is Phase 7's, not this file's.
  leadsList: '/vendor/list/leads',
  // leadsList: '/w/leads',              // Phase 7: uncomment, comment the line above
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
