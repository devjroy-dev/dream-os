import os

# ── 1. Add tool definitions to pwaTools.js ───────────────────────────────────

with open('src/agent/pwaTools.js', 'r') as f:
    tools = f.read()

new_tool_defs = """
  // ── Block 1a tools ──────────────────────────────────────────────────────────

  {
    name: 'update_lead',
    description: 'Update editable fields on an existing lead. Use when vendor corrects a lead detail — name, date, budget, city, notes. Do NOT use for state changes; use update_lead_state for that.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id:      { type: 'string', description: 'UUID of the lead to update.' },
        name:         { type: 'string', description: 'Updated couple name.' },
        phone:        { type: 'string', description: 'Updated phone number.' },
        email:        { type: 'string', description: 'Updated email.' },
        wedding_date: { type: 'string', description: 'Updated wedding date in YYYY-MM-DD.' },
        wedding_city: { type: 'string', description: 'Updated wedding city.' },
        budget_min:   { type: 'number', description: 'Updated minimum budget in Rs.' },
        budget_max:   { type: 'number', description: 'Updated maximum budget in Rs.' },
        notes:        { type: 'string', description: 'Updated notes.' },
      },
      required: ['lead_id'],
    },
  },

  {
    name: 'lose_lead',
    description: 'Mark a lead as lost when the vendor signals rejection — "they went with someone else", "no response", "out of budget". Writes an audit note. Use instead of update_lead_state when a reason is available.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'UUID of the lead to mark lost.' },
        reason:  { type: 'string', description: 'Why the lead was lost. e.g. "Went with another vendor" or "Budget mismatch"' },
      },
      required: ['lead_id', 'reason'],
    },
  },

  {
    name: 'update_client',
    description: 'Update editable fields on an existing client — name, phone, email, notes.',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'UUID of the client to update.' },
        name:      { type: 'string', description: 'Updated name.' },
        phone:     { type: 'string', description: 'Updated phone number.' },
        email:     { type: 'string', description: 'Updated email.' },
        notes:     { type: 'string', description: 'Updated notes.' },
      },
      required: ['client_id'],
    },
  },

  {
    name: 'delete_client',
    description: 'Soft-delete a client. Use when vendor says "remove", "delete", or "archive" a client. The client is hidden from lists but linked invoices and leads are preserved.',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'UUID of the client to delete.' },
      },
      required: ['client_id'],
    },
  },

  {
    name: 'update_invoice',
    description: 'Update editable fields on an invoice. Only works when no payment has been recorded yet — locked after any payment. If locked, suggest cancel and re-issue.',
    input_schema: {
      type: 'object',
      properties: {
        invoice_id:     { type: 'string', description: 'UUID of the invoice to update.' },
        client_name:    { type: 'string', description: 'Updated client name.' },
        client_phone:   { type: 'string', description: 'Updated client phone.' },
        description:    { type: 'string', description: 'Updated description of services.' },
        amount_total:   { type: 'number', description: 'Updated total amount in Rs.' },
        amount_advance: { type: 'number', description: 'Updated advance amount in Rs.' },
        due_date:       { type: 'string', description: 'Updated due date in YYYY-MM-DD.' },
        notes:          { type: 'string', description: 'Updated notes.' },
      },
      required: ['invoice_id'],
    },
  },

  {
    name: 'update_expense',
    description: 'Update an existing expense record — amount, category, description, date.',
    input_schema: {
      type: 'object',
      properties: {
        expense_id:   { type: 'string', description: 'UUID of the expense to update.' },
        amount:       { type: 'number', description: 'Updated amount in Rs.' },
        category:     { type: 'string', enum: ['travel','equipment','editing','assistant','studio','printing','packaging','food','accommodation','marketing','software','other'], description: 'Updated category.' },
        description:  { type: 'string', description: 'Updated description.' },
        expense_date: { type: 'string', description: 'Updated date in YYYY-MM-DD.' },
        client_name:  { type: 'string', description: 'Updated client name this expense is for.' },
        notes:        { type: 'string', description: 'Updated notes.' },
      },
      required: ['expense_id'],
    },
  },

  {
    name: 'update_event',
    description: 'Update an existing event — title, date, time, kind, notes. Does not change state; use update_event_state for that.',
    input_schema: {
      type: 'object',
      properties: {
        event_id:   { type: 'string', description: 'UUID of the event to update.' },
        title:      { type: 'string', description: 'Updated event title.' },
        event_date: { type: 'string', description: 'Updated date in YYYY-MM-DD.' },
        event_time: { type: 'string', description: 'Updated time in HH:MM (24-hour).' },
        kind:       { type: 'string', enum: ['shoot','call','meeting','task','reminder','recce','fitting','trial','family','ceremony','social','other'], description: 'Updated event kind.' },
        notes:      { type: 'string', description: 'Updated notes.' },
      },
      required: ['event_id'],
    },
  },

  {
    name: 'delete_event',
    description: 'Soft-delete an event created in error. Distinct from cancelling — use update_event_state with cancelled for events that were planned but did not happen.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'UUID of the event to delete.' },
      },
      required: ['event_id'],
    },
  },

  {
    name: 'block_date',
    description: 'Mark a date as unavailable on the vendor calendar. Use when vendor says they are unavailable, out of town, or already booked on a specific date.',
    input_schema: {
      type: 'object',
      properties: {
        date:   { type: 'string', description: 'Date to block in YYYY-MM-DD format.' },
        reason: { type: 'string', description: 'Optional reason. e.g. "Family wedding", "Out of town"' },
      },
      required: ['date'],
    },
  },

  {
    name: 'unblock_date',
    description: 'Remove a blocked date from the vendor calendar.',
    input_schema: {
      type: 'object',
      properties: {
        block_id: { type: 'string', description: 'UUID of the block to remove. Get from list_availability.' },
        date:     { type: 'string', description: 'Date in YYYY-MM-DD. Alternative to block_id.' },
      },
    },
  },

  {
    name: 'list_availability',
    description: 'List the vendor calendar blocked dates. Use when vendor asks what dates they have blocked or wants to check their availability.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date filter in YYYY-MM-DD. Optional.' },
        to:   { type: 'string', description: 'End date filter in YYYY-MM-DD. Optional.' },
      },
    },
  },

"""

