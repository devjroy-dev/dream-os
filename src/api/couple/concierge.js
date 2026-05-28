// src/api/couple/concierge.js
// POST /api/v2/couple/concierge/request
// Bride taps "Ask a Personal Concierge" in Meridian.
// Logs to admin_activity_log + sends WA notification to admin.
// No gate — all brides. Later tier-gate via couples.tier check.

'use strict';

const express          = require('express');
const router           = express.Router();
const asyncHandler     = require('../../lib/asyncHandler');
const { sendWhatsApp } = require('../../lib/whatsapp');

const ADMIN_PHONE = process.env.ADMIN_PHONE || '+919888294440';

router.post('/request', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id: userId, couple_id } = req.coupleUser;

  // Load bride context
  const { data: couple } = await supabase
    .from('couples')
    .select('wedding_date, wedding_city, users!couples_user_id_fkey(name, phone)')
    .eq('id', couple_id)
    .maybeSingle();

  const brideName  = couple?.users?.name || 'A bride';
  const bridePhone = couple?.users?.phone || null;
  const weddingDate = couple?.wedding_date
    ? new Date(couple.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'date TBD';
  const city = couple?.wedding_city || '';

  // Fetch last Meridian message for context
  const { data: lastMsg } = await supabase
    .from('conversations')
    .select('id')
    .eq('couple_id', couple_id)
    .eq('kind', 'meridian_self')
    .maybeSingle();

  let lastMeridianText = null;
  if (lastMsg?.id) {
    const { data: msg } = await supabase
      .from('messages')
      .select('body')
      .eq('conversation_id', lastMsg.id)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    lastMeridianText = msg?.body || null;
  }

  // Log to admin_activity_log
  await supabase.from('admin_activity_log').insert({
    admin_email: 'system',
    action:      'concierge_request',
    target_type: 'couple',
    target_id:   couple_id,
    metadata: {
      bride_name:   brideName,
      bride_phone:  bridePhone,
      wedding_date: weddingDate,
      city,
      last_meridian_message: lastMeridianText,
      requested_at: new Date().toISOString(),
    },
  }).then(()=>{}).catch(()=>{});

  // WA notification to admin
  const waBody = [
    `✦ Meridian Concierge Request`,
    ``,
    `Bride: ${brideName}`,
    bridePhone ? `Contact: ${bridePhone}` : '',
    `Wedding: ${weddingDate}${city ? ` · ${city}` : ''}`,
    lastMeridianText ? `\nLast message: "${lastMeridianText.slice(0, 120)}"` : '',
    ``,
    `— TDW Admin`,
  ].filter(l => l !== null).join('\n').trim();

  try {
    await sendWhatsApp(ADMIN_PHONE, waBody);
  } catch (err) {
    console.error('[concierge/request] WA send failed:', err.message);
    // Non-fatal — log succeeded, bride gets confirmation regardless
  }

  return res.json({ ok: true, message: 'Our concierge will reach you at the earliest.' });
}));

// GET /api/v2/couple/concierge/requests — admin only
router.get('/requests', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const adminPw  = req.headers['x-admin-password'];
  if (adminPw !== (process.env.ADMIN_PASSWORD || 'Liza@2551354')) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*')
    .eq('action', 'concierge_request')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, requests: data || [] });
}));

module.exports = router;
