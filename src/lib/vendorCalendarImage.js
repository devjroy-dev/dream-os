// ─────────────────────────────────────────────────────────────────────────────
// src/lib/vendorCalendarImage.js
// Vendor calendar bulk-import: image → Haiku Vision → structured event array.
//
// PURPOSE: when a vendor sends a calendar screenshot (Google/Apple/Outlook
// view, or a hand-written calendar photo, or a venue's schedule sheet),
// extract every event visible and return them as a structured array. The
// caller (index.js) stages these in pending_event_proposals and asks the
// vendor to confirm before any DB insert.
//
// CONTRACT:
//   extractCalendarFromImage({ image_url, caption, anthropic })
//     → { proposals: [{title, event_date, event_time?, kind, notes?}], rawResponse }
//
//   image_url:  Twilio media URL (requires Basic auth to fetch). We download
//               to a Buffer and send as base64 image content to Haiku — no
//               Cloudinary, no persistence. Vision call is one-shot.
//   caption:    optional vendor text alongside the image. Used as a hint.
//   anthropic:  initialised Anthropic SDK client.
//
//   On success: proposals array of 0 or more events. Empty array is valid —
//   means Haiku saw no parseable events.
//   On Haiku error or unparseable JSON: throws Error. Caller falls back to
//   the polite-refusal text.
//
// DATE INFERENCE:
//   Calendar screenshots usually show day + day-of-week, sometimes month
//   header, rarely the year. Haiku must:
//     - Use the current IST date (passed in prompt as today's date)
//     - If only day+month visible: use current year
//     - If the date is in the past for current year: roll to next year
//     - If literally no date is extractable: skip that event entirely
//
// MODEL LOCK: claude-haiku-4-5-20251001 (same model used elsewhere on vendor side).
// ─────────────────────────────────────────────────────────────────────────────

const { MODEL_HAIKU } = require('../agent/models');

const EVENT_KINDS = ['shoot', 'call', 'meeting', 'task', 'reminder', 'recce', 'other'];

// ── Media download (auth-by-host) ────────────────────────────────────────────
// TDW_05 MEDIA-SHIM (Shape A): this consumer now receives EITHER a Twilio media url
// (Basic auth) OR a re-hosted PUBLIC Supabase url (plain GET). Auth is picked by host:
// only a Twilio host gets Basic auth; everything else is a plain GET. The hard
// Twilio-env throw is dropped — Twilio creds are required ONLY when the url is actually
// a Twilio url. extractCalendarFromImage's signature is unchanged; only its downloader
// call is host-aware now.

function isTwilioHost(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === 'twilio.com' || h.endsWith('.twilio.com');
  } catch (_e) {
    return false;
  }
}

async function downloadMedia(url) {
  const headers = {};
  if (isTwilioHost(url)) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error('vendorCalendarImage: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set for a Twilio media url');
    }
    headers['Authorization'] = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
  }

  const res = await fetch(url, {
    method:   'GET',
    headers,
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`vendorCalendarImage: media fetch failed (${res.status})`);
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await res.arrayBuffer();
  const base64      = Buffer.from(arrayBuffer).toString('base64');
  return { base64, contentType };
}

// ── Prompt composer ──────────────────────────────────────────────────────────

