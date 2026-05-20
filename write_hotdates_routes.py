import os

# ── 1. Write src/api/public/hotDates.js ──────────────────────────────────────

os.makedirs('src/api/public', exist_ok=True)

lines = [
    "// src/api/public/hotDates.js",
    "// GET /api/v2/hot-dates — public reference data.",
    "// Vivah Muhurat and other auspicious Indian wedding dates.",
    "// No auth required — used by dreamai calendar and couple-facing features.",
    "//",
    "// Query params:",
    "//   ?year=2026          — filter by year (optional)",
    "//   ?region=north_india — filter by region (optional)",
    "//",
    "// Note: hot_dates schema has: date, note, region.",
    "// The spec's 'tradition' and 'label' fields map to: region -> region, note -> label.",
    "",
    "'use strict';",
    "",
    "const express = require('express');",
    "const router  = express.Router();",
    "const asyncHandler = require('../lib/asyncHandler');",
    "const { ok: okRes, err: errRes } = require('../lib/response');",
    "",
    "// ─── GET /api/v2/hot-dates ─────────────────────────────────────────────",
    "",
    "router.get('/', asyncHandler(async (req, res) => {",
    "  const supabase = req.app.locals.supabase;",
    "  const year     = req.query.year   || null;",
    "  const region   = req.query.region || null;",
    "",
    "  let query = supabase",
    "    .from('hot_dates')",
    "    .select('id, date, note, region')",
    "    .order('date', { ascending: true });",
    "",
    "  if (year) {",
    "    query = query",
    "      .gte('date', year + '-01-01')",
    "      .lte('date', year + '-12-31');",
    "  }",
    "  if (region) {",
    "    query = query.eq('region', region);",
    "  }",
    "",
    "  const { data, error, count } = await query;",
    "  if (error) return errRes(res, 500, error.message);",
    "",
    "  const dates = (data || []).map(r => ({",
    "    id:     r.id,",
    "    date:   r.date,",
    "    label:  r.note   || null,",
    "    region: r.region || 'All India',",
    "  }));",
    "",
    "  return okRes(res, { dates, total: dates.length });",
    "}));",
    "",
    "module.exports = router;",
]

with open('src/api/public/hotDates.js', 'w') as f:
    f.write('\n'.join(lines) + '\n')

print('Written: src/api/public/hotDates.js')

# ── 2. Patch src/api/router.js to mount hot-dates ────────────────────────────

with open('src/api/router.js', 'r') as f:
    router = f.read()

# Mount before the vendor core router
old_line = "router.use('/vendor',             require('./vendor/core'));"
new_line = (
    "router.use('/hot-dates',          require('./public/hotDates'));\n"
    "router.use('/vendor',             require('./vendor/core'));"
)
router = router.replace(old_line, new_line, 1)

with open('src/api/router.js', 'w') as f:
    f.write(router)

print('Patched: src/api/router.js')
