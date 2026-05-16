// ─────────────────────────────────────────────────────────────────────────────
// src/lib/museSave.js
// Atomic Muse save helper — orchestrates the row-write side of a Muse save.
//
// PURPOSE: brideIndex.js handles media detection. Once an image or link is
// detected, this helper:
//   1. Runs the image pipeline (Cloudinary upload + Vision + Haiku tagging)
//   2. Looks up the next save_number for this couple_id (monotonic per couple)
//   3. Inserts the muse_saves row
//   4. Inserts the circle_activity row (activity_type='save_added')
//   5. Returns the new save record (for the agent's awareness message)
//
// FAILURE MODES:
//   Returns { ok: false, error } on any failure — caller decides how to surface.
//   Never throws. The agent gets a graceful "couldn't process this image"
//   reply rather than a 500.
//
// CALLER CONTEXT REQUIRED:
//   { sourceUrl, couple_id, saved_by_user_id, saved_by_role, caption?,
//     session_id?, supabase, anthropic }
//
// RETURNS on success:
//   { ok: true, save: { id, save_number, image_url, source_url, source_type,
//                       aesthetic_tags, caption, saved_by_user_id, saved_by_role } }
//
// B2 Step 4: bride-forwarded images.
// B2 Step 5: extended for circle members (saved_by_role='circle_member').
//            - actor_name lookup from circle_members.invitee_name
//            - optional session_id threaded onto the circle_activity row
//              for session-scoped surfacing (Step 6 summaries).
// ─────────────────────────────────────────────────────────────────────────────

const { processImageForMuse } = require('./imagePipeline');

// ── Lookup next save_number for a couple ─────────────────────────────────────
// Monotonic per couple_id. Uses MAX + 1. Race-safe via the unique index
// (couple_id, save_number) — if two concurrent saves collide, one insert
// errors and the caller retries.

async function nextSaveNumber(supabase, couple_id) {
  const { data, error } = await supabase
    .from('muse_saves')
    .select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`museSave.nextSaveNumber: ${error.message}`);
  }

  const current = data && data.length > 0 ? data[0].save_number : 0;
  return current + 1;
}

// ── Main entry: save a forwarded image or link to Muse ───────────────────────
//
// sourceUrl       : string  — Twilio media URL OR external link (Pinterest, IG, etc)
// couple_id       : string  — the bride's couple_id (always the bride's, even when a
//                             circle member is saving — see B2 architecture)
// saved_by_user_id: string  — UUID of the person who triggered the save (bride or
//                             circle member). Stored on the row for attribution.
// saved_by_role   : string  — 'bride' or 'circle_member'
// actor_name      : string  — optional. Display name for circle_activity row.
//                             Caller (handleCircleMemberMessage) passes
//                             circleMember.invitee_name directly, eliminating
//                             the 2-query DB lookup and its silent failure modes.
//                             Defaults to 'You' for bride, 'Circle member' if not passed.
// caption         : string  — optional. The text body that arrived alongside the
//                             image/link, if any.
// session_id      : string  — optional UUID. When saving as a circle_member during
//                             an active session, threading this in lets Step 6's
//                             summarizer pull all activity for one session in order.
//                             Bride-side saves pass null (sessions are circle-only).
// supabase        : object  — Supabase client (service role)
// anthropic       : object  — Anthropic SDK client (passed through to pipeline)

