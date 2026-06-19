// server.ts — the engine's HTTP surface. POST /chat runs a turn; GET /health pings.
// CORS: the /de cockpit (on thedreamai.in) calls this from the browser, a cross-origin
// request. We allow exactly our own domains (+ localhost for dev) and reflect the origin
// — NOT a wildcard, because the engine runs on the service-role key (bypasses RLS), so
// only our own front-end may drive it from a browser.
import 'dotenv/config';
import express from 'express';
import { runTurn } from './loop.js';
import { PROFESSIONS } from './professions.js';
import { createOwner, verifyPin, mintDemoOwner, mintConsultAgent, findOrCreateAtelierAgent } from './signup.js';
import { loadRecords } from './recordsView.js';
import { buildCabinet, writeCabinetSkin } from './cabinet.js';
import { executeFindTool } from './tools/donnaFind.js';
import { loadGlance } from './glance.js';
import { supabase } from './db.js';
import { grantConsultSession, closeConsultSession } from './consultAccess.js';
import { uploadAndDistill, redistill } from './distill.js';
import { mountEvalsRoutes } from './evalsRoutes.js';

// ── COST GUARD ───────────────────────────────────────────────────────────────
// Two protections for a public beta on a metered API key:
//  1) ENGINE_PAUSED=true  -> global kill switch; every turn politely declines.
//  2) DAILY_COST_CAP_INR  -> per-agent daily ceiling (sum of today's usage.cost_inr).
// Both read env so they're tunable in Railway with NO redeploy. The engine runs on
// the service-role key; this is the only spend-side throttle, so it lives here.
// Settings now live in the DB (engine_settings, single row id=1) so the /admin panel
// can change them live with no redeploy. Env vars remain a fallback floor.
async function loadSettings(): Promise<{ paused: boolean; capInr: number }> {
  try {
    const { data } = await supabase
      .from('engine_settings').select('engine_paused, daily_cost_cap_inr').eq('id', 1).single();
    if (data) return { paused: !!data.engine_paused, capInr: Number(data.daily_cost_cap_inr) || 50 };
  } catch { /* fall through to env fallback */ }
  return {
    paused: String(process.env.ENGINE_PAUSED ?? '').toLowerCase() === 'true',
    capInr: Number(process.env.DAILY_COST_CAP_INR ?? '50'),
  };
}

async function isRestricted(agentId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('agents').select('users!inner(restricted)').eq('id', agentId).single();
    const uRaw = (data as { users?: unknown } | null)?.users;
    const u = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as { restricted?: boolean } | undefined;
    return !!u?.restricted;
  } catch { return false; }
}

async function agentSpendTodayInr(agentId: string): Promise<number> {
  // Sum cost_inr for this agent since UTC midnight. Best-effort: on any error,
  // return 0 (fail-open on the READ so a transient DB blip never wrongly blocks a
  // paying user — the kill switch is the hard stop if needed).
  try {
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('usage')
      .select('cost_inr')
      .eq('agent_id', agentId)
      .gte('created_at', since.toISOString());
    if (error || !data) return 0;
    return data.reduce((sum, r) => sum + (Number(r.cost_inr) || 0), 0);
  } catch { return 0; }
}

const app = express();
app.use(express.json({ limit: '30mb' })); // base64 PDFs ride the /de-doc body

const ALLOWED_ORIGINS = new Set<string>([
  'https://thedreamai.in',
  'https://www.thedreamai.in',
  'http://localhost:3000',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dream-engine' });
});

