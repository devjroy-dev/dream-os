// closerEngine.js — THE CLOSER'S TURN. The marketing lane's model seam.
// The persona is MIRA (F-08.75); her literal has one home at ./miraSoul.js.
//
// ═══════════════════════════════════════════════════════════════════════════════
// F-06.85 HEADER — every soul sentence below that is conditioned on a MECHANICAL
// fact names its mechanism here, so the next sitting that touches these
// mechanisms is forced to re-read the sentence they hold up.
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS, AND WHY IT IS NOT INSIDE prospects.js. FORK 4, ruled:
// `src/lib/prospects.js` is a STATE MACHINE and its header has said "No AI calls
// here (W-1)" since Block 05. Putting model assembly inside it would make that
// sentence false and make the file two things. This module mirrors the estate's
// own separation — `brideInbound.js` → `brideEngine.js` — and `prospects.js`
// carries exactly ONE call to it, at the seam its own header held open.
//
// THE FACADE, NOT THE RAW SDK (FORK 3, ruled). `harvest.js:122-125` is the
// estate's only CJS `resolveModel` + facade precedent and it is the one followed
// here. `brideEngine.js:219`'s raw `anthropic.messages.create` is LEGACY, not
// precedent: it hardcodes a model constant and cannot honour a route, which
// would make the 0110 seed decorative.
//
// ⚠ DECLARED DEVIATION FROM harvest's SHAPE, disclosed rather than hidden.
// harvest ternaries on `route.provider === 'anthropic'` and hands the anthropic
// leg to an INJECTED `anthropic` client. This service has no such client —
// `marketingIndex.js` never builds one. So `llmCreate` is called for BOTH legs.
// That is PROVABLY the same call for anthropic and not an approximation:
// `translateFor` at `src/lib/llm.js:73` reads `if (p === 'anthropic') return
// params;` — the anthropic path is byte-identical and untouched, and
// `llmCreate` then calls `clientFor('anthropic').messages.create` on exactly
// those params. The bench asserts the identity rather than this comment
// asserting it.
//
// THE MODEL IS THE FOUNDER'S, BY CONFIG, NO CODE CHANGE (founder: 「 the option
// should be there 」). `resolveModel(supabase, 'wa_marketing', 'default')`
// resolves the route; 0110 seeds it to haiku and the DEFAULTS entry in
// `modelRouter.js` matches so a pre-seed deploy routes identically. The flip to
// DeepSeek and back is one admin_config row, 60 seconds, both forms handed over
// commented per the conditional-withheld rule.
//
// THE Z-LAW RIDES FOR FREE, AND IT IS WHY THE SOUL COSTS THE SAME ON BOTH
// ARCHITECTURES. `translateFor` deep-strips every `cache_control` key on
// non-anthropic (`llm.js:77`) and disables DeepSeek's silent reasoning
// (`llm.js:76`). So the two breakpoints below are honoured on Haiku (ephemeral
// cache, 0.1x warm reads) and stripped harmlessly on DeepSeek — whose context
// caching is AUTOMATIC and was never disabled by the strip (E7's discovery,
// 30k-121k live cache reads on the founder's own ledger).
//
// TWO CACHE BREAKPOINTS, SOUL THEN MANUAL (FORK 3, ruled). Not one. The Manual
// is the document explicitly expected to change — it carries its own
// re-derivation promise — and a Manual edit must not invalidate the soul's
// cached prefix. Dynamic context comes AFTER both, uncached, per the cache law
// (static prefixes are never touched by dynamic content).
'use strict';

const fs   = require('fs');
const path = require('path');

const { resolveModel }   = require('../lib/modelRouter');
const { llmCreate }      = require('../lib/llm');
const { normalizeTo }    = require('../lib/metaCloud');
const { claimLinkFor }   = require('../lib/discover/demoLeadAlert');
const demoLifecycle      = require('../lib/demoLifecycle');
const { CLOSER_SOUL, CLOSER_SOUL_VERSION, NOTHING_TOKEN } = require('./souls/closerSoul');
// ONE HOME (F-08.75): the persona's literal lives at miraSoul.js and is imported,
// never re-declared. Six modules required it before this one; this is the seventh.
const { MIRA } = require('./miraSoul');

const SURFACE = 'wa_marketing';
const TIER    = 'default';

const MAX_TOKENS = 700;

// ── The product link (S-6's fallback close) ──────────────────────────────────
// DERIVED, NOT MINTED. No vendor-signup deep-link constant exists anywhere in
// this estate; the product ROOT is what live code uses (`api/couple/circle.js`,
// `api/vendor/ig.js`). Invite codes are retired (W-8), so the admin console's
// "go to thedreamwedding.in and enter code" shape is dead and is not copied.
// FLAGGED ON THE COPY LIST: if the founder wants a deeper path, this is the one
// byte to change and it is a founder byte, not a sitting's.
const PRODUCT_LINK = 'https://thedreamwedding.in';

// ═════════════════════════════════════════════════════════════════════════════
// THE MANUAL (S-7) — boot-read, meta-header SLICED
// ═════════════════════════════════════════════════════════════════════════════
//
// FORK 6, ruled: BOOT-READ WHOLE, SLICE THE META-HEADER AT LOAD.
//
// WHY BOOT-READ. `brideSystemPrompt.js:31-32` states the discipline in its own
// words — composed ONCE, at load, so the cached prefix stays byte-identical call
// over call. A per-turn read puts file I/O on the hot path AND lets the cached
// prefix change mid-window with nothing noticing, which is the cache law's own
// failure mode. On this infrastructure a deploy is a fresh boot, so "edits need
// a deploy" costs nothing real.
//
// WHY THE SLICE, AND THIS IS F-06.52's CLASS. `docs/TDW_MANUAL.md:1-12` is
// MACHINERY TEXT sitting at the top of the model's ground truth: a version
// stamp, two commit hashes, and a sentence about which handover "no agent
// loads." F-06.52's specimen was exactly this shape — the business room injected
// "[Donna's snapshot]" two inches above the law forbidding those words, and
// every fabrication specimen turned out to be the label echoed back. She does
// not receive commit hashes or instructions about what agents load.
//
// THE SLICE IS AT LINE 14 by CE ruling, and ZERO BYTES MOVE IN THE FOUNDER-
// VETOED FILE — the cure is entirely at the load path.
//
// MECHANISM NAMED: the header this slice depends on is `docs/TDW_MANUAL.md`
// lines 1-13 (title, the S-7 line, MANUAL_VERSION, the Derived-at line, the
// derivation paragraph). If that header grows or shrinks, MANUAL_BODY_FROM_LINE
// is wrong and the bench's own assertion — that the body begins at section 1 and
// carries no commit hash — is what fires.
const MANUAL_PATH            = path.resolve(__dirname, '../../docs/TDW_MANUAL.md');
const MANUAL_BODY_FROM_LINE  = 14;   // 1-indexed; lines 1..13 are the meta-header

function _sliceManual(raw) {
  const lines  = String(raw).split('\n');
  const header = lines.slice(0, MANUAL_BODY_FROM_LINE - 1).join('\n');
  const body   = lines.slice(MANUAL_BODY_FROM_LINE - 1).join('\n').trim();
  // R1 AS AMENDED: the version is PARSED from the sliced header rather than
  // duplicated in code, so the Manual stays its own single source of truth about
  // its own version. It feeds the transport log line; it is not stamped on a row
  // because `public.messages` has no `meta` column (see closerSoul.js).
  const m = header.match(/MANUAL_VERSION:\s*([^\s*]+)/);
  return { body, version: m ? m[1] : 'unknown' };
}

let _manual = null;
function loadManual() {
  if (_manual) return _manual;
  const raw = fs.readFileSync(MANUAL_PATH, 'utf8');
  _manual = _sliceManual(raw);
  console.log(`[closer] Manual loaded: version=${_manual.version} chars=${_manual.body.length} (meta-header sliced)`);
  return _manual;
}

