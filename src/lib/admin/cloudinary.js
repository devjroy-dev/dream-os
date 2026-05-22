// src/lib/admin/cloudinary.js
// Shared Cloudinary signing helpers for admin upload endpoints.
'use strict';

const crypto = require('crypto');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dccso5ljv';
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function ensureCloudinary() {
  if (!API_KEY || !API_SECRET) throw new Error('CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set.');
}

function generateUploadParams(folder, filename) {
  ensureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const publicId  = `${filename.replace(/\.[^.]+$/, '')}-${crypto.randomBytes(4).toString('hex')}`;
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha256')
    .update(paramsToSign + API_SECRET)
    .digest('hex');

  return {
    upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    params: { api_key: API_KEY, timestamp, signature, folder, public_id: publicId },
  };
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    ensureCloudinary();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = crypto.createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest('hex');
    await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ public_id: publicId, api_key: API_KEY, timestamp, signature }),
    });
  } catch { /* best effort */ }
}

module.exports = { generateUploadParams, deleteFromCloudinary };
