// lib/types/vendor.ts
// TypeScript interfaces mirroring vendor contract request/response shapes.
// Every endpoint in lib/api/vendor.ts has a corresponding interface here.
// Contract drift = TypeScript compile error, not runtime bug.
// No `any`.

import type { LeadState, InvoiceState, EventKind, EventState, ExpenseCategory } from './common';

// ── Common ────────────────────────────────────────────────────────────────
export interface ApiOk { ok: true; }
export interface ApiErr { ok: false; error: string; }

// ── GET /api/v2/vendor/me ─────────────────────────────────────────────────
export interface MeResponse {
  ok: boolean;
  vendor: {
    id: string;
    name: string;
    business_name: string;
    category: string;
    city: string;
    handle: string;
    upi_id: string | null;
    gstin: string | null;
    open_to_travel: boolean;
    tier: 'trial' | 'essential' | 'signature' | 'prestige';
    founding_cohort: boolean;
    aesthetic_tags: string[] | null;
    rate_min: number | null;
    rate_max: number | null;
    discover_preview: boolean;
  };
}

// ── PATCH /api/v2/vendor/me ───────────────────────────────────────────────
export interface UpdateMeRequest {
  business_name?:    string;
  style_notes?:      string;
  city?:             string;
  open_to_travel?:   boolean;
  travel_notes?:     string;
  instagram_handle?: string;
  upi_id?:           string;
  gstin?:            string;
  briefing_enabled?: boolean;
  aesthetic_tags?:   string[];
  rate_min?:         number;
  rate_max?:         number;
}

export interface UpdateMeResponse {
  ok: true;
  vendor: {
    id:               string;
    name:             string | null;
    business_name:    string | null;
    city:             string | null;
    open_to_travel:   boolean;
    upi_id:           string | null;
    gstin:            string | null;
    aesthetic_tags:   string[];
    rate_min:         number | null;
    rate_max:         number | null;
    discover_preview: boolean;
  };
}

// ── PATCH /api/v2/vendor/me/routing-handle ────────────────────────────────
export interface UpdateRoutingHandleRequest {
  routing_handle: string;
}

export interface UpdateRoutingHandleResponse {
  ok: true;
  routing_handle: string;
  wa_link: string;
}

// ── PATCH /api/v2/vendor/me/invoice-prefix ────────────────────────────────
export interface UpdateInvoicePrefixRequest {
  prefix: string;
}

export interface UpdateInvoicePrefixResponse {
  ok: true;
  prefix: string;
  current_counter: number;
}

// ── GET /api/v2/vendor/context/:vendorId ──────────────────────────────────
export interface VendorContextResponse {
  ok: boolean;
  vendor: { name: string; category: string; city: string; handle: string; };
  pending_invoices: Array<{ client_name: string; amount_owed: number; due_date: string | null; overdue: boolean; }>;
  upcoming_events: Array<{ title: string; kind: string; event_date: string; event_time: string | null; }>;
  new_leads: Array<{ name: string | null; wedding_date: string | null; budget_total: number | null; }>;
  recent_notes: Array<{ content: string; }>;
}

// ── GET /api/v2/vendor/today/:vendorId ────────────────────────────────────
export interface TodayResponse {
  ok: boolean;
  vendor: { name: string; category: string; city: string; };
  needs_attention: {
    overdue_invoices: Array<{ id: string; client_name: string; amount_owed: number; due_date: string; }>;
    new_leads: Array<{ id: string; name: string; wedding_date: string | null; budget_total: number | null; created_at: string; }>;
    events_today: Array<{ id: string; title: string; kind: string; event_time: string | null; }>;
  };
  this_week: Array<{ id: string; title: string; kind: string; event_date: string; event_time: string | null; }>;
  money_snapshot: { total_outstanding: number; unpaid_count: number; advance_paid_count: number; };
  open_leads_count: number;
}

// ── GET /api/v2/vendor/leads/:vendorId ────────────────────────────────────
export interface LeadsResponse {
  ok: boolean;
  leads: Array<{
    id: string; name: string | null; wedding_date: string | null;
    wedding_city: string | null; budget_total: number | null;
    state: string; source: string | null; referrer: string | null;
    raw_message: string | null; created_at: string;
  }>;
  total: number;
}

export interface LeadStateResponse {
  ok: boolean;
  lead: { id: string; state: string; };
}

// ── POST /api/v2/vendor/leads ─────────────────────────────────────────────
export interface CreateLeadRequest {
  name:          string;
  phone?:        string;
  email?:        string;
  wedding_date?: string;
  wedding_city?: string;
  event_types?:  string[];
  budget_min?:   number;
  budget_max?:   number;
  source?:       string;
  referrer_name?: string;
  raw_message?:  string;
  notes?:        string;
}

