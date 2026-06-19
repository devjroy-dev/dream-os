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

// Manager mode: she IS the face, so her NAME must survive — only raw tool tokens are
// scrubbed (hygiene), never the operator-name replacement. Two-agent mode still uses
// the full scrub above, which also hides the hidden operator's name.
function scrubToolsOnly(text) {
  if (!text) return '';
  return String(text).replace(/\bkriya_[a-z_]+\b/gi, 'operator tool');
}

// Translate one raw engine beat into its safe public beat. Returns null to drop.
function translateBeat(e, mode) {
  if (!e || !e.type) return null;
  // Manager mode keeps her name; two-agent mode hides the operator. Tool tokens are
  // scrubbed in both.
  const sc = mode === 'manager' ? scrubToolsOnly : scrub;
  switch (e.type) {
    case 'myra_token':
      // The manager's prose, streamed live. Her soul hides the operator, so her
      // own words never name it; kept as text_delta (the live wire contract).
      return { type: 'text_delta', text: e.text };
    case 'manager_token':
      // Manager mode: her own prose, streamed live. She IS the face — her name is hers,
      // never scrubbed to "Operator".
      return { type: 'text_delta', text: e.text };
    case 'manager_action':
      // Manager mode: her own hand. Same wire shape as operator_action so the frontend
      // working-spine renders unchanged; tool tokens scrubbed, her name untouched.
      return { type: 'operator_action', kind: kindOf(e.name), detail: scrubToolsOnly(e.summary || '') };
    case 'dispatch':
      return { type: 'handoff', from: 'manager', to: 'operator', message: scrub(e.message) };
    case 'kriya_action':
      // Name DROPPED. kind (read/write/calendar) + scrubbed result only.
      // detail is the tool's OWNER-FACING summary (authored at the source), never
      // the raw display dump (which carries UUIDs/IDs for the operator's own memory).
      // No summary yet -> empty detail; the trace then shows the bare action line.
      return { type: 'operator_action', kind: kindOf(e.name), detail: scrub(e.summary || '') };
    case 'kriya_report':
      return { type: 'operator_report', message: scrub(e.message) };
    case 'answer':
      return { type: 'answer', reply: sc(e.reply) };
    case 'thinking':
      return { type: 'thinking' };
    default: {
      // Unknown beat -- pass through but scrub every string field defensively.
      const safe = {};
      for (const k of Object.keys(e)) safe[k] = typeof e[k] === 'string' ? sc(e[k]) : e[k];
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
