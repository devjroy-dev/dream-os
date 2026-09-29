// src/lib/vendorSearch.js · DESIGN-1 · THE UNIVERSAL SEARCH, the matcher (the founder and the chair, stage 3).
//
// One box at the top of every tab finds her own records by kind. This is the one home of HOW a record matches; the door
// (src/api/vendor/search.js) decides WHICH rows are hers. Pure, no I/O, so the bench drives it directly.
//
//   · names forgive spelling variants: Priya/Priyaa, Aggarwal/Agarwal (doubled letters), ph/f, w/v, ee/i, oo/u, and one
//     slip in a word of five letters or more;
//   · every word she types must match a word of the record (so "priya agarwal" narrows, never widens), by its start;
//   · a couple is found by either partner's name or the wedding's name: "Priya & Rohan", "Priya and Rohan", "Priya weds
//     Rohan" are three words each, so either name finds them;
//   · four or more digits match a phone number anywhere in it, the last four included; spaces, dashes and +91 ignored.
'use strict';

const KINDS = Object.freeze(['enquiries', 'clients', 'events', 'invoices', 'packages', 'notes', 'crew']);
const PER_KIND = 5;
const MIN_PHONE_DIGITS = 4;

function plain(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
function words(s) {
  return plain(s).split(/[^a-z0-9]+/).filter(Boolean);
}
// the spelling fold: the same name spelt two common ways folds to one key
function fold(w) {
  return String(w)
    .replace(/ph/g, 'f').replace(/w/g, 'v').replace(/ee/g, 'i').replace(/oo/g, 'u')
    .replace(/([a-z])\1+/g, '$1');
}
function digits(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }

// one slip (insert, delete, change or swap two neighbours), for words long enough to carry it
function oneSlip(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0; while (i < la && i < lb && a[i] === b[i]) i += 1;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

// how well one typed word matches one record word: 3 exact, 2 start, 1 a variant or a slip, 0 not at all
function wordScore(q, w) {
  if (w === q) return 3;
  if (w.startsWith(q)) return 2;
  const fq = fold(q), fw = fold(w);
  if (fw === fq || fw.startsWith(fq)) return 1;
  if (fq.length >= 5 && (oneSlip(fq, fw) || (fw.length > fq.length && oneSlip(fq, fw.slice(0, fq.length))))) return 1;
  return 0;
}

/** Parse what she typed: the words, and the digits when it reads as a number. */
function parseQuery(q) {
  const text = String(q == null ? '' : q).trim();
  const d = digits(text);
  const isNumber = d.length >= MIN_PHONE_DIGITS && /^[\s+()\-.\d]+$/.test(text);
  return { text, words: isNumber ? [] : words(text), digits: isNumber ? d : '' };
}

/** Score one record against the query. rec: { text: [strings], phones: [strings] }. 0 means no match. */
function scoreRecord(parsed, rec) {
  if (parsed.digits) {
    let best = 0;
    for (const p of rec.phones || []) {
      const pd = digits(p);
      if (!pd) continue;
      if (pd.endsWith(parsed.digits)) best = Math.max(best, 3);
      else if (pd.includes(parsed.digits)) best = Math.max(best, 2);
    }
    return best;
  }
  if (!parsed.words.length) return 0;
  const recWords = [];
  for (const t of rec.text || []) recWords.push(...words(t));
  if (!recWords.length) return 0;
  let total = 0;
  for (const q of parsed.words) {
    let best = 0;
    for (const w of recWords) { const s = wordScore(q, w); if (s > best) best = s; if (best === 3) break; }
    if (!best) return 0;
    total += best;
  }
  return total;
}

/** Rank each kind's records and keep the best PER_KIND. records: { kind: [{ id, title, sub, text, phones, ... }] } */
function search(q, records) {
  const parsed = parseQuery(q);
  const groups = [];
  if (!parsed.digits && !parsed.words.length) return { groups };
  for (const kind of KINDS) {
    const rows = (records && records[kind]) || [];
    const hits = [];
    for (const r of rows) {
      const s = scoreRecord(parsed, r);
      if (s > 0) hits.push({ s, r });
    }
    hits.sort((a, b) => b.s - a.s || String(a.r.title).localeCompare(String(b.r.title)));
    if (hits.length) {
      groups.push({ kind, total: hits.length, items: hits.slice(0, PER_KIND).map(({ r }) => ({ id: r.id, title: r.title, sub: r.sub || null, ref: r.ref || null })) });
    }
  }
  return { groups };
}

module.exports = { KINDS, PER_KIND, MIN_PHONE_DIGITS, fold, words, parseQuery, scoreRecord, wordScore, search };
