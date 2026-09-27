# repo: devjroy-dev/dream-os @ 6034c10 · TDW CE-46 · IGD-2 · CUT 2b HANDOVER (Eliza answers Instagram DMs)

Built on 7b4c036, carried by command onto dc1dfd1 (ELZ-2 cut 1 r2) and then onto the chair's named base 6034c10 (ELZ-2 cut 2, the
prompt cache): each overlap of this cut's 12 paths with what landed was empty by name; package-lock.json identical; the patch
against 6034c10 is byte-identical to the patch against dc1dfd1, and engine.js's turn signature and return did not move. Lands before G6-2's 2b, per the chair's landing order.

## What this cut does

A couple's Instagram DM to a vendor whose lane is open is recorded (as since 2a-i) and now answered by Eliza, dark until the chair's
word. In order, for one new couple message (not Meta's retry, not an echo), under the thread's turn lock (F1 (a)):

- no text (a sticker, a photo, a story reply): recorded, no turn;
- her switch (vendor_ig_connections.dm_state 'on') and a usable token: the only gates on Instagram (Q2 = 1);
- STOP and START (Q1 = 1, F-44.193): the whole-message matcher; STOP sets conversations.ig_stopped_at (0175) and sends IG-S1;
  START clears it and sends IG-S2 only when it was set; while it is set, no turn;
- the quiet time (Q4): her own reply (an echo, sent_by 'vendor') younger than vendors.reply_quiet_minutes means no turn;
- the turn, with counterparty { channel 'instagram', phone null, igsid }, the persona path and the studio's WhatsApp link as a fact
  (F6 (b), vendorCard.js's enquireLinkFor call); igReply.turnInput is the ONE place that shape is written;
- outside 24 hours (F2 (a)+(b)): nothing sent or recorded as sent, logged, and V2 to her TDW WhatsApp;
- the send: one POST per splitReply part, each part's message_id in message_sid on its own outbound row (F-44.192), so our own echo
  drops on the UNIQUE; if our echo lands first it is claimed back as the agent's (claimOutbound); no studio prefix;
- the vendor's notice (the turn's V1/V1b) through sendVendorEnquiryAlert, scrubbed as on WhatsApp.

A throw is dead-lettered as service 'instagram' and the couple gets webhookCore.GRACEFUL_TURN_LINE (its one home; Q7 pending, so the
current byte stands and his answer lands at webhookCore.js :66 without a re-cut). failedTurns.js refuses to replay an Instagram dead
letter (replay_refused_instagram); the admin discards it; the DM is already on its thread (F7 (a)).

0175_ig_dm_stop.sql: one nullable column, conversations.ig_stopped_at; no table, RLS and grants untouched. Rehearsal
scripts/lib/b136r_0175_rehearse.sh, 12/12 on a throwaway Postgres 16: service_role writes, reads and clears it; anon and
authenticated refused; RLS still on.

## Proof

- b136: 38 cells GREEN at the cure; `--mutate` 12 of 12 production mutations redden their named cells (in memory, nothing on disk).
  At the uncured tree it is RED by a missing module (igReply.js), not by its cure cells; the mutations carry the both-ways proof.
- Differential at 6034c10 (the record): 41 benches, radius re-derived by command at the base, engine built, 6034c10 against the
  cure. Exits identical in all 41; the same 7 pre-existing reds both sides; PASS lines 1109 = 1109; the six attributed outputs plus
  one layout line (b07_f0772's base side printed its no-sibling skip because the base worktree sat outside the sibling's folder;
  same exit, pre-existing red).
- Floor at 6034c10, dreamos-pwa 5833b4f1 as the sibling with node_modules (preflight), keys unset (A-46.4), `run-floor.sh --delivery
  scripts/floor-manifest-ce46-igd2-cut2b.txt --check`: FLOOR = NAMED BASE, no delta (refusals, not in base: 3: b06_gauntlet,
  bf1_bride_tool_fidelity_bench, test-shape, the key-gated three); declared files unmoved, set and contents verified.
- 0175's rehearsal: 12/12 (re-run at dc1dfd1; 0175 and its rehearsal are unchanged since).
- The same differential and floor were also run at dc1dfd1 with the same results (superseded by the tip's move).
- Earlier (superseded, kept for the record): differential 41 benches, base 7b4c036 against the cure, with
  src/engine/dist built (A-45.11; the first run lacked it, e-170, and was discarded). Exits identical everywhere (7 pre-existing reds
  both sides: b07_f0772, b07_p4b, b10_p1, b10_p2, b10_p3, b51, b5b); PASS lines 1109 = 1109 (A-45.12). Output changes attributed: b119 1.3 re-aimed by label; b10_p1, b10_p2, b10_p3
  print the ladder's new top (their pre-existing reds unchanged); b14_d1 walks one more src file; b91 lists 0175 with 0 public tables.
- b136 reads no real clock (every time is injected), so shifted clocks cannot move it (C-44.13), stated rather than run.

## Declared, for the chair

- D1 RULED yes: STOP is honoured even inside the quiet time and its acknowledgment sent; with her switch off, nothing on the lane runs, STOP
  included.
- D2 RULED (chair, 27 September 2026): turnInput passes the counterparty { channel 'instagram', phone null, igsid } and enquireLink
  only; the turn reads the persona path from counterparty.channel; couplePhone and coupleId are the turn's own defaults. Pinned at
  the cut: at dc1dfd1 (unchanged at 6034c10) the landed signature carries enquireLink INSIDE the counterparty (engine.js :217 to :236), so turnInput passes
  counterparty { channel 'instagram', phone null, igsid, enquireLink }. b136 5.1 and 5.2 hold it (M11 and M12 redden them).
- D3 claimOutbound's claim-back of an early echo is this seat's completion of F-44.192's cure.
- D4 during the quiet time no turn runs, so no vendor notice is sent (she is in the conversation herself).

## Ruled after the build

- A (chair, 27 September 2026): V2 stands and SUPERSEDES IGD-1's C12 ("C12 told when it lapses", seat-close §4). C12's bytes exist on
  no tree and in no record the chair holds; the founder's verbatim yes to V2 on 27 September is the later and only recorded word.
  COPY.V2 in igReply.js is its one home.
- B (chair, 27 September 2026): this cut carries no measure. Every word on the lane is the turn's, so the Instagram replay rides
  ELZ-2's measure of the channel-aware turn (b117m on the instagram channel), named in ELZ-2's handover. A-46.1 binds nothing here.

## Not in this card

- 0175 is NOT applied by this card. The lane is dark (laneOpen), so no code reads ig_stopped_at until a vendor is allowlisted. Its
  one SQL block and its read-only checks (with a control) come with the dark walk's card, on the chair's written word.

## Owed

- F-44.208 (enquireLinkFor's two callers build the TDW link differently): its own later fix.
- F-44.194 (the account id) and E3 (which secret): the dark walk's first DM.
- The dark walk (HELD): the read-first's plan, on the chair's written word.

## Disclosed

- e-168: b136's M7 was first written with a syntax error; the harness counted it GREEN (BAD), it was rewritten and reddens.
- e-169: a differential runner started detached died with its turn; nothing was lost, it was re-run in foreground slices.
- e-170: the first differential ran without src/engine/dist (A-45.11, IGD-1's e-148 class, found on reading its seat-close);
  discarded and re-run with the engine built. Same six attributed outputs; no exit changed.

## Carried

- IGD-1's seat-close, byte for byte: docs/handovers/TDW_CE45_IGD1_SEAT_CLOSE.md (R-40.95).
