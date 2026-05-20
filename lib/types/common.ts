// lib/types/common.ts
// Shared enum union types — single source of truth for state/kind values.
// Mirrors the Supabase schema (BLOCK 13, DEVS_HOLY_GRAIL.md).

export type LeadState = 'new' | 'contacted' | 'quoted' | 'booked' | 'lost';

export type InvoiceState = 'unpaid' | 'advance_paid' | 'paid' | 'cancelled';

export type EventKind =
  | 'shoot'
  | 'call'
  | 'meeting'
  | 'task'
  | 'reminder'
  | 'recce'
  | 'fitting'
  | 'trial'
  | 'family'
  | 'ceremony'
  | 'social'
  | 'other';

export type EventState = 'upcoming' | 'done' | 'cancelled';

// Matches the backend category values used by createExpense / updateExpense.
export type ExpenseCategory =
  | 'travel'
  | 'equipment'
  | 'assistant'
  | 'studio'
  | 'marketing'
  | 'software'
  | 'supplies'
  | 'printing'
  | 'commission'
  | 'food'
  | 'other';
