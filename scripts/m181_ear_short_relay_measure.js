#!/usr/bin/env node
'use strict';
// scripts/m181_ear_short_relay_measure.js · CE-45 ELZ-1 · F-44.181 MEASURE (c-44.44: measure before any cure). READ-ONLY: it calls the LIVE
// listener (listenerDoor.hear, untouched) with no thread history and writes nothing. For each short relay phrasing and client it asks N times
// and counts how often the ear hears a RELAY naming that client (acts[0].act === 'relay'), versus none or another act.
// Usage: node scripts/m181_ear_short_relay_measure.js --live [--n=10] [--provider=anthropic] [--model=claude-haiku-4-5-20251001]
// WITHOUT --live it calls NO model: it prints the phrasings it would send and exits 0, so the floor (which runs every script) reads it green
// (e-156, the founder's floor on 27 September: run bare, the first cut refused with exit 2 and the floor counted an ERROR).
// Cost: phrases x clients x N listener calls (8 x 2 x 10 = 160 by default).
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : d; };
const N = Math.max(1, Number(arg('n', '10')));
const route = { provider: arg('provider', 'anthropic'), model: arg('model', 'claude-haiku-4-5-20251001'), listener_provider: arg('provider', 'anthropic'), listener_model: arg('model', 'claude-haiku-4-5-20251001') };
const { hear } = require(path.join(ROOT, 'src/lib/vendor/listenerDoor.js'));
const PHRASES = ['tell {c} hello', 'tell {c} hi', 'tell {c} good morning', 'tell {c} thank you', "tell {c} we're confirmed", 'tell {c} see you soon', 'tell {c} happy diwali', 'tell {c} congratulations'];
const CLIENTS = ['walk twin', 'Sarah'];
const stub = { from() { const q = { select: () => q, eq: () => q, neq: () => q, order: () => q, limit: () => q, is: () => q, in: () => q, gte: () => q, lte: () => q, maybeSingle: async () => ({ data: null, error: null }), then: (r) => r({ data: [], error: null }) }; return q; }, schema() { return this; } };
(async () => {
  if (!process.argv.includes('--live')) {
    console.log(`m181 (not live, no model called): would send ${PHRASES.length} phrasings x ${CLIENTS.length} clients x ${N} to the listener; run with --live to measure`);
    for (const p of PHRASES) for (const c of CLIENTS) console.log(`  ${JSON.stringify(p.replace('{c}', c))}`);
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY && route.listener_provider === 'anthropic') { console.log('STOP: ANTHROPIC_API_KEY is not set'); process.exit(2); }
  console.log(`m181: ${PHRASES.length} phrasings x ${CLIENTS.length} clients x ${N} on ${route.listener_provider}/${route.listener_model} (${PHRASES.length * CLIENTS.length * N} calls)`);
  let tot = 0; let rel = 0; let errs = 0;
  for (const p of PHRASES) {
    for (const c of CLIENTS) {
      const msg = p.replace('{c}', c); let r = 0; const other = {};
      for (let i = 0; i < N; i += 1) {
        let out; try { out = await hear({ supabase: stub, route, message: msg, conversationId: null, excludeId: null }); } catch (e) { out = { error: e }; }
        const acts = out && out.request && Array.isArray(out.request.acts) ? out.request.acts : null;
        if (!out || out.error || !out.request) { errs += 1; other.error = (other.error || 0) + 1; continue; }
        const a0 = acts && acts[0];
        if (a0 && a0.act === 'relay') r += 1; else { const k = a0 ? a0.act : `none/${out.request.route}`; other[k] = (other[k] || 0) + 1; }
      }
      tot += N; rel += r;
      console.log(`  ${JSON.stringify(msg).padEnd(38)} relay ${r}/${N}${Object.keys(other).length ? `   otherwise ${JSON.stringify(other)}` : ''}`);
    }
  }
  console.log(`m181 TOTAL: heard as a relay ${rel}/${tot} (${(100 * rel / tot).toFixed(1)}%), errors ${errs}`);
})().catch((e) => { console.log(`m181 CRASHED: ${e && e.stack}`); process.exit(1); });
