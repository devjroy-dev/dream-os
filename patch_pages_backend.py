#!/usr/bin/env python3
"""
Pages backend patch — dream-os repo.

Adds:
  1. db/migrations/0055_bride_pages.sql           (new table)
  2. src/api/couple/pages.js                      (new route file)
  3. src/api/couple/core.js                       (mount pages router)
  4. src/agent/brideTools.js                      (read_pages tool def)
  5. src/agent/brideEngine.js                     (dispatch + executor)

Run from dream-os repo root:
    python3 patch_pages_backend.py
    node --check src/api/couple/pages.js \
      && node --check src/api/couple/core.js \
      && node --check src/agent/brideEngine.js \
      && node --check src/agent/brideTools.js

Idempotent: safe to re-run. Each step checks if the change is already present.
"""

import os, sys, pathlib

ROOT = pathlib.Path('.').resolve()

# ─── helpers ─────────────────────────────────────────────────────────────────
def write_file(rel_path, content):
    p = ROOT / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)
    print(f"  ✓ wrote {rel_path}")

def patch_file(rel_path, old, new, label):
    p = ROOT / rel_path
    if not p.exists():
        print(f"  ✗ {rel_path} not found — aborting")
        sys.exit(1)
    src = p.read_text()
    if new in src:
        print(f"  → {label} already applied — skipping")
        return
    if old not in src:
        print(f"  ✗ anchor not found in {rel_path} for: {label}")
        sys.exit(1)
    p.write_text(src.replace(old, new, 1))
    print(f"  ✓ patched {rel_path} — {label}")


# ─── 1. migration ────────────────────────────────────────────────────────────
print("\n[1/5] db/migrations/0055_bride_pages.sql")
write_file('db/migrations/0055_bride_pages.sql', """-- 0055_bride_pages.sql
-- The diary surface. Every Pages entry is a row in this table.
--
-- The bride writes one or more entries per day. Mood is one of 12 locked
-- values from the bride's interior weather palette (matches FROST_COPY
-- mood vocabulary). Body is plain text. Created_at is canonical timestamp;
-- entry_date is the "wedding-arc day" she wrote on (date-only, used for
-- grouping and for the daily teal idle line).
--
-- DreamAi reads from this table via the read_pages tool to ground the AI
-- in the bride's emotional weather across days. The Sanctuary V Pages
-- row reads the most-recent body to render the preview.

create table if not exists bride_pages (
  id           uuid          primary key default gen_random_uuid(),
  couple_id    uuid          not null references couples(id) on delete cascade,
  user_id      uuid          not null references users(id)   on delete cascade,
  entry_date   date          not null default current_date,
  mood         text          not null,
  mood_color   text          not null,
  body         text          not null,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

-- Lookups by couple, newest first (Sanctuary preview + history list).
create index if not exists idx_bride_pages_couple_created
  on bride_pages (couple_id, created_at desc);

-- For DreamAi "what did she write on day X" queries.
create index if not exists idx_bride_pages_couple_entry_date
  on bride_pages (couple_id, entry_date desc);
""")


