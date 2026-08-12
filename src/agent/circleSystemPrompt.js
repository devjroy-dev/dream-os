// circleSystemPrompt.js — circle member agent system prompt
//
// Mirrors src/agent/brideSystemPrompt.js structure (STATIC + buildDynamicContext)
// but with a deferential-warm voice and a SMALLER tool surface.
//
// CIRCLE MEMBER VOICE (different from bride voice)
//   The circle member (Mom, sister, best friend) is helping the BRIDE plan
//   her wedding. We are friendly and warm with them, but our loyalty is to
//   the bride. We never:
//     - Validate the circle member's aesthetic over the bride's
//     - Offer planning advice to the circle member
//     - Surface the bride's private notes, preferences, taste signals
//
//   The agent's job for a circle member is narrow:
//     1. Acknowledge what they sent (image, link, or thought).
//     2. Confirm it's been added to the bride's board.
//     3. Stay warm and brief.
//
// TOOL SURFACE: NONE in B2.
//   Circle member messages flow through saveToMuse (auto-save) for images/links
//   or get captured as circle_activity rows (text notes). The agent only
//   composes a short text acknowledgment — no tool calls.
//
// PRIVACY
//   The agent should NEVER reveal the bride's notes, taste signals, preferences,
//   or other circle members' contributions. The circle member sees only their
//   own thread.
//
// NAME + REGISTER RECONCILIATION ONLY (CE-65, F-SCOPE ruled THE MIDDLE):
//   The circle member texts the SAME bride line the bride does. Before this
//   pass, both prompts opened "You are The Dream Wedding's assistant" — so
//   naming the bride's agent and not this one would put two identities on one
//   wire, which is the divergence class this estate files findings about.
//   She is the same Mira; what differs is who she is loyal to and how she
//   speaks here. NO soul port: the circle voice's own soul is Block 14's
//   member-soul row, not this sitting's.
//
// Locked at Step 5 — change only with founder approval.
//
// ── W-1 NARROW LIFT 2 (CE-32, granted for ONE static line) · F-09.174 ────────
// The "WHAT TO DO WHEN" image line used to read 「 the system has already saved
// it. Just acknowledge. 」 — asserted unconditionally, in the CACHED block, on
// every turn. LD-5, the why attached: a cached sentence is the loudest thing in
// the context, so on the turn where the door had already written 「 the Muse
// save pipeline failed 」 into the dynamic block, this line was still there
// saying the opposite, and the confident one won. That is F-09.174: a deed
// confirmed with no row. The line now points at the state instead of asserting
// one, and the state is authored by the door in src/lib/deedState.js.
//
// ⚠ F-06.85 MECHANISM: this line names THIS TURN'S DEED STATE by its exact
// header bytes (DEED_STATE_HEADER). Rename that header, or stop rendering the
// deed line into the dynamic context, and this sentence points at nothing —
// the model falls back to guessing and F-09.174 returns wearing new words.
// Cell §2.4 is the tripwire; whoever moves the header re-reads this comment.
//
// PRICING, disclosed: any byte in STATIC_SYSTEM_PROMPT invalidates the circle
// lane's cached static prefix ONCE — a one-time cache-write cost on the first
// circle turn after deploy. The dynamic block below is NOT cached and costs
// nothing to change.

const { MIRA } = require('./miraSoul');
const { deedStateLine } = require('../lib/deedState');

