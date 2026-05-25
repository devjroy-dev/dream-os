// ─────────────────────────────────────────────────────────────────────────────
// src/lib/imagePipeline.js
// Muse image pipeline: source URL -> Cloudinary -> Vision -> aesthetic tags.
//
// PURPOSE: Single helper called by the Muse tools (B2 Step 4) to turn an
// inbound image or link into a fully-analyzed muse_saves row payload.
//
// Three source types:
//   - Twilio media URL  -> auth fetch via Basic auth, upload to Cloudinary
//   - Pinterest / IG / generic page URL -> fetch HTML, extract og:image,
//                                          mirror to Cloudinary
//   - Direct image URL -> upload to Cloudinary by URL
//
// CONTRACT:
//   processImageForMuse({ sourceUrl, couple_id, anthropic })
//   returns { source_type, image_url, source_url, vision_raw, aesthetic_tags }
//
//   The caller (Muse tool) inserts the row in muse_saves with these fields,
//   plus saved_by_user_id, saved_by_role, save_number, caption from its own
//   context. This function is intentionally agnostic of who is saving.
//
// FAILURE MODES:
//   Throws Error with descriptive .message for: download failure, Cloudinary
//   upload failure, Vision API failure, Haiku tagging failure with no valid
//   tags. The caller wraps these and surfaces a user-friendly reply.
//
// COST: ~Rs 0.45 per save (Vision Rs 0.25, Haiku Rs 0.20). Cloudinary free
// tier covers our scale.
//
// MODEL LOCK: claude-haiku-4-5-20251001 for tagging (via models.js).
// ─────────────────────────────────────────────────────────────────────────────

const cloudinary = require('cloudinary').v2;
const { MODEL_HAIKU, calculateCost } = require('../agent/models');
const {
  BRIDE_AESTHETIC_TAGS,
  composeAestheticPrompt,
  isValidTag,
} = require('../agent/brideAesthetics');
const { classifyImage } = require('./imageOCRRouter');

// ── Cloudinary config (uses env vars on the dream-wedding service) ───────────
// Reads CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.
// Configured lazily on first call so the module loads even if env is missing
// (e.g. local dev without Cloudinary). The actual upload will fail loudly.

