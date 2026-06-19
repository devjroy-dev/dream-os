// evals.ts — THE EVIDENCE LEDGER runner. Bible Part 8 / EVIDENCE_LEDGER_SPEC.
//
// recordEval() persists one run to evals_runs (and its findings to evals_findings).
// v1 is PERSIST-WHAT-IT'S-HANDED: it computes nothing it isn't given, validates the
// run_type and verdict against the allowed sets, and returns the new run id. Auto-
// capture of every live turn is deferred (it would touch loop.ts / donna.ts).
//
// The standing rule: if it was not persisted here, it did not happen.
import { supabase } from './db.js';

export type RunType = 'battery' | 'supervision' | 'production' | 'synthesis' | 'adhoc';
export type Verdict = 'pass' | 'fail' | 'partial';
export type Severity = 'fatal' | 'material' | 'minor' | 'note';

const RUN_TYPES = new Set<RunType>(['battery', 'supervision', 'production', 'synthesis', 'adhoc']);
const VERDICTS = new Set<Verdict>(['pass', 'fail', 'partial']);

export interface EvalFinding {
  claim: string;
  evidence_ref?: string;
  severity?: Severity;
  truth_status?: string;
}

export interface EvalRun {
  run_type?: RunType;
  scenario: string;
  discipline?: string;
  soul_version?: string;
  codex_version?: string;
  engine_commit?: string;
  model_tier?: string;
  transcript?: unknown;             // full exchange incl. donna_calls
  ground_truth_before?: unknown;
  ground_truth_after?: unknown;
  verdict?: Verdict;
  cost_inr_total?: number;
  anonymized?: boolean;
  source_note?: string;             // 'raw' | 'reconstructed' | free text
  findings?: EvalFinding[];
}

export interface RecordEvalResult {
  ok: boolean;
  run_id?: string;
  error?: string;
}

// Persist one run + its findings. Returns the run id, or an error string.
export async function recordEval(run: EvalRun): Promise<RecordEvalResult> {
  if (!run || !run.scenario || !run.scenario.trim()) {
    return { ok: false, error: 'scenario is required' };
  }
  const run_type: RunType = run.run_type && RUN_TYPES.has(run.run_type) ? run.run_type : 'adhoc';
  if (run.verdict && !VERDICTS.has(run.verdict)) {
    return { ok: false, error: `verdict must be one of ${[...VERDICTS].join(', ')}` };
  }

  const { data, error } = await supabase
    .from('evals_runs')
    .insert({
      run_type,
      scenario: run.scenario,
      discipline: run.discipline ?? null,
      soul_version: run.soul_version ?? null,
      codex_version: run.codex_version ?? null,
      engine_commit: run.engine_commit ?? null,
      model_tier: run.model_tier ?? null,
      transcript: run.transcript ?? null,
      ground_truth_before: run.ground_truth_before ?? null,
      ground_truth_after: run.ground_truth_after ?? null,
      verdict: run.verdict ?? null,
      cost_inr_total: run.cost_inr_total ?? null,
      anonymized: run.anonymized ?? false,
      source_note: run.source_note ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'insert failed' };
  }
  const runId = data.id as string;

  const findings = Array.isArray(run.findings) ? run.findings.filter((f) => f && f.claim) : [];
  if (findings.length) {
    const rows = findings.map((f) => ({
      run_id: runId,
      claim: f.claim,
      evidence_ref: f.evidence_ref ?? null,
      severity: f.severity ?? null,
      truth_status: f.truth_status ?? null,
    }));
    const { error: fErr } = await supabase.from('evals_findings').insert(rows);
    if (fErr) {
      // The run is persisted; findings failed. Report it rather than papering over.
      return { ok: true, run_id: runId, error: `run saved; findings failed: ${fErr.message}` };
    }
  }

  return { ok: true, run_id: runId };
}