// ═════════════════════════════════════════════════════════════════════════════
// THE STATIC PREFIX — soul, then Manual, two breakpoints
// ═════════════════════════════════════════════════════════════════════════════
function buildStaticSystem() {
  const manual = loadManual();
  return [
    { type: 'text', text: CLOSER_SOUL, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `THE TDW MANUAL — everything you may say about the product comes from here, and nothing you may say comes from anywhere else.\n\n${manual.body}`,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// THE DYNAMIC CONTEXT — fresh per turn, never cached
// ═════════════════════════════════════════════════════════════════════════════
//
// CONTEXT SOURCE: THE DEMO ROW IS PRIMARY (CE-ruled). The 06 spec says the Closer
// references "`ig_handle`, `category`, `city` FROM THE PROSPECT ROW" — and on
// the live fixture all three of those columns are NULL while the facts sit on
// `demo_vendors` via `demo_vendor_ref`. The spec's named source does not hold
// the data the behaviour depends on. Demo row primary, prospect row fallback.
//
// F-07.41's MASKING DISCIPLINE BINDS EVERYTHING HERE, because everything here is
// model-visible. `demo_leads` is COUNTED and never read for content: no name, no
// phone, no email, no date reaches this prompt.
async function buildProspectContext(supabase, prospect, opts) {
  const lines = [];
  const o = opts || {};

  let demo = null;
  if (prospect && prospect.demo_vendor_ref) {
    try {
      const { data } = await supabase
        .from('demo_vendors')
        .select('id, ig_handle, display_name, category, city, state, active, discover_eligible, '
              + 'claimed_at, invited_at, created_at, sunset_at')
        .eq('id', prospect.demo_vendor_ref)
        .maybeSingle();
      demo = data || null;
    } catch (e) {
      console.warn('[closer] demo row read failed (context degrades, turn proceeds):', e.message);
    }
  }

  // ── Who she is talking to ──────────────────────────────────────────────────
  const name     = (demo && demo.display_name) || prospect.name || null;
  const handle   = (demo && demo.ig_handle)    || prospect.ig_handle || null;
  const category = (demo && demo.category)     || prospect.category  || null;
  const city     = (demo && demo.city)         || prospect.city      || null;

  lines.push('WHO YOU ARE TALKING TO');
  lines.push(name     ? `Name: ${name}`         : 'Name: not known yet.');
  if (handle)   lines.push(`Instagram: ${handle}`);
  if (category) lines.push(`Trade: ${category}`);
  if (city)     lines.push(`City: ${city}`);
  // THE TWO FACTS §3's CLASSES NEED, published on the opts object the builder
  // already owns — the same named side channel as `o.demoLink`. Deriving them a
  // second time at the seam would be a second opinion about the same row.
  // `blindToTheirWork` was published here and is GONE: `seen_work` de-proxied and
  // no longer reads it. A context fact nobody reads is a fact that drifts.
  o.discoverable = !!(demo && demo.discover_eligible === true && demo.active !== false);
  if (!handle && !category && !city) {
    // ── LIMB 3 (F-08.83) · THE OTHER HALF ─────────────────────────────────
    // THIS LINE ALONE MADE INTERROGATION THE COMPLIANT MOVE. On the founder's
    // own live row — no handle, no category, no city, no demo — the machinery
    // told her what she could not say and never what she could, and she asked
    // three questions and claimed nothing. The prohibition was right and the
    // silence beside it was the defect.
    lines.push('You know nothing about their work yet. Do not guess at it — ask, or wait for them to say. '
      + 'What you always have is the product itself.');
  }

  // WARM, and the word is derived not invented. `demoLeadAlert.js` writes
  // `prospects.notes = 'demo_lead'` (DEMO_LEAD_NOTE) when a couple has actually
  // enquired on this vendor's demo card, which is the estate's own signal that
  // this person has already been contacted about a real enquiry.
  if (prospect && prospect.notes === 'demo_lead') {
    lines.push('A couple has already enquired on their demo studio, and they were told so by message. That is why they are in this conversation.');
  }

  // ── The demo studio ────────────────────────────────────────────────────────
  if (demo) {
    const link = claimLinkFor(demo.ig_handle);
    lines.push('');
    lines.push('THEIR DEMO STUDIO');
    if (demo.claimed_at) {
      lines.push('Already claimed. They are past this conversation — do not pitch a claim.');
    } else if (demo.active === false) {
      lines.push('Not live. Do not send them a link and do not say a page exists.');
    } else {
      lines.push(`Live and openable right now: ${link}`);
      // THE HANDED CONSTANT, published back to the caller on the opts object it
      // already owns. F-08.61's normalizer needs the EXACT bytes she was given,
      // and the only place they exist is here, where claimLinkFor derived them.
      // A side channel, named rather than hidden: any other route would mean a
      // second derivation of the link and therefore a second thing to drift.
      o.demoLink   = link;
      o.demoHandle = demo.ig_handle;
      // THE TWO SENSES, RULED. `getDemoVendor` (src/api/demo/vendor.js) gates the
      // page on `active = true` ONLY. The couple-facing marketplace feed
      // predicates on `discover_eligible AND active`
      // (api/couple/discover.js). A live page is NOT a marketplace listing, and
      // the fixture row proves the difference is real: active true,
      // discover_eligible false.
      lines.push(demo.discover_eligible
        ? 'It is also out on the marketplace where couples browse.'
        : 'It is NOT on the marketplace where couples browse — it is a page they can open, and nothing more than that. Never imply couples are seeing it.');
      lines.push('The page is honestly labelled a demonstration. So are you.');
    }

    // ── THE CLOCK: CONDITIONED OR SILENT ────────────────────────────────────
    // CE-ruled at P5; EXTENDED TDW_08 P6 RIDER (F-08.94, F-08.99, CE R-C2→R-C6).
    // A deadline with no mechanism behind it is F-06.85's class, so a clock
    // enters context ONLY when this row is genuinely in the population of the
    // job that would fire it.
    //
    // ⚠ TWO MECHANISMS NOW CONDITION THIS BLOCK, AND EITHER ONE MOVING MAKES IT
    // WRONG. Whichever sitting touches one is forced back here by this comment.
    //
    // MECHANISM 1 — `runSunsetSweep` (src/lib/demoLifecycle.js) updates only
    // rows matching `state IN SUNSET_STATES` AND `claimed_at IS NULL` AND
    // `discover_eligible = true`, against `COALESCE(invited_at, created_at) <
    // now - N days`, N from `readSunsetDays` (admin_config `demo.sunset_days`,
    // default 90). That is the ROTATION clock, and it is the only clock this
    // block carried before P6.
    //
    // MECHANISM 2 — `runPurgeSweep`'s SUNSET LEG (same file). It destroys the
    // row's Cloudinary assets and deletes the row when `state <> 'removed'` AND
    // `claimed_at IS NULL` AND `discover_eligible = false` AND `sunset_at IS NOT
    // NULL` AND `sunset_at <= now - W days`, W from `readPurgeDays`
    // (admin_config `demo.purge_resurrect_days`, default 7, ZERO = the whole
    // purge disabled). That is the DESTRUCTION clock.
    //
    // ⚠ THE SENTENCE THIS COMMENT USED TO CARRY IS NOW HALF FALSE, AND IT IS
    // CORRECTED HERE RATHER THAN DELETED, because the correction is the lesson.
    // It read: "`sunset_at` is NOT the deadline — it is the HISTORY stamp that
    // sweep writes when it fires, and a row carrying it has already left
    // Discover." The second clause is still true. THE FIRST IS NOT: since P6,
    // `sunset_at` IS a deadline's anchor — the destruction clock starts at that
    // stamp. F-08.94 was exactly this block staying silent about mechanism 2
    // while selling on mechanism 1, and F-08.99 is its sharper half: a row that
    // has ALREADY rotated is INSIDE the destruction window, and this block said
    // nothing at all at the moment the deadline was closest.
    //
    // THE LIMBS CARRY THEIR OWN EXCLUSIONS AND THAT IS LOAD-BEARING, NOT
    // DECORATIVE. This block sits AFTER the claimed / not-live / live if-else
    // above closes, so a `claimed` row and an `active = false` row both fall
    // through into it. Each population below therefore re-states the purge's own
    // conjunctions; the model speaks only about rows the jobs will actually
    // take. The conjunction law (F-08.90) applied to speech.
    //
    // THE DESTRUCTION FIGURES FLOOR, ALWAYS (R-C3). On a clock that ends in
    // permanent deletion the conservative direction is understating time, never
    // overstating it: a vendor told one day fewer than truth loses nothing; told
    // one day more, he loses the photographs.
    //
    // TWO EXACT FIGURES, NEVER A COMBINED TOTAL (R-C3). Both sweeps run nightly,
    // so a row crossing its horizon at 09:00 is not stamped until the next
    // 03:45 — any *sum* of the two clocks carries up to a day of slack. Each
    // figure alone is exact. The model is handed finished numbers and invited to
    // do no arithmetic.
    //
    // THE ADMIN REPRIEVE IS DELIBERATELY ABSENT (R-C4). An admin re-grant
    // through `setDiscoverEligible` does lift a row out of mechanism 2, and the
    // model is NOT told so: it is a third party's act she cannot promise, and it
    // would hand a saleswoman a softener for the one deadline that must not
    // soften. Everything she is given remains true; this is a fact that is not
    // hers to sell with. Documented admin-side in the P6 handover §8. DO NOT ADD
    // IT HERE.
    //
    // NAMED LIMIT, ZERO CODE (R-C5): the TAKEDOWN leg of `runPurgeSweep`
    // (`state = 'removed'`, anchored on `removed_at`) has NO limb here, and
    // `removed_at` is deliberately absent from this block's `demo_vendors`
    // select. A STOPped vendor is `opted_out` and outside the Closer's
    // population, so the case is unreachable. A live wire ever showing a
    // `removed` row inside a Closer conversation is its own finding on that day.
    const inSweepPopulation =
      demo.discover_eligible === true &&
      !demo.claimed_at &&
      !demo.sunset_at &&
      demoLifecycle.SUNSET_STATES.includes(demo.state);

    // F-08.99 — the population INSIDE the destruction window. Mirrors
    // `runPurgeSweep`'s sunset leg conjunction for conjunction. Mutually
    // exclusive with the above by construction: that one requires `!sunset_at`,
    // this one requires it present.
    const inPurgePopulation =
      !!demo.sunset_at &&
      demo.discover_eligible === false &&
      !demo.claimed_at &&
      demo.state !== 'removed';

    // The dial is read ONCE, and only when a limb could speak. Zero disables the
    // whole purge, so at zero every destruction sentence below is ABSENT and this
    // block's output is byte-identical to what it shipped before P6 — a model
    // handed a destruction claim while the founder's kill switch is on would be
    // handed a lie.
    const purgeDays = (inSweepPopulation || inPurgePopulation)
      ? await demoLifecycle.readPurgeDays(supabase)
      : 0;

    if (inSweepPopulation) {
      const days   = await demoLifecycle.readSunsetDays(supabase);
      const anchor = new Date(demo.invited_at || demo.created_at).getTime();
      const left   = Math.floor((anchor + days * 24 * 3600 * 1000 - Date.now()) / (24 * 3600 * 1000));
      if (Number.isFinite(left) && left > 0) {
        lines.push(`Days left before it rotates out of the marketplace: ${left}. This is a real clock and you may say so.`);
        // NESTED INSIDE THE ROTATION LINE'S OWN GUARD, DELIBERATELY: "After
        // that" is anaphoric and refers to the sentence above it. Emitted
        // without its antecedent it would be a dangling claim.
        if (purgeDays > 0) {
          lines.push(`After that it is held ${purgeDays} days and then permanently deleted — the page, the photographs, and the enquiries on it. That deletion cannot be undone.`);
        }
      }
    } else if (inPurgePopulation && purgeDays > 0) {
      const anchor   = new Date(demo.sunset_at).getTime();
      const daysLeft = Math.floor((anchor + purgeDays * 24 * 3600 * 1000 - Date.now()) / (24 * 3600 * 1000));
      // A malformed stamp yields NaN and falls to SILENCE rather than to a
      // sentence — the same posture as the rotation limb's isFinite guard.
      if (Number.isFinite(daysLeft)) {
        if (daysLeft >= 1) {
          lines.push(`It has already rotated out of the marketplace. In ${daysLeft} days it is permanently deleted — the page, the photographs, and the enquiries on it — and that cannot be undone. This is a real clock and you may say so.`);
        } else {
          // THE FINAL DAY. `daysLeft` floors to 0 for a guaranteed 24-hour band
          // every cycle, so this is not an edge case — it is a form the block
          // reaches routinely, and "in 0 days" is not a sentence worth handing
          // anyone. "Within a day" and not "today": the purge runs once a night,
          // so a row still standing means its window closed AFTER the last run
          // and it goes at the next one.
          //
          // FOUNDER-ACCEPTED IMPRECISION, KNOWINGLY (AD-C4): if a row's purge is
          // BLOCKED — an asset that will not confirm destroyed — the row survives
          // past its window and this sentence repeats "within a day" nightly
          // until the block clears. It overstates URGENCY in that case. It never
          // overstates TIME REMAINING, which is the direction R-C3 protects, and
          // teaching the Closer to read the blocked ledger was refused as surface.
          lines.push('It has already rotated out of the marketplace and its holding period has run out. It is deleted within a day — the page, the photographs, and the enquiries on it — and that cannot be undone. This is a real clock and you may say so.');
        }
      }
    }
    // else: SILENT. Not "no clock", not "unknown" — absent. A model told a clock
    // is unknown will reach for it anyway; a model told nothing has nothing to
    // reach for.

    // ── Waiting enquiries: ZERO COLLAPSES (CE-ruled, CE-186's surface
    // discipline applied to the context block). A count of zero is not a number
    // worth handing a saleswoman; it is a thing to leave unsaid.
    try {
      const { count } = await supabase
        .from('demo_leads')
        .select('id', { count: 'exact', head: true })
        .eq('demo_vendor_id', demo.id);
      if (count && count > 0) {
        lines.push(`Enquiries waiting on that page for them: ${count}. Real couples, already asked.`);
      }
    } catch (e) {
      console.warn('[closer] demo_leads count failed (omitted from context):', e.message);
    }
  } else {
    lines.push('');
    lines.push('THEIR DEMO STUDIO');
    lines.push(`They do not have one. If they want to see the product, the link is ${PRODUCT_LINK}`);
  }

  // ── The nudge state (FORK 1: the machinery WAKES her, it never WORDS her) ──
  // The evidence is DERIVED from the conversation's own messages and stored
  // nowhere — zero DDL, the record is the truth. She is shown what stands; SHE
  // decides whether this is nudge one, nudge two, or the gracious exit, and she
  // composes every byte of it. The cap below her is mechanical and fail-closed.
  // ── THE WAKE IS CONTEXT, NEVER CONVERSATION (F-08.57's cure, CE-ruled) ────
  // WHAT THIS REPLACED AND WHY. The standing used to ride a USER-ROLE turn —
  // "(no reply has come. write your next message, or your last one.)" — and she
  // ANSWERED IT instead of acting on it. 9 of 9 Haiku nudge sends came back as
  // stage direction or wholly meta: "You're done. Two messages into silence is
  // the line, and you've reached it. Walk away cleanly." Sent to a vendor, that
  // is coaching notes about Maya, addressed to nobody. One of nine on DeepSeek,
  // so the disease was mechanical AND lane-asymmetric, and the seeded lane was
  // the failing one.
  //
  // Post-hoc stripping of the preamble was REFUSED BY NAME at the CE: a scrub
  // over a confused speaker is papering. The speaker stops being confused
  // instead — the standing is now a FACT in her context, sitting beside the
  // clock and the enquiry count, in exactly the register those use. She is told
  // what is true; she composes to the PROSPECT.
  //
  // ── F-08.66 · WHAT THE TRUNCATION CUT AWAY COMES BACK AS EVIDENCE ────────
  // THE DISEASE. `truncateAtLastInbound` cuts the message array at the
  // prospect's last inbound, which is correct — a trailing assistant turn is a
  // prefill and F-08.57 is dead by that cut. But it ALSO deleted the only proof
  // that her sends existed. The turn then arrived as ONE stale user message
  // beside a context block asserting messages stood unanswered: two facts that
  // contradict. Haiku, correctly, refused or asked what was meant; DeepSeek
  // stayed in character and confabulated ("Looks like none of my earlier
  // messages made it through"). And with her own sends invisible she
  // reintroduced herself on 7 of 9 Haiku wakes — the switchboard her own soul
  // and the Manual both name.
  //
  // THE CURE, arm (b), CE-ruled: her unanswered sends move into the CONTEXT,
  // quoted verbatim. The messages array STAYS truncated. No trailing assistant
  // turn, no user-role wake, and the careful model gets evidence instead of a
  // setup.
  //
  // ── F-08.67 · THE SINGLE-SOURCE LAW, AND WHY NO NUMBER IS SPOKEN ─────────
  // THIS BLOCK USED TO SAY, on every FIRST nudge in production:
  //   "Your last 0 messages stand unanswered."
  // `nudgesStandingFrom` counts NUDGES (her first outbound after an inbound is
  // her ANSWER, not a nudge, so the run is floored at run-1); the copy said
  // MESSAGES. On the first wake those are 0 and 1, and the sentence was a
  // self-contradiction handed to a model this arc had just finished teaching not
  // to trust contradictory turns.
  //
  // RULED: the quoted block is the ONLY source. There is no spoken count at all
  // — the quotes ARE the count, so count and quotes cannot disagree. The cap
  // bookkeeping stays machinery for `runNudgeJob`'s fail-closed max and is never
  // spoken as a number.
  //
  // ZERO-COLLAPSE (CE-186's discipline, the same rule the enquiry count obeys
  // twenty lines above): nothing standing → the line and the block are both
  // ABSENT. Not "no messages", not "unknown" — absent. A model told a thing is
  // zero will reach for it anyway.
  //
  // MECHANISM NAMED (F-06.85), THREE OF THEM:
  //   1. `runNudgeJob` waking her at all — it only fires on a trailing outbound.
  //   2. `loadHistory`'s truncation: `unansweredSends` is derived as the exact
  //      COMPLEMENT of `truncateAtLastInbound` (see `unansweredSendsFrom`), so
  //      the quotes are, by construction, precisely what the cut removed. If the
  //      truncation moves, these quotes move with it and cannot drift.
  //   3. `MAX_NUDGES = 2` — the exit declarative below says "Both follow-ups are
  //      spent" IN WORDS. If the cap ever moves off two, that sentence is false
  //      and this block must be re-read with it. The bench asserts the cap
  //      beside the sentence so the pairing is mechanical, not remembered.
  if (o.wakeReason === 'nudge') {
    const sends = o.unansweredSends || [];
    if (sends.length) {
      // THE EXIT IS DERIVED FROM THE SAME ROWS AS THE QUOTES, deliberately, and
      // not from a second count: her ANSWER plus MAX_NUDGES follow-ups is the
      // last wake she gets. Reading it off `sends.length` means the declarative
      // and the evidence beneath it can never disagree, which is the whole of
      // F-08.67's ruling applied to the one remaining conditional.
      lines.push('');
      lines.push('WHERE THIS CONVERSATION STANDS');
      lines.push('Their last reply is above. Since then, these went out and none has been answered:');
      // ── F-08.70's DECLARATIVE (CE-ruled, post-cure read) ─────────────────
      // THE CONTRADICTION MOVED RATHER THAN DIED. The quoted sends killed the
      // switchboard (7/9 Haiku → 0/3) and the confabulated absence, but the
      // MESSAGES array still ends on a user turn, so the last thing she sees is
      // them speaking. 4 of 6 nudge sends then read the wake as a fresh
      // arrival — "You're in", "Thanks for circling back", "I'm glad you're
      // back" — welcoming somebody who has not come back. Same cure-shape as
      // the one that worked: tell her the true thing plainly, as a fact.
      lines.push('No new reply has arrived — their message above predates everything you sent. You are writing into silence.');
      for (const s of sends) lines.push(`» "${s}"`);
      // THE EXIT DECLARATIVE IS GONE, and its removal is the honest half of §2's
      // ruling. The exit wake no longer reaches a model, so a context sentence
      // addressed to her at the exit could never be read — and a bench green
      // over an unreachable path is not evidence (§9). Context is now built for
      // wakes one and two only, which is exactly the range she still owns.
      lines.push(`If there is genuinely nothing worth sending, write ${NOTHING_TOKEN} and nothing goes out.`);
    }
  }

  return lines.join('\n');
}

// ═════════════════════════════════════════════════════════════════════════════
// THE HISTORY — this conversation, as it actually happened
// ═════════════════════════════════════════════════════════════════════════════
const HISTORY_LIMIT = 30;

// `truncateAtLastInbound` exists for the wake and for nothing else. On a nudge
// the conversation ends with HER, and a trailing assistant turn handed to the
// model is a PREFILL — it asks her to continue her own last message rather than
// write a new one. Cutting the history at the prospect's last inbound means she
// sees the conversation as it actually stood when they went quiet, and the fact
// of her unanswered messages arrives as CONTEXT instead. No machinery in the
// message stream at all, which is what makes narration impossible rather than
// merely discouraged.
function truncateAtLastInbound(rows) {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].direction === 'inbound') return rows.slice(0, i + 1);
  }
  return rows;
}

