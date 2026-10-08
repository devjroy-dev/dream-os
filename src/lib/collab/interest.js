'use strict';
// src/lib/collab/interest.js · CE-47 · CLB-2a · A PARTNER PUTS SOMEONE FORWARD ON A CALL.
// addPartnerInterest({ post_id, partner_id, send_id, name, role, link, agreed_at }) -> { id }. PTN calls it in the same
// server. Idempotent on (send, name): the same person sent again for the same send returns the first row's id.
// The row never holds a phone or an email (the schema has no column for them) and never gets the join link.
// HUB-2b (the chair's ruling, 7 Oct 2026): ONE GUARD. A call whose poster does not have Collab Hub open (gate.js: testers
// or the clb.hub switch, failing closed) takes no partner row: it writes nothing and says why. PTN's sending asks the same
// question first; this is the second guard, at the one place partner rows are written.
// HUB-2d (R-47.1): one idea in a sentence. PTN reads this constant (answers.js), never its own copy.
const NOT_OPEN = 'The vendor who posted this call does not have Collab Hub open yet. You cannot suggest anyone for this call until they do.';
const { isCollabRole } = require('./roles');
const { hubOpen } = require('../hub/gate');   // HUB-2b · Rule 1's one home

const clean = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
function okLink(u) {
  if (u == null || u === '') return null;
  try { const x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:' ? x.toString() : null; } catch (_e) { return null; }
}

async function addPartnerInterest(supabase, input) {
  const b = input || {};
  const name = clean(b.name, 120);
  if (!b.post_id || !b.partner_id || !b.send_id) throw new Error('post_id, partner_id and send_id are needed');
  if (!name) throw new Error('a name is needed');
  if (b.role != null && !isCollabRole(b.role)) throw new Error(`${b.role} is not a collab role`);
  if (/@|\d{10,}/.test(name)) throw new Error('a name may not hold an email or a phone number');
  const link = okLink(b.link);
  const { data: post } = await supabase.from('collab_posts').select('id, vendor_id').eq('id', b.post_id).maybeSingle();
  if (!post) throw new Error('no such call');
  if (!(await hubOpen(supabase, post.vendor_id))) throw new Error(NOT_OPEN);
  const found = await supabase.from('collab_interest').select('id, display_name')
    .eq('send_id', b.send_id).eq('source', 'partner');
  const same = (found.data || []).find((r) => String(r.display_name || '').toLowerCase() === name.toLowerCase());
  if (same) return { id: same.id, existed: true };
  const row = { post_id: b.post_id, source: 'partner', partner_id: b.partner_id, send_id: b.send_id, display_name: name,
    role: b.role || null, link, agreed_at: b.agreed_at || new Date().toISOString(), join_link_sent: false };
  const { data, error } = await supabase.from('collab_interest').insert(row).select('id').single();
  if (error) {
    // the unique index won a race: read the row the other call wrote
    const again = await supabase.from('collab_interest').select('id, display_name').eq('send_id', b.send_id).eq('source', 'partner');
    const hit = (again.data || []).find((r) => String(r.display_name || '').toLowerCase() === name.toLowerCase());
    if (hit) return { id: hit.id, existed: true };
    throw new Error(error.message);
  }
  return { id: data.id, existed: false };
}

module.exports = { addPartnerInterest, NOT_OPEN };
