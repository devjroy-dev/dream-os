// scripts/b09_d3b_singlepersist_bench.js — B-09H · D-3b · THE BEHAVIOURAL HALF.
//
// The structural half (b09_d3_structural_bench.js §7) asserts the BYTES: the marker is
// gone, the header is gone, the second persist is gone, the schema no longer asks the
// model for a uuid. Bytes cannot show what the model was actually handed, or what the
// engine actually resolved. This bench drives the REAL runBrideAgenticTurn and the REAL
// execListMuse against fixtures shaped like production and reads what came out.
//
// TWO CURES, CE-32-RULED:
//   ⑤(b)      the doubled bride message (and the genuine turn it evicted)
//   F-09.171  playback resolves through the stamp — the model never names a session
//
// BOTH-WAYS DISCIPLINE (production mutation only, never test setup). The sentinel
// mutations, each reddening a NAMED cell:
//   · restore slice-before-filter in brideEngine's history assembly  → §1.1 §1.2 RED
//   · drop the `break` (remove EVERY matching inbound, not one)      → §1.3 RED
//   · restore the positional test (i === arr.length - 1)             → §1.1 §1.2 RED
//   · execListMuse resolves without the summary_message_id predicate → §2.2 RED
//   · execListMuse orders the stamp lookup ascending                 → §2.3 RED
//   · the surfacer re-appends the [session_id: uuid] marker          → §3.2 RED
//   · the surfacer restores the [SYSTEM NOTE] header                 → §3.1 RED
//
// RUNNABLE FROM ANY WORKING DIRECTORY (Q-SP-5) — every path resolved off __dirname.
//
// DECLARED LIMIT, NOT PAPERED: `src/lib/supabase.js` calls createClient() at module scope
// and throws without credentials, so it is FENCED in require.cache before the bride lane
// loads. That is transport shell — the real engine, the real history assembly, the real
// resolver and the real composer all run against the fence unmodified.
'use strict';
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');

// ── Fence the shared client BEFORE the lane loads (same shape as b05_couple_soul) ─────
// FIRST RUN OF THIS BENCH FAILED HERE, recorded rather than quietly fixed: the fence was
// a stub returning `{}`, and §1 died on `from(...).select is not a function`. The reason
// is load-bearing and worth keeping in the file — `buildDynamicContext` reads the
// MODULE-LEVEL client from src/lib/supabase.js, not the one passed into the turn. A fence
// that cannot answer a query does not fence the transport, it removes a collaborator the
// code under test genuinely uses.
const SUPA_PATH = require.resolve('../src/lib/supabase.js');
require.cache[SUPA_PATH] = {
  id: SUPA_PATH, filename: SUPA_PATH, loaded: true,
  exports: { supabase: supabaseFake({
    couples: { id: 'c1', user_id: 'u1', partner_name: 'Arjun', wedding_city: 'Jaipur',
               wedding_date: null, budget_total: null, events_planned: null,
               onboarding_state: 'complete',
               users: { name: 'Test Bride', phone: '919625759924', pronouns: 'she' } },
    couple_state: { summary: null, taste_notes: null, vendor_shortlist: null },
    notes: [], events: [],
  }) },
};

for (const rel of ['../src/agent/brideEngine.js']) delete require.cache[require.resolve(rel)];
const engine = require('../src/agent/brideEngine.js');

