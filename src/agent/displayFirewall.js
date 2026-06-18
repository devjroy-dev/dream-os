// src/agent/displayFirewall.js
// THE PUBLICATION FIREWALL (server-side). Every beat that leaves the vendor SSE
// wire passes through translateBeat() first, so the operator's name (Kriya) and
// the raw tool vocabulary (kriya_*) NEVER cross to a client -- not in a field, not
// in an event-type string, not in result prose. The DB and the /chat JSON path
// stay RAW (honest engineering record + dev/eval debugging); only this public
// surface is translated. Mirrors dreamai's displayDictionary, adapted to TDW:
// the MANAGER (Myra) is the face and is SHOWN; only the OPERATOR (Kriya) is hidden.

'use strict';

const { KRIYA_READ_NAMES }     = require('./kriyaRead');
const { KRIYA_CALENDAR_NAMES } = require('./kriyaCalendar');

// A hand's category -- non-sensitive (read/write/calendar reveals no architecture),
// so the surface can say "searched" vs "filed" without ever seeing a tool name.
function kindOf(name) {
  if (KRIYA_READ_NAMES.has(name))     return 'read';
  if (KRIYA_CALENDAR_NAMES.has(name)) return 'calendar';
  return 'write';
}

// Body scrub -- collapse the operator's name + tool tokens wherever they appear in
// displayed text. Myra (the face) is deliberately NOT scrubbed.
const SCRUBS = [
  [/\bkriya_[a-z_]+\b/gi, 'operator tool'],
  [/\bKriya\b/g, 'Operator'],
  [/\bkriya\b/g, 'Operator'],
];
function scrub(text) {
  if (!text) return '';
  let out = String(text);
  for (const [re, rep] of SCRUBS) out = out.replace(re, rep);
  return out;
}

// Translate one raw engine beat into its safe public beat. Returns null to drop.
function translateBeat(e) {
  if (!e || !e.type) return null;
  switch (e.type) {
    case 'myra_token':
      // The manager's prose, streamed live. Her soul hides the operator, so her
      // own words never name it; kept as text_delta (the live wire contract).
      return { type: 'text_delta', text: e.text };
    case 'dispatch':
      return { type: 'handoff', from: 'manager', to: 'operator', message: scrub(e.message) };
    case 'kriya_action':
      // Name DROPPED. kind (read/write/calendar) + scrubbed result only.
      return { type: 'operator_action', kind: kindOf(e.name), detail: scrub(e.result) };
    case 'kriya_report':
      return { type: 'operator_report', message: scrub(e.message) };
    case 'answer':
      return { type: 'answer', reply: scrub(e.reply) };
    case 'thinking':
      return { type: 'thinking' };
    default: {
      // Unknown beat -- pass through but scrub every string field defensively.
      const safe = {};
      for (const k of Object.keys(e)) safe[k] = typeof e[k] === 'string' ? scrub(e[k]) : e[k];
      return safe;
    }
  }
}

// done.tool_calls used to carry raw kriya_* names. Replace with safe kinds.
function safeStepKinds(toolCalls) {
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls.map((tc) => kindOf(tc && tc.name)).filter(Boolean);
}

module.exports = { scrub, translateBeat, safeStepKinds, kindOf };
