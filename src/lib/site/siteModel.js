// src/lib/site/siteModel.js — TDW · CE-46 · WEB-1 cut 4 · WHAT HER SITE IS, FROM HER TIER AND HER CHOICES.
//
// One pure home for the site's rules, read by the public card (the pages couples see) and, from cut 5,
// by the Your website room. The TIER never leaves the server (b44: `tier` is WIRE_FORBIDDEN); what the
// public card carries is only what the page must draw: the look, the pages, the credit, her domain.
//
// R-46.9 as the founder ruled it, 28 September:
//   Basic      the site on her subdomain, ONE look chosen by her trade, the five pages, WhatsApp, the credit.
//   Essential  the same, with all three looks to choose from (looks_open).
//   Signature  adds Reviews and a gallery per wedding, the credit removable.
//   Prestige   adds Stories, FAQ, Book a consultation; the credit removed.
// The trade map (his "ok to the choices"): photography and content_creator → quiet; makeup, hairstylist,
// designer and jewellery → bloom; decor, venue_catering, planning and performer → atelier; other → quiet.
'use strict';

const LOOKS = Object.freeze(['quiet', 'bloom', 'atelier']);
const TRADE_LOOK = Object.freeze({
  photography: 'quiet', content_creator: 'quiet',
  makeup: 'bloom', hairstylist: 'bloom', designer: 'bloom', jewellery: 'bloom',
  decor: 'atelier', venue_catering: 'atelier', planning: 'atelier', performer: 'atelier',
  other: 'quiet',
});
const BASE_PAGES = Object.freeze(['home', 'portfolio', 'weddings', 'packages', 'about', 'contact']);
const SIGNATURE_PAGES = Object.freeze(['reviews']);
const PRESTIGE_PAGES = Object.freeze(['stories', 'faq', 'book']);

/** basic | essential | signature | prestige; anything else reads as basic (never more than she has). */
function tierOf(t) { return ['basic', 'essential', 'signature', 'prestige'].includes(t) ? t : 'basic'; }
function looksOpen(t) { return tierOf(t) !== 'basic'; }
function tradeLook(category) { return TRADE_LOOK[category] || 'quiet'; }

/** The look shown: her pick when her tier opens the choice and she has one; otherwise her trade's. */
function lookFor(tier, category, siteRow) {
  const picked = siteRow && LOOKS.includes(siteRow.look) ? siteRow.look : null;
  return looksOpen(tier) && picked ? picked : tradeLook(category);
}

/** Every page her tier allows, in the default order. */
function allowedPages(tier) {
  const t = tierOf(tier);
  return [...BASE_PAGES, ...(t === 'signature' || t === 'prestige' ? SIGNATURE_PAGES : []), ...(t === 'prestige' ? PRESTIGE_PAGES : [])];
}

/**
 * The pages couples see: her order and her hidden set when she has chosen, filtered to what her tier
 * allows (a downgrade HIDES pages above it, never deletes her choices), with Home and Contact always
 * present (Contact carries the WhatsApp button: no page without it, refusal g).
 */
function pagesFor(tier, siteRow) {
  const allowed = allowedPages(tier);
  const chosen = siteRow && Array.isArray(siteRow.pages) ? siteRow.pages : [];
  const ordered = [];
  for (const p of chosen) {
    const key = p && typeof p.key === 'string' ? p.key : null;
    if (!key || !allowed.includes(key) || ordered.some((o) => o.key === key)) continue;
    ordered.push({ key, shown: p.shown !== false });
  }
  for (const key of allowed) if (!ordered.some((o) => o.key === key)) ordered.push({ key, shown: true });
  return ordered.filter((o) => o.shown || o.key === 'home' || o.key === 'contact').map((o) => o.key);
}

/** The credit "Made with The Dream Wedding": shown on Basic and Essential, removable on Signature, removed on Prestige. */
function creditFor(tier, siteRow) {
  const t = tierOf(tier);
  if (t === 'prestige') return false;
  if (t === 'signature') return !(siteRow && siteRow.credit_shown === false);
  return true;
}

/** The site a demo or a vendor with nothing chosen gets: her trade's look, the Basic pages, the credit. */
function defaultSite(category) { return { look: tradeLook(category), pages: pagesFor('basic', null), credit: true, domain: null }; }

module.exports = { defaultSite, LOOKS, TRADE_LOOK, BASE_PAGES, SIGNATURE_PAGES, PRESTIGE_PAGES, tierOf, looksOpen, tradeLook, lookFor, allowedPages, pagesFor, creditFor };