# ─── 2. pages route ──────────────────────────────────────────────────────────
print("\n[2/5] src/api/couple/pages.js")
write_file('src/api/couple/pages.js', """// src/api/couple/pages.js
// Bride Pages (diary) endpoints — all require couple auth.
//   GET    /api/v2/couple/pages/:coupleId           list entries (newest first)
//   POST   /api/v2/couple/pages                     create entry
//   DELETE /api/v2/couple/pages/:entryId            delete entry
//   GET    /api/v2/couple/pages/:coupleId/preview   one-line preview for Sanctuary row

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ── GET /:coupleId — list all entries newest first ───────────────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { coupleId } = req.params;

  // Bride can only read her own pages.
  if (coupleId !== couple_id) return errRes(res, 403, 'forbidden');

  const limit  = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;

  const { data, error } = await supabase
    .from('bride_pages')
    .select('id, entry_date, mood, mood_color, body, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[couple-pages:list] error:', error);
    return errRes(res, 500, 'failed to load pages');
  }

  return okRes(res, { entries: data || [], total: (data || []).length });
}));

// ── GET /:coupleId/preview — one-line preview for Sanctuary row ──────────────
router.get('/:coupleId/preview', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { coupleId } = req.params;

  if (coupleId !== couple_id) return errRes(res, 403, 'forbidden');

  const { data, error } = await supabase
    .from('bride_pages')
    .select('body, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[couple-pages:preview] error:', error);
    return errRes(res, 500, 'failed to load preview');
  }

  if (!data) return okRes(res, { preview: null });

  // First 4-5 words, lowercase, torn-corner feel.
  const words = String(data.body || '').trim().split(/\\s+/).slice(0, 5);
  const preview = words.join(' ').toLowerCase();

  return okRes(res, { preview, created_at: data.created_at });
}));

// ── POST / — create a new entry ──────────────────────────────────────────────
router.post('/', express.json({ limit: '64kb' }), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id, id: user_id } = req.coupleUser;
  const { mood, mood_color, body, entry_date = null } = req.body || {};

  if (!mood || typeof mood !== 'string') {
    return errRes(res, 400, 'mood is required');
  }
  if (!mood_color || typeof mood_color !== 'string') {
    return errRes(res, 400, 'mood_color is required');
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    return errRes(res, 400, 'body is required');
  }
  if (body.length > 8000) {
    return errRes(res, 400, 'body exceeds 8000 character limit');
  }

  const insertRow = {
    couple_id,
    user_id,
    mood:       mood.trim(),
    mood_color: mood_color.trim(),
    body:       body.trim(),
  };
  if (entry_date) insertRow.entry_date = entry_date;

  const { data, error } = await supabase
    .from('bride_pages')
    .insert(insertRow)
    .select('id, entry_date, mood, mood_color, body, created_at')
    .single();

  if (error) {
    console.error('[couple-pages:create] error:', error);
    return errRes(res, 500, 'failed to save page');
  }

  return okRes(res, { entry: data });
}));

// ── DELETE /:entryId ─────────────────────────────────────────────────────────
router.delete('/:entryId', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { entryId } = req.params;

  // Verify ownership before deletion.
  const { data: row, error: fetchErr } = await supabase
    .from('bride_pages')
    .select('id, couple_id')
    .eq('id', entryId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[couple-pages:delete] fetch error:', fetchErr);
    return errRes(res, 500, 'failed to delete page');
  }
  if (!row)                          return errRes(res, 404, 'page not found');
  if (row.couple_id !== couple_id)   return errRes(res, 403, 'forbidden');

  const { error } = await supabase
    .from('bride_pages')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('[couple-pages:delete] error:', error);
    return errRes(res, 500, 'failed to delete page');
  }

  return okRes(res, { deleted: true });
}));

module.exports = router;
""")


# ─── 3. mount pages router in core.js ────────────────────────────────────────
print("\n[3/5] src/api/couple/core.js  (mount pages router)")
patch_file(
    'src/api/couple/core.js',
    "// B-6: taste profile + Surprise Me\nrouter.use('/taste',    require('./taste'));\n\nmodule.exports = router;",
    "// B-6: taste profile + Surprise Me\nrouter.use('/taste',    require('./taste'));\n\n// B-7: Pages — bride's diary surface (one row per entry).\nrouter.use('/pages',    require('./pages'));\n\nmodule.exports = router;",
    "mount pages router",
)


# ─── 4. brideTools — read_pages tool definition ─────────────────────────────
print("\n[4/5] src/agent/brideTools.js  (add read_pages tool)")
patch_file(
    'src/agent/brideTools.js',
    "  {\n    name: 'list_circle',\n    description: 'Look up the bride\\'s circle — who has been invited, who has joined, who is pending. Use when she asks \"who\\'s in my circle\", \"did mom join yet\", \"who have I invited\", \"did anyone claim my invite\". Returns a list of circle members with their names, roles, status (active/pending/removed), and timestamps. After getting the result, compose a natural reply describing who is on her circle and their state.',\n    input_schema: {\n      type: 'object',\n      properties: {\n        status: {\n          type: 'string',\n          enum: ['active', 'pending', 'all'],\n          description: 'Optional. Filter by status. Default \"all\" — show every circle member regardless of state.',\n        },\n      },\n      required: [],\n    },\n  },\n];\n\nmodule.exports = { BRIDE_TOOLS };",
    "  {\n    name: 'list_circle',\n    description: 'Look up the bride\\'s circle — who has been invited, who has joined, who is pending. Use when she asks \"who\\'s in my circle\", \"did mom join yet\", \"who have I invited\", \"did anyone claim my invite\". Returns a list of circle members with their names, roles, status (active/pending/removed), and timestamps. After getting the result, compose a natural reply describing who is on her circle and their state.',\n    input_schema: {\n      type: 'object',\n      properties: {\n        status: {\n          type: 'string',\n          enum: ['active', 'pending', 'all'],\n          description: 'Optional. Filter by status. Default \"all\" — show every circle member regardless of state.',\n        },\n      },\n      required: [],\n    },\n  },\n  {\n    name: 'read_pages',\n    description: 'Read the bride\\'s diary entries from her Pages surface. Pages is her private journal — what she has written about her interior weather across days. Each entry has a mood (one of: hopeful, heavy, tender, tired, angry, still, missing-someone, proud, doubting, peaceful, overwhelmed, in-between), a mood colour, free-text body, and a date. Use this tool whenever ground-truth knowledge of her emotional state across days would let you reply more truly — e.g. she opens with \"I\\'m tired today\" and you want to acknowledge whether yesterday was also heavy; she asks \"have I been okay lately\"; she mentions a feeling and you want to mirror language from her own pages. Do NOT cite specific lines from her diary back to her unless she invites it — instead let the awareness inform the texture of your reply (warmer, gentler, more direct). Returns recent entries newest first.',\n    input_schema: {\n      type: 'object',\n      properties: {\n        limit: {\n          type: 'integer',\n          description: 'Optional. How many recent entries to read. Default 10. Maximum 30. Most replies only need the last 3–5 entries to ground tone.',\n        },\n        mood_filter: {\n          type: 'string',\n          description: 'Optional. Filter to entries with this exact mood string. Use when she asks something like \"have I been tired lately\" — pass mood_filter=\"tired\" and limit=10 to count.',\n        },\n      },\n      required: [],\n    },\n  },\n];\n\nmodule.exports = { BRIDE_TOOLS };",
    "add read_pages tool",
)


