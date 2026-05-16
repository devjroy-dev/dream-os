const express  = require('express');
const router   = express.Router();

const { requireAuth, handleLogin } = require('./middleware');
const { loginPage }   = require('./views/login');
const { vendorsPage } = require('./views/vendors');
const { invitePage }  = require('./views/invite');
const { renderDetail: detailPage } = require('./views/detail');
const { couplesPage }       = require('./views/couples');
const { coupleInvitePage }  = require('./views/coupleInvite');
const { coupleDetailPage }  = require('./views/coupleDetail');

router.get('/login', (req, res) => {
  const error = req.query.error === '1';
  res.send(loginPage({ error }));
});

router.post('/login', express.urlencoded({ extended: true }), handleLogin);

router.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'dream_admin_session=; Max-Age=0; Path=/admin');
  res.redirect('/admin/login');
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, category, city, onboarding_state, created_at, user:users(name, phone)')
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

router.get('/invite', (req, res) => {
  res.send(invitePage());
});

router.post('/invite', express.urlencoded({ extended: true }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.send(invitePage({ error: 'Name and phone are required.' }));
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  const { error } = await supabase.rpc('invite_vendor', {
    p_phone: cleanPhone,
    p_name: name.trim(),
  });

  if (error) {
    return res.send(invitePage({ error: error.message }));
  }

  res.send(invitePage({ success: true, successName: name.trim() }));
});

router.get('/vendors/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id } = req.params;

  // Cost query: sum this month's AI spend across all vendor conversations
  const istNow      = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const monthStart  = new Date(istNow.getFullYear(), istNow.getMonth(), 1).toISOString();

  const [
    { data: vendor },
    { data: state },
    { data: notes },
    { data: leads },
    { data: costRows },
    { data: invoices },
    { data: expenses },
    { data: clients },
  ] = await Promise.all([
    supabase.from('vendors').select('*, user:users(name, phone)').eq('id', id).maybeSingle(),
    supabase.from('vendor_state').select('*').eq('vendor_id', id).maybeSingle(),
    supabase.from('notes').select('content, tags, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('leads').select('id, name, phone, wedding_date, wedding_city, budget_min, budget_max, state, source, referrer_name, created_at').eq('vendor_id', id).order('created_at', { ascending: false }),
    supabase.from('messages').select('cost_inr, model').eq('sent_by', 'agent').gte('created_at', monthStart),
    supabase.from('invoices').select('id, invoice_number, client_name, amount_total, amount_paid, amount_advance, state, due_date, pdf_url, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('expenses').select('id, amount, category, description, expense_date, client_name, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('clients').select('id, name, phone, email, source, referrer_name, created_at').eq('vendor_id', id).order('created_at', { ascending: false }).limit(50),
  ]);

  // Aggregate cost by model for this vendor's conversations
  // We filter by conversation_id via the convo we load below — but cost rows
  // are loaded here so the query runs in parallel. We'll filter after convo loads.

  if (!vendor) return res.redirect('/admin');

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
      .order('created_at', { ascending: false })
      .limit(100);
    // Fetch newest-first so recent messages are guaranteed in the panel
    // even when total exceeds 100. Reverse so display stays oldest-to-newest.
    messages = (msgs || []).slice().reverse();
  }

  // Load couple threads and their messages for Enquiries tab
  const { data: coupleThreads } = await supabase
    .from('conversations')
    .select('id, counterparty_phone, created_at, last_message_at')
    .eq('vendor_id', id)
    .eq('kind', 'couple_thread')
    .order('created_at', { ascending: false });

  const enquiries = [];
  for (const thread of (coupleThreads || [])) {
    const { data: threadMsgs } = await supabase
      .from('messages')
      .select('direction, body, created_at, sent_by')
      .eq('conversation_id', thread.id)
      .order('created_at', { ascending: true })
      .limit(50);
    enquiries.push({
      phone: thread.counterparty_phone,
      created_at: thread.created_at,
      messages: threadMsgs || [],
    });
  }

  // Calculate this month's AI cost for this vendor's conversations
  // convo is the vendor_self conversation — use its ID to filter cost rows
  const vendorConvoIds = new Set();
  if (convo) vendorConvoIds.add(convo.id);
  for (const t of (coupleThreads || [])) vendorConvoIds.add(t.id);

  // costRows are all agent messages since monthStart — filter to this vendor
  // Note: messages table doesn't have vendor_id directly, only conversation_id.
  // We loaded cost rows without conversation filter (runs in parallel before convo loads).
  // Re-query with conversation filter for accuracy.
  const { data: vendorCostRows } = await supabase
    .from('messages')
    .select('cost_inr, model')
    .eq('sent_by', 'agent')
    .gte('created_at', monthStart)
    .in('conversation_id', [...vendorConvoIds].length > 0 ? [...vendorConvoIds] : ['00000000-0000-0000-0000-000000000000']);

  const monthCostInr = (vendorCostRows || []).reduce((sum, r) => sum + (parseFloat(r.cost_inr) || 0), 0);
  const costByModel  = (vendorCostRows || []).reduce((acc, r) => {
    if (r.model) acc[r.model] = (acc[r.model] || 0) + (parseFloat(r.cost_inr) || 0);
    return acc;
  }, {});

  // Compute money totals for Money tab
  const invoiceList  = invoices  || [];
  const expenseList  = expenses  || [];
  const totalBilled  = invoiceList.reduce((s, i) => s + (i.amount_total || 0), 0);
  const totalPaid    = invoiceList.reduce((s, i) => s + (i.amount_paid  || 0), 0);
  const totalOutstanding = totalBilled - totalPaid;
  const totalExpenses    = expenseList.reduce((s, e) => s + (e.amount || 0), 0);

  res.send(detailPage({
    vendor,
    user: vendor.user,
    state,
    messages,
    notes: notes || [],
    leads: leads || [],
    enquiries,
    monthCostInr: monthCostInr.toFixed(2),
    costByModel,
    invoices:         invoiceList,
    expenses:         expenseList,
    totalBilled,
    totalPaid,
    totalOutstanding,
    totalExpenses,
    clients:          clients || [],
  }));
});

