'use strict';
// src/lib/collab/joinLink.js · CE-47 · CLB-2a · THE ONE PLACE THAT DECIDES WHETHER SOMEONE GETS THE JOIN LINK.
// Only a person who wrote on a call's Instagram or Threads post may be sent /collab/join (they wrote first, so
// Meta allows one reply). A row a partner put forward NEVER gets it: TDW never contacts a partner's people (PTN's
// rule J). Every sender of the join link must ask this function first (the Hub package's sender included).
const JOIN_PATH = '/collab/join';

function joinLinkFor(row, { base = 'https://thedreamwedding.in' } = {}) {
  if (!row || row.source === 'partner') return null;
  if (row.source !== 'instagram' && row.source !== 'threads') return null;
  if (row.join_link_sent === true) return null;
  const q = new URLSearchParams();
  if (row.post_id) q.set('call', String(row.post_id));
  if (row.role) q.set('role', String(row.role));
  const qs = q.toString();
  return `${base}${JOIN_PATH}${qs ? `?${qs}` : ''}`;
}

module.exports = { JOIN_PATH, joinLinkFor };