# ─── 5. brideEngine — dispatch + executor ────────────────────────────────────
print("\n[5/5] src/agent/brideEngine.js  (dispatch + executor)")

# 5a — add the dispatch case
patch_file(
    'src/agent/brideEngine.js',
    "    case 'list_circle': {\n      return await execListCircle({ input, couple, supabase });\n    }\n\n    case 'factual_search': {\n      return await execFactualSearch({ input, anthropic });\n    }",
    "    case 'list_circle': {\n      return await execListCircle({ input, couple, supabase });\n    }\n\n    case 'read_pages': {\n      return await execReadPages({ input, couple, supabase });\n    }\n\n    case 'factual_search': {\n      return await execFactualSearch({ input, anthropic });\n    }",
    "add read_pages dispatch case",
)

# 5b — insert executor before factual_search comment block
patch_file(
    'src/agent/brideEngine.js',
    "      return `${field}: ${coercedValue}`;\n  }\n}\n\n// ── factual_search executor ──────────────────────────────────────────",
    """      return `${field}: ${coercedValue}`;
  }
}

// ── read_pages executor ──────────────────────────────────────────────
// Returns the bride's recent diary entries. AI uses these to ground tone —
// e.g. acknowledge yesterday's heaviness, mirror her language. Does NOT
// quote her back to herself unless she invites it; informs reply texture.
async function execReadPages({ input, couple, supabase }) {
  const limitRaw   = parseInt(input?.limit, 10);
  const limit      = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 30) : 10;
  const moodFilter = typeof input?.mood_filter === 'string' ? input.mood_filter.trim() : null;

  let query = supabase
    .from('bride_pages')
    .select('id, entry_date, mood, mood_color, body, created_at')
    .eq('couple_id', couple.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (moodFilter) query = query.eq('mood', moodFilter);

  const { data, error } = await query;

  if (error) {
    console.error('[bride-tool:read_pages] error:', error);
    return { ok: false, error: error.message };
  }

  const entries = (data || []).map(r => ({
    date:    r.entry_date,
    mood:    r.mood,
    body:    r.body,
    written: r.created_at,
  }));

  return {
    ok: true,
    count:   entries.length,
    entries,
    summary: entries.length === 0
      ? 'No pages yet.'
      : `${entries.length} recent entry${entries.length === 1 ? '' : 'ies'}, newest first.`,
  };
}

// ── factual_search executor ──────────────────────────────────────────""",
    "insert execReadPages function",
)


print("\n✓ Backend patch complete. Next steps:\n")
print("  node --check src/api/couple/pages.js \\")
print("    && node --check src/api/couple/core.js \\")
print("    && node --check src/agent/brideEngine.js \\")
print("    && node --check src/agent/brideTools.js")
print()
print("  # Apply migration in Supabase SQL editor:")
print("  cat db/migrations/0055_bride_pages.sql")
print()
print("  git add db/migrations/0055_bride_pages.sql \\")
print("    src/api/couple/pages.js src/api/couple/core.js \\")
print("    src/agent/brideEngine.js src/agent/brideTools.js")
print("  git commit -m 'feat(bride): Pages diary backend — table, API, read_pages tool'")
print("  git push")
