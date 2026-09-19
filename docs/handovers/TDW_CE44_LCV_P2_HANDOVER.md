# repo: dream-os @ 0675964ce5a4680ee8ed9a6483e17ef7092b2fd1 (base) · dreamos-pwa @ c82753a1eb32527ec5622d9aef28275679d83764
# TDW · CE-44 · SEAT LCV-1 · LC-VICTOR P2 · THE SILENT LISTENER · HANDOVER

**Rung b86.** Code, so it verifies on the founder's own floor end to end
(`run-floor.sh --delivery scripts/floor-manifest-ce44-lcv1-p2.txt --check`); the floor he runs is the
witness of record.

## 1 · What P2 is

**A listener hears every vendor message in the working rooms and records what it understood, and
nothing the vendor reads changes by one byte.** On WhatsApp and in the TDW chat's working room, after
each reply has been sent and stored, the listener hears her message with the recent thread and
returns her tasks and lookups as a structured request. The door writes that request into the reply
row's `meta`. That is all. At P4 onward the door acts on the request; P2 only listens, so the walk can
show what the listener hears on real traffic before anything depends on it.

## 2 · The rulings, in the founder's words

- **R-44.14**: *"listener haiku- / operator-deepseek / code-code / vendor ai assistant to bride
  (Eliza)-haiku / Codespaces-deleted"*. **R-44.15**: *"ill go with your lean on this CE"* (one
  listener, and it has no hands).
- **R-44.16**: *"no"*. The relay draft stays with the operator on DeepSeek; `composeBody` at
  `src/lib/vendor/relaySeat.js:441` is untouched in seat and in code.
- **R-44.17**: *"yes. let the business mode run as it is running today. any advice that is asked, the
  estate handles it today. it continues getting handled the samee way."* Before it, his reasons: *"i
  dont think people or vendors will ask for advice on whatsapp lane in any case. See, a vendor would
  see the pwa-advisory room and would know. whatsapp as a channel exists for business. so in
  hindsight, id rather not have that router coding complication. I feel itll be unnecessarily
  burdensome because now we will have to keep a tab with the model is categorising as advice and what
  is a task."* R-44.5, R-44.6 and R-44.8 are withdrawn (R-44.8's two bytes approved and unused). **No
  advice classification exists anywhere.** `ADVISOR_ON_WHATSAPP` and R-VS.4's refusal stand as they are.