export interface CreateLeadResponse {
  ok: true;
  data: Lead;
  deduped: boolean;
}

// ── PATCH /api/v2/vendor/leads/:leadId ───────────────────────────────────
// Block 1a — endpoint exists in spec; will be live after dream-os deploys.
export interface UpdateLeadRequest {
  name?:         string;
  phone?:        string;
  email?:        string;
  wedding_date?: string;
  wedding_city?: string;
  budget_min?:   number;
  budget_max?:   number;
  source?:       string;
  referrer_name?: string;
  raw_message?:  string;
  notes?:        string;
}

export interface UpdateLeadResponse {
  ok: true;
  lead: Lead;
}

// ── GET /api/v2/vendor/leads/:leadId/detail ──────────────────────────────
export interface LeadDetailResponse {
  ok: true;
  lead: Lead;
}

// ── GET /api/v2/vendor/clients/:vendorId ──────────────────────────────────
export interface ClientsResponse {
  ok: boolean;
  clients: Array<{ id: string; name: string; phone: string | null; email: string | null; notes: string | null; created_at: string; }>;
  total: number;
}

export interface ClientDetailResponse {
  ok: boolean;
  client: { id: string; name: string; phone: string | null; email: string | null; notes: string | null; };
  leads: Array<{ id: string; wedding_date: string | null; state: string; budget_total: number | null; }>;
  invoices: Array<{ id: string; amount_total: number; amount_paid: number; state: string; due_date: string | null; }>;
}

