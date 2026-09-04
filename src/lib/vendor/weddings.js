// src/lib/vendor/weddings.js
// BLOCK 19 · G1.1 · WEDDING PAGES — THE SOLE WRITER for `weddings`,
// `wedding_credits` and `wedding_photos`.
//
// ═══════════════════════════════════════════════════════════════════════════
// ONE WRITER PER TABLE. Every INSERT and UPDATE against the three tables born
// in 0131 happens in this file. The doors above it (studio, public, credits)
// carry auth and shape; they do not carry SQL. That is the estate's standing
// sole-writer law and the reason `eventWrite.js` exists for the calendar.
'use strict';

const { seasonYearFor } = require('../season');

// ── THE TEN ROLES — R-40.7, in R-40.7's ORDER ───────────────────────────────
// ⚠ THE ROLL IS NEVER ORDERED BY ANYTHING BUT ROLE (master §4 G1.1's own
// refusal). Not by claim status, not by when a credit was added, not by
// whether the credited vendor is on the platform. This array IS that order.
//
// ⚠ THE KEYS ARE WITNESSED BY THE MIGRATION, NOT BY THIS FILE.
// `db/migrations/0131_wedding_pages.sql`'s `wedding_credits_role_check` is the
// authority for which keys are legal; this array is the ORDER and the LABELS.
// Two lists are a drift waiting to happen, so `b53` parses the CHECK out of the
// migration file and asserts it against these keys — the bench is what makes
// "one home" true rather than this comment.
//
// The labels are the founder's own words from R-40.7 and are couple-facing
// bytes: they render as the `pv-crole` line on the public page and the
// `wl-crole` line in the credits sheet. `Décor` carries its accent.
const ROLES = Object.freeze([
  { key: 'shot_by',   label: 'Shot by'   },
  { key: 'makeup',    label: 'Makeup'    },
  { key: 'hair',      label: 'Hair'      },
  { key: 'decor',     label: 'Décor'     },
  { key: 'mehendi',   label: 'Mehendi'   },
  { key: 'planner',   label: 'Planner'   },
  { key: 'styled_by', label: 'Styled by' },
  { key: 'wearing',   label: 'Wearing'   },
  { key: 'model',     label: 'Model'     },
  { key: 'venue',     label: 'Venue'     },
]);

const ROLE_KEYS  = Object.freeze(ROLES.map((r) => r.key));
const ROLE_INDEX = Object.freeze(
  ROLES.reduce((acc, r, i) => { acc[r.key] = i; return acc; }, {}),
);
const ROLE_LABEL = Object.freeze(
  ROLES.reduce((acc, r) => { acc[r.key] = r.label; return acc; }, {}),
);

const CREDIT_STATES = Object.freeze(['tagged', 'claimed', 'declined']);
const VISIBILITIES  = Object.freeze(['draft', 'published']);