async function saveToMuse({
  sourceUrl,
  couple_id,
  saved_by_user_id,
  saved_by_role,
  actor_name = null,
  caption = null,
  session_id = null,
  supabase,
  anthropic,
}) {
  // Validate the basics. Caller errors should be loud.
  if (!sourceUrl)        return { ok: false, error: 'sourceUrl required' };
  if (!couple_id)        return { ok: false, error: 'couple_id required' };
  if (!saved_by_user_id) return { ok: false, error: 'saved_by_user_id required' };
  if (saved_by_role !== 'bride' && saved_by_role !== 'circle_member') {
    return { ok: false, error: `saved_by_role must be 'bride' or 'circle_member' (got "${saved_by_role}")` };
  }
  if (!supabase || !anthropic) {
    return { ok: false, error: 'supabase and anthropic clients required' };
  }

  // ── Phase 1: run the pipeline (Cloudinary + Vision + Haiku tagging) ──
  // runClassifier: true for bride saves only. Circle saves always go to Muse.
  // When the classifier returns 'receipt', processImageForMuse returns early
  // with source_type='receipt' — we skip the muse_save insert entirely and
  // return a receipt-classified result for brideIndex.js to handle.
  let pipelineResult;
  try {
    pipelineResult = await processImageForMuse({
      sourceUrl,
      couple_id,
      anthropic,
      runClassifier: saved_by_role === 'bride',
    });
  } catch (err) {
    console.error('[museSave] pipeline failed:', err.message);
    return { ok: false, error: `image pipeline failed: ${err.message}` };
  }

  // ── Receipt early-exit (bride path only) ─────────────────────────────
  // If the classifier routed to 'receipt', skip the muse_save pipeline.
  // Image is already in Cloudinary. Return the Cloudinary URL so brideIndex.js
  // can synthesize a receipt-flow context note for the agent.
  if (pipelineResult.source_type === 'receipt') {
    console.log(`[museSave] image classified as receipt, skipping muse_save insert. image_url=${pipelineResult.image_url}`);
    return {
      ok:             true,
      classified_as:  'receipt',
      image_url:      pipelineResult.image_url,
    };
  }

  const {
    source_type,
    image_url,
    source_url: resolvedSourceUrl,
    vision_raw,
    aesthetic_tags,
  } = pipelineResult;

  // ── Phase 2 + 3: get next save_number and insert, with retry on race ─
  // The unique index (couple_id, save_number) makes concurrent saves
  // collision-safe at the DB level: one insert wins, the other errors.
  // We retry up to MAX_SAVE_RETRIES times in case multiple writers (bride
  // + circle members) happen to hit the same save_number window.
  //
  // Postgres unique-violation SQLSTATE is 23505. Supabase error.code carries
  // it through as a string. We retry only on that specific code — other
  // errors (column violations, RLS, network) fail immediately.
  const cleanCaption = (caption && typeof caption === 'string' && caption.trim())
    ? caption.trim().slice(0, 500)
    : null;

  const MAX_SAVE_RETRIES = 3;
  let save_number;
  let savedRow = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_SAVE_RETRIES; attempt++) {
    try {
      save_number = await nextSaveNumber(supabase, couple_id);
    } catch (err) {
      console.error('[museSave] save_number lookup failed:', err.message);
      return { ok: false, error: err.message };
    }

    const { data, error: insertError } = await supabase
      .from('muse_saves')
      .insert({
        couple_id,
        save_number,
        source_type,
        source_url:       resolvedSourceUrl,
        image_url,
        vendor_id:        null,        // B2: never a vendor save. Discover saves arrive at Session 9.
        caption:          cleanCaption,
        aesthetic_tags,
        vision_raw,
        saved_by_user_id,
        saved_by_role,
      })
      .select('id, save_number, source_type, source_url, image_url, caption, aesthetic_tags, saved_by_user_id, saved_by_role')
      .single();

    if (!insertError) {
      savedRow = data;
      break;
    }

    lastError = insertError;
    // 23505 = unique_violation — a concurrent insert took our save_number.
    // Retry: bump and re-lookup.
    if (insertError.code === '23505') {
      console.warn(`[museSave] save_number ${save_number} collision (attempt ${attempt}/${MAX_SAVE_RETRIES}), retrying`);
      continue;
    }

    // Any other error → fail fast.
    console.error('[museSave] insert failed:', insertError);
    return { ok: false, error: `muse_saves insert failed: ${insertError.message}` };
  }

  if (!savedRow) {
    console.error('[museSave] save failed after retries:', lastError);
    return {
      ok: false,
      error: `muse_saves insert failed after ${MAX_SAVE_RETRIES} retries: ${lastError?.message ?? 'unknown'}`,
    };
  }

  // ── Phase 4: insert circle_activity row ──────────────────────────────
  // actor_name: M6/I2 fix — caller passes actor_name directly (e.g. circleMember.invitee_name)
  // eliminating the 2-query DB lookup and its silent-failure modes.
  // Fall back to role-based defaults only when not provided.
  let actorName;
  if (actor_name && typeof actor_name === 'string' && actor_name.trim()) {
    actorName = actor_name.trim();
  } else {
    actorName = saved_by_role === 'bride' ? 'You' : 'Circle member';
  }

  const activityRow = {
    couple_id,
    actor_user_id:  saved_by_user_id,
    actor_name:     actorName,
    actor_role:     saved_by_role,
    activity_type:  'save_added',
    subject_type:   'muse_save',
    subject_id:     savedRow.id,
    payload:        { save_number },
    // surfaced_to_bride defaults to false at DB level
  };

  // Thread session_id only for circle saves where it was passed.
  if (saved_by_role === 'circle_member' && session_id) {
    activityRow.session_id = session_id;
  }

  const { error: activityError } = await supabase
    .from('circle_activity')
    .insert(activityRow);

  if (activityError) {
    // Non-fatal: the save itself succeeded. Log but don't fail the whole save.
    console.error('[museSave] circle_activity insert failed (non-fatal):', activityError.message);
  }

  // Null-safe formatting — Array.isArray guards against unexpected pipeline
  // output. Throwing here would leave an orphan DB row reported as a failure.
  const tagsForLog = Array.isArray(aesthetic_tags) ? aesthetic_tags.join(',') : 'none';
  console.log(`[museSave] saved #${save_number} for couple ${couple_id} (${source_type}, tags: ${tagsForLog}, actor: ${actorName}${session_id ? ', session: ' + session_id.slice(0,8) : ''})`);

  return { ok: true, save: savedRow };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  saveToMuse,
  nextSaveNumber,  // exported for tests / future direct use
};
