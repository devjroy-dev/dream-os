// src/lib/site/examples.js · TDW · UX-S1 P3 · THE STYLE PREVIEW DRAWN WITH TDW'S EXAMPLE PICTURES.
//
// The app's style cards (WebsiteRoom) show each style built with TDW's example pictures, each marked "TDW". The page behind a
// card has to be drawn the same way when the vendor has no pictures of her own. This module only builds the stand-in rows; the
// caller (public/vendorCard.js) decides WHEN, and it decides only for a verified preview token with examples=1. A public page
// never passes through here. The rows are never written anywhere, and every picture they make carries example:true and mark:'TDW'
// so the renderer draws the mark exactly as the app does.
// TOTAL: every export answers and never throws.
'use strict';

const FILES = Object.freeze(['example-portrait', 'example-couple', 'example-hands', 'example-bouquet']);
const MARK = 'TDW';
const EXAMPLE_LOOK_ID = 'tdw-example-look';

/** The four example pictures as portfolio rows, on the app's own origin (the PWA serves /examples/ads/). */
function portfolioRows(origin) {
  const base = String(origin || '').replace(/\/+$/, '');
  return FILES.map((f, i) => ({ id: `tdw-example-${i + 1}`, image_url: `${base}/examples/ads/${f}.jpg`, position: i, example: true }));
}

/**
 * Does she have pictures of her own on this page? Portfolio rows, or a look photograph that is not deleted.
 */
function hasOwnPictures(portfolio, lookPhotos) {
  const a = Array.isArray(portfolio) ? portfolio : [];
  const b = Array.isArray(lookPhotos) ? lookPhotos : [];
  return a.length > 0 || b.some((p) => p && typeof p === 'object' && !p.deleted_at);
}

/**
 * The stand-ins: { portfolio, looks, lookPhotos } to draw the page with. One example look holds the four pictures, so the
 * gallery and the cover have something to draw. Returns null when she has pictures of her own (nothing is replaced).
 */
function standIns(origin, portfolio, lookPhotos) {
  try {
    if (hasOwnPictures(portfolio, lookPhotos)) return null;
    const rows = portfolioRows(origin);
    return {
      portfolio: rows,
      looks: [{ id: EXAMPLE_LOOK_ID, slug: 'example', title: 'Example', status: 'published', published_at: '2000-01-01T00:00:00.000Z', position: 0, example: true }],
      lookPhotos: rows.map((r) => ({ id: r.id, look_id: EXAMPLE_LOOK_ID, image_url: r.image_url, position: r.position, example: true })),
    };
  } catch (_e) { return null; }
}

module.exports = { FILES, MARK, EXAMPLE_LOOK_ID, portfolioRows, hasOwnPictures, standIns };
