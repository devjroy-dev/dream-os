// src/lib/vendor/proactiveSuggestions.js
//
// 3.0-C2 — proactive suggestion cards.
//
// After an action COMPLETES, we offer the natural next step as tappable cards.
// These are NOT blocking questions (that's clarify) — they're optional next
// steps the vendor can tap or ignore. The action already happened.
//
// THE PHONE GATE (core rule):
//   A contact action (WhatsApp, follow-up, send invoice) is impossible without
//   a phone number. So:
//     • person HAS phone   → offer the contact-action cards the number unlocks
//     • person has NO phone → suppress those cards, and instead proactively
//       ask for the number WITH THE REASON ("I'll need it to follow up / send
//       messages / share invoices"). The number is the key that unlocks
//       everything downstream — a contactless lead is a dead-end.
//
// Returns { intro, suggestions } or null. `intro` is an optional one-line
// prose nudge (e.g. the reason we want a number). `suggestions` is an array of
// { label, value } cards rendered under the completed action.

// Build suggestions based on what just happened.
//   ctx = {
//     toolName,        // the mutating tool that just succeeded
//     input,           // the tool's input
//     result,          // the tool's result string
//     personName,      // resolved person name if known
//     personPhone,     // resolved person phone if known (null = no phone)
//     personLeadId,    // lead id if this concerns a lead
//     invoiceId,       // invoice id if one was just created
//   }
function buildProactiveSuggestions(ctx) {
  if (!ctx || !ctx.toolName) return null;

  const name      = ctx.personName ? ctx.personName : 'them';
  const hasPhone  = !!(ctx.personPhone && String(ctx.personPhone).trim());
  const out       = { intro: null, suggestions: [] };

  switch (ctx.toolName) {
    // ── Invoice just created ──────────────────────────────────────────
    case 'create_invoice': {
      if (hasPhone && ctx.invoiceId) {
        out.suggestions.push({
          label: `Send to ${name} on WhatsApp`,
          value: `suggest:send_invoice_wa:${ctx.invoiceId}`,
        });
      } else if (!hasPhone) {
        // No phone → can't send. Ask for it, with the reason.
        out.intro = `I can raise the invoice, but I'll need ${name}'s number to actually send it to them or follow up. Want to add it?`;
        out.suggestions.push({ label: `Add ${name}'s phone number`, value: `suggest:add_phone:${ctx.personLeadId || ''}` });
      }
      out.suggestions.push({ label: `Record an advance`, value: `suggest:record_advance:${ctx.invoiceId || ''}` });
      break;
    }

    // ── Lead just marked booked ───────────────────────────────────────
    case 'update_lead_state': {
      const becameBooked = ctx.input && (ctx.input.new_state === 'booked');
      if (becameBooked) {
        out.suggestions.push({ label: `Create an invoice for ${name}`, value: `suggest:create_invoice:${ctx.personLeadId || ''}` });
      }
      break;
    }

    // ── Advance recorded → booking confirmation PDF ───────────────────
    case 'record_payment': {
      const isAdvance = ctx.input && (ctx.input.payment_type === 'advance');
      if (isAdvance) {
        if (hasPhone) {
          out.suggestions.push({ label: `Send booking confirmation to ${name}`, value: `suggest:send_confirmation:${ctx.invoiceId || ''}` });
        } else {
          out.intro = `Booking confirmed. To send ${name} the confirmation, I'll need their number.`;
          out.suggestions.push({ label: `Add ${name}'s phone number`, value: `suggest:add_phone:${ctx.personLeadId || ''}` });
        }
      }
      break;
    }

    // ── Lead or client just created ───────────────────────────────────
    case 'create_lead':
    case 'add_client': {
      if (!hasPhone) {
        out.intro = `Saved. One thing — I'll need ${name}'s number to follow up, send messages, or share invoices. Without it I can't reach them for you.`;
        out.suggestions.push({ label: `Add ${name}'s phone number`, value: `suggest:add_phone:${ctx.personLeadId || ''}` });
      }
      break;
    }

    default:
      return null;
  }

  if (out.suggestions.length === 0 && !out.intro) return null;
  return out;
}

module.exports = { buildProactiveSuggestions };
