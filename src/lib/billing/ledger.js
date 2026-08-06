// src/lib/billing/ledger.js
// THE SOLE WRITER of public.billing_events.
//
// ═════════════════════════════════════════════════════════════════════════════
// THE SOLE-WRITER RIDER, and why this table needs it more than most
// ═════════════════════════════════════════════════════════════════════════════
// A row in billing_events asserts: "a provider signed this event and we verified
// the signature before storing it." That assertion is what lets the Bridge print
// a revenue figure the founder can act on. It is only true if EVERY row arrived
// through a verified webhook — so this module is the only thing in the estate
// that inserts here, it is called from exactly one place (the /webhook/razorpay
// handler in src/index.js), and no admin route, cron, backfill or hand-insert
// may reach it.
//
// This matters for the acceptance bar too: the Bridge's "wiring pending" label
// retires against the WEBHOOK'S EXISTENCE, never against a row someone typed.
// A hand-inserted row would pass a naive bench and prove nothing.
'use strict';

const TABLE = 'billing_events';

// Postgres unique_violation. The idempotency guard's whole mechanism.
const UNIQUE_VIOLATION = '23505';

/**
 * Write one verified provider event. Idempotent on `event_id`.
 *
 * Razorpay retries a webhook with exponential back-off for 24 hours whenever it
 * does not see a 2xx inside five seconds, and the retry carries the SAME
 * x-razorpay-event-id. So a duplicate is not an error condition here — it is the
 * normal, expected consequence of a slow night, and it must produce exactly one
 * row and exactly one flip. The UNIQUE index on event_id is the guard; this
 * function reads its violation as "already handled" rather than as a failure.
 *
 * Returns one of:
 *   { status: 'written',   row }   first sight — caller may proceed to the flip
 *   { status: 'duplicate' }        already ledgered — caller must NOT flip again
 *   { status: 'error', error }     storage failed — caller must NOT return 2xx,
 *                                  so the provider retries and the event is not lost
 */
async function recordEvent(supabase, normalized) {
  if (!supabase) return { status: 'error', error: 'no supabase client' };
  if (!normalized || !normalized.event_id) {
    return { status: 'error', error: 'event_id is required — it is the idempotency key' };
  }

  const row = {
    event_id:                 normalized.event_id,
    provider:                 normalized.provider,
    event:                    normalized.event,
    vendor_id:                normalized.vendor_id || null,
    provider_subscription_id: normalized.provider_subscription_id || null,
    provider_payment_id:      normalized.provider_payment_id || null,
    amount_paise:             typeof normalized.amount_paise === 'number' ? normalized.amount_paise : null,
    currency:                 normalized.currency || null,
    counts_as_revenue:        normalized.counts_as_revenue === true,
    payload:                  normalized.payload || {},
  };

  const { data, error } = await supabase.from(TABLE).insert(row).select().single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: 'duplicate' };
    return { status: 'error', error: error.message || String(error) };
  }
  return { status: 'written', row: data };
}

module.exports = { recordEvent, TABLE };