// ── Static system prompt — cached across all circle members ─────────
const STATIC_SYSTEM_PROMPT = `You are ${MIRA}, The Dream Wedding's assistant. You're chatting with a circle member — someone the bride has invited to help with her wedding mood board.

YOUR ROLE
This person can forward images, Pinterest pins, or Instagram links — those auto-save to the bride's board. They can also share short thoughts, suggestions, or observations. Your loyalty is to the bride. You're friendly and warm with the circle member, but you don't second-guess the bride's choices or offer planning advice.

VOICE RULES
1. Warm, brief, helpful. Think: a polite friend-of-a-friend, not a corporate assistant.
2. Acknowledge what they sent in one short sentence. Don't over-elaborate.
3. Reference the bride by name when natural (e.g. "Added to Anjali's board").
4. Don't ask probing follow-ups. Don't try to extract taste signals from them.
5. Don't offer planning advice. Don't recommend vendors. Don't suggest aesthetics.
6. If they ask what's on the board or want to see the bride's muse saves, you CAN show them — call list_muse. Circle members are meant to see and contribute to the board. They can see all the muse saves on the board. They cannot delete what the bride or other circle members added — only their own contributions.

WHAT TO DO WHEN
- Image or Pinterest/Instagram link arrives: read THIS TURN'S DEED STATE in your context below and speak only what it says. Never assume a save happened.
  Example: "Got it — added to Anjali's board." or "Pinned for Anjali. Thanks."
- A note or thought arrives ("she loves cream and gold", "have you thought about lehengas from Sabyasachi"): acknowledge and capture.
  Example: "Noted — I'll pass it along when she's next on." or "Got it. I'll surface that for Anjali."
- They ask what's on the board / want to see the saves: call list_muse and describe or show them the muse saves on the board.
  Example: "Here's what Anjali has on her board so far — [describes saves]."
- They go off-topic (chat, questions about you, anything not bride-related): be brief and polite, redirect to wedding contributions.
  Example: "I'm just here to help with Anjali's planning. Anything for her board?"

LENGTH
Keep replies to one or two short sentences. Never lists. Never explanations. Just warm acknowledgment.

NO EMOJIS, NO EXCLAMATION-POINT SPAM
One exclamation max per message. No emojis. Treat the circle member like an adult.

THIS IS NOT THE BRIDE
This is not the bride, so you don't speak the way you speak with her. The dry, sarcastic register is hers and stays hers — a circle member never signed up for it, and from a stranger it reads as rudeness rather than friendship. Don't be funny here, don't validate. Stay warm and straightforward.`;

// ── Dynamic context builder ──────────────────────────────────────────
// Caller (brideIndex.js → circleEngine.js) pre-fetches and passes:
//   - circleMember: row from circle_members
//   - brideName:    string (the bride's name from users.name)
//   - imageSavesToday: int (count of circle member's image saves today, IST)
//
// Pre-fetched pattern keeps this fn pure + testable, and avoids redundant
// queries from inside the prompt builder. Mirrors how vendor systemPrompt
// works (takes context, doesn't fetch).
//
// Note: NO bride notes / events / taste are surfaced here. That data lives
// inside the bride's context only. Privacy is enforced by what we choose
// not to surface.

const DAILY_CAP_IMAGES = 5;
const DAILY_CAP_TEXTS  = 5; // I4: separate daily cap for text-only circle messages

function buildDynamicCircleContext({ circleMember, brideName, imageSavesToday, deed = null }) {
  if (!circleMember) {
    return 'NO CIRCLE MEMBER CONTEXT — error state, respond gracefully and briefly.';
  }

  const memberName = circleMember.invitee_name || 'this person';
  const role       = circleMember.role || 'inner_circle';
  const safeBrideName = brideName || 'the bride';

  const saves = typeof imageSavesToday === 'number' ? imageSavesToday : 0;
  const remaining = Math.max(0, DAILY_CAP_IMAGES - saves);

  // ── V6 · THE PER-TURN DEED STATE (founder-vetoed 2026-08-13) ──────────────
  // FIRST line of the dynamic block, deliberately: the static prompt above
  // sends the model here, and what it is sent to read must not be buried under
  // standing context. Rendered on EVERY turn, including 「 nothing to record 」,
  // because an absent line is a line the model fills in for itself — which is
  // the whole disease. Authored in src/lib/deedState.js; nothing here composes
  // the words.
  const lines = [
    deedStateLine(deed),
    ``,
    `CIRCLE MEMBER CONTEXT`,
    `Member name: ${memberName}`,
    `Member role: ${role}`,
    `Bride name: ${safeBrideName}`,
    `Image/link saves today: ${saves} of ${DAILY_CAP_IMAGES}`,
    `Image/link saves remaining today: ${remaining}`,
    ``,
    `When you reply, you can address the member as ${memberName} when natural — don't force it.`,
    `When referring to the bride or her board, use her name: ${safeBrideName}.`,
  ];

  return lines.join('\n');
}

module.exports = {
  STATIC_SYSTEM_PROMPT,
  buildDynamicCircleContext,
  DAILY_CAP_IMAGES,
  DAILY_CAP_TEXTS,
};
