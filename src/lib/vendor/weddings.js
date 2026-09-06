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

const crypto = require('crypto');
const { seasonYearFor } = require('../season');
// R-G13.3 · IMPORTED, NEVER TRANSCRIBED. One module, whose own only runtime
// dependency is `../waNumbers`; the public page and the Frost deck therefore
// send a couple to the same number with the same message by construction.
const { ENQUIRE_BASE } = require('../discover/shapeVendor');

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
// ⚠ `wedding_date` and `wedding_date_precision` join at 0137 (R-G13.11). They
// are the NO-EVENT create's own columns: a back-catalogue page has no calendar
// row, so `events.event_date` cannot date it and the season had nowhere to come
// from. F-40.99 is what their absence cost — strings #26 and #27 were founder-
// vetoed and then WITHHELD because `public.weddings` had thirteen columns and
// none was a date, so R-G12.6 could not execute as worded.
const WEDDING_COLS =
  'id, owner_vendor_id, event_id, couple_id, slug, title, venue, city, wedding_date, wedding_date_precision, delivered_at, couple_consent, visibility, created_at, updated_at';
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

/**
 * THE SPINE — a wedding's couple, resolved ONCE, at create (R-G11c.2 re-ruled).
 *
 * The obvious route is `weddings.event_id -> events.couple_id`, and it is dead:
 * `events_owner_xor` (0013:55) enforces that an event has a vendor OR a couple,
 * never both, and the create door only ever offers the vendor's OWN events
 * (src/api/vendor/studio/weddings.js:84). So that column is NULL by
 * construction on every wedding that can exist — F-40.45, found by the database
 * refusing the write rather than by reading about it.
 *
 * The live route is the engagement. `public.engagements` is keyed
 * (couple_id, vendor_id) and carries the lead the couple arrived on, so the
 * event's own `linked_lead_id` reaches her:
 *
 *     events.linked_lead_id -> engagements.lead_id  (vendor_id = THIS owner)
 *                           -> engagements.couple_id
 *
 * THE vendor_id SCOPE IS LOAD-BEARING, not defensive. The fixture couple holds
 * THREE engagements, two of them `photography` (DEV440 and DROY550). A match on
 * lead alone, or on couple-and-category, would be ambiguous on real data today.
 *
 * DECLARED MISS, filed not hidden — F-40.60: this derivation is LEAD-MEDIATED,
 * so an engagement with a NULL `lead_id` is invisible to it. There is a live
 * specimen: MAKEUPBYSWATIROY's engagement with the fixture couple carries no
 * lead. A page owned by that vendor resolves NULL and its couple never gets a
 * switch over it, though the estate knows who she is one column away.
 * `engagements.couple_booking_id` is a second path that would catch it and is
 * UNRULED (F-40.61) — so it is named here and not built.
 *
 * Returns null rather than throwing on every absence: a back-catalogue page has
 * no event at all (R-G11.21), and a page with no couple is a legal, ordinary
 * page — it simply waits for the off-platform consent path (F-40.49, G1.2).
 */
async function resolveCoupleForEvent(supabase, { ownerVendorId, eventId }) {
  if (!eventId) return null;

  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('linked_lead_id')
    .eq('id', eventId)
    .maybeSingle();
  if (evErr) throw evErr;
  if (!ev || !ev.linked_lead_id) return null;

  // ── F-40.64 CURED · THE SPINE HAS ONE HOME AND THIS FILE IS NOT IT ────────
  // This function reached `public.engagements` directly and `b16` §2.2/§2.3
  // convicted it for the whole G1.1c arc — those cells WALK THE SOURCE TREE, so
  // a second reader cannot hide behind a list nobody updated. The query moved to
  // `src/lib/engagements.js` as `coupleIdForLead`, carrying its `vendor_id`
  // scope and its declared miss (F-40.60) with it, rather than leaving either
  // for the next caller to re-derive.
  const { coupleIdForLead } = require('../engagements');
  return coupleIdForLead(supabase, {
    leadId: ev.linked_lead_id,
    vendorId: ownerVendorId,
  });
}

