'use strict';
// src/lib/vendor/couplePriceState.js · CE-46 · ELZ-3 · THE PRICE SWITCH FOR ELIZA (the founder's ruling of 29 September 2026, through the chair).
// With her switch (vendors.price_share_enabled) ON and a starting price set (vendors.rate_min, the figure her public card already shows),
// Eliza answers WHENEVER the client asks about price, on every lane, never volunteered, with the founder's sentences, composed HERE in code:
//   S1  "Packages start from Rs {rate_min}. The final price depends on your date and what you need; {studio} will confirm."
//   S2  "The {package name} package is Rs {total}. The final price depends on your date and what you need; {studio} will confirm."
//       S2 only when her words contain the package name's own words (case-folded; the chair's P1 (a)) and that package's total is at or above
//       rate_min; a tie between packages, or a total below rate_min, falls to S1.
// Switch off, or rate_min null or 0: 'off' / 'unpriced', and today's refusal stands (the prompt is byte-unchanged when off; see
// coupleSystemPrompt.js). rate_display does not gate the chat; price_share_enabled does. THE GUARD (priceGuard): with the switch on, a reply
// naming a rupee figure other than rate_min, a quotable matched total, or a figure the client wrote herself is refused in code.
// TOTAL: every function answers, never throws.

const S1 = 'Packages start from Rs {from}. The final price depends on your date and what you need; {studio} will confirm.';
const S2 = 'The {package} package is Rs {total}. The final price depends on your date and what you need; {studio} will confirm.';

// the house form (hard rule 11): Rs and Indian grouping, e.g. Rs 1,50,000
function inr(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v <= 0) return null;
  const s = String(v);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3); const rest = s.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}
const words = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
const STOP = new Set(['and', 'with', 'the', 'a', 'an', 'of', 'for', 'one', 'every']);

// her price facts, read fresh from the rows (a caller's vendor object may be partial)
async function priceFacts(supabase, vendorId) {
  try {
    if (!supabase || !vendorId) return { enabled: false, rateMin: null, packages: [] };
    const { data: v, error } = await supabase.from('vendors').select('id, price_share_enabled, rate_min').eq('id', vendorId).maybeSingle();
    if (error || !v) return { enabled: false, rateMin: null, packages: [] };
    const rateMin = Number.isFinite(Number(v.rate_min)) && Number(v.rate_min) > 0 ? Math.round(Number(v.rate_min)) : null;
    const enabled = v.price_share_enabled === true;
    let packages = [];
    if (enabled && rateMin) {
      const { data: rows, error: e2 } = await supabase.from('vendor_packages').select('id, name, total, deleted_at').eq('vendor_id', vendorId).is('deleted_at', null);
      if (!e2 && Array.isArray(rows)) packages = rows.filter((r) => r && typeof r.name === 'string' && r.name.trim() && Number(r.total) > 0).map((r) => ({ name: r.name.trim(), total: Math.round(Number(r.total)) }));
    }
    return { enabled, rateMin, packages };
  } catch (_e) { return { enabled: false, rateMin: null, packages: [] }; }
}

// is the switch effective for this turn (the prompt reads this)
const priceOn = (f) => !!(f && f.enabled === true && Number(f.rateMin) > 0);

// the package her words name: every content word of the package's name present in her words; the one with the most such words wins; a tie is none
function matchPackage(askedText, packages) {
  try {
    const said = new Set(words(askedText));
    const hits = (Array.isArray(packages) ? packages : []).map((p) => { const w = words(p.name).filter((x) => !STOP.has(x)); return { p, n: w.length, ok: w.length > 0 && w.every((x) => said.has(x)) }; }).filter((h) => h.ok);
    if (!hits.length) return null;
    const best = Math.max(...hits.map((h) => h.n));
    const top = hits.filter((h) => h.n === best);
    return top.length === 1 ? top[0].p : null;
  } catch (_e) { return null; }
}

// the tool's answer: the state and, when priced, the one sentence to send as it is
function priceState({ facts, askedText, studio }) {
  try {
    if (!facts || facts.enabled !== true) return { state: 'off', sentence: null, allowed: [] };
    if (!(Number(facts.rateMin) > 0)) return { state: 'unpriced', sentence: null, allowed: [] };
    const from = facts.rateMin;
    const m = matchPackage(askedText, facts.packages);
    const name = String(studio || 'The studio');
    if (m && m.total >= from) {
      return { state: 'priced', match: m, sentence: S2.replace('{package}', m.name).replace('{total}', inr(m.total)).replace('{studio}', name), allowed: [from, m.total] };
    }
    return { state: 'priced', match: null, sentence: S1.replace('{from}', inr(from)).replace('{studio}', name), allowed: [from] };
  } catch (_e) { return { state: 'unpriced', sentence: null, allowed: [] }; }
}
// the fact handed back to her: the sentence to send, or why there is none. Never a number of its own.
function priceStateFact(r) {
  if (r && r.state === 'priced' && r.sentence) return `state: priced\nsend this sentence as it is, in its own message or as your reply: ${r.sentence}`;
  return `state: ${r && r.state === 'off' ? 'off' : 'unpriced'}\ndo not give any figure; the price is ${'the studio'}'s to confirm.`;
}

// every rupee figure written in a text, as whole rupees ("Rs 1,50,000", "₹50000", "50,000 rupees", "1.5 lakh")
function figuresIn(text) {
  const out = []; const t = String(text || '');
  const re = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|lac|l|k|cr|crore)?|([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|lac|k|cr|crore|rupees)\b/gi;
  let m;
  while ((m = re.exec(t))) {
    const num = Number(String(m[1] || m[3]).replace(/,/g, '')); const unit = String(m[2] || m[4] || '').toLowerCase();
    if (!Number.isFinite(num)) continue;
    const mult = /^(lakh|lakhs|lac|l)$/.test(unit) ? 100000 : /^(cr|crore)$/.test(unit) ? 10000000 : unit === 'k' ? 1000 : 1;
    out.push(Math.round(num * mult));
  }
  return out;
}
// the guard: with the switch on, a reply naming a figure outside rate_min, a quotable matched total or the client's own words is refused.
// Returns null to let the reply go, or { refused: [figures] } for the caller to replace it.
function priceGuard({ facts, reply, allowed, clientText }) {
  try {
    if (!priceOn(facts)) return null;
    const ok = new Set([...(Array.isArray(allowed) ? allowed : []), facts.rateMin, ...figuresIn(clientText)].map((x) => Math.round(Number(x))).filter(Number.isFinite));
    const bad = figuresIn(reply).filter((f) => !ok.has(f));
    return bad.length ? { refused: bad } : null;
  } catch (_e) { return null; }
}

module.exports = { priceFacts, priceOn, priceState, priceStateFact, matchPackage, priceGuard, figuresIn, inr, S1, S2 };