// ── POST /api/v2/vendor/clients ───────────────────────────────────────────
export interface CreateClientRequest {
  name:   string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateClientResponse {
  ok: true;
  client:   Client;
  deduped:  boolean;
  restored: boolean;
}

// ── PATCH /api/v2/vendor/clients/:clientId ────────────────────────────────
export interface UpdateClientRequest {
  name?:  string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateClientResponse {
  ok: true;
  client: Client;
}

// ── GET /api/v2/vendor/invoices/:vendorId ─────────────────────────────────
export interface InvoicesResponse {
  ok: boolean;
  invoices: Array<{
    id: string; invoice_number: string; client_name: string;
    amount_total: number; amount_paid: number; amount_owed: number;
    state: string; due_date: string | null; created_at: string;
  }>;
  summary: { total_outstanding: number; total_collected: number; };
  total: number;
}

// ── POST /api/v2/vendor/invoices ─────────────────────────────────────────
export interface CreateInvoiceRequest {
  client_name?:    string;
  client_phone?:   string;
  client_id?:      string;
  lead_id?:        string;
  description?:    string;
  amount_total:    number;
  amount_advance?: number;
  due_date?:       string;
  notes?:          string;
}

export interface CreateInvoiceResponse {
  ok: true;
  invoice:     Invoice;
  pdf_pending: true;
}

// ── PATCH /api/v2/vendor/invoices/:invoiceId ──────────────────────────────
export interface UpdateInvoiceRequest {
  client_name?:    string;
  client_phone?:   string;
  description?:    string;
  amount_total?:   number;
  amount_advance?: number;
  due_date?:       string;
  notes?:          string;
}

export interface UpdateInvoiceResponse {
  ok: true;
  invoice: Invoice;
}

// ── POST /api/v2/vendor/invoices/:invoiceId/payments ──────────────────────
export interface RecordPaymentRequest {
  amount: number;
  note?:  string;
}

export interface RecordPaymentResponse {
  ok: true;
  invoice:          Invoice | null;
  payment_recorded: number;
  new_state:        InvoiceState;
}

// ── GET /api/v2/vendor/invoices/:invoiceId/pdf ────────────────────────────
export interface InvoicePdfResponse {
  ok: true;
  pdf_url:    string;
  expires_in: number;
}

// ── GET /api/v2/vendor/expenses/:vendorId ─────────────────────────────────
export interface ExpensesResponse {
  ok: boolean;
  expenses: Array<{
    id: string; description: string | null; amount: number;
    category: string | null; expense_date: string | null;
    client_name: string | null; created_at: string;
  }>;
  total_spent: number;
  total: number;
}

// ── POST /api/v2/vendor/expenses ─────────────────────────────────────────
export interface CreateExpenseRequest {
  amount:          number;
  category?:       ExpenseCategory;
  description?:    string;
  expense_date?:   string;
  client_name?:    string;
  linked_lead_id?: string;
  notes?:          string;
}

export interface CreateExpenseResponse {
  ok: true;
  expense: Expense;
}

// ── PATCH /api/v2/vendor/expenses/:expenseId ──────────────────────────────
export interface UpdateExpenseRequest {
  amount?:       number;
  category?:     ExpenseCategory;
  description?:  string;
  expense_date?: string;
  client_name?:  string;
  notes?:        string;
}

export interface UpdateExpenseResponse {
  ok: true;
  expense: Expense;
}

// ── GET /api/v2/vendor/events/:vendorId ───────────────────────────────────
export interface EventsResponse {
  ok: boolean;
  events: Array<{
    id: string; title: string; kind: string; event_date: string;
    event_time: string | null; state: string; lead_id: string | null; notes: string | null;
  }>;
  total: number;
}

// ── POST /api/v2/vendor/events ───────────────────────────────────────────
export interface CreateEventRequest {
  title:           string;
  event_date:      string;
  event_time?:     string;
  kind?:           EventKind;
  linked_lead_id?: string;
  notes?:          string;
}

export interface CreateEventResponse {
  ok: true;
  event: VendorEvent;
}

// ── PATCH /api/v2/vendor/events/:eventId ──────────────────────────────────
export interface UpdateEventRequest {
  title?:          string;
  event_date?:     string;
  event_time?:     string;
  kind?:           EventKind;
  linked_lead_id?: string;
  notes?:          string;
}

export interface UpdateEventResponse {
  ok: true;
  event: VendorEvent;
}

// ── GET /api/v2/vendor/availability/:vendorId ─────────────────────────────
export interface AvailabilityBlock {
  id:           string;
  blocked_date: string;
  reason:       string | null;
  created_at:   string;
}

export interface AvailabilityResponse {
  ok: true;
  blocks: AvailabilityBlock[];
  total:  number;
}

// ── POST /api/v2/vendor/availability ─────────────────────────────────────
export interface BlockDateRequest {
  blocked_date: string;
  reason?:      string;
}

export interface BlockDateResponse {
  ok: true;
  block: AvailabilityBlock;
}

// ── GET /api/v2/hot-dates ─────────────────────────────────────────────────
export interface HotDate {
  date:   string;
  note:   string | null;
  region: string | null;
}

export interface HotDatesResponse {
  ok: true;
  dates: HotDate[];
  total: number;
}

// ── Session type ─────────────────────────────────────────────────────────
export interface VendorSession {
  id:            string;
  user_id:       string;
  name:          string | null;
  phone:         string | null;
  tier:          string;
  access_token:  string;
  refresh_token: string;
}

// ── Context sub-types (used by briefing.ts) ───────────────────────────────
export interface PendingInvoice {
  client_name: string;
  amount_owed: number;
  due_date:    string | null;
  overdue:     boolean;
}

export interface UpcomingEvent {
  title:      string;
  kind:       string;
  event_date: string;
  event_time: string | null;
}

// ── Row types (used by hooks/useVendorData, calendar, list pages) ─────────
export interface Client {
  id:         string;
  name:       string;
  phone:      string | null;
  email:      string | null;
  notes:      string | null;
  created_at: string;
}

export interface Lead {
  id:           string;
  name:         string | null;
  wedding_date: string | null;
  wedding_city: string | null;
  budget_total: number | null;
  state:        string;
  source:       string | null;
  referrer:     string | null;
  raw_message:  string | null;
  created_at:   string;
}

export interface Invoice {
  id:             string;
  invoice_number: string;
  client_name:    string;
  amount_total:   number;
  amount_paid:    number;
  amount_owed:    number;
  state:          string;
  due_date:       string | null;
  created_at:     string;
}

export interface Expense {
  id:           string;
  description:  string | null;
  amount:       number;
  category:     string | null;
  expense_date: string | null;
  client_name:  string | null;
  created_at:   string;
}

export interface VendorEvent {
  id:         string;
  title:      string;
  kind:       string;
  event_date: string;
  event_time: string | null;
  state:      string;
  lead_id:    string | null;
  notes:      string | null;
}

// ── POST /api/v2/vendor/chat ──────────────────────────────────────────────
export interface ContactCard {
  name:   string;
  phone:  string;
  draft?: string;
  link?:  string;
}

export interface ClarifyPayload {
  question: string;
  options:  string[];
}

export interface ChatResponse {
  ok:       boolean;
  reply:    string;
  tool_calls: string[];
  contact?:  ContactCard;
  clarify?:  ClarifyPayload;
  refresh?:  boolean;
  error?:    string;
}

// ── Auth endpoints ────────────────────────────────────────────────────────
export interface SendOtpResponse    { ok: boolean; error?: string; }
export interface VerifyOtpResponse  { ok: boolean; access_token?: string; refresh_token?: string; vendor_id?: string; user_id?: string; pin_set?: boolean; error?: string; }
export interface PinStatusResponse  { ok: boolean; has_pin: boolean; }
export interface PinLoginResponse   { ok: boolean; access_token?: string; vendor_id?: string; name?: string; error?: string; }