/**
 * HER STANDING ANSWER, READ AT THE MOMENT THE PAGE IS BORN (R-G11c.8).
 *
 * This is the one place a vendor-lane file touches `couple_consent`, and the
 * b53:261 amendment (R-G11c.9) narrows that cell to the two doors it was always
 * about rather than exempting this line. The distinction the ruling turns on:
 * R-G11.10 forbids a vendor door writing consent AS A VENDOR'S CHOICE. This is
 * not a choice — it is a COPY of the couple's own answer, read from her row,
 * never from a request body. A page born to a couple whose switch is already on
 * is born consented, which is what she already said.
 *
 * `=== true` rather than truthiness: the column is NOT NULL DEFAULT false
 * (0132), but a missing row must seed false, not undefined.
 */
async function consentSeedFor(supabase, coupleId) {
  if (!coupleId) return false;
  const { data, error } = await supabase
    .from('couples')
    .select('publish_weddings')
    .eq('id', coupleId)
    .maybeSingle();
  if (error) throw error;
  return (data && data.publish_weddings) === true;
}

/**
 * ── G1.3 · THE NO-EVENT CREATE OPENS (R-G13.11, F-40.99's remainder) ────────
 * `eventId` was already NULLABLE in the column (R-G11.21) and REQUIRED at the
 * door, because the ratified create sheet had "Which event" and no way to type a
 * date — so a back-catalogue page could exist in the schema and not through any
 * surface. 0137 gives the row its own date and the door opens.
 *
 * ⚠ THE TWO DATE COLUMNS MOVE TOGETHER OR NEITHER MOVES. A precision beside a
 * NULL date is a claim about a date that does not exist, and a date with no
 * precision cannot be rendered honestly — `createLead` reasons identically about
 * the same pair on `leads` (R-G12.11), and 0137 carries `leads`' own CHECK
 * vocabulary so the two planes cannot mean different things by `'month'`.
 *
 * ⚠ AND A WEDDING WITH AN EVENT DOES NOT GET A TYPED DATE. The event's own
 * `event_date` is the fact; storing a second one beside it is the drift
 * R-G11.16 refused for `season`, one column further down. The caller passes one
 * or the other and this function does not reconcile them — the door refuses the
 * combination before it gets here.
 */