let _cloudinaryConfigured = false;
function ensureCloudinaryConfigured() {
  if (_cloudinaryConfigured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  _cloudinaryConfigured = true;
}

// ── Source-type detection ────────────────────────────────────────────────────
// Decides which path to route through. Order matters — Twilio first because
// its URL is highly specific; Pinterest/IG next; everything else falls into
// 'direct' (caller is responsible for sanity-checking).

function detectSourceType(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('imagePipeline: sourceUrl is required');
  }
  if (/^https:\/\/api\.twilio\.com\//i.test(url)) return 'twilio';
  if (/^https?:\/\/(www\.)?(pinterest|pin)\./i.test(url)) return 'page';
  if (/^https?:\/\/(www\.)?(instagram|instagr)\./i.test(url)) return 'page';
  return 'direct';
}

// ── Twilio media download (Basic auth) ───────────────────────────────────────
// Twilio media URLs require Account SID + Auth Token as Basic auth.
// Returns a Buffer of the image bytes plus the detected MIME type.

async function downloadFromTwilio(url) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('imagePipeline: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set');
  }

  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  const res = await fetch(url, {
    method:  'GET',
    headers: { 'Authorization': authHeader },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`imagePipeline: Twilio media fetch failed (${res.status})`);
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

// ── Page scrape -> og:image extraction ───────────────────────────────────────
// Pinterest, Instagram, and most modern web pages expose a representative
// image via the OpenGraph protocol: <meta property="og:image" content="...">.
// We grab that, return the URL. Cloudinary then mirrors it (upload-by-URL).

async function extractOgImage(pageUrl) {
  const res = await fetch(pageUrl, {
    method:  'GET',
    redirect: 'follow',
    // A realistic UA helps with sites that gate scrapers (Pinterest does).
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DreamOSMuse/1.0; +https://thedreamwedding.in)',
      'Accept':     'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`imagePipeline: page fetch failed for ${pageUrl} (${res.status})`);
  }

  const html = await res.text();

  // og:image (and the Twitter equivalent as fallback). Order: og:image first.
  // We accept either attribute order: property="og:image" content="..."
  // or content="..." property="og:image".
  const ogMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

  if (!ogMatch) {
    throw new Error(`imagePipeline: no og:image found at ${pageUrl}`);
  }

  // Decode HTML entities the simple way (covers &amp; and &#x...;)
  const raw = ogMatch[1]
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  return raw;
}

// ── Cloudinary upload helpers ────────────────────────────────────────────────
// Buffer upload uses upload_stream. URL upload uses upload() with the URL.
// Both place files under: dream-os/muse/<couple_id>/

function uploadBufferToCloudinary(buffer, couple_id, contentType = null) {
  ensureCloudinaryConfigured();
  const folder = `dream-os/muse/${couple_id}`;
  const options = {
    folder,
    resource_type: 'image',
    unique_filename: true,
    overwrite: false,
  };
  if (contentType && typeof contentType === 'string' && contentType.toLowerCase().startsWith('image/')) {
    options.format = contentType.slice(6).toLowerCase();  // e.g. image/jpeg -> jpeg
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) return reject(new Error(`imagePipeline: Cloudinary upload failed: ${err.message}`));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function uploadUrlToCloudinary(url, couple_id) {
  ensureCloudinaryConfigured();
  const folder = `dream-os/muse/${couple_id}`;
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder,
      resource_type: 'image',
      unique_filename: true,
      overwrite: false,
    });
    return result;
  } catch (err) {
    throw new Error(`imagePipeline: Cloudinary URL upload failed: ${err.message}`);
  }
}

// ── Google Vision API call (plain REST, API key auth) ────────────────────────
// Single POST to /v1/images:annotate with two features: LABEL_DETECTION and
// IMAGE_PROPERTIES. Vision fetches the image itself given a URL — no need
// for us to ship the image bytes.
//
// Returns { labels, colors, raw } where labels is the annotations array and
// colors is the dominantColors array. raw is the full response for storage.

async function analyzeWithVision(imageUrl) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('imagePipeline: GOOGLE_VISION_API_KEY not set');
  }

  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
  const body = {
    requests: [
      {
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 15 },
          { type: 'IMAGE_PROPERTIES' },
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
      throw new Error('imagePipeline: Vision API request timed out after 10s');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`imagePipeline: Vision API failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const response = data?.responses?.[0];

  if (response?.error) {
    throw new Error(`imagePipeline: Vision returned error: ${response.error.message || 'unknown'}`);
  }

  const labels = response?.labelAnnotations || [];
  const colors = response?.imagePropertiesAnnotation?.dominantColors?.colors || [];

  return { labels, colors, raw: response };
}

// ── Aesthetic tagging via Haiku ──────────────────────────────────────────────
// Composes the prompt from brideAesthetics.composeAestheticPrompt(), calls
// Haiku, parses the JSON array, filters to the locked taxonomy.

async function deriveAestheticTags(visionLabels, visionColors, anthropic) {
  if (!anthropic) {
    throw new Error('imagePipeline: anthropic client required for tagging');
  }

  const prompt = composeAestheticPrompt(visionLabels, visionColors);

  const response = await anthropic.messages.create({
    model:      MODEL_HAIKU,
    max_tokens: 80,
    messages:   [{ role: 'user', content: prompt }],
  }, { timeout: 8000 });

  const raw = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();

  // Pull the JSON array out — Haiku sometimes wraps in ```json fences
  // despite the prompt's instructions. Strip those if present.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`imagePipeline: Haiku returned non-JSON for tagging: "${raw.slice(0, 100)}"`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`imagePipeline: Haiku tags response was not an array: "${raw.slice(0, 100)}"`);
  }

  // Filter to locked taxonomy, dedupe, cap at 3.
  const filtered = [];
  for (const tag of parsed) {
    if (isValidTag(tag) && !filtered.includes(tag)) {
      filtered.push(tag);
      if (filtered.length >= 3) break;
    }
  }

  if (filtered.length === 0) {
    throw new Error(`imagePipeline: Haiku returned no valid tags. raw: "${raw.slice(0, 100)}"`);
  }

  // Cost tracking — informational only. The caller decides whether to log.
  const usage = response.usage || {};
  const cost  = calculateCost(MODEL_HAIKU, usage.input_tokens || 0, usage.output_tokens || 0);

  return { tags: filtered, taggingCost: cost, taggingRaw: raw };
}

