#!/usr/bin/env node
'use strict';
// scripts/b06_fresh_thread_bench.js — TDW_06 P6a (F-06.8): THE FRESH-THREAD SEAM BENCH.
// Runnable from any working directory, clean clone, no network, no keys:
//   node scripts/b06_fresh_thread_bench.js
//
// WHAT IT PROVES (behaviour, LD-5 — never wording), driving the REAL exported
// abandonActiveThread (the one home POST /chat/thread/fresh and the WA mode-words seam
// both chain — a bench that re-implemented the branch would prove its own copy, F-04.55):
//   §1 A FLIP MID-THREAD OPENS FRESH: an active conversation is abandoned; the very next
//      active-lookup returns null, so the next turn carries ZERO prior-room turns
//      (F-06.8's Image-1 contamination cured at the source).
//   §2 D-4's NO-CLEAR LAW: the cure is an UPDATE to state='abandoned', NEVER a delete —
//      the conversation row and its messages persist (scrollback survives; the seam renders).
//   §3 IDEMPOTENT ON A NO-OP: nothing active -> { ok:true, closed:null } with NO write
//      issued (a re-flip to the same mode, or a flip with no live thread, is safe).
//   §4 A NON-ACTIVE LATEST is left untouched: an already-'abandoned' latest -> closed:null,
//      no write (the seam only ever abandons a LIVE thread).
//
// BOTH-WAYS: §1/§2 are FALSE at the uncured surface — before F-06.8 a flip wrote victor_mode
// and left the active conversation live, so the next advisor turn loaded the prior room's
// turns (the contamination). §3's "no write on a no-op" is the guard that makes chaining the
// seam from the always-flips chip AND the whole-message WA words both safe.
//
// DISCLOSED RIG: a mock supabase exposing .schema('engine').from('conversations') with the
// exact chain the helper calls (select/eq/order/limit/maybeSingle + update/eq). It witnesses
// every write op so a stray delete or an unnecessary update convicts. No live DB.

const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// The engine's db.js throws at load if these are absent; the bench injects a mock and never
// touches the real client, so inert values just let the module graph load.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

const { abandonActiveThread } = require(path.join(ROOT, 'src/api/vendor-engine/chat.js'));

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('    PASS  ' + label); } else { fail++; console.log('    FAIL  ' + label); } };

// ── the mock supabase ──────────────────────────────────────────────────────────
// rows: array of { id, agent_id, state } ordered as the DB would return them (the helper
// asks for last_active_at desc, limit 1 — the mock returns rows[0] as "the latest").
function mkSupabase(rows) {
  const ops = { updates: [], deletes: [] }; // witness every write
  const conversations = {
    _filters: {},
    select() { return this; },
    eq(col, val) { this._filters[col] = val; return this; },
    order() { return this; },
    limit() { return this; },
    maybeSingle() {
      const agentId = this._filters['agent_id'];
      const latest = rows.filter(r => r.agent_id === agentId)[0] || null;
      return Promise.resolve({ data: latest ? { id: latest.id, state: latest.state } : null, error: null });
    },
    update(patch) {
      return { eq: (col, val) => {
        ops.updates.push({ id: val, patch });
        const row = rows.find(r => r.id === val);
        if (row) Object.assign(row, patch); // reflect the write so a re-read sees 'abandoned'
        return Promise.resolve({ error: null });
      } };
    },
    delete() { // MUST NEVER be reached — D-4's no-clear law
      return { eq: (col, val) => { ops.deletes.push({ id: val }); return Promise.resolve({ error: null }); } };
    },
  };
  // fresh filter state per from() call (matches the real builder's per-call chain)
  const from = () => Object.assign(Object.create(conversations), { _filters: {} });
  const schema = () => ({ from });
  return { schema, __ops: ops, __rows: rows };
}

(async () => {
  console.log('\n  [1] A FLIP MID-THREAD OPENS FRESH (active -> abandoned, next lookup null):');
  {
    const rows = [{ id: 'c-live', agent_id: 'agent-1', state: 'active' }];
    const sb = mkSupabase(rows);
    const r = await abandonActiveThread(sb, 'agent-1');
    T('the live conversation is closed (returns its id)', r.ok === true && r.closed === 'c-live');
    T('its state is now abandoned (the next turn will not load it)', rows[0].state === 'abandoned');

    // the mechanical read: the very next active-lookup for this agent returns nothing.
    const again = await sb.schema('engine').from('conversations')
      .select('id, state').eq('agent_id', 'agent-1').order().limit().maybeSingle();
    const nextActive = again.data && again.data.state === 'active' ? again.data : null;
    T('§1 next active-lookup is null -> the next advisor turn carries ZERO prior-room turns', nextActive === null);
  }

  console.log('\n  [2] D-4 NO-CLEAR LAW (cure is an UPDATE, never a delete):');
  {
    const rows = [{ id: 'c-live', agent_id: 'agent-1', state: 'active' }];
    const sb = mkSupabase(rows);
    await abandonActiveThread(sb, 'agent-1');
    T('exactly one UPDATE issued (state -> abandoned)', sb.__ops.updates.length === 1 && sb.__ops.updates[0].patch.state === 'abandoned');
    T('ZERO deletes — the row (and its messages) persist for scrollback', sb.__ops.deletes.length === 0);
    T('the row still exists in the store (not removed)', sb.__rows.some(r => r.id === 'c-live'));
  }

  console.log('\n  [3] IDEMPOTENT ON A NO-OP (nothing active -> closed:null, no write):');
  {
    const sb = mkSupabase([]); // no conversations at all
    const r = await abandonActiveThread(sb, 'agent-1');
    T('returns { ok:true, closed:null }', r.ok === true && r.closed === null);
    T('§3 NO write issued on a no-op flip (safe to chain from the always-flips chip + WA words)', sb.__ops.updates.length === 0 && sb.__ops.deletes.length === 0);
  }

  console.log('\n  [4] A NON-ACTIVE LATEST IS LEFT UNTOUCHED (already abandoned -> closed:null):');
  {
    const rows = [{ id: 'c-old', agent_id: 'agent-1', state: 'abandoned' }];
    const sb = mkSupabase(rows);
    const r = await abandonActiveThread(sb, 'agent-1');
    T('returns closed:null (the seam only abandons a LIVE thread)', r.ok === true && r.closed === null);
    T('no write issued against an already-abandoned latest', sb.__ops.updates.length === 0 && sb.__ops.deletes.length === 0);
  }

  console.log(`\n  ── ${pass}/${pass + fail} PASS ──\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