app.post('/chat', async (req, res) => {
  try {
    const { agent_id, message, conversation_id } = (req.body ?? {}) as {
      agent_id?: string;
      message?: string;
      conversation_id?: string;
    };
    if (!agent_id || !message) {
      return res.status(400).json({ error: 'agent_id and message are required' });
    }
    const settings = await loadSettings();
    // Global kill switch.
    if (settings.paused) {
      return res.json({
        reply: "I'm taking a brief pause for maintenance — back with you shortly. Nothing you've logged is lost.",
        conversation_id: conversation_id ?? null, paused: true,
      });
    }
    // Reversible per-user restriction.
    if (await isRestricted(agent_id)) {
      return res.json({
        reply: "Your access is paused right now. Reach out and we'll get it sorted.",
        conversation_id: conversation_id ?? null, restricted: true,
      });
    }
    // Per-agent daily cost ceiling — protects the API spend from any one runaway user.
    const spentToday = await agentSpendTodayInr(agent_id);
    if (spentToday >= settings.capInr) {
      return res.json({
        reply: "We've hit today's usage limit on your account — it resets tomorrow. If you need more, reply and we'll sort it.",
        conversation_id: conversation_id ?? null, capped: true,
      });
    }
    const result = await runTurn({ agentId: agent_id, message, conversationId: conversation_id });
    res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[chat] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// The sign-up roster — the web renders the field list from this, so the keys it
// sends back to /signup always match what the engine (and the Codex store) expect.
app.get('/professions', (_req, res) => {
  res.json({ professions: PROFESSIONS });
});

// ── /de cockpit (the demo surface) ───────────────────────────────────────────
// Two gates, both checked server-side so the secrets never reach the browser:
//   DE_DEMO_PASSWORD — opens /de (shared with demo guests).
//   DE_DEV_PASSWORD  — unlocks under-the-hood (Harvey<->Donna, model, cost). Yours.
// Set both as Railway env vars; if a var is unset, that gate is closed (deny).
app.post('/de-gate', (req, res) => {
  const { scope, password } = (req.body ?? {}) as { scope?: 'page' | 'dev'; password?: string };
  const want = scope === 'dev' ? process.env.DE_DEV_PASSWORD : process.env.DE_DEMO_PASSWORD;
  const ok = Boolean(want) && typeof password === 'string' && password === want;
  res.json({ ok });
});

// THE CLERK'S DOOR (Phase 3): upload one PDF + distill it onto the shelf, one call.
// De-gated SERVER-SIDE (dev password) — a storage-writing endpoint is never open to
// a guessed URL. Synchronous v1: a fifty-pager takes ~30-60s; the caller waits.
app.post('/de-doc', async (req, res) => {
  try {
    const { password, agent_id, filename, content_type, data_b64 } = (req.body ?? {}) as {
      password?: string; agent_id?: string; filename?: string; content_type?: string; data_b64?: string;
    };
    const want = process.env.DE_DEV_PASSWORD;
    if (!want || password !== want) return res.status(403).json({ error: 'gate closed' });
    if (!agent_id || !filename || !data_b64) {
      return res.status(400).json({ error: 'agent_id, filename, data_b64 are required' });
    }
    const { data: agent } = await supabase.from('agents').select('id').eq('id', agent_id).maybeSingle();
    if (!agent) return res.status(404).json({ error: `agent not found: ${agent_id}` });
    const result = await uploadAndDistill(agent_id, filename, content_type ?? 'application/pdf', data_b64);
    res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[de-doc] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// RE-DISTILLATION DOOR: retry the clerk against an original already in the cupboard.
// De-gated like /de-doc. No re-upload — the stored bytes are the source.
app.post('/de-redistill', async (req, res) => {
  try {
    const { password, document_id } = (req.body ?? {}) as { password?: string; document_id?: string };
    const want = process.env.DE_DEV_PASSWORD;
    if (!want || password !== want) return res.status(403).json({ error: 'gate closed' });
    if (!document_id) return res.status(400).json({ error: 'document_id is required' });
    const result = await redistill(document_id);
    res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[de-redistill] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Mint a demo agent in any field — no Supabase account behind it (auth_user_id null).
// Each call is a fresh agent; demos never overlap and are findable via null auth.
app.post('/contact', async (req, res) => {
  try {
    const { name, email, topic, message } = (req.body ?? {}) as { name?: string; email?: string; topic?: string; message?: string };
    if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });
    const { error } = await supabase.from('contact_messages').insert({
      name: name?.trim() || null, email: email?.trim() || null,
      topic: topic?.trim() || 'other', message: message.trim(),
    });
    if (error) { console.error('[contact] insert failed:', error.message); return res.status(500).json({ error: 'could not send' }); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/consult-mint', async (req, res) => {
  try {
    const { profession_key, phone } = (req.body ?? {}) as { profession_key?: string; phone?: string };
    if (!profession_key) return res.status(400).json({ error: 'profession_key is required' });
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    // The gate: 3 free / IST-day, admin restrict, first-of-day + first-ever flags.
    const access = await grantConsultSession(phone, profession_key);
    if (access.blocked) {
      return res.json({ blocked: true, restricted: access.restricted, sessions_today: access.sessionsToday });
    }
    const r = await mintConsultAgent(profession_key);
    res.json({
      agent_id: r.agent_id,
      blocked: false,
      first_of_day: access.firstOfDay, // opener fires
      first_ever: access.firstEver,    // the one-time timer reset is allowed this session
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[consult-mint] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Session close — patches the durable log with duration + turns, then deletes the
// ephemeral agent (delete-on-close; information is logged, the agent is disposable).
app.post('/consult-close', async (req, res) => {
  try {
    const { phone, agent_id, turn_count } = (req.body ?? {}) as { phone?: string; agent_id?: string; turn_count?: number };
    if (phone) await closeConsultSession(phone, turn_count ?? 0);
    if (agent_id) {
      // delete only if it is a consult agent (safety: never touch advisory).
      const { data: a } = await supabase.from('agents').select('id, user_id, mode').eq('id', agent_id).maybeSingle();
      if (a && a.mode === 'consult') {
        // records FK has no cascade — delete it first, or the agent delete is blocked.
        await supabase.from('records').delete().eq('agent_id', a.id);
        await supabase.from('agents').delete().eq('id', a.id);     // cascades conversations/messages
        await supabase.from('users').delete().eq('id', a.user_id); // the shell user
      }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/de-mint', async (req, res) => {
  try {
    const { name, profession_key } = (req.body ?? {}) as { name?: string; profession_key?: string };
    if (!profession_key) return res.status(400).json({ error: 'profession_key is required' });
    const r = await mintDemoOwner(name ?? 'Demo Owner', profession_key);
    res.json(r);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[de-mint] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Seeing-room: find-or-create the persistent demo agent for a sector (reused, not
// minted fresh — so touring never litters orphans). Same JSON shape as /de-mint.
app.post('/de-atelier', async (req, res) => {
  try {
    const { profession_key } = (req.body ?? {}) as { profession_key?: string };
    if (!profession_key) return res.status(400).json({ error: 'profession_key is required' });
    const r = await findOrCreateAtelierAgent(profession_key);
    res.json(r);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[de-atelier] error:', msg);
    res.status(500).json({ error: msg });
  }
});


// Mint a new owner (or return the existing one for a known identity). Called by the
// web AFTER the Supabase phone-OTP session is established; auth_user_id comes from
// that verified session. See the trust note in signup.ts (hardened in the RLS pass).
app.post('/signup', async (req, res) => {
  try {
    const { auth_user_id, phone, name, profession_key, pin, tier } = (req.body ?? {}) as {
      auth_user_id?: string;
      phone?: string;
      name?: string;
      profession_key?: string;
      pin?: string;
      tier?: 'entry' | 'mid' | 'top';
    };
    if (!auth_user_id || !phone || !name || !profession_key || !pin) {
      return res
        .status(400)
        .json({ error: 'auth_user_id, phone, name, profession_key and pin are required' });
    }
    const result = await createOwner({
      authUserId: auth_user_id,
      phone,
      name,
      professionKey: profession_key,
      pin,
      tier,
    });
    res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[signup] error:', msg);
    res.status(400).json({ error: msg });
  }
});

// Returning-user unlock: verify the PIN, hand back the agent to resume.
app.post('/pin-verify', async (req, res) => {
  try {
    const { auth_user_id, pin } = (req.body ?? {}) as { auth_user_id?: string; pin?: string };
    if (!auth_user_id || !pin) {
      return res.status(400).json({ error: 'auth_user_id and pin are required' });
    }
    const result = await verifyPin(auth_user_id, pin);
    res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[pin-verify] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Read-only window for the owner's shell: the active records, structured. The shell
// derives its glance + views from these; the engine just returns rows.
app.post('/records', async (req, res) => {
  try {
    const { agent_id } = (req.body ?? {}) as { agent_id?: string };
    if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });
    const records = await loadRecords(agent_id);
    res.json({ records });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[records] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// The cabinet - the owner's books, grouped by their field's manifest (read-side
// bucketing; see cabinet.ts + docs/MANIFEST_SPEC.md). manifest_present=false => the
// default fallback skin (cards) was used because the field has no manifest yet.
app.post('/cabinet', async (req, res) => {
  try {
    const { agent_id } = (req.body ?? {}) as { agent_id?: string };
    if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });
    const cabinet = await buildCabinet(agent_id);
    res.json(cabinet);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[cabinet] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Set the owner's chosen cabinet skin (workbench|cards|accounts). Persists on the
// agent; /cabinet then returns it as `skin`. NULL skin => manifest default.
app.post('/cabinet-skin', async (req, res) => {
  try {
    const { agent_id, skin } = (req.body ?? {}) as { agent_id?: string; skin?: string };
    if (!agent_id || !skin) return res.status(400).json({ error: 'agent_id and skin are required' });
    await writeCabinetSkin(agent_id, skin);
    res.json({ ok: true, skin });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[cabinet-skin] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// Owner-facing search — Donna's eyes, handed to the owner. Free-form: any names/terms/
// amounts/dates in one string; reuses executeFindTool (the SAME wide-net matching Donna
// uses, with match-provenance), so owner-search and Harvey-find always agree. Returns the
// matched rows for the carousel. A READ; never mutates.
app.post('/search', async (req, res) => {
  try {
    const { agent_id, q } = (req.body ?? {}) as { agent_id?: string; q?: string };
    if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });
    const query = (q ?? '').trim();
    if (!query) return res.json({ records: [] }); // empty query -> nothing (by design)
    // Feed the whole free-form string as the wide-net term; the tool tokenizes + ORs it
    // across every text field. Pass it as `note` so it's purely a term (client also works;
    // note keeps it neutral). The tool returns structured rows in `found`.
    const outcome = await executeFindTool(agent_id, { note: query });
    res.json({ records: outcome.found ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[search] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// The banner. Louis reads the field's codex work-order and the cabinet, returns the
// three labelled numbers. The shell calls this on open/focus. No agent in the path.
app.post('/glance', async (req, res) => {
  try {
    const { agent_id } = (req.body ?? {}) as { agent_id?: string };
    if (!agent_id) return res.status(400).json({ error: 'agent_id is required' });
    const glance = await loadGlance(agent_id);
    res.json(glance);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[glance] error:', msg);
    res.status(500).json({ error: msg });
  }
});

const port = Number(process.env.PORT ?? 3000);
// ── ADMIN PANEL (operator-only, gated by ADMIN_PASSWORD) ─────────────────────
// Every admin endpoint requires the password in the body. Not a session — a simple
// shared operator secret, fine for a single-operator panel. Engine runs service-role
// so these bypass RLS by design (operator sees across agents).
function adminOk(req: express.Request): boolean {
  const want = process.env.ADMIN_PASSWORD;
  const got = (req.body ?? {}).password;
  return Boolean(want) && typeof got === 'string' && got === want;
}

app.post('/admin-gate', (req, res) => {
  res.json({ ok: adminOk(req) });
});

// GET-style (POST with password): current settings + a spend snapshot.
app.post('/admin-settings', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data: st } = await supabase
      .from('engine_settings').select('engine_paused, daily_cost_cap_inr').eq('id', 1).single();
    res.json({ engine_paused: !!st?.engine_paused, daily_cost_cap_inr: Number(st?.daily_cost_cap_inr ?? 50) });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/admin-set', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { engine_paused, daily_cost_cap_inr } = (req.body ?? {}) as
      { engine_paused?: boolean; daily_cost_cap_inr?: number };
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof engine_paused === 'boolean') patch.engine_paused = engine_paused;
    if (typeof daily_cost_cap_inr === 'number' && daily_cost_cap_inr >= 0) patch.daily_cost_cap_inr = daily_cost_cap_inr;
    const { error } = await supabase.from('engine_settings').update(patch).eq('id', 1);
    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// List real users (with auth) + their agents + restriction + today's spend.
app.post('/admin-users', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data: agents } = await supabase
      .from('agents')
      .select('id, display_name, profession_preset, tier, created_at, users!inner(id, name, phone, auth_user_id, restricted)')
      .order('created_at', { ascending: false });
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const out = [];
    for (const a of (agents ?? [])) {
      const uRaw = (a as { users?: unknown }).users;
      const u = (Array.isArray(uRaw) ? uRaw[0] : uRaw) as
        { id?: string; name?: string; phone?: string; auth_user_id?: string | null; restricted?: boolean } | undefined;
      const { data: usage } = await supabase
        .from('usage').select('cost_inr').eq('agent_id', a.id).gte('created_at', since.toISOString());
      const spentToday = (usage ?? []).reduce((sum, r) => sum + (Number(r.cost_inr) || 0), 0);
      out.push({
        agent_id: a.id, user_id: u?.id, name: u?.name, phone: u?.phone,
        is_demo: !u?.auth_user_id, restricted: !!u?.restricted,
        profession: a.profession_preset, tier: a.tier, spent_today_inr: Math.round(spentToday * 100) / 100,
      });
    }
    res.json({ users: out });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/admin-restrict', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { user_id, restricted } = (req.body ?? {}) as { user_id?: string; restricted?: boolean };
    if (!user_id || typeof restricted !== 'boolean') return res.status(400).json({ error: 'user_id and restricted required' });
    const { error } = await supabase.from('users').update({ restricted }).eq('id', user_id);
    if (error) throw new Error(error.message);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Orphans: accountless demo agents (users.auth_user_id is null). See-then-delete.
app.post('/admin-orphans', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data: demoUsers } = await supabase
      .from('users').select('id').is('auth_user_id', null);
    const ids = (demoUsers ?? []).map((u) => u.id);
    if (ids.length === 0) return res.json({ orphans: [] });
    const { data: agents } = await supabase
      .from('agents').select('id, display_name, profession_preset, created_at, user_id').in('user_id', ids);
    const out = [];
    for (const a of (agents ?? [])) {
      const { count } = await supabase
        .from('records').select('*', { count: 'exact', head: true }).eq('agent_id', a.id);
      out.push({ agent_id: a.id, user_id: a.user_id, name: a.display_name,
                 profession: a.profession_preset, created_at: a.created_at, record_count: count ?? 0,
                 is_atelier: (a.display_name ?? '').startsWith('__atelier__') });
    }
    res.json({ orphans: out });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Delete selected orphan agents. Guarded: each agent's user MUST be auth_user_id null.
// records has no cascade -> delete records first, then agent, then the demo user.
app.post('/admin-orphan-delete', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { agent_ids } = (req.body ?? {}) as { agent_ids?: string[] };
    if (!Array.isArray(agent_ids) || agent_ids.length === 0) return res.status(400).json({ error: 'agent_ids required' });
    let deleted = 0;
    for (const agentId of agent_ids) {
      // SAFETY: re-confirm this agent belongs to a demo user (auth_user_id null) before any delete.
      const { data: a } = await supabase
        .from('agents').select('id, user_id, users!inner(auth_user_id)').eq('id', agentId).single();
      const auRaw = (a as { users?: unknown } | null)?.users;
      const au = (Array.isArray(auRaw) ? auRaw[0] : auRaw) as { auth_user_id?: string | null } | undefined;
      if (!a || au?.auth_user_id) continue; // skip anything tied to a real account
      await supabase.from('records').delete().eq('agent_id', agentId);  // no-cascade table, manual first
      await supabase.from('agents').delete().eq('id', agentId);          // cascades the rest
      await supabase.from('users').delete().eq('id', a.user_id);         // the demo user shell
      deleted++;
    }
    res.json({ ok: true, deleted });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Reset a user: wipe their agent + records + user row so they can sign up fresh
// (wrong profession picked, or a stranded email-era account after the phone switch).
// records has no cascade -> delete records first, then agent (cascades the rest), then
// the user row (frees users_phone_key + the auth tie). Admin-guarded. Destructive,
// see-then-confirm on the client.
app.post('/admin-consult', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data: nums } = await supabase
      .from('consult_access')
      .select('phone, day, sessions_today, total_sessions, restricted, last_domain, last_seen')
      .order('last_seen', { ascending: false });
    // Hot topics + engagement from the session log.
    const { data: sessions } = await supabase
      .from('consult_sessions')
      .select('domain, duration_sec, turn_count');
    const byDomain: Record<string, { count: number; durSum: number; durN: number; turnSum: number; turnN: number }> = {};
    for (const s of (sessions ?? [])) {
      const d = s.domain as string;
      byDomain[d] ??= { count: 0, durSum: 0, durN: 0, turnSum: 0, turnN: 0 };
      byDomain[d].count++;
      if (typeof s.duration_sec === 'number') { byDomain[d].durSum += s.duration_sec; byDomain[d].durN++; }
      if (typeof s.turn_count === 'number') { byDomain[d].turnSum += s.turn_count; byDomain[d].turnN++; }
    }
    const topics = Object.entries(byDomain).map(([domain, v]) => ({
      domain, sessions: v.count,
      avg_duration_sec: v.durN ? Math.round(v.durSum / v.durN) : null,
      avg_turns: v.turnN ? Math.round((v.turnSum / v.turnN) * 10) / 10 : null,
    })).sort((a, b) => b.sessions - a.sessions);
    res.json({ numbers: nums ?? [], topics });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/admin-consult-restrict', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { phone, restricted } = (req.body ?? {}) as { phone?: string; restricted?: boolean };
    if (!phone) return res.status(400).json({ error: 'phone required' });
    await supabase.from('consult_access').update({ restricted: !!restricted }).eq('phone', phone);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Delete ALL orphan consult agents (mode='consult') — the demand log is kept, the
// agents are disposable. One-click sweep from admin.
app.post('/admin-consult-sweep', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data: agents } = await supabase
      .from('agents').select('id, user_id').eq('mode', 'consult');
    let deleted = 0;
    const errors: string[] = [];
    for (const a of (agents ?? [])) {
      // records FK-references agents WITHOUT cascade — must be deleted first or the
      // agent delete is blocked (this is why the bulk sweep was failing).
      const { error: recErr } = await supabase.from('records').delete().eq('agent_id', a.id);
      if (recErr) { errors.push(`records ${a.id}: ${recErr.message}`); continue; }
      const { error: agErr } = await supabase.from('agents').delete().eq('id', a.id); // cascades the rest
      if (agErr) { errors.push(`agent ${a.id}: ${agErr.message}`); continue; }
      await supabase.from('users').delete().eq('id', a.user_id); // shell user
      deleted++;
    }
    if (errors.length) console.error('[consult-sweep] errors:', errors.join(' | '));
    res.json({ ok: true, deleted, failed: errors.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/admin-contact', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data: messages } = await supabase
      .from('contact_messages')
      .select('id, name, email, topic, message, handled, created_at')
      .order('created_at', { ascending: false });
    // topic tally — the demand signal (which chip/desire is most common).
    const tally: Record<string, number> = {};
    for (const m of (messages ?? [])) { const t = (m.topic as string) || 'other'; tally[t] = (tally[t] ?? 0) + 1; }
    const topics = Object.entries(tally).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
    res.json({ messages: messages ?? [], topics });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/admin-contact-handled', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { id, handled } = (req.body ?? {}) as { id?: string; handled?: boolean };
    if (!id) return res.status(400).json({ error: 'id required' });
    await supabase.from('contact_messages').update({ handled: !!handled }).eq('id', id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post('/admin-reset-user', async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { user_id } = (req.body ?? {}) as { user_id?: string };
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    // find every agent for this user (usually one), wipe records then agents, then the user.
    const { data: agents } = await supabase.from('agents').select('id').eq('user_id', user_id);
    const agentIds = (agents ?? []).map((a: { id: string }) => a.id);
    for (const aid of agentIds) {
      await supabase.from('records').delete().eq('agent_id', aid);   // no-cascade table first
    }
    await supabase.from('agents').delete().eq('user_id', user_id);   // cascades snapshot/owner/etc
    await supabase.from('users').delete().eq('id', user_id);          // frees phone + auth tie
    res.json({ ok: true, agents_wiped: agentIds.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// The evidence ledger routes (Bible Part 8): /eval-record, /eval-import, /eval-report.
mountEvalsRoutes(app);

app.listen(port, () => console.log(`[dream-engine] listening on :${port}`));