// ── RESTORE-PROOF (CE-32 RULING 1, born of seat defect le3) ───────────────────────────
// A mutation harness that restores production files but leaves its own scaffolding
// unaccounted for is half a harness. le3: a fixture's cleanup ran `rm -f` on a path the
// fixture had NOT created, and deleted a live 154-line production module. It was caught
// by `git status`, which is the wrong instrument — the founder runs benches on lawfully
// dirty applied trees, where git status is noise by design.
//
// So: CHECKSUMS OF TOUCHED PATHS, and the ledger covers WRITES AND DELETES ALIKE, with
// no distinction between "a production mutation" and "just a fixture". A path's absence
// is recorded as its own state, so restoring a file that should not exist reddens exactly
// as loudly as failing to restore one that should.
const crypto = require('crypto');
const _restoreLedger = new Map();
function _digest(rel) {
  const abs = P(rel);
  if (!fs.existsSync(abs)) return 'ABSENT';
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}
// Call BEFORE touching a path, whether writing, mutating or deleting it.
function touching(rel) {
  if (!_restoreLedger.has(rel)) _restoreLedger.set(rel, _digest(rel));
  return P(rel);
}
// Call at the end of the run. Returns [] when every touched path is byte-identical.
function restoreViolations() {
  const bad = [];
  for (const [rel, before] of _restoreLedger) {
    const after = _digest(rel);
    if (after !== before) {
      bad.push(before === 'ABSENT'
        ? `${rel} — the harness LEFT BEHIND a path that did not exist before the run`
        : after === 'ABSENT'
          ? `${rel} — the harness DELETED a path it did not create (le3's exact shape)`
          : `${rel} — restored, but NOT byte-identical`);
    }
  }
  return bad;
}

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}
function section(s) { console.log(`\n${s}`); }

// ── fixtures ──────────────────────────────────────────────────────────────────────────
const COUPLE = { id: 'c1', user_id: 'u1', onboarding_state: 'complete' };
const USER   = { id: 'u1', name: 'Test Bride', phone: '919625759924' };
const CONVO  = { id: 'conv1' };
const SESSION_A = '11111111-1111-4111-8111-111111111111';
const SESSION_B = '22222222-2222-4222-8222-222222222222';

// A supabase fake driven by a per-table row map. List selects resolve through `then`,
// which is how the production history query reads. `captures` records every insert and
// update so a cell can read the row production actually built.
//
// THE FAKE HONOURS `.not()`, `.order()` AND `.limit()` — deliberately, and the reason is
// the whole point of §2.2. A pass-through fake returns the same rows whatever the query
// asks, so a resolver that dropped the stamp predicate entirely would still look right to
// a behavioural cell. That is a cell that reads its own fixture rather than the code. The
// mutation run proved it: with a pass-through fake, dropping the predicate reddened only
// the structural cell. So the filter is real here, and §2.2 discriminates.
function supabaseFake(rows, captures = { inserts: [], updates: [] }) {
  function builder(table) {
    const q = { nots: [], order: null, limit: null };
    const b = {};
    for (const m of ['select', 'eq', 'gte', 'lte', 'lt', 'gt', 'neq', 'is', 'in', 'range', 'upsert', 'delete']) {
      b[m] = () => b;
    }
    b.not   = (col, op, val) => { q.nots.push({ col, op, val }); return b; };
    b.order = (col, opts) => { q.order = { col, asc: !!(opts && opts.ascending) }; return b; };
    b.limit = (n) => { q.limit = n; return b; };
    b.insert = (row) => { captures.inserts.push({ table, row }); return b; };
    b.update = (row) => { captures.updates.push({ table, row }); return b; };
    function resolved() {
      let data = rows[table];
      if (!Array.isArray(data)) return data ?? null;
      data = data.slice();
      for (const n of q.nots) {
        if (n.op === 'is' && n.val === null) data = data.filter(r => r[n.col] !== null && r[n.col] !== undefined);
      }
      if (q.order) {
        data.sort((x, y) => {
          const a = x[q.order.col], c = y[q.order.col];
          if (a === c) return 0;
          return (a > c ? 1 : -1) * (q.order.asc ? 1 : -1);
        });
      }
      if (q.limit !== null) data = data.slice(0, q.limit);
      return data;
    }
    b.single      = () => Promise.resolve({ data: Array.isArray(rows[table]) ? (resolved()[0] ?? null) : rows[table] ?? null, error: null });
    b.maybeSingle = b.single;
    b.then = (res, rej) => Promise.resolve({
      data: Array.isArray(rows[table]) ? resolved() : null, error: null,
    }).then(res, rej);
    return b;
  }
  return { from: (tb) => builder(tb), rpc: () => Promise.resolve({ data: null, error: null }), __captures: captures };
}

