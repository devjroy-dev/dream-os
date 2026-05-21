#!/usr/bin/env python3
"""
Block 6 backend deploy script.
Drop in dream-os root. Run: python3 build_block6_backend.py
Creates:
  src/api/middleware/requirePrestige.js
  src/api/vendor/studio/briefing.js
  src/api/vendor/studio/team.js
  src/api/vendor/studio/tasks.js
  src/api/vendor/studio/messages.js
  src/api/vendor/studio/payments.js
Patches:
  src/api/vendor/core.js          — mount studio router
  src/agent/pwaTools.js           — 4 Prestige tools
  src/agent/pwaEngine.js          — 4 tool case handlers
"""
import os, sys

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  WROTE  {path}")

def patch(path, old, new, label):
    with open(path, 'r') as f:
        src = f.read()
    if old not in src:
        print(f"  ERROR  {path}: anchor not found for [{label}]")
        sys.exit(1)
    with open(path, 'w') as f:
        f.write(src.replace(old, new, 1))
    print(f"  PATCHED {path} [{label}]")

print("\n=== Block 6: Studio Suite backend ===\n")

# ─────────────────────────────────────────────────────────────────────────────
# 1. requirePrestige middleware
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/middleware/requirePrestige.js', """\
// src/api/middleware/requirePrestige.js
// Tier gate for Studio Suite endpoints.
// Must run AFTER requireAuth + resolveVendor().
// Returns 403 TIER_PRESTIGE_REQUIRED for non-Prestige vendors.
'use strict';

function requirePrestige(req, res, next) {
  const vendor = req.vendor;
  if (!vendor) {
    return res.status(401).json({ ok: false, error: 'Unauthorised.' });
  }
  if (vendor.tier !== 'prestige') {
    return res.status(403).json({
      ok:    false,
      error: 'Studio Suite is for Prestige vendors only. Contact Swati for an invite.',
      code:  'TIER_PRESTIGE_REQUIRED',
    });
  }
  next();
}

module.exports = requirePrestige;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 2. briefing.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/studio/briefing.js', """\
// src/api/vendor/studio/briefing.js
// GET /api/v2/vendor/studio/briefing
// Prestige-only daily aggregation: today's events (with team assignments),
// open/overdue tasks, pinned messages, this-week calendar, team owed totals.
'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../../middleware/requireAuth');
const resolveVendor  = require('../../middleware/resolveVendor');
const requirePrestige = require('../../middleware/requirePrestige');
const asyncHandler   = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

function istTodayISO() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

