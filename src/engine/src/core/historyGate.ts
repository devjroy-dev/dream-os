// historyGate.ts — TDW_06 THE DETERMINISTIC SITTING (CE ruling 2026-07-28,
// forks A-1(b) / A-2(b) / A-3). THE SD-WEEK MECHANICAL FLOOR.
//
// ── WHAT THIS GATE IS FOR ───────────────────────────────────────────────────────
// F-06.13's fan-out: a SHAPE ask ("how's the week looking — who's active?") answered
// by pulling N whole binders through `donna_history`, each one carrying an entire
// engagement's money story, payment status, phone, diary and event log back into the
// room. The 21:04:35 specimen was eight of them; Evening Four measured 2-of-5 on the
// production split WITH MONEY RIDING. CE-25 deliberately HELD the mechanical floor
// pending evidence. The evidence arrived and the founder REVERSED the hold.
//
// ── THE PREDICATE IS CHAIN-SHAPED, NOT A THRESHOLD (fork A-2(b), ruled) ──────────
// A count floor would tax CE-25's own protected case — an owner who names six
// records is owed six deep reads. So the gate never counts. It refuses exactly one
// shape: a deep read whose id was handed over by a BREADTH sweep, on a turn whose
// ask names no record and carries no provenance or write intent. Everything else is
// untaxed BY CONSTRUCTION rather than by tuning, which is why the four lawful shapes
// below are properties and not thresholds.
//
// `HISTORY_FANOUT_FLOOR = 2` in scripts/b06_gauntlet.js is the RIG's grader and is
// BYTE-UNMOVED by this cure (asserted as a pin-survival cell; b06_m1_bench:187-188
// and b06_m2_bench:380-382 pin it full-line). SD-WEEK's verdict is likewise
// untouched — it greens because the WIRE refuses, not because the grader softened.
//
// ── THE FOUR LAWFUL SHAPES (derived at read-first, chair-RATIFIED as the governing
// enumeration; each is a bench cell, each proven both-ways by mutating the shipped
// predicate). The gate returns null — the read proceeds untouched — for all four:
//
//   L1  THE OWNER NAMED THE RECORD. The ask carries the record's identity, so the
//       read's subject IS the ask's subject. `askNamesRecord` below.
//   L2  PROVENANCE — "how do you know that." The tool's own stated purpose; the
//       trail IS the answer, not a shortcut to one. `PROVENANCE_ASK_RE`.
//   L3  RECONCILIATION BEFORE A WRITE. DONNA_STATIC_PREFIX orders her to reconcile
//       "against what already exists before you write"; a gate that refused that
//       read would put the estate's cached law in contradiction with its own wire.
//       `WRITE_INTENT_RE`.
//   L4  THE ID CAME FROM A NAMED FIND. The chain narrowed before the read did.
//       `namedIds`.
//
// ── IT FAILS OPEN ON AMBIGUITY, NEVER CLOSED — AND THAT IS THE INVERSE OF EVERY
// OTHER FLOOR IN THIS BLOCK, DELIBERATELY. The provenance hold sits at the SAME
// seam (donna.ts, ahead of the write branches) and fails CLOSED, because a false
// pass there writes a fabricated figure into the record. Here the asymmetry runs the
// other way: a false REFUSAL costs the owner an answer he actually asked for, while
// a false PASS costs one fan-out that Evening Five's SD-WEEK catches. F-04.27 is
// named on this predicate's face, and its false-refusal risks are enumerated with
// their openers:
//   (a) a record named by nickname, fragment or pronoun ......... L4 carries it; else OPEN
//   (b) an owner naming six records at once (CE-25's case) ...... L1, count-blind
//   (c) provenance phrased as breadth ("how do we know any of this?") ... L2, else OPEN
//   (d) a reconciliation read whose write hand has not fired yet . L3 (ask-side intent)
//   (e) a genuinely failed read must never read as a refusal ..... F-04.62, below
//
// ── F-04.62 IS DISCHARGED IN THE PAPER'S FIRST FOUR WORDS. A deliberate refusal is
// never reported as a search failure. The two genuine failures at this hand
// (`ERROR: donna_history needs binder_id.` and `ERROR opening history: …`,
// donnaBench.ts:161/:167) are ERROR-prefixed and stay byte-unchanged; this paper
// opens `REFUSED, and this is not a failure:` and is structurally distinguishable
// from both — asserted as its own cell, both directions.
//
// ── A-3, RULED: THE PLAIN LEG IS ABSENT, NOT DORMANT. This paper is Donna-facing
// only. It authors no `plain` clause, so it CANNOT reach Victor's composer through
// Fork C and cannot reach a vendor at all (conditional-withheld discipline;
// F-04.27's caution binding). If a vendor-visible form is ever wanted it returns as
// its own ruled act on a Stage-2-style precision record.
//
// ── F-06.85, BOTH DIRECTIONS — THE SOUL SENTENCE THIS GATE NOW CONDITIONS.
// `donna.ts`'s DONNA_STATIC_PREFIX (model-visible, cache_control ephemeral) tells
// her: "every write leaves a dated line in the event trail that donna_history reads
// back." After this gate that is conditionally false — on a breadth ask over
// sweep-supplied ids it will not read back. W-1 IS SHUT this sitting, so the
// reverse pointer could not be written into the prefix (and writing it would have
// invalidated the cache window for a comment). THE POINTER IS FILED AS OWED, the
// F-06.97 precedent exactly: it is one comment in a protected string and needs a
// ruled opening, not a build. IF THAT SENTENCE IS EVER RE-AUTHORED, READ THIS FILE.

