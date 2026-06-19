// evalsRoutes.ts — the evidence ledger, made usable (Bible Part 8).
//
// POST /eval-record  — file one run (persist-what-it's-handed).
// POST /eval-import  — the seed importer: read a battery agent's turns from
//                      messages.tool_calls (live ground truth) + file static
//                      archive runs with honest provenance.
// GET  /eval-report  — render all runs as dated markdown (five-minute export).
import type { Express, Request, Response } from 'express';
import { supabase } from './db.js';
import { recordEval, type EvalRun } from './evals.js';

export function mountEvalsRoutes(app: Express): void {
  // ── file one run ──────────────────────────────────────────────────────────
  app.post('/eval-record', async (req: Request, res: Response) => {
    try {
      const run = (req.body ?? {}) as EvalRun;
      const result = await recordEval(run);
      if (!result.ok) return res.status(400).json(result);
      res.json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[eval-record] error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  // ── the seed importer ─────────────────────────────────────────────────────
  // Body: { agent_id?, scenario_prefix?, soul_version?, codex_version?,
  //         engine_commit?, model_tier?, archive_runs?: EvalRun[] }
  // If agent_id is given, every assistant turn in that agent's conversations is
  // filed as an adhoc run, transcript = the turn's tool_calls (the donna_calls
  // channel, faithful to ground truth — never re-transcribed). archive_runs are
  // filed as-is (older curl batteries not in this DB), each carrying its own
  // source_note provenance ('raw' / 'reconstructed').
  app.post('/eval-import', async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as {
        agent_id?: string;
        run_type?: string;
        scenario_prefix?: string;
        soul_version?: string;
        codex_version?: string;
        engine_commit?: string;
        model_tier?: string;
        archive_runs?: EvalRun[];
      };
      const imported: string[] = [];
      const failed: { scenario: string; error: string }[] = [];

      // (a) live battery turns from messages.tool_calls
      if (body.agent_id) {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id')
          .eq('agent_id', body.agent_id);
        const convIds = (convs ?? []).map((c) => c.id);
        if (convIds.length) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('id, conversation_id, role, content, tool_calls, created_at')
            .in('conversation_id', convIds)
            .eq('role', 'assistant')
            .order('created_at', { ascending: true });
          for (const m of msgs ?? []) {
            const scenario =
              (body.scenario_prefix ?? 'imported battery turn') +
              ` (msg ${String(m.id).slice(0, 8)}, ${String(m.created_at).slice(0, 19)})`;
            const r = await recordEval({
              run_type: body.run_type as import('./evals.js').RunType | undefined,
              scenario,
              soul_version: body.soul_version,
              codex_version: body.codex_version,
              engine_commit: body.engine_commit,
              model_tier: body.model_tier ?? 'haiku',
              transcript: { reply: m.content, tool_calls: m.tool_calls },
              source_note: 'raw — pulled from messages.tool_calls (ground truth)',
            });
            if (r.ok && r.run_id) imported.push(r.run_id);
            else failed.push({ scenario, error: r.error ?? 'unknown' });
          }
        }
      }

      // (b) static archive runs (older batteries, with their own provenance)
      for (const ar of body.archive_runs ?? []) {
        const r = await recordEval(ar);
        if (r.ok && r.run_id) imported.push(r.run_id);
        else failed.push({ scenario: ar.scenario ?? '(no scenario)', error: r.error ?? 'unknown' });
      }

      res.json({ ok: true, imported_count: imported.length, imported, failed });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[eval-import] error:', msg);
      res.status(500).json({ error: msg });
    }
  });

  // ── the markdown report ───────────────────────────────────────────────────
  app.get('/eval-report', async (_req: Request, res: Response) => {
    try {
      const { data: runs, error } = await supabase
        .from('evals_runs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });

      const lines: string[] = [];
      lines.push('# DREAM ENGINE — EVIDENCE LEDGER');
      lines.push('');
      lines.push(`Exported ${new Date().toISOString().slice(0, 19)} · ${(runs ?? []).length} runs`);
      lines.push('');
      lines.push('> The standing rule (Bible Part 8): if it was not persisted to the');
      lines.push('> ledger, it did not happen.');
      lines.push('');
      for (const r of runs ?? []) {
        lines.push(`## ${String(r.created_at).slice(0, 19)} — ${r.run_type}${r.verdict ? ` — ${String(r.verdict).toUpperCase()}` : ''}`);
        lines.push('');
        lines.push(`**Scenario:** ${r.scenario}`);
        if (r.discipline) lines.push(`**Discipline:** ${r.discipline}`);
        const ver: string[] = [];
        if (r.soul_version) ver.push(`soul \`${r.soul_version}\``);
        if (r.codex_version) ver.push(`codex \`${r.codex_version}\``);
        if (r.engine_commit) ver.push(`engine \`${r.engine_commit}\``);
        if (r.model_tier) ver.push(`tier ${r.model_tier}`);
        if (ver.length) lines.push(`**Versions:** ${ver.join(' · ')}`);
        if (r.cost_inr_total != null) lines.push(`**Cost:** Rs ${r.cost_inr_total}`);
        if (r.source_note) lines.push(`**Provenance:** ${r.source_note}`);
        lines.push(`**Run id:** \`${r.id}\``);
        lines.push('');
      }
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(lines.join('\n'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[eval-report] error:', msg);
      res.status(500).json({ error: msg });
    }
  });
}
