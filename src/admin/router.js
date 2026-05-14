// router.js — all /admin routes
// Mounted at /admin in src/index.js

const express  = require('express');
const router   = express.Router();

const { requireAuth, handleLogin } = require('./middleware');
const { loginPage }   = require('./views/login');
const { vendorsPage } = require('./views/vendors');
const { invitePage }  = require('./views/invite');
const { detailPage }  = require('./views/detail');

// ─── Login / logout ─────────────────────────────────────────────────

router.get('/login', (req, res) => {
  const error = req.query.error === '1';
  res.send(loginPage({ error }));
});

router.post('/login', express.urlencoded({ extended: true }), handleLogin);

router.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'dream_admin_session=; Max-Age=0; Path=/admin');
  res.redirect('/admin/login');
});

// ─── All routes below require auth ──────────────────────────────────

router.use(requireAuth);

// ─── Vendor list ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      id, business_name, category, city, onboarding_state, created_at,
      user:users(name, phone)
    `)
    .order('created_at', { ascending: false });

  const list = (vendors || []).map(v => ({
    id: v.id,
    name: v.user?.name || v.business_name,
    phone: v.user?.phone,
    category: v.category,
    city: v.city,
    onboarding_state: v.onboarding_state,
    created_at: v.created_at,
  }));

  const stats = {
    active:     list.filter(v => !v.onboarding_state || v.onboarding_state === 'complete').length,
    onboarding: list.filter(v => v.onboarding_state && !['complete','new'].includes(v.onboarding_state)).length,
    invited:    list.filter(v => v.onboarding_state === 'new').length,
  };

  res.send(vendorsPage({ vendors: list, stats }));
});

// ─── Invite form ────────────────────────────────────────────────────

router.get('/invite', (req, res) => {
  res.send(invitePage());
});

router.post('/invite', express.urlencoded({ extended: true }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.send(invitePage({ error: 'Name and phone are required.' }));
  }

  // Normalise phone — strip spaces, ensure + prefix
  const cleanPhone = phone.trim().replace(/\s+/g, '');

  const { error } = await supabase.rpc('invite_vendor', {
    p_phone: cleanPhone,
    p_name: name.trim(),
  });

  if (error) {
    return res.send(invitePage({ error: error.message }));
  }

  res.send(invitePage({ success: name.trim() }));
});

// ─── Vendor detail ──────────────────────────────────────────────────

router.get('/vendors/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id } = req.params;

  const [
    { data: vendor },
    { data: state },
    { data: notes },
  ] = await Promise.all([
    supabase.from('vendors').select('*, user:users(name, phone)').eq('id', id).maybeSingle(),
    supabase.from('vendor_state').select('*').eq('vendor_id', id).maybeSingle(),
    supabase.from('notes').select('content, tags, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (!vendor) return res.redirect('/admin');

  // Get conversation for this vendor
  const { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('vendor_id', id)
    .eq('kind', 'vendor_self')
    .maybeSingle();

  let messages = [];
  if (convo) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('direction, body, created_at, sent_by')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true })
      .limit(100);
    messages = msgs || [];
  }

  res.send(detailPage({
    vendor,
    user: vendor.user,
    state,
    messages,
    notes: notes || [],
  }));
});

module.exports = router;