router.get(
  '/',
  requireAuth,
  resolveVendor(),
  requirePrestige,
  asyncHandler(async (req, res) => {
    const supabase  = req.app.locals.supabase;
    const vendorId  = req.vendor.id;
    const today     = istTodayISO();
    const weekEnd   = new Date(Date.now() + 5.5 * 60 * 60 * 1000 + 7 * 86400000)
                        .toISOString().slice(0, 10);

    // ── Today's events ────────────────────────────────────────────────────
    const { data: todayEvents, error: e1 } = await supabase
      .from('events')
      .select('id, title, event_time, state')
      .eq('vendor_id', vendorId)
      .eq('event_date', today)
      .neq('state', 'cancelled')
      .order('event_time', { ascending: true, nullsFirst: true });
    if (e1) return errRes(res, 500, e1.message);

    // Attach team assignments to today's events
    const todayIds = (todayEvents || []).map(e => e.id);
    let teamRows = [];
    if (todayIds.length > 0) {
      const { data: tr } = await supabase
        .from('team_tasks')
        .select('linked_event_id, team_members(id, name, role)')
        .in('linked_event_id', todayIds)
        .neq('state', 'cancelled')
        .is('deleted_at', null);
      teamRows = tr || [];
    }

    const todayEventsWithTeam = (todayEvents || []).map(ev => ({
      ...ev,
      team_assigned: teamRows
        .filter(t => t.linked_event_id === ev.id && t.team_members)
        .map(t => ({
          id:   t.team_members.id,
          name: t.team_members.role
            ? `${t.team_members.name} (${t.team_members.role})`
            : t.team_members.name,
        })),
    }));

    // ── Open + overdue tasks ──────────────────────────────────────────────
    const { data: openTasks, error: e2 } = await supabase
      .from('team_tasks')
      .select('id, title, priority, due_date, state, assigned_to_member_id, team_members(name)')
      .eq('vendor_id', vendorId)
      .in('state', ['open', 'in_progress'])
      .is('deleted_at', null)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (e2) return errRes(res, 500, e2.message);

    const overdueTasks = (openTasks || []).filter(t => t.due_date && t.due_date < today);

    // ── Pinned messages ───────────────────────────────────────────────────
    const { data: pinned, error: e3 } = await supabase
      .from('team_messages')
      .select('id, body, linked_event_id, created_at')
      .eq('vendor_id', vendorId)
      .eq('pinned', true)
      .order('created_at', { ascending: false });
    if (e3) return errRes(res, 500, e3.message);

    // ── This week's events ────────────────────────────────────────────────
    const { data: weekEvents, error: e4 } = await supabase
      .from('events')
      .select('id, title, event_date, event_time, state')
      .eq('vendor_id', vendorId)
      .gte('event_date', today)
      .lte('event_date', weekEnd)
      .neq('state', 'cancelled')
      .order('event_date', { ascending: true });
    if (e4) return errRes(res, 500, e4.message);

    // ── Team owed totals ──────────────────────────────────────────────────
    const { data: owedRows, error: e5 } = await supabase
      .from('team_payments')
      .select('team_member_id, amount_inr, team_members(name)')
      .eq('vendor_id', vendorId)
      .eq('state', 'owed');
    if (e5) return errRes(res, 500, e5.message);

    const owedMap = {};
    let totalOwed = 0;
    for (const row of (owedRows || [])) {
      totalOwed += row.amount_inr;
      if (!owedMap[row.team_member_id]) {
        owedMap[row.team_member_id] = {
          team_member_id: row.team_member_id,
          name:           row.team_members?.name || '',
          owed_inr:       0,
        };
      }
      owedMap[row.team_member_id].owed_inr += row.amount_inr;
    }

    return okRes(res, {
      today,
      today_events:         todayEventsWithTeam,
      open_tasks:           openTasks     || [],
      overdue_tasks:        overdueTasks,
      pinned_messages:      pinned        || [],
      this_week_calendar:   weekEvents    || [],
      team_owed_total_inr:  totalOwed,
      team_owed_per_member: Object.values(owedMap),
    });
  })
);

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 3. team.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/studio/team.js', """\
// src/api/vendor/studio/team.js
// GET    /api/v2/vendor/studio/team           — list active members
// POST   /api/v2/vendor/studio/team           — add member
// PATCH  /api/v2/vendor/studio/team/:memberId — update
// DELETE /api/v2/vendor/studio/team/:memberId — soft delete
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET — list
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('vendor_id', req.vendor.id)
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { members: data || [] });
}));

// POST — add
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, role, phone, daily_rate_inr, notes } = req.body || {};
  if (!name || !name.trim()) return errRes(res, 400, 'name is required.');
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      vendor_id:      req.vendor.id,
      name:           name.trim(),
      role:           role           || null,
      phone:          phone          || null,
      daily_rate_inr: daily_rate_inr || null,
      notes:          notes          || null,
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { member: data });
}));

