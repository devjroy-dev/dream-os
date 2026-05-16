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
//   { sourceUrl, couple_id, saved_by_user_id, saved_by_role, caption?, supabase, anthropic }
//
// RETURNS on success:
//   { ok: true, save: { id, save_number, image_url, source_url, source_type,
//                       aesthetic_tags, caption, saved_by_user_id, saved_by_role } }
//
// Used by brideIndex.js for bride-forwarded images (Step 4). Will be used by
// the circle member flow (Step 5) with the same shape.
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
// caption         : string  — optional. The text body that arrived alongside the
//                             image/link, if any.
// supabase        : object  — Supabase client (service role)
// anthropic       : object  — Anthropic SDK client (passed through to pipeline)

async function saveToMuse({
  sourceUrl,
  couple_id,
  saved_by_user_id,
  saved_by_role,
  caption = null,
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
  let pipelineResult;
  try {
    pipelineResult = await processImageForMuse({
      sourceUrl,
      couple_id,
      anthropic,
    });
  } catch (err) {
    console.error('[museSave] pipeline failed:', err.message);
    return { ok: false, error: `image pipeline failed: ${err.message}` };
  }

  const {
    source_type,
    image_url,
    source_url: resolvedSourceUrl,
    vision_raw,
    aesthetic_tags,
  } = pipelineResult;

  // ── Phase 2: get next save_number ────────────────────────────────────
  let save_number;
  try {
    save_number = await nextSaveNumber(supabase, couple_id);
  } catch (err) {
    console.error('[museSave] save_number lookup failed:', err.message);
    return { ok: false, error: err.message };
  }

  // ── Phase 3: insert muse_saves row ───────────────────────────────────
  const cleanCaption = (caption && typeof caption === 'string' && caption.trim())
    ? caption.trim().slice(0, 500)
    : null;

  const { data: savedRow, error: insertError } = await supabase
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

  if (insertError) {
    console.error('[museSave] insert failed:', insertError);
    return { ok: false, error: `muse_saves insert failed: ${insertError.message}` };
  }

  // ── Phase 4: insert circle_activity row ──────────────────────────────
  // Activity row records who did what, when. surface_circle_summary (Step 6)
  // reads unsurfaced activity to compose the BFF preamble for the bride.
  //
  // actor_name: B2 default to 'You' for bride saves, the circle member's
  // invitee_name for circle saves. Caller passes the right one via a fetch.
  // For now (Step 4 only ships bride saves), we'll write 'You' as actor_name
  // when role is bride. Step 5 extends this.
  const actorName = saved_by_role === 'bride' ? 'You' : 'Circle member';

  const { error: activityError } = await supabase
    .from('circle_activity')
    .insert({
      couple_id,
      actor_user_id:  saved_by_user_id,
      actor_name:     actorName,
      actor_role:     saved_by_role,
      activity_type:  'save_added',
      subject_type:   'muse_save',
      subject_id:     savedRow.id,
      payload:        { save_number },
      // surfaced_to_bride defaults to false at DB level
    });

  if (activityError) {
    // Non-fatal: the save itself succeeded. Log but don't fail the whole save.
    console.error('[museSave] circle_activity insert failed (non-fatal):', activityError.message);
  }

  console.log(`[museSave] saved #${save_number} for couple ${couple_id} (${source_type}, tags: ${aesthetic_tags.join(',')})`);

  return { ok: true, save: savedRow };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  saveToMuse,
  nextSaveNumber,  // exported for tests / future direct use
};
