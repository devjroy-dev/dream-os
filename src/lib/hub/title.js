'use strict';
// src/lib/hub/title.js · CE-47 · HUB-2d · A CALL'S TITLE, ONE HOME.
// The founder's walk (8 Oct 2026): under Mine his calls read "A call", because the Hub sent only `details` and his calls
// have none. Today's room titles a call by its role: "Decor needed" (dreamos-pwa lib/vendor/collabFormat.ts fmtType,
// its derivation for a requirement type: underscores to spaces, each word capitalised). Every place the Hub names a
// call reads this: her calls, the calls she applied to, the shoots she is asked to confirm, and "Worked with" lines
// (Mine and the public page). More than one role reads "Decor and photography needed".
const typeWord = (k) => String(k || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** post: a collab_posts row (its requirement_type is the fallback); items: its collab_post_items rows, in order. */
function callTitle(post, items) {
  const keys = [];
  for (const it of (items && items.length ? items : [{ requirement_type: post && post.requirement_type }])) {
    const k = it && it.requirement_type; if (k && !keys.includes(k)) keys.push(k);
  }
  if (!keys.length) return 'A call';
  const w = keys.map((k, i) => (i ? typeWord(k).toLowerCase() : typeWord(k)));
  return `${w.length > 1 ? `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}` : w[0]} needed`;
}

module.exports = { callTitle };