function buildPrompt({ caption, istToday }) {
  return `You are extracting calendar events from an image a wedding-industry vendor sent via WhatsApp. The image is most likely a screenshot of their existing calendar (Google Calendar, Apple Calendar, Outlook, a handwritten planner, or a venue's printed schedule).

YOUR JOB: identify every distinct event visible in the image. Return them as a JSON array. Each event is an object with these fields:

{
  "title":      string,             // short event title, e.g. "Shoot for Priya", "Call with editor"
  "event_date": string,             // YYYY-MM-DD, required
  "event_time": string | null,      // HH:MM 24-hour, optional
  "kind":       string,             // one of: shoot, call, meeting, task, reminder, recce, other
  "notes":      string | null       // location, contact name, prep notes — anything else visible
}

KIND MAPPING:
- photoshoot, wedding shoot, pre-wedding, mehndi, sangeet → "shoot"
- phone call, sync, catchup → "call"
- meeting, client meeting → "meeting"
- recce, site visit, venue check → "recce"
- to-do, deliverable, reminder → "task" or "reminder"
- if unclear → "other"

DATE INFERENCE — CRITICAL:
- Today's date is ${istToday} (IST). Use this as your reference.
- If the image shows day + month but no year: assume current year (${istToday.slice(0,4)}).
- If that produces a date in the past: roll to the next year (${parseInt(istToday.slice(0,4)) + 1}).
- If only a day-of-week shown ("Mon", "Tue") with no number: SKIP that event — too ambiguous.
- If no date extractable at all: SKIP that event.
- If multiple events on the same day: list them as separate objects.

RULES:
- Only extract events you can SEE in the image. Do NOT invent or infer events.
- If the image contains no calendar content (e.g. it's a receipt, a portrait, a meme): return an empty array [].
- Do not include the year header, month header, or day-of-week label as standalone events.
- Recurring events: extract the next occurrence only.
- For time: if the image shows "10" with no AM/PM, infer from context (morning/evening) or omit.

${caption ? `VENDOR'S CAPTION (hint): "${caption}"\nUse this to bias toward what the vendor wants. Example: if they wrote "add november events", focus on November dates.` : ''}

OUTPUT FORMAT:
Return ONLY a JSON array. No prose, no markdown, no \`\`\` fences. The array can be empty if no events found.

Example output:
[
  {"title":"Shoot — Priya Sharma","event_date":"2026-12-14","event_time":"06:00","kind":"shoot","notes":"Lodhi Garden"},
  {"title":"Call with editor","event_date":"2026-11-28","event_time":"15:00","kind":"call","notes":null}
]`;
}

// ── Haiku Vision call ────────────────────────────────────────────────────────

async function extractCalendarFromImage({ image_url, caption, anthropic, istToday }) {
  if (!image_url)  throw new Error('vendorCalendarImage: image_url required');
  if (!anthropic)  throw new Error('vendorCalendarImage: anthropic client required');
  if (!istToday)   throw new Error('vendorCalendarImage: istToday required');

  const { base64, contentType } = await downloadMedia(image_url);

  // Default to image/jpeg if Twilio reported something Haiku can't handle
  const mediaType = contentType.toLowerCase().startsWith('image/') ? contentType : 'image/jpeg';

  const prompt = buildPrompt({ caption: caption || null, istToday });

  const response = await anthropic.messages.create({
    model:      MODEL_HAIKU,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text',  text: prompt },
      ],
    }],
  }, { timeout: 30000 });

  const raw = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();

  // Strip markdown fences if Haiku leaks them despite the prompt
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`vendorCalendarImage: Haiku returned non-JSON: "${raw.slice(0, 200)}"`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`vendorCalendarImage: Haiku response was not an array: "${raw.slice(0, 200)}"`);
  }

  // ── Validate + sanitise each proposal ────────────────────────────────────
  // Drop anything malformed rather than failing the whole batch.
  const proposals = [];
  for (const p of parsed) {
    if (!p || typeof p !== 'object') continue;
    if (typeof p.title !== 'string' || !p.title.trim()) continue;
    if (typeof p.event_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.event_date)) continue;
    const kind = typeof p.kind === 'string' && EVENT_KINDS.includes(p.kind) ? p.kind : 'other';
    const event_time = (typeof p.event_time === 'string' && /^\d{2}:\d{2}$/.test(p.event_time)) ? p.event_time : null;
    const notes = typeof p.notes === 'string' && p.notes.trim() ? p.notes.trim() : null;
    proposals.push({
      title: p.title.trim(),
      event_date: p.event_date,
      event_time,
      kind,
      notes,
    });
  }

  return { proposals, rawResponse: raw };
}

module.exports = { extractCalendarFromImage, downloadMedia, isTwilioHost };
