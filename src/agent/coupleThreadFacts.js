'use strict';
// src/agent/coupleThreadFacts.js  FACT 1: HAS THIS CLIENT SPOKEN WITH THE STUDIO BEFORE. CE-45 ELZ-1 cut 1 (§11 rule 1; F-44.125).
//
// THE MECHANISM F-44.125 NAMED (the read-first, from his 24 September export): the couple turn's history is ten minutes and five
// rows wide (engine.js VENDOR_SESSION_IDLE_MS, HISTORY_LIMIT), and "returning" means only a NAMED lead for the exact phone. So a
// couple who replied twenty minutes after Eliza's question, or after a relay, met an empty history and the first-contact branch:
// "Hi Sarah! I'm Dev Roy's assistant" and the same question, three times in two days. The history window is NOT widened (the turn's
// cost and its F-06.x cures stand); this reads the thread's WHOLE record for three facts only:
//   inConversation  any row on this thread before the message in hand (a relay row counts: §11 rule 1, "including a couple
//                   replying to a message relayed in the vendor's name")
//   priorCount      how many (to the read's ceiling)
//   since           the first row's day, IST, as a person says it
//   lastAsked       the most recent message Eliza (sent_by 'agent') sent, so she does not ask it again
// The message in hand is the newest inbound row whose body is what she sent (the door writes it before the turn); it is dropped
// once, not every row with the same words. TOTAL: never throws. On a failed read the fallback is the turn's own history: anything
// in it means in conversation.
const CEILING = 200;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function istDay(ts) {
  try {
    const t = Date.parse(ts);
    if (!Number.isFinite(t)) return null;
    const d = new Date(t + 330 * 60 * 1000);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch (_e) { return null; }
}

// Pure: rows newest first, as the read returns them. Exported for b117a.
function factsFromRows(rows, inboundBodyAsStored) {
  const list = Array.isArray(rows) ? rows.filter((r) => r && typeof r === 'object') : [];
  let dropped = false;
  const prior = [];
  for (const r of list) {
    if (!dropped && r.direction === 'inbound' && r.body === inboundBodyAsStored) { dropped = true; continue; }
    prior.push(r);
  }
  const lastAgent = prior.find((r) => r.direction === 'outbound' && r.sent_by === 'agent' && typeof r.body === 'string' && r.body.trim());
  const oldest = prior.length ? prior[prior.length - 1] : null;
  return {
    inConversation: prior.length > 0,
    priorCount: prior.length,
    since: oldest ? istDay(oldest.created_at) : null,
    lastAsked: lastAgent ? lastAgent.body.trim() : null,
  };
}

async function threadFacts({ supabase, conversationId, inboundBodyAsStored, historyLength = 0 }) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('direction, body, sent_by, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(CEILING);
    if (error || !Array.isArray(data)) throw new Error('thread read failed');
    return factsFromRows(data, inboundBodyAsStored);
  } catch (_e) {
    const n = Number.isInteger(historyLength) && historyLength > 0 ? historyLength : 0;
    return { inConversation: n > 0, priorCount: n, since: null, lastAsked: null };
  }
}

module.exports = { threadFacts, factsFromRows, istDay, CEILING };
