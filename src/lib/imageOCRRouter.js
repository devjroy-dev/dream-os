// ─────────────────────────────────────────────────────────────────────────────
// src/lib/imageOCRRouter.js
// Bride image classifier: muse vs receipt vs moment.
//
// PURPOSE: Decide whether an inbound bride image is:
//   'muse'    — wedding inspiration (vendor portfolio, design, decor, fashion)
//   'receipt' — receipt/invoice for the expense vault
//   'moment'  — personal candid (people, food, social, real life)
// Runs on both bride and circle member image paths.
//
// IMPLEMENTATION: Google Vision DOCUMENT_TEXT_DETECTION + LABEL_DETECTION.
// Google Vision is purpose-built for document/receipt recognition and
// operates on the same GOOGLE_VISION_API_KEY already used by imagePipeline.js
// for the Muse aesthetic pipeline. No new API dependency.
//
//   DOCUMENT_TEXT_DETECTION: returns a textAnnotation block if the image
//   contains structured text/document layout. Receipts score high.
//   Aesthetic wedding images (decor, fashion, venues) score low or zero.
//
//   LABEL_DETECTION: returns labels like "Receipt", "Invoice", "Currency",
//   "Document", "Financial transaction" with confidence scores. Used as a
//   secondary signal — any receipt-adjacent label at confidence >= 0.7
//   confirms the receipt classification.
//
// DECISION LOGIC:
//   Receipt if EITHER of:
//     (a) DOCUMENT_TEXT_DETECTION returns text with word count >= 8 (enough
//         words to indicate a structured document, not a watermark or title)
//     (b) LABEL_DETECTION returns any receipt-adjacent label at score >= 0.7
//   Muse otherwise.
//
// FAILURE MODES: default to 'muse'. False muse routes are recoverable via
// natural language ("that was a receipt"). False receipt routes contaminate
// the mood board. Default to the safer failure.
//
// COST: ~Rs 0.15/image ($1.50 per 1000). First 1000 units/month FREE
// (Google Vision free tier). At cohort scale (50 brides × ~20 images each
// = ~1000/month), this classifier runs entirely within the free tier.
//
// SECURITY: image_url must be a public Cloudinary URL. Google's servers
// fetch the image directly. The caller is responsible for Cloudinary upload
// BEFORE calling this function.
// ─────────────────────────────────────────────────────────────────────────────

// Receipt-adjacent labels from Google Vision taxonomy.
// Labels at confidence >= RECEIPT_LABEL_THRESHOLD trigger receipt routing.
// NOTE: 'document' and 'paper' are intentionally excluded (M1 audit fix).
// Vision assigns these at high confidence to wedding invitations, menus,
// design briefs, and event programs — all common bride forwards. Signal A
// (word count) already covers text-heavy documents. Signal B should only
// catch financial-instrument labels that Signal A might miss.
const RECEIPT_LABELS = new Set([
  'receipt',
  'invoice',
  'bill',
  'financial transaction',
  'currency',
  'money',
  'payment',
  'tax',
  'bank statement',
  'cheque',
  'check',
]);

const RECEIPT_LABEL_THRESHOLD  = 0.70;  // confidence >= 70% to count as receipt label
const RECEIPT_WORD_COUNT_MIN   = 20;    // L1 audit fix: raised from 8 to 20. At 8 words,

