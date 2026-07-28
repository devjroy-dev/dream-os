// snapshotTypes.ts — the shape of an item in Donna's durable snapshot note.
// Shared by the tools (which build an item from the row they just wrote) and
// donna.ts (which patches the note with it). One item = one open/near thing
// Harvey should see at a glance.

export type SnapshotItem = {
  id: string;        // stable key: "lead:<uuid>" | "claim:<uuid>" | "money:<uuid>"
  kind: 'lead' | 'claim' | 'money' | 'payment_due' | 'loop';
  text: string;      // the declarative line Harvey reads (never a question)
  status: 'unverified' | 'confirmed' | 'overdue' | 'open';
  horizon: string | null; // ISO date when it matters by, if dated
  ref_type: string;  // source table: 'leads' | 'facts' | 'money_entries' | 'open_loops'
  ref_id: string;    // the row's uuid
  // TDW_04 engine-lane (ST-3b, absorbed 02-HOTFIX-2): twin-annotation match keys.
  // OPTIONAL — items written before this sitting lack them; snapshotText falls back
  // to the name prefix of `text` (both registers open with the person's name).
  // phone_key is the last-10-digit key (engine phoneKey.ts, the PWA's twin); name is
  // the person's name as written. Annotation-only — these fields never drive a write.
  name?: string | null;
  phone_key?: string | null;
  // ── TDW_06 M-1 · P1, shape (b2) — THE ARRIVAL CLOCK ON THE SNAPSHOT ────────────
  // F-06.25: Harvey pre-loads snapshotText every business turn (loop.ts:272) and can
  // answer "anything new?" off it without ever dispatching — 3 of the walk's 4 runs did
  // exactly that, in 1–2 seconds, tool_calls null. The snapshot was ordered newest-first
  // and carried no clock, so it wore the identical disease as the reads one layer up.
  //
  // WHY A FIELD AND NOT A DATE BAKED INTO `text` (the ruled fork, b2 over b1): `text` is
  // FROZEN at write time and read back turns — or hours — later. A relative form frozen
  // into it is a lie the moment it is read ("35 minutes ago", six hours on), and even an
  // absolute one cannot be re-rendered if the register ever moves. The clock is DATA;
  // it renders at READ time, in snapshotText, like every other honest stamp in the estate.
  //
  // OPTIONAL, on phone_key's own precedent above: items written before this sitting lack
  // it, and a line with no arrival renders WITHOUT one rather than with a guess. Note the
  // asymmetry that buys — it is deliberate: a half-dated snapshot is only safe because the
  // undated lines are legacy and drain out on the next rebuild, and because a missing
  // stamp is silence, never "old". ISO 8601 as stored; the render is today.ts's business.
  arrived_at?: string | null;
  // ── TDW_06 · F-06.97 — THE MOVEMENT CLOCK, arrived_at's sibling (CE R-3) ──────────
  // rebuildSnapshot (donna.ts:114) has ordered this note by `updated_at` since ST-3a and
  // has never once selected or rendered it: the twelve lines Harvey pre-loads every
  // business turn are sorted by movement and worded in arrival. Same disease as the reads
  // one layer up (donnaFind's :449/:473), same cure, same register.
  //
  // OPTIONAL, on arrived_at's own precedent above and for its own reason: items written
  // before this sitting lack it, and a line with no movement stamp renders WITHOUT one
  // rather than with a guess. The asymmetry is legacy and drains out on the next rebuild;
  // a missing stamp is silence, never "untouched". ISO 8601 as stored; the render is
  // today.ts's business, at READ time, exactly as b2 ruled for the arrival clock.
  touched_at?: string | null;
};

// A tool execution returns a human-readable line for Harvey AND, when it wrote
// something, the snapshot item to patch in (or a removal marker). `remove` lets a
// write drop an item from the snapshot (e.g. a claim that just got confirmed and is
// no longer "unconfirmed").
// A row as the owner's shell renders it in the carousel. Donna's find produces
// these; they ride the turn back as the `view` the peek bar opens. Read-only —
// the shell never writes; meaning (confirmed vs claimed) is derived where shown.
export type ViewRow = {
  id: string;
  client: string | null;
  direction: 'in' | 'out' | string | null;
  amount: number | null;
  amount_received: number | null;
  amount_pending: number | null;
  payment_status: string | null;
  date: string | null;
  stage: string | null;
  note: string | null;
  doc_ref: string | null;
  phone: string | null;
  hidden?: boolean | null;
};

export type ToolOutcome = {
  display: string;
  item?: SnapshotItem | null;     // upsert this item into the note
  remove?: string | null;         // remove the item with this id from the note
  found?: ViewRow[];              // rows a READ surfaced — the turn's view payload
  // ── TDW_06 FORK C · R-8's CARRIER (CE-99 sitting, 2026-07-28) — THE PLAIN CLAUSE.
  // `display` is what DONNA reads. `plain` is what VICTOR'S COMPOSER may be handed
  // beside her voiced sentence at loop.ts:710. They are NOT the same string and the
  // difference is the whole cure.
  //
  // WHY (F-06.102, minted this sitting): CE-99's Fork C premise held that the payload
  // was already unlabeled plain speech "since CE-94's receipt". True of the RECEIPT —
  // `notWrittenNote`'s "the city stays Kochi (you said Goa)" carries no machinery at
  // all. FALSE of the DISPLAY that carries it: donnaLead's update line ships
  // `(id=<uuid>)`, the raw column-key join (`wedding_city, wedding_date`) and the
  // typed-lead binder clause. Handing Victor `display` would deliver F-06.52's
  // machinery-donor under CE-94's name, and F-04.66's raw ids with it.
  //
  // FAIL-CLOSED BY CONSTRUCTION (R-8, ruled): the Fork C seam reads `plain` AND ONLY
  // `plain`. THERE IS NO FALLBACK TO `display`. A door that has not authored a plain
  // clause contributes NOTHING to Victor's payload — silence, never a scrubbed
  // machinery string. That absence IS the cure: a fallback would re-admit F-06.102's
  // disease through the back door on every door not yet upgraded, and a post-hoc
  // regex laundering of `display` into "plain speech" is the same disease wearing the
  // cure's uniform (the §2.4 lesson, and F-04.27's value-invariance risk on its face).
  //
  // WHAT MAY GO IN IT: owner-meaningful plain speech only. Zero tool names, zero
  // `id=`, zero uuids, zero column keys, zero binder-machinery clauses, zero framing
  // headers — asserted mechanically, both directions, in b06_f0692_bench. Write-class
  // doors contribute their refusal/standing-value clause family; read-class doors
  // contribute their ARRIVAL-STAMP line only (recognition-grade — never rows, never
  // money, never phones: F-06.13's re-entry door stays welded shut, ruled at R-2).
  plain?: string | null;
};
