// src/lib/imageThrottle.js
// Patch 9 — rate-limit inbound WhatsApp images to two per 30 seconds per phone.
//
// Called by both engines (vendor src/index.js and bride src/brideIndex.js)
// before any image-processing pipeline runs. Behaviour:
//
//   1. Insert a row in image_throttle_log for (phone, engine).
//   2. Count rows for this phone in the last WINDOW_SECONDS.
//   3. If count > MAX_PER_WINDOW, return { allowed: false, count }.
//   4. Else, return { allowed: true, count }.
//
// The insert happens BEFORE the count so two concurrent webhooks see each
// other's rows — no race condition where both think they're #1.
//
// Caller responsibilities:
//   - If allowed: false, send the polite refusal copy and short-circuit.
//   - If allowed: true, run the pipeline normally.

const WINDOW_SECONDS  = 30;
const MAX_PER_WINDOW  = 2;

/**
 * @param {object} args
 * @param {object} args.supabase
 * @param {string} args.phone          E.164 phone, e.g. '+918757788550'
 * @param {'vendor'|'bride'} args.engine
 * @returns {Promise<{ allowed: boolean, count: number }>}
 *   On DB error: returns { allowed: true, count: 0 } — fail-open to avoid
 *   blocking legitimate messages if the throttle table is unavailable.
 */
async function checkImageThrottle({ supabase, phone, engine }) {
  if (!supabase) throw new Error('imageThrottle: supabase is required');
  if (!phone)    throw new Error('imageThrottle: phone is required');
  if (engine !== 'vendor' && engine !== 'bride') {
    throw new Error("imageThrottle: engine must be 'vendor' or 'bride'");
  }

  // 1. Insert this attempt FIRST so concurrent webhooks see each other.
  const { error: insErr } = await supabase
    .from('image_throttle_log')
    .insert({ phone, engine });

  if (insErr) {
    // Fail-open. Log + return allowed.
    console.error(`[imageThrottle] insert failed for ${phone}/${engine}:`, insErr.message);
    return { allowed: true, count: 0 };
  }

  // 2. Count attempts for this phone in the last 30s (inclusive of the row
  //    we just inserted).
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
  const { count, error: cntErr } = await supabase
    .from('image_throttle_log')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', windowStart);

  if (cntErr) {
    console.error(`[imageThrottle] count failed for ${phone}:`, cntErr.message);
    return { allowed: true, count: 0 };
  }

  const allowed = (count || 0) <= MAX_PER_WINDOW;
  console.log(`[imageThrottle] ${phone}/${engine} count=${count} allowed=${allowed}`);
  return { allowed, count: count || 0 };
}

module.exports = { checkImageThrottle, WINDOW_SECONDS, MAX_PER_WINDOW };
