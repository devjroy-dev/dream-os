// elizaSoul.js — ELIZA. The couple-facing concierge on a VENDOR'S line.
//
// ═══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════
// F-08.52. `src/agent/coupleSystemPrompt.js` instructed the live couple-facing
// agent, at TWO sites (`:30` and `:130`), to "never mention that you are an AI."
// That contradicts S-2 — the founder's own ruling that the concierge never
// volunteers being AI and never lies when asked — and it contradicts the TDW
// Manual's own honesty section. It was live on a shipped surface, reaching real
// couples on real vendors' lines, through the whole of the honesty arc that was
// built to kill exactly this class.
//
// This file is the replacement's character. The lie is not patched out; the
// person who would never have told it is authored in.
//
// ═══ THE NAME (LOG:2821, the founder's words verbatim) ═══════════════════════
//   「 THE COUPLE AGENT FOR BOOKINGS AND QUERY WILL BE ELIZA 」
// S-3's fallback was 'Mira' and CE-65 superseded it: Mira is TDW's own agent,
// the bride's side always, plus the marketing voice. Eliza is the Concierge
// default — the vendor's side by design. `vendors.assistant_name ?? ELIZA`,
// per-vendor rename surviving. The column shipped at 0080 and had ZERO readers
// until this file; this module is its first.
//
// ONE HOME, the miraSoul.js / waNumbers.js discipline: the literal 'Eliza' is
// declared here once and imported everywhere. No site hardcodes it, so no site
// can drift from it.
//
// ═══ THE FORM (F-PORT (C), CE-65's precedent) ════════════════════════════════
// A CJS soul module, not a port into the TS engine. LD-5 governs the FORM of
// authoring, not the filesystem. The couple lane is zero-coupled to the engine
// at the prompt seam and stays that way.
//
// ═══ FORK 2, CE-RULED (c)-NOW-(d)-SHAPED — AND THE ARITHMETIC BEHIND IT ══════
// The banked Phase-4 fork was: where does a PER-VENDOR assistant name live
// relative to a cached static prefix? Measured at bfcb88e, by command, on the
// prompt this file replaces:
//     first-contact composed prompt   6,787 chars  ≈ 1,885 tokens
//     returning composed prompt       2,079 chars  ≈   578 tokens
// Anthropic's minimum cacheable prefix is 2,048 tokens (the estate's own number
// — TDW_06 spec §P5.2 and §P5.5, where Donna's 1,961-token soul sat under it).
// BOTH branches are UNDER the floor. There is nothing cacheable on this lane at
// ANY name placement, and at three test accounts a per-vendor cache is warm
// approximately never.
//
// SO: no cache breakpoint ships this phase — zero tokens spent chasing a cache
// that cannot pay. But the FILE is authored in arm (d)'s shape: ELIZA_SOUL below
// is NAME-FREE and SHARED — no assistant name, no studio name, no category, no
// city, not one interpolation. Every per-vendor byte is assembled in the shell
// (`coupleSystemPrompt.js`). The day turn-volume justifies caching, the
// breakpoint is ONE LINE at the shell's assembly and not a soul rewrite.
//
// ═══ LD-5, HELD ══════════════════════════════════════════════════════════════
// Every passage below is WHO SHE IS with the WHY attached. There is no rules
// list here and no forbidden-phrase fence: you can game a fence, never a reason
// (harveySoul v6's own law). The bench asserts BEHAVIOUR and the seam — never
// these words.
//
// ═══ FORK 7, CE-RULED: BOTH BRANCHES ════════════════════════════════════════
// One soul, two modes. The returning bride gets the same character with more
// context, not a second character — "WHEN YOU ALREADY KNOW HER" below is that
// passage. Curing first-contact alone would have left the honesty defect exactly
// where trust is highest: on the woman who has already written once.
//
// ═══ THE VETO, RECORDED ══════════════════════════════════════════════════════
// Founder delegation 「 im ok with the draft but i think youll know it better 」,
// chair veto pass 2026-08-04: the soul PASSES VERBATIM, byte-frozen at 7,213.
// ELIZA_ADMISSION is candidate (C), SEALED as the vetoed byte. Candidate (A)
// refused as opener-shaped; (B) refused as situationally-presumptive for a
// static byte. The 06 spec's own suggested line — "she sees every word the
// moment she's free" — is SUPERSEDED and filed as a doc-gap: it is an
// AVAILABILITY CLAIM, the exact class the same spec forbids two sections later
// and the class "WHAT IS NOT YOURS TO SAY" below exists to refuse.
//
// ═══ THIS COMMIT CARRIES THE CEILING AND NOTHING ELSE ═══════════════════════
// THE CONST-INDEPENDENCE LAW (CE-190) IN ITS FIRST BIRTH APPLICATION. The prose
// this file exists for — ELIZA, ELIZA_SOUL, ELIZA_ADMISSION, HONESTY_RULE and
// ELIZA_SOUL_VERSION — lands in the NEXT commit, from the second ZIP of this
// pair. Nothing imports this module yet, so this commit changes no behaviour on
// any wire; that is the point. At THIS commit the cap is the freshly ratified
// law and the prose has not arrived. At the NEXT, the prose fits a cap that
// predates it. Never a number holding the hand of the text that needed it.
//
// IF YOU ARE READING THIS FILE AND IT STILL HAS NO SOUL IN IT, the second ZIP
// was not applied. Apply it; do not author prose here to fill the gap.

