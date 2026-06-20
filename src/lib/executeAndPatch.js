// src/lib/executeAndPatch.js
// "The screen is just another caller." A REST/CRUD write must behave EXACTLY as if
// Donna did it in chat: the hand fires AND her durable snapshot is patched from the
// confirmed outcome. The chat loop does executeRecordTool -> patchNote; the doors,
// which previously called executeRecordTool and discarded its snapshot half, now go
// through here so the snapshot stays coherent on every path (forward coherence).
'use strict';
const { executeRecordTool } = require('../engine/dist/core/tools/recordPrimitives');
const { patchNote }         = require('../engine/dist/core/donna');

async function executeAndPatch(agentId, name, input) {
  const outcome = await executeRecordTool(agentId, name, input);
  try {
    // patch from the CONFIRMED write (outcome.item / outcome.remove), exactly as the loop does.
    await patchNote(agentId, outcome);
  } catch (e) {
    // a snapshot-patch failure must never fail the write — the cells already landed.
    console.error('[executeAndPatch] snapshot patch failed (write still landed):', e.message);
  }
  return outcome;
}

module.exports = { executeAndPatch };
