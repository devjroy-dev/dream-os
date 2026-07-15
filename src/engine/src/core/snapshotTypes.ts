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