// PATCH — update
router.patch('/:memberId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['name', 'role', 'phone', 'daily_rate_inr', 'notes', 'active'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

// DELETE — soft delete
router.delete('/:memberId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 4. tasks.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/studio/tasks.js', """\
// src/api/vendor/studio/tasks.js
// GET    /api/v2/vendor/studio/tasks           — list (filterable)
// POST   /api/v2/vendor/studio/tasks           — create
// PATCH  /api/v2/vendor/studio/tasks/:taskId   — update / state transition
// DELETE /api/v2/vendor/studio/tasks/:taskId   — soft delete
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const VALID_STATES    = ['open', 'in_progress', 'done', 'cancelled'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET — list
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { state, assigned_to, event_id } = req.query;

  let q = supabase
    .from('team_tasks')
    .select('*, team_members(id, name, role)')
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (state && state !== 'all') {
    if (!VALID_STATES.includes(state)) return errRes(res, 400, `Invalid state. Must be one of: ${VALID_STATES.join(', ')}, all.`);
    q = q.eq('state', state);
  } else if (!state) {
    // default: open + in_progress
    q = q.in('state', ['open', 'in_progress']);
  }
  if (assigned_to) q = q.eq('assigned_to_member_id', assigned_to);
  if (event_id)    q = q.eq('linked_event_id', event_id);

  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { tasks: data || [] });
}));

// POST — create
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, description, assigned_to_member_id, linked_event_id,
          due_date, priority } = req.body || {};
  if (!title || !title.trim()) return errRes(res, 400, 'title is required.');
  if (priority && !VALID_PRIORITIES.includes(priority))
    return errRes(res, 400, `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}.`);

  const { data, error } = await supabase
    .from('team_tasks')
    .insert({
      vendor_id:              req.vendor.id,
      title:                  title.trim(),
      description:            description            || null,
      assigned_to_member_id:  assigned_to_member_id  || null,
      linked_event_id:        linked_event_id        || null,
      due_date:               due_date               || null,
      priority:               priority               || 'normal',
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { task: data });
}));

// PATCH — update / state transition
router.patch('/:taskId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const allowed  = ['title', 'description', 'assigned_to_member_id',
                    'linked_event_id', 'due_date', 'priority', 'state'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  if (updates.priority && !VALID_PRIORITIES.includes(updates.priority))
    return errRes(res, 400, `Invalid priority.`);
  if (updates.state) {
    if (!VALID_STATES.includes(updates.state))
      return errRes(res, 400, `Invalid state.`);
    if (updates.state === 'done') updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('team_tasks')
    .update(updates)
    .eq('id', req.params.taskId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Task not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { task: data });
}));

// DELETE — soft delete
router.delete('/:taskId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.taskId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Task not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { task: data });
}));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 5. messages.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/studio/messages.js', """\
// src/api/vendor/studio/messages.js
// GET   /api/v2/vendor/studio/messages          — list (pinned first)
// POST  /api/v2/vendor/studio/messages          — create
// PATCH /api/v2/vendor/studio/messages/:id/pin  — toggle pinned
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET — list, pinned first then newest
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_messages')
    .select('*')
    .eq('vendor_id', req.vendor.id)
    .order('pinned',     { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { messages: data || [] });
}));

// POST — create
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { body, pinned, sent_to_count, linked_event_id } = req.body || {};
  if (!body || !body.trim()) return errRes(res, 400, 'body is required.');
  const { data, error } = await supabase
    .from('team_messages')
    .insert({
      vendor_id:       req.vendor.id,
      body:            body.trim(),
      pinned:          pinned         === true,
      sent_to_count:   sent_to_count  || null,
      linked_event_id: linked_event_id || null,
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { message: data });
}));

// PATCH /:id/pin — toggle pinned
router.patch('/:messageId/pin', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // Fetch current state
  const { data: existing, error: fetchErr } = await supabase
    .from('team_messages')
    .select('id, pinned')
    .eq('id', req.params.messageId)
    .eq('vendor_id', req.vendor.id)
    .single();
  if (fetchErr) {
    if (fetchErr.code === 'PGRST116') return errRes(res, 404, 'Message not found.');
    return errRes(res, 500, fetchErr.message);
  }

  const { data, error } = await supabase
    .from('team_messages')
    .update({ pinned: !existing.pinned })
    .eq('id', req.params.messageId)
    .eq('vendor_id', req.vendor.id)
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { message: data });
}));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 6. payments.js
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/studio/payments.js', """\
// src/api/vendor/studio/payments.js
// GET   /api/v2/vendor/studio/team-payments             — list
// POST  /api/v2/vendor/studio/team-payments             — log obligation
// PATCH /api/v2/vendor/studio/team-payments/:id/mark-paid — settle
// GET   /api/v2/vendor/studio/team-payments/balance     — per-member totals
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');

