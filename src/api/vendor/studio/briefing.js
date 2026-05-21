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
