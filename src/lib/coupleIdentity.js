// src/lib/coupleIdentity.js
// Created P1-4: gives every bride a permanent couple_id from first contact
// with any vendor on +91. Replaces the absence of bride identity that froze
// vendor development at 8.5a.
//
// Never call invite_couple() — it requires pronouns and would clobber
// existing users. Never write partner_name from here. Never write
// couple_state.summary.

async function ensureCoupleRow(supabase, phone, name) {
  // ── Step 1: ensure users row ─────────────────────────────────────
  let user_id;

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, name')
    .eq('phone', phone)
    .maybeSingle();

  if (existingUser) {
    user_id = existingUser.id;
    // Backfill name only if the user currently has no name and a name was given
    if (name && !existingUser.name) {
      await supabase
        .from('users')
        .update({ name })
        .eq('id', user_id);
    }
  } else {
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({ phone, name: name || null })
      .select('id')
      .single();

    if (insertErr) {
      if (insertErr.code === '23505') {
        // Race condition — another concurrent request inserted first
        const { data: racedUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phone)
          .maybeSingle();
        user_id = racedUser?.id;
      } else {
        throw new Error(`[coupleIdentity] users insert failed: ${insertErr.message}`);
      }
    } else {
      user_id = newUser.id;
    }
  }

  // ── Step 2: ensure couples row ───────────────────────────────────
  let couple_id;

  const { data: existingCouple } = await supabase
    .from('couples')
    .select('id')
    .eq('user_id', user_id)
    .maybeSingle();

  if (existingCouple) {
    couple_id = existingCouple.id;
  } else {
    const { data: newCouple, error: coupleErr } = await supabase
      .from('couples')
      .insert({ user_id })
      .select('id')
      .single();

    if (coupleErr) {
      if (coupleErr.code === '23505') {
        // Race condition — another concurrent request inserted first
        const { data: racedCouple } = await supabase
          .from('couples')
          .select('id')
          .eq('user_id', user_id)
          .maybeSingle();
        couple_id = racedCouple?.id;
      } else {
        throw new Error(`[coupleIdentity] couples insert failed: ${coupleErr.message}`);
      }
    } else {
      couple_id = newCouple.id;
    }
  }

  // ── Step 3: ensure couple_state row ─────────────────────────────
  // No trigger auto-creates this. 23505 = already exists, treat as success.
  const { error: stateErr } = await supabase
    .from('couple_state')
    .insert({ couple_id });

  if (stateErr && stateErr.code !== '23505') {
    // Non-fatal — log but do not throw. couple_state missing won't break the
    // vendor flow; it only affects the bride agent.
    console.error(`[coupleIdentity] couple_state insert failed (non-fatal): ${stateErr.message}`);
  }

  return { user_id, couple_id };
}

async function captureField(supabase, couple_id, field, value) {
  const ALLOWED_FIELDS = new Set(['wedding_date', 'wedding_city', 'budget_total']);

  if (field === 'partner_name') {
    return { ok: false, error: 'partner_name not writable from vendor side' };
  }

  if (!ALLOWED_FIELDS.has(field)) {
    return { ok: false, error: `field "${field}" not allowed` };
  }

  let coerced = value;

  if (field === 'wedding_date') {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      coerced = value.trim();
    } else {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        return { ok: false, error: 'wedding_date could not be parsed' };
      }
      coerced = parsed.toISOString().split('T')[0];
    }
  }

  if (field === 'wedding_city') {
    if (typeof value !== 'string' || !value.trim()) {
      return { ok: false, error: 'wedding_city must be a non-empty string' };
    }
    coerced = value.trim().slice(0, 120);
  }

  if (field === 'budget_total') {
    const asInt = Number.isInteger(value) ? value : parseInt(value, 10);
    if (!Number.isInteger(asInt) || asInt <= 0) {
      return { ok: false, error: 'budget_total must be a positive integer (rupees)' };
    }
    coerced = asInt;
  }

  // Fetch current value to skip noop UPDATEs
  const { data: currentRow } = await supabase
    .from('couples')
    .select(field)
    .eq('id', couple_id)
    .maybeSingle();

  if (currentRow && String(currentRow[field]) === String(coerced)) {
    return { ok: true };
  }

  const { error: updateErr } = await supabase
    .from('couples')
    .update({ [field]: coerced })
    .eq('id', couple_id);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  return { ok: true };
}

module.exports = { ensureCoupleRow, captureField };
