// clients.js — single entry point for client creation
// Session 8.5: prevents duplicate clients across promotion + manual add paths
//
// resolveOrCreateClient is the ONLY allowed door to creating a client.
// Both lead promotion (record_payment) and manual add (add_client tool)
// route through here. Phone is the dedup key. Names are never matched.

/**
 * Find or create a client for this vendor.
 *
 * @param {object} supabase   - supabase client (service role)
 * @param {string} vendorId   - vendor uuid
 * @param {object} input
 * @param {string} input.name             - required
 * @param {string} [input.phone]          - E.164 if present
 * @param {string} [input.email]
 * @param {string} [input.source]         - default 'lead_promotion'
 * @param {string} [input.referrer_name]
 * @param {string} [input.notes]
 * @param {string} [input.user_id]        - if caller already resolved a users row
 *
 * @returns {Promise<{ client: object, created: boolean }>}
 *   created=true means a new row was inserted.
 *   created=false means an existing client was matched (by vendor_id + phone).
 */
export async function resolveOrCreateClient(supabase, vendorId, input) {
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
  if (phone) {
    const { data: existing, error: lookupErr } = await supabase
      .from('clients')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('phone', phone)
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
