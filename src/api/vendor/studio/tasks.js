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