// ── THE CEILING ─────────────────────────────────────────────────────────────
// THE CONST-INDEPENDENCE LAW (CE-190), THIRD APPLICATION AND THE FIRST AT A
// SOUL'S BIRTH: "a ceiling that moves in the same commit as the prose it caps is
// not a cap. It is a label riding its own cargo." `SOUL_CHAR_CEILING` moved
// SEVEN times on the marketing lane, travelling with the text every time, which
// is how 12,007 shipped over a ratified 11,750 with a green bench.
//
// SO THIS NUMBER ARRIVED FIRST. It ships in its OWN COMMIT, ahead of the prose
// it caps, in the file's const-only birth form; ELIZA_SOUL lands in the next.
// At commit one the cap is the freshly ruled law and the prose has not arrived;
// at commit two the prose fits a cap that predates it. Never a number that
// appeared holding the hand of the text that needed it — and Eliza is born on
// the right side of the law her predecessor paid seven moves to write.
//
// RATIFIED at 7,500 (chair veto pass, 2026-08-04). THE ARITHMETIC:
//   MEASURED 7,180 characters — the soul as vetoed, byte-frozen.
//   HEADROOM     320 — ~4.5%: wide enough that a copy tweak lands without
//                      moving the const, tight enough that the bench cell means
//                      something on day one.
//
// ⚠ §0.2 — THE UNIT IN MY OWN RATIFY REQUEST WAS WRONG, AND IT IS CORRECTED
// HERE RATHER THAN CARRIED. The veto packet stated "MEASURED: 7,213 characters"
// and 7,500 was ratified against that sentence. 7,213 is the UTF-8 BYTE count of
// the draft file (`wc -c`); the soul carries 16 multi-byte characters — em
// dashes and en dashes — so `ELIZA_SOUL.length` is 7,180. The estate's
// convention is `String.length`: the bench cell reads `.length`, and the
// marketing lane's own ratified 13,817 is `CLOSER_SOUL.length` (its byte count
// is 13,881). The RATIFIED NUMBER IS UNAFFECTED — 7,180 <= 7,500 either way,
// and headroom is 320 rather than 287, which is looser than ratified and never
// tighter. The prose is byte-identical to the vetoed draft, verified by diff.
// Recorded because a ratification whose stated measurement was in the wrong unit
// is a number the next sitting would re-derive and disbelieve.
//
// THE STANDING FALLBACK CUT ORDER, recorded so a future sitting inherits the
// priorities and not only the number:
//   1st  the closing "YOUR SHAPE ON THE PAGE" sign-off      (~90)
//   2nd  the "WHOSE SIDE YOU ARE ON" closing sentence       (~220)
//   NEVER "WHEN SHE ASKS WHAT YOU ARE"  — that passage IS F-08.52's cure.
//   NEVER "WHAT IS NOT YOURS TO SAY"    — it carries acceptance bar items
//                                          (2) zero invented prices or
//                                          availability, and (4) the register.
// Growth past 7,500 returns to the CE with its arithmetic, and the const moves
// in its own commit citing that ruling before one byte of prose follows it.
const ELIZA_SOUL_CHAR_CEILING = 7500;

module.exports = { ELIZA_SOUL_CHAR_CEILING };
