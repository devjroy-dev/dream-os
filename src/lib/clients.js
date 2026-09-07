// src/lib/clients.js — single entry point for client creation
// Session 8.5 — prevents duplicate clients across promotion + manual add paths
//
// resolveOrCreateClient is the ONLY allowed door to creating a client.
// Both lead promotion (record_payment) and manual add (add_client tool)
// route through here. Phone is the dedup key. Names are never matched.

async function resolveOrCreateClient(supabase, vendorId, input) {
  if (!vendorId) throw new Error('resolveOrCreateClient: vendorId required');
  if (!input?.name) throw new Error('resolveOrCreateClient: name required');

  const name          = input.name.trim();
  const phone         = input.phone?.trim() || null;
  const email         = input.email?.trim() || null;
  const source        = input.source || 'lead_promotion';
  const referrerName  = input.referrer_name?.trim() || null;
  const notes         = input.notes?.trim() || null;
  const userId        = input.user_id || null;

  // Step 1: phone-based dedup. Only when phone is present.
  //
  // ── F-40.222 · `deleted_at IS NULL`, AND IT IS HALF OF A TWO-PART CURE ────
  // This lookup had NO deleted_at filter, so a client the vendor had deleted was
  // matched and handed back as live. The index behind it, `clients_vendor_phone_
  // unique`, had the same blind spot from the other direction — it read
  // `WHERE (phone IS NOT NULL)` and so a deleted row still RESERVED its phone
  // number. That pair is the `PHONE_COLLISION` 409 the 2026-09-06 walk hit after
  // a second `Slide Test 1` was minted.
  //
  // ⚠ NEITHER HALF IS A CURE ALONE, and they shipped together. Migration `0143`
  // recreated the index as `WHERE (phone IS NOT NULL AND deleted_at IS NULL)` —
  // founder-run and verified by predicate, not by name, because the index kept
  // its name across the change. Had the index moved without this line, a vendor
  // would be handed back a client she had already deleted; had this line moved
  // without the index, creating her replacement would still 409.
  //
  // ⚠ `.is('deleted_at', null)` AND NOT `.eq(...)`. SQL NULL is not equal to
  // anything, itself included; `.eq('deleted_at', null)` matches no row at all
  // and would turn every lookup into a miss — which fails as a FLOOD OF
  // DUPLICATES rather than as an error, and is exactly the shape that stays
  // invisible. `invoices.js:101` takes the same posture on the same column.
  if (phone) {
    const { data: existing, error: lookupErr } = await supabase
      .from('clients')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .maybeSingle();

    if (lookupErr) {
      console.error('[clients:resolveOrCreate] phone lookup failed:', lookupErr.message);
      throw lookupErr;
    }

    if (existing) {
      console.log(`[clients:resolveOrCreate] matched existing client ${existing.id} on phone ${phone}`);
      return { client: existing, created: false };
    }
  }

  // Step 2: no match (or no phone given) — create new
  const { data: created, error: insertErr } = await supabase
    .from('clients')
    .insert({
      vendor_id:     vendorId,
      user_id:       userId,
      name,
      phone,
      email,
      source,
      referrer_name: referrerName,
      notes,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('[clients:resolveOrCreate] insert failed:', insertErr.message);
    throw insertErr;
  }

  console.log(`[clients:resolveOrCreate] created new client ${created.id} (${name}) for vendor ${vendorId}`);
  return { client: created, created: true };
}

module.exports = { resolveOrCreateClient };
