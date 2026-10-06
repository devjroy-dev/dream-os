'use strict';
// src/lib/collab/events.js · CE-47 · CLB-2a · "A CALL WAS MADE", for whoever needs to know (PTN's sends first).
// onPostCreated(fn) adds a listener; postCreated(info) calls each one after the call, its roles and its first-look
// time are written. A listener that throws or rejects is logged and never fails the vendor's post.
// info = { post_id, vendor_id, city, event_date, pay_kind, source, roles: [{ role, needed }], first_look_until }.
const listeners = [];

function onPostCreated(fn) {
  if (typeof fn !== 'function') throw new Error('onPostCreated needs a function');
  listeners.push(fn);
  return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}

async function postCreated(info) {
  for (const fn of listeners.slice()) {
    try { await fn(info); } catch (e) { console.warn(`[collab:events] a post-created listener failed: ${e && e.message}`); }
  }
}

function _reset() { listeners.length = 0; }

module.exports = { onPostCreated, postCreated, _reset };