- **R-44.18**: *"I think option 1 is better than option 2 because my 60 something examples are merely
  what we could come up with. There can be a million more."* and *"Option 1 is One. Victor leaves the
  working rooms completely. This is option two, and it's what you've just described. Only code speaks
  there. With Victor gone, a whole layer of machinery can be deleted: the relay between the two AIs,
  the fuse for when they argue, and the checker that watches his prose for invented figures. There is
  nothing left to watch. Each message costs one AI call, and every reply comes from the records."* At
  P5 only the door speaks in the working rooms, with his leftover line
  `I didn't catch a task in that. You can say things like:` and two examples drawn at random from his
  approved batch of ten (the batch, byte by byte, and the two team lines PENDING his word, are in the
  read-first's §17). *"for the examples, we will not use swati name."* **None of R-44.18 is P2's to
  build.**
- **R-44.19**: *"Advisor doesn't stay blind to numbers. He won't be able to advise then. Advisor has no
  power tp write today. Only read. What's an advisor who can't see the clients estate"*. P8 is required:
  a door-built note behind a gate. The chair's correction of fact beside it: the adviser does **not**
  read the estate today (loop.ts:453, :454 and every estate read gated on it); P8 builds sight, it does
  not preserve it (read-first, item 5).
- **The panel name**: *"listen-yes"*, read as yes to **Listener**.

## 3 · How it runs, and why this way

**After the wire closes, never before it.** `recordListening()` is called only once the reply has been
sent and stored, fire-and-forget, deferred with `setImmediate`, as `fireHarvest` already is:

- the TDW chat, SSE route: after `res.end()`;
- the TDW chat, JSON route: scheduled on both of its return paths (the guard's intercept and the
  normal reply), so it runs only after `res.json` has handed the response off;
- WhatsApp: after `sendWhatsApp`.

It is bounded at 15 seconds and never throws. **The advisor room is never heard.**

**Why not in parallel with `runTurn`** (the chair's record): `getOrCreateConversation` **creates** a
conversation when none is active (memory.ts:35 to :82), so a parallel call could race `runTurn` into a
split thread. Heard afterwards, the listener reads the thread from `result.conversation_id` up to but
**excluding** the current exchange, and never touches a conversation. The only cost is that `meta`
lands a second or two after the reply, which nothing reads live.

**Its only writes:** `{ listener: { lane, provider, model, request, error? } }` merged into the `meta`
of the row `runTurn` named (`TurnResult.assistant_message_id`), never overwriting what is there; and one
`engine.usage` row with `conversation_id` NULL, **written through harvest's own writer**
(`src/agent/harvest.js`, exported as `_meter`). chat.js:3295 to :3303 counts rows with a non-null
`conversation_id` as the turn cap, and today's chain row always counts the turn, so **each turn is
counted once**. Routing through harvest's writer keeps the estate's law that there are exactly two
usage-write homes, loop.ts and harvest.js (`tdw10_combined_cap_bench` cell 3.1).

**The request** (tool schema, `ear_request` the only tool, forced): `route` (task, search, none) and
`acts[]`, each with `act`, `client_as_spoken`, `amount_rupees` (minimum 1; F-44.40), `date_as_spoken`
(F-44.38), `milestone`, `missing[]`. **No `advice_part`** (R-44.17).

## 4 · Files

| Path | Change |
|---|---|
| `src/lib/modelRouter.js` | `'listener'` joins `VENDOR_ROLES`; its split (`listener_provider`, `listener_model`) is parsed, allow-set-guarded and key-guarded exactly as Donna's, a keyless split dropped with the other guards still running; unset, it follows the lane's primary. The advisor lane offers no listener switch, since the listener never runs there. |
| `src/api/admin/modelRoutes.js` | `ROLE_FIELDS.listener`, the drift filter, and one chained filter admitting the listener's fields and stamps. The unknown-field regex that b63's M24 mutates is left byte for byte as it was. |
| `src/agent/harvest.js` | **Additions only (4 lines):** `module.exports._meter = { harvestMeterRow, writeHarvestUsage }`, the writer the listener meters through. |
| `src/lib/vendor/listenerDoor.js` (new) | `recordListening()` and `hear()`: the thread, the forced tool, the request, the two writes. |
| `src/api/vendor-engine/chat.js` | **Additions only (15 lines, 0 removed):** the require, `listenAfterWire()`, and its three calls after each reply path. |
| `src/lib/vendorInbound.js` | **Additions only (3 lines, 0 removed):** one deferred call after `sendWhatsApp`. |
| `scripts/lib/p1_ear_rig.js` | P1's rig as it ran, outside the floor's glob (F-44.41). |
| `scripts/b86_lcv_p2_bench.js` | Rung b86. |
| `scripts/floor-manifest-ce44-lcv1-p2.txt` | The delivery's own file table. |
| `docs/handovers/TDW_CE44_LCV_READFIRST.md` | R-44.16 to R-44.19 recorded; the Eliza reading withdrawn; item 5 ruled with the correction of fact; §17. |
| `docs/handovers/TDW_CE44_LCV_P2_HANDOVER.md` | This file. |

**Not touched:** `src/lib/pwaPaths.js`, `src/lib/victorLines.js`, `src/lib/vendor/relaySeat.js`. R-44.8's
bytes enter no file.

## 5 · W-1: NONE

No `src/engine/src/**` file, no soul, no lens. The listener reads `engine.messages` and writes
`engine.messages.meta` through the door's own client, and meters through harvest's usage writer. It
does not use the engine's memory exports at all. b86's W-1 cell fails if any engine source, soul or lens path differs from base.

## 6 · What b86 pins

The router role and its split rules; the admin fields; the schema (no advice, route task/search/none,
amount minimum 1, dates as spoken); the forced single tool; the thread handed over without the current
exchange; every failure (provider error, 15-second bound, no call) recorded, never thrown; `meta`
merged, never overwritten; the stored content never updated; one uncounted usage row; nothing written
when there is no named row; **not one line of today's removed from either lane file, and the listener
called only after each reply path, deferred, never awaited, never in the advisor room**; W-1; the three
untouched files; the rig's home; the listener holding no usage-write of its own; b63's M24 anchor
intact. Four mutations each redden the cell guarding them: a listener call moved before the reply, a
counted usage row (harvest's writer mutated), an overwritten `meta`, and `advice_part` restored.

**Found by the floor and cured before delivery.** The first full floor of this build came back two
reds over the named base: `tdw10_combined_cap_bench` (cell 3.1: a third usage-write home, the
listener's own insert) and `b63_mutations` (M24's anchor, the unknown-field regex this build had
edited, no longer matched). Both were this delivery's and both are cured as above; standalone, tdw10
reads 37/37 and b63 30/30.

## 7 · What stays out, recorded as design

The door running hands from the request, the act-to-hand table, the ordering chain, the dependent-act
line, the confirmation table, the leftover line and its batch (P5), and the silencing of W1 to W6 and
A1 to A3 with the deletion R-44.18 names. P2's read-first §2 and §3 stand as design for P4 and P5,
minus every advice clause.

**The operator on the working surfaces keeps exactly one job: composing the relay draft** (the only
caller of `runDonnaTurn` besides loop.ts:931, which leaves when the door takes the hands). E-1, E-4 and
CE-98 stand for her.

## 8 · The walk card (P2), in plain words

1. **The switch.** After the panel cut lands, set **Listener → Haiku** on each vendor lane on the admin
   switchboard. Until then the listener follows each lane's main model.
2. **Ordinary messages on both lanes**, on WhatsApp and in the TDW chat, fragments included ("full",
   "Send it", a date on its own). **Every reply should be exactly what you get today.** Nothing new
   appears.
3. **One read-only SELECT**, which this seat walks you through: for each of those messages, your
   sentence beside what the listener recorded. That table, on real messages with the conversation in
   hand, is F-44.39's proof and the evidence P4 waits on. No Codespaces secrets are needed: the
   production service already holds the keys.
4. **The cost SELECT**: what a turn costs today, from the ledger, walked with it.

## 9 · Errors owned

- **e-7.** Twice this sitting I stopped a running floor mid-pass, against `run-floor.sh`'s own Lesson 3.
  The second stop left `src/agent/brideTools.js` mutated in a throwaway copy of the tree: a bench's
  restore never ran. Nothing delivered was touched (the source tree's dirt was re-proved equal to the
  manifest and the ZIP byte-equal to it), and the copy was discarded. From here no floor of this seat
  is stopped once started.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
