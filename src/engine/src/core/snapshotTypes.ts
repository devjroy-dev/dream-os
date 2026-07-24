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
};
