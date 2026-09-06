// src/lib/vendor/leadSources.js
// BLOCK 19 · G1.3 — THE WEDDING PLANE'S `leads.source` TOKENS, ONE HOME (R-G13.2).
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS RATHER THAN TWO LITERALS AT TWO DOORS
// ═══════════════════════════════════════════════════════════════════════════
// F-40.111: R-40.13 ruled `'wedding_guest'` should have one home and it never
// got one. It was spelled as a bare literal at
// `src/api/public/weddingDownload.js`, inside a comment that ARGUED for the
// literal ("`'wedding_guest'` is spelled here once") — which is how a rule and
// its violation end up in the same paragraph, each looking like the other's
// justification. G1.3 adds a SECOND wedding-plane token, so the debt is paid
// here rather than doubled.
//
// ⚠ THE COMMENT MOVED WITH THE LITERAL (R-G13.12). The download door's
// paragraph no longer claims to be the token's home; it points here. A cured
// literal under an uncured comment is the tree asserting the defect it just
// fixed — F-06.191's class, and the reason the ruling names the comment.
//
// ── WHY NOT BESIDE `PEER_REFERRAL_SOURCE`, WHICH IS THE OBVIOUS PLACE ──────
// `PEER_REFERRAL_SOURCE` lives in `src/lib/vendor/leads.js`, beside `createLead`
// — the right shape, and the precedent this file follows in every respect
// except its address. That file is the G5.1 seat's, live in a parallel cut, and
// two seats editing one file is the concurrent-writer failure protocol §11
// exists to prevent. So the tokens sit in their own module and `leads.js` is not
// opened. **A one-line micro after G5.1 seals folds `PEER_REFERRAL_SOURCE` in
// here beside them** — filed at this sitting, not taken.
//
// ── NO CHECK, AND THAT IS RULED (R-40.13) ─────────────────────────────────
// `leads.source` is free text. `PUBLIC_SCHEMA.md:1666-1672` carries the whole of
// that table's constraints — `leads_wedding_date_precision_check` and the
// primary key — and neither mentions `source`. F-40.18's distinct-values census
// SELECT is still owed before any CHECK is added, and adding one here on ten
// live values plus two new ones would be a schema change made from a guess.
'use strict';

/**
 * A guest who downloaded photographs from a wedding page and ticked the one box.
 *
 * WRITTEN BY EXACTLY ONE DOOR — `src/api/public/weddingDownload.js` — and for
 * exactly ONE vendor: the page's owner. R-G12.3 is why it is not N vendors: the
 * download sheet asks her one question naming one party, so a yes to that
 * question cannot lawfully become leads on other people's accounts. The master's
 * §4 G1.2 line ("a lead for every credited vendor") is superseded by that ruling
 * and by Amendment 2; this constant's singularity is the ruling in mechanical
 * form.
 */
const WEDDING_GUEST_SOURCE = 'wedding_guest';

/**
 * A guest who used **Book the same team** on a wedding page.
 *
 * THE FAN-OUT LIVES HERE AND NOWHERE ELSE, and it is lawful for the reason the
 * guest download's is not: the team ask NAMES the vendors it will reach, lists
 * them above the checkbox, and asks its own question about that set. Two
 * features, two consents — never one mechanism serving both.
 *
 * ⚠ IT IS A DISTINCT TOKEN AND NOT A REUSE OF `wedding_guest`, for the reason
 * `PEER_REFERRAL_SOURCE` is not `'referral'`: a vendor reading her own lead
 * record must be able to tell a guest who wanted HER from a guest who wanted the
 * whole team. `Source` renders raw (F-40.86), so a collapsed token is a fact the
 * vendor can never recover.
 */
const WEDDING_TEAM_SOURCE = 'wedding_team';

/**
 * The set, for a caller that needs to ask "did this lead come from a wedding
 * page?" without spelling either word. Frozen so a reader cannot mutate the
 * estate's vocabulary through a borrowed reference.
 */
const WEDDING_SOURCES = Object.freeze([WEDDING_GUEST_SOURCE, WEDDING_TEAM_SOURCE]);

module.exports = { WEDDING_GUEST_SOURCE, WEDDING_TEAM_SOURCE, WEDDING_SOURCES };
