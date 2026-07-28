// relaySeam.ts — TDW_06 THE DETERMINISTIC SITTING (CE ruling 2026-07-28, fork B-2(α)).
// THE ONE HOME of the relay's deed seam: the marker, the structured refused-fact
// contract, the contradiction predicate, and the strip every per-mouth arm uses.
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────────
// SD-REL, 3-for-3 then intermittent across four evenings: Donna's voiced relay
// echoes the DISPATCH back as the outcome while the honest receipt sits in her own
// hand. CE-94 made the honest sentence PRODUCIBLE at the door (F-06.92); Evening
// One proved producible is not SPOKEN on the cheap hand; CE-100's Fork C carried
// the receipt to Victor's composer; Evening Four proved the residual is a coin-flip
// that is ARCHITECTURE-INDIFFERENT (L1's Haiku hand echoed the same night). Path A
// is the founder's answer: machinery that cannot flip a coin.
//
// ── THE SHAPE, AND THE HONESTY LAWS IT IS BUILT INSIDE ──────────────────────────
// On a DETECTED echo-over-refusal contradiction the door's own already-vetoed
// sentence is APPENDED to her relay, after a visible seam. Three laws bind it:
//
//   1. NO SILENT REWRITE OF A MODEL'S WORDS. Her sentence is verbatim-FIRST and
//      byte-exact; nothing of hers is edited, reordered or dropped. The addition is
//      the DOOR's attributable sentence — the composedTail/deed-line precedent,
//      thrice shipped (F-04.41's cure put model prose and the door's line in ONE
//      persisted field, and the founder's own screens witnessed it).
//   2. THE SEAM IS A NAMED CONSTANT WITH ONE HOME, imported by the composer AND by
//      every per-mouth arm's extraction. The arms judge HER MOUTH ALONE by
//      stripping at the seam (F-04.78's geometry, F-06.86/91's per-mouth corpus):
//      an appended honest tail must never acquit a fabricating relay, and
//      `stripDeedTail` is the mechanism that guarantees it. A second copy of this
//      string anywhere is the F-04.36 class and would silently un-blind the arms.
//   3. THE PREDICATE READS STRUCTURED FIELDS, NEVER PROSE (F-06.102's law). The
//      refused facts arrive as `{ field, stands, said }` from the door's own
//      already-evaluated guards. There is NO regex over a display string, and there
//      is no inference fallback: a hand with no `refused` array can never be
//      detected, and its relay ships BYTE-UNTOUCHED. Fail-OPEN by construction,
//      exactly as `plain`'s own fail-closed law is fail-closed by construction.
//
// ── THE COVERAGE BOUNDARY, STATED AS LAW (fork B-3, ruled; A2's premise corrected
// at read-first). This guard's coverage is REFUSED-BEARING hands, and `refused` is
// NOT `plain`. At this commit:
//     `refused` is authored at TWO sites — donnaLead.ts's two single-match returns.
//     `plain`   is authored at THREE — donnaLead.ts ×2 AND donnaFind.ts's arrival
//               line (plainArrival). Conflating them would claim coverage this
//               guard does not have.
// Everywhere else the seam FAILS OPEN: the voiced text ships byte-identical and no
// tail is composed. THE DAY A NEW DOOR EARNS A `refused` ARRAY IT HAS EXTENDED THIS
// GUARD — read this file before authoring it, and add its site to the count above.
//
// ── F-06.85, BOTH DIRECTIONS — THE ARMS THIS SEAM CONDITIONS ────────────────────
// `b06_gauntlet.js`'s `relayMouths` (the ONE home of the per-mouth corpus, three
// call sites) now strips at RELAY_DEED_SEAM before judging. SD-REL's verdict is
// BYTE-UNTOUCHED (CE-91's don't-re-aim-the-grader precedent) — it greens on a
// detected echo because the WIRE changed, not because the grader did. IF THIS
// CONSTANT, THE APPEND FORM, OR THE PREDICATE CHANGES, RE-READ `relayMouths` AND
// SD-REL's verdict BEFORE SHIPPING; they are conditioned on these bytes and would
// otherwise fail silently, which is the class F-06.85 exists to prevent.

// THE SEAM. Newline + em-dash lead-in, so the door's sentence is visibly a second
// voice on the wire and never reads as a continuation of hers. COPY: founder-vetoed
// 2026-07-28 (「 ill go with both the recomendations 」), variant V1 of the two the
// chair handed him side by side. The door's own sentence that follows is his
// already-vetoed `notWritten` bytes (2026-07-28, unchanged) — his word this round
// was owed on the TRAVEL, not the words, and it was given.
export const RELAY_DEED_SEAM = '\n— from the file: ';

// The structured refusal, authored at the door from the guard conditions it has
// ALREADY evaluated. Zero second-home derivation (fork B-1(a); (b) refused on
// F-04.36's class). `field` is owner-meaningful and never a column key.
export type RefusedFact = {
  field: string;  // 'name' | 'city' | 'wedding date' | 'referrer' — owner words, not columns
  stands: string; // what the record holds, as the owner would hear it
  said: string;   // what this dispatch asked for, as the owner would hear it
};

const norm = (s: string): string => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// THE CONTRADICTION PREDICATE. A relay contradicts its own receipt when it asserts
// the value the door REFUSED and does not name the value that STANDS. Both limbs
// are required, and the second is what keeps an honest relay honest: the shipped
// honest fixture speaks "her record holds Jaipur, 5 March 2027 … were not written",
// which carries `stands` and is therefore never a contradiction, however many
// refused facts the hand returned.
export function echoedRefusals(voiced: string, refused: RefusedFact[] | undefined | null): RefusedFact[] {
  if (!Array.isArray(refused) || refused.length === 0) return []; // fail OPEN: no structure, no detection
  const v = norm(voiced);
  if (!v) return [];
  return refused.filter((f) => {
    const said = norm(f && f.said);
    const stands = norm(f && f.stands);
    if (!said || !stands) return false;      // a half-formed fact never convicts
    if (said === stands) return false;        // not a refusal at all
    return v.includes(said) && !v.includes(stands);
  });
}

// THE APPEND. Her bytes first, verbatim; the seam; the door's sentence. Idempotent
// by construction — a text already carrying the seam is returned untouched, so no
// second pass can double a tail onto a relay.
export function appendDeedTail(voiced: string, doorSentence: string): string {
  const tail = String(doorSentence || '').trim();
  if (!tail) return voiced;                       // nothing to say, nothing appended
  if (voiced.includes(RELAY_DEED_SEAM)) return voiced;
  return `${voiced}${RELAY_DEED_SEAM}${tail}`;
}

// THE STRIP the per-mouth arms use. Everything from the seam onward is the DOOR's
// speech and belongs to no model's mouth; what precedes it is hers, byte-exact.
export function stripDeedTail(text: string): string {
  const s = String(text || '');
  const i = s.indexOf(RELAY_DEED_SEAM);
  return i < 0 ? s : s.slice(0, i);
}