const VALID_STATES = ['owed', 'paid', 'cancelled'];
const mw = [requireAuth, resolveVendor(), requirePrestige];

// GET /balance — MUST be defined before /:id routes to avoid param clash
router.get('/balance', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_payments')
    .select('team_member_id, amount_inr, state, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .in('state', ['owed', 'paid']);
  if (error) return errRes(res, 500, error.message);

  const map = {};
  for (const row of (data || [])) {
    if (!map[row.team_member_id]) {
      map[row.team_member_id] = {
        team_member_id: row.team_member_id,
        name:           row.team_members?.name || '',
        owed_inr:       0,
        paid_inr:       0,
      };
    }
    if (row.state === 'owed') map[row.team_member_id].owed_inr += row.amount_inr;
    if (row.state === 'paid') map[row.team_member_id].paid_inr += row.amount_inr;
  }
  const balances = Object.values(map);
  const total_owed_inr = balances.reduce((s, b) => s + b.owed_inr, 0);
  return okRes(res, { balances, total_owed_inr });
}));

// GET — list all payments
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { state, member_id } = req.query;
  let q = supabase
    .from('team_payments')
    .select('*, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (state && VALID_STATES.includes(state)) q = q.eq('state', state);
  if (member_id) q = q.eq('team_member_id', member_id);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { payments: data || [] });
}));

// POST — log obligation
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { team_member_id, amount_inr, description,
          linked_event_id, linked_task_id, notes } = req.body || {};
  if (!team_member_id) return errRes(res, 400, 'team_member_id is required.');
  if (!amount_inr || amount_inr <= 0) return errRes(res, 400, 'amount_inr must be a positive integer.');

  const { data, error } = await supabase
    .from('team_payments')
    .insert({
      vendor_id:       req.vendor.id,
      team_member_id,
      amount_inr,
      description:     description     || null,
      linked_event_id: linked_event_id || null,
      linked_task_id:  linked_task_id  || null,
      notes:           notes           || null,
      state:           'owed',
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { payment: data });
}));

// PATCH /:id/mark-paid
router.patch('/:paymentId/mark-paid', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { paid_via, notes } = req.body || {};
  const { data, error } = await supabase
    .from('team_payments')
    .update({
      state:   'paid',
      paid_at: new Date().toISOString(),
      paid_via: paid_via || null,
      notes:    notes    || null,
    })
    .eq('id', req.params.paymentId)
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'owed')
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { payment: data });
}));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 7. Patch core.js — mount studio router
# ─────────────────────────────────────────────────────────────────────────────
patch(
    'src/api/vendor/core.js',
    "router.use('/featured',    require('./featured'));",
    "router.use('/featured',    require('./featured'));\nrouter.use('/studio',      require('./studio/index'));",
    "mount studio router"
)

# ─────────────────────────────────────────────────────────────────────────────
# 8. Studio index router
# ─────────────────────────────────────────────────────────────────────────────
write('src/api/vendor/studio/index.js', """\
// src/api/vendor/studio/index.js
// Studio Suite sub-router. Mounted at /api/v2/vendor/studio in core.js.
// All routes inside each file apply requireAuth + resolveVendor + requirePrestige.
'use strict';

const express = require('express');
const router  = express.Router();

router.use('/briefing',      require('./briefing'));
router.use('/team',          require('./team'));
router.use('/tasks',         require('./tasks'));
router.use('/messages',      require('./messages'));
router.use('/team-payments', require('./payments'));

module.exports = router;
""")