// COPY: founder-vetoed 2026-07-28 — 「 ill go with both the recomendations 」 — the
// chair's real read having handed this draft to him beside the seam label, current
// against proposed. ZERO EDITS from the vetoed bytes. Register derived from the
// seam's own shipped precedent, provenanceHold.ts:96's `HELD — …`, so the estate
// speaks one dialect where it refuses.
export const HISTORY_REFUSAL_PAPER =
  'REFUSED, and this is not a failure: the binder was not opened. The turn named no ' +
  'record, and this id came from a recents sweep rather than a search by name — so ' +
  'opening the binder whole would carry one engagement\'s entire story back to answer ' +
  'a question about the shape of the week. Take the shape from what you recognise and ' +
  'what is due. If the owner named this record, or you find it by name first, the read ' +
  'is lawful and nothing here stops it.';

// The hand's own name when it is refused. It is NOT recorded as `donna_history`,
// and the reason is mechanical, not cosmetic: every reader in the estate that counts
// `donna_history` hands (SD-WEEK's verdict first among them) means by it "a deep
// read actually happened". A refusal recorded under that name would keep the count
// and leave SD-WEEK red over a wire that refused correctly — a hollow red, the exact
// mirror of the hollow green this block exists to refuse. Recorded under its own
// name the refusal is still AMONG THE HANDS (C-1's lane cell finds it there) while
// the deep-read count honestly reads zero.
export const HISTORY_REFUSED_HAND = 'donna_history_refused';

// L2 — provenance. The tool's own description sells it as "the hand for 'how do you
// know that'"; these are that ask's plain forms.
const PROVENANCE_ASK_RE =
  /\b(how (?:do|did|would) (?:you|we|i) know|how do you know that|where did (?:that|this|it) come from|who told (?:you|us)|when was (?:it|that|this)|what changed|since when|show (?:me )?(?:your |the )?(?:sources?|working|trail|history|spine)|prove it|provenance|audit trail|reconcile)\b/i;

// L3 — write intent in the ask. A reconciliation read precedes its write, so the
// write hand cannot be the evidence; the ask is.
const WRITE_INTENT_RE =
  /\b(update|change|correct|amend|edit|set|add|append|write|record|file|log|book|block|unblock|cancel|move|mark|raise|reduce|pay|paid|receiv(?:e|ed)|settle|invoice|note down|put (?:it |that )?(?:down|on))\b/i;

