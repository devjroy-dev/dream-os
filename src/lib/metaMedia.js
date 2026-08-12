// src/lib/metaMedia.js — TDW_05 MEDIA-SHIM. Lane-agnostic Meta media resolver.
//
// Meta inbound media arrives as a media-ID, not a URL. Resolving it is a two-step,
// Bearer-authorized dance:
//   1. GET https://graph.facebook.com/<ver>/<media-id>   (Bearer)  -> { url, mime_type, file_size }
//      (that url is SHORT-LIVED, ~5 min, and itself Bearer-authorized — a third party cannot fetch it)
//   2. GET <url>                                          (Bearer)  -> the bytes
// We then re-host the bytes to a PUBLIC Supabase bucket at an UNGUESSABLE path and hand back a
// STABLE public url. So every downstream consumer — the in-turn Vision download AND the two
// persisted audit columns (source_image_url, media_url) — sees a durable, plain-GET-fetchable url.
// This is Shape A (CE-ruled, eighth chair 2026-07-21): the shared vendor core's media gates and
// extractCalendarFromImage stay byte-identical; every Meta specific lives here.
//
// LANE-AGNOSTIC (BINDING): returns { stableUrl, bytes, mime }. All policy — mime allowlist, size
// cap, bucket name, object prefix, graph version, token — is passed IN by the calling adapter.
//
// ── B-09H · F-09.173 · THE BRIDE ADAPTER ARRIVED (2026-08-12) ────────────────────────────
// The sentence above ("the future bride adapter reuses this file untouched, supplying its own
// policy") is now spent: the bride lane's adapter is live at brideInbound.js/resolveBrideMedia.
// It reuses this resolver as designed. ONE param joined the contract to carry CE-31 ruling F1:
// `objectPrefix` — SHARE the `wa-media` bucket, separate the lanes by object path (`bride/…`),
// so a later per-lane bucket split is a mechanical move of prefixed objects rather than an
// archaeology dig. DEFAULT IS '' — the vendor call site passes nothing and its object paths are
// BYTE-IDENTICAL to before this change. That equality is a bench cell, not a claim.
//
// GUARDRAILS (caller-supplied, enforced here):
//   - allowMimes : exact-match allowlist. Non-allowed  -> throw (adapter -> text-only path).
//   - maxBytes   : size cap. Over -> throw. Checked against file_size (pre-download, when Meta
//                  reports it) AND actual byteLength (post-download, defense-in-depth).
//
// FAILURE SHAPE: throws a typed Error on ANY failure. The ADAPTER catches, logs a typed
//   [meta-media] line, and proceeds text-only. Never a dead turn.
//
// SECRETS: the token is env-read by the adapter and passed in here; it is NEVER logged.
'use strict';

const crypto = require('crypto');

const GRAPH_BASE = 'https://graph.facebook.com';
const DEFAULT_GRAPH_VERSION = 'v21.0'; // mirrors src/lib/metaCloud.js outbound

// mime -> file extension for the re-hosted object path (cosmetic; content-type is set on upload).
const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
};

async function resolveMetaMedia({
  mediaId,
  mime,                              // descriptor mime from the webhook (hint; graph GET is authoritative)
  token,
  graphVersion = DEFAULT_GRAPH_VERSION,
  supabase,
  bucket,
  objectPrefix = '',                 // adapter policy (F1): lane folder inside the shared bucket, e.g. 'bride/'
  allowMimes,                        // string[] exact mimes (adapter policy)
  maxBytes,                          // number (adapter policy)
  fetchImpl = fetch,                 // injectable for the bench; defaults to global fetch
}) {
  if (!mediaId)                                             throw new Error('metaMedia: mediaId required');
  if (!token)                                               throw new Error('metaMedia: token required');
  if (!supabase)                                            throw new Error('metaMedia: supabase required');
  if (!bucket)                                              throw new Error('metaMedia: bucket required');
  if (!Array.isArray(allowMimes) || allowMimes.length === 0) throw new Error('metaMedia: allowMimes required');
  if (!(maxBytes > 0))                                      throw new Error('metaMedia: maxBytes required');

  const auth = { Authorization: `Bearer ${token}` }; // token referenced, never printed

  // ── Step 1: media-ID -> short-lived url + metadata ──────────────────────────────────────
  const metaRes = await fetchImpl(`${GRAPH_BASE}/${graphVersion}/${encodeURIComponent(mediaId)}`, {
    method: 'GET', headers: auth,
  });
  if (!metaRes.ok) throw new Error(`metaMedia: graph media GET failed (${metaRes.status})`);
  const metaJson = await metaRes.json();
  const shortUrl = metaJson && metaJson.url;
  if (!shortUrl) throw new Error('metaMedia: graph media GET returned no url');

  // mime allowlist — the graph response's mime_type is authoritative; descriptor mime is fallback
  const resolvedMime = String(metaJson.mime_type || mime || '').split(';')[0].trim().toLowerCase();
  if (!allowMimes.includes(resolvedMime)) {
    throw new Error(`metaMedia: mime not allowed (${resolvedMime || 'unknown'})`);
  }

  // size cap — pre-download check when Meta reports file_size
  const declaredSize = Number(metaJson.file_size || 0);
  if (declaredSize && declaredSize > maxBytes) {
    throw new Error(`metaMedia: over size cap (declared ${declaredSize} > ${maxBytes})`);
  }

  // ── Step 2: download the bytes (Bearer) ─────────────────────────────────────────────────
  const binRes = await fetchImpl(shortUrl, { method: 'GET', headers: auth, redirect: 'follow' });
  if (!binRes.ok) throw new Error(`metaMedia: media download failed (${binRes.status})`);
  const bytes = Buffer.from(await binRes.arrayBuffer());

  // size cap — post-download check (defense-in-depth; covers absent file_size)
  if (bytes.length > maxBytes) {
    throw new Error(`metaMedia: over size cap (downloaded ${bytes.length} > ${maxBytes})`);
  }

  // ── Re-host to the PUBLIC bucket at an UNGUESSABLE path ──────────────────────────────────
  const ext = EXT_BY_MIME[resolvedMime] || 'bin';
  // The UNGUESSABLE part is unchanged; the prefix only files the object under a lane folder.
  // With objectPrefix '' this expression is byte-identical to the pre-F-09.173 form.
  const objectPath = `${objectPrefix}${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(objectPath, bytes, { contentType: resolvedMime, upsert: false });
  if (upErr) throw new Error(`metaMedia: bucket upload failed (${upErr.message})`);

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const stableUrl = pub && pub.publicUrl;
  if (!stableUrl) throw new Error('metaMedia: getPublicUrl returned nothing');

  return { stableUrl, bytes, mime: resolvedMime };
}

module.exports = { resolveMetaMedia };
