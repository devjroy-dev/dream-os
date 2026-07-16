// tombstone_bench.js — F-04.51's cure, guarded. (TDW_04 Part B, spine sitting.)
//
// ── WHAT THIS IS, IN ITS FIRST LINES (CE-ruled 2026-07-16, Q-SP-5) ────────
//   · IT STUBS THE DB CLIENT. No live estate is touched: no Supabase call, no
//     network, no row read or written, anywhere, ever.
//   · IT PROVES CONTROL FLOW, NEVER A LIVE ESTATE. It requires and calls the REAL
//     compiled runTurn — not a copy of its logic — and watches which rows it would
//     write. What it cannot tell you is whether the database would accept them.
//   · IT IS NOT AN INTEGRATION TEST. Never read it as one. The ERROR gate remains
//     BENCH-ONLY by deliberate restraint (CE-accepted): forcing a real writeFields
//     failure means breaking a live estate on purpose.
//   · RUN BY HAND. The estate has no test framework; smoke.js is the precedent and
//     this file's only sibling in kind.
//
//       from the dream-os repo root:   npm run build && node src/engine/tombstone_bench.js
//       expected:                      15 passed, 0 failed
//
// ── WHY IT LIVES HERE INSTEAD OF BEING DELETED (the ruling's reason) ──────
//
// A CURE NOBODY CAN RE-RUN QUIETLY STOPS BEING A CURE.
//
// T-4 exists because the spine executor got it wrong. His §1.4 sketch published the
// conversation id at getOrCreateConversation's resolve — written from READING. The
// bench proved it: a throw in the window between the resolve and saveMessage(user)
// (loadOwner, loadFacts, snapshotText, donnaMessages and the shelf read ALL await
// there) tombstoned a thread WITH NO USER ROW IN IT — an assistant row denying a
// reply to a message that was never recorded, and on a fresh conversation the
// thread's FIRST message. F-04.51's own disease rebuilt inside its cure.
//
// MOVE THE PUBLISH LINE BACK TO THE RESOLVE AND T-4 FAILS — while typecheck stays
// green, build stays green, and the engine smoke stays green. THIS FILE IS THE ONLY
// THING THAT CATCHES IT. That is the whole argument for its existence: F-04.42 and
// F-04.44 sit in the block's unproven ledger precisely because they shipped with no
// witness, and prose does not guard a predicate.
//
// THE PREDICATE IT GUARDS (CE-ruled, canonical justification):
//     THE TOMBSTONE MARKS AN ORPHAN; AN ORPHAN REQUIRES A USER ROW.
//   -> the catch fires ONLY on `ctx.conversationId && !ctx.saved`, and ALWAYS
//      rethrows. The id is published only once the user row has landed.
//
// ── THE MECHANISM IT DRIVES ──────────────────────────────────────────────
// A transport whose provider is 'anthropic' throwing from stream() — the witnessed
// disease's exact shape (a balance exhaustion). The streamCall's catch skips its
// non-anthropic downgrade branch and rethrows, straight out past the user row that
// already landed. Statements are named, never line numbers: this file's own subject
// moved every number in loop.ts down by ~126 lines.
process.env.SUPABASE_URL = 'http://stub.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub';
process.env.ANTHROPIC_API_KEY = 'stub';

// Same shape as smoke.js: __dirname-relative, so it runs from any working directory.
const db = require(__dirname + '/dist/core/db.js');

const MESSAGES = [];      // every messages-row insert, in order
let convoInserts = 0;

// A chainable stub. Every read resolves {data,error}; every terminal is awaited.
function stub(table) {
  const chain = {
    _table: table, _rows: null,
    select() { return chain; }, eq() { return chain; }, neq() { return chain; },
    is() { return chain; }, in() { return chain; }, or() { return chain; },
    ilike() { return chain; }, gte() { return chain; }, order() { return chain; },
    limit() { return chain; }, update() { return chain; }, schema() { return chain; },
    upsert() { return chain; }, delete() { return chain; }, filter() { return chain; },
    not() { return chain; }, lte() { return chain; }, lt() { return chain; }, gt() { return chain; },
    insert(row) {
      if (table === 'messages') MESSAGES.push(row);
      if (table === 'conversations') convoInserts++;
      chain._inserted = row; return chain;
    },
    maybeSingle() { return Promise.resolve(resolve(table, 'maybeSingle', chain)); },
    single() { return Promise.resolve(resolve(table, 'single', chain)); },
    then(res, rej) { return Promise.resolve(resolve(table, 'list', chain)).then(res, rej); },
  };
  return chain;
}

function resolve(table, mode, chain) {
  if (table === 'agents' && mode === 'maybeSingle') {
    return { data: { id: 'agent-1', tier: 'signature', display_name: 'Victor',
                     profession_preset: null, timezone: 'Asia/Kolkata', mode: 'chat' }, error: null };
  }
  if (table === 'conversations') {
    if (mode === 'single') return { data: { id: 'conv-STUB-1' }, error: null }; // the insert's .select().single()
    return { data: null, error: null };  // no latest -> fresh-thread branch
  }
  if (table === 'agent_owner' && mode === 'maybeSingle') return { data: null, error: null };
  return { data: [], error: null };
}

db.supabase.from = (t) => stub(t);
db.supabase.schema = () => ({ from: (t) => stub(t) });

const { runTurn } = require(__dirname + '/dist/core/loop.js');

