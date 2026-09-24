'use strict';
// src/agent/studioName.js  THE NAME A CLIENT HEARS. CE-45 ELZ-1 cut 1 (F-44.157; R-45.26(1), FACT 4).
//
// ONE RULE, ONE HOME: the studio's name (vendors.business_name) first, the owner's personal name only when the studio has none,
// and "this vendor" when neither exists. Before this cut the couple lane put the PERSON first (coupleSystemPrompt.js :77 at
// 085741a, engine.js relayAttributionPrefix and the capture result), so a couple heard "Dev Roy's assistant" where the founder
// wants "Dev Roy Photography". disambiguation.js's vendorDisplayName already put the studio first and is left as it is.
// TOTAL: never throws; a non-string or whitespace-only value is treated as absent.
function clean(v) { return typeof v === 'string' && v.trim() ? v.trim() : ''; }
function studioName(vendor, vendorUser, fallback = 'this vendor') {
  try {
    return clean(vendor && vendor.business_name) || clean(vendorUser && vendorUser.name) || fallback;
  } catch (_e) { return fallback; }
}
module.exports = { studioName };
