// src/lib/turnLock.js — TDW_05 THE COUPLE-LANE MECHANICAL ARC, M1. F-05.41's cure.
//
// THE FINDING, witnessed end-to-end in the Railway log at the CE-65 seal evening:
// "yeah" and "Is my haldi" landed 1.1 seconds apart on ONE bride thread. Two
// classifier lines, two concurrent full agentic turns, two add_booking calls 300ms
// apart (rows 8c6570b0 · 851c262a, both ok:true, both 45000), two delivered replies.
// Each turn was individually truthful. The estate held Rs 90,000 for one Rs 45,000
// yes. RF-1 correctly did NOT fire: the wamids were distinct, the messages were
// distinct, the dedupe was right about everything it was asked. The missing floor
// was never dedupe — it was that nothing anywhere made one human's turns wait for
// each other.
//
// ── THE MECHANISM, derived at 5f2a79b and identical on BOTH lanes ────────────
//
//   brideIndex.js:158  app.post('/webhook/meta', ...)   ─┐  byte-for-byte the
//   index.js:166       app.post('/webhook/meta', ...)   ─┘  same shape:
//
//       verify signature
//       res.status(200).send('ok')        ← the HTTP turn ENDS here
//       for (msg of normalizeMetaInbound(body)) { await process*Inbound(...) }
//
// Within ONE request the loop is already serialized by its own `await`. The race is
// ACROSS requests: Meta delivers each inbound as its own POST, and the early 200
// releases the event loop with the turn still running. Two messages 1.1s apart are
// two requests, and nothing joins them. THE VENDOR LANE SHARES THIS ANATOMY EXACTLY
// — it is not witnessed there only because nobody has yet typed twice into it in one
// second. Leaving one lane racy while curing the other would be a knowing half-cure.
//
// ── THE RULED SHAPE (founder-ratified, CE-67; his words: "ill go wth your lean") ──
//
// PER-CONVERSATION IN-MEMORY SERIALIZATION — a promise chain, so one human's
// messages process one behind the other. Coalescing was REJECTED as primary: it
// answers the second message with the first message's reply, which is a different
// product decision wearing a bug fix's clothes.
//
// ── THE SINGLE-REPLICA GAP, DISCLOSED IN FULL (F1(b)'s precedent, CE-58) ─────
//
// This lock lives in ONE process's memory. It serializes turns within a replica and
// CANNOT serialize across replicas. Today both services run single-replica on
// Railway, so the lock is total; the day a service scales to two, two replicas hold
// two independent chains and F-05.41's race returns for any pair of messages that
// happen to land on different instances. THE DURABLE CURE (an advisory lock in
// Postgres, keyed on the same string) IS DEFERRED-NAMED, not forgotten: it is one
// function swap at this one home, and this comment is where whoever scales the
// service will find that out. F1(b) shipped its in-memory limiter under exactly this
// disclosure and the estate ratified the form.
//
// NOTE ON SCOPE: this lock's disclosure covers THIS LOCK ONLY. confirm-consumed-once
// (M2, inside the money guard) carries its own sentence about its own replica
// exposure — two mechanisms, two disclosures, no borrowed cover (CE-67, F4).
//
// ── WHY THE KEY IS THE LANE-SCOPED PHONE AND NOT THE CONVERSATION ID ─────────
//
// The ruling says per-conversation. At the seam where the lock must sit, the
// conversation does not exist yet: both cores RESOLVE the conversation from the
// phone, several awaits deep (brideInbound's user->couple->conversation chain;
// vendorInbound's user->vendor->thread chain, which can resolve to more than one
// thread for one phone — the vendor's own thread and any TDW-routed couple thread).
// Resolving it early to key the lock would put a database round-trip in front of the
// lock and re-open the race inside the resolution itself.
//
// The lane-scoped phone is therefore the key, and it is STRICTLY SAFER than the
// conversation id, never laxer: one phone owns every conversation it can reach on a
// lane, so phone-keying serializes a SUPERSET of what conversation-keying would. It
// costs concurrency between one human's two threads on one lane — which at three
// test accounts is no cost at all, and at scale is one human waiting for their own
// previous message. It cannot cost correctness. Stated rather than quietly adapted.
'use strict';

// key -> the promise that settles when the last queued turn on that key finishes.
// Entries delete themselves when their chain drains, so the map is bounded by the
// number of CONCURRENTLY ACTIVE conversations, never by the number ever seen.
const _tails = new Map();

// The key. Lane-scoped so a makeup artist planning her own wedding — one number on
// both lanes, the P4 case — does not have her vendor turn wait behind her bride turn.
function turnKey(service, phone) {
  return `${service}:${String(phone == null ? '' : phone)}`;
}

// Run `fn` after every turn already queued on `key`, and before every turn queued
// after it. Returns fn's own promise: the caller sees fn's result and fn's rejection,
// unchanged. A rejected turn NEVER blocks its successor — the chaining promise
// swallows outcomes so one thrown turn cannot wedge a conversation forever (the
// dead-letter path is how a thrown turn is recorded; a wedged chain would be a worse
// bug than the one this file cures).
function withTurnLock(key, fn) {
  const prev = _tails.get(key) || Promise.resolve();
  const run  = prev.then(() => fn(), () => fn());
  const tail = run.then(() => {}, () => {});
  _tails.set(key, tail);
  tail.then(() => { if (_tails.get(key) === tail) _tails.delete(key); });
  return run;
}

// Test hooks. `_size` is what the bench asserts against to prove the map does not
// grow without bound — an in-memory structure with no reaping is a leak, and a leak
// in the inbound path is an outage with a delay fuse.
function _reset() { _tails.clear(); }
function _size()  { return _tails.size; }

module.exports = { turnKey, withTurnLock, _reset, _size };