const BLESSED = 'ERROR — no reply was generated (provider failure). Nothing was done.';
const rows = () => MESSAGES.map((m) => `${m.role}: ${JSON.stringify(m.content)}`);
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + (detail ? '  <-- ' + detail : '')); }
};

// A transport that IS the anthropic route and dies exactly as the balance exhaustion did.
const dyingAnthropic = {
  provider: 'anthropic',
  stream() { throw new Error('400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low"}}'); },
  create() { throw new Error('unused'); },
};

// A transport that answers cleanly (no tools) — the control.
const healthyAnthropic = {
  provider: 'anthropic',
  stream() {
    return {
      on() {},
      finalMessage: async () => ({
        content: [{ type: 'text', text: 'All set — the 22nd is yours.' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    };
  },
  create() { throw new Error('unused'); },
};

(async () => {
  console.log('\n=== T-1 — THE DISEASE: provider failure after the user row lands ===');
  MESSAGES.length = 0;
  let threw = null;
  try {
    await runTurn({ agentId: 'agent-1', message: 'move Meera\'s wedding shoot to 15 November',
                    transport: dyingAnthropic });
  } catch (e) { threw = e; }
  console.log('  thread now holds:'); rows().forEach((r) => console.log('     ' + r));
  ok('the user message is preserved', MESSAGES.some((m) => m.role === 'user'));
  ok('an assistant row EXISTS — the orphan is gone', MESSAGES.some((m) => m.role === 'assistant'));
  const tomb = MESSAGES.find((m) => m.role === 'assistant');
  ok('it is the founder-blessed string, VERBATIM', tomb && tomb.content === BLESSED,
     tomb ? JSON.stringify(tomb.content) : 'no assistant row');
  ok('it carries no tool_calls', tomb && tomb.tool_calls === null);
  ok('it landed in the SAME conversation as the user row',
     tomb && MESSAGES[0] && tomb.conversation_id === MESSAGES[0].conversation_id,
     tomb ? `${MESSAGES[0] && MESSAGES[0].conversation_id} vs ${tomb.conversation_id}` : '');
  ok('exactly ONE getOrCreateConversation insert — no second thread minted', convoInserts === 1,
     `convoInserts=${convoInserts}`);
  ok('the original error is RETHROWN, not swallowed', threw && /credit balance/.test(threw.message),
     threw ? threw.message.slice(0, 40) : 'nothing thrown');

  console.log('\n=== T-2 — THE §1.5 GUARD: a healthy turn must NEVER gain a tombstone ===');
  MESSAGES.length = 0; convoInserts = 0;
  await runTurn({ agentId: 'agent-1', message: 'all good?', transport: healthyAnthropic });
  console.log('  thread now holds:'); rows().forEach((r) => console.log('     ' + r));
  const assistants = MESSAGES.filter((m) => m.role === 'assistant');
  ok('exactly one assistant row', assistants.length === 1, `got ${assistants.length}`);
  ok('it is the REAL reply, not the tombstone', assistants[0] && assistants[0].content !== BLESSED);
  ok('no tombstone anywhere in the thread', !MESSAGES.some((m) => m.content === BLESSED));

  console.log('\n=== T-3 — NOTHING TO MARK: failure BEFORE the conversation resolves ===');
  MESSAGES.length = 0; convoInserts = 0;
  const savedFrom = db.supabase.from;
  db.supabase.from = (t) => (t === 'agents'
    ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'boom' } }) }) }) }
    : stub(t));
  let threw3 = null;
  try { await runTurn({ agentId: 'agent-1', message: 'hello', transport: healthyAnthropic }); }
  catch (e) { threw3 = e; }
  db.supabase.from = savedFrom;
  ok('the agent-lookup error is rethrown', threw3 && /agent lookup failed/.test(threw3.message),
     threw3 ? threw3.message : 'nothing thrown');
  ok('ZERO rows written — no user row, so no orphan, so no tombstone', MESSAGES.length === 0,
     `got ${MESSAGES.length} rows`);

  console.log('\n=== T-4 — THE WINDOW MY OWN SKETCH OPENED: throw AFTER the conversation');
  console.log('         resolves but BEFORE the user row lands (snapshotText, a real await) ===');
  MESSAGES.length = 0; convoInserts = 0;
  const saved4 = db.supabase.from;
  db.supabase.from = (t) => {
    if (t === 'agent_snapshot') throw new Error('snapshot store unreachable');
    return stub(t);
  };
  let threw4 = null;
  try { await runTurn({ agentId: 'agent-1', message: 'hello', transport: healthyAnthropic }); }
  catch (e) { threw4 = e; }
  db.supabase.from = saved4;
  console.log('  thread now holds:');
  if (!MESSAGES.length) console.log('     (nothing)'); else rows().forEach((r) => console.log('     ' + r));
  ok('the snapshot error is rethrown', threw4 && /snapshot store unreachable/.test(threw4.message),
     threw4 ? threw4.message : 'nothing thrown');
  ok('NO user row landed (the throw beat saveMessage(user))', !MESSAGES.some((m) => m.role === 'user'));
  ok('THEREFORE no tombstone — there is no orphan to mark',
     !MESSAGES.some((m) => m.content === BLESSED),
     'a tombstone answering NOTHING; on a fresh thread it becomes the FIRST message, and '
     + 'the Anthropic API requires the first message to be `user` — every later turn 400s. '
     + 'F-04.51 rebuilt inside its own cure, worse.');

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})();
