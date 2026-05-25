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
  const { data: insertedRow, error: insErr } = await supabase
    .from('image_throttle_log')
    .insert({ phone, engine })
    .select('id')
    .single();

  if (insErr) {
    // Fail-open. Log + return allowed.
    console.error(`[imageThrottle] insert failed for ${phone}/${engine}:`, insErr.message);
    return { allowed: true, count: 0, shouldNotify: false, rowId: null };
  }

  // 2. Count attempts for this phone in the last 30s (inclusive of this row).
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();
  const { count, error: cntErr } = await supabase
    .from('image_throttle_log')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', windowStart);

  if (cntErr) {
    console.error(`[imageThrottle] count failed for ${phone}:`, cntErr.message);
    return { allowed: true, count: 0, shouldNotify: false, rowId: insertedRow?.id || null };
  }

  const allowed = (count || 0) <= MAX_PER_WINDOW;

  // 3. If over limit, check whether we've ALREADY sent a rejection in this
  //    window. If so, this caller should stay silent (still drop the image).
  let shouldNotify = false;
  if (!allowed) {
    const { count: rejCount, error: rejErr } = await supabase
      .from('image_throttle_log')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .eq('rejection_sent', true)
      .gte('created_at', windowStart);

    if (rejErr) {
      console.error(`[imageThrottle] rejection check failed for ${phone}:`, rejErr.message);
      // Fail-open: notify, so we don't silently drop everything.
      shouldNotify = true;
    } else {
      shouldNotify = (rejCount || 0) === 0;
    }
  }

  console.log(`[imageThrottle] ${phone}/${engine} count=${count} allowed=${allowed} shouldNotify=${shouldNotify}`);
  return { allowed, count: count || 0, shouldNotify, rowId: insertedRow?.id || null };
}

// Mark a throttle row as having sent a rejection reply. Future over-limit
// checks in the same window will see this and return shouldNotify=false.
async function markRejectionSent({ supabase, rowId }) {
  if (!supabase || !rowId) return;
  const { error } = await supabase
    .from('image_throttle_log')
    .update({ rejection_sent: true })
    .eq('id', rowId);
  if (error) {
    console.error(`[imageThrottle] markRejectionSent failed for row ${rowId}:`, error.message);
  }
}

module.exports = { checkImageThrottle, markRejectionSent, WINDOW_SECONDS, MAX_PER_WINDOW };
