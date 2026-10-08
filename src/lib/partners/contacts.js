'use strict';
// src/lib/partners/contacts.js · CE-47 · PTN-A1 · the admin's contacts. STOPPED is read LIVE from the prospects lane's own
// register (prospects.state = 'opted_out', the cross-line full stop; sendWa's gate reads the same column). Never stored here.
// On a Stopped row the app hides WhatsApp and Call (the chair, 6 Oct 2026); the links to Instagram and website stay.
const links = require('./links');
const KINDS = Object.freeze(['agency', 'fashion_house', 'brand', 'studio', 'planner', 'stylist', 'model', 'influencer', 'other']);

function validateContact(b = {}, { partial = false } = {}) {
  const row = {};
  if (!partial || b.name !== undefined) { const n = typeof b.name === 'string' ? b.name.trim() : ''; if (!n) return { ok: false, error: "Write the contact's name." }; row.name = n.slice(0, 120); }
  if (!partial || b.kind !== undefined) { if (!KINDS.includes(b.kind)) return { ok: false, error: 'Choose what kind of contact this is.' }; row.kind = b.kind; }
  if (!partial || b.how_we_know !== undefined) { const w = typeof b.how_we_know === 'string' ? b.how_we_know.trim() : ''; if (!w) return { ok: false, error: 'Write how TDW knows this contact.' }; row.how_we_know = w.slice(0, 300); }
  if (b.instagram_handle !== undefined) {
    if (b.instagram_handle === null || String(b.instagram_handle).trim() === '') row.instagram_handle = null;
    else { const h = links.normalizeIgHandle(b.instagram_handle); if (!h) return { ok: false, error: links.WORDS.badHandle }; row.instagram_handle = h.toLowerCase(); }
  }
  if (b.website !== undefined) {
    if (b.website === null || String(b.website).trim() === '') row.website = null;
    else { const w = links.normalizeWebsite(b.website); if (!w) return { ok: false, error: links.WORDS.badWebsite }; row.website = w; }
  }
  if (b.phone !== undefined) {
    const p = b.phone === null ? '' : String(b.phone).replace(/[^0-9+]/g, '');
    if (p && !/^\+[0-9]{8,15}$/.test(p)) return { ok: false, error: 'Write the phone number with the country code, for example +91 98111 00031.' };
    row.phone = p || null;
  }
  if (b.knows_tdw !== undefined) row.knows_tdw = b.knows_tdw === true;
  return { ok: true, row };
}

async function stoppedPhones(supabase, phones) {
  const list = [...new Set((phones || []).filter(Boolean))];
  if (!list.length) return new Set();
  const { data, error } = await supabase.from('prospects').select('phone, state').in('phone', list);
  if (error) throw new Error(`stop read failed: ${error.message}`);
  return new Set((data || []).filter((r) => r.state === 'opted_out').map((r) => r.phone));
}

/** The admin's row. stopped -> the app hides Reach. */
function contactShape(c, stopped) {
  return { id: c.id, name: c.name, kind: c.kind, how_we_know: c.how_we_know, phone: c.phone, knows_tdw: !!c.knows_tdw,
    stopped: !!stopped, instagram_handle: c.instagram_handle, instagram_url: links.instagramUrl(c.instagram_handle),
    website_url: links.websiteUrl(c.website) };
}
module.exports = { KINDS, validateContact, stoppedPhones, contactShape };