// F-08.66 — THE COMPLEMENT, AND IT IS DEFINED AS THE COMPLEMENT ON PURPOSE.
// What the truncation removed is exactly what the context quotes. Writing this
// as `rows.slice(kept.length)` rather than as a second scan for trailing
// outbounds means there is ONE definition of "her unanswered sends" in this
// file and no way for the quote to disagree with the cut. A second scan would
// be a second method, and INDEPENDENT-METHOD clause 1 is about exactly this:
// two derivations of the same fact are a drift surface, not a check.
//
// The no-inbound case falls out correctly for free: `truncateAtLastInbound`
// returns the rows whole, so the complement is empty, so the block collapses.
// A conversation with no inbound at all has no "since their last reply".
// ONE HOME FOR "IS THIS THE LAST ONE" (CE-ruled §4). The context block and the
// engine's exit gate both need this answer, and two copies of the expression
// would be two things to drift. Her ANSWER plus MAX_NUDGES follow-ups is the
// last wake she gets, read off the same rows the quotes come from.
function isExitWake(sends) {
  return (sends || []).length > MAX_NUDGES;
}

// Extracted so it is provable without a turn — see the call site's comment.
function gateExitLink(text, isExit, demoLink) {
  if (!isExit || !demoLink || !text) return { text, gated: false };
  if (text.indexOf(demoLink) === -1) return { text, gated: false };
  return { text: EXIT_LINE, gated: true };
}