// ── THE SLUG RULE — ONE HOME (R-G11.4) ──────────────────────────────────────
// Derived from the title and SHOWN, never authored: the ratified create sheet
// draws the address dimmed precisely to say the vendor does not type it.
//
// Scoped per owner by `weddings_owner_slug_key`, so two studios may each hold
// `priya-arjun` and neither has to discover the other exists.
//
// The accent fold is NFD + combining-mark strip, so `Décor` and `Priyā` reduce
// to ascii rather than being dropped to nothing — a title in Devanagari or a
// name with a macron would otherwise slug to the empty string and collide with
// every other such title under the UNIQUE.
// ⚠ `&` IS DROPPED, NOT EXPANDED TO `and`, AND THE MOCK IS THE AUTHORITY.
// The ratified create sheet draws title `Ritika & Sameer` deriving
// `…/w/ritika-sameer`, and W1-page's address is `/v/DEV440/w/priya-arjun` for
// `Priya & Arjun`. A first cut of this function expanded `&` to ` and ` — a
// defensible rule that would have shipped `priya-and-arjun` and made every
// address in the ratified shots wrong. The mock outranks the tidier rule.
function slugify(title) {
  const base = String(title == null ? '' : title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return base;
}

/**
 * The slug the create door actually stores: `slugify`, then a numeric suffix
 * if this owner already holds it. The suffix walks rather than randomises so
 * the second `Priya & Arjun` is `priya-arjun-2` and not `priya-arjun-f3a91c` —
 * an address a vendor can read aloud is worth one extra round trip.
 *
 * The UNIQUE constraint remains the authority. This loop makes the common case
 * pleasant; the database makes it correct.
 */
async function uniqueSlug(supabase, ownerVendorId, title) {
  const base = slugify(title) || 'wedding';
  const { data, error } = await supabase
    .from('weddings')
    .select('slug')
    .eq('owner_vendor_id', ownerVendorId)
    .like('slug', `${base}%`);
  if (error) throw error;
  const taken = new Set((data || []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error('Could not derive a free slug for this title.');
}

// ── THE COLUMN LISTS ARE DECISIONS, NOT `select('*')` — F-04.106's law ──────
// Every column added to these tables in future ships to a client only when
// someone writes it on one of these lines. `phone` and `claim_token` appear on
// NEITHER public list, and that is R-G11.6 and the crew constitution enforced
// by the wire rather than by a filter someone can move.
const WEDDING_COLS =
  'id, owner_vendor_id, event_id, slug, title, venue, city, delivered_at, couple_consent, visibility, created_at, updated_at';
const CREDIT_COLS_OWNER =
  'id, wedding_id, role, vendor_id, phone, name, status, claim_token, created_at';
const PHOTO_COLS =
  'id, wedding_id, url, public_id, position';

// ── READS ───────────────────────────────────────────────────────────────────

async function listForOwner(supabase, ownerVendorId) {
  const { data, error } = await supabase
    .from('weddings')
    .select(WEDDING_COLS)
    .eq('owner_vendor_id', ownerVendorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getForOwner(supabase, ownerVendorId, weddingId) {
  const { data, error } = await supabase
    .from('weddings')
    .select(WEDDING_COLS)
    .eq('owner_vendor_id', ownerVendorId)
    .eq('id', weddingId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * THE ROLL, IN ROLE ORDER. Sorted in JS off `ROLE_INDEX` rather than by a SQL
 * `order`, because Postgres would sort the role keys ALPHABETICALLY —
 * decor, hair, makeup, mehendi, model, planner, shot_by, styled_by, venue,
 * wearing — which is not R-40.7's order and would put the photographer seventh
 * on her own page. The order is a ruled anti-feature; it lives in one array.
 */
async function creditsFor(supabase, weddingId) {
  const { data, error } = await supabase
    .from('wedding_credits')
    .select(CREDIT_COLS_OWNER)
    .eq('wedding_id', weddingId);
  if (error) throw error;
  return (data || []).sort((a, b) => {
    const ai = ROLE_INDEX[a.role], bi = ROLE_INDEX[b.role];
    if (ai !== bi) return (ai == null ? 99 : ai) - (bi == null ? 99 : bi);
    return String(a.created_at || '').localeCompare(String(b.created_at || ''));
  });
}

async function photosFor(supabase, weddingId) {
  const { data, error } = await supabase
    .from('wedding_photos')
    .select(PHOTO_COLS)
    .eq('wedding_id', weddingId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── WRITES ──────────────────────────────────────────────────────────────────

async function createWedding(supabase, { ownerVendorId, eventId, title, venue, city }) {
  const slug = await uniqueSlug(supabase, ownerVendorId, title);
  const { data, error } = await supabase
    .from('weddings')
    .insert({
      owner_vendor_id: ownerVendorId,
      event_id: eventId || null,
      slug,
      title,
      venue: venue || null,
      city: city || null,
    })
    .select(WEDDING_COLS)
    .single();
  if (error) throw error;
  return data;
}

async function addCredit(supabase, { weddingId, role, vendorId, phone, name }) {
  const { data, error } = await supabase
    .from('wedding_credits')
    .insert({
      wedding_id: weddingId,
      role,
      vendor_id: vendorId || null,
      phone: phone || null,
      name: name || null,
      // A credit for a vendor already on the platform is still `tagged`: being
      // findable is not the same as having agreed. Nothing is published under
      // anyone's name until they choose — that is the claim message's own
      // promise and it would be a lie if this line said 'claimed'.
      status: 'tagged',
    })
    .select(CREDIT_COLS_OWNER)
    .single();
  if (error) throw error;
  return data;
}

/**
 * PUBLISH. `delivered_at` is set HERE and only here (R-G11.20: a wedding page
 * is finished work, and publication is what declares it finished). Nothing on
 * `public.events` moves — R-40.11.
 *
 * ⚠ THIS DOOR DOES NOT WRITE `couple_consent`. R-G11.10: the column exists,
 * defaults false, and NO door in this sitting writes it. The couple's switch
 * is chartered to G1.2 as the only writer it will ever have. Publication
 * therefore sets `visibility='published'` and the page still does not serve
 * until the consent is true — which on this fixture only the founder's
 * provenance-shown SQL makes true, as a ruled walk step.
 */
async function publishWedding(supabase, { ownerVendorId, weddingId }) {
  const { data, error } = await supabase
    .from('weddings')
    .update({
      visibility: 'published',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('owner_vendor_id', ownerVendorId)
    .eq('id', weddingId)
    .select(WEDDING_COLS)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function addPhoto(supabase, { weddingId, url, publicId, position }) {
  const { data, error } = await supabase
    .from('wedding_photos')
    .insert({
      wedding_id: weddingId,
      url,
      public_id: publicId,
      position: Number.isFinite(position) ? position : 0,
    })
    .select(PHOTO_COLS)
    .single();
  if (error) throw error;
  return data;
}

// ── THE CLAIM PAIR ──────────────────────────────────────────────────────────
// R-G11.14: no expiry (the crew constitution). The token is ONE ACTION, then
// terminal — `settleCredit` moves `tagged` and nothing else, so a second call
// on a settled credit changes no byte and the caller reads the terminal state.
// A re-open shows that state and offers no toggle this sitting.

async function findCreditByToken(supabase, token) {
  const { data, error } = await supabase
    .from('wedding_credits')
    .select(CREDIT_COLS_OWNER)
    .eq('claim_token', token)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * The `.eq('status','tagged')` in the UPDATE is the single-action guarantee and
 * it is enforced BY THE DATABASE, not by a read-then-write in this process.
 * Two taps arriving together both pass a JS status check; only one of them
 * matches this predicate.
 */
async function settleCredit(supabase, { token, status, vendorId }) {
  if (status !== 'claimed' && status !== 'declined') {
    throw new Error('settleCredit: status must be claimed or declined.');
  }
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'claimed' && vendorId) patch.vendor_id = vendorId;
  const { data, error } = await supabase
    .from('wedding_credits')
    .update(patch)
    .eq('claim_token', token)
    .eq('status', 'tagged')
    .select(CREDIT_COLS_OWNER)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// ── THE PUBLIC SHAPE — R-G11.6 ENFORCED BY THE WIRE ─────────────────────────
/**
 * ⚠ PHONES NEVER REACH THIS FUNCTION'S OUTPUT, AND `claim_token` NEVER DOES
 * EITHER. The shape is built field by field from an explicit list; nothing is
 * spread. A spread would ship every column the credit row happens to carry the
 * day someone adds one — which is exactly how `page_token`, a capability
 * secret, once reached a client (F-04.106).
 *
 * An unclaimed credit renders role + name and NO link. A claimed credit whose
 * vendor is inactive or paused renders the same way: the link is the vendor's
 * public card, and if that card would 404 then printing the address is an
 * invitation to a dead page.
 */
function publicRoll(credits, vendorsById) {
  return credits
    .filter((c) => c.status !== 'declined')
    .map((c) => {
      const v = c.vendor_id ? vendorsById[c.vendor_id] : null;
      const linkable = Boolean(
        c.status === 'claimed' && v && v.status === 'active' && v.discover_paused !== true,
      );
      return {
        role:  c.role,
        label: ROLE_LABEL[c.role] || null,
        name:  linkable ? v.business_name : (c.name || (v ? v.business_name : null)),
        handle: linkable ? String(v.routing_handle || '').toLowerCase() : null,
      };
    })
    .filter((r) => r.name);
}

function publicWedding(wedding, eventDate) {
  return {
    slug:   wedding.slug,
    title:  wedding.title,
    venue:  wedding.venue,
    city:   wedding.city,
    season: eventDate ? seasonYearFor(eventDate) : null,
  };
}

module.exports = {
  ROLES, ROLE_KEYS, ROLE_INDEX, ROLE_LABEL, CREDIT_STATES, VISIBILITIES,
  WEDDING_COLS, CREDIT_COLS_OWNER, PHOTO_COLS,
  slugify, uniqueSlug,
  listForOwner, getForOwner, creditsFor, photosFor,
  createWedding, addCredit, publishWedding, addPhoto,
  findCreditByToken, settleCredit,
  publicRoll, publicWedding,
};