async function createWedding(supabase, { ownerVendorId, eventId, title, venue, city,
                                         weddingDate, weddingDatePrecision }) {
  const slug = await uniqueSlug(supabase, ownerVendorId, title);
  const coupleId    = await resolveCoupleForEvent(supabase, { ownerVendorId, eventId });
  const consentSeed = await consentSeedFor(supabase, coupleId);
  const bothDateParts = Boolean(weddingDate) && Boolean(weddingDatePrecision);
  const { data, error } = await supabase
    .from('weddings')
    .insert({
      owner_vendor_id: ownerVendorId,
      event_id: eventId || null,
      couple_id: coupleId,
      slug,
      title,
      venue: venue || null,
      city: city || null,
      wedding_date:           bothDateParts ? weddingDate           : null,
      wedding_date_precision: bothDateParts ? weddingDatePrecision  : null,
      couple_consent: consentSeed,
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

/**
 * DELETE ONE PHOTOGRAPH — R-G12.12.
 *
 * The plane was built for this delete and never got it: 0131:118-122 stores
 * `public_id` DELIBERATELY because `vendor_portfolio` has no such column and its
 * delete path must parse a URL, which orphans the asset whenever the URL carries
 * no `/v<digits>/` segment (F-07.14). This plane does not inherit that defect —
 * so the row goes here and the Cloudinary asset is destroyed by the caller with
 * the stored id, never with a parsed one.
 *
 * SCOPED THROUGH THE WEDDING, not by photo id alone. A bare
 * `.eq('id', photoId)` would let any authenticated vendor delete any vendor's
 * photograph by guessing a uuid; the door already proved she owns the wedding,
 * and this predicate is what makes that proof load-bearing rather than
 * decorative.
 *
 * ⚠ NO REORDER FUNCTION HERE, BY RULING. R-G12.12 was narrowed after this seat
 * flagged that `POST /:id/photos/order` would ship with no caller — the F-40.28
 * shape, a door with no reader. Order changes by remove-and-re-add until a
 * gesture is ruled (F-40.83). `position` stays settable at INSERT only.
 */
async function deletePhoto(supabase, { weddingId, photoId }) {
  const { data, error } = await supabase
    .from('wedding_photos')
    .delete()
    .eq('id', photoId)
    .eq('wedding_id', weddingId)
    .select(PHOTO_COLS)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// ── THE OFF-PLATFORM COUPLE — R-G12.4 / R-G12.5, F-40.49 ────────────────────
/**
 * MINT (or re-mint) the consent token and record who it went to.
 *
 * RE-MINTING IS THE DESIGN, not a convenience. `wedding_set_consent` enforces a
 * 30-day expiry against `consent_sent_at` (0133), and a token cannot be revived
 * by any other means — so a vendor whose ask went stale sends again and the old
 * token dies the moment this row is overwritten. One live token per page, ever.
 *
 * ⚠ REFUSED ON A PAGE WHOSE COUPLE IS ON TDW. That page's consent is governed by
 * HER SWITCH (`couple_set_publish`, 0132), and minting a token beside it would
 * give one decision two doors — the exact disease the writer-set census exists
 * to prevent. The caller gets `null` and says so; it is not an error.
 */
async function mintConsentToken(supabase, { ownerVendorId, weddingId, phone }) {
  const wedding = await getForOwner(supabase, ownerVendorId, weddingId);
  if (!wedding) return null;
  if (wedding.couple_id) return { refused: 'couple_on_platform' };

  const { data, error } = await supabase
    .from('weddings')
    .update({
      consent_token:   crypto.randomUUID(),
      consent_sent_at: new Date().toISOString(),
      consent_phone:   phone,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', weddingId)
    .eq('owner_vendor_id', ownerVendorId)
    .select('id, slug, title, consent_token, consent_sent_at')
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * WHAT THE CONSENT PAGE IS ALLOWED TO KNOW.
 *
 * The token is looked up and the row is NEVER spread — `consent_phone` is the
 * couple's own number and `consent_token` is already in her address bar, so
 * neither is echoed. F-04.106 is the precedent: a spread once shipped
 * `page_token`, a capability secret, to a client.
 *
 * THE EXPIRY IS EVALUATED HERE TOO, and returns the same `null` as an absent
 * token. The leaf renders one sentence for both; a page that distinguished them
 * would tell a prober which tokens once existed.
 */
async function findWeddingByConsentToken(supabase, token) {
  const { data, error } = await supabase
    .from('weddings')
    // ⚠ `consent_phone` IS SELECTED AND NEVER RETURNED PAST THIS FILE. The
    // last-four check compares against it SERVER-SIDE; the digits are the thing
    // the caller supplies, never the thing this estate hands out. A door that
    // returned even four of them would let a forwarded link be answered by
    // reading the page it was forwarded to.
    .select('id, owner_vendor_id, title, couple_consent, consent_sent_at, consent_phone, consent_attempts')
    .eq('consent_token', token)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.consent_sent_at) return null;
  const ageMs = Date.now() - new Date(data.consent_sent_at).getTime();
  if (ageMs > 30 * 24 * 60 * 60 * 1000) return null;
  return data;
}

// ── THE LAST-FOUR CHECK — R-G12.18.4, F-40.105's cure ───────────────────────
// A FRICTION CHECK AGAINST A FORWARDED LINK, NOT AN OTP. The founder walked the
// hole: the vendor was handed the couple's link by design, so the counterparty
// could say yes. The link now never reaches her — and this is the second half,
// for the case where a link is forwarded on by someone who did receive it.
//
// ⚠ THE COMPARISON IS SERVER-SIDE AND THE NUMBER NEVER LEAVES. The caller sends
// four digits; this file holds the number. Returning even a masked form of it to
// the consent page would defeat the check by printing its own answer.
//
// ⚠ THREE WRONG ANSWERS SPEND THE TOKEN, and spending is `consent_token = NULL`
// rather than a flag: a spent token then reaches the SAME miss as a forged one,
// an expired one and one that never existed. Enforced by the lookup, not by a
// branch someone could reorder.
//
// A CORRECT ANSWER DOES NOT RESET THE COUNT. A token that has survived two
// guesses is one somebody has been working on; forgiving that on a lucky third
// would hand a guesser an unlimited budget four digits at a time.
const CONSENT_MAX_ATTEMPTS = 3;

function lastFourOf(phone) {
  const digits = String(phone == null ? '' : phone).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}

/**
 * -> true on a match. On a wrong answer the count rises and the token may be
 * spent; either way the caller gets `false` and cannot tell which happened.
 */
async function checkConsentLastFour(supabase, { weddingId, token, digits }) {
  const wedding = await findWeddingByConsentToken(supabase, token);
  if (!wedding || wedding.id !== weddingId) return false;

  const want = lastFourOf(wedding.consent_phone);
  const got  = String(digits == null ? '' : digits).replace(/\D/g, '');
  // A page with no recorded number cannot be answered at all. That is not a
  // failure of this check — it is a page nobody was ever asked about, and
  // letting it through would be the whole hole reopened.
  if (!want) return false;

  if (got === want) return true;

  const attempts = Number(wedding.consent_attempts || 0) + 1;
  const patch = { consent_attempts: attempts, updated_at: new Date().toISOString() };
  if (attempts >= CONSENT_MAX_ATTEMPTS) patch.consent_token = null;
  const { error } = await supabase.from('weddings').update(patch).eq('id', wedding.id);
  if (error) throw error;
  return false;
}

/**
 * THE THIRD WRITER, CALLED THROUGH ITS FUNCTION AND NEVER AS AN UPDATE.
 *
 * `wedding_set_consent` (0133) checks the token and the expiry INSIDE its own
 * UPDATE, so a wrong token, an expired token and an absent page all touch zero
 * rows and are one indistinguishable miss. Doing it as a `supabase.update()`
 * here would move that predicate into this process, where a read-then-write
 * races itself — 0131:97's own lesson, applied a second time.
 */
async function setConsentByToken(supabase, { weddingId, token, consent }) {
  const { data, error } = await supabase.rpc('wedding_set_consent', {
    p_wedding_id: weddingId,
    p_token:      token,
    p_consent:    consent,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row || null;
}


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

/**
 * ── LINKABILITY, ONE PREDICATE, TWO READERS (R-G13.5) ──────────────────────
 * Extracted because G1.3 gave it a SECOND reader and a rule with two copies is
 * a rule with two behaviours. `publicRoll` uses it to decide what renders; the
 * team door uses it to decide who receives a lead, and R-G13.14 turns on those
 * two answers being the same one.
 *
 * ⚠ `claimed` AND `vendor_id` ARE INDEPENDENT FACTS, which is why `v &&` is
 * doing real work and is not defensive typing. `src/api/credits.js` rules it
 * outright: the person opening a claim link is usually NOT on the platform,
 * there is no session to identify them, so `settleCredit` is called with no
 * vendor and the credit becomes `claimed` with the owner's typed name. The
 * fixture holds a live specimen — `hair · Nir`, claimed since 2026-09-04 with a
 * NULL `vendor_id`, permanently unlinkable and correctly so.
 *
 * A paused or inactive vendor is excluded for the roll's own stated reason:
 * printing an address that would itself 404 is an invitation to a dead page.
 */
function isLinkable(credit, vendor) {
  return Boolean(
    credit
    && credit.status === 'claimed'
    && vendor
    && vendor.status === 'active'
    && vendor.discover_paused !== true,
  );
}

/**
 * ── THE TEAM, RESOLVED (R-G13.5) ───────────────────────────────────────────
 * Who "Book the same team" reaches, computed in ONE place so the sheet that
 * NAMES them and the door that WRITES to them cannot disagree. Consent to a
 * named set is only consent if the set she read is the set that gets written.
 *
 * THE SET: `unique(vendor_id)` over credits that pass `isLinkable`, ∪ the page's
 * owner. Three properties, each of which the fixture or the schema forced:
 *
 *  · UNIQUE BY VENDOR, NOT BY CREDIT. `wedding_credits` has no uniqueness on
 *    (wedding_id, role) and none on (wedding_id, vendor_id) — one artist may
 *    hold makeup AND hair on the same wedding. Keyed by credit, she would get
 *    two leads for one enquiry and `createLead`'s dedupe would silently discard
 *    the second, which looks identical to the write failing.
 *  · THE OWNER IS ALWAYS IN, credited or not. The fixture proves she must be:
 *    DEV440 owns the page and holds NO `shot_by` credit, because `createWedding`
 *    does not auto-credit her. A team that excluded the photographer whose page
 *    it is would be absurd.
 *  · THE OWNER MAY ALSO BE A CREDIT, so she is de-duplicated by id like anyone
 *    else — the `Map` keyed on vendor id is what makes that automatic instead of
 *    a special case somebody has to remember.
 *
 * ⚠ IT RETURNS NAMES AS WELL AS IDS, and the names are the REGISTERED
 * `business_name` — never the name typed into a credit. F-40.54 is why: a
 * hurried credit once mislabelled another business, and this list is read aloud
 * to a guest before she consents.
 *
 * ⚠ AND IT NEVER RETURNS A PHONE. R-G11.6, same as every other public shape in
 * this file: the object is built field by field from an explicit list.
 */
async function teamTargets(supabase, { weddingId, ownerVendorId }) {
  const credits = await creditsFor(supabase, weddingId);

  const ids = [...new Set(credits.filter((c) => c.vendor_id).map((c) => c.vendor_id))];
  const wanted = [...new Set([ownerVendorId, ...ids])];
  if (!wanted.length) return [];

  const { data: vs, error } = await supabase
    .from('vendors')
    .select('id, business_name, routing_handle, status, discover_paused')
    .in('id', wanted);
  if (error) throw error;
  const byId = (vs || []).reduce((acc, v) => { acc[v.id] = v; return acc; }, {});

  const out = new Map();

  // The owner first, and she is held to the SAME liveness test as everyone else.
  // A vendor who has paused her own storefront has withdrawn from being found —
  // `weddingPage.js` already kills her whole page on that switch, so a door that
  // wrote her a lead anyway would be writing from a page nobody can open.
  const owner = byId[ownerVendorId];
  if (owner && owner.status === 'active' && owner.discover_paused !== true) {
    out.set(owner.id, {
      vendor_id: owner.id,
      name: owner.business_name,
      handle: String(owner.routing_handle || '').toLowerCase(),
      is_owner: true,
    });
  }

  // Then the roll, in the roll's own ruled order — `creditsFor` already sorted
  // by ROLE_INDEX, so the names a guest reads on the sheet appear in the same
  // sequence as the credits above it rather than in id order.
  for (const c of credits) {
    const v = c.vendor_id ? byId[c.vendor_id] : null;
    if (!isLinkable(c, v)) continue;
    if (out.has(v.id)) continue;
    out.set(v.id, {
      vendor_id: v.id,
      name: v.business_name,
      handle: String(v.routing_handle || '').toLowerCase(),
      is_owner: false,
    });
  }

  // A target with no registered name is DROPPED, not printed nameless.
  // `vendors.business_name` is nullable (PUBLIC_SCHEMA.md:1130, ordinal 3), so a
  // claimed credit on an active vendor with a NULL name would otherwise be IN
  // the write set and ABSENT from the roll — the exact divergence R-G13.14
  // forbids, reachable through a column nobody has to touch.
  return [...out.values()].filter((t) => t.name);
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
      const linkable = isLinkable(c, v);
      return {
        role:  c.role,
        label: ROLE_LABEL[c.role] || null,
        name:  linkable ? v.business_name : (c.name || (v ? v.business_name : null)),
        handle: linkable ? String(v.routing_handle || '').toLowerCase() : null,
        // ── G1.3 · THE DOOR ON THE ROLL (R-G13.3) ─────────────────────────
        // Built HERE, at the door, and never on the leaf. Two reasons, and the
        // second is the one that would have bitten:
        //
        //  1. `ENQUIRE_BASE` is declared once at
        //     `src/lib/discover/shapeVendor.js` and already serves every
        //     Enquire tap in the estate. Composing a `wa.me` on the pwa side
        //     would be a second home for the house number, and `waNumbers.js`'s
        //     own header records what two homes cost last time — eleven
        //     independent fallbacks, one of them on the wrong lane (F-05.23).
        //
        //  2. ⚠ THE MESSAGE BODY NEEDS THE UPPERCASE HANDLE AND THE WIRE
        //     CARRIES THE LOWERCASE ONE. `handle` above is lowercased for the
        //     `/v/<handle>` address; `vendorCard.js` is explicit that the token
        //     is built from `routing_handle` UPPERCASE and "NOT from the wire's
        //     `handle`". A leaf reusing the field beside it would have shipped
        //     `TDW-makeupbyswatiroy`. It happens to route today only because
        //     `vendorInbound.js` upper-cases the first word before matching —
        //     which is a property of the intake, not a promise to this file.
        //
        // UNLINKABLE CREDITS KEEP NO DOOR: `null`, the same absence as `handle`.
        // The roll is not a directory (R-G11.6) — an unclaimed credit has no
        // storefront to send anyone to, and a TDW line with a code nobody owns
        // would route an enquiry into nothing.
        enquire_link: linkable ? ENQUIRE_BASE + String(v.routing_handle) : null,
      };
    })
    .filter((r) => r.name);
}

/**
 * ⚠ SEASON IS STILL DERIVED AND STILL HAS ONE HOME (R-G11.16, R-G13.11).
 * 0137 adds a date COLUMN, not a season column. The derivation simply gains a
 * second source in order of authority: the calendar's own `event_date` first,
 * the typed `wedding_date` only when there is no event behind the page.
 *
 * The event wins deliberately. If a page somehow carried both, the calendar row
 * is the one the vendor maintains and the typed date is the one she entered once
 * — preferring the typed value would let a stale keystroke outrank a live row.
 *
 * A page with neither renders NO season and the meta line drops the part, which
 * is what `metaLine` already does for a deleted event (the FK is ON DELETE SET
 * NULL). Never a guessed date.
 */
function publicWedding(wedding, eventDate) {
  const dated = eventDate || wedding.wedding_date || null;
  return {
    slug:   wedding.slug,
    title:  wedding.title,
    venue:  wedding.venue,
    city:   wedding.city,
    season: dated ? seasonYearFor(dated) : null,
  };
}

module.exports = {
  ROLES, ROLE_KEYS, ROLE_INDEX, ROLE_LABEL, CREDIT_STATES, VISIBILITIES,
  WEDDING_COLS, CREDIT_COLS_OWNER, PHOTO_COLS,
  slugify, uniqueSlug,
  listForOwner, getForOwner, creditsFor, photosFor,
  createWedding, addCredit, publishWedding, addPhoto, deletePhoto,
  resolveCoupleForEvent, consentSeedFor,
  mintConsentToken, findWeddingByConsentToken, setConsentByToken,
  checkConsentLastFour, lastFourOf, CONSENT_MAX_ATTEMPTS,
  findCreditByToken, settleCredit,
  publicRoll, publicWedding, isLinkable, teamTargets,
};