# Insert before the closing ]; of the PWA_TOOLS array
tools = tools.replace(
    "  {\n    name: 'clarify',",
    new_tool_defs + "  {\n    name: 'clarify',"
)

with open('src/agent/pwaTools.js', 'w') as f:
    f.write(tools)

print('Patched: src/agent/pwaTools.js')

# ── 2. Add executor cases to pwaEngine.js ────────────────────────────────────

with open('src/agent/pwaEngine.js', 'r') as f:
    engine = f.read()

# Add requires near top - after existing lib requires
old_req = "const { buildInvoiceMessage } = require('../lib/invoiceMessage');"
new_req = (
    "const { buildInvoiceMessage } = require('../lib/invoiceMessage');\n"
    "const { updateLead, loseLead }               = require('../lib/vendor/leads');\n"
    "const { updateClient, deleteClient }         = require('../lib/vendor/clients');\n"
    "const { updateInvoice }                      = require('../lib/vendor/invoices');\n"
    "const { updateExpense, deleteExpense }        = require('../lib/vendor/expenses');\n"
    "const { updateEvent, deleteEvent }            = require('../lib/vendor/events');\n"
    "const { blockDate, unblockDate, listBlocks }  = require('../lib/vendor/availability');"
)
engine = engine.replace(old_req, new_req, 1)

