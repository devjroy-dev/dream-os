# CE-45 · ELZ-1 · CUT 2a · THE KNOWN CLIENT, THE VENDOR TOLD, THE BRIDE'S STOP ON RECORD, V1 TO V8 · HANDOVER

Base eb3fe0a (cut 1c). Ruled by the chair on 25 September 2026 (cut 2's read-first, F1: 2a then 2b). No model is measured in this cut.

## 1 · What shipped

F-44.165 (src/agent/engine.js): the known-client read (isReturningBride) and capture's existing-lead read both filter deleted_at and read the
newest live row (.is('deleted_at', null).order('created_at', desc).limit(1).maybeSingle()). DEV440 held seven rows for +919625759924, six
soft-deleted; .maybeSingle() over seven errored to null, so Sarah (named, booked) was a stranger to Eliza, and a capture from her number
INSERTED ANOTHER LEAD (the second face, minted into F-44.165's record).
THE VENDOR HEARS THE HOUSE FORM (the chair's ruling; his line F4, line 1): when a turn's last date_state read is anything but "free", the
turn's vendor notification carries his sentence, recognised client or not: "{client} asked if you're free on {date}. I told them you'd
check and get back to them. To answer, send "Tell {client}" and your message." ({client} the lead's name, else "...NNNN"; {date} "5 March
2028", or her words when unreadable). The line's home is src/lib/vendor/coupleDateState.js (VENDOR_DATE_LINE, vendorDateLine), hash-pinned
in b118a; the helpers dateLineFor and withDateLine sit outside runCoupleAgenticTurn.
F-44.145's persistence half (src/lib/brideInbound.js): persistBrideOptOutTurn, the twin of vendorInbound's persistOptOutTurn, writes her
STOP or START and our confirmation to her couple_self thread; it creates nothing and never throws; called at both acknowledgments.
R-45.23's V1 to V8 (src/lib/vendor/doorLines.js): B4, B5, B25, B32, B33, B39, B60, B76 as he tabled them, re-hashed; B33 gains {package}
and the attach plan carries pkg.name to the no-fee refusal (src/lib/vendor/workingDoor.js, two lines; the money functions untouched).
V9 TO V16 MOVED TO CUT 2b (the seat's sequencing, recorded): their bytes end "Reply with the number", and a bare number is read only once
2b's note machinery lands, so no line asks for what the door cannot yet read.

## 2 · Proof

b118a 21/21 (reads no real clock): §1 over his seven rows (the returning branch reached; two live rows read the newest; a capture with the
live row unnamed updates and inserts nothing; only-deleted is a stranger); §2 his bytes pinned, a booked date notifies, a free date does not,
an unreadable date with no lead reads "...9924" and her words; §3 both rows on couple_self with their sids, no user writes nothing, a dead
store never throws, both call sites; §4 the eight bytes, LINE_HASHES consistent, B33 naming the package, V9 on untouched; §5 the money
functions against b115's pins; §6 M1 to M4 each red, files restored.
Re-aimed by label: b06_relay_foundations, b08_p5_eliza, b08_p5_unblock, b117a, b117m (their store doubles learn .is and a chainable
limit; what they prove is unchanged); b111 2.2 (brideInbound re-pinned); b115 (runCoupleAgenticTurn re-pinned, the cap 770 to 800).
RE-CUT AFTER e-136 (the chair's bounce): the first cut's differential counted b90 as identical because it crashed on both sides (no
src/engine/dist in the seat's container). A-45.11 applied: the engine built in both trees. Every old byte and hash of B4, B5, B25, B32, B33,
B39, B60 and B76 grepped across scripts/* and src/**: twelve benches held them and are re-pinned by label (R-45.23, V1 to V8): b90, b92,
b93, b95, b97, b98, b99, b101, b104, b105, b106, b107. The only remaining mention is doorLines.js's history comment for B33, marked superseded.
The differential on eb3fe0a over 60 benches (every bench reading engine.js, brideInbound.js, coupleDateState.js, doorLines.js or
workingDoor.js, plus the twelve and b118a), engine built both sides: 58 identical; b118a absent at the base and green on the cut; b107
caught the seat's own stale blob pin (doorLines.js edited after pinning) and is re-pinned to c1b4905477fc. Two benches are red on both sides
with the SAME failing cells and no error (A-45.11 read): b05_p4_crons (§5.3, §6.5) and b07_f0772_circle_auth (§12.14); pre-existing.

## 3 · Walk record

To be recorded: a date question from the test couple reaching DEV440's WhatsApp in his words; a capture from 9625759924 adding no leads
row; a bride STOP on the bride line written to her couple_self thread (then START); one of V1 to V8 spoken.

## 4 · Open

Cut 2b: P6b's app lane, quote_send with the fact check (F2) and quoted_at (F3), V9 to V16 with B8, B10, B23, B61 as notes (F5).
F-44.170 after cut 2, as the chair sequences it.
