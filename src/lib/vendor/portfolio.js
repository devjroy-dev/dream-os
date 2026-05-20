// src/lib/vendor/portfolio.js
// Portfolio image business logic. Cloudinary signing + Supabase CRUD.
'use strict';

const crypto = require('crypto');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function ensureCloudinary() {
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
}

// Generate signed upload params for direct browser → Cloudinary upload.
function generateUploadParams(vendorId, filename) {
  ensureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const publicId  = `${filename.replace(/\.[^.]+$/, '')}-${crypto.randomBytes(4).toString('hex')}`;
  const folder    = `vendor_portfolio/${vendorId}`;

  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha256')
    .update(paramsToSign + API_SECRET)
    .digest('hex');

  return {
    upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    params: { api_key: API_KEY, timestamp, signature, folder, public_id: publicId },
  };
}

// Best-effort delete from Cloudinary.
async function deleteFromCloudinary(imageUrl) {
  try {
    ensureCloudinary();
    const match = imageUrl.match(/\/v\d+\/(.+)\.[a-z]+$/i);
    if (!match) return;
    const publicId  = match[1];
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto.createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest('hex');
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId, api_key: API_KEY, timestamp, signature }),
    });
  } catch { /* best effort */ }
}

// Register a newly uploaded image.
async function registerImage(supabase, vendorId, body) {
  const { image_url, caption, aesthetic_tags, is_hero, in_carousel } = body;
  if (!image_url) return { ok: false, error: 'image_url is required.' };

  if (is_hero) {
    await supabase.from('vendor_portfolio').update({ is_hero: false }).eq('vendor_id', vendorId);
  }

  const { data: image, error } = await supabase.from('vendor_portfolio').insert({
    vendor_id:     vendorId,
    image_url,
    caption:       caption || null,
    aesthetic_tags: aesthetic_tags || [],
    is_hero:       is_hero === true,
    in_carousel:   in_carousel !== false,
    approval_state: 'pending',
  }).select().single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, image };
}

// List portfolio images.
async function listImages(supabase, vendorId, state = 'all') {
  let q = supabase.from('vendor_portfolio')
    .select('id, image_url, caption, aesthetic_tags, is_hero, in_carousel, approval_state, rejection_reason, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (state !== 'all') q = q.eq('approval_state', state);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, images: data || [], total: (data || []).length };
}

// Update image metadata (caption, tags, hero, carousel). approval_state unchanged.
async function updateImage(supabase, vendorId, imageId, body) {
  const allowed = {};
  if (body.caption      !== undefined) allowed.caption       = body.caption;
  if (body.aesthetic_tags !== undefined) allowed.aesthetic_tags = body.aesthetic_tags;
  if (body.in_carousel  !== undefined) allowed.in_carousel   = body.in_carousel;
  if (Object.keys(allowed).length === 0) return { ok: false, error: 'No editable fields provided.' };

  const { data, error } = await supabase.from('vendor_portfolio')
    .update(allowed)
    .eq('id', imageId).eq('vendor_id', vendorId)
    .select().single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'Image not found.' };
  return { ok: true, image: data };
}

// Set as hero — atomically unsets all other hero images for this vendor.
async function setHeroImage(supabase, vendorId, imageId) {
  await supabase.from('vendor_portfolio').update({ is_hero: false }).eq('vendor_id', vendorId);
  const { data, error } = await supabase.from('vendor_portfolio')
    .update({ is_hero: true })
    .eq('id', imageId).eq('vendor_id', vendorId)
    .select().single();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'Image not found.' };
  return { ok: true, image: data };
}

// Delete image — removes from DB and best-effort from Cloudinary.
async function deleteImage(supabase, vendorId, imageId) {
  const { data: img } = await supabase.from('vendor_portfolio')
    .select('image_url').eq('id', imageId).eq('vendor_id', vendorId).maybeSingle();
  if (!img) return { ok: false, error: 'Image not found.' };

  const { error } = await supabase.from('vendor_portfolio')
    .delete().eq('id', imageId).eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };

  await deleteFromCloudinary(img.image_url);
  return { ok: true };
}

// Portfolio summary counts — used by discover request validation.
async function portfolioSummary(supabase, vendorId) {
  const { data } = await supabase.from('vendor_portfolio')
    .select('approval_state').eq('vendor_id', vendorId);
  const rows = data || [];
  return {
    total:    rows.length,
    approved: rows.filter(r => r.approval_state === 'approved').length,
    pending:  rows.filter(r => r.approval_state === 'pending').length,
    rejected: rows.filter(r => r.approval_state === 'rejected').length,
  };
}

module.exports = { generateUploadParams, registerImage, listImages, updateImage, setHeroImage, deleteImage, portfolioSummary };