new_cases = """
    // ── update_lead ─────────────────────────────────────────────────────
    case 'update_lead': {
      const result = await updateLead(supabase, vendor.id, input.lead_id, input);
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:update_lead] ' + input.lead_id);
      return write('Lead updated. ' + (result.lead.name || 'Lead') + ' — ' + input.lead_id + '.');
    }

    // ── lose_lead ────────────────────────────────────────────────────────
    case 'lose_lead': {
      const result = await loseLead(supabase, vendor.id, input.lead_id, input.reason);
      if (!result.ok) return err(result.error);
      if (result.already_lost) return ok((result.lead.name || 'Lead') + ' was already marked lost.');
      console.log('[pwa-tool:lose_lead] ' + input.lead_id);
      return write((result.lead.name || 'Lead') + ' marked lost. Reason noted.');
    }

    // ── update_client ────────────────────────────────────────────────────
    case 'update_client': {
      const result = await updateClient(supabase, vendor.id, input.client_id, input);
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:update_client] ' + input.client_id);
      return write('Client updated. ' + (result.client.name || 'Client') + '.');
    }

    // ── delete_client ────────────────────────────────────────────────────
    case 'delete_client': {
      const result = await deleteClient(supabase, vendor.id, input.client_id);
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:delete_client] ' + input.client_id);
      return write('Client removed from your roster.');
    }

    // ── update_invoice ───────────────────────────────────────────────────
    case 'update_invoice': {
      const result = await updateInvoice(supabase, vendor.id, input.invoice_id, input);
      if (!result.ok && result.code === 'INVOICE_LOCKED') {
        return err('That invoice has payments recorded and cannot be edited. Cancel it and raise a new one.');
      }
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:update_invoice] ' + input.invoice_id);
      return write('Invoice updated — ' + (result.invoice.invoice_number || input.invoice_id) + '.');
    }

    // ── update_expense ───────────────────────────────────────────────────
    case 'update_expense': {
      const result = await updateExpense(supabase, vendor.id, input.expense_id, input);
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:update_expense] ' + input.expense_id);
      return write('Expense updated — Rs ' + formatRs(result.expense.amount) + ', ' + result.expense.category + '.');
    }

    // ── update_event ─────────────────────────────────────────────────────
    case 'update_event': {
      const result = await updateEvent(supabase, vendor.id, input.event_id, input);
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:update_event] ' + input.event_id);
      return write('Event updated — ' + (result.event.title || input.event_id) + ' on ' + result.event.event_date + '.');
    }

    // ── delete_event ─────────────────────────────────────────────────────
    case 'delete_event': {
      const result = await deleteEvent(supabase, vendor.id, input.event_id);
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:delete_event] ' + input.event_id);
      return write('Event removed from your calendar.');
    }

    // ── block_date ───────────────────────────────────────────────────────
    case 'block_date': {
      const result = await blockDate(supabase, vendor.id, input.date, input.reason || null);
      if (!result.ok && result.code === 'ALREADY_BLOCKED') return ok(input.date + ' is already marked unavailable.');
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:block_date] ' + input.date);
      const reasonStr = input.reason ? ' — ' + input.reason : '';
      return write(input.date + ' blocked' + reasonStr + '.');
    }

    // ── unblock_date ─────────────────────────────────────────────────────
    case 'unblock_date': {
      const result = await unblockDate(supabase, vendor.id, { block_id: input.block_id, date: input.date });
      if (!result.ok) return err(result.error);
      console.log('[pwa-tool:unblock_date] ' + (input.block_id || input.date));
      return write((input.date || input.block_id) + ' is now available again.');
    }

    // ── list_availability ────────────────────────────────────────────────
    case 'list_availability': {
      const result = await listBlocks(supabase, vendor.id, { from: input.from, to: input.to });
      if (!result.ok) return err(result.error);
      if (!result.blocks || result.blocks.length === 0) return ok('No dates blocked.');
      const lines = result.blocks.map(b => {
        const r = b.reason ? ' — ' + b.reason : '';
        return b.blocked_date + r + ' (ID: ' + b.id + ')';
      }).join('\\n');
      return ok(result.blocks.length + ' blocked date(s):\\n' + lines);
    }

"""

engine = engine.replace(
    "    case 'clarify': {",
    new_cases + "    case 'clarify': {"
)

with open('src/agent/pwaEngine.js', 'w') as f:
    f.write(engine)

print('Patched: src/agent/pwaEngine.js')
