'use strict';
// src/lib/vendor/safetyCheck.js · TDW · CE-47 · WEB-4 cut 30 · R-47.2 (b): GOOGLE'S IMAGE SAFETY CHECK.
// Google Vision SAFE_SEARCH_DETECTION on the existing GOOGLE_VISION_API_KEY (lib/imagePipeline.js uses the same key).
// The rule that turns Google's answer into a state lives in pictureRules.js (HOLD_RULE), not here.
//
//   check(urls)  -> [{ url, state, scores }] in the same order. state is 'passed' or 'held', or 'unchecked' when the
//                   check could not run (no key, no answer inside the limit, an error). 'unchecked' is live on her own
//                   pages and NOT on Discover; the sweep checks it again.
//   sweep(sb)    -> checks up to 64 'unchecked' pictures across both tables and writes their state. Every 15 minutes
//                   (src/cron.js, :13 :28 :43 :58) and once by hand on switch day.
const R = require('./pictureRules');

const BATCH = 16;            // Vision's limit of images per images:annotate call
const LIMIT_MS = 4000;       // the upload door waits at most this long for an answer
const SWEEP_MAX = 64;

async function annotate(urls, deps) {
  const d = deps || {};
  const key = d.apiKey !== undefined ? d.apiKey : process.env.GOOGLE_VISION_API_KEY;
  if (!key) return urls.map(() => null);
  const fetchImpl = d.fetch || fetch;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), d.limitMs || LIMIT_MS) : null;
  try {
    const res = await fetchImpl(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({ requests: urls.map((u) => ({ image: { source: { imageUri: u } }, features: [{ type: 'SAFE_SEARCH_DETECTION' }] })) }),
    });
    if (!res || !res.ok) return urls.map(() => null);
    const json = await res.json();
    const rs = (json && json.responses) || [];
    return urls.map((_, i) => (rs[i] && !rs[i].error && rs[i].safeSearchAnnotation) || null);
  } catch (_e) { return urls.map(() => null); }
  finally { if (timer) clearTimeout(timer); }
}

/** Check pictures by address. Never throws; a picture it cannot check is 'unchecked'. */
async function check(urls, deps) {
  const list = (Array.isArray(urls) ? urls : []).map(String);
  const out = [];
  for (let i = 0; i < list.length; i += BATCH) {
    const part = list.slice(i, i + BATCH);
    const answers = await annotate(part, deps);
    part.forEach((url, k) => {
      const s = answers[k];
      out.push(s ? { url, state: R.stateFromScores(s), scores: { adult: s.adult, spoof: s.spoof, medical: s.medical, violence: s.violence, racy: s.racy } }
        : { url, state: R.SAFETY.UNCHECKED, scores: null });
    });
  }
  return out;
}

/** The fields a checked picture is written with (both tables). */
const fieldsOf = (r, nowIso) => (r.state === R.SAFETY.UNCHECKED ? null
  : { safety_state: r.state, safety_scores: r.scores, safety_checked_at: nowIso || new Date().toISOString() });

/** Check the 'unchecked' pictures of both tables and write what Google answered. Returns counts for the log line. */
async function sweep(sb, deps) {
  const d = deps || {};
  const out = { scanned: 0, passed: 0, held: 0, still_unchecked: 0 };
  for (const table of ['vendor_portfolio', 'vendor_look_photos']) {
    let q = sb.from(table).select('id, image_url').eq('safety_state', R.SAFETY.UNCHECKED);
    if (table === 'vendor_look_photos') q = q.is('deleted_at', null);
    const { data, error } = await q.limit(SWEEP_MAX);
    if (error || !Array.isArray(data) || !data.length) continue;
    const rows = data.filter((x) => /^https:\/\//.test(String(x.image_url || '')));
    const res = await check(rows.map((x) => x.image_url), d);
    out.scanned += rows.length;
    for (let i = 0; i < rows.length; i += 1) {
      const f = fieldsOf(res[i]);
      if (!f) { out.still_unchecked += 1; continue; }
      // guarded: only a row still 'unchecked' is written, so an admin's release in between is never undone
      await sb.from(table).update(f).eq('id', rows[i].id).eq('safety_state', R.SAFETY.UNCHECKED);
      out[f.safety_state] += 1;
    }
  }
  return out;
}

module.exports = { check, sweep, fieldsOf, BATCH, LIMIT_MS, SWEEP_MAX };
