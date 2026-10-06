'use strict';
// src/lib/collab/testers.js · CE-47 · CLB-1 · RULE 1's list (ruling 1, 4 October 2026).
// admin_config 'clb.testers' holds a JSON array of vendor ids (DEV440 first). Set by one row by hand, like every
// arming in this estate (laneFlags.js's law); this file never writes it. Cached 60 s. Fails closed: junk, a missing
// row or an unreachable database is an empty list, so pending features open for nobody.
const KEY = 'clb.testers';
const CACHE_MS = 60 * 1000;
let _at = 0; let _list = [];

function parse(value) {
  try { const a = JSON.parse(String(value || '')); return Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x.length) : []; } catch (_e) { return []; }
}

async function testers(supabase, opts = {}) {
  const now = Date.now();
  if (!opts.fresh && now - _at < CACHE_MS) return _list;
  try {
    const { data, error } = await supabase.from('admin_config').select('value').eq('key', KEY).maybeSingle();
    _list = error ? [] : parse(data && data.value);
  } catch (_e) { _list = []; }
  _at = now;
  return _list;
}
function _reset() { _at = 0; _list = []; }

module.exports = { KEY, parse, testers, _reset };
