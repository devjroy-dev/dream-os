// src/lib/llm.js — TDW_02 P5: the provider facade, ported from devroy-dev/z src/llm.ts.
// Scope per spec P5: provider CONF (anthropic / glm / deepseek, Anthropic-compatible
// endpoints so only baseURL+key swap), deep cache_control strip on non-anthropic,
// web-tool strip + the blind notice, thinking suppression where the provider mutters,
// and the typed LLMToolFidelityError. (Drift note, logged: z's HEAD carries no such
// error class today — the spec's port list names it, so it is authored here per spec.)
// Model strings arrive from modelRouter; the requested model wins, env aliases back it.
'use strict';

const Anthropic = require('@anthropic-ai/sdk');

class LLMToolFidelityError extends Error {
  constructor(message, detail) { super(message); this.name = 'LLMToolFidelityError'; this.detail = detail; }
}

const CONF = {
  anthropic: {
    keyEnv: 'ANTHROPIC_API_KEY',
    model: (m) => m,
    cache: true,
  },
  glm: {
    baseURL: 'https://api.z.ai/api/anthropic',
    keyEnv: 'ZAI_API_KEY',
    model: (m) => m || process.env.LLM_GLM_MODEL || 'glm-4.7-flash',
    cache: false,
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/anthropic',
    keyEnv: 'DEEPSEEK_API_KEY',
    model: (m) => m || process.env.LLM_DEEPSEEK_MODEL || 'deepseek-v4-flash',
    cache: false,
    noThink: true, // z probe-proven: silent reasoning eats output budget unless disabled
  },
};

function providerKeyPresent(p) {
  const c = CONF[p];
  return !!(c && process.env[c.keyEnv]);
}

const clients = {};
function clientFor(p) {
  if (!clients[p]) {
    const c = CONF[p];
    clients[p] = new Anthropic({
      ...(c.baseURL ? { baseURL: c.baseURL } : {}),
      ...(process.env[c.keyEnv] ? { apiKey: process.env[c.keyEnv] } : {}),
    });
  }
  return clients[p];
}

// Deep strip of every cache_control key — provider cache semantics unverified; an
// Anthropic-only field rejected by a strict endpoint kills the call (z law).
function stripCache(v) {
  if (Array.isArray(v)) return v.map(stripCache);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (k === 'cache_control') continue;
      out[k] = stripCache(val);
    }
    return out;
  }
  return v;
}

const BLIND_NOTICE =
  '\n\n[NOTICE — your live web access is UNAVAILABLE right now. Anything your instructions say about searching or checking the web does not currently apply. Never claim, imply, or perform having checked, searched, or verified anything online. Where current information would matter, say plainly that you could not confirm it and proceed on general knowledge, honestly framed.]';

function translateFor(p, params) {
  if (p === 'anthropic') return params; // byte-identical path — untouched
  const c = CONF[p];
  let out = { ...params, model: c.model(String(params && params.model || '')) };
  if (c.noThink && out.thinking === undefined) out.thinking = { type: 'disabled' };
  if (!c.cache) out = stripCache(out);
  if (Array.isArray(out.tools)) {
    const before = out.tools.length;
    out.tools = out.tools.filter((t) => !String((t && t.type) || '').startsWith('web_search'));
    if (out.tools.length < before) {
      if (typeof out.system === 'string') out.system = out.system + BLIND_NOTICE;
      else if (Array.isArray(out.system)) out.system = [...out.system, { type: 'text', text: BLIND_NOTICE }];
      else if (out.system === undefined) out.system = BLIND_NOTICE.trim();
    }
    if (out.tools.length === 0) delete out.tools;
  }
  return out;
}

// Post-response fidelity check (non-anthropic): every tool_use must carry an object
// input. Cheap providers occasionally emit stringified or absent inputs — that is
// the failure the Haiku fallback exists for; surface it as the typed error.
function assertToolFidelity(p, resp) {
  if (p === 'anthropic') return;
  for (const b of (resp && resp.content) || []) {
    if (b.type === 'tool_use' && (b.input === null || typeof b.input !== 'object')) {
      throw new LLMToolFidelityError(`provider ${p} emitted a malformed tool_use input`, { tool: b.name });
    }
  }
}

async function llmCreate(provider, params) {
  const resp = await clientFor(provider).messages.create(translateFor(provider, params));
  assertToolFidelity(provider, resp);
  return resp;
}

// Streaming: for ANTHROPIC, the SDK's native stream (the engine's proven path).
// For non-anthropic compat endpoints, SSE framing is UNVERIFIED territory (same
// law as cache-strip): we do NOT hand the SDK's MessageStream a foreign endpoint.
// Instead: a create-backed pseudo-stream — the same interface the engine uses
// (.on('text'), .finalMessage()), with the reply delivered as ONE text event
// after the call completes. Wire contract intact; no bet on foreign framing.
// (Found the hard way: TDW_02 P7 G1 — DeepSeek + SDK stream = dead air.)
function llmStream(provider, params) {
  if (provider === 'anthropic') {
    return clientFor(provider).messages.stream(translateFor(provider, params));
  }
  const handlers = [];
  return {
    on(event, h) { if (event === 'text') handlers.push(h); return this; },
    async finalMessage() {
      const resp = await llmCreate(provider, params);
      const text = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
      if (text) for (const h of handlers) { try { h(text); } catch (_e) { /* emit is best-effort */ } }
      return resp;
    },
  };
}

module.exports = { CONF, clientFor, llmCreate, llmStream, translateFor, assertToolFidelity, providerKeyPresent, LLMToolFidelityError };