function unansweredSendsFrom(rows) {
  const kept = truncateAtLastInbound(rows);
  return rows.slice(kept.length);
}

async function loadHistory(supabase, conversationId, opts) {
  const { data } = await supabase
    .from('messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  let rows = (data || []).slice().reverse();
  if (opts && opts.truncateAtInbound) {
    // THE SIDE CHANNEL, NAMED RATHER THAN HIDDEN — the same shape and the same
    // reason as `o.demoLink` in buildProspectContext above. The cut rows exist
    // in exactly one place, here, at the moment of cutting. Any other route
    // would mean re-reading the messages table and deriving the same thing a
    // second time, which is the drift `unansweredSendsFrom` exists to refuse.
    // The empty-body filter is applied identically to both halves, so a blank
    // row is neither sent to the model nor quoted at it.
    if (opts) {
      opts.unansweredSends = unansweredSendsFrom(rows)
        .filter(r => r.body && String(r.body).trim())
        .map(r => String(r.body));
    }
    rows = truncateAtLastInbound(rows);
  }
  return rows
    .filter(r => r.body && String(r.body).trim())
    .map(r => ({
      role:    r.direction === 'inbound' ? 'user' : 'assistant',
      content: String(r.body),
    }));
}

// Trailing outbound-without-inbound, from the newest end. The FIRST outbound
// after an inbound is her ANSWER, not a nudge — so nudges standing is that run
// minus one, floored at zero.
function nudgesStandingFrom(rowsNewestFirst) {
  let run = 0;
  for (const r of rowsNewestFirst) {
    if (r.direction === 'outbound') run++;
    else break;
  }
  return Math.max(0, run - 1);
}

async function countNudgesStanding(supabase, conversationId) {
  const { data } = await supabase
    .from('messages')
    .select('direction, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  return nudgesStandingFrom(data || []);
}

// ═════════════════════════════════════════════════════════════════════════════
// F-08.55 — THE REGISTERED-USER GUARD
// ═════════════════════════════════════════════════════════════════════════════
//
// THE FINDING. `src/lib/discover/demoLeadAlert.js` refuses its own send when the
// target phone already belongs to a registered user, born of the founder's own
// catch: 「 why will 94440 get demo alert when its already a registered user 」.
// This lane had no equivalent and could not acquire one by accident:
// `findOrCreateProspectByPhone` mints a prospect for ANY inbound number,
// fail-safe by design so an opt-out from anywhere is honoured. So a registered
// TDW vendor texting the marketing number would have been sold The Dream Wedding
// by the house's own voice. Confirmed live at the fixture: the walk number
// `+919888294440` returns one `users` row.
//
// BOTH PHONE FORMS, and the reason is `demoLeadAlert`'s own: `users.phone` has
// no single normalizer governing writes, so its canonical shape is DECLARED not
// derived. The founder's own SELECT returned the '+' form. A guard that misses
// is worse than no guard, because it reads as protection.
//
// ORDERING AGAINST STOP, stated: this guard runs INSIDE the Closer seam, which
// `handleMarketingInbound` reaches only AFTER its STOP and START arms. A
// registered user who sends STOP is opted out exactly as anyone else is; this
// guard never sees that message and must never be moved above it.
//
// IT FAILS **OPEN**, and that asymmetry is deliberate and opposite to
// demoLeadAlert's. There the failure mode is an unprompted template to a
// customer — silence is correct. HERE a human has already spoken to us, and the
// rude machine is the one that says nothing. So a lookup that errors proceeds
// into the Closer's turn, loudly logged.
// ── THE PERSONA BOUNDARY'S MECHANICAL ENFORCEMENT (founder-ruled 2026-08-04) ─
// 「 Mira will not be meeting the vendors again since mira is the brides ai and
// she is the marketing voice 」. One persona, two doors, ZERO overlap in an
// ongoing relationship: she opens the house to brides on the canvas and to
// prospects here, and the day a prospect joins, Victor takes them from there.
//
// THIS GUARD WAS BUILT BEFORE THE SENTENCE EXISTED and turns out to be its
// enforcement. A registered vendor texting this line gets the founder's sealed
// one-liner and NO Closer turn at all — so the line is now architecturally
// exact rather than merely honest: it is literally for people she has not met,
// because the ones she met and closed live on Victor's side of the wall.
// MECHANISM NAMED (F-06.85): if this guard is ever removed or narrowed, the
// boundary law has no enforcement and the soul paragraph that states it becomes
// a promise nothing keeps.
const REGISTERED_USER_LINE = "You're already with us — this line is for people we haven't met yet.";

async function isRegisteredUser(supabase, phone) {
  const p = normalizeTo(phone);
  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .in('phone', [p, `+${p}`])
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch (e) {
    console.error(`[closer] registered-user check FAILED for ${p}: ${e.message} — `
      + 'FAILING OPEN into the turn: a human already spoke to us and silence is the ruder failure');
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// F-08.61 — THE LINK NORMALIZER
// ═════════════════════════════════════════════════════════════════════════════
//
// THE SPECIMEN. Handed `https://thedreamwedding.in/demo/vendor/<handle>` in her
// context, she sent `https://thedreamwedding.in/demo/<handle>` — she dropped
// `/vendor/` out of a constant given to her verbatim. A dead link is the close
// failing silently: the prospect taps, gets nothing, and nobody learns.
//
// WHY THIS IS NOT THE INTERCEPTOR CLASS THE FOUNDER REFUSED. That refusal was
// about a machine JUDGING her words. This judges nothing. It corrects OUR OWN
// artifact — a URL constant this estate authored and handed her — back to the
// bytes it was always meant to be. The estate has edited the wire lawfully since
// Block 04 (`src/lib/vendor/scrub.js`), and this is that precedent, narrowed to
// one string.
//
// IT FAILS SAFE IN BOTH DIRECTIONS. No expected link (a prospect with no demo)
// → nothing is touched. A URL that does not carry this handle → nothing is
// touched, so the bare product root and any other link she writes survive
// untouched. It can only ever rewrite a URL that is already trying to be this
// vendor's demo link.
//
// IT IS NOT A LICENCE TO STOP CARING. The soul still says the link is hers to
// send correctly; this is a floor under a transcription slip, not permission for
// one. If a specimen ever shows her inventing a DIFFERENT link — one carrying no
// handle at all — this function will not catch it, and that is the finding, not
// a bug here.
// ── F-08.71 · THE SCHEME WAS LOAD-BEARING AND SHOULD NEVER HAVE BEEN ──────
// THE SPECIMEN, post-cure read at 710b4e5: she wrote
// `www.thedreamwedding.in/demo/vendor/kanupriyasethi.studio` — no scheme. This
// pattern required `https?://`, so the normalizer did not see it (`normalized=0`)
// and `appendLinkSignature`'s `indexOf(expectedLink)` could not match it either
// (`signed=false`). **A close went out with no reveal on it.** The WATCHER saw
// the link — its own pattern never required a scheme — and that asymmetry is
// how the hole was found: `flags=link signed=false`.
//
// SCHEME-OPTIONAL, and the lookbehind is not decoration: without it a bare
// `thedreamwedding.in/` could match from inside a longer token. The normalizer
// then canonicalises whatever matched to the exact handed constant, so the
// signature's check fires on bytes it already knows. "No link leaves unsigned"
// becomes true again, and the both-ways cell mutates this widened term.
// ═════════════════════════════════════════════════════════════════════════════
// F-08.78 · THE MONEY REGISTER GETS A WIRE, AND IT IS THE SCRUB'S OWN CLASS
// ═════════════════════════════════════════════════════════════════════════════
//
// THE SPECIMEN, at 1d79567, DeepSeek, `register_money`, `flags=none`:
//   "The range is Rs 999 to Rs 5,999 a month — ₹999 for the bottom, ₹5,999 for
//    the top."
// The register is a STANDING LAW of this estate and had, until this delivery,
// **zero mechanical enforcement anywhere.** The soul states it; nothing checked
// it; the watcher's price class had narrowed to tier-attached figures and there
// had never been a glyph class at all.
//
// WHY THIS IS NOT THE INTERCEPTOR THE FOUNDER REFUSED. It judges nothing she
// wrote. A glyph is a REGISTER, not a claim — the estate has rewritten registers
// on the wire since Block 04 (`src/lib/vendor/scrub.js`, the persona firewall's
// own class), and this is that precedent narrowed to one character. It is the
// link normalizer's sibling: both correct a FORM, neither reads for intent.
//
// THE DIGITS SHIP AS SHE WROTE THEM. Grouping stays soul-side, deliberately:
// re-grouping a number is arithmetic on her words, and arithmetic is a semantic
// act. Only the glyph moves, and it moves to the exact bytes the register
// names. `₹` + any following space collapses to one `Rs ` so `₹999` and `₹ 999`
// land identically.
const RUPEE_GLYPH_RE = /\u20B9\s*/g;

function normalizeRegister(text) {
  if (!text) return { text, corrected: 0 };
  let corrected = 0;
  const out = String(text).replace(RUPEE_GLYPH_RE, () => { corrected++; return 'Rs '; });
  return { text: out, corrected };
}

// THE SHORTHAND IS WATCHED AND NEVER REWRITTEN. Turning "1.2L" into a number is
// a semantic act on her words, and semantic acts stay refused — so this class
// reports and nothing else. The glyph limb is reported too, but from the
// PRE-normalization bytes, because after the swap there is nothing left to see.
const REGISTER_SHORTHAND_RE = /\b\d+(?:[.,]\d+)?\s?(?:k|l|cr)\b/i;

function registerFlags(rawText) {
  const t = String(rawText || '');
  return (/\u20B9/.test(t) || REGISTER_SHORTHAND_RE.test(t)) ? ['register'] : [];
}

const DEMO_LINK_RE = /(?<![\w@.-])(?:https?:\/\/)?(?:[a-z0-9-]+\.)*thedreamwedding\.in\/[^\s<>()\[\]"']*/gi;

function normalizeDemoLinks(text, expectedLink, igHandle) {
  if (!text || !expectedLink || !igHandle) return { text, corrected: 0 };
  const needle = String(igHandle).toLowerCase();
  let corrected = 0;
  const out = String(text).replace(DEMO_LINK_RE, function (url) {
    if (url === expectedLink) return url;
    if (url.toLowerCase().indexOf(needle) === -1) return url;   // not aiming at this demo
    corrected++;
    return expectedLink;
  });
  return { text: out, corrected };
}

// ═════════════════════════════════════════════════════════════════════════════
// F-08.58 / F-08.64 — THE LINK SIGNATURE
// ═════════════════════════════════════════════════════════════════════════════
//
// WHY PROSE FAILED AND THIS DOES NOT. The soul was given a concrete, ruled
// definition of the close — "sending someone their page is the close" — and the
// reveal still landed **0/12 lifetime, both lanes**. Three consecutive REDs on
// the same law. The diagnosis the CE drew from the whole arc: every cure that
// handed her TRUE BYTES or WIRE STRUCTURE worked; every cure that asked prose to
// govern TIMING or PRESSURE failed. This one goes structural.
//
// F-08.64 is why it cannot wait. Unprompted, into silence, she wrote: "Real
// person, not a bot." An affirmative humanity lie — self-corrected one wake
// later, which is character fighting through, and no comfort at all to the
// reader who saw only the first message.
//
// WHAT THIS IS AND IS NOT. It is a FLOOR, not a voice. It fires on LINK PRESENCE
// only, appends founder-sealed bytes, and judges nothing she wrote. It is the
// normalizer's sibling: both correct OUR OWN artifact at the seam, neither reads
// her words for intent. The soul's REVEAL section is deliberately UNTOUCHED —
// the reveal stays character, and this stops it being the only thing standing
// between a stranger and a lie.
//
// S-4's "always before the close" now holds BY CONSTRUCTION: the close is the
// link, and no link leaves this function unsigned.
//
// IDEMPOTENT: if the signature is already in the message she wrote it herself
// and it is not doubled.
// ── FOUNDER-SEALED 2026-08-04, BYTE-EXACT, NOTHING NORMALIZED ─────────────
// The slot is CLOSED. His own bytes, superseding both the retired Maya seal
// ("— Maya · The Dream Wedding's AI") and the chair's proposed Mira form.
// Recorded here because the shape is deliberate and a future reader will want
// to "fix" it: the separator is a HYPHEN-MINUS (U+002D) directly after the
// name with no space before it, there is no middle dot, there is no
// apostrophe-s, and it reads "AI Team" rather than "AI". Thirty-one
// characters, derived by command before they were typed. The copy-veto law
// says nothing is normalized, and nothing is.
//
// THE NAME IS STILL INTERPOLATED FROM ITS ONE HOME. The rendered bytes are
// identical either way, so interpolation costs nothing and buys two things:
// the signature cannot drift from the persona, and `b05_couple_soul_bench`
// §4.1 — the estate's own no-second-literal census — stays green.
//
// F-08.58 SURVIVES THE RESEAL, and it is worth stating: the floor exists so a
// link never leaves without the reveal on it. "AI Team" carries that. If a
// future seal ever drops the letters A and I, this floor stops being a floor
// and the finding reopens.
const LINK_SIGNATURE = `${MIRA}- The Dream Wedding AI Team`;

// ═════════════════════════════════════════════════════════════════════════════
// THE EXIT GATE (CE-ruled at the post-cure read) — STRUCTURAL, NOT PROSE
// ═════════════════════════════════════════════════════════════════════════════
//
// THE EVIDENCE. The exit wake was reached for the first time in the arc and
// FAILED 2/2: Haiku answered with a question, DeepSeek sent another pitch
// carrying the demo link. The context said "Both follow-ups are spent. What
// remains is the goodbye" and both lanes wrote a close anyway.
//
// THE ARC'S OWN DIAGNOSIS, applied: every cure that handed her TRUE BYTES or
// WIRE STRUCTURE worked; every cure that asked prose to govern TIMING or
// PRESSURE failed. The exit is a timing problem, so it does not go back to
// prose.
//
// WHAT THIS IS AND IS NOT. Link-presence only — THE SIGNATURE'S OWN CLASS, the
// same mechanical predicate, no classifier, no reading of her words for intent.
// It judges nothing she wrote; it observes that a farewell is carrying an
// opening, and sends the plain goodbye instead. Interception on the CONTENT of
// her prose stays refused and nothing here reaches for it.
//
// MECHANISM NAMED (F-06.85): this gate is why `closerSoul.js` now says the
// goodbye carries no link. If this gate moves, that sentence is false and must
// be re-read with it. The bench asserts both ends.
//
// ⚠ NAMED, NOT BUILT: the predicate is the DEMO link, mirroring the signature
// exactly as ruled. A prospect with no demo studio closes on `PRODUCT_LINK`,
// and that shape is NOT covered by the ruled predicate. Enumerated for the
// chair rather than widened on my own reading.
const EXIT_LINE = "I'll leave it here — no more messages from me. If you ever want to pick this up, "
                + "just reply and I'm right here. All the best.";

// ── THE DOUBLE-SIGN, AND A DECLARED DEVIATION FROM THE RULED MECHANISM ────
// THE SPECIMEN: her exit closed with her own `— Maya`, this appended the full
// signature beneath it, and the message carried two sign-offs.
//
// ⚠ THE CE RULED "idempotence tests for the signature's SUBSTRING, not the
// whole string." Read literally, a trailing `— Maya` — which IS a substring of
// the signature — would count as already-signed and SUPPRESS the append. That
// reopens F-08.58 at the exact site the signature exists for: a link close
// carrying her name and no disclosure that she is an AI. §0.2 — reported, not
// quietly adapted.
//
// WHAT SHIPS INSTEAD, executor-proposed, RATIFY-OR-REVERT: the partial sign-off
// is UPGRADED IN PLACE. A trailing bare `— Maya` is absorbed and the full
// signature takes its position, which delivers the chair's stated outcome (one
// sign-off) without the consequence (a close with no reveal). If the chair
// wants the literal reading, one predicate reverts.
const PARTIAL_SIGNOFF_RE = new RegExp('\\n+\\s*[—–-]\\s*' + MIRA + '\\s*$');

function appendLinkSignature(text, expectedLink) {
  if (!text || !expectedLink) return { text, signed: false };
  if (text.indexOf(expectedLink) === -1) return { text, signed: false };  // no link, no floor
  // IDEMPOTENCE RE-KEYS WITH THE SEAL: this tests the const, so the check moved
  // to the new substring the moment the bytes did. Nothing here knows the words.
  if (text.indexOf(LINK_SIGNATURE) !== -1) return { text, signed: false }; // already said, in full
  const trimmed = text.replace(PARTIAL_SIGNOFF_RE, '');
  return { text: trimmed + '\n\n' + LINK_SIGNATURE, signed: true, upgraded: trimmed !== text };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE [NOTHING] TOKEN — the no-send contract, named on both sides
// ═════════════════════════════════════════════════════════════════════════════
//
// The engine already treated an EMPTY completion as no-send. Models do not
// produce empty completions when asked to write; they produce "The conversation
// is closed." — a message, to a human, announcing that no message is being sent.
// Haiku's exit wakes were 0/3, every one of them meta.
//
// So silence gets a WORD she can actually type. The soul names the contract in
// her own register; this honours it. A token beats an absence because a token is
// a thing she can choose.

function isNothing(text) {
  return String(text || '').trim().replace(/^\W+|\W+$/g, '').toUpperCase() === 'NOTHING';
}

// ═════════════════════════════════════════════════════════════════════════════
// THE WATCHER (CE-ruled, founder-ratified) — REPORT-ONLY. IT BLOCKS NOTHING.
// ═════════════════════════════════════════════════════════════════════════════
//
// Stage-1 discipline exactly, and the wire-guard's own precedent at CE-107:
// measure precision BEFORE anything is ever given the power to block. The
// founder refused interception on this lane and that refusal STANDS — this
// observes and records, and there is no branch anywhere below that returns early
// or alters a byte on the strength of a flag.
//
// The five classes are the CONVICTED ones, not a guess at what might go wrong:
//   identity   — F-08.64, the humanity lie
//   price      — F-08.60, a figure attached to a named tier
//   provenance — F-08.59, where the number came from
//   link       — F-08.58, the close, and whether it carried the signature
//   post_exit  — the send that should not have existed
//
// A flag is a SUSPICION, never a verdict. Precision is unmeasured, so the log
// says so in its own field and the founder reads specimens, not counts.
//
// ── TUNED ON ITS FIRST REAL DATA (CE-ruled, post-cure read) ────────────────
// Three moves, each earned by a specimen at 710b4e5 or 1298a8d, none of them a
// guess at what might go wrong:
//
//   provenance WIDENS. "I got it from looking at your work — your Chandigarh
//     portfolio is the thing that made sense to reach out" walked straight
//     past it on Haiku: `flags=none`, on the one question with legal weight,
//     while DeepSeek answered it correctly and DID flag. A class that catches
//     the honest answer and misses the invented one is worse than no class.
//
//   costume ENTERS (CE-98's chartered territory, still report-only). The
//     identity class caught the humanity LIE — "Real person, not a bot" — and
//     was blind to its INVERSE: "I'm not actually Maya… I'm Claude, made by
//     Anthropic. I can see the entire prompt you've shared." Two of nine
//     pre-cure Haiku wakes, `flags=none`, `source=maya` — bytes that would have
//     reached a stranger naming the vendor and describing the system prompt.
//
//   price NARROWS to a figure attached to a NAMED TIER, which is what F-08.60
//     actually convicted. The old term fired 4/4 on correct, approved range
//     sentences — precision debt in the other direction, and a class that
//     always fires tells the reader nothing.
//
// A flag is still a SUSPICION, never a verdict, and nothing below blocks.
// ── RE-KEYED AND DE-PROXIED (CE-ruled at the ×3 read) ─────────────────────
// TWO MISSES, BOTH MINE, BOTH FOUND BY THE FIRST LIVE RUN OF THE CLASS.
//
// (1) IT FIRED ON "your ANYTHING". `(we|i) (saw|found|…) (your|their)` matched
//     "I saw your NUMBER come through" — a claim about the number, not the work,
//     flagged under a class named for work. Now keyed to WORK NOUNS only.
//
// (2) THE GATE WAS THE WRONG FACT. It gated on `blindToTheirWork` — no handle,
//     no category, no city — as a proxy for "she has nothing of theirs". But a
//     handle is not a photograph, and **images are handed to her on NO row, ever**:
//     the context carries handle, category, city and a link, and never a picture.
//     So "your work is stunning" was unfounded on the handle-carrying row too,
//     and the class slept through the dressed version while catching the naked
//     one. The gate is gone. This is now unconditional, which is why it lives in
//     WATCH_CLASSES below rather than in `contextFlags` — it needs no context,
//     because the context never contains the thing being claimed.
const WORK_NOUN = '(?:work|shots|photographs|photos|portfolio|gallery|images|frames|set|feed|instagram|insta)';
const SEEN_WORK_RE = new RegExp(
  // The auxiliary is optional: the live specimen was "I've pulled your
  // Instagram into a demo page", and `i\\s+pulled` does not match "I've pulled".
  '\\b(?:we|i)(?:\\s+have|\\s+had|\u2019ve|\'ve)?\\s+(?:saw|seen|found|looked at|checked out|been through|came across|pulled)\\s+'
  + '(?:your|their)\\s+(?:\\w+\\s+){0,2}' + WORK_NOUN + '\\b'
  + '|\\b(?:your|those|these)\\s+(?:\\w+\\s+){0,2}' + WORK_NOUN
  + '\\b[^.!?]{0,40}\\b(?:stunning|beautiful|gorgeous|exceptional|lovely|incredible|genuinely good)\\b', 'i');

const TIERS = 'trial|essential|signature|prestige';
const WATCH_CLASSES = [
  // identity WIDENS (§5). Two shapes at 39087f4 that the old term slept through,
  // both DeepSeek, both `flags=none`: "I'm Maya — THE PERSON who built you a
  // page" and "the thing I'd want IF I WERE STILL SHOOTING". Neither is the
  // humanity lie; both claim a body or a career. Her soul now refuses both, and
  // this watches for the refusal failing.
  ['identity',   /\b(real person|not a bot|not an ai|i'?m human|actual human|i'?m (?:the |a )?person\b|the person who (?:built|made|wrote|put)|if i were still (?:shooting|photographing|working)|when i (?:was|used to) (?:shoot|work)|back when i (?:shot|worked)|i used to (?:shoot|photograph))\b/i],
  // WIDENED at the 881a084 read (report side): the markdown-headed briefing and
  // the instruction-quoting shapes carried NONE of the old terms and the class
  // slept through them. A structural tell is still a tell.
  // seen_work — unconditional after the de-proxy: images reach her on NO row.
  ['seen_work',  SEEN_WORK_RE],
  ['costume',    /\b(i'?m claude|made by anthropic|an?\s+anthropic\s+model|i can'?t pretend to be|not actually mira|role-?play|the (?:entire )?(?:system )?prompt you|the instructions? (?:say|are|lay out)|instructions i['\u2019]?ve been given|what you'?re actually (?:asking|deciding)|are you testing whether)\b|^\s*#{1,6}\s+\S|\[NOTHING\]/i],
  ['price',      new RegExp('\\b(?:' + TIERS + ')\\b[^.!?]{0,60}Rs\\s?[\\d,]+|Rs\\s?[\\d,]+[^.!?]{0,60}\\b(?:' + TIERS + ')\\b', 'i')],
  // provenance NARROWS TO SOURCE-ASSERTIONS (§5). It fired 5 times at 39087f4
  // and was right ONCE: her honest "I don't know where this number came from"
  // tripped `where.{0,12}number` on BOTH lanes — the class was flagging the
  // correct answer and sleeping through the invented one. It now matches a
  // CLAIM about where they came from, never a denial of knowing.
  ['provenance', /\b(got (?:it|your number|you) from|found you (?:through|on|via)|we found your|came across your|looking at your work|publicly available|business listing|instagram profile|bought your|your (?:\w+ )?portfolio is the thing|your studio came up)\b/i],
  ['link',       /thedreamwedding\.in\/demo\//i],
  // NARROWED at the 9b6e3ca read (§4). `already sent` fired on a legitimate
  // nudge two — "I've already sent you the demo link" — which is a REFERENCE to
  // a send, not a send after the exit. The class exists for the message that
  // should not have existed, so it now matches the SHAPE of a post-exit send
  // rather than any mention of a previous one. First precision datum on it.
  ['post_exit',  /\b(conversation is closed|i don'?t send a third|no third message|this is my last message|i said i would stop)\b/i],
];

// ═════════════════════════════════════════════════════════════════════════════
// §3 · THE WAKE-SEND GATE (CE-ruled) — THE EXIT GATE'S OWN CLASS, ONE ROLE OVER
// ═════════════════════════════════════════════════════════════════════════════
//
// THE ASYMMETRY THAT MAKES THIS SAFE, and it is the whole argument: a WAKE send
// has a property a REPLY never has — **silence is always safe, because nobody
// is waiting.** A dropped reply leaves a human staring at nothing. A dropped
// wake is indistinguishable from her deciding there was nothing worth sending,
// which the [NOTHING] contract already makes a first-class outcome.
//
// So the exit gate's shape extends here: a mechanical predicate, failing to
// SILENCE, on WAKE TURNS ONLY. Replies remain entirely ungated and the founder's
// interception refusal stands untouched exactly where he made it.
//
// THE TELLS ARE THE CONVICTED ONES, not a guess at what might go wrong — every
// one of them is a specimen from a transcript in this repository:
//   markdown_header — "# UNDERSTANDING THE SETUP" (881a084, Haiku, rep 3). No
//                     WhatsApp message opens on a heading. This one walked past
//                     the watcher entirely: no "Claude", no "roleplay".
//   roleplay        — "you're asking me to roleplay as Mira" (881a084, rep 2)
//   claude          — "I'm Claude, made by Anthropic" (1298a8d, the gravest)
//   nothing_token   — the contract token EMBEDDED in prose rather than sent
//                     alone; `isNothing` handles the bare form, so reaching here
//                     means she is discussing the machinery, not using it
//   vacated_name    — "Maya", retired at F-08.75 and never again a live byte
//
// A DROPPED WAKE MUST NOT SPEND ONE OF HER TWO. `runNudgeJob` already declines
// to log a `no_send`, so the derived standing does not rise and she keeps the
// message. That was built for the [NOTHING] path and it is load-bearing here.
// F-08.79 — THE STRUCTURAL TELL, ADDED AT 1d79567. Two Haiku wakes produced a
// numbered "are you Kanupriya, or are you testing me?" interrogation, one of
// them quoting "The instructions I've been given are very specific." NONE of the
// existing tells fired: no header, no "roleplay", no "Claude". The set was
// word-shaped and the specimen's disease is ANATOMICAL — an enumeration handed
// to a stranger, plus a second-person question about who they are or whether
// they are testing. That anatomy is what this matches, so the next specimen does
// not need to share a vocabulary with the last one.
const ENUMERATION_RE   = /^[ \t]*(?:\d+[.)]|[-*•])[ \t]+\S/m;
const INTERROGATION_RE = /\bare you\b[^?]{0,60}\?|\b(?:you'?re|are you) (?:testing|someone testing)\b|\btesting (?:me|the (?:system|instructions|prompt))\b|\binstructions i['\u2019]?ve been given\b/i;

const WAKE_COSTUME_TELLS = [
  ['markdown_header', /^\s*#{1,6}\s+\S/],
  ['enumerated_interrogation', {
    test: (t) => ENUMERATION_RE.test(t) && INTERROGATION_RE.test(t),
  }],
  ['roleplay',        /\brole-?play(ing)?\b/i],
  ['claude',          /\bclaude\b|\banthropic\b/i],
  ['nothing_token',   /\[NOTHING\]/],
  ['vacated_name',    /\bMaya\b/],
];

function wakeCostumeTells(text) {
  const t = String(text || '');
  return WAKE_COSTUME_TELLS.filter(c => c[1].test(t)).map(c => c[0]);
}

// ═════════════════════════════════════════════════════════════════════════════
// §3 · THE TWO CONTEXT-DERIVED CLASSES (CE-ruled at the 9b6e3ca read)
// ═════════════════════════════════════════════════════════════════════════════
//
// THE TRADE THIS ARC JUST MADE, NAMED. F-08.83's cure gave her something to
// lead with, and the ×3 that proved it also produced six fabrications she had
// never made while she was empty-handed. **An agent that sells invents material
// when it has none.** Two of the six had a class already (a tier price, an
// invented provenance) and the watcher caught both. Four had none.
//
// THESE TWO ARE DIFFERENT IN KIND FROM EVERY OTHER WATCH CLASS: they cannot be
// decided from the text alone. "We saw your work" is TRUE on a row carrying an
// ig_handle and a lie on a bare one; "your work is on our marketplace" is true
// on a discover_eligible demo and false on every other row. So they are derived
// from the CONTEXT the turn was actually given, compared against what went out
// — which is the only place both facts exist at once.
//
//   seen_work            — a claim to have looked at their work, on a row with
//                          no handle, no category and no city. Specimens at
//                          9b6e3ca: "we saw your work" and "those shots are
//                          genuinely stunning", both on rows she had never been
//                          shown a photograph of.
//   marketplace_presence — a claim that their work is IN FRONT of couples, when
//                          the context said the opposite. Specimen: "your work
//                          is actually in front of couples right now on our
//                          marketplace" on a demo the context called NOT
//                          discoverable. The generic true form — couples are
//                          browsing and your work is NOT there — is the green
//                          specimen's own shape and must not flag.
//
// REPORT-ONLY, as always. Nothing below blocks.
const MARKETPLACE_PRESENT_RE = /\byour work is (?:already |actually )?(?:on|in front of|live on)\b|\b(?:on|in front of) (?:our |the )?marketplace (?:right now|already)\b/i;

// ONE CLASS LEFT HERE, AND IT IS GENUINELY CONTEXTUAL. `marketplace_presence`
// cannot be decided from the text: "your work is on our marketplace" is TRUE on
// a discoverable demo and false on every other row. `seen_work` moved out,
// because after the de-proxy it needs nothing from the context at all — which
// is the honest place for it and makes the split itself the documentation.
//
// ITS FIRST LIVE CATCH IS ITS OWN FIXTURE: at 22d6df9 she wrote "Your work is
// live on The Dream Wedding, which is a marketplace where couples… find vendors
// like you" and, two sentences later in the SAME send, "not live on the
// marketplace yet." The class caught the half that was false.
function contextFlags(text, opts) {
  const o = opts || {};
  return (!o.discoverable && MARKETPLACE_PRESENT_RE.test(String(text || '')))
    ? ['marketplace_presence'] : [];
}

function watchFlags(text) {
  const t = String(text || '');
  return WATCH_CLASSES.filter(c => c[1].test(t)).map(c => c[0]);
}

// ═════════════════════════════════════════════════════════════════════════════
// THE TURN
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @returns {Promise<{text:string, source:string, model?:string, provider?:string}>}
 *   `source` is 'closer' | 'exit_static' | 'registered_user_redirect' | 'error'. Never
 *   throws for
 *   a model failure: the caller's existing graceful line covers it, and a
 *   stranger mid-conversation must not meet a stack trace.
 */
// `llm` is injectable for the bench and NOTHING ELSE. It exists because two of
// this function's limbs — the no-send path and the link normalizer — are only
// observable in its RETURN VALUE, and a mutation that removed either one passed
// a bench that could not reach them. A check that cannot fire is not a check
// (F-08.53's third limb), so the seam was opened rather than the limbs left
// unproven. Production never passes it.
async function runCloserTurn({ supabase, prospect, conversationId, phone, wakeReason, llm }) {
  const _create = llm || llmCreate;
  if (await isRegisteredUser(supabase, phone)) {
    console.log(`[closer] REDIRECT — ${normalizeTo(phone)} is a registered user; no Closer turn (F-08.55)`);
    return { text: REGISTERED_USER_LINE, source: 'registered_user_redirect' };
  }

  const route = await resolveModel(supabase, SURFACE, TIER);

  const isNudge = wakeReason === 'nudge';

  // ── F-08.69 · THE WAKE RIDES ITS OWN LANE (CE-ruled, an assignment not a cure)
  // Haiku wake-turns failed in EVERY build of this arc — 9/9 narration, 7/9
  // self-reintroduction, 4/9 refusals, 4/9 costume breaks at 881a084 including
  // a markdown-headed briefing to an imagined operator, on the wire. DeepSeek
  // wake-turns: 0/9 that night, effectively clean across the arc. The frame now
  // works so well that a careful model reads the whole wake as a brief, and the
  // careful model in this house is Haiku.
  //
  // Amendment Two's own geometry, one role over: `donna_provider` routes a role
  // separately from the surface; `nudge_provider` does the same for the wake.
  // REPLIES ARE UNTOUCHED — they stay on the seeded lane, which is where she is
  // good. If the split is absent (unseeded row, or a keyless provider that
  // `guardKeys` dropped loudly), the wake falls back to the reply lane, which
  // is the pre-ruling behaviour rather than a silent misroute.
  const wakeSplit = isNudge && route.nudge_provider && route.nudge_model;
  const turnRoute = wakeSplit
    ? { provider: route.nudge_provider, model: route.nudge_model }
    : { provider: route.provider, model: route.model };

  // THE USER-ROLE WAKE IS GONE (F-08.57). Nothing is appended to the message
  // stream. The history is cut at the prospect's last inbound so it ends where
  // they went quiet, and everything the machinery knows rides the context block.
  //
  // F-08.66: `histOpts` is named rather than inline because `loadHistory`
  // publishes the cut sends back onto it. What the truncation removed from the
  // MESSAGES is what the CONTEXT quotes, and this object is the only thing
  // standing between those two facts.
  const histOpts = { truncateAtInbound: isNudge };
  const messages = await loadHistory(supabase, conversationId, histOpts);
  const nudgesStanding = isNudge ? await countNudgesStanding(supabase, conversationId) : 0;

  // THE STANDING IS MACHINERY AND STAYS MACHINERY (F-08.67). It rides the log
  // line and the returned object — where the founder and the harness read it —
  // and it does NOT enter the context, because the quoted sends are the
  // context's only source of how many stand.
  // ── §2 · THE EXIT WAKE MAKES NO MODEL CALL AT ALL (CE-ruled) ─────────────
  // 0/4 LIFETIME, across every build and both architectures, while the SAME
  // models write graceful goodbyes inside live conversations. The disease is
  // precisely the wake-into-silence, and the arc's law has held every time it
  // was tested: TIMING IS NOT PROSE'S TO HOLD.
  //
  // The link gate was the last attempt to hold it mechanically and F-08.74 is
  // why it could not: the predicate was a pasted URL, and the close simply
  // relocated into the prose around it. There is no predicate to step around
  // here, because there is no model turn. Zero tokens, zero latency; it cannot
  // pitch, cannot wall, cannot narrate.
  //
  // HER TWO NUDGES STAY WHOLLY HERS — that is where she is genuinely good, and
  // nothing above this line changed. Only the parting sentence left her hands,
  // and `closerSoul.js` says so in her own register (F-06.85, both ends).
  //
  // ⚠ `runNudgeJob` GATES ON `source`, and a source it does not know is a send
  // that silently never happens. `exit_static` is admitted there explicitly.
  if (isNudge && isExitWake(histOpts.unansweredSends)) {
    console.log(`[closer] EXIT — the static parting line, NO model call `
      + `(prospect=${prospect && prospect.id} conv=${conversationId} `
      + `nudges_standing=${nudgesStanding} quoted_sends=${(histOpts.unansweredSends || []).length})`);
    return { text: EXIT_LINE, source: 'exit_static', nudgesStanding,
             unansweredSends: (histOpts.unansweredSends || []).length,
             signed: false, normalized: 0, exitGated: false, flags: [],
             calledProvider: 'none', calledModel: 'none' };
  }

  const ctxOpts = { wakeReason, unansweredSends: histOpts.unansweredSends || [] };
  const dynamic = await buildProspectContext(supabase, prospect, ctxOpts);
  const system = buildStaticSystem().concat([{ type: 'text', text: dynamic }]);

  // AN EMPTY HISTORY CANNOT BE SENT. Removing the user-role wake removed the
  // one message that was propping this call up on a cold conversation, and the
  // API refuses a request with no messages. On a nudge that is not an error — it
  // is nothing to nudge about — so it takes the no-send path. On a reply it is a
  // genuine fault and throws, because a human just spoke.
  if (!messages.length) {
    if (isNudge) {
      console.log('[closer] no-send — a nudge with no conversation behind it has nothing to say');
      return { text: '', source: 'no_send', model: turnRoute.model, provider: turnRoute.provider,
               nudgesStanding };
    }
    throw new Error('closer turn reached the model with an empty history');
  }

  const resp = await _create(turnRoute.provider, {
    model:      turnRoute.model,
    max_tokens: MAX_TOKENS,
    system,
    messages,
  });

  let text = (resp.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();

  // THE LINK NORMALIZER, at the last point before the words become an outbound.
  // THE [NOTHING] CONTRACT, honoured before anything else touches the bytes.
  if (isNothing(text)) text = '';

  // ── THE REGISTER, FIRST, so everything downstream sees the corrected bytes
  //    and the watcher's own witness is taken BEFORE the swap ──────────────
  const regFlags = registerFlags(text);
  const reg = normalizeRegister(text);
  if (reg.corrected) {
    console.warn(`[closer] REGISTER NORMALIZED x${reg.corrected} — a rupee glyph reached the wire (F-08.78)`);
    text = reg.text;
  }

  const fixed = normalizeDemoLinks(text, ctxOpts.demoLink, ctxOpts.demoHandle);
  if (fixed.corrected) {
    console.warn(`[closer] LINK NORMALIZED x${fixed.corrected} — a demo URL did not match the handed constant (F-08.61)`);
    text = fixed.text;
  }

  // ── THE EXIT GATE — NOW DEFENCE IN DEPTH, and named as such ──────────────
  // §2 made the exit a static send, so in the normal path this can no longer
  // fire: control never reaches here on an exit wake. It STAYS as the second
  // wall the CE ruled it into — if any future path ever routes an exit through
  // the model again, a goodbye carrying the demo link is still refused. It is
  // proven in ISOLATION by the bench rather than through a turn, because a
  // green over an unreachable path is not evidence.
  const gate = gateExitLink(text, isExitWake(ctxOpts.unansweredSends), ctxOpts.demoLink);
  if (gate.gated) {
    console.warn('[closer] EXIT GATE — a goodbye carried the demo link; the plain exit ships instead '
      + `(prospect=${prospect && prospect.id} conv=${conversationId})`);
  }
  text = gate.text;
  const exitGated = gate.gated;

  const manual = loadManual();
  // R1 AS AMENDED: the version stamp's executable home.
  // ── F-08.72 · THE LINE OF RECORD NAMES THE MOUTH THAT SPOKE ──────────────
  // THIS PRINTED `route.provider`. `modelRouter` holds a 60-SECOND in-process
  // route cache, so on a two-lane run the second lane inherits the first lane's
  // route until that window expires — five DeepSeek transcripts wore Haiku's
  // name at 710b4e5 while the harness had forced the call to DeepSeek. The text
  // was DeepSeek's and the record said otherwise. Per-mouth attribution is
  // F-04.78's geometry and it is not negotiable.
  //
  // A facade that overrides what it was handed SAYS SO, on the response, and
  // this reads it. In production nothing overrides and the two agree; where
  // they diverge the divergence is now visible instead of silent, and `route_*`
  // rides beside it LABELLED as the route it actually was.
  const called = (resp && resp._called) || { provider: turnRoute.provider, model: turnRoute.model };
  console.log(`[closer] turn ${MIRA} soul=${CLOSER_SOUL_VERSION} manual=${manual.version} `
    + `called_provider=${called.provider} called_model=${called.model} `
    + `route_provider=${turnRoute.provider} route_model=${turnRoute.model} `
    + `wake_split=${!!wakeSplit} wake=${wakeReason || 'reply'} `
    + `nudges_standing=${nudgesStanding} quoted_sends=${ctxOpts.unansweredSends.length} `
    + `in=${resp.usage && resp.usage.input_tokens} `
    + `out=${resp.usage && resp.usage.output_tokens} `
    + `cache_read=${(resp.usage && resp.usage.cache_read_input_tokens) || 0}`);

  // ── THE NO-SEND PATH (F-08.57's third limb, CE-ruled) ────────────────────
  // A woken turn may have nothing worth saying, and until now she had no way to
  // express that except by SAYING it: "I've already sent my last message. The
  // conversation is closed." — a message, to a human, announcing that no message
  // is being sent. That sentence was silence trying to happen through the only
  // channel available to it.
  //
  // So on a WOKEN turn, empty is legal and it means send nothing. On a REPLY,
  // empty is still a fault: a human just spoke and silence would be the rudest
  // possible answer, so it throws and the caller's existing vetoed graceful line
  // covers it.
  // ── THE WAKE-SEND GATE FIRES HERE, on the corrected bytes, before the
  //    signature — a dropped wake is never signed, because it never goes ────
  if (isNudge) {
    const tells = wakeCostumeTells(text);
    if (tells.length) {
      console.warn(`[closer:wake_costume] prospect=${prospect && prospect.id} conv=${conversationId} `
        + `tells=${tells.join(',')} provider=${turnRoute.provider} — WAKE DROPPED TO SILENCE. `
        + 'Nothing sent, nothing logged, her message is NOT spent (F-08.69)');
      return { text: '', source: 'no_send', model: turnRoute.model, provider: turnRoute.provider,
               nudgesStanding, unansweredSends: ctxOpts.unansweredSends.length,
               signed: false, normalized: fixed.corrected, exitGated: false,
               flags: ['wake_costume'], wakeTells: tells,
               calledProvider: called.provider, calledModel: called.model };
    }
  }

  // THE SIGNATURE, last, so it lands on the bytes that actually go out.
  const signedOut = appendLinkSignature(text, ctxOpts.demoLink);
  text = signedOut.text;

  // THE WATCHER — after every correction, because what it must witness is what
  // the PROSPECT receives, not what the model first produced.
  const flags = watchFlags(text).concat(regFlags)
    .concat(contextFlags(text, ctxOpts));
  if (flags.length) {
    console.warn(`[closer:watch] prospect=${prospect && prospect.id} conv=${conversationId} `
      + `classes=${flags.join(',')} signed=${signedOut.signed} normalized=${fixed.corrected} `
      // F-08.72, THE ONE LINE I MISSED. The TURN line was cured to name the mouth
      // that spoke; this line was not, so every wake at dcdc8f1 read
      // `provider=anthropic` while `called=deepseek`. Same class, one file, six
      // lines apart — which is exactly how F-04.38's twin survived a cure.
      + `provider=${called.provider} — REPORT ONLY, nothing blocked, precision UNMEASURED`);
  }

  if (!text) {
    if (isNudge) {
      console.log(`[closer] no-send — woken with nothing to say, and that is a legal answer`);
      return { text: '', source: 'no_send', model: turnRoute.model, provider: turnRoute.provider,
               nudgesStanding };
    }
    throw new Error('closer turn produced no text');
  }
  // F-08.68 — `nudgesStanding` and `unansweredSends` are RETURNED, not merely
  // logged, because the scenarios harness printed its own loop counter as the
  // transcript's "[nudge, N standing]" label and the engine had derived
  // something else. A transcript's every number must be a fact the engine
  // produced; the only way to guarantee that is to hand it out from here.
  // THE TOKEN IS PERSONA-NEUTRAL (F-08.75). It read 'maya'; a machine token
  // carrying a vacated persona's name is a rename waiting to be missed.
  return { text, source: 'closer', model: turnRoute.model, provider: turnRoute.provider,
           signed: signedOut.signed, upgraded: !!signedOut.upgraded,
           normalized: fixed.corrected, flags, exitGated,
           calledProvider: called.provider, calledModel: called.model,
           nudgesStanding, unansweredSends: ctxOpts.unansweredSends.length };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE NUDGE JOB (FORK 1) — the machinery that WAKES her
// ═════════════════════════════════════════════════════════════════════════════
//
// IT WAKES HER; IT NEVER WORDS HER. This job composes nothing. It finds
// conversations that have gone quiet, counts what already stands unanswered from
// the message rows themselves, and starts a full Closer turn. Every byte the
// prospect reads is hers.
//
// THE CAP IS MECHANICAL AND FAIL-CLOSED: at two nudges standing she gets exactly
// one more turn (the exit) and at three she is never woken again. A model cannot
// talk its way past this because the model is not consulted about it.
//
// THE THRESHOLDS ARE EVIDENCED, not chosen for feel. Everything must fit inside
// the WhatsApp customer-service window or `sendWa` refuses the send anyway:
//   · WINDOW_HOURS = 24 (`prospects.js`), and `runExpiryJob` flips `in_session`
//     to `expired` past that same 24h.
//   · The marketing cron runs HOURLY at :05 (`marketingCron.js`), so any
//     threshold finer than an hour is unresolvable and any two thresholds closer
//     than an hour collapse into one tick.
//   · Three sends (nudge, nudge, exit) must therefore sit inside 24h with room
//     for the sweep's own granularity.
// Hence 4h / 10h / 20h. Founder-adjustable without a deploy through
// admin_config, per the estate's config-over-code doctrine; the defaults hold
// against an unseeded key, which `demoLifecycle.js:80-82` names as the NORMAL
// state of this estate.
const NUDGE_CONFIG_KEY  = 'marketing.nudge_hours';
const DEFAULT_NUDGE_HOURS = [4, 10, 20];
const MAX_NUDGES = 2;   // + one exit message

async function readNudgeHours(supabase) {
  if (!supabase) return DEFAULT_NUDGE_HOURS;
  try {
    const { data } = await supabase
      .from('admin_config').select('value').eq('key', NUDGE_CONFIG_KEY).maybeSingle();
    if (!data || data.value == null) return DEFAULT_NUDGE_HOURS;
    const v = JSON.parse(String(data.value));
    if (Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(Number(n)) && Number(n) > 0)) {
      return v.map(Number);
    }
    return DEFAULT_NUDGE_HOURS;
  } catch (_e) {
    return DEFAULT_NUDGE_HOURS;
  }
}

async function runNudgeJob({ supabase, sendWa, sendWaDeps, now, runTurn }) {
  const _sendWa = sendWa || require('../lib/sendWa').sendWa;
  const _deps   = sendWaDeps || {};
  const _turn   = runTurn || runCloserTurn;
  const at      = now ? new Date(now).getTime() : Date.now();
  const hours   = await readNudgeHours(supabase);

  const { data: live } = await supabase
    .from('prospects')
    .select('id, phone, name, ig_handle, category, city, state, notes, demo_vendor_ref, session_opened_at')
    .eq('state', 'in_session');

  const results = [];
  for (const p of (live || [])) {
    try {
      const { data: conv } = await supabase
        .from('conversations').select('id')
        .eq('prospect_id', p.id).eq('kind', 'prospect_marketing').maybeSingle();
      if (!conv) continue;

      const { data: rows } = await supabase
        .from('messages').select('direction, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (!rows || !rows.length) continue;
      if (rows[0].direction !== 'outbound') continue;          // they answered; nothing to do

      const standing = nudgesStandingFrom(rows);
      if (standing > MAX_NUDGES) continue;                      // the exit has already been sent

      const sinceLast = (at - new Date(rows[0].created_at).getTime()) / 3600000;
      if (!(sinceLast >= hours[standing])) continue;            // not due yet

      const out = await _turn({
        supabase, prospect: p, conversationId: conv.id, phone: p.phone, wakeReason: 'nudge',
      });
      // THE GUARD SPOKE — never nudge over a redirect.
      if (out.source === 'registered_user_redirect') continue;
      // THE NO-SEND PATH — woken with nothing to say. Transport sends nothing,
      // and NOTHING IS LOGGED either: an unsent message must not raise the
      // derived standing, or a silent turn would spend one of her two.
      if (out.source === 'no_send' || !out.text) {
        results.push({ prospectId: p.id, standing, sent: false, reason: 'no_send' });
        continue;
      }
      // §2 — `exit_static` is a REAL SEND with no model behind it. A source this
      // gate does not know is a message that silently never happens, which is
      // how a whole feature disappears without a red anywhere.
      if (out.source !== 'closer' && out.source !== 'exit_static') continue;

      await _sendWa(
        { line: 'marketing', to: p.phone, text: out.text, windowOpen: true,
          conversationId: conv.id, supabase },
        _deps,
      );
      await supabase.from('messages').insert({
        conversation_id: conv.id, direction: 'outbound', channel: 'whatsapp',
        body: out.text, sent_by: 'system',
      });
      results.push({ prospectId: p.id, standing, sent: true });
    } catch (e) {
      // F-05.19 STATED: nudges are FREE-FORM inside an already-open 24h window,
      // never templates, so Meta's marketing template pacing is untouched by
      // this job. A refusal here is almost always the window having closed or a
      // STOP, and both are correct outcomes reported out loud.
      console.warn(`[wa:marketing:nudge] skipped prospect ${p.id}: ${e && (e.code || e.message)}`);
      results.push({ prospectId: p.id, sent: false, error: e && (e.code || e.message) });
    }
  }
  return { woken: results.filter(r => r.sent).length, results };
}

module.exports = {
  runCloserTurn,
  runNudgeJob,
  // exported for the bench
  loadManual, _sliceManual, buildStaticSystem, buildProspectContext, loadHistory,
  nudgesStandingFrom, countNudgesStanding, isRegisteredUser, readNudgeHours,
  normalizeDemoLinks, truncateAtLastInbound, unansweredSendsFrom, DEMO_LINK_RE,
  appendLinkSignature, LINK_SIGNATURE, PARTIAL_SIGNOFF_RE, isNothing, NOTHING_TOKEN,
  watchFlags, WATCH_CLASSES, contextFlags, SEEN_WORK_RE, MARKETPLACE_PRESENT_RE,
  wakeCostumeTells, WAKE_COSTUME_TELLS,
  normalizeRegister, registerFlags, RUPEE_GLYPH_RE,
  isExitWake, gateExitLink, EXIT_LINE,
  REGISTERED_USER_LINE, PRODUCT_LINK, MANUAL_BODY_FROM_LINE,
  NUDGE_CONFIG_KEY, DEFAULT_NUDGE_HOURS, MAX_NUDGES, SURFACE, TIER,
};