// ── Main entry point ─────────────────────────────────────────────────────────
// processImageForMuse({ sourceUrl, couple_id, anthropic, runClassifier })
//
// sourceUrl     : string  — Twilio media URL, Pinterest/IG URL, or direct image URL
// couple_id     : string  — used for Cloudinary folder scoping (no DB writes here)
// anthropic     : object  — initialised Anthropic SDK client passed by caller
// runClassifier : boolean — when true, classify the image AFTER Cloudinary upload
//                           but BEFORE Vision/Haiku tagging. If classifier returns
//                           'receipt', return early with source_type='receipt' and
//                           skip the rest of the Muse pipeline. The caller
//                           branches on source_type to route the receipt flow.
//                           Defaults to false (Circle members + legacy callers
//                           get unchanged Muse-only behaviour).
//
// Returns (Muse path — runClassifier=false OR classifier returned 'muse'):
//   {
//     source_type:     'image' | 'link',
//     image_url:       string,        // Cloudinary URL (permanent)
//     source_url:      string | null, // original URL — null for 'image', set for 'link'
//     vision_raw:      object,        // full Vision response for re-analysis later
//     aesthetic_tags:  string[],      // 1-3 values from BRIDE_AESTHETIC_TAGS
//     tagging_cost:    { cost_usd, cost_inr } | null,  // Haiku tagging call cost
//     classifier_cost: null,  // Google Vision cost not tracked per-call (free tier)
//   }
//
// Returns (Receipt path — runClassifier=true AND classifier returned 'receipt'):
//   {
//     source_type:     'receipt',
//     image_url:       string,        // Cloudinary URL — image is already uploaded
//     source_url:      string | null, // original URL — null for Twilio, set for link
//     vision_raw:      null,          // skipped — receipts don't need aesthetic vision
//     aesthetic_tags:  [],            // empty — receipts don't get aesthetic tags
//     tagging_cost:    null,          // skipped
//     classifier_cost: null,          // Google Vision cost not tracked per-call
//   }
//
// CLASSIFIER ARCHITECTURE: lives inline here (after Cloudinary upload, before
// Vision/Haiku tagging) so that receipts short-circuit the expensive Muse
// pipeline. Saves ~Rs 0.45 per receipt (Vision + Haiku tagging skipped) at the
// cost of ~Rs 0.10 per bride image (classifier call). Net: cheaper on receipts,
// slightly more expensive on Muse. Worth it because Muse contamination is the
// primary UX cost we're solving.

