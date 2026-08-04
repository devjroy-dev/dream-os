// closerEngine.js — MAYA'S TURN. The marketing lane's model seam.
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
const { MAYA, MAYA_SOUL, CLOSER_SOUL_VERSION } = require('./souls/closerSoul');

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
// every fabrication specimen turned out to be the label echoed back. Maya does
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
    { type: 'text', text: MAYA_SOUL, cache_control: { type: 'ephemeral' } },
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
// CONTEXT SOURCE: THE DEMO ROW IS PRIMARY (CE-ruled). The 06 spec says Maya
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
  if (!handle && !category && !city) {
    lines.push('You know nothing about their work yet. Do not guess at it — ask, or wait for them to say.');
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

    // ── THE CLOCK: CONDITIONED OR SILENT (CE-ruled) ─────────────────────────
    // A deadline with no mechanism behind it is F-06.85's class, so the clock
    // enters context ONLY when this row is genuinely in the sweep's population.
    //
    // MECHANISM NAMED: `runSunsetSweep` in `src/lib/demoLifecycle.js` updates
    // only rows matching `state IN SUNSET_STATES` AND `claimed_at IS NULL` AND
    // `discover_eligible = true`, against `COALESCE(invited_at, created_at) <
    // now - N days`, N from `readSunsetDays` (admin_config `demo.sunset_days`,
    // default 90). `sunset_at` is NOT the deadline — it is the HISTORY stamp
    // that sweep writes when it fires, and a row carrying it has already left
    // Discover. If that predicate changes, this block is wrong and must be
    // re-read with it.
    const inSweepPopulation =
      demo.discover_eligible === true &&
      !demo.claimed_at &&
      !demo.sunset_at &&
      demoLifecycle.SUNSET_STATES.includes(demo.state);

    if (inSweepPopulation) {
      const days   = await demoLifecycle.readSunsetDays(supabase);
      const anchor = new Date(demo.invited_at || demo.created_at).getTime();
      const left   = Math.floor((anchor + days * 24 * 3600 * 1000 - Date.now()) / (24 * 3600 * 1000));
      if (Number.isFinite(left) && left > 0) {
        lines.push(`Days left before it rotates out of the marketplace: ${left}. This is a real clock and you may say so.`);
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
  // The count is DERIVED from the conversation's own messages and stored
  // nowhere — zero DDL, the record is the truth. She is told the number; SHE
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
  // MECHANISM NAMED (F-06.85): this block is conditioned on `runNudgeJob`
  // waking her at all, and on `loadHistory` truncating at the last inbound so
  // no trailing assistant turn invites a continuation. If either changes, this
  // paragraph is false and must be re-read with it.
  if (o.wakeReason === 'nudge') {
    const standing   = o.nudgesStanding || 0;
    const remaining  = Math.max(0, MAX_NUDGES - standing);
    lines.push('');
    lines.push('WHERE THIS CONVERSATION STANDS');
    lines.push(standing === 1
      ? 'Your last message stands unanswered.'
      : `Your last ${standing} messages stand unanswered.`);
    lines.push(remaining > 0
      ? `You have ${remaining} more message${remaining === 1 ? '' : 's'} after this one.`
      : 'This is the last message you will send on this conversation.');
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

async function loadHistory(supabase, conversationId, opts) {
  const { data } = await supabase
    .from('messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  let rows = (data || []).slice().reverse();
  if (opts && opts.truncateAtInbound) rows = truncateAtLastInbound(rows);
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
// Maya's lane had no equivalent and could not acquire one by accident:
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
// into Maya, loudly logged.
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
      + 'FAILING OPEN into Maya: a human already spoke to us and silence is the ruder failure');
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
const DEMO_LINK_RE = /https?:\/\/[^\s<>()\[\]"']*thedreamwedding\.in\/[^\s<>()\[\]"']*/gi;

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
// THE TURN
// ═════════════════════════════════════════════════════════════════════════════
/**
 * @returns {Promise<{text:string, source:string, model?:string, provider?:string}>}
 *   `source` is 'maya' | 'registered_user_redirect' | 'error'. NEVER throws for
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
    console.log(`[closer] REDIRECT — ${normalizeTo(phone)} is a registered user; no Maya turn (F-08.55)`);
    return { text: REGISTERED_USER_LINE, source: 'registered_user_redirect' };
  }

  const route = await resolveModel(supabase, SURFACE, TIER);

  const isNudge = wakeReason === 'nudge';

  // THE USER-ROLE WAKE IS GONE (F-08.57). Nothing is appended to the message
  // stream. The history is cut at the prospect's last inbound so it ends where
  // they went quiet, and everything the machinery knows rides the context block.
  const messages = await loadHistory(supabase, conversationId, { truncateAtInbound: isNudge });
  const nudgesStanding = isNudge ? await countNudgesStanding(supabase, conversationId) : 0;

  const ctxOpts = { wakeReason, nudgesStanding };
  const dynamic = await buildProspectContext(supabase, prospect, ctxOpts);
  const system = buildStaticSystem().concat([{ type: 'text', text: dynamic }]);

  const resp = await _create(route.provider, {
    model:      route.model,
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
  const fixed = normalizeDemoLinks(text, ctxOpts.demoLink, ctxOpts.demoHandle);
  if (fixed.corrected) {
    console.warn(`[closer] LINK NORMALIZED x${fixed.corrected} — a demo URL did not match the handed constant (F-08.61)`);
    text = fixed.text;
  }

  const manual = loadManual();
  // R1 AS AMENDED: the version stamp's executable home.
  console.log(`[closer] turn ${MAYA} soul=${CLOSER_SOUL_VERSION} manual=${manual.version} `
    + `provider=${route.provider} model=${route.model} wake=${wakeReason || 'reply'} `
    + `nudges_standing=${nudgesStanding} in=${resp.usage && resp.usage.input_tokens} `
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
  if (!text) {
    if (isNudge) {
      console.log(`[closer] no-send — woken with nothing to say, and that is a legal answer`);
      return { text: '', source: 'no_send', model: route.model, provider: route.provider };
    }
    throw new Error('closer turn produced no text');
  }
  return { text, source: 'maya', model: route.model, provider: route.provider };
}

// ═════════════════════════════════════════════════════════════════════════════
// THE NUDGE JOB (FORK 1) — the machinery that WAKES her
// ═════════════════════════════════════════════════════════════════════════════
//
// IT WAKES HER; IT NEVER WORDS HER. This job composes nothing. It finds
// conversations that have gone quiet, counts what already stands unanswered from
// the message rows themselves, and starts a full Maya turn. Every byte the
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
      if (out.source !== 'maya') continue;

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
  normalizeDemoLinks, truncateAtLastInbound, DEMO_LINK_RE,
  REGISTERED_USER_LINE, PRODUCT_LINK, MANUAL_BODY_FROM_LINE,
  NUDGE_CONFIG_KEY, DEFAULT_NUDGE_HOURS, MAX_NUDGES, SURFACE, TIER,
};
