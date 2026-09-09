# CE-41 · SEAT D · D3d (dream-os) — the room comes back · HANDOVER

**Cut at** dream-os `69697565f2524b9d365130a243213df98145a3d7`. Migration **`0159`**. **Zero engine bytes.**

## 1 · The return leg

`room` has travelled **up** since F-41.98 and nothing came down, so the client could never know which room answered. This is the return leg, and the value is **the engine's own** — `TurnResult.victor_mode`, resolved at `loop.ts:424` by a precedence the door does not re-run.

**One home:** the engine decides, the door reports, the glass reads. Never re-derived from the request's assertion, which is only what was *asked for*, not what happened — a seam drawn from the request would appear even on a turn the engine had overridden.

**Both transports or neither.** The stream's `done` event and the non-stream JSON reply carry the same field. A client that got it from one and not the other would draw a seam that appears and vanishes with the transport.

## 2 · NULL is `consult`, and it is not a gap

The engine leaves `victor_mode` undefined in the consult room **on purpose** — consult is ephemeral and keeps no estate. So NULL means *answered in consult, or answered before this column existed*, and the pwa renders it **unmarked**.

**Never folded to `business`.** Business is the one room that carries the whole estate; labelling a consult turn as business would have the glass assert the estate was in a room the engine deliberately kept it out of. `0159`'s CHECK admits **two words** and `consult` is not one of them — absence is the value.

## 3 · The read path is in scope from the start

**F-41.103 and F-41.104 were both a cure landing on a write path and not its read**, and both were caught by a walk rather than the floor. So `§3` asserts the history query **selects** `room` *and* the map **carries it out** — selecting then dropping it is the same defect with an extra step.

## 4 · The row is written by the id the engine witnessed

`recordMessageRoom` keys on `result.assistant_message_id`, never on *"the newest row for this conversation"*, which races every concurrent turn. **No id → it writes nothing rather than guessing one**, the position `patchComposedReply` already takes. **A failure never fails the turn:** the reply has been given, and losing the room costs a hairline on reload while throwing would cost the answer.

## 5 · Two of my own cells were wrong before they were right

`1.2` forbade `body.room` **anywhere** and convicted `chat.js:3213` — the door's `roomAssert`, which is F-41.98's design and must stay. Scoped to the response legs; `1.2b` now guards the assertion itself.

`read()` **threw** on the missing migration at an uncured tree instead of failing — zero failures, no verdict. Guarded. **Third bench this sitting** to need seat A's close-note §6.

## 6 · The founder's steps

1. Apply, verify, push. 2. **Run `0159`.** 3. Nothing changes on the glass until the pwa half lands — the field rides the wire and sits in the column, unread.

**`COPY.advisorThreadNote` is retired in the pwa half**, with its reason: one thread now crosses rooms, so *"starts a fresh conversation each time"* stops being true.

**Range F-41.106–F-41.107 unspent.**