// ── COUPLES ──────────────────────────────────────────────────────────
// B1: bride product admin (couples list, invite, detail).

router.get('/couples', async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: couples } = await supabase
    .from('couples')
    .select('id, partner_name, wedding_date, wedding_city, onboarding_state, created_at, user:users(name, phone)')
    .order('created_at', { ascending: false });

  const list = (couples || []).map(c => ({
    id:               c.id,
    name:             c.user?.name || '—',
    phone:            c.user?.phone,
    partner_name:     c.partner_name,
    wedding_date:     c.wedding_date,
    wedding_city:     c.wedding_city,
    onboarding_state: c.onboarding_state,
    created_at:       c.created_at,
  }));

  const stats = {
    active:     list.filter(c => !c.onboarding_state || c.onboarding_state === 'complete').length,
    onboarding: list.filter(c => c.onboarding_state && !['complete','new'].includes(c.onboarding_state)).length,
    invited:    list.filter(c => c.onboarding_state === 'new').length,
  };

  res.send(couplesPage({ couples: list, stats }));
});

router.get('/couples/invite', (req, res) => {
  res.send(coupleInvitePage());
});

router.post('/couples/invite', express.urlencoded({ extended: true }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, phone, pronouns } = req.body;

  if (!name || !phone || !pronouns) {
    return res.send(coupleInvitePage({ error: 'Name, phone and pronouns are all required.' }));
  }

  if (!['she', 'he'].includes(pronouns)) {
    return res.send(coupleInvitePage({ error: 'Pronouns must be she or he.' }));
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  const { error } = await supabase.rpc('invite_couple', {
    p_phone:    cleanPhone,
    p_name:     name.trim(),
    p_pronouns: pronouns,
  });

  if (error) {
    return res.send(coupleInvitePage({ error: error.message }));
  }

  res.send(coupleInvitePage({ success: true, successName: name.trim() }));
});

router.get('/couples/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id } = req.params;

  const [
    { data: couple },
    { data: state },
    { data: notes },
    { data: events },
  ] = await Promise.all([
    supabase.from('couples').select('*, user:users(name, phone)').eq('id', id).maybeSingle(),
    supabase.from('couple_state').select('*').eq('couple_id', id).maybeSingle(),
    supabase.from('notes').select('content, tags, created_at').eq('couple_id', id).order('created_at', { ascending: false }).limit(30),
    supabase.from('events').select('title, event_date, event_time, kind, state').eq('couple_id', id).eq('state', 'upcoming').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', { ascending: true }).limit(20),
  ]);

  if (!couple) return res.redirect('/admin/couples');

  // Load the single couple_self conversation and its messages
  const { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('counterparty_user_id', couple.user_id)
    .eq('kind', 'couple_self')
    .maybeSingle();

  let messages = [];
  if (convo) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('direction, body, created_at, sent_by')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: false })
      .limit(100);
    messages = (msgs || []).slice().reverse();
  }

  res.send(coupleDetailPage({
    couple,
    user:     couple.user,
    state,
    notes:    notes || [],
    events:   events || [],
    messages,
  }));
});

module.exports = router;