// Moment-adjacent labels — personal photos, candids, real life, food, social.
// Any of these at >= MOMENT_LABEL_THRESHOLD routes to 'moment' surface.
// Evaluated AFTER receipt check, BEFORE defaulting to muse.
// The list is deliberately broad — false positives (a vendor portfolio shot
// with people in it) are recoverable; false negatives (a candid landing in
// Muse) are worse UX. Default to moment when in doubt for people/food.
const MOMENT_LABELS = new Set([
  // People & social
  'people', 'person', 'smile', 'fun', 'friendship', 'event', 'selfie',
  'crowd', 'party', 'ceremony', 'togetherness', 'social group', 'community',
  'facial expression', 'laugh', 'happy', 'joy', 'leisure', 'recreation',
  'snapshot', 'portrait', 'child', 'baby', 'family', 'skin', 'hair',
  'lip', 'eye', 'nose', 'face', 'head', 'forehead', 'cheek', 'chin',
  'human body', 'shoulder', 'arm', 'hand', 'finger',
  // Food & drink
  'food', 'meal', 'dish', 'cuisine', 'restaurant', 'cafe', 'dining',
  'lunch', 'dinner', 'brunch', 'breakfast', 'drink', 'beverage',
  'coffee', 'tea', 'cocktail', 'dessert', 'cake', 'snack', 'plate',
  'table setting', 'tableware',
  // Street & real life
  'street', 'road', 'neighbourhood', 'city', 'urban', 'market',
  'bazaar', 'shop', 'store', 'building', 'architecture',
  // Moments / candid signals
  'photograph', 'photography', 'snapshot', 'selfie', 'group photo',
  'outdoor', 'nature', 'sky', 'tree', 'grass', 'park',
  // Bride-specific personal moments
  'shopping', 'fitting', 'trial', 'appointment', 'mirror',
]);
const MOMENT_LABEL_THRESHOLD = 0.72; // slightly higher than receipt to avoid false positives
                                         // mood board screenshots with captions, vendor
                                         // website screenshots, and design references all
                                         // triggered receipt routing. Real receipts have
                                         // many words (address, GST, line items, totals).

async function classifyImage({ image_url }) {
  // L2 audit fix: return { route: 'muse' } instead of throwing on invalid
  // image_url — consistent with "default to muse on any failure" principle.
  if (!image_url || typeof image_url !== 'string') {
    console.warn('[imageOCRRouter] image_url missing or not a string, defaulting to muse');
    return { route: 'muse' };
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    // No API key — cannot classify. Default to muse.
    console.warn('[imageOCRRouter] GOOGLE_VISION_API_KEY not set, defaulting to muse');
    return { route: 'muse' };
  }

  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
  const body = {
    requests: [
      {
        image: { source: { imageUri: image_url } },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
          { type: 'LABEL_DETECTION',         maxResults: 10 },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[imageOCRRouter] Vision API timed out after 10s, defaulting to muse');
    } else {
      console.warn('[imageOCRRouter] Vision API request failed, defaulting to muse:', err.message);
    }
    return { route: 'muse' };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    console.warn(`[imageOCRRouter] Vision API returned ${res.status}, defaulting to muse`);
    return { route: 'muse' };
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.warn('[imageOCRRouter] Vision API response not JSON, defaulting to muse');
    return { route: 'muse' };
  }

  const response = data?.responses?.[0];
  if (!response || response.error) {
    console.warn('[imageOCRRouter] Vision returned error or empty response, defaulting to muse');
    return { route: 'muse' };
  }

  // ── Signal A: document text density ─────────────────────────────────────
  // DOCUMENT_TEXT_DETECTION returns fullTextAnnotation when the image
  // contains structured text. We count words — receipts have many (totals,
  // line items, dates, vendor names). Aesthetic images have few or none.
  const fullText = response?.fullTextAnnotation?.text || '';
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  const hasDocumentText = wordCount >= RECEIPT_WORD_COUNT_MIN;

  // ── Signal B: receipt-adjacent labels ───────────────────────────────────
  const labels = response?.labelAnnotations || [];
  const hasReceiptLabel = labels.some(
    l => l.score >= RECEIPT_LABEL_THRESHOLD &&
         RECEIPT_LABELS.has((l.description || '').toLowerCase())
  );

  // ── Signal C: moment-adjacent labels ────────────────────────────
  // Check AFTER receipt to avoid misclassifying receipts as moments.
  // A photo of someone holding a receipt should still route to receipt.
  const hasMomentLabel = !hasDocumentText && !hasReceiptLabel && labels.some(
    l => l.score >= MOMENT_LABEL_THRESHOLD &&
         MOMENT_LABELS.has((l.description || '').toLowerCase())
  );

  let route;
  if (hasDocumentText || hasReceiptLabel) {
    route = 'receipt';
  } else if (hasMomentLabel) {
    route = 'moment';
  } else {
    route = 'muse';
  }

  console.log(`[imageOCRRouter] classified as ${route} (wordCount=${wordCount}, hasReceiptLabel=${hasReceiptLabel}, hasMomentLabel=${hasMomentLabel})`);

  return { route };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  classifyImage,
  // Exposed for unit-test reach-in only.
  RECEIPT_LABELS,
  RECEIPT_LABEL_THRESHOLD,
  RECEIPT_WORD_COUNT_MIN,
  MOMENT_LABELS,
  MOMENT_LABEL_THRESHOLD,
};
