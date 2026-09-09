-- ─────────────────────────────────────────────────────────────────────────────
-- 0159 · R-41.142 — EVERY ASSISTANT MESSAGE CARRIES THE ROOM IT WAS ANSWERED IN
-- CE-41 seat D, D3d. Cut at dream-os 69697565f2524b9d365130a243213df98145a3d7.
-- Ladder tail derived by command immediately before allocation → 0158.
--
-- ── WHY A COLUMN AND NOT A DERIVATION ────────────────────────────────────────
-- The room a turn ran in is decided INSIDE the engine, by a precedence the door
-- does not re-run (`loop.ts:424`: override, then assert, then default). The client
-- cannot infer it: `room` travels UP on the request and nothing came back. Without
-- this column a thread reloads with no idea which room answered which turn, and
-- the pwa's seam would have to guess from a pathname — the exact thing R-41.141
-- forbade. One home: the engine decides, the door records, the glass reads.
--
-- ── NULL IS `consult`, AND IT IS NOT A GAP ───────────────────────────────────
-- The engine sets TurnResult.victor_mode to undefined in the consult room ON
-- PURPOSE (loop.ts:1073) — consult is ephemeral and keeps no estate, so it has no
-- mode to carry. NULL therefore means "answered in consult, or answered before this
-- column existed", and the pwa renders NULL UNMARKED: no chip, no edge, no seam.
-- ⚠ NEVER FOLD NULL TO 'business'. Business is the one room that carries the whole
-- estate; labelling a consult turn as business would have the glass assert that the
-- estate was in a room the engine deliberately kept it out of. Unmarked is the truth.
--
-- ── THE CHECK IS TWO WORDS, DELIBERATELY ─────────────────────────────────────
-- 'advisor' and 'business' are the only values the door can write, because they are
-- the only two `victor_mode` ever holds. `consult` is NOT in the list: it is absence,
-- and admitting it as a string would invite a fourth room to appear without anyone
-- deciding it should — 0156's reasoning, which caught R-41.133 the day it was ruled.
--
-- PROVENANCE: engine.messages ← the engine's own schema; the door already reads
-- `id, role, content, created_at` from it (src/api/vendor-engine/chat.js:3433) and
-- patches by `result.assistant_message_id` (:2410). Read by command at the cut.
-- ─────────────────────────────────────────────────────────────────────────────

alter table engine.messages
  add column if not exists room text
    constraint messages_room_check
    check (room is null or room in ('advisor', 'business'));

comment on column engine.messages.room is
  'R-41.142: the room this message was answered in, from TurnResult.victor_mode. NULL means consult (the engine leaves victor_mode undefined there, deliberately) or a row written before this column existed. The pwa renders NULL unmarked — never folded to business, which is the only room carrying the estate.';

-- The thread read filters by conversation and orders by time; the room is a
-- projection, never a predicate. No index: adding one for a column nothing filters
-- on would be a cost with no reader (F-40.190's shape in the other direction).