# ─────────────────────────────────────────────────────────────────────────────
# 9. Patch pwaTools.js — add 4 Prestige tools before closing bracket
# ─────────────────────────────────────────────────────────────────────────────
PRESTIGE_TOOLS = """
  // ── Studio Suite — Prestige only ───────────────────────────────────────────
  // These tools only execute when vendor.tier === 'prestige'.
  // Non-Prestige vendors receive a friendly tier error.

  {
    name: 'assign_task',
    description: 'Create a task assigned to a team member. Use when vendor says things like "Tell Rohit to...", "Assign X to Y", or "Create a task for...". If assigned_to_member_name is provided but no unique match is found in the team roster, call clarify to resolve the ambiguity before creating. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {
        title:                  { type: 'string',  description: 'Task title. Short and action-oriented. e.g. "Edit Priya highlight reel"' },
        description:            { type: 'string',  description: 'Optional detail. e.g. "3-minute reel, gold tones, drone shots first 30s"' },
        assigned_to_member_name: { type: 'string', description: 'Team member name as the vendor said it. The executor will fuzzy-match against the roster.' },
        linked_event_id:        { type: 'string',  description: 'UUID of the related event if mentioned.' },
        due_date:               { type: 'string',  description: 'Due date in YYYY-MM-DD.' },
        priority:               { type: 'string',  enum: ['low','normal','high','urgent'], description: 'Task priority. Default: normal.' },
      },
      required: ['title'],
    },
  },

  {
    name: 'team_pay',
    description: 'Log that the vendor paid (or owes) a team member for a job. Use when vendor says "I paid Rohit X" or "Log Rs 5000 for Rohit for Saturday shoot". Marks an existing owed payment as paid, or creates a new paid record if no prior obligation exists. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {
        team_member_name: { type: 'string',  description: 'Name of the team member as the vendor said it.' },
        amount_inr:       { type: 'number',  description: 'Amount in Rs. e.g. 5000' },
        description:      { type: 'string',  description: 'What the payment is for. e.g. "2-day shoot for Priya wedding"' },
        paid_via:         { type: 'string',  description: 'Payment method: cash, upi, bank, or other.' },
      },
      required: ['team_member_name', 'amount_inr'],
    },
  },

  {
    name: 'pin_team_message',
    description: 'Post a pinned broadcast message to the team. Use for important standing info — shoot logistics, venue address, call time — that needs to stay visible at the top of the team feed. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {
        body:            { type: 'string', description: 'The message to pin. Should be concise and action-relevant.' },
        linked_event_id: { type: 'string', description: 'UUID of the related event, if applicable.' },
      },
      required: ['body'],
    },
  },

  {
    name: 'team_briefing',
    description: 'Fetch the full team briefing — today\\'s events with assignments, open/overdue tasks, pinned messages, this week\\'s calendar, and owed team payments. Call whenever the vendor asks about their team, what\\'s on today, or who owes what. Read-only — does not consume quota. Prestige vendors only.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

"""

patch(
    'src/agent/pwaTools.js',
    "\n  {\n    name: 'clarify',",
    PRESTIGE_TOOLS + "\n  {\n    name: 'clarify',",
    "insert 4 Prestige tools before clarify"
)

