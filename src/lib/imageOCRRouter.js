// ─────────────────────────────────────────────────────────────────────────────
// src/lib/imageOCRRouter.js
// Bride image classifier: muse vs receipt.
//
// PURPOSE: Decide whether an inbound bride image is wedding inspiration
// (route to Muse mood board) or a receipt/invoice (route to receipt vault).
// Runs ONLY on the bride path. Circle members' images always go to Muse —
// the caller controls this via the runClassifier flag in imagePipeline.js.
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
const RECEIPT_LABELS = new Set([
  'receipt',
  'invoice',
  'bill',
  'financial transaction',
  'currency',
  'money',
  'payment',
  'document',
  'paper',
  'tax',
  'bank statement',
  'cheque',
  'check',
]);

const RECEIPT_LABEL_THRESHOLD  = 0.70;  // confidence >= 70% to count as receipt label
const RECEIPT_WORD_COUNT_MIN   = 8;     // document text word count to indicate a receipt

async function classifyImage({ image_url }) {
  if (!image_url || typeof image_url !== 'string') {
    throw new Error('imageOCRRouter: image_url is required');
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

  const route = (hasDocumentText || hasReceiptLabel) ? 'receipt' : 'muse';

  if (route === 'receipt') {
    console.log(`[imageOCRRouter] classified as receipt (wordCount=${wordCount}, hasReceiptLabel=${hasReceiptLabel})`);
  }

  return { route };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  classifyImage,
  // Exposed for unit-test reach-in only.
  RECEIPT_LABELS,
  RECEIPT_LABEL_THRESHOLD,
  RECEIPT_WORD_COUNT_MIN,
};
