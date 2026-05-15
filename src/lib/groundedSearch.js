// ─────────────────────────────────────────────────────────────────────────────
// src/lib/groundedSearch.js
// Gemini 3.1 Flash-Lite grounded search wrapper.
//
// PURPOSE: Retrieval-only provider for Session 9 Discover marketplace.
// The dream-os vendor agent does NOT call this. It is wired and ready
// for the bride-side planner in Session 9.
//
// PATTERN: Gemini retrieves + Anthropic (Haiku/Sonnet) composes the reply.
// This file handles the retrieval step only — returns structured results.
//
// MODEL LOCK: gemini-3.1-flash-lite (retrieval-only, not main agent model)
// API KEY: GOOGLE_API_KEY env var in Railway (added Session 8.2)
// ─────────────────────────────────────────────────────────────────────────────

const { GoogleGenAI } = require('@google/genai');

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

// ── groundedSearch ────────────────────────────────────────────────────────────
// query        : string  — the search query
// options      : object  — optional config
//   maxResults : number  — hint for how many results to surface (default 5)
//   context    : string  — optional context to prepend (e.g. "Indian wedding market")
//
// Returns: { answer, sources, raw } on success
//          { answer: null, sources: [], error } on failure
//
// Never throws — all errors are caught and returned as { answer: null, error }.
// Caller decides how to handle a failed retrieval.

async function groundedSearch(query, options = {}) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('[groundedSearch] GOOGLE_API_KEY not set — skipping retrieval');
    return { answer: null, sources: [], error: 'GOOGLE_API_KEY not configured' };
  }

  const { maxResults = 5, context = '' } = options;

  const fullQuery = context
    ? `Context: ${context}\n\nQuery: ${query}`
    : query;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: fullQuery,
      tools: [{ googleSearch: {} }],      // enables grounding with Google Search
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,                 // low temp for factual retrieval
      },
    });

    const answer = response.text ?? null;

    // Extract grounding sources from metadata
    const sources = [];
    const groundingMeta = response.candidates?.[0]?.groundingMetadata;

    if (groundingMeta?.groundingChunks) {
      for (const chunk of groundingMeta.groundingChunks) {
        if (chunk.web?.uri) {
          sources.push({
            url:   chunk.web.uri,
            title: chunk.web.title || chunk.web.uri,
          });
          if (sources.length >= maxResults) break;
        }
      }
    }

    console.log(`[groundedSearch] query="${query.slice(0, 60)}" sources=${sources.length}`);

    return { answer, sources, raw: response };

  } catch (err) {
    console.error(`[groundedSearch] error:`, err.message);
    return { answer: null, sources: [], error: err.message };
  }
}

// ── Example usage (for Session 9 reference) ──────────────────────────────────
// const { answer, sources } = await groundedSearch(
//   'wedding photographers in Goa under 2 lakh',
//   { context: 'Indian wedding vendor market', maxResults: 5 }
// );
// → answer: plain text summary from Gemini with grounded web results
// → sources: [{ url, title }, ...] — citations for the answer
// Then pass answer + sources to Haiku/Sonnet to compose the bride-facing reply.

module.exports = { groundedSearch };