# ─────────────────────────────────────────────────────────────────────────────
# 10. Patch pwaEngine.js — add 4 tool case handlers before default
# ─────────────────────────────────────────────────────────────────────────────
PRESTIGE_CASES = """
    // ── Studio Suite — Prestige-gated tools ──────────────────────────────────

    case 'assign_task': {
      if (vendor.tier !== 'prestige') {
        return err('Studio Suite is for Prestige vendors only. Contact Swati for an invite.');
      }
      const { title, description, assigned_to_member_name, linked_event_id, due_date, priority } = input;

      let assigned_to_member_id = null;

      // Resolve member name → id if provided
      if (assigned_to_member_name) {
        const { data: members } = await supabase
          .from('team_members')
          .select('id, name')
          .eq('vendor_id', vendor.id)
          .eq('active', true)
          .is('deleted_at', null);

        const norm    = s => s.toLowerCase().trim();
        const matches = (members || []).filter(m => norm(m.name).includes(norm(assigned_to_member_name)));

        if (matches.length === 0) {
          return err(`No team member found matching "${assigned_to_member_name}". Use list_team to check the roster.`);
        }
        if (matches.length > 1) {
          // Surface as clarify — caller should follow up with clarify tool
          return ok(JSON.stringify({
            clarify: {
              question: `Which ${assigned_to_member_name}?`,
              options:  matches.map(m => m.name),
            },
          }));
        }
        assigned_to_member_id = matches[0].id;
      }

      const { data, error: insertErr } = await supabase
        .from('team_tasks')
        .insert({
          vendor_id:              vendor.id,
          title:                  title.trim(),
          description:            description            || null,
          assigned_to_member_id:  assigned_to_member_id  || null,
          linked_event_id:        linked_event_id        || null,
          due_date:               due_date               || null,
          priority:               priority               || 'normal',
        })
        .select()
        .single();
      if (insertErr) return err(insertErr.message);
      console.log(`[pwa-tool:assign_task] created "${title}" → member ${assigned_to_member_id || 'unassigned'}`);
      return write(JSON.stringify({ task: data }));
    }

    case 'team_pay': {
      if (vendor.tier !== 'prestige') {
        return err('Studio Suite is for Prestige vendors only. Contact Swati for an invite.');
      }
      const { team_member_name, amount_inr, description, paid_via } = input;

      // Resolve member
      const { data: members } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('vendor_id', vendor.id)
        .eq('active', true)
        .is('deleted_at', null);

      const norm    = s => s.toLowerCase().trim();
      const matches = (members || []).filter(m => norm(m.name).includes(norm(team_member_name)));
      if (matches.length === 0) return err(`No team member found matching "${team_member_name}".`);
      if (matches.length > 1)  return ok(JSON.stringify({ clarify: { question: `Which ${team_member_name}?`, options: matches.map(m => m.name) } }));
      const memberId = matches[0].id;

      // Check for an existing owed payment — mark it paid if found
      const { data: owed } = await supabase
        .from('team_payments')
        .select('id')
        .eq('vendor_id', vendor.id)
        .eq('team_member_id', memberId)
        .eq('state', 'owed')
        .order('created_at', { ascending: true })
        .limit(1);

      let result;
      if (owed && owed.length > 0) {
        const { data: updated, error: upErr } = await supabase
          .from('team_payments')
          .update({ state: 'paid', paid_at: new Date().toISOString(), paid_via: paid_via || null, notes: description || null })
          .eq('id', owed[0].id)
          .select()
          .single();
        if (upErr) return err(upErr.message);
        result = updated;
      } else {
        // No prior obligation — log as a completed payment
        const { data: inserted, error: insErr } = await supabase
          .from('team_payments')
          .insert({
            vendor_id:      vendor.id,
            team_member_id: memberId,
            amount_inr,
            description:    description || null,
            paid_via:       paid_via    || null,
            state:          'paid',
            paid_at:        new Date().toISOString(),
          })
          .select()
          .single();
        if (insErr) return err(insErr.message);
        result = inserted;
      }

      // Return new balance
      const { data: owedRows } = await supabase
        .from('team_payments')
        .select('amount_inr')
        .eq('vendor_id', vendor.id)
        .eq('team_member_id', memberId)
        .eq('state', 'owed');
      const new_balance = (owedRows || []).reduce((s, r) => s + r.amount_inr, 0);

      console.log(`[pwa-tool:team_pay] Rs ${amount_inr} → ${matches[0].name}. Remaining owed: Rs ${new_balance}`);
      return write(JSON.stringify({ payment: result, new_balance_owed_inr: new_balance }));
    }

    case 'pin_team_message': {
      if (vendor.tier !== 'prestige') {
        return err('Studio Suite is for Prestige vendors only. Contact Swati for an invite.');
      }
      const { body, linked_event_id } = input;
      const { data, error: insErr } = await supabase
        .from('team_messages')
        .insert({
          vendor_id:       vendor.id,
          body:            body.trim(),
          pinned:          true,
          linked_event_id: linked_event_id || null,
        })
        .select()
        .single();
      if (insErr) return err(insErr.message);
      console.log(`[pwa-tool:pin_team_message] pinned: "${body.slice(0, 60)}"`);
      return write(JSON.stringify({ message: data }));
    }

    case 'team_briefing': {
      if (vendor.tier !== 'prestige') {
        return err('Studio Suite is for Prestige vendors only. Contact Swati for an invite.');
      }
      const BASE = process.env.RAILWAY_STATIC_URL || 'http://localhost:3000';
      // Re-use the briefing endpoint logic inline to avoid HTTP self-call
      const today   = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const weekEnd = new Date(Date.now() + 5.5 * 60 * 60 * 1000 + 7 * 86400000).toISOString().slice(0, 10);

      const { data: todayEvents } = await supabase
        .from('events').select('id, title, event_time, state')
        .eq('vendor_id', vendor.id).eq('event_date', today).neq('state', 'cancelled');

      const { data: openTasks } = await supabase
        .from('team_tasks').select('id, title, priority, due_date, state, team_members(name)')
        .eq('vendor_id', vendor.id).in('state', ['open','in_progress']).is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      const { data: pinned } = await supabase
        .from('team_messages').select('id, body, created_at')
        .eq('vendor_id', vendor.id).eq('pinned', true)
        .order('created_at', { ascending: false });

      const { data: weekEvents } = await supabase
        .from('events').select('id, title, event_date, event_time')
        .eq('vendor_id', vendor.id).gte('event_date', today).lte('event_date', weekEnd)
        .neq('state', 'cancelled').order('event_date', { ascending: true });

      const { data: owedRows } = await supabase
        .from('team_payments').select('team_member_id, amount_inr, team_members(name)')
        .eq('vendor_id', vendor.id).eq('state', 'owed');

      const owedMap = {};
      let totalOwed = 0;
      for (const row of (owedRows || [])) {
        totalOwed += row.amount_inr;
        if (!owedMap[row.team_member_id]) owedMap[row.team_member_id] = { name: row.team_members?.name || '', owed_inr: 0 };
        owedMap[row.team_member_id].owed_inr += row.amount_inr;
      }

      const overdue = (openTasks || []).filter(t => t.due_date && t.due_date < today);

      console.log(`[pwa-tool:team_briefing] today=${today} events=${(todayEvents||[]).length} open_tasks=${(openTasks||[]).length}`);
      return ok(JSON.stringify({
        today,
        today_events:         todayEvents  || [],
        open_tasks:           openTasks    || [],
        overdue_tasks:        overdue,
        pinned_messages:      pinned       || [],
        this_week_calendar:   weekEvents   || [],
        team_owed_total_inr:  totalOwed,
        team_owed_per_member: Object.values(owedMap),
      }));
    }

"""

patch(
    'src/agent/pwaEngine.js',
    "    default:\n      return err(`Unknown tool: ${name}`);",
    PRESTIGE_CASES + "    default:\n      return err(`Unknown tool: ${name}`);",
    "insert 4 Prestige tool cases before default"
)

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== All files written and patches applied ===")
print("""
Next steps in dream-os Codespace:
  1. python3 build_block6_backend.py
  2. node --check src/agent/pwaEngine.js
  3. node --check src/api/vendor/studio/briefing.js
  4. node --check src/api/vendor/studio/team.js
  5. node --check src/api/vendor/studio/tasks.js
  6. node --check src/api/vendor/studio/messages.js
  7. node --check src/api/vendor/studio/payments.js
  8. git add -A && git commit -m "feat(studio): Block 6 Studio Suite backend — team/tasks/messages/payments/briefing + 4 Prestige agent tools"
  9. git push origin feature/block-6-studio
""")