// L1's fallback limb. A capitalised token that is not sentence-initial and not a
// calendar/register word reads as a NAME, and the gate opens. Deliberately generous:
// every uncertainty here must resolve toward the read happening.
const STOPWORDS = new Set([
  'i', 'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'do', 'does',
  'did', 'how', 'what', 'who', 'when', 'where', 'why', 'which', 'this', 'that', 'these',
  'those', 'harvey', 'donna', 'victor', 'operator', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april',
  'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'rs', 'inr', 'today', 'tomorrow', 'yesterday', 'ok', 'yes', 'no', 'please',
]);

export type HistoryGateContext = {
  ask: string;                        // what this segment handed Donna — the turn's ask
  breadthIds: Set<string>;            // ids returned by a BREADTH find (no search terms)
  namedIds: Set<string>;              // ids returned by a NAMED find — L4, always lawful
  knownNames: Map<string, string>;    // id -> client name, from any find payload this segment
};

export function makeHistoryGateContext(ask: string): HistoryGateContext {
  return { ask: String(ask || ''), breadthIds: new Set(), namedIds: new Set(), knownNames: new Map() };
}

// L1. The ask names a record when it carries an id outright, or the client name of a
// record the sweep surfaced, or any name-shaped capitalised token.
function askNamesRecord(ctx: HistoryGateContext): boolean {
  const ask = ctx.ask;
  if (!ask.trim()) return true;                                   // no ask to judge — OPEN
  if (/\b(?:rec|lead)-[\w-]+\b/i.test(ask)) return true;          // an id, spoken outright
  if (/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(ask)) return true;
  const lower = ask.toLowerCase();
  for (const name of ctx.knownNames.values()) {
    const n = String(name || '').trim().toLowerCase();
    if (n.length >= 3 && lower.includes(n)) return true;          // the record's own name
    const first = n.split(/\s+/)[0];
    if (first && first.length >= 3 && lower.includes(first)) return true; // its given name alone
  }
  // The generous limb: any capitalised word past the first token of a sentence.
  const sentences = ask.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const toks = s.trim().split(/\s+/);
    for (let i = 1; i < toks.length; i++) {
      const raw = toks[i].replace(/[^A-Za-z'-]/g, '');
      if (raw.length < 3) continue;
      if (STOPWORDS.has(raw.toLowerCase())) continue;
      if (/^[A-Z][a-z'-]+$/.test(raw)) return true;
    }
  }
  return false;
}

// THE GATE. Returns the refusal paper when the breadth-excess shape is present, and
// null — the read proceeds, untouched, unlogged, unchanged — in every other case.
export function historyRefusal(binderId: string, ctx: HistoryGateContext): string | null {
  const id = String(binderId || '').trim();
  if (!id) return null;                       // (e) the door's own ERROR speaks; not this gate's case
  if (ctx.namedIds.has(id)) return null;      // L4 — the chain narrowed by name
  if (!ctx.breadthIds.has(id)) return null;   // the id did not come from a sweep — OPEN
  if (PROVENANCE_ASK_RE.test(ctx.ask)) return null; // L2
  if (WRITE_INTENT_RE.test(ctx.ask)) return null;   // L3
  if (askNamesRecord(ctx)) return null;             // L1
  return HISTORY_REFUSAL_PAPER;
}

// Whether a find was a BREADTH sweep. donnaFind's own contract: "With nothing given,
// returns the most recent records" — and the zero-match fallback returns the recents
// dump too. Both are the sweep this gate keys on; a find carrying search terms is a
// NAMED find and its ids are lawful under L4.
export function isBreadthFind(input: Record<string, unknown> | null | undefined): boolean {
  if (!input || typeof input !== 'object') return true;
  for (const k of ['query', 'term', 'terms', 'name', 'client', 'phone', 'doc', 'note']) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim().length > 0) return false;
    if (Array.isArray(v) && v.some((x) => typeof x === 'string' && x.trim().length > 0)) return false;
  }
  return true;
}