function spyAnthropic() {
  const calls = [];
  return {
    calls,
    messages: {
      create: async (payload) => {
        calls.push(payload);
        return { content: [{ type: 'text', text: 'Got it.' }], stop_reason: 'end_turn',
                 usage: { input_tokens: 10, output_tokens: 3 } };
      },
    },
  };
}

const msg = (direction, body, minutesAgo) => ({
  direction, body, sent_by: direction === 'inbound' ? 'couple' : 'agent', tool_calls: null,
  created_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
});

// Drive the REAL turn and hand back the messages array the model was given.
async function realTurnMessages(historyRows, inboundMessage) {
  const spy = spyAnthropic();
  await engine.runBrideAgenticTurn({
    couple: COUPLE, user: USER, conversation: CONVO,
    inboundMessage,
    // No circle sessions pending on these fixtures: the history shape is the subject.
    supabase: supabaseFake({ couples: COUPLE, couple_state: {}, notes: [], events: [],
                             messages: historyRows, circle_sessions: [] }),
    anthropic: spy,
  });
  const turn = spy.calls.find(c => Array.isArray(c.system));
  assert.ok(turn, 'no model call in this turn carried a system array — the loop never ran');
  return turn.messages;
}

(async () => {

// ═══ §1 — ⑤(b): THE DOUBLED BRIDE MESSAGE, AND THE TURN IT ATE ═════════════════════
section('§1  ⑤(b) — the fan-out history, the double, and the depth');

// THE NAMED FIXTURE: fan-out shaped. Her inbound is logged, THEN the circle summary row
// lands (the surfacer persists before the send), so her message is NOT the last item —
// which is precisely why the old positional test never fired.
const FANOUT = [
  msg('outbound', 'summary of what mom added', 0),   // newest first: the SELECT orders desc
  msg('inbound',  'what did mom add?',         1),
  msg('outbound', 'Sounds lovely.',            5),
  msg('inbound',  'we picked the palette',     6),
  msg('outbound', 'Noted.',                    9),
  msg('inbound',  'book the caterer',         10),
];

await t('§1.1 her message appears EXACTLY ONCE — the double dies on the fan-out shape', async () => {
  const messages = await realTurnMessages(FANOUT, 'what did mom add?');
  const occurrences = messages.filter(m => m.role === 'user' && m.content === 'what did mom add?');
  assert.strictEqual(occurrences.length, 1,
    `the model was handed her message ${occurrences.length} times: ${JSON.stringify(messages.map(m => m.role + ':' + m.content))}`);
  // And it is the LAST thing the model sees — the turn it is being asked to answer.
  assert.strictEqual(messages[messages.length - 1].content, 'what did mom add?');
  assert.strictEqual(messages[messages.length - 1].role, 'user');
});

await t('§1.2 the summary row survives, and no genuine turn is evicted to fit the double', async () => {
  const messages = await realTurnMessages(FANOUT, 'what did mom add?');
  // The window is HISTORY_LIMIT(5) of history + the appended inbound. Under the old
  // slice-before-filter the duplicate consumed a slot and the OLDEST genuine turn fell
  // off. Every genuine turn in the fixture must be present.
  for (const expected of ['summary of what mom added', 'Sounds lovely.', 'we picked the palette', 'Noted.', 'book the caterer']) {
    assert.ok(messages.some(m => m.content === expected),
      `"${expected}" was evicted from the window — the duplicate ate a genuine turn: ${JSON.stringify(messages.map(m => m.content))}`);
  }
});

// THE THIRD LEG, ruled by CE-32: a bare content match would remove EVERY identical
// inbound in the window. She says 「 yes 」 often. The earlier one is hers and stays.
const REPEATED_YES = [
  msg('outbound', 'Want me to send them here?', 0),
  msg('inbound',  'yes',                        1),
  msg('outbound', 'Shall I add the sangeet?',   4),
  msg('inbound',  'yes',                        5),
  msg('outbound', 'Morning!',                   8),
];

await t('§1.3 AT MOST ONE — an earlier identical "yes" SURVIVES the removal', async () => {
  const messages = await realTurnMessages(REPEATED_YES, 'yes');
  const yeses = messages.filter(m => m.role === 'user' && m.content === 'yes');
  // One historical 「 yes 」 (the older one, hers) + the appended inbound = two.
  assert.strictEqual(yeses.length, 2,
    `expected the earlier "yes" to survive alongside the appended inbound, got ${yeses.length}: ${JSON.stringify(messages.map(m => m.role + ':' + m.content))}`);
  // The one that was removed is the LAST occurrence — so the message immediately
  // before the appended inbound is the assistant turn that preceded it, not a stale yes.
  assert.strictEqual(messages[messages.length - 1].content, 'yes');
  assert.strictEqual(messages[messages.length - 2].content, 'Want me to send them here?');
});

await t('§1.4 the removal is order-correct: filter runs BEFORE the slice, in code', () => {
  // The independent method — the behaviour cells above prove the outcome, this proves
  // the ORDERING that produces it, so a future refactor that gets the right answer by
  // accident on these fixtures still reddens.
  const src = read('src/agent/brideEngine.js');
  const spliceAt = src.indexOf('mapped.splice(i, 1)');
  const sliceAt  = src.indexOf('const history = mapped.slice(-HISTORY_LIMIT)');
  assert.ok(spliceAt > 0, 'the tail-scan removal is gone');
  assert.ok(sliceAt > 0, 'the slice is gone');
  assert.ok(spliceAt < sliceAt, 'the slice runs BEFORE the removal — ⑤(b) is back');
  assert.ok(!/\.slice\(-HISTORY_LIMIT\)\s*\n\s*\.map\(/.test(src),
    'the old slice-before-map chain survives');
  assert.ok(/break;\s*\/\/ AT MOST ONE/.test(src) || /break;/.test(src.slice(spliceAt, spliceAt + 200)),
    'the removal loop has no break — it removes every match, not the last one');
});

// ═══ §2 — PLAYBACK: THE STAMP RESOLVES WHAT THE MODEL NO LONGER NAMES ══════════════
section('§2  F-09.171 playback — stamp resolution, on a real-shaped fixture');

await t('§2.1 the tool surface offers no uuid parameter for the model to fill', () => {
  const tools = read('src/agent/brideTools.js');
  const listMuse = tools.slice(tools.indexOf("name: 'list_muse'"), tools.indexOf("name: 'list_muse'") + 3000);
  assert.ok(!/^\s*session_id: \{/m.test(listMuse), 'list_muse still declares session_id');
  assert.ok(/from_recent_circle_session: \{/.test(listMuse), 'the re-aimed boolean is absent');
  assert.ok(!/Format: UUID/.test(listMuse), 'the schema still tells the model to produce a UUID');
});

await t('§2.2 the flag resolves to the STAMPED session and scopes to its saves', async () => {
  // THE DISCRIMINATING FIXTURE: three sessions. The most RECENT one is UNSTAMPED — she
  // was never told about it — and must be passed over for the most recent STAMPED one.
  // A resolver that takes "most recent session" without the stamp predicate scopes her
  // playback to activity she has never seen mentioned.
  const rows = {
    circle_sessions: [
      { id: 'unstamped-and-newest', summary_message_id: null, last_activity_at: new Date(Date.now() - 1000).toISOString() },
      { id: SESSION_B, summary_message_id: 'm-b', last_activity_at: new Date(Date.now() - 60000).toISOString() },
      { id: SESSION_A, summary_message_id: 'm-a', last_activity_at: new Date(Date.now() - 600000).toISOString() },
    ],
    circle_activity: [{ subject_id: 'save-1' }, { subject_id: 'save-2' }],
    muse_saves: [
      { id: 'save-1', save_number: 4, source_type: 'image', image_url: 'https://x/1.jpg', caption: null, aesthetic_tags: [], saved_by_role: 'circle_member', created_at: new Date().toISOString() },
      { id: 'save-2', save_number: 5, source_type: 'image', image_url: 'https://x/2.jpg', caption: null, aesthetic_tags: [], saved_by_role: 'circle_member', created_at: new Date().toISOString() },
    ],
  };
  const supa = supabaseFake(rows);
  const media = [];
  const logged = [];
  const realLog = console.log;
  console.log = (...a) => { logged.push(a.join(' ')); realLog(...a); };
  let res;
  try {
    res = await engine.executeBrideTool({
      name: 'list_muse',
      input: { from_recent_circle_session: true, request_image_playback: true },
      couple: COUPLE, user: USER, supabase: supa,
      anthropic: spyAnthropic(), mediaUrlsToReturn: media,
    });
  } finally { console.log = realLog; }
  assert.ok(res && res.ok !== false, `list_muse failed: ${JSON.stringify(res)}`);
  assert.strictEqual(res.count, 2, `expected the session's two saves, got ${res.count}`);
  assert.ok(media.length > 0, 'playback queued no images');
  // WHICH session was resolved — read from the production log line, not predicted.
  const line = logged.find(l => l.includes('resolved recent circle session'));
  assert.ok(line, 'the resolver logged no resolution — it did not run');
  assert.ok(line.includes(SESSION_B),
    `the resolver picked the wrong session: ${line}`);
  assert.ok(!line.includes('unstamped-and-newest'),
    'the resolver took the newest session REGARDLESS of the stamp — she was never told about it');
});

await t('§2.3 the resolution reads the stamp and the ratified recency key', () => {
  const src = read('src/agent/brideEngine.js');
  const block = src.slice(src.indexOf('from_recent_circle_session === true'), src.indexOf('from_recent_circle_session === true') + 1200);
  assert.ok(/from\('circle_sessions'\)/.test(block), 'the resolver does not read circle_sessions');
  assert.ok(/\.not\('summary_message_id', 'is', null\)/.test(block),
    'the resolver does not require the stamp — an unsummarised session could be resolved and she was never told about it');
  assert.ok(/\.order\('last_activity_at', \{ ascending: false \}\)/.test(block),
    'the ratified recency key is not the order');
  assert.ok(/\.limit\(1\)/.test(block), 'the resolver does not take exactly one session');
});

await t('§2.4 no stamped session → an honest empty, never a silent widening', async () => {
  const supa = supabaseFake({ circle_sessions: [], circle_activity: [], muse_saves: [] });
  const media = [];
  const res = await engine.executeBrideTool({
    name: 'list_muse',
    input: { from_recent_circle_session: true, request_image_playback: true },
    couple: COUPLE, user: USER, supabase: supa,
    anthropic: spyAnthropic(), mediaUrlsToReturn: media,
  });
  assert.strictEqual(res.count, 0, 'a couple with no stamped session got saves back — the narrowing failed OPEN');
  assert.strictEqual(media.length, 0, 'images were queued for a session that does not exist');
});

// ═══ §3 — THE COMPOSED THING (the return the two callers send) ═════════════════════
section('§3  the surfacer returns one clean composed thing');

// Two pending sessions, both summarisable. The composer calls Haiku once per session.
function surfacerFixture() {
  const captures = { inserts: [], updates: [] };
  const rows = {
    circle_sessions: [
      { id: SESSION_A, circle_member_id: 'cm1', started_at: new Date(Date.now() - 7200000).toISOString(), last_activity_at: new Date(Date.now() - 3600000).toISOString() },
    ],
    circle_members: { id: 'cm1', invitee_name: 'Mom' },
    circle_activity: [{ activity_type: 'save_added', subject_type: 'muse_save', subject_id: 'save-1', created_at: new Date().toISOString() }],
    muse_saves: [{ id: 'save-1', save_number: 4, caption: 'this lehenga', aesthetic_tags: ['ethnic'] }],
    conversations: { id: 'conv1' },
    messages: { id: 'msg-new' },
  };
  return { supa: supabaseFake(rows, captures), captures };
}

await t('§3.1 displayText carries NO header and NO instruction paragraph', async () => {
  const { supa } = surfacerFixture();
  const out = await engine.surfacePendingCircleSessions({
    couple_id: 'c1', supabase: supa, anthropic: spyAnthropic(), channel: 'whatsapp',
  });
  assert.ok(out !== null, 'the fixture surfaced nothing — this cell would have passed vacuously; the fixture is the subject');
  assert.ok(typeof out.displayText === 'string', 'displayText is not a string');
  assert.ok(!out.displayText.includes('[SYSTEM NOTE'), 'the header reached displayText');
  assert.ok(!/Weave this into your reply/.test(out.displayText), 'the instruction paragraph reached displayText');
});

await t('§3.2 displayText carries NO session marker, and sessionIds carries the ids', async () => {
  const { supa } = surfacerFixture();
  const out = await engine.surfacePendingCircleSessions({
    couple_id: 'c1', supabase: supa, anthropic: spyAnthropic(), channel: 'whatsapp',
  });
  assert.ok(out !== null, 'the fixture surfaced nothing — this cell would have passed vacuously; the fixture is the subject');
  assert.ok(!out.displayText.includes('[session_id:'), 'the marker reached the bride-bound text');
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(out.displayText),
    'a uuid in any form reached the bride-bound text');
  assert.ok(Array.isArray(out.sessionIds), 'sessionIds is not an array');
});

await t('§3.3 the return SHAPE is the ruled one — object or null, never a string', () => {
  const src = read('src/agent/brideEngine.js');
  const fn = src.slice(src.indexOf('async function surfacePendingCircleSessions'));
  assert.ok(/return \{\s*\n\s*displayText: summaryLines\.join/.test(fn),
    'the surfacer no longer returns { displayText, sessionIds }');
  assert.ok(/if \(summaryLines\.length === 0\) return null;/.test(fn),
    'the empty case no longer returns null');
  assert.ok(!/\]\.join\('\\n'\);/.test(fn.slice(fn.indexOf('if (summaryLines.length === 0)'))),
    'the old joined-document return survives');
});

// ═══ §4 — THE HARNESS PROVES ITS OWN RESTORATION (CE-32 Ruling 1) ══════════════════
section('§4  restore-proof — every path this bench writes OR deletes, by checksum');

await t('§4.1 the ledger detects a path the harness deleted but did not create', () => {
  // Exercised, not asserted: create a real state, record it, break it, and require the
  // ledger to name the break. A restore-proof that is never made to fail is a comment.
  const probe = 'scripts/.restore_probe_tmp';
  const abs = touching(probe);
  fs.writeFileSync(abs, 'x');            // now ABSENT -> present: a leave-behind
  assert.ok(restoreViolations().some(v => v.includes('LEFT BEHIND')),
    'the ledger did not notice a path the harness created and failed to clean up');
  fs.unlinkSync(abs);
  assert.deepStrictEqual(restoreViolations(), [],
    'the ledger still reports a violation after the probe was cleaned up');
  // And the le3 shape itself: a pre-existing path the harness removes.
  const real = 'src/agent/brideNudge.js';
  const before = fs.readFileSync(P(real));
  touching(real);
  fs.unlinkSync(P(real));
  assert.ok(restoreViolations().some(v => v.includes('DELETED a path it did not create')),
    'the ledger did not notice le3 — a production file removed by the harness');
  fs.writeFileSync(P(real), before);
  assert.deepStrictEqual(restoreViolations(), [],
    'the production file was not restored byte-identically');
});

console.log(`\n────────────────────────────────────────────────────────────────────────────────`);
// THE RESTORE-PROOF IS PART OF THE VERDICT, not a footnote after it. A run that mutated
// the tree and left it moved is RED even if every cell passed.
const violations = restoreViolations();
if (violations.length) {
  fail++;
  console.log(`  RESTORE VIOLATION — the harness left the tree moved:`);
  for (const v of violations) console.log(`    · ${v}`);
} else {
  console.log(`  restore-proof: ${_restoreLedger.size} touched path(s), all byte-identical`);
}
console.log(`  total ${pass + fail} · passed ${pass} · failed ${fail} · skipped 0`);
console.log(`  VERDICT: ${fail === 0 ? 'GREEN' : 'RED'}`);
console.log(`────────────────────────────────────────────────────────────────────────────────\n`);
process.exit(fail === 0 ? 0 : 1);
})();