async function processImageForMuse({ sourceUrl, bufferSource, couple_id, anthropic, runClassifier = false }) {
  // Either sourceUrl OR bufferSource must be provided.
  // bufferSource is used for direct uploads from the bride PWA (FormData → base64 → Buffer).
  if (!sourceUrl && !bufferSource) {
    throw new Error('imagePipeline: sourceUrl or bufferSource is required');
  }
  if (!couple_id) throw new Error('imagePipeline: couple_id is required');
  if (!anthropic) throw new Error('imagePipeline: anthropic client is required');

  // sourceType is only meaningful when we have a URL
  const sourceType = sourceUrl ? detectSourceType(sourceUrl) : null;

  let cloudinaryResult;
  let resolvedSourceType;
  let resolvedSourceUrl;

  if (bufferSource) {
    // Direct upload — bride picked a file from her phone.
    // bufferSource = { buffer, contentType }
    if (!Buffer.isBuffer(bufferSource.buffer)) {
      throw new Error('imagePipeline: bufferSource.buffer must be a Buffer');
    }
    cloudinaryResult = await uploadBufferToCloudinary(
      bufferSource.buffer,
      couple_id,
      bufferSource.contentType || 'image/jpeg',
    );
    resolvedSourceType = 'image';
    resolvedSourceUrl  = null;
  } else if (sourceType === 'twilio') {
    // WhatsApp image forward — direct user upload
    const { buffer, contentType } = await downloadFromTwilio(sourceUrl);
    cloudinaryResult = await uploadBufferToCloudinary(buffer, couple_id, contentType);
    resolvedSourceType = 'image';
    resolvedSourceUrl  = null;
  } else if (sourceType === 'page') {
    // Pinterest / Instagram page — mirror og:image
    const ogImageUrl = await extractOgImage(sourceUrl);
    cloudinaryResult = await uploadUrlToCloudinary(ogImageUrl, couple_id);
    resolvedSourceType = 'link';
    resolvedSourceUrl  = sourceUrl;
  } else {
    // Direct image URL — Cloudinary can fetch it itself
    cloudinaryResult = await uploadUrlToCloudinary(sourceUrl, couple_id);
    resolvedSourceType = 'image';
    resolvedSourceUrl  = null;
  }

  const image_url = cloudinaryResult.secure_url;
  if (!image_url) {
    throw new Error('imagePipeline: Cloudinary upload returned no secure_url');
  }

  // ── Classifier (bride path only) ────────────────────────────────────────
  // Runs ONLY when runClassifier=true. Circle members and link forwards skip
  // this — Circle by design (Muse-only access), link forwards because
  // Pinterest/IG pages are aesthetic by nature and receipts are never shared
  // via those platforms. Twilio image forwards from the bride are the one
  // class that could be either muse or receipt.
  //
  // Defaulting to muse on failure (handled inside classifyImage) keeps the
  // existing flow working when the classifier breaks. False muse routes are
  // recoverable via natural language ("this was a receipt"). False receipt
  // routes contaminate her mood board.
  let classifier_cost = null;
  if (runClassifier && resolvedSourceType === 'image') {
    const result = await classifyImage({ image_url });
    // Google Vision cost tracking: ~$1.50 per 1000 calls, free tier covers
    // cohort scale. Not tracked per-call like Haiku tokens.

    if (result.route === 'receipt') {
      // Early exit — caller branches to receipt flow. Image is in Cloudinary,
      // metadata captured by caller from there.
      return {
        source_type:     'receipt',
        image_url,
        source_url:      resolvedSourceUrl,
        vision_raw:      null,
        aesthetic_tags:  [],
        tagging_cost:    null,
        classifier_cost,
      };
    }
    // route === 'muse' → fall through to existing Vision/Haiku tagging
  }

  // Vision analysis on the Cloudinary URL — guaranteed public-fetchable
  const { labels, colors, raw: vision_raw } = await analyzeWithVision(image_url);

  // Aesthetic tagging via Haiku
  const { tags, taggingCost } = await deriveAestheticTags(labels, colors, anthropic);

  return {
    source_type:    resolvedSourceType,
    image_url,
    source_url:     resolvedSourceUrl,
    vision_raw,
    aesthetic_tags: tags,
    tagging_cost:   taggingCost,
    classifier_cost,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  processImageForMuse,
  // Exposed for unit-test reach-in only; production callers use processImageForMuse.
  detectSourceType,
  extractOgImage,
};
