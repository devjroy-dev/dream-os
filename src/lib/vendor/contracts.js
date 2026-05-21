// src/lib/vendor/contracts.js
// Shared write logic for vendor contracts.
'use strict';

const BUCKET = 'contracts';

// ── getUploadUrl ──────────────────────────────────────────────────────────
// Two-phase upload: create draft row, return signed upload URL.
async function getUploadUrl(supabase, vendorId, { title, clientId, leadId, invoiceId, filename }) {
  if (!title || !title.trim()) return { ok: false, error: 'title is required.' };
  if (!filename || !filename.trim()) return { ok: false, error: 'filename is required.' };

  // Create draft row first to get a contract_id
  const { data: row, error: rowErr } = await supabase.from('contracts').insert({
    vendor_id:  vendorId,
    title:      title.trim(),
    client_id:  clientId  || null,
    lead_id:    leadId    || null,
    invoice_id: invoiceId || null,
    state:      'draft',
  }).select().single();
  if (rowErr) return { ok: false, error: rowErr.message };

  const storagePath = `${vendorId}/${row.id}.pdf`;

  const { data: urlData, error: urlErr } = await supabase.storage
    .from(BUCKET).createSignedUploadUrl(storagePath);
  if (urlErr) {
    // Clean up the draft row
    await supabase.from('contracts').delete().eq('id', row.id);
    return { ok: false, error: 'Could not generate upload URL: ' + urlErr.message };
  }

  // Store path so finalize knows where to look
  await supabase.from('contracts').update({ storage_path: storagePath }).eq('id', row.id);

  return {
    ok:          true,
    contract_id: row.id,
    upload_url:  urlData.signedUrl,
    token:       urlData.token,
    expires_in:  300,
  };
}

// ── finalizeContract ──────────────────────────────────────────────────────
async function finalizeContract(supabase, vendorId, contractId) {
  const { data: row, error: rowErr } = await supabase.from('contracts')
    .select('*').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (rowErr) return { ok: false, error: rowErr.message };
  if (!row) return { ok: false, error: 'Contract not found.' };
  if (!row.storage_path) return { ok: false, error: 'No upload path recorded.' };

  // Try to get file metadata from storage
  const pathParts = row.storage_path.split('/');
  const folder    = pathParts.slice(0, -1).join('/');
  const fname     = pathParts[pathParts.length - 1];

  let fileSize = null;
  try {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder);
    const match = (files || []).find(f => f.name === fname);
    if (match) fileSize = match.metadata?.size || null;
  } catch (_) {}

  const { data, error } = await supabase.from('contracts').update({
    file_size:  fileSize,
    state:      'draft',
    updated_at: new Date().toISOString(),
  }).eq('id', contractId).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── getDownloadUrl ────────────────────────────────────────────────────────
async function getDownloadUrl(supabase, vendorId, contractId) {
  const { data: row } = await supabase.from('contracts')
    .select('storage_path').eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (!row || !row.storage_path) return { ok: false, error: 'Contract or file not found.' };

  const { data, error } = await supabase.storage
    .from(BUCKET).createSignedUrl(row.storage_path, 3600);
  if (error) return { ok: false, error: error.message };
  return { ok: true, download_url: data.signedUrl, expires_in: 3600 };
}

// ── attachFromUrl ─────────────────────────────────────────────────────────
// WhatsApp path: download file from external URL, upload to storage, create row.
async function attachFromUrl(supabase, vendorId, { title, clientId, fileUrl }) {
  const https = require('https');
  const http  = require('http');

  const contractId  = require('crypto').randomUUID();
  const storagePath = `${vendorId}/${contractId}.pdf`;

  // Download file
  const buffer = await new Promise((resolve, reject) => {
    const proto = fileUrl.startsWith('https') ? https : http;
    proto.get(fileUrl, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });

  // Upload to storage
  const { error: upErr } = await supabase.storage
    .from(BUCKET).upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false });
  if (upErr) return { ok: false, error: 'Storage upload failed: ' + upErr.message };

  // Create row
  const { data, error } = await supabase.from('contracts').insert({
    id:           contractId,
    vendor_id:    vendorId,
    client_id:    clientId || null,
    title:        title || 'Contract',
    storage_path: storagePath,
    file_size:    buffer.length,
    state:        'draft',
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contract: data };
}

// ── cleanupDraftContracts ─────────────────────────────────────────────────
// Cron helper: delete draft contracts older than 24h with no storage_path,
// or where the file never landed.
async function cleanupDraftContracts(supabase) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: stale } = await supabase.from('contracts')
    .select('id, storage_path').eq('state', 'draft').lt('created_at', cutoff);

  let cleaned = 0;
  for (const row of (stale || [])) {
    if (row.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }
    await supabase.from('contracts').delete().eq('id', row.id);
    cleaned++;
  }
  return cleaned;
}

module.exports = { getUploadUrl, finalizeContract, getDownloadUrl, attachFromUrl, cleanupDraftContracts };
